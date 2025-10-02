'use client';

/**
 * UI Configuration Settings
 *
 * Simple +/- controls for typography sizes - no need to know Tailwind classes!
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { getUIConfig, saveUIConfig, resetUIConfig } from '@/actions/ui-config';
import type { UIConfig } from '@/types/ui-config';
import { Settings, RotateCcw, Save, Check, Plus, Minus } from 'lucide-react';

// Size scale: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
const TEXT_SIZES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
const FONT_WEIGHTS = ['font-normal', 'font-medium', 'font-semibold', 'font-bold'];

export default function UIConfigPage() {
  const [config, setConfig] = useState<UIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    const result = await getUIConfig();
    if (result.success && result.data) {
      setConfig(result.data);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    const result = await saveUIConfig(config);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      // Reload the page after 1 second to apply changes globally
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  async function handleReset() {
    if (confirm('Reset all UI settings to defaults?')) {
      setSaving(true);
      await resetUIConfig();
      await loadConfig();
      setSaving(false);
    }
  }

  function getSizeFromClass(className: string): string {
    const match = className.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)/);
    return match ? `text-${match[1]}` : 'text-base';
  }

  function getWeightFromClass(className: string): string {
    const match = className.match(/font-(normal|medium|semibold|bold)/);
    return match ? `font-${match[1]}` : 'font-normal';
  }

  function incrementSize(key: keyof UIConfig['typography']) {
    if (!config) return;
    const currentClass = config.typography[key];
    const currentSize = getSizeFromClass(currentClass);
    const currentWeight = getWeightFromClass(currentClass);
    const currentIndex = TEXT_SIZES.indexOf(currentSize);
    if (currentIndex < TEXT_SIZES.length - 1) {
      const newSize = TEXT_SIZES[currentIndex + 1];
      setConfig({
        ...config,
        typography: {
          ...config.typography,
          [key]: `${newSize} ${currentWeight}`
        }
      });
    }
  }

  function decrementSize(key: keyof UIConfig['typography']) {
    if (!config) return;
    const currentClass = config.typography[key];
    const currentSize = getSizeFromClass(currentClass);
    const currentWeight = getWeightFromClass(currentClass);
    const currentIndex = TEXT_SIZES.indexOf(currentSize);
    if (currentIndex > 0) {
      const newSize = TEXT_SIZES[currentIndex - 1];
      setConfig({
        ...config,
        typography: {
          ...config.typography,
          [key]: `${newSize} ${currentWeight}`
        }
      });
    }
  }

  function cycleWeight(key: keyof UIConfig['typography']) {
    if (!config) return;
    const currentClass = config.typography[key];
    const currentSize = getSizeFromClass(currentClass);
    const currentWeight = getWeightFromClass(currentClass);
    const currentIndex = FONT_WEIGHTS.indexOf(currentWeight);
    const newWeight = FONT_WEIGHTS[(currentIndex + 1) % FONT_WEIGHTS.length];
    setConfig({
      ...config,
      typography: {
        ...config.typography,
        [key]: `${currentSize} ${newWeight}`
      }
    });
  }

  if (loading || !config) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading UI configuration...</p>
      </div>
    );
  }

  const renderTypographyControl = (
    label: string,
    key: keyof UIConfig['typography'],
    previewText: string
  ) => {
    const currentSize = getSizeFromClass(config.typography[key]);
    const currentWeight = getWeightFromClass(config.typography[key]);
    const sizeLabel = currentSize.replace('text-', '').toUpperCase();
    const weightLabel = currentWeight.replace('font-', '');

    return (
      <div className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{label}</Label>
          <div className="flex gap-2">
            <Badge variant="outline">{sizeLabel}</Badge>
            <Badge variant="secondary">{weightLabel}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => decrementSize(key)}
            disabled={TEXT_SIZES.indexOf(currentSize) === 0}
          >
            <Minus className="w-4 h-4" />
            Smaller
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => incrementSize(key)}
            disabled={TEXT_SIZES.indexOf(currentSize) === TEXT_SIZES.length - 1}
          >
            <Plus className="w-4 h-4" />
            Larger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cycleWeight(key)}
          >
            Weight: {weightLabel}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <p className={config.typography[key]}>{previewText}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Settings className="w-10 h-10" />
              UI Configuration
            </h1>
            <p className="text-muted-foreground mt-2">
              Use simple +/- buttons to adjust text sizes globally
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </>
              )}
            </Button>
          </div>
        </div>

        {saved && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <p className="text-sm text-green-800">✅ Saved! Reloading page to apply changes globally...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Typography Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Adjust text sizes for headings and body text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderTypographyControl('Heading 1 (Main Titles)', 'h1', 'This is a Main Title')}
          {renderTypographyControl('Heading 2 (Section Titles)', 'h2', 'This is a Section Title')}
          {renderTypographyControl('Heading 3 (Subsections)', 'h3', 'This is a Subsection')}
          {renderTypographyControl('Heading 4 (Small Headings)', 'h4', 'This is a Small Heading')}
          {renderTypographyControl('Paragraph (Body Text)', 'paragraph', 'This is regular paragraph text that appears throughout the application.')}
          {renderTypographyControl('Small Text (Captions)', 'small', 'This is small text for captions and labels')}
          {renderTypographyControl('Lead Text (Introductions)', 'lead', 'This is lead text for introducing sections')}
          {renderTypographyControl('Muted Text (Secondary Info)', 'muted', 'This is muted text for less important information')}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">How This Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Click +/- buttons to make text larger or smaller</p>
          <p>• Click "Weight" to cycle through Normal → Medium → Semibold → Bold</p>
          <p>• Preview shows exactly how text will look</p>
          <p>• Changes apply globally after clicking "Save" (page auto-reloads)</p>
          <p>• Settings are stored in <code className="bg-white px-2 py-1 rounded">data/ui-config.json</code></p>
        </CardContent>
      </Card>
    </div>
  );
}