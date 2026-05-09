import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

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

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, bio } = req.body;
    
    const updateData: any = {};

    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== id) {
        res.status(400).json({ error: 'Username already taken' });
        return;
      }
      updateData.username = username;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json({ id: updatedUser.id, username: updatedUser.username, bio: updatedUser.bio });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    if (!name || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'Name and participants are required' });
    }

    const group = await prisma.group.create({
      data: { name, participantIds }
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.get('/api/chats/:userId', async (req, res) => {
  console.log(`[API] GET /api/chats/${req.params.userId}`);
  try {
    const { userId } = req.params;
    const isValidId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!isValidId) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    // Fetch all other users
    const otherUsers = await prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, username: true, bio: true, isOnline: true, lastSeen: true },
    });

    const directChatsList = await Promise.all(
      otherUsers.map(async (user) => {
        // Find the most recent message between currentUser and this user
        const lastMessage = await prisma.message.findFirst({
          where: {
            groupId: null,
            OR: [
              { senderId: userId, receiverId: user.id },
              { senderId: user.id, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          type: 'direct',
          user,
          lastMessage,
        };
      })
    );

    // Fetch user groups
    const userGroups = await prisma.group.findMany({
      where: { participantIds: { has: userId } }
    });

    const groupsList = await Promise.all(
      userGroups.map(async (group) => {
        const lastMessage = await prisma.message.findFirst({
          where: { groupId: group.id },
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { username: true } } }
        });

        return {
          type: 'group',
          group,
          lastMessage,
        };
      })
    );

    const chatsList = [...directChatsList, ...groupsList];

    // Sort chats by most recent message, and push users with no messages to the bottom
    chatsList.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    res.json(chatsList);
  } catch (error) {
    console.error('Error in GET /api/chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.get('/api/messages/group/:groupId', async (req, res) => {
  console.log(`[API] GET /api/messages/group/${req.params.groupId}`);
  try {
    const { groupId } = req.params;
    const isValidGroupId = /^[0-9a-fA-F]{24}$/.test(groupId);
    if (!isValidGroupId) {
      return res.status(400).json({ error: 'Invalid Group ID format' });
    }
    const messages = await prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, username: true } } }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error in GET /api/messages/group:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
  console.log(`[API] GET /api/messages/${req.params.userId}/${req.params.otherUserId}`);
  try {
    const { userId, otherUserId } = req.params;
    const isValidUserId = /^[0-9a-fA-F]{24}$/.test(userId);
    const isValidOtherId = /^[0-9a-fA-F]{24}$/.test(otherUserId);
    if (!isValidUserId || !isValidOtherId) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }
    const messages = await prisma.message.findMany({
      where: {
        groupId: null,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// WebSocket logic
interface ConnectedClient {
  ws: WebSocket;
  userId: string;
}

const clients = new Map<string, ConnectedClient>();

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    ws.close();
    return;
  }

  // Store client connection
  clients.set(userId, { ws, userId });

  // Set user as online
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });
  } catch (error) {
    console.error(`Failed to set user ${userId} online:`, error);
  }

  // Broadcast to all clients
  const statusPayload = JSON.stringify({
    type: 'status_change',
    userId,
    isOnline: true,
  });
  clients.forEach((client) => {
    if (client.userId !== userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(statusPayload);
    }
  });

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
            status: "SENT"
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
      } else if (parsedData.type === 'group_message') {
        const { senderId, groupId, content } = parsedData;

        const group = await prisma.group.findUnique({
          where: { id: groupId }
        });
        if (!group) return;

        const savedMessage = await prisma.message.create({
          data: {
            senderId,
            groupId,
            content,
            status: "SENT"
          },
          include: { sender: { select: { username: true } } }
        });

        const messagePayload = JSON.stringify({
          type: 'new_group_message',
          message: savedMessage,
          groupId
        });

        // Broadcast to all participants
        group.participantIds.forEach(pId => {
          const client = clients.get(pId);
          if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(messagePayload);
          }
        });
      } else if (parsedData.type === 'typing' || parsedData.type === 'stop_typing') {
        const { senderId, receiverId } = parsedData;
        const typingPayload = JSON.stringify({
          type: parsedData.type,
          senderId,
        });

        // Forward type status to receiver if online
        const receiverClient = clients.get(receiverId);
        if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
          receiverClient.ws.send(typingPayload);
        }
      } else if (parsedData.type === 'message_read') {
        const { messageIds, readerId, senderId } = parsedData;
        
        if (messageIds && messageIds.length > 0) {
          await prisma.message.updateMany({
            where: { id: { in: messageIds }, receiverId: readerId },
            data: { status: 'READ' }
          });

          const statusPayload = JSON.stringify({
            type: 'message_status_update',
            messageIds,
            status: 'READ'
          });

          const senderClient = clients.get(senderId);
          if (senderClient && senderClient.ws.readyState === WebSocket.OPEN) {
            senderClient.ws.send(statusPayload);
          }
        }
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', async () => {
    clients.delete(userId);
    const lastSeen = new Date();
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen },
      });
    } catch (error) {
      console.error(`Failed to set user ${userId} offline:`, error);
    }

    const statusPayload = JSON.stringify({
      type: 'status_change',
      userId,
      isOnline: false,
      lastSeen,
    });
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(statusPayload);
      }
    });
  });
});

const PORT = Number(process.env.PORT) || 5000;

async function main() {
  try {
    console.log('Connecting to MongoDB via Prisma with URL', process.env.DATABASE_URL);
    await prisma.$connect();
    console.log('Connected to MongoDB database');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

main();
