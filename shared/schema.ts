import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  age: integer("age").notNull(),
  college: varchar("college", { length: 255 }).notNull(),
  major: varchar("major", { length: 255 }),
  year: varchar("year", { length: 20 }),
  bio: text("bio"),
  interests: jsonb("interests").$type<string[]>().default([]),
  profilePhotos: jsonb("profile_photos").$type<string[]>().default([]),
  swipedLeft: jsonb("swiped_left").$type<number[]>().default([]),
  swipedRight: jsonb("swiped_right").$type<number[]>().default([]),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id).notNull(),
  user2Id: integer("user2_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  datetime: timestamp("datetime").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  attendees: jsonb("attendees").$type<number[]>().default([]),
  college: varchar("college", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Compliments table
export const compliments = pgTable("compliments", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  isRevealed: boolean("is_revealed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  createdEvents: many(events),
  sentCompliments: many(compliments, { relationName: "sentCompliments" }),
  receivedCompliments: many(compliments, { relationName: "receivedCompliments" }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, { fields: [matches.user1Id], references: [users.id], relationName: "user1" }),
  user2: one(users, { fields: [matches.user2Id], references: [users.id], relationName: "user2" }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, { fields: [messages.matchId], references: [matches.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
}));

export const complimentsRelations = relations(compliments, ({ one }) => ({
  fromUser: one(users, { fields: [compliments.fromUserId], references: [users.id], relationName: "sentCompliments" }),
  toUser: one(users, { fields: [compliments.toUserId], references: [users.id], relationName: "receivedCompliments" }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertComplimentSchema = createInsertSchema(compliments).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Compliment = typeof compliments.$inferSelect;
export type InsertCompliment = z.infer<typeof insertComplimentSchema>;
