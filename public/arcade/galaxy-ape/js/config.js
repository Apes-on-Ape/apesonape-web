// Galaxy Ape - Game Configuration

const CONFIG = {
    // Game settings
    GAME_ID: 'galaxy_ape',
    GAME_NAME: 'Galaxy Ape',
    
    // Canvas settings
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 500,
    
    // Game physics (Reduced for space flight)
    GRAVITY: 0.05,          // Very minimal gravity for space-like feel
    THRUSTER_FORCE: 0.3,    // Reduced force for more controlled movement
    MAX_VELOCITY: 4,        // Reduced maximum velocity for better control
    
    // Game speed (Reduced for better control)
    INITIAL_SPEED: 2,     // Reduced from 3
    MAX_SPEED: 5,         // Reduced from 8
    ACCELERATION: 0.0001, // Reduced from 0.0002
    
    // Thruster settings
    THRUSTER_ENABLED: true,
    THRUSTER_DECAY: 0.92,   // Increased decay for more responsive stopping
    
    // Player movement settings
    PLAYER_MAX_SPEED: 6,
    PLAYER_ACCELERATION: 0.8,
    PLAYER_FRICTION: 0.85,
    
    // Rocket/Projectile settings
    ROCKET_SPEED: 12,
    ROCKET_LIFETIME: 3000,  // 3 seconds
    ROCKET_SIZE: 6,         // Reduced from 8 to be proportional with smaller player
    ROCKET_FIRE_RATE: 250,  // Milliseconds between shots
    
    // NEW: Galaga-style weapon system
    WEAPON_TYPES: {
        BASIC: {
            name: 'Basic Blaster',
            damage: 2,
            fireRate: 250,
            projectileSize: 6,      // Reduced from 8
            projectileSpeed: 12,
            projectileColor: '#00ff00',
            penetration: false
        },
        PLASMA: {
            name: 'Plasma Cannon',
            damage: 2,
            fireRate: 200,
            projectileSize: 9,      // Reduced from 12
            projectileSpeed: 14,
            projectileColor: '#0088ff',
            penetration: true
        },
        LASER: {
            name: 'Laser Beam',
            damage: 3,
            fireRate: 150,
            projectileSize: 12,     // Reduced from 16
            projectileSpeed: 18,
            projectileColor: '#ff0088',
            penetration: true
        },
        SPREAD: {
            name: 'Spread Shot',
            damage: 1,
            fireRate: 300,
            projectileSize: 5,      // Reduced from 6
            projectileSpeed: 10,
            projectileColor: '#ffff00',
            penetration: false,
            spreadCount: 3
        }
    },
    
    // NEW: Breakable asteroid system (slower movement)
    ASTEROID_TYPES: {
        LARGE: {
            size: 70,        // Slightly larger for better visibility
            health: 3,
            speed: 1.5,      // Slower movement
            points: 2,       // Reduced from 5
            breakInto: 3,
            color: '#8b4513'  // Saddle brown - clearly visible
        },
        MEDIUM: {
            size: 50,        // Increased size
            health: 2,
            speed: 2,        // Slower movement
            points: 1,       // Reduced from 3
            breakInto: 2,
            color: '#a0522d'  // Sienna - enhanced contrast
        },
        SMALL: {
            size: 30,        // Larger for better visibility
            health: 1,
            speed: 2.5,      // Slower movement
            points: 1,       // Same (already low)
            breakInto: 0,
            color: '#cd853f'  // Peru - brighter and more visible
        }
    },
    
    // NEW: Multi-directional spawning
    SPAWN_DIRECTIONS: {
        TOP: 'top',
        BOTTOM: 'bottom',
        LEFT: 'left',
        RIGHT: 'right',
        TOP_LEFT: 'top_left',
        TOP_RIGHT: 'top_right',
        BOTTOM_LEFT: 'bottom_left',
        BOTTOM_RIGHT: 'bottom_right'
    },
    
    // NEW: Enhanced visual effects
    VISUAL_EFFECTS: {
        BLAST_SIZE: 16,
        BLAST_COLOR: '#ffffff',
        BLAST_ALPHA: 0.8,
        EXPLOSION_PARTICLES: 20,
        EXPLOSION_DURATION: 500,
        APE_DIMMER: 0.7  // Make apes slightly dimmer for better shot visibility
    },
    
    // Sandstorm mechanics removed
    
    // Space theme settings
    BACKGROUND_IMAGE: 'assets/images/bg.png',
    STAR_COUNT: 50,
    ASTEROID_FREQUENCY: 0.005,
    SPACESHIP_FREQUENCY: 0.002,
    
    // Difficulty settings (Space-themed names with slower progression)
    DIFFICULTY_LEVELS: [
        { name: "Space Cadet", score: 0, speedMultiplier: 0.5, scoreMultiplier: 0.5 },
        { name: "Orbital Pilot", score: 250, speedMultiplier: 0.7, scoreMultiplier: 0.75 },
        { name: "Star Navigator", score: 500, speedMultiplier: 0.9, scoreMultiplier: 1.0 },
        { name: "Galaxy Explorer", score: 800, speedMultiplier: 1.1, scoreMultiplier: 1.25 },
        { name: "Cosmic Commander", score: 1200, speedMultiplier: 1.3, scoreMultiplier: 1.5 },
        { name: "Intergalactic Ace", score: 1800, speedMultiplier: 1.5, scoreMultiplier: 1.75 }
    ],
    DEFAULT_DIFFICULTY: 0, // Beginner
    
    // Obstacle settings
    OBSTACLE_MIN_GAP: 2500,
    OBSTACLE_MAX_GAP: 4000,
    OBSTACLE_MIN_HEIGHT: 40,
    OBSTACLE_MAX_HEIGHT: 80,
    OBSTACLE_WIDTH: 30,
    
    // Platform settings (climbable obstacles)
    PLATFORM_MIN_GAP: 800,  // Reduced for more continuous platforming
    PLATFORM_MAX_GAP: 1800, // Reduced for more continuous platforming
    PLATFORM_MIN_WIDTH: 80,
    PLATFORM_MAX_WIDTH: 200,
    PLATFORM_HEIGHT: 20,
    PLATFORM_FREQUENCY: 0.8, // Increased to 80% chance for more platforming
    
    // Flying enemy settings
    ENEMY_MIN_GAP: 2000,
    ENEMY_MAX_GAP: 3500,
    ENEMY_SPEED_MULTIPLIER: 1.2,
    
    // Ground settings
    GROUND_HEIGHT: 40,
    
    // Player settings
    PLAYER_WIDTH: 40,       // Reduced from 40 to make spaceship smaller
    PLAYER_HEIGHT: 40,      // Reduced from 40 to make spaceship smaller
    PLAYER_GROUND_OFFSET: 10,
    PLAYER_X_POSITION: 100,
    
    // Portrait mode scaling factors
    PORTRAIT_SCALE_FACTORS: {
        PLAYER: 0.7,        // Make player 30% smaller in portrait
        SPACESHIP: 0.8,     // Make spaceships 20% smaller in portrait (increased from 0.6)
        PROJECTILE: 0.8,    // Make projectiles 20% smaller in portrait
        ASTEROID: 0.7       // Make asteroids 30% smaller in portrait
    },
    
    // Scoring
    SCORE_INCREMENT: 0.01,  // Reduced from 0.05 to slow down passive scoring
    POINT_MILESTONE: 500,   // Increased from 100 to make milestones harder
    
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
    GAME_SCORES_TABLE: 'game_scores',
    
    // Responsive design settings
    BASE_WIDTH: 1000,
    BASE_HEIGHT: 500,
    MIN_SCALE: 0.3,
    MAX_SCALE: 2.0,
    
    // Default ape image path (fallback if no selected ape)
    DEFAULT_APE_IMAGE: 'assets/images/placeholder.png',
    
    // Debug mode
    DEBUG: false,
    
    // Utility functions
    isPortraitMode: function() {
        return window.innerHeight > window.innerWidth && window.innerWidth <= 768;
    },
    
    getPortraitScale: function(type) {
        return this.isPortraitMode() ? this.PORTRAIT_SCALE_FACTORS[type] || 1 : 1;
    },
    
    // PERFORMANCE SETTINGS
    PERFORMANCE: {
        // Boss projectile limits to prevent lag
        MAX_BOSS_PROJECTILES: 40,           // Hard cap on boss projectiles (restored for more bullets)
        MAX_PROJECTILES_PER_ATTACK: 8,      // Max projectiles per regular attack (restored for more bullets)
        MAX_SPECIAL_PROJECTILES: 12,        // Max projectiles per special attack (restored for more bullets)
        PROJECTILE_CULL_DISTANCE: 200,      // Remove projectiles this far off-screen
        REDUCED_VISUAL_EFFECTS_THRESHOLD: 30, // Reduce effects when this many projectiles exist
        
        // Attack frequency limits
        MIN_ATTACK_INTERVAL: 400,           // Minimum time between attacks (ms)
        MIN_SPECIAL_ATTACK_INTERVAL: 3000,  // Minimum time between special attacks (ms)
        
        // Optimization flags
        AGGRESSIVE_CLEANUP: true,           // More aggressive projectile cleanup
        DISTANCE_CULLING: true,             // Cull distant projectiles
        REDUCED_EFFECTS_MODE: false         // Automatically set when too many projectiles
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = CONFIG;
} 