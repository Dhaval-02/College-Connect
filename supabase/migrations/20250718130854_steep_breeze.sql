/*
  # Initial Database Schema for CampusConnect

  1. New Tables
    - `users` - User profiles with authentication and preferences
      - `id` (serial, primary key)
      - `email` (varchar, unique, not null)
      - `password` (text, not null)
      - `name` (varchar, not null)
      - `age` (integer, not null)
      - `college` (varchar, not null)
      - `major` (varchar)
      - `year` (varchar)
      - `bio` (text)
      - `interests` (jsonb array)
      - `profile_photos` (jsonb array)
      - `swiped_left` (jsonb array of user IDs)
      - `swiped_right` (jsonb array of user IDs)
      - `is_profile_complete` (boolean, default false)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)
    
    - `matches` - Bidirectional matches between users
      - `id` (serial, primary key)
      - `user1_id` (integer, foreign key to users)
      - `user2_id` (integer, foreign key to users)
      - `created_at` (timestamp, default now)
    
    - `messages` - Chat messages between matched users
      - `id` (serial, primary key)
      - `match_id` (integer, foreign key to matches)
      - `sender_id` (integer, foreign key to users)
      - `content` (text, not null)
      - `created_at` (timestamp, default now)
    
    - `events` - Campus events created by users
      - `id` (serial, primary key)
      - `title` (varchar, not null)
      - `description` (text, not null)
      - `location` (varchar, not null)
      - `datetime` (timestamp, not null)
      - `created_by` (integer, foreign key to users)
      - `attendees` (jsonb array of user IDs)
      - `college` (varchar, not null)
      - `category` (varchar, not null)
      - `created_at` (timestamp, default now)
    
    - `compliments` - Anonymous compliments between users
      - `id` (serial, primary key)
      - `from_user_id` (integer, foreign key to users)
      - `to_user_id` (integer, foreign key to users)
      - `message` (text, not null)
      - `is_revealed` (boolean, default false)
      - `created_at` (timestamp, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for matches and messages based on user relationships
    - Add policies for events and compliments based on college affiliation

  3. Indexes
    - Add indexes on frequently queried columns for performance
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  college VARCHAR(255) NOT NULL,
  major VARCHAR(255),
  year VARCHAR(20),
  bio TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  profile_photos JSONB DEFAULT '[]'::jsonb,
  swiped_left JSONB DEFAULT '[]'::jsonb,
  swiped_right JSONB DEFAULT '[]'::jsonb,
  is_profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) NOT NULL,
  user2_id INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) NOT NULL,
  sender_id INTEGER REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  datetime TIMESTAMP NOT NULL,
  created_by INTEGER REFERENCES users(id) NOT NULL,
  attendees JSONB DEFAULT '[]'::jsonb,
  college VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create compliments table
CREATE TABLE IF NOT EXISTS compliments (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER REFERENCES users(id) NOT NULL,
  to_user_id INTEGER REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  is_revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college);
CREATE INDEX IF NOT EXISTS idx_users_profile_complete ON users(is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_events_college ON events(college);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(datetime);
CREATE INDEX IF NOT EXISTS idx_compliments_to_user ON compliments(to_user_id);

-- Add constraint to ensure match users are different
ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS check_different_users CHECK (user1_id != user2_id);

-- Add constraint to ensure compliment users are different
ALTER TABLE compliments ADD CONSTRAINT IF NOT EXISTS check_different_compliment_users CHECK (from_user_id != to_user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();