# CampusConnect - Replit Project Guide

## Overview

CampusConnect is a mobile-first dating and social connection app exclusively for college students. The application provides a safe environment for students to meet, match, and build meaningful connections within their university community. The app features a modern swiping interface, real-time chat, campus events, and a compliments system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for fast development and building
- **Router**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket server for live chat functionality
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **File Uploads**: Multer middleware for handling profile photo uploads

### Database Design
The application uses PostgreSQL with the following main entities:
- **Users**: Profile information, preferences, and swipe history
- **Matches**: Bidirectional relationships between users who liked each other
- **Messages**: Chat messages between matched users
- **Events**: Campus events created by users
- **Compliments**: Anonymous compliments between users

## Key Components

### Authentication System
- Session-based authentication with secure token storage
- Password hashing using bcrypt
- Protected routes and API endpoints
- User profile completion flow

### Swiping Interface
- Card-based UI with smooth animations
- Swipe gestures for like/dislike actions
- Automatic match detection when mutual likes occur
- Real-time match notifications

### Real-time Chat
- WebSocket-based messaging system
- Message history persistence
- Online status indicators
- Match-specific chat rooms

### Campus Events
- User-created events with categories
- Location-based event discovery
- RSVP functionality
- Event creator profiles

### Compliments System
- Anonymous compliment sending
- College-specific user discovery
- Character limits and validation

## Data Flow

1. **User Registration**: New users sign up with college email verification
2. **Profile Setup**: Users complete their profile with photos, bio, and interests
3. **Discovery**: Users see potential matches from their college, excluding already swiped profiles
4. **Matching**: When two users swipe right on each other, a match is created
5. **Communication**: Matched users can chat in real-time via WebSocket connections
6. **Events**: Users can create and join campus events
7. **Compliments**: Users can send anonymous compliments to other students

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database provider
- **Drizzle ORM**: Type-safe database operations and migrations
- **Connection Pooling**: Efficient database connection management

### UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Dynamic class name generation

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Build Process
- **Client Build**: Vite builds the React application to `dist/public`
- **Server Build**: ESBuild bundles the Express server to `dist/index.js`
- **Database**: Drizzle handles schema migrations and database provisioning

### Environment Configuration
- **Development**: Uses tsx for TypeScript execution and Vite dev server
- **Production**: Node.js serves the bundled application with static file serving
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### File Structure
```
├── client/          # React frontend application
├── server/          # Express backend application
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Database migration files
└── dist/           # Built application files
```

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling type safety across the entire stack while maintaining development efficiency.