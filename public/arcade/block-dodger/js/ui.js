// Block Dodger - UI Module

const UI = {
    // UI elements
    menuScreen: null,
    gameScreen: null,
    leftTouchArea: null,
    rightTouchArea: null,
    connectWalletButton: null,
    disconnectWalletButton: null,
    playButton: null,
    restartButton: null,
    menuButton: null,
    leaderboardButton: null,
    pointsLeaderboardButton: null,
    soundToggleButton: null,
    shopButton: null,
    profileButton: null,
    walletStatus: null,
    difficultyBar: null,
    
    // Initialize UI elements
    initializeUIElements: function() {
        this.canvas = document.getElementById("gameCanvas");
        this.scoreDisplay = document.getElementById("score");
        this.menuScreen = document.getElementById("menuScreen");
        this.gameScreen = document.getElementById("gameScreen");
        
        // Create gameScreen if it doesn't exist yet
        if (!this.gameScreen) {
            this.gameScreen = document.createElement("div");
            this.gameScreen.id = "gameScreen";
            this.gameScreen.className = "screen";
            this.gameScreen.style.display = "none";
            
            // Add to gameContainer
            const gameContainer = document.getElementById("gameContainer");
            if (gameContainer) {
                gameContainer.appendChild(this.gameScreen);
            }
        }
        
        this.connectWalletButton = document.getElementById("connectWalletButton");
        this.disconnectWalletButton = document.getElementById("disconnectWalletButton");
        this.playButton = document.getElementById("playButton");
        this.restartButton = document.getElementById("restartButton");
        this.menuButton = document.getElementById("menuButton");
        this.leaderboardButton = document.getElementById("leaderboardButton");
        this.pointsLeaderboardButton = document.getElementById("pointsLeaderboardButton");
        this.soundToggleButton = document.getElementById("soundToggleButton");
        this.shopButton = document.getElementById("shopButton");
        this.leftTouchArea = document.getElementById("leftTouchArea");
        this.rightTouchArea = document.getElementById("rightTouchArea");
        this.walletStatus = document.getElementById("walletStatus");
        
        // Create difficulty bar if it doesn't exist
        this.createDifficultyBar();
        
        // Game over buttons
        const playAgainButton = document.getElementById("playAgainButton");
        const mainMenuButton = document.getElementById("mainMenuButton");
        
        if (playAgainButton) {
            playAgainButton.onclick = Game.restart.bind(Game);
            playAgainButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Game.restart();
            });
        }
        
        if (mainMenuButton) {
            mainMenuButton.onclick = Game.returnToMenu.bind(Game);
            mainMenuButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Game.returnToMenu();
            });
        }
    
        // Setup restart button
        if (this.restartButton) {
            this.restartButton.addEventListener('click', Game.restart.bind(Game));
            this.restartButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Game.restart();
            });
        }
    
        // Add event listeners
        if (this.connectWalletButton) {
            this.connectWalletButton.addEventListener('click', Wallet.connect.bind(Wallet));
            this.connectWalletButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Wallet.connect.bind(Wallet)();
            });
        }
    
        if (this.disconnectWalletButton) {
            this.disconnectWalletButton.addEventListener('click', Wallet.disconnect.bind(Wallet));
            this.disconnectWalletButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Wallet.disconnect.bind(Wallet)();
            });
        }
    
        if (this.playButton) {
            this.playButton.addEventListener('click', Game.start.bind(Game));
            this.playButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Game.start();
            });
        }
    
        if (this.leaderboardButton) {
            this.leaderboardButton.addEventListener('click', Leaderboard.show);
            this.leaderboardButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Leaderboard.show();
            });
        }
    
        if (this.pointsLeaderboardButton) {
            this.pointsLeaderboardButton.addEventListener('click', Leaderboard.showWalletPoints);
            this.pointsLeaderboardButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                Leaderboard.showWalletPoints();
            });
        }
    
        if (this.shopButton) {
            this.shopButton.addEventListener('click', function() {
                if (window.Shop) {
                    window.Shop.showShop();
                } else {
                    console.error('Shop module not available');
                }
            });
            this.shopButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (window.Shop) {
                    window.Shop.showShop();
                } else {
                    console.error('Shop module not available');
                }
            });
        }
    
        if (this.soundToggleButton) {
            this.soundToggleButton.addEventListener('click', function() {
                const isSoundOn = Sound.toggleSound();
                this.textContent = `Sound: ${isSoundOn ? 'ON' : 'OFF'}`;
            });
            this.soundToggleButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                const isSoundOn = Sound.toggleSound();
                this.textContent = `Sound: ${isSoundOn ? 'ON' : 'OFF'}`;
            });
        }
    
        if (canvas) {
            Player.resetPosition();
            
            // Initialize touch controls for mobile if touch areas exist
            if (this.leftTouchArea && this.rightTouchArea) {
                // Left touch area handlers
                this.leftTouchArea.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    Player.moveLeft();
                });
                
                this.leftTouchArea.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    Player.stopMove();
                });
                
                // Right touch area handlers
                this.rightTouchArea.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    Player.moveRight();
                });
                
                this.rightTouchArea.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    Player.stopMove();
                });
                
                // Handle touch cancellation
                this.leftTouchArea.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    Player.stopMove();
                });
    
                this.rightTouchArea.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    Player.stopMove();
                });
            }
        }
        
        // Add keyboard event listeners
        this.setupKeyboardControls();
        
        // Make canvas responsive
        this.resizeCanvas();
        if (!this._boundResizeHandler) {
            this._boundResizeHandler = () => UI.resizeCanvas();
        }
        window.removeEventListener('resize', this._boundResizeHandler);
        window.addEventListener('resize', this._boundResizeHandler);
    },
    
    // Create difficulty bar UI element
    createDifficultyBar: function() {
        // Check if difficulty bar already exists
        if (document.getElementById('difficultyBar')) {
            this.difficultyBar = document.getElementById('difficultyBar');
            return;
        }
        
        // Create the difficulty bar container
        this.difficultyBar = document.createElement('div');
        this.difficultyBar.id = 'difficultyBar';
        this.difficultyBar.style.position = 'absolute';
        this.difficultyBar.style.top = '20px';
        this.difficultyBar.style.left = '20px';
        this.difficultyBar.style.color = '#00ffff';
        this.difficultyBar.style.fontSize = '16px';
        this.difficultyBar.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        this.difficultyBar.style.zIndex = '5';
        this.difficultyBar.style.display = 'flex';
        this.difficultyBar.style.flexDirection = 'column';
        this.difficultyBar.style.alignItems = 'flex-start';
        
        // Create the difficulty level text
        const difficultyText = document.createElement('div');
        difficultyText.id = 'difficultyText';
        difficultyText.textContent = 'Beginner';
        this.difficultyBar.appendChild(difficultyText);
        
        // Create the difficulty progress bar
        const difficultyProgress = document.createElement('div');
        difficultyProgress.id = 'difficultyProgress';
        difficultyProgress.style.width = '100px';
        difficultyProgress.style.height = '6px';
        difficultyProgress.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        difficultyProgress.style.borderRadius = '3px';
        difficultyProgress.style.marginTop = '5px';
        difficultyProgress.style.position = 'relative';
        difficultyProgress.style.overflow = 'hidden';
        
        const difficultyFill = document.createElement('div');
        difficultyFill.id = 'difficultyFill';
        difficultyFill.style.width = '0%';
        difficultyFill.style.height = '100%';
        difficultyFill.style.backgroundColor = '#00ffff';
        difficultyFill.style.position = 'absolute';
        difficultyFill.style.left = '0';
        difficultyFill.style.top = '0';
        difficultyFill.style.transition = 'width 0.5s ease-out';
        
        difficultyProgress.appendChild(difficultyFill);
        this.difficultyBar.appendChild(difficultyProgress);
        
        // Add to game screen
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.difficultyBar);
        }
    },
    
    // Update difficulty display
    updateDifficultyDisplay: function(difficultyIndex, score) {
        if (!this.difficultyBar) return;
        
        const difficulties = Config.DIFFICULTY_LEVELS;
        const currentDifficulty = difficulties[difficultyIndex];
        const nextDifficultyIndex = difficultyIndex + 1;
        
        // Update text
        const difficultyText = document.getElementById('difficultyText');
        if (difficultyText) {
            difficultyText.textContent = `${currentDifficulty.name}`;
        }
        
        // Update progress bar
        const difficultyFill = document.getElementById('difficultyFill');
        if (difficultyFill && nextDifficultyIndex < difficulties.length) {
            const nextDifficulty = difficulties[nextDifficultyIndex];
            const progressPercent = Math.min(
                ((score - currentDifficulty.score) / (nextDifficulty.score - currentDifficulty.score)) * 100,
                100
            );
            difficultyFill.style.width = `${progressPercent}%`;
        } else if (difficultyFill) {
            // At max difficulty, show full bar
            difficultyFill.style.width = '100%';
        }
    },
    
    // Setup keyboard controls
    setupKeyboardControls: function() {
        // Keyboard controls
        window.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };
        
        // Global keyboard event listener
        document.addEventListener('keydown', function(e) {
            // Easter egg: Press 'E' key for easter egg
            if (e.key === 'e' || e.key === 'E') {
                if (window.triggerAchievementEvent) {
                    window.triggerAchievementEvent('easterEgg', {});
                }
                return;
            }
            
            // Developer message: Press 'D' + 'E' + 'V' in sequence
            if (!UI.devSequence) UI.devSequence = [];
            if (e.key === 'd' || e.key === 'D') UI.devSequence = ['D'];
            else if ((e.key === 'e' || e.key === 'E') && UI.devSequence[0] === 'D') UI.devSequence = ['D', 'E'];
            else if ((e.key === 'v' || e.key === 'V') && UI.devSequence.length === 2) {
                if (window.triggerAchievementEvent) {
                    window.triggerAchievementEvent('developerMessage', {});
                }
                UI.devSequence = [];
                return;
            } else if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                UI.devSequence = [];
            }
            
            if (e.key === ' ' && Game.isGameOver()) {  // Check for space character
                console.log('Space bar pressed during game over');
                const gameOverScreen = document.getElementById('gameOverScreen');
                if (gameOverScreen && window.getComputedStyle(gameOverScreen).display !== 'none') {
                    console.log('Restarting game...');
                    Game.restart();
                }
            } else if (window.keys.hasOwnProperty(e.key)) {
                window.keys[e.key] = true;
                if (e.key === 'ArrowLeft') Player.moveLeft();
                if (e.key === 'ArrowRight') Player.moveRight();
            }
        });
        
        document.addEventListener('keyup', function(e) {
            if (window.keys.hasOwnProperty(e.key)) {
                window.keys[e.key] = false;
                if ((e.key === 'ArrowLeft' && !window.keys.ArrowRight) || 
                    (e.key === 'ArrowRight' && !window.keys.ArrowLeft)) {
                    Player.stopMove();
                }
            }
        });
    },
    
    // Make canvas responsive
    resizeCanvas: function() {
        const activeCanvas = this.canvas || window.canvas;
        if (!activeCanvas) return;
        
        // Get the game screen dimensions directly
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen) return;
        
        const gameScreenRect = gameScreen.getBoundingClientRect();
        
        // Safety check - if dimensions are zero, retry after a short delay
        if (gameScreenRect.width <= 0 || gameScreenRect.height <= 0) {
            console.warn('Game screen has invalid dimensions. Retrying resize in 100ms...');
            setTimeout(() => UI.resizeCanvas(), 100);
            return;
        }
        
        // Store the original dimensions before updating
        const originalWidth = activeCanvas.width;
        const originalHeight = activeCanvas.height;
        
        // Update both CSS and canvas dimensions to exactly match the game screen
        activeCanvas.style.width = `${gameScreenRect.width}px`;
        activeCanvas.style.height = `${gameScreenRect.height}px`;
        activeCanvas.width = gameScreenRect.width;
        activeCanvas.height = gameScreenRect.height;
        
        // Position canvas precisely within game screen with no offsets
        activeCanvas.style.position = 'absolute';
        activeCanvas.style.left = '0';
        activeCanvas.style.top = '0';
        activeCanvas.style.transform = 'none';
        activeCanvas.style.margin = '0';
        activeCanvas.style.padding = '0';
        
        console.log(`Canvas resized to match game screen - Dimensions: ${activeCanvas.width}x${activeCanvas.height}`);
        
        // Update game state and elements for the new canvas size
        if (typeof Game !== 'undefined' && Game.handleCanvasResize) {
            Game.handleCanvasResize(originalWidth, originalHeight, activeCanvas.width, activeCanvas.height);
        }
        
        // Make sure to reposition player if the game is running
        if (Player && Player.data) {
            // Ensure the player is repositioned at the bottom of the screen
            Player.resetPosition();
        }
    },
    
    // Update the shop UI with the current upgrades and powerups
    updateShopUI: function() {
        const shopContainer = document.getElementById('shopContainer');
        if (!shopContainer) return;
        
        // Update points display
        const shopPoints = document.getElementById('shopPoints');
        if (shopPoints && Wallet.walletPoints !== undefined) {
            shopPoints.textContent = Wallet.walletPoints;
        }
        
        // Clear existing content
        shopContainer.innerHTML = '';
        
        // Create upgrade section
        const upgradeSection = document.createElement('div');
        upgradeSection.className = 'shop-section';
        upgradeSection.innerHTML = `
            <h3>Upgrades</h3>
            <p class="shop-section-description">Permanent upgrades that make you stronger</p>
            <div class="shop-items" id="upgradeItems"></div>
        `;
        shopContainer.appendChild(upgradeSection);
        
        // Create upgrade items
        const upgradeItems = document.getElementById('upgradeItems');
        
        // Add player speed upgrade
        this.createUpgradeItem(
            upgradeItems,
            'playerSpeed',
            Shop.upgrades.playerSpeed.name,
            Shop.upgrades.playerSpeed.description,
            Shop.upgrades.playerSpeed.cost,
            Shop.userUpgrades.playerSpeed || 0,
            Shop.upgrades.playerSpeed.maxLevel,
            Shop.upgrades.playerSpeed.getEffectText(Shop.userUpgrades.playerSpeed || 0)
        );
        
        // Add player size upgrade
        this.createUpgradeItem(
            upgradeItems,
            'playerSize',
            Shop.upgrades.playerSize.name,
            Shop.upgrades.playerSize.description,
            Shop.upgrades.playerSize.cost,
            Shop.userUpgrades.playerSize || 0,
            Shop.upgrades.playerSize.maxLevel,
            Shop.upgrades.playerSize.getEffectText(Shop.userUpgrades.playerSize || 0)
        );
        
        // Create powerup section
        const powerupSection = document.createElement('div');
        powerupSection.className = 'shop-section';
        powerupSection.innerHTML = `
            <h3>Power-ups</h3>
            <p class="shop-section-description">Special abilities you can activate during gameplay</p>
            <div class="shop-powerup-info">Press <strong>SPACE</strong> on desktop or <strong>DOUBLE TAP</strong> on mobile to activate</div>
            <div class="shop-items" id="powerupItems"></div>
        `;
        shopContainer.appendChild(powerupSection);
        
        // Create powerup items
        const powerupItems = document.getElementById('powerupItems');
        
        // Add invincibility powerup
        this.createPowerupItem(
            powerupItems,
            'invincibility',
            Shop.powerups.invincibility.name,
            Shop.powerups.invincibility.description,
            Shop.powerups.invincibility.cost,
            Shop.userPowerups.invincibility || false,
            Shop.selectedPowerup === 'invincibility',
            `Duration: ${Shop.powerups.invincibility.duration/1000}s, Cooldown: ${Shop.powerups.invincibility.cooldown/1000}s`
        );
        
        // Update profile UI with selected powerup if available
        this.updateProfileWithSelectedPowerup();
    },
    
    // Create an upgrade item in the shop
    createUpgradeItem: function(container, id, name, description, cost, level, maxLevel, effect) {
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.dataset.id = id;
        
        const isMaxLevel = level >= maxLevel;
        const buttonClass = isMaxLevel ? 'shop-button-maxed' : 'shop-button';
        const buttonText = isMaxLevel ? 'MAX LEVEL' : `Buy - ${cost} Points`;
        
        item.innerHTML = `
            <div class="shop-item-header">
                <div class="shop-item-name">${name}</div>
                <div class="shop-item-level">Level ${level}/${maxLevel}</div>
            </div>
            <div class="shop-item-description">${description}</div>
            <div class="shop-item-effect">${effect}</div>
            <button class="${buttonClass}" ${isMaxLevel ? 'disabled' : ''} data-id="${id}">${buttonText}</button>
        `;
        
        container.appendChild(item);
        
        // Add click handler to the button
        const button = item.querySelector('button');
        if (button && !isMaxLevel) {
            button.addEventListener('click', () => {
                Shop.purchaseUpgrade(id);
            });
        }
    },
    
    // Create a powerup item in the shop
    createPowerupItem: function(container, id, name, description, cost, owned, selected, effect) {
        const item = document.createElement('div');
        item.className = 'shop-item' + (owned ? ' shop-item-owned' : '') + (selected ? ' shop-item-selected' : '');
        item.dataset.id = id;
        
        const buttonClass = owned ? 'shop-button-owned' : 'shop-button';
        const buttonText = owned ? (selected ? 'SELECTED' : 'Select') : `Buy - ${cost} Points`;
        
        item.innerHTML = `
            <div class="shop-item-header">
                <div class="shop-item-name">${name}</div>
                <div class="shop-item-icon">${Shop.powerups[id].icon}</div>
            </div>
            <div class="shop-item-description">${description}</div>
            <div class="shop-item-effect">${effect}</div>
            <button class="${buttonClass}" data-id="${id}">${buttonText}</button>
        `;
        
        container.appendChild(item);
        
        // Add click handler to the button
        const button = item.querySelector('button');
        if (button) {
            button.addEventListener('click', () => {
                if (owned) {
                    Shop.selectPowerup(id);
                } else {
                    Shop.purchasePowerup(id);
                }
            });
        }
    },
    
    // Update the profile UI with the selected powerup
    updateProfileWithSelectedPowerup: function() {
        const powerupDisplay = document.getElementById('profileSelectedPowerup');
        if (!powerupDisplay) return;
        
        if (Shop.selectedPowerup && Shop.powerups[Shop.selectedPowerup]) {
            const powerup = Shop.powerups[Shop.selectedPowerup];
            powerupDisplay.innerHTML = `
                <div class="selected-powerup">
                    <div class="selected-powerup-name">${powerup.name}</div>
                    <div class="selected-powerup-icon">${powerup.icon}</div>
                </div>
                <div class="selected-powerup-description">${powerup.description}</div>
                <div class="selected-powerup-controls">Press <strong>SPACE</strong> or <strong>double tap</strong> to use</div>
            `;
            powerupDisplay.style.display = 'block';
        } else {
            powerupDisplay.innerHTML = `
                <div class="no-powerup">No powerup selected</div>
                <div class="shop-link">Visit the shop to buy powerups</div>
            `;
            powerupDisplay.style.display = 'block';
        }
    },
    
    // Show a notification
    showNotification: function(message, duration = 3000) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        // Hide notification after duration
        this.notificationTimeout = setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    },
    
    // Show game over screen
    showGameOver: function(score, totalPoints) {
        console.log('Showing game over screen with score:', score);
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScoreElement = document.getElementById('finalScore');
        const totalPointsElement = document.getElementById('totalPoints');
        
        if (gameOverScreen && finalScoreElement) {
            // Ensure gameplay view is hidden underneath the overlay.
            if (this.gameScreen) {
                this.gameScreen.style.display = 'none';
            }

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
    
    // Show invincibility banner
    showInvincibilityBanner: function(active, duration = 3000) {
        if (active) {
            // Create or update in-game status indicator
            let statusIndicator = document.getElementById('invincibilityStatus');
            if (!statusIndicator) {
                statusIndicator = document.createElement('div');
                statusIndicator.id = 'invincibilityStatus';
                statusIndicator.style.position = 'absolute';
                statusIndicator.style.top = '60px';
                statusIndicator.style.right = '20px';
                statusIndicator.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
                statusIndicator.style.color = '#000000';
                statusIndicator.style.padding = '5px 10px';
                statusIndicator.style.borderRadius = '5px';
                statusIndicator.style.fontWeight = 'bold';
                statusIndicator.style.zIndex = '10';
                statusIndicator.style.boxShadow = '0 0 10px #FFD700';
                statusIndicator.style.transition = 'transform 0.2s ease';
                statusIndicator.style.transform = 'scale(1.1)';
                
                // Check if gameScreen exists before appending
                const gameScreen = document.getElementById('gameScreen');
                if (gameScreen) {
                    gameScreen.appendChild(statusIndicator);
                } else {
                    // Fallback to gameContainer if gameScreen doesn't exist
                    const gameContainer = document.getElementById('gameContainer');
                    if (gameContainer) {
                        gameContainer.appendChild(statusIndicator);
                    }
                }
                
                // Add visual pop effect
                setTimeout(() => {
                    if (statusIndicator) statusIndicator.style.transform = 'scale(1.0)';
                }, 200);
            }
            
            // Set initial status text with countdown
            const endTime = Date.now() + Shop.powerups.invincibility.duration;
            statusIndicator.innerHTML = '⚡ INVINCIBLE: 5s';
            
            // Update the countdown timer
            const updateTimer = setInterval(() => {
                const remaining = Math.ceil((endTime - Date.now()) / 1000);
                if (remaining > 0) {
                    statusIndicator.innerHTML = `⚡ INVINCIBLE: ${remaining}s`;
                } else {
                    clearInterval(updateTimer);
                }
            }, 1000);
            
            // Store the interval ID to clear it if needed
            statusIndicator.dataset.timerId = updateTimer;
            
            // Create radial glow effect on game screen
            let gameCanvas = document.getElementById('gameCanvas');
            if (gameCanvas) {
                gameCanvas.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.5) inset';
                gameCanvas.style.transition = 'box-shadow 0.3s ease';
            }
            
            // Add flash notification on screen
            this.showNotification('Invincibility activated!', 1500);
        } else {
            // Remove the in-game status indicator
            const statusIndicator = document.getElementById('invincibilityStatus');
            if (statusIndicator) {
                // Clear any existing interval
                if (statusIndicator.dataset.timerId) {
                    clearInterval(parseInt(statusIndicator.dataset.timerId));
                }
                statusIndicator.remove();
            }
            
            // Remove the glow effect
            let gameCanvas = document.getElementById('gameCanvas');
            if (gameCanvas) {
                gameCanvas.style.boxShadow = 'none';
            }
            
            // Create or update cooldown indicator
            this.updateCooldownTimer();
        }
    },
    
    // Update cooldown timer for invincibility
    updateCooldownTimer: function() {
        if (!Shop.powerups.invincibility || !Shop.userPowerups.invincibility) return;
        
        // Get cooldown information
        const now = Date.now();
        const lastUsed = Shop.powerups.invincibility.lastUsed;
        const cooldown = Shop.powerups.invincibility.cooldown;
        const remainingCooldown = Math.ceil((lastUsed + cooldown - now) / 1000);
        
        // Create or update cooldown indicator
        let cooldownIndicator = document.getElementById('invincibilityCooldown');
        
        if (remainingCooldown <= 0) {
            // Remove cooldown indicator if cooldown is over
            if (cooldownIndicator) {
                // Clear any existing interval
                if (cooldownIndicator.dataset.timerId) {
                    clearInterval(parseInt(cooldownIndicator.dataset.timerId));
                }
                cooldownIndicator.remove();
            }
            return;
        }
        
        if (!cooldownIndicator) {
            cooldownIndicator = document.createElement('div');
            cooldownIndicator.id = 'invincibilityCooldown';
            cooldownIndicator.style.position = 'absolute';
            cooldownIndicator.style.top = '60px';
            cooldownIndicator.style.right = '20px';
            cooldownIndicator.style.backgroundColor = 'rgba(100, 100, 100, 0.7)';
            cooldownIndicator.style.color = 'white';
            cooldownIndicator.style.padding = '5px 10px';
            cooldownIndicator.style.borderRadius = '5px';
            cooldownIndicator.style.fontWeight = 'bold';
            cooldownIndicator.style.zIndex = '10';
            
            // Check if gameScreen exists before appending
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen) {
                gameScreen.appendChild(cooldownIndicator);
            } else {
                // Fallback to gameContainer if gameScreen doesn't exist
                const gameContainer = document.getElementById('gameContainer');
                if (gameContainer) {
                    gameContainer.appendChild(cooldownIndicator);
                }
            }
        }
        
        // Set initial cooldown text
        cooldownIndicator.innerHTML = `⏱️ COOLDOWN: ${remainingCooldown}s`;
        
        // Clear existing interval if any
        if (cooldownIndicator.dataset.timerId) {
            clearInterval(parseInt(cooldownIndicator.dataset.timerId));
        }
        
        // Update the cooldown timer
        const updateCooldown = setInterval(() => {
            const current = Date.now();
            const remaining = Math.ceil((lastUsed + cooldown - current) / 1000);
            
            if (remaining > 0) {
                cooldownIndicator.innerHTML = `⏱️ COOLDOWN: ${remaining}s`;
            } else {
                clearInterval(updateCooldown);
                cooldownIndicator.remove();
                
                // Show notification that powerup is ready again
                this.showNotification('Invincibility ready! Double-tap to use', 2000);
            }
        }, 1000);
        
        // Store the interval ID to clear it if needed
        cooldownIndicator.dataset.timerId = updateCooldown;
    },
    
    // Show a visual tap indicator (for mobile double tap feedback)
    showTapIndicator: function(x, y) {
        // Create a tap indicator element if it doesn't exist
        let tapIndicator = document.createElement('div');
        tapIndicator.className = 'tap-indicator';
        
        // Style the tap indicator
        tapIndicator.style.position = 'absolute';
        tapIndicator.style.left = (x - 25) + 'px';
        tapIndicator.style.top = (y - 25) + 'px';
        tapIndicator.style.width = '50px';
        tapIndicator.style.height = '50px';
        tapIndicator.style.borderRadius = '50%';
        tapIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        tapIndicator.style.transform = 'scale(1)';
        tapIndicator.style.opacity = '1';
        tapIndicator.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        tapIndicator.style.pointerEvents = 'none';
        tapIndicator.style.zIndex = '1000';
        
        // Add to document
        document.body.appendChild(tapIndicator);
        
        // Animate and remove
        setTimeout(function() {
            tapIndicator.style.transform = 'scale(2)';
            tapIndicator.style.opacity = '0';
            
            setTimeout(function() {
                document.body.removeChild(tapIndicator);
            }, 300);
        }, 10);
    }
}; 

if (typeof window !== 'undefined') {
    window.UI = UI;
}