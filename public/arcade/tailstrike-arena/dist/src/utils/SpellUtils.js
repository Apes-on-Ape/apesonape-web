// Spell Utilities and Constants for Tailstrike Arena

export class SpellConstants {
  // Player radius and collision constants
  static PLAYER_RADIUS = 32;
  static DUMMY_RADIUS = 32;
  static SPELL_BASE_RADIUS = 20;
  
  // Movement and physics constants
  static SPELL_SPEED = 300;
  static PROJECTILE_SPEED = 400;
  static LIGHTNING_DISTANCE = 400;
  static EXPLOSION_RADIUS = 80;
  
  // Visual effect constants
  static PARTICLE_COUNT = 8;
  static TRAIL_PARTICLE_COUNT = 3;
  static SPARK_COUNT = 5;
  static FLASH_DURATION = 150;
  static EFFECT_DURATION = 200;
  static TWEEN_DURATION = 400;
  
  // Damage multipliers
  static DEFENSE_MULTIPLIER_BASE = 0.7;
  static DAMAGE_MULTIPLIER_BASE = 1.0;
  
  // UI Constants
  static DAMAGE_TEXT_DURATION = 1000;
  static DAMAGE_TEXT_RISE = 30;
  
  // Audio constants
  static BACKGROUND_MUSIC_VOLUME = 0.4;
  
  // Invincibility constants
  static INVINCIBILITY_DURATION = 1000; // 1 second
  static INVINCIBILITY_FLASH_COUNT = 9;
  
  // Colors for spell effects
  static COLORS = {
    FIRE: 0xff4500,
    WATER: 0x00bfff,
    LIGHTNING: 0xffff00,
    LIGHTNING_BLUE: 0x00ffff,
    ICE: 0x87ceeb,
    SHADOW: 0x4b0082,
    NATURE: 0x32cd32,
    VOID: 0x800080,
    GOLDEN: 0xffd700,
    WHITE: 0xffffff,
    PINK: 0xff69b4,
    RED: 0xff0000,
    EXPLOSION: 0xff6600
  };
  
  // Spell configurations for each character
  static SPELL_CONFIGS = {
    // Players 1-7 (original balanced players)
    player1: { damage: 20, megaDamage: 60, cooldown: 0.5, megaCooldown: 5, color: 'LIGHTNING' },
    player2: { damage: 18, megaDamage: 56, cooldown: 0.7, megaCooldown: 6, color: 'ICE' },
    player3: { damage: 16, megaDamage: 52, cooldown: 0.9, megaCooldown: 7, color: 'SHADOW' },
    player4: { damage: 14, megaDamage: 48, cooldown: 1.1, megaCooldown: 8, color: 'FIRE' },
    player5: { damage: 12, megaDamage: 44, cooldown: 1.3, megaCooldown: 9, color: 'NATURE' },
    player6: { damage: 10, megaDamage: 40, cooldown: 1.5, megaCooldown: 10, color: 'VOID' },
    player7: { damage: 8, megaDamage: 36, cooldown: 1.7, megaCooldown: 11, color: 'GOLDEN' },
    
    // Players 8-16 (newer players with balanced stats)
    player8: { damage: 6, megaDamage: 32, cooldown: 1.9, megaCooldown: 12, color: 'FIRE' },
    player9: { damage: 15, megaDamage: 50, cooldown: 0.8, megaCooldown: 7.5, color: 'LIGHTNING' },
    player10: { damage: 17, megaDamage: 54, cooldown: 0.6, megaCooldown: 6.5, color: 'FIRE' },
    player11: { damage: 13, megaDamage: 46, cooldown: 1.2, megaCooldown: 8.5, color: 'GOLDEN' },
    player12: { damage: 11, megaDamage: 42, cooldown: 1.4, megaCooldown: 9.5, color: 'SHADOW' },
    player13: { damage: 9, megaDamage: 38, cooldown: 1.6, megaCooldown: 10.5, color: 'RED' },
    player14: { damage: 7, megaDamage: 34, cooldown: 1.8, megaCooldown: 11.5, color: 'PINK' },
    player15: { damage: 5, megaDamage: 30, cooldown: 2.0, megaCooldown: 12.5, color: 'WHITE' },
    player16: { damage: 19, megaDamage: 58, cooldown: 0.55, megaCooldown: 5.5, color: 'PINK' }
  };
}

