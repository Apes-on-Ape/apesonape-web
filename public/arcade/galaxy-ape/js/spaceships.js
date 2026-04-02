// Run Ape - Galaga-Style Wave System with Space Pixel Images

const Spaceships = {
    // Wave data
    enemies: [],
    currentWave: 1,
    enemiesInWave: 0,
    waveComplete: false,
    waveStarted: false,
    
    // Wave timing
    spawnDelay: 800, // milliseconds between enemy spawns
    nextSpawnTime: 0,
    enemiesToSpawn: [],
    spawnIndex: 0,
    
    // Scale ratio for responsive design
    scaleRatio: 1,
    canvas: null,
    
    // Space pixel enemy types with actual image paths (bigger and slower)
    enemyTypes: {
        UFO_GREY: {
            image: 'assets/images/space-pack/Space Pixel/UfoGrey.png',
            width: 48,
            height: 48,
            health: 1,
            speed: 1.2,
            points: 25,     // Reduced from 100
            formation: 'basic',
            canShoot: false,
            shootChance: 0
        },
        UFO_GREY1: {
            image: 'assets/images/space-pack/Space Pixel/UfoGrey1.png',
            width: 48,
            height: 48,
            health: 2,
            speed: 1.5,
            points: 35,     // Reduced from 150
            formation: 'weave',
            canShoot: true,
            shootChance: 0.008
        },
        UFO_BLUE: {
            image: 'assets/images/space-pack/Space Pixel/UfoBlue.png',
            width: 48,
            height: 48,
            health: 2,
            speed: 1.8,
            points: 40,     // Reduced from 200
            formation: 'dive',
            canShoot: true,
            shootChance: 0.012
        },
        ROCKET_GREY: {
            image: 'assets/images/space-pack/Space Pixel/RocketGrey.png',
            width: 36,
            height: 48,
            health: 1,
            speed: 2.2,
            points: 30,     // Reduced from 120
            formation: 'fast',
            canShoot: true,
            shootChance: 0.015
        },
        ROCKET_WHITE: {
            image: 'assets/images/space-pack/Space Pixel/RocketWhite.png',
            width: 36,
            height: 48,
            health: 2,
            speed: 2.0,
            points: 45,     // Reduced from 180
            formation: 'zigzag',
            canShoot: true,
            shootChance: 0.010
        },
        SATELLITE: {
            image: 'assets/images/space-pack/Space Pixel/Satellite.png',
            width: 48,
            height: 48,
            health: 3,
            speed: 1.0,
            points: 60,     // Reduced from 250
            formation: 'heavy',
            canShoot: true,
            shootChance: 0.006
        },
        ASTRONAUT: {
            image: 'assets/images/space-pack/Space Pixel/Astronaut.png',
            width: 36,
            height: 48,
            health: 1,
            speed: 1.3,
            points: 50,     // Reduced from 300
            formation: 'bonus',
            canShoot: true,
            shootChance: 0.020
        }
    },
    
    // Enemy bullets system
    enemyBullets: [],
    
    // Pre-loaded images
    images: {},
    imagesLoaded: false,
    
    // Wave patterns for proper Galaga-style formations
    wavePatterns: {
        1: [
            { type: 'UFO_GREY', count: 6, formation: 'line' },
            { type: 'ROCKET_GREY', count: 4, formation: 'pair' }
        ],
        2: [
            { type: 'UFO_GREY1', count: 4, formation: 'diamond' },
            { type: 'UFO_BLUE', count: 6, formation: 'v_formation' },
            { type: 'ROCKET_GREY', count: 4, formation: 'line' }
        ],
        3: [
            { type: 'SATELLITE', count: 2, formation: 'heavy_escort' },
            { type: 'UFO_BLUE', count: 8, formation: 'swarm' },
            { type: 'ROCKET_WHITE', count: 6, formation: 'weave' }
        ],
        4: [
            { type: 'UFO_GREY1', count: 6, formation: 'double_line' },
            { type: 'SATELLITE', count: 3, formation: 'triangle' },
            { type: 'ASTRONAUT', count: 2, formation: 'bonus' },
            { type: 'UFO_BLUE', count: 8, formation: 'complex' }
        ],
        5: [
            { type: 'SATELLITE', count: 4, formation: 'heavy_assault' },
            { type: 'UFO_BLUE', count: 10, formation: 'swarm' },
            { type: 'ROCKET_WHITE', count: 8, formation: 'weave' },
            { type: 'ASTRONAUT', count: 3, formation: 'bonus' }
        ],
        6: [
            { type: 'UFO_GREY1', count: 8, formation: 'quad_line' },
            { type: 'SATELLITE', count: 5, formation: 'pentagon' },
            { type: 'UFO_BLUE', count: 12, formation: 'massive_swarm' },
            { type: 'ROCKET_GREY', count: 10, formation: 'speed_wave' }
        ]
    },
    
    // Initialize spaceships system
    init: function(canvas) {
        this.canvas = canvas;
        this.enemies = [];
        this.scaleRatio = 1;
        this.currentWave = 1;
        this.waveComplete = false;
        this.waveStarted = false;
        this.loadImages();
        console.log('Galaga-style wave system initialized');
    },
    
    // Load space pixel images
    loadImages: function() {
        const imagePromises = [];
        
        for (const [key, enemyType] of Object.entries(this.enemyTypes)) {
            const img = new Image();
            const promise = new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(`Failed to load ${enemyType.image}`);
            });
            img.src = enemyType.image;
            this.images[key] = img;
            imagePromises.push(promise);
        }
        
        Promise.all(imagePromises)
            .then(() => {
                this.imagesLoaded = true;
                console.log('All space pixel images loaded successfully');
                this.startWave();
            })
            .catch(error => {
                console.error('Error loading images:', error);
                // Fallback to geometric shapes if images fail
                this.imagesLoaded = false;
                this.startWave();
            });
    },
    
    // Start a new wave
    startWave: function() {
        if (this.waveStarted) return;
        
        console.log(`Starting Wave ${this.currentWave}`);
        this.waveStarted = true;
        this.waveComplete = false;
        this.enemies = [];
        this.enemiesToSpawn = [];
        this.spawnIndex = 0;
        this.nextSpawnTime = 1000; // 1 second delay before first enemy
        
        // Get wave pattern (cycle through available patterns)
        const patternKey = Math.min(this.currentWave, Object.keys(this.wavePatterns).length);
        const wavePattern = this.wavePatterns[patternKey];
        
        // Generate spawn list based on wave pattern
        this.generateSpawnList(wavePattern);
        
        // Show wave notification
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(`🌌 WAVE ${this.currentWave} 🌌`, 2000);
        }
    },
    
    // Generate list of enemies to spawn with formation positions
    generateSpawnList: function(wavePattern) {
        let spawnList = [];
        let spawnDelay = 0;
        
        // Apply difficulty scaling (increase enemy counts after wave 3, more aggressive scaling)
        const difficultyMultiplier = Math.max(1, Math.floor((this.currentWave - 2) / 2));
        
        for (const group of wavePattern) {
            // Scale enemy count based on difficulty
            const scaledCount = Math.min(group.count + (difficultyMultiplier - 1) * 2, group.count * 2);
            const positions = this.getFormationPositions(group.formation, scaledCount);
            
            for (let i = 0; i < scaledCount; i++) {
                spawnList.push({
                    type: group.type,
                    position: positions[i] || { x: 1.1, y: 0.2 + (i * 0.6 / scaledCount) },
                    delay: spawnDelay
                });
                spawnDelay += this.spawnDelay * (0.8 + Math.random() * 0.4); // Slight randomization
            }
            
            spawnDelay += 1500; // Delay between groups
        }
        
        this.enemiesToSpawn = spawnList;
        this.enemiesInWave = spawnList.length;
        
        console.log(`Wave ${this.currentWave}: Generated ${spawnList.length} enemies with difficulty multiplier ${difficultyMultiplier}`);
    },
    
    // Get formation positions for enemy spawning
    getFormationPositions: function(formation, count) {
        const positions = [];
        
        switch (formation) {
            case 'line':
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: 1.1, // Start off-screen right
                        y: 0.2 + (i * 0.6 / (count - 1))
                    });
                }
                break;
                
            case 'pair':
                for (let i = 0; i < count; i += 2) {
                    positions.push({ x: 1.1, y: 0.3 + (i * 0.1) });
                    if (i + 1 < count) {
                        positions.push({ x: 1.2, y: 0.3 + (i * 0.1) });
                    }
                }
                break;
                
            case 'diamond':
                positions.push({ x: 1.1, y: 0.5 }); // Center
                if (count > 1) {
                    positions.push({ x: 1.1, y: 0.3 }); // Top
                    positions.push({ x: 1.1, y: 0.7 }); // Bottom
                }
                if (count > 3) {
                    positions.push({ x: 1.2, y: 0.4 }); // Right-top
                    positions.push({ x: 1.2, y: 0.6 }); // Right-bottom
                }
                // Fill remaining with line formation
                for (let i = 5; i < count; i++) {
                    positions.push({ x: 1.3, y: 0.2 + (i - 5) * 0.15 });
                }
                break;
                
            case 'v_formation':
                const vCenter = Math.floor(count / 2);
                for (let i = 0; i < count; i++) {
                    const offset = Math.abs(i - vCenter) * 0.1;
                    positions.push({
                        x: 1.1 + offset,
                        y: 0.3 + (i * 0.4 / (count - 1))
                    });
                }
                break;
                
            case 'swarm':
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: 1.1 + (Math.random() * 0.3),
                        y: 0.2 + (Math.random() * 0.6)
                    });
                }
                break;
                
            default:
                // Default to line formation
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: 1.1,
                        y: 0.2 + (i * 0.6 / count)
                    });
                }
        }
        
        return positions;
    },
    
    // Update wave system
    update: function(deltaTime, gameSpeed, canvas, score) {
        // Start first wave if not started
        if (!this.waveStarted && this.imagesLoaded) {
            this.startWave();
        }
        
        // Spawn enemies from spawn list
        this.updateSpawning(deltaTime, canvas);
        
        // Update existing enemies
        this.updateEnemies(deltaTime, gameSpeed, canvas);
        
        // Check if wave is complete
        this.checkWaveCompletion();
    },
    
    // Handle enemy spawning
    updateSpawning: function(deltaTime, canvas) {
        if (!this.waveStarted || this.spawnIndex >= this.enemiesToSpawn.length) {
            return;
        }
        
        // Stop spawning enemies if boss is active
        if (typeof Bosses !== 'undefined' && Bosses.currentBoss) {
            return;
        }
        
        this.nextSpawnTime -= deltaTime;
        
        if (this.nextSpawnTime <= 0) {
            const spawnData = this.enemiesToSpawn[this.spawnIndex];
            this.spawnEnemy(spawnData, canvas);
            this.spawnIndex++;
            
            if (this.spawnIndex < this.enemiesToSpawn.length) {
                this.nextSpawnTime = this.spawnDelay;
            }
        }
    },
    
    // Spawn individual enemy
    spawnEnemy: function(spawnData, canvas) {
        const enemyType = this.enemyTypes[spawnData.type];
        
        // Scale health based on wave (increase after wave 3)
        const healthMultiplier = this.currentWave <= 3 ? 1 : Math.floor((this.currentWave - 3) / 2) + 1;
        const scaledHealth = enemyType.health * healthMultiplier;
        
        // Apply portrait mode scaling to spaceship sizes
        const portraitScale = CONFIG.getPortraitScale('SPACESHIP');
        
        const enemy = {
            x: spawnData.position.x * canvas.width,
            y: spawnData.position.y * canvas.height,
            width: enemyType.width * this.scaleRatio * portraitScale,
            height: enemyType.height * this.scaleRatio * portraitScale,
            health: scaledHealth,
            maxHealth: scaledHealth,
            speed: enemyType.speed,
            points: enemyType.points,
            type: spawnData.type,
            image: this.images[spawnData.type],
            animTime: 0,
            formation: enemyType.formation,
            initialY: spawnData.position.y * canvas.height,
            movePattern: this.getMovePattern(enemyType.formation),
            lastShootTime: 0,
            canShoot: enemyType.canShoot,
            shootChance: enemyType.shootChance
        };
        
        this.enemies.push(enemy);
    },
    
    // Get movement pattern for enemy type
    getMovePattern: function(formation) {
        switch (formation) {
            case 'basic': return 'straight';
            case 'weave': return 'sine';
            case 'dive': return 'dive_attack';
            case 'fast': return 'fast_straight';
            case 'zigzag': return 'zigzag';
            case 'heavy': return 'slow_sine';
            case 'bonus': return 'erratic';
            default: return 'straight';
        }
    },
    
    // Update existing enemies
    updateEnemies: function(deltaTime, gameSpeed, canvas) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.animTime += deltaTime;
            
            this.updateEnemyMovement(enemy, deltaTime);
            
            // Handle enemy shooting
            if (enemy.canShoot && Math.random() < enemy.shootChance) {
                this.enemyShoot(enemy);
            }
            
            // Remove enemies that are off-screen
            if (enemy.x < -enemy.width || enemy.y < -enemy.height || enemy.y > canvas.height + enemy.height) {
                this.enemies.splice(i, 1);
            }
        }
        
        // Update enemy bullets
        this.updateEnemyBullets(deltaTime, canvas);
    },
    
    // Update enemy movement based on pattern
    updateEnemyMovement: function(enemy, deltaTime) {
        const time = enemy.animTime * 0.001;
        
        switch (enemy.movePattern) {
            case 'straight':
                enemy.x -= enemy.speed;
                break;
                
            case 'sine':
                enemy.x -= enemy.speed;
                enemy.y = enemy.initialY + Math.sin(time * 3) * 50;
                break;
                
            case 'dive_attack':
                if (enemy.x > this.canvas.width * 0.7) {
                    enemy.x -= enemy.speed;
                } else {
                    enemy.x -= enemy.speed * 0.5;
                    enemy.y += enemy.speed * 2; // Dive down
                }
                break;
                
            case 'fast_straight':
                enemy.x -= enemy.speed * 1.5;
                break;
                
            case 'zigzag':
                enemy.x -= enemy.speed;
                enemy.y += Math.sin(time * 6) * 3;
                break;
                
            case 'slow_sine':
                enemy.x -= enemy.speed * 0.8;
                enemy.y = enemy.initialY + Math.sin(time * 2) * 80;
                break;
                
            case 'erratic':
                enemy.x -= enemy.speed;
                enemy.y += Math.sin(time * 8) * 2 + Math.cos(time * 5) * 1.5;
                break;
        }
    },
    
    // Enemy shooting function
    enemyShoot: function(enemy) {
        const currentTime = Date.now();
        if (currentTime - enemy.lastShootTime < 1000) { // 1 second cooldown
            return;
        }
        
        enemy.lastShootTime = currentTime;
        
        // Apply portrait mode scaling to bullet size
        const portraitScale = CONFIG.getPortraitScale('PROJECTILE');
        
        const bullet = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            width: 4 * portraitScale,
            height: 8 * portraitScale,
            speed: 3,
            color: '#ff4444'
        };
        
        this.enemyBullets.push(bullet);
    },
    
    // Update enemy bullets
    updateEnemyBullets: function(deltaTime, canvas) {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;
            
            // Remove bullets that are off-screen
            if (bullet.y > canvas.height + 50) {
                this.enemyBullets.splice(i, 1);
            }
        }
    },
    
    // Check if enemy bullets hit player
    checkEnemyBulletCollisions: function(player) {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                
                // Remove bullet on hit
                this.enemyBullets.splice(i, 1);
                return true; // Hit detected
            }
        }
        return false;
    },
    
    // Check if wave is complete
    checkWaveCompletion: function() {
        if (this.waveStarted && !this.waveComplete) {
            // Wave complete when all enemies spawned and destroyed
            if (this.spawnIndex >= this.enemiesToSpawn.length && this.enemies.length === 0) {
                this.waveComplete = true;
                this.waveStarted = false;
                
                // Show wave complete notification
                if (typeof UI !== 'undefined' && UI.showNotification) {
                    UI.showNotification(`✨ WAVE ${this.currentWave} COMPLETE! ✨`, 2000);
                }
                
                console.log(`Wave ${this.currentWave} completed! Triggering boss...`);
                
                // Trigger boss spawn
                if (typeof Bosses !== 'undefined') {
                    Bosses.triggerBossAfterWave(this.currentWave);
                }
            }
        }
    },
    
    // Start next wave (called after boss defeat)
    nextWave: function() {
        this.currentWave++;
        setTimeout(() => {
            this.startWave();
        }, 2000); // 2 second delay before next wave
    },
    
    // Draw enemies
    draw: function(ctx) {
        // Draw enemies
        for (const enemy of this.enemies) {
            this.drawEnemy(ctx, enemy);
        }
        
        // Draw enemy bullets
        for (const bullet of this.enemyBullets) {
            this.drawEnemyBullet(ctx, bullet);
        }
    },
    
    // Draw individual enemy using space pixel images
    drawEnemy: function(ctx, enemy) {
        ctx.save();
        
        if (this.imagesLoaded && enemy.image && enemy.image.complete) {
            // Draw the actual space pixel image
            ctx.drawImage(
                enemy.image,
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );
        } else {
            // Fallback to geometric shapes
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Add simple details
            ctx.fillStyle = '#ffaa44';
            ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height - 4);
        }
        
        // Draw health bar for damaged enemies
        if (enemy.health < enemy.maxHealth) {
            const barWidth = enemy.width;
            const barHeight = 3;
            const barX = enemy.x;
            const barY = enemy.y - 8;
            
            // Background
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(barX, barY, barWidth * (enemy.health / enemy.maxHealth), barHeight);
        }
        
        ctx.restore();
    },
    
    // Draw enemy bullet
    drawEnemyBullet: function(ctx, bullet) {
        ctx.save();
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        
        // Add a glow effect
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(bullet.x + 1, bullet.y + 1, bullet.width - 2, bullet.height - 2);
        
        ctx.restore();
    },
    
    // Check collision with player projectiles
    checkProjectileCollisions: function() {
        let totalPoints = 0;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const hitResult = Weapons.checkCollision(enemy);
            
            if (hitResult) {
                enemy.health -= hitResult.damage;
                
                // Create hit effect
                if (typeof Asteroids !== 'undefined' && Asteroids.createHitEffect) {
                    Asteroids.createHitEffect(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2
                    );
                }
                
                if (enemy.health <= 0) {
                    // Enemy destroyed
                    totalPoints += enemy.points;
                    
                    // Create explosion
                    if (typeof Asteroids !== 'undefined' && Asteroids.createExplosion) {
                        Asteroids.createExplosion(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2
                        );
                    }
                    
                    // Chance to spawn powerup (15% chance)
                    if (Math.random() < 0.15 && typeof Weapons !== 'undefined' && Weapons.spawnPowerup) {
                        Weapons.spawnPowerup(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2
                        );
                    }
                    
                    this.enemies.splice(i, 1);
                }
            }
        }
        
        return totalPoints;
    },
    
    // Check collision with player
    checkPlayerCollision: function(player) {
        for (const enemy of this.enemies) {
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {
                return { type: 'enemy', object: enemy };
            }
        }
        
        return null;
    },
    
    // Get wave status for UI
    getWaveStatus: function() {
        return {
            currentWave: this.currentWave,
            enemiesRemaining: this.enemies.length,
            waveComplete: this.waveComplete,
            enemiesInWave: this.enemiesInWave
        };
    },
    
    // Reset wave system
    reset: function() {
        this.enemies = [];
        this.enemyBullets = [];
        this.currentWave = 1;
        this.waveComplete = false;
        this.waveStarted = false;
        this.enemiesToSpawn = [];
        this.spawnIndex = 0;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Spaceships;
} 