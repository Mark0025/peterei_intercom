// Canvas Kit Submit endpoint for Intercom
import { NextRequest, NextResponse } from 'next/server';
import { handleCanvasKitSubmit } from '@/actions/canvas-kit';
import type { CanvasKitRequest } from '@/types';
import { validateIntercomSignature, getClientSecret } from '@/middleware/signature-validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate HMAC signature from Intercom
    // This ensures the request genuinely comes from Intercom
    const bodyText = await request.text();
    const signature = request.headers.get('X-Body-Signature');

    if (!validateIntercomSignature(bodyText, signature, getClientSecret())) {
      console.error('[API] Invalid signature - rejecting request');

      // Return Canvas Kit error response format
      return NextResponse.json({
        canvas: {
          content: {
            components: [{
              type: 'text',
              id: 'error',
              text: 'Authentication failed. Invalid signature.',
              style: 'error',
              align: 'center'
            }]
          }
        }
      }, { status: 401 });
    }

    // Parse the validated body
    const body: CanvasKitRequest = JSON.parse(bodyText);
    console.log('[API] Canvas Kit submit endpoint hit (signature validated):', JSON.stringify(body, null, 2));
    
    // Transform Intercom request to our server action format
    const formData = {
      componentId: body.component_id,
      inputValues: body.input_values || {},
      storedData: body.stored_data || {},
      userId: body.context?.user?.id
    };

    // Call server action
    const result = await handleCanvasKitSubmit(formData);
    
    if (!result.success || !result.data) {
      // Still return a valid Canvas Kit response even on error
      const errorResponse = result.data || {
        canvas: {
          content: {
            components: [{
              type: 'text',
              id: 'error',
              text: result.error || 'Something went wrong',
              style: 'error',
              align: 'center'
            }]
          }
        }
      };
      
      return NextResponse.json(errorResponse);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Submit error:', error);
    
    // Always return valid Canvas Kit format
    return NextResponse.json({
      canvas: {
        content: {
          components: [{
            type: 'text',
            id: 'error',
            text: 'Internal server error. Please try again.',
            style: 'error',
            align: 'center'
          }]
        }
      }
    });
  }
}