// Neon Racer - Main Game Controller (Mobile Optimized)

// Game state
const Game = {
    // Game state
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    startTime: 0,
    currentTime: 0,
    elapsedTime: 0,
    frameCount: 0,
    
    // Mobile performance optimization
    isMobile: false,
    mobileOptimizationLevel: 'high',
    frameSkipCounter: 0,
    targetFPS: 60,
    frameTime: 1000 / 60,
    lastFrameTime: 0,
    
    // Initialize the game
    init: function() {
        console.log('Initializing game...');
        
        // Initialize mobile detection
        this.detectMobile();
        this.setOptimizationLevel();
        
        // Initialize game components
        Player.init();
        Track.init();
        Obstacles.init();
        Items.init();
        Shop.init();
        UI.init();
        Effects.init();
        Sound.init();
        
        // Add event listeners
        this.setupEventListeners();
        
        console.log('Game initialization complete with mobile optimization:', {
            isMobile: this.isMobile,
            optimizationLevel: this.mobileOptimizationLevel,
            targetFPS: this.targetFPS
        });
    },
    
    // Detect mobile device
    detectMobile: function() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        
        // Additional mobile detection
        if (window.innerWidth <= 768 || window.innerHeight <= 768) {
            this.isMobile = true;
        }
        
        // Check for touch support
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.isMobile = true;
        }
    },
    
    // Set optimization level based on device performance
    setOptimizationLevel: function() {
        if (this.isMobile) {
            // Check for low-end devices
            const memory = navigator.deviceMemory || 4;
            const cores = navigator.hardwareConcurrency || 4;
            
            if (memory < 4 || cores < 4) {
                this.mobileOptimizationLevel = 'high';
                this.targetFPS = 30; // Lower FPS for low-end devices
            } else {
                this.mobileOptimizationLevel = 'medium';
                this.targetFPS = 45; // Medium FPS for mid-range devices
            }
        } else {
            this.mobileOptimizationLevel = 'low';
            this.targetFPS = 60; // Full FPS for desktop
        }
        
        this.frameTime = 1000 / this.targetFPS;
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        // Key press event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Game buttons
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', this.startGame.bind(this));
        }
        
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', this.restartGame.bind(this));
        }
        
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.addEventListener('click', this.togglePause.bind(this));
        }
    },
    
    // Handle key press events
    handleKeyDown: function(event) {
        if (!this.isRunning || this.isPaused) return;
        
        Player.handleKeyDown(event);
        
        // Pause on Escape key
        if (event.key === 'Escape') {
            this.togglePause();
        }
    },
    
    // Handle key release events
    handleKeyUp: function(event) {
        if (!this.isRunning || this.isPaused) return;
        
        Player.handleKeyUp(event);
    },
    
    // Handle touch start events for mobile
    handleTouchStart: function(event) {
        if (!this.isRunning || this.isPaused) return;
        
        Player.handleTouchStart(event);
    },
    
    // Handle touch end events for mobile
    handleTouchEnd: function(event) {
        if (!this.isRunning || this.isPaused) return;
        
        Player.handleTouchEnd(event);
    },
    
    // Start the game
    startGame: function() {
        console.log('Starting game');
        
        // Reset game state
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.frameCount = 0;
        this.frameSkipCounter = 0;
        this.lastFrameTime = 0;
        
        // Reset game components
        Player.reset();
        Track.reset();
        Obstacles.reset();
        Items.reset();
        
        // Apply saved upgrades
        Shop.applyAllUpgrades();
        
        // Start game time
        this.startTime = Date.now();
        this.currentTime = this.startTime;
        this.elapsedTime = 0;
        
        // Start game loop
        this.isRunning = true;
        requestAnimationFrame(this.gameLoop.bind(this));
        
        // Show UI
        UI.showGameUI();
        UI.hideMenuUI();
        
        // Trigger achievement for game start
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameStart', { gameId: 'neon_racer' });
        }
    },
    
    // Restart the game
    restartGame: function() {
        // Reload selected ape from localStorage to pick up any changes
        if (window.Wallet && window.Wallet.loadSelectedApe) {
            window.Wallet.loadSelectedApe();
        }
        
        if (this.isRunning) {
            this.endGame();
        }
        
        this.startGame();
    },
    
    // Toggle pause state
    togglePause: function() {
        if (!this.isRunning || this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            console.log('Game paused');
            UI.showPauseUI();
        } else {
            console.log('Game resumed');
            UI.hidePauseUI();
            
            // Resume game loop
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    },
    
    // End the game
    endGame: function() {
        console.log('Game over');
        
        this.isRunning = false;
        this.isGameOver = true;
        
        // Check for first death achievement
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('firstDeath', {});
        }
        
        // Stop all game intervals and animation frame
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        // Stop all sounds
        if (typeof Sound !== 'undefined') {
            Sound.stopAllSounds();
        }
        
        // Same pipeline as `main.js` endGame: API `/api/achievements/save_game_stats` → `game_scores` → triggers → `user_profiles`
        if (typeof GameScoreUtils !== 'undefined' && GameScoreUtils.saveGameScore) {
            console.log('Final score:', this.score);
            GameScoreUtils.saveGameScore('neon_racer', this.score, {
                success: true,
                onComplete: function (ok) {
                    if (ok) console.log('Score saved via GameScoreUtils');
                },
            });
        } else {
            console.error('No score save path (GameScoreUtils unavailable)');
        }
        
        // Trigger achievement for game end
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameEnd', { 
                gameId: 'neon_racer', 
                score: this.score,
                success: true 
            });
        }
        
        // Show game over UI
        UI.showGameOverUI(this.score);
    },
    
    // Main game loop (mobile optimized)
    gameLoop: function(timestamp) {
        if (!this.isRunning || this.isPaused) return;
        
        // Frame rate limiting for mobile
        if (this.isMobile) {
            const deltaTime = timestamp - this.lastFrameTime;
            if (deltaTime < this.frameTime) {
                // Skip frame if too soon
                requestAnimationFrame(this.gameLoop.bind(this));
                return;
            }
            this.lastFrameTime = timestamp;
        }
        
        // Calculate time delta
        this.currentTime = Date.now();
        this.elapsedTime = this.currentTime - this.startTime;
        const delta = (timestamp - this.lastTimestamp) || 0;
        this.lastTimestamp = timestamp;
        this.frameCount++;
        this.frameSkipCounter++;
        
        // Update game state with frame skipping for mobile
        if (!this.isMobile || this.frameSkipCounter % 1 === 0) {
            this.update(delta);
        }
        
        // Always render (but with mobile optimizations)
        this.render();
        
        // Continue game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    },
    
    // Update game state (mobile optimized)
    update: function(delta) {
        // Update game components with mobile optimizations
        Track.update(delta);
        Player.update(delta);
        
        // Skip some updates on mobile for better performance
        if (!this.isMobile || this.frameSkipCounter % 2 === 0) {
            Obstacles.update(delta, Track.getSpeed());
        }
        
        if (!this.isMobile || this.frameSkipCounter % 3 === 0) {
            Items.update(delta, Track.getSpeed());
        }
        
        // Update effects less frequently on mobile
        if (!this.isMobile || this.frameSkipCounter % 2 === 0) {
            Effects.update(delta);
        }
        
        // Check for collisions
        if (Obstacles.checkCollision(Player)) {
            this.endGame();
            return;
        }
        
        // Check for item collection
        Items.checkCollision(Player);
        
        // Update UI
        UI.updateScore(this.score);
    },
    
    // Render game (mobile optimized)
    render: function() {
        const ctx = UI.getContext();
        
        // Clear canvas
        ctx.clearRect(0, 0, Config.GAME_WIDTH, Config.GAME_HEIGHT);
        
        // Draw game elements with mobile optimizations
        Track.render(ctx);
        
        // Skip some rendering on mobile for better performance
        if (!this.isMobile || this.frameSkipCounter % 2 === 0) {
            Items.render(ctx);
        }
        
        Obstacles.render(ctx);
        Player.render(ctx);
        
        // Render effects less frequently on mobile
        if (!this.isMobile || this.frameSkipCounter % 2 === 0) {
            Effects.render(ctx);
        }
        
        // Draw UI
        UI.render();
    }
};

// Export the Game object for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
} 