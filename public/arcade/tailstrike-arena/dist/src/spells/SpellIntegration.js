import SpellManager from './SpellManager.js';
import { SPELL_CONFIG } from './SpellConfig.js';

/**
 * SpellIntegration - Integrates the enhanced spell system with GameScene
 * Overrides existing spell methods to use the new system
 */
export default class SpellIntegration {
  constructor(scene) {
    this.scene = scene;
    this.spellManager = new SpellManager(scene);
    
    // Override existing spell methods
    this.overrideSpellMethods();
  }

  /**
   * Override existing spell methods in GameScene
   */
  overrideSpellMethods() {
    // Override the main spell effect creation method
    this.scene.createSpellEffect = this.createEnhancedSpellEffect.bind(this);
    
    // Override other player spell effects
    this.scene.createSpellEffectFromOtherPlayer = this.createEnhancedSpellEffectFromOtherPlayer.bind(this);
  }

  /**
   * Create enhanced spell effect with sprite-based system only
   */
  createEnhancedSpellEffect(spellType) {
    const characterName = this.getCharacterNameFromKey(this.scene.selectedCharacter);
    const isMega = this.isMegaSpell(spellType);
    
    console.log(`Creating enhanced spell effect: ${spellType} for ${characterName} (mega: ${isMega})`);
    
    // Create effect object
    const effect = {
      type: spellType,
      x: this.scene.player.x,
      y: this.scene.player.y,
      direction: this.scene.currentDirection,
      isMega: isMega,
      characterName: characterName,
      startTime: this.scene.time.now,
      elements: []
    };
    
    // Create sprite-based effect only
    if (characterName && this.spellManager.createSpriteBasedEffect(effect)) {
      this.spellManager.activeEffects.add(effect);
      
      // Calculate damage and handle collision
      this.handleSpellCollision(effect, isMega, characterName);
      
      return effect;
    }
    
    console.warn(`No sprite animation available for ${characterName}, spell not created`);
    return null;
  }

  /**
   * Create enhanced spell effect from other player position
   */
  createEnhancedSpellEffectFromOtherPlayer(spellType, direction, x, y) {
    const characterName = this.getCharacterNameFromKey(this.scene.otherPlayerCharacter);
    const isMega = this.isMegaSpell(spellType);
    
    console.log(`Creating enhanced spell effect from other player: ${spellType} for ${characterName} (mega: ${isMega})`);
    
    // Create effect object
    const effect = {
      type: spellType,
      x: x,
      y: y,
      direction: direction,
      isMega: isMega,
      characterName: characterName,
      startTime: this.scene.time.now,
      elements: []
    };
    
    // Create sprite-based effect only
    if (characterName && this.spellManager.createSpriteBasedEffect(effect)) {
      this.spellManager.activeEffects.add(effect);
      
      // Handle collision with main player
      this.handleSpellCollisionWithMainPlayer(effect, isMega, characterName);
      
      return effect;
    }
    
    console.warn(`No sprite animation available for ${characterName}, spell not created`);
    return null;
  }

  /**
   * Handle spell collision with other player
   */
  handleSpellCollision(effect, isMega, characterName) {
    // Get spell damage from config
    const spellConfig = this.getSpellConfig(characterName, isMega);
    const damage = spellConfig ? spellConfig.damage : 25;
    
    // Check collision with other player
    if (this.scene.otherPlayer && this.scene.checkSpellCollision) {
      const collision = this.scene.checkSpellCollision(
        effect.x || this.scene.player.x,
        effect.y || this.scene.player.y,
        20,
        damage
      );
      
      if (collision) {
        console.log(`Spell hit other player for ${damage} damage`);
      }
    }
  }

  /**
   * Handle spell collision with main player
   */
  handleSpellCollisionWithMainPlayer(effect, isMega, characterName) {
    // Get spell damage from config
    const spellConfig = this.getSpellConfig(characterName, isMega);
    const damage = spellConfig ? spellConfig.damage : 25;
    
    // Check collision with main player
    if (this.scene.checkSpellCollisionWithMainPlayer) {
      const collision = this.scene.checkSpellCollisionWithMainPlayer(
        effect.x || this.scene.otherPlayer.x,
        effect.y || this.scene.otherPlayer.y,
        20,
        damage
      );
      
      if (collision) {
        console.log(`Spell hit main player for ${damage} damage`);
      }
    }
  }

  /**
   * Get character name from player key
   */
  getCharacterNameFromKey(characterKey) {
    const characterMap = {
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
    
    return characterMap[characterKey] || 'THUNDERFIST';
  }

  /**
   * Check if spell type is a mega spell
   */
  isMegaSpell(spellType) {
    const megaSpells = [
      'thunderstorm', 'blizzard', 'shadowrealm', 'inferno', 'forestrage',
      'voidrift', 'divine', 'ironstorm', 'kingsfury', 'roguesgambit',
      'devilswrath', 'mafiasrevenge', 'colosseum', 'trickster', 'systemcrash', 'goblinkingdom'
    ];
    
    return megaSpells.includes(spellType);
  }

  /**
   * Get spell configuration
   */
  getSpellConfig(characterName, isMega) {
    // Use the imported SPELL_CONFIG
    const characterConfig = SPELL_CONFIG[characterName];
    
    if (!characterConfig) return null;
    
    return isMega ? characterConfig.megaSpell : characterConfig.regularSpell;
  }

  /**
   * Handle spell impact effects
   */
  handleSpellImpact(x, y, spellType) {
    // Create impact effect
    this.createImpactEffect(x, y, spellType);
  }

  /**
   * Create impact effect
   */
  createImpactEffect(x, y, spellType) {
    // Create visual impact effect
    const impact = this.scene.add.circle(x, y, 30, 0xffffff, 0.8);
    impact.setStrokeStyle(3, 0xffff00, 1);
    
    this.scene.tweens.add({
      targets: impact,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => impact.destroy()
    });
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const spellStats = this.spellManager.getPerformanceStats();
    
    return {
      spellManager: spellStats,
      activeEffects: this.spellManager.activeEffects.size
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.spellManager) {
      this.spellManager.cleanup();
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    const stats = this.getPerformanceStats();
    
    return {
      spellManager: stats.spellManager,
      activeEffects: stats.activeEffects,
      character: this.scene.selectedCharacter,
      direction: this.scene.currentDirection
    };
  }
} 