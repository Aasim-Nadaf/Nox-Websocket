import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, createdAt: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// WebSocket logic
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
}

const clients = new Map<string, ConnectedClient>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    ws.close();
    return;
  }

  // Store client connection
  clients.set(userId, { ws, userId });

  ws.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      if (parsedData.type === 'message') {
        const { senderId, receiverId, content } = parsedData;

        // Save to database
        const savedMessage = await prisma.message.create({
          data: {
            senderId,
            receiverId,
            content,
          },
        });

        const messagePayload = JSON.stringify({
          type: 'new_message',
          message: savedMessage,
        });

        // Send to receiver if online
        const receiverClient = clients.get(receiverId);
        if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
          receiverClient.ws.send(messagePayload);
        }

        // Send back to sender for confirmation/sync
        const senderClient = clients.get(senderId);
        if (senderClient && senderClient.ws.readyState === WebSocket.OPEN) {
          senderClient.ws.send(messagePayload);
        }
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
  });
});

const PORT = 5000;

async function main() {
  try {
    console.log('Connecting to MongoDB via Prisma with URL', process.env.DATABASE_URL);
    await prisma.$connect();
    console.log('Connected to MongoDB database');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

main();
