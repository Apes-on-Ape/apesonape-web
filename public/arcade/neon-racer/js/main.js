// Neon Racer - Main Game Module

const MainGame = {
    // Game state
    isRunning: false,
    isPaused: false,
    isInitialized: false,
    frameCount: 0,
    lastFrameTime: 0,
    score: 0,
    distance: 0,
    gameTime: 0,
    remainingTime: 0, // For time trial mode
    bestTimes: [], // Store best times
    
    // Track speed
    trackSpeed: 5.0,
    
    // Input state
    input: {
        left: false,
        right: false,
        boost: false,
        touchStartX: 0,
        touchStartTime: 0,
        lastTapTime: 0
    },
    
    // Game canvas and context
    canvas: null,
    ctx: null,
    
    // Visual effects
    floatingTexts: [],
    
    // Debug mode
    debugMode: false, // Reduced from true for performance
    
    // Initialize game
    init: function() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }
        
        // Create game container if it doesn't exist
        let gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) {
            gameContainer = document.createElement('div');
            gameContainer.id = 'gameContainer';
            gameContainer.style.position = 'absolute';
            gameContainer.style.top = '50%';
            gameContainer.style.left = '50%';
            gameContainer.style.transform = 'translate(-50%, -50%)';
            gameContainer.style.width = '100%';
            gameContainer.style.maxWidth = '400px';
            gameContainer.style.height = '600px';
            gameContainer.style.display = 'flex';
            gameContainer.style.justifyContent = 'center';
            gameContainer.style.alignItems = 'center';
            gameContainer.style.background = '#000';
            gameContainer.style.overflow = 'hidden';
            gameContainer.style.padding = '0';
            gameContainer.style.border = '4px solid #ff00ff';
            gameContainer.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.7), 0 0 40px rgba(255, 0, 255, 0.3), inset 0 0 15px rgba(255, 0, 255, 0.3)';
            gameContainer.style.borderRadius = '10px';
            gameContainer.style.maxHeight = '85dvh';
            gameContainer.style.aspectRatio = '2/3';
            gameContainer.style.boxSizing = 'border-box';
            gameContainer.style.margin = '0';
            gameContainer.style.zIndex = '100';
            document.body.appendChild(gameContainer);
        }
        
        // Create canvas if it doesn't exist
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gameCanvas';
            this.canvas.width = Config.GAME_WIDTH;
            this.canvas.height = Config.GAME_HEIGHT;
            this.canvas.style.display = 'block';
            gameContainer.appendChild(this.canvas);
        }
        
        // Get canvas context
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get canvas context');
            return;
        }
        
        // Set canvas dimensions
        this.canvas.width = Config.GAME_WIDTH;
        this.canvas.height = Config.GAME_HEIGHT;
        
        // Hide score display in time trial mode
        const scoreDisplay = document.getElementById('score');
        if (scoreDisplay) {
            scoreDisplay.style.display = 'block'; // Always show score in endless mode
        }
        
        // Initialize game state
        this.reset();
        
        // Initialize modules
        Player.init();
        Track.init();
        Items.init();
        Obstacles.init();
        Effects.init();
        Decorations.init(); // Initialize decorations
        Environment.init(); // Initialize environment module
        
        // Set up user input
        this.setupInputHandlers();
        
        // Initialize UI components
        if (UI && typeof UI.init === 'function') {
            UI.init();
        }
        
        // Initialize audio
        Sound.init();
        
        // Initialize car selection
        this.initializeCarSelection();
        
        // Set up menu buttons
        this.setupMenuButtons();
    },
    
    // Reset game state
    reset: function() {
        // Reset game variables
        this.score = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        this.floatingTexts = [];
        this.trackSpeed = Config.TRACK_SPEED; // Reset track speed to initial value
        
        // Reset input state
        this.input.left = false;
        this.input.right = false;
        
        // Reset modules
        Track.reset();
        Player.reset();
        Obstacles.init();
        Items.reset();
        Effects.reset();
        Decorations.reset(); // Reset decorations
        
        // Update UI for endless mode
        UI.updateScore(this.score);
    },
    
    // Set up input handlers
    setupInputHandlers: function() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    Player.move('left', 1);
                    break;
                case 'ArrowRight':
                    Player.move('right', 1);
                    break;
                case ' ': // Spacebar for powerup
                    this.activatePowerup();
                    break;
                case 'p': // Pause
                    this.togglePause();
                    break;
                case 'n': // Neon Easter Egg - Press 'N' key
                    if (window.triggerAchievementEvent) {
                        window.triggerAchievementEvent('easterEgg', { game: 'neon_racer', type: 'neon_key' });
                    }
                    break;
            }
        });
        
        // Touch input
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            const touch = e.touches[0];
            this.input.touchStartX = touch.clientX;
            this.input.touchStartTime = Date.now();
            
            // Check for double tap (to activate powerup)
            const currentTime = Date.now();
            if (currentTime - this.input.lastTapTime < 300) {
                this.activatePowerup();
                e.preventDefault();
            }
            this.input.lastTapTime = currentTime;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            const touch = e.touches[0];
            const diffX = touch.clientX - this.input.touchStartX;
            
            // Set direction based on swipe
            if (diffX < -20) {
                Player.move('left', 1);
            } else if (diffX > 20) {
                Player.move('right', 1);
            }
            
            e.preventDefault();
        });
        
        // Game buttons
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.restart();
            });
        }
        
        const powerupButton = document.getElementById('powerupButton');
        if (powerupButton) {
            powerupButton.addEventListener('click', () => {
                this.activatePowerup();
            });
        }
    },
    
    // Start the game
    startGame: function() {
        // Reset game state
        this.score = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        this.floatingTexts = [];
        this.trackSpeed = Config.INITIAL_TRACK_SPEED; // Start with initial speed
        
        // Reset input state
        this.inputState = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Initialize game modules
        Track.init();
        Player.init();
        Obstacles.init();
        Items.init();
        Effects.init();
        Decorations.init();
        
        // Canvas-based difficulty indicator is automatically drawn during the game loop
        
        // Show game screen and hide menu
        const gameScreen = document.getElementById('gameScreen');
        const menuScreen = document.getElementById('menuScreen');
        
        if (gameScreen) {
            gameScreen.style.display = 'flex';
        }
        
        if (menuScreen) {
            menuScreen.style.display = 'none';
        }
        
        // Make sure game container is visible
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
        
        // Force immediate canvas resize to match game screen
        UI.resizeCanvas();
        
        // Force another resize after a short delay to ensure everything is settled
        setTimeout(() => {
            UI.resizeCanvas();
            
            // Enable touch controls for mobile
            if (UI.elements.leftTouchArea && UI.elements.rightTouchArea) {
                UI.elements.leftTouchArea.style.pointerEvents = 'auto';
                UI.elements.rightTouchArea.style.pointerEvents = 'auto';
            }
            
            // Show mobile controls
            if (UI.elements.mobileControls) {
                UI.elements.mobileControls.style.display = 'block';
            }
            
            // Set initial track speed
            Track.setSpeed(Config.INITIAL_TRACK_SPEED);
            
            // Start SoundCloud music if sound is enabled
            if (Sound.isSoundEnabled && Sound.playRandomSoundCloudTrack) {
                Sound.playRandomSoundCloudTrack();
            }
            
            // Start game loop
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }, 100);
    },
    
    // Show game tutorial
    showTutorial: function() {
        // Check if tutorial has been shown before
        if (localStorage.getItem('tutorialShown')) {
            return;
        }
        
        // Set tutorials as shown
        localStorage.setItem('tutorialShown', 'true');
        
        // Queue tutorial messages with increasing delays
        setTimeout(() => {
            UI.showNotification('Welcome to Neon Racer!', 2500);
        }, 500);
        
        setTimeout(() => {
            UI.showNotification('Use LEFT and RIGHT arrows to change lanes', 3000);
        }, 3500);
        
        setTimeout(() => {
            UI.showNotification('Collect coins for points', 3000);
        }, 7000);
        
        setTimeout(() => {
            UI.showNotification('Avoid obstacles to stay alive', 3000);
        }, 10500);
        
        setTimeout(() => {
            UI.showNotification('Activate powerups with SPACE', 3000);
        }, 14000);
    },
    
    // Preload all assets before starting the game
    preloadAssets: function(callback) {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Determine which car to preload
        const savedCar = sessionStorage.getItem('selectedCar') || 'BlackOut';
        
        // Create image object
        const carImg = new Image();
        carImg.src = `assets/cars/${savedCar}.png`;
        
        // Set onload handler for when image loads
        carImg.onload = () => {
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Call callback when done
            if (callback) callback();
        };
        
        // Set error handler
        carImg.onerror = () => {
            // Try loading default car
            const defaultImg = new Image();
            defaultImg.src = 'assets/cars/BlackOut.png';
            
            defaultImg.onload = () => {
                // Hide loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                // Save the default car for this browser session only
                sessionStorage.setItem('selectedCar', 'BlackOut');
                
                // Call callback when done
                if (callback) callback();
            };
            
            defaultImg.onerror = () => {
                // Hide loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                // Call callback when done
                if (callback) callback();
            };
        };
    },
    
    // Game loop
    gameLoop: function(timestamp) {
        if (!this.isRunning || this.isPaused) return;
        
        // Calculate delta time
        const delta = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        this.frameCount++;
        
        // Normalize delta to prevent large jumps
        const normalizedDelta = Math.min(delta, 32);
        
        // Update game state
        this.update(normalizedDelta);
        
        // Use the new draw function that includes canvas-based difficulty indicator
        this.draw();
        
        // Update UI
        UI.updateGameUI(this.score, this.distance);
        
        // Continue game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    },
    
    // Update game state
    update: function(delta) {
        // Calculate normalized delta (for consistent movement regardless of framerate)
        const normalizedDelta = delta / (1000 / 60); // Normalize to 60 FPS
        
        // Update game time
        this.gameTime += delta;
        
        // Get distance from track
        this.distance = Track.getDistance();
        
        // Update progress for endless runner
        this.updateDifficulty();
        
        // Set track speed
        Track.setSpeed(this.trackSpeed);
        
        // Update player movement based on input
        if (this.input.left) {
            Player.move('left', normalizedDelta);
        } else if (this.input.right) {
            Player.move('right', normalizedDelta);
        }
        
        // Update modules
        Track.update(normalizedDelta);
        Player.update(normalizedDelta);
        
        // Use the current difficulty for item and obstacle frequency
        const currentDifficulty = this.getCurrentDifficulty();
        
        // Update and spawn items
        Items.update(normalizedDelta, Track.getSpeed());
        Items.spawnItems(normalizedDelta, Track.getSpeed(), currentDifficulty);
        
        // Update obstacles
        Obstacles.update(normalizedDelta, Track.getSpeed(), currentDifficulty);
        
        Effects.update(normalizedDelta);
        Decorations.update(normalizedDelta, Track.getSpeed()); // Update decorations
        
        // Update floating texts
        this.updateFloatingTexts();
        
        // Check for item collisions
        const itemResult = Items.checkCollision(Player);
        if (itemResult.value > 0) {
            // Increase score
            this.score += itemResult.value;
    
            UI.updateScore(this.score);
            
            // Add floating text for each item
            for (const item of itemResult.items) {
                this.addFloatingText(`+${item.value}`, item.x, item.y - 20, item.color);
            }
        }
        
        // Check for collisions with obstacles
        this.handleObstacleCollisions();
        
        // Apply magnet effect if active
        if (Player.magnetRadius > 0 && typeof Items.applyMagnet === 'function') {
            Items.applyMagnet(1.0);
        }
        
        // Update speed
        this.trackSpeed = Math.min(
            Config.MAX_TRACK_SPEED,
            Config.INITIAL_TRACK_SPEED + (this.score / Config.TRACK_SPEED_INCREASE_THRESHOLD)
        );
    },
    
    // Draw game
    draw: function() {
        // Safety check for canvas and context
        if (!this.canvas || !this.ctx) {
            console.error('Cannot draw: canvas or context is null');
            return;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw modules
        Track.draw(this.ctx);
        Decorations.draw(this.ctx); // Draw decorations before items
        Items.draw(this.ctx);
        Player.draw(this.ctx);
        Effects.draw(this.ctx);
        
        // Draw floating texts
        this.drawFloatingTexts();
        
        // Draw difficulty indicator directly on canvas (more reliable than DOM)
        this.drawDifficultyIndicator();
        
        // Draw debug info if enabled
        if (Config.DEBUG_MODE) {
            this.drawDebugInfo();
        }
    },
    
    // Draw difficulty indicator directly on canvas
    drawDifficultyIndicator: function() {
        if (!this.isRunning) return;
        
        const currentDifficulty = this.getCurrentDifficulty();
        if (!currentDifficulty) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        // Position in top-left corner of the game canvas
        const x = 10; // Left margin
        const y = 10; // Top margin
        
        const width = 130;
        const height = 50;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#ff00ff'; // Purple border
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff'; // Purple glow
        
        // Rounded rectangle (using compatible method)
        ctx.beginPath();
        // Check if roundRect is supported (newer browsers)
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, 5);
        } else {
            // Fallback for older browsers that don't support roundRect
            ctx.moveTo(x + 5, y);
            ctx.lineTo(x + width - 5, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + 5);
            ctx.lineTo(x + width, y + height - 5);
            ctx.quadraticCurveTo(x + width, y + height, x + width - 5, y + height);
            ctx.lineTo(x + 5, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - 5);
            ctx.lineTo(x, y + 5);
            ctx.quadraticCurveTo(x, y, x + 5, y);
        }
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow for text
        ctx.shadowBlur = 0;
        
        // Draw difficulty name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(currentDifficulty.name, x + 10, y + 15);
        
        // Draw level
        ctx.fillStyle = '#ff00ff'; // Purple text for level
        ctx.font = '10px Orbitron, sans-serif';
        ctx.fillText('Level ' + currentDifficulty.level, x + 10, y + 30);
        
        // Draw progress bar background
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(x + 10, y + 35, width - 20, 4);
        
        // Draw progress
        const nextDifficulty = this.getNextDifficulty();
        if (nextDifficulty) {
            const progress = (this.score - currentDifficulty.score) / (nextDifficulty.score - currentDifficulty.score);
            ctx.fillStyle = '#cc00ff'; // Purple progress bar
            ctx.fillRect(x + 10, y + 35, (width - 20) * Math.min(progress, 1), 4);
            
            // Draw next level text
            ctx.fillStyle = '#cccccc';
            ctx.font = '8px Orbitron, sans-serif';
            ctx.fillText('Next: ' + nextDifficulty.score + ' pts', x + 10, y + 45);
        } else {
            // Max level
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x + 10, y + 35, width - 20, 4);
            
            // Draw max level text
            ctx.fillStyle = '#cccccc';
            ctx.font = '8px Orbitron, sans-serif';
            ctx.fillText('MAX LEVEL!', x + 10, y + 45);
        }
        
        ctx.restore();
    },
    
    // Update floating texts
    updateFloatingTexts: function() {
        const currentTime = Date.now();
        
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            const elapsed = currentTime - text.createdAt;
            
            if (elapsed >= text.lifetimeMs) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            
            // Move text upward
            text.y -= 1;
            
            // Update alpha
            text.alpha = 1.0 - (elapsed / text.lifetimeMs);
        }
    },
    
    // Draw floating texts
    drawFloatingTexts: function() {
        this.ctx.save();
        
        for (const text of this.floatingTexts) {
            this.ctx.font = `${text.size}px Arial`;
            this.ctx.fillStyle = text.color;
            this.ctx.globalAlpha = text.alpha;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(text.text, text.x, text.y);
        }
        
        this.ctx.restore();
    },
    
    // These functions have been replaced by the canvas-based difficulty indicator
    // and are kept as stubs for compatibility with any code that might still call them
    updateDifficultyIndicator: function() {
        // This function is now a no-op as we're using canvas-based drawing
        return;
    },
    
    createDifficultyIndicator: function() {
        // This function is now a no-op as we're using canvas-based drawing
        return null;
    },
    
    // Draw debug info
    drawDebugInfo: function() {
        this.ctx.save();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        const currentDifficulty = this.getCurrentDifficulty();
        const debugInfo = [
            `FPS: ${Math.round(1000 / (performance.now() - this.lastFrameTime))}`,
            `Speed: ${Track.getSpeed().toFixed(2)}`,
            `Score: ${this.score}`,
            `Distance: ${Math.round(this.distance)}m`,
            `Difficulty: ${currentDifficulty ? currentDifficulty.name + ' (' + currentDifficulty.level + ')' : 'Unknown'}`,
            `Player Lane: ${Player.currentLane}`,
            `Obstacles: ${Obstacles.getObstacles().length}`,
            `Items: ${Items.getItems().length}`,
            `Particles: ${Effects.particles.length}`
        ];
        
        for (let i = 0; i < debugInfo.length; i++) {
            this.ctx.fillText(debugInfo[i], 10, 10 + i * 20);
        }
        
        this.ctx.restore();
    },
    
    // End game
    endGame: function(success = false) {
        if (!this.isRunning) return;
        
        // Game over
        
        // Stop game
        this.isRunning = false;
        
        // Stop SoundCloud music
        if (Sound.stopSoundCloudTrack) {
            Sound.stopSoundCloudTrack();
        }
        
        // Always attempt save through shared Glyph pipeline.
        GameScoreUtils.saveGameScore('neon_racer', this.score, {
            success: success,
            onComplete: (saveSuccess, result) => {
                if (saveSuccess) {
                    console.log('✅ Game score saved successfully');
                } else {
                    console.error('❌ Failed to save game score');
                    // Fallback to in-memory/session score list
                    this.saveHighScore(this.score);
                }
                // Show game over screen
                UI.showGameOver(this.score);
            }
        });
        
        // Trigger achievement for game end (this will work if achievement system is available)
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameEnd', { 
                gameId: 'neon_racer', 
                score: this.score,
                success: success 
            });
        }
    },
    
    // Save high score for endless mode (session-only fallback)
    saveHighScore: function(score) {
        console.log('Saving high score in session:', score);
        
        // Load existing high scores
        let highScores = JSON.parse(sessionStorage.getItem('neonRacerHighScores') || '[]');
        
        // Add new score
        highScores.push({
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort by score (descending)
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        if (highScores.length > 10) {
            highScores = highScores.slice(0, 10);
        }
        
        // Save back to sessionStorage
        sessionStorage.setItem('neonRacerHighScores', JSON.stringify(highScores));
        
        // Update instance variable
        this.highScores = highScores;
    },
    
    // Restart game
    restart: function() {
        this.startGame();
    },
    
    // Toggle pause
    togglePause: function() {
        this.isPaused = !this.isPaused;
    },
    
    // Activate powerup
    activatePowerup: function() {
        if (!this.isRunning || this.isPaused) return;
        
        // Check if player has invincibility powerup
        if (Shop && Shop.hasUpgrade('INVINCIBILITY') && !UI.isInCooldown('shield')) {
            // Activate shield
            if (Player.activateShield()) {
                // Start cooldown
                UI.startCooldown('shield', Config.UPGRADES.INVINCIBILITY.cooldown);
                
                // Record activation time
                Shop.lastUsedPowerupTime = Date.now();
                Shop.powerupCooldown = Config.UPGRADES.INVINCIBILITY.cooldown;
            }
        }
    },
    
    // Handle obstacle collisions
    handleObstacleCollisions: function() {
        // Check for collisions with obstacles
        const obstacleCollisions = Obstacles.checkCollision(Player);
        
        if (obstacleCollisions.length > 0) {
            // Check if player has a shield
            if (Player.isShielded) {
                // Invincibility should last for the configured duration, not a single hit.
                // Consume all collisions that happened this frame while shielded.
                Sound.playSoundSafely('crash');
                Effects.createExplosion(Player.x, Player.y, '#00ffff');
                this.addFloatingText('INVINCIBLE!', Player.x, Player.y - 20, '#00ffff');
                obstacleCollisions.forEach((obstacle) => {
                    Obstacles.removeObstacle(obstacle);
                });
            } else {
                // Game over on obstacle hit (Subway Surfers style)
        
                Sound.playSoundSafely('crash');
                
                // Create explosion effect
                Effects.createExplosion(Player.x, Player.y, '#ff0000');
                
                // End the game
                this.endGame();
            }
        }
    },
    
    // Update difficulty based on score
    updateDifficulty: function() {
        // Get current difficulty data
        const currentDifficulty = this.getCurrentDifficulty();
        
        // Update track speed based on difficulty level
        this.trackSpeed = Config.TRACK_SPEED * currentDifficulty.speedMultiplier;
        
        // Cap at max speed
        if (this.trackSpeed > Config.MAX_TRACK_SPEED) {
            this.trackSpeed = Config.MAX_TRACK_SPEED;
        }
        
        // Also apply a small time-based increase for continuous progression
        const timeBasedIncrease = Math.min(2, this.gameTime / 120000); // Max +2 increase after 2 minutes
        this.trackSpeed += timeBasedIncrease;
        
        // Final cap at max speed
        if (this.trackSpeed > Config.MAX_TRACK_SPEED) {
            this.trackSpeed = Config.MAX_TRACK_SPEED;
        }
    },
    
    // Get current difficulty level based on score
    getCurrentDifficulty: function() {
        // Find the highest difficulty level that matches the current score
        let difficulty = Config.DIFFICULTY_LEVELS[0]; // Default to first level
        
        for (let i = Config.DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
            if (this.score >= Config.DIFFICULTY_LEVELS[i].score) {
                difficulty = Config.DIFFICULTY_LEVELS[i];
                break;
            }
        }
        
        return difficulty;
    },
    
    // Get next difficulty level
    getNextDifficulty: function() {
        const currentDifficulty = this.getCurrentDifficulty();
        
        // Find the next difficulty level
        for (let i = 0; i < Config.DIFFICULTY_LEVELS.length; i++) {
            if (Config.DIFFICULTY_LEVELS[i].level > currentDifficulty.level) {
                return Config.DIFFICULTY_LEVELS[i];
            }
        }
        
        return null; // Max level reached
    },
    
    // Add floating text
    addFloatingText: function(text, x, y, color = '#ffffff', size = 16) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            alpha: 1.0,
            size: size,
            color: color,
            createdAt: Date.now(),
            lifetimeMs: 1500
        });
    },

    initializeCarSelection: function() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeCarSelection());
            return;
        }

        // Get game container
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) {
            console.error('Game container not found. Creating one...');
            // Create game container if it doesn't exist
            const newGameContainer = document.createElement('div');
            newGameContainer.id = 'gameContainer';
            newGameContainer.style.position = 'absolute';
            newGameContainer.style.top = '50%';
            newGameContainer.style.left = '50%';
            newGameContainer.style.transform = 'translate(-50%, -50%)';
            newGameContainer.style.width = '100%';
            newGameContainer.style.maxWidth = '400px';
            newGameContainer.style.height = '600px';
            newGameContainer.style.display = 'flex';
            newGameContainer.style.justifyContent = 'center';
            newGameContainer.style.alignItems = 'center';
            newGameContainer.style.background = '#000';
            newGameContainer.style.overflow = 'hidden';
            newGameContainer.style.padding = '0';
            newGameContainer.style.border = '4px solid #ff00ff';
            newGameContainer.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.7), 0 0 40px rgba(255, 0, 255, 0.3), inset 0 0 15px rgba(255, 0, 255, 0.3)';
            newGameContainer.style.borderRadius = '10px';
            newGameContainer.style.maxHeight = '85dvh';
            newGameContainer.style.aspectRatio = '2/3';
            newGameContainer.style.boxSizing = 'border-box';
            newGameContainer.style.margin = '0';
            newGameContainer.style.zIndex = '100';
            
            // Add to body
            document.body.appendChild(newGameContainer);
            this.gameContainer = newGameContainer;
        } else {
            this.gameContainer = gameContainer;
        }

        // Create car selection UI
        const carSelection = document.createElement('div');
        carSelection.id = 'car-selection';
        carSelection.className = 'game-screen';
        
        const cars = [
            { id: 'default', name: 'Default', color: '#ff0000' },
            { id: 'sports', name: 'Sports', color: '#00ff00' },
            { id: 'luxury', name: 'Luxury', color: '#0000ff' }
        ];
        
        cars.forEach(car => {
            const carElement = document.createElement('div');
            carElement.className = 'car-option';
            carElement.innerHTML = `
                <div class="car-preview" style="background-color: ${car.color}"></div>
                <div class="car-name">${car.name}</div>
                <button class="select-car" data-car="${car.id}">Select</button>
            `;
            carSelection.appendChild(carElement);
        });
        
        // Add event listeners for car selection
        carSelection.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-car')) {
                const carId = e.target.dataset.car;
                this.selectCar(carId);
            }
        });
        
        // Add to game container
        this.gameContainer.appendChild(carSelection);
    },

    selectCar: function(carId) {
        // Update player car
        if (Player && typeof Player.setCar === 'function') {
            Player.setCar(carId);
        }
        
        // Hide car selection screen
        const carSelection = document.getElementById('car-selection');
        if (carSelection) {
            carSelection.style.display = 'none';
        }
        
        // Show game screen
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.display = 'block';
        }
    },

    setupMenuButtons: function() {
        // Initialize button listeners
        const playButton = document.getElementById('playButton');
        const soundToggleButton = document.getElementById('soundToggleButton');
        const leaderboardButton = document.getElementById('leaderboardButton');
        const shopButton = document.getElementById('shopButton');
        
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        // Shop button
        if (shopButton) {
            shopButton.addEventListener('click', () => {
                if (Shop && typeof Shop.show === 'function') {
                    Shop.show();
                }
            });
        }
        
        // Leaderboard button
        if (leaderboardButton) {
            leaderboardButton.addEventListener('click', () => {
                if (Leaderboard && typeof Leaderboard.show === 'function') {
                    Leaderboard.show();
                }
            });
        }
        
        // Sound toggle button
        if (soundToggleButton) {
            soundToggleButton.addEventListener('click', () => {
                // Toggle sound using the Sound module's toggle function
                const wasEnabled = Sound.toggleSound();
                
                // Update button text
                soundToggleButton.textContent = wasEnabled ? 'Sound: ON' : 'Sound: OFF';
                
                // Show notification
                UI.showNotification(wasEnabled ? 'Sound enabled' : 'Sound disabled', 2000);
                
                // If enabling sound and in menu, start SoundCloud music
                if (wasEnabled && !this.isRunning) {
                    setTimeout(() => {
                        if (Sound.playRandomSoundCloudTrack) {
                            Sound.playRandomSoundCloudTrack();
                        }
                    }, 500);
                }
            });
        }
    }
};

