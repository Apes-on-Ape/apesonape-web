// Neon Racer - Shop Module

const Shop = {
    // Shop state
    isOpen: false,
    isInitialized: false,
    userPoints: 0,
    purchases: {},
    
    // Powerup state
    lastUsedPowerupTime: 0,
    powerupCooldown: 0,
    
    upgrades: {},
    
    // Initialize shop
    init: function() {
        // Initializing shop
        
        // Set initial state
        this.isInitialized = true;
        this.userPoints = 0;
        this.purchases = {};
        
        // Load upgrades from database if wallet is connected
        if (Wallet && Wallet.currentWallet) {
            this.loadUserPurchases(Wallet.currentWallet);
            this.loadUserCoins();
        }
        
        // Set up shop UI
        this.setupShopUI();
        
        // Set up shop close handlers
        this.setupCloseHandlers();
        
        // Shop initialization complete
    },
    
    // Set up shop UI
    setupShopUI: function() {
        const shopContainer = document.getElementById('shopItems');
        if (!shopContainer) {
            console.warn('Shop items container not found');
            return;
        }
        
        // Clear existing items
        shopContainer.innerHTML = '';
        
        // Create item for each upgrade in config
        for (const key in Config.UPGRADES) {
            const upgrade = Config.UPGRADES[key];
            
            // Create shop item element
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.dataset.upgradeKey = key;
            
            // Calculate current level and next cost
            const level = this.getUpgradeLevel(key);
            const nextCost = this.getUpgradeCost(key);
            const isMaxed = level >= upgrade.maxLevel;
            
            // Create item content
            item.innerHTML = `
                <div class="shop-item-info">
                    <div class="shop-item-name">${upgrade.name}</div>
                    <div class="shop-item-description">${upgrade.description}</div>
                    <div class="shop-item-levels">
                        ${this.createLevelIndicators(level, upgrade.maxLevel)}
                    </div>
                </div>
                <div class="shop-item-purchase">
                    <span class="shop-item-cost">${isMaxed ? 'MAXED' : nextCost + ' points'}</span>
                    <button class="shop-item-button" ${isMaxed ? 'disabled' : ''}>${isMaxed ? 'MAXED' : 'BUY'}</button>
                </div>
            `;
            
            // Add click handler
            const button = item.querySelector('.shop-item-button');
            if (button && !isMaxed) {
                button.addEventListener('click', () => {
                    this.purchaseUpgrade(key);
                });
            }
            
            // Add to shop container
            shopContainer.appendChild(item);
        }
        
        // Update shop coin display
        this.updateShopCoinsDisplay();
        
        console.log('Shop UI setup complete with ' + Object.keys(Config.UPGRADES).length + ' items');
    },
    
    // Set up close handlers
    setupCloseHandlers: function() {
        // Shop close button
        const shopCloseButton = document.querySelector('.shop-close');
        if (shopCloseButton) {
            shopCloseButton.addEventListener('click', () => {
                this.hide();
            });
        }
        
        // Close shop when clicking outside modal content
        const shopModal = document.getElementById('shopModal');
        if (shopModal) {
            shopModal.addEventListener('click', (e) => {
                if (e.target === shopModal) {
                    this.hide();
                }
            });
        }
        
        // Escape key to close shop
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    },
    
    // Create level indicators (filled circles for current level)
    createLevelIndicators: function(currentLevel, maxLevel) {
        let indicators = '';
        
        for (let i = 0; i < maxLevel; i++) {
            const isFilled = i < currentLevel;
            indicators += `<span class="level-indicator ${isFilled ? 'filled' : ''}"></span>`;
        }
        
        return indicators;
    },
    
    // Show shop
    show: function() {
        const shopModal = document.getElementById('shopModal');
        if (!shopModal) return;
        
        // Load current coin balance
        this.loadUserCoins();
        
        // Show shop
        shopModal.style.display = 'flex';
        this.isOpen = true;
        
        // Update shop UI
        this.updateShopUI();
    },
    
    // Hide shop
    hide: function() {
        const shopModal = document.getElementById('shopModal');
        if (!shopModal) return;
        
        shopModal.style.display = 'none';
        this.isOpen = false;
    },
    
    // Load user coins
    loadUserCoins: function() {
        if (!Wallet || !Wallet.currentWallet) {
            this.userPoints = 0;
            this.updateShopCoinsDisplay();
            return;
        }
        
        // Get shared wallet points from database
        Database.getWalletPoints(Wallet.currentWallet)
            .then(points => {
                this.userPoints = points || 0;
                console.log('Loaded wallet points:', this.userPoints);
                this.updateShopCoinsDisplay();
            })
            .catch(error => {
                console.error('Error loading wallet points:', error);
                
                // Fallback to local storage
                const localPoints = Database.getLocalData(`points_${Wallet.currentWallet}`) || 0;
                this.userPoints = localPoints;
                this.updateShopCoinsDisplay();
            });
    },
    
    // Update shop coins display
    updateShopCoinsDisplay: function() {
        const userPointsElement = document.getElementById('userPoints');
        if (userPointsElement) {
            userPointsElement.textContent = `Your Points: ${this.userPoints}`;
        }
        
        const shopPointsElement = document.getElementById('shopPoints');
        if (shopPointsElement) {
            shopPointsElement.textContent = this.userPoints;
        }
    },
    
    // Load user purchases
    loadUserPurchases: function(walletAddress) {
        console.log('Loading user purchases for', walletAddress);
        
        // Load purchases from database
        Database.getUpgrades(walletAddress)
            .then(purchases => {
            if (purchases) {
                console.log('Loaded purchases from database:', purchases);
                this.purchases = purchases;
            } else {
                console.log('No purchases found in database, checking localStorage');
                this.loadUserPurchasesFromLocalStorage(walletAddress);
            }
            
            // Apply upgrades immediately
            this.applyUpgrades();
            
            // Update shop UI if open
            if (this.isOpen) {
                this.updateShopUI();
            }
            })
            .catch(error => {
            console.error('Error loading purchases from database:', error);
            
            // Fallback to local storage
            this.loadUserPurchasesFromLocalStorage(walletAddress);
            });
    },

    // Compatibility with wallet module flow.
    loadUserPurchasesFromDatabaseOnly: async function(walletAddress) {
        if (!walletAddress) return false;
        try {
            const purchases = await Database.getUpgrades(walletAddress);
            if (!purchases) {
                this.purchases = {};
                this.applyUpgrades();
                return false;
            }
            this.purchases = purchases;
            this.applyUpgrades();
            if (this.isOpen) this.updateShopUI();
            return true;
        } catch (error) {
            console.error('Error loading purchases from database only:', error);
            this.purchases = {};
            this.applyUpgrades();
            return false;
        }
    },
    
    // Load user purchases from local storage
    loadUserPurchasesFromLocalStorage: function(walletAddress) {
        const purchases = Database.getLocalData(`purchases_${walletAddress}`);
        
        if (purchases) {
            console.log('Loaded purchases from localStorage:', purchases);
            this.purchases = purchases;
        } else {
            console.log('No purchases found in localStorage');
            this.purchases = {};
        }
            
            // Apply upgrades immediately
            this.applyUpgrades();
            
            // Update shop UI if open
            if (this.isOpen) {
                this.updateShopUI();
        }
    },
    
    // Save user purchases
    saveUserPurchases: function(walletAddress) {
        console.log('Saving user purchases for', walletAddress);
        
        Database.saveUpgrades(walletAddress, this.purchases)
            .then(() => {
                console.log('Purchases saved to database successfully');
            })
            .catch(error => {
                console.error('Error saving purchases to database:', error);
                
                // Fallback to local storage
                Database.saveLocalData(`purchases_${walletAddress}`, this.purchases);
                console.log('Purchases saved to localStorage as fallback');
            });
    },
    
    // Get upgrade level
    getUpgradeLevel: function(key) {
        if (!this.purchases || !this.purchases[key]) {
            return 0;
        }
        
        return this.purchases[key].level || 0;
    },
    
    // Check if user has upgrade
    hasUpgrade: function(key) {
        return this.getUpgradeLevel(key) > 0;
    },
    
    // Get upgrade cost
    getUpgradeCost: function(key) {
        const upgrade = Config.UPGRADES[key];
        if (!upgrade) return 0;
        
        const currentLevel = this.getUpgradeLevel(key);
        
        // If at max level, return 0
        if (currentLevel >= upgrade.maxLevel) {
            return 0;
        }
        
        // Calculate cost based on level
        return upgrade.baseCost * (currentLevel + 1);
    },
    
    // Purchase upgrade
    purchaseUpgrade: function(key) {
        const upgrade = Config.UPGRADES[key];
        if (!upgrade) return false;
        
        const currentLevel = this.getUpgradeLevel(key);
        const cost = this.getUpgradeCost(key);
        
        // Check if at max level
        if (currentLevel >= upgrade.maxLevel) {
            UI.showNotification(`${upgrade.name} is already at max level`, 3000);
            return false;
        }
        
        // Check if user has enough points
        if (this.userPoints < cost) {
            UI.showNotification(`Not enough points to purchase ${upgrade.name}`, 3000);
            if (Sound && Sound.playSoundSafely) {
            Sound.playSoundSafely('error');
            }
            return false;
        }
        
        // Deduct points
        this.userPoints -= cost;
        
        // Update user points in database
        if (Wallet && Wallet.currentWallet) {
            Database.updateWalletPoints(Wallet.currentWallet, this.userPoints)
                .catch(error => {
                    console.error('Error updating wallet points:', error);
                    
                    // Fallback to local storage
                    Database.saveLocalData(`points_${Wallet.currentWallet}`, this.userPoints);
                });
        }
        
        // Update shop UI
        this.updateShopCoinsDisplay();
        
        // Save purchase
        if (!this.purchases[key]) {
            this.purchases[key] = { level: 0 };
        }
        
        // Increment level
        this.purchases[key].level = (this.purchases[key].level || 0) + 1;
        
        // Save purchases to database
        if (Wallet && Wallet.currentWallet) {
            this.saveUserPurchases(Wallet.currentWallet);
        }
        
        // Update shop UI
        this.updateShopUI();
        
        // Apply upgrade
        this.applyUpgrades();
        
        // Show notification
        UI.showNotification(`${upgrade.name} upgraded to level ${this.purchases[key].level}!`, 3000);
        
        // Play sound
        if (Sound && Sound.playSoundSafely) {
        Sound.playSoundSafely('powerup');
        }
        
        return true;
    },
    
    // Update shop UI
    updateShopUI: function() {
        const shopContainer = document.getElementById('shopItems');
        if (!shopContainer) return;
        
        // Update each shop item
        for (const key in Config.UPGRADES) {
            const upgrade = Config.UPGRADES[key];
            const item = shopContainer.querySelector(`.shop-item[data-upgrade-key="${key}"]`);
            
            if (item) {
                // Calculate current level and next cost
                const level = this.getUpgradeLevel(key);
                const nextCost = this.getUpgradeCost(key);
                const isMaxed = level >= upgrade.maxLevel;
                
                // Update level indicators
                const levelIndicators = item.querySelector('.shop-item-levels');
                if (levelIndicators) {
                    levelIndicators.innerHTML = this.createLevelIndicators(level, upgrade.maxLevel);
                }
                
                // Update cost and button
                const costSpan = item.querySelector('.shop-item-cost');
                const button = item.querySelector('.shop-item-button');
                
                if (costSpan) {
                    costSpan.textContent = isMaxed ? 'MAXED' : nextCost + ' points';
                }
                
                if (button) {
                    button.textContent = isMaxed ? 'MAXED' : 'BUY';
                    button.disabled = isMaxed || nextCost > this.userPoints;
                }
            }
        }
    },
    
    // Apply purchased upgrades to the game
    applyUpgrades: function() {
        console.log('Applying purchased upgrades');
        
        // Apply upgrades to player
        if (Player && Player.applyUpgrades) {
            Player.applyUpgrades(this.purchases);
        } else {
            console.warn('Player module not available for applying upgrades');
        }
    }
}; 