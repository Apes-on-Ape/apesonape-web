// Block Dodger - Player Module

const Player = {
    // Player object
    data: {
        x: 0,
        y: 0,
        width: Config.PLAYER_WIDTH,
        height: Config.PLAYER_HEIGHT,
        speed: Config.PLAYER_SPEED,
        dx: 0,
        color: '#ffffff',
        glowColor: Config.PLAYER_GLOW_COLOR,
        glowSize: Config.PLAYER_GLOW_SIZE,
        pulseRate: Config.PLAYER_PULSE_RATE,
        pulseAmount: Config.PLAYER_PULSE_AMOUNT,
        currentPulse: 0,
        apeImage: null,
        isInvincible: false
    },
    
    // Set the player's ape
    setApe: function(apeData) {
        window.selectedApe = apeData;
        
        // Reset the ape image so it will be reloaded
        this.data.apeImage = null;
    },
    
    // Create a placeholder image for apes
    createApePlaceholder: function(tokenId) {
        const id = String(tokenId || '0000').padStart(4, '0');
        return `https://placehold.co/200x200/222222/00ffff?text=Ape%20%23${id}`;
    },
    
    // Reset player position to starting position
    resetPosition: function() {
        if (!canvas) return;
        
        // Ensure canvas dimensions are valid
        if (canvas.width <= 0 || canvas.height <= 0) {
            console.warn('Invalid canvas dimensions during player reset');
            // Try again in a short moment if dimensions are invalid
            setTimeout(() => this.resetPosition(), 100);
            return;
        }
        
        // Set player to bottom center of canvas
        this.data.x = (canvas.width / 2) - (this.data.width / 2);
        this.data.y = canvas.height - this.data.height; // Remove padding to touch bottom
        this.data.dx = 0; // Reset horizontal movement
        this.data.isInvincible = false; // Reset invincibility state
        
        // Apply any shop upgrades
        if (window.Shop && Shop.isInitialized) {
            Shop.applyUpgrades();
        }
        
        console.log(`Player positioned at: x=${this.data.x}, y=${this.data.y}, canvas dimensions: ${canvas.width}x${canvas.height}`);
    },
    
    // Move the player left
    moveLeft: function() {
        if (Game.isGameOver()) return;
        this.data.dx = -this.data.speed;
    },
    
    // Move the player right
    moveRight: function() {
        if (Game.isGameOver()) return;
        this.data.dx = this.data.speed;
    },
    
    // Stop player movement
    stopMove: function() {
        this.data.dx = 0;
    },
    
    // Update player position
    update: function(deltaTime) {
        // Use a default deltaTime if not provided (for backward compatibility)
        const dt = deltaTime || Config.FIXED_TIME_STEP;
        
        // Calculate time factor (60 FPS is our baseline)
        const timeFactor = dt / (1000 / 60);
        
        // Update player position with proper boundary checks and time-based movement
        const moveAmount = this.data.dx * timeFactor;
        const newX = this.data.x + moveAmount;
        
        // Allow movement right up to the edges
        if (newX >= 0 && newX <= canvas.width - this.data.width) {
            this.data.x = newX;
        } else if (newX < 0) {
            this.data.x = 0;
        } else if (newX > canvas.width - this.data.width) {
            this.data.x = canvas.width - this.data.width;
        }
        
        // Always enforce player's vertical position to be at the bottom with no padding
        this.data.y = canvas.height - this.data.height;
        
        // Update player animation values - scale by deltaTime for consistent animation speed
        this.data.currentPulse += this.data.pulseRate * timeFactor;
        if (this.data.currentPulse > Math.PI * 2) {
            this.data.currentPulse = 0;
        }
    },
    
    // Draw the player
    draw: function() {
        // Save the current context state
        ctx.save();
        
        // Apply invincibility effect if active
        if (this.data.isInvincible) {
            // Gold glow effect for invincibility
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            
            // Pulsating effect
            const pulseAmount = Math.sin(this.data.currentPulse) * 0.3 + 0.7;
            ctx.globalAlpha = pulseAmount;
        }
        
        const profileUrl =
            typeof window !== 'undefined' && window.getArcadePlayableAvatarUrl
                ? window.getArcadePlayableAvatarUrl()
                : typeof window !== 'undefined' && window.getArcadeProfilePortraitUrl
                  ? window.getArcadeProfilePortraitUrl()
                  : null;
        const nftUrl = window.selectedApe && window.selectedApe.image ? window.selectedApe.image : null;
        const portraitUrl = profileUrl || nftUrl;

        // If we have a site profile PFP or selected Ape, draw it instead of the glowing block
        if (portraitUrl) {
            // Create or refresh image when source changes
            if (!this.data.apeImage || this.data._apePortraitSrc !== portraitUrl) {
                this.data._apePortraitSrc = portraitUrl;
                this.data.apeImage = new Image();
                this.data.apeImage.src = portraitUrl;
                
                // Add error handling for the image
                this.data.apeImage.onerror = () => {
                    console.error('Failed to load player NFT image, trying backup gateway');
                    // Try to extract IPFS CID if present (NFT URL only)
                    if (nftUrl && nftUrl.includes('/ipfs/')) {
                        const ipfsCid = nftUrl.split('/ipfs/')[1].split('?')[0];
                        const gateway2 = 'https://dweb.link/ipfs/';
                        this.data.apeImage.src = gateway2 + ipfsCid + '?t=' + Date.now();
                        
                        // Add another fallback
                        this.data.apeImage.onerror = () => {
                            console.error('Failed to load from backup gateway, using placeholder');
                            this.data.apeImage.src = Player.createApePlaceholder(
                                window.selectedApe && window.selectedApe.tokenId
                            );
                        };
                    } else {
                        // Fallback to placeholder
                        this.data.apeImage.src = Player.createApePlaceholder(
                            window.selectedApe && window.selectedApe.tokenId
                        );
                    }
                };
            }
            
            // Draw the Ape image
            if (this.data.apeImage.complete) {
                // Draw white or gold outline based on invincibility
                ctx.strokeStyle = this.data.isInvincible ? '#FFD700' : 'white';
                ctx.lineWidth = this.data.isInvincible ? 3 : 2;
                ctx.strokeRect(this.data.x, this.data.y, this.data.width, this.data.height);
                
                // Draw the Ape image
                ctx.drawImage(
                    this.data.apeImage,
                    this.data.x,
                    this.data.y,
                    this.data.width,
                    this.data.height
                );
            }
        } else {
            // Fallback to simple colored block if no Ape is selected
            ctx.fillStyle = this.data.isInvincible ? '#FFD700' : 'white';
            ctx.fillRect(this.data.x, this.data.y, this.data.width, this.data.height);
            
            // Add a gold border for invincibility
            if (this.data.isInvincible) {
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.data.x, this.data.y, this.data.width, this.data.height);
            }
        }
        
        // Restore the context state
        ctx.restore();
    },
    
    // Check if player is invincible
    isInvincible: function() {
        return this.data.isInvincible;
    }
}; 