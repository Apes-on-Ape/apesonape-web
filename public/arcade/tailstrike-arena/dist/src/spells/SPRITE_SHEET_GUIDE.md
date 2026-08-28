# Sprite Sheet Guide for Tailstrike Arena Spell System

## Overview

This guide explains the sprite sheet structure used in the Tailstrike Arena spell system. All spell sprite sheets follow a consistent format optimized for performance and visual quality.

## Sprite Sheet Specifications

### Standard Dimensions
- **Width**: 192 pixels
- **Height**: 128 pixels
- **Format**: PNG with transparency
- **Layout**: Horizontal strip (frames arranged left to right)

### Frame Layouts

#### 5-Frame Animations (Regular Spells)
- **Frame Width**: 38 pixels (192 ÷ 5 = 38.4, rounded down)
- **Frame Height**: 128 pixels
- **Layout**: 5 frames horizontally, 1 frame vertically
- **Total Frames**: 5

#### 6-Frame Animations (Mega Spells)
- **Frame Width**: 32 pixels (192 ÷ 6 = 32)
- **Frame Height**: 128 pixels
- **Layout**: 6 frames horizontally, 1 frame vertically
- **Total Frames**: 6

## Sprite Sheet Inventory

### Punch/Combat Animations
| Sprite Sheet | Size | Frames | Usage | Characters |
|--------------|------|--------|-------|------------|
| `rogue_punch.png` | 192x128 | 5 | Regular | DON VERMILLION |
| `dev_punch.png` | 192x128 | 5 | Regular | SHADOWSTRIKE, VOIDWALKER, INFERNUS |
| `dev_descend.png` | 192x128 | 6 | Mega | SHADOWSTRIKE, VOIDWALKER |
| `dev_cut.png` | 192x128 | 6 | Mega | INFERNUS |
| `warrior_slash.png` | 192x128 | 5 | Regular | IRONHEART, MAXIMUS REX |
| `warrior_punch.png` | 192x128 | 6 | Mega | IRONHEART, FIST KING, MAXIMUS REX |
| `uppercut.png` | 192x128 | 5 | Regular | FIST KING |

### Elemental Animations
| Sprite Sheet | Size | Frames | Usage | Characters |
|--------------|------|--------|-------|------------|
| `ice_slash.png` | 192x128 | 5 | Regular | FROSTBLADE |
| `ice_wall.png` | 192x128 | 6 | Mega | FROSTBLADE |
| `fire_orb.png` | 192x128 | 5 | Regular | FLAMESTORM |
| `magma_blast.png` | 192x128 | 6 | Mega | FLAMESTORM |
| `slime_attack.png` | 192x128 | 5 | Regular | NATUREBORN |
| `slime_shot.png` | 192x128 | 6 | Mega | NATUREBORN |

### Special Animations
| Sprite Sheet | Size | Frames | Usage | Characters |
|--------------|------|--------|-------|------------|
| `gold_punch.png` | 192x128 | 5 | Regular | AURION |
| `gold_tornado.png` | 192x128 | 6 | Mega | AURION |
| `rogue_slice.png` | 192x128 | 5 | Regular | BLACKJACK |
| `blood_dash.png` | 192x128 | 6 | Mega | BLACKJACK, DON VERMILLION |
| `holy_cross.png` | 192x128 | 5 | Regular | PINK SHADOW |
| `holy_hammer.png` | 192x128 | 6 | Mega | PINK SHADOW |
| `halloween_shot.png` | 192x128 | 5 | Regular | SMOKE |
| `demon_slash_1.png` | 192x128 | 6 | Mega | SMOKE |
| `gob_orb.png` | 192x128 | 5 | Regular | JAMES |
| `gob_beam.png` | 192x128 | 6 | Mega | JAMES |

## Animation Configuration

### Frame Rate Settings
- **Regular Spells**: 10-12 FPS (faster, more responsive)
- **Mega Spells**: 12-15 FPS (slightly slower, more dramatic)

