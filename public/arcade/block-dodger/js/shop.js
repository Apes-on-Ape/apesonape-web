// Block Dodger - Shop Module

const Shop = {
    // Shop state
    isInitialized: false,
    _walletLoadPromise: null,
    _walletLoadFor: null,
    
    // Upgrade definitions with costs and limits
    upgrades: {
        playerSpeed: {
            name: "Player Speed",
            description: "Increases your movement speed",
            cost: 1250,
            maxLevel: 5,
            baseValue: Config.PLAYER_SPEED,
            incrementValue: 1.0,
            getEffectText: function(level) {
                return `Speed: +${level * this.incrementValue}`;
            }
        },
        playerSize: {
            name: "Player Size",
            description: "Decreases your player size for easier dodging",
            cost: 1875,
            maxLevel: 3,
            baseWidth: Config.PLAYER_WIDTH,
            baseHeight: Config.PLAYER_HEIGHT,
            decrementPercent: 20,
            getEffectText: function(level) {
                const reduction = level * this.decrementPercent;
                return `Size: -${reduction}%`;
            }
        }
    },
    
    // Powerup definitions
    powerups: {
        invincibility: {
            name: "Invincibility",
            description: "Become invincible for 5 seconds",
            cost: 7500,
            duration: 5000,
            cooldown: 30000,
            isActive: false,
            lastUsed: 0,
            icon: "⭐"
        }
    },
    
    // User's purchased upgrades (will be loaded from database)
    userUpgrades: {
        playerSpeed: 0,
        playerSize: 0
    },
    
    // User's purchased powerups (will be loaded from database)
    userPowerups: {
        invincibility: false
    },
    
    // Selected powerup
    selectedPowerup: null,
    
    // Initialize the shop
    init: function() {
        if (this.isInitialized) return;
        
        console.log('Initializing shop system');
        
        // Setup shop event listeners
        this.setupEventListeners();
        
        // If wallet is connected, load user's purchases from database only
        if (Wallet.currentWallet) {
            console.log('Wallet connected, loading user purchases from database for:', Wallet.currentWallet);
            this.ensureWalletStateLoaded(Wallet.currentWallet).then(loaded => {
                if (loaded) {
                    console.log('User purchases loaded successfully from database');
                    // Apply the loaded upgrades
                    this.applyUpgrades();
                    
                    // Update cooldown timer if there's an active cooldown
                    UI.updateCooldownTimer();
                    
                    // Update UI if shop is open
                    this.updateShopUIIfOpen();
                } else {
                    console.log('Failed to load user purchases from database or none found');
                }
            }).catch(error => {
                console.error('Error loading user purchases:', error);
            });
        } else {
            console.log('No wallet connected, skipping database purchase loading');
            // Reset to defaults
            this.userUpgrades = {
                playerSpeed: 0,
                playerSize: 0
            };
            
            this.userPowerups = {
                invincibility: false
            };
            
            this.selectedPowerup = null;
            
            // Apply default values
            this.applyUpgrades();
        }
        
        this.isInitialized = true;
    },

    ensureWalletStateLoaded: function(walletAddress, forceReload = false) {
        if (!walletAddress) {
            return Promise.resolve(false);
        }
        if (!forceReload && this._walletLoadPromise && this._walletLoadFor === walletAddress) {
            return this._walletLoadPromise;
        }
        this._walletLoadFor = walletAddress;
        this._walletLoadPromise = this.loadUserPurchasesFromDatabaseOnly(walletAddress)
            .then((loaded) => {
                // Ensure runtime values are applied even if loading returns false.
                this.applyUpgrades();
                return !!loaded;
            })
            .catch((error) => {
                console.error('Error ensuring wallet shop state:', error);
                this.applyUpgrades();
                return false;
            });
        return this._walletLoadPromise;
    },
    
    // Update shop UI if the shop is currently open
    updateShopUIIfOpen: function() {
        // Check if shop is currently open
        const shopModal = document.getElementById('shopModal');
        if (shopModal && shopModal.style.display === 'block' && UI.updateShopUI) {
            UI.updateShopUI();
        }
    },
    
    // Load user purchases from localStorage (fallback when database is not available)
    loadFromLocalStorage: function() {
        console.log('Loading user purchases from localStorage');
        try {
            // Load upgrade levels
            const storedUpgrades = localStorage.getItem('userUpgrades');
            if (storedUpgrades) {
                this.userUpgrades = JSON.parse(storedUpgrades);
                console.log('Loaded upgrades from localStorage:', this.userUpgrades);
            }
            
            // Load powerups
            const storedPowerups = localStorage.getItem('userPowerups');
            if (storedPowerups) {
                this.userPowerups = JSON.parse(storedPowerups);
                console.log('Loaded powerups from localStorage:', this.userPowerups);
            }
            
            // Load selected powerup
            const selectedPowerup = localStorage.getItem('selectedPowerup');
            if (selectedPowerup) {
                this.selectedPowerup = selectedPowerup;
                console.log('Loaded selected powerup from localStorage:', this.selectedPowerup);
            }
            
            return true;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return false;
        }
    },
    
    // Load user's purchases from the database only, no localStorage
    loadUserPurchasesFromDatabaseOnly: async function(walletAddress) {
        if (!walletAddress) return false;
        
        try {
            const userPurchases = await Database.getUserPurchases(walletAddress);
            
            if (userPurchases) {
                // Reset user upgrades to empty state before loading from database
                this.userUpgrades = {
                    playerSpeed: 0,
                    playerSize: 0
                };
                
                // Load upgrades from database
                if (userPurchases.upgrades) {
                    // Update with database values only
                    Object.entries(userPurchases.upgrades).forEach(([upgradeId, level]) => {
                        this.userUpgrades[upgradeId] = level;
                    });
                }
                
                // Reset powerups to default state
                this.userPowerups = {
                    invincibility: false
                };
                
                // Load powerups from database only
                if (userPurchases.powerups) {
                    Object.entries(userPurchases.powerups).forEach(([powerupId, owned]) => {
                        this.userPowerups[powerupId] = owned;
                    });
                }
                
                // Load selected powerup from database
                if (userPurchases.selectedPowerup) {
                    this.selectedPowerup = userPurchases.selectedPowerup;
                } else {
                    this.selectedPowerup = null;
                }
                
                // Apply the loaded upgrades
                this.applyUpgrades();
                
                return true;
            } else {
                // Reset upgrades to default values
                this.userUpgrades = {
                    playerSpeed: 0,
                    playerSize: 0
                };
                
                this.userPowerups = {
                    invincibility: false
                };
                
                this.selectedPowerup = null;
                
                // Apply default values
                this.applyUpgrades();
                
                return false;
            }
        } catch (error) {
            console.error('Error loading user purchases from database:', error);
            
            // Reset to defaults on error
            this.userUpgrades = {
                playerSpeed: 0,
                playerSize: 0
            };
            
            this.userPowerups = {
                invincibility: false
            };
            
            this.selectedPowerup = null;
            
            this.applyUpgrades();
            
            return false;
        }
    },
    
    // Load user's purchases from the database
    loadUserPurchases: async function(walletAddress) {
        if (!walletAddress) return false;
        
        try {
            console.log('Loading user purchases from database for:', walletAddress);
            
            // For wallet connections, we'll only use database values, not localStorage
            // Skip localStorage and get data directly from database
            const userPurchases = await Database.getUserPurchases(walletAddress);
            
            if (userPurchases) {
                console.log('User purchases data received from database:', userPurchases);
                
                // Reset user upgrades to empty state before loading from database
                this.userUpgrades = {
                    playerSpeed: 0,
                    playerSize: 0
                };
                
                // Load upgrades from database
                if (userPurchases.upgrades) {
                    Object.entries(userPurchases.upgrades).forEach(([upgradeId, level]) => {
                        this.userUpgrades[upgradeId] = level;
                    });
                    console.log('Loaded user upgrades from database:', this.userUpgrades);
                }
                
                // Reset powerups to default state
                this.userPowerups = {
                    invincibility: false
                };
                
                // Load powerups from database
                if (userPurchases.powerups) {
                    Object.entries(userPurchases.powerups).forEach(([powerupId, owned]) => {
                        this.userPowerups[powerupId] = owned;
                    });
                    console.log('Loaded user powerups from database:', this.userPowerups);
                }
                
                // Load selected powerup from database
                if (userPurchases.selectedPowerup) {
                    this.selectedPowerup = userPurchases.selectedPowerup;
                    console.log('Loaded selected powerup from database:', this.selectedPowerup);
                } else {
                    this.selectedPowerup = null;
                }
                
                // Apply the loaded upgrades
                this.applyUpgrades();
                
                return true;
            } else {
                console.log('No user purchases found in database or there was an error loading them');
                
                // Reset to defaults
                this.userUpgrades = {
                    playerSpeed: 0,
                    playerSize: 0
                };
                
                this.userPowerups = {
                    invincibility: false
                };
                
                this.selectedPowerup = null;
                
                // Apply default values
                this.applyUpgrades();
                
                return false;
            }
        } catch (error) {
            console.error('Error loading user purchases from database:', error);
            
            // Reset to defaults on error
            this.userUpgrades = {
                playerSpeed: 0,
                playerSize: 0
            };
            
            this.userPowerups = {
                invincibility: false
            };
            
            this.selectedPowerup = null;
            
            this.applyUpgrades();
            
            return false;
        }
    },
    
    // Apply upgrades to player attributes
    applyUpgrades: function() {
        // Make sure Player.data exists
        if (!window.Player || !Player.data) {
            // Create a default Player.data if needed to avoid infinite retries
            if (!window.Player) {
                console.warn('Player object not found, creating default');
                window.Player = {
                    data: {
                        speed: this.upgrades.playerSpeed.baseValue,
                        width: this.upgrades.playerSize.baseWidth,
                        height: this.upgrades.playerSize.baseHeight
                    }
                };
            } else if (!Player.data) {
                console.warn('Player.data not found, creating default');
                Player.data = {
                    speed: this.upgrades.playerSpeed.baseValue,
                    width: this.upgrades.playerSize.baseWidth,
                    height: this.upgrades.playerSize.baseHeight
                };
            }
            
            // Only retry once, not indefinitely
            if (!this._retriedApplyUpgrades) {
                console.warn('Player data not fully available yet, will try once more in 500ms');
                this._retriedApplyUpgrades = true;
                setTimeout(() => this.applyUpgrades(), 500);
                return;
            } else {
                console.warn('Still no Player data after retry, using default values');
                // Continue with default values
            }
        }
        
        // Apply player speed upgrade
        if (this.userUpgrades.playerSpeed > 0) {
            const speedUpgrade = this.upgrades.playerSpeed;
            const additionalSpeed = this.userUpgrades.playerSpeed * speedUpgrade.incrementValue;
            Player.data.speed = speedUpgrade.baseValue + additionalSpeed;
        } else {
            // Reset to base value if no upgrade
            Player.data.speed = this.upgrades.playerSpeed.baseValue;
        }
        
        // Apply player size upgrade
        if (this.userUpgrades.playerSize > 0) {
            const sizeUpgrade = this.upgrades.playerSize;
            const sizeReduction = sizeUpgrade.decrementPercent / 100 * this.userUpgrades.playerSize;
            Player.data.width = Math.max(5, sizeUpgrade.baseWidth * (1 - sizeReduction));
            Player.data.height = Math.max(5, sizeUpgrade.baseHeight * (1 - sizeReduction));
        } else {
            // Reset to base values if no upgrade
            Player.data.width = this.upgrades.playerSize.baseWidth;
            Player.data.height = this.upgrades.playerSize.baseHeight;
        }
        
        // Clear the retry flag after successful application
        this._retriedApplyUpgrades = false;
        
        // Update UI if the shop is visible
        if (document.getElementById('shopModal') && document.getElementById('shopModal').style.display === 'block') {
            UI.updateShopUI();
        }
    },
    
    // Purchase an upgrade
    purchaseUpgrade: function(upgradeId) {
        console.log(`Attempting to purchase upgrade: ${upgradeId}`);
        
        // Check if upgrade exists
        if (!this.upgrades[upgradeId]) {
            console.error(`Upgrade ${upgradeId} does not exist`);
            UI.showNotification('Invalid upgrade selected');
            return false;
        }
        
        // Get upgrade details
        const upgrade = this.upgrades[upgradeId];
        const currentLevel = this.userUpgrades[upgradeId] || 0;
        
        // Check if already at max level
        if (currentLevel >= upgrade.maxLevel) {
            console.log(`Upgrade ${upgradeId} already at max level`);
            UI.showNotification('Upgrade already at max level');
            return false;
        }
        
        // Check if user has enough points
        if (Wallet.walletPoints < upgrade.cost) {
            console.log(`Not enough points for upgrade ${upgradeId}`);
            UI.showNotification('Not enough points for this upgrade');
            return false;
        }
        
        // Deduct points
        Wallet.walletPoints -= upgrade.cost;
            
        // Save points to database (if wallet is connected)
        if (Wallet.currentWallet) {
            Database.updateWalletPoints(Wallet.currentWallet, Wallet.walletPoints);
        }
        
        // Increase upgrade level
        this.userUpgrades[upgradeId] = currentLevel + 1;
            
        // Save to database if wallet is connected
        if (Wallet.currentWallet) {
            Database.saveUserUpgrade(Wallet.currentWallet, upgradeId, this.userUpgrades[upgradeId]);
        }
        
        // Apply the upgrade effect
                this.applyUpgrades();
        
        // Update UI
                UI.updateShopUI();
        
        // Show confirmation
        UI.showNotification(`${upgrade.name} upgraded to level ${this.userUpgrades[upgradeId]}`);
            
            return true;
    },
    
    // Purchase a powerup
    purchasePowerup: function(powerupId) {
        console.log(`Attempting to purchase powerup: ${powerupId}`);
        
        // Check if powerup exists
        if (!this.powerups[powerupId]) {
            console.error(`Powerup ${powerupId} does not exist`);
            UI.showNotification('Invalid powerup selected');
            return false;
        }
        
        // Get powerup details
        const powerup = this.powerups[powerupId];
        
        // Check if already owned
        if (this.userPowerups[powerupId]) {
            console.log(`Powerup ${powerupId} already owned`);
            UI.showNotification('Powerup already owned');
            return false;
        }
        
        // Check if user has enough points
        if (Wallet.walletPoints < powerup.cost) {
            console.log(`Not enough points for powerup ${powerupId}`);
            UI.showNotification('Not enough points for this powerup');
            return false;
        }
        
        // Deduct points
        Wallet.walletPoints -= powerup.cost;
        
        // Save points to database (if wallet is connected)
        if (Wallet.currentWallet) {
            Database.updateWalletPoints(Wallet.currentWallet, Wallet.walletPoints);
        }
            
        // Mark powerup as owned
            this.userPowerups[powerupId] = true;
            
        // Automatically select this powerup
                this.selectedPowerup = powerupId;
        
        // Save to database if wallet is connected
        if (Wallet.currentWallet) {
            Database.saveUserPowerup(Wallet.currentWallet, powerupId, true);
            Database.saveSelectedPowerup(Wallet.currentWallet, powerupId);
            }
            
            // Update UI
            UI.updateShopUI();
        
        // Show confirmation
        UI.showNotification(`${powerup.name} purchased and equipped`);
            
            return true;
    },
    
    // Select a powerup
    selectPowerup: async function(powerupId) {
        if (!Wallet.currentWallet) {
            UI.showNotification('Please connect your wallet to select a powerup', 3000);
            return false;
        }
        
        // Check if user owns this powerup
        if (!this.userPowerups[powerupId]) {
            UI.showNotification('You need to purchase this powerup first', 3000);
            return false;
        }
        
        try {
            // Save selected powerup
            await Database.saveSelectedPowerup(Wallet.currentWallet, powerupId);
            
            // Update local selected powerup
            this.selectedPowerup = powerupId;
            
            // Update UI
            UI.updateShopUI();
            UI.showNotification(`Selected ${this.powerups[powerupId].name} powerup`, 3000);
            
            return true;
        } catch (error) {
            console.error('Error selecting powerup:', error);
            UI.showNotification('Error selecting powerup', 3000);
            return false;
        }
    },
    
    // Use the selected powerup
    useSelectedPowerup: function() {
        // If game is over, don't allow using powerups
        if (Game.isGameOver()) {
            return false;
        }

        // Legacy fallback: owned powerup without selected record.
        if (!this.selectedPowerup && this.userPowerups && this.userPowerups.invincibility) {
            this.selectedPowerup = 'invincibility';
        }
        
        // Check if a powerup is selected
        if (!this.selectedPowerup) {
            return false;
        }
        
        const powerup = this.powerups[this.selectedPowerup];
        
        // Check if the powerup exists
        if (!powerup) {
            return false;
        }
        
        // Check if on cooldown
        const now = Date.now();
        if (now - powerup.lastUsed < powerup.cooldown) {
            // Update the cooldown timer UI instead of showing a notification
            UI.updateCooldownTimer();
            return false;
        }
        
        // Handle specific powerups
        switch (this.selectedPowerup) {
            case 'invincibility':
                this.activateInvincibility();
                break;
            default:
                return false;
        }
        
        // Update last used time
        powerup.lastUsed = now;
        
        return true;
    },
    
    // Activate invincibility powerup
    activateInvincibility: function() {
        const powerup = this.powerups.invincibility;
        powerup.isActive = true;
        
        // Set player visual effect for invincibility
        Player.data.isInvincible = true;
        
        // Show invincibility banner and notification
        UI.showInvincibilityBanner(true, 3000);
        
        // Set a timeout to deactivate invincibility
        setTimeout(() => {
            powerup.isActive = false;
            Player.data.isInvincible = false;
            
            // Show end of invincibility banner and notification
            UI.showInvincibilityBanner(false, 3000);
        }, powerup.duration);
    },
    
    // Setup event listeners for the shop
    setupEventListeners: function() {
        // Add event listener for spacebar (powerup activation on PC)
        window.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.key === ' ') && !Game.isGameOver() && Game.isGameActive()) {
                this.useSelectedPowerup();
            }
        });
        
        // Improved double tap detection for mobile devices
        let lastTapTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        
        // Get touch elements (both game canvas and touch areas)
        const touchElements = [
            document.getElementById('gameCanvas'),
            document.getElementById('leftTouchArea'),
            document.getElementById('rightTouchArea')
        ];
        
        // Add touch event handlers to all relevant elements
        touchElements.forEach(element => {
            if (element) {
                // Track touch start position
                element.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 0) {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                    }
                });
                
                // Detect double tap on touch end
                element.addEventListener('touchend', (e) => {
                    const currentTime = new Date().getTime();
                    const timeSinceLastTap = currentTime - lastTapTime;
                    
                    // Check if this is a valid double tap (timing and position)
                    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                        if (!Game.isGameOver() && Game.isGameActive()) {
                            console.log('Double tap detected, activating powerup');
                            
                            // Get touch position for visual feedback
                            let touchX = 0;
                            let touchY = 0;
                            if (e.changedTouches && e.changedTouches.length > 0) {
                                touchX = e.changedTouches[0].clientX;
                                touchY = e.changedTouches[0].clientY;
                            }
                            
                            // Show visual feedback at tap location
                            if (UI && UI.showTapIndicator) {
                                UI.showTapIndicator(touchX, touchY);
                            }
                            
                            // Verify user owns the powerup
                            if (this.selectedPowerup && this.userPowerups[this.selectedPowerup]) {
                                // Activate powerup and prevent default
                                const activated = this.useSelectedPowerup();
                                
                                // Show notification if on cooldown
                                if (!activated && this.powerups[this.selectedPowerup]) {
                                    const now = Date.now();
                                    const powerup = this.powerups[this.selectedPowerup];
                                    if (now - powerup.lastUsed < powerup.cooldown) {
                                        const remainingCooldown = Math.ceil((powerup.lastUsed + powerup.cooldown - now) / 1000);
                                        UI.showNotification(`Powerup on cooldown: ${remainingCooldown}s remaining`, 1500);
                                    }
                                }
                                
                                e.preventDefault();
                            } else if (this.selectedPowerup) {
                                // User doesn't own the selected powerup
                                UI.showNotification('You need to purchase this powerup first', 2000);
                            } else {
                                // No powerup selected
                                UI.showNotification('No powerup selected. Visit the shop!', 2000);
                            }
                        }
                    } else if (timeSinceLastTap > 0) {
                        // First tap, provide subtle feedback to user
                        if (e.changedTouches && e.changedTouches.length > 0) {
                            const touchX = e.changedTouches[0].clientX;
                            const touchY = e.changedTouches[0].clientY;
                            if (UI && UI.showTapIndicator) {
                                // Show smaller indicator for first tap
                                const smallIndicator = document.createElement('div');
                                smallIndicator.style.position = 'absolute';
                                smallIndicator.style.left = (touchX - 15) + 'px';
                                smallIndicator.style.top = (touchY - 15) + 'px';
                                smallIndicator.style.width = '30px';
                                smallIndicator.style.height = '30px';
                                smallIndicator.style.borderRadius = '50%';
                                smallIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                smallIndicator.style.transform = 'scale(1)';
                                smallIndicator.style.opacity = '1';
                                smallIndicator.style.transition = 'opacity 0.2s ease';
                                smallIndicator.style.pointerEvents = 'none';
                                smallIndicator.style.zIndex = '999';
                                document.body.appendChild(smallIndicator);
                                
                                setTimeout(() => {
                                    smallIndicator.style.opacity = '0';
                                    setTimeout(() => {
                                        if (document.body.contains(smallIndicator)) {
                                            document.body.removeChild(smallIndicator);
                                        }
                                    }, 200);
                                }, 100);
                            }
                        }
                    }
                    
                    // Update last tap time for future double tap detection
                    lastTapTime = currentTime;
                });
            }
        });
    },
    
    // Show the shop UI
    showShop: function() {
        console.log('Opening shop UI - DEBUG: Starting showShop function');
        
        try {
            // Make sure user points are updated
            if (Wallet.currentWallet && Database.isSupabaseConfigured) {
                console.log('Loading current wallet points for shop display');
                Database.getWalletPoints(Wallet.currentWallet)
                    .then(points => {
                        console.log('Retrieved wallet points for shop:', points);
                        Wallet.walletPoints = points;
                        const shopPoints = document.getElementById('shopPoints');
                        if (shopPoints) {
                            shopPoints.textContent = points;
                        }
                        
                        // Update user points display in the shop
                        const userCoins = document.getElementById('userCoins');
                        if (userCoins) {
                            userCoins.textContent = `Total Points: ${points}`;
                        }
                    })
                    .catch(error => {
                        console.error('Error getting wallet points for shop:', error);
                    });
                    
                // Ensure purchases are loaded from database
                this.loadUserPurchasesFromDatabaseOnly(Wallet.currentWallet)
                    .then(loaded => {
                        if (loaded) {
                            console.log('User purchases loaded successfully for shop display');
                            this.applyUpgrades();
                        } else {
                            console.warn('Failed to load user purchases from database or none found');
                        }
                        // Continue to update the shop UI even if database load fails
                        this.updateShopUI();
                    })
                    .catch(error => {
                        console.error('Error loading user purchases for shop display:', error);
                        this.updateShopUI();
                    });
            } else {
                console.warn('No wallet connected or database not configured, showing shop with default values');
                // Still update the shop UI with default values
                this.updateShopUI();
            }
            
            // Find the shopModal element
            const shopModal = document.getElementById('shopModal');
            if (!shopModal) {
                console.error('Shop modal element not found!');
                return;
            }
            
            // Set up both close buttons
            const closeButtons = document.querySelectorAll('#shopModal .close-button, #shopCloseBtn');
            closeButtons.forEach(button => {
                // Clear existing event listeners by cloning and replacing
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Add event listener to new button
                newButton.addEventListener('click', () => {
                    console.log('Shop close button clicked');
                    this.closeShop();
                });
            });
            
            // Show the shop modal immediately, don't wait for data to load
            console.log('DEBUG: Setting shopModal display to block');
            shopModal.style.display = 'block';
            
            console.log('Shop UI should be visible now');
        } catch (error) {
            console.error('ERROR in showShop function:', error);
        }
    },
    
    // Update shop UI method within Shop module - don't rely on UI.updateShopUI
    updateShopUI: function() {
        console.log('DEBUG: Running updateShopUI in Shop module');
        
        try {
            const shopContainer = document.getElementById('shopContainer');
            if (!shopContainer) {
                console.error('Shop container not found in DOM');
                return;
            }
            
            // Clear existing items
            shopContainer.innerHTML = '';
            
            // Check if wallet points are available
            if (Wallet.walletPoints === undefined) {
                console.log('Wallet points not yet loaded, trying to load now...');
                
                // Try to reload points if wallet is connected
                if (Wallet.currentWallet) {
                    Wallet.loadPoints(Wallet.currentWallet);
                } else {
                    console.warn('No wallet connected, cannot load points');
                }
            }
            
            // Update points display
            const userCoins = document.getElementById('userCoins');
            if (userCoins && Wallet.walletPoints !== undefined) {
                userCoins.textContent = `Total Points: ${Wallet.walletPoints}`;
            }
            
            // Create upgrades section
            const upgradesSection = document.createElement('div');
            upgradesSection.classList.add('shop-section');
            upgradesSection.innerHTML = '<h3>UPGRADES</h3>';
            
            // Add each upgrade
            for (const [upgradeId, upgrade] of Object.entries(this.upgrades)) {
                const shopItem = document.createElement('div');
                shopItem.classList.add('shop-item');
                
                const currentLevel = this.userUpgrades[upgradeId] || 0;
                const isMaxLevel = currentLevel >= upgrade.maxLevel;
                const canAfford = !isMaxLevel && (Wallet.walletPoints >= upgrade.cost);
                
                shopItem.innerHTML = `
                    <div class="shop-item-header">
                        <div class="shop-item-name">${upgrade.name}</div>
                        <div class="shop-item-level">Level: ${currentLevel}/${upgrade.maxLevel}</div>
                    </div>
                    <div class="shop-item-description">${upgrade.description}</div>
                    <div class="shop-item-effect">${upgrade.getEffectText(currentLevel)}</div>
                    <button class="shop-button" 
                        data-upgrade-id="${upgradeId}" 
                        ${isMaxLevel ? 'disabled' : ''}>
                        ${isMaxLevel ? 'MAX LEVEL' : `Upgrade (${upgrade.cost} points)`}
                    </button>
                `;
                
                // Add disabled style for buttons if can't afford
                if (!canAfford && !isMaxLevel) {
                    const button = shopItem.querySelector('.shop-button');
                    button.disabled = true;
                    button.innerHTML += '<br><span style="font-size:10px;color:#ff6666;">Not enough points</span>';
                }
                
                upgradesSection.appendChild(shopItem);
            }
            
            shopContainer.appendChild(upgradesSection);
            
            // Create powerups section
            const powerupsSection = document.createElement('div');
            powerupsSection.classList.add('shop-section');
            powerupsSection.innerHTML = '<h3>POWER-UPS</h3>';
            
            // Add each powerup
            for (const [powerupId, powerup] of Object.entries(this.powerups)) {
                const shopItem = document.createElement('div');
                shopItem.classList.add('shop-item');
                
                const isOwned = this.userPowerups[powerupId];
                const canAfford = !isOwned && (Wallet.walletPoints >= powerup.cost);
                
                shopItem.innerHTML = `
                    <div class="shop-item-header">
                        <div class="shop-item-name">${powerup.name} ${powerup.icon}</div>
                        <div class="shop-item-level">Status: ${isOwned ? 'Owned' : 'Not Owned'}</div>
                    </div>
                    <div class="shop-item-description">${powerup.description}</div>
                    <div class="shop-item-effect">Duration: ${powerup.duration / 1000}s</div>
                    <button class="shop-button" 
                        data-powerup-id="${powerupId}" 
                        ${isOwned ? 'disabled' : ''}>
                        ${isOwned ? 'OWNED' : `Purchase (${powerup.cost} points)`}
                    </button>
                `;
            
                // Add disabled style for buttons if can't afford
                if (!canAfford && !isOwned) {
                    const button = shopItem.querySelector('.shop-button');
                    button.disabled = true;
                    button.innerHTML += '<br><span style="font-size:10px;color:#ff6666;">Not enough points</span>';
                }
                
                powerupsSection.appendChild(shopItem);
            }
            
            shopContainer.appendChild(powerupsSection);
            
            // Add event listeners to buttons
            this.addShopButtonListeners();
            
        } catch (error) {
            console.error('ERROR in updateShopUI function:', error);
        }
    },
    
    // Create an upgrade item in the shop
    createUpgradeItem: function(container, id) {
        if (!container) return;
        
        const upgrade = this.upgrades[id];
        if (!upgrade) return;
        
        const level = this.userUpgrades[id] || 0;
        const maxLevel = upgrade.maxLevel;
        const isMaxLevel = level >= maxLevel;
        const buttonClass = isMaxLevel ? 'shop-button-maxed' : 'shop-button';
        const buttonText = isMaxLevel ? 'MAX LEVEL' : `Buy - ${upgrade.cost} Points`;
        
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.dataset.id = id;
        
        item.innerHTML = `
            <div class="shop-item-header">
                <div class="shop-item-name">${upgrade.name}</div>
                <div class="shop-item-level">Level ${level}/${maxLevel}</div>
            </div>
            <div class="shop-item-description">${upgrade.description}</div>
            <div class="shop-item-effect">${upgrade.getEffectText(level)}</div>
            <button class="${buttonClass}" ${isMaxLevel ? 'disabled' : ''} data-id="${id}">${buttonText}</button>
        `;
        
        container.appendChild(item);
        
        // Add click handler to the button
        const button = item.querySelector('button');
        if (button && !isMaxLevel) {
            button.addEventListener('click', () => {
                this.purchaseUpgrade(id);
            });
        }
    },
    
    // Create a powerup item in the shop
    createPowerupItem: function(container, id) {
        if (!container) return;
        
        const powerup = this.powerups[id];
        if (!powerup) return;
        
        const owned = this.userPowerups[id] || false;
        const selected = this.selectedPowerup === id;
        const buttonClass = owned ? 'shop-button-owned' : 'shop-button';
        const buttonText = owned ? (selected ? 'SELECTED' : 'Select') : `Buy - ${powerup.cost} Points`;
        
        const item = document.createElement('div');
        item.className = 'shop-item' + (owned ? ' shop-item-owned' : '') + (selected ? ' shop-item-selected' : '');
        item.dataset.id = id;
        
        item.innerHTML = `
            <div class="shop-item-header">
                <div class="shop-item-name">${powerup.name}</div>
                <div class="shop-item-icon">${powerup.icon}</div>
            </div>
            <div class="shop-item-description">${powerup.description}</div>
            <div class="shop-item-effect">Duration: ${powerup.duration/1000}s, Cooldown: ${powerup.cooldown/1000}s</div>
            <button class="${buttonClass}" data-id="${id}">${buttonText}</button>
        `;
        
        container.appendChild(item);
        
        // Add click handler to the button
        const button = item.querySelector('button');
        if (button) {
            button.addEventListener('click', () => {
                if (owned) {
                    this.selectPowerup(id);
                } else {
                    this.purchasePowerup(id);
                }
            });
        }
    },
    
    // Close the shop UI
    closeShop: function() {
        console.log('closeShop method called');
        const shopModal = document.getElementById('shopModal');
        if (shopModal) {
            shopModal.style.display = 'none';
            console.log('Shop UI closed - display set to none');
        } else {
            console.error('Shop modal element not found when trying to close');
        }
    },
    
    // Add shop button listeners
    addShopButtonListeners: function() {
        console.log('Adding shop button listeners');
        
        try {
            // Get all upgrade buttons
            const upgradeButtons = document.querySelectorAll('.shop-button[data-upgrade-id]');
            upgradeButtons.forEach(button => {
                const upgradeId = button.getAttribute('data-upgrade-id');
                
                // Remove existing listeners to prevent duplicates
                button.replaceWith(button.cloneNode(true));
                
                // Get the new button (after replacement)
                const newButton = document.querySelector(`.shop-button[data-upgrade-id="${upgradeId}"]`);
                
                if (newButton && !newButton.disabled) {
                    newButton.addEventListener('click', () => {
                        console.log(`Upgrade button clicked for ${upgradeId}`);
                        this.purchaseUpgrade(upgradeId);
                    });
                }
            });
            
            // Get all powerup buttons
            const powerupButtons = document.querySelectorAll('.shop-button[data-powerup-id]');
            powerupButtons.forEach(button => {
                const powerupId = button.getAttribute('data-powerup-id');
                const isOwned = this.userPowerups[powerupId];
                
                // Remove existing listeners to prevent duplicates
                button.replaceWith(button.cloneNode(true));
                
                // Get the new button (after replacement)
                const newButton = document.querySelector(`.shop-button[data-powerup-id="${powerupId}"]`);
                
                if (newButton && !newButton.disabled) {
                    newButton.addEventListener('click', () => {
                        console.log(`Powerup button clicked for ${powerupId}`);
                        if (isOwned) {
                            this.selectPowerup(powerupId);
                        } else {
                            this.purchasePowerup(powerupId);
                        }
                    });
                }
            });
            
            // Add listener for shop close button
            const closeButton = document.querySelector('#shopModal .close-button');
            if (closeButton) {
                // Remove existing listeners
                closeButton.replaceWith(closeButton.cloneNode(true));
                
                // Get the new button
                const newCloseButton = document.querySelector('#shopModal .close-button');
                newCloseButton.addEventListener('click', () => {
                    this.closeShop();
                });
            }
            
            console.log('Shop button listeners added successfully');
        } catch (error) {
            console.error('Error adding shop button listeners:', error);
        }
    }
};

if (typeof window !== 'undefined') {
    window.Shop = Shop;
}


