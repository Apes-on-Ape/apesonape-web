// Neon Racer - UI Module

const UI = {
    // Track UI element references
    elements: {
        menuScreen: null,
        gameOverScreen: null,
        shopModal: null,
        scoreDisplay: null,
        finalScoreDisplay: null,
        loadingOverlay: null,
        loadingText: null,
        notification: null,
        difficultyBar: null,
        difficultyDisplay: null,
        nextLevelDisplay: null,
        gameScreen: null,
        highScore: null,
        playButton: null,
        shopButton: null,
        leftTouchArea: null,
        rightTouchArea: null,
        mobileControls: null,
        leaderboardButton: null,
        leaderboardModal: null
    },
    
    // Track active cooldowns
    activeCooldowns: {},
    cooldownTimers: {},
    
    // Initialize UI elements
    initializeUIElements: function() {

        
        // Get references to UI elements
        this.elements.menuScreen = document.getElementById('menuScreen');
        this.elements.gameOverScreen = document.getElementById('gameOverScreen');
        this.elements.shopModal = document.getElementById('shopModal');
        this.elements.scoreDisplay = document.getElementById('score');
        this.elements.finalScoreDisplay = document.getElementById('finalScore');
        this.elements.loadingOverlay = document.getElementById('loadingOverlay');
        this.elements.loadingText = document.getElementById('loadingText');
        this.elements.notification = document.getElementById('notification');
        this.elements.leaderboardButton = document.getElementById('leaderboardButton');
        this.elements.leaderboardModal = document.getElementById('leaderboardModal');
        
        // Create necessary UI elements based on game mode
        this.createGameModeUI();
        
        // Add event listeners for game over screen buttons
        const restartButton = document.getElementById('restartButton');
        const mainMenuButton = document.getElementById('mainMenuButton');
        
        if (restartButton) {
            restartButton.addEventListener('click', function() {
                UI.restartGame();
            });
        }
        
        if (mainMenuButton) {
            mainMenuButton.addEventListener('click', function() {
                UI.showMainMenu();
            });
        }
        
        // Add event listeners for shop
        const shopButton = document.getElementById('shopButton');
        const shopCloseButton = document.querySelector('.shop-close');
        
        if (shopButton) {
            shopButton.addEventListener('click', function() {
                UI.startShop();
            });
        }
        
        if (shopCloseButton) {
            shopCloseButton.addEventListener('click', function() {
                Shop.hide();
            });
        }
        
        // Add event listener for car selection from shop
        const shopCarSelectionButton = document.getElementById('shopCarSelectionButton');
        if (shopCarSelectionButton) {
            shopCarSelectionButton.addEventListener('click', function() {
                Shop.hide(); // Hide shop first
                UI.showCarSelection(); // Then show car selection
            });
        }

        // Add event listener for leaderboard
        if (this.elements.leaderboardButton) {
            this.elements.leaderboardButton.addEventListener('click', function() {
                Leaderboard.show();
            });
        }

        // Add event listener for leaderboard close button
        const leaderboardCloseButton = document.querySelector('.leaderboard-close');
        if (leaderboardCloseButton) {
            leaderboardCloseButton.addEventListener('click', function() {
                Leaderboard.close();
            });
        }
        
        // Handle window resize
        window.addEventListener('resize', this.resizeCanvas);
        
        // Initial canvas resize
        this.resizeCanvas();
        
        // Hide loading overlay once everything is initialized
        this.hideLoading();
    },
    
    // Create gear display
    createGearDisplay: function() {
        // Check if gear display already exists
        if (document.getElementById('gearDisplay')) {
            this.elements.gearDisplay = document.getElementById('gearDisplay');
            return;
        }
        
        // Create gear display container
        this.elements.gearDisplay = document.createElement('div');
        this.elements.gearDisplay.id = 'gearDisplay';
        this.elements.gearDisplay.style.position = 'absolute';
        this.elements.gearDisplay.style.bottom = '20px';
        this.elements.gearDisplay.style.left = '20px';
        this.elements.gearDisplay.style.color = '#ff00ff';
        this.elements.gearDisplay.style.fontSize = '36px';
        this.elements.gearDisplay.style.fontWeight = 'bold';
        this.elements.gearDisplay.style.textShadow = '0 0 10px rgba(255, 0, 255, 0.7)';
        this.elements.gearDisplay.style.zIndex = '5';
        this.elements.gearDisplay.textContent = 'Gear: 1';
        
        // Add to game container
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.elements.gearDisplay);
        }
    },
    
    // Create RPM display
    createRPMDisplay: function() {
        // Check if RPM display already exists
        if (document.getElementById('rpmDisplay')) {
            this.elements.rpmDisplay = document.getElementById('rpmDisplay');
            return;
        }
        
        // Create RPM display container
        const rpmContainer = document.createElement('div');
        rpmContainer.id = 'rpmContainer';
        rpmContainer.style.position = 'absolute';
        rpmContainer.style.bottom = '70px';
        rpmContainer.style.left = '20px';
        rpmContainer.style.zIndex = '5';
        rpmContainer.style.width = '200px';
        rpmContainer.style.height = '20px';
        
        // Create RPM bar background
        const rpmBackground = document.createElement('div');
        rpmBackground.style.width = '100%';
        rpmBackground.style.height = '100%';
        rpmBackground.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        rpmBackground.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        rpmBackground.style.borderRadius = '10px';
        rpmBackground.style.overflow = 'hidden';
        rpmBackground.style.position = 'relative';
        
        // Create RPM bar
        const rpmBar = document.createElement('div');
        rpmBar.id = 'rpmBar';
        rpmBar.style.height = '100%';
        rpmBar.style.width = '0%';
        rpmBar.style.position = 'absolute';
        rpmBar.style.top = '0';
        rpmBar.style.left = '0';
        rpmBar.style.background = 'linear-gradient(to right, #00ff00, #ffff00, #ff0000)';
        
        // Create redline marker
        const redlineMarker = document.createElement('div');
        redlineMarker.style.position = 'absolute';
        redlineMarker.style.top = '0';
        redlineMarker.style.height = '100%';
        redlineMarker.style.width = '2px';
        redlineMarker.style.backgroundColor = '#ffffff';
        redlineMarker.style.left = '85%'; // Redline at 85% of max RPM
        
        // Create RPM text
        const rpmText = document.createElement('div');
        rpmText.id = 'rpmText';
        rpmText.style.position = 'absolute';
        rpmText.style.top = '-20px';
        rpmText.style.left = '0';
        rpmText.style.width = '100%';
        rpmText.style.textAlign = 'center';
        rpmText.style.color = '#ffffff';
        rpmText.style.fontSize = '12px';
        rpmText.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.8)';
        rpmText.textContent = 'RPM: 1000';
        
        // Assemble RPM display
        rpmBackground.appendChild(rpmBar);
        rpmBackground.appendChild(redlineMarker);
        rpmContainer.appendChild(rpmBackground);
        rpmContainer.appendChild(rpmText);
        
        this.elements.rpmDisplay = rpmContainer;
        
        // Add to game container
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.elements.rpmDisplay);
        }
    },
    
    // Create neon brick count display
    createBrickCountDisplay: function() {
        // Check if brick count display already exists
        if (document.getElementById('brickCountDisplay')) {
            this.elements.brickCountDisplay = document.getElementById('brickCountDisplay');
            return;
        }
        
        // Create brick count display container
        this.elements.brickCountDisplay = document.createElement('div');
        this.elements.brickCountDisplay.id = 'brickCountDisplay';
        this.elements.brickCountDisplay.style.position = 'absolute';
        this.elements.brickCountDisplay.style.top = '60px';
        this.elements.brickCountDisplay.style.right = '20px';
        this.elements.brickCountDisplay.style.color = '#00ff66';
        this.elements.brickCountDisplay.style.fontSize = '18px';
        this.elements.brickCountDisplay.style.fontWeight = 'bold';
        this.elements.brickCountDisplay.style.textShadow = '0 0 10px rgba(0, 255, 102, 0.7)';
        this.elements.brickCountDisplay.style.zIndex = '5';
        this.elements.brickCountDisplay.textContent = 'Neon Bricks: 0';
        
        // Add to game container
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.elements.brickCountDisplay);
        }
    },
    
    // Show main menu
    showMainMenu: function() {
        if (this.elements.menuScreen) {
            this.elements.menuScreen.style.display = 'flex';
        }
        
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.style.display = 'none';
        }
        
        if (MainGame.isRunning) {
            MainGame.endGame();
        }
    },
    
    // Hide main menu
    hideMainMenu: function() {
        if (this.elements.menuScreen) {
            this.elements.menuScreen.style.display = 'none';
        }
    },
    
    // Show game over screen
    showGameOver: function(score, totalPoints) {
        // Showing game over screen
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScoreElement = document.getElementById('finalScore');
        const totalPointsElement = document.getElementById('totalPoints');
        
        if (gameOverScreen && finalScoreElement) {
            finalScoreElement.textContent = `Score: ${score}`;
            
            if (totalPointsElement && totalPoints !== undefined) {
                totalPointsElement.textContent = `Total Points: ${totalPoints}`;
                totalPointsElement.style.display = 'block';
            } else if (totalPointsElement) {
                totalPointsElement.style.display = 'none';
            }
            
            gameOverScreen.style.display = 'flex';
        }
    },
    
    // Hide game over screen
    hideGameOver: function() {
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.style.display = 'none';
        }
    },
    
    // Update score display
    updateScore: function(score) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = score.toLocaleString();
        }
    },
    
    // Update shop coins display (simplified - no longer stores points)
    updateShopCoins: function(coins) {
        // Find the element directly since we removed the reference
        const userPoints = document.getElementById('userPoints');
        if (userPoints) {
            userPoints.textContent = `Your Points: ${coins}`;
        }
    },
    
    // Show notification message
    showNotification: function(message, duration = 2000) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        // Set notification text
        notification.textContent = message;
        
        // Show notification
        notification.style.display = 'block';
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        // Set timeout to hide notification
        this.notificationTimeout = setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    },
    
    // Show loading overlay
    showLoading: function(message = 'Loading game assets...') {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'flex';
            
            if (this.elements.loadingText) {
                this.elements.loadingText.textContent = message;
            }
        }
    },
    
    // Hide loading overlay
    hideLoading: function() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        }
    },
    
    // Resize canvas to maintain aspect ratio
    resizeCanvas: function() {
        if (!this.canvas) return;
        
        // Get the game screen dimensions directly
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;
        
        const gameScreenRect = gameScreen.getBoundingClientRect();
        
        // Safety check - if dimensions are zero, retry after a short delay
        if (gameScreenRect.width <= 0 || gameScreenRect.height <= 0) {
            console.warn('Game screen has invalid dimensions. Retrying resize in 100ms...');
            setTimeout(() => this.resizeCanvas(), 100);
            return;
        }
        
        // Store the original dimensions before updating
        const originalWidth = this.canvas.width;
        const originalHeight = this.canvas.height;
        
        // Update both CSS and canvas dimensions to exactly match the game screen
        this.canvas.style.width = `${gameScreenRect.width}px`;
        this.canvas.style.height = `${gameScreenRect.height}px`;
        this.canvas.width = gameScreenRect.width;
        this.canvas.height = gameScreenRect.height;
        
        // Position canvas precisely within game screen with no offsets
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.transform = 'none';
        this.canvas.style.margin = '0';
        this.canvas.style.padding = '0';
        
        console.log(`Canvas resized to match game screen - Dimensions: ${this.canvas.width}x${this.canvas.height}`);
        
        // Update game state and elements for the new canvas size
        if (typeof Game !== 'undefined' && Game.handleCanvasResize) {
            Game.handleCanvasResize(originalWidth, originalHeight, this.canvas.width, this.canvas.height);
        }
        
        // Make sure to reposition player if the game is running
        if (Player && Player.data) {
            Player.resetPosition();
        }
    },
    
    // Create a floating text effect
    createFloatingText: function(x, y, text, color = '#ffffff', size = 16, lifetimeMs = 1000) {
        MainGame.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            size: size,
            alpha: 1.0,
            createdAt: Date.now(),
            lifetimeMs: lifetimeMs
        });
    },
    
    // Draw powerup indicator
    drawPowerupIndicator: function(ctx, type, active, x, y) {
        ctx.save();
        
        let color, symbol;
        
        switch (type) {
            case 'shield':
                color = active ? '#00ffff' : '#008888';
                symbol = '🛡️';
                break;
            case 'boost':
                color = active ? '#ffff00' : '#888800';
                symbol = '⚡';
                break;
            case 'magnet':
                color = active ? '#ff00ff' : '#880088';
                symbol = '🧲';
                break;
            default:
                color = '#ffffff';
                symbol = '?';
        }
        
        // Draw powerup icon
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(symbol, x, y);
        
        ctx.restore();
    },
    
    // Restart the game
    restartGame: function() {
        this.hideGameOver();
        MainGame.restart();
    },
    
    // Start the shop
    startShop: function() {
        if (Shop && typeof Shop.show === 'function') {
            Shop.show();
        } else {
            console.error('Shop module not available');
        }
    },
    
    // Close the shop
    closeShop: function() {
        if (Shop && typeof Shop.hide === 'function') {
            Shop.hide();
        }
    },
    
    // Start cooldown timer for powerups
    startCooldown: function(powerupName, duration) {
        // Set cooldown status
        this.activeCooldowns[powerupName] = true;
        
        // Create cooldown indicator if it doesn't exist
        let cooldownIndicator = document.getElementById(`${powerupName}-cooldown`);
        
        if (!cooldownIndicator) {
            cooldownIndicator = document.createElement('div');
            cooldownIndicator.id = `${powerupName}-cooldown`;
            cooldownIndicator.className = 'cooldown-indicator';
            cooldownIndicator.style.position = 'absolute';
            cooldownIndicator.style.bottom = '10px';
            cooldownIndicator.style.left = '10px';
            cooldownIndicator.style.padding = '5px 10px';
            cooldownIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
            cooldownIndicator.style.color = '#ff00ff';
            cooldownIndicator.style.borderRadius = '5px';
            cooldownIndicator.style.border = '1px solid #ff00ff';
            cooldownIndicator.style.fontSize = '14px';
            cooldownIndicator.style.zIndex = '10';
            
            document.getElementById('gameContainer').appendChild(cooldownIndicator);
        }
        
        // Set initial text
        cooldownIndicator.textContent = `${powerupName}: ${Math.ceil(duration / 1000)}s`;
        cooldownIndicator.style.display = 'block';
        
        // Clear any existing interval
        if (this.cooldownTimers[powerupName]) {
            clearInterval(this.cooldownTimers[powerupName]);
        }
        
        // Start countdown
        const startTime = Date.now();
        const endTime = startTime + duration;
        
        this.cooldownTimers[powerupName] = setInterval(() => {
            const remaining = endTime - Date.now();
            
            if (remaining <= 0) {
                // Cooldown finished
                clearInterval(this.cooldownTimers[powerupName]);
                this.activeCooldowns[powerupName] = false;
                cooldownIndicator.style.display = 'none';
                
                // Emit cooldown ended event
                const event = new CustomEvent('cooldownEnded', { detail: { powerup: powerupName } });
                document.dispatchEvent(event);
            } else {
                // Update display
                cooldownIndicator.textContent = `${powerupName}: ${Math.ceil(remaining / 1000)}s`;
            }
        }, 100);
    },
    
    // Check if a powerup is in cooldown
    isInCooldown: function(powerupName) {
        return this.activeCooldowns[powerupName] === true;
    },
    
    // Update cooldown timer UI when reconnecting
    updateCooldownTimer: function() {
        // This function will be called when reconnecting to restore cooldown timers
        if (Shop && Shop.lastUsedPowerupTime && Shop.powerupCooldown) {
            const elapsed = Date.now() - Shop.lastUsedPowerupTime;
            
            if (elapsed < Shop.powerupCooldown) {
                const remaining = Shop.powerupCooldown - elapsed;
                this.startCooldown('shield', remaining);
            }
        }
    },
    
    // Create floating score text
    createFloatingText: function(x, y, text, color = '#ffff00') {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Add to floating texts array to be rendered in the game loop
        MainGame.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            alpha: 1.0,
            size: 20,
            lifetimeMs: 1500,
            createdAt: Date.now()
        });
    },
    
    // Draw powerup indicator
    drawPowerupIndicator: function(ctx, powerupName, active, x, y) {
        if (!active) return;
        
        let color = '#ffffff';
        let icon = '⚡';
        
        // Set color and icon based on powerup type
        switch (powerupName) {
            case 'shield':
                color = '#00ffff';
                icon = '🛡️';
                break;
            case 'boost':
                color = '#ffff00';
                icon = '⚡';
                break;
            case 'magnet':
                color = '#ff00ff';
                icon = '🧲';
                break;
        }
        
        // Draw indicator
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y);
        ctx.restore();
    },
    
    // Add floating text
    addFloatingText: function(text, x, y, color = '#ffffff', size = 20, lifetimeMs = 1500) {
        MainGame.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            alpha: 1.0,
            size: size,
            lifetimeMs: lifetimeMs,
            createdAt: Date.now()
        });
    },
    
    // Set up event listeners
    setupUIEventListeners: function() {

        
        // Leaderboard button
        const leaderboardButton = document.getElementById('leaderboardButton');
        if (leaderboardButton) {
            leaderboardButton.addEventListener('click', () => {
                if (window.Leaderboard && typeof Leaderboard.show === 'function') {
                    Leaderboard.show();
                } else {
                    console.error("Leaderboard module not loaded");
                }
            });
        }
        
        // Profile button
        const profileButton = document.getElementById('profileButton');
        if (profileButton) {
            profileButton.addEventListener('click', this.showProfile.bind(this));
        }
        
        // Car selection button was moved to the shop
        // The event listener for shopCarSelectionButton is added in initializeUIElements
        
        // Shop button
        const shopButton = document.getElementById('shopButton');
        if (shopButton) {
            shopButton.addEventListener('click', () => {
                if (Shop) {
                    Shop.show();
                }
            });
        }
        
        // Close buttons
        const closeButtons = document.querySelectorAll('.close-button');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Find the parent modal directly
                const modal = e.target.closest('#profileModal, #leaderboardModal, #shopModal, #carSelectionModal');
                if (modal) {
                    if (modal.id === 'leaderboardModal' && window.Leaderboard) {
                        Leaderboard.close();
                    } else if (modal.id === 'carSelectionModal') {
                        this.hideCarSelection();
                    } else {
                    modal.style.display = 'none';
                    }
                }
            });
        });
        
        // Shop close button
        const shopCloseButton = document.querySelector('.shop-close');
        if (shopCloseButton) {
            shopCloseButton.addEventListener('click', () => {
                const shopModal = document.getElementById('shopModal');
                if (shopModal && Shop) {
                    Shop.hide();
                }
            });
        }
    },
    
    // Show profile screen
    showProfile: function() {
        const profileModal = document.getElementById('profileModal');
        const profileContent = document.getElementById('profileContent');
        const profileHighScore = document.getElementById('profileHighScore');
        const profileDistance = document.getElementById('profileDistance');
        
        if (!profileModal) return;
        
        // Show loading state
        profileContent.innerHTML = '<div class="profile-loading">Loading profile data...</div>';
        profileModal.style.display = 'block';
        
        // Check if wallet is connected
        if (!Wallet.isConnected()) {
            profileContent.innerHTML = '<div class="profile-error">Please connect your wallet to view your profile.</div>';
            return;
        }
        
        // Check if Supabase is configured
        if (!Database.isInitialized) {
            profileContent.innerHTML = '<div class="profile-error">Database is not configured. Unable to load profile data.</div>';
            return;
        }
        
        // Fetch profile data
        this.loadProfileData();
    },
    
    // Load profile data from database
    loadProfileData: async function() {
        const profileHighScore = document.getElementById('profileHighScore');
        const profileDistance = document.getElementById('profileDistance');
        const profileContent = document.getElementById('profileContent');
        
        try {
            // Set a timeout to handle slow connections
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile data request timed out')), 10000)
            );
            
            // Get user profile and high score
            const profilePromise = Promise.all([
                Database.getUserProfile(Wallet.getCurrentWallet()),
                Database.getPlayerHighScore(Wallet.getCurrentWallet()),
                Database.getTopScores(100) // Get top scores to determine rank
            ]);
            
            // Race the timeout against the actual request
            const [userData, highScoreData, allScores] = await Promise.race([
                profilePromise,
                timeoutPromise
            ]);
            
            // Remove the loading indicator
            const loadingElement = profileContent.querySelector('.profile-loading');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Show the stats section
            const statsSection = document.getElementById('profileStats');
            if (statsSection) {
                statsSection.style.display = 'flex';
            }
            
            // Calculate ranks if possible
            let scoreRank = '-';
            let distanceRank = '-';
            
            if (allScores && allScores.length > 0) {
                // Find user's rank in scores
                const userIndex = allScores.findIndex(
                    score => score.wallet_address === Wallet.getCurrentWallet()
                );
                
                if (userIndex !== -1) {
                    scoreRank = userIndex + 1;
                }
            }
            
            // Update profile UI
            if (profileHighScore) {
                const score = highScoreData ? highScoreData.score : 0;
                profileHighScore.innerHTML = `${score} <span class="rank-badge">Rank: ${scoreRank}</span>`;
            }
            
            if (profileDistance) {
                const distance = highScoreData ? Math.floor(highScoreData.distance) : 0;
                profileDistance.innerHTML = `${distance}m <span class="rank-badge">Rank: ${distanceRank}</span>`;
            }
            
            // Select the current car if available
            if (userData && userData.selected_car) {
                this.selectCarInUI(userData.selected_car);
            }
            
            console.log('Profile data loaded:', { userData, highScoreData });
        } catch (error) {
            console.error('Error loading profile data:', error);
            profileContent.innerHTML = '<div class="profile-error">Error loading profile data. Please try again later.</div>';
        }
    },
    
    // Show car selection modal
    showCarSelection: function() {
        const carSelectionModal = document.getElementById('carSelectionModal');
        if (!carSelectionModal) return;
        
        carSelectionModal.style.display = 'flex';
        
        // Highlight current car
        const savedCar = localStorage.getItem('selectedCar');
        if (savedCar) {
            this.selectCarInUI(savedCar);
            this.hideCarPreview();
            this.updateCarStats(savedCar);
        } else if (Player && Player.carType) {
            this.selectCarInUI(Player.carType);
            this.hideCarPreview();
            this.updateCarStats(Player.carType);
            } else {
            // Show the car preview if no car is selected
            this.showCarPreview();
        }
        
        // Add event listeners to car options if not already added
        if (!this.carSelectionListenersAdded) {
            this.setupCarSelectionListeners();
            this.carSelectionListenersAdded = true;
                    }
    },
    
    // Hide car preview and only show stats
    hideCarPreview: function() {
        const previewSection = document.querySelector('.car-detail-preview');
        const selectedCarInfo = document.querySelector('.selected-car-info');
        
        if (previewSection && selectedCarInfo) {
            // Hide the visual preview
            const carPreview = document.getElementById('selectedCarPreview');
            if (carPreview) {
                carPreview.style.display = 'none';
            }
            
            // Adjust styling to make stats more prominent
            selectedCarInfo.style.width = '100%';
            selectedCarInfo.style.textAlign = 'center';
            
            // Add a "selected" label
            const selectedLabel = document.createElement('div');
            selectedLabel.textContent = 'SELECTED';
            selectedLabel.className = 'selected-label';
            selectedLabel.style.color = '#00ffff';
            selectedLabel.style.fontSize = '14px';
            selectedLabel.style.marginTop = '10px';
            selectedLabel.style.fontWeight = 'bold';
            selectedLabel.style.textShadow = '0 0 8px #00ffff';
            
            // Check if label is already added
            if (!document.querySelector('.selected-label')) {
                selectedCarInfo.appendChild(selectedLabel);
            }
        }
    },
    
    // Show car preview
    showCarPreview: function() {
        const previewSection = document.querySelector('.car-detail-preview');
        const selectedCarInfo = document.querySelector('.selected-car-info');
        
        if (previewSection && selectedCarInfo) {
            // Show the visual preview
            const carPreview = document.getElementById('selectedCarPreview');
            if (carPreview) {
                carPreview.style.display = 'block';
            }
            
            // Reset styling
            selectedCarInfo.style.width = '';
            selectedCarInfo.style.textAlign = '';
            
            // Remove selected label if it exists
            const selectedLabel = document.querySelector('.selected-label');
            if (selectedLabel) {
                selectedLabel.remove();
            }
        }
    },
    
    // Hide car selection modal
    hideCarSelection: function() {
        const carSelectionModal = document.getElementById('carSelectionModal');
        if (carSelectionModal) {
            carSelectionModal.style.display = 'none';
        }
    },
    
    // Setup car selection listeners
    setupCarSelectionListeners: function() {
        const carOptions = document.querySelectorAll('#carSelectionModal .car-option');
        
        carOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const carType = option.dataset.car;
                const speedStat = option.dataset.speed || 50;
                const handlingStat = option.dataset.handling || 50;
                const styleStat = option.dataset.style || 50;
                
                // Update UI
                this.selectCarInUI(carType);
                
                // Update stats and hide preview
                this.updateCarStats(carType, speedStat, handlingStat, styleStat);
                this.hideCarPreview();
                
                // Set car type in Player
                if (Player) {
                    Player.setCarType(carType);
                    // The Player.setCarType method already saves to localStorage
                }
                
                // Get friendly name for notification
                let carFriendlyName;
                switch(carType) {
                    case 'BlackOut': carFriendlyName = 'Stealth Racer'; break;
                    case 'BlueStrip': carFriendlyName = 'Blue Lightning'; break;
                    case 'GreenStrip': carFriendlyName = 'Emerald Streak'; break;
                    case 'PinkStrip': carFriendlyName = 'Neon Princess'; break;
                    case 'RedStrip': carFriendlyName = 'Crimson Blaze'; break;
                    case 'WhiteStrip': carFriendlyName = 'Ghost Rider'; break;
                    default: carFriendlyName = carType;
                }
                
                // Show selection notification
                this.showNotification(`Selected ${carFriendlyName}!`, 2000);
            });
        });
    },
    
    // Update car stats without showing preview
    updateCarStats: function(carType, speed, handling, style) {
        const selectedCarName = document.getElementById('selectedCarName');
        const speedStat = document.querySelector('#carSelectionModal .speed-stat');
        const handlingStat = document.querySelector('#carSelectionModal .handling-stat');
        const styleStat = document.querySelector('#carSelectionModal .style-stat');
        
        if (!selectedCarName) return;
        
        // Get stats from the car option if not provided
        if (!speed || !handling || !style) {
            const selectedOption = document.querySelector(`#carSelectionModal .car-option[data-car="${carType}"]`);
            if (selectedOption) {
                speed = selectedOption.dataset.speed || 50;
                handling = selectedOption.dataset.handling || 50;
                style = selectedOption.dataset.style || 50;
            }
        }
        
        // Set car name using friendly name
        let carFriendlyName;
        switch(carType) {
            case 'BlackOut': carFriendlyName = 'Stealth Racer'; break;
            case 'BlueStrip': carFriendlyName = 'Blue Lightning'; break;
            case 'GreenStrip': carFriendlyName = 'Emerald Streak'; break;
            case 'PinkStrip': carFriendlyName = 'Neon Princess'; break;
            case 'RedStrip': carFriendlyName = 'Crimson Blaze'; break;
            case 'WhiteStrip': carFriendlyName = 'Ghost Rider'; break;
            default: carFriendlyName = carType;
        }
        selectedCarName.textContent = carFriendlyName;
        
        // Update stat bars with animation
        if (speedStat) {
            speedStat.style.transition = 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
            speedStat.style.width = `${speed}%`;
        }
        if (handlingStat) {
            handlingStat.style.transition = 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s';
            handlingStat.style.width = `${handling}%`;
        }
        if (styleStat) {
            styleStat.style.transition = 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) 0.2s';
            styleStat.style.width = `${style}%`;
        }
    },
    
    // Update car preview
    updateCarPreview: function(carType, speed, handling, style) {
        const selectedCarPreview = document.getElementById('selectedCarPreview');
        const selectedCarName = document.getElementById('selectedCarName');
        const carPreviewImg = document.getElementById('carPreviewImg');
        const speedStat = document.querySelector('#carSelectionModal .speed-stat');
        const handlingStat = document.querySelector('#carSelectionModal .handling-stat');
        const styleStat = document.querySelector('#carSelectionModal .style-stat');
        
        if (!selectedCarPreview || !selectedCarName) return;
        
        // Show the preview
        selectedCarPreview.style.display = 'block';
        
        // Update car image source
        if (carPreviewImg) {
            carPreviewImg.src = `assets/cars/${carType}.png`;
            carPreviewImg.alt = carType;
            
            // Reset animation to trigger it again
            carPreviewImg.style.animation = 'none';
            carPreviewImg.offsetHeight; // Trigger reflow
            carPreviewImg.style.animation = 'hover-effect 2s ease-in-out infinite';
                    }
                    
        // Set car name using friendly name
        let carFriendlyName;
        switch(carType) {
            case 'BlackOut': carFriendlyName = 'Stealth Racer'; break;
            case 'BlueStrip': carFriendlyName = 'Blue Lightning'; break;
            case 'GreenStrip': carFriendlyName = 'Emerald Streak'; break;
            case 'PinkStrip': carFriendlyName = 'Neon Princess'; break;
            case 'RedStrip': carFriendlyName = 'Crimson Blaze'; break;
            case 'WhiteStrip': carFriendlyName = 'Ghost Rider'; break;
            default: carFriendlyName = carType;
        }
        selectedCarName.textContent = carFriendlyName;
        
        // If stats weren't provided, get them from the car option
        if (!speed || !handling || !style) {
            const selectedOption = document.querySelector(`#carSelectionModal .car-option[data-car="${carType}"]`);
            if (selectedOption) {
                speed = selectedOption.dataset.speed || 50;
                handling = selectedOption.dataset.handling || 50;
                style = selectedOption.dataset.style || 50;
            }
        }
        
        // Update stat bars with animation
        if (speedStat) {
            speedStat.style.transition = 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
            speedStat.style.width = `${speed}%`;
        }
        if (handlingStat) {
            handlingStat.style.transition = 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s';
            handlingStat.style.width = `${handling}%`;
            }
        if (styleStat) {
            styleStat.style.transition = 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) 0.2s';
            styleStat.style.width = `${style}%`;
        }
    },
    
    // Select car in the UI
    selectCarInUI: function(carType) {
        const carOptions = document.querySelectorAll('.car-option');
        
        carOptions.forEach(option => {
            if (option.dataset.car === carType) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        // Also update preview if in car selection modal
        const carSelectionModal = document.getElementById('carSelectionModal');
        if (carSelectionModal && carSelectionModal.style.display === 'block') {
            this.updateCarPreview(carType);
        }
    },
    
    // Close profile modal
    closeProfile: function() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.style.display = 'none';
        }
    },
    
    // Close leaderboard modal
    closeLeaderboard: function() {
        const leaderboardModal = document.getElementById('leaderboardModal');
        if (leaderboardModal) {
            leaderboardModal.style.display = 'none';
        }
    },
    
    // Initialize UI
    init: function() {
        this.initElements();
        this.setupUIEventListeners();
        this.createGameModeUI();
    },
    
    // Initialize UI elements
    initElements: function() {
        // Get main container
        this.container = document.getElementById('gameContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'gameContainer';
            document.body.appendChild(this.container);
        }
        
        // Create canvas if it doesn't exist
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gameCanvas';
            this.container.appendChild(this.canvas);
        }
        
        // Get canvas context
        this.ctx = this.canvas.getContext('2d');
        
        // Set initial size
        this.resizeCanvas();
    },
    
    // Show game UI - shows the game canvas and hides the menu
    showGameUI: function() {
        // Hide menu screen
        if (this.elements.menuScreen) {
            this.elements.menuScreen.style.display = 'none';
        }
        
        // Show game screen
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.style.display = 'flex';
        }
        
        // Show canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'block';
            
            // Force a resize to ensure correct positioning
            this.resizeCanvas();
        }
        
        // Show score display for endless mode
        const scoreDisplay = document.getElementById('score');
        if (scoreDisplay) {
            scoreDisplay.style.display = 'block';
        }
        

    },
    
    // Hide menu UI
    hideMenuUI: function() {
        // Hide menu screen
        if (this.elements.menuScreen) {
            this.elements.menuScreen.style.display = 'none';
        }
        
        // Hide game over screen if visible
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.style.display = 'none';
        }
        
        // Hide shop if visible
        const shopModal = document.getElementById('shopModal');
        if (shopModal) {
            shopModal.style.display = 'none';
        }
        

    },
    
    // Update game UI
    updateGameUI: function(score, distance) {
        // Update score display if needed
        if (document.getElementById('score')) {
        this.updateScore(score);
        }
        
        // Update distance display if any
        const distanceElement = document.getElementById('distance');
        if (distanceElement) {
            distanceElement.textContent = `Distance: ${Math.floor(distance)}m`;
        }
    },
    
    // Update time remaining for time trial mode
    updateTimeRemaining: function(seconds) {
        const timeElement = document.getElementById('timeRemaining');
        if (timeElement) {
            // Convert to minutes:seconds format
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            
            // Format with leading zeros
            const formattedTime = `${minutes}:${secs.toString().padStart(2, '0')}`;
            timeElement.textContent = formattedTime;
            
            // Change color when low on time
            if (seconds < 10) {
                timeElement.classList.add('warning');
            } else {
                timeElement.classList.remove('warning');
            }
        }
    },
    
    // Update progress for time trial mode
    updateProgress: function(percent) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressPercent');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.floor(percent)}%`;
        }
    },
    
    // Show best times for time trial mode
    showBestTimes: function() {
        const bestTimesContainer = document.getElementById('bestTimes');
        if (!bestTimesContainer) return;
        
        // Make container visible
        bestTimesContainer.style.display = 'block';
        
        // Show loading indicator
        bestTimesContainer.innerHTML = '<h3>Best Times</h3><p>Loading best times...</p>';
        
        // First try to get times from database if a wallet is connected
        if (Wallet && Wallet.isConnected() && Database && Database.isInitialized) {
            Database.getBestTimes(Wallet.getCurrentWallet(), 5)
                .then(bestTimes => {
                    this.displayBestTimes(bestTimesContainer, bestTimes);
                })
                .catch(error => {
                    console.error('Error fetching best times from database:', error);
                    // Fall back to localStorage
                    const localBestTimes = JSON.parse(localStorage.getItem('bestTimes') || '[]');
                    this.displayBestTimes(bestTimesContainer, localBestTimes);
                });
        } else {
            // Use localStorage when database is not available
            const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '[]');
            this.displayBestTimes(bestTimesContainer, bestTimes);
        }
    },
    
    // Display the best times in the container
    displayBestTimes: function(container, bestTimes) {
        // Clear existing content
        container.innerHTML = '<h3>Best Times</h3>';
        
        if (!bestTimes || bestTimes.length === 0) {
            container.innerHTML += '<p>No times recorded yet</p>';
            return;
        }
        
        // Create table
        const table = document.createElement('table');
        table.classList.add('best-times-table');
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Time</th>
                <th>Date</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Add entries (only show top 5)
        const timesToShow = Math.min(5, bestTimes.length);
        for (let i = 0; i < timesToShow; i++) {
            const time = bestTimes[i];
            
            // Format time value
            const timeValue = typeof time.time === 'number' ? time.time.toFixed(2) : time.time;
            
            // Format date
            const date = new Date(time.date || time.created_at);
            const formattedDate = date.toLocaleDateString();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>${timeValue}s</td>
                <td>${formattedDate}</td>
            `;
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        container.appendChild(table);
    },
    
    // Create UI elements based on game mode
    createGameModeUI: function() {
        console.log(`Creating UI for endless runner mode`);
        
        // Get game UI container
        const gameUI = document.getElementById('gameUI');
        if (!gameUI) {
            console.error('Game UI container not found');
            return;
        }
        
        // Clear existing content
        gameUI.innerHTML = '';
        
        // For endless runner (Subway Surfers style), we only show score
        // No need for time or progress elements or high scores in game over screen
    },
    
    // Toggle fullscreen mode
    toggleFullscreen: function() {
        const gameContainer = document.getElementById('gameContainer');
        
        if (!document.fullscreenElement) {
            // Go fullscreen
            if (gameContainer.requestFullscreen) {
                gameContainer.requestFullscreen().then(() => {
                    this.resizeCanvas();
                }).catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else if (gameContainer.webkitRequestFullscreen) { // Safari
                gameContainer.webkitRequestFullscreen();
                this.resizeCanvas();
            } else if (gameContainer.msRequestFullscreen) { // IE11
                gameContainer.msRequestFullscreen();
                this.resizeCanvas();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    this.resizeCanvas();
                }).catch(err => {
                    console.error(`Error attempting to exit fullscreen: ${err.message}`);
                });
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
                this.resizeCanvas();
            } else if (document.msExitFullscreen) { // IE11
                document.msExitFullscreen();
                this.resizeCanvas();
            }
        }
    },
    
    // Create fullscreen button
    createFullscreenButton: function() {
        // Do nothing - fullscreen button removed
        return;
    },
    
    // Update high scores list
    updateHighScores: function(newScore) {
        const highScoresBody = document.getElementById('highScoresBody');
        if (!highScoresBody) return;
        
        // Clear existing rows
        highScoresBody.innerHTML = '';
        
        // Try to get scores from database first
        if (typeof Database !== 'undefined' && Database.isInitialized) {
            console.log('Getting high scores from database');
            
            Database.getTopScores(5)
                .then(scores => {
                    if (scores && scores.length > 0) {
                        console.log('Displaying database high scores:', scores);
                        
                        // Add rows for each score
                        scores.forEach((score, index) => {
                            const row = document.createElement('tr');
                            
                            // Format wallet address for display
                            const walletAddress = score.wallet_address;
                            const displayAddress = walletAddress.substring(0, 6) + '...' + walletAddress.substring(walletAddress.length - 4);
                            
                            // Format date
                            const date = new Date(score.created_at).toLocaleDateString();
                            
                            row.innerHTML = `
                                <td>${index + 1}</td>
                                <td>${displayAddress}</td>
                                <td>${score.score}</td>
                                <td>${date}</td>
                            `;
                            
                            highScoresBody.appendChild(row);
                        });
                        return;
                    } else {
                    console.log('No database scores found, falling back to session scores');
                        this.showLocalHighScores(highScoresBody);
                    }
                })
                .catch(error => {
                    console.error('Error getting database high scores:', error);
                    this.showLocalHighScores(highScoresBody);
                });
        } else {
            console.log('Database not initialized, using session high scores');
            this.showLocalHighScores(highScoresBody);
        }
    },
    
    // Show high scores from session storage as fallback
    showLocalHighScores: function(highScoresBody) {
        // Get high scores from session storage
        let highScores = [];
        try {
            const savedScores = sessionStorage.getItem('neonRacerHighScores');
            if (savedScores) {
                highScores = JSON.parse(savedScores);
            }
        } catch (e) {
            console.error('Error loading high scores from session storage:', e);
        }
        
        // Display local high scores
        if (highScores.length > 0) {
            highScores.slice(0, 5).forEach((score, index) => {
                const row = document.createElement('tr');
                
                // Format date
                let date = 'Unknown';
                try {
                    date = new Date(score.date).toLocaleDateString();
            } catch (e) {
                    console.error('Error formatting date:', e);
            }
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>Local Player</td>
                    <td>${score.score}</td>
                    <td>${date}</td>
                `;
                
                highScoresBody.appendChild(row);
            });
        } else {
            // No scores yet
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4">No high scores yet</td>';
            highScoresBody.appendChild(row);
        }
    },

    // Create UI elements
    createUI: function() {
        // Create game container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'gameContainer';
            document.body.appendChild(this.container);
        }

        // Create game UI container
        let gameUI = document.getElementById('gameUI');
        if (!gameUI) {
            gameUI = document.createElement('div');
            gameUI.id = 'gameUI';
            this.container.appendChild(gameUI);
        }

        // Create score display
        let scoreDisplay = document.getElementById('score');
        if (!scoreDisplay) {
            scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'score';
            scoreDisplay.className = 'score-display';
            scoreDisplay.textContent = 'Score: 0';
            gameUI.appendChild(scoreDisplay);
        }

        // Create notification element
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            notification.style.display = 'none';
            gameUI.appendChild(notification);
        }

        // Create loading overlay
        let loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loadingOverlay';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.style.display = 'none';
            
            const loadingText = document.createElement('div');
            loadingText.id = 'loadingText';
            loadingText.className = 'loading-text';
            loadingText.textContent = 'Loading...';
            
            loadingOverlay.appendChild(loadingText);
            this.container.appendChild(loadingOverlay);
        }

        // Create fullscreen button
        this.createFullscreenButton();

        // Store references to UI elements
        this.elements = {
            menuScreen: document.getElementById('menuScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            shopModal: document.getElementById('shopModal'),
            scoreDisplay: scoreDisplay,
            finalScoreDisplay: document.getElementById('finalScore'),
            loadingOverlay: loadingOverlay,
            loadingText: document.getElementById('loadingText'),
            notification: notification
        };

        // Set initial size
        this.resizeCanvas();
    },

    // Create mobile touch controls
    createMobileControls: function() {
        // Create mobile controls container
        this.elements.mobileControls = document.createElement('div');
        this.elements.mobileControls.id = 'mobileControls';
        this.elements.mobileControls.style.position = 'absolute';
        this.elements.mobileControls.style.bottom = '0';
        this.elements.mobileControls.style.left = '0';
        this.elements.mobileControls.style.width = '100%';
        this.elements.mobileControls.style.height = '50%';
        this.elements.mobileControls.style.display = 'none';
        this.elements.mobileControls.style.zIndex = '10';
        
        // Create left touch area
        this.elements.leftTouchArea = document.createElement('div');
        this.elements.leftTouchArea.style.position = 'absolute';
        this.elements.leftTouchArea.style.left = '0';
        this.elements.leftTouchArea.style.bottom = '0';
        this.elements.leftTouchArea.style.width = '50%';
        this.elements.leftTouchArea.style.height = '100%';
        this.elements.leftTouchArea.style.opacity = '0.3';
        this.elements.leftTouchArea.style.backgroundColor = '#00ffff';
        
        // Create right touch area
        this.elements.rightTouchArea = document.createElement('div');
        this.elements.rightTouchArea.style.position = 'absolute';
        this.elements.rightTouchArea.style.right = '0';
        this.elements.rightTouchArea.style.bottom = '0';
        this.elements.rightTouchArea.style.width = '50%';
        this.elements.rightTouchArea.style.height = '100%';
        this.elements.rightTouchArea.style.opacity = '0.3';
        this.elements.rightTouchArea.style.backgroundColor = '#ff00ff';
        
        // Add touch areas to container
        this.elements.mobileControls.appendChild(this.elements.leftTouchArea);
        this.elements.mobileControls.appendChild(this.elements.rightTouchArea);
        
        // Add container to game screen
        if (this.elements.gameScreen) {
            this.elements.gameScreen.appendChild(this.elements.mobileControls);
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // ... existing event listeners ...
        
        // Initialize touch controls for mobile
        if (this.elements.leftTouchArea && this.elements.rightTouchArea) {
            // Left touch area handlers
            this.elements.leftTouchArea.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Player.moveLeft();
            });
            
            this.elements.leftTouchArea.addEventListener('touchend', function(e) {
                e.preventDefault();
                Player.stopMove();
            });
            
            // Right touch area handlers
            this.elements.rightTouchArea.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Player.moveRight();
            });
            
            this.elements.rightTouchArea.addEventListener('touchend', function(e) {
                e.preventDefault();
                Player.stopMove();
            });
            
            // Handle touch cancellation
            this.elements.leftTouchArea.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                Player.stopMove();
            });

            this.elements.rightTouchArea.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                Player.stopMove();
            });
        }
    },
    
    // Make canvas responsive
    resizeCanvas: function() {
        if (!this.canvas) return;
        
        // Get the game screen dimensions directly
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;
        
        const gameScreenRect = gameScreen.getBoundingClientRect();
        
        // Safety check - if dimensions are zero, retry after a short delay
        if (gameScreenRect.width <= 0 || gameScreenRect.height <= 0) {
            console.warn('Game screen has invalid dimensions. Retrying resize in 100ms...');
            setTimeout(() => this.resizeCanvas(), 100);
            return;
        }
        
        // Store the original dimensions before updating
        const originalWidth = this.canvas.width;
        const originalHeight = this.canvas.height;
        
        // Update both CSS and canvas dimensions to exactly match the game screen
        this.canvas.style.width = `${gameScreenRect.width}px`;
        this.canvas.style.height = `${gameScreenRect.height}px`;
        this.canvas.width = gameScreenRect.width;
        this.canvas.height = gameScreenRect.height;
        
        // Position canvas precisely within game screen with no offsets
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.transform = 'none';
        this.canvas.style.margin = '0';
        this.canvas.style.padding = '0';
        
        console.log(`Canvas resized to match game screen - Dimensions: ${this.canvas.width}x${this.canvas.height}`);
        
        // Update game state and elements for the new canvas size
        if (typeof Game !== 'undefined' && Game.handleCanvasResize) {
            Game.handleCanvasResize(originalWidth, originalHeight, this.canvas.width, this.canvas.height);
        }
        
        // Make sure to reposition player if the game is running
        if (Player && Player.data) {
            Player.resetPosition();
        }
    }
}; 