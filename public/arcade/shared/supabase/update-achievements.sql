-- Update Achievements Database Script
-- This script replaces the old achievements with the new streamlined achievement system

-- First, clear existing user achievements to avoid foreign key constraint issues
DELETE FROM user_achievements;

-- Then clear existing achievements
DELETE FROM achievements;

-- Insert the new streamlined achievements
INSERT INTO achievements (id, name, description, category, icon, requirements, reward_xp, is_hidden) VALUES

-- Core Game Achievements
('welcome', 'Welcome to the Jungle!', 'Join the Ape Arcade for the first time', 'general', '🌴', '{"action": "join_arcade"}', 150, false),
('first_game', 'First Game', 'Play your first game', 'games', '🎮', '{"total_games_played": 1}', 375, false),
('first_score', 'First Score', 'Get your first score in any game', 'games', '📈', '{"any_score": 1}', 225, false),

-- Score Achievements (Single Game) - Adjusted for 10k max score
('score_500', 'First Steps', 'Score 500 points in a single game', 'games', '🥉', '{"single_game_score": 500}', 300, false),
('score_1k', 'Getting Good', 'Score 1,000 points in a single game', 'games', '🥈', '{"single_game_score": 1000}', 450, false),
('score_2k', 'Skilled Player', 'Score 2,000 points in a single game', 'games', '🥇', '{"single_game_score": 2000}', 600, false),
('score_5k', 'Expert Player', 'Score 5,000 points in a single game', 'games', '👑', '{"single_game_score": 5000}', 1125, false),
('score_10k', 'Perfect Score', 'Score 10,000 points in a single game', 'games', '💎', '{"single_game_score": 10000}', 2250, false),

-- Total Games Played
('games_10', 'Getting Started', 'Play 10 games total', 'games', '🎯', '{"total_games_played": 10}', 450, false),
('games_25', 'Regular Player', 'Play 25 games total', 'games', '🎲', '{"total_games_played": 25}', 750, false),
('games_50', 'Dedicated Player', 'Play 50 games total', 'games', '🎪', '{"total_games_played": 50}', 1125, false),
('games_100', 'Arcade Enthusiast', 'Play 100 games total', 'games', '🎨', '{"total_games_played": 100}', 1500, false),
('games_250', 'Arcade Veteran', 'Play 250 games total', 'games', '🏆', '{"total_games_played": 250}', 2250, false),
('games_500', 'Arcade Master', 'Play 500 games total', 'games', '👑', '{"total_games_played": 500}', 3000, false),

-- Block Dodger Achievements
('block_dodger_1', 'Block Dodger Rookie', 'Play 1 Block Dodger game', 'games', '🎮', '{"block_dodger_games": 1}', 225, false),
('block_dodger_5', 'Block Dodger Explorer', 'Play 5 Block Dodger games', 'games', '🕹️', '{"block_dodger_games": 5}', 375, false),
('block_dodger_10', 'Block Dodger Enthusiast', 'Play 10 Block Dodger games', 'games', '🎯', '{"block_dodger_games": 10}', 525, false),
('block_dodger_25', 'Block Dodger Expert', 'Play 25 Block Dodger games', 'games', '🏅', '{"block_dodger_games": 25}', 750, false),
('block_dodger_50', 'Block Dodger Master', 'Play 50 Block Dodger games', 'games', '🏆', '{"block_dodger_games": 50}', 1125, false),
('block_dodger_100', 'Block Dodger Legend', 'Play 100 Block Dodger games', 'games', '👑', '{"block_dodger_games": 100}', 1500, false),

