'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface PeteAIChatProps {
  contextHint?: string;  // e.g., "contacts page" or "companies page"
}

export default function PeteAIChat({ contextHint }: PeteAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
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

  if (!isExpanded) {
    return (
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Ask PeteAI</CardTitle>
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
          <p className="text-sm text-muted-foreground">
            Ask questions about {contextHint || 'the data'} using natural language
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">Ask PeteAI</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsExpanded(false);
              setMessages([]);
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
          className="min-h-[200px] max-h-[400px] overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3"
        >
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground italic">
              💬 Ask me anything about {contextHint || 'the data'}...
              <div className="mt-2 space-y-1 text-xs">
                <div>• "Find contact john@example.com"</div>
                <div>• "Which companies have Pete ID?"</div>
                <div>• "Show me contacts with tags"</div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`text-sm ${
                message.role === 'user'
                  ? 'text-blue-700 dark:text-blue-400 font-medium'
                  : message.content === '...thinking...'
                  ? 'text-muted-foreground italic'
                  : 'text-green-700 dark:text-green-400'
              }`}
            >
              <span className="font-semibold">
                {message.role === 'user' ? 'You: ' : 'PeteAI: '}
              </span>
              {message.content}
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about contacts, companies, or data..."
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
          Powered by LangGraph • Uses smart cache with 410 contacts, 94 companies
        </p>
      </CardContent>
    </Card>
  );
}
