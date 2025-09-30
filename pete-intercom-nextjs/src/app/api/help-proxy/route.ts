/**
 * Help Center Proxy API Route
 * 
 * This is an alternative approach to bypass X-Frame-Options restrictions
 * by proxying the help center content through our server.
 * 
 * Note: This approach may have limitations and should be used carefully
 * to respect the original site's terms of service.
 */

import { NextRequest, NextResponse } from 'next/server';

const HELP_CENTER_URL = 'https://help.thepete.io/en/';

export async function GET(request: NextRequest) {
  try {
    // Get the requested path from the URL
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    
    // Construct the full URL
    const targetUrl = `${HELP_CENTER_URL}${path}`;
    
    // Fetch the content from the help center
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PeteHelpProxy/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch help content' },
        { status: response.status }
      );
    }

    // Get the HTML content
    let html = await response.text();
    
    // Remove or modify headers that prevent iframe embedding
    // This is a basic approach - more sophisticated content modification might be needed
    html = html.replace(/x-frame-options:\s*deny/gi, '');
    html = html.replace(/X-Frame-Options:\s*DENY/gi, '');
    
    // Update relative URLs to absolute URLs
    html = html.replace(/src="\//g, `src="${HELP_CENTER_URL}/`);
    html = html.replace(/href="\//g, `href="${HELP_CENTER_URL}/`);
    
    // Update form actions to point to our proxy
    html = html.replace(/action="\//g, `action="/api/help-proxy?path=/`);
    
    // Add some basic styling to make it look better in iframe
    html = html.replace(
      '<head>',
      `<head>
        <style>
          body { margin: 0; padding: 20px; }
          .iframe-container { max-width: 100%; }
        </style>`
    );

    // Return the modified HTML
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN', // Allow iframe embedding from our domain
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Help proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
