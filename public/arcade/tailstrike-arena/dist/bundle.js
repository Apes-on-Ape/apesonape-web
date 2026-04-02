
// Tailstrike Arena - Production Bundle
console.log('🎮 Loading Tailstrike Arena...');

// Load Socket.IO from CDN first
const socketScript = document.createElement('script');
socketScript.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
socketScript.onload = () => {
    console.log('✅ Socket.IO loaded successfully');
    
    // Load Phaser from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
    script.onload = () => {
        console.log('✅ Phaser loaded successfully');
        
        // Hide loading screen after a short delay
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 1000);
        
        // Load the game modules
        loadGame();
    };
    script.onerror = () => {
        console.error('❌ Failed to load Phaser from CDN');
        document.getElementById('root').innerHTML = '<div style="color: white; text-align: center; padding: 50px;">Failed to load game engine. Please check your internet connection.</div>';
    };
    document.head.appendChild(script);
};
socketScript.onerror = () => {
    console.error('❌ Failed to load Socket.IO from CDN');
    document.getElementById('root').innerHTML = '<div style="color: white; text-align: center; padding: 50px;">Failed to load multiplayer library. Please check your internet connection.</div>';
};
document.head.appendChild(socketScript);

// Game loading function
async function loadGame() {
    try {
        // Import the game modules (Phaser and Socket.IO are now global)
        const { default: MainMenuScene } = await import('./src/scenes/MainMenuScene.js');
        const { default: CharacterSelectionScene } = await import('./src/scenes/CharacterSelectionScene.js');
        const { default: TrainingArenaSelectionScene } = await import('./src/scenes/TrainingArenaSelectionScene.js');
        const { default: GameScene } = await import('./src/scenes/GameScene.js');
        const { default: SurvivalScene } = await import('./src/scenes/SurvivalScene.js');
        const { default: LobbyScene } = await import('./src/scenes/LobbyScene.js');
        const { default: GameOverScene } = await import('./src/scenes/GameOverScene.js');
        
        console.log('✅ Game modules loaded successfully');
        
        // Initialize the game
        initializeGame(MainMenuScene, CharacterSelectionScene, TrainingArenaSelectionScene, GameScene, SurvivalScene, LobbyScene, GameOverScene);
        
    } catch (error) {
        console.error('❌ Failed to load game modules:', error);
        document.getElementById('root').innerHTML = '<div style="color: white; text-align: center; padding: 50px;">Game failed to load. Please refresh the page.</div>';
    }
}

// Initialize the game
function initializeGame(MainMenuScene, CharacterSelectionScene, TrainingArenaSelectionScene, GameScene, SurvivalScene, LobbyScene, GameOverScene) {
    // Get screen dimensions for responsive canvas
    const screenWidth = Math.min(window.innerWidth, 1920);
    const screenHeight = Math.min(window.innerHeight, 1080);

    const config = {
        type: Phaser.AUTO,
        width: screenWidth,
        height: screenHeight,
        parent: 'root',
        backgroundColor: '#1a1a1a',
        pixelArt: true,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [MainMenuScene, CharacterSelectionScene, TrainingArenaSelectionScene, GameScene, SurvivalScene, LobbyScene, GameOverScene],
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: screenWidth,
            height: screenHeight
        },
        render: {
            pixelArt: true,
            antialias: false
        },
        camera: {
            backgroundColor: '#1a1a1a'
        }
    };

    const game = new Phaser.Game(config);
    window.game = game;

    console.log('🎮 Game initialized successfully!');
    console.log('Game config:', {
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        pixelArt: config.pixelArt,
        scale: config.scale,
        render: config.render
    });
}

// Add error handling
window.addEventListener('error', (event) => {
    console.error('Game error:', event.error);
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.innerHTML = '<div style="color: white; text-align: center; padding: 50px;">Game error occurred. Please refresh the page.</div>';
    }
});
