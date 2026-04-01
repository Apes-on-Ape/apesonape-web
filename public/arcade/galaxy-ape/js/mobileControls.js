// Mobile Controls - Virtual Thumbstick and Fire Button
// Based on the clubroom joystick implementation, adapted for galaxy-ape

const MobileControls = {
    // Control elements
    controlsContainer: null,
    thumbstickContainer: null,
    thumbstickBase: null,
    thumbstickKnob: null,
    fireButton: null,
    fireButtonInner: null,
    
    // Thumbstick state
    thumbstickActive: false,
    thumbstickStartPos: { x: 0, y: 0 },
    thumbstickCurrentPos: { x: 0, y: 0 },
    thumbstickCenter: { x: 0, y: 0 },
    thumbstickRadius: 0,
    
    // Fire button state
    fireButtonActive: false,
    lastFireTime: 0,
    
    // Movement state
    movementVector: { x: 0, y: 0 },
    
    // Portrait mode detection
    isPortrait: false,
    
    // Initialize mobile controls
    init: function() {
        // Get control elements
        this.controlsContainer = document.getElementById('mobileControls');
        this.thumbstickContainer = document.getElementById('thumbstickContainer');
        this.thumbstickBase = document.getElementById('thumbstickBase');
        this.thumbstickKnob = document.getElementById('thumbstickKnob');
        this.fireButton = document.getElementById('fireButton');
        this.fireButtonInner = document.getElementById('fireButton').querySelector('.fire-button-inner');
        
        if (!this.controlsContainer) {
            return false;
        }
        
        // Calculate thumbstick properties
        this.updateThumbstickProperties();
        
        // Add event listeners
        this.addEventListeners();
        
        // Show controls on mobile devices
        this.showControlsOnMobile();
        
        return true;
    },
    
    // Update thumbstick center position and radius
    updateThumbstickProperties: function() {
        if (!this.thumbstickContainer) return;
        
        const rect = this.thumbstickContainer.getBoundingClientRect();
        this.thumbstickCenter.x = rect.left + rect.width / 2;
        this.thumbstickCenter.y = rect.top + rect.height / 2;
        this.thumbstickRadius = Math.min(rect.width, rect.height) / 2 - 25; // Minus knob radius
        
        // Update portrait mode detection
        this.isPortrait = window.innerHeight > window.innerWidth;
    },
    
    // Add touch event listeners
    addEventListeners: function() {
        // Thumbstick events
        if (this.thumbstickContainer) {
            this.thumbstickContainer.addEventListener('touchstart', this.onThumbstickStart.bind(this), { passive: false });
            this.thumbstickContainer.addEventListener('touchmove', this.onThumbstickMove.bind(this), { passive: false });
            this.thumbstickContainer.addEventListener('touchend', this.onThumbstickEnd.bind(this), { passive: false });
            
            // Mouse events for testing on desktop
            this.thumbstickContainer.addEventListener('mousedown', this.onThumbstickStart.bind(this));
            document.addEventListener('mousemove', this.onThumbstickMove.bind(this));
            document.addEventListener('mouseup', this.onThumbstickEnd.bind(this));
        }
        
        // Fire button events
        if (this.fireButton) {
            this.fireButton.addEventListener('touchstart', this.onFireButtonStart.bind(this), { passive: false });
            this.fireButton.addEventListener('touchend', this.onFireButtonEnd.bind(this), { passive: false });
            
            // Mouse events for testing on desktop
            this.fireButton.addEventListener('mousedown', this.onFireButtonStart.bind(this));
            this.fireButton.addEventListener('mouseup', this.onFireButtonEnd.bind(this));
        }
        
        // Window resize to update thumbstick position
        window.addEventListener('resize', this.updateThumbstickProperties.bind(this));
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.updateThumbstickProperties(), 100);
        });
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
    
    // Thumbstick touch start
    onThumbstickStart: function(e) {
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        this.thumbstickActive = true;
        this.thumbstickStartPos.x = touch.clientX;
        this.thumbstickStartPos.y = touch.clientY;
        
        this.thumbstickKnob.classList.add('active');
        this.updateThumbstickProperties(); // Update in case of layout changes
    },
    
    // Thumbstick touch move
    onThumbstickMove: function(e) {
        e.preventDefault();
        
        if (!this.thumbstickActive) return;
        
        const touch = e.touches ? e.touches[0] : e;
        this.thumbstickCurrentPos.x = touch.clientX;
        this.thumbstickCurrentPos.y = touch.clientY;
        
        // Calculate distance from center
        const deltaX = this.thumbstickCurrentPos.x - this.thumbstickCenter.x;
        const deltaY = this.thumbstickCurrentPos.y - this.thumbstickCenter.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Constrain to circle
        let knobX = deltaX;
        let knobY = deltaY;
        
        if (distance > this.thumbstickRadius) {
            knobX = (deltaX / distance) * this.thumbstickRadius;
            knobY = (deltaY / distance) * this.thumbstickRadius;
        }
        
        // Update knob position
        this.thumbstickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        
        // Calculate movement vector (-1 to 1)
        this.movementVector.x = knobX / this.thumbstickRadius;
        this.movementVector.y = knobY / this.thumbstickRadius;
        
        // Fix movement for portrait mode (rotated interface)
        if (this.isPortrait) {
            // Rotate movement mapping: right=down, left=up, down=left, up=right
            const tempX = this.movementVector.x;
            this.movementVector.x = -this.movementVector.y; // up/down becomes left/right (inverted)
            this.movementVector.y = tempX;         // left/right becomes up/down
        }
        
        // Update player thruster states based on movement
        this.updatePlayerMovement();
    },
    
    // Thumbstick touch end
    onThumbstickEnd: function(e) {
        e.preventDefault();
        
        this.thumbstickActive = false;
        this.thumbstickKnob.classList.remove('active');
        
        // Reset knob position
        this.thumbstickKnob.style.transform = 'translate(-50%, -50%)';
        
        // Reset movement vector
        this.movementVector.x = 0;
        this.movementVector.y = 0;
        
        // Stop player movement
        this.updatePlayerMovement();
    },
    
    // Fire button touch start
    onFireButtonStart: function(e) {
        e.preventDefault();
        
        this.fireButtonActive = true;
        this.fireButtonInner.classList.add('active');
        
        // Set player space key to true for continuous shooting
        if (Player && Player.keys) {
            Player.keys.space = true;
        }
        
        // Also fire immediately
        this.fireRocket();
    },
    
    // Fire button touch end
    onFireButtonEnd: function(e) {
        e.preventDefault();
        
        this.fireButtonActive = false;
        this.fireButtonInner.classList.remove('active');
        
        // Set player space key to false to stop shooting
        if (Player && Player.keys) {
            Player.keys.space = false;
        }
    },
    
    // Update player movement based on thumbstick
    updatePlayerMovement: function() {
        if (!Player || !Player.thrustersActive) {
            return;
        }
        
        const threshold = 0.2; // Dead zone
        
        // Horizontal movement
        if (Math.abs(this.movementVector.x) > threshold) {
            if (this.movementVector.x > threshold) {
                Player.thrustersActive.right = true;
                Player.thrustersActive.left = false;
            } else if (this.movementVector.x < -threshold) {
                Player.thrustersActive.left = true;
                Player.thrustersActive.right = false;
            }
        } else {
            Player.thrustersActive.left = false;
            Player.thrustersActive.right = false;
        }
        
        // Vertical movement
        if (Math.abs(this.movementVector.y) > threshold) {
            if (this.movementVector.y > threshold) {
                Player.thrustersActive.down = true;
                Player.thrustersActive.up = false;
            } else if (this.movementVector.y < -threshold) {
                Player.thrustersActive.up = true;
                Player.thrustersActive.down = false;
            }
        } else {
            Player.thrustersActive.up = false;
            Player.thrustersActive.down = false;
        }
    },
    
    // Fire rocket
    fireRocket: function() {
        if (!Player || !Player.fireRocket) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= CONFIG.ROCKET_FIRE_RATE) {
            Player.fireRocket();
            this.lastFireTime = currentTime;
        }
    },
    
    // Reset controls
    reset: function() {
        this.thumbstickActive = false;
        this.fireButtonActive = false;
        this.movementVector.x = 0;
        this.movementVector.y = 0;
        
        if (this.thumbstickKnob) {
            this.thumbstickKnob.classList.remove('active');
            this.thumbstickKnob.style.transform = 'translate(-50%, -50%)';
        }
        
        if (this.fireButtonInner) {
            this.fireButtonInner.classList.remove('active');
        }
        
        // Stop all player movement and shooting
        if (Player && Player.thrustersActive) {
            Player.thrustersActive.up = false;
            Player.thrustersActive.down = false;
            Player.thrustersActive.left = false;
            Player.thrustersActive.right = false;
        }
        
        // Stop shooting
        if (Player && Player.keys) {
            Player.keys.space = false;
        }
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
} 