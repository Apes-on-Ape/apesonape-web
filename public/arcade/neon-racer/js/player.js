// Neon Racer - Player Module

const Player = {
    // Player state
    x: Config.PLAYER_X,
    y: Config.GAME_HEIGHT - 100,
    width: Config.PLAYER_WIDTH,
    height: Config.PLAYER_HEIGHT,
    speed: 0,
    isBoosting: false,
    isShielded: false,
    currentLane: 4, // Start in middle-right lane (lane 4 of 6)
    targetLane: 4,
    isMoving: false,
    lastLaneSwitch: 0,
    magnetRadius: 0,
    
    // Animation and visual properties
    glowSize: 0,
    glowAlpha: 0.7,
    pulseAmount: 0,
    pulseRate: 0,
    pulseValue: 0,
    color: '#ff00ff',
    
    // Car selection
    carType: 'default',
    carImages: {}, // Store loaded car images
    
    // Powerup timers
    shieldTimer: null,
    magnetTimer: null,
    
    // Upgrade levels (set by shop)
    speedLevel: 0,
    handlingLevel: 0,
    magnetLevel: 0,
    laneSwitchCooldown: 0,
    
    activePowerups: {},
    
    // Initialize player
    init: function() {
        this.reset();
        
        // Set initial speed
        this.speed = Config.CAR_SPEED;
        
        // Set visual properties
        this.glowSize = Config.CAR_GLOW_SIZE || 30;
        this.color = Config.CAR_GLOW_COLOR || '#ff00ff';
        this.pulseAmount = Config.PLAYER_PULSE_AMOUNT || 0.3;
        this.pulseRate = Config.PLAYER_PULSE_RATE || 0.05;
        this.pulseValue = 0;
        
        // Set initial powerup states
        this.isBoosting = false;
        this.isShielded = false;
        this.magnetRadius = 0;
        
        // Clear any existing timers
        this.clearPowerupTimers();
        
        // Load car images first
        this.loadCarImages();
        
        // Apply any purchased upgrades
        this.applyUpgrades();
        
        // Load selected car from localStorage
        const savedCar = localStorage.getItem('selectedCar');
        if (savedCar) {
            this.setCarType(savedCar);
        } else {
            this.setCarType('BlackOut');
        }
    },
    
    // Reset player
    reset: function() {
        this.x = Config.PLAYER_X;
        this.y = Config.GAME_HEIGHT - 100;
        this.currentLane = 4;
        this.targetLane = 4;
        this.isMoving = false;
        this.lastLaneSwitch = 0;
        this.activePowerups = {};
        
        // Reset speed
        this.speed = Config.CAR_SPEED;
        
        // Reset visual properties
        this.glowSize = Config.CAR_GLOW_SIZE || 30;
        this.color = Config.CAR_GLOW_COLOR || '#ff00ff';
        
        // Reset powerup states
        this.isBoosting = false;
        this.isShielded = false;
        this.magnetRadius = 0;
        
        // Clear any existing timers
        this.clearPowerupTimers();
        
        // Apply upgrades again
        this.applyUpgrades();
    },
    
    // Load car images
    loadCarImages: function() {
        // Available car types from assets/cars directory
        const carTypes = ['BlackOut', 'BlueStrip', 'GreenStrip', 'PinkStrip', 'RedStrip', 'WhiteStrip'];
        
        // Make sure we preload all images
        carTypes.forEach(type => {
            if (!this.carImages[type]) {
                const img = new Image();
                img.src = `assets/cars/${type}.png`;
                this.carImages[type] = img;
            }
        });
    },
    
    // Set car type
    setCarType: function(carType) {
        // Make sure the car type exists in our list
        if (!['BlackOut', 'BlueStrip', 'GreenStrip', 'PinkStrip', 'RedStrip', 'WhiteStrip'].includes(carType)) {
            carType = 'BlackOut';
        }
        
        this.carType = carType;
        
        // Make sure image is loaded 
        if (!this.carImages[carType] || !this.carImages[carType].complete) {
            const img = new Image();
            img.src = `assets/cars/${carType}.png`;
            this.carImages[carType] = img;
        }
        
        // Update car appearance based on type
        switch(carType) {
            case 'BlueStrip':
                this.color = '#00aaff';
                break;
            case 'GreenStrip':
                this.color = '#00ff66';
                break;
            case 'PinkStrip':
                this.color = '#ff66ff';
                break;
            case 'RedStrip':
                this.color = '#ff3300';
                break;
            case 'WhiteStrip':
                this.color = '#ffffff';
                break;
            case 'BlackOut':
                this.color = '#ff00ff';
                break;
            default:
                this.color = '#ff00ff';
                break;
        }
        
        // Show notification
        if (typeof UI !== 'undefined' && UI.showNotification) {
            // Use the friendly name for the notification
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
            UI.showNotification(`Selected ${carFriendlyName}!`, 2000);
        }
        
        // Save selection to localStorage
        localStorage.setItem('selectedCar', carType);
    },
    
    // Load selected car from localStorage
    loadSelectedCar: function() {
        const savedCar = localStorage.getItem('selectedCar');
        if (savedCar && this.carImages[savedCar]) {
            this.setCarType(savedCar);
        } else {
            // Set default car if no saved car or if saved car doesn't exist
            this.setCarType('BlackOut');
        }
    },
    
    // Check if an item is in magnet range
    isInMagnetRange: function(item) {
        if (this.magnetRadius <= 0) return false;
        
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.magnetRadius + this.width/2;
    },
    
    // Apply purchased upgrades from the shop
    applyUpgrades: function() {
        // Applying player upgrades
        
        if (typeof Shop !== 'undefined' && Shop) {
            // Apply speed upgrade - increases base car speed
            const speedLevel = Shop.getUpgradeLevel('SPEED');
            if (speedLevel > 0) {
                const speedIncrease = Config.UPGRADES.SPEED.effect * speedLevel;
                this.speed = Config.CAR_SPEED * (1 + speedIncrease);
                console.log(`Speed upgrade applied: Level ${speedLevel}, Speed: ${this.speed.toFixed(2)} (${(speedIncrease * 100).toFixed(0)}% increase)`);
            } else {
                this.speed = Config.CAR_SPEED;
            }
            
            // Apply handling upgrade - reduces lane switching cooldown
            const handlingLevel = Shop.getUpgradeLevel('HANDLING');
            if (handlingLevel > 0) {
                this.handlingLevel = handlingLevel;
                // Calculate reduced cooldown (15% reduction per level)
                const reductionPercent = Config.UPGRADES.HANDLING.effect * handlingLevel;
                this.laneSwitchCooldown = Config.LANE_SWITCH_COOLDOWN * (1 - reductionPercent);
                console.log(`Handling upgrade applied: Level ${handlingLevel}, Cooldown: ${this.laneSwitchCooldown.toFixed(0)}ms (${(reductionPercent * 100).toFixed(0)}% reduction)`);
            } else {
                this.handlingLevel = 0;
                this.laneSwitchCooldown = Config.LANE_SWITCH_COOLDOWN;
            }
            
            // Apply magnet upgrade - increases coin attraction radius
            const magnetLevel = Shop.getUpgradeLevel('MAGNET');
            if (magnetLevel > 0) {
                this.magnetRadius = magnetLevel * Config.UPGRADES.MAGNET.effect;
                console.log(`Magnet upgrade applied: Level ${magnetLevel}, Radius: ${this.magnetRadius}px`);
            } else {
                this.magnetRadius = 0;
            }
            
            // Check for shield powerup availability
            const hasShield = Shop.hasUpgrade('INVINCIBILITY');
            
        } else {
            this.speed = Config.CAR_SPEED;
            this.handlingLevel = 0;
            this.magnetRadius = 0;
            this.laneSwitchCooldown = Config.LANE_SWITCH_COOLDOWN;
        }
    },
    
    // Handle key press events
    handleKeyDown: function(event) {
        if (this.isMoving) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastLaneSwitch < Config.LANE_SWITCH_COOLDOWN) return;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
                if (this.currentLane > 0) {
                    this.targetLane = this.currentLane - 1;
                    this.isMoving = true;
                    this.lastLaneSwitch = currentTime;
                    Sound.playLaneSwitchSound();
                }
                break;
                
            case 'ArrowRight':
            case 'd':
                if (this.currentLane < Config.LANE_COUNT - 1) {
                    this.targetLane = this.currentLane + 1;
                    this.isMoving = true;
                    this.lastLaneSwitch = currentTime;
                    Sound.playLaneSwitchSound();
                }
                break;
        }
    },
    
    // Handle key release events
    handleKeyUp: function(event) {
        // Nothing to do on key up
    },
    
    // Handle touch events for mobile
    handleTouchStart: function(event) {
        if (this.isMoving) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastLaneSwitch < Config.LANE_SWITCH_COOLDOWN) return;
        
        const touch = event.touches[0];
        const touchX = touch.clientX;
        const screenCenter = window.innerWidth / 2;
        
        if (touchX < screenCenter) {
            // Move left
            if (this.currentLane > 0) {
                this.targetLane = this.currentLane - 1;
                this.isMoving = true;
                this.lastLaneSwitch = currentTime;
                Sound.playLaneSwitchSound();
            }
        } else {
            // Move right
            if (this.currentLane < Config.LANE_COUNT - 1) {
                this.targetLane = this.currentLane + 1;
                this.isMoving = true;
                this.lastLaneSwitch = currentTime;
                Sound.playLaneSwitchSound();
            }
        }
    },
    
    // Handle touch end events for mobile
    handleTouchEnd: function(event) {
        // Nothing to do on touch end
    },
    
    // Move the player
    move: function(direction, delta) {
        if (this.isMoving) return;
        
        const currentTime = Date.now();
        // Use the upgraded cooldown if available, otherwise use config default
        const cooldown = this.laneSwitchCooldown || Config.LANE_SWITCH_COOLDOWN;
        if (currentTime - this.lastLaneSwitch < cooldown) return;
        
        // Calculate target lane based on direction
        let targetLane = this.currentLane;
        
        if (direction === 'left' && this.currentLane > 0) {
            targetLane = this.currentLane - 1;
        } else if (direction === 'right' && this.currentLane < Config.LANE_COUNT - 1) {
            targetLane = this.currentLane + 1;
        } else {
            return; // Invalid move
        }
        
        // Update lanes and movement state
        this.targetLane = targetLane;
        this.isMoving = true;
        this.lastLaneSwitch = currentTime;
    },
    
    // Apply boost from collected neon bricks
    applyBrickBoost: function(boostAmount) {
        // If already boosting from bricks, clear the timer
        if (this.brickBoostTimer) {
            clearTimeout(this.brickBoostTimer);
        }
        
        // Apply the boost
        this.isBoosting = true;
        
        // Create boost effect
        Effects.createBoostEffect(this.x, this.y + this.height / 2);
        
        // Set timer to remove boost after duration
        this.brickBoostTimer = setTimeout(() => {
            this.isBoosting = false;
            this.brickBoostTimer = null;
        }, Config.NEON_BRICK_BOOST_DURATION);
    },
    
    // Update player position and state
    update: function(delta) {
        // Update lane position with smoother interpolation
        if (this.isMoving) {
            const targetX = Config.getLanePosition(this.targetLane);
            const moveSpeed = Config.PLAYER_LERP_SPEED * delta;
            
            // Move towards target position
            if (Math.abs(this.x - targetX) > 1) {
                this.x += (targetX - this.x) * moveSpeed;
            } else {
                // Reached target position
                this.x = targetX;
                this.currentLane = this.targetLane;
                this.isMoving = false;
            }
        }
        
        // Update visual effects
        this.updateVisuals(delta);
        
        // Update powerup timers
        this.updatePowerups(delta);
    },
    
    // Update visual effects
    updateVisuals: function(delta) {
        // Update pulse animation
        this.pulseValue += this.pulseRate;
        if (this.pulseValue > Math.PI * 2) {
            this.pulseValue -= Math.PI * 2;
        }
        
        // Create new trail particles behind car
        if (MainGame.frameCount % 2 === 0) {
            // Choose trail color based on state
            let trailColor = this.color;
            
            if (this.isShielded) {
                trailColor = '#00ffff'; // Cyan for shield
            } else if (this.isBoosting) {
                trailColor = '#ffff00'; // Yellow for boost
            }
            
            // Create trail effect
            if (typeof Effects !== 'undefined' && Effects.createTrailEffect) {
                Effects.createTrailEffect(
                    this.x, 
                    this.y + this.height / 2,
                    trailColor
                );
            }
        }
        
        // Apply magnet effect if active
        if (this.magnetRadius > 0) {
            if (typeof Items !== 'undefined') {
                Items.applyMagnet(1.0);
            }
        }
    },
    
    // Switch lanes
    switchLane: function(direction) {
        if (this.laneSwitchCooldown > 0) return;
        
        const newLane = this.currentLane + direction;
        if (newLane >= 0 && newLane < Config.LANE_COUNT) {
            this.currentLane = newLane;
            this.laneSwitchCooldown = Config.LANE_SWITCH_COOLDOWN;
            Sound.playSound('crash'); // Keep crash sound for lane switching
        }
    },
    
    // Draw the player
    draw: function(ctx) {
        // Ensure coordinates are valid numbers and finite
        const x = isFinite(this.x) ? Math.max(0, Math.min(this.x, Config.GAME_WIDTH)) : Config.PLAYER_X;
        const y = isFinite(this.y) ? Math.max(0, Math.min(this.y, Config.GAME_HEIGHT)) : Config.GAME_HEIGHT - 100;
        
        // Ensure glowSize is a valid number
        const glowSize = isFinite(this.glowSize) ? this.glowSize : 30;
        
        // Draw car glow effect
        const gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, glowSize
        );
        
        // Enhanced glow effect
        gradient.addColorStop(0, this.color || '#ff00ff');
        gradient.addColorStop(0.3, `${this.color || '#ff00ff'}80`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Save the current context state
        ctx.save();
        
        // Translate to the car's position
        ctx.translate(x, y);
        
        // Rotate 90 degrees anticlockwise (convert to radians)
        ctx.rotate(-Math.PI / 2);
        
        // Draw car image if available
        if (this.carImages[this.carType] && this.carImages[this.carType].complete) {
            // Calculate dimensions to maintain aspect ratio
            const img = this.carImages[this.carType];
            const aspectRatio = img.width / img.height;
            const drawWidth = this.width;
            const drawHeight = drawWidth / aspectRatio;
            
            // Draw car with shadow
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.drawImage(
                img,
                -drawWidth/2,
                -drawHeight/2,
                drawWidth,
                drawHeight
            );
            
            // Reset shadow
            ctx.shadowBlur = 0;
        } else {
            // Fallback car shape with enhanced styling
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            // Draw car body
            ctx.beginPath();
            ctx.roundRect(
                -this.width/2,
                -this.height/2,
                this.width,
                this.height,
                5
            );
            ctx.fill();
            ctx.stroke();
            
            // Draw windows
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(
                -this.width/3,
                -this.height/3,
                this.width * 2/3,
                this.height/4,
                3
            );
            ctx.fill();
        }
        
        // Restore the context state
        ctx.restore();
        
        // Draw star power shield effect if active
        if (this.isShielded) {
            const time = Date.now() / 100; // Animation speed
            
            // Draw rainbow aura with pulsing effect
            const pulse = Math.sin(time / 5) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
            const auraSize = this.width * 1.2 * pulse;
            
            // Create rainbow gradient
            const rainbowGradient = ctx.createRadialGradient(
                x, y, this.width * 0.5,
                x, y, auraSize
            );
            
            // Rainbow colors cycling through
            const hue = (time * 5) % 360;
            rainbowGradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.6)`);
            rainbowGradient.addColorStop(0.3, `hsla(${(hue + 120) % 360}, 100%, 50%, 0.4)`);
            rainbowGradient.addColorStop(0.6, `hsla(${(hue + 240) % 360}, 100%, 50%, 0.3)`);
            rainbowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = rainbowGradient;
            ctx.beginPath();
            ctx.arc(x, y, auraSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw rotating sparkles around the player
            for (let i = 0; i < 8; i++) {
                const sparkleAngle = (time + i * 45) * Math.PI / 180;
                const sparkleRadius = this.width * 0.9;
                const sparkleX = x + Math.cos(sparkleAngle) * sparkleRadius;
                const sparkleY = y + Math.sin(sparkleAngle) * sparkleRadius;
                
                // Draw star sparkle
                ctx.fillStyle = `hsla(${(hue + i * 45) % 360}, 100%, 70%, 0.8)`;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw sparkle lines for star effect
                ctx.strokeStyle = `hsla(${(hue + i * 45) % 360}, 100%, 90%, 0.6)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sparkleX - 5, sparkleY);
                ctx.lineTo(sparkleX + 5, sparkleY);
                ctx.moveTo(sparkleX, sparkleY - 5);
                ctx.lineTo(sparkleX, sparkleY + 5);
                ctx.stroke();
            }
            
            // Draw invincibility border
            ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.8)`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, this.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw boost effect if active
        if (this.isBoosting) {
            const boostGlow = ctx.createRadialGradient(
                x, y + this.height/2,
                0,
                x, y + this.height/2,
                this.width
            );
            boostGlow.addColorStop(0, '#ff3300');
            boostGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = boostGlow;
            ctx.beginPath();
            ctx.arc(x, y + this.height/2, this.width, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw magnet effect if active
        if (this.magnetRadius > 0) {
            const magnetGlow = ctx.createRadialGradient(
                x, y,
                0,
                x, y,
                this.magnetRadius
            );
            magnetGlow.addColorStop(0, 'rgba(255, 255, 0, 0.1)');
            magnetGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = magnetGlow;
            ctx.beginPath();
            ctx.arc(x, y, this.magnetRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw magnet field lines
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                ctx.beginPath();
                ctx.moveTo(
                    x + Math.cos(angle) * this.width/2,
                    y + Math.sin(angle) * this.height/2
                );
                ctx.lineTo(
                    x + Math.cos(angle) * this.magnetRadius,
                    y + Math.sin(angle) * this.magnetRadius
                );
                ctx.stroke();
            }
        }
        
        // Draw active powerup indicators
        let powerupY = this.y - this.height / 2 - 20;
        for (const [type, powerup] of Object.entries(this.activePowerups)) {
            const remainingTime = (powerup.duration - (Date.now() - powerup.startTime)) / 1000;
            const width = (remainingTime / (powerup.duration / 1000)) * 30;
            
            ctx.fillStyle = type === 'boost' ? '#ffff00' : '#00ffff';
            ctx.fillRect(
                this.x - 15,
                powerupY,
                width,
                5
            );
            
            powerupY -= 10;
        }
    },
    
    // Check collision with an object
    collidesWith: function(object) {
        // No collisions while shielded
        if (this.isShielded) return false;
        
        // Calculate collision box (slightly smaller than visual car)
        const carLeft = this.x - this.width / 2.5;
        const carRight = this.x + this.width / 2.5;
        const carTop = this.y - this.height / 2.5;
        const carBottom = this.y + this.height / 2.5;
        
        // Calculate object box
        const objLeft = object.x - object.width / 2;
        const objRight = object.x + object.width / 2;
        const objTop = object.y - object.height / 2;
        const objBottom = object.y + object.height / 2;
        
        // Check for intersection
        return (
            carLeft < objRight &&
            carRight > objLeft &&
            carTop < objBottom &&
            carBottom > objTop
        );
    },
    
    // Hit an obstacle
    hitObstacle: function(obstacleType, speedModifier) {
        // Reduce speed based on obstacle
        if (!this.isShielded) {
            // Game over unless shielded
            Game.endGame();
        } else {
            // Shield protects from obstacle
            this.deactivateShield();
            
            // Show notification
            UI.showNotification('Shield absorbed damage!', 2000);
            
            // Play shield hit sound
            Sound.playSoundSafely('item_special');
        }
    },
    
    // Clear all powerup timers
    clearPowerupTimers: function() {
        if (this.shieldTimer) clearTimeout(this.shieldTimer);
        if (this.magnetTimer) clearTimeout(this.magnetTimer);
        
        this.shieldTimer = null;
        this.magnetTimer = null;
    },
    
    // Apply oil effect (temporary handling reduction)
    applyOilEffect: function() {
        const savedHandling = this.handlingLevel;
        this.handlingLevel = Math.max(0, this.handlingLevel - 2);
        
        // Create visual effect
        Effects.createSmokeEffect(this.x, this.y);
        
        // Restore after delay
        setTimeout(() => {
            this.handlingLevel = savedHandling;
            UI.showNotification('Handling restored', 1000);
        }, 3000);
    },
    
    // Apply barrier effect (significant slowdown)
    applyBarrierEffect: function() {
        // Slow down track
        Track.setSpeed(Track.speed * 0.5);
        
        // Drop a gear if possible
        if (this.currentGear > 1 && !this.isShifting) {
            this.shiftGear('down');
        }
    },
    
    // Apply debris effect (minor slowdown)
    applyDebrisEffect: function() {
        // Slight slowdown
        Track.setSpeed(Track.speed * 0.8);
        
        // Reduce RPM
        this.rpm = Math.max(Config.RPM_MIN, this.rpm * 0.7);
    },
    
    // Activate shield powerup
    activateShield: function() {
        // Check if already shielded
        if (this.isShielded) return false;
        
        // Check if player has the shield upgrade
        if (typeof Shop === 'undefined' || !Shop.hasUpgrade('INVINCIBILITY')) {
            return false;
        }
        
        // Activate shield
        this.isShielded = true;
        
        // Show notification
        if (typeof UI !== 'undefined') {
            UI.showNotification('Shield activated!', 2000);
        }
        
        // Clear any existing shield timer
        if (this.shieldTimer) {
            clearTimeout(this.shieldTimer);
        }
        
        // Set timer to deactivate shield
        this.shieldTimer = setTimeout(() => {
            this.deactivateShield();
        }, Config.UPGRADES.INVINCIBILITY.duration);
        
        return true;
    },
    
    // Deactivate shield
    deactivateShield: function() {
        this.isShielded = false;
        this.shieldTimer = null;
        
        // Show notification
        if (typeof UI !== 'undefined') {
            UI.showNotification('Star power ended', 1500);
        }
    },

    setCar: function(carId) {
        // Update car appearance based on selection
        switch(carId) {
            case 'sports':
                this.color = '#00ff00';
                this.width = Config.PLAYER_WIDTH * 0.9;  // Slightly smaller
                this.height = Config.PLAYER_HEIGHT * 0.9;
                break;
            case 'luxury':
                this.color = '#0000ff';
                this.width = Config.PLAYER_WIDTH * 1.1;  // Slightly larger
                this.height = Config.PLAYER_HEIGHT * 1.1;
                break;
            default:  // default car
                this.color = '#ff0000';
                this.width = Config.PLAYER_WIDTH;
                this.height = Config.PLAYER_HEIGHT;
        }
        
        // Save selected car
        this.selectedCar = carId;
        localStorage.setItem('selectedCar', carId);
    },
    
    activatePowerup: function(type, duration) {
        this.activePowerups[type] = {
            startTime: Date.now(),
            duration: duration
        };
        
        // Apply powerup effects
        switch (type) {
            case 'shield':
                this.isShielded = true;
                UI.showNotification('⭐ STAR POWER! Destroy obstacles! ⭐', 2500);
                
                // Clear any existing shield timer
                if (this.shieldTimer) {
                    clearTimeout(this.shieldTimer);
                }
                
                // Set timer to deactivate shield
                this.shieldTimer = setTimeout(() => {
                    this.deactivateShield();
                }, duration);
                break;
            case 'boost':
                this.isBoosting = true;
                UI.showNotification('Speed boost activated!', 2000);
                break;
            case 'magnet':
                this.magnetRadius = 100; // Large magnet radius
                UI.showNotification('Coin magnet activated!', 2000);
                
                // Clear any existing magnet timer
                if (this.magnetTimer) {
                    clearTimeout(this.magnetTimer);
                }
                
                // Set timer to deactivate magnet
                this.magnetTimer = setTimeout(() => {
                    this.magnetRadius = 0;
                    UI.showNotification('Coin magnet deactivated', 1500);
                }, duration);
                break;
        }
    },
    
    updatePowerups: function() {
        const currentTime = Date.now();
        
        for (const [type, powerup] of Object.entries(this.activePowerups)) {
            if (currentTime - powerup.startTime > powerup.duration) {
                // Remove expired powerup
                delete this.activePowerups[type];
                
                // Remove powerup effects
                switch (type) {
                    case 'boost':
                        this.isBoosting = false;
                        UI.showNotification('Speed boost ended', 1500);
                        break;
                    case 'shield':
                        // Shield deactivation is handled by timer in activatePowerup
                        break;
                    case 'magnet':
                        // Magnet deactivation is handled by timer in activatePowerup
                        break;
                }
            }
        }
    },

    handleCollision: function() {
        if (this.isShielded) {
            Sound.playSound('crash');
            return false;
        }
        
        if (this.isInvincible) {
            return false;
        }
        
        Sound.playSound('crash');
        return true;
    }
};