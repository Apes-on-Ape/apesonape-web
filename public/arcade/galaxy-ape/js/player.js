// Run Ape - Player Module

const Player = {
    // Player properties
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    velocityY: 0,
    velocityX: 0,
    
    // Thruster-based movement
    thrustersActive: {
        up: false,
        down: false,
        left: false,
        right: false
    },
    
    // Projectile system
    rockets: [],
    lastRocketTime: 0,
    
    // Movement properties
    speed: 0,
    maxSpeed: 0,
    acceleration: 0,
    friction: 0,
    
    // Animation properties
    frameX: 0,
    frameY: 0,
    maxFrames: 8,
    frameTimer: 0,
    frameInterval: 100, // ms
    facingDirection: 1, // 1 for right, -1 for left
    
    // Player image
    image: null,
    apeImage: null,
    defaultApeImage: null,
    imageLoaded: false,
    
    // Scale ratio for responsive design
    scaleRatio: 1,
    canvas: null,
    
    // Input states
    keys: {
        left: false,
        right: false,
        up: false,
        down: false,
        space: false
    },
    
    // Initialize player
    init: function(canvas) {
        this.canvas = canvas;
        this.reset();
        this.keys = {};
        this.rockets = [];
        this.thrustersActive = { up: false, down: false };
        this.scaleRatio = 1;
        
        // Set up input handlers
        this.setupInputHandlers();
    },
    
    // Add coordinate validation function
    isValidCoordinate: function(value) {
        return typeof value === 'number' && 
               isFinite(value) && 
               !isNaN(value) && 
               Math.abs(value) < 1000000; // Reasonable bounds
    },
    
    // Setup input handlers for keyboard controls
    setupInputHandlers: function() {
        // Remove existing listeners to avoid duplicates
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Bind context to maintain 'this' reference
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    },
    
    // Handle key down events (Thruster-based)
    handleKeyDown: function(event) {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                this.thrustersActive.left = true;
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                this.thrustersActive.right = true;
                event.preventDefault();
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                this.thrustersActive.up = true;
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                this.thrustersActive.down = true;
                event.preventDefault();
                break;
            case 'Space':
                if (!this.keys.space) {
                    this.keys.space = true;
                }
                event.preventDefault();
                break;
            case 'KeyG': // Galaxy Easter Egg - Press 'G' key
                if (window.triggerAchievementEvent) {
                    window.triggerAchievementEvent('easterEgg', { game: 'galaxy_ape', type: 'galaxy_key' });
                }
                event.preventDefault();
                break;
        }
    },
    
    // Handle key up events (Thruster-based)
    handleKeyUp: function(event) {
        switch(event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                this.thrustersActive.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                this.thrustersActive.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                this.thrustersActive.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                this.thrustersActive.down = false;
                break;
            case 'Space':
                this.keys.space = false;
                break;
        }
    },
    
    // Handle touch input for mobile
    handleTouchInput: function(touchX, touchY, canvasWidth, canvasHeight) {
        const halfWidth = canvasWidth / 2;
        const halfHeight = canvasHeight / 2;
        
        if (touchY < halfHeight) {
            // Top half - activate up thruster
            this.thrustersActive.up = true;
            setTimeout(() => this.thrustersActive.up = false, 200);
        } else {
            // Bottom half - check left or right
            if (touchX < halfWidth) {
                this.keys.left = true;
                setTimeout(() => this.keys.left = false, 200);
            } else {
                this.keys.right = true;
                setTimeout(() => this.keys.right = false, 200);
            }
        }
    },
    
    // Update scale for responsive design
    updateScale: function(canvas, scaleRatio) {
        this.scaleRatio = scaleRatio;
        this.canvas = canvas;
        
        // Apply portrait mode scaling
        const portraitScale = CONFIG.getPortraitScale('PLAYER');
        this.width = CONFIG.PLAYER_WIDTH * this.scaleRatio * portraitScale;
        this.height = CONFIG.PLAYER_HEIGHT * this.scaleRatio * portraitScale;
        this.maxSpeed = CONFIG.PLAYER_MAX_SPEED * this.scaleRatio;
        this.acceleration = CONFIG.PLAYER_ACCELERATION * this.scaleRatio;
        
        // Use actual canvas dimensions instead of fixed CONFIG constants for portrait mode compatibility
        let gameHeight, gameWidth;
        if (CONFIG.isPortraitMode()) {
            gameHeight = canvas ? canvas.width : window.innerWidth;
            gameWidth = canvas ? canvas.height : window.innerHeight;
        } else {
            gameHeight = canvas ? canvas.height : window.innerHeight;
            gameWidth = canvas ? canvas.width : window.innerWidth;
        }
        
        // Position player based on orientation
        if (CONFIG.isPortraitMode()) {
            // Canvas is 844x390. Spawn player in center, away from ground at Y=390
            this.x = gameWidth * 0.5; // Center horizontally (844 * 0.5 = 422)
            this.y = gameHeight * 0.3; // Upper area (390 * 0.3 = 117)
        } else {
            // Standard landscape positioning
            this.y = gameHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio - this.height + CONFIG.PLAYER_GROUND_OFFSET * this.scaleRatio;
        }
    },
    
    // Load the player's selected ape image
    loadSelectedApe: async function() {
        try {
            if (window.getArcadePlayableAvatarUrl || window.getArcadeProfilePortraitUrl) {
                const sitePfp = window.getArcadePlayableAvatarUrl
                    ? window.getArcadePlayableAvatarUrl()
                    : window.getArcadeProfilePortraitUrl();
                if (sitePfp) {
                    this.loadApeImage(sitePfp);
                    console.log('Using site profile avatar for Galaxy Ape');
                    return;
                }
            }
            // Use the global function to load from database
            if (window.NFT && window.NFT.loadSelectedApeForGame) {
                const apeData = await window.NFT.loadSelectedApeForGame();
                if (apeData) {
                    console.log('Loaded selected ape from database:', apeData);
                    
                    // Get the image URL from the ape data
                    let imageUrl = null;
                    if (apeData.image_url) {
                        imageUrl = apeData.image_url;
                    } else if (apeData.image) {
                        imageUrl = apeData.image;
                    } else if (apeData.metadata && apeData.metadata.image) {
                        imageUrl = apeData.metadata.image;
                    } else if (apeData.url) {
                        imageUrl = apeData.url;
                    }
                    
                    if (imageUrl) {
                        // Fix IPFS URLs if needed
                        if (imageUrl.startsWith('ipfs://')) {
                            imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                        }
                        
                        // Load the image
                        this.loadApeImage(imageUrl);
                        return;
                    }
                } else {
                    console.log('No selected ape found in database');
                }
            }
            
            // Fallback to localStorage if NFT module not available
            const cachedApe = localStorage.getItem('selectedApe');
            if (cachedApe) {
                try {
                    const apeData = JSON.parse(cachedApe);
                    if (apeData && (apeData.image || apeData.imageUrl || apeData.image_url)) {
                        const imageUrl = apeData.image || apeData.imageUrl || apeData.image_url;
                        this.loadApeImage(imageUrl);
                        console.log('Loaded ape image from localStorage');
                        return;
                    }
                } catch (e) {
                    console.warn('Failed to parse cached ape data:', e);
                }
            }
            
            console.log('No selected ape found, using default');
        } catch (error) {
            console.error('Error loading selected ape:', error);
        }
    },
    
    // Load ape image from URL
    loadApeImage: function(url) {
        const img = new Image();
        
        img.onload = () => {
            console.log('Ape image loaded successfully');
            this.apeImage = img;
            this.imageLoaded = true;
        };
        
        img.onerror = () => {
            console.error('Error loading ape image, using default');
            this.apeImage = this.defaultApeImage;
        };
        
        img.src = url;
    },
    
    // Fire rocket projectile
    fireRocket: function() {
        // Use new weapons system if available
        if (typeof Weapons !== 'undefined' && Weapons.fire) {
            const success = Weapons.fire(
                this.x + this.width / 2,
                this.y + this.height / 2,
                { x: 1, y: 0 } // Fire to the right
            );
            return success;
        }
        
        // Fallback to old rocket system
        const currentTime = Date.now();
        if (currentTime - this.lastRocketTime >= CONFIG.ROCKET_FIRE_RATE) {
            this.lastRocketTime = currentTime;
            
            // Apply portrait mode scaling to rocket size
            const portraitScale = CONFIG.getPortraitScale('PROJECTILE');
            
            // Create rocket projectile
            const rocket = {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                velocityX: CONFIG.ROCKET_SPEED,
                velocityY: 0,
                lifetime: CONFIG.ROCKET_LIFETIME,
                size: CONFIG.ROCKET_SIZE * portraitScale,
                createdAt: currentTime
            };
            
            this.rockets.push(rocket);
            
            // Play rocket sound
            if (Sound && Sound.play) {
                Sound.play('rocket');
            }
            
            return true;
        }
        
        return false;
    },
    
    // Update rockets
    updateRockets: function(deltaTime) {
        const currentTime = Date.now();
        
        // Use actual canvas dimensions instead of fixed CONFIG constants for portrait mode compatibility
        let gameWidth, gameHeight;
        
        if (CONFIG.isPortraitMode()) {
            // In portrait mode, canvas is rotated so we need to swap dimensions
            gameWidth = this.canvas ? this.canvas.height : window.innerHeight;
            gameHeight = this.canvas ? this.canvas.width : window.innerWidth;
        } else {
            // In landscape mode, use normal dimensions
            gameWidth = this.canvas ? this.canvas.width : window.innerWidth;
            gameHeight = this.canvas ? this.canvas.height : window.innerHeight;
        }
        
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];
            
            // Update rocket position
            rocket.x += rocket.velocityX;
            rocket.y += rocket.velocityY;
            
            // Remove expired or off-screen rockets using actual game dimensions
            if (currentTime - rocket.createdAt > rocket.lifetime || 
                rocket.x > gameWidth + 50 || 
                rocket.x < -50 || 
                rocket.y > gameHeight + 50 || 
                rocket.y < -50) {
                this.rockets.splice(i, 1);
            }
        }
    },
    
    // Update player state (Thruster-based physics)
    update: function(deltaTime, canvas) {
        // Use the stored canvas reference if no canvas is provided
        if (!canvas && this.canvas) {
            canvas = this.canvas;
        }
        
        // Apply thruster forces
        if (this.thrustersActive.left) {
            this.velocityX -= CONFIG.THRUSTER_FORCE * this.scaleRatio;
            this.facingDirection = -1;
        }
        if (this.thrustersActive.right) {
            this.velocityX += CONFIG.THRUSTER_FORCE * this.scaleRatio;
            this.facingDirection = 1;
        }
        if (this.thrustersActive.up) {
            this.velocityY -= CONFIG.THRUSTER_FORCE * this.scaleRatio;
        }
        if (this.thrustersActive.down) {
            this.velocityY += CONFIG.THRUSTER_FORCE * this.scaleRatio;
        }
        
        // Apply thruster decay when not active
        if (!this.thrustersActive.left && !this.thrustersActive.right) {
            this.velocityX *= CONFIG.THRUSTER_DECAY;
        }
        if (!this.thrustersActive.up && !this.thrustersActive.down) {
            this.velocityY *= CONFIG.THRUSTER_DECAY;
        }
        
        // Apply minimal gravity for space-like physics
        this.velocityY += CONFIG.GRAVITY * this.scaleRatio;
        
        // Validate scaleRatio
        if (!this.isValidCoordinate(this.scaleRatio)) {
            console.warn('Invalid scaleRatio detected, resetting to 1:', this.scaleRatio);
            this.scaleRatio = 1;
        }
        
        // Validate velocities before clamping
        if (!this.isValidCoordinate(this.velocityX)) {
            console.warn('Invalid velocityX detected, resetting to 0:', this.velocityX);
            this.velocityX = 0;
        }
        if (!this.isValidCoordinate(this.velocityY)) {
            console.warn('Invalid velocityY detected, resetting to 0:', this.velocityY);
            this.velocityY = 0;
        }
        
        // Clamp velocities to maximum
        this.velocityX = Math.max(-CONFIG.MAX_VELOCITY, Math.min(CONFIG.MAX_VELOCITY, this.velocityX));
        this.velocityY = Math.max(-CONFIG.MAX_VELOCITY, Math.min(CONFIG.MAX_VELOCITY, this.velocityY));
        
        // Validate position before applying movement
        if (!this.isValidCoordinate(this.x) || !this.isValidCoordinate(this.y)) {
            console.warn('Invalid player position detected, resetting to safe position:', this.x, this.y);
            this.x = 100;
            this.y = 100;
            this.velocityX = 0;
            this.velocityY = 0;
        }
        
        // Apply movement
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Validate position after movement
        if (!this.isValidCoordinate(this.x) || !this.isValidCoordinate(this.y)) {
            console.warn('Position became invalid after movement, resetting:', this.x, this.y);
            this.x = 100;
            this.y = 100;
            this.velocityX = 0;
            this.velocityY = 0;
        }
        
        // Keep player on screen with soft boundaries using actual canvas dimensions
        let gameWidth, gameHeight;
        
        if (CONFIG.isPortraitMode()) {
            // In portrait mode, use canvas dimensions directly (don't swap)
            gameWidth = this.canvas ? this.canvas.width : window.innerWidth;
            gameHeight = this.canvas ? this.canvas.height : window.innerHeight;
        } else {
            // In landscape mode, use normal dimensions
            gameWidth = this.canvas ? this.canvas.width : window.innerWidth;
            gameHeight = this.canvas ? this.canvas.height : window.innerHeight;
        }
        
        // For portrait mode, fix the ground mechanics
        if (CONFIG.isPortraitMode()) {
            // Canvas: width=844, height=390. Ground should be at canvas height (390)
            
            // X boundaries (0 to 844)
            if (this.x < 0) {
                this.x = 0;
                this.velocityX = Math.max(0, this.velocityX);
            }
            if (this.x + this.width > gameWidth) {
                this.x = gameWidth - this.width;
                this.velocityX = Math.min(0, this.velocityX);
            }
            
            // Y boundaries (0 to 390) - ground at bottom (390)
            if (this.y < 0) {
                this.y = 0;
                this.velocityY = Math.max(0, this.velocityY);
            }
            // Ground at canvas bottom (Y=390)
            if (this.y + this.height > gameHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio) {
                this.y = gameHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio - this.height;
                this.velocityY = Math.min(0, this.velocityY);
            }
        } else {
            // Standard landscape boundaries
            if (this.x < 0) {
                this.x = 0;
                this.velocityX = Math.max(0, this.velocityX);
            }
            if (this.x + this.width > gameWidth) {
                this.x = gameWidth - this.width;
                this.velocityX = Math.min(0, this.velocityX);
            }
            
            if (this.y < 0) {
                this.y = 0;
                this.velocityY = Math.max(0, this.velocityY);
            }
            if (this.y + this.height > gameHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio) {
                this.y = gameHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio - this.height;
                this.velocityY = Math.min(0, this.velocityY);
            }
        }
        
        // Handle continuous shooting when space is held
        if (this.keys.space) {
            this.fireRocket();
        }
        
        // Update rockets
        this.updateRockets(deltaTime);
        
        // Update animation
        this.frameTimer += deltaTime;
        
        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % this.maxFrames;
        }
    },
    
    // Note: Platform collision now handled in game.js with push mechanics
    
    // Get collision bounds
    getBounds: function() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    },
    
    // Get rockets for collision detection
    getRockets: function() {
        return this.rockets;
    },
    
    // Draw player in rocket ship
    draw: function(ctx, canvas) {
        // Use the stored canvas reference if no canvas is provided
        if (!canvas && this.canvas) {
            canvas = this.canvas;
        }
        
        // Make sure ctx is available
        if (!ctx) {
            console.error('No context available for Player.draw');
            return;
        }
        
        // Debug: Check player position and dimensions
        console.log('Player draw - Position:', this.x, this.y, 'Size:', this.width, this.height);
        
        // Check if player dimensions are valid
        if (!this.isValidCoordinate(this.x) || !this.isValidCoordinate(this.y) || 
            !this.isValidCoordinate(this.width) || !this.isValidCoordinate(this.height) ||
            this.width <= 0 || this.height <= 0) {
            console.error('Invalid player dimensions detected:', {
                x: this.x, y: this.y, width: this.width, height: this.height
            });
            return;
        }
        
        // Save context for transformations
        ctx.save();
        
        // Calculate rocket position and size
        const rocketX = this.x - this.width * 0.1;
        const rocketY = this.y - this.height * 0.2;
        const rocketWidth = this.width * 1.2;
        const rocketHeight = this.height * 1.4;
        
        // Add floating/flying animation
        const time = Date.now() * 0.003;
        const floatOffset = Math.sin(time) * 2;
        const finalRocketY = rocketY + floatOffset;
        
        // Rocket tilt based on movement
        const tiltAngle = this.velocityX * 0.05; // Slight tilt based on horizontal velocity
        
        // Apply transformations
        ctx.translate(rocketX + rocketWidth / 2, finalRocketY + rocketHeight / 2);
        ctx.rotate(tiltAngle);
        ctx.translate(-rocketWidth / 2, -rocketHeight / 2);
        
        // Try to use rocket asset first
        if (AssetLoader && AssetLoader.isLoaded('rocket')) {
            AssetLoader.drawImageOrFallback(ctx, 'rocket', 0, 0, rocketWidth, rocketHeight, '#4169E1');
        } else {
            // Draw custom rocket
            this.drawCustomRocket(ctx, 0, 0, rocketWidth, rocketHeight);
        }
        
        // Draw rocket engine flames
        this.drawEngineFlames(ctx, 0, rocketHeight, rocketWidth);
        
        // Draw pilot (ape) in cockpit window
        this.drawPilot(ctx, rocketWidth * 0.3, rocketHeight * 0.2, rocketWidth * 0.4, rocketHeight * 0.3);
        
        ctx.restore();
        
        // Draw rockets
        this.drawRockets(ctx);
        
        // Debug - draw collision bounds
        if (CONFIG.DEBUG) {
            const bounds = this.getBounds();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    },
    
    // Draw custom rocket when asset isn't available
    drawCustomRocket: function(ctx, x, y, width, height) {
        // Main rocket body
        ctx.fillStyle = '#C0C0C0'; // Silver
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width * 0.8, y + height * 0.3);
        ctx.lineTo(x + width * 0.8, y + height * 0.8);
        ctx.lineTo(x + width * 0.2, y + height * 0.8);
        ctx.lineTo(x + width * 0.2, y + height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Rocket nose highlight
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width * 0.7, y + height * 0.3);
        ctx.lineTo(x + width * 0.5, y + height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Side fins
        ctx.fillStyle = '#A0A0A0';
        // Left fin
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y + height * 0.6);
        ctx.lineTo(x, y + height * 0.9);
        ctx.lineTo(x + width * 0.2, y + height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Right fin
        ctx.beginPath();
        ctx.moveTo(x + width * 0.8, y + height * 0.6);
        ctx.lineTo(x + width, y + height * 0.9);
        ctx.lineTo(x + width * 0.8, y + height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit window frame
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height * 0.35, width * 0.2, height * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Body panels
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y + height * 0.5);
        ctx.lineTo(x + width * 0.7, y + height * 0.5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + width * 0.3, y + height * 0.65);
        ctx.lineTo(x + width * 0.7, y + height * 0.65);
        ctx.stroke();
    },
    
    // Draw engine flames
    drawEngineFlames: function(ctx, rocketX, rocketY, rocketWidth) {
        const time = Date.now() * 0.01;
        const flameIntensity = 0.7 + Math.sin(time * 3) * 0.3;
        
        // Main engine flame
        ctx.save();
        ctx.globalAlpha = flameIntensity;
        
        // Outer flame (red)
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(rocketX + rocketWidth * 0.3, rocketY);
        ctx.lineTo(rocketX + rocketWidth * 0.7, rocketY);
        ctx.lineTo(rocketX + rocketWidth * 0.6, rocketY + 20 + Math.sin(time * 2) * 5);
        ctx.lineTo(rocketX + rocketWidth * 0.5, rocketY + 15 + Math.sin(time * 2.5) * 3);
        ctx.lineTo(rocketX + rocketWidth * 0.4, rocketY + 20 + Math.sin(time * 1.8) * 5);
        ctx.closePath();
        ctx.fill();
        
        // Inner flame (yellow)
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(rocketX + rocketWidth * 0.4, rocketY);
        ctx.lineTo(rocketX + rocketWidth * 0.6, rocketY);
        ctx.lineTo(rocketX + rocketWidth * 0.55, rocketY + 12 + Math.sin(time * 2) * 3);
        ctx.lineTo(rocketX + rocketWidth * 0.5, rocketY + 8 + Math.sin(time * 2.5) * 2);
        ctx.lineTo(rocketX + rocketWidth * 0.45, rocketY + 12 + Math.sin(time * 1.8) * 3);
        ctx.closePath();
        ctx.fill();
        
        // Core flame (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(rocketX + rocketWidth * 0.45, rocketY);
        ctx.lineTo(rocketX + rocketWidth * 0.55, rocketY);
        ctx.lineTo(rocketX + rocketWidth * 0.52, rocketY + 6 + Math.sin(time * 2) * 2);
        ctx.lineTo(rocketX + rocketWidth * 0.5, rocketY + 4 + Math.sin(time * 2.5) * 1);
        ctx.lineTo(rocketX + rocketWidth * 0.48, rocketY + 6 + Math.sin(time * 1.8) * 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Side thruster flames based on active thrusters
        ctx.save();
        ctx.globalAlpha = 0.8;
        
        if (this.thrustersActive.left) {
            // Left thruster flame (right side of ship)
            ctx.fillStyle = '#00BFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.82, rocketY - 10, 10, 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.84, rocketY - 9, 6, 2);
        }
        
        if (this.thrustersActive.right) {
            // Right thruster flame (left side of ship)
            ctx.fillStyle = '#00BFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.08, rocketY - 10, 10, 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.1, rocketY - 9, 6, 2);
        }
        
        if (this.thrustersActive.up) {
            // Bottom thrusters enhanced
            ctx.fillStyle = '#00BFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.2, rocketY + 5, 6, 12);
            ctx.fillRect(rocketX + rocketWidth * 0.74, rocketY + 5, 6, 12);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.22, rocketY + 6, 3, 8);
            ctx.fillRect(rocketX + rocketWidth * 0.76, rocketY + 6, 3, 8);
        }
        
        if (this.thrustersActive.down) {
            // Top thrusters
            ctx.fillStyle = '#00BFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.3, rocketY - 15, 4, 8);
            ctx.fillRect(rocketX + rocketWidth * 0.66, rocketY - 15, 4, 8);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(rocketX + rocketWidth * 0.31, rocketY - 12, 2, 5);
            ctx.fillRect(rocketX + rocketWidth * 0.67, rocketY - 12, 2, 5);
        }
        
        ctx.restore();
    },
    
    // Draw pilot in cockpit
    drawPilot: function(ctx, x, y, width, height) {
        // Cockpit window (transparent blue)
        ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width * 0.4, height * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Try to draw ape pilot if image is available (dimmed for better shot visibility)
        if (this.apeImage && this.apeImage.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(x + width / 2, y + height / 2, width * 0.35, height * 0.5, 0, 0, Math.PI * 2);
            ctx.clip();
            
            // Apply dimming effect for better shot visibility
            ctx.globalAlpha = CONFIG.VISUAL_EFFECTS.APE_DIMMER || 0.7;
            
            ctx.drawImage(
                this.apeImage,
                x + width * 0.1,
                y + height * 0.1,
                width * 0.8,
                height * 0.8
            );
            ctx.restore();
        } else {
            // Fallback pilot silhouette
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(x + width / 2, y + height / 2, width * 0.25, height * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cockpit reflection/glare
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + width * 0.3, y + height * 0.3, width * 0.15, height * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // Draw rocket projectiles
    drawRockets: function(ctx) {
        this.rockets.forEach(rocket => {
            ctx.save();
            
            // Rocket trail
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.fillRect(rocket.x - 15, rocket.y - 2, 12, 4);
            
            // Main rocket body
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(rocket.x - 2, rocket.y - 1, rocket.size, 2);
            
            // Rocket nose
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(rocket.x + rocket.size - 2, rocket.y - 1, 3, 2);
            
            // Rocket fins
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(rocket.x - 1, rocket.y - 2, 2, 1);
            ctx.fillRect(rocket.x - 1, rocket.y + 1, 2, 1);
            
            ctx.restore();
        });
    },
    
    // Reset player state
    reset: function(canvas) {
        // Use actual canvas dimensions instead of fixed CONFIG constants for portrait mode compatibility
        let gameHeight, gameWidth;
        if (CONFIG.isPortraitMode()) {
            gameHeight = canvas ? canvas.width : window.innerWidth;
            gameWidth = canvas ? canvas.height : window.innerHeight;
        } else {
            gameHeight = canvas ? canvas.height : window.innerHeight;
            gameWidth = canvas ? canvas.width : window.innerWidth;
        }
        
        // Position player based on orientation
        if (CONFIG.isPortraitMode()) {
            // Canvas is 844x390. Spawn player in center, away from ground at Y=390
            this.x = gameWidth * 0.5; // Center horizontally (844 * 0.5 = 422)
            this.y = gameHeight * 0.3; // Upper area (390 * 0.3 = 117)
        } else {
            // Standard landscape positioning
            this.x = CONFIG.PLAYER_X_POSITION * this.scaleRatio;
            this.y = gameHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio - this.height + CONFIG.PLAYER_GROUND_OFFSET * this.scaleRatio;
        }
        
        // Store canvas reference if provided
        if (canvas) {
            this.canvas = canvas;
        }
        
        this.velocityY = 0;
        this.velocityX = 0;
        this.facingDirection = 1;
        
        // Reset thruster states
        this.thrustersActive = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Clear rockets
        this.rockets = [];
        this.lastRocketTime = 0;
        
        // Reset keys
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        console.log('Player reset');
    },
    
    // Adjust position after resize
    adjustPositionAfterResize: function(oldWidth, oldHeight, newWidth, newHeight) {
        // Use actual canvas dimensions for portrait mode compatibility
        let gameHeight;
        if (CONFIG.isPortraitMode()) {
            gameHeight = this.canvas ? this.canvas.width : window.innerWidth;
        } else {
            gameHeight = this.canvas ? this.canvas.height : window.innerHeight;
        }
        
        // Adjust player position proportionally
        this.x = (this.x / oldWidth) * newWidth;
        this.y = gameHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio - this.height + CONFIG.PLAYER_GROUND_OFFSET * this.scaleRatio;
    },
    
    // Powerup state
    speedBoostActive: false,
    speedBoostTimer: null,
    originalMaxVelocity: CONFIG.MAX_VELOCITY,
    
    // Activate speed boost powerup
    activateSpeedBoost: function(duration = 6000) {
        if (this.speedBoostActive) {
            // Extend existing speed boost
            if (this.speedBoostTimer) {
                clearTimeout(this.speedBoostTimer);
            }
        }
        
        this.speedBoostActive = true;
        CONFIG.MAX_VELOCITY = this.originalMaxVelocity * 1.5; // 50% speed increase
        
        // Set timer to deactivate speed boost
        this.speedBoostTimer = setTimeout(() => {
            this.speedBoostActive = false;
            this.speedBoostTimer = null;
            CONFIG.MAX_VELOCITY = this.originalMaxVelocity;
            
            if (UI && UI.showNotification) {
                UI.showNotification('🚀 Speed boost ended', 1500);
            }
        }, duration);
        
        console.log(`Speed boost activated for ${duration}ms`);
    },
    
    // Check if player is shielded (for collision detection)
    isPlayerShielded: function() {
        return false; // No shield, always false
    },
    
    // Clear all powerup timers
    clearPowerupTimers: function() {
        if (this.speedBoostTimer) {
            clearTimeout(this.speedBoostTimer);
            this.speedBoostTimer = null;
        }
        this.speedBoostActive = false;
        CONFIG.MAX_VELOCITY = this.originalMaxVelocity;
    },
    
    // Cleanup
    destroy: function() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Clear powerup timers
        this.clearPowerupTimers();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Player;
} 