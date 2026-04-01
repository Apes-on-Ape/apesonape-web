// Run Ape - Enhanced Obstacles Module (Continuous 2D Platformer Style)

const Obstacles = {
    // Obstacles arrays - separated by type
    platforms: [], // Climbable ground obstacles
    enemies: [],   // Flying enemies that cause game over
    lasers: [],    // Enemy laser shots
    
    // Platform generation state for continuity
    lastPlatformY: 0,
    lastPlatformX: 0,
    platformChainLength: 0,
    maxChainLength: 4,
    currentChainType: null,
    
    // Height levels for platforms
    heightLevels: [
        0,    // Ground level
        -60,  // Low platform
        -120, // Mid platform  
        -180, // High platform
        -240  // Very high platform
    ],
    
    // Obstacle types
    platformTypes: {
        SMALL_BLOCK: 'small-block',
        SPACE_STEPS: 'space-steps',
        QUESTION_BLOCK: 'question-block',
        CRYSTAL_FORMATION: 'crystal-formation',
        TECH_PLATFORM: 'tech-platform',
        PLATFORM_CHAIN: 'platform-chain',     // New: Connected platforms
        FLOATING_ISLAND: 'floating-island',   // New: Large floating platform
        // JUMP_PAD removed - not needed for space shooter
    },
    
    enemyTypes: {
        ASTEROID_SMALL: 'asteroid-small',
        ASTEROID_LARGE: 'asteroid-large',
        SPACESHIP: 'spaceship',
        LASER_SPACESHIP: 'laser-spaceship',  // New: Spaceship that shoots lasers
        SATELLITE: 'satellite',
        UFO: 'ufo'
    },
    
    // Timers for spawning
    nextPlatformTime: 0,
    nextEnemyTime: 0,
    
    // Scale ratio for responsive design
    scaleRatio: 1,
    canvas: null,
    
    // Initialize obstacles
    init: function(canvas) {
        this.scaleRatio = 1;
        this.canvas = canvas;
        this.reset();
        console.log('Enhanced Obstacles initialized');
    },
    
    // Update scale for responsive design
    updateScale: function(canvas, scaleRatio) {
        this.scaleRatio = scaleRatio;
        this.canvas = canvas;
    },
    
    // Update obstacles
    update: function(deltaTime, gameSpeed, canvas, score) {
        // Update platform spawn timer
        this.nextPlatformTime -= deltaTime;
        
        // Update enemy spawn timer
        this.nextEnemyTime -= deltaTime;
        
        // Spawn platforms with improved continuity logic
        if (this.nextPlatformTime <= 0) {
            // Determine if we should continue a chain or start new
            const shouldContinueChain = this.platformChainLength > 0 && 
                                      this.platformChainLength < this.maxChainLength &&
                                      Math.random() < 0.7; // 70% chance to continue chain
            
            if (shouldContinueChain) {
                // Continue current chain with smaller gap
                this.nextPlatformTime = (200 + Math.random() * 300) / gameSpeed;
                this.addPlatformToChain(canvas, score);
            } else {
                // Start new platform or end chain
                const minGap = CONFIG.PLATFORM_MIN_GAP / gameSpeed;
                const maxGap = CONFIG.PLATFORM_MAX_GAP / gameSpeed;
                this.nextPlatformTime = Math.random() * (maxGap - minGap) + minGap;
                this.addPlatform(canvas, score);
                
                // Reset chain
                this.platformChainLength = 0;
                this.currentChainType = null;
            }
        }
        
        // Spawn flying enemies (less frequent to allow more platforming)
        if (this.nextEnemyTime <= 0) {
            const minGap = CONFIG.ENEMY_MIN_GAP * 1.5 / gameSpeed; // Increased gap
            const maxGap = CONFIG.ENEMY_MAX_GAP * 1.5 / gameSpeed;
            this.nextEnemyTime = Math.random() * (maxGap - minGap) + minGap;
            this.addEnemy(canvas, score);
        }
        
        // Update platforms
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const platform = this.platforms[i];
            platform.x -= gameSpeed;
            
            // Update platform animations
            if (platform.animTime !== undefined) {
                platform.animTime += deltaTime * 0.001;
            }
            
            // Remove if off screen
            if (platform.x + platform.width < 0) {
                this.platforms.splice(i, 1);
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.x -= gameSpeed * CONFIG.ENEMY_SPEED_MULTIPLIER;
            
            // Update animations and rotations
            if (enemy.rotationSpeed) {
                enemy.rotation += enemy.rotationSpeed;
            }
            
            if (enemy.animate) {
                enemy.animTime = (enemy.animTime || 0) + deltaTime;
                enemy.animOffset = Math.sin(enemy.animTime * 0.003) * 5;
            }
            
            // UFO floating motion
            if (enemy.type === this.enemyTypes.UFO) {
                enemy.floatOffset = Math.sin(enemy.animTime * 0.002) * 20;
            }
            
            // Laser spaceship shooting logic
            if (enemy.type === this.enemyTypes.LASER_SPACESHIP) {
                const currentTime = Date.now();
                if (currentTime - enemy.lastLaserTime >= enemy.laserCooldown) {
                    this.fireLaser(enemy);
                    enemy.lastLaserTime = currentTime;
                    enemy.laserCooldown = 2000 + Math.random() * 1500; // Reset cooldown
                }
            }
            
            // Remove if off screen
            if (enemy.x + enemy.width < 0) {
                this.enemies.splice(i, 1);
            }
        }
        
        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.x -= laser.velocityX;
            laser.y += laser.velocityY;
            laser.lifetime -= deltaTime;
            
            // Remove expired or off-screen lasers
            if (laser.lifetime <= 0 || 
                laser.x < -50 || 
                laser.y < -50 || 
                laser.y > canvas.height + 50) {
                this.lasers.splice(i, 1);
            }
        }
    },
    
    // Add a climbable platform with improved positioning
    addPlatform: function(canvas, score) {
        const groundY = canvas.height - CONFIG.GROUND_HEIGHT * this.scaleRatio;
        const type = this.choosePlatformType(score);
        
        // Choose height level for better platforming
        const heightLevel = this.chooseHeightLevel(score);
        const platformY = groundY + (heightLevel * this.scaleRatio);
        
        // Store last platform position for chaining
        this.lastPlatformX = canvas.width;
        this.lastPlatformY = platformY;
        
        let platform;
        
        switch (type) {
            case this.platformTypes.SMALL_BLOCK:
                platform = {
                    x: canvas.width,
                    y: platformY - 40 * this.scaleRatio,
                    width: 60 * this.scaleRatio,
                    height: 40 * this.scaleRatio,
                    type: type,
                    color: '#4A4A4A', // Dark gray space metal
                    pushForce: 2 * this.scaleRatio
                };
                break;
                
            case this.platformTypes.SPACE_STEPS:
                const stepCount = 2 + Math.floor(Math.random() * 3); // 2-4 steps
                const stepWidth = 45 * this.scaleRatio;
                const stepHeight = 25 * this.scaleRatio;
                platform = {
                    x: canvas.width,
                    y: platformY - (stepCount * stepHeight),
                    width: stepCount * stepWidth,
                    height: stepCount * stepHeight,
                    type: type,
                    color: '#6A5ACD', // Space purple
                    stepCount: stepCount,
                    stepWidth: stepWidth,
                    stepHeight: stepHeight,
                    pushForce: 3 * this.scaleRatio,
                    animTime: 0
                };
                break;
                
            case this.platformTypes.QUESTION_BLOCK:
                platform = {
                    x: canvas.width,
                    y: platformY - 50 * this.scaleRatio,
                    width: 60 * this.scaleRatio,
                    height: 50 * this.scaleRatio,
                    type: type,
                    color: '#FFD700', // Gold
                    animTime: 0,
                    pushForce: 2.5 * this.scaleRatio
                };
                break;
                
            case this.platformTypes.CRYSTAL_FORMATION:
                const crystalHeight = (60 + Math.random() * 40) * this.scaleRatio;
                platform = {
                    x: canvas.width,
                    y: platformY - crystalHeight,
                    width: 70 * this.scaleRatio,
                    height: crystalHeight,
                    type: type,
                    color: '#00CED1', // Dark turquoise
                    animTime: 0,
                    pushForce: 4 * this.scaleRatio
                };
                break;
                
            case this.platformTypes.TECH_PLATFORM:
                const techWidth = (80 + Math.random() * 60) * this.scaleRatio;
                platform = {
                    x: canvas.width,
                    y: platformY - 45 * this.scaleRatio,
                    width: techWidth,
                    height: 45 * this.scaleRatio,
                    type: type,
                    color: '#708090', // Slate gray
                    animTime: 0,
                    pushForce: 3.5 * this.scaleRatio
                };
                break;
                
            case this.platformTypes.FLOATING_ISLAND:
                const islandWidth = (120 + Math.random() * 80) * this.scaleRatio;
                platform = {
                    x: canvas.width,
                    y: platformY - 35 * this.scaleRatio,
                    width: islandWidth,
                    height: 35 * this.scaleRatio,
                    type: type,
                    color: '#228B22', // Forest green
                    animTime: 0,
                    pushForce: 3 * this.scaleRatio,
                    isLarge: true
                };
                break;
                
            // JUMP_PAD case removed
        }
        
        this.platforms.push(platform);
        
        // Start a new chain if appropriate
        if (Math.random() < 0.3 && this.platformChainLength === 0) {
            this.platformChainLength = 1;
            this.currentChainType = type;
        }
    },
    
    // Add platform to continue a chain
    addPlatformToChain: function(canvas, score) {
        const groundY = canvas.height - CONFIG.GROUND_HEIGHT * this.scaleRatio;
        
        // Calculate next position in chain
        const chainGap = 100 + Math.random() * 150; // Smaller gap for chain
        const heightVariation = (-30 + Math.random() * 60) * this.scaleRatio; // Small height variation
        const nextY = Math.max(
            groundY - 240 * this.scaleRatio, // Don't go too high
            Math.min(groundY, this.lastPlatformY + heightVariation) // Stay reasonable
        );
        
        let platform = {
            x: canvas.width,
            y: nextY - 40 * this.scaleRatio,
            width: (60 + Math.random() * 40) * this.scaleRatio,
            height: 40 * this.scaleRatio,
            type: this.currentChainType || this.platformTypes.SMALL_BLOCK,
            color: '#4A4A4A',
            pushForce: 2 * this.scaleRatio,
            isChainPart: true
        };
        
        this.platforms.push(platform);
        this.platformChainLength++;
        this.lastPlatformY = nextY;
    },
    
    // Choose height level for platform
    chooseHeightLevel: function(score) {
        const rand = Math.random();
        
        // Higher scores = more varied heights
        if (score > 2000) {
            if (rand < 0.1) return this.heightLevels[0]; // Ground
            if (rand < 0.25) return this.heightLevels[1]; // Low
            if (rand < 0.5) return this.heightLevels[2]; // Mid  
            if (rand < 0.8) return this.heightLevels[3]; // High
            return this.heightLevels[4]; // Very high
        } else if (score > 1000) {
            if (rand < 0.2) return this.heightLevels[0]; // Ground
            if (rand < 0.4) return this.heightLevels[1]; // Low
            if (rand < 0.7) return this.heightLevels[2]; // Mid
            return this.heightLevels[3]; // High
        } else {
            if (rand < 0.3) return this.heightLevels[0]; // Ground
            if (rand < 0.6) return this.heightLevels[1]; // Low
            return this.heightLevels[2]; // Mid
        }
    },
    
    // Add a flying enemy
    addEnemy: function(canvas, score) {
        const type = this.chooseEnemyType(score);
        const maxY = canvas.height - CONFIG.GROUND_HEIGHT * this.scaleRatio - 100 * this.scaleRatio;
        let enemy;
        
        switch (type) {
            case this.enemyTypes.ASTEROID_SMALL:
                enemy = {
                    x: canvas.width,
                    y: Math.random() * maxY,
                    width: 30 * this.scaleRatio,
                    height: 30 * this.scaleRatio,
                    type: type,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.05,
                    color: '#696969' // Dark gray
                };
                break;
                
            case this.enemyTypes.ASTEROID_LARGE:
                enemy = {
                    x: canvas.width,
                    y: Math.random() * maxY,
                    width: 50 * this.scaleRatio,
                    height: 50 * this.scaleRatio,
                    type: type,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.03,
                    color: '#A0522D' // Sienna
                };
                break;
                
            case this.enemyTypes.SPACESHIP:
                enemy = {
                    x: canvas.width,
                    y: Math.random() * maxY,
                    width: 80 * this.scaleRatio,
                    height: 30 * this.scaleRatio,
                    type: type,
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    animate: true,
                    animTime: 0,
                    animOffset: 0
                };
                break;
                
            case this.enemyTypes.LASER_SPACESHIP:
                enemy = {
                    x: canvas.width,
                    y: Math.random() * maxY,
                    width: 90 * this.scaleRatio,
                    height: 35 * this.scaleRatio,
                    type: type,
                    color: '#FF6347', // Tomato red for aggressive look
                    animate: true,
                    animTime: 0,
                    animOffset: 0,
                    lastLaserTime: 0,
                    laserCooldown: 2000 + Math.random() * 1500 // 2-3.5 second intervals
                };
                break;
                
            case this.enemyTypes.SATELLITE:
                enemy = {
                    x: canvas.width,
                    y: Math.random() * maxY,
                    width: 40 * this.scaleRatio,
                    height: 40 * this.scaleRatio,
                    type: type,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.08,
                    color: '#C0C0C0' // Silver
                };
                break;
                
            case this.enemyTypes.UFO:
                enemy = {
                    x: canvas.width,
                    y: Math.random() * maxY,
                    width: 60 * this.scaleRatio,
                    height: 25 * this.scaleRatio,
                    type: type,
                    color: '#00FFFF', // Cyan
                    animate: true,
                    animTime: 0,
                    floatOffset: 0
                };
                break;
        }
        
        this.enemies.push(enemy);
    },
    
    // Fire laser from enemy spaceship
    fireLaser: function(enemy) {
        const laser = {
            x: enemy.x,
            y: enemy.y + enemy.height / 2,
            velocityX: 8, // Speed leftward
            velocityY: (Math.random() - 0.5) * 2, // Slight vertical variation
            width: 20,
            height: 3,
            lifetime: 3000, // 3 seconds
            color: '#FF0000' // Red laser
        };
        
        this.lasers.push(laser);
    },
    
    // Choose platform type based on score
    choosePlatformType: function(score) {
        const rand = Math.random();
        
        if (score > 3000) {
            if (rand < 0.15) return this.platformTypes.SPACE_STEPS;
            if (rand < 0.25) return this.platformTypes.CRYSTAL_FORMATION;
            if (rand < 0.35) return this.platformTypes.TECH_PLATFORM;
            if (rand < 0.45) return this.platformTypes.QUESTION_BLOCK;
            if (rand < 0.55) return this.platformTypes.FLOATING_ISLAND;
            // JUMP_PAD selection removed
            return this.platformTypes.SMALL_BLOCK;
        } else if (score > 2000) {
            if (rand < 0.2) return this.platformTypes.SPACE_STEPS;
            if (rand < 0.35) return this.platformTypes.CRYSTAL_FORMATION;
            if (rand < 0.5) return this.platformTypes.TECH_PLATFORM;
            if (rand < 0.65) return this.platformTypes.QUESTION_BLOCK;
            if (rand < 0.75) return this.platformTypes.FLOATING_ISLAND;
            // JUMP_PAD selection removed
            return this.platformTypes.SMALL_BLOCK;
        } else if (score > 1000) {
            if (rand < 0.2) return this.platformTypes.SPACE_STEPS;
            if (rand < 0.35) return this.platformTypes.CRYSTAL_FORMATION;
            if (rand < 0.55) return this.platformTypes.TECH_PLATFORM;
            if (rand < 0.75) return this.platformTypes.QUESTION_BLOCK;
            if (rand < 0.85) return this.platformTypes.FLOATING_ISLAND;
            return this.platformTypes.SMALL_BLOCK;
        } else {
            if (rand < 0.15) return this.platformTypes.SPACE_STEPS;
            if (rand < 0.25) return this.platformTypes.CRYSTAL_FORMATION;
            if (rand < 0.4) return this.platformTypes.TECH_PLATFORM;
            if (rand < 0.65) return this.platformTypes.QUESTION_BLOCK;
            return this.platformTypes.SMALL_BLOCK;
        }
    },
    
    // Choose enemy type based on score
    chooseEnemyType: function(score) {
        const rand = Math.random();
        
        if (score > 3000) {
            if (rand < 0.15) return this.enemyTypes.UFO;
            if (rand < 0.25) return this.enemyTypes.LASER_SPACESHIP;
            if (rand < 0.45) return this.enemyTypes.SPACESHIP;
            if (rand < 0.6) return this.enemyTypes.SATELLITE;
            if (rand < 0.8) return this.enemyTypes.ASTEROID_LARGE;
            return this.enemyTypes.ASTEROID_SMALL;
        } else if (score > 1500) {
            if (rand < 0.1) return this.enemyTypes.UFO;
            if (rand < 0.2) return this.enemyTypes.LASER_SPACESHIP;
            if (rand < 0.4) return this.enemyTypes.SPACESHIP;
            if (rand < 0.55) return this.enemyTypes.SATELLITE;
            if (rand < 0.75) return this.enemyTypes.ASTEROID_LARGE;
            return this.enemyTypes.ASTEROID_SMALL;
        } else if (score > 800) {
            if (rand < 0.05) return this.enemyTypes.UFO;
            if (rand < 0.12) return this.enemyTypes.LASER_SPACESHIP;
            if (rand < 0.3) return this.enemyTypes.SPACESHIP;
            if (rand < 0.45) return this.enemyTypes.SATELLITE;
            if (rand < 0.7) return this.enemyTypes.ASTEROID_LARGE;
            return this.enemyTypes.ASTEROID_SMALL;
        } else {
            if (rand < 0.05) return this.enemyTypes.UFO;
            if (rand < 0.25) return this.enemyTypes.SPACESHIP;
            if (rand < 0.4) return this.enemyTypes.SATELLITE;
            if (rand < 0.65) return this.enemyTypes.ASTEROID_LARGE;
            return this.enemyTypes.ASTEROID_SMALL;
        }
    },
    
    // Draw all obstacles
    draw: function(ctx, canvas) {
        if (!ctx) {
            console.error('No context available for Obstacles.draw');
            return;
        }
        
        // Draw platforms
        this.platforms.forEach(platform => this.drawPlatform(ctx, platform));
        
        // Draw enemies
        this.enemies.forEach(enemy => this.drawEnemy(ctx, enemy));
        
        // Draw lasers
        this.drawLasers(ctx);
    },
    
    // Draw a platform with enhanced pixel art graphics
    drawPlatform: function(ctx, platform) {
        ctx.save();
        
        switch (platform.type) {
            case this.platformTypes.SMALL_BLOCK:
                this.drawMetalBlock(ctx, platform);
                break;
                
            case this.platformTypes.SPACE_STEPS:
                this.drawSpaceSteps(ctx, platform);
                break;
                
            case this.platformTypes.QUESTION_BLOCK:
                this.drawQuestionBlock(ctx, platform);
                break;
                
            case this.platformTypes.CRYSTAL_FORMATION:
                this.drawCrystalFormation(ctx, platform);
                break;
                
            case this.platformTypes.TECH_PLATFORM:
                this.drawTechPlatform(ctx, platform);
                break;
                
            case this.platformTypes.FLOATING_ISLAND:
                this.drawFloatingIsland(ctx, platform);
                break;
                
            // JUMP_PAD drawing case removed
        }
        
        ctx.restore();
        
        // Debug - draw collision bounds
        if (CONFIG.DEBUG) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
    },
    
    // Draw metal block with detailed pixel art
    drawMetalBlock: function(ctx, platform) {
        const x = platform.x;
        const y = platform.y;
        const w = platform.width;
        const h = platform.height;
        
        // Main metal body
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(x, y, w, h);
        
        // Highlight edge
        ctx.fillStyle = '#6A6A6A';
        ctx.fillRect(x, y, w, 2); // Top
        ctx.fillRect(x, y, 2, h); // Left
        
        // Shadow edge
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(x, y + h - 2, w, 2); // Bottom
        ctx.fillRect(x + w - 2, y, 2, h); // Right
        
        // Metal rivets
        ctx.fillStyle = '#8A8A8A';
        const rivetSize = 3;
        for (let i = rivetSize; i < w - rivetSize; i += 12) {
            for (let j = rivetSize; j < h - rivetSize; j += 12) {
                ctx.fillRect(x + i, y + j, rivetSize, rivetSize);
            }
        }
        
        // Panel lines
        ctx.fillStyle = '#3A3A3A';
        ctx.fillRect(x + 4, y + 4, w - 8, 1);
        ctx.fillRect(x + 4, y + h - 5, w - 8, 1);
    },
    
    // Draw space steps with glowing effects
    drawSpaceSteps: function(ctx, platform) {
        const stepWidth = platform.stepWidth;
        const stepHeight = platform.stepHeight;
        const stepCount = platform.stepCount;
        const glowIntensity = Math.sin(platform.animTime * 2) * 0.3 + 0.7;
        
        for (let i = 0; i < stepCount; i++) {
            const stepX = platform.x + i * stepWidth;
            const stepY = platform.y + (stepCount - 1 - i) * stepHeight;
            
            // Main step body
            ctx.fillStyle = `rgba(106, 90, 205, ${glowIntensity})`;
            ctx.fillRect(stepX, stepY, stepWidth, stepHeight);
            
            // Highlight
            ctx.fillStyle = `rgba(138, 125, 220, ${glowIntensity})`;
            ctx.fillRect(stepX, stepY, stepWidth, 2);
            ctx.fillRect(stepX, stepY, 2, stepHeight);
            
            // Shadow
            ctx.fillStyle = `rgba(75, 65, 150, ${glowIntensity})`;
            ctx.fillRect(stepX, stepY + stepHeight - 2, stepWidth, 2);
            ctx.fillRect(stepX + stepWidth - 2, stepY, 2, stepHeight);
            
            // Energy patterns
            ctx.fillStyle = `rgba(150, 255, 255, ${glowIntensity * 0.8})`;
            for (let j = 2; j < stepWidth - 2; j += 4) {
                ctx.fillRect(stepX + j, stepY + stepHeight / 2, 1, 1);
            }
        }
    },
    
    // Draw question block with animation
    drawQuestionBlock: function(ctx, platform) {
        const x = platform.x;
        const y = platform.y;
        const w = platform.width;
        const h = platform.height;
        const bounce = Math.sin(platform.animTime * 3) * 2;
        
        // Main body with bounce
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x, y - bounce, w, h);
        
        // Block outline
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(x, y - bounce, w, 3); // Top
        ctx.fillRect(x, y - bounce, 3, h); // Left
        ctx.fillRect(x, y + h - 3 - bounce, w, 3); // Bottom
        ctx.fillRect(x + w - 3, y - bounce, 3, h); // Right
        
        // Space Crystal Formation
        const crystalGlow = Math.sin(platform.animTime * 3) * 0.3 + 0.7;
        
        // Main crystal body
        ctx.fillStyle = `rgba(138, 43, 226, ${crystalGlow})`;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.2 - bounce);
        ctx.lineTo(x + w * 0.7, y + h * 0.6 - bounce);
        ctx.lineTo(x + w * 0.3, y + h * 0.6 - bounce);
        ctx.closePath();
        ctx.fill();
        
        // Crystal facets
        ctx.fillStyle = `rgba(147, 112, 219, ${crystalGlow})`;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.2 - bounce);
        ctx.lineTo(x + w * 0.6, y + h * 0.4 - bounce);
        ctx.lineTo(x + w * 0.4, y + h * 0.4 - bounce);
        ctx.closePath();
        ctx.fill();
        
        // Crystal highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${crystalGlow * 0.8})`;
        ctx.fillRect(x + w * 0.48, y + h * 0.25 - bounce, 2, h * 0.2);
        
        // Sparkle effect
        if (Math.sin(platform.animTime * 5) > 0.5) {
            ctx.fillStyle = '#FFFFFF';
            const sparkles = [
                {x: x + w * 0.2, y: y + h * 0.2},
                {x: x + w * 0.8, y: y + h * 0.3},
                {x: x + w * 0.1, y: y + h * 0.8},
                {x: x + w * 0.9, y: y + h * 0.7}
            ];
            
            sparkles.forEach(sparkle => {
                ctx.fillRect(sparkle.x, sparkle.y - bounce, 2, 2);
            });
        }
    },
    
    // Draw crystal formation with animated glow
    drawCrystalFormation: function(ctx, platform) {
        const x = platform.x;
        const y = platform.y;
        const w = platform.width;
        const h = platform.height;
        const glow = Math.sin(platform.animTime * 1.5) * 0.4 + 0.6;
        
        // Try to use space-themed planets as crystal bases
        const planetTypes = ['blue-planet', 'purple-planet', 'red-planet', 'saturn'];
        const planetType = planetTypes[Math.floor(platform.x / 100) % planetTypes.length];
        
        if (AssetLoader && AssetLoader.drawImageOrFallback(ctx, planetType, x, y + h * 0.6, w, h * 0.4, '#00CED1')) {
            // Asset loaded, add crystal growth on top
            ctx.fillStyle = `rgba(0, 206, 209, ${glow})`;
            
            // Draw crystal spikes growing from the planet
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w * 0.3, y + h * 0.6);
            ctx.lineTo(x + w * 0.7, y + h * 0.6);
            ctx.closePath();
            ctx.fill();
            
            // Crystal facets
            ctx.fillStyle = `rgba(64, 224, 235, ${glow})`;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w * 0.4, y + h * 0.3);
            ctx.lineTo(x + w * 0.6, y + h * 0.3);
            ctx.closePath();
            ctx.fill();
            
        } else {
            // Fallback to original crystal rendering
            // Main crystal body
            ctx.fillStyle = `rgba(0, 206, 209, ${glow})`;
            
            // Draw crystal shape
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w * 0.8, y + h * 0.3);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x + w * 0.2, y + h * 0.3);
            ctx.closePath();
            ctx.fill();
            
            // Crystal facets
            ctx.fillStyle = `rgba(64, 224, 235, ${glow})`;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w * 0.6, y + h * 0.5);
            ctx.lineTo(x + w / 2, y + h);
            ctx.lineTo(x + w * 0.4, y + h * 0.5);
            ctx.closePath();
            ctx.fill();
        }
        
        // Bright highlights (regardless of asset loading)
        ctx.fillStyle = `rgba(255, 255, 255, ${glow * 0.8})`;
        ctx.fillRect(x + w * 0.45, y + 2, 2, h * 0.3);
        ctx.fillRect(x + w * 0.55, y + h * 0.1, 1, h * 0.2);
        
        // Energy particles around crystal
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + platform.animTime * 0.5;
            const radius = 15 + Math.sin(platform.animTime * 2 + i) * 5;
            const px = x + w / 2 + Math.cos(angle) * radius;
            const py = y + h / 2 + Math.sin(angle) * radius;
            
            ctx.fillStyle = `rgba(0, 255, 255, ${glow * 0.6})`;
            ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
        }
        
        // Add space stars around the formation
        if (AssetLoader && AssetLoader.isLoaded('white-star')) {
            const starCount = 3;
            for (let i = 0; i < starCount; i++) {
                const angle = (i / starCount) * Math.PI * 2 + platform.animTime * 0.3;
                const radius = 25 + Math.sin(platform.animTime + i) * 10;
                const starX = x + w / 2 + Math.cos(angle) * radius;
                const starY = y + h / 2 + Math.sin(angle) * radius;
                
                if (starX > 0 && starX < 1200 && starY > 0 && starY < 800) { // Basic bounds check
                    AssetLoader.drawImageOrFallback(ctx, 'white-star', starX - 8, starY - 8, 16, 16, '#FFFFFF');
                }
            }
        }
    },
    
    // Draw tech platform with circuit patterns
    drawTechPlatform: function(ctx, platform) {
        const x = platform.x;
        const y = platform.y;
        const w = platform.width;
        const h = platform.height;
        const pulse = Math.sin(platform.animTime * 2) * 0.3 + 0.7;
        
        // Main platform body
        ctx.fillStyle = '#708090';
        ctx.fillRect(x, y, w, h);
        
        // Tech panel borders
        ctx.fillStyle = '#A0A0A0';
        ctx.fillRect(x, y, w, 2); // Top
        ctx.fillRect(x, y, 2, h); // Left
        
        ctx.fillStyle = '#505050';
        ctx.fillRect(x, y + h - 2, w, 2); // Bottom
        ctx.fillRect(x + w - 2, y, 2, h); // Right
        
        // Circuit patterns
        ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
        ctx.lineWidth = 1;
        
        // Horizontal circuit lines
        for (let i = 4; i < w - 4; i += 8) {
            ctx.fillRect(x + i, y + h / 2 - 1, 4, 1);
        }
        
        // Vertical connectors
        for (let i = 8; i < w - 8; i += 16) {
            ctx.fillRect(x + i, y + 4, 1, h - 8);
        }
        
        // Circuit nodes
        ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
        for (let i = 8; i < w - 8; i += 16) {
            ctx.fillRect(x + i - 1, y + h / 2 - 1, 3, 3);
        }
        
        // Animated data flow
        const flowOffset = (platform.animTime * 50) % 16;
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.8})`;
        for (let i = flowOffset; i < w; i += 16) {
            ctx.fillRect(x + i, y + h / 2, 2, 1);
        }
        
        // Warning stripes
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < w; i += 6) {
            if (Math.floor(i / 6) % 2 === 0) {
                ctx.fillRect(x + i, y, 3, 2);
                ctx.fillRect(x + i, y + h - 2, 3, 2);
            }
        }
    },
    
    // Draw floating island platform
    drawFloatingIsland: function(ctx, platform) {
        const x = platform.x;
        const y = platform.y;
        const w = platform.width;
        const h = platform.height;
        const float = Math.sin(platform.animTime * 1.5) * 3;
        
        // Main island body with floating animation
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x, y + float, w, h);
        
        // Grass top layer
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(x, y + float, w, h * 0.3);
        
        // Rock base
        ctx.fillStyle = '#696969';
        ctx.fillRect(x + w * 0.1, y + h * 0.7 + float, w * 0.8, h * 0.3);
        
        // Highlight edges
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(x, y + float, w, 2);
        ctx.fillRect(x, y + float, 2, h * 0.3);
        
        // Shadow edge on rock
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(x + w * 0.1, y + h - 2 + float, w * 0.8, 2);
        ctx.fillRect(x + w * 0.9, y + h * 0.7 + float, w * 0.1, h * 0.3);
        
        // Small grass details
        ctx.fillStyle = '#00FF00';
        for (let i = 2; i < w - 2; i += 8) {
            if (Math.random() > 0.5) {
                ctx.fillRect(x + i, y + float, 1, 3);
            }
        }
        
        // Floating particles around the island
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            const angle = (platform.animTime * 0.5 + i * Math.PI * 2 / particleCount);
            const particleX = x + w / 2 + Math.cos(angle) * w * 0.6;
            const particleY = y + h / 2 + Math.sin(angle) * h * 0.4 + float;
            ctx.fillRect(particleX, particleY, 1, 1);
        }
    },
    
    // drawJumpPad function removed
    
    // Draw an enemy with enhanced pixel art
    drawEnemy: function(ctx, enemy) {
        ctx.save();
        
        let drawY = enemy.y;
        if (enemy.floatOffset !== undefined) {
            drawY += enemy.floatOffset;
        }
        if (enemy.animOffset !== undefined) {
            drawY += enemy.animOffset;
        }
        
        switch (enemy.type) {
            case this.enemyTypes.ASTEROID_SMALL:
            case this.enemyTypes.ASTEROID_LARGE:
                this.drawAsteroid(ctx, enemy, drawY);
                break;
                
            case this.enemyTypes.SPACESHIP:
                this.drawSpaceship(ctx, enemy, drawY);
                break;
                
            case this.enemyTypes.LASER_SPACESHIP:
                this.drawLaserSpaceship(ctx, enemy, drawY);
                break;
                
            case this.enemyTypes.SATELLITE:
                this.drawSatellite(ctx, enemy, drawY);
                break;
                
            case this.enemyTypes.UFO:
                this.drawUFO(ctx, enemy, drawY);
                break;
        }
        
        ctx.restore();
        
        // Debug - draw collision bounds
        if (CONFIG.DEBUG) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(enemy.x, drawY, enemy.width, enemy.height);
        }
    },
    
    // Draw detailed pixel art asteroid
    drawAsteroid: function(ctx, enemy, drawY) {
        const x = enemy.x;
        const y = drawY;
        const w = enemy.width;
        const h = enemy.height;
        
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(enemy.rotation);
        
        // Main asteroid body with rough pixel art edges
        ctx.fillStyle = '#8B4513';
        
        // Create irregular asteroid shape with pixel art style
        const points = [
            {x: w * 0.4, y: -h * 0.5},
            {x: w * 0.5, y: -h * 0.3},
            {x: w * 0.3, y: -h * 0.1},
            {x: w * 0.5, y: h * 0.1},
            {x: w * 0.4, y: h * 0.4},
            {x: w * 0.1, y: h * 0.5},
            {x: -w * 0.2, y: h * 0.3},
            {x: -w * 0.4, y: h * 0.1},
            {x: -w * 0.5, y: -h * 0.1},
            {x: -w * 0.3, y: -h * 0.4},
            {x: -w * 0.1, y: -h * 0.5}
        ];
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add asteroid craters and details
        ctx.fillStyle = '#654321';
        const craters = [
            {x: -w * 0.2, y: -h * 0.1, size: 4},
            {x: w * 0.1, y: h * 0.1, size: 3},
            {x: -w * 0.1, y: h * 0.2, size: 2}
        ];
        
        craters.forEach(crater => {
            ctx.beginPath();
            ctx.arc(crater.x, crater.y, crater.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Highlight edges for 3D effect
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(-w * 0.4, -h * 0.5, w * 0.8, 2);
        ctx.fillRect(-w * 0.5, -h * 0.4, 2, h * 0.3);
    },
    
    // Draw detailed spaceship
    drawSpaceship: function(ctx, enemy, drawY) {
        const x = enemy.x;
        const y = drawY;
        const w = enemy.width;
        const h = enemy.height;
        
        // Try to use the loaded spaceship sprite
        if (AssetLoader && AssetLoader.drawImageOrFallback(ctx, 'spaceship', x, y, w, h, '#4169E1')) {
            // Asset loaded and drawn successfully, add engine glow effect
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(x - 8, y + h * 0.4, 12, h * 0.2);
            
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(x - 6, y + h * 0.45, 8, h * 0.1);
            
            // Navigation lights
            const time = Date.now() * 0.01;
            if (Math.sin(time) > 0) {
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(x + w * 0.8, y + h * 0.2, 2, 2);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(x + w * 0.8, y + h * 0.8, 2, 2);
            }
        } else {
            // Fallback to custom pixel art
            // Main hull
            ctx.fillStyle = '#4169E1';
            ctx.beginPath();
            ctx.moveTo(x, y + h / 2);
            ctx.lineTo(x + w * 0.7, y);
            ctx.lineTo(x + w, y + h / 2);
            ctx.lineTo(x + w * 0.7, y + h);
            ctx.closePath();
            ctx.fill();
            
            // Hull highlights
            ctx.fillStyle = '#6495ED';
            ctx.fillRect(x + w * 0.1, y + h * 0.3, w * 0.6, h * 0.1);
            ctx.fillRect(x + w * 0.1, y + h * 0.6, w * 0.6, h * 0.1);
            
            // Cockpit
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(x + w * 0.6, y + h * 0.35, w * 0.3, h * 0.3);
            
            // Engine glow
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(x - 8, y + h * 0.4, 12, h * 0.2);
            
            // Engine core
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(x - 6, y + h * 0.45, 8, h * 0.1);
            
            // Wing details
            ctx.fillStyle = '#191970';
            ctx.fillRect(x + w * 0.2, y, w * 0.1, h * 0.2);
            ctx.fillRect(x + w * 0.2, y + h * 0.8, w * 0.1, h * 0.2);
            
            // Navigation lights
            const time = Date.now() * 0.01;
            if (Math.sin(time) > 0) {
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(x + w * 0.8, y + h * 0.2, 2, 2);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(x + w * 0.8, y + h * 0.8, 2, 2);
            }
        }
    },
    
    // Draw detailed satellite
    drawSatellite: function(ctx, enemy, drawY) {
        const x = enemy.x;
        const y = drawY;
        const w = enemy.width;
        const h = enemy.height;
        
        // Try to use the loaded satellite sprite
        if (AssetLoader && AssetLoader.drawImageOrFallback(ctx, 'satellite', x, y, w, h, '#C0C0C0')) {
            // Asset loaded successfully, add status lights
            const time = Date.now() * 0.005;
            ctx.fillStyle = Math.sin(time) > 0 ? '#00FF00' : '#006400';
            ctx.fillRect(x + w * 0.1, y + h * 0.5, 3, 3);
            ctx.fillStyle = Math.sin(time + 1) > 0 ? '#FF0000' : '#8B0000';
            ctx.fillRect(x + w * 0.9 - 3, y + h * 0.5, 3, 3);
        } else {
            // Fallback to custom rendering
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate(enemy.rotation);
            
            // Main body
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(-w * 0.3, -h * 0.4, w * 0.6, h * 0.8);
            
            // Body panels
            ctx.fillStyle = '#A9A9A9';
            ctx.fillRect(-w * 0.25, -h * 0.35, w * 0.5, h * 0.1);
            ctx.fillRect(-w * 0.25, h * 0.25, w * 0.5, h * 0.1);
            
            // Solar panels
            ctx.fillStyle = '#000080';
            ctx.fillRect(-w * 0.6, -h * 0.2, w * 0.25, h * 0.4);
            ctx.fillRect(w * 0.35, -h * 0.2, w * 0.25, h * 0.4);
            
            // Solar panel grid
            ctx.fillStyle = '#4169E1';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 4; j++) {
                    ctx.fillRect(-w * 0.55 + i * 6, -h * 0.15 + j * 6, 4, 4);
                    ctx.fillRect(w * 0.4 + i * 6, -h * 0.15 + j * 6, 4, 4);
                }
            }
            
            // Communication dish
            ctx.fillStyle = '#DCDCDC';
            ctx.beginPath();
            ctx.arc(0, -h * 0.2, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Antenna
            ctx.fillStyle = '#696969';
            ctx.fillRect(-1, -h * 0.6, 2, h * 0.4);
            
            // Status lights
            const time = Date.now() * 0.005;
            ctx.fillStyle = Math.sin(time) > 0 ? '#00FF00' : '#006400';
            ctx.fillRect(-w * 0.1, 0, 3, 3);
            ctx.fillStyle = Math.sin(time + 1) > 0 ? '#FF0000' : '#8B0000';
            ctx.fillRect(w * 0.1 - 3, 0, 3, 3);
        }
    },
    
    // Draw detailed UFO
    drawUFO: function(ctx, enemy, drawY) {
        const x = enemy.x;
        const y = drawY;
        const w = enemy.width;
        const h = enemy.height;
        
        // Try to use loaded UFO sprites (we have both blue and grey)
        const ufoType = Math.floor(enemy.x / 100) % 2 === 0 ? 'ufo-blue' : 'ufo-grey';
        
        if (AssetLoader && AssetLoader.drawImageOrFallback(ctx, ufoType, x, y, w, h, '#708090')) {
            // Asset loaded successfully, add enhanced effects
            // Underside lights
            const lightCount = 6;
            const time = Date.now() * 0.01;
            for (let i = 0; i < lightCount; i++) {
                const angle = (i / lightCount) * Math.PI * 2 + time;
                const lightX = x + w / 2 + Math.cos(angle) * w * 0.3;
                const lightY = y + h * 0.8;
                
                const lightColor = (Math.sin(time + i) > 0) ? '#FFFF00' : '#FFA500';
                ctx.fillStyle = lightColor;
                ctx.fillRect(lightX - 2, lightY - 2, 4, 4);
                
                // Light beams
                if (Math.sin(time + i * 0.5) > 0.7) {
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                    ctx.fillRect(lightX - 1, lightY, 2, 20);
                }
            }
            
            // Tractor beam effect
            if (Math.sin(time * 2) > 0.8) {
                const gradient = ctx.createLinearGradient(x + w / 2, y + h, x + w / 2, y + h + 40);
                gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x + w / 4, y + h, w / 2, 40);
            }
        } else {
            // Fallback to custom rendering
            // Main saucer body
            ctx.fillStyle = '#708090';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h * 0.7, w * 0.5, h * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Saucer rim
            ctx.fillStyle = '#A9A9A9';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h * 0.7, w * 0.5, h * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Dome
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h * 0.4, w * 0.3, h * 0.4, 0, 0, Math.PI);
            ctx.fill();
            
            // Dome highlight
            ctx.fillStyle = '#B0E0E6';
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h * 0.3, w * 0.2, h * 0.2, 0, 0, Math.PI);
            ctx.fill();
            
            // Underside lights
            const lightCount = 6;
            const time = Date.now() * 0.01;
            for (let i = 0; i < lightCount; i++) {
                const angle = (i / lightCount) * Math.PI * 2 + time;
                const lightX = x + w / 2 + Math.cos(angle) * w * 0.3;
                const lightY = y + h * 0.8;
                
                const lightColor = (Math.sin(time + i) > 0) ? '#FFFF00' : '#FFA500';
                ctx.fillStyle = lightColor;
                ctx.fillRect(lightX - 2, lightY - 2, 4, 4);
                
                // Light beams
                if (Math.sin(time + i * 0.5) > 0.7) {
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                    ctx.fillRect(lightX - 1, lightY, 2, 20);
                }
            }
            
            // Tractor beam effect
            if (Math.sin(time * 2) > 0.8) {
                const gradient = ctx.createLinearGradient(x + w / 2, y + h, x + w / 2, y + h + 40);
                gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x + w / 4, y + h, w / 2, 40);
            }
            
            // Hull panels
            ctx.fillStyle = '#556B2F';
            ctx.fillRect(x + w * 0.2, y + h * 0.65, w * 0.6, 2);
            ctx.fillRect(x + w * 0.3, y + h * 0.75, w * 0.4, 2);
        }
    },
    
    // Draw laser spaceship (more aggressive looking)
    drawLaserSpaceship: function(ctx, enemy, drawY) {
        const x = enemy.x;
        const y = drawY;
        const w = enemy.width;
        const h = enemy.height;
        
        // Main hull (more angular and aggressive)
        ctx.fillStyle = '#FF6347'; // Tomato red
        ctx.beginPath();
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w * 0.2, y);
        ctx.lineTo(x + w * 0.8, y + h * 0.1);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w * 0.8, y + h * 0.9);
        ctx.lineTo(x + w * 0.2, y + h);
        ctx.closePath();
        ctx.fill();
        
        // Hull highlights
        ctx.fillStyle = '#FF8C69';
        ctx.fillRect(x + w * 0.1, y + h * 0.25, w * 0.7, h * 0.1);
        ctx.fillRect(x + w * 0.1, y + h * 0.65, w * 0.7, h * 0.1);
        
        // Aggressive cockpit
        ctx.fillStyle = '#8B0000'; // Dark red
        ctx.fillRect(x + w * 0.65, y + h * 0.3, w * 0.25, h * 0.4);
        
        // Weapon ports
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + w * 0.85, y + h * 0.35, 6, 4);
        ctx.fillRect(x + w * 0.85, y + h * 0.6, 6, 4);
        
        // Weapon barrel glow
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + w * 0.87, y + h * 0.36, 4, 2);
        ctx.fillRect(x + w * 0.87, y + h * 0.61, 4, 2);
        
        // Engine glow
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(x - 10, y + h * 0.35, 15, h * 0.3);
        
        // Engine core
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x - 8, y + h * 0.4, 10, h * 0.2);
        
        // Wing details with weapon mounts
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(x + w * 0.3, y, w * 0.15, h * 0.25);
        ctx.fillRect(x + w * 0.3, y + h * 0.75, w * 0.15, h * 0.25);
        
        // Charging laser effect
        const time = Date.now() * 0.01;
        if (Math.sin(time * 3) > 0.7) {
            ctx.fillStyle = '#FF0000';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 10;
            ctx.fillRect(x + w * 0.85, y + h * 0.35, 8, 4);
            ctx.fillRect(x + w * 0.85, y + h * 0.6, 8, 4);
            ctx.shadowBlur = 0;
        }
        
        // Navigation lights
        if (Math.sin(time) > 0) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(x + w * 0.9, y + h * 0.15, 2, 2);
            ctx.fillRect(x + w * 0.9, y + h * 0.85, 2, 2);
        }
    },
    
    // Draw laser projectiles
    drawLasers: function(ctx) {
        this.lasers.forEach(laser => {
            ctx.save();
            
            // Laser beam with glow effect
            ctx.shadowColor = laser.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = laser.color;
            ctx.fillRect(laser.x, laser.y - laser.height / 2, laser.width, laser.height);
            
            // Bright center
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(laser.x + 2, laser.y - laser.height / 4, laser.width - 4, laser.height / 2);
            
            // Laser tip
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(laser.x + laser.width - 3, laser.y - 1, 3, 2);
            
            ctx.restore();
        });
    },
    
    // Check collision with enemies (deadly)
    checkEnemyCollision: function(playerBounds) {
        for (const enemy of this.enemies) {
            let enemyY = enemy.y;
            if (enemy.floatOffset !== undefined) {
                enemyY += enemy.floatOffset;
            }
            if (enemy.animOffset !== undefined) {
                enemyY += enemy.animOffset;
            }
            
            if (playerBounds.x < enemy.x + enemy.width &&
                playerBounds.x + playerBounds.width > enemy.x &&
                playerBounds.y < enemyY + enemy.height &&
                playerBounds.y + playerBounds.height > enemyY) {
                return enemy; // Collision detected
            }
        }
        return null;
    },
    
    // Check collision between player and enemy lasers
    checkLaserCollision: function(playerBounds) {
        for (const laser of this.lasers) {
            if (playerBounds.x < laser.x + laser.width &&
                playerBounds.x + playerBounds.width > laser.x &&
                playerBounds.y < laser.y + laser.height &&
                playerBounds.y + playerBounds.height > laser.y) {
                return laser; // Collision detected
            }
        }
        return null;
    },
    
    // Check rocket collisions with destroyable objects
    checkRocketCollisions: function(rockets) {
        const hits = [];
        
        for (let i = rockets.length - 1; i >= 0; i--) {
            const rocket = rockets[i];
            
            // Check collision with enemies (asteroids and spaceships)
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                let enemyY = enemy.y;
                if (enemy.floatOffset !== undefined) {
                    enemyY += enemy.floatOffset;
                }
                if (enemy.animOffset !== undefined) {
                    enemyY += enemy.animOffset;
                }
                
                if (rocket.x < enemy.x + enemy.width &&
                    rocket.x + rocket.size > enemy.x &&
                    rocket.y < enemyY + enemy.height &&
                    rocket.y + rocket.size > enemyY) {
                    
                    // Create explosion effect at enemy position
                    this.createExplosion(enemy.x + enemy.width / 2, enemyY + enemy.height / 2);
                    
                    // Remove enemy and rocket
                    hits.push({
                        type: 'enemy',
                        enemy: this.enemies.splice(j, 1)[0],
                        rocket: rockets.splice(i, 1)[0]
                    });
                    break; // Exit enemy loop since rocket is destroyed
                }
            }
        }
        
        return hits;
    },
    
    // Create explosion effect
    createExplosion: function(x, y) {
        // Add explosion particles (we'll use the existing particle system)
        if (this.explosions === undefined) {
            this.explosions = [];
        }
        
        const explosion = {
            x: x,
            y: y,
            particles: [],
            lifetime: 1000,
            createdAt: Date.now()
        };
        
        // Create explosion particles
        for (let i = 0; i < 15; i++) {
            explosion.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: (Math.random() - 0.5) * 10,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#FF4500' : '#FFFF00',
                life: 1.0
            });
        }
        
        this.explosions.push(explosion);
    },
    
    // Update and draw explosions
    updateExplosions: function(deltaTime, ctx) {
        if (!this.explosions) return;
        
        const currentTime = Date.now();
        
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const age = currentTime - explosion.createdAt;
            
            if (age > explosion.lifetime) {
                this.explosions.splice(i, 1);
                continue;
            }
            
            // Update particles
            for (let j = explosion.particles.length - 1; j >= 0; j--) {
                const particle = explosion.particles[j];
                
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.velocityY += 0.2; // Gravity
                particle.life -= deltaTime / explosion.lifetime;
                particle.size *= 0.99;
                
                if (particle.life <= 0 || particle.size <= 0.1) {
                    explosion.particles.splice(j, 1);
                }
            }
            
            // Draw explosion
            if (ctx) {
                ctx.save();
                explosion.particles.forEach(particle => {
                    ctx.globalAlpha = particle.life;
                    ctx.fillStyle = particle.color;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }
        }
    },
    
    // Check collision with platforms - now with full solid collision from all directions
    checkPlatformCollision: function(playerBounds, player) {
        for (const platform of this.platforms) {
            // Check for collision
            if (playerBounds.x < platform.x + platform.width &&
                playerBounds.x + playerBounds.width > platform.x &&
                playerBounds.y < platform.y + platform.height &&
                playerBounds.y + playerBounds.height > platform.y) {
                
                // Calculate overlap on each side
                const overlapLeft = (playerBounds.x + playerBounds.width) - platform.x;
                const overlapRight = (platform.x + platform.width) - playerBounds.x;
                const overlapTop = (playerBounds.y + playerBounds.height) - platform.y;
                const overlapBottom = (platform.y + platform.height) - playerBounds.y;
                
                // Find the smallest overlap to determine collision direction
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                // Handle collision based on direction with smallest overlap
                if (minOverlap === overlapTop && player.velocityY >= 0) {
                    // Landing on top of platform
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                    player.jumpCount = 0;
                    player.onGround = false;
                    player.onPlatform = true;
                    return { type: 'land', platform: platform, direction: 'top' };
                    
                } else if (minOverlap === overlapBottom && player.velocityY < 0) {
                    // Hitting platform from below
                    player.y = platform.y + platform.height;
                    player.velocityY = 0;
                    return { type: 'block', platform: platform, direction: 'bottom' };
                    
                } else if (minOverlap === overlapLeft && player.velocityX > 0) {
                    // Hitting platform from the left
                    player.x = platform.x - player.width;
                    player.velocityX = 0;
                    return { type: 'block', platform: platform, direction: 'left' };
                    
                } else if (minOverlap === overlapRight && player.velocityX < 0) {
                    // Hitting platform from the right
                    player.x = platform.x + platform.width;
                    player.velocityX = 0;
                    return { type: 'block', platform: platform, direction: 'right' };
                    
                } else {
                    // Default case - push player out based on smallest overlap
                    if (minOverlap === overlapLeft) {
                        player.x = platform.x - player.width;
                        player.velocityX = 0;
                    } else if (minOverlap === overlapRight) {
                        player.x = platform.x + platform.width;
                        player.velocityX = 0;
                    } else if (minOverlap === overlapTop) {
                        player.y = platform.y - player.height;
                        player.velocityY = 0;
                        player.onPlatform = true;
                    } else if (minOverlap === overlapBottom) {
                        player.y = platform.y + platform.height;
                        player.velocityY = 0;
                    }
                    return { type: 'block', platform: platform, direction: 'unknown' };
                }
            }
        }
        return null;
    },
    
    // Get platforms for collision detection
    getPlatforms: function() {
        return this.platforms;
    },
    
    // Reset obstacles
    reset: function() {
        this.platforms = [];
        this.enemies = [];
        this.explosions = [];
        this.lasers = [];
        this.nextPlatformTime = 1000; // Start with a small delay
        this.nextEnemyTime = 2000;
        
        // Reset platform generation state
        this.lastPlatformY = 0;
        this.lastPlatformX = 0;
        this.platformChainLength = 0;
        this.currentChainType = null;
        
        console.log('Obstacles reset');
    },
    
    // Adjust positions after resize
    adjustPositionAfterResize: function(oldWidth, oldHeight, newWidth, newHeight) {
        // Adjust platform positions
        this.platforms.forEach(platform => {
            platform.x = (platform.x / oldWidth) * newWidth;
            platform.y = newHeight - CONFIG.GROUND_HEIGHT * this.scaleRatio - platform.height;
        });
        
        // Adjust enemy positions
        this.enemies.forEach(enemy => {
            enemy.x = (enemy.x / oldWidth) * newWidth;
            enemy.y = (enemy.y / oldHeight) * newHeight;
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Obstacles;
} 