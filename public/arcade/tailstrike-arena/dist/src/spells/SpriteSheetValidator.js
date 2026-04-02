/**
 * SpriteSheetValidator - Validates sprite sheet configurations
 * Ensures all sprite sheets have correct dimensions and frame counts
 */

export default class SpriteSheetValidator {
  constructor() {
    this.expectedDimensions = {
      width: 192,
      height: 128
    };
    
    this.spriteSheetConfigs = {
      // 5-frame animations (Regular spells)
      'rogue_punch': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'dev_punch': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'warrior_slash': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'uppercut': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'ice_slash': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'fire_orb': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'slime_attack': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'gold_punch': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'rogue_slice': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'holy_cross': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'halloween_shot': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      'gob_orb': { frameCount: 5, frameWidth: 38, frameHeight: 128 },
      
      // 6-frame animations (Mega spells)
      'dev_descend': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'dev_cut': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'warrior_punch': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'ice_wall': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'magma_blast': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'slime_shot': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'gold_tornado': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'blood_dash': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'holy_hammer': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'demon_slash_1': { frameCount: 6, frameWidth: 32, frameHeight: 128 },
      'gob_beam': { frameCount: 6, frameWidth: 32, frameHeight: 128 }
    };
  }

  /**
   * Validate sprite sheet configuration
   * @param {string} spriteSheetName - Name of the sprite sheet
   * @param {Object} config - Configuration object
   * @returns {Object} Validation result
   */
  validateSpriteSheet(spriteSheetName, config) {
    const expected = this.spriteSheetConfigs[spriteSheetName];
    
    if (!expected) {
      return {
        valid: false,
        error: `Unknown sprite sheet: ${spriteSheetName}`,
        suggestions: Object.keys(this.spriteSheetConfigs)
      };
    }

    const issues = [];
    
    // Check frame count
    if (config.frameCount !== expected.frameCount) {
      issues.push(`Frame count mismatch: expected ${expected.frameCount}, got ${config.frameCount}`);
    }
    
    // Check frame width
    if (config.frameWidth !== expected.frameWidth) {
      issues.push(`Frame width mismatch: expected ${expected.frameWidth}, got ${config.frameWidth}`);
    }
    
    // Check frame height
    if (config.frameHeight !== expected.frameHeight) {
      issues.push(`Frame height mismatch: expected ${expected.frameHeight}, got ${config.frameHeight}`);
    }
    
    // Check frame rate
    if (config.frameRate < 8 || config.frameRate > 20) {
      issues.push(`Frame rate out of range: ${config.frameRate} (should be 8-20)`);
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      expected: expected,
      actual: config
    };
  }

  /**
   * Validate all sprite sheet configurations
   * @param {Object} spellManager - SpellManager instance
   * @returns {Object} Complete validation report
   */
  validateAllSpriteSheets(spellManager) {
    const results = {};
    let totalIssues = 0;
    
    for (const [animationKey, config] of spellManager.spriteAnimations) {
      const spriteSheetName = config.spriteSheet;
      if (spriteSheetName) {
        const validation = this.validateSpriteSheet(spriteSheetName, config);
        results[animationKey] = validation;
        
        if (!validation.valid) {
          totalIssues += validation.issues.length;
        }
      }
    }
    
    return {
      totalAnimations: Object.keys(results).length,
      totalIssues: totalIssues,
      results: results,
      summary: this.generateSummary(results)
    };
  }

  /**
   * Generate validation summary
   * @param {Object} results - Validation results
   * @returns {Object} Summary object
   */
  generateSummary(results) {
    const valid = Object.values(results).filter(r => r.valid).length;
    const invalid = Object.values(results).filter(r => !r.valid).length;
    
    const commonIssues = {};
    Object.values(results).forEach(result => {
      if (!result.valid) {
        result.issues.forEach(issue => {
          commonIssues[issue] = (commonIssues[issue] || 0) + 1;
        });
      }
    });
    
    return {
      valid: valid,
      invalid: invalid,
      total: valid + invalid,
      commonIssues: commonIssues
    };
  }

