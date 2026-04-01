// Neon Racer - Configuration Settings (Mobile Optimized)

const Config = {
    // Game mechanics
    GAME_WIDTH: 400,                 // Game canvas width
    GAME_HEIGHT: 600,                // Game canvas height
    GAME_MODE: 'endless',            // Endless runner mode
    
    // Mobile detection and optimization
    isMobile: false,
    mobileOptimizationLevel: 'high', // 'high', 'medium', 'low'
    
    // Initialize mobile detection
    init: function() {
        this.detectMobile();
        this.setOptimizationLevel();
        console.log('Config initialized with mobile optimization:', {
            isMobile: this.isMobile,
            optimizationLevel: this.mobileOptimizationLevel
        });
    },
    
    // Detect mobile device
    detectMobile: function() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        
        // Additional mobile detection
        if (window.innerWidth <= 768 || window.innerHeight <= 768) {
            this.isMobile = true;
        }
        
        // Check for touch support
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.isMobile = true;
        }
    },
    
    // Set optimization level based on device performance
    setOptimizationLevel: function() {
        if (this.isMobile) {
            // Check for low-end devices
            const memory = navigator.deviceMemory || 4;
            const cores = navigator.hardwareConcurrency || 4;
            
            if (memory < 4 || cores < 4) {
                this.mobileOptimizationLevel = 'high';
            } else {
                this.mobileOptimizationLevel = 'medium';
            }
        } else {
            this.mobileOptimizationLevel = 'low';
        }
    },
    
    // Track settings (optimized for mobile)
    INITIAL_TRACK_SPEED: 0.3,
    TRACK_SPEED: 0.3,
    MAX_TRACK_SPEED: this.isMobile ? 0.6 : 0.8, // Reduced max speed on mobile
    TRACK_SPEED_INCREASE_THRESHOLD: this.isMobile ? 300 : 200, // Slower speed increase on mobile
    SPEED_INCREMENT: this.isMobile ? 0.05 : 0.1, // Smaller increments on mobile
    LANE_WIDTH: 67,
    LANE_COUNT: 6,
    
    // Calculate lane positions dynamically
    getLanePosition: function(laneIndex) {
        const totalWidth = this.LANE_WIDTH * this.LANE_COUNT;
        const startX = (this.GAME_WIDTH - totalWidth) / 2;
        return startX + (laneIndex * this.LANE_WIDTH) + (this.LANE_WIDTH / 2);
    },
    
    // Player settings (optimized for mobile)
    PLAYER_WIDTH: 60,
    PLAYER_HEIGHT: 100,
    PLAYER_LERP_SPEED: this.isMobile ? 0.6 : 0.4, // Faster response on mobile
    LANE_SWITCH_COOLDOWN: this.isMobile ? 120 : 180, // Faster lane switching on mobile
    CAR_GLOW_SIZE: this.isMobile ? 20 : 40, // Reduced glow on mobile
    CAR_GLOW_COLOR: '#ff00ff',
    CAR_SPEED: 5,
    PLAYER_PULSE_AMOUNT: this.isMobile ? 0.1 : 0.2, // Reduced pulse on mobile
    PLAYER_PULSE_RATE: this.isMobile ? 0.02 : 0.03, // Slower pulse on mobile
    
    // Obstacle settings (optimized for mobile)
    OBSTACLE_TYPES: [
        { 
            name: 'barrier', 
            width: 60, 
            height: 30, 
            color: '#ff0000', 
            points: 0,
            type: 'barrier',
            rotationSpeed: this.isMobile ? 0.01 : 0.02 // Slower rotation on mobile
        },
        { 
            name: 'spike', 
            width: 40, 
            height: 40, 
            color: '#ff3333', 
            points: 0,
            type: 'spike',
            rotationSpeed: this.isMobile ? 0.015 : 0.03
        },
        { 
            name: 'mine', 
            width: 50, 
            height: 50, 
            color: '#ff6600', 
            points: 0,
            type: 'mine',
            rotationSpeed: this.isMobile ? 0.02 : 0.04
        },
        { 
            name: 'debris', 
            width: 45, 
            height: 35, 
            color: '#888888', 
            points: 0,
            type: 'debris',
            rotationSpeed: this.isMobile ? 0.0125 : 0.025
        }
    ],
    OBSTACLE_WIDTH: 40,
    OBSTACLE_HEIGHT: 40,
    OBSTACLE_SPAWN_DELAY: this.isMobile ? 1200 : 1000, // Slower spawn rate on mobile
    OBSTACLE_MIN_DISTANCE: this.isMobile ? 250 : 200, // More distance on mobile
    OBSTACLE_SPEED_MULTIPLIER: 1.0,
    OBSTACLE_ROTATION_SPEED: this.isMobile ? 0.025 : 0.05, // Slower rotation on mobile
    
    // Collectible settings (optimized for mobile)
    COIN_VALUE: 10,
    DIAMOND_COIN_VALUE: 50,
    RARE_COIN_VALUE: 150,
    COIN_SIZE: this.isMobile ? 25 : 30, // Smaller coins on mobile
    COIN_SPAWN_RATE: this.isMobile ? 3500 : 3000, // Slower spawn rate on mobile
    MIN_COIN_SPAWN_RATE: this.isMobile ? 2500 : 2000,
    COIN_SPAWN_DECREMENT: this.isMobile ? 0.5 : 1, // Slower decrement on mobile
    MAX_COIN_SEQUENCE: this.isMobile ? 8 : 10, // Fewer coins in sequence on mobile
    COIN_SEQUENCE_GAP: 40,
    MAX_COINS_PER_COLUMN: this.isMobile ? 8 : 10, // Fewer coins per column on mobile
    COIN_GAP: 40,
    COIN_EMOJI: '🪙',
    DIAMOND_COIN_EMOJI: '💎',
    DIAMOND_COIN_CHANCE: 0.1,
    RARE_COIN_CHANCE: 0.02,
    
    // Traffic settings (optimized for mobile)
    ONCOMING_LANES: [0, 1, 2],
    SAME_DIRECTION_LANES: [3, 4, 5],
    ONCOMING_CAR_SPEED: this.isMobile ? 4 : 5, // Slower cars on mobile
    SAME_DIRECTION_CAR_SPEED: this.isMobile ? 2 : 3, // Slower cars on mobile
    CAR_SPAWN_RATE: this.isMobile ? 2500 : 2000, // Slower spawn rate on mobile
    
    // Warning system (optimized for mobile)
    ONCOMING_WARNING_TIME: this.isMobile ? 4000 : 3000, // Longer warning on mobile
    SAME_DIRECTION_WARNING_TIME: this.isMobile ? 3000 : 2000, // Longer warning on mobile
    WARNING_FLASH_SPEED: this.isMobile ? 300 : 200, // Slower flash on mobile
    
    // Progressive difficulty (optimized for mobile)
    DIFFICULTY_INCREASE_INTERVAL: this.isMobile ? 15000 : 12000, // Slower difficulty increase on mobile
    MIN_CAR_SPAWN_RATE: this.isMobile ? 800 : 600, // Slower minimum spawn rate on mobile
    MAX_ONCOMING_CAR_SPEED: this.isMobile ? 8 : 10, // Lower max speed on mobile
    MAX_SAME_DIRECTION_CAR_SPEED: this.isMobile ? 5 : 7, // Lower max speed on mobile
    
    // Power-up settings (optimized for mobile)
    POWERUP_TYPES: [
        { name: 'shield', duration: this.isMobile ? 8000 : 6000, color: '#0088ff', spawnChance: this.isMobile ? 0.3 : 0.25 },
        { name: 'boost', duration: this.isMobile ? 6000 : 4000, color: '#ffff00', spawnChance: this.isMobile ? 0.4 : 0.35 },
        { name: 'magnet', duration: this.isMobile ? 8000 : 6000, color: '#ff00ff', spawnChance: this.isMobile ? 0.5 : 0.4 }
    ],
    POWERUP_SPAWN_RATE: this.isMobile ? 15000 : 12000, // Slower spawn rate on mobile
    
    // Game settings
    STARTING_LIVES: 1,
    SCORE_PER_FRAME: 0,
    
    // Shop upgrades
    UPGRADES: {
        SPEED: {
            name: 'Speed Boost',
            description: 'Increase your base speed',
            baseCost: 1000,
            maxLevel: 5,
            effect: 0.2
        },
        HANDLING: {
            name: 'Quick Lane Switch',
            description: 'Reduce lane switching cooldown',
            baseCost: 800,
            maxLevel: 5,
            effect: 0.15
        },
        MAGNET: {
            name: 'Coin Magnet',
            description: 'Attract coins from further away',
            baseCost: 1200,
            maxLevel: 3,
            effect: 50
        },
        INVINCIBILITY: {
            name: 'Shield',
            description: 'Temporary invincibility',
            baseCost: 2000,
            maxLevel: 1,
            effect: 1,
            duration: 5000,
            cooldown: 30000
        }
    },
    
    // Visual effects (heavily optimized for mobile)
    NEON_COLORS: [
        '#ff00ff', // magenta
        '#00ffff', // cyan
        '#ffff00', // yellow
        '#ff0066', // hot pink
        '#00ff66', // neon green
        '#ff6600', // neon orange
        '#6600ff'  // neon purple
    ],
    
    // Effects settings (optimized for mobile)
    EXPLOSION_SIZE: this.isMobile ? 20 : 30, // Smaller explosions on mobile
    PARTICLE_COUNT: this.isMobile ? 8 : 15, // Fewer particles on mobile
    
    // Debug mode
    DEBUG_MODE: false,
    
    // Sound URLs
    SOUND_URLS: {
        crash: 'assets/sounds/crash.mp3'
    },
    
    // Progressive difficulty settings (optimized for mobile)
    DIFFICULTY_LEVELS: [
        { level: 1, score: 0,    name: "Neon Newbie",    speedMultiplier: 1.0, spawnRateMultiplier: this.isMobile ? 1.1 : 1.2, obstacleChance: this.isMobile ? 0.15 : 0.20, trafficDensity: this.isMobile ? 1.0 : 1.2 },
        { level: 2, score: this.isMobile ? 120 : 80,   name: "Street Racer",   speedMultiplier: this.isMobile ? 1.05 : 1.1, spawnRateMultiplier: this.isMobile ? 1.2 : 1.3, obstacleChance: this.isMobile ? 0.20 : 0.25, trafficDensity: this.isMobile ? 1.1 : 1.3 },
        { level: 3, score: this.isMobile ? 250 : 150,  name: "Speed Demon",    speedMultiplier: this.isMobile ? 1.1 : 1.2, spawnRateMultiplier: this.isMobile ? 1.3 : 1.4, obstacleChance: this.isMobile ? 0.25 : 0.30, trafficDensity: this.isMobile ? 1.2 : 1.4 },
        { level: 4, score: this.isMobile ? 400 : 250,  name: "Neon Warrior",   speedMultiplier: this.isMobile ? 1.15 : 1.3, spawnRateMultiplier: this.isMobile ? 1.4 : 1.5, obstacleChance: this.isMobile ? 0.30 : 0.35, trafficDensity: this.isMobile ? 1.3 : 1.5 },
        { level: 5, score: this.isMobile ? 600 : 400,  name: "Velocity Master", speedMultiplier: this.isMobile ? 1.2 : 1.4, spawnRateMultiplier: this.isMobile ? 1.5 : 1.6, obstacleChance: this.isMobile ? 0.35 : 0.40, trafficDensity: this.isMobile ? 1.4 : 1.6 },
        { level: 6, score: this.isMobile ? 800 : 600,  name: "Neon Legend",     speedMultiplier: this.isMobile ? 1.25 : 1.5, spawnRateMultiplier: this.isMobile ? 1.6 : 1.7, obstacleChance: this.isMobile ? 0.40 : 0.45, trafficDensity: this.isMobile ? 1.5 : 1.7 },
        { level: 7, score: this.isMobile ? 1000 : 800, name: "Supersonic Ace",  speedMultiplier: this.isMobile ? 1.3 : 1.6, spawnRateMultiplier: this.isMobile ? 1.7 : 1.8, obstacleChance: this.isMobile ? 0.45 : 0.50, trafficDensity: this.isMobile ? 1.6 : 1.8 },
        { level: 8, score: this.isMobile ? 1200 : 1000, name: "Neon God",        speedMultiplier: this.isMobile ? 1.35 : 1.7, spawnRateMultiplier: this.isMobile ? 1.8 : 1.9, obstacleChance: this.isMobile ? 0.50 : 0.55, trafficDensity: this.isMobile ? 1.7 : 1.9 },
        { level: 9, score: this.isMobile ? 1500 : 1200, name: "Hyper Racer",     speedMultiplier: this.isMobile ? 1.4 : 1.8, spawnRateMultiplier: this.isMobile ? 1.9 : 2.0, obstacleChance: this.isMobile ? 0.55 : 0.60, trafficDensity: this.isMobile ? 1.8 : 2.0 },
        { level: 10, score: this.isMobile ? 1800 : 1500, name: "Neon Overlord",   speedMultiplier: this.isMobile ? 1.45 : 1.9, spawnRateMultiplier: this.isMobile ? 2.0 : 2.1, obstacleChance: this.isMobile ? 0.60 : 0.65, trafficDensity: this.isMobile ? 1.9 : 2.1 }
    ],
    DEFAULT_DIFFICULTY: 0,
    
    // Obstacle settings
    OBSTACLE_MIN_GAP: 2500,
    OBSTACLE_MAX_GAP: 4000,
    OBSTACLE_MIN_HEIGHT: 40,
    OBSTACLE_MAX_HEIGHT: 80,
    OBSTACLE_WIDTH: 30,
    
    // Platform settings
    PLATFORM_MIN_GAP: 800,
    PLATFORM_MAX_GAP: 1800,
    PLATFORM_MIN_WIDTH: 80,
    PLATFORM_MAX_WIDTH: 200,
    PLATFORM_HEIGHT: 20,
    PLATFORM_FREQUENCY: 0.8,
    
    // Flying enemy settings
    ENEMY_MIN_GAP: 2000,
    ENEMY_MAX_GAP: 3500,
    ENEMY_SPEED_MULTIPLIER: 1.2,
    
    // Ground settings
    GROUND_HEIGHT: 40,
    
    // Player settings
    PLAYER_X: 200,
    PLAYER_Y: 500,
    PLAYER_SPEED: 5,
    
    // Portrait mode scaling factors
    PORTRAIT_SCALE_FACTORS: {
        PLAYER: 0.7,
        SPACESHIP: 0.8,
        PROJECTILE: 0.8,
        ASTEROID: 0.7
    },
    
    // Scoring
    SCORE_INCREMENT: 0.01,
    POINT_MILESTONE: 500,
    
    // Background settings
    CLOUD_FREQUENCY: 0.5,
    CLOUD_MIN_SPEED: 1,
    CLOUD_MAX_SPEED: 3,
    
    // Sound settings
    SOUND_ENABLED: true,
    MUSIC_VOLUME: 0.3,
    SFX_VOLUME: 0.5,
    
    // Database settings
    SUPABASE_URL: 'https://bqcrbcpmimfojnjdhvrz.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxY3JiY3BtaW1mb2puamRodnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjE1ODEsImV4cCI6MjA4MDI5NzU4MX0.tlDiLyCdrOAULzLH9fv0rm5wpiHqy4nzDvmpC9xXRGw',
    
    // Mobile-specific performance settings
    MOBILE_SETTINGS: {
        // Frame rate optimization
        TARGET_FPS: this.isMobile ? 30 : 60, // Lower target FPS on mobile
        FRAME_SKIP_THRESHOLD: this.isMobile ? 33 : 16, // Skip frames if below threshold (ms)
        
        // Particle system limits
        MAX_PARTICLES: this.isMobile ? 50 : 200, // Limit total particles on mobile
        MAX_EXPLOSIONS: this.isMobile ? 3 : 10, // Limit explosions on mobile
        
        // Animation optimization
        REDUCE_ANIMATIONS: this.isMobile, // Reduce animations on mobile
        SIMPLIFY_RENDERING: this.isMobile, // Simplify rendering on mobile
        
        // Touch optimization
        TOUCH_DEADZONE: 20, // Dead zone for touch controls
        TOUCH_SENSITIVITY: this.isMobile ? 1.5 : 1.0, // Higher sensitivity on mobile
    }
};

// Initialize mobile detection when config loads
Config.init(); 