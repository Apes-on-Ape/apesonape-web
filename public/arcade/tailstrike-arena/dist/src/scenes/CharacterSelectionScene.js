export default class CharacterSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectionScene' });
    this.selectedCharacter = null;
    this.isMultiplayer = false;
    this.isTraining = false;
    this.socket = null;
    this.roomId = null;
    this.isHost = false;
  }

  preload() {
    // Load character sprites for selection screen
    const characters = [
      'player1', 'player2', 'player3', 'player4', 'player5', 'player6',
      'player7', 'player8', 'player9', 'player10', 'player11', 'player12', 
      'player13', 'player14', 'player15', 'player16'
    ];
    
    characters.forEach(character => {
      this.load.spritesheet(`${character}_walk`, `assets/characters/players/${character}/walk.png`, { 
        frameWidth: 64, 
        frameHeight: 64 
      });
    });
  }

  init(data) {
    this.isMultiplayer = data?.isMultiplayer || false;
    this.isTraining = data?.isTraining || false;
    this.socket = data?.socket || null;
    this.roomId = data?.roomId || null;
    this.isHost = data?.isHost || false;
  }

  create() {
    // Get responsive dimensions
    const screenWidth = this.game.config.width;
    const screenHeight = this.game.config.height;
    
    // Background
    this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000).setOrigin(0, 0);
    
    // Title
    this.add.text(screenWidth / 2, screenHeight * 0.1, 'TAILSTRIKE ARENA', {
      fontSize: '48px',
      fontFamily: 'Press Start 2P',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const modeText = this.isTraining ? 'TRAINING MODE' : 'SELECT YOUR FIGHTER';
    this.add.text(screenWidth / 2, screenHeight * 0.18, modeText, {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Character options - all 16 characters
    const characters = [
      { id: 'player1', name: 'THUNDERFIST', sprite: 'player1_walk', frame: 18 },
      { id: 'player2', name: 'FROSTBLADE', sprite: 'player2_walk', frame: 18 },
      { id: 'player3', name: 'SHADOWSTRIKE', sprite: 'player3_walk', frame: 18 },
      { id: 'player4', name: 'FLAMESTORM', sprite: 'player4_walk', frame: 18 },
      { id: 'player5', name: 'NATUREBORN', sprite: 'player5_walk', frame: 18 },
      { id: 'player6', name: 'VOIDWALKER', sprite: 'player6_walk', frame: 18 },
      { id: 'player7', name: 'AURION', sprite: 'player7_walk', frame: 18 },
      { id: 'player8', name: 'IRONHEART', sprite: 'player8_walk', frame: 18 },
      { id: 'player9', name: 'FIST KING', sprite: 'player9_walk', frame: 18 },
      { id: 'player10', name: 'BLACKJACK', sprite: 'player10_walk', frame: 18 },
      { id: 'player11', name: 'INFERNUS', sprite: 'player11_walk', frame: 18 },
      { id: 'player12', name: 'DON VERMILLION', sprite: 'player12_walk', frame: 18 },
      { id: 'player13', name: 'MAXIMUS REX', sprite: 'player13_walk', frame: 18 },
      { id: 'player14', name: 'PINK SHADOW', sprite: 'player14_walk', frame: 18 },
      { id: 'player15', name: 'SMOKE', sprite: 'player15_walk', frame: 18 },
      { id: 'player16', name: 'JAMES', sprite: 'player16_walk', frame: 18 }
    ];

    // Grid layout for 16 characters (4x4)
    const gridStartX = screenWidth / 2 - 300;
    const gridStartY = screenHeight * 0.25;
    const spacingX = 150;
    const spacingY = 120;

    characters.forEach((character, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const x = gridStartX + col * spacingX;
      const y = gridStartY + row * spacingY;

      // Character sprite (first frame of 3rd row - down direction)
      const sprite = this.add.sprite(x, y - 30, character.sprite);
      sprite.setFrame(character.frame); // Set to frame 18 (first frame of 3rd row)
      sprite.setScale(1.5);
      sprite.setInteractive();

      // Character name
      const nameText = this.add.text(x, y + 40, character.name, {
        fontSize: '12px',
        fontFamily: 'Press Start 2P',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);

      // Selection indicator
      const selectionBox = this.add.rectangle(x, y - 30, 100, 100, 0x00ff00, 0);
      selectionBox.setStrokeStyle(3, 0x00ff00);
      selectionBox.setVisible(false);

      // Click handler
      sprite.on('pointerdown', () => {
        this.selectCharacter(character.id, sprite, selectionBox);
      });

      // Store references
      sprite.characterId = character.id;
      sprite.selectionBox = selectionBox;
      sprite.nameText = nameText;
    });

    // Start button
    const buttonText = this.isMultiplayer ? 'READY TO FIGHT' : 'START FIGHT';
    this.startButton = this.add.text(screenWidth / 2, screenHeight * 0.7, buttonText, {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    this.startButton.on('pointerdown', () => {
      if (this.selectedCharacter) {
        this.startGame();
      }
    });

    // Instructions
    this.add.text(screenWidth / 2, screenHeight * 0.85, 'CLICK TO SELECT CHARACTER', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      fill: '#888888'
    }).setOrigin(0.5);
  }



  selectCharacter(characterId, sprite, selectionBox) {
    // Clear previous selection
    this.children.list.forEach(child => {
      if (child.selectionBox) {
        child.selectionBox.setVisible(false);
      }
    });

    // Set new selection
    this.selectedCharacter = characterId;
    selectionBox.setVisible(true);

    // Update start button
    this.startButton.setStyle({ fill: '#00ff00' });
  }

  startGame() {
    if (this.isMultiplayer) {
      // For multiplayer, go to lobby with character selected
      this.scene.start('LobbyScene', { 
        selectedCharacter: this.selectedCharacter,
        socket: this.socket,
        roomId: this.roomId,
        isHost: this.isHost
      });
    } else if (this.isTraining) {
      // For training mode, go to arena selection
      this.scene.start('TrainingArenaSelectionScene', { 
        selectedCharacter: this.selectedCharacter,
        isTraining: true
      });
    } else {
      // For single player, go directly to game
      this.scene.start('GameScene', { 
        selectedCharacter: this.selectedCharacter,
        isMultiplayer: false,
        socket: null,
        roomId: null,
        isHost: false
      });
    }
  }
} 