import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Reusable WebSocket hook for managing connection lifecycle.
 *
 * @param {string} url — WebSocket URL to connect to
 * @param {object} options — { autoConnect, reconnectDelay, onMessage, onOpen, onClose }
 * @returns {{ sendFrame, lastFrame, connectionStatus, connect, disconnect }}
 */
export function useWebSocket(url, options = {}) {
  const {
    autoConnect = false,
    reconnectDelay = 3000,
    onMessage = null,
    onOpen = null,
    onClose = null,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [lastFrame, setLastFrame] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const intentionalCloseRef = useRef(false);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      intentionalCloseRef.current = true;
      wsRef.current.close();
    }

    clearReconnectTimeout();
    intentionalCloseRef.current = false;
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        onOpen?.();
      };

      ws.onmessage = (event) => {
        // Convert received binary data to a blob URL for display
        if (event.data instanceof ArrayBuffer) {
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const blobUrl = URL.createObjectURL(blob);
          setLastFrame((prev) => {
            // Revoke previous blob URL to prevent memory leaks
            if (prev) URL.revokeObjectURL(prev);
            return blobUrl;
          });
        }
        onMessage?.(event);
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        wsRef.current = null;
        onClose?.(event);

        // Auto-reconnect unless intentionally closed
        if (!intentionalCloseRef.current && reconnectDelay > 0) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
      };
    } catch (err) {
      setConnectionStatus('error');
    }
  }, [url, reconnectDelay, onOpen, onMessage, onClose, clearReconnectTimeout]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearReconnectTimeout();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
    // Clean up last frame blob URL
    setLastFrame((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [clearReconnectTimeout]);

  const sendFrame = useCallback((blob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      blob.arrayBuffer().then((buffer) => {
        wsRef.current?.send(buffer);
      });
    }
  }, []);

  // Auto-connect on mount if specified
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sendFrame,
    lastFrame,
    connectionStatus,
    connect,
    disconnect,
  };
}