  /**
   * Generate sprite sheet analysis report
   * @param {string} spriteSheetName - Name of the sprite sheet
   * @returns {Object} Analysis report
   */
  analyzeSpriteSheet(spriteSheetName) {
    const config = this.spriteSheetConfigs[spriteSheetName];
    
    if (!config) {
      return {
        error: `Unknown sprite sheet: ${spriteSheetName}`,
        available: Object.keys(this.spriteSheetConfigs)
      };
    }
    
    const totalPixels = this.expectedDimensions.width * this.expectedDimensions.height;
    const framePixels = config.frameWidth * config.frameHeight;
    const totalFrames = config.frameCount;
    
    return {
      name: spriteSheetName,
      dimensions: {
        total: `${this.expectedDimensions.width}x${this.expectedDimensions.height}`,
        frame: `${config.frameWidth}x${config.frameHeight}`,
        frames: totalFrames
      },
      layout: {
        type: 'horizontal',
        framesPerRow: totalFrames,
        rows: 1
      },
      performance: {
        totalPixels: totalPixels,
        framePixels: framePixels,
        memoryEstimate: `${Math.round(totalPixels * 4 / 1024)}KB`
      },
      usage: this.getSpriteSheetUsage(spriteSheetName)
    };
  }

  /**
   * Get sprite sheet usage information
   * @param {string} spriteSheetName - Name of the sprite sheet
   * @returns {Array} Array of characters using this sprite sheet
   */
  getSpriteSheetUsage(spriteSheetName) {
    const usage = {
      'rogue_punch': ['DON VERMILLION'],
      'dev_punch': ['SHADOWSTRIKE', 'VOIDWALKER', 'INFERNUS'],
      'dev_descend': ['SHADOWSTRIKE', 'VOIDWALKER'],
      'dev_cut': ['INFERNUS'],
      'warrior_slash': ['IRONHEART', 'MAXIMUS REX'],
      'warrior_punch': ['IRONHEART', 'FIST KING', 'MAXIMUS REX'],
      'uppercut': ['FIST KING'],
      'ice_slash': ['FROSTBLADE'],
      'ice_wall': ['FROSTBLADE'],
      'fire_orb': ['FLAMESTORM'],
      'magma_blast': ['FLAMESTORM'],
      'slime_attack': ['NATUREBORN'],
      'slime_shot': ['NATUREBORN'],
      'gold_punch': ['AURION'],
      'gold_tornado': ['AURION'],
      'rogue_slice': ['BLACKJACK'],
      'blood_dash': ['BLACKJACK', 'DON VERMILLION'],
      'holy_cross': ['PINK SHADOW'],
      'holy_hammer': ['PINK SHADOW'],
      'halloween_shot': ['SMOKE'],
      'demon_slash_1': ['SMOKE'],
      'gob_orb': ['JAMES'],
      'gob_beam': ['JAMES']
    };
    
    return usage[spriteSheetName] || [];
  }

  /**
   * Print validation report to console
   * @param {Object} report - Validation report
   */
  printReport(report) {
    console.log('=== Sprite Sheet Validation Report ===');
    console.log(`Total Animations: ${report.totalAnimations}`);
    console.log(`Valid: ${report.summary.valid}`);
    console.log(`Invalid: ${report.summary.invalid}`);
    console.log(`Total Issues: ${report.totalIssues}`);
    
    if (report.summary.commonIssues.length > 0) {
      console.log('\n=== Common Issues ===');
      Object.entries(report.summary.commonIssues).forEach(([issue, count]) => {
        console.log(`${issue}: ${count} occurrences`);
      });
    }
    
    console.log('\n=== Detailed Results ===');
    Object.entries(report.results).forEach(([animationKey, result]) => {
      if (!result.valid) {
        console.log(`❌ ${animationKey}:`);
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log(`✅ ${animationKey}: Valid`);
      }
    });
  }
}

// Export for use in other modules
export { SpriteSheetValidator }; 