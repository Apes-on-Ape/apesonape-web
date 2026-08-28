/**
 * SpellConfig - Centralized configuration for all spell properties
 * Ensures balanced gameplay with 100 HP cap and character-specific stats
 */

export const SPELL_CONFIG = {
  // THUNDERFIST - Lightning Warrior
  THUNDERFIST: {
    name: 'THUNDERFIST',
    stats: {
      speed: 1.3,
      damage: 1.1,
      defense: 0.9
    },
    regularSpell: {
      name: 'Lightning Strike',
      damage: 25,
      cooldown: 800,
      speed: 1.2,
      effect: 'lightning',
      description: 'Quick lightning bolt with electric effects',
      visual: {
        particleCount: 20,
        duration: 150,
        screenShake: false,
        sound: 'lightning_crack'
      }
    },
    megaSpell: {
      name: 'Thunderstorm',
      damage: 60,
      cooldown: 3000,
      speed: 1.0,
      effect: 'thunderstorm',
      description: 'Massive lightning storm with area damage',
      visual: {
        particleCount: 40,
        duration: 400,
        screenShake: true,
        sound: 'thunder_boom'
      }
    }
  },

  // FROSTBLADE - Ice Master
  FROSTBLADE: {
    name: 'FROSTBLADE',
    stats: {
      speed: 1.4,
      damage: 0.9,
      defense: 1.0
    },
    regularSpell: {
      name: 'Ice Shard',
      damage: 20,
      cooldown: 600,
      speed: 1.3,
      effect: 'ice',
      description: 'Fast ice projectile with freezing effects',
      visual: {
        particleCount: 25,
        duration: 200,
        screenShake: false,
        sound: 'ice_crack'
      }
    },
    megaSpell: {
      name: 'Blizzard',
      damage: 50,
      cooldown: 2500,
      speed: 1.1,
      effect: 'blizzard',
      description: 'Freezing blizzard with area control',
      visual: {
        particleCount: 60,
        duration: 800,
        screenShake: true,
        sound: 'blizzard_wind'
      }
    }
  },

  // SHADOWSTRIKE - Dark Assassin
  SHADOWSTRIKE: {
    name: 'SHADOWSTRIKE',
    stats: {
      speed: 1.2,
      damage: 1.3,
      defense: 0.8
    },
    regularSpell: {
      name: 'Shadow Bolt',
      damage: 30,
      cooldown: 1000,
      speed: 1.0,
      effect: 'shadow',
      description: 'Dark energy blast with shadow effects',
      visual: {
        particleCount: 25,
        duration: 300,
        screenShake: false,
        sound: 'shadow_whisper'
      }
    },
    megaSpell: {
      name: 'Shadow Realm',
      damage: 70,
      cooldown: 4000,
      speed: 0.9,
      effect: 'shadowrealm',
      description: 'Dark dimension attack with reality warping',
      visual: {
        particleCount: 70,
        duration: 800,
        screenShake: true,
        sound: 'void_echo'
      }
    }
  },

  // FLAMESTORM - Fire Mage
  FLAMESTORM: {
    name: 'FLAMESTORM',
    stats: {
      speed: 0.9,
      damage: 1.4,
      defense: 0.9
    },
    regularSpell: {
      name: 'Fireball',
      damage: 28,
      cooldown: 900,
      speed: 1.1,
      effect: 'fire',
      description: 'Burning fireball with flame effects',
      visual: {
        particleCount: 30,
        duration: 250,
        screenShake: false,
        sound: 'fire_roar'
      }
    },
    megaSpell: {
      name: 'Inferno',
      damage: 65,
      cooldown: 3500,
      speed: 1.0,
      effect: 'inferno',
      description: 'Massive firestorm with intense heat',
      visual: {
        particleCount: 80,
        duration: 600,
        screenShake: true,
        sound: 'inferno_burn'
      }
    }
  },

  // NATUREBORN - Earth Guardian
  NATUREBORN: {
    name: 'NATUREBORN',
    stats: {
      speed: 1.0,
      damage: 1.0,
      defense: 1.2
    },
    regularSpell: {
      name: 'Nature Spike',
      damage: 22,
      cooldown: 700,
      speed: 1.2,
      effect: 'nature',
      description: 'Sharp nature spike with earth effects',
      visual: {
        particleCount: 20,
        duration: 200,
        screenShake: false,
        sound: 'nature_grow'
      }
    },
    megaSpell: {
      name: 'Forest Rage',
      damage: 55,
      cooldown: 2800,
      speed: 1.1,
      effect: 'forestrage',
      description: 'Nature\'s fury with forest magic',
      visual: {
        particleCount: 50,
        duration: 700,
        screenShake: true,
        sound: 'forest_rage'
      }
    }
  },

  // VOIDWALKER - Shadow Mystic
  VOIDWALKER: {
    name: 'VOIDWALKER',
    stats: {
      speed: 0.8,
      damage: 1.5,
      defense: 0.7
    },
    regularSpell: {
      name: 'Void Blast',
      damage: 35,
      cooldown: 1200,
      speed: 0.9,
      effect: 'void',
      description: 'Void energy projectile with reality distortion',
      visual: {
        particleCount: 30,
        duration: 350,
        screenShake: false,
        sound: 'void_blast'
      }
    },
    megaSpell: {
      name: 'Void Rift',
      damage: 75,
      cooldown: 4500,
      speed: 0.8,
      effect: 'voidrift',
      description: 'Reality-warping attack with dimensional effects',
      visual: {
        particleCount: 80,
        duration: 900,
        screenShake: true,
        sound: 'void_rift'
      }
    }
  },

  // AURION - Golden Hero
  AURION: {
    name: 'AURION',
    stats: {
      speed: 1.1,
      damage: 1.2,
      defense: 1.1
    },
    regularSpell: {
      name: 'Golden Ray',
      damage: 26,
      cooldown: 850,
      speed: 1.1,
      effect: 'golden',
      description: 'Radiant golden beam with divine light',
      visual: {
        particleCount: 30,
        duration: 200,
        screenShake: false,
        sound: 'divine_light'
      }
    },
    megaSpell: {
      name: 'Divine Judgment',
      damage: 62,
      cooldown: 3200,
      speed: 1.0,
      effect: 'divine',
      description: 'Heavenly judgment with celestial power',
      visual: {
        particleCount: 60,
        duration: 500,
        screenShake: true,
        sound: 'divine_judgment'
      }
    }
  },

  // IRONHEART - Armored Guardian
  IRONHEART: {
    name: 'IRONHEART',
    stats: {
      speed: 0.9,
      damage: 1.0,
      defense: 1.4
    },
    regularSpell: {
      name: 'Sideways Slash',
      damage: 24,
      cooldown: 750,
      speed: 1.0,
      effect: 'iron',
      description: 'Throws a sword with metallic effects and energy aura',
      visual: {
        particleCount: 20,
        duration: 180,
        screenShake: false,
        sound: 'metal_clang'
      }
    },
    megaSpell: {
      name: 'Iron Storm',
      damage: 58,
      cooldown: 3000,
      speed: 0.9,
      effect: 'ironstorm',
      description: 'Metal storm barrage with armored fury',
      visual: {
        particleCount: 55,
        duration: 600,
        screenShake: true,
        sound: 'iron_storm'
      }
    }
  },

  // FIST KING - Boxing Champion
  'FIST KING': {
    name: 'FIST KING',
    stats: {
      speed: 1.0,
      damage: 1.3,
      defense: 1.0
    },
    regularSpell: {
      name: 'Two Fists',
      damage: 32,
      cooldown: 1100,
      speed: 1.0,
      effect: 'fist',
      description: 'Throws two fists with boxing glove effects and golden auras',
      visual: {
        particleCount: 25,
        duration: 250,
        screenShake: false,
        sound: 'punch_impact'
      }
    },
    megaSpell: {
      name: 'King\'s Fury',
      damage: 68,
      cooldown: 3800,
      speed: 0.9,
      effect: 'kingsfury',
      description: 'Champion\'s ultimate with boxing ring effects',
      visual: {
        particleCount: 65,
        duration: 700,
        screenShake: true,
        sound: 'kings_fury'
      }
    }
  },

  // BLACKJACK - Rogue with an Eye Patch
  BLACKJACK: {
    name: 'BLACKJACK',
    stats: {
      speed: 1.3,
      damage: 1.1,
      defense: 0.8
    },
    regularSpell: {
      name: 'Quick Daggers',
      damage: 27,
      cooldown: 800,
      speed: 1.3,
      effect: 'dagger',
      description: 'Throws daggers with assassin precision and blood-red effects',
      visual: {
        particleCount: 20,
        duration: 200,
        screenShake: false,
        sound: 'dagger_throw'
      }
    },
    megaSpell: {
      name: 'Rogue\'s Gambit',
      damage: 63,
      cooldown: 3300,
      speed: 1.1,
      effect: 'roguesgambit',
      description: 'Deadly rogue technique with stealth effects',
      visual: {
        particleCount: 50,
        duration: 550,
        screenShake: true,
        sound: 'rogues_gambit'
      }
    }
  },

  // INFERNUS - Devilish Warrior
  INFERNUS: {
    name: 'INFERNUS',
    stats: {
      speed: 0.8,
      damage: 1.4,
      defense: 0.9
    },
    regularSpell: {
      name: 'Giant Magma Balls',
      damage: 33,
      cooldown: 1150,
      speed: 0.9,
      effect: 'magma',
      description: 'Giant magma balls with volcanic fury, molten core, and lava particles',
      visual: {
        particleCount: 35,
        duration: 300,
        screenShake: false,
        sound: 'magma_burst'
      }
    },
    megaSpell: {
      name: 'Devil\'s Wrath',
      damage: 72,
      cooldown: 4200,
      speed: 0.8,
      effect: 'devilswrath',
      description: 'Satanic fury with hellfire',
      visual: {
        particleCount: 85,
        duration: 800,
        screenShake: true,
        sound: 'devils_wrath'
      }
    }
  },

  // DON VERMILLION - Mafia Leader
  'DON VERMILLION': {
    name: 'DON VERMILLION',
    stats: {
      speed: 1.0,
      damage: 1.2,
      defense: 1.1
    },
    regularSpell: {
      name: 'Tiny Missiles',
      damage: 29,
      cooldown: 950,
      speed: 1.1,
      effect: 'missile',
      description: 'Shoots tiny missiles repeatedly with precision',
      visual: {
        particleCount: 25,
        duration: 220,
        screenShake: false,
        sound: 'missile_launch'
      }
    },
    megaSpell: {
      name: 'Mafia\'s Revenge',
      damage: 66,
      cooldown: 3600,
      speed: 1.0,
      effect: 'mafiasrevenge',
      description: 'Mafia boss\'s wrath with organized crime power',
      visual: {
        particleCount: 60,
        duration: 650,
        screenShake: true,
        sound: 'mafias_revenge'
      }
    }
  },

  // MAXIMUS REX - Gladiator King
  'MAXIMUS REX': {
    name: 'MAXIMUS REX',
    stats: {
      speed: 0.9,
      damage: 1.3,
      defense: 1.2
    },
    regularSpell: {
      name: 'Giant Spear Power',
      damage: 31,
      cooldown: 1050,
      speed: 1.0,
      effect: 'spear',
      description: 'Giant spear power with gladiator strength',
      visual: {
        particleCount: 25,
        duration: 240,
        screenShake: false,
        sound: 'spear_throw'
      }
    },
    megaSpell: {
      name: 'Colosseum\'s Fury',
      damage: 69,
      cooldown: 3900,
      speed: 0.9,
      effect: 'colosseumfury',
      description: 'Gladiator\'s ultimate with arena power',
      visual: {
        particleCount: 70,
        duration: 750,
        screenShake: true,
        sound: 'colosseum_fury'
      }
    }
  },

  // PINK SHADOW - Nude Trickster
  'PINK SHADOW': {
    name: 'PINK SHADOW',
    stats: {
      speed: 1.5,
      damage: 0.8,
      defense: 0.7
    },
    regularSpell: {
      name: 'Pink Circles',
      damage: 18,
      cooldown: 500,
      speed: 1.4,
      effect: 'pink',
      description: 'Pink circles with trickster magic',
      visual: {
        particleCount: 20,
        duration: 150,
        screenShake: false,
        sound: 'pink_magic'
      }
    },
    megaSpell: {
      name: 'Trickster\'s Chaos',
      damage: 48,
      cooldown: 2200,
      speed: 1.2,
      effect: 'tricksterchaos',
      description: 'Chaotic trickster magic with unpredictable effects',
      visual: {
        particleCount: 45,
        duration: 500,
        screenShake: true,
        sound: 'trickster_chaos'
      }
    }
  },

  // SMOKE - The Dev
  SMOKE: {
    name: 'SMOKE',
    stats: {
      speed: 1.1,
      damage: 1.0,
      defense: 1.0
    },
    regularSpell: {
      name: 'Lines of Code',
      damage: 26,
      cooldown: 850,
      speed: 1.1,
      effect: 'code',
      description: 'Lines of code with digital effects and green particles',
      visual: {
        particleCount: 30,
        duration: 200,
        screenShake: false,
        sound: 'code_compile'
      }
    },
    megaSpell: {
      name: 'System Crash',
      damage: 61,
      cooldown: 3100,
      speed: 1.0,
      effect: 'systemcrash',
      description: 'Digital system crash with technological chaos',
      visual: {
        particleCount: 65,
        duration: 600,
        screenShake: true,
        sound: 'system_crash'
      }
    }
  },

  // JAMES - Goblin King
  JAMES: {
    name: 'JAMES',
    stats: {
      speed: 1.2,
      damage: 0.9,
      defense: 0.9
    },
    regularSpell: {
      name: '3 Rainbow Spheres',
      damage: 23,
      cooldown: 700,
      speed: 1.2,
      effect: 'rainbow',
      description: '3 rainbow spheres with colorful magic and sparkles',
      visual: {
        particleCount: 35,
        duration: 250,
        screenShake: false,
        sound: 'rainbow_sparkle'
      }
    },
    megaSpell: {
      name: 'Goblin Kingdom',
      damage: 54,
      cooldown: 2700,
      speed: 1.1,
      effect: 'goblinkingdom',
      description: 'Goblin king\'s power with mystical effects',
      visual: {
        particleCount: 55,
        duration: 550,
        screenShake: true,
        sound: 'goblin_kingdom'
      }
    }
  }
};

