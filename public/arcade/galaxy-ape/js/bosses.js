// Run Ape - Boss System Module

const Bosses = {
    // Boss data
    currentBoss: null,
    bossProjectiles: [],
    
    // Boss spawn tracking
    lastDifficultyLevel: 0,
    bossDefeated: false,
    
    // Performance tracking
    lastAttackTime: 0,
    lastSpecialAttackTime: 0,
    reducedEffectsMode: false,
    
    // Scale ratio for responsive design
    scaleRatio: 1,
    canvas: null,
    
    // Enhanced boss types with harder difficulty and advanced shooting patterns
    bossTypes: {
        BOSS_1: {
            name: 'Space Cruiser Alpha',
            width: 120,
            height: 80,
            health: 80, // Doubled health
            color: '#4a4a4a',
            attackPattern: 'radial_burst',
            projectileSpeed: 3,
            fireRate: 800, // Faster firing
            points: 500,
            movement: 'aggressive_horizontal',
            spriteImage: 'assets/images/Spaceship Pack/ship_1.png'
        },
        BOSS_2: {
            name: 'Star Destroyer',
            width: 140,
            height: 90,
            health: 120,
            color: '#ff4444',
            attackPattern: 'spiral_death',
            projectileSpeed: 3.5,
            fireRate: 600,
            points: 700,
            movement: 'hunting_vertical',
            spriteImage: 'assets/images/Spaceship Pack/ship_2.png'
        },
        BOSS_3: {
            name: 'Battle Fortress',
            width: 160,
            height: 120,
            health: 160,
            color: '#444444',
            attackPattern: 'circle_barrage',
            projectileSpeed: 3.2,
            fireRate: 400,
            points: 1000,
            movement: 'fortress_orbit',
            spriteImage: 'assets/images/Spaceship Pack/ship_3.png'
        },
        BOSS_4: {
            name: 'Viper Commander',
            width: 130,
            height: 85,
            health: 140,
            color: '#00ff44',
            attackPattern: 'pulse_wave',
            projectileSpeed: 4,
            fireRate: 300,
            points: 900,
            movement: 'erratic_strike',
            spriteImage: 'assets/images/Spaceship Pack/ship_4.png'
        },
        BOSS_5: {
            name: 'Titan Warship',
            width: 150,
            height: 100,
            health: 200,
            color: '#8a2be2',
            attackPattern: 'rotating_cannon',
            projectileSpeed: 4.2,
            fireRate: 250,
            points: 1200,
            movement: 'tank_sweep',
            spriteImage: 'assets/images/Spaceship Pack/ship_5.png'
        },
        BOSS_6: {
            name: 'Dreadnought Prime',
            width: 180,
            height: 130,
            health: 300,
            color: '#ff6600',
            attackPattern: 'hellstorm',
            projectileSpeed: 4.5,
            fireRate: 200,
            points: 1500,
            movement: 'dreadnought_assault',
            spriteImage: 'assets/images/Spaceship Pack/ship_6.png'
        }
    },
    
    // Initialize boss system
    init: function(canvas) {
        this.canvas = canvas;
        this.scaleRatio = 1;
        this.currentBoss = null;
        this.bossProjectiles = [];
        this.lastDifficultyLevel = 0;
        this.bossDefeated = false;
        console.log('Boss system initialized');
    },
    
    // Update scale for responsive design
    updateScale: function(canvas, scaleRatio) {
        this.scaleRatio = scaleRatio;
        this.canvas = canvas;
    },
    
    // Trigger boss after wave completion (called by wave system)
    triggerBossAfterWave: function(waveNumber) {
        if (!this.currentBoss) {
            setTimeout(() => {
                this.spawnBoss(this.canvas, waveNumber);
            }, 1000); // 1 second delay after wave complete notification
        }
    },
    
    // Check if boss should spawn based on difficulty (legacy - now handled by wave system)
    shouldSpawnBoss: function(score) {
        // Disabled - now handled by wave completion
        return false;
    },
    
    // Spawn boss (called by wave system)
    spawnBoss: function(canvas, waveNumber) {
        // Choose boss type based on wave number (cycle through BOSS_1 to BOSS_6)
        const bossTypeKeys = Object.keys(this.bossTypes);
        const bossTypeKey = bossTypeKeys[(waveNumber - 1) % bossTypeKeys.length];
        const bossType = this.bossTypes[bossTypeKey];
        
        // Aggressive scaling based on wave number
        const healthMultiplier = 1 + (waveNumber - 1) * 0.4; // 40% more health per wave
        const speedMultiplier = 1 + (waveNumber - 1) * 0.15; // 15% faster projectiles per wave (reduced from 20%)
        const fireRateMultiplier = Math.max(0.3, 1 - (waveNumber - 1) * 0.1); // 10% faster firing per wave (min 30% of original)
        
        const scaledHealth = Math.floor(bossType.health * healthMultiplier);
        const scaledProjectileSpeed = bossType.projectileSpeed * speedMultiplier;
        const scaledFireRate = Math.floor(bossType.fireRate * fireRateMultiplier);
        
        // Create enhanced boss config for this wave
        const enhancedConfig = Object.assign({}, bossType, {
            projectileSpeed: scaledProjectileSpeed,
            fireRate: scaledFireRate
        });
        
        // Apply portrait mode scaling to boss size
        const portraitScale = CONFIG.getPortraitScale('SPACESHIP');
        
        this.currentBoss = {
            x: canvas.width + bossType.width,
            y: canvas.height / 2 - bossType.height / 2,
            width: bossType.width * this.scaleRatio * portraitScale,
            height: bossType.height * this.scaleRatio * portraitScale,
            health: scaledHealth,
            maxHealth: scaledHealth,
            type: bossTypeKey,
            config: enhancedConfig,
            lastFireTime: 0,
            lastSpecialAttack: 0,
            animTime: 0,
            direction: 1, // For movement patterns
            entryComplete: false,
            waveNumber: waveNumber,
            rotationAngle: 0, // For circular shooting patterns
            burstCounter: 0, // For burst patterns
            phaseTimer: 0 // For pattern switching
        };
        
        // Show boss notification with difficulty indicator
        if (typeof UI !== 'undefined' && UI.showNotification) {
            const difficultyStars = '⭐'.repeat(Math.min(waveNumber, 10));
            UI.showNotification(`🚨 WAVE ${waveNumber} BOSS: ${bossType.name}! ${difficultyStars} 🚨`, 3000);
        }
        
        console.log(`Enhanced Boss spawned for wave ${waveNumber}: ${bossType.name} (${Math.floor(healthMultiplier*100)}% health, ${Math.floor(speedMultiplier*100)}% speed, ${Math.floor(fireRateMultiplier*100)}% fire rate)`);
    },
    
    // Update boss system
    update: function(deltaTime, gameSpeed, canvas, score) {
        // Bosses are only spawned after wave completion (not by score)
        
        // Update current boss
        if (this.currentBoss) {
            this.updateBoss(deltaTime, gameSpeed, canvas);
        }
        
        // Update boss projectiles
        this.updateProjectiles(deltaTime, canvas);
    },
    
    // Update boss behavior
    updateBoss: function(deltaTime, gameSpeed, canvas) {
        const boss = this.currentBoss;
        boss.animTime += deltaTime;
        
        // Boss entry phase
        if (!boss.entryComplete) {
            boss.x -= gameSpeed * 2; // Enter from right
            if (boss.x <= canvas.width - boss.width - 50) {
                boss.entryComplete = true;
                boss.x = canvas.width - boss.width - 50;
            }
            return;
        }
        
        // Boss movement patterns
        this.updateBossMovement(boss, deltaTime, canvas);
        
        // Boss attack patterns
        this.updateBossAttacks(boss, deltaTime, canvas);
    },
    
    // Update boss movement with enhanced aggressive patterns
    updateBossMovement: function(boss, deltaTime, canvas) {
        const config = boss.config;
        const time = boss.animTime * 0.001;
        const waveIntensity = 1 + (boss.waveNumber - 1) * 0.3; // Increase movement intensity with waves
        
        switch (config.movement) {
            case 'aggressive_horizontal':
                boss.y = (canvas.height / 2) + Math.sin(time * 2.0 * waveIntensity) * (80 * waveIntensity);
                // Occasionally rush forward
                if (Math.sin(time * 0.5) > 0.7) {
                    boss.x -= 2 * waveIntensity;
                }
                break;
                
            case 'hunting_vertical':
                boss.y += boss.direction * (2.0 * waveIntensity);
                if (boss.y <= 30 || boss.y >= canvas.height - boss.height - 30) {
                    boss.direction *= -1;
                }
                // Try to track player position if available
                if (typeof Player !== 'undefined' && Player.y) {
                    const targetY = Player.y + Player.height / 2;
                    if (Math.abs(boss.y + boss.height / 2 - targetY) > 50) {
                        boss.y += (targetY > boss.y + boss.height / 2 ? 1 : -1) * waveIntensity;
                    }
                }
                break;
                
            case 'fortress_orbit':
                const centerY = canvas.height / 2;
                const orbitRadius = 100 * waveIntensity;
                boss.y = centerY + Math.sin(time * 1.5) * orbitRadius;
                boss.x = (canvas.width - boss.width - 80) + Math.cos(time * 1.5) * 40;
                break;
                
            case 'erratic_strike':
                // Unpredictable movement with sudden direction changes
                boss.phaseTimer += deltaTime;
                if (boss.phaseTimer > 2000) { // Change direction every 2 seconds
                    boss.direction = (Math.random() - 0.5) * 4 * waveIntensity;
                    boss.phaseTimer = 0;
                }
                boss.y += boss.direction;
                boss.x -= Math.sin(time * 4) * 1.5 * waveIntensity;
                break;
                
            case 'tank_sweep':
                // Slow but steady with side-to-side sweeping
                boss.y += Math.sin(time * 1.8) * 3 * waveIntensity;
                boss.x -= 0.5; // Slowly advance
                break;
                
            case 'dreadnought_assault':
                // Most aggressive - combines multiple patterns
                const phase = Math.floor(time * 0.3) % 3;
                switch (phase) {
                    case 0: // Aggressive pursuit
                        if (typeof Player !== 'undefined' && Player.y) {
                            const dy = (Player.y + Player.height / 2) - (boss.y + boss.height / 2);
                            boss.y += Math.sign(dy) * 2 * waveIntensity;
                        }
                        break;
                    case 1: // Circular assault
                        boss.y = (canvas.height / 2) + Math.sin(time * 2.5) * (120 * waveIntensity);
                        boss.x -= Math.cos(time * 1.2) * 2;
                        break;
                    case 2: // Ramming speed
                        boss.x -= 3 * waveIntensity;
                        boss.y += Math.sin(time * 5) * 2;
                        break;
                }
                break;
        }
        
        // Keep boss on screen with more aggressive bounds
        boss.y = Math.max(10, Math.min(canvas.height - boss.height - 10, boss.y));
        boss.x = Math.max(canvas.width * 0.5, Math.min(canvas.width - boss.width, boss.x));
        
        // Reset position if boss goes too far left (for ramming attacks)
        if (boss.x < canvas.width * 0.4) {
            boss.x = canvas.width * 0.7;
        }
    },
    
    // Update boss attacks with wave-based intensity and performance controls
    updateBossAttacks: function(boss, deltaTime, canvas) {
        const currentTime = Date.now();
        
        // Performance-based attack rate limiting
        const minAttackInterval = Math.max(CONFIG.PERFORMANCE.MIN_ATTACK_INTERVAL, boss.config.fireRate);
        const minSpecialInterval = CONFIG.PERFORMANCE.MIN_SPECIAL_ATTACK_INTERVAL;
        
        // Skip attacks if too many projectiles exist
        if (this.bossProjectiles.length >= CONFIG.PERFORMANCE.MAX_BOSS_PROJECTILES * 0.8) {
            this.lastAttackTime = currentTime; // Reset to prevent immediate spam when count drops
            return;
        }
        
        // Primary attack pattern with rate limiting
        if (currentTime - this.lastAttackTime >= minAttackInterval && 
            currentTime - boss.lastFireTime >= boss.config.fireRate) {
            this.fireBossProjectile(boss, canvas);
            boss.lastFireTime = currentTime;
            this.lastAttackTime = currentTime;
        }
        
        // Special attack patterns (triggered less frequently)
        const specialAttackDelay = Math.max(minSpecialInterval, 3000 - (boss.waveNumber * 100)); // Reduced scaling
        if (currentTime - this.lastSpecialAttackTime >= minSpecialInterval &&
            currentTime - boss.lastSpecialAttack >= specialAttackDelay) {
            this.fireSpecialAttack(boss, canvas);
            boss.lastSpecialAttack = currentTime;
            this.lastSpecialAttackTime = currentTime;
        }
        
        // Update rotation angle for circular patterns
        boss.rotationAngle += deltaTime * 0.002 * (1 + boss.waveNumber * 0.2);
    },
    
    // Fire boss projectile based on enhanced attack patterns with performance limits
    fireBossProjectile: function(boss, canvas) {
        const config = boss.config;
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        const waveMultiplier = 1 + boss.waveNumber * 0.2;
        
        // Calculate performance-adjusted projectile count
        const performanceScale = this.reducedEffectsMode ? 0.5 : 1.0;
        const maxProjectilesPerAttack = Math.floor(CONFIG.PERFORMANCE.MAX_PROJECTILES_PER_ATTACK * performanceScale);
        
        switch (config.attackPattern) {
            case 'radial_burst':
                // Fire projectiles in all directions from center (reduced count)
                const burstCount = Math.min(maxProjectilesPerAttack, Math.min(8, 4 + Math.floor(boss.waveNumber / 2)));
                for (let i = 0; i < burstCount; i++) {
                    const angle = (Math.PI * 2 / burstCount) * i + boss.rotationAngle;
                    const speed = config.projectileSpeed * waveMultiplier;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ff6600'
                    );
                }
                break;
                
            case 'spiral_death':
                // Rotating spiral pattern (reduced arms)
                const spiralArms = Math.min(maxProjectilesPerAttack, Math.min(6, 3 + Math.floor(boss.waveNumber / 3)));
                for (let i = 0; i < spiralArms; i++) {
                    const angle = boss.rotationAngle + (Math.PI * 2 / spiralArms) * i;
                    const speed = config.projectileSpeed * waveMultiplier;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ff0000'
                    );
                }
                break;
                
            case 'circle_barrage':
                // Dense circular wall of projectiles (significantly reduced)
                const circleCount = Math.min(maxProjectilesPerAttack, Math.min(12, 6 + Math.floor(boss.waveNumber / 2)));
                for (let i = 0; i < circleCount; i++) {
                    const angle = (Math.PI * 2 / circleCount) * i;
                    const speed = config.projectileSpeed * waveMultiplier * 0.8;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ffff00'
                    );
                }
                break;
                
            case 'pulse_wave':
                // Expanding rings of projectiles (reduced count)
                boss.burstCounter = (boss.burstCounter + 1) % 3;
                const ringRadius = (boss.burstCounter + 1) * 0.3;
                const pulseCount = Math.min(maxProjectilesPerAttack, Math.min(10, 5 + Math.floor(boss.waveNumber / 2)));
                for (let i = 0; i < pulseCount; i++) {
                    const angle = (Math.PI * 2 / pulseCount) * i;
                    const speed = config.projectileSpeed * waveMultiplier * ringRadius;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#00ff00'
                    );
                }
                break;
                
            case 'rotating_cannon':
                // Rotating concentrated beam (reduced width)
                const beamAngle = boss.rotationAngle;
                const beamWidth = Math.min(maxProjectilesPerAttack, Math.min(5, 2 + Math.floor(boss.waveNumber / 3)));
                for (let i = 0; i < beamWidth; i++) {
                    const spreadAngle = beamAngle + (i - beamWidth/2) * 0.3;
                    const speed = config.projectileSpeed * waveMultiplier;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(spreadAngle) * speed,
                        Math.sin(spreadAngle) * speed,
                        '#8a2be2'
                    );
                }
                break;
                
            case 'hellstorm':
                // Ultimate chaos pattern - significantly reduced for performance
                const availableProjectiles = maxProjectilesPerAttack;
                let usedProjectiles = 0;
                
                // Spiral component (reduced)
                const spiralCount = Math.min(4, Math.floor(availableProjectiles * 0.4));
                for (let i = 0; i < spiralCount && usedProjectiles < availableProjectiles; i++) {
                    const spiralAngle = boss.rotationAngle * 1.5 + (Math.PI * 2 / spiralCount) * i;
                    const speed = config.projectileSpeed * waveMultiplier;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(spiralAngle) * speed,
                        Math.sin(spiralAngle) * speed,
                        '#ff6600'
                    );
                    usedProjectiles++;
                }
                
                // Cross pattern (only if enough projectiles left)
                if (usedProjectiles < availableProjectiles - 4) {
                    const crossAngles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
                    crossAngles.forEach(angle => {
                        if (usedProjectiles < availableProjectiles) {
                            const speed = config.projectileSpeed * waveMultiplier * 1.2;
                            this.createBossProjectile(
                                centerX, centerY,
                                Math.cos(angle) * speed,
                                Math.sin(angle) * speed,
                                '#ff0000'
                            );
                            usedProjectiles++;
                        }
                    });
                }
                
                // Skip diagonal and random chaos to prevent lag
                break;
        }
    },
    
    // Special devastating attack patterns (optimized for performance)
    fireSpecialAttack: function(boss, canvas) {
        const config = boss.config;
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;
        const waveMultiplier = 1 + boss.waveNumber * 0.25;
        
        // Performance-based special attack limits
        const performanceScale = this.reducedEffectsMode ? 0.3 : 0.7; // Further reduced
        const maxSpecialProjectiles = Math.floor(CONFIG.PERFORMANCE.MAX_SPECIAL_PROJECTILES * performanceScale);
        
        // Choose special attack based on boss type and wave number
        switch (config.attackPattern) {
            case 'radial_burst':
                // Nova explosion - reduced count
                const novaCount = Math.min(maxSpecialProjectiles, Math.min(16, 8 + Math.floor(boss.waveNumber / 2)));
                for (let i = 0; i < novaCount; i++) {
                    const angle = (Math.PI * 2 / novaCount) * i;
                    const speed = config.projectileSpeed * waveMultiplier * 1.5;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ffaa00',
                        12 // Larger projectiles
                    );
                }
                break;
                
            case 'spiral_death':
                // Single layer spiral (reduced from double helix)
                const spiralCount = Math.min(maxSpecialProjectiles, Math.min(10, 5 + Math.floor(boss.waveNumber / 2)));
                for (let i = 0; i < spiralCount; i++) {
                    const angle = boss.rotationAngle + (Math.PI * 2 / spiralCount) * i;
                    const speed = config.projectileSpeed * waveMultiplier * 1.3;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ff4444',
                        10
                    );
                }
                break;
                
            case 'circle_barrage':
                // Single ring attack (reduced from concentric rings)
                const ringCount = Math.min(maxSpecialProjectiles, Math.min(16, 8 + Math.floor(boss.waveNumber / 2)));
                for (let i = 0; i < ringCount; i++) {
                    const angle = (Math.PI * 2 / ringCount) * i;
                    const speed = config.projectileSpeed * waveMultiplier * 1.2;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ffff00',
                        10
                    );
                }
                break;
                
            case 'pulse_wave':
                // Single shockwave attack (reduced from expanding waves)
                const projectilesInWave = Math.min(maxSpecialProjectiles, Math.min(18, 10 + Math.floor(boss.waveNumber / 2)));
                for (let i = 0; i < projectilesInWave; i++) {
                    const angle = (Math.PI * 2 / projectilesInWave) * i;
                    const speed = config.projectileSpeed * waveMultiplier * 1.3;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#00ffaa',
                        8
                    );
                }
                break;
                
            case 'rotating_cannon':
                // Simple beam attack (reduced from sweeping barrage)
                const beamProjectiles = Math.min(maxSpecialProjectiles, Math.min(8, 4 + Math.floor(boss.waveNumber / 3)));
                for (let i = 0; i < beamProjectiles; i++) {
                    const beamAngle = boss.rotationAngle + (i - beamProjectiles/2) * 0.3;
                    const speed = config.projectileSpeed * waveMultiplier * 1.4;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(beamAngle) * speed,
                        Math.sin(beamAngle) * speed,
                        '#aa44ff',
                        10
                    );
                }
                break;
                
            case 'hellstorm':
                // Simplified chaos pattern (heavily reduced)
                const availableProjectiles = maxSpecialProjectiles;
                let usedProjectiles = 0;
                
                // Simple spiral (reduced count)
                const specialSpiralCount = Math.min(8, Math.floor(availableProjectiles * 0.6));
                for (let i = 0; i < specialSpiralCount && usedProjectiles < availableProjectiles; i++) {
                    const spiralAngle = boss.rotationAngle + (Math.PI * 2 / specialSpiralCount) * i;
                    const speed = config.projectileSpeed * waveMultiplier * 1.2;
                    this.createBossProjectile(
                        centerX, centerY,
                        Math.cos(spiralAngle) * speed,
                        Math.sin(spiralAngle) * speed,
                        '#ff6600',
                        12
                    );
                    usedProjectiles++;
                }
                
                // Cross pattern (only if room left)
                if (usedProjectiles < availableProjectiles - 4) {
                    const crossAngles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
                    crossAngles.forEach(angle => {
                        if (usedProjectiles < availableProjectiles) {
                            const speed = config.projectileSpeed * waveMultiplier * 1.0;
                            this.createBossProjectile(
                                centerX, centerY,
                                Math.cos(angle) * speed,
                                Math.sin(angle) * speed,
                                '#ff0000',
                                10
                            );
                            usedProjectiles++;
                        }
                    });
                }
                break;
        }
    },
    
    // Create boss projectile with enhanced properties and performance limits
    createBossProjectile: function(x, y, velocityX, velocityY, color, size = 8) {
        // Performance check: Don't create projectile if at limit
        if (this.bossProjectiles.length >= CONFIG.PERFORMANCE.MAX_BOSS_PROJECTILES) {
            // Remove oldest projectile to make room
            this.bossProjectiles.shift();
        }
        
        // Apply portrait mode scaling to boss projectile size
        const portraitScale = CONFIG.getPortraitScale('PROJECTILE');
        
        const projectile = {
            x: x,
            y: y,
            velocityX: velocityX,
            velocityY: velocityY,
            size: size * portraitScale,
            color: color,
            lifetime: this.reducedEffectsMode ? 3000 : 5000, // Shorter lifetime in reduced mode
            createdAt: Date.now()
        };
        
        this.bossProjectiles.push(projectile);
    },
    
    // Update boss projectiles with performance optimizations
    updateProjectiles: function(deltaTime, canvas) {
        const currentTime = Date.now();
        const cullDistance = CONFIG.PERFORMANCE.PROJECTILE_CULL_DISTANCE;
        
        // Update performance mode based on projectile count
        this.reducedEffectsMode = this.bossProjectiles.length >= CONFIG.PERFORMANCE.REDUCED_VISUAL_EFFECTS_THRESHOLD;
        CONFIG.PERFORMANCE.REDUCED_EFFECTS_MODE = this.reducedEffectsMode;
        
        for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.bossProjectiles[i];
            
            // Update position
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;
            
            // Enhanced cleanup conditions
            const expired = currentTime - projectile.createdAt > projectile.lifetime;
            const offScreenLeft = projectile.x < -cullDistance;
            const offScreenRight = projectile.x > canvas.width + cullDistance;
            const offScreenTop = projectile.y < -cullDistance;
            const offScreenBottom = projectile.y > canvas.height + cullDistance;
            
            // More aggressive cleanup in reduced effects mode
            const shouldRemove = expired || offScreenLeft || offScreenRight || offScreenTop || offScreenBottom ||
                                (this.reducedEffectsMode && (
                                    projectile.x < -100 || projectile.x > canvas.width + 100 ||
                                    projectile.y < -100 || projectile.y > canvas.height + 100
                                ));
            
            if (shouldRemove) {
                this.bossProjectiles.splice(i, 1);
            }
        }
        
        // Emergency cleanup if still too many projectiles
        if (this.bossProjectiles.length > CONFIG.PERFORMANCE.MAX_BOSS_PROJECTILES * 1.2) {
            const excessCount = this.bossProjectiles.length - CONFIG.PERFORMANCE.MAX_BOSS_PROJECTILES;
            this.bossProjectiles.splice(0, excessCount);
        }
    },
    
    // Draw boss and projectiles
    draw: function(ctx) {
        // Draw boss
        if (this.currentBoss) {
            this.drawBoss(ctx, this.currentBoss);
        }
        
        // Draw boss projectiles with minimal visual effects for performance
        for (const projectile of this.bossProjectiles) {
            // Simple circle rendering - no animations or effects
            ctx.fillStyle = projectile.color;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Simple white center dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    // Draw boss
    drawBoss: function(ctx, boss) {
        ctx.save();
        
        const config = boss.config;
        const pulseIntensity = 0.8 + 0.2 * Math.sin(boss.animTime * 0.005);
        
        // Try to draw sprite image first
        if (config.spriteImage) {
            const spriteImage = new Image();
            spriteImage.src = config.spriteImage;
            
            if (spriteImage.complete && spriteImage.naturalWidth > 0) {
                // Draw the spaceship sprite - no glow effects for performance
                ctx.drawImage(spriteImage, boss.x, boss.y, boss.width, boss.height);
            } else {
                // Fallback to colored rectangle if image not loaded
                ctx.fillStyle = config.color;
                ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
                
                // Boss type indicator text
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(boss.type.replace('BOSS_', ''), boss.x + boss.width / 2, boss.y + boss.height / 2);
            }
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = config.color;
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        }
        
        // Skip engine glow effects for performance
        
        // Draw warning indicators
        if (!boss.entryComplete) {
            ctx.fillStyle = '#ff0000';
            ctx.globalAlpha = Math.sin(boss.animTime * 0.01) > 0 ? 1 : 0.5;
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ BOSS ⚠️', boss.x + boss.width / 2, boss.y - 20);
            ctx.globalAlpha = 1.0;
        }
        
        ctx.restore();
    },
    
    // Check collision with player projectiles
    checkProjectileCollisions: function() {
        if (!this.currentBoss) return 0;
        
        const hitResult = Weapons.checkCollision(this.currentBoss);
        if (hitResult) {
            this.currentBoss.health -= hitResult.damage;
            
            // Create hit effect
            if (typeof Asteroids !== 'undefined' && Asteroids.createHitEffect) {
                Asteroids.createHitEffect(
                    this.currentBoss.x + this.currentBoss.width / 2,
                    this.currentBoss.y + this.currentBoss.height / 2
                );
            }
            
            if (this.currentBoss.health <= 0) {
                // Boss defeated
                const points = this.currentBoss.config.points;
                
                // Create big explosion
                if (typeof Asteroids !== 'undefined' && Asteroids.createExplosion) {
                    Asteroids.createExplosion(
                        this.currentBoss.x + this.currentBoss.width / 2,
                        this.currentBoss.y + this.currentBoss.height / 2
                    );
                }
                
                // Show defeat notification
                if (typeof UI !== 'undefined' && UI.showNotification) {
                    UI.showNotification(`🎉 BOSS DEFEATED! +${points} pts! +❤️ LIFE! 🎉`, 4000);
                }
                
                // Give player an extra life for defeating boss
                if (typeof Game !== 'undefined' && Game.addLife) {
                    Game.addLife();
                } else {
                    // Fallback: try to access game instance directly
                    if (window.game && window.game.addLife) {
                        window.game.addLife();
                    }
                }
                
                // Always spawn a powerup when boss is defeated
                if (typeof Weapons !== 'undefined' && Weapons.spawnPowerup) {
                    Weapons.spawnPowerup(
                        this.currentBoss.x + this.currentBoss.width / 2,
                        this.currentBoss.y + this.currentBoss.height / 2
                    );
                }
                
                this.currentBoss = null;
                this.bossDefeated = true;
                
                // Trigger next wave
                if (typeof Spaceships !== 'undefined') {
                    setTimeout(() => {
                        Spaceships.nextWave();
                    }, 3000); // 3 second delay before next wave
                }
                
                return points;
            }
        }
        
        return 0;
    },
    
    // Check collision with player
    checkPlayerCollision: function(player) {
        // Check boss body collision
        if (this.currentBoss && this.currentBoss.entryComplete) {
            if (player.x < this.currentBoss.x + this.currentBoss.width &&
                player.x + player.width > this.currentBoss.x &&
                player.y < this.currentBoss.y + this.currentBoss.height &&
                player.y + player.height > this.currentBoss.y) {
                return { type: 'boss', object: this.currentBoss };
            }
        }
        
        // Check boss projectile collisions
        for (const projectile of this.bossProjectiles) {
            if (player.x < projectile.x + projectile.size &&
                player.x + player.width > projectile.x &&
                player.y < projectile.y + projectile.size &&
                player.y + player.height > projectile.y) {
                return { type: 'boss_projectile', object: projectile };
            }
        }
        
        return null;
    },
    
    // Get boss health for UI
    getBossHealth: function() {
        if (!this.currentBoss) return null;
        
        return {
            current: this.currentBoss.health,
            max: this.currentBoss.maxHealth,
            name: this.currentBoss.config.name,
            percentage: this.currentBoss.health / this.currentBoss.maxHealth
        };
    },
    
    // Reset boss system
    reset: function() {
        this.currentBoss = null;
        this.bossProjectiles = [];
        this.lastDifficultyLevel = 0;
        this.bossDefeated = false;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Bosses;
} 