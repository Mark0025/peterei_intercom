'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RotateCw, ExternalLink, Home } from 'lucide-react';

interface HelpCenterViewerProps {
    className?: string;
}

export function HelpCenterViewer({ className }: HelpCenterViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('/api/help-proxy');
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [history, setHistory] = useState<string[]>(['/api/help-proxy']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleIframeLoad = () => {
        setIsLoading(false);
        setHasError(false);

        // Try to get the current URL from iframe (if same-origin)
        try {
            if (iframeRef.current?.contentWindow?.location) {
                const iframeUrl = iframeRef.current.contentWindow.location.href;
                if (iframeUrl && iframeUrl !== 'about:blank') {
                    // Update history only if it's a new URL
                    if (iframeUrl !== history[historyIndex]) {
                        const newHistory = history.slice(0, historyIndex + 1);
                        newHistory.push(iframeUrl);
                        setHistory(newHistory);
                        setHistoryIndex(newHistory.length - 1);
                        setCanGoBack(newHistory.length > 1);
                        setCanGoForward(false);
                    }
                }
            }
        } catch (e) {
            // Cross-origin iframe - can't access contentWindow
            // This is expected with the proxy
        }
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const navigateTo = (url: string) => {
        if (iframeRef.current) {
            setIsLoading(true);
            setHasError(false);
            setCurrentUrl(url);
            iframeRef.current.src = url;
        }
    };

    const goBack = () => {
        if (canGoBack && historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            navigateTo(history[newIndex]);
            setCanGoBack(newIndex > 0);
            setCanGoForward(true);
        }
    };

    const goForward = () => {
        if (canGoForward && historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            navigateTo(history[newIndex]);
            setCanGoBack(true);
            setCanGoForward(newIndex < history.length - 1);
        }
    };

    const refreshIframe = () => {
        navigateTo(currentUrl);
    };

    const goHome = () => {
        navigateTo('/api/help-proxy');
    };

    const openInNewTab = () => {
        window.open('https://help.thepete.io/en/', '_blank');
    };

    // Listen for messages from iframe (if needed for navigation tracking)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from our proxy
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'navigation') {
                setCurrentUrl(event.data.url);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className={`relative flex flex-col ${className}`}>
            {/* Navigation Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 border-b rounded-t-lg">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBack}
                    disabled={!canGoBack || isLoading}
                    title="Go back"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goForward}
                    disabled={!canGoForward || isLoading}
                    title="Go forward"
                >
                    <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshIframe}
                    disabled={isLoading}
                    title="Refresh"
                >
                    <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goHome}
                    disabled={isLoading}
                    title="Go to home"
                >
                    <Home className="h-4 w-4" />
                </Button>
                <div className="flex-1 px-2 text-sm text-muted-foreground truncate">
                    {isLoading ? 'Loading...' : 'Pete Help Center'}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={openInNewTab}
                    title="Open in new tab"
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </div>

            {/* Content Area */}
            <div className="relative flex-1">
                {/* Loading State */}
                {isLoading && (
                    <Card className="absolute inset-0 z-10 rounded-t-none">
                        <CardContent className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-muted-foreground">Loading Help Center...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {hasError && (
                    <Card className="absolute inset-0 z-10 rounded-t-none">
                        <CardHeader>
                            <CardTitle>Unable to Load Help Center</CardTitle>
                            <CardDescription>
                                The help center cannot be embedded due to security restrictions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Button onClick={refreshIframe} variant="outline">
                                    Try Again
                                </Button>
                                <Button onClick={openInNewTab}>
                                    Open in New Tab
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Iframe */}
                <iframe
                    ref={iframeRef}
                    src="/api/help-proxy"
                    title="Pete Help Center"
                    className="w-full h-full border-0 rounded-b-lg"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    style={{
                        minHeight: '600px',
                        display: hasError ? 'none' : 'block'
                    }}
                />
            </div>
        </div>
    );
}
