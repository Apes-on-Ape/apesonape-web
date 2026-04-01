// Block Dodger - Profile Module

const Profile = {
    // Load shop data
    loadShopData: function() {
        // Ensure we have a valid Shop object to work with
        const shopObj = (typeof Shop !== 'undefined' && Shop) ? Shop : window.Shop;
        
        // Load upgrades from database only, never from localStorage
        if (shopObj) {
            console.log('Loading shop data from database only');
            
            if (!shopObj.isInitialized) {
                console.log('Initializing shop system');
                shopObj.init();
            }
            
            // Request fresh data from the database only
            console.log('Making explicit database request for user purchases with wallet:', Wallet.currentWallet);
            const self = this; // Store reference to Profile object
            
            shopObj.loadUserPurchasesFromDatabaseOnly(Wallet.currentWallet).then(loaded => {
                console.log('Database user purchases loaded:', loaded);
                if (loaded) {
                    // Apply the loaded upgrades
                    shopObj.applyUpgrades();
                    
                    // Update profile UI if it's visible
                    const upgradesSection = document.getElementById('profileUpgrades');
                    if (upgradesSection) {
                        console.log('Updating profile upgrades with database data');
                        self.updateProfileUpgrades.call(self, upgradesSection);
                    }
                } else {
                    console.warn('No purchase data found in database or request failed');
                }
            }).catch(error => {
                console.error('Error loading user purchases in profile:', error);
            });
        } else {
            console.warn('Shop module not available, some profile features may be limited');
        }
    },
    
    // Show profile
    show: function() {
        console.log('Showing profile view');
        
        // Store reference to Profile object for async callbacks
        const self = this;

        // First, make sure the Shop module is available and loaded
        // This ensures the Shop module is loaded before attempting to use it
        const shopObj = (typeof Shop !== 'undefined' && Shop) ? Shop : window.Shop;
        
        if (!shopObj) {
            console.log('Shop module not detected, attempting to load it');
            
            // Try to load Shop module dynamically if it's missing
            try {
                console.warn('Cannot find Shop module, attempting to load it');
                
                // Create a script element to load shop.js
                const shopScript = document.createElement('script');
                shopScript.src = 'js/shop.js';
                shopScript.onload = function() {
                    console.log('Shop module loaded dynamically');
                    // Initialize shop after loading
                    const loadedShop = (typeof Shop !== 'undefined' && Shop) ? Shop : window.Shop;
                    if (loadedShop) {
                        loadedShop.init();
                        // Call loadShopData with the correct context
                        self.loadShopData();
                    } else {
                        console.error('Failed to find Shop module even after loading shop.js');
                    }
                };
                shopScript.onerror = function(e) {
                    console.error('Failed to load Shop module dynamically:', e);
                };
                document.head.appendChild(shopScript);
            } catch (e) {
                console.error('Error attempting to load Shop module:', e);
            }
        } else {
            // Shop module exists, load the shop data
            self.loadShopData();
        }
        
        // Get profile screen elements
        const profileScreen = document.getElementById('profileModal');
        const profileLoading = document.getElementById('profileLoading');
        const profileError = document.getElementById('profileError');
        const profileStats = document.getElementById('profileStats');
        const profileNoWallet = document.getElementById('profileNoWallet');
        const profileHighScore = document.getElementById('profileHighScore');
        const profileTotalPoints = document.getElementById('profileTotalPoints');
        const profileSelectedApeId = document.getElementById('profileSelectedApeId');
        const profileSelectedApeImage = document.getElementById('profileSelectedApeImage');
        const profileApesButton = document.getElementById('profileApesButton');
        
        console.log('Initializing profile view');
        
        // Check if selectedApe exists before trying to access its properties
        if (window.selectedApe && window.selectedApe.imageUrl) {
            console.log('Selected Ape image URL:', window.selectedApe.imageUrl);
        }
        
        // Add event listener to Apes button if it exists
        if (profileApesButton) {
            profileApesButton.onclick = function() {
                console.log("Select Ape button clicked in profile");
                Profile.close();
                NFT.fetchUserApes();
                document.getElementById('nftSelectionScreen').style.display = 'block';
            };
        }
        
        // Add event listener to Shop icon via JavaScript
        const shopIcon = document.getElementById('shopIcon');
        if (shopIcon) {
            shopIcon.onclick = function() {
                console.log("Shop icon clicked in profile");
                Profile.close();
                // Use the same approach to get the Shop object
                const shopObj = (typeof Shop !== 'undefined' && Shop) ? Shop : window.Shop;
                if (shopObj && typeof shopObj.showShop === 'function') {
                    shopObj.showShop();
                } else {
                    console.error('Cannot show shop: Shop module not available');
                }
            };
        }
        
        // Reset profile view
        if (profileScreen) {
            profileScreen.style.display = 'block';
        } else {
            console.error('Profile modal element not found');
            UI.showNotification('Error: Profile screen not found', 3000);
            return;
        }
        
        if (profileLoading) profileLoading.style.display = 'block';
        if (profileError) profileError.style.display = 'none';
        if (profileStats) profileStats.style.display = 'none';
        if (profileNoWallet) profileNoWallet.style.display = 'none';
        
        // Show selected Ape if available
        if (window.selectedApe && profileSelectedApeId && profileSelectedApeImage) {
            profileSelectedApeId.textContent = window.selectedApe.name || `Ape #${window.selectedApe.tokenId}`;
            
            // Handle IPFS URLs
            let imageUrl = window.selectedApe.imageUrl;
            if (imageUrl && imageUrl.startsWith('ipfs://')) {
                imageUrl = imageUrl.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
            }
            
            console.log('Profile NFT image URL:', imageUrl);
            
            if (imageUrl && imageUrl.length > 0) {
                // Set the actual image directly without placeholder
                console.log('Setting NFT image directly to profile');
                
                // Use data URL directly if it's already in that format
                if (imageUrl.startsWith('data:')) {
                    profileSelectedApeImage.src = imageUrl;
                } else {
                    // Add cache-busting for network URLs
                    profileSelectedApeImage.src = `${imageUrl}?t=${Date.now()}`;
                }
                
                profileSelectedApeImage.alt = window.selectedApe.name || `Ape #${window.selectedApe.tokenId}`;
                
                // Add error handling for image loading
                profileSelectedApeImage.onerror = function() {
                    console.error('Failed to load profile image from primary gateway, trying backup gateway');
                    // Try another gateway if the first one fails
                    if (imageUrl.includes('cloudflare-ipfs.com')) {
                        this.src = imageUrl.replace('cloudflare-ipfs.com', 'gateway.pinata.cloud') + '?t=' + Date.now();
                        
                        // Add another fallback
                        this.onerror = function() {
                            console.error('Failed to load profile image from secondary gateway, trying tertiary gateway');
                            this.src = imageUrl.replace('gateway.pinata.cloud', 'dweb.link') + '?t=' + Date.now();
                            
                            // Final fallback to placeholder
                            this.onerror = function() {
                                console.error('Failed to load profile image from all gateways, using placeholder');
                                this.src = NFT.createApePlaceholder(window.selectedApe.tokenId);
                            }
                        }
                    } else {
                        // Fallback to placeholder
                        this.src = NFT.createApePlaceholder(window.selectedApe.tokenId);
                    }
                };
            } else {
                // Use placeholder as fallback only if no image is available
                console.log('Using profile placeholder image');
                profileSelectedApeImage.src = NFT.createApePlaceholder(window.selectedApe.tokenId);
                profileSelectedApeImage.alt = window.selectedApe.name || `Ape #${window.selectedApe.tokenId}`;
            }
        } else if (profileSelectedApeId && profileSelectedApeImage) {
            profileSelectedApeId.textContent = 'No Ape Selected';
            profileSelectedApeImage.src = '';
            profileSelectedApeImage.alt = 'No Ape Selected';
        }
        
        // Check if wallet is connected
        if (!Wallet.currentWallet) {
            console.log('No wallet connected, cannot show profile data');
            if (profileLoading) profileLoading.style.display = 'none';
            if (profileNoWallet) profileNoWallet.style.display = 'block';
            return;
        }
        
        // Try to initialize Supabase if it's not already configured
        if (!Database.isSupabaseConfigured || !Database.supabase) {
            console.log('Supabase not configured, attempting to configure...');
            if (!Database.checkSupabaseConfig()) {
                console.log('Failed to configure Supabase, showing configuration option');
                if (profileLoading) profileLoading.style.display = 'none';
                if (profileError) {
                    profileError.innerHTML = `
                        <div style="text-align: center; color: #ff4444; padding: 20px;">
                            <p>Database not configured. Please configure Supabase to view your stats.</p>
                            <button onclick="closeProfile(); Database.showSupabaseConfig();" style="margin-top: 10px; padding: 8px 16px; background-color: #00ffff; border: none; border-radius: 5px; cursor: pointer; color: #000;">
                                Configure Database
                            </button>
                        </div>
                    `;
                    profileError.style.display = 'block';
                }
                return;
            }
        }
        
        console.log('Fetching profile data for wallet:', Wallet.currentWallet);
        
        // Set a timeout to show error if data takes too long
        const timeoutId = setTimeout(() => {
            console.warn('Profile data loading timed out after 10 seconds');
            if (profileLoading && profileLoading.style.display === 'block') {
                profileLoading.style.display = 'none';
                if (profileError) {
                    profileError.innerHTML = `
                        <div style="text-align: center; color: #ff4444; padding: 20px;">
                            <p>Loading took too long. Database might be unavailable.</p>
                            <button onclick="Profile.show();" style="margin-top: 10px; padding: 8px 16px; background-color: #00ffff; border: none; border-radius: 5px; cursor: pointer; color: #000;">
                                Try Again
                            </button>
                        </div>
                    `;
                    profileError.style.display = 'block';
                }
            }
        }, 10000);
        
        // Create default entries if they don't exist
        Promise.all([
            // Create empty game score record if it doesn't exist
            Database.supabase.from('game_scores')
                .upsert({ wallet_address: Wallet.currentWallet, score: 0, game_id: 'block_dodger' }, { onConflict: 'wallet_address,game_id', ignoreDuplicates: true }),
            // Create empty user record if it doesn't exist
            Database.supabase.from('user_profiles')
                .upsert({ wallet_address: Wallet.currentWallet, total_points: 0 }, { onConflict: 'wallet_address', ignoreDuplicates: true })
        ]).then(() => {
            console.log('Default entries created or already exist');
            
            // Fetch user's high score and total points
            return Promise.all([
                Database.supabase.from('game_scores').select('score').eq('wallet_address', Wallet.currentWallet).eq('game_id', 'block_dodger').single(),
                Database.supabase.from('user_profiles').select('total_points').eq('wallet_address', Wallet.currentWallet).single(),
                // Fetch all scores to calculate user's rank
                Database.supabase.from('game_scores').select('wallet_address, score').eq('game_id', 'block_dodger').order('score', { ascending: false }),
                // Fetch all points to calculate user's points rank
                Database.supabase.from('user_profiles').select('wallet_address, total_points').order('total_points', { ascending: false })
            ]);
        }).then(([scoreResult, pointsResult, allScoresResult, allPointsResult]) => {
            // Clear timeout since we got a response
            clearTimeout(timeoutId);
            
            // Check for errors
            if (scoreResult.error || pointsResult.error) {
                console.error('Error fetching profile data:', scoreResult.error || pointsResult.error);
                if (profileLoading) profileLoading.style.display = 'none';
                if (profileError) profileError.style.display = 'block';
                return;
            }
            
            // Get rank information
            let scoreRank = 1;
            let totalPlayers = 0;
            
            if (allScoresResult.data && allScoresResult.data.length > 0) {
                totalPlayers = allScoresResult.data.length;
                const userScore = scoreResult.data?.score || 0;
                
                // Find user rank
                for (let i = 0; i < allScoresResult.data.length; i++) {
                    if (allScoresResult.data[i].wallet_address === Wallet.currentWallet) {
                        scoreRank = i + 1;
                        break;
                    }
                }
            }
            
            let pointsRank = 1;
            let totalPointsPlayers = 0;
            
            if (allPointsResult.data && allPointsResult.data.length > 0) {
                totalPointsPlayers = allPointsResult.data.length;
                const userPoints = pointsResult.data?.total_points || 0;
                
                // Find user points rank
                for (let i = 0; i < allPointsResult.data.length; i++) {
                    if (allPointsResult.data[i].wallet_address === Wallet.currentWallet) {
                        pointsRank = i + 1;
                        break;
                    }
                }
            }
            
            // Update profile UI with data
            if (profileHighScore) {
                profileHighScore.innerHTML = `${scoreResult.data?.score || 0} <span class="rank-badge">Rank: ${scoreRank}/${totalPlayers}</span>`;
            }
            
            if (profileTotalPoints) {
                profileTotalPoints.innerHTML = `${pointsResult.data?.total_points || 0} <span class="rank-badge">Rank: ${pointsRank}/${totalPointsPlayers}</span>`;
                
                // Update shop points display if it exists
                const shopPoints = document.getElementById('shopPoints');
                if (shopPoints) {
                    shopPoints.textContent = pointsResult.data?.total_points || 0;
                }
                
                // Save wallet points for later use
                Wallet.walletPoints = pointsResult.data?.total_points || 0;
            }
            
            // Add upgrades section if it doesn't exist
            if (profileStats && window.Shop) {
                let upgradesSection = document.getElementById('profileUpgrades');
                if (!upgradesSection) {
                    upgradesSection = document.createElement('div');
                    upgradesSection.id = 'profileUpgrades';
                    upgradesSection.className = 'profile-section';
                    upgradesSection.innerHTML = '<h3>Player Upgrades</h3>';
                    profileStats.appendChild(upgradesSection);
                }
                
                // Update upgrades section with current upgrade levels
                self.updateProfileUpgrades(upgradesSection);
            }
            
            // Add powerup section if it doesn't exist
            if (profileStats) {
                let powerupSection = document.getElementById('profileSelectedPowerup');
                if (!powerupSection) {
                    powerupSection = document.createElement('div');
                    powerupSection.id = 'profileSelectedPowerup';
                    powerupSection.className = 'profile-section';
                    powerupSection.innerHTML = '<h3>Selected Powerup</h3>';
                    profileStats.appendChild(powerupSection);
                }
                
                // Update powerup section
                UI.updateProfileWithSelectedPowerup();
            }
            
            // Hide loading and show stats
            if (profileLoading) profileLoading.style.display = 'none';
            if (profileStats) profileStats.style.display = 'block';
        }).catch(error => {
            console.error('Error fetching profile data:', error);
            clearTimeout(timeoutId);
            
            // Hide loading and show error
            if (profileLoading) profileLoading.style.display = 'none';
            if (profileError) profileError.style.display = 'block';
        });
    },
    
    // Close profile
    close: function() {
        const profileScreen = document.getElementById('profileModal');
        if (profileScreen) {
            profileScreen.style.display = 'none';
        }
    },
    
    // Update profile with current upgrade levels
    updateProfileUpgrades: function(container) {
        // Ensure we have a valid Shop object to work with
        const shopObj = (typeof Shop !== 'undefined' && Shop) ? Shop : window.Shop;
        
        if (!shopObj || !container) {
            console.warn('Cannot update profile upgrades: Shop module or container not available');
            return;
        }
        
        console.log('Updating profile upgrades display');
        
        // Clear the container
        container.innerHTML = '<h3>Player Upgrades</h3>';
        
        // Ensure Shop data is loaded
        if (!shopObj.isInitialized) {
            shopObj.init();
            // If wallet is connected, we should load from database, not localStorage
            if (Wallet.currentWallet) {
                console.log('Loading purchases directly from database for wallet:', Wallet.currentWallet);
                // Database loading happens automatically in Shop.init() for connected wallets
            }
        }
        
        // Check if user has any upgrades
        const hasUpgrades = Object.values(shopObj.userUpgrades).some(level => level > 0);
        
        if (!hasUpgrades) {
            const noUpgradesDiv = document.createElement('div');
            noUpgradesDiv.className = 'profile-no-upgrades';
            noUpgradesDiv.textContent = 'No upgrades purchased yet. Visit the shop to upgrade your player!';
            container.appendChild(noUpgradesDiv);
            return;
        }
        
        // Create an upgrade list
        const upgradeList = document.createElement('div');
        upgradeList.className = 'profile-upgrade-list';
        container.appendChild(upgradeList);
        
        // Add speed upgrade if purchased
        if (shopObj.userUpgrades.playerSpeed > 0) {
            const speedUpgrade = document.createElement('div');
            speedUpgrade.className = 'profile-upgrade-item';
            speedUpgrade.innerHTML = `
                <div class="profile-upgrade-name">${shopObj.upgrades.playerSpeed.name}</div>
                <div class="profile-upgrade-level">Level ${shopObj.userUpgrades.playerSpeed}/${shopObj.upgrades.playerSpeed.maxLevel}</div>
                <div class="profile-upgrade-effect">${shopObj.upgrades.playerSpeed.getEffectText(shopObj.userUpgrades.playerSpeed)}</div>
            `;
            upgradeList.appendChild(speedUpgrade);
        }
        
        // Add size upgrade if purchased
        if (shopObj.userUpgrades.playerSize > 0) {
            const sizeUpgrade = document.createElement('div');
            sizeUpgrade.className = 'profile-upgrade-item';
            sizeUpgrade.innerHTML = `
                <div class="profile-upgrade-name">${shopObj.upgrades.playerSize.name}</div>
                <div class="profile-upgrade-level">Level ${shopObj.userUpgrades.playerSize}/${shopObj.upgrades.playerSize.maxLevel}</div>
                <div class="profile-upgrade-effect">${shopObj.upgrades.playerSize.getEffectText(shopObj.userUpgrades.playerSize)}</div>
            `;
            upgradeList.appendChild(sizeUpgrade);
        }
        
        // Add a shop button
        const shopButton = document.createElement('button');
        shopButton.className = 'profile-shop-button';
        shopButton.textContent = 'Visit Shop';
        shopButton.onclick = function() {
            Profile.close();
            shopObj.showShop();
        };
        container.appendChild(shopButton);
    }
}; 