/**
 * Get spell configuration for a character
 */
export function getSpellConfig(characterName) {
  return SPELL_CONFIG[characterName] || SPELL_CONFIG.THUNDERFIST;
}

/**
 * Get all character names
 */
export function getCharacterNames() {
  return Object.keys(SPELL_CONFIG);
}

/**
 * Calculate balanced damage based on character stats
 */
export function calculateBalancedDamage(baseDamage, characterConfig) {
  const { damage: damageMultiplier } = characterConfig.stats;
  return Math.floor(baseDamage * damageMultiplier);
}

/**
 * Calculate balanced cooldown based on character stats
 */
export function calculateBalancedCooldown(baseCooldown, characterConfig) {
  const { speed: speedMultiplier } = characterConfig.stats;
  return Math.floor(baseCooldown / speedMultiplier);
}

/**
 * Validate spell balance for 100 HP cap
 */
export function validateSpellBalance() {
  const issues = [];
  
  Object.entries(SPELL_CONFIG).forEach(([characterName, config]) => {
    const regularDamage = calculateBalancedDamage(config.regularSpell.damage, config);
    const megaDamage = calculateBalancedDamage(config.megaSpell.damage, config);
    
    // Check if damage is too high for 100 HP
    if (megaDamage > 80) {
      issues.push(`${characterName}: Mega spell damage (${megaDamage}) too high for 100 HP cap`);
    }
    
    if (regularDamage > 40) {
      issues.push(`${characterName}: Regular spell damage (${regularDamage}) too high for 100 HP cap`);
    }
    
    // Check cooldown balance
    const regularCooldown = calculateBalancedCooldown(config.regularSpell.cooldown, config);
    const megaCooldown = calculateBalancedCooldown(config.megaSpell.cooldown, config);
    
    if (regularCooldown < 400) {
      issues.push(`${characterName}: Regular spell cooldown (${regularCooldown}ms) too fast`);
    }
    
    if (megaCooldown < 2000) {
      issues.push(`${characterName}: Mega spell cooldown (${megaCooldown}ms) too fast`);
    }
  });
  
  return issues;
} 