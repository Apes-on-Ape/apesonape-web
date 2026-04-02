-- Block Dodger Database Integration Script
-- This script runs both the arcade platform setup and block dodger specific tables

-- First run the arcade_database_setup.sql contents
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    block_dodger_score INTEGER DEFAULT 0,
    neon_racer_score INTEGER DEFAULT 0,
    ape_man_score INTEGER DEFAULT 0,
    flappy_ape_score INTEGER DEFAULT 0,
    galaxy_ape_score INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    selected_ape JSONB,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    total_games_played INTEGER DEFAULT 0,
    block_dodger_games INTEGER DEFAULT 0,
    neon_racer_games INTEGER DEFAULT 0,
    ape_man_games INTEGER DEFAULT 0,
    flappy_ape_games INTEGER DEFAULT 0,
    galaxy_ape_games INTEGER DEFAULT 0,
    clubroom_visits INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    reactions_sent INTEGER DEFAULT 0,
    nft_count INTEGER DEFAULT 0,
    first_game_played TIMESTAMP WITH TIME ZONE,
    last_game_played TIMESTAMP WITH TIME ZONE
);

-- Create game_scores table for historical scores
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (wallet_address, game_id),
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_scores_wallet ON game_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS game_scores_wallet_game_idx ON game_scores(wallet_address, game_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (true);

-- Create policies for game_scores table
CREATE POLICY "Game scores are viewable by everyone" ON game_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" ON game_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own scores" ON game_scores
    FOR UPDATE USING (true);

-- Create function to update user's total points
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET total_points = COALESCE(block_dodger_score, 0) + 
                      COALESCE(neon_racer_score, 0) + 
                      COALESCE(ape_man_score, 0) + 
                      COALESCE(flappy_ape_score, 0) +
                      COALESCE(galaxy_ape_score, 0)
    WHERE wallet_address = NEW.wallet_address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update total points when individual game scores are updated
CREATE TRIGGER update_total_points_trigger
    AFTER UPDATE OF block_dodger_score, neon_racer_score, ape_man_score, flappy_ape_score, galaxy_ape_score
    ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_total_points();

-- Create function to update the appropriate game score when a new score is added
CREATE OR REPLACE FUNCTION update_game_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Check the game_id and update the appropriate score column if the new score is higher
    IF NEW.game_id = 'block_dodger' THEN
        UPDATE users
        SET block_dodger_score = NEW.score
        WHERE wallet_address = NEW.wallet_address 
          AND (block_dodger_score IS NULL OR NEW.score > block_dodger_score);
    ELSIF NEW.game_id = 'neon_racer' THEN
        UPDATE users
        SET neon_racer_score = NEW.score
        WHERE wallet_address = NEW.wallet_address 
          AND (neon_racer_score IS NULL OR NEW.score > neon_racer_score);
    ELSIF NEW.game_id = 'ape_man' OR NEW.game_id = 'pacman' THEN
        -- Handle both ape_man and pacman game IDs for the same score
        UPDATE users
        SET ape_man_score = NEW.score
        WHERE wallet_address = NEW.wallet_address 
          AND (ape_man_score IS NULL OR NEW.score > ape_man_score);
    ELSIF NEW.game_id = 'flappy_ape' THEN
        UPDATE users
        SET flappy_ape_score = NEW.score
        WHERE wallet_address = NEW.wallet_address 
          AND (flappy_ape_score IS NULL OR NEW.score > flappy_ape_score);
    ELSIF NEW.game_id = 'galaxy_ape' OR NEW.game_id = 'run_ape' THEN
        -- Handle both galaxy_ape and run_ape game IDs for backward compatibility
        UPDATE users
        SET galaxy_ape_score = NEW.score
        WHERE wallet_address = NEW.wallet_address 
          AND (galaxy_ape_score IS NULL OR NEW.score > galaxy_ape_score);
    END IF;
    
    -- The update_total_points trigger will automatically run after the above UPDATE
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new scores
CREATE TRIGGER after_insert_score
    AFTER INSERT ON game_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_game_score();

-- Create trigger for updated scores
CREATE TRIGGER after_update_score
    AFTER UPDATE OF score ON game_scores
    FOR EACH ROW
    WHEN (NEW.score > OLD.score)
    EXECUTE FUNCTION update_game_score();

-- Now run the block dodger specific tables setup

-- Function to create the user_upgrades table
CREATE OR REPLACE FUNCTION create_user_upgrades_table() 
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_upgrades (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    game_id TEXT NOT NULL,
    upgrades JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (wallet_address, game_id)
  );
  
  -- Add foreign key to users table
  BEGIN
    ALTER TABLE user_upgrades ADD CONSTRAINT fk_user_upgrades_wallet_address
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Foreign key constraint already exists or users table not found';
  END;
  
  CREATE INDEX IF NOT EXISTS user_upgrades_wallet_address_idx ON user_upgrades(wallet_address);
  CREATE INDEX IF NOT EXISTS user_upgrades_game_id_idx ON user_upgrades(game_id);
  
  ALTER TABLE user_upgrades ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow select access for user_upgrades" ON user_upgrades;
  CREATE POLICY "Allow select access for user_upgrades" ON user_upgrades
    FOR SELECT USING (true);
    
  DROP POLICY IF EXISTS "Allow insert access for user_upgrades" ON user_upgrades;
  CREATE POLICY "Allow insert access for user_upgrades" ON user_upgrades
    FOR INSERT WITH CHECK (true);
    
  DROP POLICY IF EXISTS "Allow update access for user_upgrades" ON user_upgrades;
  CREATE POLICY "Allow update access for user_upgrades" ON user_upgrades
    FOR UPDATE USING (true);
END;
$$ LANGUAGE plpgsql;

-- Function to create the user_powerups table
CREATE OR REPLACE FUNCTION create_user_powerups_table() 
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_powerups (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    game_id TEXT NOT NULL,
    powerups JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (wallet_address, game_id)
  );
  
  -- Add foreign key to users table
  BEGIN
    ALTER TABLE user_powerups ADD CONSTRAINT fk_user_powerups_wallet_address
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Foreign key constraint already exists or users table not found';
  END;
  
  CREATE INDEX IF NOT EXISTS user_powerups_wallet_address_idx ON user_powerups(wallet_address);
  CREATE INDEX IF NOT EXISTS user_powerups_game_id_idx ON user_powerups(game_id);
  
  ALTER TABLE user_powerups ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow select access for user_powerups" ON user_powerups;
  CREATE POLICY "Allow select access for user_powerups" ON user_powerups
    FOR SELECT USING (true);
    
  DROP POLICY IF EXISTS "Allow insert access for user_powerups" ON user_powerups;
  CREATE POLICY "Allow insert access for user_powerups" ON user_powerups
    FOR INSERT WITH CHECK (true);
    
  DROP POLICY IF EXISTS "Allow update access for user_powerups" ON user_powerups;
  CREATE POLICY "Allow update access for user_powerups" ON user_powerups
    FOR UPDATE USING (true);
END;
$$ LANGUAGE plpgsql;

-- Function to create the user_selected_powerup table
CREATE OR REPLACE FUNCTION create_user_selected_powerup_table() 
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_selected_powerup (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    game_id TEXT NOT NULL,
    powerup_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (wallet_address, game_id)
  );
  
  -- Add foreign key to users table
  BEGIN
    ALTER TABLE user_selected_powerup ADD CONSTRAINT fk_user_selected_powerup_wallet_address
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Foreign key constraint already exists or users table not found';
  END;
  
  CREATE INDEX IF NOT EXISTS user_selected_powerup_wallet_address_idx ON user_selected_powerup(wallet_address);
  CREATE INDEX IF NOT EXISTS user_selected_powerup_game_id_idx ON user_selected_powerup(game_id);
  
  ALTER TABLE user_selected_powerup ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Allow select access for user_selected_powerup" ON user_selected_powerup;
  CREATE POLICY "Allow select access for user_selected_powerup" ON user_selected_powerup
    FOR SELECT USING (true);
    
  DROP POLICY IF EXISTS "Allow insert access for user_selected_powerup" ON user_selected_powerup;
  CREATE POLICY "Allow insert access for user_selected_powerup" ON user_selected_powerup
    FOR INSERT WITH CHECK (true);
    
  DROP POLICY IF EXISTS "Allow update access for user_selected_powerup" ON user_selected_powerup;
  CREATE POLICY "Allow update access for user_selected_powerup" ON user_selected_powerup
    FOR UPDATE USING (true);
END;
$$ LANGUAGE plpgsql;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirements JSONB NOT NULL,
    reward_xp INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table to track unlocked achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (wallet_address, achievement_id),
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_wallet ON user_achievements(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- Enable Row Level Security for achievements tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements table
CREATE POLICY "Achievements are viewable by everyone" ON achievements
    FOR SELECT USING (true);

-- Create policies for user_achievements table
CREATE POLICY "User achievements are viewable by everyone" ON user_achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (true);

-- Function to calculate required XP for a level
CREATE OR REPLACE FUNCTION get_required_xp_for_level(level_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Exponential curve: level 1 = 0 XP, level 2 = 100 XP, level 3 = 250 XP, etc.
    IF level_num <= 1 THEN
        RETURN 0;
    END IF;
    
    -- Formula: (level - 1)^2 * 50 + (level - 1) * 100
    RETURN POWER(level_num - 1, 2) * 50 + (level_num - 1) * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate level from experience
CREATE OR REPLACE FUNCTION get_level_from_experience(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    level_num INTEGER := 1;
    required_xp INTEGER := 0;
BEGIN
    -- Start from level 1 and work up
    WHILE level_num <= 100 LOOP
        required_xp := get_required_xp_for_level(level_num + 1);
        IF xp < required_xp THEN
            RETURN level_num;
        END IF;
        level_num := level_num + 1;
    END LOOP;
    
    -- Maximum level is 100
    RETURN 100;
END;
$$ LANGUAGE plpgsql;

-- Function to add experience and update level
CREATE OR REPLACE FUNCTION add_experience(user_wallet TEXT, xp_amount INTEGER)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN, total_xp INTEGER) AS $$
DECLARE
    old_level INTEGER;
    new_xp INTEGER;
    calculated_level INTEGER;
    did_level_up BOOLEAN := FALSE;
BEGIN
    -- Get current level and XP
    SELECT level, experience INTO old_level, new_xp
    FROM users WHERE wallet_address = user_wallet;
    
    -- Add experience
    new_xp := new_xp + xp_amount;
    
    -- Calculate new level
    calculated_level := get_level_from_experience(new_xp);
    
    -- Check if leveled up
    IF calculated_level > old_level THEN
        did_level_up := TRUE;
    END IF;
    
    -- Update user
    UPDATE users 
    SET experience = new_xp, level = calculated_level 
    WHERE wallet_address = user_wallet;
    
    -- Return results
    RETURN QUERY SELECT calculated_level, did_level_up, new_xp;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(user_wallet TEXT)
RETURNS TABLE(achievement_id TEXT, achievement_name TEXT, reward_xp INTEGER) AS $$
DECLARE
    user_data RECORD;
    achievement RECORD;
    requirement RECORD;
    meets_requirement BOOLEAN;
BEGIN
    -- Get user data
    SELECT * INTO user_data FROM users WHERE wallet_address = user_wallet;
    
    -- Check each achievement
    FOR achievement IN SELECT * FROM achievements WHERE id NOT IN (
        SELECT achievement_id FROM user_achievements WHERE wallet_address = user_wallet
    ) LOOP
        meets_requirement := TRUE;
        
        -- Check requirements (this is a simplified version)
        -- In practice, you'd parse the JSONB requirements and check each condition
        
        -- For now, we'll check some basic requirements
        IF achievement.id LIKE 'first_%' AND user_data.total_games_played < 1 THEN
            meets_requirement := FALSE;
        END IF;
        
        IF achievement.id LIKE 'score_%' THEN
            -- Extract score requirement from achievement ID and check
            CONTINUE;
        END IF;
        
        -- If requirements are met, unlock achievement
        IF meets_requirement THEN
            INSERT INTO user_achievements (wallet_address, achievement_id)
            VALUES (user_wallet, achievement.id)
            ON CONFLICT DO NOTHING;
            
            -- Award XP
            PERFORM add_experience(user_wallet, achievement.reward_xp);
            
            RETURN QUERY SELECT achievement.id, achievement.name, achievement.reward_xp;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the functions to create the tables
SELECT create_user_upgrades_table();
SELECT create_user_powerups_table();
SELECT create_user_selected_powerup_table();

-- Insert achievements data
INSERT INTO achievements (id, name, description, category, icon, requirements, reward_xp, is_hidden) VALUES
-- Welcome & First Steps (10 achievements)
('welcome', 'Welcome to the Jungle!', 'Join the Ape Arcade for the first time', 'Welcome', '🌴', '{"action": "join_arcade"}', 50, false),
('first_game', 'Game On!', 'Play your first arcade game', 'First Steps', '🎮', '{"total_games_played": 1}', 100, false),
('first_clubroom', 'Social Ape', 'Enter the clubroom for the first time', 'First Steps', '🏠', '{"clubroom_visits": 1}', 75, false),
('profile_setup', 'Identity Crisis', 'Set up your profile and username', 'First Steps', '👤', '{"has_username": true}', 25, false),
('first_score', 'Points on the Board', 'Score your first points in any game', 'First Steps', '📈', '{"any_score": 1}', 50, false),
('first_death', 'Learning Experience', 'Die for the first time in any game', 'First Steps', '💀', '{"total_deaths": 1}', 25, false),
('nft_connect', 'Digital Ape', 'Connect your first NFT ape', 'First Steps', '🖼️', '{"has_nft": true}', 100, false),
('first_reaction', 'Express Yourself', 'Send your first emoji reaction in clubroom', 'First Steps', '😊', '{"reactions_sent": 1}', 25, false),
('first_chat', 'Breaking the Ice', 'Send your first message in clubroom chat', 'First Steps', '💬', '{"messages_sent": 1}', 50, false),
('settings_master', 'Fine Tuning', 'Access game settings for the first time', 'First Steps', '⚙️', '{"accessed_settings": true}', 25, false),

-- Game Master Achievements (20 achievements)
('block_dodger_master', 'Block Dodger Champion', 'Play Block Dodger 50 times', 'Game Master', '🟦', '{"block_dodger_games": 50}', 500, false),
('neon_racer_master', 'Neon Speed Demon', 'Play Neon Racer 50 times', 'Game Master', '🏎️', '{"neon_racer_games": 50}', 500, false),
('ape_man_master', 'Pac-Ape Legend', 'Play Ape-Man 50 times', 'Game Master', '🦍', '{"ape_man_games": 50}', 500, false),
('flappy_ape_master', 'Flappy Master', 'Play Flappy Ape 50 times', 'Game Master', '🐦', '{"flappy_ape_games": 50}', 500, false),
('galaxy_ape_master', 'Space Explorer', 'Play Galaxy Ape 50 times', 'Game Master', '🚀', '{"galaxy_ape_games": 50}', 500, false),
('game_completionist', 'All-Rounder', 'Play every game at least 10 times', 'Game Master', '🎯', '{"min_all_games": 10}', 1000, false),
('hundred_games', 'Century Player', 'Play 100 games total', 'Game Master', '💯', '{"total_games_played": 100}', 750, false),
('marathon_gamer', 'Marathon Ape', 'Play 250 games total', 'Game Master', '🏃', '{"total_games_played": 250}', 1500, false),
('thousand_games', 'Legendary Gamer', 'Play 1000 games total', 'Game Master', '👑', '{"total_games_played": 1000}', 5000, false),
('daily_player', 'Daily Habit', 'Play games for 7 consecutive days', 'Game Master', '📅', '{"consecutive_days": 7}', 300, false),
('weekly_warrior', 'Weekly Warrior', 'Play games for 30 consecutive days', 'Game Master', '⚔️', '{"consecutive_days": 30}', 1000, false),
('monthly_master', 'Monthly Master', 'Play games for 100 consecutive days', 'Game Master', '🗓️', '{"consecutive_days": 100}', 3000, false),
('speed_runner', 'Lightning Fast', 'Complete 10 games in under 5 minutes total', 'Game Master', '⚡', '{"speed_completion": true}', 400, false),
('endurance_test', 'Endurance Test', 'Play continuously for 2 hours', 'Game Master', '🕐', '{"continuous_play": 120}', 600, false),
('multitasker', 'Multitasker', 'Play 3 different games within 10 minutes', 'Game Master', '🔄', '{"quick_variety": true}', 200, false),
('game_hopper', 'Game Hopper', 'Switch between all 5 games in one session', 'Game Master', '🦘', '{"game_variety": 5}', 300, false),
('perfectionist', 'Perfectionist', 'Achieve a perfect score in any game', 'Game Master', '💎', '{"perfect_score": true}', 800, false),
('comeback_king', 'Comeback King', 'Win a game after being behind', 'Game Master', '👑', '{"comeback_victory": true}', 400, false),
('lucky_seven', 'Lucky Seven', 'Play exactly 7 games in a row', 'Game Master', '🍀', '{"consecutive_games": 7}', 150, false),
('night_owl', 'Night Owl', 'Play games between midnight and 6 AM', 'Game Master', '🦉', '{"night_gaming": true}', 200, false),

-- Score Achievements (15 achievements) 
('score_1k', 'Rising Star', 'Score 1,000 points in any single game', 'Scoring', '⭐', '{"single_game_score": 1000}', 200, false),
('score_5k', 'Point Collector', 'Score 5,000 points in any single game', 'Scoring', '💰', '{"single_game_score": 5000}', 400, false),
('score_10k', 'High Scorer', 'Score 10,000 points in any single game', 'Scoring', '🎖️', '{"single_game_score": 10000}', 600, false),
('score_25k', 'Score Crusher', 'Score 25,000 points in any single game', 'Scoring', '🔥', '{"single_game_score": 25000}', 1000, false),
('score_50k', 'Point Master', 'Score 50,000 points in any single game', 'Scoring', '👑', '{"single_game_score": 50000}', 2000, false),
('total_100k', 'Total Domination', 'Accumulate 100,000 total points across all games', 'Scoring', '📊', '{"total_points": 100000}', 1500, false),
('total_500k', 'Point Millionaire', 'Accumulate 500,000 total points across all games', 'Scoring', '💎', '{"total_points": 500000}', 3000, false),
('total_1m', 'Point Legend', 'Accumulate 1,000,000 total points across all games', 'Scoring', '🏆', '{"total_points": 1000000}', 5000, false),
('consistent_scorer', 'Consistent Scorer', 'Score over 1,000 points in 10 consecutive games', 'Scoring', '📈', '{"consistent_scoring": true}', 500, false),
('double_trouble', 'Double Trouble', 'Score exactly double your previous best', 'Scoring', '2️⃣', '{"score_doubling": true}', 300, false),
('lucky_number', 'Lucky Number', 'Score exactly 7,777 points', 'Scoring', '🎰', '{"exact_score": 7777}', 777, false),
('round_number', 'Round and Round', 'Score exactly 10,000 points', 'Scoring', '🔄', '{"exact_score": 10000}', 400, false),
('beast_mode', 'Beast Mode', 'Score over 5,000 points in 3 different games', 'Scoring', '🦍', '{"multi_game_scores": 5000}', 800, false),
('score_streak', 'Score Streak', 'Improve your score 5 games in a row', 'Scoring', '📈', '{"improvement_streak": 5}', 400, false),
('underdog', 'Underdog Victory', 'Beat a high score with a lower-level character', 'Scoring', '🥊', '{"underdog_win": true}', 300, false),

-- Social Achievements (15 achievements)
('social_butterfly', 'Social Butterfly', 'Send 100 messages in clubroom', 'Social', '🦋', '{"messages_sent": 100}', 400, false),
('reaction_master', 'Reaction Master', 'Send 50 emoji reactions', 'Social', '😍', '{"reactions_sent": 50}', 300, false),
('clubroom_regular', 'Clubroom Regular', 'Visit clubroom 50 times', 'Social', '🏠', '{"clubroom_visits": 50}', 500, false),
('long_conversation', 'Chatty Ape', 'Send 20 messages in one clubroom session', 'Social', '💬', '{"messages_per_session": 20}', 200, false),
('emoji_enthusiast', 'Emoji Enthusiast', 'Use 10 different emoji reactions', 'Social', '🎭', '{"unique_reactions": 10}', 250, false),
('night_chatter', 'Night Chatter', 'Send messages in clubroom after midnight', 'Social', '🌙', '{"night_messages": true}', 150, false),
('early_bird', 'Early Bird', 'Send messages in clubroom before 6 AM', 'Social', '🌅', '{"morning_messages": true}', 150, false),
('voice_hero', 'Voice Hero', 'Use voice chat for 30 minutes total', 'Social', '🎤', '{"voice_time": 30}', 400, false),
('music_lover', 'Music Lover', 'Play clubroom music 20 times', 'Social', '🎵', '{"music_plays": 20}', 200, false),
('helpful_ape', 'Helpful Ape', 'Help another player in chat', 'Social', '🤝', '{"helpful_messages": true}', 300, false),
('celebration_king', 'Celebration King', 'Send party reactions 25 times', 'Social', '🎉', '{"party_reactions": 25}', 200, false),
('mood_setter', 'Mood Setter', 'Change clubroom music 10 times', 'Social', '🎶', '{"music_changes": 10}', 150, false),
('conversation_starter', 'Conversation Starter', 'Start 10 conversations in clubroom', 'Social', '💭', '{"conversations_started": 10}', 300, false),
('active_listener', 'Active Listener', 'React to others messages 50 times', 'Social', '👂', '{"message_reactions": 50}', 250, false),
('community_builder', 'Community Builder', 'Be active in clubroom for 30 days', 'Social', '🏗️', '{"active_days": 30}', 800, false),

-- Special Achievements (10 achievements)
('time_traveler', 'Time Traveler', 'Play games at exactly midnight', 'Special', '🕛', '{"midnight_gaming": true}', 300, false),
('birthday_ape', 'Birthday Ape', 'Play on your account creation anniversary', 'Special', '🎂', '{"anniversary_play": true}', 500, false),
('collector', 'NFT Collector', 'Connect 5 different NFT apes', 'Special', '🖼️', '{"nft_count": 5}', 600, false),
('rare_find', 'Rare Find', 'Connect a rare NFT ape', 'Special', '💎', '{"rare_nft": true}', 800, false),
('trendsetter', 'Trendsetter', 'Be among first 100 players to join', 'Special', '🚀', '{"early_adopter": true}', 1000, true),
('bug_hunter', 'Bug Hunter', 'Report a bug that gets fixed', 'Special', '🐛', '{"bug_report": true}', 500, false),
('feedback_hero', 'Feedback Hero', 'Provide valuable feedback', 'Special', '📝', '{"feedback_given": true}', 300, false),
('easter_egg', 'Easter Egg Hunter', 'Find a hidden easter egg', 'Special', '🥚', '{"easter_egg": true}', 400, true),
('developer_tribute', 'Developer Tribute', 'Find the secret developer message', 'Special', '👨‍💻', '{"dev_message": true}', 600, true),
('arcade_legend', 'Arcade Legend', 'Unlock all other achievements', 'Special', '🏆', '{"all_achievements": true}', 10000, false),

-- Level Milestones (10 achievements)
('level_10', 'Double Digits', 'Reach level 10', 'Progression', '🔟', '{"level": 10}', 200, false),
('level_25', 'Quarter Century', 'Reach level 25', 'Progression', '🎯', '{"level": 25}', 500, false),
('level_50', 'Halfway Hero', 'Reach level 50', 'Progression', '⭐', '{"level": 50}', 1000, false),
('level_75', 'Almost There', 'Reach level 75', 'Progression', '💪', '{"level": 75}', 2000, false),
('level_100', 'Max Level Master', 'Reach the maximum level 100', 'Progression', '👑', '{"level": 100}', 5000, false),
('fast_learner', 'Fast Learner', 'Reach level 10 in under 24 hours', 'Progression', '⚡', '{"fast_leveling": true}', 400, false),
('steady_climber', 'Steady Climber', 'Gain levels for 10 consecutive days', 'Progression', '🧗', '{"level_streak": 10}', 600, false),
('xp_hunter', 'XP Hunter', 'Earn 10,000 experience in one day', 'Progression', '🎖️', '{"daily_xp": 10000}', 800, false),
('experience_master', 'Experience Master', 'Earn 100,000 total experience', 'Progression', '📚', '{"total_xp": 100000}', 1500, false),
('prestige', 'Prestige', 'Reach max level and reset (future feature)', 'Progression', '✨', '{"prestige": true}', 10000, true);

-- Insert an example upgrade for testing (only if the tables are empty)
DO $$
BEGIN
  -- First make sure the test wallet exists in users table
  INSERT INTO users (wallet_address, total_points, block_dodger_score)
  VALUES ('test_wallet', 10000, 5000)
  ON CONFLICT (wallet_address) DO NOTHING;
  
  -- Then add the upgrade
  IF NOT EXISTS (SELECT 1 FROM user_upgrades WHERE game_id = 'block_dodger' AND wallet_address = 'test_wallet' LIMIT 1) THEN
    INSERT INTO user_upgrades (wallet_address, game_id, upgrades)
    VALUES ('test_wallet', 'block_dodger', '{"playerSpeed": 1, "playerSize": 1}'::jsonb);
  END IF;

  -- Add powerup
  IF NOT EXISTS (SELECT 1 FROM user_powerups WHERE game_id = 'block_dodger' AND wallet_address = 'test_wallet' LIMIT 1) THEN
    INSERT INTO user_powerups (wallet_address, game_id, powerups)
    VALUES ('test_wallet', 'block_dodger', '{"invincibility": true}'::jsonb);
  END IF;

  -- Add selected powerup
  IF NOT EXISTS (SELECT 1 FROM user_selected_powerup WHERE game_id = 'block_dodger' AND wallet_address = 'test_wallet' LIMIT 1) THEN
    INSERT INTO user_selected_powerup (wallet_address, game_id, powerup_id)
    VALUES ('test_wallet', 'block_dodger', 'invincibility');
  END IF;
END $$; 