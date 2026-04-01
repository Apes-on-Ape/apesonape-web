import Phaser from 'phaser';
import io from 'socket.io-client';

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
    this.socket = null;
    this.roomId = null;
    this.isHost = false;
    this.players = [];
    this.selectedCharacter = null;
    this.readyPlayers = new Set();
  }

  preload() {
    // Load both background images
    this.load.image('bg-menu', 'assets/bg-menu.png');
    this.load.image('bg-arena', 'assets/arena bg.png');
    
    // Load arena assets
    this.load.image('arena-classic', 'assets/arenas/arena_classic.png');
    this.load.image('arena-volcano', 'assets/arenas/volcano_scene.webp');
    this.load.image('arena-hell', 'assets/arenas/hell_portal.webp');
    this.load.image('arena-forest', 'assets/arenas/forest_mushrooms.webp');
    this.load.image('arena-ape_station', 'assets/arenas/ape_station.jpg');
    this.load.image('arena-gm_jungle', 'assets/arenas/gm_jungle.webp');
    this.load.image('arena-samurai_desert', 'assets/arenas/samurai_desert.webp');
    this.load.image('arena-gobs_mine', 'assets/arenas/gobs_mine.jpg');
    
    // Load character sprites for preview
    this.loadCharacterAssets();
  }

  getAllArenas() {
    return [
      { id: 'classic', name: 'CLASSIC ARENA', key: 'arena-classic', description: 'The Traditional Battlefield' },
      { id: 'volcano', name: 'VOLCANO SCENE', key: 'arena-volcano', description: 'The Fiery Inferno' },
      { id: 'hell', name: 'HELL PORTAL', key: 'arena-hell', description: 'The Dark Abyss' },
      { id: 'forest', name: 'FOREST MUSHROOMS', key: 'arena-forest', description: 'The Mystical Grove' },
      { id: 'ape_station', name: 'APE STATION', key: 'arena-ape_station', description: 'The Futuristic Space Station' },
      { id: 'gm_jungle', name: 'GM JUNGLE', key: 'arena-gm_jungle', description: 'The Wild Jungle' },
      { id: 'samurai_desert', name: 'SAMURAI DESERT', key: 'arena-samurai_desert', description: 'The Desert Wasteland' },
      { id: 'gobs_mine', name: 'GOBS MINE', key: 'arena-gobs_mine', description: 'The Goblin Mines' }
    ];
  }

  loadCharacterAssets() {
    // Load all sixteen character walk sprites and preview images for preview
    const characters = [
      'player1', 'player2', 'player3', 'player4', 'player5', 'player6',
      'player7', 'player8', 'player9', 'player10', 'player11', 'player12', 'player13', 'player14',
      'player15', 'player16'
    ];
    
    characters.forEach(character => {
      const characterPath = `assets/characters/players/${character}`;
      
      // Load walk spritesheet for preview
      this.load.spritesheet(`${character}_walk`, `${characterPath}/walk.png`, { 
        frameWidth: 64, 
        frameHeight: 64 
      });
      
      // Load preview image (just called preview.png for all players)
      this.load.image(`${character}_preview`, `${characterPath}/preview.png`);
    });
  }

  init(data) {
    this.selectedCharacter = data?.selectedCharacter || null;
    this.socket = data?.socket || null;
    this.roomId = data?.roomId || null;
    this.isHost = data?.isHost || false;
    
    console.log('LobbyScene init with data:', data);
    console.log('Room ID:', this.roomId);
    console.log('Is Host:', this.isHost);
  }

  create() {
    // Initialize socket connection if not already connected
    if (!this.socket) {
      const socketUrl = this.getSocketUrl();
      // Connect to arena namespace so backend can route Tailstrike events separately
      this.socket = io(`${socketUrl}/arena`);
      this.setupSocketEvents();
    }
    
    // Create lobby UI
    this.createLobbyUI();
  }

  setupSocketEvents() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.updateStatus('Connected to server');
    });

    this.socket.on('roomCreated', (data) => {
      this.roomId = data.roomId;
      this.isHost = true;
      console.log('Room created with ID:', this.roomId);
      this.updateStatus(`Room created! Code: ${this.roomId}`);
      this.showInviteCode();
    });

    this.socket.on('playerJoined', (data) => {
      this.players = data.players;
      this.updatePlayerList();
      this.updateStatus(`${data.playerName} joined the room!`);
    });

    this.socket.on('gameStarting', (data) => {
      console.log('Game starting - showing character selection');
      this.showCharacterSelection();
    });

    this.socket.on('showHostArenaSelection', (data) => {
      console.log('Showing host arena selection');
      this.showHostArenaSelection();
    });

    this.socket.on('waitingForHostArena', (data) => {
      console.log('Waiting for host to select arena');
      this.updateStatus('Waiting for host to select arena...');
    });

    this.socket.on('arenaSelected', (data) => {
      console.log('Arena selected:', data);
      this.updateStatus(`Arena selected: ${data.arenaId}`);
    });

    this.socket.on('startCountdown', (data) => {
      this.startCountdown();
    });

    this.socket.on('gameStart', (data) => {
      console.log('Game starting with roomId:', this.roomId);
      console.log('Game starting with isHost:', this.isHost);
      console.log('Selected arena:', data.arenaId);
      this.scene.start('GameScene', {
        socket: this.socket,
        roomId: this.roomId,
        players: data.players,
        isHost: this.isHost,
        selectedCharacter: this.selectedCharacter,
        arenaId: data.arenaId || this.selectedArena,
        isMultiplayer: true
      });
    });
  }

  createLobbyUI() {
    const { width, height } = this.scale;
    
    // Add arena background image
    const bgImage = this.add.image(0, 0, 'bg-arena');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(width, height);
    bgImage.setDepth(0); // Background at depth 0
    
    // Add ambient background effects
    this.createBackgroundParticles();
    this.createAmbientEffects();
    
    // Title with fighting game style
    this.add.text(width / 2, 100, 'TAILSTRIKE ARENA', {
      fontSize: '64px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5);

    // Create Room Button with enhanced gaming style
    this.createRoomBtn = this.createEnhancedGamingButton(width / 2, 250, 350, 70, 'CREATE ROOM', 0x4CAF50, 0x45a049, 0x00ff00);
    this.createRoomBtn.on('pointerdown', () => this.createRoom());

    // Join Room Section
    this.add.text(width / 2, 350, 'JOIN ROOM', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5);

    // Room Code Input with fighting game style
    this.roomCodeInput = this.createFightingGameInput(width / 2, 400, 350, 60, 'Enter Room Code', 0x333333, 0x444444);
    this.roomCodeInput.on('pointerdown', () => this.showRoomCodeInput());

    // Join Button with enhanced gaming style
    this.joinRoomBtn = this.createEnhancedGamingButton(width / 2, 480, 350, 70, 'JOIN ROOM', 0x2196F3, 0x1976D2, 0x0080ff);
    this.joinRoomBtn.on('pointerdown', () => this.joinRoom());

    // Back Button with enhanced gaming style
    this.backBtn = this.createEnhancedGamingButton(width / 2, 560, 350, 70, 'BACK TO MENU', 0xFF9800, 0xF57C00, 0xffa500);
    this.backBtn.on('pointerdown', () => this.backToMenu());

    // Status Text with fighting game style
    this.statusText = this.add.text(width / 2, 650, 'Waiting for connection...', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Player List with fighting game style
    this.playerListText = this.add.text(width / 2, 700, 'Players:', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  getSocketUrl() {
    try {
      const hostname = window?.location?.hostname || '';
      // Local development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      // Production/preview deployment
      // Use the Render server that hosts the Socket.IO backend
      return 'https://blockdodger1-0.onrender.com';
    } catch (e) {
      // Fallback to production URL if window is unavailable
      return 'https://blockdodger1-0.onrender.com';
    }
  }

  createEnhancedGamingButton(x, y, width, height, text, primaryColor, hoverColor, glowColor) {
    // Create outer glow effect
    const outerGlow = this.add.rectangle(x, y, width + 20, height + 20, glowColor, 0.3);
    outerGlow.setBlendMode('ADD');
    outerGlow.setDepth(10); // Button glow at depth 10
    
    // Create button background with gradient effect
    const buttonBg = this.add.rectangle(x, y, width, height, primaryColor);
    buttonBg.setStrokeStyle(4, 0x000000, 1);
    buttonBg.setDepth(11); // Button background at depth 11
    
    // Create inner highlight for 3D effect
    const highlight = this.add.rectangle(x, y - 2, width - 8, height / 2, 0xffffff, 0.3);
    highlight.setStrokeStyle(2, 0xffffff, 0.5);
    highlight.setDepth(12); // Button highlight at depth 12
    
    // Create button text with fighting game style - HIGHEST DEPTH
    const buttonText = this.add.text(x, y, text, {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5);
    buttonText.setDepth(100); // MAXIMUM DEPTH to ensure text is always on top
    
    // Create simple particle effect system
    const particleGroup = this.add.group();
    let particleTimer = null;
    
    // Store references in button data
    buttonBg.setData('text', buttonText);
    buttonBg.setData('glow', outerGlow);
    buttonBg.setData('highlight', highlight);
    buttonBg.setData('particles', particleGroup);
    buttonBg.setData('particleTimer', particleTimer);
    
    // Make the entire button interactive
    buttonBg.setInteractive();
    
    // Add hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(hoverColor);
      buttonText.setScale(1.05);
      
      // Start particle emission
      this.startButtonParticles(buttonBg, x, y, glowColor);
      
      // Add pulsing glow effect
      this.tweens.add({
        targets: outerGlow,
        alpha: 0.8,
        duration: 500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      
      this.tweens.add({
        targets: [buttonBg, highlight, buttonText],
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 100,
        ease: 'Power2'
      });
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(primaryColor);
      buttonText.setScale(1);
      
      // Stop particle emission
      this.stopButtonParticles(buttonBg);
      
      // Stop pulsing
      this.tweens.killTweensOf(outerGlow);
      outerGlow.setAlpha(0.3);
      
      this.tweens.add({
        targets: [buttonBg, highlight, buttonText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2'
      });
    });
    
    // Add click effect with explosion
    buttonBg.on('pointerdown', () => {
      // Create explosion effect
      this.createButtonExplosion(x, y, glowColor);
      
      this.tweens.add({
        targets: [buttonBg, highlight, buttonText],
        scaleX: 0.98,
        scaleY: 0.98,
        duration: 50,
        ease: 'Power2',
        yoyo: true
      });
    });
    
    return buttonBg;
  }

  startButtonParticles(buttonBg, x, y, color) {
    const particleGroup = buttonBg.getData('particles');
    const particleTimer = buttonBg.getData('particleTimer');
    
    // Safety check - ensure scene is still active
    if (!this.scene.isActive()) return;
    
    // Clear any existing timer
    if (particleTimer) {
      clearInterval(particleTimer);
    }
    
    // Create particles every 100ms
    const timer = setInterval(() => {
      // Safety check - ensure scene is still active
      if (!this.scene.isActive()) {
        clearInterval(timer);
        return;
      }
      
      const particle = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-10, 10),
        2,
        color,
        0.6
      );
      
      // Safety check - ensure particle group exists
      if (particleGroup && particleGroup.add) {
        particleGroup.add(particle);
      }
      
      // Animate particle
      this.tweens.add({
        targets: particle,
        y: particle.y - 30,
        alpha: 0,
        scale: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          if (particle && particle.destroy) {
            particle.destroy();
          }
          if (particleGroup && particleGroup.remove) {
            particleGroup.remove(particle);
          }
        }
      });
    }, 100);
    
    buttonBg.setData('particleTimer', timer);
  }

  stopButtonParticles(buttonBg) {
    const particleTimer = buttonBg.getData('particleTimer');
    const particleGroup = buttonBg.getData('particles');
    
    // Clear timer
    if (particleTimer) {
      clearInterval(particleTimer);
      buttonBg.setData('particleTimer', null);
    }
    
    // Clear existing particles
    if (particleGroup && particleGroup.clear) {
      particleGroup.clear(true, true);
    }
  }

  createButtonExplosion(x, y, color) {
    // Safety check - ensure scene is still active
    if (!this.scene.isActive()) return;
    
    // Create explosion particles
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 3, color, 0.8);
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = 50;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (particle && particle.destroy) {
            particle.destroy();
          }
        }
      });
    }
  }

  createBackgroundParticles() {
    // Create floating particles in background
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        2,
        0x00ffff,
        0.3
      );
      
      // Animate particle floating
      this.tweens.add({
        targets: particle,
        y: particle.y - 200,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Linear',
        onComplete: () => {
          if (particle && particle.destroy) {
            particle.destroy();
          }
        }
      });
    }
  }

  createAmbientEffects() {
    // Create pulsing screen edge glow
    const edgeGlow = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width + 40,
      this.scale.height + 40,
      0x00ffff,
      0.1
    );
    edgeGlow.setBlendMode('ADD');
    
    // Pulsing animation
    this.tweens.add({
      targets: edgeGlow,
      alpha: 0.3,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  shutdown() {
    // Clean up all particle timers when scene is destroyed
    if (this.createRoomBtn) {
      this.stopButtonParticles(this.createRoomBtn);
    }
    if (this.joinRoomBtn) {
      this.stopButtonParticles(this.joinRoomBtn);
    }
    if (this.readyBtn) {
      this.stopButtonParticles(this.readyBtn);
    }
    
    // Clear all tweens
    this.tweens.killAll();
  }

  createFightingGameInput(x, y, width, height, placeholder, primaryColor, hoverColor) {
    // Create input background
    const inputBg = this.add.rectangle(x, y, width, height, primaryColor);
    inputBg.setStrokeStyle(4, 0x000000, 1);
    
    // Create inner highlight
    const highlight = this.add.rectangle(x, y - 1, width - 8, height / 2, 0xffffff, 0.2);
    
    // Create placeholder text
    this.roomCodeText = this.add.text(x, y, placeholder, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      fill: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Make interactive
    inputBg.setInteractive();
    
    // Add hover effects
    inputBg.on('pointerover', () => {
      inputBg.setFillStyle(hoverColor);
      this.tweens.add({
        targets: [inputBg, highlight],
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 100,
        ease: 'Power2'
      });
    });
    
    inputBg.on('pointerout', () => {
      inputBg.setFillStyle(primaryColor);
      this.tweens.add({
        targets: [inputBg, highlight],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2'
      });
    });
    
    return inputBg;
  }

  createRoom() {
    this.socket.emit('createRoom');
    this.updateStatus('Creating room...');
  }

  joinRoom() {
    if (this.roomCodeText.text === 'Enter Room Code') {
      this.updateStatus('Please enter a room code');
      return;
    }
    
    // Store the room ID when joining
    this.roomId = this.roomCodeText.text;
    this.isHost = false;
    
    console.log('Joining room with ID:', this.roomId);
    this.socket.emit('joinRoom', { roomId: this.roomId });
    this.updateStatus('Joining room...');
  }

  showRoomCodeInput() {
    const roomCode = prompt('Enter room code:');
    if (roomCode) {
      this.roomCodeText.setText(roomCode);
    }
  }

  showInviteCode() {
    const inviteText = `Room Code: ${this.roomId}`;
    this.add.text(this.scale.width / 2, 550, inviteText, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  updateStatus(message) {
    this.statusText.setText(message);
  }

  updatePlayerList() {
    const playerNames = this.players.map(p => p.name).join(', ');
    this.playerListText.setText(`Players: ${playerNames}`);
  }

  showCharacterSelection() {
    this.updateStatus('Choose your character!');
    
    // Clear UI
    this.children.removeAll(true);
    
    // Add original menu background image for character selection
    const bgImage = this.add.image(0, 0, 'bg-menu');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(this.scale.width, this.scale.height);
    bgImage.setDepth(0); // Background at depth 0
    
    // Title
    this.add.text(this.scale.width / 2, 100, 'CHOOSE YOUR FIGHTER', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Character options with fantasy names
    const characters = [
      { id: 'player1', name: 'THUNDERFIST', color: 0x4CAF50, description: 'The Lightning Warrior' },
      { id: 'player2', name: 'FROSTBLADE', color: 0x2196F3, description: 'The Ice Master' },
      { id: 'player3', name: 'SHADOWSTRIKE', color: 0xFF9800, description: 'The Dark Assassin' },
      { id: 'player4', name: 'FLAMESTORM', color: 0xFF5722, description: 'The Fire Mage' },
      { id: 'player5', name: 'NATUREBORN', color: 0x8BC34A, description: 'The Earth Guardian' },
      { id: 'player6', name: 'VOIDWALKER', color: 0x9C27B0, description: 'The Shadow Mystic' },
      { id: 'player7', name: 'AURION', color: 0xFFD700, description: 'The Golden Hero' },
      { id: 'player8', name: 'IRONHEART', color: 0xB0BEC5, description: 'The Armored Guardian' },
      { id: 'player9', name: 'FIST KING', color: 0xE65100, description: 'The Boxing Champion' },
      { id: 'player10', name: 'BLACKJACK', color: 0x212121, description: 'The Rogue with an Eye Patch' },
      { id: 'player11', name: 'INFERNUS', color: 0xD50000, description: 'The Devilish Warrior' },
      { id: 'player12', name: 'DON VERMILLION', color: 0x880E4F, description: 'The Mafia Leader' },
      { id: 'player13', name: 'MAXIMUS REX', color: 0xA1887F, description: 'The Gladiator King' },
      { id: 'player14', name: 'PINK SHADOW', color: 0xEC407A, description: 'The Nude Trickster' },
      { id: 'player15', name: 'SMOKE', color: 0xE91E63, description: 'The Dev' },
      { id: 'player16', name: 'JAMES', color: 0x00BCD4, description: 'The Goblin King' }
    ];

    // Tekken-style bottom-centered grid with 2 rows
    const totalChars = characters.length;
    const columns = Math.ceil(totalChars / 2);
    const rows = 2;
    const faceBoxSize = 100; // Increased from 80 to 100
    const faceSpacingX = 120; // Increased spacing to accommodate bigger boxes
    const faceSpacingY = 130; // Increased vertical spacing
    const gridWidth = (columns - 1) * faceSpacingX + faceBoxSize;
    const gridStartX = this.scale.width / 2 - gridWidth / 2;
    const gridStartY = this.scale.height - 2 * faceSpacingY - 40;
    const previewAreaX = this.scale.width / 2;
    const previewAreaY = this.scale.height / 2 - 40;

    // Store preview backgrounds for highlight
    this.facePreviewBoxes = [];
    // Store face sprites for easy update
    this.faceSprites = [];

    characters.forEach((character, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      let x = gridStartX + col * faceSpacingX;
      let y = gridStartY + row * faceSpacingY;
      // Center last row if not full
      if (row === 1 && totalChars % columns !== 0 && col >= totalChars % columns) {
        x += ((columns - totalChars % columns) * faceSpacingX) / 2;
      }
      // Face preview background
      const previewBg = this.add.rectangle(x, y, faceBoxSize, faceBoxSize, character.color, 0.7);
      previewBg.setStrokeStyle(2, character.color, 1);
      previewBg.setInteractive();
      previewBg.setDepth(2); // Selection block at depth 2
      previewBg.on('pointerdown', () => this.selectCharacter(character.id));
      this.facePreviewBoxes.push(previewBg);
      // Face sprite (frame 19 = third row frame 1 of walk.png)
      const playerKey = character.id;
      const faceSprite = this.add.sprite(x, y, playerKey + '_walk', 19);
      faceSprite.setScale(1.5); // Increased scale for bigger boxes
      faceSprite.setDepth(2); // Face sprite at depth 2
      this.faceSprites.push({ id: character.id, sprite: faceSprite });
      // Store references
      previewBg.characterId = character.id;
      previewBg.characterSprite = faceSprite;
    });

    // Full-body preview area (initially empty)
    this.fullBodyPreview = this.add.sprite(previewAreaX, previewAreaY, characters[0].id + '_walk', 18);
    this.fullBodyPreview.setScale(4);
    this.fullBodyPreview.setVisible(false);
    this.fullBodyImage = this.add.image(previewAreaX, previewAreaY, characters[0].id + '_preview');
    this.fullBodyImage.setVisible(false);
    this.fullBodyImage.setScale(0.6); // Increased scale to reduce graininess
    this.fullBodyImage.setDepth(1); // Preview image at depth 1
    // Set better texture filtering for smoother scaling
    this.fullBodyImage.setTexture('nearest');
    this.fullBodyName = this.add.text(previewAreaX, previewAreaY + 120, '', {
      fontSize: '32px', fontFamily: 'Arial, sans-serif', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);
    this.fullBodyName.setDepth(3); // Name at depth 3
    this.fullBodyDesc = this.add.text(previewAreaX, previewAreaY + 160, '', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: '#fff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);
    this.fullBodyDesc.setDepth(3); // Title at depth 3
    this.fullBodyName.setVisible(false);
    this.fullBodyDesc.setVisible(false);

    // Ready button with enhanced gaming style (initially disabled)
    this.readyBtn = this.createEnhancedGamingButton(this.scale.width / 2, this.scale.height - 40, 350, 70, 'SELECT CHARACTER FIRST', 0x666666, 0x555555, 0x444444);
    this.readyBtn.setInteractive(false); // Initially disabled
    this.readyBtn.on('pointerdown', () => this.playerReady());
    this.readyText = this.readyBtn.getData('text'); // Get reference to text object

    // Status text with fighting game style
    this.statusText = this.add.text(this.scale.width / 2, this.scale.height - 10, 'Waiting for character selection...', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: '#ffffff'
    }).setOrigin(0.5);

    // Update full-body preview on selection
    this.selectCharacter = (characterId) => {
      this.selectedCharacter = characterId;
      // Clear previous highlights and reset face sprites
      this.facePreviewBoxes.forEach(box => {
        box.setStrokeStyle(2, box.fillColor, 1);
      });
      this.faceSprites.forEach(face => {
        if (face.sprite && face.sprite.setFrame) face.sprite.setFrame(19); // Reset to walk frame 19
      });
      // Highlight selected and set face sprite to spellcast frame 20 (row 3 frame 6)
      const selectedBox = this.facePreviewBoxes.find(box => box.characterId === characterId);
      if (selectedBox) selectedBox.setStrokeStyle(5, 0xffff00, 1);
      const selectedFace = this.faceSprites.find(face => face.id === characterId);
      if (selectedFace && selectedFace.sprite && selectedFace.sprite.setFrame) selectedFace.sprite.setFrame(20); // spellcast frame 20
      // Show full-body preview image
      const char = characters.find(c => c.id === characterId);
      if (char) {
        this.fullBodyImage.setTexture(char.id + '_preview');
        this.fullBodyImage.setVisible(true);
        this.fullBodyPreview.setVisible(false);
        this.fullBodyName.setText(char.name);
        this.fullBodyName.setVisible(true);
        this.fullBodyDesc.setText(char.description);
        this.fullBodyDesc.setVisible(true);
      }
      // Enable ready button
      this.readyBtn.setFillStyle(0x4CAF50);
      this.readyText.setText('READY TO FIGHT!');
      this.readyText.setStyle({ fill: '#ffffff' });
    };

    // Preload preview images for all characters
    this.load.once('complete', () => {
      characters.forEach(char => {
        const previewKey = char.id + '_preview';
        if (!this.textures.exists(previewKey)) {
          const previewPath = `assets/characters/players/${char.id}/` + char.id + '_preview.png';
          if (this.textures.exists(previewPath)) {
            this.textures.addImage(previewKey, previewPath);
          } else {
            // Try to load if not already loaded
            this.load.image(previewKey, previewPath);
          }
        }
      });
    });
  }

  selectCharacter(characterId) {
    this.selectedCharacter = characterId;
    console.log('Selected character:', characterId);
    
    // Clear previous highlights and reset face sprites
    this.facePreviewBoxes.forEach(box => {
      box.setStrokeStyle(2, box.fillColor, 1);
    });
    this.faceSprites.forEach(face => {
      if (face.sprite && face.sprite.setFrame) face.sprite.setFrame(19); // Reset to walk frame 19
    });
    
    // Highlight selected character and set face sprite to spellcast frame 20
    const selectedBox = this.facePreviewBoxes.find(box => box.characterId === characterId);
    if (selectedBox) {
      selectedBox.setStrokeStyle(5, 0xffff00, 1);
    }
    const selectedFace = this.faceSprites.find(face => face.id === characterId);
    if (selectedFace && selectedFace.sprite && selectedFace.sprite.setFrame) {
      selectedFace.sprite.setFrame(20); // spellcast frame 20
    }
    
    // Show full-body preview
    const characters = [
      { id: 'player1', name: 'THUNDERFIST', color: 0x4CAF50, description: 'The Lightning Warrior' },
      { id: 'player2', name: 'FROSTBLADE', color: 0x2196F3, description: 'The Ice Master' },
      { id: 'player3', name: 'SHADOWSTRIKE', color: 0xFF9800, description: 'The Dark Assassin' },
      { id: 'player4', name: 'FLAMESTORM', color: 0xFF5722, description: 'The Fire Mage' },
      { id: 'player5', name: 'NATUREBORN', color: 0x8BC34A, description: 'The Earth Guardian' },
      { id: 'player6', name: 'VOIDWALKER', color: 0x9C27B0, description: 'The Shadow Mystic' },
      { id: 'player7', name: 'AURION', color: 0xFFD700, description: 'The Golden Hero' },
      { id: 'player8', name: 'IRONHEART', color: 0xB0BEC5, description: 'The Armored Guardian' },
      { id: 'player9', name: 'FIST KING', color: 0xE65100, description: 'The Boxing Champion' },
      { id: 'player10', name: 'BLACKJACK', color: 0x212121, description: 'The Rogue with an Eye Patch' },
      { id: 'player11', name: 'INFERNUS', color: 0xD50000, description: 'The Devilish Warrior' },
      { id: 'player12', name: 'DON VERMILLION', color: 0x880E4F, description: 'The Mafia Leader' },
      { id: 'player13', name: 'MAXIMUS REX', color: 0xA1887F, description: 'The Gladiator King' },
      { id: 'player14', name: 'PINK SHADOW', color: 0xEC407A, description: 'The Nude Trickster' },
      { id: 'player15', name: 'SMOKE', color: 0xE91E63, description: 'The Dev' },
      { id: 'player16', name: 'JAMES', color: 0x00BCD4, description: 'The Goblin King' }
    ];
    
    const character = characters.find(c => c.id === characterId);
    if (character) {
      this.fullBodyImage.setTexture(character.id + '_preview');
      this.fullBodyImage.setVisible(true);
      this.fullBodyPreview.setVisible(false);
      this.fullBodyName.setText(character.name);
      this.fullBodyName.setVisible(true);
      this.fullBodyDesc.setText(character.description);
      this.fullBodyDesc.setVisible(true);
    }
    
    // Enable ready button with fighting game style
    this.readyBtn.setFillStyle(0x4CAF50);
    this.readyBtn.setInteractive(true);
    const readyText = this.readyBtn.getData('text');
    if (readyText) {
      readyText.setText('READY TO FIGHT!');
      readyText.setStyle({ fill: '#ffffff' });
    }
    
    // Send character selection to server
    if (this.socket) {
      console.log('Sending character selection to server:', characterId);
      this.socket.emit('playerCharacterReady', { 
        characterId: characterId,
        roomId: this.roomId 
      });
    }
    
    // Don't show arena selection here - wait for server to trigger it
    // this.showArenaSelection();
  }

  showArenaSelection() {
    // Only show arena selection for host
    if (!this.isHost) {
      this.updateStatus('Waiting for host to select arena...');
      return;
    }
    
    this.updateStatus('Host: Choose the arena!');
    
    // Clear UI
    this.children.removeAll(true);
    
    // Add original menu background image for arena selection
    const bgImage = this.add.image(0, 0, 'bg-menu');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(this.scale.width, this.scale.height);
    bgImage.setDepth(0); // Background at depth 0
    
    // Title
    this.add.text(this.scale.width / 2, 100, 'HOST: SELECT ARENA', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(this.scale.width / 2, 160, 'You have the power to choose the battle arena', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Arena options (use unified list)
    const arenas = this.getAllArenas();

    // Grid layout for arenas (2 rows x 4 columns)
    const arenaBoxSize = 160;
    const arenaSpacingX = 220;
    const arenaSpacingY = 220;
    const columns = 4;
    const rows = Math.ceil(arenas.length / columns);
    const gridCenterX = this.scale.width / 2;
    const gridStartY = this.scale.height / 2 - 80;
    const gridStartX = gridCenterX - ((columns - 1) * arenaSpacingX) / 2;
    const previewAreaX = this.scale.width / 2;
    const previewAreaY = this.scale.height - 200; // Moved higher to make room for button

    // Store arena preview boxes for highlight
    this.arenaPreviewBoxes = [];

    arenas.forEach((arena, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = gridStartX + (col * arenaSpacingX);
      const y = gridStartY + (row * arenaSpacingY);
      
      // Arena preview background
      const previewBg = this.add.rectangle(x, y, arenaBoxSize, arenaBoxSize, 0x333333, 0.8);
      previewBg.setStrokeStyle(3, 0x666666, 1);
      previewBg.setInteractive();
      previewBg.setDepth(2);
      previewBg.on('pointerdown', () => this.selectArena(arena.id));
      this.arenaPreviewBoxes.push(previewBg);
      
      // Arena image
      const arenaImage = this.add.image(x, y, arena.key);
      arenaImage.setDisplaySize(arenaBoxSize - 20, arenaBoxSize - 20);
      arenaImage.setDepth(2);
      
      // Arena name
      const arenaName = this.add.text(x, y + arenaBoxSize/2 + 30, arena.name, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      arenaName.setDepth(2);
      
      // Store references
      previewBg.arenaId = arena.id;
      previewBg.arenaImage = arenaImage;
      previewBg.arenaName = arenaName;
    });

    // Full arena preview area
    this.fullArenaPreview = this.add.image(previewAreaX, previewAreaY, 'arena-classic');
    this.fullArenaPreview.setDisplaySize(400, 200);
    this.fullArenaPreview.setVisible(false);
    this.fullArenaPreview.setDepth(1);
    
    this.fullArenaName = this.add.text(previewAreaX, previewAreaY + 120, '', {
      fontSize: '24px', 
      fontFamily: 'Arial, sans-serif', 
      fill: '#fff', 
      fontStyle: 'bold', 
      stroke: '#000', 
      strokeThickness: 3
    }).setOrigin(0.5);
    this.fullArenaName.setVisible(false);
    this.fullArenaName.setDepth(5); // Higher depth to be above arena preview
    
    this.fullArenaDesc = this.add.text(previewAreaX, previewAreaY + 150, '', {
      fontSize: '18px', 
      fontFamily: 'Arial, sans-serif', 
      fill: '#ccc', 
      fontStyle: 'italic', 
      stroke: '#000', 
      strokeThickness: 2
    }).setOrigin(0.5);
    this.fullArenaDesc.setVisible(false);
    this.fullArenaDesc.setDepth(5); // Higher depth to be above arena preview

    // Start game button (host only)
    this.confirmArenaBtn = this.createEnhancedGamingButton(
      this.scale.width / 2, 
      this.scale.height - 80, 
      300, 
      60, 
      'START THE FIGHT!', 
      0x4CAF50, 
      0x45a049, 
      0x00ff00
    );
    this.confirmArenaBtn.on('pointerdown', () => this.startFight());
    
    // Show first arena preview by default
    this.selectArena('classic');
    
    // Store the initial selection
    this.selectedArena = 'classic';
  }

  selectArena(arenaId) {
    // Reset all arena preview boxes
    this.arenaPreviewBoxes.forEach(box => {
      box.setStrokeStyle(3, 0x666666, 1);
    });
    
    // Highlight selected arena
    const selectedBox = this.arenaPreviewBoxes.find(box => box.arenaId === arenaId);
    if (selectedBox) {
      selectedBox.setStrokeStyle(5, 0xff6b6b, 1);
    }
    
    // Update full arena preview using unified list
    const arenas = this.getAllArenas();
    
    const arena = arenas.find(a => a.id === arenaId);
    if (arena) {
      this.fullArenaPreview.setTexture(arena.key);
      this.fullArenaPreview.setVisible(true);
      this.fullArenaName.setText(arena.name);
      this.fullArenaName.setVisible(true);
      this.fullArenaDesc.setText(arena.description);
      this.fullArenaDesc.setVisible(true);
    }
    
    // Store selected arena
    this.selectedArena = arenaId;
    console.log('Arena selected and stored:', arenaId);
    
    // Send arena selection to server
    if (this.socket) {
      this.socket.emit('arenaSelected', { 
        arenaId: arenaId,
        roomId: this.roomId 
      });
    }
    
    // Enable start fight button
    this.confirmArenaBtn.setFillStyle(0x4CAF50);
    this.confirmArenaBtn.setInteractive(true);
    const startText = this.confirmArenaBtn.getData('text');
    if (startText) {
      startText.setText('START THE FIGHT!');
      startText.setStyle({ fill: '#ffffff' });
    }
  }

  startFight() {
    if (!this.selectedArena) {
      this.updateStatus('Please select an arena first!');
      return;
    }
    
    console.log('Host starting fight with arena:', this.selectedArena);
    this.updateStatus('Starting the fight...');
    
    // Send start fight signal to server
    if (this.socket) {
      this.socket.emit('startFight', {
        arenaId: this.selectedArena,
        roomId: this.roomId
      });
    }
    
    // Start countdown immediately
    this.startCountdown();
  }

  showHostArenaSelection() {
    this.updateStatus('Host: Choose the final arena!');
    
    // Clear UI
    this.children.removeAll(true);
    
    // Add original menu background image for arena selection
    const bgImage = this.add.image(0, 0, 'bg-menu');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(this.scale.width, this.scale.height);
    bgImage.setDepth(0); // Background at depth 0
    
    // Title
    this.add.text(this.scale.width / 2, 100, 'HOST: SELECT FINAL ARENA', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(this.scale.width / 2, 160, 'You have the final decision on the battle arena', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Arena options (use unified list)
    const arenas = this.getAllArenas();

    // Grid layout for arenas (2 rows x 4 columns)
    const arenaBoxSize = 180;
    const arenaSpacingX = 240;
    const arenaSpacingY = 240;
    const columns = 4;
    const rows = Math.ceil(arenas.length / columns);
    const gridCenterX = this.scale.width / 2;
    const gridStartY = this.scale.height / 2 - 50;
    const gridStartX = gridCenterX - ((columns - 1) * arenaSpacingX) / 2;
    const previewAreaX = this.scale.width / 2;
    const previewAreaY = this.scale.height - 200; // Moved higher to make room for button

    // Store arena preview boxes for highlight
    this.hostArenaPreviewBoxes = [];

    arenas.forEach((arena, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = gridStartX + (col * arenaSpacingX);
      const y = gridStartY + (row * arenaSpacingY);
      
      // Arena preview background
      const previewBg = this.add.rectangle(x, y, arenaBoxSize, arenaBoxSize, 0x333333, 0.8);
      previewBg.setStrokeStyle(3, 0x666666, 1);
      previewBg.setInteractive();
      previewBg.setDepth(2);
      previewBg.on('pointerdown', () => this.selectHostArena(arena.id));
      this.hostArenaPreviewBoxes.push(previewBg);
      
      // Arena image
      const arenaImage = this.add.image(x, y, arena.key);
      arenaImage.setDisplaySize(arenaBoxSize - 20, arenaBoxSize - 20);
      arenaImage.setDepth(2);
      
      // Arena name
      const arenaName = this.add.text(x, y + arenaBoxSize/2 + 30, arena.name, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      arenaName.setDepth(2);
      
      // Store references
      previewBg.arenaId = arena.id;
      previewBg.arenaImage = arenaImage;
      previewBg.arenaName = arenaName;
    });

    // Full arena preview area
    this.hostFullArenaPreview = this.add.image(previewAreaX, previewAreaY, 'arena-classic');
    this.hostFullArenaPreview.setDisplaySize(400, 200);
    this.hostFullArenaPreview.setVisible(false);
    this.hostFullArenaPreview.setDepth(1);
    
    this.hostFullArenaName = this.add.text(previewAreaX, previewAreaY + 120, '', {
      fontSize: '24px', 
      fontFamily: 'Arial, sans-serif', 
      fill: '#fff', 
      fontStyle: 'bold', 
      stroke: '#000', 
      strokeThickness: 3
    }).setOrigin(0.5);
    this.hostFullArenaName.setVisible(false);
    this.hostFullArenaName.setDepth(5); // Higher depth to be above arena preview
    
    this.hostFullArenaDesc = this.add.text(previewAreaX, previewAreaY + 150, '', {
      fontSize: '18px', 
      fontFamily: 'Arial, sans-serif', 
      fill: '#ccc', 
      fontStyle: 'italic', 
      stroke: '#000', 
      strokeThickness: 2
    }).setOrigin(0.5);
    this.hostFullArenaDesc.setVisible(false);
    this.hostFullArenaDesc.setDepth(5); // Higher depth to be above arena preview

    // Start fight button (initially disabled)
    this.hostStartFightBtn = this.createEnhancedGamingButton(
      this.scale.width / 2, 
      this.scale.height - 80, 
      300, 
      60, 
      'SELECT ARENA FIRST', 
      0x666666, 
      0x666666, 
      0x333333
    );
    this.hostStartFightBtn.setInteractive(false);
    this.hostStartFightBtn.on('pointerdown', () => this.startFight());
    
    // Show first arena preview by default
    this.selectHostArena('classic');
    
    // Store the initial selection
    this.selectedArena = 'classic';
  }

  selectHostArena(arenaId) {
    console.log('Host selecting arena:', arenaId);
    
    // Reset all arena preview boxes
    this.hostArenaPreviewBoxes.forEach(box => {
      box.setStrokeStyle(3, 0x666666, 1);
    });
    
    // Highlight selected arena
    const selectedBox = this.hostArenaPreviewBoxes.find(box => box.arenaId === arenaId);
    if (selectedBox) {
      selectedBox.setStrokeStyle(5, 0xff6b6b, 1);
    }
    
    // Update full arena preview using unified list
    const arenas = this.getAllArenas();
    
    const arena = arenas.find(a => a.id === arenaId);
    if (arena) {
      this.hostFullArenaPreview.setTexture(arena.key);
      this.hostFullArenaPreview.setVisible(true);
      this.hostFullArenaName.setText(arena.name);
      this.hostFullArenaName.setVisible(true);
      this.hostFullArenaDesc.setText(arena.description);
      this.hostFullArenaDesc.setVisible(true);
    }
    
    // Store selected arena
    this.selectedArena = arenaId;
    console.log('Host arena stored:', this.selectedArena);
    
    // Send arena selection to server
    if (this.socket) {
      this.socket.emit('hostArenaSelected', {
        arenaId: arenaId,
        roomId: this.roomId
      });
    }
    
    // Enable start fight button
    this.hostStartFightBtn.setFillStyle(0x4CAF50);
    this.hostStartFightBtn.setInteractive(true);
    const startText = this.hostStartFightBtn.getData('text');
    if (startText) {
      startText.setText('START THE FIGHT!');
      startText.setStyle({ fill: '#ffffff' });
    }
  }

  startFight() {
    if (!this.selectedArena) {
      this.updateStatus('Please select an arena first!');
      return;
    }
    
    console.log('Host starting fight with arena:', this.selectedArena);
    this.updateStatus('Starting the fight...');
    
    // Send start fight signal to server
    if (this.socket) {
      this.socket.emit('startFight', {
        arenaId: this.selectedArena,
        roomId: this.roomId
      });
    }
    
    // Start countdown immediately
    this.startCountdown();
  }

  playerReady() {
    if (!this.selectedCharacter) {
      this.updateStatus('Please select a character first!');
      return;
    }
    
    this.readyPlayers.add(this.socket.id);
    this.updateStatus('You are ready! Waiting for other player...');
    this.readyBtn.setFillStyle(0x666666);
    this.readyBtn.setInteractive(false);
    const readyText = this.readyBtn.getData('text');
    if (readyText) {
      readyText.setText('WAITING...');
      readyText.setStyle({ fill: '#ffffff' });
    }
    
    // Send ready signal to server
    this.socket.emit('playerCharacterReady', {
      characterId: this.selectedCharacter,
      roomId: this.roomId
    });
  }

  startCountdown() {
    this.updateStatus('Game starting in...');
    
    // Clear UI
    this.children.removeAll(true);
    
    // Add original menu background image for countdown
    const bgImage = this.add.image(0, 0, 'bg-menu');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(this.scale.width, this.scale.height);
    bgImage.setDepth(0); // Background at depth 0
    
    // Countdown with fighting game style
    const countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, '3', {
      fontSize: '140px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 10,
      fontStyle: 'bold',
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5);

    this.time.delayedCall(1000, () => {
      countdownText.setText('2');
    });

    this.time.delayedCall(2000, () => {
      countdownText.setText('1');
    });

    this.time.delayedCall(3000, () => {
      countdownText.setText('FIGHT!');
      countdownText.setStyle({ fill: '#ff0000' });
    });

    this.time.delayedCall(4000, () => {
      this.socket.emit('readyToStart', {
        arenaId: this.selectedArena,
        roomId: this.roomId
      });
    });
  }

  backToMenu() {
    // Disconnect from socket if connected
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
    
    // Go back to main menu (training/multiplayer selection)
    this.scene.start('MainMenuScene');
  }
} 