-- Neon Racer Achievements
('neon_racer_1', 'Neon Racer Rookie', 'Play 1 Neon Racer game', 'games', '🏎️', '{"neon_racer_games": 1}', 225, false),
('neon_racer_5', 'Neon Racer Explorer', 'Play 5 Neon Racer games', 'games', '🚗', '{"neon_racer_games": 5}', 375, false),
('neon_racer_10', 'Neon Racer Enthusiast', 'Play 10 Neon Racer games', 'games', '🏁', '{"neon_racer_games": 10}', 525, false),
('neon_racer_25', 'Neon Racer Expert', 'Play 25 Neon Racer games', 'games', '🏅', '{"neon_racer_games": 25}', 750, false),
('neon_racer_50', 'Neon Racer Master', 'Play 50 Neon Racer games', 'games', '🏆', '{"neon_racer_games": 50}', 1125, false),
('neon_racer_100', 'Neon Racer Legend', 'Play 100 Neon Racer games', 'games', '👑', '{"neon_racer_games": 100}', 1500, false),

-- Ape-Man Achievements
('ape_man_1', 'Ape-Man Rookie', 'Play 1 Ape-Man game', 'games', '👻', '{"ape_man_games": 1}', 225, false),
('ape_man_5', 'Ape-Man Explorer', 'Play 5 Ape-Man games', 'games', '🍒', '{"ape_man_games": 5}', 375, false),
('ape_man_10', 'Ape-Man Enthusiast', 'Play 10 Ape-Man games', 'games', '🔵', '{"ape_man_games": 10}', 525, false),
('ape_man_25', 'Ape-Man Expert', 'Play 25 Ape-Man games', 'games', '🏅', '{"ape_man_games": 25}', 750, false),
('ape_man_50', 'Ape-Man Master', 'Play 50 Ape-Man games', 'games', '🏆', '{"ape_man_games": 50}', 1125, false),
('ape_man_100', 'Ape-Man Legend', 'Play 100 Ape-Man games', 'games', '👑', '{"ape_man_games": 100}', 1500, false),

-- Galaxy Ape Achievements
('galaxy_ape_1', 'Galaxy Ape Rookie', 'Play 1 Galaxy Ape game', 'games', '🚀', '{"galaxy_ape_games": 1}', 225, false),
('galaxy_ape_5', 'Galaxy Ape Explorer', 'Play 5 Galaxy Ape games', 'games', '🌟', '{"galaxy_ape_games": 5}', 375, false),
('galaxy_ape_10', 'Galaxy Ape Enthusiast', 'Play 10 Galaxy Ape games', 'games', '🛸', '{"galaxy_ape_games": 10}', 525, false),
('galaxy_ape_25', 'Galaxy Ape Expert', 'Play 25 Galaxy Ape games', 'games', '🏅', '{"galaxy_ape_games": 25}', 750, false),
('galaxy_ape_50', 'Galaxy Ape Master', 'Play 50 Galaxy Ape games', 'games', '🏆', '{"galaxy_ape_games": 50}', 1125, false),
('galaxy_ape_100', 'Galaxy Ape Legend', 'Play 100 Galaxy Ape games', 'games', '👑', '{"galaxy_ape_games": 100}', 1500, false),

-- Flappy Ape Achievements
('flappy_ape_1', 'Flappy Ape Rookie', 'Play 1 Flappy Ape game', 'games', '🐦', '{"flappy_ape_games": 1}', 225, false),
('flappy_ape_5', 'Flappy Ape Explorer', 'Play 5 Flappy Ape games', 'games', '🕊️', '{"flappy_ape_games": 5}', 375, false),
('flappy_ape_10', 'Flappy Ape Enthusiast', 'Play 10 Flappy Ape games', 'games', '🦅', '{"flappy_ape_games": 10}', 525, false),
('flappy_ape_25', 'Flappy Ape Expert', 'Play 25 Flappy Ape games', 'games', '🏅', '{"flappy_ape_games": 25}', 750, false),
('flappy_ape_50', 'Flappy Ape Master', 'Play 50 Flappy Ape games', 'games', '🏆', '{"flappy_ape_games": 50}', 1125, false),
('flappy_ape_100', 'Flappy Ape Legend', 'Play 100 Flappy Ape games', 'games', '👑', '{"flappy_ape_games": 100}', 1500, false),

