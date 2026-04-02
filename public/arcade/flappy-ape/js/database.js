// Flappy Ape - Database Module
const Database = {
    supabase: null,
    
    // Initialize Supabase client
    async initialize() {
        try {
            // Create Supabase client with proper headers
            this.supabase = supabase.createClient(
                'https://bqcrbcpmimfojnjdhvrz.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxY3JiY3BtaW1mb2puamRodnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjE1ODEsImV4cCI6MjA4MDI5NzU4MX0.tlDiLyCdrOAULzLH9fv0rm5wpiHqy4nzDvmpC9xXRGw',
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    schema: 'public'
                }
            );
            
            // Also set default headers for fetch API if used
            this.headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    },
    
    // Save high score
    async saveHighScore(score) {
        try {
            if (!this.supabase) {
                throw new Error('Database not initialized');
            }
            
            const user = await Wallet.getCurrentAccount();
            if (!user) {
                throw new Error('User not connected');
            }
            
            // Normalize wallet address to lowercase
            const normalizedWalletAddress = user.toLowerCase();
            
            console.log('Saving score for game:', CONFIG.GAME_ID, 'user:', normalizedWalletAddress, 'score:', score);
            
            // Prevent duplicate saves by checking if we just saved this score
            const cacheKey = `${normalizedWalletAddress}_${CONFIG.GAME_ID}_${score}`;
            const now = Date.now();
            if (this.lastSaveCache && this.lastSaveCache.key === cacheKey && (now - this.lastSaveCache.timestamp) < 5000) {
                console.log('Duplicate save attempt prevented');
                return { message: 'Score already saved recently', score: score };
            }
            
            // First, check if a higher score already exists
            const { data: existingScore, error: fetchError } = await this.supabase
                .from('game_scores')
                .select('score')
                .eq('game_id', CONFIG.GAME_ID)
                .ilike('wallet_address', normalizedWalletAddress)
                .order('score', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (fetchError) {
                console.warn('Error fetching existing score:', fetchError);
            }
            
            console.log('Existing score data:', existingScore);
            
            // Only insert if this is a new high score or no score exists
            if (fetchError || !existingScore || score > existingScore.score) {
                console.log('Saving new high score:', score);
                
                // Use upsert to handle the composite primary key properly
                const { data: upsertData, error: upsertError } = await this.supabase
                    .from('game_scores')
                    .upsert(
                        {
                            game_id: CONFIG.GAME_ID,
                            wallet_address: normalizedWalletAddress,
                            score: score
                        },
                        {
                            onConflict: 'wallet_address,game_id'
                        }
                    );
                
                if (upsertError) {
                    console.error('Error upserting score:', upsertError);
                    return { error: upsertError.message };
                }
                
                // Update the user's flappy_ape_score using upsert
                try {
                    const { data: userData, error: userError } = await this.supabase
                        .from('user_profiles')
                        .upsert(
                            {
                                wallet_address: normalizedWalletAddress,
                                flappy_ape_score: score
                            },
                            {
                                onConflict: 'wallet_address'
                            }
                        );
                    
                    if (userError) {
                        console.warn('Error upserting user score:', userError);
                        // Continue anyway, the game score was saved
                    }
                } catch (userUpdateError) {
                    console.warn('Failed to update user score:', userUpdateError);
                    // Continue anyway, the game score was saved
                }
                
                // Cache this save to prevent duplicates
                this.lastSaveCache = { key: cacheKey, timestamp: now };
                
                return { message: 'Score updated successfully', score: score };
            }
            
            return { message: 'No new high score', score: existingScore.score };
        } catch (error) {
            console.error('Error saving high score:', error);
            return { error: error.message };
        }
    },
    
    // Get high scores
    async getHighScores(limit = CONFIG.LEADERBOARD.LIMIT) {
        try {
            if (!this.supabase) {
                throw new Error('Database not initialized');
            }
            
            const { data, error } = await this.supabase
                .from('game_scores')
                .select(`
                    score,
                    created_at,
                    wallet_address
                `)
                .eq('game_id', CONFIG.GAME_ID)
                .order('score', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            
            // Fetch usernames for the wallet addresses
            if (data && data.length > 0) {
                const walletAddresses = data.map(item => item.wallet_address);
                const { data: userData, error: userError } = await this.supabase
                    .from('user_profiles')
                    .select('wallet_address, username')
                    .in('wallet_address', walletAddresses);
                
                if (userError) throw userError;
                
                // Map usernames to scores
                return data.map(scoreData => {
                    const user = userData.find(u => u.wallet_address === scoreData.wallet_address);
                    return {
                        score: scoreData.score,
                        timestamp: scoreData.created_at,
                        user_profiles: {
                            username: user ? user.username : 'Unknown',
                            avatar_url: null
                        }
                    };
                });
            }
            
            return data;
        } catch (error) {
            console.error('Error getting high scores:', error);
            throw error;
        }
    },
    
    // Get user's best score
    async getUserBestScore() {
        try {
            if (!this.supabase) {
                throw new Error('Database not initialized');
            }
            
            const user = await Wallet.getCurrentAccount();
            if (!user) {
                throw new Error('User not connected');
            }
            
            // Convert wallet address to lowercase to ensure case-insensitive matching
            const normalizedWalletAddress = user.toLowerCase();
            
            // First try to get from users table (more efficient)
            const { data: userData, error: userError } = await this.supabase
                .from('user_profiles')
                .select('flappy_ape_score')
                .ilike('wallet_address', normalizedWalletAddress)
                .maybeSingle();
            
            if (userError || !userData) {
                console.log('Falling back to game_scores for best score');
                // Fallback to game_scores if users table query fails
                try {
                    const { data, error } = await this.supabase
                        .from('game_scores')
                        .select('score')
                        .eq('game_id', CONFIG.GAME_ID)
                        .ilike('wallet_address', normalizedWalletAddress)
                        .order('score', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    
                    if (error) {
                        console.warn('Error getting game score:', error);
                        return 0;
                    }
                    return data && data.score ? data.score : 0;
                } catch (scoreError) {
                    console.error('Error in game_scores fallback:', scoreError);
                    return 0;
                }
            }
            
            return userData && userData.flappy_ape_score ? userData.flappy_ape_score : 0;
        } catch (error) {
            console.error('Error getting user best score:', error);
            return 0; // Return 0 instead of throwing to prevent game disruption
        }
    },
    
    // Get user's rank
    async getUserRank() {
        try {
            if (!this.supabase) {
                throw new Error('Database not initialized');
            }
            
            const user = await Wallet.getCurrentAccount();
            if (!user) {
                throw new Error('User not connected');
            }
            
            // This uses a custom RPC function which you might need to create
            // Alternatively, we can calculate the rank manually
            try {
                const { data: userScore, error: userScoreError } = await this.supabase
                    .from('user_profiles')
                    .select('flappy_ape_score')
                    .eq('wallet_address', user)
                    .single();
                
                if (userScoreError) throw userScoreError;
                if (!userScore) return null;
                
                const { data: betterScores, error: rankError } = await this.supabase
                    .from('user_profiles')
                    .select('count')
                    .gt('flappy_ape_score', userScore.flappy_ape_score);
                
                if (rankError) throw rankError;
                return betterScores.count + 1; // Add 1 to get rank (1-based)
            } catch (rpcError) {
                console.warn('RPC function not available, calculating rank manually');
                
                // Fallback to manual rank calculation
                const { data: userScore } = await this.supabase
                    .from('user_profiles')
                    .select('flappy_ape_score')
                    .eq('wallet_address', user)
                    .single();
                
                if (!userScore) return null;
                
                const { count } = await this.supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .gt('flappy_ape_score', userScore.flappy_ape_score);
                
                return count + 1;
            }
        } catch (error) {
            console.error('Error getting user rank:', error);
            throw error;
        }
    }
}; 