### Animation Properties
```javascript
{
  spriteSheet: 'dev_punch',
  frameCount: 5,
  frameRate: 12,
  repeat: 0,  // No looping
  frameWidth: 38,
  frameHeight: 128
}
```

## Visual Analysis of Your Sprite Sheets

### `rogue_punch.png` (192x128, 5 frames)
**Description**: Punch animation with green energy effects
- **Frame 1**: Preparation pose with green energy gathering
- **Frame 2**: Wind-up motion with increased energy
- **Frame 3**: Peak wind-up with maximum energy concentration
- **Frame 4**: Impact frame with energy release and red target
- **Frame 5**: Follow-through with dissipating energy

### `dev_punch.png` (192x128, 5 frames)
**Description**: Dark punch animation with shadow effects
- **Frame 1**: Shadow energy gathering
- **Frame 2**: Dark energy compression
- **Frame 3**: Maximum shadow concentration
- **Frame 4**: Impact with void distortion
- **Frame 5**: Shadow dissipation

### `dev_descend.png` (192x128, 6 frames)
**Description**: Descending attack with multiple impact phases
- **Frame 1**: Initial descent preparation
- **Frame 2**: Mid-descent with energy trails
- **Frame 3**: Impact preparation
- **Frame 4**: Primary impact with explosion
- **Frame 5**: Secondary impact effects
- **Frame 6**: Final dissipation

## Performance Optimization

### Memory Usage
- **5-frame animations**: ~38KB per sprite sheet
- **6-frame animations**: ~32KB per sprite sheet
- **Total memory**: ~1.5MB for all spell animations

### Loading Strategy
1. **Lazy Loading**: Load sprite sheets only when character is selected
2. **Caching**: Keep loaded sprite sheets in memory during gameplay
3. **Cleanup**: Unload unused sprite sheets when switching characters

## Troubleshooting

### Common Issues

#### Sprite Sheet Not Loading
```javascript
// Check if sprite sheet exists
if (this.textures.exists('dev_punch')) {
  console.log('Sprite sheet loaded successfully');
} else {
  console.error('Sprite sheet not found');
}
```

#### Frame Misalignment
```javascript
// Verify frame dimensions
const config = this.getSpriteSheetConfig('dev_punch');
if (config) {
  console.log(`Expected: ${config.width}x${config.height}, ${config.frameCount} frames`);
}
```

#### Animation Not Playing
```javascript
// Check animation creation
if (this.anims.exists('SHADOWSTRIKE_regular_anim')) {
  console.log('Animation created successfully');
} else {
  console.error('Animation creation failed');
}
```

## Best Practices

### Creating New Sprite Sheets
1. **Use 192x128 dimensions** for consistency
2. **5 frames for regular spells**, 6 frames for mega spells
3. **Horizontal layout** with frames left to right
4. **Transparent background** for proper compositing
5. **Consistent frame timing** for smooth animation

### Optimization Tips
1. **Reduce color palette** to minimize file size
2. **Use indexed PNG** for better compression
3. **Test frame alignment** before integration
4. **Verify animation timing** matches game mechanics

## Integration Example

```javascript
// Add new sprite sheet to SpellManager
this.spriteAnimations.set('NEW_CHARACTER_regular', {
  spriteSheet: 'new_spell_effect',
  frameCount: 5,
  frameRate: 12,
  repeat: 0,
  frameWidth: 38,
  frameHeight: 128
});

// Add to known sheets configuration
'new_spell_effect': { width: 192, height: 128, frameCount: 5 }
```

## File Structure
```
public/assets/spells/
├── rogue_punch.png      # DON VERMILLION regular
├── dev_punch.png        # SHADOWSTRIKE, VOIDWALKER, INFERNUS regular
├── dev_descend.png      # SHADOWSTRIKE, VOIDWALKER mega
├── dev_cut.png          # INFERNUS mega
├── warrior_slash.png    # IRONHEART, MAXIMUS REX regular
├── warrior_punch.png    # IRONHEART, FIST KING, MAXIMUS REX mega
└── ... (other spell effects)
```

This guide ensures consistent sprite sheet usage across the entire spell system while maintaining optimal performance and visual quality. 