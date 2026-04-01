-- =============================================================================
-- Ape Arcade — full schema migration for Supabase (PostgreSQL)
-- =============================================================================
-- Use this on a NEW project after you create it, or to recreate empty tables
-- before you import a logical backup (CSV / pg_dump data-only).
--
-- What this does:
--   • extensions, tables, indexes, RLS policies, triggers, helper functions
--   • seeds the `achievements` catalog to match the current client (achievements.js)
--
-- What this does NOT do:
--   • restore your old ROWS — use Supabase "Import data" or pg_restore for that
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    glyph_user_id TEXT,
    username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
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
    first_game_played TIMESTAMPTZ,
    last_game_played TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_arcade_users_glyph_user_id ON users (glyph_user_id)
WHERE glyph_user_id IS NOT NULL AND length(trim(glyph_user_id)) > 0;

-- ---------------------------------------------------------------------------
-- game_scores (one row per wallet + game = high score record)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (wallet_address, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_wallet ON game_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS game_scores_wallet_game_idx ON game_scores(wallet_address, game_id);

-- ---------------------------------------------------------------------------
-- achievements + user_achievements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirements JSONB NOT NULL,
    reward_xp INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
    achievement_id TEXT NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (wallet_address, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_wallet ON user_achievements(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- ---------------------------------------------------------------------------
-- Neon Racer / shop-style tables (used by games)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_upgrades (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
    game_id TEXT NOT NULL,
    upgrades JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (wallet_address, game_id)
);

CREATE INDEX IF NOT EXISTS user_upgrades_wallet_address_idx ON user_upgrades(wallet_address);
CREATE INDEX IF NOT EXISTS user_upgrades_game_id_idx ON user_upgrades(game_id);

CREATE TABLE IF NOT EXISTS user_powerups (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
    game_id TEXT NOT NULL,
    powerups JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (wallet_address, game_id)
);

CREATE INDEX IF NOT EXISTS user_powerups_wallet_address_idx ON user_powerups(wallet_address);
CREATE INDEX IF NOT EXISTS user_powerups_game_id_idx ON user_powerups(game_id);

CREATE TABLE IF NOT EXISTS user_selected_powerup (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
    game_id TEXT NOT NULL,
    powerup_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (wallet_address, game_id)
);

CREATE INDEX IF NOT EXISTS user_selected_powerup_wallet_address_idx ON user_selected_powerup(wallet_address);
CREATE INDEX IF NOT EXISTS user_selected_powerup_game_id_idx ON user_selected_powerup(game_id);

-- ---------------------------------------------------------------------------
-- Clubroom (optional persistence; realtime may also use memory on server)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clubroom_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    socket_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    ape_image TEXT,
    position JSONB NOT NULL DEFAULT '{"x": 100, "y": 100}',
    wallet_address TEXT,
    level INTEGER DEFAULT 1,
    is_voice_enabled BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubroom_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    wallet_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clubroom_users_socket_id ON clubroom_users(socket_id);
CREATE INDEX IF NOT EXISTS idx_clubroom_users_wallet_address ON clubroom_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_clubroom_users_last_seen ON clubroom_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_clubroom_messages_timestamp ON clubroom_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_clubroom_messages_wallet_address ON clubroom_messages(wallet_address);

-- ---------------------------------------------------------------------------
-- Functions: totals + high scores from game_scores
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET total_points = COALESCE(block_dodger_score, 0)
        + COALESCE(neon_racer_score, 0)
        + COALESCE(ape_man_score, 0)
        + COALESCE(flappy_ape_score, 0)
        + COALESCE(galaxy_ape_score, 0)
    WHERE wallet_address = NEW.wallet_address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_game_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.game_id = 'block_dodger' THEN
        UPDATE users SET block_dodger_score = NEW.score
        WHERE wallet_address = NEW.wallet_address
          AND (block_dodger_score IS NULL OR NEW.score > block_dodger_score);
    ELSIF NEW.game_id = 'neon_racer' THEN
        UPDATE users SET neon_racer_score = NEW.score
        WHERE wallet_address = NEW.wallet_address
          AND (neon_racer_score IS NULL OR NEW.score > neon_racer_score);
    ELSIF NEW.game_id IN ('ape_man', 'pacman') THEN
        UPDATE users SET ape_man_score = NEW.score
        WHERE wallet_address = NEW.wallet_address
          AND (ape_man_score IS NULL OR NEW.score > ape_man_score);
    ELSIF NEW.game_id = 'flappy_ape' THEN
        UPDATE users SET flappy_ape_score = NEW.score
        WHERE wallet_address = NEW.wallet_address
          AND (flappy_ape_score IS NULL OR NEW.score > flappy_ape_score);
    ELSIF NEW.game_id IN ('galaxy_ape', 'run_ape') THEN
        UPDATE users SET galaxy_ape_score = NEW.score
        WHERE wallet_address = NEW.wallet_address
          AND (galaxy_ape_score IS NULL OR NEW.score > galaxy_ape_score);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_points_trigger ON users;
CREATE TRIGGER update_total_points_trigger
    AFTER UPDATE OF block_dodger_score, neon_racer_score, ape_man_score, flappy_ape_score, galaxy_ape_score
    ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_total_points();

DROP TRIGGER IF EXISTS after_insert_score ON game_scores;
CREATE TRIGGER after_insert_score
    AFTER INSERT ON game_scores
    FOR EACH ROW
    EXECUTE PROCEDURE update_game_score();

DROP TRIGGER IF EXISTS after_update_score ON game_scores;
CREATE TRIGGER after_update_score
    AFTER UPDATE OF score ON game_scores
    FOR EACH ROW
    WHEN (NEW.score > OLD.score)
    EXECUTE PROCEDURE update_game_score();

-- ---------------------------------------------------------------------------
-- XP helpers (optional; API also computes level in Python)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_required_xp_for_level(level_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF level_num <= 1 THEN
        RETURN 0;
    END IF;
    RETURN POWER(level_num - 1, 2)::INTEGER * 50 + (level_num - 1) * 100;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_level_from_experience(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    level_num INTEGER := 1;
    required_xp INTEGER := 0;
BEGIN
    WHILE level_num <= 100 LOOP
        required_xp := get_required_xp_for_level(level_num + 1);
        IF xp < required_xp THEN
            RETURN level_num;
        END IF;
        level_num := level_num + 1;
    END LOOP;
    RETURN 100;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_experience(user_wallet TEXT, xp_amount INTEGER)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN, total_xp INTEGER) AS $$
DECLARE
    old_level INTEGER;
    new_xp INTEGER;
    calculated_level INTEGER;
    did_level_up BOOLEAN := FALSE;
BEGIN
    SELECT level, experience INTO old_level, new_xp
    FROM users WHERE wallet_address = user_wallet;

    new_xp := COALESCE(new_xp, 0) + xp_amount;
    calculated_level := get_level_from_experience(new_xp);
    IF calculated_level > COALESCE(old_level, 1) THEN
        did_level_up := TRUE;
    END IF;

    UPDATE users SET experience = new_xp, level = calculated_level WHERE wallet_address = user_wallet;

    RETURN QUERY SELECT calculated_level, did_level_up, new_xp;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_achievements(user_wallet TEXT)
RETURNS TABLE(achievement_id TEXT, achievement_name TEXT, reward_xp INTEGER) AS $$
DECLARE
    user_data RECORD;
    achievement RECORD;
    meets_requirement BOOLEAN;
BEGIN
    SELECT * INTO user_data FROM users WHERE wallet_address = user_wallet;
    FOR achievement IN
        SELECT * FROM achievements a WHERE a.id NOT IN (
            SELECT ua.achievement_id FROM user_achievements ua WHERE ua.wallet_address = user_wallet
        )
    LOOP
        meets_requirement := TRUE;
        IF achievement.id LIKE 'first_%' AND COALESCE(user_data.total_games_played, 0) < 1 THEN
            meets_requirement := FALSE;
        END IF;
        IF meets_requirement THEN
            INSERT INTO user_achievements (wallet_address, achievement_id)
            VALUES (user_wallet, achievement.id)
            ON CONFLICT (wallet_address, achievement_id) DO NOTHING;
            PERFORM add_experience(user_wallet, COALESCE(achievement.reward_xp, 0));
            RETURN QUERY SELECT achievement.id, achievement.name, achievement.reward_xp;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clubroom_users_updated_at ON clubroom_users;
CREATE TRIGGER update_clubroom_users_updated_at
    BEFORE UPDATE ON clubroom_users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE FUNCTION cleanup_old_clubroom_data()
RETURNS void AS $$
BEGIN
    DELETE FROM clubroom_users WHERE last_seen < NOW() - INTERVAL '1 hour';
    DELETE FROM clubroom_messages
    WHERE id NOT IN (
        SELECT id FROM clubroom_messages ORDER BY timestamp DESC LIMIT 1000
    );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_selected_powerup ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubroom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubroom_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Game scores are viewable by everyone" ON game_scores;
CREATE POLICY "Game scores are viewable by everyone" ON game_scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own scores" ON game_scores;
CREATE POLICY "Users can insert their own scores" ON game_scores FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own scores" ON game_scores;
CREATE POLICY "Users can update their own scores" ON game_scores FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON achievements;
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "User achievements are viewable by everyone" ON user_achievements;
CREATE POLICY "User achievements are viewable by everyone" ON user_achievements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select access for user_upgrades" ON user_upgrades;
CREATE POLICY "Allow select access for user_upgrades" ON user_upgrades FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert access for user_upgrades" ON user_upgrades;
CREATE POLICY "Allow insert access for user_upgrades" ON user_upgrades FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update access for user_upgrades" ON user_upgrades;
CREATE POLICY "Allow update access for user_upgrades" ON user_upgrades FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow select access for user_powerups" ON user_powerups;
CREATE POLICY "Allow select access for user_powerups" ON user_powerups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert access for user_powerups" ON user_powerups;
CREATE POLICY "Allow insert access for user_powerups" ON user_powerups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update access for user_powerups" ON user_powerups;
CREATE POLICY "Allow update access for user_powerups" ON user_powerups FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow select access for user_selected_powerup" ON user_selected_powerup;
CREATE POLICY "Allow select access for user_selected_powerup" ON user_selected_powerup FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert access for user_selected_powerup" ON user_selected_powerup;
CREATE POLICY "Allow insert access for user_selected_powerup" ON user_selected_powerup FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update access for user_selected_powerup" ON user_selected_powerup;
CREATE POLICY "Allow update access for user_selected_powerup" ON user_selected_powerup FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Clubroom users are viewable by everyone" ON clubroom_users;
CREATE POLICY "Clubroom users are viewable by everyone" ON clubroom_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own data" ON clubroom_users;
CREATE POLICY "Users can insert their own data" ON clubroom_users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own data" ON clubroom_users;
CREATE POLICY "Users can update their own data" ON clubroom_users FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete their own data" ON clubroom_users;
CREATE POLICY "Users can delete their own data" ON clubroom_users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Clubroom messages are viewable by everyone" ON clubroom_messages;
CREATE POLICY "Clubroom messages are viewable by everyone" ON clubroom_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert messages" ON clubroom_messages;
CREATE POLICY "Users can insert messages" ON clubroom_messages FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed achievements (matches shared/supabase/update-achievements.sql + client)
-- ---------------------------------------------------------------------------
INSERT INTO achievements (id, name, description, category, icon, requirements, reward_xp, is_hidden) VALUES
('welcome', 'Welcome to the Jungle!', 'Join the Ape Arcade for the first time', 'general', '🌴', '{"action": "join_arcade"}', 150, false),
('first_game', 'First Game', 'Play your first game', 'games', '🎮', '{"total_games_played": 1}', 375, false),
('first_score', 'First Score', 'Get your first score in any game', 'games', '📈', '{"any_score": 1}', 225, false),
('score_500', 'First Steps', 'Score 500 points in a single game', 'games', '🥉', '{"single_game_score": 500}', 300, false),
('score_1k', 'Getting Good', 'Score 1,000 points in a single game', 'games', '🥈', '{"single_game_score": 1000}', 450, false),
('score_2k', 'Skilled Player', 'Score 2,000 points in a single game', 'games', '🥇', '{"single_game_score": 2000}', 600, false),
('score_5k', 'Expert Player', 'Score 5,000 points in a single game', 'games', '👑', '{"single_game_score": 5000}', 1125, false),
('score_10k', 'Perfect Score', 'Score 10,000 points in a single game', 'games', '💎', '{"single_game_score": 10000}', 2250, false),
('games_10', 'Getting Started', 'Play 10 games total', 'games', '🎯', '{"total_games_played": 10}', 450, false),
('games_25', 'Regular Player', 'Play 25 games total', 'games', '🎲', '{"total_games_played": 25}', 750, false),
('games_50', 'Dedicated Player', 'Play 50 games total', 'games', '🎪', '{"total_games_played": 50}', 1125, false),
('games_100', 'Arcade Enthusiast', 'Play 100 games total', 'games', '🎨', '{"total_games_played": 100}', 1500, false),
('games_250', 'Arcade Veteran', 'Play 250 games total', 'games', '🏆', '{"total_games_played": 250}', 2250, false),
('games_500', 'Arcade Master', 'Play 500 games total', 'games', '👑', '{"total_games_played": 500}', 3000, false),
('block_dodger_1', 'Block Dodger Rookie', 'Play 1 Block Dodger game', 'games', '🎮', '{"block_dodger_games": 1}', 225, false),
('block_dodger_5', 'Block Dodger Explorer', 'Play 5 Block Dodger games', 'games', '🕹️', '{"block_dodger_games": 5}', 375, false),
('block_dodger_10', 'Block Dodger Enthusiast', 'Play 10 Block Dodger games', 'games', '🎯', '{"block_dodger_games": 10}', 525, false),
('block_dodger_25', 'Block Dodger Expert', 'Play 25 Block Dodger games', 'games', '🏅', '{"block_dodger_games": 25}', 750, false),
('block_dodger_50', 'Block Dodger Master', 'Play 50 Block Dodger games', 'games', '🏆', '{"block_dodger_games": 50}', 1125, false),
('block_dodger_100', 'Block Dodger Legend', 'Play 100 Block Dodger games', 'games', '👑', '{"block_dodger_games": 100}', 1500, false),
('neon_racer_1', 'Neon Racer Rookie', 'Play 1 Neon Racer game', 'games', '🏎️', '{"neon_racer_games": 1}', 225, false),
('neon_racer_5', 'Neon Racer Explorer', 'Play 5 Neon Racer games', 'games', '🚗', '{"neon_racer_games": 5}', 375, false),
('neon_racer_10', 'Neon Racer Enthusiast', 'Play 10 Neon Racer games', 'games', '🏁', '{"neon_racer_games": 10}', 525, false),
('neon_racer_25', 'Neon Racer Expert', 'Play 25 Neon Racer games', 'games', '🏅', '{"neon_racer_games": 25}', 750, false),
('neon_racer_50', 'Neon Racer Master', 'Play 50 Neon Racer games', 'games', '🏆', '{"neon_racer_games": 50}', 1125, false),
('neon_racer_100', 'Neon Racer Legend', 'Play 100 Neon Racer games', 'games', '👑', '{"neon_racer_games": 100}', 1500, false),
('ape_man_1', 'Ape-Man Rookie', 'Play 1 Ape-Man game', 'games', '👻', '{"ape_man_games": 1}', 225, false),
('ape_man_5', 'Ape-Man Explorer', 'Play 5 Ape-Man games', 'games', '🍒', '{"ape_man_games": 5}', 375, false),
('ape_man_10', 'Ape-Man Enthusiast', 'Play 10 Ape-Man games', 'games', '🔵', '{"ape_man_games": 10}', 525, false),
('ape_man_25', 'Ape-Man Expert', 'Play 25 Ape-Man games', 'games', '🏅', '{"ape_man_games": 25}', 750, false),
('ape_man_50', 'Ape-Man Master', 'Play 50 Ape-Man games', 'games', '🏆', '{"ape_man_games": 50}', 1125, false),
('ape_man_100', 'Ape-Man Legend', 'Play 100 Ape-Man games', 'games', '👑', '{"ape_man_games": 100}', 1500, false),
('galaxy_ape_1', 'Galaxy Ape Rookie', 'Play 1 Galaxy Ape game', 'games', '🚀', '{"galaxy_ape_games": 1}', 225, false),
('galaxy_ape_5', 'Galaxy Ape Explorer', 'Play 5 Galaxy Ape games', 'games', '🌟', '{"galaxy_ape_games": 5}', 375, false),
('galaxy_ape_10', 'Galaxy Ape Enthusiast', 'Play 10 Galaxy Ape games', 'games', '🛸', '{"galaxy_ape_games": 10}', 525, false),
('galaxy_ape_25', 'Galaxy Ape Expert', 'Play 25 Galaxy Ape games', 'games', '🏅', '{"galaxy_ape_games": 25}', 750, false),
('galaxy_ape_50', 'Galaxy Ape Master', 'Play 50 Galaxy Ape games', 'games', '🏆', '{"galaxy_ape_games": 50}', 1125, false),
('galaxy_ape_100', 'Galaxy Ape Legend', 'Play 100 Galaxy Ape games', 'games', '👑', '{"galaxy_ape_games": 100}', 1500, false),
('flappy_ape_1', 'Flappy Ape Rookie', 'Play 1 Flappy Ape game', 'games', '🐦', '{"flappy_ape_games": 1}', 225, false),
('flappy_ape_5', 'Flappy Ape Explorer', 'Play 5 Flappy Ape games', 'games', '🕊️', '{"flappy_ape_games": 5}', 375, false),
('flappy_ape_10', 'Flappy Ape Enthusiast', 'Play 10 Flappy Ape games', 'games', '🦅', '{"flappy_ape_games": 10}', 525, false),
('flappy_ape_25', 'Flappy Ape Expert', 'Play 25 Flappy Ape games', 'games', '🏅', '{"flappy_ape_games": 25}', 750, false),
('flappy_ape_50', 'Flappy Ape Master', 'Play 50 Flappy Ape games', 'games', '🏆', '{"flappy_ape_games": 50}', 1125, false),
('flappy_ape_100', 'Flappy Ape Legend', 'Play 100 Flappy Ape games', 'games', '👑', '{"flappy_ape_games": 100}', 1500, false),
('points_5k', 'Point Collector', 'Accumulate 5,000 total points', 'games', '💰', '{"total_points": 5000}', 450, false),
('points_25k', 'Point Hoarder', 'Accumulate 25,000 total points', 'games', '💸', '{"total_points": 25000}', 750, false),
('points_50k', 'Point Magnate', 'Accumulate 50,000 total points', 'games', '💵', '{"total_points": 50000}', 1125, false),
('points_100k', 'Point Tycoon', 'Accumulate 100,000 total points', 'games', '💎', '{"total_points": 100000}', 1500, false),
('points_250k', 'Point Mogul', 'Accumulate 250,000 total points', 'games', '💸', '{"total_points": 250000}', 2250, false),
('points_500k', 'Point Stacker', 'Accumulate 500,000 total points', 'games', '🏆', '{"total_points": 500000}', 3000, false),
('points_1000k', 'Point Millionaire', 'Accumulate 1,000,000 total points', 'games', '💰', '{"total_points": 1000000}', 6000, false),
('daily_streak_7', 'Weekly Warrior', 'Play games for 7 consecutive days', 'progression', '📅', '{"consecutive_days": 7}', 1500, false),
('daily_streak_14', 'Fortnight Fighter', 'Play games for 14 consecutive days', 'progression', '🗓️', '{"consecutive_days": 14}', 2250, false),
('daily_streak_30', 'Monthly Master', 'Play games for 30 consecutive days', 'progression', '📆', '{"consecutive_days": 30}', 3750, false),
('game_hopper', 'Game Hopper', 'Play all 5 games in one session', 'games', '🦘', '{"game_variety": 5}', 1125, false),
('endurance_test', 'Endurance Test', 'Play for 2+ hours continuously', 'progression', '💪', '{"continuous_play": 120}', 3000, false),
('ape_collector_1', 'First Ape', 'Have 1 ape in your wallet', 'collection', '🐵', '{"ape_count": 1}', 450, false),
('ape_collector_5', 'Ape Squad', 'Have 5 apes in your wallet', 'collection', '🦍', '{"ape_count": 5}', 750, false),
('ape_collector_10', 'Ape Crew', 'Have 10 apes in your wallet', 'collection', '🙊', '{"ape_count": 10}', 1125, false),
('ape_collector_20', 'Ape Colony', 'Have 20 apes in your wallet', 'collection', '🙈', '{"ape_count": 20}', 1500, false),
('ape_collector_30', 'Ape Army', 'Have 30 apes in your wallet', 'collection', '🙉', '{"ape_count": 30}', 2250, false),
('ape_collector_40', 'Ape Empire', 'Have 40 apes in your wallet', 'collection', '👑', '{"ape_count": 40}', 3000, false),
('ape_collector_50', 'Ape Dynasty', 'Have 50 apes in your wallet', 'collection', '💎', '{"ape_count": 50}', 4500, false),
('easter_egg', 'Easter Egg Hunter', 'Find hidden secrets around the arcade', 'secrets', '🥚', '{"easter_egg": true}', 1500, false),
('developer_tribute', 'Developer Tribute', 'Discover the developers'' special message', 'secrets', '👨‍💻', '{"dev_message": true}', 750, false),
('feedback_hero', 'Feedback Hero', 'Report valuable feedback to the team', 'community', '📝', '{"feedback_given": true}', 750, false),
('bug_hunter', 'Bug Hunter', 'Report a bug to the development team', 'community', '🐛', '{"bug_report": true}', 1125, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    requirements = EXCLUDED.requirements,
    reward_xp = EXCLUDED.reward_xp,
    is_hidden = EXCLUDED.is_hidden;

-- Optional welcome messages (skip if table already has rows)
INSERT INTO clubroom_messages (username, message, wallet_address)
SELECT 'System', 'Welcome to the Ape Arcade Clubroom! 🎮', NULL
WHERE NOT EXISTS (SELECT 1 FROM clubroom_messages LIMIT 1);

INSERT INTO clubroom_messages (username, message, wallet_address)
SELECT 'System', 'Chat is powered by your arcade backend / realtime.', NULL
WHERE (SELECT COUNT(*) FROM clubroom_messages) < 2;

-- =============================================================================
-- Done. Next: import your CSV backup into users, game_scores, user_achievements
-- =============================================================================
