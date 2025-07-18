import { users, matches, messages, events, compliments, type User, type InsertUser, type Match, type InsertMatch, type Message, type InsertMessage, type Event, type InsertEvent, type Compliment, type InsertCompliment } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, not, inArray, desc, asc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserSwipes(userId: number, swipedUserId: number, isRightSwipe: boolean): Promise<void>;
  getPotentialMatches(userId: number): Promise<User[]>;
  
  // Match operations
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchesForUser(userId: number): Promise<(Match & { otherUser: User })[]>;
  getMatchById(id: number): Promise<Match | undefined>;
  checkExistingMatch(user1Id: number, user2Id: number): Promise<Match | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesForMatch(matchId: number): Promise<(Message & { sender: User })[]>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsForCollege(college: string): Promise<(Event & { creator: User })[]>;
  joinEvent(eventId: number, userId: number): Promise<void>;
  leaveEvent(eventId: number, userId: number): Promise<void>;
  
  // Compliment operations
  createCompliment(compliment: InsertCompliment): Promise<Compliment>;
  getComplimentsForUser(userId: number): Promise<(Compliment & { fromUser: User })[]>;
  getUsersForCompliments(college: string, excludeUserId: number): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSwipes(userId: number, swipedUserId: number, isRightSwipe: boolean): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const swipedLeft = user.swipedLeft || [];
    const swipedRight = user.swipedRight || [];

    if (isRightSwipe) {
      swipedRight.push(swipedUserId);
    } else {
      swipedLeft.push(swipedUserId);
    }

    await db
      .update(users)
      .set({
        swipedLeft,
        swipedRight,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getPotentialMatches(userId: number): Promise<User[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    const swipedUsers = [...(user.swipedLeft || []), ...(user.swipedRight || [])];
    const excludeUsers = [...swipedUsers, userId];

    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.college, user.college),
          not(inArray(users.id, excludeUsers)),
          eq(users.isProfileComplete, true)
        )
      )
      .limit(10);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }

  async getMatchesForUser(userId: number): Promise<(Match & { otherUser: User })[]> {
    const userMatches = await db
      .select()
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
      .orderBy(desc(matches.createdAt));

    const matchesWithOtherUser = [];
    for (const match of userMatches) {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = await this.getUserById(otherUserId);
      if (otherUser) {
        matchesWithOtherUser.push({ ...match, otherUser });
      }
    }

    return matchesWithOtherUser;
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async checkExistingMatch(user1Id: number, user2Id: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(
        or(
          and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)),
          and(eq(matches.user1Id, user2Id), eq(matches.user2Id, user1Id))
        )
      );
    return match;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesForMatch(matchId: number): Promise<(Message & { sender: User })[]> {
    const matchMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(asc(messages.createdAt));

    const messagesWithSender = [];
    for (const message of matchMessages) {
      const sender = await this.getUserById(message.senderId);
      if (sender) {
        messagesWithSender.push({ ...message, sender });
      }
    }

    return messagesWithSender;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEventsForCollege(college: string): Promise<(Event & { creator: User })[]> {
    const collegeEvents = await db
      .select()
      .from(events)
      .where(eq(events.college, college))
      .orderBy(asc(events.datetime));

    const eventsWithCreator = [];
    for (const event of collegeEvents) {
      const creator = await this.getUserById(event.createdBy);
      if (creator) {
        eventsWithCreator.push({ ...event, creator });
      }
    }

    return eventsWithCreator;
  }

  async joinEvent(eventId: number, userId: number): Promise<void> {
    const event = await db.select().from(events).where(eq(events.id, eventId));
    if (!event[0]) throw new Error("Event not found");

    const attendees = event[0].attendees || [];
    if (!attendees.includes(userId)) {
      attendees.push(userId);
      await db
        .update(events)
        .set({ attendees })
        .where(eq(events.id, eventId));
    }
  }

  async leaveEvent(eventId: number, userId: number): Promise<void> {
    const event = await db.select().from(events).where(eq(events.id, eventId));
    if (!event[0]) throw new Error("Event not found");

    const attendees = (event[0].attendees || []).filter(id => id !== userId);
    await db
      .update(events)
      .set({ attendees })
      .where(eq(events.id, eventId));
  }

  async createCompliment(compliment: InsertCompliment): Promise<Compliment> {
    const [newCompliment] = await db.insert(compliments).values(compliment).returning();
    return newCompliment;
  }

  async getComplimentsForUser(userId: number): Promise<(Compliment & { fromUser: User })[]> {
    const userCompliments = await db
      .select()
      .from(compliments)
      .where(eq(compliments.toUserId, userId))
      .orderBy(desc(compliments.createdAt));

    const complimentsWithFromUser = [];
    for (const compliment of userCompliments) {
      const fromUser = await this.getUserById(compliment.fromUserId);
      if (fromUser) {
        complimentsWithFromUser.push({ ...compliment, fromUser });
      }
    }

    return complimentsWithFromUser;
  }

  async getUsersForCompliments(college: string, excludeUserId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.college, college),
          not(eq(users.id, excludeUserId)),
          eq(users.isProfileComplete, true)
        )
      );
  }
}

export const storage = new DatabaseStorage();
