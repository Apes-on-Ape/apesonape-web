// Mobile Controls - Arrow Buttons for Ape-Man
const MobileControls = {
    // Control elements
    controlsContainer: null,
    arrowControls: null,
    arrowButtons: {},
    
    // Game reference
    game: null,
    
    // Current active direction
    activeDirection: null,
    
    // Initialize mobile controls
    init: function(gameInstance) {
        this.game = gameInstance;
        
        // Also store globally for access
        window.mobileControlsGame = gameInstance;
        
        // Get control elements
        this.controlsContainer = document.getElementById('mobileControls');
        this.arrowControls = document.getElementById('arrowControls');
        
        // Get individual arrow buttons
        this.arrowButtons = {
            up: document.getElementById('arrowUp'),
            down: document.getElementById('arrowDown'),
            left: document.getElementById('arrowLeft'),
            right: document.getElementById('arrowRight')
        };
        
        if (!this.controlsContainer || !this.arrowControls) {
            return false;
        }
        
        // Initialize game properties - ensure they exist
        if (this.game) {
            if (typeof this.game._mobileInputDirection === 'undefined') {
                this.game._mobileInputDirection = null;
            }
        }
        
        // Add event listeners to arrow buttons
        this.addEventListeners();
        
        // Show controls on mobile devices
        this.showControlsOnMobile();
        
        return true;
    },
    
    // Add event listeners to arrow buttons
    addEventListeners: function() {
        const directions = {
            up: 'u',
            down: 'd',
            left: 'l',
            right: 'r'
        };
        
        Object.keys(this.arrowButtons).forEach(buttonKey => {
            const button = this.arrowButtons[buttonKey];
            const direction = directions[buttonKey];
            
            if (button) {
                // Touch events for mobile
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.onButtonPress(direction, button);
                }, { passive: false });
                
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.onButtonRelease(direction, button);
                }, { passive: false });
                
                // Mouse events for desktop testing
                button.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.onButtonPress(direction, button);
                });
                
                button.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.onButtonRelease(direction, button);
                });
                
                button.addEventListener('mouseleave', (e) => {
                    e.preventDefault();
                    this.onButtonRelease(direction, button);
                });
            }
        });
    },
    
    // Handle button press
    onButtonPress: function(direction, button) {
        // Add visual feedback
        button.classList.add('pressed');
        
        // Set active direction
        this.activeDirection = direction;
        
        // Update game direction with multiple approaches
        if (this.game) {
            this.game._mobileInputDirection = direction;
        }
        
        // Also set on global reference as backup
        if (window.mobileControlsGame) {
            window.mobileControlsGame._mobileInputDirection = direction;
        }
        
        // Set on window as a global fallback
        window._mobileInputDirection = direction;
    },
    
    // Handle button release
    onButtonRelease: function(direction, button) {
        // Remove visual feedback
        button.classList.remove('pressed');
        
        // Only clear direction if this was the active direction
        if (this.activeDirection === direction) {
            this.activeDirection = null;
            
            // Clear game direction
            if (this.game) {
                this.game._mobileInputDirection = null;
            }
            
            // Clear global references
            if (window.mobileControlsGame) {
                window.mobileControlsGame._mobileInputDirection = null;
            }
            window._mobileInputDirection = null;
        }
    },
    
    // Show controls on mobile devices when game is running
    showControlsOnMobile: function() {
        if (this.isMobileDevice() && this.controlsContainer) {
            this.controlsContainer.classList.add('active');
        }
    },
    
    // Hide controls
    hideControls: function() {
        if (this.controlsContainer) {
            this.controlsContainer.classList.remove('active');
        }
    },
    
    // Check if device is mobile
    isMobileDevice: function() {
        return window.innerWidth < 1000 || 'ontouchstart' in window;
    },
    
    // Reset controls
    reset: function() {
        this.activeDirection = null;
        
        // Clear mobile input direction
        if (this.game) {
            this.game._mobileInputDirection = null;
        }
        
        // Clear global references
        if (window.mobileControlsGame) {
            window.mobileControlsGame._mobileInputDirection = null;
        }
        window._mobileInputDirection = null;
        
        // Remove pressed state from all buttons
        Object.values(this.arrowButtons).forEach(button => {
            if (button) {
                button.classList.remove('pressed');
            }
        });
    },
    
    // Update controls visibility based on game state
    updateVisibility: function(gameRunning) {
        if (!this.isMobileDevice()) {
            return;
        }
        
        if (gameRunning && this.controlsContainer) {
            this.controlsContainer.classList.add('active');
        } else {
            this.hideControls();
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = MobileControls;
} else {
    // Make available globally
    window.MobileControls = MobileControls;
} 