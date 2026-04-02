/**
 * SpellEffects.js - Centralized spell effect system for Tailstrike Arena
 * 
 * This file contains all spell creation functions organized by:
 * - Player's own spells (for casting)
 * - Incoming spells from other players (for receiving)
 * 
 * Clear separation prevents self-damage bugs and improves maintainability.
 */

export class SpellEffects {
  constructor(scene) {
    this.scene = scene;
  }

  // =============================================================================
  // PLAYER'S OWN SPELLS - Use these when the player casts spells
  // These should use checkSpellCollision() to hit other players
  // =============================================================================

  createLightningEffect() {
    // THUNDERFIST - Enhanced crackling lightning with electric arcs
    const angles = [-15, 0, 15]; // Left, center, right bolts
    const distance = 300;
    
    angles.forEach((angleOffset, index) => {
      const lightning = this.scene.add.graphics();
      lightning.lineStyle(4, 0xffff00, 1);
      lightning.lineStyle(2, 0xffffff, 0.8);
      
      const startX = this.scene.player.x;
      const startY = this.scene.player.y;
      let endX, endY;
      
      switch (this.scene.currentDirection) {
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
      
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const zigzagOffset = 20;
      
      lightning.lineTo(midX + (Math.random() - 0.5) * zigzagOffset, 
                      midY + (Math.random() - 0.5) * zigzagOffset);
      lightning.lineTo(endX, endY);
      lightning.strokePath();
      
      const flash = this.scene.add.circle(startX, startY, 30, 0xffff00, 0.6);
      flash.setDepth(2);
      
      // Check for collision with other player
      this.scene.checkLightningCollisionWithOtherPlayer(startX, startY, endX, endY, 10);
      
      this.scene.time.delayedCall(150, () => {
        lightning.destroy();
        flash.destroy();
      });
    });
  }

  createFireballEffect() {
    // BLAZEBORN - Enhanced fireball with trailing flames
    const fireball = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 20, 0xff4500, 1);
    fireball.setStrokeStyle(3, 0xff6600, 0.8);
    
    const innerFireball = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 12, 0xffd700, 0.9);
    const glow = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 35, 0xff4500, 0.3);
    
    let targetX, targetY;
    const distance = 350;
    switch (this.scene.currentDirection) {
      case 'up': targetX = this.scene.player.x; targetY = this.scene.player.y - distance; break;
      case 'down': targetX = this.scene.player.x; targetY = this.scene.player.y + distance; break;
      case 'left': targetX = this.scene.player.x - distance; targetY = this.scene.player.y; break;
      case 'right': targetX = this.scene.player.x + distance; targetY = this.scene.player.y; break;
    }
    
    this.scene.tweens.add({
      targets: [fireball, innerFireball, glow],
      x: targetX, y: targetY,
      duration: 800, ease: 'Power2',
      onUpdate: () => {
        // Flame particles
        const particle = this.scene.add.circle(
          fireball.x + (Math.random() - 0.5) * 20,
          fireball.y + (Math.random() - 0.5) * 20,
          3, 0xff6600, 0.7
        );
        this.scene.time.delayedCall(200, () => particle.destroy());
        
        // Check collision with other player
        const collision = this.scene.checkSpellCollision(fireball.x, fireball.y, 40, 15);
        if (collision) {
          if (fireball) fireball.destroy();
          if (innerFireball) innerFireball.destroy();
          if (glow) glow.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.scene.add.circle(targetX, targetY, 60, 0xff4500, 0.6);
        explosion.setStrokeStyle(3, 0xff6600, 0.8);
        this.scene.tweens.add({
          targets: explosion, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 400,
          onComplete: () => explosion.destroy()
        });
        fireball.destroy();
        innerFireball.destroy();
        glow.destroy();
      }
    });
  }

  createWaterEffect() {
    // AQUA MAGE - Water stream attack
    const waterBall = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 15, 0x00aaff, 0.8);
    waterBall.setStrokeStyle(2, 0x0080ff, 1);
    
    const innerWaterBall = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 10, 0x87ceeb, 0.9);
    const trail = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 25, 0x00aaff, 0.4);
    
    let targetX, targetY;
    const distance = 320;
    switch (this.scene.currentDirection) {
      case 'up': targetX = this.scene.player.x; targetY = this.scene.player.y - distance; break;
      case 'down': targetX = this.scene.player.x; targetY = this.scene.player.y + distance; break;
      case 'left': targetX = this.scene.player.x - distance; targetY = this.scene.player.y; break;
      case 'right': targetX = this.scene.player.x + distance; targetY = this.scene.player.y; break;
    }
    
    this.scene.tweens.add({
      targets: [waterBall, innerWaterBall, trail],
      x: targetX, y: targetY,
      duration: 700, ease: 'Power1',
      onUpdate: () => {
        // Water particles
        const particle = this.scene.add.circle(
          waterBall.x + (Math.random() - 0.5) * 15,
          waterBall.y + (Math.random() - 0.5) * 15,
          2, 0x00aaff, 0.6
        );
        this.scene.time.delayedCall(150, () => particle.destroy());
        
        // Check collision with other player
        const collision = this.scene.checkSpellCollision(waterBall.x, waterBall.y, 25, 5);
        if (collision) {
          if (waterBall) waterBall.destroy();
          if (innerWaterBall) innerWaterBall.destroy();
          if (trail) trail.destroy();
        }
      },
      onComplete: () => {
        const splash = this.scene.add.circle(targetX, targetY, 40, 0x00aaff, 0.5);
        splash.setStrokeStyle(2, 0x0080ff, 0.8);
        this.scene.tweens.add({
          targets: splash, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 300,
          onComplete: () => splash.destroy()
        });
        waterBall.destroy();
        innerWaterBall.destroy();
        trail.destroy();
      }
    });
  }

  createDarkMagicEffect() {
    // SHADOW MAGE - Dark orb attack
    const darkOrb = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 18, 0x800080, 0.9);
    darkOrb.setStrokeStyle(3, 0x4b0082, 1);
    
    const shadowTrail = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 28, 0x800080, 0.4);
    
    let targetX, targetY;
    const distance = 340;
    switch (this.scene.currentDirection) {
      case 'up': targetX = this.scene.player.x; targetY = this.scene.player.y - distance; break;
      case 'down': targetX = this.scene.player.x; targetY = this.scene.player.y + distance; break;
      case 'left': targetX = this.scene.player.x - distance; targetY = this.scene.player.y; break;
      case 'right': targetX = this.scene.player.x + distance; targetY = this.scene.player.y; break;
    }
    
    this.scene.tweens.add({
      targets: [darkOrb, shadowTrail],
      x: targetX, y: targetY,
      duration: 750, ease: 'Power2',
      onUpdate: () => {
        // Dark particles
        const particle = this.scene.add.circle(
          darkOrb.x + (Math.random() - 0.5) * 20,
          darkOrb.y + (Math.random() - 0.5) * 20,
          3, 0x800080, 0.7
        );
        this.scene.time.delayedCall(200, () => particle.destroy());
        
        // Check collision with other player
        const collision = this.scene.checkSpellCollision(darkOrb.x, darkOrb.y, 30, 12);
        if (collision) {
          if (darkOrb) darkOrb.destroy();
          if (shadowTrail) shadowTrail.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.scene.add.circle(targetX, targetY, 50, 0x800080, 0.6);
        explosion.setStrokeStyle(3, 0x4a0080, 0.8);
        this.scene.tweens.add({
          targets: explosion, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 500,
          onComplete: () => explosion.destroy()
        });
        darkOrb.destroy();
        shadowTrail.destroy();
      }
    });
  }

  createNatureEffect() {
    // NATURE MAGE - Nature energy ball
    const natureBall = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 22, 0x00ff00, 0.8);
    natureBall.setStrokeStyle(3, 0x00cc00, 1);
    
    const natureCore = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 15, 0x00cc00, 0.9);
    
    let targetX, targetY;
    const distance = 330;
    switch (this.scene.currentDirection) {
      case 'up': targetX = this.scene.player.x; targetY = this.scene.player.y - distance; break;
      case 'down': targetX = this.scene.player.x; targetY = this.scene.player.y + distance; break;
      case 'left': targetX = this.scene.player.x - distance; targetY = this.scene.player.y; break;
      case 'right': targetX = this.scene.player.x + distance; targetY = this.scene.player.y; break;
    }
    
    this.scene.tweens.add({
      targets: [natureBall, natureCore],
      x: targetX, y: targetY,
      duration: 700, ease: 'Power1',
      onUpdate: () => {
        // Nature particles
        const leaf = this.scene.add.circle(
          natureBall.x + (Math.random() - 0.5) * 15,
          natureBall.y + (Math.random() - 0.5) * 15,
          2, 0x00ff00, 0.8
        );
        this.scene.time.delayedCall(180, () => leaf.destroy());
        
        // Check collision with other player
        const collision = this.scene.checkSpellCollision(natureBall.x, natureBall.y, 25, 8);
        if (collision) {
          if (natureBall) natureBall.destroy();
          if (natureCore) natureCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.scene.add.circle(targetX, targetY, 45, 0x00ff00, 0.5);
        burst.setStrokeStyle(2, 0x00cc00, 0.8);
        this.scene.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 400,
          onComplete: () => burst.destroy()
        });
        natureBall.destroy();
        natureCore.destroy();
      }
    });
  }

  createVoidEffect() {
    // VOIDWALKER - Void blast for player's own spell
    const voidOrb = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 35, 0x000000, 0.9);
    voidOrb.setStrokeStyle(5, 0x800080, 1);
    
    const voidAura = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 45, 0x400040, 0.5);
    voidAura.setDepth(1);
    
    let targetX, targetY;
    const distance = 380;
    switch (this.scene.currentDirection) {
      case 'up': targetX = this.scene.player.x; targetY = this.scene.player.y - distance; break;
      case 'down': targetX = this.scene.player.x; targetY = this.scene.player.y + distance; break;
      case 'left': targetX = this.scene.player.x - distance; targetY = this.scene.player.y; break;
      case 'right': targetX = this.scene.player.x + distance; targetY = this.scene.player.y; break;
    }
    
    this.scene.tweens.add({
      targets: [voidOrb, voidAura],
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 1200, ease: 'Power2',
      onUpdate: () => {
        const particle = this.scene.add.circle(
          voidOrb.x + (Math.random() - 0.5) * 25,
          voidOrb.y + (Math.random() - 0.5) * 25,
          4, 0x000000, 0.8
        );
        this.scene.time.delayedCall(250, () => particle.destroy());
        
        // Use correct collision for player's own spell (hits other player)
        const collision = this.scene.checkSpellCollision(voidOrb.x, voidOrb.y, 45, 70);
        if (collision) {
          if (voidOrb) voidOrb.destroy();
          if (voidAura) voidAura.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.scene.add.circle(targetX, targetY, 70, 0x000000, 0.7);
        explosion.setStrokeStyle(4, 0x800080, 0.9);
        this.scene.tweens.add({
          targets: explosion, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 500,
          onComplete: () => explosion.destroy()
        });
        voidOrb.destroy();
        voidAura.destroy();
      }
    });
  }

  // Add other player spell effects here...
  createDaggerEffect() {
    // Existing dagger effect implementation
    this.scene.createDaggerEffect();
  }

  createMissileEffect() {
    // Existing missile effect implementation  
    this.scene.createMissileEffect();
  }

  createMagmaEffect() {
    // Existing magma effect implementation
    this.scene.createMagmaEffect();
  }

  // =============================================================================
  // INCOMING SPELLS FROM OTHER PLAYERS - Use these when receiving spells
  // These should use checkSpellCollisionWithMainPlayer() to hit this player
  // =============================================================================

  createLightningEffectFromPosition(x, y, direction) {
    // Lightning coming from other player
    const distance = 400;
    const mainBolt = this.scene.add.circle(x, y, 16, 0x00ffff, 1);
    mainBolt.setStrokeStyle(4, 0xffff00, 1);
    
    const sparkTimer = this.scene.time.addEvent({
      delay: 25,
      loop: true,
      callback: () => {
        const spark = this.scene.add.circle(
          mainBolt.x + Phaser.Math.Between(-12, 12),
          mainBolt.y + Phaser.Math.Between(-12, 12),
          3, 0xffffff, 0.9
        );
        this.scene.time.delayedCall(120, () => spark.destroy());
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.scene.tweens.add({
      targets: mainBolt,
      x: targetX, y: targetY,
      duration: 350, ease: 'Power3',
      onUpdate: () => {
        mainBolt.setAlpha(Phaser.Math.Between(0.8, 1.0));
        const hit = this.scene.checkSpellCollisionWithMainPlayer(mainBolt.x, mainBolt.y, 16, 25);
        if (hit) {
          this.scene.createExplosion(mainBolt.x, mainBolt.y, 0x00ffff);
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

  createFireballEffectFromPosition(x, y, direction) {
    // Fireball coming from other player
    const fireball = this.scene.add.circle(x, y, 20, 0xff4500, 1);
    fireball.setStrokeStyle(3, 0xff6600, 0.8);
    
    const innerFireball = this.scene.add.circle(x, y, 12, 0xffd700, 0.9);
    const glow = this.scene.add.circle(x, y, 35, 0xff4500, 0.3);
    
    let targetX, targetY;
    const distance = 350;
    switch (direction) {
      case 'up': targetX = x; targetY = y - distance; break;
      case 'down': targetX = x; targetY = y + distance; break;
      case 'left': targetX = x - distance; targetY = y; break;
      case 'right': targetX = x + distance; targetY = y; break;
    }
    
    this.scene.tweens.add({
      targets: [fireball, innerFireball, glow],
      x: targetX, y: targetY,
      duration: 800, ease: 'Power2',
      onUpdate: () => {
        const particle = this.scene.add.circle(
          fireball.x + (Math.random() - 0.5) * 20,
          fireball.y + (Math.random() - 0.5) * 20,
          3, 0xff6600, 0.7
        );
        this.scene.time.delayedCall(200, () => particle.destroy());
        
        // Check for collision with this player during travel (other player's spell)
        const collision = this.scene.checkSpellCollisionWithMainPlayer(fireball.x, fireball.y, 40, 15);
        if (collision) {
          if (fireball) fireball.destroy();
          if (innerFireball) innerFireball.destroy();
          if (glow) glow.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.scene.add.circle(targetX, targetY, 60, 0xff4500, 0.6);
        explosion.setStrokeStyle(3, 0xff6600, 0.8);
        this.scene.tweens.add({
          targets: explosion, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 400,
          onComplete: () => explosion.destroy()
        });
        fireball.destroy();
        innerFireball.destroy();
        glow.destroy();
      }
    });
  }

  createWaterEffectFromPosition(x, y, direction) {
    // Water spell coming from other player
    const waterBall = this.scene.add.circle(x, y, 15, 0x00aaff, 0.8);
    waterBall.setStrokeStyle(2, 0x0080ff, 1);
    
    const innerWaterBall = this.scene.add.circle(x, y, 10, 0x87ceeb, 0.9);
    const trail = this.scene.add.circle(x, y, 25, 0x00aaff, 0.4);
    
    let targetX, targetY;
    const distance = 320;
    switch (direction) {
      case 'up': targetX = x; targetY = y - distance; break;
      case 'down': targetX = x; targetY = y + distance; break;
      case 'left': targetX = x - distance; targetY = y; break;
      case 'right': targetX = x + distance; targetY = y; break;
    }
    
    this.scene.tweens.add({
      targets: [waterBall, innerWaterBall, trail],
      x: targetX, y: targetY,
      duration: 700, ease: 'Power1',
      onUpdate: () => {
        const particle = this.scene.add.circle(
          waterBall.x + (Math.random() - 0.5) * 15,
          waterBall.y + (Math.random() - 0.5) * 15,
          2, 0x00aaff, 0.6
        );
        this.scene.time.delayedCall(150, () => particle.destroy());
        
        // Check for collision with this player (incoming spell)
        const collision = this.scene.checkSpellCollisionWithMainPlayer(waterBall.x, waterBall.y, 25, 5);
        if (collision) {
          if (waterBall) waterBall.destroy();
          if (innerWaterBall) innerWaterBall.destroy();
          if (trail) trail.destroy();
        }
      },
      onComplete: () => {
        const splash = this.scene.add.circle(targetX, targetY, 40, 0x00aaff, 0.5);
        splash.setStrokeStyle(2, 0x0080ff, 0.8);
        this.scene.tweens.add({
          targets: splash, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 300,
          onComplete: () => splash.destroy()
        });
        waterBall.destroy();
        innerWaterBall.destroy();
        trail.destroy();
      }
    });
  }

  createDarkMagicEffectFromPosition(x, y, direction) {
    // Dark magic spell coming from other player
    const darkOrb = this.scene.add.circle(x, y, 18, 0x800080, 0.9);
    darkOrb.setStrokeStyle(3, 0x4b0082, 1);
    
    const shadowTrail = this.scene.add.circle(x, y, 28, 0x800080, 0.4);
    
    let targetX, targetY;
    const distance = 340;
    switch (direction) {
      case 'up': targetX = x; targetY = y - distance; break;
      case 'down': targetX = x; targetY = y + distance; break;
      case 'left': targetX = x - distance; targetY = y; break;
      case 'right': targetX = x + distance; targetY = y; break;
    }
    
    this.scene.tweens.add({
      targets: [darkOrb, shadowTrail],
      x: targetX, y: targetY,
      duration: 750, ease: 'Power2',
      onUpdate: () => {
        const particle = this.scene.add.circle(
          darkOrb.x + (Math.random() - 0.5) * 20,
          darkOrb.y + (Math.random() - 0.5) * 20,
          3, 0x800080, 0.7
        );
        this.scene.time.delayedCall(200, () => particle.destroy());
        
        // Check for collision with this player (incoming spell)
        const collision = this.scene.checkSpellCollisionWithMainPlayer(darkOrb.x, darkOrb.y, 30, 12);
        if (collision) {
          if (darkOrb) darkOrb.destroy();
          if (shadowTrail) shadowTrail.destroy();
        }
      },
      onComplete: () => {
        const explosion = this.scene.add.circle(targetX, targetY, 50, 0x800080, 0.6);
        explosion.setStrokeStyle(3, 0x4a0080, 0.8);
        this.scene.tweens.add({
          targets: explosion, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 500,
          onComplete: () => explosion.destroy()
        });
        darkOrb.destroy();
        shadowTrail.destroy();
      }
    });
  }

  createNatureEffectFromPosition(x, y, direction) {
    // Nature spell coming from other player
    const natureBall = this.scene.add.circle(x, y, 22, 0x00ff00, 0.8);
    natureBall.setStrokeStyle(3, 0x00cc00, 1);
    
    const natureCore = this.scene.add.circle(x, y, 15, 0x00cc00, 0.9);
    
    let targetX, targetY;
    const distance = 330;
    switch (direction) {
      case 'up': targetX = x; targetY = y - distance; break;
      case 'down': targetX = x; targetY = y + distance; break;
      case 'left': targetX = x - distance; targetY = y; break;
      case 'right': targetX = x + distance; targetY = y; break;
    }
    
    this.scene.tweens.add({
      targets: [natureBall, natureCore],
      x: targetX, y: targetY,
      duration: 700, ease: 'Power1',
      onUpdate: () => {
        const leaf = this.scene.add.circle(
          natureBall.x + (Math.random() - 0.5) * 15,
          natureBall.y + (Math.random() - 0.5) * 15,
          2, 0x00ff00, 0.8
        );
        this.scene.time.delayedCall(180, () => leaf.destroy());
        
        // Check for collision with this player (incoming spell)
        const collision = this.scene.checkSpellCollisionWithMainPlayer(natureBall.x, natureBall.y, 25, 8);
        if (collision) {
          if (natureBall) natureBall.destroy();
          if (natureCore) natureCore.destroy();
        }
      },
      onComplete: () => {
        const burst = this.scene.add.circle(targetX, targetY, 45, 0x00ff00, 0.5);
        burst.setStrokeStyle(2, 0x00cc00, 0.8);
        this.scene.tweens.add({
          targets: burst, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 400,
          onComplete: () => burst.destroy()
        });
        natureBall.destroy();
        natureCore.destroy();
      }
    });
  }

  createVoidEffectFromPosition(x, y, direction) {
    // Void spell coming from other player
    const size = 18;
    const distance = 360;
    
    const voidOrb = this.scene.add.circle(x, y, size, 0x1a1a1a, 1);
    voidOrb.setStrokeStyle(4, 0x800080, 1);
    
    const distortTimer = this.scene.time.addEvent({
      delay: 20,
      loop: true,
      callback: () => {
        const distort = this.scene.add.circle(
          voidOrb.x + Phaser.Math.Between(-15, 15),
          voidOrb.y + Phaser.Math.Between(-15, 15),
          Phaser.Math.Between(1, 4), 0x483d8b, 0.6
        );
        this.scene.time.delayedCall(200, () => distort.destroy());
      }
    });
    
    let targetX = x, targetY = y;
    switch (direction) {
      case 'up': targetY -= distance; break;
      case 'down': targetY += distance; break;
      case 'left': targetX -= distance; break;
      case 'right': targetX += distance; break;
    }
    
    this.scene.tweens.add({
      targets: voidOrb,
      x: targetX, y: targetY, scaleX: 1.3, scaleY: 1.3,
      duration: 500, ease: 'Power1',
      onUpdate: () => {
        voidOrb.setAlpha(Phaser.Math.Between(0.7, 1.0));
        // Check for collision with this player (incoming spell)
        const hit = this.scene.checkSpellCollisionWithMainPlayer(voidOrb.x, voidOrb.y, size, 35);
        if (hit) {
          this.scene.createExplosion(voidOrb.x, voidOrb.y, 0x800080);
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
}
