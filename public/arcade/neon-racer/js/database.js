// Neon Racer - Database Module (Supabase)

const Database = {
    // Supabase client
    supabase: null,
    isInitialized: false,
    
    // Merged arcade profile (was `users` pre–014 migration)
    USERS_TABLE: 'user_profiles',
    USER_UPGRADES_TABLE: 'user_upgrades',
    GAME_SCORES_TABLE: 'game_scores',
    
    // Game identifier
    GAME_ID: 'neon_racer',

    readGlyphIdentityPayload: function() {
        const payload = {};
        try {
            const gid = (localStorage.getItem('glyphUserId') || sessionStorage.getItem('glyphUserId') || '').trim();
            if (gid) payload.glyph_user_id = gid;
        } catch (_) {}
        try {
            const gw = (
                localStorage.getItem('glyphEvmWallet') ||
                sessionStorage.getItem('glyphEvmWallet') ||
                ''
            ).trim().toLowerCase();
            if (gw) payload.glyph_evm_wallet = gw;
        } catch (_) {}
        return payload;
    },

    postShopState: async function(body) {
        const res = await fetch('/api/arcade/shop/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                ...body,
                ...this.readGlyphIdentityPayload(),
            }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(json?.error || `Shop API error (${res.status})`);
        }
        return json;
    },
    
    // LocalStorage functions for fallback
    getLocalData: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting local data:', error);
            return null;
        }
    },
    
    saveLocalData: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving local data:', error);
            return false;
        }
    },
    
    // Initialize Supabase connection
    initializeSupabase: function() {
        try {
            console.log('Initializing Supabase connection');
            
            // Check if already initialized through the shared arcade system
            if (window.supabaseClient) {
                console.log('Using existing Supabase client from arcade system');
                this.supabase = window.supabaseClient;
                this.isInitialized = true;
                
                // Test the connection
                this.testConnection();
                return true;
            }
            
            // Use the correct Supabase URL and key
            const SUPABASE_URL = 'https://bqcrbcpmimfojnjdhvrz.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxY3JiY3BtaW1mb2puamRodnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjE1ODEsImV4cCI6MjA4MDI5NzU4MX0.tlDiLyCdrOAULzLH9fv0rm5wpiHqy4nzDvmpC9xXRGw';
            
            if (!SUPABASE_ANON_KEY) {
                console.error('Supabase anonymous key not found');
                return false;
            }
            
                try {
                this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    },
                    global: {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY
                        }
                    }
                });
                    window.supabaseClient = this.supabase; // Share with other games
                    this.isInitialized = true;
                console.log('Supabase initialized successfully');
                
                // Test the connection
                this.testConnection();
                    return true;
                } catch (error) {
                console.error('Error initializing Supabase:', error);
                return false;
            }
        } catch (error) {
            console.error('Error in initializeSupabase:', error);
            return false;
        }
    },
    
    // Test the Supabase connection
    testConnection: async function() {
        try {
            if (!this.supabase) {
                console.error('Supabase client not initialized');
                return false;
            }
            
            // Test access to the tables
            try {
                const [usersResult, upgradesResult] = await Promise.all([
                    this.supabase.from(this.USERS_TABLE).select('count').limit(1),
                    this.supabase.from(this.USER_UPGRADES_TABLE).select('count').limit(1)
                ]);
                
                if (usersResult.error) {
                    console.error('Error accessing user_profiles:', usersResult.error);
                    return false;
                }
                
                if (upgradesResult.error) {
                    console.error('Error accessing user_upgrades table:', upgradesResult.error);
                    return false;
                }
                
                console.log('Tables accessed successfully');
            } catch (error) {
                console.error('Error testing tables:', error);
                return false;
            }
            
            console.log('Supabase connection test successful');
            return true;
        } catch (error) {
            console.error('Error testing Supabase connection:', error);
            return false;
        }
    },
    
    // Get user profile including upgrades
    getUserProfile: async function(walletAddress) {
        try {
            if (!this.supabase || !walletAddress) {
                console.error('Cannot get user profile: Supabase not configured or wallet not provided');
                return null;
            }
            walletAddress = String(walletAddress).trim().toLowerCase();
            
            // Get user profile from user_profiles
            const { data: userData, error: userError } = await this.supabase
                .from(this.USERS_TABLE)
                .select('*')
                .eq('wallet_address', walletAddress)
                .single();
            
            if (userError) {
                console.error('Error getting user profile:', userError);
            }
            
            // If no user record found, create one
            if (!userData) {
                return this.createUserProfile(walletAddress);
            }
            
            // Get user's upgrades
            const { data: upgradesData, error: upgradesError } = await this.supabase
                .from(this.USER_UPGRADES_TABLE)
                .select('upgrades')
                .eq('wallet_address', walletAddress)
                .eq('game_id', this.GAME_ID)
                .single();
            
            if (upgradesError) {
                console.error('Error getting user upgrades:', upgradesError);
            }
            
            // Combine user data with upgrades
            return {
                ...userData,
                upgrades: upgradesData ? upgradesData.upgrades : {}
            };
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            return null;
        }
    },
    
    // Create a new user profile
    createUserProfile: async function(walletAddress) {
        try {
            if (!this.supabase || !walletAddress) {
                console.error('Cannot create user profile: Supabase not configured or wallet not provided');
                return null;
            }
            var _w = String(walletAddress).trim().toLowerCase();
            var _legacyGid = 'legacy:' + _w;
            const { data: userData, error: userError } = await this.supabase
                .from(this.USERS_TABLE)
                .insert([
                    {
                wallet_address: _w,
                        glyph_user_id: _legacyGid,
                        username: `Player${Math.floor(Math.random() * 10000)}`,
                        total_points: 0
                    }
                ])
                .select()
                .single();
            
            if (userError) {
                console.error('Error creating user profile:', userError);
                return null;
            }
            
            // Create initial upgrades record
            const { error: upgradesError } = await this.supabase
                .from(this.USER_UPGRADES_TABLE)
                .insert([
                    {
                    wallet_address: _w, 
                        game_id: this.GAME_ID,
                        upgrades: {}
                    }
                ]);
            
            if (upgradesError) {
                console.error('Error creating initial upgrades:', upgradesError);
            }
            
            return {
                ...userData,
                upgrades: {}
            };
        } catch (error) {
            console.error('Error in createUserProfile:', error);
            return null;
        }
    },
    
    // Save user upgrades
    saveUpgrades: async function(walletAddress, upgrades) {
        try {
            if (!walletAddress) {
                console.error('Cannot save upgrades: wallet not provided');
                return false;
            }
            const normWallet = String(walletAddress).trim().toLowerCase();
            const safeUpgrades = upgrades && typeof upgrades === 'object' ? upgrades : {};
            for (const [upgradeId, value] of Object.entries(safeUpgrades)) {
                await this.postShopState({
                    action: 'save_upgrade',
                    wallet_address: normWallet,
                    game_id: this.GAME_ID,
                    upgrade_id: upgradeId,
                    level: Number(value && value.level != null ? value.level : value || 0),
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error in saveUpgrades:', error);
            return false;
        }
    },
    
    // Get user upgrades
    getUpgrades: async function(walletAddress) {
        try {
            if (!walletAddress) {
                console.error('Cannot get upgrades: wallet not provided');
                return null;
            }
            const state = await this.postShopState({
                action: 'get',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: this.GAME_ID,
            });
            const raw = state?.upgrades || {};
            const mapped = {};
            Object.entries(raw).forEach(([key, level]) => {
                mapped[key] = { level: Number(level || 0) };
            });
            return mapped;
        } catch (error) {
            console.error('Error in getUpgrades:', error);
            return null;
        }
    },
    
    // Get wallet points
    getWalletPoints: async function(walletAddress) {
        if (!walletAddress) {
            console.error('Cannot get wallet points: wallet not connected');
            return 0;
        }
        
        try {
            const state = await this.postShopState({
                action: 'get',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: this.GAME_ID,
            });
            return Number(state?.total_points || 0);
        } catch (error) {
            console.error('Exception getting wallet points:', error);
            return 0;
        }
    },
    
    // Save score to database
    saveScore: async function(walletAddress, score) {
        console.log('Saving score to database:', { walletAddress, score, gameId: this.GAME_ID });
        
        if (!this.isInitialized || !this.supabase || !walletAddress) {
            console.error('Cannot save score: Supabase not configured or wallet not connected');
            return false;
        }
        walletAddress = String(walletAddress).trim().toLowerCase();
        
        if (!score || score <= 0) {
            console.warn('Invalid score, not saving:', score);
            return false;
        }
        
        try {
            // Get current timestamp in ISO format
            const timestamp = new Date().toISOString();
            
            // First check if user already has a score for this game
            const { data: existingScore, error: checkError } = await this.supabase
                .from(this.GAME_SCORES_TABLE)
                .select('score')
                .eq('wallet_address', walletAddress)
                .eq('game_id', this.GAME_ID)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing score:', checkError);
                return false;
            }
            
            if (existingScore) {
                // Only update if new score is higher
                if (score > existingScore.score) {
                    console.log(`New score ${score} is higher than existing score ${existingScore.score}, updating`);
                    
                    const { error: updateError } = await this.supabase
                        .from(this.GAME_SCORES_TABLE)
                        .update({
                            score: score,
                            created_at: timestamp
                        })
                        .eq('wallet_address', walletAddress)
                        .eq('game_id', this.GAME_ID);
                    
                    if (updateError) {
                        console.error('Error updating score:', updateError);
                        return false;
                    }
                } else {
                    console.log(`New score ${score} is not higher than existing score ${existingScore.score}, not updating`);
                    return true; // Still return success
                }
            } else {
                // Insert new score
                console.log('No existing score found, inserting new record');
                
                const { error: insertError } = await this.supabase
                    .from(this.GAME_SCORES_TABLE)
                    .insert([{
                        wallet_address: walletAddress,
                        game_id: this.GAME_ID,
                        score: score,
                        created_at: timestamp
                    }]);
                
                if (insertError) {
                    console.error('Error inserting score:', insertError);
                    return false;
                }
            }
            
            console.log('Score saved successfully');
            return true;
        } catch (error) {
            console.error('Exception saving score:', error);
            return false;
        }
    },
    
    // Get player's high score
    getPlayerHighScore: async function(walletAddress) {
        if (!this.isInitialized || !this.supabase || !walletAddress) {
            console.error('Cannot get player high score: Supabase not configured or wallet not connected');
            return 0;
        }
        walletAddress = String(walletAddress).trim().toLowerCase();
        
        try {
            const { data, error } = await this.supabase
                .from(this.GAME_SCORES_TABLE)
                .select('score')
                .eq('wallet_address', walletAddress)
                .eq('game_id', this.GAME_ID)
                .order('score', { ascending: false })
                .limit(1);
            
            if (error) {
                console.error('Error getting player high score:', error);
                return 0;
            }
            
            return data && data.length > 0 ? data[0].score : 0;
        } catch (error) {
            console.error('Exception getting player high score:', error);
            return 0;
        }
    },
    
    // Get top scores
    getTopScores: async function(limit = 10) {
        if (!this.isInitialized || !this.supabase) {
            console.error('Cannot get top scores: Supabase not configured');
            return [];
        }
        
        try {
            const { data, error } = await this.supabase
                .from(this.GAME_SCORES_TABLE)
                .select('wallet_address, score, created_at')
                .eq('game_id', this.GAME_ID)
                .order('score', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('Error getting top scores:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('Exception getting top scores:', error);
            return [];
        }
    },
    
    // Update wallet points in database
    updateWalletPoints: async function(walletAddress, points) {
        if (!walletAddress) {
            console.error('Cannot update wallet points: wallet not provided');
            return false;
        }
        
        try {
            const normWallet = String(walletAddress).trim().toLowerCase();
            await this.postShopState({
                action: 'set_points',
                wallet_address: normWallet,
                game_id: this.GAME_ID,
                points: Number(points || 0),
            });
            return true;
        } catch (error) {
            console.error('Exception updating wallet points:', error);
            return false;
        }
    }
}; 