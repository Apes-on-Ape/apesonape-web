// Block Dodger - Game Module

const Game = {
    // Game state variables
    score: 0,
    gameOver: false,
    blockInterval: null,
    scoreInterval: null,
    gameInterval: null,
    speedInterval: null,
    blockSpawnRate: 800, // Initial spawn rate
    scoreSpeed: Config.INITIAL_SCORE_SPEED,
    explosionActive: false,
    explosionFrame: 0,
    lastTime: 0,
    lastScoreTime: 0,
    lastBlockSpawnTime: 0,
    gameStartTime: 0,
    animationFrameId: null,
    maxDeltaTime: 100, // Cap for deltaTime to prevent extreme jumps
    currentDifficulty: 0, // Track current difficulty level
    canvasOriginalWidth: 400, // Store original canvas dimensions
    canvasOriginalHeight: 600,
    difficultyDisplayTimer: null, // For showing difficulty change messages
    speedMultiplier: 1.0, // For powerup effects that change game speed
    originalBlockSpawnRate: 800, // Store original spawn rate
    speedEffectTimeout: null, // For tracking speed effect duration
    
    // Handle canvas resize events
    handleCanvasResize: function(oldWidth, oldHeight, newWidth, newHeight) {
        console.log(`Canvas resized: ${oldWidth}x${oldHeight} -> ${newWidth}x${newHeight}`);
        
        // Only proceed if Player and Blocks are defined and have update methods
        if (!Player || !Blocks) {
            console.error('Required game components not available for resize');
            return;
        }
        
        // Store new canvas dimensions
        this.canvasOriginalWidth = newWidth;
        this.canvasOriginalHeight = newHeight;
        
        // Update blocks position if game is active
        if (!this.gameOver && Blocks && Blocks.updateBlockPositions) {
            Blocks.updateBlockPositions(oldWidth, oldHeight, newWidth, newHeight);
        }
        
        // Update player position - do this after updating the dimensions
        if (Player && Player.resetPosition) {
            Player.resetPosition();
        }
        
        // Redraw the scene immediately to prevent flicker
        if (!this.gameOver) {
            // Clear canvas
            if (ctx) ctx.clearRect(0, 0, newWidth, newHeight);
            
            // Draw blocks
            if (Blocks && Blocks.draw) Blocks.draw();
            
            // Draw player
            if (Player && Player.draw) Player.draw();
        }
    },
    
    // Initialize game state and UI
    init: function() {
        console.log('Initializing game state...');
        
        // Enable console protection in production environments
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // In production, enable console protection automatically
            Security.toggleConsoleProtection(true);
        } else {
            // In development, leave console active but log a message
            console.warn('Development mode: Console protection is disabled. Use toggleConsoleProtection() to test.');
        }
        
        // Try to initialize Supabase
        Database.checkSupabaseConfig();
        
        // Initialize sound button text
        if (UI.soundToggleButton) {
            UI.soundToggleButton.textContent = `Sound: ${Sound.isSoundEnabled ? 'ON' : 'OFF'}`;
        }
        
        // Hide profile button until wallet is connected
        if (UI.profileButton) {
            UI.profileButton.style.display = 'none';
        }
        
        // Initialize NFT selection back button
        const backToMenuButton = document.getElementById('backToMenuButton');
        if (backToMenuButton) {
            backToMenuButton.addEventListener('click', function() {
                document.getElementById('nftSelectionScreen').style.display = 'none';
                document.getElementById('menuScreen').style.display = 'flex';
            });
        }
        
        // Create difficulty level display element if it doesn't exist
        if (!document.getElementById('difficultyDisplay')) {
            const difficultyDisplay = document.createElement('div');
            difficultyDisplay.id = 'difficultyDisplay';
            difficultyDisplay.style.position = 'absolute';
            difficultyDisplay.style.top = '50px';
            difficultyDisplay.style.left = '50%';
            difficultyDisplay.style.transform = 'translateX(-50%)';
            difficultyDisplay.style.color = '#ffffff';
            difficultyDisplay.style.fontSize = '20px';
            difficultyDisplay.style.fontWeight = 'bold';
            difficultyDisplay.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
            difficultyDisplay.style.transition = 'opacity 0.5s';
            difficultyDisplay.style.opacity = '0';
            difficultyDisplay.style.zIndex = '1000';
            document.body.appendChild(difficultyDisplay);
        }
        
        // Add additional protection against debug tools
        Security.addAntiDebugListeners();
    },
    
    // Check if the game is currently active (running and not over)
    isGameActive: function() {
        // Game is active if:
        // 1. Game is not over
        // 2. Game screen is visible
        // 3. Game over screen is not visible
        return !this.gameOver && 
               UI.gameScreen && 
               UI.gameScreen.style.display === 'block' && 
               (!document.getElementById('gameOverScreen') || 
                document.getElementById('gameOverScreen').style.display !== 'block');
    },
    
    // Check if the game is over
    isGameOver: function() {
        return this.gameOver;
    },
    
    // Apply a temporary speed multiplier to all blocks (for powerups)
    applyTemporaryBlockSpeed: function(multiplier) {
        // Store original spawn rate if not already stored
        if (this.originalBlockSpawnRate === null) {
            this.originalBlockSpawnRate = this.blockSpawnRate;
        }
        
        // Apply speed multiplier
        this.speedMultiplier = multiplier;
        
        // Adjust block spawn rate inversely (slower speed = more time between spawns)
        this.blockSpawnRate = this.originalBlockSpawnRate / multiplier;
        
        // Clear any existing timeout for speed effect
        if (this.speedEffectTimeout) {
            clearTimeout(this.speedEffectTimeout);
        }
        
        // Set timeout to return to normal speed
        this.speedEffectTimeout = setTimeout(() => {
            this.resetBlockSpeed();
        }, 5000); // Match the duration defined in PowerUps module (5 seconds)
    },
    
    // Reset block speed to normal
    resetBlockSpeed: function() {
        // Reset speed multiplier
        this.speedMultiplier = 1.0;
        
        // Reset block spawn rate
        if (this.originalBlockSpawnRate !== null) {
            this.blockSpawnRate = this.originalBlockSpawnRate;
        }
        
        // Clear timeout reference
        this.speedEffectTimeout = null;
    },
    
    // Get current difficulty level based on score
    getCurrentDifficultyLevel: function() {
        const diffLevels = Config.DIFFICULTY_LEVELS;
        for (let i = diffLevels.length - 1; i >= 0; i--) {
            if (this.score >= diffLevels[i].score) {
                return i;
            }
        }
        return 0; // Default to first level if score is lower than any threshold
    },
    
    // Apply difficulty settings based on current score
    updateDifficulty: function() {
        const newDifficultyIndex = this.getCurrentDifficultyLevel();
        
        // Only update if difficulty changed
        if (newDifficultyIndex !== this.currentDifficulty) {
            const newDifficulty = Config.DIFFICULTY_LEVELS[newDifficultyIndex];
            
            // Show difficulty change notification
            this.showDifficultyChange(newDifficulty.name);
            
            
            // Store new difficulty index
            this.currentDifficulty = newDifficultyIndex;
        }
        
        // Update the UI difficulty display whether it changed or not
        if (UI && UI.updateDifficultyDisplay) {
            UI.updateDifficultyDisplay(this.currentDifficulty, this.score);
        }
    },
    
    // Show difficulty change notification
    showDifficultyChange: function(difficultyName) {
        const difficultyDisplay = document.getElementById('difficultyDisplay');
        if (!difficultyDisplay) return;
        
        // Clear any existing timer
        if (this.difficultyDisplayTimer) {
            clearTimeout(this.difficultyDisplayTimer);
        }
        
        // Set text and make visible
        difficultyDisplay.textContent = `${difficultyName}`;
        difficultyDisplay.style.opacity = '1';
        
        // Hide after 3 seconds
        this.difficultyDisplayTimer = setTimeout(() => {
            difficultyDisplay.style.opacity = '0';
        }, 3000);
    },
    
    // Update canvas size based on difficulty shrinkage
    updateCanvasSize: function(shrinkPercentage) {
        if (!canvas) return;
        
        // Always use the original canvas size regardless of difficulty
        canvas.width = this.canvasOriginalWidth;
        canvas.height = this.canvasOriginalHeight;
    },
    
    // Start the game
    start: async function() {
        console.log('Starting new game');

        // Ensure persisted upgrades/powerups are loaded before gameplay begins.
        if (window.Shop && typeof Shop.ensureWalletStateLoaded === 'function' && Wallet.currentWallet) {
            try {
                await Shop.ensureWalletStateLoaded(Wallet.currentWallet);
            } catch (error) {
                console.warn('Continuing game start despite shop state preload error:', error);
            }
        }
        
        // Reset game state
        this.score = 0;
        this.gameOver = false;
        Blocks.clear();
        this.blockSpawnRate = 800;
        this.originalBlockSpawnRate = 800;
        this.speedMultiplier = 1.0;
        this.scoreSpeed = Config.INITIAL_SCORE_SPEED;
        this.lastTime = performance.now();
        this.lastScoreTime = performance.now();
        this.lastBlockSpawnTime = performance.now();
        this.gameStartTime = Date.now();
        this.currentDifficulty = 0;
        
        // Show game screen first so the game is visibly active
        if (UI.menuScreen) {
            UI.menuScreen.style.display = 'none';
        }
        
        if (UI.gameScreen) {
            // Make sure game screen is fully visible before proceeding
            UI.gameScreen.style.display = 'block';
            UI.gameScreen.style.visibility = 'visible';
            UI.gameScreen.style.opacity = '1';
        } else {
            console.warn('UI.gameScreen element not found, game may not display properly');
        }
        
        // Ensure the game container is fully visible
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
            gameContainer.style.visibility = 'visible';
        }
        
        // Force an immediate canvas resize to match the game screen
        if (UI && UI.resizeCanvas) {
            UI.resizeCanvas();
        }
        
        // Set a small delay to resize again after everything is settled
        setTimeout(() => {
            if (UI && UI.resizeCanvas) {
                UI.resizeCanvas();
            }
            
            // Get canvas dimensions after resize
            if (canvas) {
                this.canvasOriginalWidth = canvas.width;
                this.canvasOriginalHeight = canvas.height;
                console.log(`Game starting with canvas dimensions: ${canvas.width}x${canvas.height}`);
            }
            
            // Reset player position to ensure it's at the bottom of resized canvas
            Player.resetPosition();
        }, 50);
        
        // Clear any existing intervals to start fresh
        if (this.scoreInterval) {
            clearInterval(this.scoreInterval);
            this.scoreInterval = null;
        }
        if (this.speedInterval) {
            clearInterval(this.speedInterval);
            this.speedInterval = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.speedEffectTimeout) {
            clearTimeout(this.speedEffectTimeout);
            this.speedEffectTimeout = null;
        }
        
        // Reset score display
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = 'Score: 0';
        }
        
        // Enable touch controls
        if (UI.leftTouchArea && UI.rightTouchArea) {
            UI.leftTouchArea.style.pointerEvents = 'auto';
            UI.rightTouchArea.style.pointerEvents = 'auto';
        }
        
        // Show mobile controls container
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = 'block';
        }
        
        // First ensure all sounds are stopped
        Sound.stopAllSounds();
        
        // Initialize powerups after game screen is visible
        // This ensures the canvas is ready when PowerUps.init() is called
        if (window.PowerUps) {
            console.log("Game start: Clearing and reinitializing powerups");
            PowerUps.clear();
            PowerUps.init();
        } else {
            console.error("PowerUps module not available during game start!");
        }
        
        // Make sure the game over screen is hidden
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Initialize powerups directly - ensure they appear
        if (window.PowerUps) {
            PowerUps.init();
            UI.showNotification("Powerups enabled!", 3000);
            
            // Spawn just one powerup after a delay to start
            setTimeout(() => {
                if (window.PowerUps && !this.gameOver) {
                    console.log("Spawning initial powerup after game start");
                    PowerUps.spawn();
                }
            }, 2000);
        }
        
        console.log('Initializing game mechanics');
        
        // Start the game loop using requestAnimationFrame
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        
        // Start speed increase interval after 10 seconds, with more stable timing
        setTimeout(() => {
            this.speedInterval = setInterval(() => {
                // Only call if game is active
                if (!this.gameOver) {
                    this.increaseGameSpeed();
                }
            }, 5000); // Increase speed every 5 seconds
        }, 10000);
        
        // Show initial difficulty
        this.showDifficultyChange(Config.DIFFICULTY_LEVELS[0].name);
        
        // Use direct method rather than through playSoundSafely for a more robust start
        if (Sound.isSoundEnabled) {
            Sound.playRandomSoundCloudTrack();
            
            // Failsafe: try playing again after a short delay if no track info is set
            setTimeout(() => {
                if (!Sound.currentTrackName && Sound.isSoundEnabled) {
                    console.log('Failsafe: trying to play music again');
                    Sound.playRandomSoundCloudTrack();
                }
            }, 2000);
        }
        
        // Initialize game integrity checks
        Security.initializeGameIntegrity();
        
        // Apply shop upgrades at game start
        if (window.Shop && Shop.applyUpgrades) {
            console.log('Applying shop upgrades at game start');
            Shop.applyUpgrades();
        }
        
        // Trigger achievement for game start
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameStart', { gameId: 'block_dodger' });
        }
    },
    
    // Main game loop
    gameLoop: function(timestamp) {
        if (this.gameOver) {
            // Extra check to ensure all sounds have been fully stopped
            if (window.activeAudioElements && window.activeAudioElements.length > 0) {
                console.log(`Stopping ${window.activeAudioElements.length} active sounds in gameLoop() due to gameOver`);
                Sound.stopAllSounds();
            }
            
            return;
        }
        
        // Calculate delta time with a cap to prevent extreme jumps
        let deltaTime = timestamp - this.lastTime;
        
        // If the tab was inactive, cap the delta time to prevent huge jumps
        if (deltaTime > this.maxDeltaTime) {
            console.log(`Large delta time detected: ${deltaTime}ms, capping to ${this.maxDeltaTime}ms`);
            deltaTime = this.maxDeltaTime;
        }
        
        this.lastTime = timestamp;
        
        // Update difficulty based on current score
        this.updateDifficulty();
        
        // Get current difficulty settings
        const diffLevel = Config.DIFFICULTY_LEVELS[this.currentDifficulty];
        
        // Adjust block spawn rate based on difficulty
        const adjustedSpawnRate = this.blockSpawnRate / diffLevel.spawnRateMultiplier;
        
        // Check if it's time to spawn a new block
        if (timestamp - this.lastBlockSpawnTime >= adjustedSpawnRate) {
            Blocks.spawn(diffLevel);
            this.lastBlockSpawnTime = timestamp;
        }
        
        // Check if it's time to increment the score
        if (timestamp - this.lastScoreTime >= this.scoreSpeed) {
            this.incrementScore();
            this.lastScoreTime = timestamp;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update player position with delta time
        Player.update(deltaTime);
        
        // Update and draw blocks with delta time
        Blocks.update(deltaTime, diffLevel);
        Blocks.draw();
        
        // Check for collisions
        Blocks.checkCollisions();
        
        // Draw player
        Player.draw();
        
        // Note: The PowerUps module now handles its own animation loop for the
        // DOM-based falling powerups, so we don't need to update them here
        
        // Request next animation frame
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    },
    
    // Increment score
    incrementScore: function() {
        // Only exit when game is explicitly over
        if (this.gameOver) {
            return;
        }

        // Only check if game screen is EXPLICITLY hidden or game over screen is EXPLICITLY shown
        if (UI.gameScreen && UI.gameScreen.style.display === 'none' || 
            (document.getElementById('gameOverScreen') && document.getElementById('gameOverScreen').style.display === 'block')) {
            return;
        }
        
        // We're definitely in active gameplay here, increment the score
        this.score++;
        
        // Check for first score achievement
        if (this.score === 1 && window.triggerAchievementEvent) {
            window.triggerAchievementEvent('firstScore', {});
        }
        
        // Update score display
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.score}`;
        } else {
            console.error('Score element not found when trying to update score display');
        }
        
        // Check if difficulty level has changed
        this.updateDifficulty();
    },
    
    // Increase game speed
    increaseGameSpeed: function() {
        // Don't proceed if the game is over
        if (this.gameOver) {
            console.log('Game is over, not increasing speed');
            return;
        }
        
        // Increase difficulty by decreasing block spawn rate, with a minimum threshold
        if (this.blockSpawnRate > Config.MIN_BLOCK_SPAWN_RATE) {
            this.blockSpawnRate = Math.max(Config.MIN_BLOCK_SPAWN_RATE, this.blockSpawnRate - Config.SPAWN_RATE_DECREMENT);
        }
        
        // Increase scoring speed, with a minimum threshold
        if (this.scoreSpeed > Config.MIN_SCORE_SPEED) {
            this.scoreSpeed = Math.max(Config.MIN_SCORE_SPEED, this.scoreSpeed - Config.SCORE_SPEED_DECREMENT);
        }
    },
    
    // End the game and clean up resources
    endGame: function() {
        if (this.gameOver) return;
        
        console.log('Ending game...');
        
        // Set game over flag
        this.gameOver = true;
        
        // Stop all game intervals and animation frame
        if (this.scoreInterval) clearInterval(this.scoreInterval);
        if (this.speedInterval) clearInterval(this.speedInterval);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        // Clear all powerups
        if (window.PowerUps) {
            PowerUps.clear();
        }
        
        // Stop all sounds
        Sound.stopAllSounds();
    },
    
    // Restart the game after game over
    restart: function() {
        console.log('Restarting game...');
        
        // Reload selected ape from localStorage to pick up any changes
        if (window.Wallet && window.Wallet.loadSelectedApe) {
            window.Wallet.loadSelectedApe();
        }
        
        // Ensure all sounds are properly stopped before restarting
        Sound.stopAllSounds();
        
        // Hide game over screen
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Start a new game
        this.start();
    },
    
    // Return to the main menu
    returnToMenu: function() {
        console.log('Returning to menu...');
        
        // Reload selected ape from localStorage to pick up any changes
        if (window.Wallet && window.Wallet.loadSelectedApe) {
            window.Wallet.loadSelectedApe();
        }
        
        // Ensure all sounds are stopped
        Sound.stopAllSounds();
        
        // Hide game over screen
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Hide game screen and show menu
        if (UI.gameScreen) UI.gameScreen.style.display = 'none';
        if (UI.menuScreen) UI.menuScreen.style.display = 'flex';
        
        // Clear any game intervals
        if (this.scoreInterval) clearInterval(this.scoreInterval);
        if (this.speedInterval) clearInterval(this.speedInterval);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        // Always reset canvas to original size
        if (canvas) {
            canvas.width = this.canvasOriginalWidth;
            canvas.height = this.canvasOriginalHeight;
        }
        
        // Reset game state
        this.gameOver = false;
        this.score = 0;
        this.currentDifficulty = 0;
        Blocks.clear();
    },
    
    // Show explosion animation when player collides with block
    showExplosion: function(x, y) {
        // Implementation will be in the effects.js file
        Effects.showExplosion(x, y);
    },
    
    // Trigger game over
    triggerGameOver: function(collidedBlock) {
        // Set game over flag first to prevent any new sounds in other functions
        this.gameOver = true;
        
        // Check for first death achievement
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('firstDeath', {});
        }
        
        // Play explosion sound using the preloaded sound
        try {
            console.log('Attempting to play explosion sound');
            Sound.playSoundSafely('explosion');
        } catch (e) {
            console.error('Error in collision sound handling:', e);
        }
        
        // Stop all game intervals and animation frame
        if (this.scoreInterval) clearInterval(this.scoreInterval);
        if (this.speedInterval) clearInterval(this.speedInterval);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        // Clear all powerups
        if (window.PowerUps) {
            PowerUps.clear();
        }
        
        // Show explosion at collision point
        this.showExplosion(collidedBlock.x, collidedBlock.y);
        
        // Trigger achievement for game end (this will work if achievement system is available)
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameEnd', { 
                gameId: 'block_dodger', 
                score: this.score,
                success: true 
            });
        }
        
        // Always attempt save through shared Glyph pipeline.
        GameScoreUtils.saveGameScore('block_dodger', this.score, {
            success: true,
            onComplete: (success, result) => {
                if (success) {
                    console.log('✅ Game score saved successfully');
                } else {
                    console.error('❌ Failed to save game score');
                }
                // Show game over UI regardless of save result
                UI.showGameOver(this.score);
            }
        });
        
        // Stop SoundCloud music and other sounds but not the explosion sound
        Sound.stopSoundCloudTrack();
        
        // Stop point sounds
        Sound.stopPointSounds();
    },
    
    // Getters
    getScore: function() {
        return this.score;
    },
    
    // Calculate total time the user has been playing
    calculateGameTime: function() {
        // If we have a game start time, use it
        if (this.gameStartTime) {
            return Date.now() - this.gameStartTime;
        }
        return 0;
    },
    
    // Set up UI elements for the game
    setupUI: function() {
        // Get UI elements
        this.scoreDisplay = document.getElementById('score');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.totalPointsDisplay = document.getElementById('totalPoints');
        this.playAgainButton = document.getElementById('playAgainButton');
        this.mainMenuButton = document.getElementById('mainMenuButton');
        
        // Hide wallet connection info during gameplay
        const connectButton = document.getElementById('connectWalletButton');
        const disconnectButton = document.getElementById('disconnectWalletButton');
        
        if (connectButton) connectButton.style.display = 'none';
        if (disconnectButton) disconnectButton.style.display = 'none';
        
        // Set button event listeners
        this.playAgainButton.addEventListener('click', () => {
            this.restart();
        });
        
        this.mainMenuButton.addEventListener('click', () => {
            this.returnToMainMenu();
        });
        
        // Initialize score
        this.updateScoreDisplay();
    }
}; 