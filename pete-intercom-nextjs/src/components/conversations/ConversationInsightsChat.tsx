'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import MermaidDiagram from '@/components/MermaidDiagram';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ConversationInsightsChatProps {
  totalConversations: number;
  category?: string;
}

export default function ConversationInsightsChat({
  totalConversations,
  category
}: ConversationInsightsChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [mermaidDiagram, setMermaidDiagram] = useState<string>('');
  const chatLogRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suggested prompts for conversation analysis
  const suggestedPrompts = [
    "What are the main escalation triggers?",
    "Show me success patterns for quick resolution",
    "What gaps exist in the support process?",
    "Generate a resolution path diagram",
    "Analyze conversations by category",
    "What issues cause the longest resolution times?"
  ];

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
      content: '...analyzing conversations...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Call conversation analysis API endpoint
      const response = await fetch('/api/conversation-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          category,
          conversationHistory: messages
        }),
      });

      const data = await response.json();

      // Remove thinking message and add real response
      setMessages(prev => {
        const newMessages = prev.slice(0, -1); // Remove thinking message
        const aiMessage: Message = {
          role: 'ai',
          content: data.message || data.error || 'No response received',
          timestamp: new Date()
        };
        return [...newMessages, aiMessage];
      });

      // Update Mermaid diagram if provided
      if (data.mermaidDiagram) {
        setMermaidDiagram(data.mermaidDiagram);
      }

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

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  if (!isExpanded) {
    return (
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">AI Conversation Insights</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              Expand
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ask PeteAI to analyze {totalConversations} conversations and identify patterns, gaps, and escalation triggers
            </p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Success Patterns</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Escalation Triggers</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Target className="h-3 w-3" />
                <span>Process Gaps</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">AI Conversation Insights</CardTitle>
              <span className="text-xs text-muted-foreground">
                ({totalConversations} conversations analyzed)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                setMessages([]);
                setMermaidDiagram('');
              }}
            >
              Minimize
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Log */}
          <div
            ref={chatLogRef}
            className="min-h-[300px] max-h-[500px] overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3"
          >
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground italic">
                  💬 Ask me to analyze conversation patterns, identify escalation triggers, or find gaps in the support process...
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Suggested questions:
                  </p>
                  {suggestedPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-auto py-2"
                      onClick={() => handleSuggestedPrompt(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`text-sm ${
                  message.role === 'user'
                    ? 'text-blue-700 dark:text-blue-400 font-medium'
                    : message.content.includes('...analyzing...')
                    ? 'text-muted-foreground italic'
                    : 'text-green-700 dark:text-green-400'
                }`}
              >
                <span className="font-semibold">
                  {message.role === 'user' ? 'You: ' : 'PeteAI: '}
                </span>
                <span dangerouslySetInnerHTML={{ __html: message.content }} />
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about patterns, escalations, or gaps..."
              disabled={isLoading}
              required
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            Powered by LangGraph • Uses smart cache with live conversation data
          </p>
        </CardContent>
      </Card>

      {/* Mermaid Diagram Display */}
      {mermaidDiagram && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation Flow Diagram</CardTitle>
          </CardHeader>
          <CardContent>
            <MermaidDiagram
              chart={mermaidDiagram}
              className="bg-white dark:bg-slate-900 p-4 rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
