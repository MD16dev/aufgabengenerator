import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { QueueKey, QueueCounts } from '../../../server/src/services/duel/types';
import { SOCKET_URL } from '../config';

export interface DuelOpponent {
  userId: string;
  username: string;
}

export interface DuelStartPayload {
  duelId: string;
  mode: string;
  moduleId: string;
  taskTypeId: string;
  limit: number;
  opponent: DuelOpponent;
}

export interface DuelScore {
  userId: string;
  username: string;
  score: number;
}

export interface DuelTask {
  roundId: string;
  task: {
    type: string;
    mathQuery: string;
    answer: string;
    explanation?: string[];
    prompt?: string;
    inputHint?: string;
    options?: string[];
  };
}

export interface DuelFinished {
  winnerId: string;
  winnerUsername: string;
  loserId: string;
  loserUsername: string;
  eloChanges: Record<string, number>;
}

/**
 * Module-level singleton socket instance shared across all components.
 * This avoids creating/disconnecting a new socket every time a duel component
 * mounts or unmounts (which would forfeit active duels on the server).
 */
let sharedSocket: Socket | null = null;
let socketToken: string | null = null;

function getSharedSocket(): Socket | null {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  // Recreate the socket if the token changed (e.g. different user logged in)
  if (!sharedSocket || socketToken !== token) {
    if (sharedSocket) sharedSocket.disconnect();
    sharedSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });
    socketToken = token;
  }
  return sharedSocket;
}

/**
 * React hook that manages the socket.io connection for duels and exposes
 * the relevant event handlers and emit functions. Uses a shared singleton
 * socket so the connection survives component switches.
 */
export function useDuelSocket() {
  const [connected, setConnected] = useState(false);
  const [queueCounts, setQueueCounts] = useState<QueueCounts>({});

  useEffect(() => {
    const socket = getSharedSocket();
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onQueue = (counts: QueueCounts) => setQueueCounts(counts);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue:update', onQueue);

    // Sync initial state
    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:update', onQueue);
      // Do NOT disconnect the shared socket on unmount
    };
  }, []);

  const joinQueue = useCallback((key: QueueKey) => {
    getSharedSocket()?.emit('queue:join', key);
  }, []);

  const leaveQueue = useCallback(() => {
    getSharedSocket()?.emit('queue:leave');
  }, []);

  const submitAnswer = useCallback((answer: string) => {
    getSharedSocket()?.emit('duel:answer', { answer });
  }, []);

  const on = useCallback((event: string, cb: (...args: any[]) => void) => {
    getSharedSocket()?.on(event, cb);
  }, []);

  const off = useCallback((event: string, cb: (...args: any[]) => void) => {
    getSharedSocket()?.off(event, cb);
  }, []);

  return {
    connected,
    queueCounts,
    joinQueue,
    leaveQueue,
    submitAnswer,
    on,
    off,
    socket: { current: sharedSocket },
  };
}
