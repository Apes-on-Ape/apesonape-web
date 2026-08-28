/**
 * SpellManager - Handles all spell effects with optimized performance
 * Uses Phaser 3's sprite animations for high-quality, lightweight spell visuals
 */
export default class SpellManager {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = new Set();
    this.spriteAnimations = new Map();
    
    // Performance settings
    this.maxEffects = 50;
    
    // Initialize sprite animations
    this.initializeSpriteAnimations();
  }

  /**
   * Initialize sprite animations for spell effects
   */
  initializeSpriteAnimations() {
    // Initialize sprite animations map
    this.spriteAnimations = new Map();
    
    // Spell size configurations (scale multipliers)
    this.spellSizes = {
      'THUNDERFIST': { regular: 1.0, mega: 1.0 },
      'FROSTBLADE': { regular: 1.0, mega: 1.0 },
      'SHADOWSTRIKE': { regular: 1.0, mega: 1.0 },
      'FLAMESTORM': { regular: 1.0, mega: 1.0 },
      'NATUREBORN': { regular: 1.0, mega: 1.0 },
      'VOIDWALKER': { regular: 1.0, mega: 1.0 },
      'AURION': { regular: 1.0, mega: 1.0 },
      'IRONHEART': { regular: 1.0, mega: 1.0 },
      'FIST KING': { regular: 1.0, mega: 1.0 },
      'BLACKJACK': { regular: 1.0, mega: 1.0 },
      'INFERNUS': { regular: 1.0, mega: 1.0 },
      'DON VERMILLION': { regular: 1.0, mega: 1.0 },
      'MAXIMUS REX': { regular: 1.0, mega: 1.0 },
      'PINK SHADOW': { regular: 1.0, mega: 1.0 },
      'SMOKE': { regular: 1.0, mega: 1.0 },
      'JAMES': { regular: 1.0, mega: 1.0 }
    };
    
    // THUNDERFIST - Lightning Warrior
    this.spriteAnimations.set('THUNDERFIST_regular', {
      spriteSheet: 'lightning_bolt',
      frameCount: 5,
      frameRate: 12,
      repeat: 0
    });
    this.spriteAnimations.set('THUNDERFIST_mega', {
      spriteSheet: 'thunder',
      frameCount: 6,
      frameRate: 15,
      repeat: 0
    });
    
    // FROSTBLADE - Ice Master
    this.spriteAnimations.set('FROSTBLADE_regular', {
      spriteSheet: 'ice_slash',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('FROSTBLADE_mega', {
      spriteSheet: 'ice_wall',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // SHADOWSTRIKE - Dark Assassin
    this.spriteAnimations.set('SHADOWSTRIKE_regular', {
      spriteSheet: 'dev_punch',
      frameCount: 5,
      frameRate: 12,
      repeat: 0,
      frameWidth: 192,  // 192/5 = 38.4, rounded down
      frameHeight: 128
    });
    this.spriteAnimations.set('SHADOWSTRIKE_mega', {
      spriteSheet: 'dev_descend',
      frameCount: 6,
      frameRate: 15,
      repeat: 0,
      frameWidth: 192,  // 192/6 = 32
      frameHeight: 128
    });
    
    // FLAMESTORM - Fire Mage
    this.spriteAnimations.set('FLAMESTORM_regular', {
      spriteSheet: 'fire_orb',
      frameCount: 5,
      frameRate: 12,
      repeat: 0
    });
    this.spriteAnimations.set('FLAMESTORM_mega', {
      spriteSheet: 'magma_blast',
      frameCount: 6,
      frameRate: 15,
      repeat: 0
    });
    
    // NATUREBORN - Earth Guardian
    this.spriteAnimations.set('NATUREBORN_regular', {
      spriteSheet: 'slime_attack',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('NATUREBORN_mega', {
      spriteSheet: 'slime_shot',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // VOIDWALKER - Shadow Mystic
    this.spriteAnimations.set('VOIDWALKER_regular', {
      spriteSheet: 'dev_punch',
      frameCount: 5,
      frameRate: 12,
      repeat: 0,
      frameWidth: 38,
      frameHeight: 128
    });
    this.spriteAnimations.set('VOIDWALKER_mega', {
      spriteSheet: 'dev_descend',
      frameCount: 6,
      frameRate: 15,
      repeat: 0,
      frameWidth: 32,
      frameHeight: 128
    });
    
    // AURION - Golden Hero
    this.spriteAnimations.set('AURION_regular', {
      spriteSheet: 'gold_punch',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('AURION_mega', {
      spriteSheet: 'gold_tornado',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // IRONHEART - Armored Guardian
    this.spriteAnimations.set('IRONHEART_regular', {
      spriteSheet: 'warrior_slash',
      frameCount: 5,
      frameRate: 12,
      repeat: 0
    });
    this.spriteAnimations.set('IRONHEART_mega', {
      spriteSheet: 'warrior_punch',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // FIST KING - Boxing Champion
    this.spriteAnimations.set('FIST KING_regular', {
      spriteSheet: 'uppercut',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('FIST KING_mega', {
      spriteSheet: 'warrior_punch',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // BLACKJACK - Rogue with an Eye Patch
    this.spriteAnimations.set('BLACKJACK_regular', {
      spriteSheet: 'rogue_slice',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('BLACKJACK_mega', {
      spriteSheet: 'blood_dash',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // INFERNUS - Devilish Warrior
    this.spriteAnimations.set('INFERNUS_regular', {
      spriteSheet: 'dev_punch',
      frameCount: 5,
      frameRate: 12,
      repeat: 0,
      frameWidth: 38,
      frameHeight: 128
    });
    this.spriteAnimations.set('INFERNUS_mega', {
      spriteSheet: 'dev_cut',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // DON VERMILLION - Mafia Leader
    this.spriteAnimations.set('DON VERMILLION_regular', {
      spriteSheet: 'rogue_punch',
      frameCount: 5,
      frameRate: 12,
      repeat: 0,
      frameWidth: 38,
      frameHeight: 128
    });
    this.spriteAnimations.set('DON VERMILLION_mega', {
      spriteSheet: 'blood_dash',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // MAXIMUS REX - Gladiator King
    this.spriteAnimations.set('MAXIMUS REX_regular', {
      spriteSheet: 'warrior_slash',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('MAXIMUS REX_mega', {
      spriteSheet: 'warrior_punch',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // PINK SHADOW - Nude Trickster
    this.spriteAnimations.set('PINK SHADOW_regular', {
      spriteSheet: 'holy_cross',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('PINK SHADOW_mega', {
      spriteSheet: 'holy_hammer',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // SMOKE - The Dev
    this.spriteAnimations.set('SMOKE_regular', {
      spriteSheet: 'halloween_shot',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('SMOKE_mega', {
      spriteSheet: 'demon_slash_1',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
    
    // JAMES - Goblin King
    this.spriteAnimations.set('JAMES_regular', {
      spriteSheet: 'gob_orb',
      frameCount: 5,
      frameRate: 10,
      repeat: 0
    });
    this.spriteAnimations.set('JAMES_mega', {
      spriteSheet: 'gob_beam',
      frameCount: 6,
      frameRate: 12,
      repeat: 0
    });
  }

  /**
   * Analyze sprite sheet dimensions and provide frame information
   * @param {string} spriteSheetName - Name of the sprite sheet
   * @param {number} totalWidth - Total width of sprite sheet
   * @param {number} totalHeight - Total height of sprite sheet
   * @param {number} frameCount - Number of frames in the animation
   * @returns {Object} Frame analysis information
   */
  analyzeSpriteSheet(spriteSheetName, totalWidth, totalHeight, frameCount) {
    const frameWidth = Math.floor(totalWidth / frameCount);
    const frameHeight = totalHeight;
    const actualFrameWidth = totalWidth / frameCount;
    
    console.log(`Sprite Sheet Analysis for ${spriteSheetName}:`);
    console.log(`  Total Size: ${totalWidth}x${totalHeight}`);
    console.log(`  Frame Count: ${frameCount}`);
    console.log(`  Frame Width: ${frameWidth}px (${actualFrameWidth}px actual)`);
    console.log(`  Frame Height: ${frameHeight}px`);
    console.log(`  Layout: ${frameCount} frames horizontally, 1 frame vertically`);
    
    return {
      frameWidth: frameWidth,
      frameHeight: frameHeight,
      actualFrameWidth: actualFrameWidth,
      layout: `${frameCount}x1`
    };
  }

  /**
   * Get sprite sheet configuration for known sheets
   * @param {string} spriteSheetName - Name of the sprite sheet
   * @returns {Object|null} Configuration object or null if not found
   */
  getSpriteSheetConfig(spriteSheetName) {
    const knownSheets = {
      'rogue_punch': { width: 192, height: 128, frameCount: 5 },
      'dev_punch': { width: 192, height: 128, frameCount: 5 },
      'dev_descend': { width: 192, height: 128, frameCount: 6 },
      'dev_cut': { width: 192, height: 128, frameCount: 6 },
      'warrior_slash': { width: 192, height: 128, frameCount: 5 },
      'warrior_punch': { width: 192, height: 128, frameCount: 6 },
      'ice_slash': { width: 192, height: 128, frameCount: 5 },
      'ice_wall': { width: 192, height: 128, frameCount: 6 },
      'fire_orb': { width: 192, height: 128, frameCount: 5 },
      'magma_blast': { width: 192, height: 128, frameCount: 6 },
      'slime_attack': { width: 192, height: 128, frameCount: 5 },
      'slime_shot': { width: 192, height: 128, frameCount: 6 },
      'gold_punch': { width: 192, height: 128, frameCount: 5 },
      'gold_tornado': { width: 192, height: 128, frameCount: 6 },
      'rogue_slice': { width: 192, height: 128, frameCount: 5 },
      'blood_dash': { width: 192, height: 128, frameCount: 6 },
      'uppercut': { width: 192, height: 128, frameCount: 5 },
      'holy_cross': { width: 192, height: 128, frameCount: 5 },
      'holy_hammer': { width: 192, height: 128, frameCount: 6 },
      'halloween_shot': { width: 192, height: 128, frameCount: 5 },
      'demon_slash_1': { width: 192, height: 128, frameCount: 6 },
      'gob_orb': { width: 192, height: 128, frameCount: 5 },
      'gob_beam': { width: 192, height: 128, frameCount: 6 }
    };
    
    return knownSheets[spriteSheetName] || null;
  }

  /**
   * Create sprite-based spell effect using uploaded animations
   */
  createSpriteBasedEffect(effect) {
    const { characterName, isMega, direction } = effect;
    const animationKey = `${characterName}_${isMega ? 'mega' : 'regular'}`;
    const animationConfig = this.spriteAnimations.get(animationKey);
    
    console.log(`Creating sprite effect for ${animationKey}:`, animationConfig);
    
    if (!animationConfig) {
      console.warn(`No animation config found for ${animationKey}, falling back to particles`);
      return false; // No sprite animation available, fallback to particles
    }
    
    // Create sprite with animation
    let sprite;
    try {
      if (animationConfig.spriteSheet) {
        // Use sprite sheet
        sprite = this.scene.add.sprite(effect.x, effect.y, animationConfig.spriteSheet);
      } else {
        // Use individual frames
        sprite = this.scene.add.sprite(effect.x, effect.y, animationConfig.frames[0]);
      }
    } catch (error) {
      console.error(`Error creating sprite for ${animationKey}:`, error);
      return false;
    }
    
    sprite.setDepth(20); // Increased depth to ensure it's above all other elements
    
    // Set sprite origin to center to prevent clipping
    sprite.setOrigin(0.5, 0.5);
    
    // Scale up spell sprites to make them bigger
    const characterSizes = this.spellSizes[characterName] || { regular: 2.0, mega: 3.0 };
    const scaleMultiplier = isMega ? characterSizes.mega : characterSizes.regular;
    sprite.setScale(scaleMultiplier);
    
    // Rotate sprite based on shooting direction
    let rotation = 0;
    switch (direction) {
      case 'up':
        rotation = -Math.PI / 2; // -90 degrees
        break;
      case 'down':
        rotation = Math.PI / 2; // 90 degrees
        break;
      case 'left':
        rotation = Math.PI; // 180 degrees
        break;
      case 'right':
        rotation = 0; // 0 degrees (default horizontal)
        break;
      default:
        rotation = 0;
    }
    sprite.setRotation(rotation);
    
    // Create animation if it doesn't exist
    const animKey = `${animationKey}_anim`;
    if (!this.scene.anims.exists(animKey)) {
      try {
        if (animationConfig.spriteSheet) {
          // Generate frames using Phaser's built-in frame generation
          let frames;
          if (animationConfig.frameWidth && animationConfig.frameHeight) {
            // Use custom frame dimensions for sprite sheets
            frames = this.scene.anims.generateFrameNumbers(animationConfig.spriteSheet, {
              start: 0,
              end: animationConfig.frameCount - 1,
              frameWidth: animationConfig.frameWidth,
              frameHeight: animationConfig.frameHeight
            });
          } else if (animationConfig.startFrame !== undefined) {
            frames = this.scene.anims.generateFrameNumbers(animationConfig.spriteSheet, {
              start: animationConfig.startFrame,
              end: animationConfig.startFrame + animationConfig.frameCount - 1
            });
          } else {
            frames = this.scene.anims.generateFrameNumbers(animationConfig.spriteSheet, {
              start: 0,
              end: animationConfig.frameCount - 1
            });
          }
          
          this.scene.anims.create({
            key: animKey,
            frames: frames,
            frameRate: animationConfig.frameRate,
            repeat: animationConfig.repeat
          });
        } else {
          // Create animation from individual frames
          this.scene.anims.create({
            key: animKey,
            frames: animationConfig.frames.map(frame => ({ key: frame })),
            frameRate: animationConfig.frameRate,
            repeat: animationConfig.repeat
          });
        }
      } catch (error) {
        console.error(`Error creating animation for ${animKey}:`, error);
        return false;
      }
    }
    
    // Play animation
    try {
      sprite.play(animKey);
      
      // Ensure sprite is visible and not clipped
      sprite.setVisible(true);
      sprite.setActive(true);
      
    } catch (error) {
      console.error(`Error playing animation ${animKey}:`, error);
      return false;
    }
    
    // Calculate movement based on direction
    const distance = isMega ? 200 : 300; // Reduced mega spell distance
    const endX = effect.x + Math.cos(this.getAngle(effect.direction)) * distance;
    const endY = effect.y + Math.sin(this.getAngle(effect.direction)) * distance;
    
    // Animate sprite movement
    this.scene.tweens.add({
      targets: sprite,
      x: endX,
      y: endY,
      duration: isMega ? 800 : 1000, // Shorter duration for mega spells
      ease: 'Power2',
      onComplete: () => {
        sprite.destroy();
        this.activeEffects.delete(effect);
      }
    });
    
    // Add screen shake for mega spells
    if (isMega) {
      this.scene.cameras.main.shake(200, 0.02);
    }
    
    effect.elements.push(sprite);
    
    return true;
  }

  /**
   * Create generic effect for fallback
   */
  createGenericEffect(effect) {
    const { x, y, direction, isMega } = effect;
    
    const projectile = this.scene.add.circle(x, y, isMega ? 18 : 12, 0x888888, 0.7);
    projectile.setStrokeStyle(2, 0xcccccc);
    
    const distance = 250;
    const endX = x + Math.cos(this.getAngle(direction)) * distance;
    const endY = y + Math.sin(this.getAngle(direction)) * distance;
    
    this.scene.tweens.add({
      targets: projectile,
      x: endX,
      y: endY,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        projectile.destroy();
        this.activeEffects.delete(effect);
      }
    });
    
    effect.elements.push(projectile);
  }

  /**
   * Convert direction string to angle in radians
   */
  getAngle(direction) {
    switch (direction) {
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
      case 'left': return Math.PI;
      case 'right': return 0;
      default: return 0;
    }
  }

  /**
   * Clean up all active effects
   */
  cleanup() {
    this.activeEffects.forEach(effect => {
      effect.elements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
    });
    this.activeEffects.clear();
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      activeEffects: this.activeEffects.size,
      totalParticles: 0 // No particles to count
    };
  }
} 