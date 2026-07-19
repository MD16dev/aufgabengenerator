import { Server, Socket } from 'socket.io';
import { verifyToken } from '../../utils/crypto';
import { prisma } from '../../utils/db';
import { eloFieldForModule } from './types';
import {
  initDuelManager,
  joinQueue,
  leaveAllQueues,
  submitAnswer,
  handleDisconnect,
  getQueueCounts,
} from './duelManager';
import type { QueueKey } from './types';

interface SocketUser {
  userId: string;
  username: string;
}

/**
 * Authenticate a socket connection via the JWT sent in the handshake auth.
 */
function authenticate(socket: Socket): SocketUser | null {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return null;
    const decoded = verifyToken(token);
    return { userId: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
}

export function registerDuelSocket(server: Server) {
  initDuelManager(server);

  server.on('connection', (socket: Socket) => {
    const user = authenticate(socket);
    if (!user) {
      socket.emit('duel:error', { message: 'Nicht authentifiziert.' });
      socket.disconnect(true);
      return;
    }

    // Send current queue counts on connect
    socket.emit('queue:update', getQueueCounts());

    socket.on('queue:join', async (payload: QueueKey) => {
      try {
        const eloField = eloFieldForModule(payload.moduleId);
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { [eloField]: true } as any,
        });
        const elo = (dbUser?.[eloField as keyof typeof dbUser] as unknown as number) ?? 1000;
        const result = await joinQueue(socket, payload, { ...user, elo });
        if (result.matched) {
          socket.emit('queue:matched', { duelId: result.duelId });
        } else {
          socket.emit('queue:waiting', payload);
        }
      } catch (err) {
        socket.emit('duel:error', { message: 'Fehler beim Beitreten der Warteschlange.' });
      }
    });

    socket.on('queue:leave', () => {
      leaveAllQueues(socket.id);
      socket.emit('queue:left');
    });

    socket.on('duel:answer', (payload: { answer: string }) => {
      submitAnswer(socket.id, payload.answer);
    });

    socket.on('disconnect', () => {
      handleDisconnect(socket.id);
    });
  });
}
