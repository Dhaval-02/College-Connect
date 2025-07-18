import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, insertEventSchema, insertComplimentSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Simple session storage (in production, use Redis or database)
const sessions = new Map<string, { userId: number; email: string }>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; email: string };
    }
  }
}

function authenticate(req: Request, res: Response, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<number, WebSocket>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId || !sessions.has(sessionId)) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    const session = sessions.get(sessionId)!;
    clients.set(session.userId, ws);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'chat_message') {
          const { matchId, content } = message;
          
          // Save message to database
          const newMessage = await storage.createMessage({
            matchId,
            senderId: session.userId,
            content,
          });

          // Get match details to find the other user
          const match = await storage.getMatchById(matchId);
          if (match) {
            const otherUserId = match.user1Id === session.userId ? match.user2Id : match.user1Id;
            const otherUserSocket = clients.get(otherUserId);
            
            if (otherUserSocket && otherUserSocket.readyState === WebSocket.OPEN) {
              otherUserSocket.send(JSON.stringify({
                type: 'new_message',
                message: {
                  ...newMessage,
                  sender: await storage.getUserById(session.userId),
                },
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(session.userId);
    });
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await storage.createUser(userData);
      const sessionId = generateSessionId();
      sessions.set(sessionId, { userId: user.id, email: user.email });

      res.json({ 
        user: { ...user, password: undefined }, 
        sessionId 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const sessionId = generateSessionId();
      sessions.set(sessionId, { userId: user.id, email: user.email });

      res.json({ 
        user: { ...user, password: undefined }, 
        sessionId 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', authenticate, (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: 'Logged out successfully' });
  });

  app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // User profile routes
  app.put('/api/users/profile', authenticate, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.user.userId, updates);
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({ message: 'Profile update failed' });
    }
  });

  app.post('/api/users/upload-photo', authenticate, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const photoUrl = `/uploads/${req.file.filename}`;
      const user = await storage.getUserById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const profilePhotos = [...(user.profilePhotos || []), photoUrl];
      await storage.updateUser(req.user.userId, { profilePhotos });
      
      res.json({ photoUrl });
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({ message: 'Photo upload failed' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(uploadsDir));

  // Swiping routes
  app.get('/api/swipe/potential-matches', authenticate, async (req, res) => {
    try {
      const matches = await storage.getPotentialMatches(req.user.userId);
      res.json(matches.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      console.error('Get potential matches error:', error);
      res.status(500).json({ message: 'Failed to get potential matches' });
    }
  });

  app.post('/api/swipe/:targetUserId', authenticate, async (req, res) => {
    try {
      const targetUserId = parseInt(req.params.targetUserId);
      const { isRightSwipe } = req.body;
      
      await storage.updateUserSwipes(req.user.userId, targetUserId, isRightSwipe);
      
      if (isRightSwipe) {
        // Check if the other user also swiped right
        const targetUser = await storage.getUserById(targetUserId);
        if (targetUser && targetUser.swipedRight?.includes(req.user.userId)) {
          // Create a match
          const match = await storage.createMatch({
            user1Id: req.user.userId,
            user2Id: targetUserId,
          });
          return res.json({ match: true, matchId: match.id });
        }
      }
      
      res.json({ match: false });
    } catch (error) {
      console.error('Swipe error:', error);
      res.status(500).json({ message: 'Swipe failed' });
    }
  });

  // Match routes
  app.get('/api/matches', authenticate, async (req, res) => {
    try {
      const matches = await storage.getMatchesForUser(req.user.userId);
      res.json(matches.map(match => ({
        ...match,
        otherUser: { ...match.otherUser, password: undefined }
      })));
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({ message: 'Failed to get matches' });
    }
  });

  // Message routes
  app.get('/api/matches/:matchId/messages', authenticate, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const messages = await storage.getMessagesForMatch(matchId);
      res.json(messages.map(msg => ({
        ...msg,
        sender: { ...msg.sender, password: undefined }
      })));
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  app.post('/api/matches/:matchId/messages', authenticate, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const messageData = insertMessageSchema.parse({
        matchId,
        senderId: req.user.userId,
        content: req.body.content,
      });
      
      const message = await storage.createMessage(messageData);
      const sender = await storage.getUserById(req.user.userId);
      
      res.json({
        ...message,
        sender: { ...sender, password: undefined }
      });
    } catch (error) {
      console.error('Create message error:', error);
      res.status(400).json({ message: 'Failed to create message' });
    }
  });

  // Event routes
  app.get('/api/events', authenticate, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const events = await storage.getEventsForCollege(user.college);
      res.json(events.map(event => ({
        ...event,
        creator: { ...event.creator, password: undefined }
      })));
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ message: 'Failed to get events' });
    }
  });

  app.post('/api/events', authenticate, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const eventData = insertEventSchema.parse({
        ...req.body,
        createdBy: req.user.userId,
        college: user.college,
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(400).json({ message: 'Failed to create event' });
    }
  });

  app.post('/api/events/:eventId/join', authenticate, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      await storage.joinEvent(eventId, req.user.userId);
      res.json({ message: 'Joined event successfully' });
    } catch (error) {
      console.error('Join event error:', error);
      res.status(500).json({ message: 'Failed to join event' });
    }
  });

  app.post('/api/events/:eventId/leave', authenticate, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      await storage.leaveEvent(eventId, req.user.userId);
      res.json({ message: 'Left event successfully' });
    } catch (error) {
      console.error('Leave event error:', error);
      res.status(500).json({ message: 'Failed to leave event' });
    }
  });

  // Compliment routes
  app.get('/api/compliments', authenticate, async (req, res) => {
    try {
      const compliments = await storage.getComplimentsForUser(req.user.userId);
      res.json(compliments.map(compliment => ({
        ...compliment,
        fromUser: compliment.isRevealed ? { ...compliment.fromUser, password: undefined } : null
      })));
    } catch (error) {
      console.error('Get compliments error:', error);
      res.status(500).json({ message: 'Failed to get compliments' });
    }
  });

  app.get('/api/compliments/users', authenticate, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const users = await storage.getUsersForCompliments(user.college, req.user.userId);
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      console.error('Get compliment users error:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  app.post('/api/compliments', authenticate, async (req, res) => {
    try {
      const complimentData = insertComplimentSchema.parse({
        ...req.body,
        fromUserId: req.user.userId,
      });
      
      const compliment = await storage.createCompliment(complimentData);
      res.json(compliment);
    } catch (error) {
      console.error('Create compliment error:', error);
      res.status(400).json({ message: 'Failed to create compliment' });
    }
  });

  return httpServer;
}

// Health check endpoint for deployment platforms
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
