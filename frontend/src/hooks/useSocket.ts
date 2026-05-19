'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

export interface FeedItem {
  id: string;
  title: string;
  content: string;
  coach_name: string;
  coach_avatar: string;
  category: string;
  likes_count: number;
  created_at: string;
}

export interface SocketState {
  connected: boolean;
  reconnecting: boolean;
  attempts: number;
  socketId: string | null;
}

export function useSocket(
  onNewFeed?: (feed: FeedItem) => void,
  onFeedUpdated?: (update: { id: string; likes_count: number }) => void,
  onReconnect?: () => void
) {
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    reconnecting: false,
    attempts: 0,
    socketId: null,
  });

  const socketRef = useRef<Socket | null>(null);
  
  // Set to track processed feed IDs and prevent duplicate event processing
  const processedFeedsRef = useRef<Set<string>>(new Set());
  // Store update timestamps to prevent processing out-of-order or duplicate like updates
  const latestUpdatesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    console.log('Initializing Socket.IO connection to:', SOCKET_URL);
    
    // Create socket connection
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['polling', 'websocket'], // Start with polling (CORS-safe), then upgrade to WS
    });

    socketRef.current = socket;

    // --- SOCKET EVENT HANDLERS ---

    socket.on('connect', () => {
      console.log('Socket.IO Connected! ID:', socket.id);
      
      // If we were reconnecting previously, this is a successful reconnect
      if (socketRef.current && socketState.reconnecting && onReconnect) {
        console.log('Socket.IO successfully reconnected. Triggering onReconnect callback.');
        onReconnect();
      }

      setSocketState({
        connected: true,
        reconnecting: false,
        attempts: 0,
        socketId: socket.id || null,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO Disconnected. Reason:', reason);
      setSocketState((prev) => ({
        ...prev,
        connected: false,
        socketId: null,
        // If server disconnected it, we might be reconnecting
        reconnecting: reason === 'io server disconnect' || reason === 'transport close',
      }));
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`Socket.IO Reconnection attempt #${attempt}`);
      setSocketState((prev) => ({
        ...prev,
        reconnecting: true,
        attempts: attempt,
      }));
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket.IO Reconnection failed permanently after maximum attempts.');
      setSocketState((prev) => ({
        ...prev,
        reconnecting: false,
        connected: false,
      }));
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO Connection Error:', error.message);
      setSocketState((prev) => ({
        ...prev,
        connected: false,
        reconnecting: true,
      }));
    });

    // Receive system connection message
    socket.on('system:info', (data) => {
      console.log('System Info from Server:', data.message);
    });

    // 1. Real-time Event: New Feed Posted
    socket.on('feed:new', (feed: FeedItem) => {
      console.log('Realtime Event Received [feed:new]:', feed);
      
      // DEED DUPLICATION PREVENTION CHECK:
      // Ensure we don't trigger the callback for the same feed twice
      if (processedFeedsRef.current.has(feed.id)) {
        console.warn(`Duplicate feed event ignored for feed ID: ${feed.id}`);
        return;
      }
      
      // Add to processed set
      processedFeedsRef.current.add(feed.id);
      
      if (onNewFeed) {
        onNewFeed(feed);
      }
    });

    // 2. Real-time Event: Feed Like Updated
    socket.on('feed:updated', (update: { id: string; likes_count: number }) => {
      console.log('Realtime Event Received [feed:updated]:', update);
      
      const lastUpdateVal = latestUpdatesRef.current.get(update.id);
      
      // Prevent processing duplicate or redundant updates if they are outdated
      if (lastUpdateVal !== undefined && lastUpdateVal >= update.likes_count) {
        console.log(`Redundant feed:updated event ignored. Current state is equal or newer.`);
        return;
      }

      latestUpdatesRef.current.set(update.id, update.likes_count);
      
      if (onFeedUpdated) {
        onFeedUpdated(update);
      }
    });

    // CLEANUP ON UNMOUNT: Essential for preventing duplicate sockets & memory leaks!
    return () => {
      console.log('Cleaning up Socket.IO listeners and disconnecting...');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect_failed');
      socket.off('connect_error');
      socket.off('system:info');
      socket.off('feed:new');
      socket.off('feed:updated');
      socket.disconnect();
    };
  }, [onNewFeed, onFeedUpdated]);

  return {
    socketState,
    socket: socketRef.current,
  };
}
