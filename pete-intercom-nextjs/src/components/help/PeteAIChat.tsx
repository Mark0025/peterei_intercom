'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import mermaid from 'mermaid';
import { getRandomLoadingMessage, getSequentialLoadingMessage } from '@/utils/loading-messages';
import { ConversationHistory } from './ConversationHistory';

// Simple markdown parser for chat messages
function parseMarkdown(text: string): string {
    // First, preserve double line breaks as paragraph markers
    text = text.replace(/\n\n/g, '___PARAGRAPH___');

    // Headers
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-3 mb-2">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

    // Bold - handle Step patterns specially with line breaks
    text = text.replace(/\*\*(Step \d+:)\*\*/g, '<br/><strong class="font-bold block mt-3">$1</strong>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    text = text.replace(/\_\_(.*?)\_\_/g, '<strong class="font-bold">$1</strong>');

    // Italic
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    text = text.replace(/\_(.*?)\_/g, '<em class="italic">$1</em>');

    // Links - make them blue and clickable
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    // Replace paragraph markers
    text = text.replace(/___PARAGRAPH___/g, '<br/><br/>');

    // Single line breaks
    text = text.replace(/\n/g, '<br/>');

    // Clean up leading line breaks
    text = text.replace(/^(<br\/>)+/, '');

    return text;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    hasMermaid?: boolean;
}

export function PeteAIChat() {
    // Generate session ID once on mount for conversation history
    const [sessionId, setSessionId] = useState(() => `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [loadingMessage, setLoadingMessage] = useState(getRandomLoadingMessage());
    const [loadingStartTime, setLoadingStartTime] = useState(Date.now());
    const [showHistory, setShowHistory] = useState(true); // Show history sidebar by default
    const chatLogRef = useRef<HTMLDivElement>(null);

    // Initialize Mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose', // Allow clicks and hyperlinks in diagrams
            flowchart: {
                htmlLabels: true,
                useMaxWidth: true
            }
        });

        // Add global CSS for Mermaid diagram links
        const style = document.createElement('style');
        style.textContent = `
            .mermaid a,
            .mermaid .clickable {
                cursor: pointer;
                fill: #2563eb !important;
                color: #2563eb !important;
                text-decoration: underline;
            }
            .mermaid a:hover,
            .mermaid .clickable:hover {
                fill: #1d4ed8 !important;
                color: #1d4ed8 !important;
            }
            .mermaid .edgeLabel a {
                color: #2563eb !important;
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const scrollToBottom = () => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    };

    const loadSession = async (loadSessionId: string) => {
        try {
            setIsLoading(true);
            const userId = loadSessionId.startsWith('help-') ? 'help-user' : 'api-user';

            const response = await fetch(`/api/conversations/${loadSessionId}?userId=${userId}&agentType=langraph`);

            if (!response.ok) {
                throw new Error('Failed to load session');
            }

            const data = await response.json();

            if (data.success && data.session) {
                // Convert session messages to Message format
                const loadedMessages: Message[] = data.session.messages.map((msg: any) => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp),
                    hasMermaid: msg.hasMermaid
                }));

                setMessages(loadedMessages);
                setSessionId(loadSessionId);
                setShowHistory(false);

                console.log(`[PeteAI] Loaded session ${loadSessionId} with ${loadedMessages.length} messages`);
            }
        } catch (error) {
            console.error('[PeteAI] Failed to load session:', error);
            alert('Failed to load conversation history. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startNewSession = () => {
        const newSessionId = `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        setMessages([]);
        setShowHistory(false);
        console.log(`[PeteAI] Started new session: ${newSessionId}`);
    };

    // Rotate loading messages every 2 seconds
    useEffect(() => {
        if (!isLoading) return;

        const interval = setInterval(() => {
            setLoadingMessage(getSequentialLoadingMessage(loadingStartTime));
        }, 2000);

        return () => clearInterval(interval);
    }, [isLoading, loadingStartTime]);

    useEffect(() => {
        scrollToBottom();
        // Render Mermaid diagrams after messages update
        const renderMermaidDiagrams = async () => {
            try {
                const mermaidElements = document.querySelectorAll('.mermaid[data-processed="false"]');
                for (const element of Array.from(mermaidElements)) {
                    const code = element.textContent || '';
                    if (code.trim()) {
                        // Generate a valid ID without periods - use Math.floor to avoid decimal points
                        const uniqueId = `mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                        const { svg } = await mermaid.render(uniqueId, code);
                        element.innerHTML = svg;
                        element.setAttribute('data-processed', 'true');
                    }
                }
            } catch (error) {
                console.error('Mermaid rendering error:', error);
            }
        };

        renderMermaidDiagrams();
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
        setLoadingStartTime(Date.now());
        setLoadingMessage(getRandomLoadingMessage());

        // Add thinking message with fun loading text
        const thinkingMessage: Message = {
            role: 'ai',
            content: loadingMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            // Send request with session ID for conversation history
            const response = await fetch('/api/PeteAI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sessionId  // Enables conversation history tracking
                }),
            });

            const data = await response.json();

            // Handle error response
            if (!response.ok || data.error) {
                console.error('[PeteAI Help] API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.error,
                    sessionId,
                    timestamp: new Date().toISOString()
                });

                // Show generic error to user
                setMessages(prev => {
                    const newMessages = prev.slice(0, -1);
                    return [...newMessages, {
                        role: 'ai',
                        content: 'Sorry, I\'m having trouble right now. Please try again in a moment.',
                        timestamp: new Date()
                    }];
                });
                return;
            }

            // Success - add response
            setMessages(prev => {
                const newMessages = prev.slice(0, -1); // Remove thinking message
                const aiMessage: Message = {
                    role: 'ai',
                    content: data.reply || 'No response received',
                    timestamp: new Date()
                };
                return [...newMessages, aiMessage];
            });

            console.log('[PeteAI Help] Response received:', {
                length: data.reply?.length || 0,
                hasMermaid: data.reply?.includes('```mermaid') || false,
                sessionId
            });

        } catch (error) {
            console.error('[PeteAI Help] Network error:', {
                error: error instanceof Error ? error.message : error,
                sessionId,
                timestamp: new Date().toISOString()
            });

            // Show generic error to user
            setMessages(prev => {
                const newMessages = prev.slice(0, -1);
                return [...newMessages, {
                    role: 'ai',
                    content: 'Connection error. Please check your internet and try again.',
                    timestamp: new Date()
                }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Conversation History Sidebar - Optional Toggle */}
            {showHistory && (
                <div className="md:col-span-1">
                    <ConversationHistory
                        currentSessionId={sessionId}
                        onLoadSession={loadSession}
                    />
                </div>
            )}

            {/* Main Chat Interface */}
            <Card className={showHistory ? 'md:col-span-3' : 'md:col-span-4'}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                🤖 PeteAI Assistant
                            </CardTitle>
                            <CardDescription>
                                Ask PeteAI anything about Pete, Intercom, or your business automation needs
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                {showHistory ? 'Hide' : 'Show'} History
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={startNewSession}
                                disabled={messages.length === 0}
                            >
                                + New Chat
                            </Button>
                        </div>
                    </div>
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
                        const hasMermaid = message.content.includes('graph TD') || message.content.includes('graph LR') ||
                                          message.content.includes('flowchart TD') || message.content.includes('flowchart LR') ||
                                          message.content.includes('```mermaid');

                        // Extract Mermaid code if present
                        let textContent = message.content;
                        let mermaidCode = '';

                        if (hasMermaid) {
                            console.log('[Mermaid Debug] Full message content:', message.content);
                            console.log('[Mermaid Debug] Has backticks?', message.content.includes('```mermaid'));
                            console.log('[Mermaid Debug] Has graph TD?', message.content.includes('graph TD'));

                            // Extract mermaid code from backticks
                            const mermaidMatch = message.content.match(/```mermaid\n?([\s\S]+?)\n?```/);
                            if (mermaidMatch && mermaidMatch[1]) {
                                mermaidCode = mermaidMatch[1].trim();
                                textContent = message.content.replace(/```mermaid\n?[\s\S]+?\n?```/, '').trim();
                                console.log('[Mermaid Debug] ✅ Found in backticks:', mermaidCode);
                            } else {
                                console.log('[Mermaid Debug] No backtick match, trying raw pattern...');
                                // Look for raw flowchart or graph (with or without semicolons, single or multi-line)
                                // Match: "graph TD; A[Start] --> B[Step];" or "graph TD\nA --> B\n"
                                const diagramMatch = message.content.match(/((?:flowchart|graph) (?:TD|LR);?[\s\S]+?)(?=\*\*Reference|\n\*\*|\s{2,}\n|$)/);
                                if (diagramMatch && diagramMatch[1]) {
                                    mermaidCode = diagramMatch[1].trim();
                                    textContent = message.content.replace(diagramMatch[1], '').trim();
                                    console.log('[Mermaid Debug] ✅ Found raw diagram:', mermaidCode);
                                } else {
                                    console.log('[Mermaid Debug] ❌ No match found - check regex pattern');
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
                                {textContent && (
                                    <div
                                        className="text-sm mb-2 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: parseMarkdown(textContent) }}
                                    />
                                )}
                                {mermaidCode && (
                                    <div
                                        className="mermaid bg-white p-4 rounded border my-2"
                                        data-processed="false"
                                    >
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
                        <strong>Features:</strong> Real-time AI chat • Intercom expertise • Canvas Kit assistance • Business automation • Persistent conversation history
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
