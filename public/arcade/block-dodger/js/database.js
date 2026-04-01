// Block Dodger - Database Module

const Database = {
    // Database state
    supabase: null,
    isSupabaseConfigured: false,

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
    
    // Initialize Supabase client
    initializeSupabase: function() {
        // Check if Supabase library is loaded
        if (!window.supabase) {
            console.error('Supabase library not found');
            return;
        }
        
        // Try to initialize with environment variables first
        if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            try {
                this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                this.isSupabaseConfigured = true;
                console.log('Supabase initialized with environment variables');
                return;
            } catch (error) {
                console.error('Error initializing Supabase with environment variables:', error);
            }
        }
        
        console.log('Supabase not configured. Please configure manually.');
    },
    
    // Get wallet points from database
    getWalletPoints: async function(walletAddress) {
        try {
            if (!walletAddress) return 0;
            const data = await this.postShopState({
                action: 'get',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: 'block_dodger',
            });
            return Number(data?.total_points || 0);
        } catch (error) {
            console.error('Exception getting wallet points:', error);
            return 0;
        }
    },
    
    // Check if Supabase is configured
    checkSupabaseConfig: function() {
        // Check for environment variables
        if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            try {
                this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                this.isSupabaseConfigured = true;
                console.log('Supabase configured from environment variables');
                return true;
            } catch (error) {
                console.error('Error initializing Supabase with environment variables:', error);
            }
        }
        
        console.log('No valid Supabase configuration found');
        this.isSupabaseConfigured = false;
        return false;
    },
    
    // Save score to database
    saveScore: function(finalScore, walletAddress) {
        console.log('Saving score for user:', walletAddress);
        console.log('Current game score:', finalScore);
        
        if (!this.isSupabaseConfigured || !this.supabase) {
            console.error('Supabase not configured, cannot save score');
            UI.showGameOver(finalScore);
            return;
        }
        
        // First get the current highest score and total points
        Promise.all([
            this.supabase.from('game_scores').select('score').eq('wallet_address', walletAddress).eq('game_id', 'block_dodger').single(),
            this.supabase.from('user_profiles').select('total_points, block_dodger_score').eq('wallet_address', walletAddress).single()
        ]).then(([scoreResult, pointsResult]) => {
            console.log('Current scores:', { scoreResult, pointsResult });
            
            const currentHighestScore = scoreResult.data?.score || 0;
            const currentTotalPoints = pointsResult.data?.total_points || 0;
            
            console.log('Current values:', { currentHighestScore, currentTotalPoints });
            
            // Only save game score if it's higher than the current highest score
            if (finalScore > currentHighestScore) {
                console.log('Saving new high score:', finalScore);
                this.supabase.from('game_scores')
                    .upsert({
                        wallet_address: walletAddress,
                        score: finalScore,
                        game_id: 'block_dodger'
                    }, {
                        onConflict: 'wallet_address,game_id'
                    })
                    .then(result => {
                        if (result.error) {
                            console.error('Failed to save high score:', result.error);
                        } else {
                            console.log('New high score saved successfully');
                            
                            // Update block_dodger_score in the users table
                            this.supabase.from('user_profiles')
                                .upsert({
                                    wallet_address: walletAddress,
                                    block_dodger_score: finalScore
                                }, {
                                    onConflict: 'wallet_address'
                                })
                                .then(updateResult => {
                                    if (updateResult.error) {
                                        console.error('Failed to update block_dodger_score:', updateResult.error);
                                    } else {
                                        console.log('block_dodger_score updated successfully');
                                    }
                                });
                        }
                    });
            }
            
            // Calculate new total points
            const newTotalPoints = currentTotalPoints + finalScore;
            console.log('Updating total points:', newTotalPoints);
            
            // Use the users table to update total_points
            this.supabase.from('user_profiles')
                .upsert({
                    wallet_address: walletAddress,
                    total_points: newTotalPoints
                }, {
                    onConflict: 'wallet_address'
                })
                .then(result => {
                    if (result.error) {
                        console.error('Failed to update total_points:', result.error);
                        UI.showGameOver(finalScore, currentTotalPoints);
                    } else {
                        console.log('Total points updated successfully');
                        Wallet.walletPoints = newTotalPoints;
                        if (window.pointsValue) {
                            window.pointsValue.textContent = newTotalPoints;
                        }
                        UI.showGameOver(finalScore, newTotalPoints);
                    }
                });
        }).catch(error => {
            console.error('Error fetching current scores:', error);
            UI.showGameOver(finalScore);
        });
    },
    
    // Show Supabase configuration dialog
    showSupabaseConfig: function() {
        const modal = document.getElementById('supabaseConfigModal');
        const urlInput = document.getElementById('supabaseUrl');
        const keyInput = document.getElementById('supabaseKey');
        
        // Load existing configuration from runtime env only
        urlInput.value = window.SUPABASE_URL || '';
        keyInput.value = window.SUPABASE_ANON_KEY || '';
        
        // Add a custom style for the modal to ensure it's visible
        modal.style.display = 'block';
        modal.style.zIndex = '9999';
        
        console.log('Supabase configuration modal opened');
    },
    
    // Close Supabase configuration dialog
    closeSupabaseConfig: function() {
        const modal = document.getElementById('supabaseConfigModal');
        modal.style.display = 'none';
    },
    
    // Save Supabase configuration
    saveSupabaseConfig: async function() {
        const url = document.getElementById('supabaseUrl').value;
        const key = document.getElementById('supabaseKey').value;
        
        if (!url || !key) {
            UI.showNotification('Please enter both URL and key', 3000);
            return;
        }
        
        console.log('Saving Supabase configuration with URL:', url);
        
        try {
            // Check if Supabase library is loaded
            if (!window.supabase) {
                console.error('Supabase library not found');
                UI.showNotification('Supabase library not loaded. Please refresh the page.', 5000);
                return;
            }
            
            // Initialize Supabase client using the global Supabase object
            this.supabase = window.supabase.createClient(url, key);
            console.log('Supabase client created');
            
            // Save to global window object for other scripts to use
            window.supabaseClient = this.supabase;
            console.log('Saved Supabase client to window.supabaseClient');
            
            // Test the connection with both tables that we actually use
            try {
                const [gameScoresResult, walletPointsResult] = await Promise.all([
                    this.supabase.from('game_scores').select('count(*)', { count: 'exact', head: true }),
                    this.supabase.from('user_profiles').select('count(*)', { count: 'exact', head: true })
                ]);
                
                console.log('Database test results:', { gameScoresResult, walletPointsResult });
                    
                if (gameScoresResult.error) {
                    console.error('Error accessing game_scores table:', gameScoresResult.error);
                    throw new Error(`Table 'game_scores' access error: ${gameScoresResult.error.message}`);
                }
                
                if (walletPointsResult.error) {
                    console.error('Error accessing users table:', walletPointsResult.error);
                    throw new Error(`user_profiles access error: ${walletPointsResult.error.message}`);
                }
                
                console.log('Supabase tables verified:', {
                    gameScores: gameScoresResult.count,
                    walletPoints: walletPointsResult.count
                });
            } catch (dbError) {
                console.error('Database test failed:', dbError);
                
                // Try to create the tables if they don't exist
                try {
                    console.log('Attempting to create required tables...');
                    
                    // Create game_scores table if it doesn't exist
                    await this.supabase.rpc('create_game_scores_if_not_exists');
                    
                    // Create users table if it doesn't exist
                    await this.supabase.rpc('create_users_if_not_exists');
                    
                    console.log('Tables created successfully');
                } catch (createError) {
                    console.error('Failed to create tables:', createError);
                    throw new Error('Failed to create required tables. Please check your Supabase configuration.');
                }
            }
            
            // Set configuration status
            this.isSupabaseConfigured = true;
            
            // Update status display
            const status = document.getElementById('supabaseConfigStatus');
            if (status) {
                status.textContent = 'Supabase configured';
                status.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            }
            
            // Close modal
            this.closeSupabaseConfig();
            
            // Show success message
            UI.showNotification('Supabase configured successfully', 3000);
        } catch (error) {
            console.error('Error configuring Supabase:', error);
            UI.showNotification('Error configuring Supabase: ' + error.message, 5000);
        }
    },
    
    // Clear Supabase configuration
    clearSupabaseConfig: function() {
        if (confirm('Are you sure you want to clear the Supabase configuration?')) {
            const urlInput = document.getElementById('supabaseUrl');
            const keyInput = document.getElementById('supabaseKey');
            
            urlInput.value = '';
            keyInput.value = '';
            
            this.isSupabaseConfigured = false;
            this.supabase = null;
            
            alert('Supabase configuration cleared');
        }
    },
    
    // Get user profile including points
    getUserProfile: async function(walletAddress) {
        if (!this.isSupabaseConfigured || !this.supabase || !walletAddress) {
            console.error('Cannot get user profile: Supabase not configured or wallet not connected');
            return null;
        }
        
        try {
            // Get user data from the users table
            const userResult = await this.supabase
                .from('user_profiles')
                .select('block_dodger_score, total_points')
                .eq('wallet_address', walletAddress)
                .single();
            
            return {
                high_score: userResult.data?.block_dodger_score || 0,
                total_points: userResult.data?.total_points || 0,
                wallet_address: walletAddress
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },
    
    // Deduct points from user's wallet
    deductPoints: async function(walletAddress, amount) {
        if (!this.isSupabaseConfigured || !this.supabase || !walletAddress) {
            console.error('Cannot deduct points: Supabase not configured or wallet not connected');
            return false;
        }
        
        try {
            // Get current points from users table
            const result = await this.supabase
                .from('user_profiles')
                .select('total_points')
                .eq('wallet_address', walletAddress)
                .single();
            
            if (result.error) {
                console.error('Error fetching current points:', result.error);
                return false;
            }
            
            const currentPoints = result.data?.total_points || 0;
            
            // Check if user has enough points
            if (currentPoints < amount) {
                console.error('Not enough points to deduct');
                return false;
            }
            
            // Update points in users table
            const updateResult = await this.supabase
                .from('user_profiles')
                .update({ total_points: currentPoints - amount })
                .eq('wallet_address', walletAddress);
            
            if (updateResult.error) {
                console.error('Error updating points:', updateResult.error);
                return false;
            }
            
            // Update local points
            Wallet.walletPoints = currentPoints - amount;
            if (window.pointsValue) {
                window.pointsValue.textContent = Wallet.walletPoints;
            }
            
            return true;
        } catch (error) {
            console.error('Error deducting points:', error);
            return false;
        }
    },
    
    // Get user's purchases (upgrades and powerups)
    getUserPurchases: async function(walletAddress) {
        if (!walletAddress) {
            console.error('Cannot get user purchases: wallet not connected');
            return null;
        }
        
        console.log('Fetching purchases for wallet:', walletAddress);
        const startTime = Date.now();
        
        try {
            const state = await this.postShopState({
                action: 'get',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: 'block_dodger',
            });
            
            console.log('Purchase data fetched in', Date.now() - startTime, 'ms');
            
            // Extract data from results
            const upgrades = state?.upgrades || {};
            const powerups = state?.powerups || {};
            const selectedPowerup = state?.selected_powerup || null;
            
            console.log('Loaded upgrades:', upgrades);
            console.log('Loaded powerups:', powerups);
            console.log('Selected powerup:', selectedPowerup);
            
            const result = {
                upgrades,
                powerups,
                selectedPowerup
            };
            
            console.log('Final result to return:', result);
            return result;
        } catch (error) {
            console.error('Error fetching user purchases:', error);
            return null;
        }
    },
    
    // Save user upgrade
    saveUserUpgrade: async function(walletAddress, upgradeId, level) {
        if (!walletAddress) {
            console.error('Cannot save user upgrade: wallet not connected');
            return false;
        }
        
        console.log(`Saving upgrade ${upgradeId} level ${level} for wallet ${walletAddress}`);
        const startTime = Date.now();
        
        try {
            await this.postShopState({
                action: 'save_upgrade',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: 'block_dodger',
                upgrade_id: upgradeId,
                level: Number(level || 0),
            });
            
            console.log('Upgrade saved in', Date.now() - startTime, 'ms');
            return true;
        } catch (error) {
            console.error('Error saving user upgrade:', error);
            return false;
        }
    },
    
    // Save user powerup
    saveUserPowerup: async function(walletAddress, powerupId, owned) {
        if (!walletAddress) {
            console.error('Cannot save user powerup: wallet not connected');
            return false;
        }
        
        try {
            await this.postShopState({
                action: 'save_powerup',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: 'block_dodger',
                powerup_id: powerupId,
                owned: Boolean(owned),
            });
            
            return true;
        } catch (error) {
            console.error('Error saving user powerup:', error);
            return false;
        }
    },
    
    // Save selected powerup
    saveSelectedPowerup: async function(walletAddress, powerupId) {
        if (!walletAddress) {
            console.error('Cannot save selected powerup: wallet not connected');
            return false;
        }
        
        try {
            await this.postShopState({
                action: 'save_selected_powerup',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: 'block_dodger',
                powerup_id: powerupId,
            });
            
            return true;
        } catch (error) {
            console.error('Error saving selected powerup:', error);
            return false;
        }
    },
    
    // Ensure that tables needed for shop exist
    ensureTablesExist: async function() {
        if (!this.isSupabaseConfigured || !this.supabase) {
            console.error('Cannot check tables: Supabase not configured');
            return false;
        }
        
        try {
            console.log('Checking table access with new schema');
            
            // Test the new schema with proper structure
            try {
                const testResult = await this.supabase.from('user_upgrades').upsert({
                    wallet_address: 'test_wallet',
                    game_id: 'block_dodger',
                    upgrades: { test: 0 }
                }, { 
                    onConflict: 'wallet_address,game_id',
                    ignoreDuplicates: true
                });
                
                if (testResult.error) {
                    console.warn('Error with test insert, but continuing:', testResult.error.message);
                }
            } catch (insertError) {
                console.warn('Error with test insert, but continuing:', insertError);
            }
            
            // Test powerups table
            try {
                const powerupResult = await this.supabase.from('user_powerups').upsert({
                    wallet_address: 'test_wallet',
                    game_id: 'block_dodger',
                    powerups: { test: false }
                }, { 
                    onConflict: 'wallet_address,game_id',
                    ignoreDuplicates: true
                });
                
                if (powerupResult.error) {
                    console.warn('Error with powerup test insert, but continuing:', powerupResult.error.message);
                }
            } catch (powerupError) {
                console.warn('Error with powerup test insert, but continuing:', powerupError);
            }
            
            // Test selected powerup table
            try {
                const selectedResult = await this.supabase.from('user_selected_powerup').upsert({
                    wallet_address: 'test_wallet',
                    game_id: 'block_dodger',
                    powerup_id: 'test_powerup'
                }, { 
                    onConflict: 'wallet_address,game_id',
                    ignoreDuplicates: true
                });
                
                if (selectedResult.error) {
                    console.warn('Error with selected powerup test, but continuing:', selectedResult.error.message);
                }
            } catch (selectedError) {
                console.warn('Error with selected powerup test, but continuing:', selectedError);
            }
            
            // Always return true to continue with localStorage as fallback
            return true;
        } catch (error) {
            console.error('Error checking tables:', error);
            return true; // Still return true to allow fallback to localStorage
        }
    },
    
    // Update wallet points in database
    updateWalletPoints: async function(walletAddress, points) {
        if (!walletAddress) {
            console.error('Cannot update wallet points: wallet not provided');
            return false;
        }
        
        try {
            console.log(`Updating wallet points for ${walletAddress} to ${points}`);
            await this.postShopState({
                action: 'set_points',
                wallet_address: String(walletAddress).trim().toLowerCase(),
                game_id: 'block_dodger',
                points: Number(points || 0),
            });
            
            console.log('Wallet points updated successfully');
            
            // Update UI elements showing points
            const userCoins = document.getElementById('userCoins');
            if (userCoins) {
                userCoins.textContent = `Total Points: ${points}`;
            }
            
            const shopPoints = document.getElementById('shopPoints');
            if (shopPoints) {
                shopPoints.textContent = points;
            }
            
            return true;
        } catch (error) {
            console.error('Exception updating wallet points:', error);
            return false;
        }
    },
}; 