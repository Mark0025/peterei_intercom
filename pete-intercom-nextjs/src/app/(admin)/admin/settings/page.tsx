'use client';

/**
 * Admin Settings Page
 *
 * Configure what data fields we fetch from Intercom and where they're used in the app.
 * Fully functional settings that persist changes to configuration.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getIntercomFieldsConfig, updateFieldEnabledStatus } from '@/actions/settings';
import { type IntercomFieldConfig } from '@/config/intercom-fields';

export default function AdminSettingsPage() {
  const [contactFields, setContactFields] = useState<IntercomFieldConfig[]>([]);
  const [companyFields, setCompanyFields] = useState<IntercomFieldConfig[]>([]);
  const [originalContactFields, setOriginalContactFields] = useState<IntercomFieldConfig[]>([]);
  const [originalCompanyFields, setOriginalCompanyFields] = useState<IntercomFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [changeLog, setChangeLog] = useState<string[]>([]);

  // Load configuration on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const result = await getIntercomFieldsConfig();

        if (result.success && result.config) {
          setContactFields(result.config.contacts);
          setCompanyFields(result.config.companies);
          setOriginalContactFields(result.config.contacts);
          setOriginalCompanyFields(result.config.companies);
        } else {
          setError(result.error || 'Failed to load configuration');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  // Track changes to fields
  useEffect(() => {
    const changes: string[] = [];

    // Check contact field changes
    contactFields.forEach((field, index) => {
      const original = originalContactFields[index];
      if (original && field.enabled !== original.enabled) {
        changes.push(`Contact: ${field.name} → ${field.enabled ? 'ENABLED' : 'DISABLED'}`);
      }
    });

    // Check company field changes
    companyFields.forEach((field, index) => {
      const original = originalCompanyFields[index];
      if (original && field.enabled !== original.enabled) {
        changes.push(`Company: ${field.name} → ${field.enabled ? 'ENABLED' : 'DISABLED'}`);
      }
    });

    setChangeLog(changes);
  }, [contactFields, companyFields, originalContactFields, originalCompanyFields]);

  const toggleField = (fieldName: string, category: 'contacts' | 'companies') => {
    if (category === 'contacts') {
      setContactFields(prev => prev.map(f =>
        f.name === fieldName
          ? { ...f, enabled: !f.enabled }
          : f
      ));
    } else {
      setCompanyFields(prev => prev.map(f =>
        f.name === fieldName
          ? { ...f, enabled: !f.enabled }
          : f
      ));
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Find all changed fields
      const changedContacts = contactFields.filter((field, index) => {
        const original = originalContactFields[index];
        return original && field.enabled !== original.enabled;
      });

      const changedCompanies = companyFields.filter((field, index) => {
        const original = originalCompanyFields[index];
        return original && field.enabled !== original.enabled;
      });

      // Save all changes
      for (const field of changedContacts) {
        const result = await updateFieldEnabledStatus(field.name, 'contacts', field.enabled);
        if (!result.success) {
          throw new Error(`Failed to update ${field.name}: ${result.error}`);
        }
      }

      for (const field of changedCompanies) {
        const result = await updateFieldEnabledStatus(field.name, 'companies', field.enabled);
        if (!result.success) {
          throw new Error(`Failed to update ${field.name}: ${result.error}`);
        }
      }

      // Update original state after successful save
      setOriginalContactFields(contactFields);
      setOriginalCompanyFields(companyFields);
      setChangeLog([]);

      setSuccessMessage(`Successfully saved ${changedContacts.length + changedCompanies.length} changes`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = changeLog.length > 0;

  const renderFieldCard = (field: IntercomFieldConfig, category: 'contacts' | 'companies') => {
    return (
      <Card key={field.name} className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{field.name}</code>
                <Badge variant="outline">{field.type}</Badge>
                {field.enabled && (
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{field.description}</p>

              {field.example && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-1">Example:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded block">{field.example}</code>
                </div>
              )}

              {field.usedIn.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2">Used in:</p>
                  <div className="flex flex-wrap gap-2">
                    {field.usedIn.map(location => (
                      <Badge key={location} variant="secondary" className="text-xs">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {field.usedIn.length === 0 && !field.enabled && (
                <p className="text-xs text-orange-600">⚠️ Not currently used anywhere</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={field.enabled}
                onCheckedChange={() => toggleField(field.name, category)}
                id={`${category}-${field.name}`}
                disabled={saving}
              />
              <Label htmlFor={`${category}-${field.name}`} className="text-sm">
                {field.enabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const activeContactFields = contactFields.filter(f => f.enabled).length;
  const activeCompanyFields = companyFields.filter(f => f.enabled).length;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3 pb-4">
          <h1 className="text-4xl font-bold tracking-tight">Intercom Data Settings</h1>
          <p className="text-lg text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Intercom Data Settings</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Configure which fields we fetch from Intercom and see where they&apos;re used
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">✅ {successMessage}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Fields</CardTitle>
            <CardDescription>
              {activeContactFields} of {contactFields.length} fields active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active</span>
                <span className="font-bold text-green-600">{activeContactFields}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available</span>
                <span className="font-bold">{contactFields.length - activeContactFields}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Fields</CardTitle>
            <CardDescription>
              {activeCompanyFields} of {companyFields.length} fields active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active</span>
                <span className="font-bold text-green-600">{activeCompanyFields}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available</span>
                <span className="font-bold">{companyFields.length - activeCompanyFields}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Fields */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📧 Contact Fields</h2>
        <p className="text-muted-foreground mb-6">
          Fields available from Intercom&apos;s Contact API
        </p>
        {contactFields.map(field => renderFieldCard(field, 'contacts'))}
      </div>

      {/* Company Fields */}
      <div>
        <h2 className="text-2xl font-bold mb-4">🏢 Company Fields</h2>
        <p className="text-muted-foreground mb-6">
          Fields available from Intercom&apos;s Company API (not currently implemented)
        </p>
        {companyFields.map(field => renderFieldCard(field, 'companies'))}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold mb-2">💡 How This Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Active fields</strong> are currently fetched from Intercom API</li>
            <li>• <strong>&quot;Used in&quot;</strong> shows which pages/features use this data</li>
            <li>• Disabling unused fields reduces API payload size and improves performance</li>
            <li>• <strong>Toggle fields then click &quot;Save Changes&quot;</strong> to apply updates</li>
            <li>• Changes take effect on next data fetch from Intercom</li>
          </ul>
        </CardContent>
      </Card>

      {/* Change Log and Save Button */}
      {hasChanges && (
        <Card className="bg-yellow-50 border-yellow-300">
          <CardHeader>
            <CardTitle className="text-lg">Pending Changes</CardTitle>
            <CardDescription>
              {changeLog.length} field{changeLog.length > 1 ? 's' : ''} will be updated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded border border-yellow-200 max-h-60 overflow-y-auto">
              <p className="text-xs font-bold text-muted-foreground mb-2">Changes to be saved:</p>
              {changeLog.map((change, index) => (
                <div key={index} className="text-sm font-mono py-1 border-b last:border-b-0">
                  {change}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : `Save ${changeLog.length} Change${changeLog.length > 1 ? 's' : ''}`}
              </button>

              <button
                onClick={() => {
                  setContactFields(originalContactFields);
                  setCompanyFields(originalCompanyFields);
                  setChangeLog([]);
                }}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Changes
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasChanges && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No pending changes. Toggle fields above to make changes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}