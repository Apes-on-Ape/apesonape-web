/**
 * Integration Example - How to integrate the new spell system
 * This shows the minimal changes needed to upgrade your existing GameScene
 */

// Step 1: Import the spell integration
import SpellIntegration from './SpellIntegration.js';

// Step 2: Modify your GameScene constructor
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // ... your existing constructor code ...
    
    // Add this line to initialize the spell system
    this.spellIntegration = null; // Will be initialized in init()
  }

  // Step 3: Modify your preload method
  preload() {
    // ... your existing preload code ...
    
    // Remove this.load.image('particle', 'assets/particles/particle.svg');
  }

  // Step 4: Modify your init method
  init(data) {
    // ... your existing init code ...
    
    // Add this line to initialize the spell system
    this.spellIntegration = new SpellIntegration(this);
  }

  // Step 5: Modify your shutdown method
  shutdown() {
    // ... your existing shutdown code ...
    
    // Add this line to clean up the spell system
    if (this.spellIntegration) {
      this.spellIntegration.cleanup();
    }
  }

  // Step 6: Your existing spell methods will automatically be enhanced!
  // No changes needed to these methods - they're automatically overridden:
  
  // useSpell() - Enhanced automatically
  // useMegaSpell() - Enhanced automatically  
  // createLightningEffect() - Enhanced automatically
  // createFireballEffect() - Enhanced automatically
  // etc...
}

/**
 * Example: How to add performance monitoring
 */
function addPerformanceMonitoring(scene) {
  // Add this to your update method or create a separate timer
  scene.time.addEvent({
    delay: 1000, // Check every second
    callback: () => {
      const stats = scene.spellIntegration.getPerformanceStats();
      
      // Log performance issues
      if (stats.frameTime > 16.67) {
        console.warn('Performance warning: Frame time too high');
        scene.spellIntegration.optimizeForLowEnd();
      }
      
      // Log stats for debugging
      console.log('Spell system stats:', stats);
    },
    loop: true
  });
}

/**
 * Example: How to add multiplayer spell synchronization
 */
function addMultiplayerSpellSync(scene) {
  // In your existing multiplayer event handlers, add:
  
  // When casting a spell
  scene.socket.on('spellCast', (data) => {
    scene.spellIntegration.createSpellEffectFromOtherPlayer(
      data.spellType,
      data.direction,
      data.x,
      data.y,
      data.isMega
    );
  });
  
  // When sending spell data
  function sendSpellCast(spellType, isMega = false) {
    scene.socket.emit('spellCast', {
      spellType: spellType,
      direction: scene.currentDirection,
      x: scene.player.x,
      y: scene.player.y,
      isMega: isMega
    });
  }
}

/**
 * Example: How to add audio controls
 */
function addAudioControls(scene) {
  // Add volume controls to your UI
  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('change', (e) => {
      const volume = e.target.value / 100;
      scene.spellAudio.setMasterVolume(volume);
    });
  }
  
  // Add mute button
  const muteButton = document.getElementById('mute-button');
  if (muteButton) {
    muteButton.addEventListener('click', () => {
      if (scene.spellAudio.getMasterVolume() > 0) {
        scene.spellAudio.mute();
        muteButton.textContent = 'Unmute';
      } else {
        scene.spellAudio.unmute();
        muteButton.textContent = 'Mute';
      }
    });
  }
}

/**
 * Example: How to add quality settings
 */
function addQualitySettings(scene) {
  // Add quality selector to your UI
  const qualitySelect = document.getElementById('quality-select');
  if (qualitySelect) {
    qualitySelect.addEventListener('change', (e) => {
      const quality = e.target.value;
      
      switch (quality) {
        case 'low':
          scene.spellIntegration.optimizeForLowEnd();
          break;
        case 'high':
          scene.spellIntegration.restoreHighQuality();
          break;
        case 'auto':
          // Auto-detect based on performance
          const stats = scene.spellIntegration.getPerformanceStats();
          if (stats.frameTime > 16.67) {
            scene.spellIntegration.optimizeForLowEnd();
          } else {
            scene.spellIntegration.restoreHighQuality();
          }
          break;
      }
    });
  }
}

/**
 * Example: How to validate spell balance
 */
function validateGameBalance() {
  // Note: Import validateSpellBalance at the top of your file
  // import { validateSpellBalance } from './SpellConfig.js';
  
  // const issues = validateSpellBalance();
  // if (issues.length > 0) {
  //   console.warn('Spell balance issues detected:');
  //   issues.forEach(issue => console.warn('- ' + issue));
  //   
  //   // You might want to show this to the user or log it
  //   return false;
  // }
  // 
  // console.log('Spell balance validation passed');
  // return true;
  
  console.log('Spell balance validation - import validateSpellBalance at top of file');
  return true;
}

/**
 * Example: How to add debug information
 */
function addDebugInfo(scene) {
  // Create debug overlay
  const debugText = scene.add.text(10, 10, '', {
    fontSize: '12px',
    fill: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 5, y: 5 }
  });
  debugText.setDepth(1000);
  
  // Update debug info every frame
  scene.events.on('update', () => {
    const stats = scene.spellIntegration.getIntegrationStats();
    debugText.setText([
      `Frame Time: ${stats.performance.frameTime.toFixed(2)}ms`,
      `Active Effects: ${stats.spellManager.activeEffects}`,
      `Particles: ${stats.spellManager.totalParticles}`,
      `Audio State: ${stats.spellAudio.audioContextState}`,
      `FPS: ${(1000 / stats.performance.frameTime).toFixed(1)}`
    ]);
  });
}

/**
 * Complete integration example
 */
export function integrateSpellSystem(scene) {
  // 1. Initialize spell system (already done in constructor)
  
  // 2. Add performance monitoring
  addPerformanceMonitoring(scene);
  
  // 3. Add multiplayer sync (if multiplayer)
  if (scene.isMultiplayer) {
    addMultiplayerSpellSync(scene);
  }
  
  // 4. Add audio controls
  addAudioControls(scene);
  
  // 5. Add quality settings
  addQualitySettings(scene);
  
  // 6. Validate balance
  validateGameBalance();
  
  // 7. Add debug info (optional)
  if (scene.debug) {
    addDebugInfo(scene);
  }
  
  console.log('Spell system integration complete!');
} 