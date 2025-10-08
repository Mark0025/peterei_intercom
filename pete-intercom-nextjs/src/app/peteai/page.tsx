'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessageToPeteAIJson } from '@/actions/peteai';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function PeteAIPage() {
  const [sessionId] = useState(() => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
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
      const response = await fetch('/api/PeteAI', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('[PeteAI Page] Error:', { error: data.error, sessionId });
        setMessages(prev => [...prev.slice(0, -1), {
          role: 'ai',
          content: 'Sorry, I\'m having trouble right now. Please try again.',
          timestamp: new Date()
        }]);
        return;
      }

      setMessages(prev => [...prev.slice(0, -1), {
        role: 'ai',
        content: data.reply || 'No response received',
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('[PeteAI Page] Network error:', { error, sessionId });
      setMessages(prev => [...prev.slice(0, -1), {
        role: 'ai',
        content: 'Connection error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 12px rgba(44,114,210,0.07)',
        padding: '32px 24px'
      }}>
        <h1 style={{ color: '#2d72d2' }}>PeteAI Chat Agent 🤖</h1>
        <p>Ask anything! Powered by OpenRouter and Llama 3.2.</p>
        
        <div 
          ref={chatLogRef}
          style={{
            minHeight: '180px',
            background: '#f4f4f4',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '1.1em',
            color: '#222',
            overflowY: 'auto',
            maxHeight: '300px'
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              Welcome! Type a message to start chatting with PeteAI.
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} style={{
              color: message.role === 'user' ? '#2d72d2' : '#1a7f37',
              fontWeight: message.role === 'user' ? 'bold' : 'normal',
              marginBottom: '1em'
            }}>
              {message.role === 'user' ? 'You: ' : 'PeteAI: '}{message.content}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            required
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '1em'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            style={{
              background: isLoading ? '#ccc' : '#2d72d2',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 18px',
              fontSize: '1em',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '20px auto',
        padding: '15px',
        backgroundColor: '#e8f5e8',
        borderRadius: '8px',
        border: '1px solid #28a745'
      }}>
        <strong>🚀 PeteAI Features:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Real-time AI chat powered by Llama 3.2</li>
          <li>Intercom integration expertise</li>
          <li>Canvas Kit development assistance</li>
          <li>Business automation guidance</li>
        </ul>
      </div>

      {!process.env.OPENROUTER_API_KEY && (
        <div style={{
          maxWidth: '600px',
          margin: '20px auto',
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffc107',
          fontSize: '0.9em'
        }}>
          <strong>⚠️ Configuration:</strong> OPENROUTER_API_KEY environment variable is required for PeteAI to function.
        </div>
      )}
    </>
  );
}
