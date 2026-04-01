// Flappy Ape - Enhanced Configuration Module

const CONFIG = {
    // Game identification
    GAME_ID: 'flappy_ape',
    GAME_NAME: 'Flappy Ape',
    GAME_VERSION: '2.0.0',
    
    // Game dimensions
    GAME_WIDTH: 320,
    GAME_HEIGHT: 480,
    CANVAS_WIDTH: 320,
    CANVAS_HEIGHT: 480,
    CELL_SIZE: 16,
    
    // Bird settings
    BIRD_SIZE: 30,
    BIRD_COLOR: '#8B4513', // Brown color for ape
    BIRD_GRAVITY: 0.2,    // Base gravity
    BIRD_JUMP: -5,        // Base jump force
    BIRD_ROTATION_SPEED: 0.1,
    
    // Pipe settings
    PIPE_WIDTH: 52,
    PIPE_GAP: 170,         // Base gap between pipes
    PIPE_SPEED: 1.2,       // Base pipe speed
    PIPE_SPAWN_DISTANCE: 1500,
    PIPE_COLOR: '#4CAF50',
    PIPE_CAP_COLOR: '#45a049',
    
    // Progressive Difficulty System
    DIFFICULTY: {
        // Score thresholds for difficulty increases
        SCORE_THRESHOLDS: [50, 100, 200, 300, 500, 750, 1000, 1500, 2000],
        
        // Speed progression (multipliers)
        SPEED_MULTIPLIERS: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8, 3.2],
        
        // Gap reduction (pixels to subtract from base gap)
        GAP_REDUCTION: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
        
        // Gravity increase (added to base gravity)
        GRAVITY_INCREASE: [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.15, 0.18, 0.22],
        
        // Special pipe patterns by difficulty level
        PIPE_PATTERNS: {
            0: 'normal',        // Normal pipes
            1: 'normal',        // Normal pipes
            2: 'wave',          // Slightly wavy pipes
            3: 'moving',        // Moving pipes
            4: 'double',        // Double pipes occasionally
            5: 'zigzag',        // Zigzag pattern
            6: 'narrow',        // Narrow passages
            7: 'chaos',         // Mixed patterns
            8: 'extreme',       // Extreme patterns
            9: 'nightmare'      // All patterns combined
        }
    },
    
    // Power-up System
    POWERUPS: {
        SPAWN_CHANCE: 0.15,     // 15% chance per pipe set
        DURATION: 5000,         // 5 seconds duration
        TYPES: {
            SHIELD: {
                color: '#00BFFF',
                icon: '🛡️',
                duration: 8000,
                description: 'Immunity to pipe collisions'
            },
            SLOWMO: {
                color: '#9370DB',
                icon: '⏰',
                duration: 4000,
                description: 'Slows down time'
            },
            DOUBLE_JUMP: {
                color: '#FFD700',
                icon: '⬆️',
                duration: 10000,
                description: 'Allows double jumping'
            },

            TINY_APE: {
                color: '#FF69B4',
                icon: '🔸',
                duration: 7000,
                description: 'Shrinks ape size by 50%'
            }
        }
    },
    

    
    // Visual Effects
    EFFECTS: {
        PARTICLES: {
            MAX_PARTICLES: 50,
            EXPLOSION_COUNT: 12,
            TRAIL_LENGTH: 8
        },
        SCREEN_SHAKE: {
            INTENSITY: 5,
            DURATION: 300
        },
        BACKGROUND_TRANSITION: {
            SPEED: 0.02,
            COLORS: [
                '#87CEEB',  // Day
                '#FF7F50',  // Sunset
                '#191970',  // Night
                '#4B0082'   // Deep night
            ]
        }
    },
    
    // Background settings
    BACKGROUND: {
        SKY: '#87CEEB',
        GROUND: '#8B4513',
        GRASS: '#4CAF50'
    },
    GROUND_HEIGHT: 20,
    
    // Wind System
    WIND: {
        ENABLED: false,
        MAX_FORCE: 0.15,        // Maximum wind force
        CHANGE_FREQUENCY: 180,   // Frames between wind changes
        VISUAL_INDICATOR: false
    },
    
    // Achievement System
    ACHIEVEMENTS: {
        FIRST_FLIGHT: { score: 10, reward: 'Bronze Ape' },
        PIPE_MASTER: { score: 50, reward: 'Silver Ape' },
        SKY_WARRIOR: { score: 100, reward: 'Gold Ape' },
        LEGEND: { score: 200, reward: 'Diamond Ape' },
        IMPOSSIBLE: { score: 500, reward: 'Rainbow Ape' },
        GODLIKE: { score: 1000, reward: 'Cosmic Ape' }
    },
    
    // Leaderboard settings
    LEADERBOARD: {
        LIMIT: 10
    },
    
    // Mobile controls
    MOBILE: {
        SWIPE_THRESHOLD: 50,
        DOUBLE_TAP_DELAY: 300
    },
    
    // Debug settings
    DEBUG: false
}; 