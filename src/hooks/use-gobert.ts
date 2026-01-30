import { useState, useEffect, useRef, useCallback } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type Agent = {
  id: string;
  name: string;
  description?: string;
};

// Generate a unique ID - fallback for non-secure contexts where crypto.randomUUID isn't available
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: generate a random ID using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Reconnection configuration
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useGobert() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalCloseRef = useRef(false);

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('gobert-history');
      if (savedMessages) {
        try {
          // eslint-disable-next-line
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          // Filter out existing "completed" messages from history
          const filteredMessages = parsedMessages.filter(msg =>
            msg.content && msg.content.trim().toLowerCase() !== 'completed'
          );
          setMessages(filteredMessages);
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

    const connect = () => {
      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
        console.log('Connected to Gobert');

        // Fetch available agents and models from health endpoint
        ws.send(JSON.stringify({
          type: 'req',
          id: generateId(),
          method: 'health',
          params: {}
        }));
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from Gobert');

        // Attempt to reconnect if not intentionally closed
        if (!isIntentionalCloseRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          );
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          setError(`Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setError('Unable to connect. Please refresh the page.');
          console.error('Max reconnection attempts reached');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
        setIsConnected(false);
        // Note: onclose will be called after onerror, which will handle reconnection
      };

      ws.onmessage = (event) => {
        const text = event.data;

        // Try to parse as JSON (Moltbot protocol)
        try {
          const parsed = JSON.parse(text);

          // Ignore system events (health, tick, presence, shutdown)
          if (parsed.type === 'event') {
            const ignoredEvents = ['health', 'tick', 'presence', 'shutdown'];
            if (ignoredEvents.includes(parsed.event)) {
              // console.log(`Ignoring system event: ${parsed.event}`);
              return;
            }

            // Handle agent events (streaming responses)
            if (parsed.event === 'agent') {
              const payload = parsed.payload;
              console.log('Received agent event:', payload);

              // Extract text from the payload data
              // Based on AgentEventSchema: { stream: string, data: Record<string, any> }
              const content = payload?.data?.text || payload?.data?.chunk || payload?.data?.message;

              if (content && typeof content === 'string') {
                // Filter out "completed" messages
                if (content.trim().toLowerCase() === 'completed') return;

                const newMessage: Message = {
                  id: generateId(),
                  role: 'assistant',
                  content: content,
                  timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, newMessage]);
                setIsWaitingForResponse(false);
              }
              return;
            }
          }

          // Handle response frames (final agent response)
          if (parsed.type === 'res' && parsed.ok && parsed.payload?.summary) {
            const content = parsed.payload.summary;
            // Filter out "completed" messages
            if (content.trim().toLowerCase() === 'completed') return;

            const newMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: content,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, newMessage]);
            setIsWaitingForResponse(false);
            return;
          }

          // Handle health response (contains agents and models)
          if (parsed.type === 'res' && parsed.ok && parsed.payload) {
            // Check if this is a health response by looking for typical health fields
            if (parsed.payload.agents || parsed.payload.models || parsed.payload.version) {
              console.log('Received health response:', parsed.payload);
              console.log('Health payload keys:', Object.keys(parsed.payload));

              if (parsed.payload.agents && Array.isArray(parsed.payload.agents)) {
                console.log('Raw agents from health:', parsed.payload.agents);
                const agentList = parsed.payload.agents.map((a: { id?: string; name?: string; description?: string } | string) => {
                  if (typeof a === 'string') {
                    return { id: a, name: a };
                  }
                  // IMPORTANT: Only use a.id for the agent ID - never fall back to name
                  // The name should only be used for display purposes
                  const agentId = a.id || 'unknown';
                  const agentName = a.name || a.id || 'Unknown Agent';
                  console.log(`Mapping agent: id="${agentId}", name="${agentName}"`);
                  return { id: agentId, name: agentName, description: a.description };
                });
                // Filter out agents with 'unknown' id as they won't work
                const validAgents = agentList.filter((agent: Agent) => agent.id !== 'unknown');
                console.log('Valid agents:', validAgents);
                setAgents(validAgents);
                if (validAgents.length > 0) {
                  setSelectedAgent(validAgents[0].id);
                }
              }
              return;
            }
          }

          // Log other messages for debugging
          console.log('Unhandled message:', parsed);
        } catch (e) {
          // Not JSON, treat as plain text response
          // Filter out "completed" messages (case-insensitive)
          if (text.trim().toLowerCase() === 'completed') {
            return;
          }

          const newMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: text,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, newMessage]);
          setIsWaitingForResponse(false);
        }
      };
    };

    // Initial connection
    connect();

    return () => {
      isIntentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current && (wsRef.current.readyState === 1 || wsRef.current.readyState === 0)) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, newMessage]);
    setIsWaitingForResponse(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const agentRequest = {
        type: 'req',
        id: generateId(),
        method: 'agent',
        params: {
          agentId: selectedAgent,
          message: content,
          idempotencyKey: generateId(),
        }
      };
      wsRef.current.send(JSON.stringify(agentRequest));
    } else {
      setError('Not connected');
    }
  }, [selectedAgent]);

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
    isLoaded,
    isWaitingForResponse,
    availableAgents: agents,
    selectedAgent,
    setSelectedAgent
  };
}
