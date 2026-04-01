// Neon Racer - Track Module

const Track = {
    // Track state
    speed: Config.TRACK_SPEED,
    speedMultiplier: 1.0,
    lastSpeedIncrease: 0,
    baseSpeed: 0,
    maxSpeed: 0,
    lines: [],
    lastLineY: 0,
    distance: 0,
    score: 0,
    lives: 0,
    currentLane: 1, // Middle lane (0-based index)
    targetLane: 1,
    lastLaneSwitch: 0,
    isShielded: false,
    isBoosted: false,
    boostEndTime: 0,
    
    // Track shape properties
    trackWidth: 0,
    trackBoundaries: [],
    
    // Track visuals
    lineWidth: 4,
    lineColor: '#ff00ff',
    roadColor: '#111111',
    shoulderColor: '#000000',
    
    // Line dash animation
    dashOffset: 0,
    dashLength: 20,
    dashGap: 20,
    
    // Game objects
    obstacles: [],
    orbs: [],
    powerups: [],
    lastObstacleSpawn: 0,
    lastOrbSpawn: 0,
    lastPowerupSpawn: 0,
    
    // Initialize track
    init: function() {
        this.reset();
        this.generateInitialTrack();
        
        // Initialize track segments
        this.trackSegments = [];
        const segmentHeight = 100;
        const numSegments = Math.ceil(Config.GAME_HEIGHT / segmentHeight) + 1;
        
        for (let i = 0; i < numSegments; i++) {
            this.trackSegments.push({
                x: 0,
                y: i * segmentHeight,
                width: Config.GAME_WIDTH,
                height: segmentHeight,
                color: this.roadColor,
                laneMarkers: []
            });
        }
    },
    
    // Reset track
    reset: function() {
        this.speed = Config.INITIAL_TRACK_SPEED;
        this.speedMultiplier = 1.0;
        this.lastSpeedIncrease = Date.now();
        this.baseSpeed = Config.INITIAL_TRACK_SPEED;
        this.maxSpeed = Config.MAX_TRACK_SPEED;
        this.trackWidth = Config.LANE_WIDTH * Config.LANE_COUNT;
        this.distance = 0;
        this.score = 0;
        this.lives = Config.STARTING_LIVES;
        this.currentLane = 1;
        this.targetLane = 1;
        this.lastLaneSwitch = 0;
        this.isShielded = false;
        this.isBoosted = false;
        this.boostEndTime = 0;
        this.lines = [];
        this.lastLineY = 0;
        this.obstacles = [];
        this.orbs = [];
        this.powerups = [];
        this.lastObstacleSpawn = 0;
        this.lastOrbSpawn = 0;
        this.lastPowerupSpawn = 0;
        this.dashOffset = 0;
        this.shape = {
            width: Config.GAME_WIDTH,
            height: Config.GAME_HEIGHT,
            curve: 0,
            hill: 0
        };
    },
    
    // Generate initial track lines
    generateInitialTrack: function() {
        // Clear existing lines
        this.lines = [];
        
        // Generate evenly spaced lines for track
        const lineSpacing = 20;
        const gameBounds = { width: Config.GAME_WIDTH, height: Config.GAME_HEIGHT };
        
        // Generate enough lines to fill screen
        for (let y = gameBounds.height; y >= -lineSpacing * 2; y -= lineSpacing) {
            this.addTrackLine(y, false);
        }
        
        // Set last line Y position
        this.lastLineY = -lineSpacing * 2;
    },
    
    // Add a new track line
    addTrackLine: function(y, isOffScreen = true) {
        const lineWidth = 5;
        const laneWidth = Config.LANE_WIDTH;
        const lanes = Config.LANE_COUNT;
        const gameWidth = Config.GAME_WIDTH;
        
        // Calculate track edges
        const trackStart = (gameWidth - (laneWidth * lanes)) / 2;
        
        // Create new line
        const line = {
            y: y,
            markers: []
        };
        
        // Add lane markers
        for (let lane = 0; lane <= lanes; lane++) {
            const x = trackStart + (lane * laneWidth);
            
            line.markers.push({
                x: x,
                width: lineWidth,
                color: '#ffffff'
            });
        }
        
        this.lines.push(line);
        
        // If offscreen, update distance
        if (isOffScreen) {
            this.lastLineY = y;
            this.distance += this.speed;
        }
    },
    
    // Update track
    update: function(delta) {
        // Skip if not running
        if (!MainGame.isRunning) return;
        
        // Increase speed over time
        const currentTime = Date.now();
        if (currentTime - this.lastSpeedIncrease > 1000) {
            this.speed = Math.min(
                Config.MAX_TRACK_SPEED,
                this.speed + Config.SPEED_INCREMENT
            );
            this.lastSpeedIncrease = currentTime;
        }
        
        // Move all lines based on track speed
        const normalizedDelta = delta / (1000 / 60);
        const speedDelta = this.speed * normalizedDelta;
        
        // Update each line
        for (let i = this.lines.length - 1; i >= 0; i--) {
            const line = this.lines[i];
            line.y += speedDelta;
            
            // Remove lines that are off the bottom of the screen
            if (line.y > Config.GAME_HEIGHT + 20) {
                this.lines.splice(i, 1);
            }
        }
        
        // Add new lines at top as needed
        while (this.lastLineY < -20) {
            this.lastLineY += 20;
            this.addTrackLine(this.lastLineY, true);
        }
        
        // Update distance and score
        this.distance += speedDelta;
        this.score += Config.SCORE_PER_FRAME;
        
        // Update player position (lerp to target lane)
        if (this.currentLane !== this.targetLane) {
            const currentY = Config.getLanePosition(this.currentLane);
            const targetY = Config.getLanePosition(this.targetLane);
            const newY = currentY + (targetY - currentY) * Config.PLAYER_LERP_SPEED;
            
            if (Math.abs(newY - targetY) < 1) {
                this.currentLane = this.targetLane;
            }
        }
        
        // Update obstacles
        this.updateObstacles(delta);
        
        // Update orbs
        this.updateOrbs(delta);
        
        // Update powerups
        this.updatePowerups(delta);
        
        // Check collisions
        this.checkCollisions();
        
        // Update dash animation
        this.dashOffset += this.speed;
        if (this.dashOffset >= this.dashLength + this.dashGap) {
            this.dashOffset = 0;
        }
        
        // Update score display
        document.getElementById('score').textContent = `Score: ${this.score}`;
    },
    
    // Update obstacles
    updateObstacles: function(delta) {
        const now = Date.now();
        
        // Spawn new obstacles
        if (now - this.lastObstacleSpawn > Config.OBSTACLE_SPAWN_RATE) {
            this.spawnObstacle();
            this.lastObstacleSpawn = now;
        }
        
        // Update existing obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.speed;
            
            // Remove if off screen
            if (obstacle.x < -50) {
                this.obstacles.splice(i, 1);
            }
        }
    },
    
    // Spawn a new obstacle
    spawnObstacle: function() {
        const lane = Math.floor(Math.random() * Config.LANE_COUNT);
        const type = Config.OBSTACLE_TYPES[Math.floor(Math.random() * Config.OBSTACLE_TYPES.length)];
        
        this.obstacles.push({
            x: Config.GAME_WIDTH,
            y: Config.getLanePosition(lane),
            width: type.width,
            height: type.height,
            color: type.color,
            lane: lane
        });
    },
    
    // Update orbs
    updateOrbs: function(delta) {
        const now = Date.now();
        
        // Spawn new orbs
        if (now - this.lastOrbSpawn > Config.ORB_SPAWN_RATE) {
            this.spawnOrb();
            this.lastOrbSpawn = now;
        }
        
        // Update existing orbs
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const orb = this.orbs[i];
            orb.x -= this.speed;
            
            // Remove if off screen
            if (orb.x < -50) {
                this.orbs.splice(i, 1);
            }
        }
    },
    
    // Spawn a new orb
    spawnOrb: function() {
        const lane = Math.floor(Math.random() * Config.LANE_COUNT);
        
        this.orbs.push({
            x: Config.GAME_WIDTH,
            y: Config.getLanePosition(lane),
            size: Config.ORB_SIZE,
            color: Config.NEON_COLORS[Math.floor(Math.random() * Config.NEON_COLORS.length)],
            lane: lane
        });
    },
    
    // Update powerups
    updatePowerups: function(delta) {
        const now = Date.now();
        
        // Spawn new powerups
        if (now - this.lastPowerupSpawn > Config.POWERUP_SPAWN_RATE) {
            this.spawnPowerup();
            this.lastPowerupSpawn = now;
        }
        
        // Update existing powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.x -= this.speed;
            
            // Remove if off screen
            if (powerup.x < -50) {
                this.powerups.splice(i, 1);
            }
        }
        
        // Check if boost has expired
        if (this.isBoosted && now > this.boostEndTime) {
            this.isBoosted = false;
            this.speed = this.baseSpeed;
        }
    },
    
    // Spawn a new powerup
    spawnPowerup: function() {
        const lane = Math.floor(Math.random() * Config.LANE_COUNT);
        const type = Config.POWERUP_TYPES[Math.floor(Math.random() * Config.POWERUP_TYPES.length)];
        
        this.powerups.push({
            x: Config.GAME_WIDTH,
            y: Config.getLanePosition(lane),
            width: Config.ORB_SIZE,
            height: Config.ORB_SIZE,
            color: type.color,
            type: type.name,
            duration: type.duration,
            lane: lane
        });
    },
    
    // Check collisions
    checkCollisions: function() {
        const playerX = Config.PLAYER_X;
        const playerY = Config.getLanePosition(this.currentLane);
        const playerWidth = Config.PLAYER_WIDTH;
        const playerHeight = Config.PLAYER_HEIGHT;
        
        // Check obstacle collisions
        if (!this.isShielded) {
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                if (obstacle.lane === this.currentLane &&
                    this.checkCollision(playerX, playerY, playerWidth, playerHeight,
                                      obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
                    this.lives--;
                    this.obstacles.splice(i, 1);
                    
                    if (this.lives <= 0) {
                        MainGame.gameOver();
                    }
                    break;
                }
            }
        }
        
        // Check orb collisions
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const orb = this.orbs[i];
            if (orb.lane === this.currentLane &&
                this.checkCollision(playerX, playerY, playerWidth, playerHeight,
                                  orb.x, orb.y, orb.size, orb.size)) {
                this.score += Config.ORB_VALUE;
                this.orbs.splice(i, 1);
            }
        }
        
        // Check powerup collisions
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (powerup.lane === this.currentLane &&
                this.checkCollision(playerX, playerY, playerWidth, playerHeight,
                                  powerup.x, powerup.y, powerup.width, powerup.height)) {
                this.applyPowerup(powerup);
                this.powerups.splice(i, 1);
            }
        }
    },
    
    // Check collision between two rectangles
    checkCollision: function(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    },
    
    // Apply powerup effect
    applyPowerup: function(powerup) {
        switch (powerup.type) {
            case 'shield':
                this.isShielded = true;
                setTimeout(() => {
                    this.isShielded = false;
                }, powerup.duration);
                break;
            case 'boost':
                this.isBoosted = true;
                this.speed = this.baseSpeed * 2;
                this.boostEndTime = Date.now() + powerup.duration;
                break;
        }
    },
    
    // Switch lanes
    switchLane: function(direction) {
        const now = Date.now();
        if (now - this.lastLaneSwitch < Config.LANE_SWITCH_COOLDOWN) {
            return;
        }
        
        this.targetLane = Math.max(0, Math.min(Config.LANE_COUNT - 1, this.currentLane + direction));
        this.lastLaneSwitch = now;
    },
    
    // Draw track
    draw: function(ctx) {
        // Forward to the render method for compatibility
        this.render(ctx);
    },
    
    // Draw lane markings
    drawLaneMarkings: function(ctx) {
        ctx.save();
        
        // Calculate lane positions
        const totalWidth = Config.LANE_WIDTH * Config.LANE_COUNT;
        const startX = (Config.GAME_WIDTH - totalWidth) / 2;
        
        // Draw lane dividers with different colors for different sections
        ctx.lineWidth = this.lineWidth;
        ctx.setLineDash([this.dashLength, this.dashGap]);
        ctx.lineDashOffset = -this.dashOffset;
        
        for (let i = 1; i < Config.LANE_COUNT; i++) {
            const x = startX + (i * Config.LANE_WIDTH);
            
            // Special coloring for the center divider (between oncoming and same direction)
            if (i === 3) {
                // Double yellow line for center divider
                ctx.strokeStyle = '#ffff00';
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 15;
                ctx.lineWidth = this.lineWidth + 2;
                
                // Draw double line
                ctx.beginPath();
                ctx.moveTo(x - 3, 0);
                ctx.lineTo(x - 3, Config.GAME_HEIGHT);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x + 3, 0);
                ctx.lineTo(x + 3, Config.GAME_HEIGHT);
                ctx.stroke();
            } else if (i < 3) {
                // Red lines for oncoming lanes (left side)
                ctx.strokeStyle = '#ff3333';
                ctx.shadowColor = '#ff3333';
                ctx.shadowBlur = 10;
                ctx.lineWidth = this.lineWidth;
                
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, Config.GAME_HEIGHT);
                ctx.stroke();
            } else {
                // Green lines for same-direction lanes (right side)
                ctx.strokeStyle = '#33ff33';
                ctx.shadowColor = '#33ff33';
                ctx.shadowBlur = 10;
                ctx.lineWidth = this.lineWidth;
            
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, Config.GAME_HEIGHT);
            ctx.stroke();
        }
        }
        
        // Draw track edges
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.lineWidth = 3;
        
        // Left edge
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, Config.GAME_HEIGHT);
        ctx.stroke();
        
        // Right edge
        ctx.beginPath();
        ctx.moveTo(startX + totalWidth, 0);
        ctx.lineTo(startX + totalWidth, Config.GAME_HEIGHT);
        ctx.stroke();
        
        ctx.restore();
    },
    
    // Draw obstacles
    drawObstacles: function(ctx) {
        ctx.save();
        
        for (const obstacle of this.obstacles) {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x - obstacle.width / 2,
                        obstacle.y - obstacle.height / 2,
                        obstacle.width,
                        obstacle.height);
        }
        
        ctx.restore();
    },
    
    // Draw orbs
    drawOrbs: function(ctx) {
        ctx.save();
        
        for (const orb of this.orbs) {
            ctx.fillStyle = orb.color;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = orb.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    // Draw powerups
    drawPowerups: function(ctx) {
        ctx.save();
        
        for (const powerup of this.powerups) {
            ctx.fillStyle = powerup.color;
            ctx.fillRect(powerup.x - powerup.width / 2,
                        powerup.y - powerup.height / 2,
                        powerup.width,
                        powerup.height);
            
            // Add glow effect
            ctx.shadowColor = powerup.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(powerup.x - powerup.width / 2,
                        powerup.y - powerup.height / 2,
                        powerup.width,
                        powerup.height);
        }
        
        ctx.restore();
    },
    
    // Get current score
    getScore: function() {
        return this.score;
    },
    
    // Get current lives
    getLives: function() {
        return this.lives;
    },
    
    // Get current distance traveled
    getDistance: function() {
        return Math.floor(this.distance);
    },
    
    // Get current speed
    getSpeed: function() {
        return this.speed * this.speedMultiplier;
    },
    
    // Set track speed
    setSpeed: function(speed) {
        this.speed = speed;
        this.baseSpeed = speed;
    },
    
    // Update track lines
    updateTrackLines: function(delta) {
        // Move all lines based on track speed
        const normalizedDelta = delta / (1000 / 60);
        const speedDelta = this.speed * normalizedDelta;
        
        // Update each line
        for (let i = this.lines.length - 1; i >= 0; i--) {
            const line = this.lines[i];
            line.y += speedDelta;
            
            // Remove lines that are off the bottom of the screen
            if (line.y > Config.GAME_HEIGHT + 20) {
                this.lines.splice(i, 1);
            }
        }
        
        // Add new lines at top as needed
        while (this.lastLineY < -20) {
            this.lastLineY += 20;
            this.addTrackLine(this.lastLineY, true);
        }
    },
    
    // Update track shape
    updateTrackShape: function() {
        // Update track shape properties if needed
        if (this.shape) {
            // Add any shape updates here
            // For now, we'll keep it simple
        }
    },
    
    // Update track state
    update: function(delta) {
        // Update distance based on speed
        this.distance += this.speed * delta;
        
        // Update track lines
        this.updateTrackLines(delta);
        
        // Update track shape
        this.updateTrackShape();
    },
    
    setSpeedMultiplier: function(multiplier) {
        this.speedMultiplier = multiplier;
    },
    
    // Render the track
    render: function(ctx) {
        // Skip if canvas context is not available
        if (!ctx) return;
        
        ctx.save();
        
        // Draw road background
        ctx.fillStyle = this.roadColor;
        ctx.fillRect(0, 0, Config.GAME_WIDTH, Config.GAME_HEIGHT);
        
        // Draw shoulder
        const shoulderWidth = 20;
        ctx.fillStyle = this.shoulderColor;
        ctx.fillRect(0, 0, shoulderWidth, Config.GAME_HEIGHT);
        ctx.fillRect(Config.GAME_WIDTH - shoulderWidth, 0, shoulderWidth, Config.GAME_HEIGHT);
        
        // Draw lane markings
        this.drawLaneMarkings(ctx);
        
        // Draw obstacles
        this.drawObstacles(ctx);
        
        // Draw orbs
        this.drawOrbs(ctx);
        
        // Draw powerups
        this.drawPowerups(ctx);
        
        ctx.restore();
    }
}; 