// Initialize car selection
function initializeCarSelection() {
    console.log('Initializing car selection');
    
    // Add click handlers to car options
    const carOptions = document.querySelectorAll('.car-option');
    carOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const carType = option.dataset.car;
            
            // Update selection in UI
            carOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Update car preview
            const carPreviewImg = document.getElementById('carPreviewImg');
            if (carPreviewImg) {
                carPreviewImg.src = `assets/cars/${carType}.png`;
            }
            
            // Update stats
            const speedStat = document.querySelector('.speed-stat');
            const handlingStat = document.querySelector('.handling-stat');
            const styleStat = document.querySelector('.style-stat');
            const selectedCarName = document.getElementById('selectedCarName');
            
            if (speedStat && option.dataset.speed) {
                speedStat.style.width = `${option.dataset.speed}%`;
            }
            
            if (handlingStat && option.dataset.handling) {
                handlingStat.style.width = `${option.dataset.handling}%`;
            }
            
            if (styleStat && option.dataset.style) {
                styleStat.style.width = `${option.dataset.style}%`;
            }
            
            if (selectedCarName) {
                // Get friendly car name
                let carName = "Car";
                switch(carType) {
                    case 'BlackOut': carName = 'Stealth Racer'; break;
                    case 'BlueStrip': carName = 'Blue Lightning'; break;
                    case 'RedStrip': carName = 'Fire Streak'; break;
                    case 'PinkStrip': carName = 'Neon Pulse'; break;
                    case 'GreenStrip': carName = 'Emerald Streak'; break;
                    case 'WhiteStrip': carName = 'Ghost Rider'; break;
                }
                selectedCarName.textContent = carName;
            }
            
            // Save selection only for this tab session
            sessionStorage.setItem('selectedCar', carType);
            
            // Set in Player module if available
            if (Player && typeof Player.setCarType === 'function') {
                Player.setCarType(carType);
            }
            
            // Show notification
            UI.showNotification(`Selected ${carType} car!`, 2000);
        });
    });
    
    // Add event handler for car selection modal close button
    const closeButton = document.querySelector('#carSelectionModal .close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            const carSelectionModal = document.getElementById('carSelectionModal');
            if (carSelectionModal) {
                carSelectionModal.style.display = 'none';
            }
        });
    }
    
    // Load saved car selection
    const savedCar = sessionStorage.getItem('selectedCar');
    if (savedCar) {
        const savedCarOption = document.querySelector(`.car-option[data-car="${savedCar}"]`);
        if (savedCarOption) {
            // Trigger click to select this car
            savedCarOption.click();
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing game');
    
    // Check if wallet is connected from arcade
    if (typeof Wallet !== 'undefined') {
        Wallet.checkExistingWalletConnection();
    }
    
    // Initialize main game first
    MainGame.init();
    
    // Initialize other components
    if (typeof UI !== 'undefined') {
        UI.initializeUIElements();
    }
    
    if (typeof Sound !== 'undefined') {
        Sound.init();
    }
    
    if (typeof Track !== 'undefined') {
        Track.init();
    }
    
    if (typeof Shop !== 'undefined') {
        Shop.init();
    }
    
    // Initialize car selection
    if (typeof initializeCarSelection === 'function') {
        initializeCarSelection();
    }
    
    // Set up menu buttons
    MainGame.setupMenuButtons();
    
    // Add resize event listener to handle window resizing
    window.addEventListener('resize', function() {
        if (UI && typeof UI.resizeCanvas === 'function') {
            UI.resizeCanvas();
        }
    });
    
    function finishNeonArcadeLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        var av = document.getElementById('neonMenuProfileAvatar');
        if (av && (typeof window.getArcadePlayableAvatarUrl === 'function' || typeof window.getArcadeProfilePortraitUrl === 'function')) {
            var u = typeof window.getArcadePlayableAvatarUrl === 'function'
                ? window.getArcadePlayableAvatarUrl()
                : window.getArcadeProfilePortraitUrl();
            if (u) {
                av.src = u;
                av.style.display = 'block';
            }
        }
        if (window.ArcadeLoading && typeof window.ArcadeLoading.gameReady === 'function') {
            window.ArcadeLoading.gameReady();
        }
    }

    var _p = typeof window.whenArcadeProfileAvatarReady === 'function' ? window.whenArcadeProfileAvatarReady() : Promise.resolve();
    _p.then(function () {
        setTimeout(finishNeonArcadeLoading, 200);
    });
});