export class SpellUtils {
  /**
   * Creates a generic projectile with common properties
   */
  static createProjectile(scene, x, y, radius, color, strokeColor = null, strokeWidth = 2) {
    const projectile = scene.add.circle(x, y, radius, color, 0.8);
    if (strokeColor) {
      projectile.setStrokeStyle(strokeWidth, strokeColor, 1);
    }
    projectile.setDepth(2);
    return projectile;
  }
  
  /**
   * Creates particle effects around a position
   */
  static createParticleEffect(scene, x, y, count, color, radius = 4, spread = 20) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const particle = scene.add.circle(
        x + Phaser.Math.Between(-spread, spread),
        y + Phaser.Math.Between(-spread, spread),
        radius,
        color,
        0.7
      );
      particle.setDepth(1);
      particles.push(particle);
      
      // Animate particle
      scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0.3,
        duration: SpellConstants.TWEEN_DURATION,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    return particles;
  }
  
  /**
   * Creates a trail effect for moving projectiles
   */
  static createTrailEffect(scene, x, y, color, delay = 150) {
    const trail = scene.add.circle(x, y, 8, color, 0.4);
    trail.setDepth(1);
    scene.time.delayedCall(delay, () => trail.destroy());
    return trail;
  }
  
  /**
   * Calculates movement vector based on direction
   */
  static getMovementVector(direction, speed = SpellConstants.SPELL_SPEED) {
    const vectors = {
      'up': { x: 0, y: -speed },
      'down': { x: 0, y: speed },
      'left': { x: -speed, y: 0 },
      'right': { x: speed, y: 0 }
    };
    return vectors[direction] || vectors['right'];
  }
  
  /**
   * Checks if a position is within game bounds
   */
  static isInBounds(x, y, margin = 50) {
    return x > -margin && x < 1920 + margin && y > -margin && y < 1080 + margin;
  }
  
  /**
   * Creates a standard explosion effect
   */
  static createExplosion(scene, x, y, type = 'fireball') {
    const config = {
      fireball: { color: SpellConstants.COLORS.FIRE, radius: 40, particles: 8 },
      water: { color: SpellConstants.COLORS.WATER, radius: 30, particles: 6 },
      lightning: { color: SpellConstants.COLORS.LIGHTNING, radius: 35, particles: 10 },
      ice: { color: SpellConstants.COLORS.ICE, radius: 25, particles: 5 }
    };
    
    const explosionConfig = config[type] || config.fireball;
    
    // Main explosion circle
    const explosion = scene.add.circle(x, y, 5, explosionConfig.color, 0.8);
    explosion.setStrokeStyle(3, SpellConstants.COLORS.WHITE, 1);
    explosion.setDepth(3);
    
    // Animate explosion
    scene.tweens.add({
      targets: explosion,
      radius: explosionConfig.radius,
      alpha: 0,
      duration: SpellConstants.EFFECT_DURATION,
      ease: 'Power2',
      onComplete: () => explosion.destroy()
    });
    
    // Create particles
    SpellUtils.createParticleEffect(scene, x, y, explosionConfig.particles, explosionConfig.color);
  }
  
  /**
   * Gets spell configuration for a player
   */
  static getSpellConfig(playerKey) {
    return SpellConstants.SPELL_CONFIGS[playerKey] || SpellConstants.SPELL_CONFIGS.player1;
  }
  
  /**
   * Creates a generic moving projectile with collision detection
   */
  static createMovingProjectile(scene, startX, startY, direction, config) {
    const { radius, color, strokeColor, damage, speed, collisionFn } = config;
    
    const projectile = SpellUtils.createProjectile(scene, startX, startY, radius, color, strokeColor);
    const movement = SpellUtils.getMovementVector(direction, speed || SpellConstants.PROJECTILE_SPEED);
    
    const moveTimer = scene.time.addEvent({
      delay: 16, // ~60 FPS
      loop: true,
      callback: () => {
        projectile.x += movement.x * 0.016;
        projectile.y += movement.y * 0.016;
        
        // Create trail effect
        if (Math.random() < 0.7) {
          SpellUtils.createTrailEffect(scene, projectile.x, projectile.y, color);
        }
        
        // Check collision
        const hit = collisionFn(projectile.x, projectile.y, radius, damage);
        if (hit || !SpellUtils.isInBounds(projectile.x, projectile.y)) {
          projectile.destroy();
          moveTimer.remove(false);
        }
      }
    });
    
    return { projectile, timer: moveTimer };
  }
}
