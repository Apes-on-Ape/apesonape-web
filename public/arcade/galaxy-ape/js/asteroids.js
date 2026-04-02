// Run Ape - Galaga-style Asteroid System Module

const Asteroids = {
    // Asteroid arrays
    asteroids: [],
    explosions: [],
    spawnWarnings: [], // New: Visual warnings for incoming asteroids
    
    // Spawn timers
    nextAsteroidTime: 0,
    spawnRate: 2000, // Base spawn rate in milliseconds
    
    // Scale ratio for responsive design
    scaleRatio: 1,
    canvas: null,
    
    // Initialize asteroid system
    init: function(canvas) {
        this.canvas = canvas;
        this.scaleRatio = 1;
        this.asteroids = [];
        this.explosions = [];
        this.nextAsteroidTime = 1000; // First asteroid in 1 second
        console.log('Galaga-style Asteroid system initialized');
    },
    
    // Update scale for responsive design
    updateScale: function(canvas, scaleRatio) {
        this.scaleRatio = scaleRatio;
        this.canvas = canvas;
    },
    
    // Update asteroids
    update: function(deltaTime, gameSpeed, canvas, score) {
        // Update spawn timer
        this.nextAsteroidTime -= deltaTime;
        
        // Spawn asteroids only when difficulty increases (score > 300)
        if (score > 300 && this.nextAsteroidTime <= 0) {
            this.spawnAsteroid(canvas, score);
            
            // Slower spawn rate - less frequent but more strategic
            const difficultyMultiplier = 1 + (score / 2000); // Reduced multiplier
            this.nextAsteroidTime = (this.spawnRate * 2 / difficultyMultiplier) + (Math.random() * 2000);
        }
        
        // Update existing asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            // Update position
            asteroid.x += asteroid.velocityX;
            asteroid.y += asteroid.velocityY;
            
            // Update rotation
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Remove asteroids that are off-screen
            const margin = 100;
            if (asteroid.x < -margin || asteroid.x > canvas.width + margin ||
                asteroid.y < -margin || asteroid.y > canvas.height + margin) {
                this.asteroids.splice(i, 1);
            }
        }
        
        // Update spawn warnings
        for (let i = this.spawnWarnings.length - 1; i >= 0; i--) {
            const warning = this.spawnWarnings[i];
            const elapsed = Date.now() - warning.startTime;
            
            // Update warning intensity (pulsing effect)
            warning.intensity = 0.5 + 0.5 * Math.sin(elapsed * 0.01);
            
            // Remove expired warnings
            if (elapsed >= warning.duration) {
                this.spawnWarnings.splice(i, 1);
            }
        }
        
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.time += deltaTime;
            
            // Update particles
            for (const particle of explosion.particles) {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.velocityY += 0.1; // Gravity
                particle.alpha -= deltaTime / CONFIG.VISUAL_EFFECTS.EXPLOSION_DURATION;
            }
            
            // Remove expired explosions
            if (explosion.time >= CONFIG.VISUAL_EFFECTS.EXPLOSION_DURATION) {
                this.explosions.splice(i, 1);
            }
        }
    },
    
    // Spawn asteroid from random direction with warning
    spawnAsteroid: function(canvas, score) {
        // Choose asteroid type based on score (higher score = larger asteroids more likely)
        let asteroidType = 'SMALL';
        const rand = Math.random();
        
        if (score > 500 && rand < 0.3) {
            asteroidType = 'LARGE';
        } else if (score > 200 && rand < 0.5) {
            asteroidType = 'MEDIUM';
        }
        
        // Choose spawn direction - favor more visible directions
        const directions = [
            CONFIG.SPAWN_DIRECTIONS.TOP,
            CONFIG.SPAWN_DIRECTIONS.LEFT,
            CONFIG.SPAWN_DIRECTIONS.RIGHT,
            CONFIG.SPAWN_DIRECTIONS.TOP_LEFT,
            CONFIG.SPAWN_DIRECTIONS.TOP_RIGHT
        ];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // Create spawn warning first
        this.createSpawnWarning(canvas, asteroidType, direction);
        
        // Delay actual asteroid spawn
        setTimeout(() => {
            this.createAsteroid(canvas, asteroidType, direction);
        }, 800); // 0.8 second warning delay
    },
    
    // Create spawn warning indicator
    createSpawnWarning: function(canvas, type, direction) {
        const config = CONFIG.ASTEROID_TYPES[type];
        let x, y;
        
        // Position warning at screen edge
        switch (direction) {
            case CONFIG.SPAWN_DIRECTIONS.TOP:
                x = Math.random() * (canvas.width - 100) + 50;
                y = 20;
                break;
            case CONFIG.SPAWN_DIRECTIONS.LEFT:
                x = 20;
                y = Math.random() * (canvas.height - 100) + 50;
                break;
            case CONFIG.SPAWN_DIRECTIONS.RIGHT:
                x = canvas.width - 20;
                y = Math.random() * (canvas.height - 100) + 50;
                break;
            case CONFIG.SPAWN_DIRECTIONS.TOP_LEFT:
                x = 20;
                y = 20;
                break;
            case CONFIG.SPAWN_DIRECTIONS.TOP_RIGHT:
                x = canvas.width - 20;
                y = 20;
                break;
            default:
                x = Math.random() * canvas.width;
                y = 20;
        }
        
        // Apply portrait mode scaling to warning size
        const portraitScale = CONFIG.getPortraitScale('ASTEROID');
        
        const warning = {
            x: x,
            y: y,
            size: config.size * portraitScale,
            type: type,
            direction: direction,
            startTime: Date.now(),
            duration: 800, // Match spawn delay
            intensity: 1.0
        };
        
        this.spawnWarnings.push(warning);
    },
    
    // Create asteroid
    createAsteroid: function(canvas, type, direction, position = null) {
        const config = CONFIG.ASTEROID_TYPES[type];
        if (!config) return;
        
        let x, y, velocityX, velocityY;
        
        // If position is provided (for breakage), use it
        if (position) {
            x = position.x;
            y = position.y;
            // Random velocity in different directions for breakage
            const angle = Math.random() * Math.PI * 2;
            const speed = config.speed * this.scaleRatio;
            velocityX = Math.cos(angle) * speed;
            velocityY = Math.sin(angle) * speed;
        } else {
            // Spawn from edges based on direction
            const speed = config.speed * this.scaleRatio;
            
            switch (direction) {
                case CONFIG.SPAWN_DIRECTIONS.TOP:
                    x = Math.random() * canvas.width;
                    y = -config.size;
                    velocityX = (Math.random() - 0.5) * speed;
                    velocityY = speed;
                    break;
                    
                case CONFIG.SPAWN_DIRECTIONS.BOTTOM:
                    x = Math.random() * canvas.width;
                    y = canvas.height + config.size;
                    velocityX = (Math.random() - 0.5) * speed;
                    velocityY = -speed;
                    break;
                    
                case CONFIG.SPAWN_DIRECTIONS.LEFT:
                    x = -config.size;
                    y = Math.random() * canvas.height;
                    velocityX = speed;
                    velocityY = (Math.random() - 0.5) * speed;
                    break;
                    
                case CONFIG.SPAWN_DIRECTIONS.RIGHT:
                    x = canvas.width + config.size;
                    y = Math.random() * canvas.height;
                    velocityX = -speed;
                    velocityY = (Math.random() - 0.5) * speed;
                    break;
                    
                case CONFIG.SPAWN_DIRECTIONS.TOP_LEFT:
                    x = -config.size;
                    y = -config.size;
                    velocityX = speed * 0.7;
                    velocityY = speed * 0.7;
                    break;
                    
                case CONFIG.SPAWN_DIRECTIONS.TOP_RIGHT:
                    x = canvas.width + config.size;
                    y = -config.size;
                    velocityX = -speed * 0.7;
                    velocityY = speed * 0.7;
                    break;
                    
                case CONFIG.SPAWN_DIRECTIONS.BOTTOM_LEFT:
                    x = -config.size;
                    y = canvas.height + config.size;
                    velocityX = speed * 0.7;
                    velocityY = -speed * 0.7;
                    break;
                    
                case CONFIG.SPAWN_DIRECTIONS.BOTTOM_RIGHT:
                    x = canvas.width + config.size;
                    y = canvas.height + config.size;
                    velocityX = -speed * 0.7;
                    velocityY = -speed * 0.7;
                    break;
                    
                default:
                    // Default to coming from right
                    x = canvas.width + config.size;
                    y = Math.random() * canvas.height;
                    velocityX = -speed;
                    velocityY = (Math.random() - 0.5) * speed;
            }
        }
        
        // Apply portrait mode scaling to asteroid size
        const portraitScale = CONFIG.getPortraitScale('ASTEROID');
        const scaledSize = config.size * this.scaleRatio * portraitScale;
        
        const asteroid = {
            x: x,
            y: y,
            width: scaledSize,
            height: scaledSize,
            velocityX: velocityX,
            velocityY: velocityY,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            type: type,
            health: config.health,
            maxHealth: config.health,
            color: config.color,
            points: config.points,
            breakInto: config.breakInto,
            size: scaledSize
        };
        
        this.asteroids.push(asteroid);
    },
    
    // Hit asteroid with projectile
    hitAsteroid: function(asteroid, hitResult) {
        asteroid.health -= hitResult.damage;
        
        // Create hit effect
        this.createHitEffect(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
        
        let points = 0;
        
        if (asteroid.health <= 0) {
            // Asteroid destroyed
            points = asteroid.points;
            
            // Create explosion
            this.createExplosion(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
            
            // Break into smaller asteroids if applicable
            if (asteroid.breakInto > 0) {
                const smallerType = this.getSmallerType(asteroid.type);
                if (smallerType) {
                    for (let i = 0; i < asteroid.breakInto; i++) {
                        this.createAsteroid(this.canvas, smallerType, null, {
                            x: asteroid.x + asteroid.width / 2,
                            y: asteroid.y + asteroid.height / 2
                        });
                    }
                    
                    // Award points for breaking asteroid
                    points = asteroid.points;
                }
            }
            
            // Remove asteroid
            const index = this.asteroids.indexOf(asteroid);
            if (index > -1) {
                this.asteroids.splice(index, 1);
            }
        }
        
        return points;
    },
    
    // Get smaller asteroid type
    getSmallerType: function(currentType) {
        switch (currentType) {
            case 'LARGE':
                return 'MEDIUM';
            case 'MEDIUM':
                return 'SMALL';
            default:
                return null;
        }
    },
    
    // Create explosion effect
    createExplosion: function(x, y) {
        const explosion = {
            x: x,
            y: y,
            time: 0,
            particles: []
        };
        
        // Create explosion particles
        for (let i = 0; i < CONFIG.VISUAL_EFFECTS.EXPLOSION_PARTICLES; i++) {
            const angle = (Math.PI * 2 * i) / CONFIG.VISUAL_EFFECTS.EXPLOSION_PARTICLES;
            const speed = 2 + Math.random() * 3;
            
            explosion.particles.push({
                x: x,
                y: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                alpha: 1.0,
                size: 2 + Math.random() * 3,
                color: '#ff' + Math.floor(Math.random() * 256).toString(16).padStart(2, '0') + '00'
            });
        }
        
        this.explosions.push(explosion);
    },
    
    // Create hit effect
    createHitEffect: function(x, y) {
        const explosion = {
            x: x,
            y: y,
            time: 0,
            particles: []
        };
        
        // Create smaller hit particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 1 + Math.random() * 2;
            
            explosion.particles.push({
                x: x,
                y: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                alpha: 1.0,
                size: 1 + Math.random() * 2,
                color: '#ffff00'
            });
        }
        
        this.explosions.push(explosion);
    },
    
    // Draw asteroids
    draw: function(ctx) {
        // Draw spawn warnings first
        for (const warning of this.spawnWarnings) {
            ctx.save();
            ctx.globalAlpha = warning.intensity;
            
            // Draw warning indicator
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            
            // Pulsing triangle indicator
            ctx.beginPath();
            ctx.moveTo(warning.x, warning.y - 15);
            ctx.lineTo(warning.x - 10, warning.y + 10);
            ctx.lineTo(warning.x + 10, warning.y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Size indicator
            const sizeCircle = warning.size * 0.5;
            ctx.beginPath();
            ctx.arc(warning.x, warning.y + 25, sizeCircle, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Warning text
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', warning.x, warning.y + 5);
            
            ctx.restore();
        }
        
        // Draw asteroids with improved colors and effects
        for (const asteroid of this.asteroids) {
            ctx.save();
            
            // Move to asteroid center for rotation
            ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
            ctx.rotate(asteroid.rotation);
            
            // Enhanced asteroid colors based on type and health
            let fillColor, outlineColor;
            if (asteroid.health < asteroid.maxHealth) {
                const healthPercent = asteroid.health / asteroid.maxHealth;
                fillColor = `rgba(255, ${Math.floor(100 + 155 * healthPercent)}, 50, 0.9)`;
                outlineColor = '#ff4444';
            } else {
                // Different colors for different asteroid types
                switch (asteroid.type) {
                    case 'LARGE':
                        fillColor = '#8b4513'; // Saddle brown
                        outlineColor = '#654321';
                        break;
                    case 'MEDIUM':
                        fillColor = '#a0522d'; // Sienna
                        outlineColor = '#8b4513';
                        break;
                    case 'SMALL':
                        fillColor = '#cd853f'; // Peru
                        outlineColor = '#a0522d';
                        break;
                    default:
                        fillColor = asteroid.color;
                        outlineColor = '#000000';
                }
            }
            
            // Draw asteroid glow for better visibility
            ctx.shadowColor = fillColor;
            ctx.shadowBlur = 8;
            ctx.fillStyle = fillColor;
            
            // Draw asteroid shape (rough polygon for more realistic look)
            ctx.beginPath();
            const sides = 8;
            const radius = asteroid.size / 2;
            
            for (let i = 0; i < sides; i++) {
                const angle = (Math.PI * 2 * i) / sides;
                const variation = 0.7 + Math.sin(i * 2.3) * 0.3; // Add some irregularity
                const x = Math.cos(angle) * radius * variation;
                const y = Math.sin(angle) * radius * variation;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fill();
            
            // Remove shadow for outline
            ctx.shadowBlur = 0;
            
            // Add enhanced outline
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Add surface details for larger asteroids
            if (asteroid.type === 'LARGE' || asteroid.type === 'MEDIUM') {
                ctx.strokeStyle = outlineColor;
                ctx.lineWidth = 1;
                
                // Add some crater-like details
                for (let i = 0; i < 3; i++) {
                    const detailAngle = (Math.PI * 2 * i) / 3;
                    const detailRadius = radius * 0.3;
                    const detailX = Math.cos(detailAngle) * detailRadius * 0.5;
                    const detailY = Math.sin(detailAngle) * detailRadius * 0.5;
                    
                    ctx.beginPath();
                    ctx.arc(detailX, detailY, detailRadius * 0.3, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
        
        // Draw explosions
        for (const explosion of this.explosions) {
            for (const particle of explosion.particles) {
                if (particle.alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = particle.alpha;
                    ctx.fillStyle = particle.color;
                    ctx.fillRect(
                        particle.x - particle.size / 2,
                        particle.y - particle.size / 2,
                        particle.size,
                        particle.size
                    );
                    ctx.restore();
                }
            }
        }
    },
    
    // Check collision with player
    checkPlayerCollision: function(player) {
        for (const asteroid of this.asteroids) {
            if (player.x < asteroid.x + asteroid.width &&
                player.x + player.width > asteroid.x &&
                player.y < asteroid.y + asteroid.height &&
                player.y + player.height > asteroid.y) {
                return asteroid;
            }
        }
        return null;
    },
    
    // Check collision with projectiles
    checkProjectileCollisions: function() {
        let totalPoints = 0;
        
        for (const asteroid of this.asteroids) {
            const hitResult = Weapons.checkCollision(asteroid);
            if (hitResult) {
                const points = this.hitAsteroid(asteroid, hitResult);
                totalPoints += points;
                
                // Add upgrade points to weapons system
                if (Weapons.addUpgradePoints) {
                    Weapons.addUpgradePoints(points);
                }
            }
        }
        
        return totalPoints;
    },
    
    // Reset asteroid system
    reset: function() {
        this.asteroids = [];
        this.explosions = [];
        this.spawnWarnings = [];
        this.nextAsteroidTime = 1000;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Asteroids;
} 