// Handle visibility change (pause game when tab is not active)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && MainGame.isRunning && !MainGame.isPaused) {
        MainGame.togglePause();
    }
});

// Performance monitoring
const PerformanceMonitor = {
    fps: 0,
    frameCount: 0,
    lastTime: 0,
    frameTimes: [],
    maxFrameTimes: 60,
    
    update: function(timestamp) {
        this.frameCount++;
        
        if (this.lastTime) {
            const frameTime = timestamp - this.lastTime;
            this.frameTimes.push(frameTime);
            
            if (this.frameTimes.length > this.maxFrameTimes) {
                this.frameTimes.shift();
            }
            
            // Calculate average FPS
            const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            this.fps = Math.round(1000 / avgFrameTime);
            
            // Log performance issues
            if (this.fps < 30 && this.frameCount % 60 === 0) {
                console.warn('Low FPS detected:', this.fps, 'fps');
            }
        }
        
        this.lastTime = timestamp;
    },
    
    getFPS: function() {
        return this.fps;
    },
    
    getAverageFrameTime: function() {
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }
};

// Mobile optimization helper
const MobileOptimizer = {
    isMobile: false,
    optimizationLevel: 'high',
    
    init: function() {
        this.detectMobile();
        this.setOptimizationLevel();
        this.applyOptimizations();
        
        console.log('Mobile optimizer initialized:', {
            isMobile: this.isMobile,
            optimizationLevel: this.optimizationLevel
        });
    },
    
    detectMobile: function() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        
        if (window.innerWidth <= 768 || window.innerHeight <= 768) {
            this.isMobile = true;
        }
        
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.isMobile = true;
        }
    },
    
    setOptimizationLevel: function() {
        if (this.isMobile) {
            const memory = navigator.deviceMemory || 4;
            const cores = navigator.hardwareConcurrency || 4;
            
            if (memory < 4 || cores < 4) {
                this.optimizationLevel = 'high';
            } else {
                this.optimizationLevel = 'medium';
            }
        } else {
            this.optimizationLevel = 'low';
        }
    },
    
    applyOptimizations: function() {
        if (!this.isMobile) return;
        
        // Reduce CSS animations
        if (this.optimizationLevel === 'high') {
            this.disableAnimations();
        }
        
        // Optimize canvas rendering
        this.optimizeCanvas();
        
        // Reduce memory usage
        this.optimizeMemory();
    },
    
    disableAnimations: function() {
        // Add CSS to disable animations
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                *, *::before, *::after {
                    animation-duration: 0.1s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0.1s !important;
                    transition-delay: 0s !important;
                }
                
                #score, #coins {
                    animation: none !important;
                }
                
                button:hover {
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    optimizeCanvas: function() {
        // Optimize canvas for mobile
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            // Reduce canvas size on mobile
            if (this.optimizationLevel === 'high') {
                canvas.style.width = '100%';
                canvas.style.height = '100%';
            }
            
            // Optimize canvas context
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for better performance
            }
        }
    },
    
    optimizeMemory: function() {
        // Reduce memory usage on mobile
        if (this.optimizationLevel === 'high') {
            // Clear unused variables periodically
            setInterval(() => {
                if (typeof Effects !== 'undefined' && Effects.particles) {
                    // Limit particle count
                    if (Effects.particles.length > 50) {
                        Effects.particles.splice(50);
                    }
                }
            }, 5000);
        }
    }
};

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Neon Racer - Mobile Optimized Version Loading...');
    
    // Initialize mobile optimizer
    MobileOptimizer.init();
    
    // Initialize performance monitor
    let lastPerformanceUpdate = 0;
    function updatePerformance(timestamp) {
        PerformanceMonitor.update(timestamp);
        
        // Log performance every 5 seconds
        if (timestamp - lastPerformanceUpdate > 5000) {
            console.log('Performance:', {
                fps: PerformanceMonitor.getFPS(),
                avgFrameTime: PerformanceMonitor.getAverageFrameTime().toFixed(2) + 'ms',
                isMobile: MobileOptimizer.isMobile,
                optimizationLevel: MobileOptimizer.optimizationLevel
            });
            lastPerformanceUpdate = timestamp;
        }
        
        requestAnimationFrame(updatePerformance);
    }
    requestAnimationFrame(updatePerformance);
    
    // Initialize game components
    if (typeof Config !== 'undefined') {
        Config.init();
    }
    
    if (typeof Game !== 'undefined') {
        Game.init();
    }
    
    // Initialize other components
    if (typeof UI !== 'undefined') {
        UI.init();
    }
    
    if (typeof Sound !== 'undefined') {
        Sound.init();
    }
    
    if (typeof Wallet !== 'undefined') {
        Wallet.init();
    }
    
    if (typeof Shop !== 'undefined') {
        Shop.init();
    }
    
    if (typeof Leaderboard !== 'undefined') {
        Leaderboard.init();
    }
    
    // Show loading screen
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        
        // Hide loading screen after a short delay
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            
            // Show menu
            const menuScreen = document.getElementById('menuScreen');
            if (menuScreen) {
                menuScreen.style.display = 'flex';
            }
        }, 1000);
    }
    
    console.log('Neon Racer - Mobile Optimized Version Loaded Successfully');
    
    // Add performance monitoring to window for debugging
    window.PerformanceMonitor = PerformanceMonitor;
    window.MobileOptimizer = MobileOptimizer;
});

// Handle window resize for mobile optimization
window.addEventListener('resize', function() {
    // Re-detect mobile on resize
    MobileOptimizer.detectMobile();
    MobileOptimizer.setOptimizationLevel();
    
    // Update game container size
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        if (MobileOptimizer.isMobile) {
            gameContainer.style.maxWidth = '100vw';
            gameContainer.style.maxHeight = '100dvh';
        } else {
            gameContainer.style.maxWidth = '400px';
            gameContainer.style.maxHeight = '600px';
        }
    }
});

// Handle visibility change for mobile optimization
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause game when tab is not visible
        if (typeof Game !== 'undefined' && Game.isRunning && !Game.isPaused) {
            Game.togglePause();
        }
    }
});

// Handle touch events for mobile optimization
if ('ontouchstart' in window) {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Prevent zoom on pinch
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });
    
    document.addEventListener('gesturechange', function(event) {
        event.preventDefault();
    });
    
    document.addEventListener('gestureend', function(event) {
        event.preventDefault();
    });
} 