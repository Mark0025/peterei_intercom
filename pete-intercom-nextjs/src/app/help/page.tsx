'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCenterViewer } from '@/components/help/HelpCenterViewer';
import { PeteAIChat } from '@/components/help/PeteAIChat';

export default function HelpCenterPage() {

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-2 pb-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Pete Help Center
                </h1>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                    Find answers, tutorials, and support resources for Pete
                </p>
            </div>


            {/* Help Center - Using proxy to bypass iframe restrictions - Full Width */}
            <div className="w-full mx-auto" style={{ maxWidth: '95vw' }}>
                <HelpCenterViewer className="h-[85vh] border rounded-lg shadow-lg" />
            </div>

            {/* PeteAI Chat Assistant */}
            <div className="w-full mx-auto" style={{ maxWidth: '95vw' }}>
                <PeteAIChat />
            </div>

            {/* Quick Links */}
            <Card className="w-full mx-auto" style={{ maxWidth: '95vw' }}>
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
                                    iframe.src = '/api/help-proxy';
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
                                    iframe.src = '/api/help-proxy';
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
                                    iframe.src = '/api/help-proxy';
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
                                    iframe.src = '/api/help-proxy';
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
                                    iframe.src = '/api/help-proxy';
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
                                    iframe.src = '/api/help-proxy';
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
                    onClick={() => {
                        const iframe = document.querySelector('iframe');
                        if (iframe) {
                            iframe.src = '/api/help-proxy';
                        }
                    }}
                    className="text-primary"
                >
                    Open Help Center in New Tab →
                </Button>
            </div>
        </div>
    );
}
