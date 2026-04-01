import Phaser from 'phaser';
import MainMenuScene from './scenes/MainMenuScene';
import CharacterSelectionScene from './scenes/CharacterSelectionScene';
import TrainingArenaSelectionScene from './scenes/TrainingArenaSelectionScene';
import GameScene from './scenes/GameScene';
import SurvivalScene from './scenes/SurvivalScene';
import LobbyScene from './scenes/LobbyScene';
import GameOverScene from './scenes/GameOverScene';
import './styles/game.css';

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
  // Prevent game from pausing when tab loses focus
  pauseOnBlur: false,
  pauseOnFocus: false,
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
  // Add camera configuration
  camera: {
    backgroundColor: '#1a1a1a'
  }
};

const game = new Phaser.Game(config);

// Make game globally accessible for debugging
window.game = game;

// Ensure game continues running when tab is not visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Tab is now hidden - keeping game running for multiplayer');
  } else {
    console.log('Tab is now visible - game continues running');
  }
  // Force game to continue running regardless of visibility
  if (game.loop) {
    game.loop.start();
  }
});

// Debug: Log game initialization
console.log('Game initialized with config:', {
  width: config.width,
  height: config.height,
  backgroundColor: config.backgroundColor,
  pixelArt: config.pixelArt,
  scale: config.scale,
  render: config.render,
  pauseOnBlur: config.pauseOnBlur,
  pauseOnFocus: config.pauseOnFocus
}); 