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
    
    // Update relative URLs to point to our proxy
    html = html.replace(/src="\//g, `src="/api/help-proxy?path=/`);
    html = html.replace(/href="\//g, `href="/api/help-proxy?path=/`);
    
    // Update form actions to point to our proxy
    html = html.replace(/action="\//g, `action="/api/help-proxy?path=/`);
    
    // Update any absolute help.thepete.io URLs to use our proxy
    html = html.replace(/href="https:\/\/help\.thepete\.io\//g, `href="/api/help-proxy?path=`);
    html = html.replace(/src="https:\/\/help\.thepete\.io\//g, `src="/api/help-proxy?path=`);
    
    // Add styling and JavaScript to handle navigation properly
    html = html.replace(
      '<head>',
      `<head>
        <base href="${HELP_CENTER_URL}" target="_self">
        <style>
          body { margin: 0; padding: 20px; }
          .iframe-container { max-width: 100%; }
        </style>
        <script>
          // Intercept link clicks to handle navigation within iframe
          document.addEventListener('DOMContentLoaded', function() {
            // Override all anchor clicks to use our proxy
            document.addEventListener('click', function(e) {
              const target = e.target.closest('a');
              if (target && target.href) {
                try {
                  const url = new URL(target.href);

                  // If it's a help.thepete.io link or relative link, route through proxy
                  if (url.hostname === 'help.thepete.io' || url.hostname === window.location.hostname) {
                    e.preventDefault();
                    const path = url.pathname + url.search + url.hash;
                    const proxyUrl = '/api/help-proxy?path=' + encodeURIComponent(path);
                    console.log('Navigating to:', path, 'via', proxyUrl);
                    window.location.href = proxyUrl;

                    // Notify parent about navigation
                    window.parent.postMessage({
                      type: 'navigation',
                      url: proxyUrl
                    }, '*');
                  }
                } catch (err) {
                  console.error('Link navigation error:', err);
                }
              }
            }, true);

            // Track history state changes
            const originalPushState = history.pushState;
            history.pushState = function() {
              originalPushState.apply(this, arguments);
              window.parent.postMessage({
                type: 'navigation',
                url: window.location.href
              }, '*');
            };
          });
        </script>`
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
