-- Migration script to add missing fields to users table
-- This script should be run on the production database to fix the scoring issues

-- Add missing fields to users table if they don't exist
DO $$ 
BEGIN
    -- Add messages_sent field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'messages_sent') THEN
        ALTER TABLE users ADD COLUMN messages_sent INTEGER DEFAULT 0;
    END IF;
    
    -- Add reactions_sent field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'reactions_sent') THEN
        ALTER TABLE users ADD COLUMN reactions_sent INTEGER DEFAULT 0;
    END IF;
    
    -- Add nft_count field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'nft_count') THEN
        ALTER TABLE users ADD COLUMN nft_count INTEGER DEFAULT 0;
    END IF;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Verify the fields were added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('messages_sent', 'reactions_sent', 'nft_count')
ORDER BY column_name; 