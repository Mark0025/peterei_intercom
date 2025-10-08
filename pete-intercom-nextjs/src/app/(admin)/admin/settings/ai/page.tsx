'use client';

/**
 * AI Settings Page
 *
 * Configure AI conversation history, logging, and cleanup settings.
 * Full CRUD interface for managing AI agent behavior.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getAISettings,
  updateAISetting,
  resetAISettings,
  getConversationHistoryStats,
  clearAllConversationHistory,
} from '@/actions/ai-settings';
import type { AISettingConfig, AISettings } from '@/config/ai-settings';

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [config, setConfig] = useState<AISettingConfig[]>([]);
  const [originalSettings, setOriginalSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load settings on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [settingsResult, statsResult] = await Promise.all([
          getAISettings(),
          getConversationHistoryStats(),
        ]);

        if (settingsResult.success && settingsResult.settings && settingsResult.config) {
          setSettings(settingsResult.settings);
          setOriginalSettings(settingsResult.settings);
          setConfig(settingsResult.config);
        } else {
          setError(settingsResult.error || 'Failed to load settings');
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Track changes
  useEffect(() => {
    if (!settings || !originalSettings) return;

    const changes: string[] = [];

    config.forEach((configItem) => {
      const originalValue = getSettingValue(originalSettings, configItem.key);
      const currentValue = getSettingValue(settings, configItem.key);

      if (originalValue !== currentValue) {
        changes.push(`${configItem.name}: ${originalValue} → ${currentValue}`);
      }
    });

    setChangeLog(changes);
  }, [settings, originalSettings, config]);

  const getSettingValue = (settings: AISettings, key: string): any => {
    const parts = key.split('.');
    let value: any = settings;
    for (const part of parts) {
      value = value[part];
    }
    return value;
  };

  const updateSettingValue = (key: string, value: any) => {
    if (!settings) return;

    const parts = key.split('.');
    const newSettings = JSON.parse(JSON.stringify(settings));
    let current: any = newSettings;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;

    setSettings(newSettings);

    // Update config
    setConfig((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, currentValue: value } : item
      )
    );
  };

  const saveChanges = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Save all changed settings
      for (const configItem of config) {
        const originalValue = getSettingValue(originalSettings!, configItem.key);
        const currentValue = getSettingValue(settings, configItem.key);

        if (originalValue !== currentValue) {
          const result = await updateAISetting(configItem.key, currentValue);
          if (!result.success) {
            throw new Error(`Failed to update ${configItem.name}: ${result.error}`);
          }
        }
      }

      // Update original settings
      setOriginalSettings(settings);
      setChangeLog([]);

      // Reload stats
      const statsResult = await getConversationHistoryStats();
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }

      setSuccessMessage(`Successfully saved ${changeLog.length} changes`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to defaults?')) return;

    setSaving(true);
    setError(null);

    try {
      const result = await resetAISettings();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Reload settings
      const settingsResult = await getAISettings();
      if (settingsResult.success && settingsResult.settings && settingsResult.config) {
        setSettings(settingsResult.settings);
        setOriginalSettings(settingsResult.settings);
        setConfig(settingsResult.config);
      }

      setSuccessMessage('Settings reset to defaults');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    setSaving(true);
    setError(null);

    try {
      const result = await clearAllConversationHistory();
      if (!result.success) {
        throw new Error(result.error);
      }

      // Reload stats
      const statsResult = await getConversationHistoryStats();
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }

      setSuccessMessage(
        `Cleared ${result.deletedSessions} conversation sessions`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      setShowClearConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const renderSettingCard = (configItem: AISettingConfig) => {
    const value = configItem.currentValue;

    return (
      <Card key={configItem.key} className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{configItem.name}</h3>
                {configItem.agentType && (
                  <Badge variant="outline">{configItem.agentType}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {configItem.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {configItem.type === 'boolean' && (
                <>
                  <Switch
                    checked={value as boolean}
                    onCheckedChange={(checked) =>
                      updateSettingValue(configItem.key, checked)
                    }
                    id={configItem.key}
                    disabled={saving}
                  />
                  <Label htmlFor={configItem.key} className="text-sm">
                    {value ? 'Enabled' : 'Disabled'}
                  </Label>
                </>
              )}

              {configItem.type === 'number' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={value as number}
                    onChange={(e) =>
                      updateSettingValue(
                        configItem.key,
                        parseInt(e.target.value)
                      )
                    }
                    min={configItem.min}
                    max={configItem.max}
                    className="w-24"
                    disabled={saving}
                  />
                  {configItem.unit && (
                    <span className="text-sm text-muted-foreground">
                      {configItem.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const hasChanges = changeLog.length > 0;

  const conversationHistorySettings = config.filter(
    (s) => s.category === 'conversation-history'
  );
  const loggingSettings = config.filter((s) => s.category === 'logging');
  const cleanupSettings = config.filter((s) => s.category === 'cleanup');

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">AI Settings</h1>
          <p className="text-lg text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">🤖 AI Settings</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Configure AI conversation history, logging, and cleanup policies
            </p>
          </div>
          <Link href="/admin/settings">
            <Button variant="outline">← Back to Settings</Button>
          </Link>
        </div>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalMessages}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Storage Used</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.storageSize}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">By Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>LangGraph</span>
                <Badge variant="secondary">{stats.sessionsByAgent.langraph}</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Conversation</span>
                <Badge variant="secondary">{stats.sessionsByAgent.conversation}</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Onboarding</span>
                <Badge variant="secondary">{stats.sessionsByAgent.onboarding}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversation History Settings */}
      <div>
        <h2 className="text-2xl font-bold mb-4">💬 Conversation History</h2>
        <p className="text-muted-foreground mb-6">
          Enable conversation history tracking for each AI agent
        </p>
        {conversationHistorySettings.map(renderSettingCard)}
      </div>

      {/* Logging Settings */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📊 Logging</h2>
        <p className="text-muted-foreground mb-6">
          Configure AI conversation logging for admin analytics
        </p>
        {loggingSettings.map(renderSettingCard)}
      </div>

      {/* Cleanup Settings */}
      <div>
        <h2 className="text-2xl font-bold mb-4">🧹 Cleanup</h2>
        <p className="text-muted-foreground mb-6">
          Automatic cleanup of old conversation data
        </p>
        {cleanupSettings.map(renderSettingCard)}
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">⚠️ Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect all conversation data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showClearConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowClearConfirm(true)}
              disabled={saving}
            >
              Clear All Conversation History
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600 font-semibold">
                Are you sure? This will delete all conversation history for all
                users and agents. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleClearHistory}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Yes, Clear Everything'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Log and Actions */}
      {hasChanges && (
        <Card className="bg-yellow-50 border-yellow-300">
          <CardHeader>
            <CardTitle className="text-lg">Pending Changes</CardTitle>
            <CardDescription>
              {changeLog.length} setting{changeLog.length > 1 ? 's' : ''} will be
              updated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded border border-yellow-200 max-h-60 overflow-y-auto">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                Changes to be saved:
              </p>
              {changeLog.map((change, index) => (
                <div
                  key={index}
                  className="text-sm font-mono py-1 border-b last:border-b-0"
                >
                  {change}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={saveChanges}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving
                  ? 'Saving...'
                  : `Save ${changeLog.length} Change${
                      changeLog.length > 1 ? 's' : ''
                    }`}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setSettings(originalSettings);
                  setConfig((prev) =>
                    prev.map((item) => ({
                      ...item,
                      currentValue: getSettingValue(originalSettings!, item.key),
                    }))
                  );
                }}
                disabled={saving}
              >
                Reset Changes
              </Button>

              <Button variant="outline" onClick={handleReset} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasChanges && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No pending changes. Modify settings above to make changes.</p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold mb-2">💡 How AI Settings Work</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • <strong>Conversation History</strong> - Enables multi-turn
              conversations with context retention per agent
            </li>
            <li>
              • <strong>Logging</strong> - Tracks all AI interactions for
              analytics and debugging
            </li>
            <li>
              • <strong>Retention Policies</strong> - Automatically clean up old
              data to save storage
            </li>
            <li>
              • <strong>Per-Agent Control</strong> - Enable/disable history for
              each AI agent independently
            </li>
            <li>
              • Changes take effect immediately after saving
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
