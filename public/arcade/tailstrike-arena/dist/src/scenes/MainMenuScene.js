export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  preload() {
    // Load the arena background image
    this.load.image('bg-menu', 'assets/arena bg.png');
  }

  create() {
    const { width, height } = this.scale;
    
    // Add background image
    const bgImage = this.add.image(0, 0, 'bg-menu');
    bgImage.setOrigin(0, 0);
    bgImage.setDisplaySize(width, height);
    
    // Create animated background particles
    this.createBackgroundParticles();
    
    // Create glowing title with animation
    this.createGlowingTitle(width / 2, 150);
    
    // Create animated subtitle
    this.createAnimatedSubtitle(width / 2, 220);
    
    // Create enhanced buttons with particle effects
    this.trainingBtn = this.createEnhancedGamingButton(width / 2, 320, 450, 80, 'TRAINING', 0x4CAF50, 0x45a049, 0x00ff00);
    this.trainingBtn.on('pointerdown', () => this.startTraining());

    this.survivalBtn = this.createEnhancedGamingButton(width / 2, 420, 450, 80, 'SURVIVAL', 0xE65100, 0xBF360C, 0xff6600);
    this.survivalBtn.on('pointerdown', () => this.startSurvival());

    this.multiplayerBtn = this.createEnhancedGamingButton(width / 2, 520, 450, 80, 'MULTIPLAYER', 0x2196F3, 0x1976D2, 0x0080ff);
    this.multiplayerBtn.on('pointerdown', () => this.startMultiplayer());

    // Create animated version info
    this.createAnimatedVersionInfo(width / 2, height - 50);
    
    // Add ambient sound effects (visual only for now)
    this.createAmbientEffects();
  }

  createBackgroundParticles() {
    // Create floating particles in background
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        2,
        0xffffff,
        0.3
      );
      
      // Animate particles floating up
      this.tweens.add({
        targets: particle,
        y: -50,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Linear',
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  createGlowingTitle(x, y) {
    // Create glow effect behind title
    const glow = this.add.text(x, y, 'TAILSTRIKE ARENA', {
      fontSize: '72px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    glow.setAlpha(0.5);
    glow.setBlendMode('ADD');
    
    // Animate glow
    this.tweens.add({
      targets: glow,
      alpha: 0.8,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Main title
    const title = this.add.text(x, y, 'TAILSTRIKE ARENA', {
      fontSize: '72px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold',
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5);
    
    // Add pulsing effect to title
    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  createAnimatedSubtitle(x, y) {
    const subtitle = this.add.text(x, y, 'Epic Pixel Combat', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5);
    
    // Add subtle floating animation
    this.tweens.add({
      targets: subtitle,
      y: y + 5,
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  createAnimatedVersionInfo(x, y) {
    const versionText = this.add.text(x, y, 'v1.0.0', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      fill: '#666666',
      stroke: '#000000',
      strokeThickness: 1,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add subtle fade animation
    this.tweens.add({
      targets: versionText,
      alpha: 0.7,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  createAmbientEffects() {
    // Create screen edge glow effects
    const edgeGlow = this.add.graphics();
    edgeGlow.lineStyle(2, 0x00ff00, 0.3);
    edgeGlow.strokeRect(10, 10, this.scale.width - 20, this.scale.height - 20);
    
    // Animate edge glow
    this.tweens.add({
      targets: edgeGlow,
      alpha: 0.6,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  createEnhancedGamingButton(x, y, width, height, text, primaryColor, hoverColor, glowColor) {
    // Create outer glow effect
    const outerGlow = this.add.rectangle(x, y, width + 8, height + 8, glowColor, 0.3);
    outerGlow.setStrokeStyle(2, glowColor, 0.6);
    
    // Create button background with gradient effect
    const buttonBg = this.add.rectangle(x, y, width, height, primaryColor);
    buttonBg.setStrokeStyle(4, 0x000000, 1);
    
    // Create inner highlight for 3D effect
    const highlight = this.add.rectangle(x, y - 2, width - 8, height / 2, 0xffffff, 0.4);
    highlight.setStrokeStyle(2, 0xffffff, 0.6);
    
    // Create button text with enhanced gaming style
    const buttonText = this.add.text(x, y, text, {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5);
    
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
    
    // Add enhanced hover effects
    buttonBg.on('pointerover', () => {
      // Change colors
      buttonBg.setFillStyle(hoverColor);
      outerGlow.setFillStyle(glowColor, 0.5);
      outerGlow.setStrokeStyle(3, glowColor, 0.8);
      
      // Scale effects
      buttonText.setScale(1.05);
      this.tweens.add({
        targets: [buttonBg, highlight, buttonText],
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 150,
        ease: 'Power2'
      });
      
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
    });
    
    buttonBg.on('pointerout', () => {
      // Reset colors
      buttonBg.setFillStyle(primaryColor);
      outerGlow.setFillStyle(glowColor, 0.3);
      outerGlow.setStrokeStyle(2, glowColor, 0.6);
      
      // Reset scale
      buttonText.setScale(1);
      this.tweens.add({
        targets: [buttonBg, highlight, buttonText],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
      
      // Stop particle emission
      this.stopButtonParticles(buttonBg);
      
      // Stop pulsing
      this.tweens.killTweensOf(outerGlow);
      outerGlow.setAlpha(0.3);
    });
    
    // Add enhanced click effect
    buttonBg.on('pointerdown', () => {
      // Create explosion effect
      this.createButtonExplosion(x, y, glowColor);
      
      // Scale down effect
      this.tweens.add({
        targets: [buttonBg, highlight, buttonText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        ease: 'Power2',
        yoyo: true
      });
      
      // Flash effect
      this.tweens.add({
        targets: outerGlow,
        alpha: 1,
        duration: 100,
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

  shutdown() {
    // Clean up all particle timers when scene is destroyed
    if (this.trainingBtn) {
      this.stopButtonParticles(this.trainingBtn);
    }
    if (this.survivalBtn) {
      this.stopButtonParticles(this.survivalBtn);
    }
    if (this.multiplayerBtn) {
      this.stopButtonParticles(this.multiplayerBtn);
    }
    
    // Clear all tweens
    this.tweens.killAll();
    
    // Clear all timers
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer);
    }
  }

  startTraining() {
    // Go directly to training arena selection with character selection built-in
    this.scene.start('TrainingArenaSelectionScene', { 
      isMultiplayer: false,
      isTraining: true,
      survivalMode: false,
      socket: null,
      roomId: null,
      isHost: false
    });
  }

  startSurvival() {
    this.scene.start('TrainingArenaSelectionScene', {
      isMultiplayer: false,
      isTraining: true,
      survivalMode: true,
      socket: null,
      roomId: null,
      isHost: false,
    });
  }

  startMultiplayer() {
    // Go to lobby for multiplayer
    this.scene.start('LobbyScene');
  }
} 