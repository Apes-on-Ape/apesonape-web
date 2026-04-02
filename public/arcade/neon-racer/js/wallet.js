// Neon Racer - Wallet Module

const Wallet = {
    // State variables
    currentWallet: null,
    hasNFT: false,
    currentProvider: null,
    walletPoints: 0,

    notify: function(message, duration) {
        if (window.UI && typeof UI.showNotification === 'function') {
            UI.showNotification(message, duration || 3000);
            return;
        }
        console.log('[Neon Racer]', message);
    },
    
    // Get current wallet address
    getCurrentWallet: function() {
        return this.currentWallet;
    },
    
    // Check if wallet is connected
    isConnected: function() {
        return !!this.currentWallet;
    },
    
    // Check if user has already connected wallet
    checkExistingWalletConnection: function() {
        console.log('Checking for existing wallet connection from arcade');
        
        // Glyph-synced canonical arcade wallet
        const storedWallet =
            typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';
        
        if (storedWallet) {
            console.log('Found stored wallet connection from arcade:', storedWallet);
            this.currentWallet = storedWallet;
            this.currentProvider = 'arcade';
            
            // Update UI
            this.updateWalletUI();
            
            // Initialize shop with connected wallet
            if (typeof Shop !== 'undefined' && Shop) {
                if (!Shop.isInitialized) {
                    Shop.init();
                }
            }
            
            // Load selected car
            this.loadSelectedCar();
            
            // Show notification
            this.notify('Wallet connected from arcade', 3000);
            
            return true;
        } else {
            console.log('No wallet connection found yet. Staying on page and waiting for Glyph sync.');
            return false;
        }
    },
    
    // Set up event listeners for wallet buttons
    setupWalletEventListeners: function() {
        console.log('Setting up wallet event listeners');
        
        const connectButton = document.getElementById('connectWalletButton');
        const disconnectButton = document.getElementById('disconnectWalletButton');
        
        if (connectButton) {
            console.log('Adding event listener to connect wallet button');
            connectButton.addEventListener('click', () => {
                console.log('Connect wallet button clicked');
                this.connect();
            });
        } else {
            console.error('Connect wallet button not found');
        }
        
        if (disconnectButton) {
            console.log('Adding event listener to disconnect wallet button');
            disconnectButton.addEventListener('click', () => {
                console.log('Disconnect wallet button clicked');
                this.disconnect();
            });
        }
    },
    
    // Connect using Glyph-synced arcade wallet
    connect: async function() {
        console.log('Connecting wallet...');
        
        try {
            let address =
                typeof window.getArcadeWalletForDatabase === 'function'
                    ? window.getArcadeWalletForDatabase()
                    : '';
            if (!address) {
                const fromGlyphStorage = String(localStorage.getItem('glyphEvmWallet') || '')
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
        try {
            localStorage.removeItem('arcadeProfileAvatarUrl');
        } catch (e) {}
        localStorage.removeItem('walletProvider');
        try {
            sessionStorage.removeItem('selectedCar');
        } catch (e) {}
        
        // Update UI to show wallet disconnected
        const connectButton = document.getElementById('connectWalletButton');
        const disconnectButton = document.getElementById('disconnectWalletButton');
        const playButton = document.getElementById('playButton');
        const profileButton = document.getElementById('profileButton');
        const shopButton = document.getElementById('shopButton');
        
        if (connectButton) connectButton.style.display = 'block';
        if (disconnectButton) disconnectButton.style.display = 'none';
        if (playButton) playButton.style.display = 'none';
        if (profileButton) profileButton.style.display = 'none';
        if (shopButton) shopButton.style.display = 'none';

        // Clear window variables
        window.selectedCar = null;
        
        // Show notification
        this.notify('Wallet disconnected', 3000);
        Sound.playSoundSafely('disconnect');
    },
    
    // Update UI to show wallet connected
    updateWalletUI: function() {
        // Update UI elements
        const playButton = document.getElementById('playButton');
        const shopButton = document.getElementById('shopButton');
        const walletConnected = document.getElementById('walletConnected');
        const walletAddress = document.getElementById('walletAddress');
        const apeVerification = document.getElementById('apeVerification');
        
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
    handleWalletConnected: async function(provider, address) {
        console.log('Wallet connected:', address);
        this.currentWallet = address;
        this.currentProvider = provider;
        
        // Update UI to show wallet connected but hide wallet info
        this.updateWalletUI();
        
        // Initialize shop with connected wallet
        if (typeof Shop !== 'undefined' && Shop) {
            if (!Shop.isInitialized) {
                Shop.init();
            } else {
                // Force shop to load user's purchases from database
                await Shop.loadUserPurchasesFromDatabaseOnly(address);
                Shop.applyUpgrades();
                
                // Update cooldown timer if there's an active cooldown
                if (window.UI && UI.updateCooldownTimer) {
                    UI.updateCooldownTimer();
                }
                
                // Update the shop UI if it's open
                if (Shop.updateShopUIIfOpen) {
                    Shop.updateShopUIIfOpen();
                }
            }
        } else {
            console.warn('Shop module not available yet');
            
            // Retry mechanism to load Shop module
            let retryCount = 0;
            const maxRetries = 10;
            const retryDelay = 300;
            
            const checkShopInterval = setInterval(() => {
                retryCount++;
                console.log(`Attempt ${retryCount} to find Shop module...`);
                
                const shopObj = (typeof Shop !== 'undefined' && Shop) ? Shop : window.Shop;
                
                if (shopObj) {
                    clearInterval(checkShopInterval);
                    console.log('Shop module now available, initializing');
                    
                    if (!shopObj.isInitialized) {
                        shopObj.init();
                    } else {
                        this.loadPurchasesFromShop(shopObj, address);
                    }
                } else if (retryCount >= maxRetries) {
                    console.error('Failed to load Shop module after multiple attempts');
                    clearInterval(checkShopInterval);
                }
            }, retryDelay);
        }
    },
    
    // Load purchases from shop
    loadPurchasesFromShop: async function(shopObj, address) {
        try {
            await shopObj.loadUserPurchasesFromDatabaseOnly(address);
            shopObj.applyUpgrades();
            
            if (window.UI && UI.updateCooldownTimer) {
                UI.updateCooldownTimer();
            }
            
            if (shopObj.updateShopUIIfOpen) {
                shopObj.updateShopUIIfOpen();
            }
        } catch (error) {
            console.error('Error loading purchases from shop:', error);
        }
    },
    
    // Load the selected car from localStorage
    loadSelectedCar: function() {
        try {
            const selectedCar = sessionStorage.getItem('selectedCar') || 'BlackOut';
            console.log('Loaded selected car:', selectedCar);
            
            // Set player car if Player is defined
            if (typeof Player !== 'undefined' && Player) {
                Player.setCarType(selectedCar);
            }
        } catch (error) {
            console.error('Error loading selected car:', error);
        }
    },
    
    // Load the selected ape from database/localStorage
    loadSelectedApe: async function() {
        // Use the global function to load from database
        if (window.NFT && window.NFT.loadSelectedApeForGame) {
            try {
                const apeData = await window.NFT.loadSelectedApeForGame();
                if (apeData) {
                    window.selectedApe = apeData;
                    console.log('Loaded selected ape from database:', apeData);
                    
                    // Update NFT module
                    if (window.NFT.setSelectedApe) {
                        window.NFT.setSelectedApe(apeData);
                    }
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
                    if (window.NFT && window.NFT.setSelectedApe) {
                        window.NFT.setSelectedApe(apeData);
                    }
                } catch (error) {
                    console.error('Error parsing selectedApe from localStorage:', error);
                }
            }
        }
    },
    
    // Initialize wallet module
    init: function() {
        console.log('Initializing Neon Racer Wallet module...');
        
        // Check for existing wallet connection
        this.checkExistingWalletConnection();
        
        // Set up event listeners
        this.setupWalletEventListeners();
        
        console.log('Neon Racer Wallet module initialized');
    }
}; 