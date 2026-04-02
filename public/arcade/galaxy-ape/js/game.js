// Run Ape - Game Module

const Game = {
    // Game state variables
    canvas: null,
    ctx: null,
    canvasWidth: CONFIG.CANVAS_WIDTH,
    canvasHeight: CONFIG.CANVAS_HEIGHT,
    score: 0,
    gameSpeed: CONFIG.INITIAL_SPEED,
    isRunning: false,
    gameOver: false,
    lastTime: 0,
    animationId: null,
    gameStartTime: 0,
    scaleRatio: 1,
    currentDifficultyIndex: CONFIG.DEFAULT_DIFFICULTY,
    
    // Lives system
    lives: 3,
    maxLives: 3,
    isInvulnerable: false,
    invulnerabilityDuration: 2000, // 2 seconds
    invulnerabilityStartTime: 0,
    
    // Sandstorm system removed
    
    // Initialize game
    init: function() {
        try {
            console.log('🎮 Game.init() called');
            
            // Ensure game-over class is removed from body
            document.body.classList.remove('game-over');
            
            // Get canvas and context
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                console.error('Canvas element not found!');
                return;
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                console.error('Could not get 2D context from canvas!');
                return;
            }
            
            // Set canvas size
            this.resizeCanvas();
            
            // Initialize game objects - make sure to pass the canvas
            if (Player && typeof Player.init === 'function') {
                Player.init(this.canvas);
            } else {
                console.warn('Player module not properly initialized');
            }
            
            if (Obstacles && typeof Obstacles.init === 'function') {
                Obstacles.init(this.canvas);
            } else {
                console.warn('Obstacles module not properly initialized');
            }
            
            if (Background && typeof Background.init === 'function') {
                Background.init(this.canvas);
            } else {
                console.warn('Background module not properly initialized');
            }
            
            // Initialize new Galaga-style systems
            if (typeof Weapons !== 'undefined' && Weapons.init) {
                Weapons.init();
                console.log('Weapons system initialized');
            } else {
                console.warn('Weapons module not available');
            }
            
            if (typeof Asteroids !== 'undefined' && Asteroids.init) {
                Asteroids.init(this.canvas);
                console.log('Asteroids system initialized');
            } else {
                console.warn('Asteroids module not available');
            }
            
            if (typeof UI !== 'undefined' && UI.init) {
                UI.init();
                console.log('UI system initialized');
            } else {
                console.warn('UI module not available');
            }
            
            if (typeof Spaceships !== 'undefined' && Spaceships.init) {
                Spaceships.init(this.canvas);
                console.log('Spaceships system initialized');
            } else {
                console.warn('Spaceships module not available');
            }
            
            if (typeof Bosses !== 'undefined' && Bosses.init) {
                Bosses.init(this.canvas);
                console.log('Boss system initialized');
            } else {
                console.warn('Bosses module not available');
            }
            
            // Create difficulty bar
            this.createDifficultyBar();
            
            // Load high score from local storage
            this.loadHighScore();
            
            // Update player scale and dimensions after initialization
            if (Player && typeof Player.updateScale === 'function') {
                Player.updateScale(this.canvas, this.scaleRatio);
            }
            
            // Add event listeners with a small delay to ensure all modules are loaded
            setTimeout(() => {
                this.setupEventListeners();
            }, 100);
            
            console.log('Game initialized with canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
            console.log('Current game state - isRunning:', this.isRunning, 'gameOver:', this.gameOver);
            
            // Show start screen
            this.showStartScreen();
        } catch (error) {
            console.error('Error during game initialization:', error);
        }
    },
    
    // Sandstorm functions removed
    
    // Draw sandstorm function removed
    
    // Create difficulty bar
    createDifficultyBar: function() {
        // Skip creating external difficulty bar since we're using the in-canvas UI
        return;
    },
    
    // Update difficulty display
    updateDifficultyDisplay: function(score) {
        // Determine current difficulty level
        let newDifficultyIndex = 0;
        for (let i = CONFIG.DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
            if (score >= CONFIG.DIFFICULTY_LEVELS[i].score) {
                newDifficultyIndex = i;
                break;
            }
        }
        
        // Update current difficulty index if it changed
        if (newDifficultyIndex !== this.currentDifficultyIndex) {
            // Show difficulty change notification
            this.showDifficultyChange(CONFIG.DIFFICULTY_LEVELS[newDifficultyIndex].name);
            this.currentDifficultyIndex = newDifficultyIndex;
        }
    },
    
    // Show difficulty change notification
    showDifficultyChange: function(difficultyName) {
        // Create or get the notification element
        let notification = document.getElementById('difficultyNotification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'difficultyNotification';
            
            document.getElementById('gameContainer').appendChild(notification);
        }
        
        // Update notification text and show it
        notification.textContent = `Difficulty: ${difficultyName}`;
        notification.style.display = 'block';
        
        // Clear any existing timer
        if (this.difficultyDisplayTimer) {
            clearTimeout(this.difficultyDisplayTimer);
        }
        
        // Hide after 2 seconds
        this.difficultyDisplayTimer = setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    },
    
    // Resize canvas to fit window
    resizeCanvas: function() {
        const container = document.getElementById('gameContainer');
        
        if (container) {
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Get container dimensions
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Determine if we're on mobile
            const isMobile = window.innerWidth <= 768;
            
            // Calculate canvas dimensions
            let canvasWidth, canvasHeight;
            
            if (isMobile) {
                if (window.innerWidth < window.innerHeight) {
                    // Portrait orientation - swap dimensions for 90° rotation
                    // After rotation: width becomes height, height becomes width
                    canvasWidth = viewportHeight;  // Will become height after rotation
                    canvasHeight = viewportWidth;  // Will become width after rotation
                } else {
                    // Landscape orientation - use height as the constraint
                    canvasHeight = Math.min(containerHeight, viewportHeight) * 0.85;
                    canvasWidth = canvasHeight * 2; // Maintain 2:1 aspect ratio
                    
                    // If calculated width is too wide, adjust
                    if (canvasWidth > viewportWidth * 0.9) {
                        canvasWidth = viewportWidth * 0.9;
                        canvasHeight = canvasWidth / 2;
                    }
                }
            } else {
                // Desktop sizing
                canvasWidth = Math.min(containerWidth * 0.9, CONFIG.CANVAS_WIDTH);
                canvasHeight = canvasWidth / 2; // Maintain 2:1 aspect ratio
                
                // Ensure we don't exceed container height
                if (canvasHeight > containerHeight * 0.8) {
                    canvasHeight = containerHeight * 0.8;
                    canvasWidth = canvasHeight * 2;
                }
            }
            
            // Set canvas dimensions
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            
            // Store dimensions for reference
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            
            // Calculate scale ratio based on base design size
            const baseWidth = CONFIG.CANVAS_WIDTH;
            this.scaleRatio = Math.min(
                this.canvasWidth / baseWidth,
                this.canvasHeight / (baseWidth * 0.5)
            );
            
            // Ensure minimum scale for small screens
            if (this.scaleRatio < 0.3) {
                this.scaleRatio = 0.3;
            }
            
            // Check if we're in portrait mode on mobile
            if (isMobile && window.innerWidth < window.innerHeight) {
                // Portrait mode - remove all inline styles to let CSS handle it completely
                this.canvas.style.maxWidth = '';
                this.canvas.style.maxHeight = '';
                this.canvas.style.marginLeft = '';
                this.canvas.style.marginRight = '';
                this.canvas.style.boxSizing = '';
                this.canvas.style.objectFit = '';
                
                // Debug logging for portrait mode
                console.log('Portrait mode canvas setup:');
                console.log('- Viewport:', viewportWidth, 'x', viewportHeight);
                console.log('- Canvas dimensions set to:', canvasWidth, 'x', canvasHeight);
                console.log('- Canvas actual size:', this.canvas.width, 'x', this.canvas.height);
                console.log('- Canvas style removed for CSS control');
            } else {
                // Desktop and landscape mobile - apply constraints
            this.canvas.style.maxWidth = '100%';
            this.canvas.style.maxHeight = '85vh';
            this.canvas.style.boxSizing = 'border-box';
            this.canvas.style.marginLeft = 'auto';
            this.canvas.style.marginRight = 'auto';
            }
            
            // Adjust game elements for new scale
            this.adjustGameElementsForScale();
            
            console.log('Canvas resized to', this.canvas.width, 'x', this.canvas.height, 'Scale:', this.scaleRatio);
        } else {
            // Fallback to config values
            this.canvas.width = CONFIG.CANVAS_WIDTH;
            this.canvas.height = CONFIG.CANVAS_HEIGHT;
            this.canvasWidth = CONFIG.CANVAS_WIDTH;
            this.canvasHeight = CONFIG.CANVAS_HEIGHT;
            this.scaleRatio = 1;
        }
    },
    
    // Adjust game elements for current scale
    adjustGameElementsForScale: function() {
        // Only update if game objects are initialized
        if (Player && Obstacles && Background) {
            // Update player scale and dimensions
            if (Player && typeof Player.updateScale === 'function') {
                Player.updateScale(this.canvas, this.scaleRatio);
            }
            
            if (this.isRunning) {
                // Update player position
                Player.y = this.canvas.height - CONFIG.GROUND_HEIGHT * this.scaleRatio - 
                    CONFIG.PLAYER_HEIGHT * this.scaleRatio + CONFIG.PLAYER_GROUND_OFFSET * this.scaleRatio;
                
                // Reinitialize obstacles with new scale
                Obstacles.updateScale(this.canvas, this.scaleRatio);
                
                // Update background with new scale
                Background.updateScale(this.canvas, this.scaleRatio);
            }
        }
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        console.log('Setting up event listeners. Player object:', Player);
        console.log('Player.handleTouchInput function:', typeof Player.handleTouchInput);
        
        // Initialize mobile controls
        if (typeof MobileControls !== 'undefined') {
            MobileControls.init();
        }
        // Touch events for mobile - enhanced for new controls
        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            // Start game if not running
            if (!this.isRunning && !this.gameOver) {
                this.start();
                return;
            }
            
            // Skip action if game is over - let game over screen handle restart
            if (this.gameOver) {
                return;
            }
            
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Handle new touch controls for Super Mario-style movement
            if (Player && typeof Player.handleTouchInput === 'function') {
                Player.handleTouchInput(touchX, touchY, this.canvas.width, this.canvas.height);
            } else {
                console.error('Player.handleTouchInput is not available');
            }
        });
        
        this.canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            // Skip action if game is over
            if (this.gameOver) {
                return;
            }
            
            // Stop ducking when touch ends
            if (Player.isDucking) {
                Player.isDucking = false;
            }
        });
        
        // Mouse events for desktop - enhanced for new controls
        this.canvas.addEventListener('mousedown', (event) => {
            // Start game if not running
            if (!this.isRunning && !this.gameOver) {
                this.start();
                return;
            }
            
            // Skip action if game is over - let game over screen handle restart
            if (this.gameOver) {
                return;
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            // Handle mouse input similar to touch
            if (Player && typeof Player.handleTouchInput === 'function') {
                Player.handleTouchInput(mouseX, mouseY, this.canvas.width, this.canvas.height);
            } else {
                console.error('Player.handleTouchInput is not available');
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            // Skip action if game is over
            if (this.gameOver) {
                return;
            }
            
            // Stop ducking when mouse button is released
            if (Player.isDucking) {
                Player.isDucking = false;
            }
        });
        
        // Keyboard events - now handled by Player module directly
        document.addEventListener('keydown', (event) => {
            // Start game if not running
            if (!this.isRunning && !this.gameOver && (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW')) {
                this.start();
                return;
            }
            
            // Skip keyboard actions if game is over - let game over screen handle restart
            if (this.gameOver) {
                return;
            }
            
            // Skip action if game is over
            if (this.gameOver) {
                return;
            }
            
            // Player module handles all keyboard input now
        });
        
        document.addEventListener('keyup', (event) => {
            // Skip action if game is over
            if (this.gameOver) {
                return;
            }
            
            // Player module handles all keyboard input now
        });
        
        // Button event listeners
        document.getElementById('startButton').addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.restart();
        });
        
        // Window resize event
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Orientation change event for mobile
        window.addEventListener('orientationchange', () => {
            // Small delay to allow orientation change to complete
            setTimeout(() => {
                this.resizeCanvas();
            }, 200);
        });
    },
    
    // Start the game
    start: function() {
        if (this.isRunning) return;
        
        console.log('Starting game...');
        
        // Clear any game over block interval
        if (this.gameOverBlockInterval) {
            clearInterval(this.gameOverBlockInterval);
            this.gameOverBlockInterval = null;
        }

        // Hide start screen
        document.getElementById('startScreen').style.display = 'none';
        
        // Reset game state
        this.score = 0;
        this.currentDifficultyIndex = CONFIG.DEFAULT_DIFFICULTY;
        this.gameSpeed = CONFIG.INITIAL_SPEED * CONFIG.DIFFICULTY_LEVELS[this.currentDifficultyIndex].speedMultiplier * this.scaleRatio;
        this.gameOver = false;
        this.isRunning = true;
        
        // Set game start time
        this.gameStartTime = performance.now();
        
        // Reset game objects
        Player.reset(this.canvas);
        Obstacles.reset();
        Background.reset();
        
        // Sandstorm reset removed
        
        // Start game loop
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
        
        // Start music
        Sound.playArcadePlaylist();
        
        // Show mobile controls if on mobile device
        if (typeof MobileControls !== 'undefined') {
            MobileControls.updateVisibility(true);
        }
        
        console.log('Game started with difficulty:', CONFIG.DIFFICULTY_LEVELS[this.currentDifficultyIndex].name);
        
        // Trigger achievement for game start
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameStart', { gameId: 'galaxy_ape' });
        }
    },
    
    // Game loop
    gameLoop: function(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Difficulty system removed - using pure wave-based progression
        
        // Update background
        Background.update(deltaTime, this.gameSpeed, this.canvas);
        Background.draw(this.ctx, this.canvas);
        
                    // Sandstorm update removed
        
        // Legacy obstacles disabled - using wave-based enemy system only
        // Obstacles.update(deltaTime, this.gameSpeed, this.canvas, this.score);
        
        // Update player
        Player.update(deltaTime, this.canvas);
        
        // Update invulnerability
        this.updateInvulnerability(deltaTime);
        
        // Update new Galaga-style systems
        if (typeof Weapons !== 'undefined') {
            Weapons.update(deltaTime, this.canvas);
            
            // Check powerup collision with player
            const powerupCollision = Weapons.checkPowerupCollision(Player);
            if (powerupCollision) {
                console.log(`Player collected powerup: ${powerupCollision.config.name}`);
            }
        }
        
        if (typeof UI !== 'undefined') {
            UI.update(deltaTime);
        }
        
        // Asteroids system removed - focusing on wave-based gameplay
        
        // Update wave-based enemy system
        if (typeof Spaceships !== 'undefined') {
            Spaceships.update(deltaTime, this.gameSpeed, this.canvas, this.score);
            
            // Check projectile collisions with enemies
            const enemyPoints = Spaceships.checkProjectileCollisions();
            if (enemyPoints > 0) {
                const oldScore = this.score;
                this.score += enemyPoints;
                
                // Check for first score achievement
                if (oldScore === 0 && this.score > 0 && window.triggerAchievementEvent) {
                    window.triggerAchievementEvent('firstScore', {});
                }
                
                // Play destruction sound
                if (Sound && Sound.play) {
                    Sound.play('point');
                }
            }
        
            // Check player collision with enemies
            const enemyCollision = Spaceships.checkPlayerCollision(Player);
            if (enemyCollision && !this.isInvulnerable) {
                this.loseLife();
                if (this.lives <= 0) {
                    this.endGame();
                    return;
                }
            }
            
            // Check player collision with enemy bullets
            const bulletHit = Spaceships.checkEnemyBulletCollisions(Player);
            if (bulletHit && !this.isInvulnerable) {
                this.loseLife();
                if (this.lives <= 0) {
                    this.endGame();
                    return;
                }
            }
        }

        // Update boss system (triggered by wave completion)
        if (typeof Bosses !== 'undefined') {
            Bosses.update(deltaTime, this.gameSpeed, this.canvas, this.score);
            
            // Check projectile collisions with boss
            const bossPoints = Bosses.checkProjectileCollisions();
            if (bossPoints > 0) {
                const oldScore = this.score;
                this.score += bossPoints;
                
                // Check for first score achievement
                if (oldScore === 0 && this.score > 0 && window.triggerAchievementEvent) {
                    window.triggerAchievementEvent('firstScore', {});
                }
                
                // Play destruction sound
                if (Sound && Sound.play) {
                    Sound.play('point');
                }
            }
            
            // Check player collision with boss
            const bossCollision = Bosses.checkPlayerCollision(Player);
            if (bossCollision && !this.isInvulnerable) {
                this.loseLife();
                if (this.lives <= 0) {
                    this.endGame();
                    return;
                }
            }
        }
        
        // Legacy collision systems disabled for clean wave-based gameplay
        
        // Legacy obstacles drawing disabled
        // Obstacles.draw(this.ctx, this.canvas);
        
        // Update and draw explosions (keeping for hit effects)
        Obstacles.updateExplosions(deltaTime, this.ctx);
        
        // Draw wave-based enemy system
        if (typeof Spaceships !== 'undefined') {
            Spaceships.draw(this.ctx);
        }
        
        if (typeof Bosses !== 'undefined') {
            Bosses.draw(this.ctx);
        }
        
        if (typeof Weapons !== 'undefined') {
            Weapons.draw(this.ctx);
        }
        
        // Draw player (with invulnerability effect)
        if (this.isInvulnerable) {
            // Blink effect during invulnerability
            const blinkRate = 200; // milliseconds
            const currentTime = Date.now();
            const blinkCycle = Math.floor((currentTime - this.invulnerabilityStartTime) / blinkRate) % 2;
            
            if (blinkCycle === 0) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.5;
                Player.draw(this.ctx, this.canvas);
                this.ctx.restore();
            } else {
                Player.draw(this.ctx, this.canvas);
            }
        } else {
            Player.draw(this.ctx, this.canvas);
        }
        
        // Draw UI notifications
        if (typeof UI !== 'undefined') {
            UI.draw(this.ctx, this.canvas);
        }
        
        // Score is only updated when destroying enemies (handled above)
        // No automatic score increment - pure skill-based scoring
        
        // Update game speed based on elapsed time only
        this.gameSpeed += CONFIG.ACCELERATION * deltaTime * this.scaleRatio;
        if (this.gameSpeed > CONFIG.MAX_SPEED * this.scaleRatio) {
            this.gameSpeed = CONFIG.MAX_SPEED * this.scaleRatio;
        }
        
        // Draw UI elements (score, etc.) - do this last so it appears on top
        this.drawUI();
        
        // Legacy enemy/laser collision checks disabled (handled by wave system)
        
        // Continue game loop if game is still running
        if (!this.gameOver) {
            this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    },
    
    // Draw game objects
    draw: function() {
        Background.draw(this.ctx, this.canvas);
        Obstacles.draw(this.ctx, this.canvas);
        Player.draw(this.ctx, this.canvas);
        
        // Draw UI elements directly on canvas
        this.drawUI();
    },
    
    // Draw UI elements on canvas
    drawUI: function() {
        // Difficulty system removed
        
        // Set text styles for score
        this.ctx.font = `bold ${Math.floor(16 * this.scaleRatio)}px 'Press Start 2P', monospace`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        
        // Draw score with shadow for better visibility
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillText(`SCORE: ${Math.floor(this.score)}`, this.canvas.width - 12, 12);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`SCORE: ${Math.floor(this.score)}`, this.canvas.width - 10, 10);
        
        // Draw game status information - Left side UI
        this.ctx.textAlign = 'left';
        this.ctx.font = `bold ${Math.floor(12 * this.scaleRatio)}px 'Press Start 2P', monospace`;
        
        // Create an enhanced UI panel with modern styling
        if (typeof Spaceships !== 'undefined') {
            const waveStatus = Spaceships.getWaveStatus();
            
            // Enhanced panel dimensions
            const panelWidth = 190;
            const panelHeight = 70;
            const panelX = 10;
            const panelY = 10;
            
            // Create gradient background
            const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
            gradient.addColorStop(0, 'rgba(0, 20, 40, 0.95)');
            gradient.addColorStop(1, 'rgba(0, 10, 25, 0.95)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
            // Add subtle inner glow
            this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(panelX + 1, panelY + 1, panelWidth - 2, panelHeight - 2);
            
            // Main border with glow effect
            this.ctx.shadowColor = '#00aaff';
            this.ctx.shadowBlur = 5;
            this.ctx.strokeStyle = '#00aaff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
            this.ctx.shadowBlur = 0; // Reset shadow
            
            // Wave number section
            this.ctx.font = `bold ${Math.floor(14 * this.scaleRatio)}px 'Press Start 2P', monospace`;
            this.ctx.textAlign = 'left';
        
            // Wave number background
            this.ctx.fillStyle = 'rgba(0, 170, 255, 0.2)';
            this.ctx.fillRect(panelX + 8, panelY + 8, 85, 22);
        
            // Wave text with glow
            this.ctx.shadowColor = '#00aaff';
            this.ctx.shadowBlur = 3;
            this.ctx.fillStyle = '#00aaff';
            this.ctx.fillText(`WAVE ${waveStatus.currentWave}`, panelX + 12, panelY + 24);
            this.ctx.shadowBlur = 0;
            
            // Lives section 
            this.ctx.font = `bold ${Math.floor(12 * this.scaleRatio)}px 'Press Start 2P', monospace`;
            
            // Lives background
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
            this.ctx.fillRect(panelX + 8, panelY + 37, panelWidth - 16, 25);
            
            // Lives label
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('LIVES:', panelX + 12, panelY + 50);
            
            // Hearts display with better spacing
            this.ctx.font = `${Math.floor(16 * this.scaleRatio)}px Arial`; // Use Arial for better heart rendering
            this.ctx.fillStyle = this.lives > 1 ? '#ff6666' : '#ff0000';
            let heartsText = '';
            const maxVisibleHearts = 7;
            
            if (this.lives <= maxVisibleHearts) {
                for (let i = 0; i < this.lives; i++) {
                    heartsText += '❤️';
                }
        } else {
                for (let i = 0; i < 4; i++) {
                    heartsText += '❤️';
                }
                this.ctx.font = `bold ${Math.floor(10 * this.scaleRatio)}px 'Press Start 2P', monospace`;
                heartsText += ` x${this.lives}`;
            }
            
            // Hearts with glow effect
            this.ctx.shadowColor = '#ff6666';
            this.ctx.shadowBlur = 2;
            this.ctx.fillText(heartsText, panelX + 60, panelY + 52);
            this.ctx.shadowBlur = 0;
        }
        
        // Draw boss health bar if boss is present
        if (typeof Bosses !== 'undefined') {
            const bossHealth = Bosses.getBossHealth();
            if (bossHealth) {
                const barWidth = 300 * this.scaleRatio;
                const barHeight = 20 * this.scaleRatio;
                const barX = (this.canvas.width - barWidth) / 2;
                const barY = 20;
                
                // Boss name
                this.ctx.font = `bold ${Math.floor(14 * this.scaleRatio)}px 'Press Start 2P', monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillText(bossHealth.name.toUpperCase(), this.canvas.width / 2 + 2, barY - 8);
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillText(bossHealth.name.toUpperCase(), this.canvas.width / 2, barY - 10);
                
                // Health bar background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Health bar fill (gradient based on health)
                const healthPercentage = bossHealth.percentage;
                let fillColor;
                if (healthPercentage > 0.6) {
                    fillColor = '#ff0000'; // Red when healthy
                } else if (healthPercentage > 0.3) {
                    fillColor = '#ff6600'; // Orange when damaged
                } else {
                    fillColor = '#ffff00'; // Yellow when critical
                }
                
                this.ctx.fillStyle = fillColor;
                this.ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        
                // Health bar border
        this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(barX, barY, barWidth, barHeight);
                
                // Health text
                this.ctx.font = `bold ${Math.floor(10 * this.scaleRatio)}px 'Press Start 2P', monospace`;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(`${bossHealth.current}/${bossHealth.max}`, this.canvas.width / 2, barY + 15);
                
                // Reset text alignment for other UI elements
                this.ctx.textAlign = 'left';
            }
        }
        
        // Difficulty meter removed
        
        // Draw control instructions at bottom of screen - only for the first 10 seconds of gameplay
        if (this.isRunning && !this.gameOver) {
            // Calculate elapsed time since game start
            const currentTime = performance.now();
            const elapsedTime = currentTime - this.gameStartTime;
            
            if (elapsedTime < 10000) { // Show for first 10 seconds
                const isMobile = window.innerWidth <= 768;
                const fontSize = Math.floor(isMobile ? 10 * this.scaleRatio : 12 * this.scaleRatio);
                const fontOpacity = Math.min(1, (10000 - elapsedTime) / 2000); // Fade out in the last 2 seconds
                
                this.ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillStyle = `rgba(255, 255, 255, ${fontOpacity})`;
                
                // Control instructions
                const line1Y = this.canvas.height - 60 * this.scaleRatio;
                const line2Y = this.canvas.height - 40 * this.scaleRatio;
                const line3Y = this.canvas.height - 20 * this.scaleRatio;
                
                this.ctx.fillText('ARROW KEYS/WASD: THRUSTERS', this.canvas.width / 2, line1Y);
                this.ctx.fillText('SPACEBAR: FIRE ROCKETS', this.canvas.width / 2, line2Y);
                this.ctx.fillText('DESTROY ASTEROIDS & SPACESHIPS!', this.canvas.width / 2, line3Y);
            }
        }

    },
    
    // End game
    endGame: function() {
        console.log('🛑 endGame() called - Stack trace:', new Error().stack);
        
        this.isRunning = false;
        this.gameOver = true;
        
        // Check for first death achievement
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('firstDeath', {});
        }
        
        // Hide mobile controls
        if (typeof MobileControls !== 'undefined') {
            MobileControls.updateVisibility(false);
            MobileControls.reset();
        }
        
        // Play hit sound
        Sound.play('hit');
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // Immediately hide any leaderboard modal that might be showing
        const modalElement = document.getElementById('leaderboardModal');
        if (modalElement) {
            modalElement.style.display = 'none';
            modalElement.classList.remove('force-show');
            console.log('Leaderboard modal hidden on game end');
        }
        
        // Clear any user interaction tracking to prevent automatic showing
        if (window.Leaderboard) {
            Leaderboard.lastUserInteraction = null;
        }
        
        // Start a powerful blocker interval to prevent leaderboard from showing during game over
        this.gameOverBlockInterval = setInterval(() => {
            const modal = document.getElementById('leaderboardModal');
            if (modal && modal.style.display !== 'none') {
                console.log('EMERGENCY: Blocking leaderboard during game over');
                modal.style.display = 'none';
                modal.classList.remove('force-show');
            }
        }, 50); // Check every 50ms
        
        // Show game over screen with final score
        document.getElementById('finalScore').textContent = 'SCORE: ' + Math.floor(this.score);
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        // Add game-over class to body for mobile responsive layout
        document.body.classList.add('game-over');
        
        // Always attempt save through shared Glyph pipeline.
        console.log('Saving score to database:', Math.floor(this.score));
        GameScoreUtils.saveGameScore('galaxy_ape', Math.floor(this.score), {
            success: true,
            onComplete: (success, result) => {
                if (success) {
                    console.log('✅ Game score saved successfully');
                } else {
                    console.error('❌ Failed to save game score');
                }
            }
        });
        
        // Trigger achievement for game end (this will work if achievement system is available)
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameEnd', { 
                gameId: 'galaxy_ape', 
                score: Math.floor(this.score),
                success: true 
            });
        }
        
        console.log('Game over. Score:', Math.floor(this.score));
    },
    
    // Reset game state
    reset: function() {
        // Reset game variables
        this.score = 0;
        this.gameSpeed = CONFIG.INITIAL_SPEED * this.scaleRatio;
        this.isRunning = false;
        this.gameOver = false;
        this.lastTime = 0;
        
        // Reset lives system
        this.lives = this.maxLives;
        this.isInvulnerable = false;
        this.invulnerabilityStartTime = 0;
        
        // Remove game-over class from body
        document.body.classList.remove('game-over');
        
        // Reset player
        if (Player && typeof Player.reset === 'function') {
            Player.reset();
        }
        
        // Reset obstacles
        if (Obstacles && typeof Obstacles.reset === 'function') {
            Obstacles.reset();
        }
        
        // Reset background
        if (Background && typeof Background.reset === 'function') {
            Background.reset();
        }
        
        // Reset new Galaga-style systems
        if (typeof Weapons !== 'undefined' && Weapons.reset) {
            Weapons.reset();
        }
        
        if (typeof Asteroids !== 'undefined' && Asteroids.reset) {
            Asteroids.reset();
        }
        
        if (typeof UI !== 'undefined' && UI.reset) {
            UI.reset();
        }
        
        if (typeof Spaceships !== 'undefined' && Spaceships.reset) {
            Spaceships.reset();
        }
        
        if (typeof Bosses !== 'undefined' && Bosses.reset) {
            Bosses.reset();
        }
        
        // Reset current difficulty to initial
        this.currentDifficultyIndex = 0;
        
        console.log('Game reset');
    },
    
    // Restart game
    restart: function() {
        // Reload selected ape from localStorage to pick up any changes
        if (window.Wallet && window.Wallet.loadSelectedApe) {
            window.Wallet.loadSelectedApe();
        }
        
        // Clear any game over block interval
        if (this.gameOverBlockInterval) {
            clearInterval(this.gameOverBlockInterval);
            this.gameOverBlockInterval = null;
        }
        
        // Reset game state first
        this.reset();
        
        // Hide game over screen if it exists
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Remove game-over class from body
        document.body.classList.remove('game-over');
        
        // Start new game
        this.start();
    },
    
    // Show start screen
    showStartScreen: function() {
        console.log('🎮 Showing start screen...');
        console.log('Current game state - isRunning:', this.isRunning, 'gameOver:', this.gameOver);
        console.log('Body classes:', document.body.className);
        
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        
        console.log('Start screen element:', startScreen);
        console.log('Game over screen element:', gameOverScreen);
        
        if (startScreen) {
            console.log('Start screen current display:', startScreen.style.display);
            startScreen.style.display = 'flex';
            console.log('✅ Start screen shown');
        } else {
            console.error('❌ Start screen element not found');
        }
        
        if (gameOverScreen) {
            console.log('Game over screen current display:', gameOverScreen.style.display);
            gameOverScreen.style.display = 'none';
            console.log('✅ Game over screen hidden');
        } else {
            console.error('❌ Game over screen element not found');
        }
        
        // Ensure game state is reset
        this.gameOver = false;
        this.isRunning = false;
        console.log('🎮 Game state reset for start screen');
    },
    
    // Lives system methods
    loseLife: function() {
        this.lives--;
        this.isInvulnerable = true;
        this.invulnerabilityStartTime = Date.now();
        
        // Play hit sound
        if (Sound && Sound.play) {
            Sound.play('bump');
        }
        
        // Show life lost notification
        if (typeof UI !== 'undefined' && UI.showNotification) {
            if (this.lives > 0) {
                UI.showNotification(`💔 LIFE LOST! ${this.lives} REMAINING`, 2000);
            } else {
                UI.showNotification(`💀 NO LIVES LEFT!`, 2000);
            }
        }
        
        console.log(`Life lost! Lives remaining: ${this.lives}`);
    },
    
    // Add life (called when boss is defeated)
    addLife: function() {
        this.lives++;
        
        // Show life gained notification
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(`❤️ EXTRA LIFE! ${this.lives} TOTAL`, 2000);
        }
        
        console.log(`Life gained! Lives total: ${this.lives}`);
    },
    
    updateInvulnerability: function(deltaTime) {
        if (this.isInvulnerable) {
            const currentTime = Date.now();
            if (currentTime - this.invulnerabilityStartTime >= this.invulnerabilityDuration) {
                this.isInvulnerable = false;
                console.log('Invulnerability ended');
            }
        }
    },
    
    // Save high score to local storage
    saveHighScore: function() {
        localStorage.setItem('runApeHighScore', this.highScore);
    },
    
    // Load high score from local storage
    loadHighScore: function() {
        const savedHighScore = localStorage.getItem('runApeHighScore');
        if (savedHighScore) {
            this.highScore = parseFloat(savedHighScore);
        }
    },
    
    // Handle orientation change and window resize
    handleLayoutChange: function() {
        try {
            // Store current dimensions before resize
            const oldWidth = this.canvasWidth || CONFIG.CANVAS_WIDTH;
            const oldHeight = this.canvasHeight || CONFIG.CANVAS_HEIGHT;
            
            // Resize canvas
            this.resizeCanvas();
            
            // Get new dimensions
            const newWidth = this.canvasWidth;
            const newHeight = this.canvasHeight;
            
            // Log the change
            console.log(`Layout changed: ${oldWidth}x${oldHeight} -> ${newWidth}x${newHeight}`);
            
            // Only adjust game elements if game is initialized and canvas exists
            if (this.canvas && this.ctx) {
                // Ensure player position is updated relative to the new canvas size
                if (Player && typeof Player.adjustPositionAfterResize === 'function') {
                    try {
                        Player.adjustPositionAfterResize(oldWidth, oldHeight, newWidth, newHeight);
                    } catch (err) {
                        console.error('Error adjusting player position:', err);
                    }
                }
                
                // Ensure obstacles are scaled and positioned correctly
                if (Obstacles && typeof Obstacles.adjustPositionAfterResize === 'function') {
                    try {
                        Obstacles.adjustPositionAfterResize(oldWidth, oldHeight, newWidth, newHeight);
                    } catch (err) {
                        console.error('Error adjusting obstacles:', err);
                    }
                }
                
                // Ensure background elements are scaled correctly
                if (Background && typeof Background.adjustPositionAfterResize === 'function') {
                    try {
                        Background.adjustPositionAfterResize(oldWidth, oldHeight, newWidth, newHeight);
                    } catch (err) {
                        console.error('Error adjusting background:', err);
                    }
                }
                
                // Force immediate redraw if the game is running
                if (this.isRunning && !this.gameOver) {
                    this.render();
                }
            }
        } catch (error) {
            console.error('Error during layout change:', error);
        }
    },
    
    // Force an immediate render outside the game loop
    render: function() {
        // Clear canvas with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        Background.draw(this.ctx, this.canvas);
        
        // Draw obstacles
        Obstacles.draw(this.ctx, this.canvas);
        
        // Draw player
        Player.draw(this.ctx, this.canvas);
        
        // Draw UI elements on top
        this.drawUI();
    }
};

// Make Game globally accessible for boss system
window.game = Game;

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Game;
} 