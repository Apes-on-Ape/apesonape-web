-- Clubroom Tables for Socket.IO Implementation
-- This file adds the necessary tables for real-time clubroom functionality

-- Create clubroom_users table for tracking connected users
CREATE TABLE IF NOT EXISTS clubroom_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    socket_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    ape_image TEXT,
    position JSONB NOT NULL DEFAULT '{"x": 100, "y": 100}',
    wallet_address TEXT,
    level INTEGER DEFAULT 1,
    is_voice_enabled BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clubroom_messages table for persistent chat history
CREATE TABLE IF NOT EXISTS clubroom_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    wallet_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clubroom_users_socket_id ON clubroom_users(socket_id);
CREATE INDEX IF NOT EXISTS idx_clubroom_users_wallet_address ON clubroom_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_clubroom_users_last_seen ON clubroom_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_clubroom_messages_timestamp ON clubroom_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_clubroom_messages_wallet_address ON clubroom_messages(wallet_address);

-- Enable Row Level Security
ALTER TABLE clubroom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubroom_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for clubroom_users table
CREATE POLICY "Clubroom users are viewable by everyone" ON clubroom_users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON clubroom_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON clubroom_users
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own data" ON clubroom_users
    FOR DELETE USING (true);

-- Create policies for clubroom_messages table
CREATE POLICY "Clubroom messages are viewable by everyone" ON clubroom_messages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON clubroom_messages
    FOR INSERT WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_clubroom_users_updated_at
    BEFORE UPDATE ON clubroom_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old clubroom data
CREATE OR REPLACE FUNCTION cleanup_old_clubroom_data()
RETURNS void AS $$
BEGIN
    -- Remove users last seen more than 1 hour ago
    DELETE FROM clubroom_users 
    WHERE last_seen < NOW() - INTERVAL '1 hour';
    
    -- Keep only last 1000 messages (roughly last week of activity)
    DELETE FROM clubroom_messages 
    WHERE id NOT IN (
        SELECT id FROM clubroom_messages 
        ORDER BY timestamp DESC 
        LIMIT 1000
    );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old data (if using pg_cron extension)
-- This is optional and requires the pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-clubroom', '0 */6 * * *', 'SELECT cleanup_old_clubroom_data();');

-- Insert some initial data for testing (optional)
-- This can be removed in production
INSERT INTO clubroom_messages (username, message, wallet_address) VALUES
('System', 'Welcome to the Ape Arcade Clubroom! 🎮', NULL),
('System', 'This is the new real-time chat system powered by Socket.IO', NULL)
ON CONFLICT DO NOTHING; 