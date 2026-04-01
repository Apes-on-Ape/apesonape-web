import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.result = data.result; // 'victory' or 'defeat'
    this.socket = data.socket;
    this.isSurvival = data.isSurvival || false;
    this.survivalScore = data.survivalScore ?? 0;
    this.survivalWave = data.survivalWave ?? 1;
  }

  create() {
    const { width, height } = this.scale;
    
    // Background
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);
    
    // Result text
    const resultText = this.result === 'victory' ? 'VICTORY!' : 'DEFEAT';
    const resultColor = this.result === 'victory' ? '#ffd700' : '#ff0000';
    
    this.add.text(width / 2, height / 2 - 120, resultText, {
      fontSize: '72px',
      fontFamily: 'Arial, sans-serif',
      fill: resultColor,
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    let subtitle = this.result === 'victory' ? 'You are the champion!' : 'Better luck next time!';
    if (this.isSurvival) {
      subtitle = `Waves reached: ${this.survivalWave}  ·  Score: ${this.survivalScore.toLocaleString()}`;
    }
    this.add.text(width / 2, height / 2 - 20, subtitle, {
      fontSize: this.isSurvival ? '22px' : '24px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width - 80 },
    }).setOrigin(0.5);

    // Return Button
    const buttonText = this.socket ? 'RETURN TO LOBBY' : 'MAIN MENU';
    this.returnBtn = this.add.rectangle(width / 2, height / 2 + 110, 300, 60, 0x4CAF50);
    this.returnBtn.setInteractive();
    this.returnBtn.on('pointerdown', () => this.returnToLobby());
    
    this.add.text(width / 2, height / 2 + 110, buttonText, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Disconnect from room
    if (this.socket) {
      this.socket.emit('leaveRoom');
    }
  }

  returnToLobby() {
    if (this.socket) {
      // Multiplayer mode - return to lobby
      this.scene.start('LobbyScene');
    } else {
      // Single player mode - return to main menu
      this.scene.start('MainMenuScene');
    }
  }
} 