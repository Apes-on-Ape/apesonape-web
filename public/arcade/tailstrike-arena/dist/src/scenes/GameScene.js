export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.otherPlayer = null;

    this.selectedCharacter = null;
    this.cursors = null;
    this.pKey = null;
    this.oKey = null;
    this.playerHealth = 100;
    this.currentDirection = 'down';
    this.isVulnerable = true; // Can take damage
    this.vulnerabilityCooldown = 0; // Time until vulnerable again
    this.isDefeated = false; // Track if player is defeated
    this.isSpellcasting = false; // Track if player is casting spell
    this.gameEnded = false; // Track if game has ended
    
    // New spell system
    this.spellCooldown = false;
    this.megaSpellUses = 3; // Each player gets 3 mega spell uses
    this.spellAura = null;
    this.currentSpellCooldown = 0;
    this.currentMegaSpellCooldown = 0;
    
    // Enhanced spell system

    
    // Other player stats
    this.otherPlayerHealth = 100;
    this.otherPlayerHealthBar = null;
    this.otherPlayerSpells = [];
    this.activeSpells = [];
    this.otherPlayerCurrentSpell = null;
    this.otherPlayerInvincible = false;
    this.otherPlayerInvincibilityTimer = null;
    this.otherPlayerAura = null;
    
    // Multiplayer
    this.socket = null;
    this.roomId = null;
    this.isHost = false;
    this.playerId = null;
    this.gameStarted = false;
    
    // Player stats and multipliers
    this.speedMultiplier = 1.0;
    this.damageMultiplier = 1.0;
    this.defenseMultiplier = 1.0;
    this.armorReduction = 0; // Ensure defined to avoid NaN on first damage
    
    // Audio
    this.backgroundMusic = null;
    this.audioUnlocked = false;
    this.musicLoadAttempted = false;
    
    // Pause menu
    this.isPaused = false;
    this.pauseMenu = null;
  }

  // --- New effect implementations for players 8-16 ---
  createDaggerEffect() {
    const size = 14;
    const distance = 450;
    const blade = this.add.rectangle(this.player.x, this.player.y, size * 2, size / 2, 0xb71c1c, 1);
    blade.setStrokeStyle(2, 0xffffff, 0.9);
    let targetX = this.player.x;
    let targetY = this.player.y;
    switch (this.currentDirection) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    this.tweens.add({
      targets: blade,
      x: targetX,
      y: targetY,
      duration: 600,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(blade.x, blade.y, size, 18);
        if (hit) blade.destroy();
      },
      onComplete: () => blade.destroy()
    });
  }

  createDaggerEffectFromPosition(x, y, direction) {
    const size = 14;
    const distance = 450;
    const blade = this.add.rectangle(x, y, size * 2, size / 2, 0xb71c1c, 1);
    blade.setStrokeStyle(2, 0xffffff, 0.9);
    // Add a faint red trail to enhance motion
    const trailTimer = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        const t = this.add.rectangle(blade.x, blade.y, size, size / 4, 0xff5252, 0.5);
        t.setDepth(0);
        this.time.delayedCall(150, () => t.destroy());
      }
    });
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    this.tweens.add({
      targets: blade,
      x: targetX,
      y: targetY,
      duration: 600,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(blade.x, blade.y, size, 18);
        if (hit) {
          blade.destroy();
          trailTimer.remove(false);
        }
      },
      onComplete: () => { blade.destroy(); trailTimer.remove(false); }
    });
  }

  createMissileEffect() {
    const radius = 12;
    const distance = 500;
    const missile = this.add.circle(this.player.x, this.player.y, radius, 0x90caf9, 0.95);
    missile.setStrokeStyle(3, 0xffffff, 1);
    let targetX = this.player.x, targetY = this.player.y;
    switch (this.currentDirection) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    this.tweens.add({
      targets: missile,
      x: targetX,
      y: targetY,
      duration: 700,
      ease: 'Power2',
      onUpdate: () => {
        const trail = this.add.circle(missile.x, missile.y, 3, 0x64b5f6, 0.7);
        this.time.delayedCall(150, () => trail.destroy());
        const hit = this.checkSpellCollision(missile.x, missile.y, radius, 16);
        if (hit) missile.destroy();
      },
      onComplete: () => missile.destroy()
    });
  }

  createMissileEffectFromPosition(x, y, direction) {
    const radius = 12;
    const distance = 500;
    const missile = this.add.circle(x, y, radius, 0x90caf9, 0.95);
    missile.setStrokeStyle(3, 0xffffff, 1);
    // Add engine flicker
    const engineTimer = this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        const flame = this.add.circle(missile.x, missile.y, 4, 0xffcc80, 0.8);
        this.tweens.add({ targets: flame, alpha: 0, scale: 0.4, duration: 120, onComplete: () => flame.destroy() });
      }
    });
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    this.tweens.add({
      targets: missile,
      x: targetX,
      y: targetY,
      duration: 700,
      ease: 'Power2',
      onUpdate: () => {
        const trail = this.add.circle(missile.x, missile.y, 3, 0x64b5f6, 0.7);
        this.time.delayedCall(150, () => trail.destroy());
        const hit = this.checkSpellCollision(missile.x, missile.y, radius, 16);
        if (hit) { missile.destroy(); engineTimer.remove(false); }
      },
      onComplete: () => { missile.destroy(); engineTimer.remove(false); }
    });
  }

  createMagmaEffect() {
    const radius = 16;
    const distance = 420;
    const magma = this.add.circle(this.player.x, this.player.y, radius, 0xff6d00, 0.95);
    magma.setStrokeStyle(3, 0xff3d00, 1);
    let targetX = this.player.x, targetY = this.player.y;
    switch (this.currentDirection) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    this.tweens.add({
      targets: magma,
      x: targetX,
      y: targetY,
      duration: 650,
      ease: 'Power2',
      onUpdate: () => {
        const spark = this.add.circle(magma.x + (Math.random() - 0.5) * 16, magma.y + (Math.random() - 0.5) * 16, 3, 0xff9100, 0.8);
        this.time.delayedCall(120, () => spark.destroy());
        const hit = this.checkSpellCollision(magma.x, magma.y, radius, 20);
        if (hit) magma.destroy();
      },
      onComplete: () => magma.destroy()
    });
  }

  createMagmaEffectFromPosition(x, y, direction) {
    const radius = 16;
    const distance = 420;
    const magma = this.add.circle(x, y, radius, 0xff6d00, 0.95);
    magma.setStrokeStyle(3, 0xff3d00, 1);
    // Magma glow
    const glow = this.add.circle(x, y, radius * 1.6, 0xff6d00, 0.25);
    glow.setDepth(0);
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    this.tweens.add({
      targets: magma,
      x: targetX,
      y: targetY,
      duration: 650,
      ease: 'Power2',
      onUpdate: () => {
        const spark = this.add.circle(magma.x + (Math.random() - 0.5) * 16, magma.y + (Math.random() - 0.5) * 16, 3, 0xff9100, 0.8);
        this.time.delayedCall(120, () => spark.destroy());
        const hit = this.checkSpellCollision(magma.x, magma.y, radius, 20);
        if (hit) { magma.destroy(); glow.destroy(); }
      },
      onComplete: () => { magma.destroy(); glow.destroy(); }
    });
  }
  init(data) {
    console.log('GameScene init with data:', data);
    this.socket = data.socket || null;
    this.roomId = data.roomId || null;
    this.isHost = data.isHost || false;
    this.isMultiplayer = data.isMultiplayer || false;
    this.isTraining = data.isTraining || false;
    this.selectedCharacter = data.selectedCharacter || 'player1';
    this.selectedArena = data.arenaId || 'classic';
    this.playerId = this.socket ? this.socket.id : 'single-player';
    this.otherPlayerCharacter = null;
    this.otherPlayerSpells = [];
    this.activeSpells = [];
    
    console.log(`[INIT] GameScene initialized - playerId: ${this.playerId}, isTraining: ${this.isTraining}`);
    this.otherPlayerCurrentSpell = null;
    this.otherPlayerAura = null;
    
    // Initialize character spells
    this.initializeCharacterSpells();
    

    
    console.log('Selected character:', this.selectedCharacter);
    console.log('Selected arena:', this.selectedArena);
    console.log('Is multiplayer:', this.isMultiplayer);
    console.log('Is training:', this.isTraining);
    console.log('Socket ID:', this.playerId);
    console.log('Socket object:', this.socket);
    console.log('Socket connected:', this.socket ? this.socket.connected : 'no socket');
    console.log('Room ID:', this.roomId);
    console.log('Is Host:', this.isHost);
    
    if (this.isMultiplayer && this.socket) {
      console.log('Setting up multiplayer events...');
      this.setupMultiplayerEvents();
    } else {
      console.log('Not setting up multiplayer events - socket or multiplayer flag missing');
    }
  }

  preload() {
    // Load arena assets
    this.load.image('arena-classic', 'assets/arenas/arena_classic.png');
    this.load.image('arena-volcano', 'assets/arenas/volcano_scene.webp');
    this.load.image('arena-hell', 'assets/arenas/hell_portal.webp');
    this.load.image('arena-forest', 'assets/arenas/forest_mushrooms.webp');
    this.load.image('arena-ape_station', 'assets/arenas/ape_station.jpg');
    // Newly added arenas
    this.load.image('arena-gm_jungle', 'assets/arenas/gm_jungle.webp');
    this.load.image('arena-samurai_desert', 'assets/arenas/samurai_desert.webp');
    this.load.image('arena-gobs_mine', 'assets/arenas/gobs_mine.jpg');
    
    // Load particle texture for enhanced spell effects
    // Note: particle.svg is missing, skipping to prevent 404 errors
    // this.load.image('particle', 'assets/particles/particle.svg');
    
    // Load background music
    this.load.audio('fight-music', 'assets/music/fight.mp3');
    
    // Add error handling for music loading
    this.load.on('filecomplete-audio-fight-music', () => {
      console.log('Fight music loaded successfully in preload');
      this.musicLoadAttempted = false; // Reset flag since it loaded successfully
    });
    
    this.load.on('loaderror', (file) => {
      if (file.key === 'fight-music') {
        console.error('Failed to load fight music in preload:', file.src);
      }
    });
    
    // Load character sprites based on selection
    this.loadCharacterAssets();
    }

  loadCharacterAssets() {
    // Load assets for all characters to support multiplayer
    const characters = [
      'player1', 'player2', 'player3', 'player4', 'player5', 'player6',
      'player7', 'player8', 'player9', 'player10', 'player11', 'player12', 'player13', 'player14',
      'player15', 'player16'
    ];
    
    characters.forEach(character => {
      const characterPath = `assets/characters/players/${character}`;
      
      // Load all character sprites for each character
      this.load.spritesheet(`${character}_walk`, `${characterPath}/walk.png`, { 
        frameWidth: 64, 
        frameHeight: 64 
      });
      
      this.load.spritesheet(`${character}_slash`, `${characterPath}/slash.png`, { 
        frameWidth: 64, 
        frameHeight: 64 
      });
      
      // Load spellcast sprite sheet
      this.load.spritesheet(`${character}_spellcast`, `${characterPath}/spellcast.png`, { 
        frameWidth: 64, 
        frameHeight: 64 
      });
      
      // Load hurt sprite sheet
      this.load.spritesheet(`${character}_hurt`, `${characterPath}/hurt.png`, { 
        frameWidth: 64, 
        frameHeight: 64 
      });
    });
  }

  initializeCharacterSpells() {
    // Mathematically balanced character system
    // Movement speeds linearly spaced from 50 to 120
    const baseMovementSpeeds = [120, 115, 110, 105, 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 52, 50];
    
    // Helper function to calculate balanced stats
    const calculateStats = (speed) => {
      // Normalize speed to 0-1 range (50-120 -> 0-1)
      const normalizedSpeed = (speed - 50) / (120 - 50);
      
      // Inverse relationship: faster = less damage/longer cooldown
      // Spell damage: 5-20 HP (inversely proportional to speed)
      const spellDamage = Math.round(20 - (normalizedSpeed * 15));
      
      // Mega damage: 30-60 HP (inversely proportional to speed)
      const megaDamage = Math.round(60 - (normalizedSpeed * 30));
      
      // Spell cooldown: 0.5-2.0 seconds (500-2000ms, inversely proportional to speed)
      const spellCooldown = Math.round(2000 - (normalizedSpeed * 1500));
      
      // Mega cooldown: 5-15 seconds (5000-15000ms, inversely proportional to speed)
      const megaCooldown = Math.round(15000 - (normalizedSpeed * 10000));
      
      // Convert movement speed to multiplier (base 80 = 1.0x)
      const speedMultiplier = speed / 80;
      
      return {
        speedMultiplier: Math.round(speedMultiplier * 100) / 100,
        spellDamage,
        megaDamage,
        spellCooldown,
        megaCooldown
      };
    };

    // Character spell definitions with mathematically balanced stats
    this.characterSpells = {
      player1: { // THUNDERFIST - The Lightning Warrior (Fastest)
        name: 'THUNDERFIST',
        ...calculateStats(baseMovementSpeeds[0]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.9,
        spell: {
          name: 'Lightning Strike',
          damage: calculateStats(baseMovementSpeeds[0]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[0]).spellCooldown,
          speed: 1.4,
          effect: 'lightning',
          description: 'Quick lightning bolt'
        },
        megaSpell: {
          name: 'Thunderstorm',
          damage: calculateStats(baseMovementSpeeds[0]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[0]).megaCooldown,
          speed: 1.2,
          effect: 'thunderstorm',
          description: 'Massive lightning storm'
        }
      },
      player2: { // FROSTBLADE - The Ice Master
        name: 'FROSTBLADE',
        ...calculateStats(baseMovementSpeeds[1]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.0,
        spell: {
          name: 'Ice Shard',
          damage: calculateStats(baseMovementSpeeds[1]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[1]).spellCooldown,
          speed: 1.3,
          effect: 'ice',
          description: 'Fast ice projectile'
        },
        megaSpell: {
          name: 'Blizzard',
          damage: calculateStats(baseMovementSpeeds[1]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[1]).megaCooldown,
          speed: 1.1,
          effect: 'blizzard',
          description: 'Freezing blizzard'
        }
      },
      player3: { // SHADOWSTRIKE - The Dark Assassin
        name: 'SHADOWSTRIKE',
        ...calculateStats(baseMovementSpeeds[2]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.8,
        spell: {
          name: 'Shadow Bolt',
          damage: calculateStats(baseMovementSpeeds[2]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[2]).spellCooldown,
          speed: 1.2,
          effect: 'shadow',
          description: 'Dark energy blast'
        },
        megaSpell: {
          name: 'Shadow Realm',
          damage: calculateStats(baseMovementSpeeds[2]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[2]).megaCooldown,
          speed: 1.0,
          effect: 'shadowrealm',
          description: 'Dark dimension attack'
        }
      },
      player4: { // FLAMESTORM - The Fire Mage
        name: 'FLAMESTORM',
        ...calculateStats(baseMovementSpeeds[3]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.9,
        spell: {
          name: 'Fireball',
          damage: calculateStats(baseMovementSpeeds[3]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[3]).spellCooldown,
          speed: 1.1,
          effect: 'fire',
          description: 'Burning fireball'
        },
        megaSpell: {
          name: 'Inferno',
          damage: calculateStats(baseMovementSpeeds[3]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[3]).megaCooldown,
          speed: 1.0,
          effect: 'inferno',
          description: 'Massive firestorm'
        }
      },
      player5: { // NATUREBORN - The Earth Guardian
        name: 'NATUREBORN',
        ...calculateStats(baseMovementSpeeds[4]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.2,
        spell: {
          name: 'Nature Spike',
          damage: calculateStats(baseMovementSpeeds[4]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[4]).spellCooldown,
          speed: 1.1,
          effect: 'nature',
          description: 'Sharp nature spike'
        },
        megaSpell: {
          name: 'Forest Rage',
          damage: calculateStats(baseMovementSpeeds[4]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[4]).megaCooldown,
          speed: 1.0,
          effect: 'forestrage',
          description: 'Nature\'s fury unleashed'
        }
      },
      player6: { // VOIDWALKER - The Shadow Mystic
        name: 'VOIDWALKER',
        ...calculateStats(baseMovementSpeeds[5]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.7,
        spell: {
          name: 'Void Blast',
          damage: calculateStats(baseMovementSpeeds[5]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[5]).spellCooldown,
          speed: 1.0,
          effect: 'void',
          description: 'Void energy projectile'
        },
        megaSpell: {
          name: 'Void Rift',
          damage: calculateStats(baseMovementSpeeds[5]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[5]).megaCooldown,
          speed: 0.9,
          effect: 'voidrift',
          description: 'Reality-warping attack'
        }
      },
      player7: { // AURION - The Golden Hero
        name: 'AURION',
        ...calculateStats(baseMovementSpeeds[6]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.1,
        spell: {
          name: 'Golden Ray',
          damage: calculateStats(baseMovementSpeeds[6]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[6]).spellCooldown,
          speed: 1.0,
          effect: 'golden',
          description: 'Radiant golden beam'
        },
        megaSpell: {
          name: 'Divine Judgment',
          damage: calculateStats(baseMovementSpeeds[6]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[6]).megaCooldown,
          speed: 0.9,
          effect: 'divine',
          description: 'Heavenly judgment'
        }
      },
      player8: { // IRONHEART - The Armored Guardian
        name: 'IRONHEART',
        ...calculateStats(baseMovementSpeeds[7]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.4,
        spell: {
          name: 'Iron Shot',
          damage: calculateStats(baseMovementSpeeds[7]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[7]).spellCooldown,
          speed: 0.9,
          effect: 'iron',
          description: 'Launches a heavy iron shot'
        },
        megaSpell: {
          name: 'Iron Storm',
          damage: calculateStats(baseMovementSpeeds[7]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[7]).megaCooldown,
          speed: 0.8,
          effect: 'ironstorm',
          description: 'Metal storm barrage'
        }
      },
      player9: { // FIST KING - The Boxing Champion
        name: 'FIST KING',
        ...calculateStats(baseMovementSpeeds[8]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.0,
        spell: {
          name: 'Two Fists',
          damage: calculateStats(baseMovementSpeeds[8]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[8]).spellCooldown,
          speed: 0.9,
          effect: 'fist',
          description: 'Throws two fists'
        },
        megaSpell: {
          name: 'King\'s Fury',
          damage: calculateStats(baseMovementSpeeds[8]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[8]).megaCooldown,
          speed: 0.8,
          effect: 'kingsfury',
          description: 'Champion\'s ultimate'
        }
      },
      player10: { // BLACKJACK - The Rogue with an Eye Patch
        name: 'BLACKJACK',
        ...calculateStats(baseMovementSpeeds[9]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.8,
        spell: {
          name: 'Quick Daggers',
          damage: calculateStats(baseMovementSpeeds[9]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[9]).spellCooldown,
          speed: 1.1,
          effect: 'dagger',
          description: 'Throws daggers quickly'
        },
        megaSpell: {
          name: 'Rogue\'s Gambit',
          damage: calculateStats(baseMovementSpeeds[9]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[9]).megaCooldown,
          speed: 1.0,
          effect: 'roguesgambit',
          description: 'Deadly rogue technique'
        }
      },
      player11: { // INFERNUS - The Devilish Warrior
        name: 'INFERNUS',
        ...calculateStats(baseMovementSpeeds[10]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.9,
        spell: {
          name: 'Giant Magma Balls',
          damage: calculateStats(baseMovementSpeeds[10]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[10]).spellCooldown,
          speed: 0.8,
          effect: 'magma',
          description: 'Giant magma balls'
        },
        megaSpell: {
          name: 'Devil\'s Wrath',
          damage: calculateStats(baseMovementSpeeds[10]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[10]).megaCooldown,
          speed: 0.7,
          effect: 'devilswrath',
          description: 'Satanic fury unleashed'
        }
      },
      player12: { // DON VERMILLION - The Mafia Leader
        name: 'DON VERMILLION',
        ...calculateStats(baseMovementSpeeds[11]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.1,
        spell: {
          name: 'Tiny Missiles',
          damage: calculateStats(baseMovementSpeeds[11]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[11]).spellCooldown,
          speed: 0.8,
          effect: 'missile',
          description: 'Shoots tiny missiles repeatedly'
        },
        megaSpell: {
          name: 'Mafia\'s Revenge',
          damage: calculateStats(baseMovementSpeeds[11]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[11]).megaCooldown,
          speed: 0.7,
          effect: 'mafiasrevenge',
          description: 'Mafia boss\'s wrath'
        }
      },
      player13: { // MAXIMUS REX - The Gladiator King
        name: 'MAXIMUS REX',
        ...calculateStats(baseMovementSpeeds[12]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.2,
        spell: {
          name: 'Giant Spear Power',
          damage: calculateStats(baseMovementSpeeds[12]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[12]).spellCooldown,
          speed: 0.8,
          effect: 'spear',
          description: 'Giant spear power'
        },
        megaSpell: {
          name: 'Colosseum\'s Fury',
          damage: calculateStats(baseMovementSpeeds[12]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[12]).megaCooldown,
          speed: 0.7,
          effect: 'colosseum',
          description: 'Gladiator\'s ultimate'
        }
      },
      player14: { // PINK SHADOW - The Nude Trickster
        name: 'PINK SHADOW',
        ...calculateStats(baseMovementSpeeds[13]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.7,
        spell: {
          name: 'Pink Circles',
          damage: calculateStats(baseMovementSpeeds[13]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[13]).spellCooldown,
          speed: 1.2,
          effect: 'pink',
          description: 'Pink circles'
        },
        megaSpell: {
          name: 'Trickster\'s Chaos',
          damage: calculateStats(baseMovementSpeeds[13]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[13]).megaCooldown,
          speed: 1.1,
          effect: 'trickster',
          description: 'Chaotic trickster magic'
        }
      },
      player15: { // SMOKE - The Dev
        name: 'SMOKE',
        ...calculateStats(baseMovementSpeeds[14]),
        damageMultiplier: 1.0,
        defenseMultiplier: 1.0,
        spell: {
          name: 'Lines of Code',
          damage: calculateStats(baseMovementSpeeds[14]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[14]).spellCooldown,
          speed: 1.1,
          effect: 'linesofcode',
          description: 'Lines of code'
        },
        megaSpell: {
          name: 'System Crash',
          damage: calculateStats(baseMovementSpeeds[14]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[14]).megaCooldown,
          speed: 1.0,
          effect: 'systemcrash',
          description: 'Digital system crash'
        }
      },
      player16: { // JAMES - The Goblin King (Slowest)
        name: 'JAMES',
        ...calculateStats(baseMovementSpeeds[15]),
        damageMultiplier: 1.0,
        defenseMultiplier: 0.9,
        spell: {
          name: '3 Rainbow Spheres',
          damage: calculateStats(baseMovementSpeeds[15]).spellDamage,
          cooldown: calculateStats(baseMovementSpeeds[15]).spellCooldown,
          speed: 1.0,
          effect: 'rainbowspheres',
          description: '3 rainbow spheres'
        },
        megaSpell: {
          name: 'Goblin Kingdom',
          damage: calculateStats(baseMovementSpeeds[15]).megaDamage,
          cooldown: calculateStats(baseMovementSpeeds[15]).megaCooldown,
          speed: 0.9,
          effect: 'goblinkingdom',
          description: 'Goblin king\'s power'
        }
      }
    };

    // Set current character spells and stats
    this.currentSpell = this.characterSpells[this.selectedCharacter].spell;
    this.currentMegaSpell = this.characterSpells[this.selectedCharacter].megaSpell;
    
    // Apply character-specific stats
    const characterStats = this.characterSpells[this.selectedCharacter];
    this.speedMultiplier = characterStats.speedMultiplier || 1.0;
    this.damageMultiplier = characterStats.damageMultiplier || 1.0;
    this.defenseMultiplier = characterStats.defenseMultiplier || 1.0;
    
    console.log('Character spells initialized:', this.selectedCharacter);
    console.log('Current spell:', this.currentSpell);
    console.log('Current mega spell:', this.currentMegaSpell);
    console.log('Character stats - Speed:', this.speedMultiplier, 'Damage:', this.damageMultiplier, 'Defense:', this.defenseMultiplier);
  }

  create() {
    // Get responsive dimensions
    const worldWidth = this.game.config.width;
    const worldHeight = this.game.config.height;
    
    // Create arena background based on selection
    const arenaKey = `arena-${this.selectedArena}`;
    

    
    // Check if arena texture exists
    if (!this.textures.exists(arenaKey)) {
      console.error(`Arena texture ${arenaKey} does not exist! Using fallback arena.`);
      // Use classic arena as fallback
      const fallbackArenaKey = 'arena-classic';
      if (!this.textures.exists(fallbackArenaKey)) {
        console.error(`Fallback arena texture ${fallbackArenaKey} also does not exist! Creating dark background.`);
        // Create a dark gray background as last resort
        const darkBackground = this.add.rectangle(0, 0, worldWidth, worldHeight, 0x1a1a1a).setOrigin(0, 0);
        darkBackground.setDepth(0);
        

      } else {
        const arenaImage = this.add.image(0, 0, fallbackArenaKey).setOrigin(0, 0);
        arenaImage.setDisplaySize(worldWidth, worldHeight);
        arenaImage.setDepth(0); // Set arena to lowest depth
        console.log('Using fallback arena:', fallbackArenaKey);
      }
          } else {
        const arenaImage = this.add.image(0, 0, arenaKey).setOrigin(0, 0);
        arenaImage.setDisplaySize(worldWidth, worldHeight);
        arenaImage.setDepth(0); // Set arena to lowest depth
        console.log('Using arena:', arenaKey);
      }
    
    // Set world bounds to match screen size
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    
    // Ensure the world bounds are properly set for camera following
    this.physics.world.setBoundsCollision(true, true, true, true);
    
    // Set camera bounds to match world bounds
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    

    
    // Create animations first
    this.createAnimations();
    
    // Create players
    this.createPlayer();
    
    if (this.isTraining) {
      // Create dummy player for training mode
      this.createDummyPlayer();
    } else {
      // Create other player for multiplayer
      this.createOtherPlayer();
    }
    
    // Setup input
    this.setupInput();
    
    // Create HUD
    this.createHUD();
    
    // Create cooldown bars
    this.createCooldownBars();
    
    // Setup camera to match world size
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setZoom(1); // No zoom needed since map scales to screen
    
    // Set camera background color
    this.cameras.main.setBackgroundColor('#1a1a1a');
    

    
    // Only start camera follow if player was created successfully
    if (this.player) {
      // Re-enable camera follow with better configuration
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      // Set camera deadzone to prevent jittery movement
      this.cameras.main.setDeadzone(100, 100);
      // Set camera bounds to prevent going out of bounds
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      console.log('Camera follow started with improved configuration');
    } else {
      console.error('Player not created - cannot start camera follow');
    }
    
    // Start game after a short delay
    this.time.delayedCall(1000, () => {
      this.gameStarted = true;
      console.log('Game started successfully');
      
      // Start background music
      this.startBackgroundMusic();
      
      // Add click handler for browsers that require user interaction for audio
      this.setupAudioUnlock();
      
      if (this.isMultiplayer && this.socket) {
        this.socket.emit('gameReady', { roomId: this.roomId });
        
        // Start constant game state synchronization
        this.startGameStateSync();
      }
    });
  }

  createPlayer() {
    console.log('Creating player with character:', this.selectedCharacter);
    
    // Position player at center of responsive world
    // Use walk texture instead of idle texture since we removed idle textures
    const worldWidth = this.game.config.width;
    const worldHeight = this.game.config.height;
    
    // Check if character texture exists
    const characterTexture = `${this.selectedCharacter}_walk`;
    

    
    if (!this.textures.exists(characterTexture)) {
      console.error(`Character texture ${characterTexture} does not exist! Using fallback character.`);
      // Use player1 as fallback
      this.player = this.physics.add.sprite(worldWidth / 2, worldHeight / 2, 'player1_walk');
    } else {
      this.player = this.physics.add.sprite(worldWidth / 2, worldHeight / 2, characterTexture);
    }
    
    // Ensure player is within world bounds
    this.player.x = Math.max(32, Math.min(worldWidth - 32, this.player.x));
    this.player.y = Math.max(32, Math.min(worldHeight - 32, this.player.y));
    

    
    // Set up player properties
    this.player.setCollideWorldBounds(true);
    this.player.setScale(2); // Increased player size for better visibility
    this.player.setDepth(2); // Set player above map but below decorations
    this.player.playerId = this.playerId;
    

    
    // Set initial animation with safety check
    const idleAnimation = `${this.selectedCharacter}_idle_down`;
    if (this.anims.exists(idleAnimation)) {
      this.player.anims.play(idleAnimation);
    } else {
      console.error(`Animation ${idleAnimation} does not exist! Using walk animation instead.`);
      // Use walk animation as fallback
      const walkAnimation = `${this.selectedCharacter}_walk_down`;
      if (this.anims.exists(walkAnimation)) {
        this.player.anims.play(walkAnimation);
      } else {
        console.error(`Walk animation ${walkAnimation} also does not exist!`);
      }
    }
  }

  createOtherPlayer() {
    // Only create other player in multiplayer mode
    if (!this.isMultiplayer) {
      console.log('Single player mode - no other player needed');
      return;
    }
    
    // Don't create other player immediately - wait for them to join
    console.log('Waiting for other player to join...');
    this.otherPlayer = null;
  }

  createOtherPlayerFromData(playerData) {
    if (!this.isMultiplayer) {
      console.log('Not creating other player - not multiplayer mode');
      return;
    }
    
    console.log('Creating other player from data:', playerData);
    
    // Use the other player's character if available, otherwise fallback to same character
    this.otherPlayerCharacter = playerData.characterId || this.selectedCharacter;
    console.log('Selected character:', this.selectedCharacter);
    console.log('Other character:', this.otherPlayerCharacter);
    
    const worldWidth = this.game.config.width;
    const worldHeight = this.game.config.height;
    
    // Position other player on the opposite side of the arena
    const otherPlayerX = this.isHost ? worldWidth / 2 + 100 : worldWidth / 2 - 100;
    const otherPlayerY = worldHeight / 2;
    
    console.log('Creating other player sprite at:', otherPlayerX, otherPlayerY);
    
    // Use walk texture instead of idle texture since we removed idle textures
    // Check if character texture exists
    const otherCharacterTexture = `${this.otherPlayerCharacter}_walk`;
    if (!this.textures.exists(otherCharacterTexture)) {
      console.error(`Other character texture ${otherCharacterTexture} does not exist! Using fallback character.`);
      // Use player1 as fallback
      this.otherPlayer = this.physics.add.sprite(otherPlayerX, otherPlayerY, 'player1_walk');
    } else {
      this.otherPlayer = this.physics.add.sprite(otherPlayerX, otherPlayerY, otherCharacterTexture);
    }
    
    // Set up other player properties
    this.otherPlayer.setCollideWorldBounds(true);
    this.otherPlayer.setScale(2);
    this.otherPlayer.playerId = playerData.id;
    
    // No tint needed - players will be distinguished by their character sprites
    
          const idleAnimation = `${this.otherPlayerCharacter}_idle_down`;
    if (this.anims.exists(idleAnimation)) {
      this.otherPlayer.anims.play(idleAnimation);
      console.log('Playing idle animation:', idleAnimation);
    } else {
      console.error(`Animation ${idleAnimation} does not exist! Using walk animation instead.`);
      // Use walk animation as fallback
      const walkAnimation = `${this.otherPlayerCharacter}_walk_down`;
      if (this.anims.exists(walkAnimation)) {
        this.otherPlayer.anims.play(walkAnimation);
        console.log('Playing walk animation as fallback:', walkAnimation);
      } else {
        console.error(`Walk animation ${walkAnimation} also does not exist!`);
      }
    }
    
    console.log(`[INIT] Created other player at position: ${otherPlayerX}, ${otherPlayerY} with ID: ${playerData.id}`);
    console.log(`[INIT] My playerId: ${this.playerId}, Other player ID: ${this.otherPlayer.playerId}`);
    
    // CRITICAL: Initialize other player health to 100 for multiplayer
    this.otherPlayerHealth = 100;
    console.log(`[INIT] [${this.playerId}] Other player health initialized to: ${this.otherPlayerHealth}`);
    console.log(`[INIT] [${this.playerId}] My health: ${this.playerHealth}, Other health: ${this.otherPlayerHealth}`);
    
    // Ensure other player is visible and properly positioned
    this.otherPlayer.setVisible(true);
    this.otherPlayer.setAlpha(1);
    this.otherPlayer.setDepth(2); // Set other player above map but below decorations
    
    // Create enemy UI bars
    this.createEnemyUI();
    
    // Update enemy name based on character
    this.updateEnemyName();
  }

  createDummyPlayer() {
    console.log('Creating dummy player for training mode');
    
    const worldWidth = this.game.config.width;
    const worldHeight = this.game.config.height;
    
    // Position dummy player on the opposite side of the arena
    const dummyPlayerX = worldWidth / 2 + 100;
    const dummyPlayerY = worldHeight / 2;
    
    // Use a random character for the dummy (different from player)
    const dummyCharacter = this.selectedCharacter === 'player1' ? 'player2' : 'player1';
    this.otherPlayerCharacter = dummyCharacter;
    
    console.log('Creating dummy player sprite at:', dummyPlayerX, dummyPlayerY);
    console.log('Dummy character:', dummyCharacter);
    
    // Use walk texture instead of idle texture since we removed idle textures
    // Check if character texture exists
    const dummyCharacterTexture = `${dummyCharacter}_walk`;
    if (!this.textures.exists(dummyCharacterTexture)) {
      console.error(`Dummy character texture ${dummyCharacterTexture} does not exist! Using fallback character.`);
      // Use player1 as fallback
      this.otherPlayer = this.physics.add.sprite(dummyPlayerX, dummyPlayerY, 'player1_walk');
    } else {
      this.otherPlayer = this.physics.add.sprite(dummyPlayerX, dummyPlayerY, dummyCharacterTexture);
    }
    
    // Set up dummy player properties
    this.otherPlayer.setCollideWorldBounds(true);
    this.otherPlayer.setScale(2);
    this.otherPlayer.playerId = 'dummy-player';
    this.otherPlayer.isDummy = true; // Mark as dummy player
    
    // Play idle animation
    const idleAnimation = `${dummyCharacter}_idle_down`;
    if (this.anims.exists(idleAnimation)) {
      this.otherPlayer.anims.play(idleAnimation);
      console.log('Playing idle animation:', idleAnimation);
    } else {
      console.error(`Animation ${idleAnimation} does not exist! Using walk animation instead.`);
      // Use walk animation as fallback
      const walkAnimation = `${dummyCharacter}_walk_down`;
      if (this.anims.exists(walkAnimation)) {
        this.otherPlayer.anims.play(walkAnimation);
        console.log('Playing walk animation as fallback:', walkAnimation);
      } else {
        console.error(`Walk animation ${walkAnimation} also does not exist!`);
      }
    }
    
    console.log(`Created dummy player at position: ${dummyPlayerX}, ${dummyPlayerY}`);
    console.log('Dummy player sprite created:', !!this.otherPlayer);
    console.log('Dummy player visible:', this.otherPlayer.visible);
    
    // Ensure dummy player is visible and properly positioned
    this.otherPlayer.setVisible(true);
    this.otherPlayer.setAlpha(1);
    this.otherPlayer.setDepth(2);
    
    // Set dummy player health to infinite
    this.otherPlayerHealth = Infinity;
    
    // Set dummy player mega spell uses (always 3 for dummy)
    this.otherPlayerMegaSpellUses = 3;
    
    // Create enemy UI bars
    this.createEnemyUI();
    
    // Update enemy name to show it's a dummy
    this.updateEnemyName();
  }

  createAnimations() {
    // Create animations for all characters to support multiplayer
    const characters = [
      'player1', 'player2', 'player3', 'player4', 'player5', 'player6',
      'player7', 'player8', 'player9', 'player10', 'player11', 'player12', 'player13', 'player14',
      'player15', 'player16'
    ];
    
    characters.forEach(character => {
      console.log('Creating animations for character:', character);
      
      // Check if spritesheets exist before creating animations
      const requiredSpritesheets = [`${character}_walk`, `${character}_slash`, `${character}_spellcast`, `${character}_hurt`];
      for (const spritesheet of requiredSpritesheets) {
        if (!this.textures.exists(spritesheet)) {
          console.error(`Spritesheet ${spritesheet} does not exist! Skipping animations for ${character}`);
          return;
        }
        // Log frame count for debugging
        const texture = this.textures.get(spritesheet);
        console.log(`Spritesheet ${spritesheet} has ${texture.frameTotal} frames`);
      }
    
    // Walk animations (9 frames per direction)
    this.anims.create({
      key: `${character}_walk_up`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: `${character}_walk_left`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 9, end: 17 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: `${character}_walk_down`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 18, end: 26 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: `${character}_walk_right`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 27, end: 35 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Idle animations (using first frame of each walk direction)
    this.anims.create({
      key: `${character}_idle_up`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 0, end: 0 }),
      frameRate: 1,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_idle_left`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 9, end: 9 }),
      frameRate: 1,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_idle_down`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 18, end: 18 }),
      frameRate: 1,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_idle_right`,
      frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: 27, end: 27 }),
      frameRate: 1,
      repeat: 0
    });
    
    // Slash animations (6 frames per direction)
    this.anims.create({
      key: `${character}_slash_up`,
      frames: this.anims.generateFrameNumbers(`${character}_slash`, { start: 0, end: 5 }),
      frameRate: 15,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_slash_left`,
      frames: this.anims.generateFrameNumbers(`${character}_slash`, { start: 6, end: 11 }),
      frameRate: 15,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_slash_down`,
      frames: this.anims.generateFrameNumbers(`${character}_slash`, { start: 12, end: 17 }),
      frameRate: 15,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_slash_right`,
      frames: this.anims.generateFrameNumbers(`${character}_slash`, { start: 18, end: 23 }),
      frameRate: 15,
      repeat: 0
    });
    
    // Spellcast animations (7 frames per direction)
    this.anims.create({
      key: `${character}_spellcast_up`,
      frames: this.anims.generateFrameNumbers(`${character}_spellcast`, { start: 0, end: 6 }),
      frameRate: 12,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_spellcast_left`,
      frames: this.anims.generateFrameNumbers(`${character}_spellcast`, { start: 7, end: 13 }),
      frameRate: 12,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_spellcast_down`,
      frames: this.anims.generateFrameNumbers(`${character}_spellcast`, { start: 14, end: 20 }),
      frameRate: 12,
      repeat: 0
    });
    
    this.anims.create({
      key: `${character}_spellcast_right`,
      frames: this.anims.generateFrameNumbers(`${character}_spellcast`, { start: 21, end: 27 }),
      frameRate: 12,
      repeat: 0
    });
    
    // Hurt animation (all frames in one row) - only 6 frames available (0-5)
    this.anims.create({
      key: `${character}_hurt`,
      frames: this.anims.generateFrameNumbers(`${character}_hurt`, { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
    });
  }

  setupInput() {
    // WASD keys for movement (always running)
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
    // Spell keys
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P); // Mega Spell
    this.oKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O); // Regular Spell
    this.tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T); // Test collision
    
    // Pause menu key
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  createItems() {
    // Check if items texture exists
    if (!this.textures.exists('items')) {
      console.error('Items texture not found!');
      return;
    }
    
    console.log('Items texture loaded successfully');
    
    // Define all possible items with correct frame numbers (32x32px items, 16 per row)
    this.allItems = [
      // Spells (row 1, items 9, 10, 11) - frames 8, 9, 10 (0-indexed)
      { type: 'lightning_spell', category: 'spell', frame: 8, mpCost: 8, effect: 'lightning' },
      { type: 'fireball_spell', category: 'spell', frame: 9, mpCost: 10, effect: 'fireball' },
      { type: 'water_spell', category: 'spell', frame: 10, mpCost: 6, effect: 'water' },
      // New spells
      { type: 'dark_magic_spell', category: 'spell', frame: 0, mpCost: 8, effect: 'dark_magic' }, // Row 1, Column 1 - dark magic
      { type: 'nature_spell', category: 'spell', frame: 1, mpCost: 6, effect: 'nature' }, // Row 1, Column 2 - nature spell
      
      // Wearables (row 8, items 8, 15, 16) - frames 119, 127, 128 (row 8 * 16 + position)
      { type: 'armor', category: 'wearable', frame: 119, effect: 'armor', duration: 5 },
      { type: 'invisibility_cloak', category: 'wearable', frame: 126, effect: 'invisibility', duration: 10 },
      { type: 'gladiator_belt', category: 'wearable', frame: 127, effect: 'damage_boost', duration: 10 },
      
      // Potions (row 10, items 1, 2, 3) - frames 144, 145, 146 (row 10 * 16 + position)
      { type: 'health_potion', category: 'potion', frame: 144, effect: 'heal', amount: 50 },
      { type: 'mp_potion', category: 'potion', frame: 145, effect: 'mp_restore', amount: 50 },
      { type: 'speed_potion', category: 'potion', frame: 146, effect: 'speed_boost', duration: 10 }
    ];
    
    // Spawn initial items - 2 of each type
    this.spawnSpecificItems();
    
    // Set up individual item spawning with random timers
    this.setupRandomItemSpawning();
    
    // Add collision between player and items with safety checks
    if (this.player && this.items && this.items.length > 0) {
      this.physics.add.overlap(this.player, this.items, this.pickupItem, null, this);
    }
  }

  // Decorations removed - no longer needed

  // Decorations removed - no longer needed

  createEnemyUI() {
    if (!this.otherPlayer) return;
    
    // Create enemy health bar background
    this.otherPlayerHealthBarBg = this.add.rectangle(
      this.otherPlayer.x - 50, 
      this.otherPlayer.y - 54, 
      100, 
      8, 
      0x000000, 
      0.8
    );
    this.otherPlayerHealthBarBg.setDepth(10);
    this.otherPlayerHealthBarBg.setOrigin(0, 0);
    
    // Create enemy health bar
    this.otherPlayerHealthBar = this.add.rectangle(
      this.otherPlayer.x - 50, 
      this.otherPlayer.y - 54, 
      100, 
      8, 
      0xff0000, 
      1
    );
    this.otherPlayerHealthBar.setDepth(11);
    this.otherPlayerHealthBar.setOrigin(0, 0);
    
    // Create enemy name text - will be updated with actual character name
    this.otherPlayerName = this.add.text(
      this.otherPlayer.x, 
      this.otherPlayer.y - 70, 
      'Enemy', 
      {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.otherPlayerName.setOrigin(0.5);
    this.otherPlayerName.setDepth(12);
    
    console.log('Created enemy UI bars');
  }

  createMegaSpellMarks() {
    // Create 3 marks next to the mega cooldown bar to show mega spell uses
    this.megaSpellMarks = [];
    const startX = 280; // Position on the right side of the mega bar
    const markY = 98; // Align with mega cooldown bar center
    const markSpacing = 18;
    
    for (let i = 0; i < 3; i++) {
      const markX = startX + (i * markSpacing);
      
      // Create mark with golden color
      const mark = this.add.circle(markX, markY, 6, 0xFFD700, 0.8);
      mark.setDepth(15);
      mark.setScrollFactor(0);
      
      // Create inner highlight for better visibility
      const highlight = this.add.circle(markX - 1, markY - 1, 3, 0xffffff, 0.4);
      highlight.setDepth(16);
      highlight.setScrollFactor(0);
      
      // Store references
      mark.index = i;
      mark.highlight = highlight;
      mark.isUsed = false;
      
      this.megaSpellMarks.push(mark);
    }
    
    console.log(`Created ${this.megaSpellMarks.length} mega spell marks`);
  }

  updateMegaSpellMarks() {
    // Update the mega spell marks to show used/unused states
    if (this.megaSpellMarks) {
      const remainingUses = this.megaSpellUses;
      
      this.megaSpellMarks.forEach((mark, index) => {
        const isUsed = index >= remainingUses;
        
        if (isUsed && !mark.isUsed) {
          // Mark as used - make it darker
          mark.setFillStyle(0x666666, 0.5);
          mark.highlight.setFillStyle(0x333333, 0.3);
          mark.isUsed = true;
        } else if (!isUsed && mark.isUsed) {
          // Mark as available again - restore golden color
          mark.setFillStyle(0xFFD700, 0.8);
          mark.highlight.setFillStyle(0xffffff, 0.4);
          mark.isUsed = false;
        }
      });
    }
  }

  updateMegaSpellMarksDisplay() {
    // Update the mega spell marks display
    this.updateMegaSpellMarks();
  }

  updateMegaSpellOrbs(player, megaSpellUses, type = 'player') {
    // This function handles updating mega spell indicators for any player
    // For now, we'll update the appropriate UI based on the type
    
    if (type === 'player') {
      // Update player's mega spell marks
      this.megaSpellUses = megaSpellUses;
      this.updateMegaSpellMarksDisplay();
    } else if (type === 'enemy') {
      // Update enemy's mega spell indicators
      // Since we don't have enemy mega spell marks in the UI currently,
      // we'll store the value for potential future UI updates
      this.otherPlayerMegaSpellUses = megaSpellUses;
      
      // Log for debugging
      console.log(`Updated enemy mega spell uses: ${megaSpellUses}`);
      
      // If we had enemy mega spell UI elements, we would update them here
      // For now, just ensure the value is stored for the enemy UI
    }
  }

  makeOtherPlayerInvincible() {
    // Make other player invincible for 1 second
    this.otherPlayerInvincible = true;
    
    // Clear any existing timer
    if (this.otherPlayerInvincibilityTimer) {
      clearTimeout(this.otherPlayerInvincibilityTimer);
    }
    
    // Visual feedback - make other player flash
    if (this.otherPlayer) {
      this.tweens.add({
        targets: this.otherPlayer,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 9, // Flash for 1 second (10 cycles of 100ms each)
        onComplete: () => {
          this.otherPlayer.setAlpha(1); // Ensure they're visible after flashing
        }
      });
    }
    
    // Set timer to remove invincibility after 1 second
    this.otherPlayerInvincibilityTimer = setTimeout(() => {
      this.otherPlayerInvincible = false;
      this.otherPlayerInvincibilityTimer = null;
      console.log('Other player invincibility ended');
    }, 1000);
    
    console.log('Other player is now invincible for 1 second');
  }

  updateEnemyName() {
    if (!this.otherPlayerName || !this.otherPlayerCharacter) return;
    
    // Character name mapping
    const characterNames = {
      'player1': 'THUNDERFIST',
      'player2': 'FROSTBLADE', 
      'player3': 'SHADOWSTRIKE',
      'player4': 'FLAMESTORM',
      'player5': 'NATUREBORN',
      'player6': 'VOIDWALKER',
      'player7': 'AURION',
      'player8': 'IRONHEART',
      'player9': 'FIST KING',
      'player10': 'BLACKJACK',
      'player11': 'INFERNUS',
      'player12': 'DON VERMILLION',
      'player13': 'MAXIMUS REX',
      'player14': 'PINK SHADOW',
      'player15': 'SMOKE',
      'player16': 'JAMES'
    };
    
    const characterName = characterNames[this.otherPlayerCharacter] || 'UNKNOWN';
    
    // Add "(DUMMY)" suffix for training mode
    if (this.isTraining && this.otherPlayer && this.otherPlayer.isDummy) {
      this.otherPlayerName.setText(`${characterName} (DUMMY)`);
      console.log(`Updated dummy enemy name to: ${characterName} (DUMMY) (${this.otherPlayerCharacter})`);
    } else {
      this.otherPlayerName.setText(characterName);
      console.log(`Updated enemy name to: ${characterName} (${this.otherPlayerCharacter})`);
    }
  }

  updateEnemyUI() {
    if (!this.otherPlayer || !this.otherPlayerHealthBar) return;
    
    // Update position to follow other player
    const x = this.otherPlayer.x;
    const y = this.otherPlayer.y;
    
    // Calculate health percentage
    const healthPercent = Math.max(0, Math.min(100, this.otherPlayerHealth));
    
    // Update health bar background and bar (both aligned)
    this.otherPlayerHealthBarBg.setPosition(x - 50, y - 54);
    this.otherPlayerHealthBar.setPosition(x - 50, y - 54);
    this.otherPlayerHealthBar.setDisplaySize((healthPercent / 100) * 100, 8);
    
    // Update name position
    this.otherPlayerName.setPosition(x, y - 70);
    
    // Reduced logging - only log critical health changes
    if (this.otherPlayerHealth <= 20 || this.otherPlayerHealth >= 80) {
      console.log(`[${this.playerId}] Enemy health: ${this.otherPlayerHealth}%`);
    }
  }

  createItemsFromData(itemsData) {
    // Safety check - ensure player exists
    if (!this.player) {
      console.log('Player not found, skipping item creation from data');
      return;
    }
    
    // Check if items texture exists
    if (!this.textures.exists('items')) {
      console.error('Items texture not found!');
      return;
    }
    
    console.log('Creating items from other player data:', itemsData.length);
    
    // Don't clear existing items - merge them
    // Create items at the exact positions from other player
    itemsData.forEach(itemData => {
      // Check if item already exists at this position
      const existingItem = this.items.find(item => 
        item.x === itemData.x && 
        item.y === itemData.y && 
        item.itemType === itemData.type
      );
      
      if (!existingItem) {
        try {
          const item = this.physics.add.sprite(itemData.x, itemData.y, 'items');
          if (item) {
            item.setFrame(itemData.frame);
            item.setScale(2);
            item.itemType = itemData.type;
            item.category = itemData.category;
            item.mpCost = itemData.mpCost;
            item.effect = itemData.effect;
            item.duration = itemData.duration;
            item.amount = itemData.amount;
            this.items.push(item);
            
            console.log(`Created item from other player: ${itemData.type} at (${itemData.x}, ${itemData.y}) with frame ${itemData.frame}`);
          }
        } catch (error) {
          console.error('Error creating item from data:', error);
        }
      } else {
        console.log(`Item already exists at position: ${itemData.type} at (${itemData.x}, ${itemData.y})`);
      }
    });
    
    // Add collision between player and items with safety check
    if (this.player && this.items && this.items.length > 0) {
      this.physics.add.overlap(this.player, this.items, this.pickupItem, null, this);
    }
  }

  // Decorations removed - no longer needed

  createItemFromData(itemData) {
    // Safety check - ensure player exists
    if (!this.player) {
      console.log('Player not found, skipping single item creation');
      return;
    }
    
    // Check if items texture exists
    if (!this.textures.exists('items')) {
      console.error('Items texture not found!');
      return;
    }
    
    // Check if we already have 6 items on the floor
    if (this.items.length >= 6) {
      console.log('Maximum 6 items reached, skipping item creation');
      return;
    }
    
    console.log('Creating single item from data:', itemData);
    
    try {
      const item = this.physics.add.sprite(itemData.x, itemData.y, 'items');
      if (item) {
        item.setFrame(itemData.frame);
        item.setScale(2);
        item.itemType = itemData.type || itemData.itemType;
        item.category = itemData.category;
        item.mpCost = itemData.mpCost;
        item.effect = itemData.effect;
        item.duration = itemData.duration;
        item.amount = itemData.amount;
        this.items.push(item);
        
        console.log(`Created item: ${item.itemType} at (${itemData.x}, ${itemData.y}) with frame ${itemData.frame}`);
        
        // Add collision between player and items with safety check
        if (this.player && this.items && this.items.length > 0) {
          this.physics.add.overlap(this.player, this.items, this.pickupItem, null, this);
        }
      }
    } catch (error) {
      console.error('Error creating single item from data:', error);
    }
  }

  startGameStateSync() {
    console.log('Starting constant game state synchronization...');
    
    // Send game state every 100ms (10 times per second)
    this.gameStateTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.isMultiplayer && this.socket && this.gameStarted) {
          this.sendGameState();
        }
      },
      loop: true
    });
  }

  sendGameState() {
    try {
      const gameState = {
        playerId: this.playerId,
        roomId: this.roomId,
        player: {
          x: this.player.x,
          y: this.player.y,
          velocityX: this.player.body.velocity.x,
          velocityY: this.player.body.velocity.y,
          animation: this.player.anims.currentAnim?.key,
          health: this.playerHealth,
          megaSpellUses: this.megaSpellUses,
          direction: this.currentDirection,
          isMoving: this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0,
          currentSpell: this.playerSpell ? this.playerSpell.effect : null,
          characterId: this.selectedCharacter
        },
        // Items removed - no longer needed
        timestamp: Date.now()
      };
      
      this.socket.emit('gameStateUpdate', gameState);
    } catch (error) {
      console.error('Error sending game state:', error);
    }
  }

  updateFromGameState(gameState) {
    try {
      // Create other player if it doesn't exist but we have player data
      if (!this.otherPlayer && gameState.player && this.isMultiplayer) {
        console.log('Creating other player from game state update');
        this.createOtherPlayerFromData({ 
          id: gameState.playerId,
          characterId: gameState.player.characterId || this.selectedCharacter
        });
      }
      
      // Update other player position and animation
      if (this.otherPlayer && gameState.player) {
              // Position update logging reduced
        
        // Update character if it changed
        if (gameState.player.characterId && gameState.player.characterId !== this.otherPlayerCharacter) {
          console.log(`Updating other player character from ${this.otherPlayerCharacter} to ${gameState.player.characterId}`);
          this.otherPlayerCharacter = gameState.player.characterId;
          this.updateEnemyName();
        }
        
        // Safety check for other player object
        if (!this.otherPlayer || !this.otherPlayer.setVelocity || !this.otherPlayer.body) {
          console.warn('Other player object is invalid, skipping position update');
          return;
        }
        
        try {
        this.otherPlayer.x = gameState.player.x;
        this.otherPlayer.y = gameState.player.y;
        this.otherPlayer.setVelocity(gameState.player.velocityX, gameState.player.velocityY);
        } catch (error) {
          console.error('Error updating other player position:', error);
          return;
        }
        
        // Ensure other player is visible
        this.otherPlayer.setVisible(true);
        this.otherPlayer.setAlpha(1);
        this.otherPlayer.setDepth(1);
        
        // Update animation based on movement
        if (gameState.player.isMoving) {
          const walkAnimation = `${this.otherPlayerCharacter}_walk_${gameState.player.direction}`;
          console.log(`Playing walk animation: ${walkAnimation}`);
          if (this.anims.exists(walkAnimation)) {
            this.otherPlayer.anims.play(walkAnimation);
          } else {
            console.warn(`Animation ${walkAnimation} does not exist!`);
          }
        } else {
          const idleAnimation = `${this.otherPlayerCharacter}_idle_${gameState.player.direction}`;
          console.log(`Playing idle animation: ${idleAnimation}`);
          if (this.anims.exists(idleAnimation)) {
            this.otherPlayer.anims.play(idleAnimation);
          } else {
            console.warn(`Animation ${idleAnimation} does not exist!`);
          }
        }
        
        // Update aura based on other player's current spell
        if (gameState.player.currentSpell && gameState.player.currentSpell !== this.otherPlayerCurrentSpell) {
          this.otherPlayerCurrentSpell = gameState.player.currentSpell;
          this.createOtherPlayerAura(gameState.player.currentSpell);
        } else if (!gameState.player.currentSpell && this.otherPlayerCurrentSpell) {
          this.otherPlayerCurrentSpell = null;
          if (this.otherPlayerAura) {
            this.otherPlayerAura.destroy();
            this.otherPlayerAura = null;
          }
        }
      } else {
        console.warn('Cannot update other player - missing otherPlayer or gameState.player');
        console.log('otherPlayer exists:', !!this.otherPlayer);
        console.log('gameState.player exists:', !!gameState.player);
      }
      
      // Update other player mega spell uses from the other player's data
      if (gameState.player && gameState.playerId !== this.playerId) {
        // DO NOT sync health from game state - health is managed locally by damage events
        // This prevents health restoration after taking damage
        const otherPlayerMegaSpellUses = gameState.player.megaSpellUses || 3;
        // Stats update logging reduced
        
        // Update enemy mega spell orbs
        this.updateMegaSpellOrbs(this.otherPlayer, otherPlayerMegaSpellUses, 'enemy');
        
        // Immediately update the enemy UI to reflect the new values
        this.updateEnemyUI();
      }
      
      // Items removed - no longer needed
      
      // Spells are handled separately via individual events to avoid duplication
      
      // Game state update logging reduced
    } catch (error) {
      console.error('Error updating from game state:', error);
    }
  }

  sendItemsToGuests() {
    try {
      console.log('Preparing to send items data...');
      console.log('Items array length:', this.items.length);
      console.log('Socket connected:', this.socket.connected);
      console.log('Room ID:', this.roomId);
      
      const itemsData = this.items.map(item => ({
        x: item.x,
        y: item.y,
        type: item.itemType,
        frame: item.frame.name || item.frame,
        category: item.category,
        mpCost: item.mpCost,
        effect: item.effect,
        duration: item.duration,
        amount: item.amount
      }));
      
      console.log('Sending items data:', itemsData);
      this.socket.emit('itemsCreated', {
        items: itemsData,
        roomId: this.roomId
      });
      console.log('Items data sent successfully');
    } catch (error) {
      console.error('Error sending items data:', error);
    }
  }

  // Decorations removed - no longer needed

  spawnRandomItems(count) {
    // Get responsive world dimensions
    const worldWidth = this.game.config.width;
    const worldHeight = this.game.config.height;
    
    for (let i = 0; i < count; i++) {
      const randomItem = Phaser.Math.RND.pick(this.allItems);
      // Spawn items within the visible world bounds with margins
      const randomX = Phaser.Math.Between(100, worldWidth - 100);
      const randomY = Phaser.Math.Between(100, worldHeight - 100);
      
      const item = this.physics.add.sprite(randomX, randomY, 'items');
      item.setFrame(randomItem.frame);
      item.setScale(2); // Scale up 32x32 items to be more visible
      item.itemType = randomItem.type;
      item.category = randomItem.category;
      item.mpCost = randomItem.mpCost;
      item.effect = randomItem.effect;
      item.duration = randomItem.duration;
      item.amount = randomItem.amount;
      this.items.push(item);
      
      console.log(`Spawned ${randomItem.type} at (${randomX}, ${randomY}) with frame ${randomItem.frame}`);
      
      // Debug: Check if item is visible and positioned correctly
      console.log(`Item visible: ${item.visible}, alpha: ${item.alpha}, scale: ${item.scale}`);
      console.log(`Item position: x=${item.x}, y=${item.y}`);
      console.log(`Item texture: ${item.texture.key}, frame: ${item.frame.name}`);
    }
  }

  spawnSpecificItems() {
    // Get responsive world dimensions
    const worldWidth = this.game.config.width;
    const worldHeight = this.game.config.height;
    
    // Clear existing items
    this.items.forEach(item => item.destroy());
    this.items = [];
    
    // Get items by category
    const spells = this.allItems.filter(item => item.category === 'spell');
    const wearables = this.allItems.filter(item => item.category === 'wearable');
    const potions = this.allItems.filter(item => item.category === 'potion');
    
    // Spawn exactly 6 items total (2 of each category)
    const itemsToSpawn = [
      ...spells.slice(0, 2),
      ...wearables.slice(0, 2),
      ...potions.slice(0, 2)
    ];
    
    for (let i = 0; i < Math.min(6, itemsToSpawn.length); i++) {
      const itemData = itemsToSpawn[i];
      const randomX = Phaser.Math.Between(100, worldWidth - 100);
      const randomY = Phaser.Math.Between(100, worldHeight - 100);
      
      const item = this.physics.add.sprite(randomX, randomY, 'items');
      item.setFrame(itemData.frame);
      item.setScale(2);
      item.itemType = itemData.type;
      item.category = itemData.category;
      item.mpCost = itemData.mpCost;
      item.effect = itemData.effect;
      item.duration = itemData.duration;
      item.amount = itemData.amount;
      this.items.push(item);
      
      console.log(`Spawned ${itemData.category}: ${itemData.type} at (${randomX}, ${randomY})`);
    }
    
    console.log(`Total items spawned: ${this.items.length}/6`);
  }

  setupRandomItemSpawning() {
    // Only host should spawn random items
    if (this.isMultiplayer && !this.isHost) {
      console.log('Guest skipping random item spawning - host will handle it');
      return;
    }
    
    // Get all available items
    const spells = this.allItems.filter(item => item.category === 'spell');
    const wearables = this.allItems.filter(item => item.category === 'wearable');
    const potions = this.allItems.filter(item => item.category === 'potion');
    
    // Create a pool of all items
    this.itemPool = [...spells, ...wearables, ...potions];
    this.spawnedItems = new Set(); // Track spawned items to avoid duplicates
    
    // Start spawning individual items with random timers
    this.scheduleNextItemSpawn();
  }

  scheduleNextItemSpawn() {
    // Random delay between 5-10 seconds
    const randomDelay = Phaser.Math.Between(5000, 10000);
    
    this.time.delayedCall(randomDelay, () => {
      this.spawnRandomIndividualItem();
      this.scheduleNextItemSpawn(); // Schedule next spawn
    });
  }

  spawnRandomIndividualItem() {
    // Safety check - ensure player exists
    if (!this.player) {
      console.log('Player not found, skipping item spawn');
      return;
    }
    
    // Check if we already have 6 items on the floor
    if (this.items.length >= 6) {
      console.log('Maximum 6 items reached, skipping spawn');
      return;
    }
    
    // Get responsive world dimensions
    const worldWidth = this.game.config.width;
    const worldHeight = this.game.config.height;
    
    // Filter out already spawned items
    const availableItems = this.itemPool.filter(item => !this.spawnedItems.has(item.type));
    
    // If all items are spawned, reset the pool
    if (availableItems.length === 0) {
      this.spawnedItems.clear();
      console.log('All items spawned, resetting pool');
      return;
    }
    
    // Pick a random available item
    const randomItem = Phaser.Math.RND.pick(availableItems);
    
    // Mark as spawned
    this.spawnedItems.add(randomItem.type);
    
    // Spawn the item at random position
    const randomX = Phaser.Math.Between(100, worldWidth - 100);
    const randomY = Phaser.Math.Between(100, worldHeight - 100);
    
    try {
      const item = this.physics.add.sprite(randomX, randomY, 'items');
      if (item) {
        item.setFrame(randomItem.frame);
        item.setScale(2);
        item.itemType = randomItem.type;
        item.category = randomItem.category;
        item.mpCost = randomItem.mpCost;
        item.effect = randomItem.effect;
        item.duration = randomItem.duration;
        item.amount = randomItem.amount;
        this.items.push(item);
        
        console.log(`Spawned individual item: ${randomItem.type} (${randomItem.category}) at (${randomX}, ${randomY})`);
        
        // Send item spawn event to other players (only if host)
        if (this.isMultiplayer && this.socket && this.isHost) {
          this.socket.emit('itemSpawned', {
            playerId: this.playerId,
            itemType: randomItem.type,
            x: randomX,
            y: randomY,
            frame: randomItem.frame,
            category: randomItem.category,
            mpCost: randomItem.mpCost,
            effect: randomItem.effect,
            duration: randomItem.duration,
            amount: randomItem.amount,
            roomId: this.roomId
          });
          
          // Also send immediate game state update
          this.sendGameState();
        }
      }
    } catch (error) {
      console.error('Error spawning item:', error);
    }
  }

  createHUD() {
    // Get actual screen/canvas dimensions for responsive positioning
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Enhanced RPG-style HUD panel with more height for cooldown bars
    this.hudBg = this.add.rectangle(20, 20, 350, 140, 0x1a1a2e, 0.95);
    this.hudBg.setOrigin(0, 0);
    this.hudBg.setStrokeStyle(3, 0xff6b6b);
    this.hudBg.setScrollFactor(0);
    
    // Health bar with proper RPG styling
    this.healthBarBg = this.add.rectangle(30, 30, 300, 25, 0x2d2d2d);
    this.healthBarBg.setOrigin(0, 0);
    this.healthBarBg.setStrokeStyle(2, 0xff4757);
    this.healthBarBg.setScrollFactor(0);
    
    this.healthBarFill = this.add.rectangle(32, 32, 296, 21, 0xff6b6b);
    this.healthBarFill.setOrigin(0, 0);
    this.healthBarFill.setScrollFactor(0);
    
    this.healthText = this.add.text(35, 35, 'HEALTH: 100', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    });
    this.healthText.setScrollFactor(0);
    
    // Spell cooldown bar
    const spellBarY = 65;
    this.playerSpellCooldownBg = this.add.rectangle(30, spellBarY, 300, 18, 0x2d2d2d, 0.9);
    this.playerSpellCooldownBg.setOrigin(0, 0);
    this.playerSpellCooldownBg.setStrokeStyle(2, 0x4169e1);
    this.playerSpellCooldownBg.setScrollFactor(0);
    
    this.playerSpellCooldownFill = this.add.rectangle(32, spellBarY + 2, 0, 14, 0x4169e1, 1);
    this.playerSpellCooldownFill.setOrigin(0, 0);
    this.playerSpellCooldownFill.setScrollFactor(0);
    
    this.playerSpellCooldownText = this.add.text(35, spellBarY + 2, 'SPELL READY', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
      fontStyle: 'bold'
    });
    this.playerSpellCooldownText.setScrollFactor(0);
    
    // Mega spell cooldown bar
    const megaBarY = 90;
    this.playerMegaCooldownBg = this.add.rectangle(30, megaBarY, 300, 18, 0x2d2d2d, 0.9);
    this.playerMegaCooldownBg.setOrigin(0, 0);
    this.playerMegaCooldownBg.setStrokeStyle(2, 0xff6b35);
    this.playerMegaCooldownBg.setScrollFactor(0);
    
    this.playerMegaCooldownFill = this.add.rectangle(32, megaBarY + 2, 0, 14, 0xff6b35, 1);
    this.playerMegaCooldownFill.setOrigin(0, 0);
    this.playerMegaCooldownFill.setScrollFactor(0);
    
    this.playerMegaCooldownText = this.add.text(35, megaBarY + 2, 'MEGA READY', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
      fontStyle: 'bold'
    });
    this.playerMegaCooldownText.setScrollFactor(0);
    
    // Create mega spell marks next to mega cooldown bar
    this.createMegaSpellMarks();
    
    // Bottom controls info
    const centerX = screenWidth / 2;
    const bottomY = screenHeight - 80;
    
    // Controls text
    const controlsInfo = this.isTraining ? 
      'O: SPELL | P: MEGA SPELL | ← →: CYCLE CHARACTERS' : 
      'O: SPELL | P: MEGA SPELL';
    this.controlsText = this.add.text(centerX, bottomY, controlsInfo, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    });
    this.controlsText.setOrigin(0.5, 0);
    
    // Training mode character selection
    if (this.isTraining) {
      this.createTrainingCharacterSelector(centerX, bottomY + 25);
    }
    
    // Character info
    const characterInfo = this.characterSpells[this.selectedCharacter];
    this.characterText = this.add.text(centerX, bottomY + 25, `${characterInfo.name} - ${characterInfo.spell.name}`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fill: '#cccccc',
      stroke: '#000000',
      strokeThickness: 1,
      fontStyle: 'italic'
    });
    this.characterText.setOrigin(0.5, 0);
    
    // Initialize health
    this.playerHealth = 100;
    this.updateHealthBar();
  }

  createCooldownBars() {
    // Cooldown bars are now integrated into the main HUD panel in createHUD()
    // This function is kept for compatibility but does nothing
    console.log('Cooldown bars integrated into main HUD');
  }

  startBackgroundMusic() {
    try {
      console.log('Attempting to start background music...');
      
      // Check if sound system is available
      if (!this.sound) {
        console.error('Sound system not available');
        return;
      }
      
      // Check if music is already loaded
      const musicCache = this.sound.get('fight-music');
      console.log('Music cache check:', musicCache ? 'Found' : 'Not found');
      
      // Also check if it exists in the cache but hasn't been registered to sound manager
      const loadedAudioFiles = this.cache.audio.keys;
      console.log('All loaded audio files:', loadedAudioFiles);
      console.log('fight-music in audio cache:', this.cache.audio.exists('fight-music'));
      
      if (!musicCache) {
        // Check if it's in the audio cache but not added to sound manager
        if (this.cache.audio.exists('fight-music')) {
          console.log('Music found in audio cache, trying to add to sound manager...');
          try {
            this.playMusic();
            return;
          } catch (error) {
            console.error('Failed to add music from cache:', error);
          }
        }
        
        if (this.musicLoadAttempted) {
          console.warn('Music load already attempted but failed, skipping to avoid infinite loop');
          return;
        }
        
        console.warn('Fight music not loaded yet, checking if loader is available...');
        
        // Check if we're already loading or if the loader is locked
        if (this.load.isLoading()) {
          console.log('Loader is busy, will try again after current load completes');
          this.load.once('complete', () => {
            console.log('Load complete, trying music again...');
            this.time.delayedCall(100, () => this.startBackgroundMusic());
          });
          return;
        }
        
        // Mark that we've attempted to load
        this.musicLoadAttempted = true;
        
        // Try to load the music if it wasn't loaded properly
        console.log('Adding fight-music to loader...');
        this.load.audio('fight-music', 'assets/music/fight.mp3');
        
        this.load.once('complete', () => {
          console.log('Music loaded successfully, trying to start...');
          this.time.delayedCall(100, () => this.startBackgroundMusic());
        });
        
        this.load.once('loaderror', () => {
          console.error('Failed to load music, check file path');
        });
        
        this.load.start();
        return;
      }
      
      // Stop any existing music
      if (this.backgroundMusic) {
        console.log('Stopping existing background music');
        this.backgroundMusic.stop();
        this.backgroundMusic.destroy();
        this.backgroundMusic = null;
      }
      
      // Check if audio context is suspended (common browser issue)
      if (this.sound.context && this.sound.context.state === 'suspended') {
        console.log('Audio context suspended, attempting to resume...');
        this.sound.context.resume().then(() => {
          console.log('Audio context resumed');
          this.playMusic();
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      } else {
        this.playMusic();
      }
      
    } catch (error) {
      console.error('Error starting background music:', error);
    }
  }

  playMusic() {
    try {
      // Create the music object
      this.backgroundMusic = this.sound.add('fight-music', {
        volume: 0.4, // Slightly higher volume
        loop: true   // Loop the music during gameplay
      });
      
      // Add event listeners for debugging
      this.backgroundMusic.on('play', () => {
        console.log('Music started playing successfully');
      });
      
      this.backgroundMusic.on('pause', () => {
        console.log('Music paused');
      });
      
      this.backgroundMusic.on('stop', () => {
        console.log('Music stopped');
      });
      
      this.backgroundMusic.on('end', () => {
        console.log('Music ended, should loop...');
      });
      
      this.backgroundMusic.on('looped', () => {
        console.log('Music looped');
      });
      
      // Start playing
      const playResult = this.backgroundMusic.play();
      console.log('Play result:', playResult);
      
    } catch (error) {
      console.error('Error in playMusic:', error);
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic.destroy();
      this.backgroundMusic = null;
      console.log('Background music stopped');
    }
  }

  setupAudioUnlock() {
    // Many browsers require user interaction before playing audio
    // Add a one-time click handler to unlock audio
    if (!this.audioUnlocked) {
      const unlockAudio = () => {
        console.log('User interaction detected, unlocking audio...');
        
        // Try to resume audio context
        if (this.sound.context && this.sound.context.state === 'suspended') {
          this.sound.context.resume();
        }
        
        // If music isn't playing, try to start it
        if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) {
          this.startBackgroundMusic();
        }
        
        this.audioUnlocked = true;
        
        // Remove the event listener after first use
        this.input.off('pointerdown', unlockAudio);
        document.removeEventListener('click', unlockAudio);
        console.log('Audio unlock handler removed');
      };
      
      // Add listeners for user interaction
      this.input.once('pointerdown', unlockAudio);
      document.addEventListener('click', unlockAudio, { once: true });
      
      console.log('Audio unlock handlers added');
    }
  }

  togglePauseMenu() {
    if (this.isPaused) {
      this.hidePauseMenu();
    } else {
      this.showPauseMenu();
    }
  }

  showPauseMenu() {
    console.log('Showing pause menu');
    this.isPaused = true;
    
    // Pause the background music
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.pause();
    }
    
    // Create semi-transparent overlay
    this.pauseOverlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    ).setScrollFactor(0).setDepth(1000);
    
    // Create pause menu container
    this.pauseMenu = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY)
      .setScrollFactor(0)
      .setDepth(1001);
    
    // Menu background
    const menuBg = this.add.rectangle(0, 0, 400, 300, 0x2a2a2a, 0.95)
      .setStrokeStyle(3, 0x00ff00);
    
    // Menu title
    const title = this.add.text(0, -100, 'GAME PAUSED', {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: '#00ff00',
      align: 'center'
    }).setOrigin(0.5);
    
    // Resume button
    const resumeButton = this.add.rectangle(0, -20, 250, 50, 0x1a1a1a, 0.8)
      .setStrokeStyle(2, 0x00ff00)
      .setInteractive({ useHandCursor: true });
    
    const resumeText = this.add.text(0, -20, 'RESUME (ESC)', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Quit button
    const quitButton = this.add.rectangle(0, 50, 250, 50, 0x1a1a1a, 0.8)
      .setStrokeStyle(2, 0xff4444)
      .setInteractive({ useHandCursor: true });
    
    const quitText = this.add.text(0, 50, 'QUIT TO MENU', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Button hover effects
    resumeButton.on('pointerover', () => {
      resumeButton.setFillStyle(0x2a4a2a);
      resumeText.setColor('#00ff00');
    });
    
    resumeButton.on('pointerout', () => {
      resumeButton.setFillStyle(0x1a1a1a);
      resumeText.setColor('#ffffff');
    });
    
    quitButton.on('pointerover', () => {
      quitButton.setFillStyle(0x4a2a2a);
      quitText.setColor('#ff4444');
    });
    
    quitButton.on('pointerout', () => {
      quitButton.setFillStyle(0x1a1a1a);
      quitText.setColor('#ffffff');
    });
    
    // Button click handlers
    resumeButton.on('pointerdown', () => {
      this.hidePauseMenu();
    });
    
    quitButton.on('pointerdown', () => {
      this.quitToMenu();
    });
    
    // Add all elements to container
    this.pauseMenu.add([menuBg, title, resumeButton, resumeText, quitButton, quitText]);
    
    console.log('Pause menu created and shown');
  }

  hidePauseMenu() {
    console.log('Hiding pause menu');
    this.isPaused = false;
    
    // Resume the background music
    if (this.backgroundMusic && this.backgroundMusic.isPaused) {
      this.backgroundMusic.resume();
    }
    
    // Remove pause overlay
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
    
    // Remove pause menu
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }
    
    console.log('Pause menu hidden and game resumed');
  }

  quitToMenu() {
    console.log('Quitting to main menu...');
    
    // Stop background music
    this.stopBackgroundMusic();
    
    // If in multiplayer, disconnect from socket
    if (this.isMultiplayer && this.socket) {
      console.log('Disconnecting from multiplayer room...');
      this.socket.emit('playerDisconnected', { 
        roomId: this.roomId, 
        playerId: this.socket.id 
      });
      this.socket.disconnect();
    }
    
    // Clear any intervals or timers
    if (this.gameStateInterval) {
      clearInterval(this.gameStateInterval);
      this.gameStateInterval = null;
    }
    
    // Transition to main menu (training/multiplayer selection)
    this.scene.start('MainMenuScene');
  }

  // Scene cleanup - called when scene is destroyed
  shutdown() {
    this.stopBackgroundMusic();
    
    // Clean up pause menu if it exists
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }
    
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
    
    // Clean up invincibility timer
    if (this.otherPlayerInvincibilityTimer) {
      clearTimeout(this.otherPlayerInvincibilityTimer);
      this.otherPlayerInvincibilityTimer = null;
    }
    
    super.shutdown();
  }

  updateCooldownBars() {
    if (!this.playerSpellCooldownFill) return; // Bars not created yet
    
    const barWidth = 296; // 300 - 4 (2px padding each side)
    
    // Update player spell cooldown bar
    const spellCooldownPercent = Math.max(0, this.currentSpellCooldown) / this.currentSpell.cooldown;
    const spellBarWidth = Math.max(0, barWidth * spellCooldownPercent);
    
    this.playerSpellCooldownFill.setSize(spellBarWidth, 14);
    
    if (this.currentSpellCooldown > 0) {
      const timeLeft = Math.ceil(this.currentSpellCooldown / 1000);
      this.playerSpellCooldownText.setText(`SPELL COOLDOWN: ${timeLeft}s`);
    } else {
      this.playerSpellCooldownText.setText('SPELL READY');
    }
    
    // Update player mega spell cooldown bar
    const megaCooldownPercent = Math.max(0, this.currentMegaSpellCooldown) / this.currentMegaSpell.cooldown;
    const megaBarWidth = Math.max(0, barWidth * megaCooldownPercent);
    
    this.playerMegaCooldownFill.setSize(megaBarWidth, 14);
    
    if (this.currentMegaSpellCooldown > 0) {
      const timeLeft = Math.ceil(this.currentMegaSpellCooldown / 1000);
      this.playerMegaCooldownText.setText(`MEGA COOLDOWN: ${timeLeft}s`);
    } else if (this.megaSpellUses > 0) {
      this.playerMegaCooldownText.setText('MEGA SPELL READY');
    } else {
      this.playerMegaCooldownText.setText('NO MEGA USES LEFT');
    }
  }

  update() {
    if (!this.gameStarted) return;
    
    // Handle ESC key to return to main menu
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.quitToMenu();
      return;
    }
    
    // Don't process game input when paused
    if (this.isPaused) return;
    
    this.handlePlayerMovement();
    this.handleSpellUsage();
    
    // Debug: Test collision with T key
    if (this.tKey.isDown) {
      this.testDecorationCollision();
    }
    
    // Update vulnerability cooldown
    if (!this.isVulnerable && this.vulnerabilityCooldown > 0) {
      this.vulnerabilityCooldown -= 16; // 60 FPS = ~16ms per frame
      if (this.vulnerabilityCooldown <= 0) {
        this.isVulnerable = true;
        this.vulnerabilityCooldown = 0;
        console.log('Player is now vulnerable again!');
      }
    }
    
    // Update spell cooldowns
    if (this.currentSpellCooldown > 0) {
      this.currentSpellCooldown -= 16;
    }
    if (this.currentMegaSpellCooldown > 0) {
      this.currentMegaSpellCooldown -= 16;
    }
    
    // Update cooldown bars
    this.updateCooldownBars();
    
    // Update aura position to follow player
    if (this.spellAura && this.player) {
      this.spellAura.setPosition(this.player.x, this.player.y);
    }
    
    // Update other player aura position
    if (this.otherPlayerAura && this.otherPlayer) {
      this.otherPlayerAura.setPosition(this.otherPlayer.x, this.otherPlayer.y);
    }
    
    // Update mega spell marks
    this.updateMegaSpellMarksDisplay();
    
    // Update enemy UI
    this.updateEnemyUI();
  }

  setupMultiplayerEvents() {
    this.socket.on('playerMoved', (data) => {
      if (data.playerId !== this.playerId && this.otherPlayer && this.otherPlayer.playerId === data.playerId) {
        console.log(`Received movement from ${data.playerId}: ${data.x}, ${data.y}`);
        this.otherPlayer.setPosition(data.x, data.y);
        this.otherPlayer.setVelocity(data.velocityX, data.velocityY);
        
        // Update animation
        if (data.animation && this.anims.exists(data.animation)) {
          this.otherPlayer.anims.play(data.animation);
        }
      }
    });

    this.socket.on('playerCastSpell', (data) => {
      if (data.playerId !== this.playerId && this.otherPlayer && this.otherPlayer.playerId === data.playerId) {
        console.log(`Received spell cast from ${data.playerId}: ${data.spellType}`);
        this.createSpellEffectFromOtherPlayer(data.spellType, data.direction, data.x, data.y);
      }
    });

    this.socket.on('playerDamaged', (data) => {
      // Damage event logging reduced
      
      if (data.targetId === this.playerId) {
        // CRITICAL: Prevent self-damage - don't take damage from your own attacks
        if (data.attackerId === this.playerId) {
          console.error(`[${this.playerId}] CRITICAL: Blocked self-damage from ${data.attackerId}!`);
          return;
        }
        
        console.log(`[${this.playerId}] Taking damage: ${data.damage} from ${data.attackerId}`);
        console.log(`[${this.playerId}] My health before damage: ${this.playerHealth}`);
        this.takeDamage(data.damage);
        console.log(`[${this.playerId}] My health after damage: ${this.playerHealth}`);
      } else {
        console.log(`[${this.playerId}] Damage event not for me (target: ${data.targetId})`);
      }
    });
    
    this.socket.on('playerDefeated', (data) => {
      if (data.playerId !== this.playerId && this.otherPlayer) {
        console.log(`Other player defeated: ${data.playerId}`);
        this.handleOtherPlayerDefeat();
      }
    });

    this.socket.on('gameOver', (data) => {
      console.log(`Game over! Winner: ${data.winnerId}, Loser: ${data.loserId}`);
      const result = data.winnerId === this.playerId ? 'victory' : 'defeat';
      this.scene.start('GameOverScene', { result, socket: this.socket });
    });



    // Handle game start event
    this.socket.on('gameStart', (data) => {
      console.log('Received gameStart event with players:', data.players);
      console.log('My player ID:', this.playerId);
      console.log('My socket ID:', this.socket.id);
      console.log('Is multiplayer:', this.isMultiplayer);
      console.log('Other player exists:', !!this.otherPlayer);
      
      // If we don't have an other player yet, create them
      if (!this.otherPlayer && this.isMultiplayer) {
        const otherPlayer = data.players.find(p => p.id !== this.playerId);
        console.log('Found other player from game start:', otherPlayer);
        if (otherPlayer) {
          console.log('Creating other player from game start:', otherPlayer);
          this.createOtherPlayerFromData(otherPlayer);
        } else {
          console.log('No other player found in game start data');
          console.log('Available players:', data.players);
          console.log('Looking for player not equal to:', this.playerId);
        }
      } else if (this.otherPlayer) {
        console.log('Other player already exists, not creating from game start');
      }
    });

    // Debug: Log all socket events (commented out as onAny might not exist in this socket.io version)
    // this.socket.onAny((eventName, ...args) => {
    //   console.log(`Socket event received: ${eventName}`, args);
    // });

    // Also handle playerJoined event for creating other player
    this.socket.on('playerJoined', (data) => {
      console.log(`Player joined: ${data.playerName}`);
      console.log('All players:', data.players);
      console.log('My player ID:', this.playerId);
      console.log('My socket ID:', this.socket.id);
      console.log('My room ID:', this.roomId);
      
      // Find the other player (not this player)
      const otherPlayer = data.players.find(p => p.id !== this.playerId);
      console.log('Found other player:', otherPlayer);
      
      if (otherPlayer && !this.otherPlayer) {
        console.log('Creating other player from playerJoined:', otherPlayer);
        this.createOtherPlayerFromData(otherPlayer);
      } else if (!otherPlayer) {
        console.log('No other player found in players list');
      } else if (this.otherPlayer) {
        console.log('Other player already exists');
      }
    });



    // Handle items created by host
    this.socket.on('itemsCreated', (data) => {
      console.log('Received items from host:', data.items.length);
      console.log('Items data:', data.items);
      console.log('My socket ID:', this.socket.id);
      console.log('My room ID:', this.roomId);
      this.createItemsFromData(data.items);
    });

    // Handle decorations created by host
    this.socket.on('decorationsCreated', (data) => {
      console.log('Received decorations from host:', data.decorations.length);
      console.log('Decorations data:', data.decorations);
      console.log('My socket ID:', this.socket.id);
      console.log('My room ID:', this.roomId);
      console.log('Is host:', this.isHost);
      // Decorations removed - no longer needed
    });

    // Handle item pickup from other player
    this.socket.on('itemPickedUp', (data) => {
      console.log(`Received item pickup from ${data.playerId}: ${data.itemType}`);
      // Remove the item from this player's view
      const itemToRemove = this.items.find(item => 
        item.x === data.itemX && 
        item.y === data.itemY && 
        item.itemType === data.itemType
      );
      if (itemToRemove) {
        itemToRemove.destroy();
        this.items = this.items.filter(item => item !== itemToRemove);
        console.log(`Removed item ${data.itemType} from view`);
      }
    });

    // Handle new item spawn from other player
    this.socket.on('itemSpawned', (data) => {
      console.log(`Received item spawn from ${data.playerId}: ${data.itemType} at (${data.x}, ${data.y})`);
      this.createItemFromData(data);
    });

    // Handle game state updates from other player
    this.socket.on('gameStateUpdate', (data) => {
      if (data.playerId !== this.playerId) {
        console.log(`Received game state from ${data.playerId}`);
        console.log('Game state data:', data);
        console.log('Other player exists before update:', !!this.otherPlayer);
        this.updateFromGameState(data);
        console.log('Other player exists after update:', !!this.otherPlayer);
        if (this.otherPlayer) {
          console.log('Other player position after update:', this.otherPlayer.x, this.otherPlayer.y);
          console.log('Other player visible after update:', this.otherPlayer.visible);
        }
      }
    });
  }

  handlePlayerMovement() {
    if (!this.player || this.isDefeated) return;
    
    // Use walk speed with speed multiplier from wearables
    const baseSpeed = 350;
    const speed = baseSpeed * this.speedMultiplier;
    let isMoving = false;
    let newAnimation = null;
    

    

    
    // Reset velocity
    this.player.setVelocity(0);
    
    // Handle movement with WASD keys (using walk animation)
    if (this.aKey.isDown) {
      this.player.setVelocityX(-speed);
      this.currentDirection = 'left';
      isMoving = true;
      newAnimation = `${this.selectedCharacter}_walk_left`;
    } else if (this.dKey.isDown) {
      this.player.setVelocityX(speed);
      this.currentDirection = 'right';
      isMoving = true;
      newAnimation = `${this.selectedCharacter}_walk_right`;
    }
    
    if (this.wKey.isDown) {
      this.player.setVelocityY(-speed);
      this.currentDirection = 'up';
      isMoving = true;
      newAnimation = `${this.selectedCharacter}_walk_up`;
    } else if (this.sKey.isDown) {
      this.player.setVelocityY(speed);
      this.currentDirection = 'down';
      isMoving = true;
      newAnimation = `${this.selectedCharacter}_walk_down`;
    }
    
    // Handle animations with safety checks (only if not spellcasting)
    if (!this.isSpellcasting) {
      if (isMoving && newAnimation) {
        if (this.anims.exists(newAnimation)) {
          if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== newAnimation) {
            this.player.anims.play(newAnimation, true);
          }
        } else {
          console.error(`Animation ${newAnimation} does not exist!`);
        }
      } else {
        // Stop animation when not moving - character stays in last frame
        if (this.player.anims.isPlaying) {
          this.player.anims.stop();
        }
      }
    }

    // Movement data is now sent via constant game state sync
    // No need to send individual movement events
  }



  handleSpellUsage() {
    // Handle regular spell with O key
    if (this.oKey.isDown && !this.isSpellcasting && this.currentSpellCooldown <= 0) {
      this.useSpell();
    }
    
    // Handle mega spell with P key
    if (this.pKey.isDown && !this.isSpellcasting && this.megaSpellUses > 0 && this.currentMegaSpellCooldown <= 0) {
      this.useMegaSpell();
    }
  }

  pickupItem(player, item) {
    // Safety check - ensure item exists and is valid
    if (!item || !item.active) {
      console.log('Item is null or already destroyed, skipping pickup');
      return;
    }
    
    // Store item data before destruction
    const itemData = {
      itemType: item.itemType,
      category: item.category,
      frame: item.frame,
      effect: item.effect,
      mpCost: item.mpCost,
      amount: item.amount,
      duration: item.duration
    };
    
    // Remove item from items array first
    this.items = this.items.filter(i => i !== item);
    
    // Safely destroy the item
    if (item && item.destroy) {
      try {
        item.destroy();
      } catch (error) {
        console.log('Error destroying item:', error);
      }
    }
    
    // Send item pickup event to other players
    if (this.isMultiplayer && this.socket) {
      this.socket.emit('itemPickedUp', {
        playerId: this.playerId,
        itemType: itemData.itemType,
        itemX: item.x || 0,
        itemY: item.y || 0,
        roomId: this.roomId
      });
      
      // Also send immediate game state update
      this.sendGameState();
    }
    
    // Add item to appropriate slot based on category
    if (itemData.category === 'spell') {
      this.playerSpell = itemData;
      if (this.spellImage) {
        this.spellImage.setFrame(itemData.frame);
        this.spellImage.setVisible(true);
      }
      if (this.spellText) {
        this.spellText.setText(this.formatItemName(itemData.itemType) || 'SPELL');
      }
      // Create aura effect based on spell type
      this.createSpellAura(itemData.effect);
    } else if (itemData.category === 'wearable') {
      // Store wearable in UI slot and apply effect
      this.playerWearable = itemData;
      if (this.wearableImage) {
        this.wearableImage.setFrame(itemData.frame);
        this.wearableImage.setVisible(true);
      }
      if (this.wearableText) {
        this.wearableText.setText(this.formatWearableDescription(itemData.itemType, itemData.effect));
      }
      
      // Apply temporary stat boost based on wearable type (5 seconds)
      this.applyWearableStats(itemData.effect);
      console.log(`Applied temporary stat boost: ${itemData.effect} for 5 seconds`);
    } else if (itemData.category === 'potion') {
      this.playerPotion = itemData;
      if (this.potionImage) {
        this.potionImage.setFrame(itemData.frame);
        this.potionImage.setVisible(true);
      }
      if (this.potionText) {
        this.potionText.setText(this.formatItemName(itemData.itemType));
      }
    }
    
    console.log(`Picked up ${itemData.itemType}!`);
  }
  
  // Cleanup method to prevent memory leaks and physics errors
  shutdown() {
    console.log('GameScene shutting down...');
    
    // Clear all timers
    if (this.gameStateTimer) {
      this.gameStateTimer.destroy();
    }
    
    // Clear all items safely
    if (this.items) {
      this.items.forEach(item => {
        if (item && item.destroy) {
          try {
            item.destroy();
          } catch (error) {
            console.log('Error destroying item during shutdown:', error);
          }
        }
      });
      this.items = [];
    }
    
    // Clear active spells
    if (this.activeSpells) {
      this.activeSpells.forEach(spell => {
        if (spell && spell.destroy) {
          try {
            spell.destroy();
          } catch (error) {
            console.log('Error destroying spell during shutdown:', error);
          }
        }
      });
      this.activeSpells = [];
    }
    
    // Clear other player spells
    if (this.otherPlayerSpells) {
      this.otherPlayerSpells.forEach(spell => {
        if (spell && spell.destroy) {
          try {
            spell.destroy();
          } catch (error) {
            console.log('Error destroying other player spell during shutdown:', error);
          }
        }
      });
      this.otherPlayerSpells = [];
    }
    
    // Clear active wearables
    if (this.activeWearables) {
      this.activeWearables.forEach(wearable => {
        if (wearable && wearable.destroy) {
          try {
            wearable.destroy();
          } catch (error) {
            console.log('Error destroying wearable during shutdown:', error);
          }
        }
      });
      this.activeWearables = [];
    }
    
    // Remove socket listeners
    if (this.socket) {
      this.socket.off('playerJoined');
      this.socket.off('playerLeft');
      this.socket.off('playerMoved');
      this.socket.off('playerSpellCast');
      this.socket.off('playerDamaged');
      this.socket.off('playerDefeated');
      this.socket.off('itemSpawned');
      this.socket.off('itemPickedUp');
      this.socket.off('gameStateUpdate');
      this.socket.off('itemsData');
    }
    

    
    console.log('GameScene shutdown complete');
  }
  
  formatItemName(itemType) {
    if (!itemType) return '';
    return itemType.replace(/_/g, ' ').toUpperCase();
  }

  formatWearableDescription(itemType, effect, remainingTime = null) {
    if (!itemType || !effect) return 'WEARABLE';
    
    const descriptions = {
      'armor': 'ARMOR: 50% DMG REDUCTION',
      'speed_boost': 'SPEED VEST: 50% SPEED BOOST',
      'damage_boost': 'BELT: 50% DMG BOOST'
    };
    
    const baseDescription = descriptions[effect] || this.formatItemName(itemType);
    
    if (remainingTime !== null) {
      const seconds = Math.ceil(remainingTime / 1000);
      return `${baseDescription} (${seconds}S)`;
    }
    
    return `${baseDescription} (5S)`;
  }

  updateHealthBar() {
    console.log(`[${this.playerId}] updateHealthBar called - playerHealth: ${this.playerHealth}`);
    const healthPercent = this.playerHealth / 100;
    this.healthBarFill.width = 296 * healthPercent;
    this.healthText.setText(`HEALTH: ${this.playerHealth}`);
    
    // Change color based on health with anime colors
    if (this.playerHealth > 50) {
      this.healthBarFill.fillColor = 0xff6b6b; // Anime red
    } else if (this.playerHealth > 25) {
      this.healthBarFill.fillColor = 0xffa726; // Orange
    } else {
      this.healthBarFill.fillColor = 0xff4757; // Dark red
    }
  }



  useSpell() {
    if (!this.player || this.isSpellcasting || this.currentSpellCooldown > 0 || this.isDefeated) {
      console.log('Cannot cast spell: player not ready, already casting, on cooldown, or defeated!');
      return;
    }
    
    console.log(`Casting spell: ${this.currentSpell.name}`);
    this.isSpellcasting = true;
    
    // Create spell aura
    this.createSpellAura(this.currentSpell.effect);
    
    // Play spellcast animation
    const spellcastAnimation = `${this.selectedCharacter}_spellcast_${this.currentDirection}`;
    if (this.anims.exists(spellcastAnimation)) {
      this.player.anims.play(spellcastAnimation);
      console.log(`Playing spellcast animation: ${spellcastAnimation}`);
      
      // Return to normal state after spellcast completes
      this.time.delayedCall(700, () => {
        this.isSpellcasting = false;
        if (!this.isDefeated) {
          // Stop animation - character stays in last frame
          this.player.anims.stop();
        }
      });
    } else {
      console.error(`Spellcast animation ${spellcastAnimation} does not exist!`);
      this.isSpellcasting = false;
    }
    
    // Create spell object for tracking
    const spell = {
      x: this.player.x,
      y: this.player.y,
      spellType: this.currentSpell.effect,
      direction: this.currentDirection,
      damage: Math.floor(this.currentSpell.damage * this.damageMultiplier)
    };
    this.activeSpells.push(spell);
    
    // Set cooldown
    this.currentSpellCooldown = this.currentSpell.cooldown;
    
    // Create spell effect based on type
    this.createSpellEffect(this.currentSpell.effect);
    
    // Send spell data to other players (only in multiplayer)
    if (this.isMultiplayer && this.socket && this.gameStarted) {
      this.socket.emit('playerCastSpell', {
        spellType: this.currentSpell.effect,
        direction: this.currentDirection,
        x: this.player.x,
        y: this.player.y,
        playerId: this.playerId,
        roomId: this.roomId
      });
    }
    
    // Remove spell after 2 seconds
    this.time.delayedCall(2000, () => {
      this.activeSpells = this.activeSpells.filter(s => s !== spell);
    });
  }

  useMegaSpell() {
    if (!this.player || this.isSpellcasting || this.megaSpellUses <= 0 || this.currentMegaSpellCooldown > 0 || this.isDefeated) {
      console.log('Cannot cast mega spell: no uses left, on cooldown, already casting, or defeated!');
      return;
    }
    
    console.log(`Casting mega spell: ${this.currentMegaSpell.name}`);
    this.isSpellcasting = true;
    this.megaSpellUses--;
    
    // Update mega spell marks
    this.updateMegaSpellMarksDisplay();
    
    // Create spell aura
    this.createSpellAura(this.currentMegaSpell.effect);
    
    // Play spellcast animation
    const spellcastAnimation = `${this.selectedCharacter}_spellcast_${this.currentDirection}`;
    if (this.anims.exists(spellcastAnimation)) {
      this.player.anims.play(spellcastAnimation);
      console.log(`Playing mega spellcast animation: ${spellcastAnimation}`);
      
      // Return to normal state after spellcast completes
      this.time.delayedCall(700, () => {
        this.isSpellcasting = false;
        if (!this.isDefeated) {
          // Stop animation - character stays in last frame
          this.player.anims.stop();
        }
      });
    } else {
      console.error(`Spellcast animation ${spellcastAnimation} does not exist!`);
      this.isSpellcasting = false;
    }
    
    // Create spell object for tracking
    const spell = {
      x: this.player.x,
      y: this.player.y,
      spellType: this.currentMegaSpell.effect,
      direction: this.currentDirection,
      damage: Math.floor(this.currentMegaSpell.damage * this.damageMultiplier)
    };
    this.activeSpells.push(spell);
    
    // Set cooldown
    this.currentMegaSpellCooldown = this.currentMegaSpell.cooldown;
    
    // Create spell effect based on type
    this.createSpellEffect(this.currentMegaSpell.effect);
    
    // Send spell data to other players (only in multiplayer)
    if (this.isMultiplayer && this.socket && this.gameStarted) {
      this.socket.emit('playerCastSpell', {
        spellType: this.currentMegaSpell.effect,
        direction: this.currentDirection,
        x: this.player.x,
        y: this.player.y,
        playerId: this.playerId,
        roomId: this.roomId
      });
    }
    
    // Remove spell after 3 seconds (longer for mega spells)
    this.time.delayedCall(3000, () => {
      this.activeSpells = this.activeSpells.filter(s => s !== spell);
    });
  }

  applyWearableStats(effect) {
    // Create wearable effect with 5-second duration
    const wearable = {
      effect: effect,
      startTime: Date.now(),
      duration: 5000, // 5 seconds
      active: true
    };
    
    // Apply effect based on wearable type
    switch (effect) {
      case 'armor':
        this.armorReduction = 0.5; // 50% damage reduction
        console.log('Armor equipped: 50% damage reduction for 5 seconds');
        break;
      case 'speed_boost':
        this.speedMultiplier = 1.5; // 50% speed increase
        console.log('Speed vest equipped: 50% speed increase for 5 seconds');
        break;
      case 'damage_boost':
        this.damageMultiplier = 1.5; // 50% damage increase
        console.log('Belt equipped: 50% damage increase for 5 seconds');
        break;
    }
    
    // Add to active wearables
    this.activeWearables.push(wearable);
    
    // Start countdown timer to update wearable text
    const countdownTimer = this.time.addEvent({
      delay: 1000, // Update every second
      callback: () => {
        if (wearable.active && this.playerWearable && this.wearableText) {
          const remainingTime = wearable.startTime + wearable.duration - Date.now();
          if (remainingTime > 0) {
            this.wearableText.setText(this.formatWearableDescription(this.playerWearable.itemType, wearable.effect, remainingTime));
          }
        }
      },
      loop: true
    });
    
    // Store the timer reference for cleanup
    wearable.countdownTimer = countdownTimer;
    
    // Set timer to remove effect after duration
    this.time.delayedCall(wearable.duration, () => {
      this.removeWearableEffect(wearable);
    });
  }

  removeWearableEffect(wearable) {
    if (!wearable.active) return;
    
    wearable.active = false;
    
    // Clean up countdown timer
    if (wearable.countdownTimer) {
      wearable.countdownTimer.destroy();
      wearable.countdownTimer = null;
    }
    
    // Remove effect based on type
    switch (wearable.effect) {
      case 'armor':
        this.armorReduction = 0;
        console.log('Armor effect expired');
        break;
      case 'speed_boost':
        this.speedMultiplier = 1;
        console.log('Speed boost expired');
        break;
      case 'damage_boost':
        this.damageMultiplier = 1;
        console.log('Damage boost expired');
        break;
    }
    
    // Remove from active wearables
    this.activeWearables = this.activeWearables.filter(w => w !== wearable);
    
    // Clear wearable UI slot when effect expires
    if (this.playerWearable) {
      this.playerWearable = null;
      this.wearableImage.setVisible(false);
      this.wearableText.setText('WEARABLE');
      console.log('Wearable slot cleared');
    }
  }

  usePotion() {
    if (!this.playerPotion) return;
    
    console.log(`Using ${this.playerPotion.itemType}!`);
    
    // Apply potion effect
    if (this.playerPotion.effect === 'heal') {
      this.playerHealth = Math.min(100, this.playerHealth + this.playerPotion.amount);
      this.updateHealthBar();
      console.log('Healed!');
    } else if (this.playerPotion.effect === 'mp_restore') {
      this.playerMP = Math.min(100, this.playerMP + this.playerPotion.amount);
      console.log('MP restored!');
    } else if (this.playerPotion.effect === 'speed_boost') {
      this.speedMultiplier = 1.5;
      this.time.delayedCall(this.playerPotion.duration * 1000, () => {
        this.speedMultiplier = 1;
      });
      console.log('Speed boost activated!');
    }
    
    // Clear the potion
    this.playerPotion = null;
    this.potionImage.setVisible(false);
    this.potionText.setText('POTION');
  }

  createSpellAura(spellType) {
    // Remove existing aura
    if (this.spellAura) {
      this.spellAura.destroy();
    }
    
    // Create new aura based on spell type
    let auraColor;
    switch (spellType) {
      // Basic spells
      case 'lightning':
        auraColor = 0xffff00; // Yellow
        break;
      case 'fireball':
        auraColor = 0xff0000; // Red
        break;
      case 'water':
        auraColor = 0x0080ff; // Blue
        break;
      case 'dark_magic':
        auraColor = 0x800080; // Purple
        break;
      case 'nature':
        auraColor = 0x00ff00; // Green
        break;
      
      // Character-specific spells
      case 'ice':
        auraColor = 0x00ffff; // Cyan
        break;
      case 'shadow':
        auraColor = 0x400040; // Dark purple
        break;
      case 'fire':
        auraColor = 0xff4400; // Orange-red
        break;
      case 'golden':
        auraColor = 0xffd700; // Gold
        break;
      case 'iron':
        auraColor = 0x808080; // Gray
        break;
      case 'fist':
        auraColor = 0xff6600; // Orange
        break;
      case 'shadowstrike':
        auraColor = 0x200020; // Very dark purple
        break;
      case 'hellfire':
        auraColor = 0xff0000; // Bright red
        break;
      case 'crimson':
        auraColor = 0x800000; // Dark red
        break;
      case 'spear':
        auraColor = 0x8b4513; // Brown
        break;
      case 'pinkmist':
        auraColor = 0xff69b4; // Pink
        break;
      case 'code':
        auraColor = 0x00ff00; // Matrix green
        break;
      case 'goblin':
        auraColor = 0x00ff00; // Green
        break;
      
      // Mega spells
      case 'thunderstorm':
        auraColor = 0xffff00; // Bright yellow
        break;
      case 'blizzard':
        auraColor = 0xffffff; // White
        break;
      case 'shadowrealm':
        auraColor = 0x000000; // Black
        break;
      case 'inferno':
        auraColor = 0xff2200; // Bright orange-red
        break;
      case 'forestrage':
        auraColor = 0x228b22; // Forest green
        break;
      case 'void':
        auraColor = 0x4b0082; // Indigo
        break;
      case 'voidrift':
        auraColor = 0x000000; // Pure black
        break;
      case 'divine':
        auraColor = 0xffd700; // Divine gold
        break;
      case 'ironstorm':
        auraColor = 0x696969; // Dim gray
        break;
      case 'kingsfury':
        auraColor = 0xff8c00; // Dark orange
        break;
      case 'roguesgambit':
        auraColor = 0x2f2f2f; // Dark gray
        break;
      case 'devilswrath':
        auraColor = 0x8b0000; // Dark red
        break;
      case 'mafiasrevenge':
        auraColor = 0x8b0000; // Blood red
        break;
      case 'colosseum':
        auraColor = 0xd2691e; // Chocolate
        break;
      case 'trickster':
        auraColor = 0xff1493; // Deep pink
        break;
      case 'systemcrash':
        auraColor = 0xff0000; // Error red
        break;
      case 'goblinkingdom':
        auraColor = 0x32cd32; // Lime green
        break;
      default:
        return;
    }
    
    // Create aura circle around player
    this.spellAura = this.add.circle(this.player.x, this.player.y, 40, auraColor, 0.3);
    this.spellAura.setStrokeStyle(2, auraColor, 0.8);
    
    // Make aura follow player
    this.spellAura.setDepth(1);
  }

  createOtherPlayerAura(spellType) {
    // Remove existing other player aura
    if (this.otherPlayerAura) {
      this.otherPlayerAura.destroy();
    }
    
    // Create new aura based on spell type
    let auraColor;
    switch (spellType) {
      case 'lightning':
        auraColor = 0xffff00; // Yellow
        break;
      case 'fireball':
        auraColor = 0xff0000; // Red
        break;
      case 'water':
        auraColor = 0x0080ff; // Blue
        break;
      default:
        return;
    }
    
    // Create aura circle around other player
    this.otherPlayerAura = this.add.circle(this.otherPlayer.x, this.otherPlayer.y, 40, auraColor, 0.3);
    this.otherPlayerAura.setStrokeStyle(2, auraColor, 0.8);
    
    // Make aura follow other player
    this.otherPlayerAura.setDepth(1);
  }

  createSpellEffect(spellType) {
    // Create spell projectile or effect based on type - PLAYER'S OWN SPELLS
    console.log(`createSpellEffect called with spellType: ${spellType}`);
    
    switch (spellType) {
      // Basic spells - Use consistent FromPosition functions
      case 'lightning':
        this.createLightningEffect();
        break;
      case 'fireball':
        this.createFireballEffect();
        break;
      case 'water':
        this.createWaterEffect();
        break;
      case 'dark_magic':
        this.createDarkMagicEffect();
        break;
      case 'nature':
        this.createNatureEffect();
        break;
      case 'void':
        this.createVoidEffect();
        break;
      
      // Character-specific spells
      case 'ice':
        this.createIceShardEffect();
        break;
      case 'shadow':
        this.createShadowBoltEffect();
        break;
      case 'fire':
        this.createFireballEffect(); // Same as fireball
        break;
      case 'golden':
        this.createGoldenRayEffect();
        break;
      case 'iron':
        this.createIronShotEffect();
        break;
      case 'dagger':
        this.createDaggerEffect();
        break;
      case 'missile':
        this.createMissileEffect();
        break;
      case 'magma':
        this.createMagmaEffect();
        break;
      case 'fist':
        this.createFistBlastEffect();
        break;
      case 'shadowstrike':
        this.createShadowStrikeEffect();
        break;
      case 'hellfire':
        this.createHellfireEffect();
        break;
      case 'crimson':
        this.createCrimsonShotEffect();
        break;
      case 'spear':
        this.createGladiatorSpearEffect();
        break;
      case 'pinkmist':
        this.createPinkMistEffect();
        break;
      case 'pink':
        this.createPinkMistEffect();
        break;
      case 'code':
        this.createCodeBlastEffect();
        break;
      case 'goblin':
        this.createGoblinMagicEffect();
        break;
      case 'linesofcode':
        this.createLinesOfCodeEffect();
        break;
      case 'rainbowspheres':
        console.log(`Calling createRainbowSpheresEffectFromPosition with player position: ${this.player.x}, ${this.player.y}, direction: ${this.currentDirection}`);
        this.createRainbowSpheresEffectFromPosition(this.player.x, this.player.y, this.currentDirection);
        break;
      case 'rainbow':
        this.createRainbowSpheresEffectFromPosition(this.player.x, this.player.y, this.currentDirection);
        break;
      
      // Mega spells
      case 'thunderstorm':
        this.createThunderstormEffectFromPosition(this.player.x, this.player.y, this.currentDirection);
        break;
      case 'blizzard':
        this.createBlizzardEffect();
        break;
      case 'shadowrealm':
        this.createShadowRealmEffect();
        break;
      case 'inferno':
        this.createInfernoEffect();
        break;
      case 'forestrage':
        this.createForestRageEffect();
        break;
      case 'void':
        this.createVoidBlastEffect();
        break;
      case 'voidrift':
        this.createVoidRiftEffect();
        break;
      case 'divine':
        this.createDivineJudgmentEffect();
        break;
      case 'ironstorm':
        this.createIronStormEffect();
        break;
      case 'kingsfury':
        this.createKingsFuryEffect();
        break;
      case 'colosseum':
        this.createColosseumFuryEffect();
        break;
      case 'trickster':
        this.createTricksterChaosEffect();
        break;
      case 'systemcrash':
        this.createSystemCrashEffect();
        break;
      case 'goblinkingdom':
        this.createGoblinKingdomEffect();
        break;
      case 'roguesgambit':
        this.createRoguesGambitEffect();
        break;
      case 'devilswrath':
        this.createDevilsWrathEffect();
        break;
      case 'mafiasrevenge':
        this.createMafiasRevengeEffect();
        break;
      case 'colosseum':
        this.createColosseumFuryEffect();
        break;
      case 'trickster':
        this.createTricksterChaosEffectFromPosition(this.player.x, this.player.y, this.currentDirection);
        break;
      case 'systemcrash':
        this.createSystemCrashEffectFromPosition(this.player.x, this.player.y, this.currentDirection);
        break;
      case 'goblinkingdom':
        this.createGoblinKingdomEffectFromPosition(this.player.x, this.player.y, this.currentDirection);
        break;
    }
  }

  createSpellEffectFromOtherPlayer(spellType, direction, x, y) {
    // Play spellcast animation for other player
    if (this.otherPlayer) {
      const spellcastAnimation = `${this.otherPlayerCharacter}_spellcast_${direction}`;
      if (this.anims.exists(spellcastAnimation)) {
        this.otherPlayer.anims.play(spellcastAnimation);
        console.log(`Playing other player spellcast animation: ${spellcastAnimation}`);
        
        // Return to normal state after spellcast completes
        this.time.delayedCall(700, () => {
          // Stop animation - character stays in last frame
          this.otherPlayer.anims.stop();
        });
      } else {
        console.error(`Other player spellcast animation ${spellcastAnimation} does not exist!`);
      }
    }
    
    // Create spell effect from other player's position - INCOMING SPELLS
    switch (spellType) {
      // Basic spells
      case 'lightning':
        this.createLightningEffectFromPosition(x, y, direction);
        break;
      case 'fireball':
        this.createFireballEffectFromPosition(x, y, direction);
        break;
      case 'water':
        this.createWaterEffectFromPosition(x, y, direction);
        break;
      case 'dark_magic':
        this.createDarkMagicEffectFromPosition(x, y, direction);
        break;
      case 'nature':
        this.createNatureEffectFromPosition(x, y, direction);
        break;
      case 'void':
        this.createVoidEffectFromPosition(x, y, direction);
        break;
      
      // Character-specific spells
      case 'ice':
        this.createIceShardEffectFromPosition(x, y, direction);
        break;
      case 'shadow':
        this.createShadowBoltEffectFromPosition(x, y, direction);
        break;
      case 'fire':
        this.createFireballEffectFromPosition(x, y, direction);
        break;
      case 'golden':
        this.createGoldenRayEffectFromPosition(x, y, direction);
        break;
      case 'iron':
        this.createIronShotEffectFromPosition(x, y, direction);
        break;
      case 'dagger':
        this.createDaggerEffectFromPosition(x, y, direction);
        break;
      case 'missile':
        this.createMissileEffectFromPosition(x, y, direction);
        break;
      case 'magma':
        this.createMagmaEffectFromPosition(x, y, direction);
        break;
      case 'fist':
        this.createFistBlastEffectFromPosition(x, y, direction);
        break;
      case 'shadowstrike':
        this.createShadowStrikeEffectFromPosition(x, y, direction);
        break;
      case 'hellfire':
        this.createHellfireEffectFromPosition(x, y, direction);
        break;
      case 'crimson':
        this.createCrimsonShotEffectFromPosition(x, y, direction);
        break;
      case 'spear':
        this.createGladiatorSpearEffectFromPosition(x, y, direction);
        break;
      case 'pinkmist':
        this.createPinkMistEffectFromPosition(x, y, direction);
        break;
      case 'pink':
        this.createPinkMistEffectFromPosition(x, y, direction);
        break;
      case 'code':
        this.createCodeBlastEffectFromPosition(x, y, direction);
        break;
      case 'goblin':
        this.createGoblinMagicEffectFromPosition(x, y, direction);
        break;
      case 'rainbowspheres':
        this.createRainbowSpheresEffectFromPosition(x, y, direction);
        break;
      case 'rainbow':
        this.createRainbowSpheresEffectFromPosition(x, y, direction);
        break;
      
      // Mega spells
      case 'thunderstorm':
        this.createThunderstormEffectFromPosition(x, y, direction);
        break;
      case 'blizzard':
        this.createBlizzardEffectFromPosition(x, y, direction);
        break;
      case 'shadowrealm':
        this.createShadowRealmEffectFromPosition(x, y, direction);
        break;
      case 'inferno':
        this.createInfernoEffectFromPosition(x, y, direction);
        break;
      case 'forestrage':
        this.createForestRageEffectFromPosition(x, y, direction);
        break;
      case 'void':
        this.createVoidBlastEffectFromPosition(x, y, direction);
        break;
      case 'voidrift':
        this.createVoidRiftEffectFromPosition(x, y, direction);
        break;
      case 'divine':
        this.createDivineJudgmentEffectFromPosition(x, y, direction);
        break;
      case 'ironstorm':
        this.createIronStormEffectFromPosition(x, y, direction);
        break;
      case 'kingsfury':
        this.createKingsFuryEffectFromPosition(x, y, direction);
        break;
      case 'colosseum':
        this.createColosseumFuryEffectFromPosition(x, y, direction);
        break;
      case 'trickster':
        this.createTricksterChaosEffectFromPosition(x, y, direction);
        break;
      case 'systemcrash':
        this.createSystemCrashEffectFromPosition(x, y, direction);
        break;
      case 'goblinkingdom':
        this.createGoblinKingdomEffectFromPosition(x, y, direction);
        break;
      case 'roguesgambit':
        this.createRoguesGambitEffectFromPosition(x, y, direction);
        break;
      case 'devilswrath':
        this.createDevilsWrathEffectFromPosition(x, y, direction);
        break;
      case 'mafiasrevenge':
        this.createMafiasRevengeEffectFromPosition(x, y, direction);
        break;
      case 'colosseum':
        this.createColosseumFuryEffectFromPosition(x, y, direction);
        break;
      case 'trickster':
        this.createTricksterChaosEffectFromPosition(x, y, direction);
        break;
      case 'systemcrash':
        this.createSystemCrashEffectFromPosition(x, y, direction);
        break;
      case 'goblinkingdom':
        this.createGoblinKingdomEffectFromPosition(x, y, direction);
        break;
    }
  }

  takeDamage(damage) {
    console.log(`[${this.playerId}] takeDamage called with ${damage} damage. Current playerHealth: ${this.playerHealth}`);
    
    // Check if player is vulnerable
    if (!this.isVulnerable) {
      console.log(`[${this.playerId}] Player is invulnerable, damage blocked!`);
      return;
    }
    
    // Apply character defense multiplier and armor reduction
    const defenseAdjustedDamage = Math.floor(damage * this.defenseMultiplier);
    const actualDamage = Math.floor(defenseAdjustedDamage * (1 - this.armorReduction));
    
    // Show damage number
    this.showDamageNumber(this.player.x, this.player.y, actualDamage, '#ff0000');
    
    this.playerHealth = Math.max(0, this.playerHealth - actualDamage);
    console.log(`[${this.playerId}] Health after damage: ${this.playerHealth} (took ${actualDamage} damage)`);
    this.updateHealthBar();
    
    console.log(`[${this.playerId}] Took ${actualDamage} damage! Health: ${this.playerHealth} (Defense multiplier: ${this.defenseMultiplier})`);
    
    // Set vulnerability cooldown (0.5 seconds)
    this.isVulnerable = false;
    this.vulnerabilityCooldown = 500; // 500ms = 0.5 seconds
    
    // Check for game over
    if (this.playerHealth <= 0) {
      this.handlePlayerDefeat();
    }
  }
  
  handlePlayerDefeat() {
    if (this.isDefeated) return; // Prevent multiple defeat handling
    
    this.isDefeated = true;
    console.log('Player defeated!');
    
    // Play hurt animation
    const hurtAnimation = `${this.selectedCharacter}_hurt`;
    if (this.anims.exists(hurtAnimation)) {
      this.player.anims.play(hurtAnimation);
      console.log(`Playing hurt animation: ${hurtAnimation}`);
    } else {
      console.error(`Hurt animation ${hurtAnimation} does not exist!`);
    }
    
    // Stop player movement
    this.player.setVelocity(0);
    
    // Send defeat signal to server
    if (this.isMultiplayer && this.socket) {
      this.socket.emit('playerDefeated', { 
        playerId: this.playerId,
        roomId: this.roomId 
      });
    }
    
    // Show victory/defeat screen after 5 seconds
    this.time.delayedCall(5000, () => {
      this.showGameResult();
    });
  }
  
  showGameResult() {
    // Disable damage between players
    this.gameEnded = true;
    
    // Determine result based on health status
    let result;
    
    if (this.playerHealth <= 0 && this.otherPlayerHealth <= 0) {
      // Both players defeated - unlikely but handle gracefully
      result = 'defeat';
    } else if (this.playerHealth <= 0) {
      // This player is defeated - they lose
      result = 'defeat';
    } else if (this.otherPlayerHealth <= 0) {
      // Other player is defeated - this player wins
      result = 'victory';
    } else {
      // Fallback - shouldn't happen but default to defeat
      result = 'defeat';
    }
    
    console.log(`Game ended: ${result.toUpperCase()}`);
    console.log(`Player health: ${this.playerHealth}, Other player health: ${this.otherPlayerHealth}`);
    
    // Transition to game over scene
    this.scene.start('GameOverScene', { result, socket: this.socket });
  }
  
  handleOtherPlayerDefeat() {
    if (!this.otherPlayer) return;
    
    console.log('Other player defeated!');
    
    // Set other player health to 0
    this.otherPlayerHealth = 0;
    this.updateEnemyUI();
    
    // Play hurt animation for other player
    const hurtAnimation = `${this.otherPlayerCharacter}_hurt`;
    if (this.anims.exists(hurtAnimation)) {
      this.otherPlayer.anims.play(hurtAnimation);
      console.log(`Playing other player hurt animation: ${hurtAnimation}`);
    } else {
      console.error(`Other player hurt animation ${hurtAnimation} does not exist!`);
    }
    
    // Stop other player movement
    this.otherPlayer.setVelocity(0);
    
    // Show victory screen after 5 seconds
    this.time.delayedCall(5000, () => {
      this.showGameResult();
    });
  }

  createLightningEffect() {
    // Create 3 lightning bolts with different angles
    const angles = [-15, 0, 15]; // Left, center, right bolts
    const distance = 300; // Much longer range
    
    angles.forEach((angleOffset, index) => {
      const lightning = this.add.graphics();
      lightning.lineStyle(4, 0xffff00, 1);
      lightning.lineStyle(2, 0xffffff, 0.8); // White glow
      
      const startX = this.player.x;
      const startY = this.player.y;
      let endX, endY;
      
      // Calculate end position based on direction and angle
      switch (this.currentDirection) {
        case 'up':
          endX = startX + (angleOffset * 2);
          endY = startY - distance;
          break;
        case 'down':
          endX = startX + (angleOffset * 2);
          endY = startY + distance;
          break;
        case 'left':
          endX = startX - distance;
          endY = startY + (angleOffset * 2);
          break;
        case 'right':
          endX = startX + distance;
          endY = startY + (angleOffset * 2);
          break;
      }
      
      // Create zigzag lightning effect
      lightning.beginPath();
      lightning.moveTo(startX, startY);
      
      // Add zigzag points for realistic lightning
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const zigzagOffset = 20;
      
      lightning.lineTo(midX + (Math.random() - 0.5) * zigzagOffset, 
                      midY + (Math.random() - 0.5) * zigzagOffset);
      lightning.lineTo(endX, endY);
      lightning.strokePath();
      
      // Add lightning flash effect
      const flash = this.add.circle(startX, startY, 30, 0xffff00, 0.6);
      flash.setDepth(2);
      
      // Check for collision with other player along lightning path
      this.checkLightningCollisionWithOtherPlayer(startX, startY, endX, endY, 10);
      
      // Remove lightning and flash after duration
      this.time.delayedCall(150, () => {
        lightning.destroy();
        flash.destroy();
      });
    });
  }

    checkSpellCollision(spellX, spellY, spellRadius, damage) {
    // Decorations removed - no collision check needed
    
    // Don't allow damage if game has ended
    if (this.gameEnded) {
      return false;
    }
    
    // In training mode, only hit the dummy player, never the main player
    if (this.isTraining) {
      if (this.otherPlayer && this.otherPlayer.isDummy) {
        const distance = Phaser.Math.Distance.Between(spellX, spellY, this.otherPlayer.x, this.otherPlayer.y);
        if (distance < spellRadius + 32) { // 32 is player radius
          console.log(`Hit dummy player with ${damage} damage in training mode`);
          // Create explosion effect at collision point
          const explosionType = damage >= 10 ? 'fireball' : 'water';
          this.createExplosionEffect(spellX, spellY, explosionType);
          return true; // Return true to indicate collision occurred
        }
      }
      return false;
    }
    
    // In multiplayer, check collision with other player (not self)
    if (this.otherPlayer && this.otherPlayer.playerId && this.otherPlayer.playerId !== this.playerId) {
      const distance = Phaser.Math.Distance.Between(spellX, spellY, this.otherPlayer.x, this.otherPlayer.y);
      if (distance < spellRadius + 32) { // 32 is player radius
        // Apply damage multiplier to outgoing damage
        const actualDamage = Math.floor(damage * this.damageMultiplier);
        console.log(`Hit other player ${this.otherPlayer.playerId} with ${actualDamage} damage (base: ${damage}, multiplier: ${this.damageMultiplier})`);
        
        // Create explosion effect at collision point (determine type based on damage)
        const explosionType = damage >= 10 ? 'fireball' : 'water';
        this.createExplosionEffect(spellX, spellY, explosionType);
        
        // Send damage to server (only in multiplayer)
        if (this.isMultiplayer && this.socket) {
          const targetId = this.otherPlayer.playerId;
          
          // CRITICAL: Prevent self-damage at emission level
          if (targetId === this.playerId) {
            console.error(`CRITICAL ERROR: Fireball attempting to damage self! Attacker: ${this.playerId}, Target: ${targetId}`);
            return false;
          }
          
          console.log(`Emitting fireball damage: attacker=${this.playerId}, target=${targetId}, damage=${actualDamage}`);
          this.socket.emit('playerDamaged', {
            targetId: targetId,
            damage: actualDamage,
            attackerId: this.playerId,
            roomId: this.roomId
          });
        }
        
        return true; // Return true to indicate collision occurred
      }
    }
    return false; // Return false if no collision
  }

  checkSpellCollisionWithMainPlayer(spellX, spellY, spellRadius, damage) {
    // This function is for spells FROM other players hitting the main player
    // It should never be called in training mode since training spells should only hit the dummy
    
    // Don't allow damage if game has ended
    if (this.gameEnded) {
      return false;
    }
    
    // In training mode, main player should never take damage from their own spells
    if (this.isTraining) {
      return false;
    }
    
    // Check collision with main player (for spells from other player, not self)
    if (this.player) {
      const distance = Phaser.Math.Distance.Between(spellX, spellY, this.player.x, this.player.y);
      if (distance < spellRadius + 32) { // 32 is player radius
        console.log(`Main player hit with ${damage} damage`);
        
        // Create explosion effect at collision point (determine type based on damage)
        const explosionType = damage >= 10 ? 'fireball' : 'water';
        this.createExplosionEffect(spellX, spellY, explosionType);
        
        this.takeDamage(damage);
        return true; // Return true to indicate collision occurred
      }
    }
    return false; // Return false if no collision
  }
  
  createExplosionEffect(x, y, type) {
    if (type === 'fireball') {
      // Create simple fire explosion
      const explosion = this.add.circle(x, y, 40, 0xff6600, 0.6);
      explosion.setStrokeStyle(2, 0xffff00, 0.8);
      
      // Animate explosion
      this.tweens.add({
        targets: explosion,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          if (explosion && explosion.destroy) {
            explosion.destroy();
          }
        }
      });
    } else if (type === 'water') {
      // Create simple water splash effect
      const splash = this.add.circle(x, y, 35, 0x00aaff, 0.5);
      splash.setStrokeStyle(1, 0xffffff, 0.6);
      
      // Animate splash
      this.tweens.add({
        targets: splash,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          if (splash && splash.destroy) {
            splash.destroy();
          }
        }
      });
    }
  }

  checkLightningCollision(startX, startY, endX, endY, damage) {
    // Decorations removed - no collision check needed
    
    // Don't allow damage if game has ended
    if (this.gameEnded) {
      return;
    }
    
    // Check collision with main player along lightning path (not self)
    if (this.player) {
      // Calculate distance from player to lightning line
      const playerX = this.player.x;
      const playerY = this.player.y;
      
      // Vector from start to end
      const dx = endX - startX;
      const dy = endY - startY;
      
      // Vector from start to player
      const px = playerX - startX;
      const py = playerY - startY;
      
      // Project player position onto lightning line
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
      
      // Closest point on lightning line to player
      const closestX = startX + t * dx;
      const closestY = startY + t * dy;
      
      // Distance from player to lightning line
      const distance = Phaser.Math.Distance.Between(playerX, playerY, closestX, closestY);
      
      if (distance < 32) { // 32 is player radius
        console.log(`Main player hit by lightning with ${damage} damage`);
        this.takeDamage(damage);
      }
    }
  }

  checkLightningCollisionWithOtherPlayer(startX, startY, endX, endY, damage) {
    // Decorations removed - no collision check needed
    
    // Don't allow damage if game has ended
    if (this.gameEnded) {
      return;
    }
    
    // Check collision with other player along lightning path (not self)
    if (this.otherPlayer && this.otherPlayer.playerId && this.otherPlayer.playerId !== this.playerId) {
      // Calculate distance from other player to lightning line
      const otherPlayerX = this.otherPlayer.x;
      const otherPlayerY = this.otherPlayer.y;
      
      // Vector from start to end
      const dx = endX - startX;
      const dy = endY - startY;
      
      // Vector from start to other player
      const px = otherPlayerX - startX;
      const py = otherPlayerY - startY;
      
      // Project other player position onto lightning line
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
      
      // Closest point on lightning line to other player
      const closestX = startX + t * dx;
      const closestY = startY + t * dy;
      
      // Distance from other player to lightning line
      const distance = Phaser.Math.Distance.Between(otherPlayerX, otherPlayerY, closestX, closestY);
      
      if (distance < 32) { // 32 is player radius
        // Apply damage multiplier to outgoing damage
        const actualDamage = Math.floor(damage * this.damageMultiplier);
        console.log(`Other player hit by lightning with ${actualDamage} damage (base: ${damage}, multiplier: ${this.damageMultiplier})`);
        // Send damage to server (only in multiplayer)
        if (this.isMultiplayer && this.socket) {
          const targetId = this.otherPlayer.playerId;
          
          // CRITICAL: Prevent self-damage at emission level
          if (targetId === this.playerId) {
            console.error(`CRITICAL ERROR: Lightning attempting to damage self! Attacker: ${this.playerId}, Target: ${targetId}`);
            return;
          }
          
          console.log(`Emitting lightning damage: attacker=${this.playerId}, target=${targetId}, damage=${actualDamage}`);
          this.socket.emit('playerDamaged', {
            targetId: targetId,
            damage: actualDamage,
            attackerId: this.playerId,
            roomId: this.roomId
          });
        }
      }
    }
  }

  createLightningEffectFromPosition(x, y, direction) {
    // THUNDERFIST - Enhanced crackling lightning with electric arcs
    const distance = 400;
    const mainBolt = this.add.circle(x, y, 16, 0x00ffff, 1);
    mainBolt.setStrokeStyle(4, 0xffff00, 1);
    
    // Electric sparks around the bolt
    const sparkTimer = this.time.addEvent({
      delay: 25,
      loop: true,
      callback: () => {
        const spark = this.add.circle(
          mainBolt.x + Phaser.Math.Between(-12, 12),
          mainBolt.y + Phaser.Math.Between(-12, 12),
          3, 0xffffff, 0.9
        );
        this.time.delayedCall(120, () => spark.destroy());
      }
    });
    
    let targetX = x, targetY = y;
      switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: mainBolt,
      x: targetX,
      y: targetY,
      duration: 350,
      ease: 'Power3',
      onUpdate: () => {
        mainBolt.setAlpha(Phaser.Math.Between(0.8, 1.0));
        const hit = this.checkSpellCollisionWithMainPlayer(mainBolt.x, mainBolt.y, 16, 25);
        if (hit) {
          this.createExplosion(mainBolt.x, mainBolt.y, 0x00ffff);
          sparkTimer.destroy();
          mainBolt.destroy();
        }
      },
      onComplete: () => {
        sparkTimer.destroy();
        mainBolt.destroy();
      }
    });
  }

  createFireballEffect() {
    // Create huge fireball with multiple layers
    const fireballSize = 40; // Much bigger fireball
    const distance = 400; // Longer range
    
    // Create main fireball
    const fireball = this.add.circle(this.player.x, this.player.y, fireballSize, 0xff0000, 0.9);
    fireball.setStrokeStyle(4, 0xff6600, 1);
    
    // Create inner fireball for depth
    const innerFireball = this.add.circle(this.player.x, this.player.y, fireballSize * 0.6, 0xff4400, 0.8);
    innerFireball.setStrokeStyle(3, 0xffff00, 0.9);
    
    // Create fireball glow
    const glow = this.add.circle(this.player.x, this.player.y, fireballSize * 1.2, 0xff0000, 0.3);
    glow.setDepth(1);
    
    // Calculate target position
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = this.player.x; targetY = this.player.y - distance;
        break;
      case 'down':
        targetX = this.player.x; targetY = this.player.y + distance;
        break;
      case 'left':
        targetX = this.player.x - distance; targetY = this.player.y;
        break;
      case 'right':
        targetX = this.player.x + distance; targetY = this.player.y;
        break;
    }
    
    // Animate fireball with rotation and scaling
    this.tweens.add({
      targets: [fireball, innerFireball, glow],
      x: targetX,
      y: targetY,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        // Add trailing fire particles
        const particle = this.add.circle(
          fireball.x + (Math.random() - 0.5) * 20,
          fireball.y + (Math.random() - 0.5) * 20,
          3, 0xff6600, 0.7
        );
        this.time.delayedCall(200, () => particle.destroy());
        
        // Check for collision during travel (this player's spell hitting other player)
        const collision = this.checkSpellCollision(fireball.x, fireball.y, 40, 15);
        if (collision) {
          // Stop the fireball and destroy it immediately
          if (fireball) fireball.destroy();
          if (innerFireball) innerFireball.destroy();
          if (glow) glow.destroy();
        }
      },
      onComplete: () => {
        // Create explosion effect
        const explosion = this.add.circle(targetX, targetY, 60, 0xff6600, 0.8);
        explosion.setStrokeStyle(3, 0xffff00, 1);
        
        this.tweens.add({
          targets: explosion,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            explosion.destroy();
          }
        });
        
        fireball.destroy();
        innerFireball.destroy();
        glow.destroy();
      }
    });
  }

  createFireballEffectFromPosition(x, y, direction) {
    // Create huge fireball with multiple layers from other player's position
    const fireballSize = 40; // Much bigger fireball
    const distance = 400; // Longer range
    
    // Create main fireball
    const fireball = this.add.circle(x, y, fireballSize, 0xff0000, 0.9);
    fireball.setStrokeStyle(4, 0xff6600, 1);
    
    // Create inner fireball for depth
    const innerFireball = this.add.circle(x, y, fireballSize * 0.6, 0xff4400, 0.8);
    innerFireball.setStrokeStyle(3, 0xffff00, 0.9);
    
    // Create fireball glow
    const glow = this.add.circle(x, y, fireballSize * 1.2, 0xff0000, 0.3);
    glow.setDepth(1);
    
    // Calculate target position
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = x; targetY = y - distance;
        break;
      case 'down':
        targetX = x; targetY = y + distance;
        break;
      case 'left':
        targetX = x - distance; targetY = y;
        break;
      case 'right':
        targetX = x + distance; targetY = y;
        break;
    }
    
    // Animate fireball with rotation and scaling
    this.tweens.add({
      targets: [fireball, innerFireball, glow],
      x: targetX,
      y: targetY,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        // Add trailing fire particles
        const particle = this.add.circle(
          fireball.x + (Math.random() - 0.5) * 20,
          fireball.y + (Math.random() - 0.5) * 20,
          3, 0xff6600, 0.7
        );
        this.time.delayedCall(200, () => particle.destroy());
        
        // Check for collision with this player during travel (other player's spell)
        const collision = this.checkSpellCollisionWithMainPlayer(fireball.x, fireball.y, 40, 15);
        if (collision) {
          // Stop the fireball and destroy it immediately
          if (fireball) fireball.destroy();
          if (innerFireball) innerFireball.destroy();
          if (glow) glow.destroy();
        }
      },
      onComplete: () => {
        // Create explosion effect
        const explosion = this.add.circle(targetX, targetY, 60, 0xff6600, 0.8);
        explosion.setStrokeStyle(3, 0xffff00, 1);
        
        this.tweens.add({
          targets: explosion,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            explosion.destroy();
          }
        });
        
        fireball.destroy();
        innerFireball.destroy();
        glow.destroy();
      }
    });
  }

  createWaterEffectFromPosition(x, y, direction) {
    // Create 5 consecutive water balls from other player's position
    const waterBallCount = 5;
    const distance = 350; // Longer range
    const ballSize = 25;
    const delayBetweenBalls = 100; // 100ms between each ball
    
    for (let i = 0; i < waterBallCount; i++) {
      this.time.delayedCall(i * delayBetweenBalls, () => {
        // Create water ball with multiple layers
        const waterBall = this.add.circle(x, y, ballSize, 0x0080ff, 0.8);
        waterBall.setStrokeStyle(3, 0x00aaff, 1);
        
        // Create inner water ball
        const innerWaterBall = this.add.circle(x, y, ballSize * 0.7, 0x00aaff, 0.6);
        innerWaterBall.setStrokeStyle(2, 0xffffff, 0.9);
        
        // Create water trail
        const trail = this.add.circle(x, y, ballSize * 1.1, 0x0080ff, 0.3);
        trail.setDepth(1);
        
        // Calculate target position
        let targetX, targetY;
        switch (direction) {
          case 'up':
            targetX = x; targetY = y - distance;
            break;
          case 'down':
            targetX = x; targetY = y + distance;
            break;
          case 'left':
            targetX = x - distance; targetY = y;
            break;
          case 'right':
            targetX = x + distance; targetY = y;
            break;
        }
        
        // Animate water ball with wave effect
        this.tweens.add({
          targets: [waterBall, innerWaterBall, trail],
          x: targetX,
          y: targetY,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 600,
          ease: 'Power2',
          onUpdate: () => {
            // Add water splash particles
            const particle = this.add.circle(
              waterBall.x + (Math.random() - 0.5) * 15,
              waterBall.y + (Math.random() - 0.5) * 15,
              2, 0x00aaff, 0.6
            );
            this.time.delayedCall(150, () => particle.destroy());
            
            // Check for collision during travel (other player's spell hitting this player)
            const collision = this.checkSpellCollision(waterBall.x, waterBall.y, 25, 5);
            if (collision) {
              // Stop the water ball and destroy it immediately
              if (waterBall) waterBall.destroy();
              if (innerWaterBall) innerWaterBall.destroy();
              if (trail) trail.destroy();
            }
          },
          onComplete: () => {
            // Create splash effect
            const splash = this.add.circle(targetX, targetY, 40, 0x00aaff, 0.5);
            splash.setStrokeStyle(2, 0xffffff, 0.8);
            
            this.tweens.add({
              targets: splash,
              scaleX: 1.5,
              scaleY: 1.5,
              alpha: 0,
              duration: 250,
              onComplete: () => {
                splash.destroy();
              }
            });
            
            waterBall.destroy();
            innerWaterBall.destroy();
            trail.destroy();
          }
        });
      });
    }
  }

  createWaterEffect() {
    // Create 5 consecutive water balls
    const waterBallCount = 5;
    const distance = 350; // Longer range
    const ballSize = 25;
    const delayBetweenBalls = 100; // 100ms between each ball
    
    for (let i = 0; i < waterBallCount; i++) {
      this.time.delayedCall(i * delayBetweenBalls, () => {
        // Create water ball with multiple layers
        const waterBall = this.add.circle(this.player.x, this.player.y, ballSize, 0x0080ff, 0.8);
        waterBall.setStrokeStyle(3, 0x00aaff, 1);
        
        // Create inner water ball
        const innerWaterBall = this.add.circle(this.player.x, this.player.y, ballSize * 0.7, 0x00aaff, 0.6);
        innerWaterBall.setStrokeStyle(2, 0xffffff, 0.9);
        
        // Create water trail
        const trail = this.add.circle(this.player.x, this.player.y, ballSize * 1.1, 0x0080ff, 0.3);
        trail.setDepth(1);
        
        // Calculate target position
        let targetX, targetY;
        switch (this.currentDirection) {
          case 'up':
            targetX = this.player.x; targetY = this.player.y - distance;
            break;
          case 'down':
            targetX = this.player.x; targetY = this.player.y + distance;
            break;
          case 'left':
            targetX = this.player.x - distance; targetY = this.player.y;
            break;
          case 'right':
            targetX = this.player.x + distance; targetY = this.player.y;
            break;
        }
        
        // Animate water ball with wave effect
        this.tweens.add({
          targets: [waterBall, innerWaterBall, trail],
          x: targetX,
          y: targetY,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 600,
          ease: 'Power2',
          onUpdate: () => {
            // Add water splash particles
            const particle = this.add.circle(
              waterBall.x + (Math.random() - 0.5) * 15,
              waterBall.y + (Math.random() - 0.5) * 15,
              2, 0x00aaff, 0.6
            );
            this.time.delayedCall(150, () => particle.destroy());
            
            // Check for collision with other player during travel
                    const collision = this.checkSpellCollision(waterBall.x, waterBall.y, 25, 5);
            if (collision) {
              // Stop the water ball and destroy it immediately
              if (waterBall) waterBall.destroy();
              if (innerWaterBall) innerWaterBall.destroy();
              if (trail) trail.destroy();
            }
          },
          onComplete: () => {
            // Create splash effect
            const splash = this.add.circle(targetX, targetY, 40, 0x00aaff, 0.5);
            splash.setStrokeStyle(2, 0xffffff, 0.8);
            
            this.tweens.add({
              targets: splash,
              scaleX: 1.5,
              scaleY: 1.5,
              alpha: 0,
              duration: 250,
              onComplete: () => {
                splash.destroy();
              }
            });
            
            waterBall.destroy();
            innerWaterBall.destroy();
            trail.destroy();
          }
        });
      });
    }
  }

  createDarkMagicEffect() {
    // Create dark magic orb with shadow trail
    const darkOrb = this.add.circle(this.player.x, this.player.y, 30, 0x800080, 0.8);
    darkOrb.setStrokeStyle(4, 0x4a0080, 1);
    
    // Create shadow trail
    const shadowTrail = this.add.circle(this.player.x, this.player.y, 35, 0x4a0080, 0.4);
    shadowTrail.setDepth(1);
    
    // Calculate target position
    let targetX, targetY;
    const distance = 300;
    switch (this.currentDirection) {
      case 'up':
        targetX = this.player.x; targetY = this.player.y - distance;
        break;
      case 'down':
        targetX = this.player.x; targetY = this.player.y + distance;
        break;
      case 'left':
        targetX = this.player.x - distance; targetY = this.player.y;
        break;
      case 'right':
        targetX = this.player.x + distance; targetY = this.player.y;
        break;
    }
    
    // Animate dark magic orb with shadow effect
    this.tweens.add({
      targets: [darkOrb, shadowTrail],
      x: targetX,
      y: targetY,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        // Add dark particles
        const particle = this.add.circle(
          darkOrb.x + (Math.random() - 0.5) * 20,
          darkOrb.y + (Math.random() - 0.5) * 20,
          3, 0x800080, 0.7
        );
        this.time.delayedCall(200, () => particle.destroy());
        
        // Check for collision with other player during travel
        const collision = this.checkSpellCollisionWithMainPlayer(darkOrb.x, darkOrb.y, 30, 12);
        if (collision) {
          if (darkOrb) darkOrb.destroy();
          if (shadowTrail) shadowTrail.destroy();
        }
      },
      onComplete: () => {
        // Create dark explosion effect
        const explosion = this.add.circle(targetX, targetY, 50, 0x800080, 0.6);
        explosion.setStrokeStyle(3, 0x4a0080, 0.8);
        
        this.tweens.add({
          targets: explosion,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            explosion.destroy();
          }
        });
        
        darkOrb.destroy();
        shadowTrail.destroy();
      }
    });
  }

  createNatureEffect() {
    // Create nature energy ball with leaf particles
    const natureBall = this.add.circle(this.player.x, this.player.y, 25, 0x00ff00, 0.7);
    natureBall.setStrokeStyle(3, 0x00cc00, 1);
    
    // Create inner nature core
    const natureCore = this.add.circle(this.player.x, this.player.y, 18, 0x00cc00, 0.8);
    natureCore.setStrokeStyle(2, 0xffffff, 0.9);
    
    // Calculate target position
    let targetX, targetY;
    const distance = 280;
    switch (this.currentDirection) {
      case 'up':
        targetX = this.player.x; targetY = this.player.y - distance;
        break;
      case 'down':
        targetX = this.player.x; targetY = this.player.y + distance;
        break;
      case 'left':
        targetX = this.player.x - distance; targetY = this.player.y;
        break;
      case 'right':
        targetX = this.player.x + distance; targetY = this.player.y;
        break;
    }
    
    // Animate nature ball with leaf trail
    this.tweens.add({
      targets: [natureBall, natureCore],
      x: targetX,
      y: targetY,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 700,
      ease: 'Power2',
      onUpdate: () => {
        // Add leaf particles
        const leaf = this.add.circle(
          natureBall.x + (Math.random() - 0.5) * 15,
          natureBall.y + (Math.random() - 0.5) * 15,
          2, 0x00ff00, 0.8
        );
        this.time.delayedCall(180, () => leaf.destroy());
        
        // Check for collision with other player during travel
        const collision = this.checkSpellCollision(natureBall.x, natureBall.y, 25, 8);
        if (collision) {
          if (natureBall) natureBall.destroy();
          if (natureCore) natureCore.destroy();
        }
      },
      onComplete: () => {
        // Create nature burst effect
        const burst = this.add.circle(targetX, targetY, 45, 0x00ff00, 0.5);
        burst.setStrokeStyle(2, 0x00cc00, 0.8);
        
        this.tweens.add({
          targets: burst,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0,
          duration: 250,
          onComplete: () => {
            burst.destroy();
          }
        });
        
        natureBall.destroy();
        natureCore.destroy();
      }
    });
  }

  createDarkMagicEffectFromPosition(x, y, direction) {
    // Create dark magic orb from other player's position
    const darkOrb = this.add.circle(x, y, 30, 0x800080, 0.8);
    darkOrb.setStrokeStyle(4, 0x4a0080, 1);
    
    // Create shadow trail
    const shadowTrail = this.add.circle(x, y, 35, 0x4a0080, 0.4);
    shadowTrail.setDepth(1);
    
    // Calculate target position
    let targetX, targetY;
    const distance = 300;
    switch (direction) {
      case 'up':
        targetX = x; targetY = y - distance;
        break;
      case 'down':
        targetX = x; targetY = y + distance;
        break;
      case 'left':
        targetX = x - distance; targetY = y;
        break;
      case 'right':
        targetX = x + distance; targetY = y;
        break;
    }
    
    // Animate dark magic orb
    this.tweens.add({
      targets: [darkOrb, shadowTrail],
      x: targetX,
      y: targetY,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        // Add dark particles
        const particle = this.add.circle(
          darkOrb.x + (Math.random() - 0.5) * 20,
          darkOrb.y + (Math.random() - 0.5) * 20,
          3, 0x800080, 0.7
        );
        this.time.delayedCall(200, () => particle.destroy());
        
        // Check for collision with main player
        const collision = this.checkSpellCollisionWithMainPlayer(darkOrb.x, darkOrb.y, 30, 12);
        if (collision) {
          if (darkOrb) darkOrb.destroy();
          if (shadowTrail) shadowTrail.destroy();
        }
      },
      onComplete: () => {
        // Create dark explosion effect
        const explosion = this.add.circle(targetX, targetY, 50, 0x800080, 0.6);
        explosion.setStrokeStyle(3, 0x4a0080, 0.8);
        
        this.tweens.add({
          targets: explosion,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            explosion.destroy();
          }
        });
        
        darkOrb.destroy();
        shadowTrail.destroy();
      }
    });
  }

  createNatureEffectFromPosition(x, y, direction) {
    // Create nature energy ball from other player's position
    const natureBall = this.add.circle(x, y, 25, 0x00ff00, 0.7);
    natureBall.setStrokeStyle(3, 0x00cc00, 1);
    
    // Create inner nature core
    const natureCore = this.add.circle(x, y, 18, 0x00cc00, 0.8);
    natureCore.setStrokeStyle(2, 0xffffff, 0.9);
    
    // Calculate target position
    let targetX, targetY;
    const distance = 280;
    switch (direction) {
      case 'up':
        targetX = x; targetY = y - distance;
        break;
      case 'down':
        targetX = x; targetY = y + distance;
        break;
      case 'left':
        targetX = x - distance; targetY = y;
        break;
      case 'right':
        targetX = x + distance; targetY = y;
        break;
    }
    
    // Animate nature ball
    this.tweens.add({
      targets: [natureBall, natureCore],
      x: targetX,
      y: targetY,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 700,
      ease: 'Power2',
      onUpdate: () => {
        // Add leaf particles
        const leaf = this.add.circle(
          natureBall.x + (Math.random() - 0.5) * 15,
          natureBall.y + (Math.random() - 0.5) * 15,
          2, 0x00ff00, 0.8
        );
        this.time.delayedCall(180, () => leaf.destroy());
        
        // Check for collision with main player
        const collision = this.checkSpellCollisionWithMainPlayer(natureBall.x, natureBall.y, 25, 8);
        if (collision) {
          if (natureBall) natureBall.destroy();
          if (natureCore) natureCore.destroy();
        }
      },
      onComplete: () => {
        // Create nature burst effect
        const burst = this.add.circle(targetX, targetY, 45, 0x00ff00, 0.5);
        burst.setStrokeStyle(2, 0x00cc00, 0.8);
        
        this.tweens.add({
          targets: burst,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0,
          duration: 250,
          onComplete: () => {
            burst.destroy();
          }
        });
        
        natureBall.destroy();
        natureCore.destroy();
      }
    });
  }

  // Mega spell effects
  createThunderstormEffect() {
    // Create massive lightning storm with multiple bolts
    const boltCount = 8;
    const distance = 400;
    
    for (let i = 0; i < boltCount; i++) {
      this.time.delayedCall(i * 100, () => {
        const lightning = this.add.graphics();
        lightning.lineStyle(6, 0xffff00, 1);
        lightning.lineStyle(3, 0xffffff, 0.9);
        
        const startX = this.player.x + (Math.random() - 0.5) * 100;
        const startY = this.player.y + (Math.random() - 0.5) * 100;
        let endX, endY;
        
        switch (this.currentDirection) {
          case 'up':
            endX = startX + (Math.random() - 0.5) * 200;
            endY = startY - distance;
            break;
          case 'down':
            endX = startX + (Math.random() - 0.5) * 200;
            endY = startY + distance;
            break;
          case 'left':
            endX = startX - distance;
            endY = startY + (Math.random() - 0.5) * 200;
            break;
          case 'right':
            endX = startX + distance;
            endY = startY + (Math.random() - 0.5) * 200;
            break;
        }
        
        lightning.beginPath();
        lightning.moveTo(startX, startY);
        
        // Create zigzag lightning
        const segments = 5;
        for (let j = 1; j <= segments; j++) {
          const t = j / segments;
          const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 40;
          const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 40;
          lightning.lineTo(x, y);
        }
        lightning.strokePath();
        
        // Add flash effect
        const flash = this.add.circle(startX, startY, 40, 0xffff00, 0.7);
        flash.setDepth(2);
        
        // Check for collision
        this.checkLightningCollisionWithOtherPlayer(startX, startY, endX, endY, 15);
        
        this.time.delayedCall(200, () => {
          lightning.destroy();
          flash.destroy();
        });
      });
    }
  }

  createBlizzardEffect() {
    // Create freezing blizzard with multiple ice shards
    const shardCount = 12;
    const distance = 350;
    
    for (let i = 0; i < shardCount; i++) {
      this.time.delayedCall(i * 80, () => {
        const iceShard = this.add.circle(
          this.player.x + (Math.random() - 0.5) * 80,
          this.player.y + (Math.random() - 0.5) * 80,
          12, 0x00ffff, 0.9
        );
        iceShard.setStrokeStyle(2, 0xffffff, 1);
        
        let targetX, targetY;
        switch (this.currentDirection) {
          case 'up':
            targetX = iceShard.x + (Math.random() - 0.5) * 150;
            targetY = iceShard.y - distance;
            break;
          case 'down':
            targetX = iceShard.x + (Math.random() - 0.5) * 150;
            targetY = iceShard.y + distance;
            break;
          case 'left':
            targetX = iceShard.x - distance;
            targetY = iceShard.y + (Math.random() - 0.5) * 150;
            break;
          case 'right':
            targetX = iceShard.x + distance;
            targetY = iceShard.y + (Math.random() - 0.5) * 150;
            break;
        }
        
        this.tweens.add({
          targets: iceShard,
          x: targetX,
          y: targetY,
          scaleX: 0.7,
          scaleY: 0.7,
          duration: 600,
          ease: 'Power2',
          onUpdate: () => {
            const particle = this.add.circle(
              iceShard.x + (Math.random() - 0.5) * 10,
              iceShard.y + (Math.random() - 0.5) * 10,
              2, 0xffffff, 0.8
            );
            this.time.delayedCall(100, () => particle.destroy());
            
            const collision = this.checkSpellCollision(iceShard.x, iceShard.y, 12, 25);
            if (collision) {
              iceShard.destroy();
            }
          },
          onComplete: () => {
            const burst = this.add.circle(targetX, targetY, 25, 0x00ffff, 0.5);
            burst.setStrokeStyle(2, 0xffffff, 0.8);
            this.tweens.add({
              targets: burst, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 200,
              onComplete: () => burst.destroy()
            });
            iceShard.destroy();
          }
        });
      });
    }
  }

  createVoidEffect() {
    // VOIDWALKER void blast for player's own spell
    const voidOrb = this.add.circle(this.player.x, this.player.y, 35, 0x000000, 0.9);
    voidOrb.setStrokeStyle(5, 0x800080, 1);
    
    const voidAura = this.add.circle(this.player.x, this.player.y, 45, 0x400040, 0.5);
    voidAura.setDepth(1);
    
    let targetX, targetY;
    const distance = 380;
    switch (this.currentDirection) {
      case 'up': targetX = this.player.x; targetY = this.player.y - distance; break;
      case 'down': targetX = this.player.x; targetY = this.player.y + distance; break;
      case 'left': targetX = this.player.x - distance; targetY = this.player.y; break;
      case 'right': targetX = this.player.x + distance; targetY = this.player.y; break;
    }
    
    this.tweens.add({
      targets: [voidOrb, voidAura],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 1200, ease: 'Power2',
      onUpdate: () => {
        const particle = this.add.circle(
          voidOrb.x + (Math.random() - 0.5) * 25,
          voidOrb.y + (Math.random() - 0.5) * 25,
          4, 0x000000, 0.8
        );
        this.time.delayedCall(250, () => particle.destroy());
        
        // Use correct collision for player's own spell (hits other player)
        const collision = this.checkSpellCollision(voidOrb.x, voidOrb.y, 45, 70);
        if (collision) {
          if (voidOrb) voidOrb.destroy();
          if (voidAura) voidAura.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.add.circle(targetX, targetY, 70, 0x000000, 0.7);
        explosion.setStrokeStyle(4, 0x800080, 0.9);
        this.tweens.add({
          targets: explosion, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 500,
          onComplete: () => explosion.destroy()
        });
        voidOrb.destroy();
        voidAura.destroy();
      }
    });
  }

  createShadowRealmEffect() {
    // Create dark dimension attack
    const voidOrb = this.add.circle(this.player.x, this.player.y, 35, 0x000000, 0.9);
    voidOrb.setStrokeStyle(5, 0x800080, 1);
    
    const voidAura = this.add.circle(this.player.x, this.player.y, 45, 0x400040, 0.5);
    voidAura.setDepth(1);
    
    let targetX, targetY;
    const distance = 380;
    switch (this.currentDirection) {
      case 'up': targetX = this.player.x; targetY = this.player.y - distance; break;
      case 'down': targetX = this.player.x; targetY = this.player.y + distance; break;
      case 'left': targetX = this.player.x - distance; targetY = this.player.y; break;
      case 'right': targetX = this.player.x + distance; targetY = this.player.y; break;
    }
    
    this.tweens.add({
      targets: [voidOrb, voidAura],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 1200, ease: 'Power2',
      onUpdate: () => {
        const particle = this.add.circle(
          voidOrb.x + (Math.random() - 0.5) * 25,
          voidOrb.y + (Math.random() - 0.5) * 25,
          4, 0x000000, 0.8
        );
        this.time.delayedCall(250, () => particle.destroy());
        
        const collision = this.checkSpellCollision(voidOrb.x, voidOrb.y, 45, 70);
        if (collision) {
          if (voidOrb) voidOrb.destroy();
          if (voidAura) voidAura.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.add.circle(targetX, targetY, 70, 0x000000, 0.7);
        explosion.setStrokeStyle(4, 0x800080, 0.9);
        this.tweens.add({
          targets: explosion, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 400,
          onComplete: () => explosion.destroy()
        });
        voidOrb.destroy();
        voidAura.destroy();
      }
    });
  }

  createInfernoEffect() {
    // Create massive firestorm
    const fireballCount = 6;
    const distance = 450;
    
    for (let i = 0; i < fireballCount; i++) {
      this.time.delayedCall(i * 120, () => {
        const fireball = this.add.circle(
          this.player.x + (Math.random() - 0.5) * 60,
          this.player.y + (Math.random() - 0.5) * 60,
          30, 0xff0000, 0.9
        );
        fireball.setStrokeStyle(4, 0xff6600, 1);
        
        const innerFire = this.add.circle(
          fireball.x, fireball.y, 20, 0xff4400, 0.8
        );
        innerFire.setStrokeStyle(3, 0xffff00, 0.9);
        
        let targetX, targetY;
        switch (this.currentDirection) {
          case 'up':
            targetX = fireball.x + (Math.random() - 0.5) * 120;
            targetY = fireball.y - distance;
            break;
          case 'down':
            targetX = fireball.x + (Math.random() - 0.5) * 120;
            targetY = fireball.y + distance;
            break;
          case 'left':
            targetX = fireball.x - distance;
            targetY = fireball.y + (Math.random() - 0.5) * 120;
            break;
          case 'right':
            targetX = fireball.x + distance;
            targetY = fireball.y + (Math.random() - 0.5) * 120;
            break;
        }
        
        this.tweens.add({
          targets: [fireball, innerFire],
          x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
          duration: 1000, ease: 'Power2',
          onUpdate: () => {
            const particle = this.add.circle(
              fireball.x + (Math.random() - 0.5) * 25,
              fireball.y + (Math.random() - 0.5) * 25,
              3, 0xff6600, 0.8
            );
            this.time.delayedCall(200, () => particle.destroy());
            
            const collision = this.checkSpellCollision(fireball.x, fireball.y, 30, 35);
            if (collision) {
              fireball.destroy();
              innerFire.destroy();
            }
          },
          onComplete: () => {
            const explosion = this.add.circle(targetX, targetY, 60, 0xff6600, 0.8);
            explosion.setStrokeStyle(3, 0xffff00, 1);
            this.tweens.add({
              targets: explosion, scaleX: 2.0, scaleY: 2.0, alpha: 0, duration: 350,
              onComplete: () => explosion.destroy()
            });
            fireball.destroy();
            innerFire.destroy();
          }
        });
      });
    }
  }

  createForestRageEffect() {
    // Create nature's fury with multiple nature balls
    const natureCount = 8;
    const distance = 400;
    
    for (let i = 0; i < natureCount; i++) {
      this.time.delayedCall(i * 100, () => {
        const natureBall = this.add.circle(
          this.player.x + (Math.random() - 0.5) * 70,
          this.player.y + (Math.random() - 0.5) * 70,
          22, 0x00ff00, 0.8
        );
        natureBall.setStrokeStyle(3, 0x00cc00, 1);
        
        const natureCore = this.add.circle(
          natureBall.x, natureBall.y, 15, 0x00cc00, 0.7
        );
        natureCore.setStrokeStyle(2, 0xffffff, 0.9);
        
        let targetX, targetY;
        switch (this.currentDirection) {
          case 'up':
            targetX = natureBall.x + (Math.random() - 0.5) * 100;
            targetY = natureBall.y - distance;
            break;
          case 'down':
            targetX = natureBall.x + (Math.random() - 0.5) * 100;
            targetY = natureBall.y + distance;
            break;
          case 'left':
            targetX = natureBall.x - distance;
            targetY = natureBall.y + (Math.random() - 0.5) * 100;
            break;
          case 'right':
            targetX = natureBall.x + distance;
            targetY = natureBall.y + (Math.random() - 0.5) * 100;
            break;
        }
        
        this.tweens.add({
          targets: [natureBall, natureCore],
          x: targetX, y: targetY, scaleX: 1.1, scaleY: 1.1,
          duration: 900, ease: 'Power2',
          onUpdate: () => {
            const leaf = this.add.circle(
              natureBall.x + (Math.random() - 0.5) * 18,
              natureBall.y + (Math.random() - 0.5) * 18,
              2, 0x00ff00, 0.8
            );
            this.time.delayedCall(180, () => leaf.destroy());
            
            const collision = this.checkSpellCollision(natureBall.x, natureBall.y, 22, 30);
            if (collision) {
              natureBall.destroy();
              natureCore.destroy();
            }
          },
          onComplete: () => {
            const burst = this.add.circle(targetX, targetY, 50, 0x00ff00, 0.6);
            burst.setStrokeStyle(2, 0x00cc00, 0.8);
            this.tweens.add({
              targets: burst, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 300,
              onComplete: () => burst.destroy()
            });
            natureBall.destroy();
            natureCore.destroy();
          }
        });
      });
    }
  }

  // Add FromPosition versions for mega spells
  createThunderstormEffectFromPosition(x, y, direction) {
    const boltCount = 8;
    const distance = 400;
    
    for (let i = 0; i < boltCount; i++) {
      this.time.delayedCall(i * 100, () => {
        const lightning = this.add.graphics();
        lightning.lineStyle(6, 0xffff00, 1);
        lightning.lineStyle(3, 0xffffff, 0.9);
        
        const startX = x + (Math.random() - 0.5) * 100;
        const startY = y + (Math.random() - 0.5) * 100;
        let endX, endY;
        
        switch (direction) {
          case 'up':
            endX = startX + (Math.random() - 0.5) * 200;
            endY = startY - distance;
            break;
          case 'down':
            endX = startX + (Math.random() - 0.5) * 200;
            endY = startY + distance;
            break;
          case 'left':
            endX = startX - distance;
            endY = startY + (Math.random() - 0.5) * 200;
            break;
          case 'right':
            endX = startX + distance;
            endY = startY + (Math.random() - 0.5) * 200;
            break;
        }
        
        lightning.beginPath();
        lightning.moveTo(startX, startY);
        
        const segments = 5;
        for (let j = 1; j <= segments; j++) {
          const t = j / segments;
          const xPos = startX + (endX - startX) * t + (Math.random() - 0.5) * 40;
          const yPos = startY + (endY - startY) * t + (Math.random() - 0.5) * 40;
          lightning.lineTo(xPos, yPos);
        }
        lightning.strokePath();
        
        const flash = this.add.circle(startX, startY, 40, 0xffff00, 0.7);
        flash.setDepth(2);
        
        this.checkLightningCollision(startX, startY, endX, endY, 15);
        
        this.time.delayedCall(200, () => {
          lightning.destroy();
          flash.destroy();
        });
      });
    }
  }

  createBlizzardEffectFromPosition(x, y, direction) {
    const shardCount = 12;
    const distance = 350;
    
    for (let i = 0; i < shardCount; i++) {
      this.time.delayedCall(i * 80, () => {
        const iceShard = this.add.circle(
          x + (Math.random() - 0.5) * 80,
          y + (Math.random() - 0.5) * 80,
          12, 0x00ffff, 0.9
        );
        iceShard.setStrokeStyle(2, 0xffffff, 1);
        
        let targetX, targetY;
        switch (direction) {
          case 'up':
            targetX = iceShard.x + (Math.random() - 0.5) * 150;
            targetY = iceShard.y - distance;
            break;
          case 'down':
            targetX = iceShard.x + (Math.random() - 0.5) * 150;
            targetY = iceShard.y + distance;
            break;
          case 'left':
            targetX = iceShard.x - distance;
            targetY = iceShard.y + (Math.random() - 0.5) * 150;
            break;
          case 'right':
            targetX = iceShard.x + distance;
            targetY = iceShard.y + (Math.random() - 0.5) * 150;
            break;
        }
        
        this.tweens.add({
          targets: iceShard,
          x: targetX, y: targetY, scaleX: 0.7, scaleY: 0.7,
          duration: 600, ease: 'Power2',
          onUpdate: () => {
            const particle = this.add.circle(
              iceShard.x + (Math.random() - 0.5) * 10,
              iceShard.y + (Math.random() - 0.5) * 10,
              2, 0xffffff, 0.8
            );
            this.time.delayedCall(100, () => particle.destroy());
            
            const collision = this.checkSpellCollision(iceShard.x, iceShard.y, 12, 25);
            if (collision) {
              iceShard.destroy();
            }
          },
          onComplete: () => {
            const burst = this.add.circle(targetX, targetY, 25, 0x00ffff, 0.5);
            burst.setStrokeStyle(2, 0xffffff, 0.8);
            this.tweens.add({
              targets: burst, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 200,
              onComplete: () => burst.destroy()
            });
            iceShard.destroy();
          }
        });
      });
    }
  }

  createShadowRealmEffectFromPosition(x, y, direction) {
    const voidOrb = this.add.circle(x, y, 35, 0x000000, 0.9);
    voidOrb.setStrokeStyle(5, 0x800080, 1);
    
    const voidAura = this.add.circle(x, y, 45, 0x400040, 0.5);
    voidAura.setDepth(1);
    
    let targetX, targetY;
    const distance = 380;
    switch (direction) {
      case 'up': targetX = x; targetY = y - distance; break;
      case 'down': targetX = x; targetY = y + distance; break;
      case 'left': targetX = x - distance; targetY = y; break;
      case 'right': targetX = x + distance; targetY = y; break;
    }
    
    this.tweens.add({
      targets: [voidOrb, voidAura],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 1200, ease: 'Power2',
      onUpdate: () => {
        const particle = this.add.circle(
          voidOrb.x + (Math.random() - 0.5) * 25,
          voidOrb.y + (Math.random() - 0.5) * 25,
          4, 0x000000, 0.8
        );
        this.time.delayedCall(250, () => particle.destroy());
        
        const collision = this.checkSpellCollision(voidOrb.x, voidOrb.y, 45, 70);
        if (collision) {
          if (voidOrb) voidOrb.destroy();
          if (voidAura) voidAura.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.add.circle(targetX, targetY, 70, 0x000000, 0.7);
        explosion.setStrokeStyle(4, 0x800080, 0.9);
        this.tweens.add({
          targets: explosion, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 400,
          onComplete: () => explosion.destroy()
        });
        voidOrb.destroy();
        voidAura.destroy();
      }
    });
  }

  createInfernoEffectFromPosition(x, y, direction) {
    const fireballCount = 6;
    const distance = 450;
    
    for (let i = 0; i < fireballCount; i++) {
      this.time.delayedCall(i * 120, () => {
        const fireball = this.add.circle(
          x + (Math.random() - 0.5) * 60,
          y + (Math.random() - 0.5) * 60,
          30, 0xff0000, 0.9
        );
        fireball.setStrokeStyle(4, 0xff6600, 1);
        
        const innerFire = this.add.circle(
          fireball.x, fireball.y, 20, 0xff4400, 0.8
        );
        innerFire.setStrokeStyle(3, 0xffff00, 0.9);
        
        let targetX, targetY;
        switch (direction) {
          case 'up':
            targetX = fireball.x + (Math.random() - 0.5) * 120;
            targetY = fireball.y - distance;
            break;
          case 'down':
            targetX = fireball.x + (Math.random() - 0.5) * 120;
            targetY = fireball.y + distance;
            break;
          case 'left':
            targetX = fireball.x - distance;
            targetY = fireball.y + (Math.random() - 0.5) * 120;
            break;
          case 'right':
            targetX = fireball.x + distance;
            targetY = fireball.y + (Math.random() - 0.5) * 120;
            break;
        }
        
        this.tweens.add({
          targets: [fireball, innerFire],
          x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
          duration: 1000, ease: 'Power2',
          onUpdate: () => {
            const particle = this.add.circle(
              fireball.x + (Math.random() - 0.5) * 25,
              fireball.y + (Math.random() - 0.5) * 25,
              3, 0xff6600, 0.8
            );
            this.time.delayedCall(200, () => particle.destroy());
            
            const collision = this.checkSpellCollision(fireball.x, fireball.y, 30, 35);
            if (collision) {
              fireball.destroy();
              innerFire.destroy();
            }
          },
          onComplete: () => {
            const explosion = this.add.circle(targetX, targetY, 60, 0xff6600, 0.8);
            explosion.setStrokeStyle(3, 0xffff00, 1);
            this.tweens.add({
              targets: explosion, scaleX: 2.0, scaleY: 2.0, alpha: 0, duration: 350,
              onComplete: () => explosion.destroy()
            });
            fireball.destroy();
            innerFire.destroy();
          }
        });
      });
    }
  }

  createForestRageEffectFromPosition(x, y, direction) {
    const natureCount = 8;
    const distance = 400;
    
    for (let i = 0; i < natureCount; i++) {
      this.time.delayedCall(i * 100, () => {
        const natureBall = this.add.circle(
          x + (Math.random() - 0.5) * 70,
          y + (Math.random() - 0.5) * 70,
          22, 0x00ff00, 0.8
        );
        natureBall.setStrokeStyle(3, 0x00cc00, 1);
        
        const natureCore = this.add.circle(
          natureBall.x, natureBall.y, 15, 0x00cc00, 0.7
        );
        natureCore.setStrokeStyle(2, 0xffffff, 0.9);
        
        let targetX, targetY;
        switch (direction) {
          case 'up':
            targetX = natureBall.x + (Math.random() - 0.5) * 100;
            targetY = natureBall.y - distance;
            break;
          case 'down':
            targetX = natureBall.x + (Math.random() - 0.5) * 100;
            targetY = natureBall.y + distance;
            break;
          case 'left':
            targetX = natureBall.x - distance;
            targetY = natureBall.y + (Math.random() - 0.5) * 100;
            break;
          case 'right':
            targetX = natureBall.x + distance;
            targetY = natureBall.y + (Math.random() - 0.5) * 100;
            break;
        }
        
        this.tweens.add({
          targets: [natureBall, natureCore],
          x: targetX, y: targetY, scaleX: 1.1, scaleY: 1.1,
          duration: 900, ease: 'Power2',
          onUpdate: () => {
            const leaf = this.add.circle(
              natureBall.x + (Math.random() - 0.5) * 18,
              natureBall.y + (Math.random() - 0.5) * 18,
              2, 0x00ff00, 0.8
            );
            this.time.delayedCall(180, () => leaf.destroy());
            
            const collision = this.checkSpellCollision(natureBall.x, natureBall.y, 22, 30);
            if (collision) {
              natureBall.destroy();
              natureCore.destroy();
            }
          },
          onComplete: () => {
            const burst = this.add.circle(targetX, targetY, 50, 0x00ff00, 0.6);
            burst.setStrokeStyle(2, 0x00cc00, 0.8);
            this.tweens.add({
              targets: burst, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 300,
              onComplete: () => burst.destroy()
            });
            natureBall.destroy();
            natureCore.destroy();
          }
        });
      });
    }
  }

  // FromPosition versions of character spell effects
  createIceShardEffectFromPosition(x, y, direction) {
    const iceShard = this.add.circle(x, y, 15, 0x00ffff, 0.9);
    iceShard.setStrokeStyle(3, 0xffffff, 1);
    
    const iceCore = this.add.circle(iceShard.x, iceShard.y, 8, 0xffffff, 0.8);
    iceCore.setStrokeStyle(2, 0x00ffff, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = iceShard.x;
        targetY = iceShard.y - 300;
        break;
      case 'down':
        targetX = iceShard.x;
        targetY = iceShard.y + 300;
        break;
      case 'left':
        targetX = iceShard.x - 300;
        targetY = iceShard.y;
        break;
      case 'right':
        targetX = iceShard.x + 300;
        targetY = iceShard.y;
        break;
    }
    
    this.tweens.add({
      targets: [iceShard, iceCore],
      x: targetX, y: targetY, scaleX: 1.2, scaleY: 1.2,
      duration: 600, ease: 'Power2',
      onUpdate: () => {
        const sparkle = this.add.circle(
          iceShard.x + (Math.random() - 0.5) * 20,
          iceShard.y + (Math.random() - 0.5) * 20,
          2, 0x00ffff, 0.8
        );
        this.time.delayedCall(100, () => sparkle.destroy());
        
        const collision = this.checkSpellCollision(iceShard.x, iceShard.y, 15, 20);
        if (collision) {
          iceShard.destroy();
          iceCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 40, 0x00ffff, 0.6);
        burst.setStrokeStyle(2, 0xffffff, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 250,
          onComplete: () => burst.destroy()
        });
        iceShard.destroy();
        iceCore.destroy();
      }
    });
  }

  createShadowBoltEffectFromPosition(x, y, direction) {
    const shadowBolt = this.add.circle(x, y, 18, 0x800080, 0.9);
    shadowBolt.setStrokeStyle(4, 0x4b0082, 1);
    
    const shadowCore = this.add.circle(shadowBolt.x, shadowBolt.y, 10, 0x4b0082, 0.8);
    shadowCore.setStrokeStyle(2, 0x800080, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = shadowBolt.x;
        targetY = shadowBolt.y - 350;
        break;
      case 'down':
        targetX = shadowBolt.x;
        targetY = shadowBolt.y + 350;
        break;
      case 'left':
        targetX = shadowBolt.x - 350;
        targetY = shadowBolt.y;
        break;
      case 'right':
        targetX = shadowBolt.x + 350;
        targetY = shadowBolt.y;
        break;
    }
    
    this.tweens.add({
      targets: [shadowBolt, shadowCore],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 800, ease: 'Power2',
      onUpdate: () => {
        const shadowTrail = this.add.circle(
          shadowBolt.x + (Math.random() - 0.5) * 25,
          shadowBolt.y + (Math.random() - 0.5) * 25,
          3, 0x800080, 0.6
        );
        this.time.delayedCall(150, () => shadowTrail.destroy());
        
        const collision = this.checkSpellCollision(shadowBolt.x, shadowBolt.y, 18, 30);
        if (collision) {
          shadowBolt.destroy();
          shadowCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 45, 0x800080, 0.6);
        burst.setStrokeStyle(2, 0x4b0082, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 300,
          onComplete: () => burst.destroy()
        });
        shadowBolt.destroy();
        shadowCore.destroy();
      }
    });
  }

  createGoldenRayEffectFromPosition(x, y, direction) {
    const goldenRay = this.add.circle(x, y, 16, 0xffd700, 0.9);
    goldenRay.setStrokeStyle(3, 0xffed4e, 1);
    
    const goldenCore = this.add.circle(goldenRay.x, goldenRay.y, 9, 0xffed4e, 0.8);
    goldenCore.setStrokeStyle(2, 0xffd700, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = goldenRay.x;
        targetY = goldenRay.y - 320;
        break;
      case 'down':
        targetX = goldenRay.x;
        targetY = goldenRay.y + 320;
        break;
      case 'left':
        targetX = goldenRay.x - 320;
        targetY = goldenRay.y;
        break;
      case 'right':
        targetX = goldenRay.x + 320;
        targetY = goldenRay.y;
        break;
    }
    
    this.tweens.add({
      targets: [goldenRay, goldenCore],
      x: targetX, y: targetY, scaleX: 1.2, scaleY: 1.2,
      duration: 700, ease: 'Power2',
      onUpdate: () => {
        const sparkle = this.add.circle(
          goldenRay.x + (Math.random() - 0.5) * 22,
          goldenRay.y + (Math.random() - 0.5) * 22,
          2, 0xffd700, 0.8
        );
        this.time.delayedCall(120, () => sparkle.destroy());
        
        const collision = this.checkSpellCollision(goldenRay.x, goldenRay.y, 16, 26);
        if (collision) {
          goldenRay.destroy();
          goldenCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 42, 0xffd700, 0.6);
        burst.setStrokeStyle(2, 0xffed4e, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 280,
          onComplete: () => burst.destroy()
        });
        goldenRay.destroy();
        goldenCore.destroy();
      }
    });
  }

  createIronShotEffectFromPosition(x, y, direction) {
    const ironShot = this.add.circle(x, y, 17, 0x696969, 0.9);
    ironShot.setStrokeStyle(4, 0x2f4f4f, 1);
    
    const ironCore = this.add.circle(ironShot.x, ironShot.y, 9, 0x2f4f4f, 0.8);
    ironCore.setStrokeStyle(2, 0x696969, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = ironShot.x;
        targetY = ironShot.y - 330;
        break;
      case 'down':
        targetX = ironShot.x;
        targetY = ironShot.y + 330;
        break;
      case 'left':
        targetX = ironShot.x - 330;
        targetY = ironShot.y;
        break;
      case 'right':
        targetX = ironShot.x + 330;
        targetY = ironShot.y;
        break;
    }
    
    this.tweens.add({
      targets: [ironShot, ironCore],
      x: targetX, y: targetY, scaleX: 1.1, scaleY: 1.1,
      duration: 750, ease: 'Power2',
      onUpdate: () => {
        const spark = this.add.circle(
          ironShot.x + (Math.random() - 0.5) * 20,
          ironShot.y + (Math.random() - 0.5) * 20,
          2, 0x696969, 0.8
        );
        this.time.delayedCall(110, () => spark.destroy());
        
        const collision = this.checkSpellCollision(ironShot.x, ironShot.y, 17, 24);
        if (collision) {
          ironShot.destroy();
          ironCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 44, 0x696969, 0.6);
        burst.setStrokeStyle(2, 0x2f4f4f, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 290,
          onComplete: () => burst.destroy()
        });
        ironShot.destroy();
        ironCore.destroy();
      }
    });
  }

  createFistBlastEffectFromPosition(x, y, direction) {
    const fistBlast = this.add.circle(x, y, 19, 0xff6b35, 0.9);
    fistBlast.setStrokeStyle(4, 0xff4500, 1);
    
    const fistCore = this.add.circle(fistBlast.x, fistBlast.y, 10, 0xff4500, 0.8);
    fistCore.setStrokeStyle(2, 0xff6b35, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = fistBlast.x;
        targetY = fistBlast.y - 340;
        break;
      case 'down':
        targetX = fistBlast.x;
        targetY = fistBlast.y + 340;
        break;
      case 'left':
        targetX = fistBlast.x - 340;
        targetY = fistBlast.y;
        break;
      case 'right':
        targetX = fistBlast.x + 340;
        targetY = fistBlast.y;
        break;
    }
    
    this.tweens.add({
      targets: [fistBlast, fistCore],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 800, ease: 'Power2',
      onUpdate: () => {
        const spark = this.add.circle(
          fistBlast.x + (Math.random() - 0.5) * 24,
          fistBlast.y + (Math.random() - 0.5) * 24,
          3, 0xff6b35, 0.8
        );
        this.time.delayedCall(130, () => spark.destroy());
        
        const collision = this.checkSpellCollision(fistBlast.x, fistBlast.y, 19, 32);
        if (collision) {
          fistBlast.destroy();
          fistCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 48, 0xff6b35, 0.6);
        burst.setStrokeStyle(2, 0xff4500, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 320,
          onComplete: () => burst.destroy()
        });
        fistBlast.destroy();
        fistCore.destroy();
      }
    });
  }

  createShadowStrikeEffectFromPosition(x, y, direction) {
    const shadowStrike = this.add.circle(x, y, 14, 0x4b0082, 0.9);
    shadowStrike.setStrokeStyle(3, 0x800080, 1);
    
    const shadowCore = this.add.circle(shadowStrike.x, shadowStrike.y, 7, 0x800080, 0.8);
    shadowCore.setStrokeStyle(2, 0x4b0082, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = shadowStrike.x;
        targetY = shadowStrike.y - 280;
        break;
      case 'down':
        targetX = shadowStrike.x;
        targetY = shadowStrike.y + 280;
        break;
      case 'left':
        targetX = shadowStrike.x - 280;
        targetY = shadowStrike.y;
        break;
      case 'right':
        targetX = shadowStrike.x + 280;
        targetY = shadowStrike.y;
        break;
    }
    
    this.tweens.add({
      targets: [shadowStrike, shadowCore],
      x: targetX, y: targetY, scaleX: 1.4, scaleY: 1.4,
      duration: 500, ease: 'Power2',
      onUpdate: () => {
        const trail = this.add.circle(
          shadowStrike.x + (Math.random() - 0.5) * 18,
          shadowStrike.y + (Math.random() - 0.5) * 18,
          2, 0x4b0082, 0.7
        );
        this.time.delayedCall(80, () => trail.destroy());
        
        const collision = this.checkSpellCollision(shadowStrike.x, shadowStrike.y, 14, 27);
        if (collision) {
          shadowStrike.destroy();
          shadowCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 38, 0x4b0082, 0.6);
        burst.setStrokeStyle(2, 0x800080, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 250,
          onComplete: () => burst.destroy()
        });
        shadowStrike.destroy();
        shadowCore.destroy();
      }
    });
  }

  createHellfireEffectFromPosition(x, y, direction) {
    const hellfire = this.add.circle(x, y, 20, 0xff4500, 0.9);
    hellfire.setStrokeStyle(4, 0x8b0000, 1);
    
    const hellCore = this.add.circle(hellfire.x, hellfire.y, 11, 0x8b0000, 0.8);
    hellCore.setStrokeStyle(2, 0xff4500, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = hellfire.x;
        targetY = hellfire.y - 360;
        break;
      case 'down':
        targetX = hellfire.x;
        targetY = hellfire.y + 360;
        break;
      case 'left':
        targetX = hellfire.x - 360;
        targetY = hellfire.y;
        break;
      case 'right':
        targetX = hellfire.x + 360;
        targetY = hellfire.y;
        break;
    }
    
    this.tweens.add({
      targets: [hellfire, hellCore],
      x: targetX, y: targetY, scaleX: 1.4, scaleY: 1.4,
      duration: 850, ease: 'Power2',
      onUpdate: () => {
        const flame = this.add.circle(
          hellfire.x + (Math.random() - 0.5) * 26,
          hellfire.y + (Math.random() - 0.5) * 26,
          3, 0xff4500, 0.8
        );
        this.time.delayedCall(140, () => flame.destroy());
        
        const collision = this.checkSpellCollision(hellfire.x, hellfire.y, 20, 33);
        if (collision) {
          hellfire.destroy();
          hellCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 52, 0xff4500, 0.6);
        burst.setStrokeStyle(2, 0x8b0000, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 350,
          onComplete: () => burst.destroy()
        });
        hellfire.destroy();
        hellCore.destroy();
      }
    });
  }

  createCrimsonShotEffectFromPosition(x, y, direction) {
    const crimsonShot = this.add.circle(x, y, 16, 0xdc143c, 0.9);
    crimsonShot.setStrokeStyle(3, 0x8b0000, 1);
    
    const crimsonCore = this.add.circle(crimsonShot.x, crimsonShot.y, 8, 0x8b0000, 0.8);
    crimsonCore.setStrokeStyle(2, 0xdc143c, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = crimsonShot.x;
        targetY = crimsonShot.y - 310;
        break;
      case 'down':
        targetX = crimsonShot.x;
        targetY = crimsonShot.y + 310;
        break;
      case 'left':
        targetX = crimsonShot.x - 310;
        targetY = crimsonShot.y;
        break;
      case 'right':
        targetX = crimsonShot.x + 310;
        targetY = crimsonShot.y;
        break;
    }
    
    this.tweens.add({
      targets: [crimsonShot, crimsonCore],
      x: targetX, y: targetY, scaleX: 1.2, scaleY: 1.2,
      duration: 720, ease: 'Power2',
      onUpdate: () => {
        const spark = this.add.circle(
          crimsonShot.x + (Math.random() - 0.5) * 20,
          crimsonShot.y + (Math.random() - 0.5) * 20,
          2, 0xdc143c, 0.8
        );
        this.time.delayedCall(115, () => spark.destroy());
        
        const collision = this.checkSpellCollision(crimsonShot.x, crimsonShot.y, 16, 29);
        if (collision) {
          crimsonShot.destroy();
          crimsonCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 43, 0xdc143c, 0.6);
        burst.setStrokeStyle(2, 0x8b0000, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 285,
          onComplete: () => burst.destroy()
        });
        crimsonShot.destroy();
        crimsonCore.destroy();
      }
    });
  }

  createGladiatorSpearEffectFromPosition(x, y, direction) {
    const spear = this.add.circle(x, y, 18, 0xd2691e, 0.9);
    spear.setStrokeStyle(4, 0x8b4513, 1);
    
    const spearCore = this.add.circle(spear.x, spear.y, 9, 0x8b4513, 0.8);
    spearCore.setStrokeStyle(2, 0xd2691e, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = spear.x;
        targetY = spear.y - 340;
        break;
      case 'down':
        targetX = spear.x;
        targetY = spear.y + 340;
        break;
      case 'left':
        targetX = spear.x - 340;
        targetY = spear.y;
        break;
      case 'right':
        targetX = spear.x + 340;
        targetY = spear.y;
        break;
    }
    
    this.tweens.add({
      targets: [spear, spearCore],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 780, ease: 'Power2',
      onUpdate: () => {
        const spark = this.add.circle(
          spear.x + (Math.random() - 0.5) * 22,
          spear.y + (Math.random() - 0.5) * 22,
          2, 0xd2691e, 0.8
        );
        this.time.delayedCall(125, () => spark.destroy());
        
        const collision = this.checkSpellCollision(spear.x, spear.y, 18, 31);
        if (collision) {
          spear.destroy();
          spearCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 46, 0xd2691e, 0.6);
        burst.setStrokeStyle(2, 0x8b4513, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 310,
          onComplete: () => burst.destroy()
        });
        spear.destroy();
        spearCore.destroy();
      }
    });
  }

  createPinkMistEffectFromPosition(x, y, direction) {
    const pinkMist = this.add.circle(x, y, 12, 0xff69b4, 0.9);
    pinkMist.setStrokeStyle(3, 0xff1493, 1);
    
    const pinkCore = this.add.circle(pinkMist.x, pinkMist.y, 6, 0xff1493, 0.8);
    pinkCore.setStrokeStyle(2, 0xff69b4, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = pinkMist.x;
        targetY = pinkMist.y - 260;
        break;
      case 'down':
        targetX = pinkMist.x;
        targetY = pinkMist.y + 260;
        break;
      case 'left':
        targetX = pinkMist.x - 260;
        targetY = pinkMist.y;
        break;
      case 'right':
        targetX = pinkMist.x + 260;
        targetY = pinkMist.y;
        break;
    }
    
    this.tweens.add({
      targets: [pinkMist, pinkCore],
      x: targetX, y: targetY, scaleX: 1.5, scaleY: 1.5,
      duration: 450, ease: 'Power2',
      onUpdate: () => {
        const sparkle = this.add.circle(
          pinkMist.x + (Math.random() - 0.5) * 16,
          pinkMist.y + (Math.random() - 0.5) * 16,
          2, 0xff69b4, 0.7
        );
        this.time.delayedCall(70, () => sparkle.destroy());
        
        const collision = this.checkSpellCollision(pinkMist.x, pinkMist.y, 12, 18);
        if (collision) {
          pinkMist.destroy();
          pinkCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 35, 0xff69b4, 0.6);
        burst.setStrokeStyle(2, 0xff1493, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 240,
          onComplete: () => burst.destroy()
        });
        pinkMist.destroy();
        pinkCore.destroy();
      }
    });
  }

  createCodeBlastEffectFromPosition(x, y, direction) {
    const codeBlast = this.add.circle(x, y, 15, 0x00ff00, 0.9);
    codeBlast.setStrokeStyle(3, 0x32cd32, 1);
    
    const codeCore = this.add.circle(codeBlast.x, codeBlast.y, 8, 0x32cd32, 0.8);
    codeCore.setStrokeStyle(2, 0x00ff00, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = codeBlast.x;
        targetY = codeBlast.y - 300;
        break;
      case 'down':
        targetX = codeBlast.x;
        targetY = codeBlast.y + 300;
        break;
      case 'left':
        targetX = codeBlast.x - 300;
        targetY = codeBlast.y;
        break;
      case 'right':
        targetX = codeBlast.x + 300;
        targetY = codeBlast.y;
        break;
    }
    
    this.tweens.add({
      targets: [codeBlast, codeCore],
      x: targetX, y: targetY, scaleX: 1.2, scaleY: 1.2,
      duration: 650, ease: 'Power2',
      onUpdate: () => {
        const pixel = this.add.circle(
          codeBlast.x + (Math.random() - 0.5) * 20,
          codeBlast.y + (Math.random() - 0.5) * 20,
          2, 0x00ff00, 0.8
        );
        this.time.delayedCall(105, () => pixel.destroy());
        
        const collision = this.checkSpellCollision(codeBlast.x, codeBlast.y, 15, 26);
        if (collision) {
          codeBlast.destroy();
          codeCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 41, 0x00ff00, 0.6);
        burst.setStrokeStyle(2, 0x32cd32, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 270,
          onComplete: () => burst.destroy()
        });
        codeBlast.destroy();
        codeCore.destroy();
      }
    });
  }

  createGoblinMagicEffectFromPosition(x, y, direction) {
    const goblinMagic = this.add.circle(x, y, 13, 0x228b22, 0.9);
    goblinMagic.setStrokeStyle(3, 0x006400, 1);
    
    const goblinCore = this.add.circle(goblinMagic.x, goblinMagic.y, 7, 0x006400, 0.8);
    goblinCore.setStrokeStyle(2, 0x228b22, 0.9);
    
    let targetX, targetY;
    switch (direction) {
      case 'up':
        targetX = goblinMagic.x;
        targetY = goblinMagic.y - 270;
        break;
      case 'down':
        targetX = goblinMagic.x;
        targetY = goblinMagic.y + 270;
        break;
      case 'left':
        targetX = goblinMagic.x - 270;
        targetY = goblinMagic.y;
        break;
      case 'right':
        targetX = goblinMagic.x + 270;
        targetY = goblinMagic.y;
        break;
    }
    
    this.tweens.add({
      targets: [goblinMagic, goblinCore],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 580, ease: 'Power2',
      onUpdate: () => {
        const sparkle = this.add.circle(
          goblinMagic.x + (Math.random() - 0.5) * 18,
          goblinMagic.y + (Math.random() - 0.5) * 18,
          2, 0x228b22, 0.7
        );
        this.time.delayedCall(90, () => sparkle.destroy());
        
        const collision = this.checkSpellCollision(goblinMagic.x, goblinMagic.y, 13, 23);
        if (collision) {
          goblinMagic.destroy();
          goblinCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.add.circle(targetX, targetY, 37, 0x228b22, 0.6);
        burst.setStrokeStyle(2, 0x006400, 0.8);
        this.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 260,
          onComplete: () => burst.destroy()
        });
        goblinMagic.destroy();
        goblinCore.destroy();
      }
    });
  }

  // Add remaining mega spell effects (simplified versions)
  createVoidBlastEffect() { this.createShadowBoltEffect(); }
  createVoidRiftEffect() { this.createShadowRealmEffect(); }
  createDivineJudgmentEffect() { this.createGoldenRayEffect(); }
  createIronStormEffect() { this.createIronShotEffect(); }
  createKingsFuryEffect() { this.createFistBlastEffect(); }
  createRoguesGambitEffect() { this.createShadowStrikeEffect(); }
  createDevilsWrathEffect() { this.createHellfireEffect(); }
  createMafiasRevengeEffect() { this.createCrimsonShotEffect(); }
  createColosseumFuryEffect() { this.createGladiatorSpearEffect(); }
  createTricksterChaosEffect() { this.createPinkMistEffect(); }
  createSystemCrashEffect() { this.createCodeBlastEffect(); }
  createGoblinKingdomEffect() { this.createGoblinMagicEffect(); }

  // FromPosition versions for remaining mega spells
  createVoidBlastEffectFromPosition(x, y, direction) { this.createShadowBoltEffectFromPosition(x, y, direction); }
  createVoidRiftEffectFromPosition(x, y, direction) { this.createShadowRealmEffectFromPosition(x, y, direction); }
  createDivineJudgmentEffectFromPosition(x, y, direction) { this.createGoldenRayEffectFromPosition(x, y, direction); }
  createIronStormEffectFromPosition(x, y, direction) { this.createIronShotEffectFromPosition(x, y, direction); }
  createKingsFuryEffectFromPosition(x, y, direction) { this.createFistBlastEffectFromPosition(x, y, direction); }
  createRoguesGambitEffectFromPosition(x, y, direction) { this.createShadowStrikeEffectFromPosition(x, y, direction); }
  createDevilsWrathEffectFromPosition(x, y, direction) { this.createHellfireEffectFromPosition(x, y, direction); }
  createMafiasRevengeEffectFromPosition(x, y, direction) { this.createCrimsonShotEffectFromPosition(x, y, direction); }
  createColosseumFuryEffectFromPosition(x, y, direction) { this.createGladiatorSpearEffectFromPosition(x, y, direction); }
  createTricksterChaosEffectFromPosition(x, y, direction) { this.createPinkMistEffectFromPosition(x, y, direction); }
  createSystemCrashEffectFromPosition(x, y, direction) { this.createCodeBlastEffectFromPosition(x, y, direction); }
  createGoblinKingdomEffectFromPosition(x, y, direction) { this.createGoblinMagicEffectFromPosition(x, y, direction); }

  // Character-specific spell effects
  createIceShardEffect() {
    // Create multiple ice shards in a spread pattern
    const shardCount = 3;
    const shards = [];
    
    for (let i = 0; i < shardCount; i++) {
      const offset = (i - 1) * 15; // Spread shards horizontally
      const iceShard = this.add.circle(
        this.player.x + offset, this.player.y, 12, 0x00ffff, 0.9
      );
      iceShard.setStrokeStyle(3, 0xffffff, 1);
      
      const iceCore = this.add.circle(
        iceShard.x, iceShard.y, 6, 0xffffff, 0.8
      );
      iceCore.setStrokeStyle(2, 0x00ffff, 0.9);
      
      // Add frost particles around each shard
      const frostParticles = [];
      for (let j = 0; j < 4; j++) {
        const particle = this.add.circle(
          iceShard.x + (Math.random() - 0.5) * 10,
          iceShard.y + (Math.random() - 0.5) * 10,
          1, 0xffffff, 0.6
        );
        frostParticles.push(particle);
      }
      
      let targetX, targetY;
      switch (this.currentDirection) {
        case 'up':
          targetX = iceShard.x;
          targetY = iceShard.y - 300;
          break;
        case 'down':
          targetX = iceShard.x;
          targetY = iceShard.y + 300;
          break;
        case 'left':
          targetX = iceShard.x - 300;
          targetY = iceShard.y;
          break;
        case 'right':
          targetX = iceShard.x + 300;
          targetY = iceShard.y;
          break;
      }
      
      this.tweens.add({
        targets: [iceShard, iceCore, ...frostParticles],
        x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
        duration: 500, ease: 'Power2',
        onUpdate: () => {
          // Rotate frost particles around shard
          frostParticles.forEach((particle, index) => {
            const angle = (Date.now() * 0.02) + (index * Math.PI / 2);
            particle.x = iceShard.x + Math.cos(angle) * 8;
            particle.y = iceShard.y + Math.sin(angle) * 8;
          });
          
          const collision = this.checkSpellCollision(iceShard.x, iceShard.y, 12, 20);
          if (collision) {
            iceShard.destroy();
            iceCore.destroy();
            frostParticles.forEach(p => p.destroy());
          }
        },
        onComplete: () => {
          // Create ice burst with freezing effect
          const burst = this.add.circle(targetX, targetY, 35, 0x00ffff, 0.6);
          burst.setStrokeStyle(2, 0xffffff, 0.8);
          
          // Add freezing spikes
          for (let k = 0; k < 6; k++) {
            const spike = this.add.circle(
              targetX + Math.cos(k * Math.PI / 3) * 25,
              targetY + Math.sin(k * Math.PI / 3) * 25,
              3, 0xffffff, 0.8
            );
            this.tweens.add({
              targets: spike, scaleX: 2, scaleY: 2, alpha: 0, duration: 300,
              onComplete: () => spike.destroy()
            });
          }
          
          this.tweens.add({
            targets: burst, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 300,
            onComplete: () => burst.destroy()
          });
          iceShard.destroy();
          iceCore.destroy();
          frostParticles.forEach(p => p.destroy());
        }
      });
      
      shards.push({ shard: iceShard, core: iceCore, particles: frostParticles });
    }
  }

  createShadowBoltEffect() {
    // Create a shadow bolt that splits into multiple tendrils
    const shadowBolt = this.add.circle(
      this.player.x, this.player.y, 20, 0x800080, 0.9
    );
    shadowBolt.setStrokeStyle(4, 0x4b0082, 1);
    
    const shadowCore = this.add.circle(
      shadowBolt.x, shadowBolt.y, 12, 0x4b0082, 0.8
    );
    shadowCore.setStrokeStyle(2, 0x800080, 0.9);
    
    // Create shadow tendrils that orbit around the bolt
    const tendrils = [];
    for (let i = 0; i < 5; i++) {
      const tendril = this.add.circle(
        shadowBolt.x + Math.cos(i * Math.PI * 2 / 5) * 15,
        shadowBolt.y + Math.sin(i * Math.PI * 2 / 5) * 15,
        4, 0x4b0082, 0.7
      );
      tendrils.push(tendril);
    }
    
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = shadowBolt.x;
        targetY = shadowBolt.y - 350;
        break;
      case 'down':
        targetX = shadowBolt.x;
        targetY = shadowBolt.y + 350;
        break;
      case 'left':
        targetX = shadowBolt.x - 350;
        targetY = shadowBolt.y;
        break;
      case 'right':
        targetX = shadowBolt.x + 350;
        targetY = shadowBolt.y;
        break;
    }
    
    this.tweens.add({
      targets: [shadowBolt, shadowCore, ...tendrils],
      x: targetX, y: targetY, scaleX: 1.4, scaleY: 1.4,
      duration: 750, ease: 'Power2',
      onUpdate: () => {
        // Rotate tendrils around the bolt
        tendrils.forEach((tendril, index) => {
          const angle = (Date.now() * 0.015) + (index * Math.PI * 2 / 5);
          tendril.x = shadowBolt.x + Math.cos(angle) * 18;
          tendril.y = shadowBolt.y + Math.sin(angle) * 18;
        });
        
        // Add shadow mist trail
        const mist = this.add.circle(
          shadowBolt.x + (Math.random() - 0.5) * 30,
          shadowBolt.y + (Math.random() - 0.5) * 30,
          2, 0x800080, 0.5
        );
        this.time.delayedCall(200, () => mist.destroy());
        
        const collision = this.checkSpellCollision(shadowBolt.x, shadowBolt.y, 20, 30);
        if (collision) {
          shadowBolt.destroy();
          shadowCore.destroy();
          tendrils.forEach(t => t.destroy());
        }
      },
      onComplete: () => {
        // Create shadow explosion with void effect
        const burst = this.add.circle(targetX, targetY, 50, 0x800080, 0.6);
        burst.setStrokeStyle(2, 0x4b0082, 0.8);
        
        // Add void tendrils expanding outward
        for (let k = 0; k < 8; k++) {
          const voidTendril = this.add.circle(
            targetX + Math.cos(k * Math.PI / 4) * 35,
            targetY + Math.sin(k * Math.PI / 4) * 35,
            5, 0x4b0082, 0.8
          );
          this.tweens.add({
            targets: voidTendril, scaleX: 3, scaleY: 3, alpha: 0, duration: 400,
            onComplete: () => voidTendril.destroy()
          });
        }
        
        this.tweens.add({
          targets: burst, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 350,
          onComplete: () => burst.destroy()
        });
        shadowBolt.destroy();
        shadowCore.destroy();
        tendrils.forEach(t => t.destroy());
      }
    });
  }

  createGoldenRayEffect() {
    // Create a divine golden ray with holy light effects
    const goldenRay = this.add.circle(
      this.player.x, this.player.y, 18, 0xffd700, 0.9
    );
    goldenRay.setStrokeStyle(4, 0xffed4e, 1);
    
    const goldenCore = this.add.circle(
      goldenRay.x, goldenRay.y, 10, 0xffed4e, 0.8
    );
    goldenCore.setStrokeStyle(2, 0xffd700, 0.9);
    
    // Create holy light rays emanating from the core
    const lightRays = [];
    for (let i = 0; i < 6; i++) {
      const ray = this.add.circle(
        goldenRay.x + Math.cos(i * Math.PI / 3) * 12,
        goldenRay.y + Math.sin(i * Math.PI / 3) * 12,
        2, 0xffffff, 0.9
      );
      lightRays.push(ray);
    }
    
    // Add divine sparkles
    const sparkles = [];
    for (let j = 0; j < 4; j++) {
      const sparkle = this.add.circle(
        goldenRay.x + (Math.random() - 0.5) * 15,
        goldenRay.y + (Math.random() - 0.5) * 15,
        1, 0xffffff, 0.8
      );
      sparkles.push(sparkle);
    }
    
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = goldenRay.x;
        targetY = goldenRay.y - 320;
        break;
      case 'down':
        targetX = goldenRay.x;
        targetY = goldenRay.y + 320;
        break;
      case 'left':
        targetX = goldenRay.x - 320;
        targetY = goldenRay.y;
        break;
      case 'right':
        targetX = goldenRay.x + 320;
        targetY = goldenRay.y;
        break;
    }
    
    this.tweens.add({
      targets: [goldenRay, goldenCore, ...lightRays, ...sparkles],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 650, ease: 'Power2',
      onUpdate: () => {
        // Rotate light rays around the core
        lightRays.forEach((ray, index) => {
          const angle = (Date.now() * 0.02) + (index * Math.PI / 3);
          ray.x = goldenRay.x + Math.cos(angle) * 15;
          ray.y = goldenRay.y + Math.sin(angle) * 15;
        });
        
        // Animate sparkles with pulsing effect
        sparkles.forEach((sparkle, index) => {
          const pulse = Math.sin(Date.now() * 0.01 + index) * 0.3 + 0.7;
          sparkle.setAlpha(pulse);
        });
        
        // Add divine trail
        const divineTrail = this.add.circle(
          goldenRay.x + (Math.random() - 0.5) * 25,
          goldenRay.y + (Math.random() - 0.5) * 25,
          2, 0xffd700, 0.7
        );
        this.time.delayedCall(150, () => divineTrail.destroy());
        
        const collision = this.checkSpellCollision(goldenRay.x, goldenRay.y, 18, 26);
        if (collision) {
          goldenRay.destroy();
          goldenCore.destroy();
          lightRays.forEach(r => r.destroy());
          sparkles.forEach(s => s.destroy());
        }
      },
      onComplete: () => {
        // Create divine explosion with holy light
        const burst = this.add.circle(targetX, targetY, 45, 0xffd700, 0.6);
        burst.setStrokeStyle(2, 0xffed4e, 0.8);
        
        // Add holy light beams
        for (let k = 0; k < 8; k++) {
          const beam = this.add.circle(
            targetX + Math.cos(k * Math.PI / 4) * 30,
            targetY + Math.sin(k * Math.PI / 4) * 30,
            3, 0xffffff, 0.9
          );
          this.tweens.add({
            targets: beam, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 350,
            onComplete: () => beam.destroy()
          });
        }
        
        this.tweens.add({
          targets: burst, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 320,
          onComplete: () => burst.destroy()
        });
        goldenRay.destroy();
        goldenCore.destroy();
        lightRays.forEach(r => r.destroy());
        sparkles.forEach(s => s.destroy());
      }
    });
  }

  createIronShotEffect() {
    // Create a heavy iron projectile with metallic effects
    const ironShot = this.add.circle(
      this.player.x, this.player.y, 19, 0x696969, 0.9
    );
    ironShot.setStrokeStyle(5, 0x2f4f4f, 1);
    
    const ironCore = this.add.circle(
      ironShot.x, ironShot.y, 11, 0x2f4f4f, 0.8
    );
    ironCore.setStrokeStyle(3, 0x696969, 0.9);
    
    // Add metallic plates around the shot
    const plates = [];
    for (let i = 0; i < 4; i++) {
      const plate = this.add.circle(
        ironShot.x + Math.cos(i * Math.PI / 2) * 12,
        ironShot.y + Math.sin(i * Math.PI / 2) * 12,
        3, 0x808080, 0.7
      );
      plates.push(plate);
    }
    
    // Add iron shards that trail behind
    const shards = [];
    for (let j = 0; j < 3; j++) {
      const shard = this.add.circle(
        ironShot.x - (j + 1) * 8, ironShot.y, 2, 0x696969, 0.6
      );
      shards.push(shard);
    }
    
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = ironShot.x;
        targetY = ironShot.y - 330;
        break;
      case 'down':
        targetX = ironShot.x;
        targetY = ironShot.y + 330;
        break;
      case 'left':
        targetX = ironShot.x - 330;
        targetY = ironShot.y;
        break;
      case 'right':
        targetX = ironShot.x + 330;
        targetY = ironShot.y;
        break;
    }
    
    this.tweens.add({
      targets: [ironShot, ironCore, ...plates, ...shards],
      x: targetX, y: targetY, scaleX: 1.2, scaleY: 1.2,
      duration: 700, ease: 'Power2',
      onUpdate: () => {
        // Rotate plates around the shot
        plates.forEach((plate, index) => {
          const angle = (Date.now() * 0.01) + (index * Math.PI / 2);
          plate.x = ironShot.x + Math.cos(angle) * 14;
          plate.y = ironShot.y + Math.sin(angle) * 14;
        });
        
        // Update shard positions to trail behind
        shards.forEach((shard, index) => {
          const offset = (index + 1) * 10;
          switch (this.currentDirection) {
            case 'up':
              shard.x = ironShot.x; shard.y = ironShot.y + offset;
              break;
            case 'down':
              shard.x = ironShot.x; shard.y = ironShot.y - offset;
              break;
            case 'left':
              shard.x = ironShot.x + offset; shard.y = ironShot.y;
              break;
            case 'right':
              shard.x = ironShot.x - offset; shard.y = ironShot.y;
              break;
          }
        });
        
        // Add metallic sparks
        const spark = this.add.circle(
          ironShot.x + (Math.random() - 0.5) * 25,
          ironShot.y + (Math.random() - 0.5) * 25,
          2, 0x696969, 0.8
        );
        this.time.delayedCall(120, () => spark.destroy());
        
        const collision = this.checkSpellCollision(ironShot.x, ironShot.y, 19, 24);
        if (collision) {
          ironShot.destroy();
          ironCore.destroy();
          plates.forEach(p => p.destroy());
          shards.forEach(s => s.destroy());
        }
      },
      onComplete: () => {
        // Create metallic explosion with iron fragments
        const burst = this.add.circle(targetX, targetY, 48, 0x696969, 0.6);
        burst.setStrokeStyle(2, 0x2f4f4f, 0.8);
        
        // Add iron fragments flying outward
        for (let k = 0; k < 6; k++) {
          const fragment = this.add.circle(
            targetX + Math.cos(k * Math.PI / 3) * 28,
            targetY + Math.sin(k * Math.PI / 3) * 28,
            4, 0x2f4f4f, 0.8
          );
          this.tweens.add({
            targets: fragment, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 400,
            onComplete: () => fragment.destroy()
          });
        }
        
        this.tweens.add({
          targets: burst, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 320,
          onComplete: () => burst.destroy()
        });
        ironShot.destroy();
        ironCore.destroy();
        plates.forEach(p => p.destroy());
        shards.forEach(s => s.destroy());
      }
    });
  }

  createFistBlastEffect() {
    // Create a powerful fist blast with boxing glove effect
    const fistBlast = this.add.circle(
      this.player.x, this.player.y, 22, 0xff6b35, 0.9
    );
    fistBlast.setStrokeStyle(5, 0xff4500, 1);
    
    const fistCore = this.add.circle(
      fistBlast.x, fistBlast.y, 12, 0xff4500, 0.8
    );
    fistCore.setStrokeStyle(3, 0xff6b35, 0.9);
    
    // Add boxing glove knuckles
    const knuckles = [];
    for (let i = 0; i < 3; i++) {
      const knuckle = this.add.circle(
        fistBlast.x + (i - 1) * 8, fistBlast.y, 4, 0xff4500, 0.8
      );
      knuckles.push(knuckle);
    }
    
    // Add impact lines that trail behind
    const impactLines = [];
    for (let j = 0; j < 4; j++) {
      const line = this.add.circle(
        fistBlast.x - (j + 1) * 12, fistBlast.y, 2, 0xff6b35, 0.6
      );
      impactLines.push(line);
    }
    
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = fistBlast.x;
        targetY = fistBlast.y - 340;
        break;
      case 'down':
        targetX = fistBlast.x;
        targetY = fistBlast.y + 340;
        break;
      case 'left':
        targetX = fistBlast.x - 340;
        targetY = fistBlast.y;
        break;
      case 'right':
        targetX = fistBlast.x + 340;
        targetY = fistBlast.y;
        break;
    }
    
    this.tweens.add({
      targets: [fistBlast, fistCore, ...knuckles, ...impactLines],
      x: targetX, y: targetY, scaleX: 1.4, scaleY: 1.4,
      duration: 750, ease: 'Power2',
      onUpdate: () => {
        // Animate knuckles with pulsing effect
        knuckles.forEach((knuckle, index) => {
          const pulse = Math.sin(Date.now() * 0.02 + index) * 0.2 + 0.8;
          knuckle.setAlpha(pulse);
        });
        
        // Update impact lines to trail behind
        impactLines.forEach((line, index) => {
          const offset = (index + 1) * 15;
          switch (this.currentDirection) {
            case 'up':
              line.x = fistBlast.x; line.y = fistBlast.y + offset;
              break;
            case 'down':
              line.x = fistBlast.x; line.y = fistBlast.y - offset;
              break;
            case 'left':
              line.x = fistBlast.x + offset; line.y = fistBlast.y;
              break;
            case 'right':
              line.x = fistBlast.x - offset; line.y = fistBlast.y;
              break;
          }
        });
        
        // Add impact sparks
        const spark = this.add.circle(
          fistBlast.x + (Math.random() - 0.5) * 28,
          fistBlast.y + (Math.random() - 0.5) * 28,
          3, 0xff6b35, 0.8
        );
        this.time.delayedCall(140, () => spark.destroy());
        
        const collision = this.checkSpellCollision(fistBlast.x, fistBlast.y, 22, 32);
        if (collision) {
          fistBlast.destroy();
          fistCore.destroy();
          knuckles.forEach(k => k.destroy());
          impactLines.forEach(l => l.destroy());
        }
      },
      onComplete: () => {
        // Create impact explosion with shockwave
        const burst = this.add.circle(targetX, targetY, 52, 0xff6b35, 0.6);
        burst.setStrokeStyle(2, 0xff4500, 0.8);
        
        // Add impact shockwave rings
        for (let k = 0; k < 3; k++) {
          const shockwave = this.add.circle(targetX, targetY, 30 + k * 15, 0xff4500, 0.4);
          this.tweens.add({
            targets: shockwave, scaleX: 2, scaleY: 2, alpha: 0, duration: 300 + k * 100,
            onComplete: () => shockwave.destroy()
          });
        }
        
        // Add impact particles
        for (let l = 0; l < 8; l++) {
          const particle = this.add.circle(
            targetX + Math.cos(l * Math.PI / 4) * 35,
            targetY + Math.sin(l * Math.PI / 4) * 35,
            3, 0xff6b35, 0.8
          );
          this.tweens.add({
            targets: particle, scaleX: 2, scaleY: 2, alpha: 0, duration: 350,
            onComplete: () => particle.destroy()
          });
        }
        
        this.tweens.add({
          targets: burst, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 350,
          onComplete: () => burst.destroy()
        });
        fistBlast.destroy();
        fistCore.destroy();
        knuckles.forEach(k => k.destroy());
        impactLines.forEach(l => l.destroy());
      }
    });
  }

  createShadowStrikeEffect() {
    // Ironhearth's sideways slash - throws a sword with epic effects
    
    // Create sword with proper positioning from player
    const swordLength = 30;
    const swordWidth = 6;
    let startX, startY, endX, endY;
    
    switch (this.currentDirection) {
      case 'up':
        startX = this.player.x;
        startY = this.player.y - 15;
        endX = this.player.x;
        endY = this.player.y - 280;
        break;
      case 'down':
        startX = this.player.x;
        startY = this.player.y + 15;
        endX = this.player.x;
        endY = this.player.y + 280;
        break;
      case 'left':
        startX = this.player.x - 15;
        startY = this.player.y;
        endX = this.player.x - 280;
        endY = this.player.y;
        break;
      case 'right':
        startX = this.player.x + 15;
        startY = this.player.y;
        endX = this.player.x + 280;
        endY = this.player.y;
        break;
    }
    
    // Sword blade with metallic gradient effect
    const sword = this.add.rectangle(startX, startY, swordLength, swordWidth, 0x4169e1, 0.9);
    sword.setStrokeStyle(2, 0x1e3a8a, 1);
    
    // Sword handle with leather texture
    const handle = this.add.rectangle(startX, startY, 8, 12, 0x8b4513, 0.8);
    handle.setStrokeStyle(1, 0x654321, 1);
    
    // Sword tip with sharp edge
    const tip = this.add.triangle(
      startX + (this.currentDirection === 'right' ? swordLength/2 : -swordLength/2),
      startY, 0, 0, 6, 3, 0, 6, 0x1e3a8a, 0.9
    );
    
    // Energy aura around sword
    const aura = this.add.ellipse(startX, startY, swordLength + 8, swordWidth + 8, 0x4169e1, 0.3);
    
    // Casting effect from player
    const castEffect = this.add.circle(this.player.x, this.player.y, 20, 0x4169e1, 0.6);
    this.tweens.add({
      targets: castEffect,
      scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
      onComplete: () => castEffect.destroy()
    });
    
    this.tweens.add({
      targets: [sword, handle, tip, aura],
      x: [endX, endX, endX + (this.currentDirection === 'right' ? swordLength/2 : -swordLength/2), endX],
      y: [endY, endY, endY, endY],
      rotation: Math.PI * 2,
      duration: 500, ease: 'Power2',
      onUpdate: () => {
        // Metal sparkles and energy particles
        for (let i = 0; i < 3; i++) {
          const sparkle = this.add.circle(
            sword.x + (Math.random() - 0.5) * 25,
            sword.y + (Math.random() - 0.5) * 25,
            Math.random() * 2 + 1, 0x4169e1, 0.8
          );
          this.time.delayedCall(80, () => sparkle.destroy());
        }
        
        // Energy trail effect
        const trail = this.add.circle(
          sword.x + (Math.random() - 0.5) * 15,
          sword.y + (Math.random() - 0.5) * 15,
          2, 0x1e3a8a, 0.6
        );
        this.time.delayedCall(60, () => trail.destroy());
        
        const collision = this.checkSpellCollision(sword.x, sword.y, 12, 25);
        if (collision) {
          sword.destroy();
          handle.destroy();
          tip.destroy();
          aura.destroy();
        }
      },
      onComplete: () => {
        // Epic sword impact with multiple effects
        const impact = this.add.circle(endX, endY, 40, 0x4169e1, 0.7);
        impact.setStrokeStyle(3, 0x1e3a8a, 0.9);
        
        // Impact shockwave
        const shockwave = this.add.circle(endX, endY, 20, 0xffffff, 0.8);
        this.tweens.add({
          targets: shockwave,
          scaleX: 3, scaleY: 3, alpha: 0, duration: 300,
          onComplete: () => shockwave.destroy()
        });
        
        // Metal fragments burst
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const fragment = this.add.circle(
            endX + Math.cos(angle) * 30,
            endY + Math.sin(angle) * 30,
            3, 0x4169e1, 0.8
          );
          this.tweens.add({
            targets: fragment,
            x: endX + Math.cos(angle) * 60,
            y: endY + Math.sin(angle) * 60,
            alpha: 0, duration: 400,
            onComplete: () => fragment.destroy()
          });
        }
        
        this.tweens.add({
          targets: impact, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 350,
          onComplete: () => impact.destroy()
        });
        sword.destroy();
        handle.destroy();
        tip.destroy();
        aura.destroy();
      }
    });
  }

  createHellfireEffect() {
    // FIST KING throws two fists with epic boxing effects
    
    // Calculate positions from player
    let startX1, startY1, startX2, startY2, endX1, endY1, endX2, endY2;
    
    switch (this.currentDirection) {
      case 'up':
        startX1 = this.player.x - 10;
        startY1 = this.player.y - 15;
        startX2 = this.player.x + 10;
        startY2 = this.player.y - 15;
        endX1 = this.player.x - 10;
        endY1 = this.player.y - 320;
        endX2 = this.player.x + 10;
        endY2 = this.player.y - 320;
        break;
      case 'down':
        startX1 = this.player.x - 10;
        startY1 = this.player.y + 15;
        startX2 = this.player.x + 10;
        startY2 = this.player.y + 15;
        endX1 = this.player.x - 10;
        endY1 = this.player.y + 320;
        endX2 = this.player.x + 10;
        endY2 = this.player.y + 320;
        break;
      case 'left':
        startX1 = this.player.x - 15;
        startY1 = this.player.y - 10;
        startX2 = this.player.x - 15;
        startY2 = this.player.y + 10;
        endX1 = this.player.x - 320;
        endY1 = this.player.y - 10;
        endX2 = this.player.x - 320;
        endY2 = this.player.y + 10;
        break;
      case 'right':
        startX1 = this.player.x + 15;
        startY1 = this.player.y - 10;
        startX2 = this.player.x + 15;
        startY2 = this.player.y + 10;
        endX1 = this.player.x + 320;
        endY1 = this.player.y - 10;
        endX2 = this.player.x + 320;
        endY2 = this.player.y + 10;
        break;
    }
    
    // Boxing glove fist 1 with detailed design
    const fist1 = this.add.ellipse(startX1, startY1, 14, 10, 0xffd700, 0.9);
    fist1.setStrokeStyle(3, 0xff8c00, 1);
    
    // Boxing glove fist 2
    const fist2 = this.add.ellipse(startX2, startY2, 14, 10, 0xffd700, 0.9);
    fist2.setStrokeStyle(3, 0xff8c00, 1);
    
    // Knuckle details with metallic shine
    const knuckle1 = this.add.circle(startX1, startY1, 4, 0xff8c00, 0.9);
    knuckle1.setStrokeStyle(1, 0xff4500, 1);
    
    const knuckle2 = this.add.circle(startX2, startY2, 4, 0xff8c00, 0.9);
    knuckle2.setStrokeStyle(1, 0xff4500, 1);
    
    // Energy auras around fists
    const aura1 = this.add.ellipse(startX1, startY1, 20, 14, 0xffd700, 0.4);
    const aura2 = this.add.ellipse(startX2, startY2, 20, 14, 0xffd700, 0.4);
    
    // Casting effect from player
    const castEffect = this.add.circle(this.player.x, this.player.y, 25, 0xffd700, 0.7);
    this.tweens.add({
      targets: castEffect,
      scaleX: 0, scaleY: 0, alpha: 0, duration: 250,
      onComplete: () => castEffect.destroy()
    });
    
    this.tweens.add({
      targets: [fist1, fist2, knuckle1, knuckle2, aura1, aura2],
      x: [endX1, endX2, endX1, endX2, endX1, endX2],
      y: [endY1, endY2, endY1, endY2, endY1, endY2],
      scaleX: [1.4, 1.4, 1.4, 1.4, 1.4, 1.4],
      scaleY: [1.4, 1.4, 1.4, 1.4, 1.4, 1.4],
      duration: 600, ease: 'Power2',
      onUpdate: () => {
        // Impact lines and energy trails
        const line1 = this.add.line(
          fist1.x, fist1.y, fist1.x - 12, fist1.y, 0xff8c00, 0.8
        );
        line1.setLineWidth(2);
        
        const line2 = this.add.line(
          fist2.x, fist2.y, fist2.x - 12, fist2.y, 0xff8c00, 0.8
        );
        line2.setLineWidth(2);
        
        this.time.delayedCall(100, () => {
          line1.destroy();
          line2.destroy();
        });
        
        // Energy particles around fists
        for (let i = 0; i < 2; i++) {
          const particle1 = this.add.circle(
            fist1.x + (Math.random() - 0.5) * 20,
            fist1.y + (Math.random() - 0.5) * 20,
            Math.random() * 2 + 1, 0xffd700, 0.7
          );
          const particle2 = this.add.circle(
            fist2.x + (Math.random() - 0.5) * 20,
            fist2.y + (Math.random() - 0.5) * 20,
            Math.random() * 2 + 1, 0xffd700, 0.7
          );
          this.time.delayedCall(70, () => {
            particle1.destroy();
            particle2.destroy();
          });
        }
        
        const collision1 = this.checkSpellCollision(fist1.x, fist1.y, 10, 30);
        const collision2 = this.checkSpellCollision(fist2.x, fist2.y, 10, 30);
        if (collision1 || collision2) {
          fist1.destroy();
          fist2.destroy();
          knuckle1.destroy();
          knuckle2.destroy();
          aura1.destroy();
          aura2.destroy();
        }
      },
      onComplete: () => {
        // Epic double fist impact with boxing effects
        const impact1 = this.add.circle(endX1, endY1, 35, 0xffd700, 0.7);
        impact1.setStrokeStyle(3, 0xff8c00, 0.9);
        
        const impact2 = this.add.circle(endX2, endY2, 35, 0xffd700, 0.7);
        impact2.setStrokeStyle(3, 0xff8c00, 0.9);
        
        // Boxing ring bell sound effect (visual)
        const bell1 = this.add.circle(endX1, endY1, 15, 0xffffff, 0.9);
        const bell2 = this.add.circle(endX2, endY2, 15, 0xffffff, 0.9);
        
        // Impact shockwaves
        const shockwave1 = this.add.circle(endX1, endY1, 25, 0xff8c00, 0.6);
        const shockwave2 = this.add.circle(endX2, endY2, 25, 0xff8c00, 0.6);
        
        this.tweens.add({
          targets: [shockwave1, shockwave2],
          scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 400,
          onComplete: () => {
            shockwave1.destroy();
            shockwave2.destroy();
          }
        });
        
        this.tweens.add({
          targets: [impact1, impact2, bell1, bell2],
          scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 350,
          onComplete: () => {
            impact1.destroy();
            impact2.destroy();
            bell1.destroy();
            bell2.destroy();
          }
        });
        
        fist1.destroy();
        fist2.destroy();
        knuckle1.destroy();
        knuckle2.destroy();
        aura1.destroy();
        aura2.destroy();
      }
    });
  }

  createCrimsonShotEffect() {
    // Player10 throws daggers quickly with assassin precision
    
    // Calculate positions from player
    let startX1, startY1, startX2, startY2, startX3, startY3, endX1, endY1, endX2, endY2, endX3, endY3;
    
    switch (this.currentDirection) {
      case 'up':
        startX1 = this.player.x - 8;
        startY1 = this.player.y - 15;
        startX2 = this.player.x;
        startY2 = this.player.y - 15;
        startX3 = this.player.x + 8;
        startY3 = this.player.y - 15;
        endX1 = this.player.x - 8;
        endY1 = this.player.y - 250;
        endX2 = this.player.x;
        endY2 = this.player.y - 250;
        endX3 = this.player.x + 8;
        endY3 = this.player.y - 250;
        break;
      case 'down':
        startX1 = this.player.x - 8;
        startY1 = this.player.y + 15;
        startX2 = this.player.x;
        startY2 = this.player.y + 15;
        startX3 = this.player.x + 8;
        startY3 = this.player.y + 15;
        endX1 = this.player.x - 8;
        endY1 = this.player.y + 250;
        endX2 = this.player.x;
        endY2 = this.player.y + 250;
        endX3 = this.player.x + 8;
        endY3 = this.player.y + 250;
        break;
      case 'left':
        startX1 = this.player.x - 15;
        startY1 = this.player.y - 8;
        startX2 = this.player.x - 15;
        startY2 = this.player.y;
        startX3 = this.player.x - 15;
        startY3 = this.player.y + 8;
        endX1 = this.player.x - 250;
        endY1 = this.player.y - 8;
        endX2 = this.player.x - 250;
        endY2 = this.player.y;
        endX3 = this.player.x - 250;
        endY3 = this.player.y + 8;
        break;
      case 'right':
        startX1 = this.player.x + 15;
        startY1 = this.player.y - 8;
        startX2 = this.player.x + 15;
        startY2 = this.player.y;
        startX3 = this.player.x + 15;
        startY3 = this.player.y + 8;
        endX1 = this.player.x + 250;
        endY1 = this.player.y - 8;
        endX2 = this.player.x + 250;
        endY2 = this.player.y;
        endX3 = this.player.x + 250;
        endY3 = this.player.y + 8;
        break;
    }
    
    // Create daggers with detailed design
    const dagger1 = this.add.triangle(startX1, startY1, 0, 0, 8, 4, 0, 8, 0xdc143c, 0.9);
    dagger1.setStrokeStyle(2, 0x8b0000, 1);
    
    const dagger2 = this.add.triangle(startX2, startY2, 0, 0, 8, 4, 0, 8, 0xdc143c, 0.9);
    dagger2.setStrokeStyle(2, 0x8b0000, 1);
    
    const dagger3 = this.add.triangle(startX3, startY3, 0, 0, 8, 4, 0, 8, 0xdc143c, 0.9);
    dagger3.setStrokeStyle(2, 0x8b0000, 1);
    
    // Dagger handles with leather wrapping
    const handle1 = this.add.rectangle(startX1, startY1, 3, 10, 0x8b4513, 0.8);
    handle1.setStrokeStyle(1, 0x654321, 1);
    
    const handle2 = this.add.rectangle(startX2, startY2, 3, 10, 0x8b4513, 0.8);
    handle2.setStrokeStyle(1, 0x654321, 1);
    
    const handle3 = this.add.rectangle(startX3, startY3, 3, 10, 0x8b4513, 0.8);
    handle3.setStrokeStyle(1, 0x654321, 1);
    
    // Energy auras around daggers
    const aura1 = this.add.ellipse(startX1, startY1, 12, 8, 0xdc143c, 0.4);
    const aura2 = this.add.ellipse(startX2, startY2, 12, 8, 0xdc143c, 0.4);
    const aura3 = this.add.ellipse(startX3, startY3, 12, 8, 0xdc143c, 0.4);
    
    // Casting effect from player
    const castEffect = this.add.circle(this.player.x, this.player.y, 20, 0xdc143c, 0.7);
    this.tweens.add({
      targets: castEffect,
      scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
      onComplete: () => castEffect.destroy()
    });
    
    this.tweens.add({
      targets: [dagger1, dagger2, dagger3, handle1, handle2, handle3, aura1, aura2, aura3],
      x: [endX1, endX2, endX3, endX1, endX2, endX3, endX1, endX2, endX3],
      y: [endY1, endY2, endY3, endY1, endY2, endY3, endY1, endY2, endY3],
      rotation: [Math.PI * 3, Math.PI * 3, Math.PI * 3, Math.PI * 3, Math.PI * 3, Math.PI * 3, Math.PI * 3, Math.PI * 3, Math.PI * 3],
      duration: 350, ease: 'Power2',
      onUpdate: () => {
        // Assassin's precision trails
        for (let i = 0; i < 2; i++) {
          const trail1 = this.add.circle(
            dagger1.x + (Math.random() - 0.5) * 12,
            dagger1.y + (Math.random() - 0.5) * 12,
            Math.random() * 1.5 + 0.5, 0xdc143c, 0.7
          );
          const trail2 = this.add.circle(
            dagger2.x + (Math.random() - 0.5) * 12,
            dagger2.y + (Math.random() - 0.5) * 12,
            Math.random() * 1.5 + 0.5, 0xdc143c, 0.7
          );
          const trail3 = this.add.circle(
            dagger3.x + (Math.random() - 0.5) * 12,
            dagger3.y + (Math.random() - 0.5) * 12,
            Math.random() * 1.5 + 0.5, 0xdc143c, 0.7
          );
          this.time.delayedCall(40, () => {
            trail1.destroy();
            trail2.destroy();
            trail3.destroy();
          });
        }
        
        // Blood-red energy particles
        const particle1 = this.add.circle(
          dagger1.x + (Math.random() - 0.5) * 8,
          dagger1.y + (Math.random() - 0.5) * 8,
          1, 0x8b0000, 0.8
        );
        const particle2 = this.add.circle(
          dagger2.x + (Math.random() - 0.5) * 8,
          dagger2.y + (Math.random() - 0.5) * 8,
          1, 0x8b0000, 0.8
        );
        const particle3 = this.add.circle(
          dagger3.x + (Math.random() - 0.5) * 8,
          dagger3.y + (Math.random() - 0.5) * 8,
          1, 0x8b0000, 0.8
        );
        this.time.delayedCall(30, () => {
          particle1.destroy();
          particle2.destroy();
          particle3.destroy();
        });
        
        const collision1 = this.checkSpellCollision(dagger1.x, dagger1.y, 5, 25);
        const collision2 = this.checkSpellCollision(dagger2.x, dagger2.y, 5, 25);
        const collision3 = this.checkSpellCollision(dagger3.x, dagger3.y, 5, 25);
        if (collision1 || collision2 || collision3) {
          dagger1.destroy();
          dagger2.destroy();
          dagger3.destroy();
          handle1.destroy();
          handle2.destroy();
          handle3.destroy();
          aura1.destroy();
          aura2.destroy();
          aura3.destroy();
        }
      },
      onComplete: () => {
        // Assassin's precision impacts
        const impact1 = this.add.circle(endX1, endY1, 22, 0xdc143c, 0.7);
        impact1.setStrokeStyle(2, 0x8b0000, 0.9);
        
        const impact2 = this.add.circle(endX2, endY2, 22, 0xdc143c, 0.7);
        impact2.setStrokeStyle(2, 0x8b0000, 0.9);
        
        const impact3 = this.add.circle(endX3, endY3, 22, 0xdc143c, 0.7);
        impact3.setStrokeStyle(2, 0x8b0000, 0.9);
        
        // Blood splatter effects
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const splatter1 = this.add.circle(
            endX1 + Math.cos(angle) * 15,
            endY1 + Math.sin(angle) * 15,
            2, 0x8b0000, 0.8
          );
          const splatter2 = this.add.circle(
            endX2 + Math.cos(angle) * 15,
            endY2 + Math.sin(angle) * 15,
            2, 0x8b0000, 0.8
          );
          const splatter3 = this.add.circle(
            endX3 + Math.cos(angle) * 15,
            endY3 + Math.sin(angle) * 15,
            2, 0x8b0000, 0.8
          );
          this.tweens.add({
            targets: [splatter1, splatter2, splatter3],
            x: [endX1 + Math.cos(angle) * 30, endX2 + Math.cos(angle) * 30, endX3 + Math.cos(angle) * 30],
            y: [endY1 + Math.sin(angle) * 30, endY2 + Math.sin(angle) * 30, endY3 + Math.sin(angle) * 30],
            alpha: 0, duration: 300,
            onComplete: () => {
              splatter1.destroy();
              splatter2.destroy();
              splatter3.destroy();
            }
          });
        }
        
        this.tweens.add({
          targets: [impact1, impact2, impact3],
          scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 250,
          onComplete: () => {
            impact1.destroy();
            impact2.destroy();
            impact3.destroy();
          }
        });
        
        dagger1.destroy();
        dagger2.destroy();
        dagger3.destroy();
        handle1.destroy();
        handle2.destroy();
        handle3.destroy();
        aura1.destroy();
        aura2.destroy();
        aura3.destroy();
      }
    });
  }

  createGladiatorSpearEffect() {
    // Player11 giant magma balls with volcanic fury
    
    // Calculate positions from player
    let startX, startY, endX, endY;
    
    switch (this.currentDirection) {
      case 'up':
        startX = this.player.x;
        startY = this.player.y - 20;
        endX = this.player.x;
        endY = this.player.y - 380;
        break;
      case 'down':
        startX = this.player.x;
        startY = this.player.y + 20;
        endX = this.player.x;
        endY = this.player.y + 380;
        break;
      case 'left':
        startX = this.player.x - 20;
        startY = this.player.y;
        endX = this.player.x - 380;
        endY = this.player.y;
        break;
      case 'right':
        startX = this.player.x + 20;
        startY = this.player.y;
        endX = this.player.x + 380;
        endY = this.player.y;
        break;
    }
    
    // Giant magma ball with molten core
    const magmaBall = this.add.circle(startX, startY, 30, 0xff4500, 0.9);
    magmaBall.setStrokeStyle(5, 0x8b0000, 1);
    
    // Molten core with intense heat
    const magmaCore = this.add.circle(startX, startY, 15, 0xff6347, 0.8);
    magmaCore.setStrokeStyle(3, 0xff4500, 0.9);
    
    // Inner core with white-hot center
    const innerCore = this.add.circle(startX, startY, 8, 0xffffff, 0.9);
    innerCore.setStrokeStyle(2, 0xff6347, 1);
    
    // Lava particles orbiting the ball
    const lavaParticles = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.add.circle(
        startX + Math.cos(angle) * 25,
        startY + Math.sin(angle) * 25,
        Math.random() * 3 + 2, 0xff6347, 0.8
      );
      lavaParticles.push(particle);
    }
    
    // Volcanic aura around the ball
    const volcanicAura = this.add.ellipse(startX, startY, 70, 50, 0xff4500, 0.3);
    
    // Casting effect from player
    const castEffect = this.add.circle(this.player.x, this.player.y, 30, 0xff4500, 0.8);
    this.tweens.add({
      targets: castEffect,
      scaleX: 0, scaleY: 0, alpha: 0, duration: 300,
      onComplete: () => castEffect.destroy()
    });
    
    this.tweens.add({
      targets: [magmaBall, magmaCore, innerCore, volcanicAura, ...lavaParticles],
      x: [endX, endX, endX, endX, ...lavaParticles.map(() => endX)],
      y: [endY, endY, endY, endY, ...lavaParticles.map(() => endY)],
      scaleX: 1.6, scaleY: 1.6,
      duration: 800, ease: 'Power2',
      onUpdate: () => {
        // Intense magma trail effect
        for (let i = 0; i < 3; i++) {
          const lavaDrop = this.add.circle(
            magmaBall.x + (Math.random() - 0.5) * 35,
            magmaBall.y + (Math.random() - 0.5) * 35,
            Math.random() * 4 + 3, 0xff6347, 0.8
          );
          this.time.delayedCall(180, () => lavaDrop.destroy());
        }
        
        // Rotate lava particles with volcanic energy
        lavaParticles.forEach((particle, index) => {
          const angle = (index / 12) * Math.PI * 2 + this.time.now * 0.015;
          particle.x = magmaBall.x + Math.cos(angle) * 25;
          particle.y = magmaBall.y + Math.sin(angle) * 25;
        });
        
        // Heat distortion effect
        const heatDistortion = this.add.circle(
          magmaBall.x + (Math.random() - 0.5) * 20,
          magmaBall.y + (Math.random() - 0.5) * 20,
          5, 0xffffff, 0.4
        );
        this.time.delayedCall(100, () => heatDistortion.destroy());
        
        const collision = this.checkSpellCollision(magmaBall.x, magmaBall.y, 30, 45);
        if (collision) {
          magmaBall.destroy();
          magmaCore.destroy();
          innerCore.destroy();
          volcanicAura.destroy();
          lavaParticles.forEach(p => p.destroy());
        }
      },
      onComplete: () => {
        // Epic volcanic explosion
        const explosion = this.add.circle(endX, endY, 75, 0xff4500, 0.7);
        explosion.setStrokeStyle(4, 0x8b0000, 0.9);
        
        // Volcanic shockwave
        const shockwave = this.add.circle(endX, endY, 40, 0xffffff, 0.8);
        this.tweens.add({
          targets: shockwave,
          scaleX: 4, scaleY: 4, alpha: 0, duration: 500,
          onComplete: () => shockwave.destroy()
        });
        
        // Lava burst with volcanic fury
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          const lavaBurst = this.add.circle(
            endX + Math.cos(angle) * 50,
            endY + Math.sin(angle) * 50,
            Math.random() * 6 + 4, 0xff6347, 0.8
          );
          this.tweens.add({
            targets: lavaBurst,
            x: endX + Math.cos(angle) * 100,
            y: endY + Math.sin(angle) * 100,
            alpha: 0, duration: 500,
            onComplete: () => lavaBurst.destroy()
          });
        }
        
        // Molten rock fragments
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const fragment = this.add.circle(
            endX + Math.cos(angle) * 30,
            endY + Math.sin(angle) * 30,
            4, 0x8b0000, 0.9
          );
          this.tweens.add({
            targets: fragment,
            x: endX + Math.cos(angle) * 60,
            y: endY + Math.sin(angle) * 60,
            alpha: 0, duration: 400,
            onComplete: () => fragment.destroy()
          });
        }
        
        this.tweens.add({
          targets: explosion, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 450,
          onComplete: () => explosion.destroy()
        });
        
        magmaBall.destroy();
        magmaCore.destroy();
        innerCore.destroy();
        volcanicAura.destroy();
        lavaParticles.forEach(p => p.destroy());
      }
    });
  }

  createPinkMistEffect() {
    // Player12 shoots tiny missiles repeatedly
    const missiles = [];
    const missileCount = 5;
    
    for (let i = 0; i < missileCount; i++) {
      const missile = this.add.rectangle(
        this.player.x + (i - 2) * 8, this.player.y, 6, 3, 0xff69b4, 0.9
      );
      missile.setStrokeStyle(1, 0xff1493, 1);
      
      // Missile tip
      const tip = this.add.triangle(
        missile.x + (this.currentDirection === 'right' ? 4 : -4),
        missile.y, 0, 0, 3, 1.5, 0, 3, 0xff1493, 0.9
      );
      
      missiles.push({ missile, tip });
    }
    
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = this.player.x;
        targetY = this.player.y - 300;
        break;
      case 'down':
        targetX = this.player.x;
        targetY = this.player.y + 300;
        break;
      case 'left':
        targetX = this.player.x - 300;
        targetY = this.player.y;
        break;
      case 'right':
        targetX = this.player.x + 300;
        targetY = this.player.y;
        break;
    }
    
    // Fire missiles in sequence
    missiles.forEach((missileObj, index) => {
      this.time.delayedCall(index * 100, () => {
        const targetXOffset = (index - 2) * 15;
        const finalX = targetX + targetXOffset;
        const finalY = targetY;
        
        this.tweens.add({
          targets: [missileObj.missile, missileObj.tip],
          x: [finalX, finalX + (this.currentDirection === 'right' ? 4 : -4)],
          y: [finalY, finalY],
          scaleX: 1.2, scaleY: 1.2,
          duration: 350, ease: 'Power2',
          onUpdate: () => {
            // Missile trail
            const trail = this.add.circle(
              missileObj.missile.x + (Math.random() - 0.5) * 8,
              missileObj.missile.y + (Math.random() - 0.5) * 8,
              1, 0xff69b4, 0.6
            );
            this.time.delayedCall(40, () => trail.destroy());
            
            const collision = this.checkSpellCollision(missileObj.missile.x, missileObj.missile.y, 3, 20);
            if (collision) {
              missileObj.missile.destroy();
              missileObj.tip.destroy();
            }
          },
          onComplete: () => {
            // Missile explosion
            const explosion = this.add.circle(finalX, finalY, 15, 0xff69b4, 0.6);
            explosion.setStrokeStyle(1, 0xff1493, 0.8);
            this.tweens.add({
              targets: explosion, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 200,
              onComplete: () => explosion.destroy()
            });
            missileObj.missile.destroy();
            missileObj.tip.destroy();
          }
        });
      });
    });
  }

  createCodeBlastEffect() {
    // Player13 giant spear power
    const spear = this.add.rectangle(
      this.player.x, this.player.y, 35, 8, 0x00ff00, 0.9
    );
    spear.setStrokeStyle(3, 0x32cd32, 1);
    
    // Spear tip
    const tip = this.add.triangle(
      spear.x + (this.currentDirection === 'right' ? 20 : -20),
      spear.y, 0, 0, 12, 6, 0, 12, 0x32cd32, 0.9
    );
    
    // Spear handle
    const handle = this.add.rectangle(
      spear.x, spear.y, 8, 25, 0x228b22, 0.8
    );
    handle.setStrokeStyle(2, 0x006400, 1);
    
    // Energy aura around spear
    const aura = this.add.ellipse(
      spear.x, spear.y, 45, 15, 0x00ff00, 0.3
    );
    
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = spear.x;
        targetY = spear.y - 400;
        break;
      case 'down':
        targetX = spear.x;
        targetY = spear.y + 400;
        break;
      case 'left':
        targetX = spear.x - 400;
        targetY = spear.y;
        break;
      case 'right':
        targetX = spear.x + 400;
        targetY = spear.y;
        break;
    }
    
    this.tweens.add({
      targets: [spear, tip, handle, aura],
      x: targetX, y: targetY, scaleX: 1.4, scaleY: 1.4,
      duration: 800, ease: 'Power2',
      onUpdate: () => {
        // Energy particles trailing the spear
        const particle = this.add.circle(
          spear.x + (Math.random() - 0.5) * 25,
          spear.y + (Math.random() - 0.5) * 25,
          2, 0x00ff00, 0.8
        );
        this.time.delayedCall(80, () => particle.destroy());
        
        // Rotate aura
        aura.rotation += 0.1;
        
        const collision = this.checkSpellCollision(spear.x, spear.y, 18, 35);
        if (collision) {
          spear.destroy();
          tip.destroy();
          handle.destroy();
          aura.destroy();
        }
      },
      onComplete: () => {
        // Giant spear impact
        const impact = this.add.circle(targetX, targetY, 50, 0x00ff00, 0.6);
        impact.setStrokeStyle(3, 0x32cd32, 0.8);
        
        // Energy burst
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const energyBurst = this.add.circle(
            targetX + Math.cos(angle) * 30,
            targetY + Math.sin(angle) * 30,
            4, 0x32cd32, 0.7
          );
          this.tweens.add({
            targets: energyBurst,
            x: targetX + Math.cos(angle) * 60,
            y: targetY + Math.sin(angle) * 60,
            alpha: 0, duration: 300,
            onComplete: () => energyBurst.destroy()
          });
        }
        
        this.tweens.add({
          targets: impact, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 350,
          onComplete: () => impact.destroy()
        });
        spear.destroy();
        tip.destroy();
        handle.destroy();
        aura.destroy();
      }
    });
  }

  createGoblinMagicEffect() {
    // Player14 pink circles
    const circles = [];
    const circleCount = 4;
    
    for (let i = 0; i < circleCount; i++) {
      const circle = this.add.circle(
        this.player.x + (i - 1.5) * 15, this.player.y, 8, 0xff69b4, 0.9
      );
      circle.setStrokeStyle(2, 0xff1493, 1);
      circles.push(circle);
    }
    
    let targetX, targetY;
    switch (this.currentDirection) {
      case 'up':
        targetX = this.player.x;
        targetY = this.player.y - 280;
        break;
      case 'down':
        targetX = this.player.x;
        targetY = this.player.y + 280;
        break;
      case 'left':
        targetX = this.player.x - 280;
        targetY = this.player.y;
        break;
      case 'right':
        targetX = this.player.x + 280;
        targetY = this.player.y;
        break;
    }
    
    this.tweens.add({
      targets: circles,
      x: circles.map((_, i) => targetX + (i - 1.5) * 20),
      y: circles.map(() => targetY),
      scaleX: 1.4, scaleY: 1.4,
      duration: 600, ease: 'Power2',
      onUpdate: () => {
        // Pink sparkles around circles
        circles.forEach(circle => {
          const sparkle = this.add.circle(
            circle.x + (Math.random() - 0.5) * 12,
            circle.y + (Math.random() - 0.5) * 12,
            1, 0xff69b4, 0.7
          );
          this.time.delayedCall(60, () => sparkle.destroy());
        });
        
        // Check collisions for each circle
        circles.forEach(circle => {
          const collision = this.checkSpellCollision(circle.x, circle.y, 8, 18);
          if (collision) {
            circles.forEach(c => c.destroy());
          }
        });
      },
      onComplete: () => {
        // Multiple circle impacts
        circles.forEach((circle, index) => {
          const impact = this.add.circle(circle.x, circle.y, 25, 0xff69b4, 0.6);
          impact.setStrokeStyle(2, 0xff1493, 0.8);
          this.tweens.add({
            targets: impact, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 250,
            onComplete: () => impact.destroy()
          });
        });
        circles.forEach(circle => circle.destroy());
      }
    });
  }

  // Add remaining mega spell effects (simplified versions)
  
  createLinesOfCodeEffect() {
    // Player15 lines of code - Straight line formation
    const codeLines = [];
    const lineCount = 6;
    const lineSpacing = 4; // Tighter spacing for straight line
    
    // Calculate starting positions based on direction
    let startX, startY;
    let offsetX, offsetY;
    
    switch (this.currentDirection) {
      case 'up':
        startX = this.player.x;
        startY = this.player.y - 15; // Start slightly above player
        offsetX = 0;
        offsetY = -lineSpacing;
        break;
      case 'down':
        startX = this.player.x;
        startY = this.player.y + 15; // Start slightly below player
        offsetX = 0;
        offsetY = lineSpacing;
        break;
      case 'left':
        startX = this.player.x - 15; // Start slightly left of player
        startY = this.player.y;
        offsetX = -lineSpacing;
        offsetY = 0;
        break;
      case 'right':
        startX = this.player.x + 15; // Start slightly right of player
        startY = this.player.y;
        offsetX = lineSpacing;
        offsetY = 0;
        break;
    }
    
    // Create lines in a straight formation
    for (let i = 0; i < lineCount; i++) {
      const lineX = startX + (offsetX * i);
      const lineY = startY + (offsetY * i);
      
      // Adjust line dimensions based on direction
      let lineWidth, lineHeight;
      if (this.currentDirection === 'up' || this.currentDirection === 'down') {
        lineWidth = 20;
        lineHeight = 2;
      } else {
        lineWidth = 2;
        lineHeight = 20;
      }
      
      const line = this.add.rectangle(
        lineX, lineY, lineWidth, lineHeight, 0x00ff00, 0.9
      );
      line.setStrokeStyle(1, 0x32cd32, 1);
      codeLines.push(line);
    }
    
    // Calculate target positions in a straight line
    let targetX, targetY;
    const distance = 290;
    
    switch (this.currentDirection) {
      case 'up':
        targetX = startX;
        targetY = startY - distance;
        break;
      case 'down':
        targetX = startX;
        targetY = startY + distance;
        break;
      case 'left':
        targetX = startX - distance;
        targetY = startY;
        break;
      case 'right':
        targetX = startX + distance;
        targetY = startY;
        break;
    }
    
    this.tweens.add({
      targets: codeLines,
      x: codeLines.map((_, i) => targetX + (offsetX * i)),
      y: codeLines.map((_, i) => targetY + (offsetY * i)),
      scaleX: 1.3, scaleY: 1.3,
      duration: 550, ease: 'Power2',
      onUpdate: () => {
        // Code particles
        codeLines.forEach(line => {
          const particle = this.add.circle(
            line.x + (Math.random() - 0.5) * 15,
            line.y + (Math.random() - 0.5) * 15,
            1, 0x00ff00, 0.7
          );
          this.time.delayedCall(50, () => particle.destroy());
        });
        
        // Check collisions for each line
        codeLines.forEach(line => {
          const collision = this.checkSpellCollision(line.x, line.y, 10, 20);
          if (collision) {
            codeLines.forEach(l => l.destroy());
          }
        });
      },
      onComplete: () => {
        // Code line impacts
        codeLines.forEach((line, index) => {
          const impact = this.add.rectangle(line.x, line.y, 30, 4, 0x00ff00, 0.6);
          impact.setStrokeStyle(1, 0x32cd32, 0.8);
          this.tweens.add({
            targets: impact, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 220,
            onComplete: () => impact.destroy()
          });
        });
        codeLines.forEach(line => line.destroy());
      }
    });
  }



  // Enhanced visual effects for players 1-7
  createIceShardEffectFromPosition(x, y, direction) {
    // FROSTBLADE - Crystalline ice shard with frost trail
    const size = 14;
    const distance = 420;
    
    // Main ice shard - diamond shape
    const iceShard = this.add.polygon(x, y, [
      [-size, 0], [0, -size*1.5], [size, 0], [0, size*1.5]
    ], 0x87ceeb, 1);
    iceShard.setStrokeStyle(3, 0xffffff, 0.9);
    
    // Frost particles trailing behind
    const frostTimer = this.time.addEvent({
      delay: 35,
      loop: true,
      callback: () => {
        const frost = this.add.circle(
          iceShard.x + Phaser.Math.Between(-8, 8),
          iceShard.y + Phaser.Math.Between(-8, 8),
          Phaser.Math.Between(2, 4), 0xb0e0e6, 0.7
        );
        this.time.delayedCall(150, () => frost.destroy());
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: iceShard,
      x: targetX,
      y: targetY,
      rotation: Math.PI * 2,
      duration: 400,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(iceShard.x, iceShard.y, size, 20);
        if (hit) {
          this.createExplosion(iceShard.x, iceShard.y, 0x87ceeb);
          frostTimer.destroy();
          iceShard.destroy();
        }
      },
      onComplete: () => {
        frostTimer.destroy();
        iceShard.destroy();
      }
    });
  }

  createShadowBoltEffectFromPosition(x, y, direction) {
    // SHADOWSTRIKE - Dark energy bolt with void particles
    const size = 16;
    const distance = 380;
    
    // Main shadow bolt with dark purple gradient
    const shadowBolt = this.add.circle(x, y, size, 0x4b0082, 1);
    shadowBolt.setStrokeStyle(3, 0x8b008b, 1);
    
    // Dark void particles swirling around
    const voidTimer = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        const voidParticle = this.add.circle(
          shadowBolt.x + Phaser.Math.Between(-12, 12),
          shadowBolt.y + Phaser.Math.Between(-12, 12),
          3, 0x2f2f2f, 0.8
        );
        this.time.delayedCall(180, () => voidParticle.destroy());
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: shadowBolt,
      x: targetX,
      y: targetY,
      duration: 450,
      ease: 'Power2',
      onUpdate: () => {
        // Create shadow flickering effect by varying alpha instead of tint
        shadowBolt.setAlpha(Phaser.Math.Between(0.7, 1.0));
        const hit = this.checkSpellCollision(shadowBolt.x, shadowBolt.y, size, 30);
        if (hit) {
          this.createExplosion(shadowBolt.x, shadowBolt.y, 0x4b0082);
          voidTimer.destroy();
          shadowBolt.destroy();
        }
      },
      onComplete: () => {
        voidTimer.destroy();
        shadowBolt.destroy();
      }
    });
  }

  createNatureEffectFromPosition(x, y, direction) {
    // NATUREBORN - Thorn spike with nature magic
    const size = 15;
    const distance = 390;
    
    // Thorn projectile with green nature energy
    const thorn = this.add.polygon(x, y, [
      [-size*0.5, size], [0, -size*2], [size*0.5, size]
    ], 0x228b22, 1);
    thorn.setStrokeStyle(2, 0x32cd32, 1);
    
    // Nature magic particles
    const natureTimer = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        const leaf = this.add.circle(
          thorn.x + Phaser.Math.Between(-6, 6),
          thorn.y + Phaser.Math.Between(-6, 6),
          2, 0x9acd32, 0.8
        );
        this.time.delayedCall(160, () => leaf.destroy());
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: thorn,
      x: targetX,
      y: targetY,
      duration: 380,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(thorn.x, thorn.y, size, 22);
        if (hit) {
          this.createExplosion(thorn.x, thorn.y, 0x228b22);
          natureTimer.destroy();
          thorn.destroy();
        }
      },
      onComplete: () => {
        natureTimer.destroy();
        thorn.destroy();
      }
    });
  }

  createVoidEffectFromPosition(x, y, direction) {
    // VOIDWALKER - Reality-warping void blast
    const size = 18;
    const distance = 360;
    
    // Void orb with reality distortion effect
    const voidOrb = this.add.circle(x, y, size, 0x1a1a1a, 1);
    voidOrb.setStrokeStyle(4, 0x800080, 1);
    
    // Reality distortion particles
    const distortTimer = this.time.addEvent({
      delay: 20,
      loop: true,
      callback: () => {
        const distort = this.add.circle(
          voidOrb.x + Phaser.Math.Between(-15, 15),
          voidOrb.y + Phaser.Math.Between(-15, 15),
          Phaser.Math.Between(1, 4), 0x483d8b, 0.6
        );
        this.time.delayedCall(200, () => distort.destroy());
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: voidOrb,
      x: targetX,
      y: targetY,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      ease: 'Power1',
      onUpdate: () => {
        voidOrb.setAlpha(Phaser.Math.Between(0.7, 1.0));
        const hit = this.checkSpellCollisionWithMainPlayer(voidOrb.x, voidOrb.y, size, 35);
        if (hit) {
          this.createExplosion(voidOrb.x, voidOrb.y, 0x800080);
          distortTimer.destroy();
          voidOrb.destroy();
        }
      },
      onComplete: () => {
        distortTimer.destroy();
        voidOrb.destroy();
      }
    });
  }

  createGoldenRayEffectFromPosition(x, y, direction) {
    // AURION - Radiant golden beam of divine light
    const size = 12;
    const distance = 410;
    
    // Golden energy beam
    const goldenRay = this.add.circle(x, y, size, 0xffd700, 1);
    goldenRay.setStrokeStyle(3, 0xffff99, 1);
    
    // Divine light particles
    const lightTimer = this.time.addEvent({
      delay: 25,
      loop: true,
      callback: () => {
        const lightParticle = this.add.circle(
          goldenRay.x + Phaser.Math.Between(-10, 10),
          goldenRay.y + Phaser.Math.Between(-10, 10),
          3, 0xffffe0, 0.8
        );
        this.time.delayedCall(140, () => lightParticle.destroy());
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: goldenRay,
      x: targetX,
      y: targetY,
      duration: 330,
      ease: 'Power3',
      onUpdate: () => {
        // Create golden glow effect by varying alpha instead of tint
        goldenRay.setAlpha(Phaser.Math.Between(0.8, 1.0));
        const hit = this.checkSpellCollision(goldenRay.x, goldenRay.y, size, 26);
        if (hit) {
          this.createExplosion(goldenRay.x, goldenRay.y, 0xffd700);
          lightTimer.destroy();
          goldenRay.destroy();
        }
      },
      onComplete: () => {
        lightTimer.destroy();
        goldenRay.destroy();
      }
    });
  }

  createLinesOfCodeEffectFromPosition(x, y, direction) {
    // SMOKE (player15) - Single big code sphere
    const distance = 380;
    
    // Create one big sphere with binary code texture
    const codeSphere = this.add.circle(x, y, 20, 0x00ff00, 0.8);
    codeSphere.setStrokeStyle(3, 0x32cd32, 1);
    
    // Add binary digits floating around the sphere
    const digitalTimer = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        if (codeSphere.active) {
          const digit = this.add.text(
            codeSphere.x + Phaser.Math.Between(-25, 25),
            codeSphere.y + Phaser.Math.Between(-25, 25),
            Math.random() > 0.5 ? '1' : '0', {
            fontSize: '12px',
            fill: '#00ff00',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          });
          digit.setOrigin(0.5, 0.5);
          this.time.delayedCall(200, () => digit.destroy());
        }
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: codeSphere,
      x: targetX,
      y: targetY,
      duration: 450,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(codeSphere.x, codeSphere.y, 20, 26);
        if (hit) {
          this.createExplosion(codeSphere.x, codeSphere.y, 0x00ff00);
          digitalTimer.destroy();
          codeSphere.destroy();
        }
      },
      onComplete: () => {
        digitalTimer.destroy();
        codeSphere.destroy();
      }
    });
  }

  createTrainingCharacterSelector(x, y) {
    // Create character selection text
    this.characterSelectorText = this.add.text(x, y + 30, 
      'Use ← → arrows to cycle characters | Or press 1-9, 0, -, = for specific characters', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1,
      fontStyle: 'italic'
    });
    this.characterSelectorText.setOrigin(0.5, 0);

    // Character list for cycling
    this.characterList = [
      'player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8',
      'player9', 'player10', 'player11', 'player12', 'player13', 'player14', 'player15', 'player16'
    ];
    this.currentCharacterIndex = this.characterList.indexOf(this.selectedCharacter);

    // Add arrow key listeners for cycling
    this.input.keyboard.on('keydown-LEFT', () => this.cycleCharacter(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.cycleCharacter(1));

    // Add number key listeners for character switching
    this.input.keyboard.on('keydown-ONE', () => this.switchCharacterInTraining('player1'));
    this.input.keyboard.on('keydown-TWO', () => this.switchCharacterInTraining('player2'));
    this.input.keyboard.on('keydown-THREE', () => this.switchCharacterInTraining('player3'));
    this.input.keyboard.on('keydown-FOUR', () => this.switchCharacterInTraining('player4'));
    this.input.keyboard.on('keydown-FIVE', () => this.switchCharacterInTraining('player5'));
    this.input.keyboard.on('keydown-SIX', () => this.switchCharacterInTraining('player6'));
    this.input.keyboard.on('keydown-SEVEN', () => this.switchCharacterInTraining('player7'));
    this.input.keyboard.on('keydown-EIGHT', () => this.switchCharacterInTraining('player8'));
    this.input.keyboard.on('keydown-NINE', () => this.switchCharacterInTraining('player9'));
    this.input.keyboard.on('keydown-ZERO', () => this.switchCharacterInTraining('player10'));
    this.input.keyboard.on('keydown-MINUS', () => this.switchCharacterInTraining('player11'));
    this.input.keyboard.on('keydown-PLUS', () => this.switchCharacterInTraining('player12'));
    
    // Additional keys for remaining characters
    this.input.keyboard.on('keydown-Q', () => {
      if (this.input.keyboard.addKey('SHIFT').isDown) {
        this.switchCharacterInTraining('player13');
      }
    });
    this.input.keyboard.on('keydown-W', () => {
      if (this.input.keyboard.addKey('SHIFT').isDown) {
        this.switchCharacterInTraining('player14');
      }
    });
    this.input.keyboard.on('keydown-E', () => {
      if (this.input.keyboard.addKey('SHIFT').isDown) {
        this.switchCharacterInTraining('player15');
      }
    });
    this.input.keyboard.on('keydown-R', () => {
      if (this.input.keyboard.addKey('SHIFT').isDown) {
        this.switchCharacterInTraining('player16');
      }
    });
  }

  cycleCharacter(direction) {
    if (!this.isTraining) return;

    // Update character index with wrapping
    this.currentCharacterIndex += direction;
    if (this.currentCharacterIndex < 0) {
      this.currentCharacterIndex = this.characterList.length - 1; // Wrap to last character
    } else if (this.currentCharacterIndex >= this.characterList.length) {
      this.currentCharacterIndex = 0; // Wrap to first character
    }

    // Switch to the new character
    const newCharacter = this.characterList[this.currentCharacterIndex];
    this.switchCharacterInTraining(newCharacter);
  }

  switchCharacterInTraining(newCharacter) {
    if (!this.isTraining) return;

    console.log(`Switching to character: ${newCharacter}`);
    
    // Store current position
    const currentX = this.player.x;
    const currentY = this.player.y;
    
    // Update character selection and index
    this.selectedCharacter = newCharacter;
    this.currentCharacterIndex = this.characterList.indexOf(newCharacter);
    
    // Update spells
    this.initializeCharacterSpells();
    this.currentSpell = this.characterSpells[this.selectedCharacter].spell;
    this.currentMegaSpell = this.characterSpells[this.selectedCharacter].megaSpell;
    
    // Reset cooldowns and resources
    this.currentSpellCooldown = 0;
    this.currentMegaSpellCooldown = 0;
    this.megaSpellUses = 3;
    this.isSpellcasting = false;
    
    // Update multipliers
    this.speedMultiplier = this.characterSpells[this.selectedCharacter].speedMultiplier;
    this.damageMultiplier = this.characterSpells[this.selectedCharacter].damageMultiplier;
    this.defenseMultiplier = this.characterSpells[this.selectedCharacter].defenseMultiplier;
    
    // Recreate player sprite with new character
    this.player.destroy();
    this.createPlayer();
    this.player.setPosition(currentX, currentY);
    
    // Reset health
    this.playerHealth = 100;
    this.updateHealthBar();
    this.updateMegaSpellMarksDisplay();
    
    // Update character info text
    const characterInfo = this.characterSpells[this.selectedCharacter];
    this.characterText.setText(`${characterInfo.name} - ${characterInfo.spell.name}`);
    
    // Show character switch notification
    const notification = this.add.text(this.game.config.width / 2, 100, 
      `Switched to ${characterInfo.name}!`, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    notification.setOrigin(0.5);
    notification.setDepth(10);
    
    // Fade out notification
    this.tweens.add({
      targets: notification,
      alpha: 0,
      y: 50,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notification.destroy()
    });
  }

  createRainbowSpheresEffectFromPosition(x, y, direction) {
    // JAMES (player16) - Larger rainbow spheres in spiraling stream
    console.log(`Rainbow spheres starting from player at x:${x}, y:${y}, direction:${direction}`);
    const sphereCount = 4;
    const distance = 420;
    const spheres = [];
    
    // Rainbow colors
    const colors = [0xff0000, 0xff8000, 0xffff00, 0x00ff00, 0x0080ff, 0x8000ff];
    
    // Create spheres in a spiraling pattern with staggered launch
    for (let i = 0; i < sphereCount; i++) {
      this.time.delayedCall(i * 100, () => {
        const sphereColor = colors[i % colors.length];
        
        // Spiral offset calculation
        const angle = (i * Math.PI * 0.6) % (Math.PI * 2);
        const spiralRadius = 12;
        
        let sphereX = x + Math.cos(angle) * spiralRadius;
        let sphereY = y + Math.sin(angle) * spiralRadius;
        
        const sphere = this.add.circle(sphereX, sphereY, 18, sphereColor, 0.9);
        sphere.setStrokeStyle(3, 0xffffff, 0.8);
      spheres.push(sphere);
        
        // Individual rainbow trail for each sphere
        const rainbowTimer = this.time.addEvent({
          delay: 40,
          loop: true,
          callback: () => {
            if (sphere.active) {
              const trailColor = colors[Phaser.Math.Between(0, colors.length - 1)];
              const trail = this.add.circle(
                sphere.x + Phaser.Math.Between(-20, 20),
                sphere.y + Phaser.Math.Between(-20, 20),
                7, trailColor, 0.7
              );
              this.time.delayedCall(300, () => trail.destroy());
            }
          }
        });
        
        let targetX = sphereX, targetY = sphereY;
        switch (direction) {
          case 'up': targetY -= distance; break;
          case 'down': targetY += distance; break;
          case 'left': targetX -= distance; break;
          case 'right': targetX += distance; break;
        }
        
        this.tweens.add({
          targets: sphere,
          x: targetX,
          y: targetY,
          duration: 450,
          ease: 'Power2',
          onUpdate: () => {
            if (sphere.active) {
              const hit = this.checkSpellCollision(sphere.x, sphere.y, 18, 28);
              if (hit) {
                this.createExplosion(sphere.x, sphere.y, sphereColor);
                rainbowTimer.destroy();
                sphere.destroy();
              }
            }
          },
          onComplete: () => {
            rainbowTimer.destroy();
            sphere.destroy();
          }
        });
      });
    }
  }

  createGoblinKingdomEffectFromPosition(x, y, direction) {
    // JAMES (player16) - Rainbow burst streams like Thunderfist but with rainbow colors
    const streamCount = 8;
    const distance = 450;
    const colors = [0xff0000, 0xff8000, 0xffff00, 0x00ff00, 0x0080ff, 0x8000ff];
    
    // Create rainbow streams in all directions
    for (let i = 0; i < streamCount; i++) {
      this.time.delayedCall(i * 60, () => {
        const angle = (i / streamCount) * Math.PI * 2;
        const sphereColor = colors[i % colors.length];
        
        // Create sphere at player position
        const rainbowSphere = this.add.circle(x, y, 16, sphereColor, 0.9);
        rainbowSphere.setStrokeStyle(3, 0xffffff, 0.8);
        
        // Rainbow trail effect
        const rainbowTimer = this.time.addEvent({
          delay: 35,
          loop: true,
          callback: () => {
            if (rainbowSphere.active) {
              const trailColor = colors[Phaser.Math.Between(0, colors.length - 1)];
              const trail = this.add.circle(
                rainbowSphere.x + Phaser.Math.Between(-18, 18),
                rainbowSphere.y + Phaser.Math.Between(-18, 18),
                6, trailColor, 0.7
              );
              this.time.delayedCall(280, () => trail.destroy());
            }
          }
        });
        
        // Calculate target position for this stream
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;
        
        this.tweens.add({
          targets: rainbowSphere,
          x: targetX,
          y: targetY,
          duration: 520,
          ease: 'Power2',
          onUpdate: () => {
            if (rainbowSphere.active) {
              const hit = this.checkSpellCollision(rainbowSphere.x, rainbowSphere.y, 16, 54 / streamCount);
              if (hit) {
                this.createExplosion(rainbowSphere.x, rainbowSphere.y, sphereColor);
                rainbowTimer.destroy();
                rainbowSphere.destroy();
              }
            }
          },
          onComplete: () => {
            rainbowTimer.destroy();
            rainbowSphere.destroy();
          }
        });
      });
    }
  }

  createSystemCrashEffectFromPosition(x, y, direction) {
    // SMOKE (player15) - Digital virus beam shooting outward
    const distance = 500;
    
    // Create a digital virus beam
    const virusBeam = this.add.circle(x, y, 22, 0x00ff00, 0.9);
    virusBeam.setStrokeStyle(4, 0x00aa00, 1);
    
    // Digital corruption effect
    const digitalTimer = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (virusBeam.active) {
          // Binary corruption particles
          const binary = this.add.text(
            virusBeam.x + Phaser.Math.Between(-30, 30),
            virusBeam.y + Phaser.Math.Between(-30, 30),
            ['ERROR', '404', '0x0', 'NULL', '///'][Phaser.Math.Between(0, 4)],
            { fontSize: '10px', fill: '#ff0000' }
          );
          this.time.delayedCall(400, () => binary.destroy());
          
          // Green code particles
          const code = this.add.text(
            virusBeam.x + Phaser.Math.Between(-25, 25),
            virusBeam.y + Phaser.Math.Between(-25, 25),
            Phaser.Math.Between(0, 1).toString(),
            { fontSize: '14px', fill: '#00ff00' }
          );
          this.time.delayedCall(350, () => code.destroy());
        }
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: virusBeam,
      x: targetX,
      y: targetY,
      duration: 480,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(virusBeam.x, virusBeam.y, 22, 61);
        if (hit) {
          this.createExplosion(virusBeam.x, virusBeam.y, 0x00ff00);
          digitalTimer.destroy();
          virusBeam.destroy();
        }
      },
      onComplete: () => {
        digitalTimer.destroy();
        virusBeam.destroy();
      }
    });
  }

  createDivineJudgmentEffectFromPosition(x, y, direction) {
    // AURION (player7) - Divine beam shooting straight outward
    const distance = 500;
    
    // Create a large divine beam
    const divineBeam = this.add.circle(x, y, 20, 0xffd700, 1);
    divineBeam.setStrokeStyle(5, 0xffffe0, 1);
    
    // Divine trail particles
    const divineTimer = this.time.addEvent({
      delay: 25,
      loop: true,
      callback: () => {
        if (divineBeam.active) {
          const particle = this.add.circle(
            divineBeam.x + Phaser.Math.Between(-25, 25),
            divineBeam.y + Phaser.Math.Between(-25, 25),
            8, 0xffffe0, 0.8
          );
          particle.setAlpha(Phaser.Math.FloatBetween(0.5, 1.0));
          this.time.delayedCall(300, () => particle.destroy());
        }
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: divineBeam,
      x: targetX,
      y: targetY,
      duration: 450,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(divineBeam.x, divineBeam.y, 20, 62);
        if (hit) {
          this.createExplosion(divineBeam.x, divineBeam.y, 0xffd700);
          divineTimer.destroy();
          divineBeam.destroy();
        }
      },
      onComplete: () => {
        divineTimer.destroy();
        divineBeam.destroy();
      }
    });
  }

  createIronStormEffectFromPosition(x, y, direction) {
    // IRONHEART (player8) - Barrage of iron projectiles
    const shotCount = 8;
    const distance = 400;
    const shots = [];
    
    // Create multiple iron shots in rapid succession
    for (let i = 0; i < shotCount; i++) {
      this.time.delayedCall(i * 80, () => {
        let shotX = x, shotY = y;
        
        // Slight spread for variety
        if (direction === 'up' || direction === 'down') {
          shotX += Phaser.Math.Between(-15, 15);
        } else {
          shotY += Phaser.Math.Between(-15, 15);
        }
        
        const shot = this.add.circle(shotX, shotY, 12, 0x696969, 1);
        shot.setStrokeStyle(3, 0xc0c0c0, 1);
        shots.push(shot);
        
        let targetX = shotX, targetY = shotY;
        switch (direction) {
          case 'up': targetY -= distance; break;
          case 'down': targetY += distance; break;
          case 'left': targetX -= distance; break;
          case 'right': targetX += distance; break;
        }
        
        this.tweens.add({
          targets: shot,
          x: targetX,
          y: targetY,
          duration: 350,
          ease: 'Power2',
          onUpdate: () => {
            if (shot.active) {
              const hit = this.checkSpellCollision(shot.x, shot.y, 12, 58 / shotCount);
              if (hit) {
                this.createExplosion(shot.x, shot.y, 0x696969);
                shot.destroy();
              }
            }
          },
          onComplete: () => shot.destroy()
        });
      });
    }
  }

  createKingsFuryEffectFromPosition(x, y, direction) {
    // FIST KING (player9) - Power punch shooting outward
    const distance = 480;
    
    // Create a massive power fist
    const powerFist = this.add.circle(x, y, 25, 0xd2691e, 1);
    powerFist.setStrokeStyle(4, 0x8b4513, 1);
    
    // Power trail effect
    const powerTimer = this.time.addEvent({
      delay: 35,
      loop: true,
      callback: () => {
        if (powerFist.active) {
          const trail = this.add.circle(
            powerFist.x + Phaser.Math.Between(-30, 30),
            powerFist.y + Phaser.Math.Between(-30, 30),
            12, 0xd2691e, 0.7
          );
          this.time.delayedCall(250, () => trail.destroy());
        }
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: powerFist,
      x: targetX,
      y: targetY,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 520,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(powerFist.x, powerFist.y, 25, 68);
        if (hit) {
          this.createExplosion(powerFist.x, powerFist.y, 0xd2691e);
          powerTimer.destroy();
          powerFist.destroy();
        }
      },
      onComplete: () => {
        powerTimer.destroy();
        powerFist.destroy();
      }
    });
  }

  createColosseumFuryEffectFromPosition(x, y, direction) {
    // MAXIMUS REX (player13) - Giant gladiator spear throw
    const distance = 480;
    
    // Create a massive spear
    const spear = this.add.rectangle(x, y, 40, 8, 0x8b4513, 1);
    spear.setStrokeStyle(3, 0xffd700, 1);
    
    // Gladiator trail effect
    const trailTimer = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        if (spear.active) {
          const trail = this.add.rectangle(
            spear.x + Phaser.Math.Between(-10, 10),
            spear.y + Phaser.Math.Between(-5, 5),
            15, 3, 0xb8860b, 0.7
          );
          this.time.delayedCall(200, () => trail.destroy());
        }
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.tweens.add({
      targets: spear,
      x: targetX,
      y: targetY,
      rotation: Math.PI * 3,
      duration: 520,
      ease: 'Power2',
      onUpdate: () => {
        const hit = this.checkSpellCollision(spear.x, spear.y, 20, 69);
        if (hit) {
          this.createExplosion(spear.x, spear.y, 0xffd700);
          trailTimer.destroy();
          spear.destroy();
        }
      },
      onComplete: () => {
        trailTimer.destroy();
        spear.destroy();
      }
    });
  }

  createTricksterChaosEffectFromPosition(x, y, direction) {
    // PINK SHADOW (player14) - Chaotic pink energy burst
    const chaosCount = 12;
    const distance = 380;
    const chaosOrbs = [];
    
    // Create chaotic pink orbs with random spread
    for (let i = 0; i < chaosCount; i++) {
      let orbX = x + Phaser.Math.Between(-25, 25);
      let orbY = y + Phaser.Math.Between(-25, 25);
      
      const orb = this.add.circle(orbX, orbY, 
        Phaser.Math.Between(6, 12), 0xff1493, 0.8);
      orb.setStrokeStyle(2, 0xff69b4, 1);
      chaosOrbs.push(orb);
    }
    
    // Chaotic movement with different targets
    chaosOrbs.forEach((orb, index) => {
      let targetX = x, targetY = y;
      
      // Random spread in the general direction
      switch (direction) {
      case 'up':
          targetY -= distance + Phaser.Math.Between(-50, 50);
          targetX += Phaser.Math.Between(-100, 100);
        break;
      case 'down':
          targetY += distance + Phaser.Math.Between(-50, 50);
          targetX += Phaser.Math.Between(-100, 100);
        break;
      case 'left':
          targetX -= distance + Phaser.Math.Between(-50, 50);
          targetY += Phaser.Math.Between(-100, 100);
        break;
      case 'right':
          targetX += distance + Phaser.Math.Between(-50, 50);
          targetY += Phaser.Math.Between(-100, 100);
        break;
    }
    
    this.tweens.add({
        targets: orb,
        x: targetX,
        y: targetY,
        duration: 400 + index * 30,
        ease: 'Power2',
      onUpdate: () => {
          if (orb.active) {
            const hit = this.checkSpellCollision(orb.x, orb.y, 8, 48 / chaosCount);
            if (hit) {
              this.createExplosion(orb.x, orb.y, 0xff1493);
              orb.destroy();
            }
          }
        },
        onComplete: () => orb.destroy()
      });
    });
  }

  showDamageNumber(x, y, damage, color = '#ff0000') {
    // Create damage text
    const damageText = this.add.text(
      x + Phaser.Math.Between(-15, 15), 
      y - 20, 
      `-${damage}`, 
      {
        fontSize: '18px',
        fill: color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    
    damageText.setOrigin(0.5, 0.5);
    damageText.setDepth(1000); // Ensure it appears on top
    
    // Floating animation
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  // Training mode collision detection - only affects dummy
  checkSpellCollision(spellX, spellY, spellRadius, damage) {
    if (this.isTraining) {
      // In training mode, only check collision with dummy (stored as otherPlayer)
      if (this.otherPlayer) {
        const distance = Phaser.Math.Distance.Between(
          spellX, spellY, 
          this.otherPlayer.x, this.otherPlayer.y
        );
        
        if (distance < spellRadius + 20) { // 20 is player radius
          // Show damage number on dummy but don't reduce health
          this.showDamageNumber(this.otherPlayer.x, this.otherPlayer.y, damage, '#ff6600');
          return true;
        }
      }
      return false;
    } else {
      // Multiplayer mode - check collision with other player
      if (this.otherPlayer) {
        const distance = Phaser.Math.Distance.Between(
          spellX, spellY, 
          this.otherPlayer.x, this.otherPlayer.y
        );
        
        if (distance < spellRadius + 20) { // 20 is player radius
          // Check if other player is invincible
          if (this.otherPlayerInvincible) {
            console.log('Other player is invincible, damage blocked!');
            return true; // Spell hit but no damage
          }
          
          // Show damage number and deal damage to other player
          this.showDamageNumber(this.otherPlayer.x, this.otherPlayer.y, damage, '#ff0000');
          
          console.log(`Applying ${damage} damage to other player. Health before: ${this.otherPlayerHealth}`);
          // Apply damage to other player
          this.otherPlayerHealth = Math.max(0, this.otherPlayerHealth - damage);
          console.log(`Other player health after damage: ${this.otherPlayerHealth}`);
          this.updateEnemyUI();
          
          // Make other player invincible for 1 second
          this.makeOtherPlayerInvincible();
          
          // Emit damage to other player
          if (this.socket) {
            const targetId = this.otherPlayer.playerId || 'enemy';
            
            // CRITICAL: Prevent self-damage at emission level
            if (targetId === this.playerId) {
              console.error(`CRITICAL ERROR: Attempting to damage self! Attacker: ${this.playerId}, Target: ${targetId}`);
              return;
            }
            
            console.log(`Emitting damage: attacker=${this.playerId}, target=${targetId}, damage=${damage}`);
            this.socket.emit('playerDamaged', {
              targetId: targetId,
              damage: damage,
              attackerId: this.playerId,
              roomId: this.roomId,
              newHealth: this.otherPlayerHealth
            });
          }
          
          // Check if other player is defeated
          if (this.otherPlayerHealth <= 0) {
            this.handleOtherPlayerDefeat();
          }
          
          return true;
        }
      }
      return false;
    }
  }

  // Collision detection for spells hitting the main player (from other players)
  checkSpellCollisionWithMainPlayer(spellX, spellY, spellRadius, damage) {
    if (this.isTraining) {
      // In training mode, player should never take damage from their own spells
      return false;
    }
    
    // Check collision with main player
    if (this.player) {
      const distance = Phaser.Math.Distance.Between(
        spellX, spellY, 
        this.player.x, this.player.y
      );
      
      if (distance < spellRadius + 20) { // 20 is player radius
        // Deal damage to main player
        this.takeDamage(damage);
        return true;
      }
    }
    return false;
  }

  createExplosion(x, y, color = 0xff0000) {
    // Create explosion effect
    const explosion = this.add.circle(x, y, 5, color, 0.8);
    explosion.setStrokeStyle(3, 0xffffff, 1);
    explosion.setDepth(999);
    
    // Explosion animation
    this.tweens.add({
      targets: explosion,
      scale: 3,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => explosion.destroy()
    });
    
    // Create explosion particles
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        3, color, 0.7
      );
      particle.setDepth(998);
      
          this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-30, 30),
        y: particle.y + Phaser.Math.Between(-30, 30),
        alpha: 0,
        scale: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }
} 