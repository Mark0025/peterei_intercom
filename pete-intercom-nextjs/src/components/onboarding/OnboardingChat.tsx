'use client';

/**
 * Interactive Chat Interface with PeteAI LangGraph Agent
 *
 * Provides conversational access to onboarding analysis through the agent layer.
 */

import { useState, useEffect, useRef } from 'react';
import { sendOnboardingMessage, getSuggestedQuestions } from '@/actions/onboarding-chat';
import type { AgentMessage } from '@/types/questionnaire-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles } from 'lucide-react';

interface OnboardingChatProps {
  sessionId: string;
}

export function OnboardingChat({ sessionId }: OnboardingChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load suggested questions on mount
  useEffect(() => {
    async function loadSuggestions() {
      const result = await getSuggestedQuestions(sessionId);
      if (result.success && result.questions) {
        setSuggestedQuestions(result.questions);
      }
    }
    loadSuggestions();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(message: string) {
    if (!message.trim() || loading) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await sendOnboardingMessage(sessionId, message, messages);

      if (result.success && result.data) {
        const aiMessage: AgentMessage = {
          role: 'assistant',
          content: result.data.message,
          timestamp: Date.now(),
          metadata: {
            chartGenerated: result.data.chartData !== undefined,
            conversationsReferenced: result.data.conversationReferences?.map(c => c.conversationId),
            filesReferenced: []
          }
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Error message
        const errorMessage: AgentMessage = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${result.error || 'Unknown error'}`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: AgentMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestedQuestion(question: string) {
    handleSendMessage(question);
  }

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Ask PeteAI About Your Onboarding
            </CardTitle>
            <CardDescription>
              I have full context from your questionnaire, uploaded docs, and Intercom conversations
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Powered by LangGraph
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-2">
                <Sparkles className="w-12 h-12 text-purple-500 mx-auto" />
                <h3 className="text-lg font-semibold">Start a Conversation</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me anything about your onboarding process. I can analyze pain points,
                  suggest priorities, reference specific conversations, and help you make
                  data-driven decisions.
                </p>
              </div>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && (
                <div className="space-y-3 w-full max-w-2xl">
                  <div className="text-sm font-medium text-center">Suggested Questions:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedQuestions.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left h-auto py-3 px-4 whitespace-normal"
                        onClick={() => handleSuggestedQuestion(question)}
                        disabled={loading}
                      >
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    {message.metadata?.chartGenerated && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        📊 Chart generated
                      </Badge>
                    )}
                    {message.metadata?.conversationsReferenced && message.metadata.conversationsReferenced.length > 0 && (
                      <Badge variant="secondary" className="mt-2 ml-2 text-xs">
                        💬 {message.metadata.conversationsReferenced.length} conversations referenced
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">PeteAI is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pain points, recommendations, or specific issues..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Quick Actions */}
          {messages.length > 0 && suggestedQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center">Quick:</span>
              {suggestedQuestions.slice(0, 3).map((question, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleSuggestedQuestion(question)}
                  disabled={loading}
                >
                  {question.length > 40 ? question.substring(0, 40) + '...' : question}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}