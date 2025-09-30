'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import mermaid from 'mermaid';

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    hasMermaid?: boolean;
}

export function PeteAIChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const chatLogRef = useRef<HTMLDivElement>(null);

    // Initialize Mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
        });
    }, []);

    const scrollToBottom = () => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
        // Render Mermaid diagrams after messages update
        mermaid.contentLoaded();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const message = inputValue.trim();
        if (!message) return;

        // Add user message
        const userMessage: Message = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Add thinking message
        const thinkingMessage: Message = {
            role: 'ai',
            content: '...thinking...',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            // Use the original API endpoint for compatibility
            const response = await fetch('/api/PeteAI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();

            // Remove thinking message and add real response
            setMessages(prev => {
                const newMessages = prev.slice(0, -1); // Remove thinking message
                const aiMessage: Message = {
                    role: 'ai',
                    content: data.reply?.content || data.error || 'No response received',
                    timestamp: new Date()
                };
                return [...newMessages, aiMessage];
            });

        } catch (error) {
            // Remove thinking message and add error
            setMessages(prev => {
                const newMessages = prev.slice(0, -1);
                const errorMessage: Message = {
                    role: 'ai',
                    content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    timestamp: new Date()
                };
                return [...newMessages, errorMessage];
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    🤖 PeteAI Assistant
                </CardTitle>
                <CardDescription>
                    Ask PeteAI anything about Pete, Intercom, or your business automation needs
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Chat Messages */}
                <div
                    ref={chatLogRef}
                    className="min-h-[200px] max-h-[300px] bg-muted rounded-lg p-4 overflow-y-auto"
                >
                    {messages.length === 0 && (
                        <div className="text-muted-foreground italic text-center py-8">
                            Welcome! Type a message to start chatting with PeteAI.
                        </div>
                    )}

                    {messages.map((message, index) => {
                        // Check if message contains Mermaid diagram
                        const hasMermaid = message.content.includes('graph TD') || message.content.includes('graph LR') || message.content.includes('```mermaid');

                        // Extract Mermaid code if present
                        let textContent = message.content;
                        let mermaidCode = '';

                        if (hasMermaid) {
                            // Extract mermaid code from backticks or raw content
                            const mermaidMatch = message.content.match(/```mermaid\n([\s\S]+?)\n```/);
                            if (mermaidMatch) {
                                mermaidCode = mermaidMatch[1];
                                textContent = message.content.replace(/```mermaid\n[\s\S]+?\n```/, '').trim();
                            } else {
                                // Look for raw graph TD or graph LR
                                const graphMatch = message.content.match(/(graph (?:TD|LR)\n[\s\S]+?)(?=\n\n|$)/);
                                if (graphMatch) {
                                    mermaidCode = graphMatch[1];
                                    textContent = message.content.replace(graphMatch[1], '').trim();
                                }
                            }
                        }

                        return (
                            <div key={index} className={`mb-3 ${message.role === 'user'
                                    ? 'text-primary font-semibold'
                                    : 'text-green-700'
                                }`}>
                                <div className="text-sm font-medium mb-1">
                                    {message.role === 'user' ? 'You' : 'PeteAI'}
                                </div>
                                {textContent && <div className="text-sm mb-2">{textContent}</div>}
                                {mermaidCode && (
                                    <div className="mermaid bg-white p-4 rounded border my-2">
                                        {mermaidCode}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask PeteAI anything..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="px-6"
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </Button>
                </form>

                {/* Features */}
                <div className="text-xs text-muted-foreground">
                    <strong>Features:</strong> Real-time AI chat • Intercom expertise • Canvas Kit assistance • Business automation
                </div>
            </CardContent>
        </Card>
    );
}
