// Secure Database Wrapper for Apes on Ape Arcade
// Provides sanitized database operations with built-in security measures

(function() {
    'use strict';

    // Secure Supabase Database Wrapper
    window.SecureDB = {
        
        // Private variables (using closure for security)
        _supabaseClient: null,
        _initialized: false,
        
        // Initialize with secure configuration
        init: function(supabaseUrl, supabaseKey) {
            if (!supabaseUrl || !supabaseKey) return false;
            
            this._supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            this._initialized = true;
            return true;
        },
        
        // Check if database is ready
        isReady: function() {
            return this._initialized && this._supabaseClient;
        },
        
        // Secure user operations
        user: {
            // Get user by wallet address
            getByWallet: async function(walletAddress) {
                if (!window.SecureDB.isReady()) throw new Error('Database not initialized');
                if (!window.ArcadeSecurity.validateWallet(walletAddress)) throw new Error('Invalid wallet');
                
                const sanitizedWallet = window.ArcadeSecurity.sanitizeInput(walletAddress, 'walletAddress');
                
                const { data, error } = await window.SecureDB._supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('wallet_address', sanitizedWallet)
                    .single();
                
                if (error && error.code !== 'PGRST116') throw error;
                return data;
            },
            
            // Create or update user
            upsert: async function(userData) {
                if (!window.SecureDB.isReady()) throw new Error('Database not initialized');
                
                const sanitizedData = window.ArcadeSecurity.sanitizeDbQuery(userData);
                if (!window.ArcadeSecurity.validateWallet(sanitizedData.wallet_address)) {
                    throw new Error('Valid wallet address is required');
                }
                var w = String(sanitizedData.wallet_address).toLowerCase().trim();
                if (!sanitizedData.glyph_user_id) {
                    sanitizedData.glyph_user_id = 'legacy:' + w;
                }
                
                const { data, error } = await window.SecureDB._supabaseClient
                    .from('user_profiles')
                    .upsert(sanitizedData, { onConflict: 'wallet_address' })
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            },
            
            // Update user field securely
            updateField: async function(walletAddress, field, value) {
                if (!window.SecureDB.isReady()) {
                    throw new Error('Database not initialized');
                }
                
                // Validate wallet address
                if (!window.ArcadeSecurity.validateWallet(walletAddress)) {
                    throw new Error('Invalid wallet address');
                }
                
                // Sanitize inputs
                const sanitizedWallet = window.ArcadeSecurity.sanitizeInput(walletAddress, 'walletAddress');
                const sanitizedField = window.ArcadeSecurity.sanitizeInput(field, 'text');
                
                // Validate field name (whitelist approach)
                const allowedFields = ['username', 'selected_ape', 'total_points', 'block_dodger_score', 
                                     'neon_racer_score', 'galaxy_ape_score', 'ape_man_score', 'flappy_ape_score'];
                
                if (!allowedFields.includes(sanitizedField)) {
                    throw new Error('Invalid field name');
                }
                
                // Sanitize value based on field type
                let sanitizedValue;
                if (sanitizedField === 'username') {
                    sanitizedValue = window.ArcadeSecurity.sanitizeInput(value, 'username');
                    if (!window.ArcadeSecurity.validateInput(sanitizedValue, 'username')) {
                        throw new Error('Invalid username format');
                    }
                } else if (sanitizedField.includes('score') || sanitizedField === 'total_points') {
                    sanitizedValue = parseInt(window.ArcadeSecurity.sanitizeInput(value.toString(), 'score'));
                    if (isNaN(sanitizedValue) || sanitizedValue < 0) {
                        throw new Error('Invalid score value');
                    }
                } else {
                    sanitizedValue = window.ArcadeSecurity.sanitizeInput(value, 'text');
                }
                
                try {
                    const updateData = {};
                    updateData[sanitizedField] = sanitizedValue;
                    
                    const { data, error } = await window.SecureDB._supabaseClient
                        .from('user_profiles')
                        .update(updateData)
                        .eq('wallet_address', sanitizedWallet)
                        .select()
                        .single();
                    
                    if (error) {
                        throw error;
                    }
                    
                    return data;
                } catch (error) {
                    console.error('Error updating user field:', error);
                    throw new Error('Database update failed');
                }
            }
        },
        
        // Secure game score operations
        gameScores: {
            // Submit game score with anti-cheat validation
            submit: async function(walletAddress, gameId, score, gameTime = 0) {
                if (!window.SecureDB.isReady()) throw new Error('Database not initialized');
                if (!window.ArcadeSecurity.checkRateLimit('gameSubmissions', walletAddress)) {
                    throw new Error('Rate limit exceeded');
                }
                if (!window.ArcadeSecurity.validateScore(score, gameId, gameTime)) {
                    throw new Error('Score validation failed');
                }
                
                const sanitizedWallet = window.ArcadeSecurity.sanitizeInput(walletAddress, 'walletAddress');
                const sanitizedScore = parseInt(window.ArcadeSecurity.sanitizeInput(score.toString(), 'score'));
                
                const { data, error } = await window.SecureDB._supabaseClient
                    .from('game_scores')
                    .insert({
                        wallet_address: sanitizedWallet,
                        game_id: gameId,
                        score: sanitizedScore,
                        created_at: new Date().toISOString()
                    });
                
                if (error) throw error;
                return data;
            },
            
            // Update user's high score
            updateHighScore: async function(walletAddress, gameId, score) {
                try {
                    const fieldName = `${gameId}_score`;
                    
                    // Get current high score
                    const user = await window.SecureDB.user.getByWallet(walletAddress);
                    const currentHighScore = user ? (user[fieldName] || 0) : 0;
                    
                    // Update if new score is higher
                    if (score > currentHighScore) {
                        await window.SecureDB.user.updateField(walletAddress, fieldName, score);
                    }
                } catch (error) {
                    console.error('Error updating high score:', error);
                    // Don't throw - this is a secondary operation
                }
            },
            
            // Get leaderboard with sanitized output
            getLeaderboard: async function(gameId, limit = 10) {
                if (!window.SecureDB.isReady()) {
                    throw new Error('Database not initialized');
                }
                
                // Validate game ID
                const allowedGames = ['block_dodger', 'neon_racer', 'galaxy_ape', 'ape_man', 'flappy_ape'];
                if (!allowedGames.includes(gameId)) {
                    throw new Error('Invalid game ID');
                }
                
                const sanitizedGameId = window.ArcadeSecurity.sanitizeInput(gameId, 'text');
                const sanitizedLimit = Math.min(Math.max(1, parseInt(limit)), 100); // Cap at 100
                
                try {
                    const { data, error } = await window.SecureDB._supabaseClient
                        .from('game_scores')
                        .select('wallet_address, score, created_at')
                        .eq('game_id', sanitizedGameId)
                        .order('score', { ascending: false })
                        .limit(sanitizedLimit);
                    
                    if (error) {
                        throw error;
                    }
                    
                    // Sanitize output data
                    return data.map(entry => ({
                        wallet_address: window.ArcadeSecurity.sanitizeInput(entry.wallet_address, 'walletAddress'),
                        score: parseInt(entry.score),
                        created_at: entry.created_at
                    }));
                } catch (error) {
                    console.error('Error getting leaderboard:', error);
                    throw new Error('Leaderboard query failed');
                }
            }
        },
        
        // Secure wallet points operations
        walletPoints: {
            // Get wallet points
            get: async function(walletAddress) {
                if (!window.SecureDB.isReady()) {
                    throw new Error('Database not initialized');
                }
                
                if (!window.ArcadeSecurity.validateWallet(walletAddress)) {
                    throw new Error('Invalid wallet address');
                }
                
                const sanitizedWallet = window.ArcadeSecurity.sanitizeInput(walletAddress, 'walletAddress');
                
                try {
                    const { data, error } = await window.SecureDB._supabaseClient
                        .from('user_profiles')
                        .select('total_points')
                        .eq('wallet_address', sanitizedWallet)
                        .single();
                    
                    if (error && error.code !== 'PGRST116') {
                        throw error;
                    }
                    
                    return data ? data.total_points : 0;
                } catch (error) {
                    console.error('Error getting wallet points:', error);
                    throw new Error('Points query failed');
                }
            },
            
            // Add points to wallet
            add: async function(walletAddress, points, reason = 'game_reward') {
                if (!window.SecureDB.isReady()) {
                    throw new Error('Database not initialized');
                }
                
                // Validate inputs
                if (!window.ArcadeSecurity.validateWallet(walletAddress)) {
                    throw new Error('Invalid wallet address');
                }
                
                const sanitizedWallet = window.ArcadeSecurity.sanitizeInput(walletAddress, 'walletAddress');
                const sanitizedPoints = Math.max(0, Math.min(10000, parseInt(points))); // Cap points
                const sanitizedReason = window.ArcadeSecurity.sanitizeInput(reason, 'text');
                
                try {
                    // Get current points from user_profiles
                    const currentPoints = await this.get(sanitizedWallet);
                    const newTotal = currentPoints + sanitizedPoints;
                    
                    // Update user's total points in user_profiles
                    await window.SecureDB.user.updateField(sanitizedWallet, 'total_points', newTotal);
                    
                    return newTotal;
                } catch (error) {
                    console.error('Error adding wallet points:', error);
                    throw new Error('Points addition failed');
                }
            }
        },
        
        // Utility function to test database connection
        testConnection: async function() {
            if (!this.isReady()) {
                return false;
            }
            
            try {
                const { data, error } = await this._supabaseClient
                    .from('user_profiles')
                    .select('id')
                    .limit(1);
                
                return !error;
            } catch (error) {
                console.error('Database connection test failed:', error);
                return false;
            }
        }
    };
    
    // Auto-initialize if environment variables are available
    document.addEventListener('DOMContentLoaded', function() {
        if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            window.SecureDB.init(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        } else {
            console.warn('Supabase credentials not found in environment variables');
        }
    });

})(); 