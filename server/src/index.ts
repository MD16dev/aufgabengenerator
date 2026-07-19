import app from './app';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { registerDuelSocket } from './services/duel/socketHandler';

dotenv.config();

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

registerDuelSocket(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
