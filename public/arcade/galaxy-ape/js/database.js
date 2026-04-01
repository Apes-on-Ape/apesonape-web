// Run Ape - Database Module

const Database = {
    // Supabase client
    supabase: null,
    
    // Initialization status
    isSupabaseConfigured: false,
    
    // Initialize database connection
    init: function() {
        try {
            console.log('Database initialization started...');
            console.log('Window supabase available:', typeof window !== 'undefined' && window.supabase);
            console.log('CONFIG.SUPABASE_URL available:', CONFIG.SUPABASE_URL);
            console.log('CONFIG.SUPABASE_KEY available:', CONFIG.SUPABASE_KEY ? 'Yes' : 'No');
            
            // Try to initialize Supabase if configuration is available
            if (typeof window !== 'undefined' && window.supabase && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
                console.log('Initializing Supabase connection...');
                this.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
                this.isSupabaseConfigured = true;
                console.log('Supabase configured successfully');
                
                // Test the connection
                this.testDatabaseConnection();
            } else {
                console.log('Supabase not available, using local mode');
                console.log('Missing:', {
                    windowSupabase: !(typeof window !== 'undefined' && window.supabase),
                    supabaseUrl: !CONFIG.SUPABASE_URL,
                    supabaseKey: !CONFIG.SUPABASE_KEY
                });
                this.isSupabaseConfigured = false;
            }
            
            // Load from local storage as a fallback
            this.loadLocalScores();
            
            return true;
        } catch (error) {
            console.error('Error initializing database:', error);
            this.isSupabaseConfigured = false;
            this.loadLocalScores();
            return false;
        }
    },
    
    // Test database connection
    testDatabaseConnection: async function() {
        if (!this.isSupabaseConfigured || !this.supabase) {
            console.log('Database not configured, skipping connection test');
            return;
        }
        
        try {
            console.log('Testing database connection...');
            const { count, error } = await this.supabase
                .from('game_scores')
                .select('*', { count: 'exact', head: true })
                .eq('game_id', 'galaxy_ape');
            
            if (error) {
                console.error('Database connection test failed:', error);
                this.isSupabaseConfigured = false;
            } else {
                console.log('Database connection test successful. Galaxy Ape scores in database:', count);
            }
        } catch (testError) {
            console.error('Database connection test error:', testError);
            this.isSupabaseConfigured = false;
        }
    },
    
    // Load scores from local storage
    loadLocalScores: function() {
        try {
            const localScores = localStorage.getItem('runApeScores');
            if (localScores) {
                this.scores = JSON.parse(localScores);
                console.log('Loaded local scores:', this.scores);
            } else {
                this.scores = [];
            }
        } catch (e) {
            console.error('Error loading local scores:', e);
            this.scores = [];
        }
    },
    
    // Save scores to local storage
    saveLocalScores: function() {
        try {
            localStorage.setItem('runApeScores', JSON.stringify(this.scores));
        } catch (e) {
            console.error('Error saving local scores:', e);
        }
    },
    
    // Save score to database
    saveScore: async function(score) {
        try {
            // Get current wallet address
            const walletAddress = Wallet.getCurrentWallet();
            if (!walletAddress) {
                console.log('No wallet connected, score not saved');
                return { error: 'No wallet connected' };
            }
            
            console.log('Saving score for user:', walletAddress);
            console.log('Current game score:', score);
            
            // Format data for insertion
            const scoreData = {
                wallet_address: walletAddress,
                game_id: 'galaxy_ape', // Use consistent game ID
                score: Math.floor(score),
                created_at: new Date().toISOString()
            };
            
            // If Supabase is not configured, return early
            if (!this.isSupabaseConfigured || !this.supabase) {
                console.log('Supabase not configured, score not saved');
                return { error: 'Database not configured' };
            }
            
            // Check if user already has a score for this game
            const { data: existingScore, error: fetchError } = await this.supabase
                .from('game_scores')
                .select('score')
                .eq('game_id', 'galaxy_ape')
                .ilike('wallet_address', walletAddress)
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
                            game_id: 'galaxy_ape',
                            wallet_address: walletAddress,
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
                
                // Update the user's galaxy_ape_score using upsert
                try {
                    const { data: userData, error: userError } = await this.supabase
                        .from('user_profiles')
                        .upsert(
                            {
                                wallet_address: walletAddress,
                                galaxy_ape_score: score
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
                
                return { message: 'Score updated successfully', score: score };
            }
            
            return { message: 'No new high score', score: existingScore.score };
        } catch (error) {
            console.error('Error saving score:', error);
            return { error: error.message };
        }
    },
    
    // Get high scores
    getHighScores: async function(limit = 10) {
        try {
            // Always try to get scores from database first if Supabase client is available
            if (this.supabase) {
                try {
                    console.log('Fetching high scores from database...');
                    const { data: dbScores, error } = await this.supabase
                        .from('game_scores')
                        .select('wallet_address, score, created_at')
                        .eq('game_id', 'galaxy_ape')
                        .order('score', { ascending: false })
                        .limit(limit);
                    
                    if (error) {
                        console.warn('Error fetching scores from database:', error);
                        // Continue to fallback
                    } else if (dbScores && dbScores.length > 0) {
                        console.log('Fetched scores from database:', dbScores);
                        return { data: dbScores };
                    } else {
                        console.log('No scores found in database');
                    }
                } catch (dbError) {
                    console.warn('Database fetch failed:', dbError);
                }
            }
            
            // Fallback to local scores only if database is not available or failed
            console.log('Using local scores as fallback');
            if (!this.scores) {
                this.loadLocalScores();
            }
            
            // Sort scores
            const sortedScores = [...(this.scores || [])].sort((a, b) => b.score - a.score);
            
            // Return top scores
            return { 
                data: sortedScores.slice(0, limit)
            };
        } catch (error) {
            console.error('Error in getHighScores:', error);
            return { error };
        }
    },
    
    // Get user's high score
    getUserHighScore: async function(walletAddress) {
        if (!walletAddress) {
            console.warn('No wallet address provided');
            return 0;
        }
        
        try {
            // Always try to get from database first if Supabase client is available
            if (this.supabase) {
                try {
                    const { data: dbScore, error } = await this.supabase
                        .from('game_scores')
                        .select('score')
                        .eq('wallet_address', walletAddress)
                        .eq('game_id', 'galaxy_ape')
                        .single();
                    
                    if (error) {
                        console.warn('Error fetching user score from database:', error);
                        // Continue to fallback
                    } else if (dbScore) {
                        console.log('Fetched user score from database:', dbScore.score);
                        return dbScore.score;
                    }
                } catch (dbError) {
                    console.warn('Database fetch failed for user score:', dbError);
                }
            }
            
            // Fallback to local scores only if database is not available or failed
            console.log('Using local score as fallback');
            if (!this.scores) {
                this.loadLocalScores();
            }
            
            const userScore = this.scores ? this.scores.find(
                s => s.wallet_address === walletAddress
            ) : null;
            
            return userScore ? userScore.score : 0;
        } catch (error) {
            console.error('Error in getUserHighScore:', error);
            return 0;
        }
    },
    
    // Get user's rank
    getUserRank: async function(score) {
        if (!score) {
            console.warn('No score provided');
            return 0;
        }
        
        try {
            // Always try to get rank from database first if Supabase client is available
            if (this.supabase) {
                try {
                    const { data: higherScores, error } = await this.supabase
                        .from('game_scores')
                        .select('score')
                        .eq('game_id', 'galaxy_ape')
                        .gt('score', score);
                    
                    if (error) {
                        console.warn('Error fetching rank from database:', error);
                        // Continue to fallback
                    } else {
                        console.log('Fetched rank from database:', higherScores.length + 1);
                        return higherScores.length + 1;
                    }
                } catch (dbError) {
                    console.warn('Database fetch failed for rank:', dbError);
                }
            }
            
            // Fallback to local scores only if database is not available or failed
            console.log('Using local rank calculation as fallback');
            if (!this.scores) {
                this.loadLocalScores();
            }
            
            // Count scores higher than the provided score
            const higherScores = this.scores ? this.scores.filter(s => s.score > score).length : 0;
            
            return higherScores + 1;
        } catch (error) {
            console.error('Error in getUserRank:', error);
            return 0;
        }
    },
    
    // Get usernames for wallet addresses
    getUsernames: async function(walletAddresses) {
        if (!this.supabase || !walletAddresses || walletAddresses.length === 0) {
            return [];
        }
        
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('wallet_address, username')
                .in('wallet_address', walletAddresses);
            
            if (error) {
                console.warn('Error fetching usernames:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.warn('Error fetching usernames:', error);
            return [];
        }
    },
    
    // Get ape images for wallet addresses
    getApeImages: async function(walletAddresses) {
        if (!this.supabase || !walletAddresses || walletAddresses.length === 0) {
            return [];
        }
        
        try {
            // Try to get selected apes from users table first
            const { data: userApes, error: userError } = await this.supabase
                .from('user_profiles')
                .select('wallet_address, selected_ape')
                .in('wallet_address', walletAddresses);
            
            if (userError) {
                console.warn('Error fetching user apes:', userError);
            }
            
            // Also try selected_apes table as backup
            const { data: selectedApes, error: selectedError } = await this.supabase
                .from('selected_apes')
                .select('wallet_address, image_url, token_id')
                .in('wallet_address', walletAddresses);
            
            if (selectedError) {
                console.warn('Error fetching selected apes:', selectedError);
            }
            
            return {
                userApes: userApes || [],
                selectedApes: selectedApes || []
            };
        } catch (error) {
            console.warn('Error fetching ape images:', error);
            return { userApes: [], selectedApes: [] };
        }
    },
    
    // Initialize empty scores array
    scores: [],
    
    // Debug function to test database connection and data
    debugDatabase: async function() {
        console.log('ðŸ” GALAXY APE DATABASE DEBUG:');
        console.log('Supabase client available:', !!this.supabase);
        console.log('isSupabaseConfigured:', this.isSupabaseConfigured);
        
        if (!this.supabase) {
            console.error('âŒ No Supabase client available');
            return;
        }
        
        try {
            // Test 1: Check if we can connect to the database
            console.log('ðŸ“¡ Test 1: Testing database connection...');
            const { data: testData, error: testError } = await this.supabase
                .from('game_scores')
                .select('count(*)', { count: 'exact', head: true })
                .eq('game_id', 'galaxy_ape');
            
            if (testError) {
                console.error('âŒ Database connection test failed:', testError);
            } else {
                console.log('âœ… Database connection successful');
            }
            
            // Test 2: Get all galaxy_ape scores
            console.log('ðŸ“Š Test 2: Fetching all galaxy_ape scores...');
            const { data: scores, error: scoresError } = await this.supabase
                .from('game_scores')
                .select('wallet_address, score, created_at')
                .eq('game_id', 'galaxy_ape')
                .order('score', { ascending: false });
            
            if (scoresError) {
                console.error('âŒ Error fetching scores:', scoresError);
            } else {
                console.log('âœ… Fetched scores from database:', scores);
                console.log('ðŸ“ˆ Number of scores:', scores.length);
                
                if (scores.length > 0) {
                    console.log('ðŸ† Top 5 scores:');
                    scores.slice(0, 5).forEach((score, index) => {
                        console.log(`  ${index + 1}. ${score.wallet_address.substring(0, 10)}... - ${score.score}`);
                    });
                }
            }
            
            // Test 3: Get user data for top scores
            if (scores && scores.length > 0) {
                console.log('ðŸ‘¤ Test 3: Fetching user data for top scores...');
                const walletAddresses = scores.slice(0, 5).map(s => s.wallet_address);
                
                const { data: users, error: usersError } = await this.supabase
                    .from('user_profiles')
                    .select('wallet_address, username, selected_ape')
                    .in('wallet_address', walletAddresses);
                
                if (usersError) {
                    console.error('âŒ Error fetching users:', usersError);
                } else {
                    console.log('âœ… Fetched user data:', users);
                }
            }
            
        } catch (error) {
            console.error('âŒ Database debug error:', error);
        }
    },
};

// Initialize database when the script loads
document.addEventListener('DOMContentLoaded', function() {
    Database.init();
}); 