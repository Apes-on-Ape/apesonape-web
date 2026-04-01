// Galaxy Ape - Main Entry Point

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Galaxy Ape initializing
    
    // Initialize modules
    try {
        // Initialize wallet connection
        Wallet.init();
        
        // Initialize leaderboard module
        Leaderboard.init();
        
        // Initialize game
        Game.init();
        
        // Listen for window resize events
        window.addEventListener('resize', debounceResize);
        
        // Listen for orientation change on mobile devices
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Note: Button event listeners are now handled in game.js to avoid conflicts
        
        // Handle arcade-style countdown
        const countdownElement = document.querySelector('.countdown');
        if (countdownElement) {
            let countdownValue = 10;
            
            // Update countdown when game over screen is shown
            const gameOverScreen = document.getElementById('gameOverScreen');
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'style' && 
                        gameOverScreen.style.display === 'flex') {
                        startCountdown();
                    }
                });
            });
            
            observer.observe(gameOverScreen, { attributes: true });
            
            function startCountdown() {
                // Reset countdown
                countdownValue = 10;
                countdownElement.textContent = countdownValue;
                
                // Start countdown
                const countdownInterval = setInterval(function() {
                    countdownValue--;
                    countdownElement.textContent = countdownValue;
                    
                    if (countdownValue <= 0) {
                        clearInterval(countdownInterval);
                        // Auto-restart game when countdown reaches zero
                        Game.restart();
                        gameOverScreen.style.display = 'none';
                    }
                }, 1000);
                
                // Note: Button clicks are handled in game.js - just clear interval here
                const clearOnClick = () => clearInterval(countdownInterval);
                const playAgainBtn = document.getElementById('playAgainButton');
                if (playAgainBtn) playAgainBtn.addEventListener('click', clearOnClick);
                const returnBtn = document.getElementById('returnToArcadeButton');
                if (returnBtn) returnBtn.addEventListener('click', clearOnClick);
            }
        }
        
        // Add arcade-style letter animations
        const titleLetters = document.querySelectorAll('.title-letter');
        titleLetters.forEach((letter, index) => {
            letter.style.animationDelay = `${index * 0.1}s`;
            
            // Add hover effect
            letter.addEventListener('mouseover', function() {
                this.style.transform = 'scale(1.2) translateY(-10px)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            letter.addEventListener('mouseout', function() {
                this.style.transform = '';
            });
        });
        
        // Add coin insert sound effect
        const insertCoin = document.querySelector('.insert-coin');
        if (insertCoin) {
            insertCoin.addEventListener('click', function() {
                // Play coin sound if Sound module exists
                if (typeof Sound !== 'undefined' && Sound.play) {
                    Sound.play('coin');
                }
                
                // Visual feedback
                this.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);
                
                // Start game after coin insert with delay
                setTimeout(() => {
                    if (Game && typeof Game.start === 'function') {
                        Game.start();
                    }
                }, 800);
            });
        }
        
        // Note: Start screen click handling is managed by game.js
        
        // Initialize asset loader
        AssetLoader.init();
        
        // Preload assets before starting
        preloadAssets();
        
        // Note: Touch handling is now managed in game.js for enhanced controls
        
        // Game initialized and ready
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});

// Preload game assets (after site profile avatar is in localStorage when applicable)
function preloadAssets() {
    function notifyArcadeReady() {
        if (window.ArcadeLoading && typeof window.ArcadeLoading.gameReady === 'function') {
            window.ArcadeLoading.gameReady();
        }
    }

    function runPreload() {
        const imageAssets = [
            'assets/images/placeholder.png',
        ];

        let loadedCount = 0;
        const totalAssets = imageAssets.length;

        if (totalAssets === 0) {
            notifyArcadeReady();
            if (typeof Sound !== 'undefined' && Sound.preloadAudio) Sound.preloadAudio();
            return;
        }

        const onAssetDone = function () {
            loadedCount++;
            if (loadedCount === totalAssets) {
                console.log('All assets loaded');
                notifyArcadeReady();
            }
        };

        imageAssets.forEach(src => {
            const img = new Image();
            img.onload = onAssetDone;
            img.onerror = onAssetDone;
            img.src = src;
        });

        if (typeof Sound !== 'undefined' && Sound.preloadAudio) {
            Sound.preloadAudio();
        }
    }

    var _p = typeof window.whenArcadeProfileAvatarReady === 'function' ? window.whenArcadeProfileAvatarReady() : Promise.resolve();
    _p.then(function () {
        runPreload();
    });
}

// Debounce function to prevent multiple resize events
function debounceResize() {
    try {
        // Clear any existing timeout
        if (window.resizeTimer) {
            clearTimeout(window.resizeTimer);
        }
        
        // Set a timeout to call handleLayoutChange after resize events stop
        window.resizeTimer = setTimeout(function() {
            try {
                console.log('Window resized, updating canvas');
                if (Game && typeof Game.handleLayoutChange === 'function') {
                    Game.handleLayoutChange();
                } else {
                    console.warn('Game object or handleLayoutChange method not available');
                }
            } catch (error) {
                console.error('Error during resize handling:', error);
            }
        }, 250); // 250ms delay
    } catch (e) {
        console.error('Error in debounceResize:', e);
    }
}

// Handle orientation change specifically (needed for mobile)
function handleOrientationChange() {
    try {
        console.log('Orientation changed');
        
        // Slight delay to allow browser to complete orientation change
        setTimeout(function() {
            try {
                if (Game && typeof Game.handleLayoutChange === 'function') {
                    Game.handleLayoutChange();
                } else {
                    console.warn('Game object or handleLayoutChange method not available');
                }
            } catch (error) {
                console.error('Error during orientation change handling:', error);
            }
        }, 300);
    } catch (e) {
        console.error('Error in handleOrientationChange:', e);
    }
}

// Listen for visibility change to pause/resume game
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        // Pause game when tab is not visible
        if (Game.isRunning && !Game.gameOver) {
            // Implement pause functionality if needed
            console.log('Game auto-paused due to tab becoming hidden');
        }
    } else {
        // Resume or handle tab becoming visible again
        console.log('Tab visible again');
    }
});

// Prevent scrolling on touch devices when playing
document.body.addEventListener('touchmove', function(e) {
    if (Game.isRunning) {
        e.preventDefault();
    }
}, { passive: false });

// Log to console a startup message
console.log('Galaxy Ape - Space Edition - Game Initialized'); 