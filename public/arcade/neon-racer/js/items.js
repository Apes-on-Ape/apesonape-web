// Neon Racer - Items System

const Items = {
    items: [],
    lastSpawnTime: 0,
    warnings: [], // Track upcoming car warnings (both directions)
    gameStartTime: 0, // Track game start for progressive difficulty
    apecoinImage: null, // Apecoin image for ultra-rare coins
    
    init: function() {
        this.items = [];
        this.lastSpawnTime = 0;
        this.warnings = [];
        this.gameStartTime = Date.now();
        this.loadApecoinImage();
    },
    
    reset: function() {
        this.items = [];
        this.lastSpawnTime = 0;
        this.warnings = [];
        this.gameStartTime = Date.now();
        // Keep the loaded image
    },
    
    loadApecoinImage: function() {
        this.apecoinImage = new Image();
        this.apecoinImage.onload = () => {
            // Image loaded successfully
        };
        this.apecoinImage.onerror = () => {
            console.warn('Failed to load apecoin image, will use fallback emoji');
        };
        this.apecoinImage.src = 'assets/coin/apecoin.png';
    },
    
    update: function(delta, speed) {
        // Update warnings and spawn cars when ready
        this.updateWarnings();
        
        // Update existing items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            
            if (item.type === 'traffic_car') {
                // Traffic cars move at their own speed
                if (item.direction === 'oncoming') {
                    // Oncoming cars move downward (toward player)
                    item.y -= item.speed;
                    // Remove when off screen (top)
                    if (item.y < -100) {
                        this.items.splice(i, 1);
                        continue;
                    }
                } else {
                    // Same direction cars move with track speed plus their own speed
                    item.y += speed + item.speed;
                    // Remove when off screen (bottom)
                    if (item.y > Config.GAME_HEIGHT + 100) {
                        this.items.splice(i, 1);
                        continue;
                    }
                }
            } else {
                // Regular items move with track speed
                item.y += speed;
            
            // Only remove items that are off screen
            if (item.y > Config.GAME_HEIGHT + Config.COIN_SIZE) {
                this.items.splice(i, 1);
                    continue;
                }
            }
            
            // Update rotation for obstacles
            if (item.type === 'obstacle') {
                item.rotation += item.rotationSpeed;
            }
        }
    },
    
    spawnItems: function(delta, trackSpeed, difficulty) {
        const currentTime = Date.now();
        
        // Get progressive spawn rate - faster spawning as game progresses
        const spawnRate = this.getAdjustedSpawnRate();
        const difficultyData = this.getCurrentDifficultyData();
        
        if (currentTime - this.lastSpawnTime >= spawnRate) {
            this.lastSpawnTime = currentTime;
            
            // Randomly decide what to spawn with difficulty-adjusted probabilities
            const spawnType = Math.random();
            
            // Base probabilities adjusted by difficulty
            const coinChance = 0.30; // 30% base chance for coins
            const trafficChance = 0.20 * difficultyData.trafficDensity; // Traffic increases with difficulty
            const obstacleChance = difficultyData.obstacleChance; // Obstacle chance from difficulty data
            const powerupChance = 0.08; // 8% chance for powerups
            
            // Normalize probabilities to ensure they add up correctly
            const totalBase = coinChance + trafficChance + obstacleChance + powerupChance;
            const coinThreshold = coinChance / totalBase;
            const trafficThreshold = coinThreshold + (trafficChance / totalBase);
            const obstacleThreshold = trafficThreshold + (obstacleChance / totalBase);
            
            if (spawnType < coinThreshold) {
                this.spawnCoinColumn();
            } else if (spawnType < trafficThreshold) {
                this.spawnTrafficCar();
            } else if (spawnType < obstacleThreshold) {
                this.spawnObstacle();
            } else {
                this.spawnPowerup();
            }
        }
    },
    
    spawnCoinColumn: function() {
        // Choose a random lane
        const lane = Math.floor(Math.random() * Config.LANE_COUNT);
        const laneX = Config.getLanePosition(lane);
        
        // Random number of coins between 1 and 8 (reduced from 10)
        const numCoins = Math.floor(Math.random() * 8) + 1;
        
        // Spawn coins in a column with smaller gaps
        for (let i = 0; i < numCoins; i++) {
            // Determine coin type (three tiers)
            const coinRoll = Math.random();
            let coinType, coinValue, coinEmoji, isRare, isDiamond, isUltraRare;
            
            if (coinRoll < Config.RARE_COIN_CHANCE) {
                // Ultra-rare apecoin (5% chance, 150 points)
                coinType = 'ultra_rare';
                coinValue = Config.RARE_COIN_VALUE;
                coinEmoji = '🦍'; // Fallback emoji if image fails
                isRare = false;
                isDiamond = false;
                isUltraRare = true;

            } else if (coinRoll < Config.RARE_COIN_CHANCE + Config.DIAMOND_COIN_CHANCE) {
                // Diamond coin (10% chance, 50 points)
                coinType = 'diamond';
                coinValue = Config.DIAMOND_COIN_VALUE;
                coinEmoji = Config.DIAMOND_COIN_EMOJI;
                isRare = false;
                isDiamond = true;
                isUltraRare = false;
            } else {
                // Regular coin (85% chance, 10 points)
                coinType = 'regular';
                coinValue = Config.COIN_VALUE;
                coinEmoji = Config.COIN_EMOJI;
                isRare = false;
                isDiamond = false;
                isUltraRare = false;
            }
            
            this.items.push({
                type: 'coin',
                x: laneX,
                y: -i * (Config.COIN_GAP * 0.8), // Reduced gap between coins
                width: Config.COIN_SIZE,
                height: Config.COIN_SIZE,
                value: coinValue,
                emoji: coinEmoji,
                coinType: coinType,
                isRare: isRare,
                isDiamond: isDiamond,
                isUltraRare: isUltraRare,
                collected: false
            });
        }
    },
    
    spawnTrafficCar: function() {
        // Get progressive difficulty modifiers
        const difficultyData = this.getCurrentDifficultyData();
        
        // Increase oncoming car probability with difficulty level
        const oncomingChance = 0.5 + (difficultyData.level * 0.05); // 50% to 90% based on difficulty level
        const isOncoming = Math.random() < oncomingChance;
        
        if (isOncoming) {
            // For oncoming cars, create a warning first
            this.createOncomingWarning();
        } else {
            // For same-direction cars, also create a warning now
            this.createSameDirectionWarning();
        }
    },
    
    createOncomingWarning: function() {
        // Choose a random oncoming lane
        const lane = Config.ONCOMING_LANES[Math.floor(Math.random() * Config.ONCOMING_LANES.length)];
        const laneX = Config.getLanePosition(lane);
        
        // Create warning object
        this.warnings.push({
            lane: lane,
            laneX: laneX,
            startTime: Date.now(),
            duration: Config.ONCOMING_WARNING_TIME,
            type: 'oncoming'
        });
    },
    
    createSameDirectionWarning: function() {
        // Choose a random same-direction lane
        const lane = Config.SAME_DIRECTION_LANES[Math.floor(Math.random() * Config.SAME_DIRECTION_LANES.length)];
        const laneX = Config.getLanePosition(lane);
        
        // Create warning object
        this.warnings.push({
            lane: lane,
            laneX: laneX,
            startTime: Date.now(),
            duration: Config.SAME_DIRECTION_WARNING_TIME,
            type: 'same_direction'
        });
    },
    
    spawnSameDirectionCar: function() {
        // Spawn in right lanes (same direction)
        const lane = Config.SAME_DIRECTION_LANES[Math.floor(Math.random() * Config.SAME_DIRECTION_LANES.length)];
        const laneX = Config.getLanePosition(lane);
        const carSpeed = Config.SAME_DIRECTION_CAR_SPEED;
        
        // Choose random car color
        const carColors = ['#ff3333', '#3333ff', '#33ff33', '#ffff33', '#ff33ff', '#33ffff'];
        const carColor = carColors[Math.floor(Math.random() * carColors.length)];
        
        this.items.push({
            type: 'traffic_car',
            x: laneX,
            y: -60, // Start position above screen
            width: 40,
            height: 80,
            color: carColor,
            speed: carSpeed,
            direction: 'same',
            lane: lane
        });
    },
    
    spawnOncomingCarAfterWarning: function(lane, laneX) {
        // Choose random car color
        const carColors = ['#ff3333', '#3333ff', '#33ff33', '#ffff33', '#ff33ff', '#33ffff'];
        const carColor = carColors[Math.floor(Math.random() * carColors.length)];
        
        // Apply progressive difficulty to car speed
        const difficultyData = this.getCurrentDifficultyData();
        const carSpeed = Math.min(Config.ONCOMING_CAR_SPEED * difficultyData.speedMultiplier, Config.MAX_ONCOMING_CAR_SPEED);
        
        this.items.push({
            type: 'traffic_car',
            x: laneX,
            y: Config.GAME_HEIGHT + 60, // Start position below screen (oncoming)
            width: 40,
            height: 80,
            color: carColor,
            speed: carSpeed,
            direction: 'oncoming',
            lane: lane
        });
    },
    
    spawnSameDirectionCarAfterWarning: function(lane, laneX) {
        // Choose random car color
        const carColors = ['#ff3333', '#3333ff', '#33ff33', '#ffff33', '#ff33ff', '#33ffff'];
        const carColor = carColors[Math.floor(Math.random() * carColors.length)];
        
        // Apply progressive difficulty to car speed
        const difficultyData = this.getCurrentDifficultyData();
        const carSpeed = Math.min(Config.SAME_DIRECTION_CAR_SPEED * difficultyData.speedMultiplier, Config.MAX_SAME_DIRECTION_CAR_SPEED);
        
        this.items.push({
            type: 'traffic_car',
            x: laneX,
            y: -60, // Start position above screen (same direction)
            width: 40,
            height: 80,
            color: carColor,
            speed: carSpeed,
            direction: 'same',
            lane: lane
        });
    },
    
    updateWarnings: function() {
        const currentTime = Date.now();
        
        // Check warnings and spawn cars when time is up
        for (let i = this.warnings.length - 1; i >= 0; i--) {
            const warning = this.warnings[i];
            
            if (currentTime - warning.startTime >= warning.duration) {
                // Spawn the appropriate car type
                if (warning.type === 'oncoming') {
                    this.spawnOncomingCarAfterWarning(warning.lane, warning.laneX);
                } else {
                    this.spawnSameDirectionCarAfterWarning(warning.lane, warning.laneX);
                }
                
                // Remove the warning
                this.warnings.splice(i, 1);
            }
        }
    },
    
    spawnObstacle: function() {
        // Decide whether to spawn in left or right lanes
        const spawnInLeftLanes = Math.random() < 0.3; // 30% chance for left lanes
        const availableLanes = spawnInLeftLanes ? Config.ONCOMING_LANES : Config.SAME_DIRECTION_LANES;
        
        // 45% chance to spawn multiple obstacles (increased difficulty)
        if (Math.random() < 0.45) {
            // Spawn 2 obstacles in different lanes, leaving one lane free
            const lanesForObstacles = [...availableLanes]; // Copy array
            const freeLane = Math.floor(Math.random() * lanesForObstacles.length); // Randomly select one lane to keep free
            lanesForObstacles.splice(freeLane, 1); // Remove the free lane from available lanes
            
            // Spawn obstacles in the remaining two lanes
            lanesForObstacles.forEach((lane, index) => {
                const laneX = Config.getLanePosition(lane);
                const obstacleType = Config.OBSTACLE_TYPES[Math.floor(Math.random() * Config.OBSTACLE_TYPES.length)];
                
                this.items.push({
                    type: 'obstacle',
                    x: laneX,
                    y: -Config.OBSTACLE_HEIGHT - (index * 50), // Stagger obstacles vertically
                    width: obstacleType.width,
                    height: obstacleType.height,
                    color: obstacleType.color,
                    rotation: 0,
                    rotationSpeed: obstacleType.rotationSpeed * 1.5,
                    obstacleType: obstacleType.type
                });
            });
        } else {
            // Single obstacle spawn - randomly choose one lane
            const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            const laneX = Config.getLanePosition(lane);
            const obstacleType = Config.OBSTACLE_TYPES[Math.floor(Math.random() * Config.OBSTACLE_TYPES.length)];
            
            this.items.push({
                type: 'obstacle',
                x: laneX,
                y: -Config.OBSTACLE_HEIGHT,
                width: obstacleType.width,
                height: obstacleType.height,
                color: obstacleType.color,
                rotation: 0,
                rotationSpeed: obstacleType.rotationSpeed * 1.5,
                obstacleType: obstacleType.type
            });
        }
    },
    
    spawnPowerup: function() {
        // Only spawn powerups in right lanes (same direction) for safety
        const rightLanes = Config.SAME_DIRECTION_LANES;
        const lane = rightLanes[Math.floor(Math.random() * rightLanes.length)];
        const laneX = Config.getLanePosition(lane);
        const powerup = this.getRandomPowerup();
        
        this.items.push({
            type: 'powerup',
            x: laneX,
            y: -Config.ITEM_HEIGHT,
            width: Config.ITEM_WIDTH,
            height: Config.ITEM_HEIGHT,
            powerupType: powerup.name,
            duration: powerup.duration,
            color: powerup.color
        });
    },
    
    getRandomPowerup: function() {
        const totalChance = Config.POWERUP_TYPES.reduce((sum, powerup) => sum + powerup.spawnChance, 0);
        let random = Math.random() * totalChance;
        
        for (const powerup of Config.POWERUP_TYPES) {
            random -= powerup.spawnChance;
            if (random <= 0) {
                return powerup;
            }
        }
        
        return Config.POWERUP_TYPES[0];
    },
    
    checkCollision: function(player) {
        const result = {
            value: 0,
            items: []
        };
        
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            
            if (this.isColliding(player, item)) {
                if (item.type === 'coin') {
                    result.value += item.value; // Use the coin's actual value (1 for regular, 10 for rare)
                    result.items.push(item);
                    this.items.splice(i, 1);
                    
                    // Different effects for rare coins
                    const effectColor = item.isRare ? '#ff00ff' : '#ffff00';
                    Effects.createItemEffect(item.x, item.y, effectColor);
                } else if (item.type === 'powerup') {
                    Player.activatePowerup(item.powerupType, item.duration);
                    this.items.splice(i, 1);
                    Effects.createItemEffect(item.x, item.y, item.color);
                } else if (item.type === 'obstacle' || item.type === 'traffic_car') {
                    // Check if player has shield (star power)
                    if (Player.isShielded) {
                        // Star power: destroy the obstacle and continue
                        this.items.splice(i, 1);
                        
                        // Create explosion effect
                        Effects.createExplosion(item.x, item.y, '#ffff00');
                        
                        // Add points for destroying obstacle
                        const points = item.type === 'traffic_car' ? 50 : 25;
                        result.value += points;
                        
                        // Show floating text
                        UI.addFloatingText(`+${points}`, item.x, item.y - 20, '#ffff00', 24, 2000);
                        
                        // Play destruction sound
                        if (typeof Sound !== 'undefined') {
                            Sound.playSoundSafely('item_special');
                        }
                    } else {
                        // Game over on obstacle or traffic car hit (no shield)
                    MainGame.endGame();
                    return result;
                    }
                }
            }
        }
        
        return result;
    },
    
    isColliding: function(player, item) {
        // Use actual player dimensions for collision
        const playerLeft = player.x - (player.width / 2);
        const playerRight = player.x + (player.width / 2);
        const playerTop = player.y - (player.height / 2);
        const playerBottom = player.y + (player.height / 2);
        
        // Use actual item dimensions for collision
        const itemLeft = item.x - (item.width / 2);
        const itemRight = item.x + (item.width / 2);
        const itemTop = item.y - (item.height / 2);
        const itemBottom = item.y + (item.height / 2);
        
        return (
            playerLeft < itemRight &&
            playerRight > itemLeft &&
            playerTop < itemBottom &&
            playerBottom > itemTop
        );
    },
    
    // Apply magnet effect to attract coins towards player
    applyMagnet: function(strength = 1.0) {
        if (!Player || Player.magnetRadius <= 0) return;
        
        const magnetX = Player.x;
        const magnetY = Player.y;
        const magnetRadius = Player.magnetRadius;
        
        for (const item of this.items) {
            // Only apply magnet to coins (all types)
            if (item.type !== 'coin' || item.collected) continue;
            
            // Check if item is within magnet range
            const dx = magnetX - item.x;
            const dy = magnetY - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < magnetRadius && distance > 0) {
                // Calculate attraction force (stronger when closer)
                const force = (magnetRadius - distance) / magnetRadius * strength;
                const pullStrength = force * 3; // Adjust pull strength
                
                // Move item towards player
                item.x += (dx / distance) * pullStrength;
                item.y += (dy / distance) * pullStrength;
            }
        }
    },
    
    draw: function(ctx) {
        // Draw warnings first (behind items)
        this.drawWarnings(ctx);
        
        for (const item of this.items) {
            if (item.collected) continue;
            
            ctx.save();
            
            if (item.type === 'coin') {
                // Handle ultra-rare apecoin with image
                if (item.isUltraRare && this.apecoinImage && 
                    this.apecoinImage.complete && 
                    this.apecoinImage.naturalWidth > 0 && 
                    this.apecoinImage.naturalHeight > 0) {
                    
                    try {
                        // Draw apecoin image
                        const imageSize = Config.COIN_SIZE;
                        ctx.drawImage(
                            this.apecoinImage,
                            item.x - imageSize/2,
                            item.y - imageSize/2,
                            imageSize,
                            imageSize
                        );
                
                        // Add epic glow effect for apecoin
                        ctx.shadowColor = '#FFD700'; // Gold glow
                        ctx.shadowBlur = 25;
                        ctx.drawImage(
                            this.apecoinImage,
                            item.x - imageSize/2,
                            item.y - imageSize/2,
                            imageSize,
                            imageSize
                        );
                    } catch (error) {
                        // Fall through to emoji rendering
                        this.drawCoinEmoji(ctx, item);
                    }
                } else {
                    // Draw emoji coin (regular, diamond, or fallback for apecoin)
                    this.drawCoinEmoji(ctx, item);
                }
            } else if (item.type === 'obstacle') {
                // Draw obstacle with enhanced visuals
                this.drawEnhancedObstacle(ctx, item);
            } else if (item.type === 'traffic_car') {
                // Draw traffic car
                ctx.fillStyle = item.color;
                
                // Car body
                ctx.fillRect(item.x - item.width/2, item.y - item.height/2, item.width, item.height);
                
                // Car windows (darker)
                ctx.fillStyle = '#000000';
                ctx.fillRect(item.x - item.width/3, item.y - item.height/3, item.width * 2/3, item.height/4);
                
                // Direction indicator
                ctx.fillStyle = item.direction === 'oncoming' ? '#ff0000' : '#00ff00';
                ctx.beginPath();
                ctx.arc(item.x, item.y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Car glow effect
                ctx.shadowColor = item.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = item.color;
                ctx.fillRect(item.x - item.width/2, item.y - item.height/2, item.width, item.height);
            } else if (item.type === 'powerup') {
                // Draw powerup with distinct shape and icon
                const size = Config.ITEM_WIDTH;
                
                // Draw outer glow
                ctx.shadowColor = item.color;
                ctx.shadowBlur = 20;
                
                // Draw powerup background
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(item.x, item.y, size/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw inner circle
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(item.x, item.y, size/3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw powerup icon
                ctx.font = `${size/2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#FFFFFF';
                
                // Different icons for different powerup types
                let icon = '?';
                switch(item.powerupType) {
                    case 'shield':
                        icon = '⭐';
                        break;
                    case 'boost':
                        icon = '⚡';
                        break;
                    case 'magnet':
                        icon = '🧲';
                        break;
                }
                
                ctx.fillText(icon, item.x, item.y);
                
                // Add pulsing animation
                const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9;
                ctx.globalAlpha = pulse;
                ctx.beginPath();
                ctx.arc(item.x, item.y, size/2, 0, Math.PI * 2);
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            ctx.restore();
        }
    },
    
    getItemColor: function(type) {
        // Implement the logic to return the appropriate color based on the item type
        // This is a placeholder and should be replaced with the actual implementation
        return '#ffffff'; // Placeholder return, actual implementation needed
    },
    
    getItemPoints: function(type) {
        // Implement the logic to return the appropriate points based on the item type
        // This is a placeholder and should be replaced with the actual implementation
        return 10; // Placeholder return, actual implementation needed
    },
    
    collectItem: function(item) {
        if (item.type === 'coin') {
            const oldScore = this.score;
            this.score += Config.COIN_VALUE;
            this.coins++;
            
            // Check for first score achievement
            if (oldScore === 0 && this.score > 0 && window.triggerAchievementEvent) {
                window.triggerAchievementEvent('firstScore', {});
            }
        } else if (item.type === 'powerup') {
            this.activatePowerup(item.powerupType);
        }
        
        // Remove the collected item
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    },
    
    drawWarnings: function(ctx) {
        const currentTime = Date.now();
        
        for (const warning of this.warnings) {
            const elapsed = currentTime - warning.startTime;
            const timeLeft = warning.duration - elapsed;
            
            // Only draw if warning is still active
            if (timeLeft > 0) {
                ctx.save();
                
                // Calculate flash intensity (more urgent as time runs out)
                const urgency = 1 - (timeLeft / warning.duration); // 0 to 1
                const flashCycle = Math.sin((currentTime % Config.WARNING_FLASH_SPEED) / Config.WARNING_FLASH_SPEED * Math.PI * 2);
                const intensity = 0.3 + (urgency * 0.4) + (flashCycle * 0.3); // Base + urgency + flash
                
                // Different colors for different warning types
                let warningColor, borderColor, arrowIcon;
                if (warning.type === 'oncoming') {
                    warningColor = `rgba(255, 0, 0, ${intensity})`; // Red for oncoming (dangerous)
                    borderColor = `rgba(255, 100, 100, ${intensity * 2})`;
                    arrowIcon = '⬆️'; // Arrow pointing up (car coming from top to bottom)
                } else {
                    warningColor = `rgba(255, 165, 0, ${intensity})`; // Orange for same-direction (caution)
                    borderColor = `rgba(255, 200, 100, ${intensity * 2})`;
                    arrowIcon = '⬇️'; // Arrow pointing down (car coming from bottom moving upward)
                }
                
                // Draw warning overlay for the entire lane
                ctx.fillStyle = warningColor;
                
                // Draw lane warning stripe
                const laneLeft = warning.laneX - Config.LANE_WIDTH / 2;
                const laneRight = warning.laneX + Config.LANE_WIDTH / 2;
                ctx.fillRect(laneLeft, 0, Config.LANE_WIDTH, Config.GAME_HEIGHT);
                
                // Add warning border glow
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 3;
                ctx.strokeRect(laneLeft, 0, Config.LANE_WIDTH, Config.GAME_HEIGHT);
                
                // Draw countdown timer at top of lane
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 5;
                
                const countdownSeconds = Math.ceil(timeLeft / 1000);
                ctx.fillText(`⚠️ ${countdownSeconds}`, warning.laneX, 50);
                
                // Draw direction-appropriate warning arrow
                ctx.fillStyle = `rgba(255, 255, 0, ${intensity})`;
                ctx.font = 'bold 32px Arial';
                ctx.fillText(arrowIcon, warning.laneX, 100);
                
                ctx.restore();
            }
        }
    },
    
    // Progressive difficulty functions using score-based progression
    getCurrentDifficultyData: function() {
        // Get current score from MainGame
        const currentScore = MainGame.score || 0;
        
        // Find the current difficulty level based on score
        let currentDifficulty = Config.DIFFICULTY_LEVELS[0]; // Default to first level
        
        for (let i = Config.DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
            if (currentScore >= Config.DIFFICULTY_LEVELS[i].score) {
                currentDifficulty = Config.DIFFICULTY_LEVELS[i];
                break;
            }
        }
        
        return currentDifficulty;
    },
    
    getDifficultyLevel: function() {
        return this.getCurrentDifficultyData().level;
    },
    
    getAdjustedSpawnRate: function() {
        const difficultyData = this.getCurrentDifficultyData();
        const baseSpawnRate = 1500; // Base 1.5 seconds
        
        // Apply spawn rate multiplier from difficulty
        const adjustedSpawnRate = baseSpawnRate / difficultyData.spawnRateMultiplier;
        
        // Ensure minimum spawn rate
        return Math.max(Config.MIN_CAR_SPAWN_RATE || 800, adjustedSpawnRate);
    },
    
    drawCoinEmoji: function(ctx, item) {
        // Draw emoji coin (regular, diamond, or fallback for apecoin)
        ctx.font = `${Config.COIN_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, item.x, item.y);
        
        // Add glow effect based on coin type
        if (item.isUltraRare) {
            ctx.shadowColor = '#FFD700'; // Gold glow for ultra-rare coins
            ctx.shadowBlur = 25;
        } else if (item.isDiamond) {
            ctx.shadowColor = '#ff00ff'; // Purple glow for diamond coins
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowColor = '#FFD700'; // Gold glow for regular coins
            ctx.shadowBlur = 10;
        }
        ctx.fillText(item.emoji, item.x, item.y);
    },

    drawEnhancedObstacle: function(ctx, obstacle) {
        ctx.save();
        
        // Enhanced glow effect
        const gradient = ctx.createRadialGradient(
            obstacle.x, obstacle.y, 0,
            obstacle.x, obstacle.y, obstacle.width * 1.5
        );
        
        // Different colors and effects for different obstacle types
        const obstacleType = obstacle.obstacleType || 'barrier';
        switch(obstacleType) {
            case 'barrier':
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.3, '#ff3333');
                gradient.addColorStop(1, 'transparent');
                break;
            case 'spike':
                gradient.addColorStop(0, '#ff3333');
                gradient.addColorStop(0.3, '#ff6666');
                gradient.addColorStop(1, 'transparent');
                break;
            case 'mine':
                gradient.addColorStop(0, '#ff6600');
                gradient.addColorStop(0.3, '#ff9933');
                gradient.addColorStop(1, 'transparent');
                break;
            case 'debris':
                gradient.addColorStop(0, '#888888');
                gradient.addColorStop(0.3, '#aaaaaa');
                gradient.addColorStop(1, 'transparent');
                break;
            default:
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.3, '#ff3333');
                gradient.addColorStop(1, 'transparent');
        }
        
        // Draw glow
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.width * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw obstacle with enhanced effects
        ctx.translate(obstacle.x, obstacle.y);
        ctx.rotate(obstacle.rotation);
        
        // Draw different shapes based on type
        switch(obstacleType) {
            case 'barrier':
                // Draw barrier as a hexagon with warning stripes
                this.drawHexagon(ctx, 0, 0, obstacle.width/2);
                ctx.fillStyle = '#ff0000';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Add warning stripes
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-obstacle.width/3, -obstacle.height/3 + i * obstacle.height/3);
                    ctx.lineTo(obstacle.width/3, -obstacle.height/3 + i * obstacle.height/3);
                    ctx.stroke();
                }
                break;
                
            case 'spike':
                // Draw spike as a dangerous-looking triangle
                ctx.beginPath();
                ctx.moveTo(0, -obstacle.height/2);
                ctx.lineTo(obstacle.width/2, obstacle.height/2);
                ctx.lineTo(-obstacle.width/2, obstacle.height/2);
                ctx.closePath();
                
                // Add metallic gradient
                const spikeGradient = ctx.createLinearGradient(0, -obstacle.height/2, 0, obstacle.height/2);
                spikeGradient.addColorStop(0, '#ff3333');
                spikeGradient.addColorStop(0.5, '#ff6666');
                spikeGradient.addColorStop(1, '#ff3333');
                
                ctx.fillStyle = spikeGradient;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Add shine effect
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(-obstacle.width/4, -obstacle.height/4);
                ctx.lineTo(0, -obstacle.height/2);
                ctx.lineTo(obstacle.width/4, -obstacle.height/4);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'mine':
                // Draw mine as a dangerous-looking circle with spikes
                ctx.beginPath();
                ctx.arc(0, 0, obstacle.width/2, 0, Math.PI * 2);
                ctx.fillStyle = '#ff6600';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Add spikes
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI) / 4;
                    ctx.beginPath();
                    ctx.moveTo(
                        Math.cos(angle) * obstacle.width/2,
                        Math.sin(angle) * obstacle.height/2
                    );
                    ctx.lineTo(
                        Math.cos(angle) * obstacle.width,
                        Math.sin(angle) * obstacle.height
                    );
                    ctx.strokeStyle = '#ff9933';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                
                // Add warning symbol
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, obstacle.width/4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, obstacle.width/6, 0, Math.PI * 2);
                ctx.fillStyle = '#ff6600';
                ctx.fill();
                break;
                
            case 'debris':
                // Draw debris as irregular rocks/concrete pieces
                this.drawJaggedShape(ctx, 0, 0, obstacle.width/2);
                
                // Add concrete/rock gradient
                const debrisGradient = ctx.createLinearGradient(0, -obstacle.height/2, 0, obstacle.height/2);
                debrisGradient.addColorStop(0, '#999999');
                debrisGradient.addColorStop(0.3, '#666666');
                debrisGradient.addColorStop(0.7, '#888888');
                debrisGradient.addColorStop(1, '#555555');
                
                ctx.fillStyle = debrisGradient;
                ctx.fill();
                ctx.strokeStyle = '#cccccc';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Add some cracks
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-obstacle.width/4, -obstacle.height/6);
                ctx.lineTo(obstacle.width/3, obstacle.height/4);
                ctx.moveTo(obstacle.width/5, -obstacle.height/3);
                ctx.lineTo(-obstacle.width/3, obstacle.height/5);
                ctx.stroke();
                break;
                
            default:
                // Fallback: simple rectangle
                ctx.fillStyle = obstacle.color;
                ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height);
        }
        
        ctx.restore();
    },

    // Helper function to draw a hexagon
    drawHexagon: function(ctx, x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    },

    // Helper function to draw a jagged shape
    drawJaggedShape: function(ctx, x, y, size) {
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i * Math.PI * 2) / points;
            const radius = size * (0.8 + Math.random() * 0.4);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }
}; 