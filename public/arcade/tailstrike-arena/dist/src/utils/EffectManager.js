// Effect Manager for Tailstrike Arena
import { SpellConstants } from './SpellUtils.js';

export class EffectManager {
  /**
   * Creates a unified projectile effect that can be used by multiple spells
   */
  static createUnifiedProjectile(scene, config) {
    const {
      startX, startY, direction, size, color, strokeColor, 
      damage, speed, collisionFn, trailColor, particles
    } = config;

    // Create main projectile
    const projectile = scene.add.circle(startX, startY, size, color, 0.9);
    if (strokeColor) {
      projectile.setStrokeStyle(4, strokeColor, 1);
    }
    projectile.setDepth(2);

    // Calculate movement vector
    let targetX = startX, targetY = startY;
    const distance = SpellConstants.LIGHTNING_DISTANCE;
    
    switch (direction) {
      case 'up': targetY = startY - distance; break;
      case 'down': targetY = startY + distance; break;
      case 'left': targetX = startX - distance; break;
      case 'right': targetX = startX + distance; break;
      default: targetX = startX + distance; break;
    }

    // Animate projectile
    scene.tweens.add({
      targets: projectile,
      x: targetX,
      y: targetY,
      duration: speed || 800,
      ease: 'Power2',
      onUpdate: () => {
        // Create trail effect
        if (Math.random() < 0.7 && trailColor) {
          const trail = scene.add.circle(projectile.x, projectile.y, size * 0.6, trailColor, 0.4);
          trail.setDepth(1);
          scene.time.delayedCall(SpellConstants.FLASH_DURATION, () => trail.destroy());
        }

        // Create particles if specified
        if (particles && Math.random() < 0.3) {
          const particle = scene.add.circle(
            projectile.x + (Math.random() - 0.5) * 20,
            projectile.y + (Math.random() - 0.5) * 20,
            3, particles, 0.7
          );
          scene.time.delayedCall(200, () => particle.destroy());
        }

        // Check collision
        const collision = collisionFn(projectile.x, projectile.y, size, damage);
        if (collision) {
          projectile.destroy();
        }
      },
      onComplete: () => {
        // Create explosion at target
        EffectManager.createExplosion(scene, targetX, targetY, color);
        projectile.destroy();
      }
    });

    return projectile;
  }

  /**
   * Creates a standard explosion effect
   */
  static createExplosion(scene, x, y, color = SpellConstants.COLORS.FIRE, size = 60) {
    const explosion = scene.add.circle(x, y, 10, color, 0.8);
    explosion.setStrokeStyle(3, SpellConstants.COLORS.WHITE, 1);
    explosion.setDepth(3);

    scene.tweens.add({
      targets: explosion,
      radius: size,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => explosion.destroy()
    });

    // Create explosion particles
    for (let i = 0; i < 8; i++) {
      const particle = scene.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        4, color, 0.8
      );
      scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-40, 40),
        y: particle.y + Phaser.Math.Between(-40, 40),
        alpha: 0,
        scale: 0.3,
        duration: SpellConstants.TWEEN_DURATION,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Creates a lightning effect between two points
   */
  static createLightningBolt(scene, startX, startY, endX, endY, color = SpellConstants.COLORS.LIGHTNING) {
    // Create jagged lightning path
    const graphics = scene.add.graphics();
    graphics.lineStyle(4, color, 1);
    graphics.setDepth(2);

    // Generate lightning path with random segments
    const segments = 8;
    let currentX = startX;
    let currentY = startY;
    
    graphics.beginPath();
    graphics.moveTo(currentX, currentY);

    for (let i = 1; i <= segments; i++) {
      const progress = i / segments;
      const targetX = startX + (endX - startX) * progress;
      const targetY = startY + (endY - startY) * progress;
      
      // Add random offset for jagged effect
      const offsetX = Phaser.Math.Between(-20, 20);
      const offsetY = Phaser.Math.Between(-20, 20);
      
      currentX = targetX + offsetX;
      currentY = targetY + offsetY;
      
      graphics.lineTo(currentX, currentY);
    }

    // Ensure we end at the target
    graphics.lineTo(endX, endY);
    graphics.strokePath();

    // Add flash effect
    const flash = scene.add.circle(startX, startY, 30, color, 0.6);
    flash.setDepth(2);

    // Remove effects after duration
    scene.time.delayedCall(SpellConstants.FLASH_DURATION, () => {
      graphics.destroy();
      flash.destroy();
    });

    return graphics;
  }

  /**
   * Creates a multi-projectile burst effect
   */
  static createProjectileBurst(scene, x, y, direction, config) {
    const { count = 3, spread = 45, ...projectileConfig } = config;
    const projectiles = [];

    for (let i = 0; i < count; i++) {
      // Calculate spread angles
      const angleOffset = (i - (count - 1) / 2) * (spread / count);
      let adjustedDirection = direction;

      // For multiple projectiles, slightly adjust direction
      if (count > 1) {
        // This is a simplified spread - in a real implementation you'd calculate proper angles
        adjustedDirection = direction; // Keep same for now, could enhance with angle calculations
      }

      const projectile = EffectManager.createUnifiedProjectile(scene, {
        startX: x + Phaser.Math.Between(-10, 10),
        startY: y + Phaser.Math.Between(-10, 10),
        direction: adjustedDirection,
        ...projectileConfig
      });

      projectiles.push(projectile);
    }

    return projectiles;
  }

  /**
   * Creates a spinning orb effect
   */
  static createSpinningOrb(scene, x, y, radius, color, duration = 2000) {
    const orb = scene.add.circle(x, y, radius, color, 0.8);
    orb.setStrokeStyle(2, SpellConstants.COLORS.WHITE, 0.6);
    orb.setDepth(2);

    // Add spinning effect
    scene.tweens.add({
      targets: orb,
      rotation: Math.PI * 4,
      duration: duration,
      ease: 'Linear',
      repeat: -1
    });

    return orb;
  }

  /**
   * Creates a pulsing aura effect
   */
  static createAuraEffect(scene, target, color, intensity = 0.3) {
    if (!target) return null;

    const aura = scene.add.circle(target.x, target.y, 40, color, intensity);
    aura.setDepth(target.depth - 1);

    // Pulsing animation
    scene.tweens.add({
      targets: aura,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: intensity * 0.5,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Update aura position to follow target
    const updateAura = () => {
      if (aura && target) {
        aura.x = target.x;
        aura.y = target.y;
      }
    };

    return { aura, updateAura };
  }
}
