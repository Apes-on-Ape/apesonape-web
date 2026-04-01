# Neon Racer - Supabase Integration

This document describes the database structure and setup for Neon Racer.

## Database Tables

The game uses the following tables in the Supabase database:

- `users` - Shared user profiles across all games
- `game_scores` - Stores game scores for all games
- `game_upgrades` - Stores purchased upgrades for each game
- `wallet_points` - Shared wallet points across all games

## Setup Instructions

1. Create a new Supabase project
2. Run the SQL setup script in the Supabase SQL editor
3. Configure the game with your Supabase URL and anon key

## Error Handling

If you see the error `relation "public.users" does not exist`, it means the database tables haven't been created yet. Follow the setup instructions above to fix this issue.

## Database Schema

### Users Table
- `wallet_address` (text) - Primary key
- `username` (text)
- `total_points` (integer)
- `selected_ape_token_id` (text)
- `selected_ape_image_url` (text)
- `created_at` (timestamp)
- `last_login` (timestamp)

### Game Scores Table
- `id` (uuid) - Primary key
- `wallet_address` (text) - Foreign key to users
- `game_id` (text)
- `score` (integer)
- `metadata` (jsonb)
- `created_at` (timestamp)

### Game Upgrades Table
- `wallet_address` (text) - Foreign key to users
- `game_id` (text)
- `upgrades` (jsonb)
- `updated_at` (timestamp)

### Wallet Points Table
- `wallet_address` (text) - Primary key
- `points` (integer)
- `updated_at` (timestamp)

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- Public read access for scores and leaderboards
- Authenticated users can update their own data
- Wallet address must match the authenticated user's wallet 