'use client';

/**
 * NewOnboarding.tsx
 *
 * COMING SOON: Canvas Kit Onboarding Module
 *
 * This component will power the new interactive onboarding experience
 * directly within Intercom Messenger using Canvas Kit components.
 *
 * Features (Planned):
 * - Step-by-step guided onboarding flow
 * - Real-time progress tracking
 * - AI-powered recommendations based on user responses
 * - Smart notifications and follow-ups
 * - Integration with Intercom user/company attributes
 *
 * Architecture:
 * - Server-side Canvas Kit responses (src/actions/canvas-kit.ts)
 * - Client-side preview component (this file)
 * - Shared onboarding data model (src/services/onboarding-data.ts)
 *
 * @status COMING_SOON
 * @created 2025-02-10
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NewOnboardingProps {
  preview?: boolean;
}

export default function NewOnboarding({ preview = false }: NewOnboardingProps) {
  return (
    <div className="space-y-6">
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎯 Canvas Kit Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium text-muted-foreground">
              Coming Soon!
            </p>
            <p className="text-sm">
              Our new interactive onboarding experience is coming soon! This will guide you
              through Pete setup step-by-step, right here in Intercom.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <p className="font-semibold text-sm text-muted-foreground">What to expect:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✨</span>
                <span>Interactive step-by-step guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">📊</span>
                <span>Real-time progress tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">🤖</span>
                <span>AI-powered recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">🔔</span>
                <span>Smart notifications and reminders</span>
              </li>
            </ul>
          </div>

          {preview && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground italic">
                This is a preview of the coming soon screen. The actual onboarding will be
                delivered via Canvas Kit components in Intercom Messenger.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Implementation Notes */}
      {preview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Developer Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p className="font-semibold">Implementation Checklist:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Design onboarding flow steps in Canvas Kit format</li>
              <li>Create state machine for progress tracking</li>
              <li>Integrate with Intercom user/company attributes</li>
              <li>Build AI recommendation engine</li>
              <li>Add automated follow-up notifications</li>
              <li>Create admin dashboard for monitoring progress</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
