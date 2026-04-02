// Block Dodger - Wallet Module

const Wallet = {
    // State variables
    currentWallet: null,
    hasNFT: false,
    currentProvider: null,
    walletPoints: 0,
    walletConnected: false,

    notify: function(message, duration) {
        if (window.UI && typeof UI.showNotification === 'function') {
            UI.showNotification(message, duration || 3000);
            return;
        }
        console.log('[Block Dodger]', message);
    },
    
    // Check for existing wallet connection
    checkExistingWalletConnection: function() {
        // Checking existing wallet connection
        
        // Prefer Glyph EVM when main site set `glyphEvmWallet` + `glyphUserId`
        var effective =
            typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';

        if (effective) {
            try {
                localStorage.setItem('connectedWallet', effective);
            } catch (e) {}
            this.handleWalletConnected('arcade', effective);
            
            // Load the selected ape from localStorage
            this.loadSelectedApe();
            
            return true;
        } else {
            console.warn('Glyph wallet not available yet; skipping auto-redirect.');
            return false;
        }
    },
    
    // Load the selected ape from localStorage
    loadSelectedApe: async function() {
        // Use the global function to load from database
        if (window.NFT && window.NFT.loadSelectedApeForGame) {
            try {
                const apeData = await window.NFT.loadSelectedApeForGame();
                if (apeData) {
                    window.selectedApe = apeData;
                    console.log('Loaded selected ape from database:', apeData);
                    
                    // Update NFT module
                    window.NFT.setSelectedApe(apeData);
                } else {
                    console.log('No selected ape found in database');
                }
            } catch (error) {
                console.error('Error loading selected ape from database:', error);
            }
        } else {
            // Fallback to localStorage if NFT module not available
        const selectedApe = localStorage.getItem('selectedApe');
        if (selectedApe) {
            try {
                const apeData = JSON.parse(selectedApe);
                    window.selectedApe = apeData;
                if (window.NFT) {
                        window.NFT.setSelectedApe(apeData);
                }
                } catch (error) {
                    console.error('Error parsing selectedApe from localStorage:', error);
                }
            }
        }
    },
    
    // Connect using Glyph-synced arcade wallet
    connect: async function() {
        console.log('Connecting wallet...');
        
        try {
            var address =
                typeof window.getArcadeWalletForDatabase === 'function'
                    ? window.getArcadeWalletForDatabase()
                    : '';
            if (!address) {
                var fromGlyphStorage = String(localStorage.getItem('glyphEvmWallet') || '')
                    .trim()
                    .toLowerCase();
                if (/^0x[a-f0-9]{40}$/.test(fromGlyphStorage)) {
                    address = fromGlyphStorage;
                }
            }
            if (!address) {
                this.notify('Sign in with Glyph first to connect wallet.', 5000);
                return false;
            }
            localStorage.setItem('connectedWallet', address);
            localStorage.setItem('walletProvider', 'glyph');
            this.handleWalletConnected('glyph', address);
            return true;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.notify('Error connecting wallet: ' + error.message, 5000);
            return false;
        }
    },
    
    // Disconnect wallet
    disconnect: function() {
        console.log('Disconnecting wallet...');
        
        // Clear wallet state
        this.currentWallet = null;
        this.currentProvider = null;
        this.hasNFT = false;
        
        // Remove stored wallet address
        localStorage.removeItem('connectedWallet');
        localStorage.removeItem('walletProvider');
        localStorage.removeItem('selectedApe');
        localStorage.removeItem('arcadeProfileAvatarUrl');
        
        // Update UI to show wallet disconnected
        const connectButton = document.getElementById('connectWalletButton');
        const disconnectButton = document.getElementById('disconnectWalletButton');
        const playButton = document.getElementById('playButton');
        const shopButton = document.getElementById('shopButton');
        const walletStatus = document.getElementById('walletStatus');
        const walletConnected = document.getElementById('walletConnected');
        const walletAddress = document.getElementById('walletAddress');
        const apeVerification = document.getElementById('apeVerification');
        
        if (connectButton) connectButton.style.display = 'block';
        if (disconnectButton) disconnectButton.style.display = 'none';
        if (playButton) playButton.style.display = 'none';
        if (shopButton) shopButton.style.display = 'none';
        
        // Hide all wallet info components
        if (walletConnected) walletConnected.textContent = '';
        
        if (walletAddress) {
            walletAddress.textContent = '';
            walletAddress.style.display = 'none';
        }
        
        if (apeVerification) {
            apeVerification.textContent = '';
            apeVerification.style.display = 'none';
        }
        
        // Clear window variables
        window.selectedApe = null;
        
        // Show notification
        this.notify('Wallet disconnected', 3000);
        Sound.playSoundSafely('disconnect');
    },
    
    // Update UI to show wallet connected
    updateWalletUI: function() {
        // Update UI elements
        const connectButton = document.getElementById('connectWalletButton');
        const disconnectButton = document.getElementById('disconnectWalletButton');
        const playButton = document.getElementById('playButton');
        const shopButton = document.getElementById('shopButton');
        const walletStatus = document.getElementById('walletStatus');
        const walletConnected = document.getElementById('walletConnected');
        const walletAddress = document.getElementById('walletAddress');
        const apeVerification = document.getElementById('apeVerification');
        
        if (connectButton) connectButton.style.display = 'none';
        if (disconnectButton) disconnectButton.style.display = 'block';
        if (playButton) playButton.style.display = 'block';
        if (shopButton) shopButton.style.display = 'block';
        
        // Hide wallet status components
        if (walletConnected) walletConnected.textContent = '';
        
        if (walletAddress) {
            walletAddress.textContent = '';
            walletAddress.style.display = 'none';
        }
        
        if (apeVerification) {
            apeVerification.textContent = '';
            apeVerification.style.display = 'none';
        }
    },
    
    // Shorten wallet address for display
    shortenAddress: function(address) {
        if (!address) return '';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    },
    
    // Handle successful wallet connection
    handleWalletConnected: function(provider, address) {
        console.log('Wallet connected from arcade:', address);
        
        this.currentWallet = address;
        this.currentProvider = provider;
        this.walletConnected = true;
        
        // Get wallet points 
        if (Database && Database.isSupabaseConfigured) {
            Database.getWalletPoints(address)
                .then(points => {
                    this.walletPoints = points;
                    console.log('Loaded wallet points:', points);
                    const pointsValue = document.getElementById('pointsValue');
                    if (pointsValue) {
                        pointsValue.textContent = points;
                    }
                    
                    // Also update shop points if shop is open
                    const shopPoints = document.getElementById('shopPoints');
                    if (shopPoints) {
                        shopPoints.textContent = points;
                    }
                })
                .catch(error => {
                    console.error('Error getting wallet points:', error);
                });
        }
        
        // Update UI - show play button but hide wallet info
        const playButton = document.getElementById('playButton');
        const shopButton = document.getElementById('shopButton');
        const walletConnected = document.getElementById('walletConnected');
        const walletAddress = document.getElementById('walletAddress');
        
        if (playButton) playButton.style.display = 'block';
        if (shopButton) shopButton.style.display = 'block';
        
        // Instead of showing wallet connected text, use the updateWalletUI which now hides everything
        this.updateWalletUI();

        // If NFT module exists, check for NFTs
        if (window.NFT) {
            NFT.checkForApes(address);
        }
        
        // Initialize shop with connected wallet if shop exists
        if (window.Shop && typeof Shop.ensureWalletStateLoaded === 'function') {
            console.log('Loading user purchases for wallet:', address);
            Shop.ensureWalletStateLoaded(address)
                .then(success => {
                    if (success) {
                        console.log('Successfully loaded user purchases from database');
                        Shop.applyUpgrades();
                    } else {
                        console.warn('No purchases found or error loading purchases');
                    }
                })
                .catch(error => {
                    console.error('Error loading user purchases:', error);
                });
        } else {
            console.warn('Shop module not fully loaded yet, will try to load purchases later');
            // Set a timer to retry in case the Shop module is still loading
            setTimeout(() => {
                if (window.Shop && typeof Shop.ensureWalletStateLoaded === 'function') {
                    this.loadPurchasesFromShop(Shop, address);
                }
            }, 500);
        }
    },
    
    // Helper method to load purchases from Shop
    loadPurchasesFromShop: async function(shopObj, address) {
        console.log('Loading purchases from Shop for address:', address);
        try {
            // Always use database only for connected wallets
            if (typeof shopObj.ensureWalletStateLoaded === 'function') {
                await shopObj.ensureWalletStateLoaded(address);
            } else {
                await shopObj.loadUserPurchasesFromDatabaseOnly(address);
            }
            shopObj.applyUpgrades();
            // Update cooldown timer if there's an active cooldown
            if (window.UI && UI.updateCooldownTimer) {
                UI.updateCooldownTimer();
            }
            // Update the shop UI if it's open
            if (shopObj.updateShopUIIfOpen) {
                shopObj.updateShopUIIfOpen();
            }
            console.log('User purchases loaded and applied from database after Shop became available');
        } catch (error) {
            console.error('Error loading shop purchases from database after Shop became available:', error);
        }
    },
    
    // Check for NFTs in the wallet
    checkForNFTs: async function(address) {
        console.log('Checking for NFTs in wallet:', address);
        
        // Don't show checking status anymore
        
        try {
            // Wait for NFT module to be fully loaded
            if (!window.NFT || !window.NFT.checkApeStatus) {
                console.log('Waiting for NFT module to load');
                // Wait a moment for modules to load
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Use the NFT module to check for Apes
            const hasApe = await NFT.checkApeStatus().catch(error => {
                console.warn('NFT check failed, proceeding anyway:', error);
                return true; // Assume true to not block user
            });
            
            console.log('NFT check result:', hasApe);
            this.hasNFT = hasApe;
            
            // Don't update UI to reflect NFT status anymore
            // This keeps the verification text hidden
            
            // If they have an NFT, try to load user's NFT apes
            if (hasApe) {
                NFT.loadSelectedApe();
            }
        } catch (error) {
            console.error('Error checking for NFTs:', error);
            // Set NFT status to true as a fallback to avoid blocking the user
            this.hasNFT = true;
            // Don't update UI
        }
    },
    
    // Update the loadPoints method to ensure it's using total_points
    loadPoints: async function(walletAddress) {
        if (!walletAddress) {
            console.warn('No wallet address provided for loadPoints');
            return;
        }
        
        console.log('Loading points for wallet:', walletAddress);
        
        try {
            if (!Database.isSupabaseConfigured) {
                console.warn('Database not configured, cannot load points');
                return;
            }
            
            // Get points from database
            this.walletPoints = await Database.getWalletPoints(walletAddress);
            console.log('Points loaded from database:', this.walletPoints);
            
            // Update points display in UI
            this.updatePointsDisplay();
            
            return this.walletPoints;
        } catch (error) {
            console.error('Error loading points:', error);
            this.walletPoints = 0;
            return 0;
        }
    },
    
    // Add a separate method to update points display
    updatePointsDisplay: function() {
        // Update all UI elements that display points
        const pointsValue = document.getElementById('pointsValue');
        if (pointsValue) {
            pointsValue.textContent = this.walletPoints;
        }
        
        const shopPoints = document.getElementById('shopPoints');
        if (shopPoints) {
            shopPoints.textContent = this.walletPoints;
        }
        
        const userCoins = document.getElementById('userCoins');
        if (userCoins) {
            userCoins.textContent = `Total Points: ${this.walletPoints}`;
        }
    }
}; 