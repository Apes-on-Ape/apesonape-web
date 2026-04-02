// Block Dodger - Configuration Settings

const Config = {
    // Game mechanics
    INITIAL_BLOCK_SPEED: 3,          // Initial speed of falling blocks (reduced for better stability)
    MAX_BLOCK_SPEED: 10,             // Maximum speed of falling blocks (increased for faster gameplay)
    SPEED_INCREMENT: 0.5,            // How fast blocks accelerate (increased for faster progression)
    SPAWN_RATE_DECREMENT: 25,        // How much spawn rate decreases per interval (increased)
    MIN_BLOCK_SPAWN_RATE: 300,       // Minimum spawn rate (decreased for faster gameplay)
    FIXED_TIME_STEP: 16.67,          // Fixed time step for 60 FPS (1000ms / 60)
    
    // Scoring
    INITIAL_SCORE_SPEED: 1000,       // Initial score speed (1 second per point - 1.5x faster)
    MIN_SCORE_SPEED: 200,            // Minimum score speed (1.5x faster scoring at high levels)
    SCORE_SPEED_DECREMENT: 100,      // How much score speed decreases per interval (1.5x faster progression)
    
    // Visual effects
    EXPLOSION_SIZE: 30,              // Base size of explosion animation
    
    // Player settings
    PLAYER_WIDTH: 30,
    PLAYER_HEIGHT: 30,
    PLAYER_SPEED: 3,                 // Player speed for responsive control
    PLAYER_GLOW_COLOR: '#00ffff',    // Cyan glow for cyberpunk effect
    PLAYER_GLOW_SIZE: 10,            // Size of the glow effect
    PLAYER_PULSE_RATE: 0.05,         // Rate of pulsing animation
    PLAYER_PULSE_AMOUNT: 0.3,        // Amount of pulse (0-1)
    
    // Sound settings
    SOUND_URLS: {
        explosion: '../neon-racer/assets/sounds/crash.mp3',
        point: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2u2klBjaV2vLDdSQELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2u2klBjaV2vLDdSQELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2u2klBjaV2vLDdSQELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFA==',
        background: ''
    },
    
    // Block colors
    BLOCK_COLORS: [
        '#ff0000', // red
        '#00ff00', // green
        '#0000ff', // blue
        '#ff00ff', // magenta
        '#00ffff', // cyan
        '#ffff00', // yellow
        '#ff8800', // orange
        '#ff0088', // pink
        '#8800ff'  // purple
    ],
    
    // Progressive difficulty settings
    DIFFICULTY_LEVELS: [
        { score: 0,   name: "Beginner",    blockSpeed: 1.0, spawnRateMultiplier: 1.0, specialBlockChance: 0.00, fieldShrink: 0 },
        { score: 10,  name: "Easy",        blockSpeed: 1.2, spawnRateMultiplier: 1.1, specialBlockChance: 0.05, fieldShrink: 0 },
        { score: 25,  name: "Normal",      blockSpeed: 1.4, spawnRateMultiplier: 1.2, specialBlockChance: 0.10, fieldShrink: 0 },
        { score: 50,  name: "Challenging", blockSpeed: 1.6, spawnRateMultiplier: 1.3, specialBlockChance: 0.15, fieldShrink: 0 },
        { score: 75,  name: "Hard",        blockSpeed: 1.8, spawnRateMultiplier: 1.4, specialBlockChance: 0.20, fieldShrink: 0 },
        { score: 100, name: "Expert",      blockSpeed: 2.0, spawnRateMultiplier: 1.5, specialBlockChance: 0.25, fieldShrink: 0 },
        { score: 150, name: "Master",      blockSpeed: 2.2, spawnRateMultiplier: 1.6, specialBlockChance: 0.30, fieldShrink: 0 },
        { score: 200, name: "Nightmare",   blockSpeed: 2.5, spawnRateMultiplier: 1.8, specialBlockChance: 0.35, fieldShrink: 0 }
    ],
    
    // Special block types
    SPECIAL_BLOCKS: {
        LARGE: { sizeMultiplier: 1.5, speedMultiplier: 0.9, color: '#ff5500', probability: 0.4 },
        FAST: { sizeMultiplier: 0.8, speedMultiplier: 1.8, color: '#ffff00', probability: 0.3 },
        ZIGZAG: { sizeMultiplier: 1.0, speedMultiplier: 1.2, color: '#ff00ff', oscillationAmount: 80, probability: 0.2 },
        SEEKING: { sizeMultiplier: 0.7, speedMultiplier: 1.4, color: '#ff0000', trackingStrength: 0.5, probability: 0.1 }
    }
}; 

if (typeof window !== 'undefined') {
    window.Config = Config;
}