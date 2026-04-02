// Block Dodger - Main Entry Point
console.log("Block Dodger script loaded");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game when DOM is loaded
    initializeGame();
});

window.openBlockDodgerShop = function openBlockDodgerShop(attempt = 0) {
    const shop = window.Shop || (typeof Shop !== 'undefined' ? Shop : null);
    if (!shop || typeof shop.showShop !== 'function') {
        if (attempt < 5) {
            setTimeout(() => window.openBlockDodgerShop(attempt + 1), 120);
            return false;
        }
        console.error('Shop module not available');
        return false;
    }
    try {
        if (!shop.isInitialized && typeof shop.init === 'function') {
            shop.init();
        }
        shop.showShop();
        return true;
    } catch (error) {
        console.error('Error opening shop:', error);
        return false;
    }
};

// Initialize the game
function initializeGame() {
    // Initialize canvas and context
    window.canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    
    window.ctx = canvas.getContext("2d");
    
    // Initialize UI elements
    UI.initializeUIElements();
    
    // Initialize sound system
    Sound.init();
    
    // Initialize effects system
    Effects.init();
    
    // Initialize PowerUps system if available
    if (typeof PowerUps !== 'undefined' && PowerUps) {
        console.log('Initializing PowerUps with new DOM-based approach');
        PowerUps.init();
        
        // Make sure to reinitialize powerups when the game starts
        // This ensures DOM elements are properly created
        document.getElementById('playButton').addEventListener('click', function() {
            // This is in addition to the normal click handler that calls Game.start()
            setTimeout(function() {
                if (typeof PowerUps !== 'undefined' && PowerUps) {
                    console.log("Reinitializing powerups after game start");
                    PowerUps.init(); // Create DOM powerups
                }
            }, 500);
        });
    } else {
        console.warn('PowerUps module not available during initialization');
    }
    
    // Initialize game systems
    Game.init();

    // Add event listener for page unload
    window.addEventListener('beforeunload', function() {
        // End the game and clean up resources
        Game.endGame();
    });
    
    var _p = typeof window.whenArcadeProfileAvatarReady === 'function' ? window.whenArcadeProfileAvatarReady() : Promise.resolve();
    _p.then(function () {
        if (window.ArcadeLoading && typeof window.ArcadeLoading.gameReady === 'function') {
            window.ArcadeLoading.gameReady();
        }
    });
    
    // Make sure Shop is initialized before checking wallet connection
    if (window.Shop) {
        // Initialize shop system
        window.Shop.init();
        
        // Now check if user has already connected wallet
        Wallet.checkExistingWalletConnection();
    } else {
        console.error('Shop module is not available when initializing the game');
        // Add a small delay to give the browser time to load all scripts
        setTimeout(() => {
            if (window.Shop) {
                console.log('Shop module now available, initializing...');
                window.Shop.init();
                Wallet.checkExistingWalletConnection();
            } else {
                console.error('Shop module still not available after delay');
            }
        }, 500);
    }
    
    // Ensure menu is visible and game screen is hidden
    if (UI.menuScreen) {
        UI.menuScreen.style.display = 'flex';
    }
    if (UI.gameScreen) {
        UI.gameScreen.style.display = 'none';
    }
    
    // Do not start the game loop on page load.
    // Gameplay starts only when the user clicks "Start Game" (Game.start()).
    
    // Add event listeners for menu buttons
    const connectWalletButton = document.getElementById('connectWalletButton');
    if (connectWalletButton) {
        connectWalletButton.addEventListener('click', function() {
            Wallet.connect();
        });
    }
    
    const disconnectWalletButton = document.getElementById('disconnectWalletButton');
    if (disconnectWalletButton) {
        disconnectWalletButton.addEventListener('click', function() {
            Wallet.disconnect();
        });
    }
    
    const playButton = document.getElementById('playButton');
    if (playButton) {
        playButton.addEventListener('click', function() {
            Game.start();
        });
    }
    
    const soundToggleButton = document.getElementById('soundToggleButton');
    if (soundToggleButton) {
        soundToggleButton.addEventListener('click', function() {
            const isSoundOn = Sound.toggleSound();
            this.textContent = `Sound: ${isSoundOn ? 'ON' : 'OFF'}`;
        });
    }
    
    const shopButton = document.getElementById('shopButton');
    if (shopButton) {
        shopButton.addEventListener('click', function() {
            console.log('Shop button clicked');
            window.openBlockDodgerShop();
        });
        
        // Also add touch event listener for mobile
        shopButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            console.log('Shop button touched');
            window.openBlockDodgerShop();
        });
    } else {
        console.error('Shop button element not found in DOM');
    }
} 