-- Cumulative Points - Adjusted for realistic totals
('points_5k', 'Point Collector', 'Accumulate 5,000 total points', 'games', '💰', '{"total_points": 5000}', 450, false),
('points_25k', 'Point Hoarder', 'Accumulate 25,000 total points', 'games', '💸', '{"total_points": 25000}', 750, false),
('points_50k', 'Point Magnate', 'Accumulate 50,000 total points', 'games', '💵', '{"total_points": 50000}', 1125, false),
('points_100k', 'Point Tycoon', 'Accumulate 100,000 total points', 'games', '💎', '{"total_points": 100000}', 1500, false),
('points_250k', 'Point Mogul', 'Accumulate 250,000 total points', 'games', '💸', '{"total_points": 250000}', 2250, false),
('points_500k', 'Point Stacker', 'Accumulate 500,000 total points', 'games', '🏆', '{"total_points": 500000}', 3000, false),
('points_1000k', 'Point Millionaire', 'Accumulate 1,000,000 total points', 'games', '💰', '{"total_points": 1000000}', 6000, false),

-- Consecutive Play Achievements
('daily_streak_7', 'Weekly Warrior', 'Play games for 7 consecutive days', 'progression', '📅', '{"consecutive_days": 7}', 1500, false),
('daily_streak_14', 'Fortnight Fighter', 'Play games for 14 consecutive days', 'progression', '🗓️', '{"consecutive_days": 14}', 2250, false),
('daily_streak_30', 'Monthly Master', 'Play games for 30 consecutive days', 'progression', '📆', '{"consecutive_days": 30}', 3750, false),

-- Session Achievements
('game_hopper', 'Game Hopper', 'Play all 5 games in one session', 'games', '🦘', '{"game_variety": 5}', 1125, false),
('endurance_test', 'Endurance Test', 'Play for 2+ hours continuously', 'progression', '💪', '{"continuous_play": 120}', 3000, false),

-- Ape Collection Achievements
('ape_collector_1', 'First Ape', 'Have 1 ape in your wallet', 'collection', '🐵', '{"ape_count": 1}', 450, false),
('ape_collector_5', 'Ape Squad', 'Have 5 apes in your wallet', 'collection', '🦍', '{"ape_count": 5}', 750, false),
('ape_collector_10', 'Ape Crew', 'Have 10 apes in your wallet', 'collection', '🙊', '{"ape_count": 10}', 1125, false),
('ape_collector_20', 'Ape Colony', 'Have 20 apes in your wallet', 'collection', '🙈', '{"ape_count": 20}', 1500, false),
('ape_collector_30', 'Ape Army', 'Have 30 apes in your wallet', 'collection', '🙉', '{"ape_count": 30}', 2250, false),
('ape_collector_40', 'Ape Empire', 'Have 40 apes in your wallet', 'collection', '👑', '{"ape_count": 40}', 3000, false),
('ape_collector_50', 'Ape Dynasty', 'Have 50 apes in your wallet', 'collection', '💎', '{"ape_count": 50}', 4500, false),

-- Special Achievements
('easter_egg', 'Easter Egg Hunter', 'Find hidden secrets around the arcade', 'secrets', '🥚', '{"easter_egg": true}', 1500, false),
('developer_tribute', 'Developer Tribute', 'Discover the developers'' special message', 'secrets', '👨‍💻', '{"dev_message": true}', 750, false),
('feedback_hero', 'Feedback Hero', 'Report valuable feedback to the team', 'community', '📝', '{"feedback_given": true}', 750, false),
('bug_hunter', 'Bug Hunter', 'Report a bug to the development team', 'community', '🐛', '{"bug_report": true}', 1125, false);

-- Display summary
SELECT 
    'Achievements Updated' as status,
    COUNT(*) as total_achievements
FROM achievements;

SELECT 
    category,
    COUNT(*) as count
FROM achievements
GROUP BY category
ORDER BY category; 