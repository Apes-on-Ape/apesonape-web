// Neon Racer - Obstacles System

const Obstacles = {
    obstacles: [],
    lastSpawnTime: 0,
    spawnRate: Config.OBSTACLE_SPAWN_RATE,
    
    init: function() {
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.spawnRate = Config.OBSTACLE_SPAWN_RATE;
    },
    
    reset: function() {
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.spawnRate = Config.OBSTACLE_SPAWN_RATE;
    },
    
    update: function(delta, speed) {
        const currentTime = Date.now();
        
        // Update existing obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += speed;
            
            // Remove obstacles that are off screen
            if (obstacle.y > Config.GAME_HEIGHT) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Spawn new obstacles if enough time has passed
        if (currentTime - this.lastSpawnTime > this.spawnRate) {
            this.spawnObstacle();
            this.lastSpawnTime = currentTime;
            
            // Decrease spawn rate over time
            this.spawnRate = Math.max(
                Config.MIN_OBSTACLE_SPAWN_RATE,
                this.spawnRate - Config.OBSTACLE_SPAWN_DECREMENT
            );
        }
    },
    
    spawnObstacle: function() {
        const lane = Math.floor(Math.random() * Config.LANE_COUNT);
        const type = Config.OBSTACLE_TYPES[Math.floor(Math.random() * Config.OBSTACLE_TYPES.length)];
        
        this.obstacles.push({
            x: Config.GAME_WIDTH,
            y: Config.getLanePosition(lane),
            width: type.width,
            height: type.height,
            color: type.color,
            lane: lane,
            type: type.type,
            rotation: 0,
            rotationSpeed: type.rotationSpeed
        });
    },
    
    checkCollision: function(player) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            if (this.isColliding(player, obstacle)) {
                // Game over on collision
                Game.endGame();
                return true;
            }
        }
        return false;
    },
    
    isColliding: function(player, obstacle) {
        return (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        );
    },
    
    render: function(ctx) {
        for (const obstacle of this.obstacles) {
            ctx.save();
            
            // Enhanced glow effect
            const gradient = ctx.createRadialGradient(
                obstacle.x, obstacle.y, 0,
                obstacle.x, obstacle.y, obstacle.width * 1.5
            );
            
            // Different colors and effects for different obstacle types
            switch(obstacle.type) {
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
            switch(obstacle.type) {
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
            }
            
            ctx.restore();
            
            // Update rotation
            obstacle.rotation += obstacle.rotationSpeed;
        }
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