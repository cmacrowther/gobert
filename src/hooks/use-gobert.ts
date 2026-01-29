import { useState, useEffect, useRef, useCallback } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export function useGobert() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('gobert-history');
      if (savedMessages) {
        try {
          // eslint-disable-next-line
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Failed to parse chat history', e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('gobert-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Connect to WebSocket proxy
  useEffect(() => {
    // Use the proxy endpoint - this connects to our server which proxies to Clawdbot
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to Gobert');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from Gobert');
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error');
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      const text = event.data;
      // Assuming plaintext response from bot
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
    };

    return () => {
      if (ws.readyState === 1 || ws.readyState === 0) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, newMessage]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(content);
    } else {
      setError('Not connected');
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gobert-history');
    }
  }, []);

  return {
    messages,
    sendMessage,
    isConnected,
    error,
    clearHistory,
    isLoaded
  };
}
