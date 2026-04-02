// Game Utilities for Tailstrike Arena

export class GameUtils {
  /**
   * Shows floating damage number above a target
   */
  static showDamageNumber(scene, x, y, damage, color = 0xff0000) {
    const damageText = scene.add.text(x, y, `-${damage}`, {
      fontSize: '24px',
      fill: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(10);

    // Animate the damage text
    scene.tweens.add({
      targets: damageText,
      y: y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  /**
   * Creates screen flash effect for impacts
   */
  static createScreenFlash(scene, color = 0xffffff, duration = 100) {
    const flash = scene.add.rectangle(0, 0, 1920, 1080, color, 0.3);
    flash.setOrigin(0);
    flash.setDepth(1000);
    
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => flash.destroy()
    });
  }

  /**
   * Calculates movement speed based on character stats
   */
  static calculateMovementSpeed(characterIndex) {
    // Linear interpolation from 50 to 120 across 16 characters
    const minSpeed = 50;
    const maxSpeed = 120;
    const speedRange = maxSpeed - minSpeed;
    const speedIncrement = speedRange / 15; // 15 intervals for 16 characters (0-15)
    
    return Math.round(minSpeed + (characterIndex * speedIncrement));
  }

  /**
   * Calculates spell damage based on movement speed (inverse relationship)
   */
  static calculateSpellDamage(movementSpeed) {
    // Inverse relationship: faster = less damage
    const minDamage = 5;
    const maxDamage = 20;
    const minSpeed = 50;
    const maxSpeed = 120;
    
    // Normalize speed to 0-1 range
    const normalizedSpeed = (movementSpeed - minSpeed) / (maxSpeed - minSpeed);
    // Invert for damage (1 - normalized = high speed gives low damage)
    const damage = minDamage + ((1 - normalizedSpeed) * (maxDamage - minDamage));
    
    return Math.round(damage);
  }

  /**
   * Calculates mega spell damage based on movement speed
   */
  static calculateMegaSpellDamage(movementSpeed) {
    const minDamage = 30;
    const maxDamage = 60;
    const minSpeed = 50;
    const maxSpeed = 120;
    
    const normalizedSpeed = (movementSpeed - minSpeed) / (maxSpeed - minSpeed);
    const damage = minDamage + ((1 - normalizedSpeed) * (maxDamage - minDamage));
    
    return Math.round(damage);
  }

  /**
   * Calculates spell cooldown based on movement speed
   */
  static calculateSpellCooldown(movementSpeed) {
    const minCooldown = 0.5;
    const maxCooldown = 2.0;
    const minSpeed = 50;
    const maxSpeed = 120;
    
    const normalizedSpeed = (movementSpeed - minSpeed) / (maxSpeed - minSpeed);
    const cooldown = minCooldown + ((1 - normalizedSpeed) * (maxCooldown - minCooldown));
    
    return Math.round(cooldown * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculates mega spell cooldown based on movement speed
   */
  static calculateMegaSpellCooldown(movementSpeed) {
    const minCooldown = 5;
    const maxCooldown = 15;
    const minSpeed = 50;
    const maxSpeed = 120;
    
    const normalizedSpeed = (movementSpeed - minSpeed) / (maxSpeed - minSpeed);
    const cooldown = minCooldown + ((1 - normalizedSpeed) * (maxCooldown - minCooldown));
    
    return Math.round(cooldown * 10) / 10;
  }

  /**
   * Gets balanced character stats for a player
   */
  static getCharacterStats(characterIndex) {
    const movementSpeed = GameUtils.calculateMovementSpeed(characterIndex);
    
    return {
      movementSpeed,
      spellDamage: GameUtils.calculateSpellDamage(movementSpeed),
      megaSpellDamage: GameUtils.calculateMegaSpellDamage(movementSpeed),
      spellCooldown: GameUtils.calculateSpellCooldown(movementSpeed),
      megaSpellCooldown: GameUtils.calculateMegaSpellCooldown(movementSpeed)
    };
  }

  /**
   * Creates a circular progress bar for cooldowns
   */
  static createCooldownBar(scene, x, y, radius = 20, color = 0x00ff00) {
    const background = scene.add.circle(x, y, radius, 0x333333, 0.7);
    const progress = scene.add.circle(x, y, radius - 2, color, 0.8);
    progress.setStrokeStyle(2, 0xffffff, 0.5);
    
    return {
      background,
      progress,
      update: (percentage) => {
        progress.setScale(percentage);
        progress.setAlpha(percentage > 0 ? 0.8 : 0.3);
      },
      destroy: () => {
        background.destroy();
        progress.destroy();
      }
    };
  }

  /**
   * Checks if two circular objects are colliding
   */
  static checkCircularCollision(obj1X, obj1Y, obj1Radius, obj2X, obj2Y, obj2Radius) {
    const distance = Phaser.Math.Distance.Between(obj1X, obj1Y, obj2X, obj2Y);
    return distance < (obj1Radius + obj2Radius);
  }

  /**
   * Creates standard particle burst effect
   */
  static createParticleBurst(scene, x, y, color, count = 8, spread = 40) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = Phaser.Math.Between(20, spread);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      
      const particle = scene.add.circle(x, y, 4, color, 0.8);
      particle.setDepth(3);
      
      scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Plays character animation safely with fallback
   */
  static playCharacterAnimation(player, animationKey, fallbackKey = null) {
    if (!player || !player.anims) return false;
    
    try {
      if (player.anims.exists(animationKey)) {
        player.anims.play(animationKey, true);
        return true;
      } else if (fallbackKey && player.anims.exists(fallbackKey)) {
        player.anims.play(fallbackKey, true);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to play animation ${animationKey}:`, error);
    }
    
    return false;
  }
}
