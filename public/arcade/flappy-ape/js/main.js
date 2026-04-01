// Flappy Ape - Main Module
const Main = {
    game: null,
    leaderboard: null,
    wallet: null,
    database: null,
    lastTime: 0,
    debug: CONFIG.DEBUG, // Use CONFIG value
    gameStarted: false,
    
    // Initialize all modules
    async initialize() {
        try {
            // Initialize sound system
            try {
                Sound.init();
            } catch (error) {
                console.error('Error initializing sound, continuing without it:', error);
            }
            
            // No direct DB bootstrap required here; score/profile APIs are shared via web app.
            
            // Initialize wallet with error handling
            try {
                this.wallet = Wallet;
                await this.wallet.initialize();
            } catch (error) {
                console.error('Error initializing wallet, continuing without it:', error);
            }
            
            // Initialize leaderboard (stub/no-op in merged app)
            if (typeof Leaderboard !== 'undefined') {
                this.leaderboard = Leaderboard;
            } else {
                console.warn('Leaderboard module not available');
                this.leaderboard = null;
            }
            
            // Initialize game (the most important part)
            this.game = Game;
            await this.game.initialize();
            
            // Create the play button instead of starting immediately
            this.createPlayButton();
            
            // Ensure menu bar buttons are enabled on initialization
            this.enableMenuBar();
            
            // Add event listeners
            this.addEventListeners();
            
    
        } catch (error) {
            console.error('Critical error initializing Flappy Ape:', error);
            // Try to start the game anyway with basic functionality
            this.emergencyGameStart();
        }
    },
    
    // Create play button to start the game
    createPlayButton() {
        // Check if the play button already exists
        if (document.getElementById('playButton')) {
            return;
        }
        
        // Ensure menu bar buttons are enabled
        const controlButtons = document.querySelectorAll('.control-button');
        controlButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
        });
        
        // Ensure the game controls are visible and clickable
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.style.pointerEvents = 'auto';
            gameControls.style.opacity = '1';
        }
        
        // Create play button overlay (positioned over canvas only)
        const playOverlay = document.createElement('div');
        playOverlay.id = 'playOverlay';
        playOverlay.className = 'flappy-play-overlay';
        playOverlay.style.position = 'absolute';
        playOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        playOverlay.style.display = 'flex';
        playOverlay.style.alignItems = 'center';
        playOverlay.style.justifyContent = 'center';
        playOverlay.style.zIndex = '100';
        playOverlay.style.borderRadius = '4px';
        
        // Create play button
        const playButton = document.createElement('button');
        playButton.id = 'playButton';
        playButton.className = 'arcade-button';
        playButton.textContent = 'Play Game';
        playButton.style.fontSize = '24px';
        playButton.style.padding = '20px 40px';
        
        // Add click event to play button
        playButton.addEventListener('click', async () => {
            try {
                await this.startGame();
            } catch (error) {
                console.error('❌ [Flappy Ape] Error in play button click:', error);
            }
        });
        
        // Add play button to overlay
        playOverlay.appendChild(playButton);
        
        // Add overlay to game container
        document.querySelector('.game-container').appendChild(playOverlay);
    },
    
    // Start the game
    async startGame() {
        // Hide play button
        const playOverlay = document.getElementById('playOverlay');
        if (playOverlay) {
            playOverlay.style.display = 'none';
        }
        
        // Start game
        this.gameStarted = true;
        
        // Initialize SoundCloud and start playing music
        this.initializeGameMusic();
        
        // Tell the game to start
        if (this.game) {
            try {
                await this.game.startGame();
            } catch (error) {
                console.error('❌ [Flappy Ape] Error starting game:', error);
            }
        }
        
        // Start game loop for UI updates
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    },
    
    // Initialize game music
    initializeGameMusic() {
        console.log('Initializing game music...');
        
        // Ensure Sound module is available
        if (typeof Sound !== 'undefined' && Sound) {
            // Initialize SoundCloud if not already done
            if (!Sound.scWidget) {
                console.log('SoundCloud not ready, initializing...');
                Sound.init();
            }
            
            // Start playing music with multiple attempts
            const startMusic = () => {
                if (Sound.scWidget && Sound.isSoundEnabled) {
                    console.log('Starting SoundCloud music...');
                    Sound.playRandomSoundCloudTrack();
                } else {
                    console.log('SoundCloud not ready yet, retrying in 1 second...');
                    setTimeout(startMusic, 1000);
                }
            };
            
            // Try to start music immediately
            startMusic();
            
            // Also try again after a longer delay as backup
            setTimeout(() => {
                if (Sound.scWidget && Sound.isSoundEnabled) {
                    console.log('Backup attempt to start SoundCloud music...');
                    Sound.playRandomSoundCloudTrack();
                }
            }, 3000);
        } else {
            console.log('Sound module not available');
        }
    },
    
    // Enable menu bar buttons
    enableMenuBar() {
        const controlButtons = document.querySelectorAll('.control-button');
        controlButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
        });
        
        // Ensure the game controls are visible and clickable
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.style.pointerEvents = 'auto';
            gameControls.style.opacity = '1';
        }
    },
    
    // Emergency game start if initialization fails
    emergencyGameStart() {
        console.log('Attempting emergency game start...');
        try {
            // Create game object if it doesn't exist
            if (!this.game) {
                this.game = Game;
                this.game.initialize().catch(e => console.error('Emergency game init failed:', e));
            }
            
            // Add basic event listeners
            document.addEventListener('keydown', (event) => {
                if (event.code === 'Space' || event.key === 'ArrowUp') {
                    if (!this.gameStarted) {
                        // Start game if not started
                        this.startGame();
                    } else if (this.game && typeof this.game.jump === 'function') {
                        this.game.jump();
                    }
                }
            });
            
            // Create play button
            this.createPlayButton();
            
            // Ensure menu bar is enabled
            this.enableMenuBar();
            
            console.log('Emergency game start completed');
        } catch (error) {
            console.error('Emergency game start failed:', error);
            // Display error message to user
            const errorMsg = document.createElement('div');
            errorMsg.style.position = 'absolute';
            errorMsg.style.top = '50%';
            errorMsg.style.left = '50%';
            errorMsg.style.transform = 'translate(-50%, -50%)';
            errorMsg.style.color = 'red';
            errorMsg.style.fontFamily = '"Press Start 2P", cursive';
            errorMsg.style.textAlign = 'center';
            errorMsg.innerHTML = 'Game failed to start.<br>Please try refreshing the page.';
            document.body.appendChild(errorMsg);
        }
    },
    
    // Add event listeners for UI interactions
    addEventListeners() {
        // Pause button
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                if (this.game.isPaused) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
            });
            
            // Add alternative click handler for right-click
            pauseButton.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Prevent context menu
                // Toggle sound
                if (typeof Sound !== 'undefined' && Sound) {
                    const isEnabled = Sound.toggleSound();
                    console.log(`Sound ${isEnabled ? 'enabled' : 'disabled'}`);
                }
            });
        }
        
        // Leaderboard button
        const leaderboardButton = document.getElementById('leaderboardButton');
        if (leaderboardButton && this.leaderboard) {
            leaderboardButton.addEventListener('click', () => {
                console.log('Leaderboard button clicked');
                if (this.leaderboard && typeof this.leaderboard.show === 'function') {
                    this.leaderboard.show();
                } else {
                    console.error('Leaderboard show method not available');
                }
            });
        } else {
            console.warn('Leaderboard button or leaderboard module not available:', {
                button: !!leaderboardButton,
                leaderboard: !!this.leaderboard
            });
        }
        
        // Sound toggle button
        const soundButton = document.getElementById('soundButton');
        if (soundButton) {
            soundButton.addEventListener('click', () => {
                if (typeof Sound !== 'undefined' && Sound) {
                    const isEnabled = Sound.toggleSound();
                    // Update the icon based on sound state
                    soundButton.innerHTML = `<i class="fas fa-volume-${isEnabled ? 'up' : 'mute'}"></i>`;
                }
            });
        }
        
        // Game over screen buttons
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.game.restart();
                document.getElementById('gameOverScreen').style.display = 'none';
            });
        }
        
        const menuReturnButton = document.getElementById('menuReturnButton');
        if (menuReturnButton) {
            menuReturnButton.addEventListener('click', () => {
                // Hide game over screen
                document.getElementById('gameOverScreen').style.display = 'none';
                
                // Reset game state but don't start yet
                this.game.resetGame();
                this.game.drawStatic();
                
                // Re-enable menu bar buttons by ensuring they're not disabled
                const controlButtons = document.querySelectorAll('.control-button');
                controlButtons.forEach(button => {
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.pointerEvents = 'auto';
                    button.style.cursor = 'pointer';
                });
                
                // Ensure the game controls are visible and clickable
                const gameControls = document.querySelector('.game-controls');
                if (gameControls) {
                    gameControls.style.pointerEvents = 'auto';
                    gameControls.style.opacity = '1';
                }
                
                // Re-create the play button overlay
                this.createPlayButton();
            });
        }
        
        // Pause menu buttons
        const resumeButton = document.getElementById('resumeButton');
        if (resumeButton) {
            resumeButton.addEventListener('click', () => {
                this.game.resume();
            });
        }
        
        const restartPauseButton = document.getElementById('restartPauseButton');
        if (restartPauseButton) {
            restartPauseButton.addEventListener('click', () => {
                this.game.restart();
                document.getElementById('pauseMenu').style.display = 'none';
            });
        }
        
        const menuPauseButton = document.getElementById('menuPauseButton');
        if (menuPauseButton) {
            menuPauseButton.addEventListener('click', () => {
                // Hide pause menu
                document.getElementById('pauseMenu').style.display = 'none';
                this.game.isPaused = false;
                
                // Reset game state
                this.game.resetGame();
                this.game.drawStatic();
                
                // Re-enable menu bar buttons by ensuring they're not disabled
                const controlButtons = document.querySelectorAll('.control-button');
                controlButtons.forEach(button => {
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.pointerEvents = 'auto';
                    button.style.cursor = 'pointer';
                });
                
                // Ensure the game controls are visible and clickable
                const gameControls = document.querySelector('.game-controls');
                if (gameControls) {
                    gameControls.style.pointerEvents = 'auto';
                    gameControls.style.opacity = '1';
                }
                
                // Re-create the play button overlay
                this.createPlayButton();
            });
        }
        
        // Close buttons for modals
        document.querySelectorAll('.close-button').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (this.debug) console.log('Key pressed:', event.code);
            
            if (event.code === 'Space' || event.key === 'ArrowUp') {
                if (!this.gameStarted) {
                    // Start game if not started
                    this.startGame();
                } else if (!this.game.isPaused && !this.game.isGameOver) {
                    this.game.jump();
                }
                event.preventDefault(); // Prevent space from scrolling the page
            } else if (event.code === 'Escape') {
                if (this.game.isPaused) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
            }
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameStarted && !this.game.isPaused && !this.game.isGameOver) {
                this.game.pause();
            }
        });
        
        // Mobile touch controls
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.addEventListener('touchstart', (event) => {
                if (this.debug) console.log('Touch detected');
                
                if (!this.gameStarted) {
                    // Start game if not started
                    this.startGame();
                } else if (!this.game.isPaused && !this.game.isGameOver) {
                    this.game.jump();
                    event.preventDefault(); // Prevent default behavior
                }
            });
        }
        
        // Debug controls
        if (this.debug) {
            document.addEventListener('keydown', (event) => {
                if (event.code === 'KeyD' && event.ctrlKey) {
                    // Toggle debug mode
                    this.game.debug = !this.game.debug;
                    console.log('Debug mode:', this.game.debug ? 'enabled' : 'disabled');
                } else if (event.code === 'KeyR' && event.ctrlKey) {
                    // Force restart
                    this.game.restart();
                    document.getElementById('gameOverScreen').style.display = 'none';
                    console.log('Game force restarted');
                }
            });
        }
    },
    
    // Update UI elements
    updateUI() {
        try {
            const scoreElement = document.getElementById('score');
            const highScoreElement = document.getElementById('highScore');
            
            if (scoreElement) {
                scoreElement.textContent = this.game.score;
            }
            
            if (highScoreElement) {
                highScoreElement.textContent = this.game.highScore;
            }
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    },
    
    // Game loop
    gameLoop(timestamp) {
        if (!this.gameStarted) return;
        
        try {
            // Calculate delta time (in seconds)
            if (!timestamp) timestamp = performance.now();
            const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap at 0.1 seconds (10 FPS minimum)
            this.lastTime = timestamp;
            
            if (this.debug && deltaTime > 0.05) console.log('Frame time:', Math.round(deltaTime * 1000), 'ms');
            
            // Update UI
            this.updateUI();
            
            // Schedule next frame
            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('Error in game loop:', error);
            // Try to continue the game loop despite errors
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
};

// Initialize the game when the window loads
window.addEventListener('load', () => {
    Main.initialize().catch(error => {
        console.error('Failed to initialize game:', error);
        Main.emergencyGameStart();
    });
}); 