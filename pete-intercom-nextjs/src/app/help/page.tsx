'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HelpCenterPage() {
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3 pb-4">
                <h1 className="text-4xl font-bold tracking-tight">
                    Pete Help Center
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Find answers, tutorials, and support resources for Pete
                </p>
            </div>

            {/* Loading State */}
            {!isIframeLoaded && (
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Loading Help Center...</CardTitle>
                        <CardDescription>
                            Connecting to the Pete Help Center
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Help Center iframe */}
            <div className="max-w-7xl mx-auto">
                <iframe
                    src="https://help.thepete.io/en/"
                    title="Pete Help Center"
                    className="w-full h-[80vh] border-0 rounded-lg shadow-lg"
                    onLoad={() => setIsIframeLoaded(true)}
                    style={{ display: isIframeLoaded ? 'block' : 'none' }}
                />
            </div>

            {/* Quick Links */}
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                    <CardDescription>
                        Common help topics and resources
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start space-y-2"
                            onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe) {
                                    iframe.src = 'https://help.thepete.io/en/';
                                }
                            }}
                        >
                            <span className="font-semibold">Getting Started</span>
                            <span className="text-sm text-muted-foreground">
                                Everything you need to get started with Pete
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start space-y-2"
                            onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe) {
                                    iframe.src = 'https://help.thepete.io/en/';
                                }
                            }}
                        >
                            <span className="font-semibold">Workflows & Automation</span>
                            <span className="text-sm text-muted-foreground">
                                Automate your Pete and streamline tasks
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start space-y-2"
                            onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe) {
                                    iframe.src = 'https://help.thepete.io/en/';
                                }
                            }}
                        >
                            <span className="font-semibold">Communication</span>
                            <span className="text-sm text-muted-foreground">
                                Configure your communication settings
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start space-y-2"
                            onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe) {
                                    iframe.src = 'https://help.thepete.io/en/';
                                }
                            }}
                        >
                            <span className="font-semibold">Properties</span>
                            <span className="text-sm text-muted-foreground">
                                Navigate properties with ease
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start space-y-2"
                            onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe) {
                                    iframe.src = 'https://help.thepete.io/en/';
                                }
                            }}
                        >
                            <span className="font-semibold">Training</span>
                            <span className="text-sm text-muted-foreground">
                                Video training to enhance your knowledge
                            </span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start space-y-2"
                            onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe) {
                                    iframe.src = 'https://help.thepete.io/en/';
                                }
                            }}
                        >
                            <span className="font-semibold">Support</span>
                            <span className="text-sm text-muted-foreground">
                                Comprehensive guide to navigate Pete
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* External Link */}
            <div className="text-center">
                <Button
                    variant="link"
                    onClick={() => window.open('https://help.thepete.io/en/', '_blank')}
                    className="text-primary"
                >
                    Open Help Center in New Tab →
                </Button>
            </div>
        </div>
    );
}
