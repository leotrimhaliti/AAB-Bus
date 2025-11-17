import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom WebSocket hook for real-time data connections
 * @param url - WebSocket server URL (ws:// or wss://)
 * @param options - Configuration options
 * @returns WebSocket connection state and methods
 */
export function useWebSocket(
  url?: string | null,
  options?: {
    reconnectInterval?: number;
    reconnectAttempts?: number;
    protocols?: string | string[];
  }
) {
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<{ 
    message?: (data: any) => void;
    open?: () => void;
    close?: () => void;
    error?: (error: Event) => void;
  } | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const { 
    reconnectInterval = 3000, 
    reconnectAttempts = 5,
    protocols 
  } = options || {};

  const connect = useCallback(() => {
    if (!url) {
      setReadyState(WebSocket.CLOSED);
      return;
    }

    try {
      const ws = new WebSocket(url, protocols);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected:', url);
        setReadyState(WebSocket.OPEN);
        reconnectAttemptsRef.current = 0;
        listenersRef.current?.open?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          listenersRef.current?.message?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          listenersRef.current?.message?.(event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        listenersRef.current?.error?.(error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setReadyState(WebSocket.CLOSED);
        listenersRef.current?.close?.();

        // Attempt reconnection if not manually closed
        if (
          event.code !== 1000 && 
          reconnectAttemptsRef.current < reconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `Reconnecting... (${reconnectAttemptsRef.current}/${reconnectAttempts})`
          );
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectInterval) as unknown as number;
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setReadyState(WebSocket.CLOSED);
    }
  }, [url, reconnectInterval, reconnectAttempts, protocols]);

  const send = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socketRef.current.send(message);
    } else {
      console.warn('WebSocket is not open. Cannot send message:', data);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnect');
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    disconnect,
    attach: (handlers: { 
      message?: (data: any) => void;
      open?: () => void;
      close?: () => void;
      error?: (error: Event) => void;
    }) => {
      listenersRef.current = handlers;
    },
    readyState,
    socketRef,
  };
}
