export default class TrainingArenaSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TrainingArenaSelectionScene' });
    this.selectedCharacter = null;
    this.isTraining = false;
    this.selectedArena = null;
  }

  preload() {
    // Load arena assets
    this.load.image('arena-classic', 'assets/arenas/arena_classic.png');
    this.load.image('arena-volcano', 'assets/arenas/volcano_scene.webp');
    this.load.image('arena-hell', 'assets/arenas/hell_portal.webp');
    this.load.image('arena-forest', 'assets/arenas/forest_mushrooms.webp');
    this.load.image('arena-ape_station', 'assets/arenas/ape_station.jpg');
    this.load.image('arena-gm_jungle', 'assets/arenas/gm_jungle.webp');
    this.load.image('arena-samurai_desert', 'assets/arenas/samurai_desert.webp');
    this.load.image('arena-gobs_mine', 'assets/arenas/gobs_mine.jpg');
    
    // Load the menu background image (same as multiplayer)
    this.load.image('bg-menu', 'assets/bg-menu.png');
    
    // Load character sprites for preview
    this.loadCharacterAssets();
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
    this.isTraining = data?.isTraining || false;
    this.survivalMode = data?.survivalMode || false;
  }

  create() {
    const { width, height } = this.scale;
    
    // Always show character selection first if not set
    if (!this.selectedCharacter) {
      this.showCharacterSelection();
      return;
    }
    
    // Clear UI
    this.children.removeAll(true);
    
    // Add original menu background image for arena selection (same as multiplayer)
    const bgImage = this.add.image(0, 0, 'bg-menu');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(width, height);
    bgImage.setDepth(0); // Background at depth 0
    
    // Title
    this.add.text(width / 2, 60, 'TRAINING: SELECT ARENA', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 110, 'Choose your training arena', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Arena options
    const arenas = [
      { id: 'classic', name: 'CLASSIC ARENA', key: 'arena-classic', description: 'The Traditional Battlefield' },
      { id: 'volcano', name: 'VOLCANO SCENE', key: 'arena-volcano', description: 'The Fiery Inferno' },
      { id: 'hell', name: 'HELL PORTAL', key: 'arena-hell', description: 'The Dark Abyss' },
      { id: 'forest', name: 'FOREST MUSHROOMS', key: 'arena-forest', description: 'The Mystical Grove' },
      { id: 'ape_station', name: 'APE STATION', key: 'arena-ape_station', description: 'The Futuristic Space Station' },
      { id: 'gm_jungle', name: 'GM JUNGLE', key: 'arena-gm_jungle', description: 'The Wild Jungle' },
      { id: 'samurai_desert', name: 'SAMURAI DESERT', key: 'arena-samurai_desert', description: 'The Desert Wasteland' },
      { id: 'gobs_mine', name: 'GOBS MINE', key: 'arena-gobs_mine', description: 'The Goblin Mines' }
    ];

    // Grid layout for arenas (2 rows of 4 each), pushed upwards
    const arenaBoxSize = 160;
    const arenaSpacingX = 200;
    const arenaSpacingY = 200;
    const gridStartX = width / 2 - (arenaSpacingX * 1.5);
    const gridStartY = height / 2 - 180;

    // Store arena preview boxes for highlight
    this.arenaPreviewBoxes = [];

    arenas.forEach((arena, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
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

    // Start training button (initially disabled)
    this.startTrainingBtn = this.createEnhancedGamingButton(
      width / 2 - 160, 
      height - 80, 
      300, 
      60, 
      'SELECT ARENA FIRST', 
      0x666666, 
      0x666666, 
      0x444444
    );
    this.startTrainingBtn.setInteractive(false);
    this.startTrainingBtn.on('pointerdown', () => this.startTraining());
    this.startTrainingBtn.setDepth(10);

    // Back to menu button
    this.backBtn = this.createEnhancedGamingButton(
      width / 2 + 160, 
      height - 80, 
      300, 
      60, 
      'BACK TO MENU', 
      0xFF9800, 
      0xF57C00, 
      0xffa500
    );
    this.backBtn.on('pointerdown', () => this.backToMenu());
    this.backBtn.setDepth(10);
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
    
    // Clear any existing timer
    if (particleTimer) {
      clearInterval(particleTimer);
    }
    
    // Create particles at regular intervals
    const timer = setInterval(() => {
      if (!this.scene.isActive()) return;
      
      // Create 2-3 particles per emission
      for (let i = 0; i < Phaser.Math.Between(2, 3); i++) {
        const particle = this.add.circle(
          x + Phaser.Math.Between(-30, 30),
          y + Phaser.Math.Between(-15, 15),
          2,
          color,
          0.8
        );
        
        particleGroup.add(particle);
        
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
      }
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
    // Store selected arena
    this.selectedArena = arenaId;
    // Enable start training button
    this.startTrainingBtn.setFillStyle(0x4CAF50);
    this.startTrainingBtn.setInteractive(true);
    const startText = this.startTrainingBtn.getData('text');
    if (startText) {
      startText.setText('START TRAINING!');
      startText.setStyle({ fill: '#ffffff' });
    }
  }

  startTraining() {
    if (!this.selectedArena) {
      console.log('No arena selected');
      return;
    }
    
    console.log('Starting training with arena:', this.selectedArena);
    
    // Start training game
    this.scene.start('GameScene', { 
      selectedCharacter: this.selectedCharacter,
      arenaId: this.selectedArena,
      isMultiplayer: false,
      isTraining: true,
      socket: null,
      roomId: null,
      isHost: false
    });
  }

  showCharacterSelection() {
    // Clear UI
    this.children.removeAll(true);
    
    // Add original menu background image for character selection
    const bgImage = this.add.image(0, 0, 'bg-menu');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(this.scale.width, this.scale.height);
    bgImage.setDepth(0); // Background at depth 0
    
    // Title
    this.add.text(this.scale.width / 2, 100, this.survivalMode ? 'SURVIVAL: CHOOSE FIGHTER' : 'CHOOSE YOUR FIGHTER', {
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
    this.readyBtn.on('pointerdown', () => this.characterSelected());
    this.readyText = this.readyBtn.getData('text'); // Get reference to text object

    // Status text with fighting game style
    this.statusText = this.add.text(this.scale.width / 2, this.scale.height - 10, 'Waiting for character selection...', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: '#ffffff'
    }).setOrigin(0.5);

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
      readyText.setText(this.survivalMode ? 'START SURVIVAL' : 'CONTINUE TO ARENA SELECTION');
      readyText.setStyle({ fill: '#ffffff' });
    }
  }

  characterSelected() {
    if (!this.selectedCharacter) {
      console.log('No character selected');
      return;
    }

    if (this.survivalMode) {
      this.scene.start('SurvivalScene', { selectedCharacter: this.selectedCharacter });
      return;
    }

    console.log('Character selected, showing arena selection');
    this.create(); // Go back to arena selection
  }

  backToMenu() {
    // Go back to main menu (training/multiplayer selection)
    this.scene.start('MainMenuScene');
  }

  shutdown() {
    // Clean up all particle timers when scene is destroyed
    if (this.startTrainingBtn) {
      this.stopButtonParticles(this.startTrainingBtn);
    }
    
    if (this.backBtn) {
      this.stopButtonParticles(this.backBtn);
    }
    
    // Clear all tweens
    this.tweens.killAll();
  }
} 