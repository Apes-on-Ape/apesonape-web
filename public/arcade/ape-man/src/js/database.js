// Ape-Man - Database Module

const Database = {
    supabase: null,
    isSupabaseConfigured: false,
    GAME_ID: 'ape_man',
    GAME_SCORES_TABLE: 'game_scores',

    /** Match server /api/achievements/save_game_stats (normalizeWallet) */
    normalizeWallet: function (w) {
        if (!w || typeof w !== 'string') return '';
        return w.trim().toLowerCase();
    },
    
    // Check for Block Dodger's Supabase configuration
    checkForBlockDodgerConfig: function() {
        // Disabled: do not trust client-modifiable Supabase credentials from storage.
        return null;
    },
    
    // Initialize database connection
    init: function() {
        console.log('Initializing database connection...');
        
        // Always use the correct Supabase instance for Ape-Man
        const supabaseUrl = 'https://bqcrbcpmimfojnjdhvrz.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxY3JiY3BtaW1mb2puamRodnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjE1ODEsImV4cCI6MjA4MDI5NzU4MX0.tlDiLyCdrOAULzLH9fv0rm5wpiHqy4nzDvmpC9xXRGw';
        
        console.log('Using specified Supabase credentials for Ape-Man');
        
        const success = this.configureSupabase(supabaseUrl, supabaseKey);
        console.log('Supabase configuration result:', success ? 'Success' : 'Failed');
        return success;
    },
    
    // Configure Supabase with URL and key
    configureSupabase: function(url, key) {
        try {
            if (!url || !key) {
                console.error('Missing Supabase URL or key');
                return false;
            }
            
            if (typeof supabase === 'undefined') {
                console.error('Supabase SDK not loaded. Make sure the script is included in your HTML.');
                return false;
            }
            
            // Create Supabase client with enhanced headers to prevent 406 errors
            this.supabase = supabase.createClient(url, key, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Client-Info': 'ape-man/1.0.0'
                },
                global: {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                },
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                },
                schema: 'public'
            });
            
            this.isSupabaseConfigured = true;
            
            console.log('Supabase configured successfully');
            return true;
        } catch (error) {
            console.error('Error configuring Supabase:', error);
            return false;
        }
    },
    
    // Save score to database
    saveScore: function(score, walletAddress) {
        const wallet = this.normalizeWallet(walletAddress);
        console.log('saveScore called with:', { score, walletAddress: wallet });
        
        if (!this.isSupabaseConfigured || !this.supabase) {
            console.error('Supabase not configured');
            return Promise.reject('Database not configured');
        }
        
        if (!wallet) {
            console.error('No wallet address provided');
            return Promise.reject('No wallet address provided');
        }
        
        console.log(`Saving score ${score} for wallet ${wallet}`);
        
        // Get current timestamp in ISO format
        const timestamp = new Date().toISOString();
        
        // First, ensure the user exists
        return this.supabase
            .from('user_profiles')
            .select('*')
            .ilike('wallet_address', wallet)
            .single()
            .then(result => {
                console.log('User lookup result:', result);
                
                // If user doesn't exist, create one (ignore error if it already exists)
                if (result.error) {
                    console.log('User not found, creating new user');
                    return this.supabase
                        .from('user_profiles')
                        .insert({
                            wallet_address: wallet
                        })
                        .then(createResult => {
                            console.log('User creation result:', createResult);
                            return createResult;
                        })
                        .catch(error => {
                            console.warn('User creation failed (may already exist):', error);
                            // Continue anyway since we'll save the score to game_scores
                            return { data: null, error: null };
                        });
                }
                
                return { data: null, error: null };
            })
            .then(() => {
                // First check if user already has a score for this game
                return this.supabase
                    .from(this.GAME_SCORES_TABLE)
                    .select('*')
                    .ilike('wallet_address', wallet)
                    .eq('game_id', this.GAME_ID)
                    .single();
            })
            .then(existingScore => {
                console.log('Existing score check result:', existingScore);
                
                if (existingScore.error) {
                    // No existing score, insert a new one
                    console.log('No existing score found, inserting new score record');
                    return this.supabase
                        .from(this.GAME_SCORES_TABLE)
                        .insert({
                            wallet_address: wallet,
                            game_id: this.GAME_ID,
                            score: score,
                            created_at: timestamp
                        });
                } else {
                    // Existing score found, only update if new score is higher
                    const currentScore = existingScore.data.score || 0;
                    if (score > currentScore) {
                        console.log(`New score ${score} is higher than existing score ${currentScore}, updating record`);
                        return this.supabase
                            .from(this.GAME_SCORES_TABLE)
                            .update({
                                score: score,
                                created_at: timestamp
                            })
                            .ilike('wallet_address', wallet)
                            .eq('game_id', this.GAME_ID);
                    } else {
                        console.log(`New score ${score} is not higher than existing score ${currentScore}, skipping update`);
                        return { data: existingScore.data, error: null };
                    }
                }
            })
            .then(result => {
                console.log('Game score save result:', result);
                if (result.error) {
                    console.error('Error saving game score:', result.error);
                    return Promise.reject(result.error);
                }
                
                console.log('Score saved successfully');
                return result;
            })
            .catch(error => {
                console.error('Error in saveScore process:', error);
                return Promise.reject(error);
            });
    },
    
    // Get high scores from database
    getHighScores: function(limit = 10) {
        console.log(`Getting top ${limit} high scores for ${this.GAME_ID}`);
        
        if (!this.isSupabaseConfigured || !this.supabase) {
            console.error('Supabase not configured');
            return Promise.reject('Database not configured');
        }
        
        // Explicitly filter by game_id to ensure we only get ape-man scores
        return this.supabase
            .from(this.GAME_SCORES_TABLE)
            .select('wallet_address, score, created_at')
            .eq('game_id', this.GAME_ID)  // Only get scores for ape-man
            .order('score', { ascending: false })
            .limit(limit)
            .then(result => {
                console.log('High scores result:', result);
                return result;
            })
            .catch(error => {
                console.error('Error getting high scores:', error);
                return { data: [], error: error };
            });
    },
    
    // Get user's high score
    getUserHighScore: function(walletAddress) {
        const wallet = this.normalizeWallet(walletAddress);
        console.log(`Getting high score for wallet ${wallet}`);
        
        if (!this.isSupabaseConfigured || !this.supabase || !wallet) {
            return Promise.reject('Database not configured or no wallet address');
        }
        
        // Explicitly filter by game_id to ensure we only get ape-man scores
        return this.supabase
            .from(this.GAME_SCORES_TABLE)
            .select('score')
            .eq('game_id', this.GAME_ID)  // Only consider ape-man scores
            .ilike('wallet_address', wallet)  // Using ilike for case-insensitive comparison
            .order('score', { ascending: false })
            .limit(1)
            .then(result => {
                console.log('User high score result:', result);
                if (result.error) return Promise.reject(result.error);
                return result.data && result.data.length > 0 ? result.data[0].score : 0;
            });
    },
    
    // Get user's rank
    getUserRank: function(score) {
        console.log(`Getting rank for score ${score}`);
        
        if (!this.isSupabaseConfigured || !this.supabase) {
            return Promise.reject('Database not configured');
        }
        
        // Explicitly filter by game_id to ensure we only consider ape-man scores for ranking
        return this.supabase
            .from(this.GAME_SCORES_TABLE)
            .select('*', { count: 'exact', head: true })
            .eq('game_id', this.GAME_ID)  // Only consider ape-man scores for ranking
            .gt('score', score)
            .then(result => {
                console.log('User rank result:', result);
                if (result.error) return Promise.reject(result.error);
                return (result.count || 0) + 1;
            });
    }
};

// Initialize database on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Database module');
    
    // Always reinitialize on page load to ensure we're using the correct credentials
    const initialized = Database.init();
    console.log('Database initialization result:', initialized ? 'Success' : 'Failed');
    
    // Force connection check after a short delay
    setTimeout(function() {
        if (!Database.isSupabaseConfigured) {
            console.warn('Database not configured after delay, retrying initialization...');
            Database.init();
        } else {
            console.log('Database connection confirmed');
        }
    }, 1000);
});

// Export for use in other modules
window.Database = Database; 