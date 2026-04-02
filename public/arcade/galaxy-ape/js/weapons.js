// Run Ape - Weapons System Module

const Weapons = {
    // Current weapon
    currentWeapon: 'BASIC',
    
    // Weapon upgrade progress
    upgradePoints: 0,
    nextUpgradeThreshold: 100,
    
    // Projectiles array
    projectiles: [],
    
    // Powerups array
    powerups: [],
    lastPowerupSpawn: 0,
    
    // Last fire time for rate limiting
    lastFireTime: 0,
    
    // Powerup types using Item images
    powerupTypes: {
        WEAPON_UPGRADE: {
            name: 'Weapon Upgrade',
            spriteImage: 'assets/images/Spaceship Pack/Item_1.png',
            width: 32,
            height: 32,
            effect: 'upgrade_weapon',
            points: 0
        },
        RAPID_FIRE: {
            name: 'Rapid Fire',
            spriteImage: 'assets/images/Spaceship Pack/item_2.png',
            width: 32,
            height: 32,
            effect: 'rapid_fire',
            points: 100
        },
        EXTRA_DAMAGE: {
            name: 'Extra Damage',
            spriteImage: 'assets/images/Spaceship Pack/item_3.png',
            width: 32,
            height: 32,
            effect: 'extra_damage',
            points: 150
        },
        SPEED_BOOST: {
            name: 'Speed Boost',
            spriteImage: 'assets/images/Spaceship Pack/turbo_blue.png',
            width: 32,
            height: 32,
            effect: 'speed_boost',
            points: 75
        }
    },
    
    // Initialize weapons system
    init: function() {
        this.currentWeapon = 'BASIC';
        this.upgradePoints = 0;
        this.nextUpgradeThreshold = 100;
        this.projectiles = [];
        this.lastFireTime = 0;
        console.log('Weapons system initialized');
    },
    
    // Get current weapon config
    getCurrentWeapon: function() {
        return CONFIG.WEAPON_TYPES[this.currentWeapon];
    },
    
    // Fire weapon
    fire: function(x, y, direction = { x: 1, y: 0 }) {
        const currentTime = Date.now();
        const weapon = this.getCurrentWeapon();
        
        if (currentTime - this.lastFireTime < weapon.fireRate) {
            return false; // Rate limited
        }
        
        this.lastFireTime = currentTime;
        
        // Handle spread shot differently
        if (weapon.spreadCount) {
            this.fireSpreadShot(x, y, direction, weapon);
        } else {
            this.createProjectile(x, y, direction, weapon);
        }
        
        // Play sound effect
        if (Sound && Sound.play) {
            Sound.play('rocket');
        }
        
        return true;
    },
    
    // Fire spread shot
    fireSpreadShot: function(x, y, direction, weapon) {
        const spreadAngle = Math.PI / 6; // 30 degrees
        const angleStep = spreadAngle / (weapon.spreadCount - 1);
        const startAngle = -spreadAngle / 2;
        
        for (let i = 0; i < weapon.spreadCount; i++) {
            const angle = startAngle + (angleStep * i);
            const spreadDirection = {
                x: Math.cos(angle) * direction.x - Math.sin(angle) * direction.y,
                y: Math.sin(angle) * direction.x + Math.cos(angle) * direction.y
            };
            
            this.createProjectile(x, y, spreadDirection, weapon);
        }
    },
    
    // Create projectile
    createProjectile: function(x, y, direction, weapon) {
        // Apply portrait mode scaling to projectile size
        const portraitScale = CONFIG.getPortraitScale('PROJECTILE');
        
        const projectile = {
            x: x,
            y: y,
            velocityX: direction.x * weapon.projectileSpeed,
            velocityY: direction.y * weapon.projectileSpeed,
            size: weapon.projectileSize * portraitScale,
            color: weapon.projectileColor,
            damage: weapon.damage,
            penetration: weapon.penetration,
            lifetime: CONFIG.ROCKET_LIFETIME,
            createdAt: Date.now(),
            hits: 0 // Track how many objects this projectile has hit
        };
        
        this.projectiles.push(projectile);
    },
    
    // Spawn powerup
    spawnPowerup: function(x, y) {
        const currentTime = Date.now();
        
        // Limit powerup spawn rate
        if (currentTime - this.lastPowerupSpawn < 3000) return; // 3 second cooldown
        
        // Validate spawn coordinates
        if (!this.isValidCoordinate(x) || !this.isValidCoordinate(y)) {
            console.warn('Invalid powerup spawn coordinates:', x, y);
            return;
        }
        
        const powerupTypes = Object.keys(this.powerupTypes);
        const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        const powerupConfig = this.powerupTypes[randomType];
        
        const powerup = {
            x: x,
            y: y,
            width: powerupConfig.width,
            height: powerupConfig.height,
            type: randomType,
            config: powerupConfig,
            velocityX: -2, // Move left slowly
            velocityY: Math.sin(Date.now() * 0.001) * 1, // Floating motion
            animTime: 0,
            lifetime: 15000, // 15 seconds
            createdAt: currentTime
        };
        
        this.powerups.push(powerup);
        this.lastPowerupSpawn = currentTime;
        
        console.log(`Powerup spawned: ${powerupConfig.name}`);
    },
    
    // Update projectiles and powerups
    update: function(deltaTime, canvas) {
        const currentTime = Date.now();
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update position
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;
            
            // Validate coordinates and remove if invalid
            if (!this.isValidCoordinate(projectile.x) || !this.isValidCoordinate(projectile.y)) {
                console.warn('Removing projectile with invalid coordinates:', projectile.x, projectile.y);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Remove expired or off-screen projectiles
            if (currentTime - projectile.createdAt > projectile.lifetime || 
                projectile.x > canvas.width + 50 || 
                projectile.x < -50 || 
                projectile.y > canvas.height + 50 || 
                projectile.y < -50) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            // Update position and animation
            powerup.x += powerup.velocityX;
            powerup.y += Math.sin((currentTime + powerup.createdAt) * 0.005) * 0.5; // Floating effect
            powerup.animTime += deltaTime;
            
            // Validate coordinates and remove if invalid
            if (!this.isValidCoordinate(powerup.x) || !this.isValidCoordinate(powerup.y)) {
                console.warn('Removing powerup with invalid coordinates:', powerup.x, powerup.y);
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Remove expired or off-screen powerups
            if (currentTime - powerup.createdAt > powerup.lifetime || 
                powerup.x < -powerup.width - 50) {
                this.powerups.splice(i, 1);
            }
        }
    },
    
    // Draw projectiles and powerups with enhanced visual effects
    draw: function(ctx) {
        ctx.save();
        
        // Draw projectiles
        for (const projectile of this.projectiles) {
            // Validate projectile coordinates
            if (!this.isValidCoordinate(projectile.x) || !this.isValidCoordinate(projectile.y)) {
                console.warn('Invalid projectile coordinates:', projectile.x, projectile.y);
                continue;
            }
            
            // Enhanced projectile rendering
            ctx.globalAlpha = CONFIG.VISUAL_EFFECTS.BLAST_ALPHA;
            
            // Draw glow effect
            const glowSize = projectile.size * 2;
            const gradient = ctx.createRadialGradient(
                projectile.x, projectile.y, 0,
                projectile.x, projectile.y, glowSize
            );
            gradient.addColorStop(0, projectile.color);
            gradient.addColorStop(0.5, projectile.color + '80');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                projectile.x - glowSize,
                projectile.y - glowSize,
                glowSize * 2,
                glowSize * 2
            );
            
            // Draw main projectile
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = projectile.color;
            ctx.fillRect(
                projectile.x - projectile.size / 2,
                projectile.y - projectile.size / 2,
                projectile.size,
                projectile.size
            );
            
            // Draw trail for larger projectiles
            if (projectile.size >= 12) {
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = projectile.color;
                for (let t = 1; t <= 3; t++) {
                    const trailX = projectile.x - (projectile.velocityX * t * 0.3);
                    const trailY = projectile.y - (projectile.velocityY * t * 0.3);
                    const trailSize = projectile.size * (1 - t * 0.2);
                    
                    // Validate trail coordinates
                    if (this.isValidCoordinate(trailX) && this.isValidCoordinate(trailY)) {
                        ctx.fillRect(
                            trailX - trailSize / 2,
                            trailY - trailSize / 2,
                            trailSize,
                            trailSize
                        );
                    }
                }
            }
        }
        
        // Draw powerups
        for (const powerup of this.powerups) {
            // Validate powerup coordinates
            if (!this.isValidCoordinate(powerup.x) || !this.isValidCoordinate(powerup.y)) {
                console.warn('Invalid powerup coordinates:', powerup.x, powerup.y);
                continue;
            }
            
            ctx.globalAlpha = 1.0;
            
            // Draw powerup glow
            const pulsing = 0.7 + 0.3 * Math.sin(powerup.animTime * 0.01);
            ctx.globalAlpha = pulsing * 0.5;
            
            const powerupGradient = ctx.createRadialGradient(
                powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 0,
                powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, powerup.width
            );
            powerupGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            powerupGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            ctx.fillStyle = powerupGradient;
            ctx.fillRect(
                powerup.x - powerup.width / 2,
                powerup.y - powerup.height / 2,
                powerup.width * 2,
                powerup.height * 2
            );
            
            ctx.globalAlpha = 1.0;
            
            // Draw powerup name above the powerup
            const name = powerup.config.name;
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            // Draw text shadow for better visibility
            ctx.fillStyle = '#000000';
            ctx.fillText(name, 
                powerup.x + powerup.width / 2, 
                powerup.y - 5);
            
            // Draw main text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(name, 
                powerup.x + powerup.width / 2, 
                powerup.y - 5);
            
            // Try to draw sprite image
            if (powerup.config.spriteImage) {
                const spriteImage = new Image();
                spriteImage.src = powerup.config.spriteImage;
                
                if (spriteImage.complete && spriteImage.naturalWidth > 0) {
                    ctx.drawImage(spriteImage, powerup.x, powerup.y, powerup.width, powerup.height);
                } else {
                    // Fallback to colored rectangle
                    ctx.fillStyle = '#ffff00';
                    ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
                    
                    // Add text indicator
                    ctx.fillStyle = '#000000';
                    ctx.font = '8px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(powerup.type.charAt(0), 
                        powerup.x + powerup.width / 2, 
                        powerup.y + powerup.height / 2 + 3);
                }
            } else {
                // Fallback if no image specified
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            }
            
            // Draw powerup border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(powerup.x, powerup.y, powerup.width, powerup.height);
        }
        
        ctx.restore();
    },
    
    // Helper method to validate coordinates
    isValidCoordinate: function(value) {
        return typeof value === 'number' && 
               !isNaN(value) && 
               isFinite(value) && 
               value >= -10000 && 
               value <= 10000; // Reasonable bounds for game coordinates
    },
    
    // Check collision with projectile
    checkCollision: function(object) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Simple rectangular collision detection
            if (projectile.x < object.x + object.width &&
                projectile.x + projectile.size > object.x &&
                projectile.y < object.y + object.height &&
                projectile.y + projectile.size > object.y) {
                
                // Hit detected
                const hitResult = {
                    projectile: projectile,
                    damage: projectile.damage,
                    penetration: projectile.penetration
                };
                
                // Remove projectile if it doesn't penetrate or has hit too many targets
                if (!projectile.penetration || projectile.hits >= 3) {
                    this.projectiles.splice(i, 1);
                } else {
                    projectile.hits++;
                }
                
                return hitResult;
            }
        }
        
        return null;
    },
    
    // Add upgrade points
    addUpgradePoints: function(points) {
        this.upgradePoints += points;
        
        // Check for weapon upgrade
        if (this.upgradePoints >= this.nextUpgradeThreshold) {
            this.upgradeWeapon();
        }
    },
    
    // Upgrade weapon
    upgradeWeapon: function() {
        const weaponOrder = ['BASIC', 'PLASMA', 'LASER', 'SPREAD'];
        const currentIndex = weaponOrder.indexOf(this.currentWeapon);
        
        if (currentIndex < weaponOrder.length - 1) {
            this.currentWeapon = weaponOrder[currentIndex + 1];
            this.upgradePoints = 0;
            this.nextUpgradeThreshold *= 1.5; // Increase next threshold
            
            // Show upgrade notification
            if (UI && UI.showNotification) {
                const weapon = this.getCurrentWeapon();
                UI.showNotification(`🔫 WEAPON UPGRADE! ${weapon.name}`, 3000);
            }
            
            console.log(`Weapon upgraded to: ${this.currentWeapon}`);
        }
    },
    
    // Get weapon info for UI
    getWeaponInfo: function() {
        const weapon = this.getCurrentWeapon();
        return {
            name: weapon.name,
            damage: weapon.damage,
            upgradeProgress: this.upgradePoints / this.nextUpgradeThreshold,
            nextUpgrade: this.nextUpgradeThreshold
        };
    },
    
    // Check powerup collision with player
    checkPowerupCollision: function(player) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            // Check collision
            if (player.x < powerup.x + powerup.width &&
                player.x + player.width > powerup.x &&
                player.y < powerup.y + powerup.height &&
                player.y + player.height > powerup.y) {
                
                // Apply powerup effect
                this.applyPowerupEffect(powerup);
                
                // Remove powerup
                this.powerups.splice(i, 1);
                
                // Play sound effect
                if (Sound && Sound.play) {
                    Sound.play('point');
                }
                
                return powerup;
            }
        }
        
        return null;
    },
    
    // Apply powerup effect
    applyPowerupEffect: function(powerup) {
        const config = powerup.config;
        
        switch (config.effect) {
            case 'upgrade_weapon':
                this.upgradeWeapon();
                break;
                
            case 'rapid_fire':
                // Temporarily increase fire rate for all weapons
                const originalFireRates = {};
                for (const weaponType in CONFIG.WEAPON_TYPES) {
                    const weapon = CONFIG.WEAPON_TYPES[weaponType];
                    originalFireRates[weaponType] = weapon.fireRate;
                    weapon.fireRate = Math.max(100, weapon.fireRate * 0.5); // 50% faster firing
                }
                
                // Restore after 10 seconds
                setTimeout(() => {
                    for (const weaponType in originalFireRates) {
                        CONFIG.WEAPON_TYPES[weaponType].fireRate = originalFireRates[weaponType];
                    }
                }, 10000);
                
                if (UI && UI.showNotification) {
                    UI.showNotification('⚡ RAPID FIRE! ⚡', 2000);
                }
                break;
                
            case 'extra_damage':
                // Temporarily increase damage for all weapons
                const originalDamages = {};
                for (const weaponType in CONFIG.WEAPON_TYPES) {
                    const weapon = CONFIG.WEAPON_TYPES[weaponType];
                    originalDamages[weaponType] = weapon.damage;
                    weapon.damage = Math.floor(weapon.damage * 1.5); // 50% more damage
                }
                
                // Restore after 15 seconds
                setTimeout(() => {
                    for (const weaponType in originalDamages) {
                        CONFIG.WEAPON_TYPES[weaponType].damage = originalDamages[weaponType];
                    }
                }, 15000);
                
                if (UI && UI.showNotification) {
                    UI.showNotification('💥 EXTRA DAMAGE! 💥', 2000);
                }
                break;
                
            case 'speed_boost':
                // Temporarily increase player speed
                if (Player && typeof Player.activateSpeedBoost === 'function') {
                    Player.activateSpeedBoost(6000); // 6 seconds
                }
                
                if (UI && UI.showNotification) {
                    UI.showNotification('🚀 SPEED BOOST! 🚀', 2000);
                }
                break;
        }
        
        console.log(`Applied powerup effect: ${config.effect}`);
    },
    
    // Reset weapons system
    reset: function() {
        this.currentWeapon = 'BASIC';
        this.upgradePoints = 0;
        this.nextUpgradeThreshold = 100;
        this.projectiles = [];
        this.powerups = [];
        this.lastPowerupSpawn = 0;
        this.lastFireTime = 0;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Weapons;
} 