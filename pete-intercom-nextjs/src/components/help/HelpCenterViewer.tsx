'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HelpCenterViewerProps {
    className?: string;
}

export function HelpCenterViewer({ className }: HelpCenterViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleIframeLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const refreshIframe = () => {
        if (iframeRef.current) {
            setIsLoading(true);
            setHasError(false);
            iframeRef.current.src = iframeRef.current.src;
        }
    };

    const openInNewTab = () => {
        window.open('https://help.thepete.io/en/', '_blank');
    };

    return (
        <div className={`relative ${className}`}>
            {/* Loading State */}
            {isLoading && (
                <Card className="absolute inset-0 z-10">
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
                <Card className="absolute inset-0 z-10">
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
                className="w-full h-full border-0 rounded-lg"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{
                    minHeight: '600px',
                    display: hasError ? 'none' : 'block'
                }}
            />
        </div>
    );
}
