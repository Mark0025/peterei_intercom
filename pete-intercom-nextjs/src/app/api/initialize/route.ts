// Canvas Kit Initialize endpoint for Intercom
import { NextRequest, NextResponse } from 'next/server';
import { initializeCanvasKit } from '@/actions/canvas-kit';
import { validateIntercomSignature, getClientSecret } from '@/middleware/signature-validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Canvas Kit initialize endpoint hit');

    // SECURITY: Validate HMAC signature from Intercom
    // This ensures the request genuinely comes from Intercom
    const body = await request.text();
    const signature = request.headers.get('X-Body-Signature');

    if (!validateIntercomSignature(body, signature, getClientSecret())) {
      console.error('[API] Invalid signature - rejecting request');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the validated body
    const payload = body ? JSON.parse(body) : {};
    console.log('[API] Signature validated, payload:', payload);

    // Call server action instead of duplicating logic
    const result = await initializeCanvasKit();

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Initialize error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}