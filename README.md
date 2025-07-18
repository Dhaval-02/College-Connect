# CampusConnect

A mobile-first dating and social connection app exclusively for college students.

## Features

- 🎓 **Campus Exclusive**: Connect only with verified students from your university
- 💕 **Smart Matching**: Swipe-based matching system with real-time notifications
- 💬 **Real-time Chat**: WebSocket-powered messaging between matched users
- 📅 **Campus Events**: Create and join local events and study groups
- ✨ **Anonymous Compliments**: Send and receive anonymous compliments
- 🔒 **Safe & Secure**: Advanced safety features and user verification

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket for live chat
- **UI**: Tailwind CSS + shadcn/ui components
- **Authentication**: Session-based with bcrypt

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd campusconnect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database URL and other configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/campusconnect
SESSION_SECRET=your-super-secret-session-key
PORT=5000
```

4. Set up the database:
```bash
# Run migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Deployment

### Using Docker

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

Make sure to set your environment variables in the Vercel dashboard.

### Deploy to Railway

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Environment Variables

Required environment variables for production:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption
- `NODE_ENV`: Set to "production"
- `PORT`: Port number (default: 5000)

Optional:
- `MAX_FILE_SIZE`: Maximum file upload size in bytes
- `UPLOAD_DIR`: Directory for file uploads
- `ALLOWED_ORIGINS`: CORS allowed origins

## Database Schema

The app uses PostgreSQL with the following main tables:

- **users**: User profiles and authentication
- **matches**: Bidirectional relationships between users
- **messages**: Chat messages between matched users
- **events**: Campus events created by users
- **compliments**: Anonymous compliments between users

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User Profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-photo` - Upload profile photo

### Swiping & Matching
- `GET /api/swipe/potential-matches` - Get potential matches
- `POST /api/swipe/:userId` - Swipe on a user
- `GET /api/matches` - Get user's matches

### Messaging
- `GET /api/matches/:matchId/messages` - Get messages for a match
- `POST /api/matches/:matchId/messages` - Send a message

### Events
- `GET /api/events` - Get campus events
- `POST /api/events` - Create new event
- `POST /api/events/:eventId/join` - Join an event

### Compliments
- `GET /api/compliments` - Get received compliments
- `POST /api/compliments` - Send a compliment
- `GET /api/compliments/users` - Get users for compliments

## Development

### Database Operations

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.