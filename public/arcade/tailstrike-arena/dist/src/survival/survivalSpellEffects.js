import Phaser from 'phaser';
import GameScene from '../scenes/GameScene.js';

const SPELL_STYLE = {
  lightning: { color: 0xffff00, r: 9, speed: 520 },
  ice: { color: 0x88ffff, r: 8, speed: 480 },
  shadow: { color: 0x8844cc, r: 8, speed: 460 },
  fire: { color: 0xff6600, r: 10, speed: 420 },
  nature: { color: 0x44cc44, r: 9, speed: 400 },
  void: { color: 0x663399, r: 11, speed: 380 },
  golden: { color: 0xffd700, r: 8, speed: 450 },
  iron: { color: 0x9e9e9e, r: 10, speed: 360 },
  fist: { color: 0xff8800, r: 12, speed: 340 },
  dagger: { color: 0xc62828, r: 7, speed: 500 },
  magma: { color: 0xff6d00, r: 11, speed: 350 },
  missile: { color: 0x90caf9, r: 8, speed: 480 },
  spear: { color: 0x8b4513, r: 9, speed: 400 },
  pink: { color: 0xff69b4, r: 9, speed: 440 },
  linesofcode: { color: 0x00ff88, r: 8, speed: 460 },
  rainbowspheres: { color: 0xff00ff, r: 10, speed: 400 },
  thunderstorm: { color: 0xffff44, r: 18, mega: true },
  blizzard: { color: 0xffffff, r: 16, mega: true },
  shadowrealm: { color: 0x444444, r: 20, mega: true },
  inferno: { color: 0xff2200, r: 20, mega: true },
  forestrage: { color: 0x228b22, r: 18, mega: true },
  voidrift: { color: 0x1a0033, r: 22, mega: true },
  divine: { color: 0xffee88, r: 18, mega: true },
  ironstorm: { color: 0xb0b0b0, r: 16, mega: true },
  kingsfury: { color: 0xff8c00, r: 18, mega: true },
  roguesgambit: { color: 0x555555, r: 17, mega: true },
  devilswrath: { color: 0x8b0000, r: 20, mega: true },
  mafiasrevenge: { color: 0xaa2222, r: 18, mega: true },
  colosseum: { color: 0xd2691e, r: 18, mega: true },
  trickster: { color: 0xff1493, r: 16, mega: true },
  systemcrash: { color: 0xff0000, r: 20, mega: true },
  goblinkingdom: { color: 0x32cd32, r: 18, mega: true },
  _default: { color: 0xaaaaff, r: 8, speed: 420 },
};

function getStyle(effect) {
  return SPELL_STYLE[effect] || SPELL_STYLE._default;
}

function dirFromLast(lastDirection) {
  switch (lastDirection) {
    case 'up':
      return { vx: 0, vy: -1 };
    case 'down':
      return { vx: 0, vy: 1 };
    case 'left':
      return { vx: -1, vy: 0 };
    case 'right':
      return { vx: 1, vy: 0 };
    default:
      return { vx: 0, vy: -1 };
  }
}

function spawnMegaPulse(scene, x, y, dx, dy, effect, damage, hitsPlayer) {
  const style = getStyle(effect);
  const baseR = style.r || 20;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const distance = style.speed ? Math.max(260, Math.min(560, style.speed * 1.05)) : 420;
  const travelDuration = 420;
  const targetX = x + nx * distance;
  const targetY = y + ny * distance;
  const orb = scene.add.circle(x, y, baseR, style.color, 0.42);
  orb.setStrokeStyle(3, style.color, 0.95);
  orb.setDepth(6);
  const dmg = Math.max(1, Math.floor(damage));
  let detonated = false;
  const detonate = (cx, cy) => {
    if (detonated) return;
    detonated = true;
    const ring = scene.add.circle(cx, cy, baseR, style.color, 0.28);
    ring.setStrokeStyle(3, style.color, 0.95);
    ring.setDepth(6);

    scene.tweens.add({
      targets: ring,
      scaleX: 5.5,
      scaleY: 5.5,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        const maxDist = baseR * 5.5 + (hitsPlayer ? 40 : 48);
        if (hitsPlayer) {
          const d = Phaser.Math.Distance.Between(cx, cy, scene.player.x, scene.player.y);
          if (d < maxDist) scene.applySpellDamageToPlayer(dmg);
        } else {
          scene.enemies.getChildren().forEach((e) => {
            if (!e.active) return;
            const d = Phaser.Math.Distance.Between(cx, cy, e.x, e.y);
            if (d < maxDist) scene.applySpellDamageToEnemy(e, dmg);
          });
        }
        ring.destroy();
      },
    });
    if (orb && orb.active) {
      orb.destroy();
    }
  };

  scene.tweens.add({
    targets: orb,
    x: targetX,
    y: targetY,
    duration: travelDuration,
    ease: 'Power2',
    onUpdate: () => {
      if (detonated || !orb.active) return;
      if (hitsPlayer) {
        const d = Phaser.Math.Distance.Between(orb.x, orb.y, scene.player.x, scene.player.y);
        if (d < baseR + 26) detonate(orb.x, orb.y);
      } else {
        const enemies = scene.enemies.getChildren();
        for (let i = 0; i < enemies.length; i += 1) {
          const e = enemies[i];
          if (!e.active) continue;
          const d = Phaser.Math.Distance.Between(orb.x, orb.y, e.x, e.y);
          if (d < baseR + 26) {
            detonate(orb.x, orb.y);
            break;
          }
        }
      }
    },
    onComplete: () => {
      if (!detonated) detonate(targetX, targetY);
    },
  });
}

function spawnTravelingSpell(scene, x, y, dx, dy, effect, damage, hitsPlayer, options = {}) {
  const style = getStyle(effect);
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const radiusScale = Number(options.radiusScale || 1);
  const speedScale = Number(options.speedScale || 1);
  const damageScale = Number(options.damageScale || 1);
  const distanceScale = Number(options.distanceScale || 1);
  const coreR = Math.max(5, Math.round((style.r || 8) * radiusScale));
  const auraR = coreR + 3;
  const travelDistance = Math.max(260, Math.round(520 * distanceScale));
  const startOffsetX = Number(options.startOffsetX || 0);
  const startOffsetY = Number(options.startOffsetY || 0);
  const startX = x + startOffsetX;
  const startY = y + startOffsetY;
  const targetX = startX + nx * travelDistance;
  const targetY = startY + ny * travelDistance;
  const effectiveSpeed = Math.max(160, (style.speed || 420) * speedScale);
  const duration = Math.max(260, Math.round((travelDistance / effectiveSpeed) * 1000));
  const dmg = Math.max(1, Math.floor(damage * damageScale));
  const color = Number.isFinite(options.colorOverride) ? options.colorOverride : style.color;
  const shape = options.shape === 'rect' ? 'rect' : 'circle';

  const orb =
    shape === 'rect'
      ? scene.add.rectangle(
          startX,
          startY,
          Math.max(2, Number(options.rectW || coreR * 2)),
          Math.max(2, Number(options.rectH || Math.max(4, coreR * 0.6))),
          color,
          0.95
        )
      : scene.add.circle(startX, startY, coreR, color, 0.95);
  orb.setStrokeStyle(2, 0xffffff, 0.8);
  orb.setDepth(6);
  const aura = scene.add.circle(startX, startY, auraR, color, 0.22);
  aura.setDepth(5);

  let impacted = false;
  const impact = (ix, iy) => {
    if (impacted) return;
    impacted = true;

    if (hitsPlayer) {
      scene.applySpellDamageToPlayer(dmg);
    } else {
      let hitEnemy = null;
      const enemies = scene.enemies.getChildren();
      for (let i = 0; i < enemies.length; i += 1) {
        const e = enemies[i];
        if (!e.active) continue;
        const dist = Phaser.Math.Distance.Between(ix, iy, e.x, e.y);
        if (dist < coreR + 14) {
          hitEnemy = e;
          break;
        }
      }
      if (hitEnemy) scene.applySpellDamageToEnemy(hitEnemy, dmg);
    }

    const burst = scene.add.circle(ix, iy, coreR + 6, color, 0.45);
    burst.setStrokeStyle(2, 0xffffff, 0.7);
    burst.setDepth(7);
    scene.tweens.add({
      targets: burst,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 130,
      onComplete: () => burst.destroy(),
    });

    if (orb.active) orb.destroy();
    if (aura.active) aura.destroy();
  };

  scene.tweens.add({
    targets: [orb, aura],
    x: targetX,
    y: targetY,
    duration,
    ease: 'Linear',
    onUpdate: () => {
      if (impacted || !orb.active) return;

      // Small trail so spell path reads like training projectiles.
      const trail = scene.add.circle(
        orb.x - nx * coreR * 0.45 + Phaser.Math.Between(-1, 1),
        orb.y - ny * coreR * 0.45 + Phaser.Math.Between(-1, 1),
        Math.max(1.5, Math.round(coreR * 0.3)),
        color,
        0.35
      );
      trail.setDepth(4);
      scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 0.35,
        scaleY: 0.35,
        duration: 110,
        onComplete: () => trail.destroy(),
      });

      if (shape === 'rect') {
        orb.rotation = Math.atan2(ny, nx);
      }

      if (hitsPlayer) {
        const d = Phaser.Math.Distance.Between(orb.x, orb.y, scene.player.x, scene.player.y);
        if (d < coreR + 14) impact(orb.x, orb.y);
      } else {
        const enemies = scene.enemies.getChildren();
        for (let i = 0; i < enemies.length; i += 1) {
          const e = enemies[i];
          if (!e.active) continue;
          const d = Phaser.Math.Distance.Between(orb.x, orb.y, e.x, e.y);
          if (d < coreR + 14) {
            impact(orb.x, orb.y);
            break;
          }
        }
      }
    },
    onComplete: () => {
      if (!impacted) {
        if (orb.active) orb.destroy();
        if (aura.active) aura.destroy();
      }
    },
  });
}

function rotateVector(dx, dy, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    dx: dx * c - dy * s,
    dy: dx * s + dy * c,
  };
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const denom = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / denom));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Phaser.Math.Distance.Between(px, py, cx, cy);
}

function spawnLightningStrike(scene, x, y, dx, dy, damage, hitsPlayer, options = {}) {
  const boltCount = Number(options.bolts || 3);
  const spreadDeg = Number(options.spreadDeg || 9);
  const distance = Number(options.distance || 320);
  const duration = Number(options.duration || 150);
  const lineWidth = Number(options.lineWidth || 4);
  const split = Math.max(1, Math.floor(damage));
  const baseAngles = boltCount <= 1 ? [0] : Array.from({ length: boltCount }, (_, i) => ((i / (boltCount - 1)) * 2 - 1) * spreadDeg);

  baseAngles.forEach((angleDeg) => {
    const v = rotateVector(dx, dy, angleDeg);
    const len = Math.sqrt(v.dx * v.dx + v.dy * v.dy) || 1;
    const nx = v.dx / len;
    const ny = v.dy / len;
    const x2 = x + nx * distance;
    const y2 = y + ny * distance;
    const midX = (x + x2) * 0.5 + Phaser.Math.Between(-18, 18);
    const midY = (y + y2) * 0.5 + Phaser.Math.Between(-18, 18);

    const g = scene.add.graphics();
    g.lineStyle(lineWidth, 0xffff00, 1);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(midX, midY);
    g.lineTo(x2, y2);
    g.strokePath();
    g.setDepth(7);

    const glow = scene.add.circle(x, y, 22, 0xffff00, 0.45).setDepth(6);

    if (hitsPlayer) {
      const d = distancePointToSegment(scene.player.x, scene.player.y, x, y, x2, y2);
      if (d < 30) scene.applySpellDamageToPlayer(split);
    } else {
      scene.enemies.getChildren().forEach((e) => {
        if (!e.active) return;
        const d = distancePointToSegment(e.x, e.y, x, y, x2, y2);
        if (d < 26) scene.applySpellDamageToEnemy(e, split);
      });
    }

    scene.time.delayedCall(duration, () => {
      g.destroy();
      glow.destroy();
    });
  });
}

function spawnThunderstormVolley(scene, x, y, dx, dy, damage, hitsPlayer) {
  const totalBolts = 8;
  const split = Math.max(1, Math.floor(damage * 0.24));
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const px = -ny;
  const py = nx;

  for (let i = 0; i < totalBolts; i += 1) {
    scene.time.delayedCall(i * 90, () => {
      const ox = px * Phaser.Math.Between(-100, 100) + nx * Phaser.Math.Between(-35, 35);
      const oy = py * Phaser.Math.Between(-100, 100) + ny * Phaser.Math.Between(-35, 35);
      spawnLightningStrike(scene, x + ox, y + oy, nx, ny, split, hitsPlayer, {
        bolts: 1,
        spreadDeg: 0,
        distance: 420,
        duration: 180,
        lineWidth: 5,
      });
    });
  }
}

function vectorToDirection(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const denom = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / denom));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Phaser.Math.Distance.Between(px, py, cx, cy);
}

function createExplosionFromScene(scene, x, y, color = 0xff0000) {
  const explosion = scene.add.circle(x, y, 5, color, 0.8);
  explosion.setStrokeStyle(3, 0xffffff, 1);
  explosion.setDepth(999);
  scene.tweens.add({
    targets: explosion,
    scale: 3,
    alpha: 0,
    duration: 300,
    ease: 'Power2',
    onComplete: () => explosion.destroy(),
  });
}

function castUsingTrainingGameScene(scene, options) {
  const { x, y, dx, dy, effect, damage, hitsPlayer } = options;
  const dir = vectorToDirection(dx, dy);
  const dealt = Math.max(1, Math.floor(damage));

  const caster = {
    add: scene.add,
    time: scene.time,
    tweens: scene.tweens,
    physics: scene.physics,
    anims: scene.anims,
    textures: scene.textures,
    player: scene.player,
    otherPlayer: null,
    otherPlayerCharacter: 'player1',
    currentDirection: dir,
    currentSpell: { damage: dealt, effect },
    currentMegaSpell: { damage: dealt, effect },
    damageMultiplier: 1,
    gameEnded: false,
    isTraining: false,
    isMultiplayer: false,
    playerId: 'survival',
    roomId: 'survival',
    socket: null,
    enemies: scene.enemies,
    createExplosion: (ex, ey, color) => createExplosionFromScene(scene, ex, ey, color),
    createExplosionEffect: (ex, ey, color) => createExplosionFromScene(scene, ex, ey, color === 'fireball' ? 0xff6600 : 0x00aaff),
    showDamageNumber: (...args) => {
      if (typeof scene.showDamageNumber === 'function') {
        scene.showDamageNumber(...args);
      }
    },
    applySpellDamageToEnemy: (enemy, dmg) => scene.applySpellDamageToEnemy(enemy, dmg),
    applySpellDamageToPlayer: (dmg) => scene.applySpellDamageToPlayer(dmg),
    takeDamage: (dmg) => scene.applySpellDamageToPlayer(dmg),
    checkSpellCollision(spellX, spellY, spellRadius, dmg) {
      if (hitsPlayer) {
        const d = Phaser.Math.Distance.Between(spellX, spellY, scene.player.x, scene.player.y);
        if (d < spellRadius + 20) {
          scene.applySpellDamageToPlayer(Math.max(1, Math.floor(dmg)));
          return true;
        }
        return false;
      }
      let hit = false;
      scene.enemies.getChildren().forEach((e) => {
        if (!e.active || hit) return;
        const d = Phaser.Math.Distance.Between(spellX, spellY, e.x, e.y);
        if (d < spellRadius + 20) {
          scene.applySpellDamageToEnemy(e, Math.max(1, Math.floor(dmg)));
          hit = true;
        }
      });
      return hit;
    },
    checkSpellCollisionWithMainPlayer(spellX, spellY, spellRadius, dmg) {
      return this.checkSpellCollision(spellX, spellY, spellRadius, dmg);
    },
    checkLightningCollision(startX, startY, endX, endY, dmg) {
      if (hitsPlayer) {
        const d = pointToSegmentDistance(scene.player.x, scene.player.y, startX, startY, endX, endY);
        if (d < 30) scene.applySpellDamageToPlayer(Math.max(1, Math.floor(dmg)));
        return;
      }
      scene.enemies.getChildren().forEach((e) => {
        if (!e.active) return;
        const d = pointToSegmentDistance(e.x, e.y, startX, startY, endX, endY);
        if (d < 26) scene.applySpellDamageToEnemy(e, Math.max(1, Math.floor(dmg)));
      });
    },
    checkLightningCollisionWithOtherPlayer(startX, startY, endX, endY, dmg) {
      this.checkLightningCollision(startX, startY, endX, endY, dmg);
    },
  };

  GameScene.prototype.createSpellEffectFromOtherPlayer.call(caster, effect, dir, x, y);
  return true;
}

function spawnEffectPattern(scene, x, y, dx, dy, effect, damage, hitsPlayer) {
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const px = -ny;
  const py = nx;

  // Match training spell shapes/formation per character.
  if (effect === 'lightning') {
    spawnLightningStrike(
      scene,
      x,
      y,
      dx,
      dy,
      Math.max(1, Math.floor(damage * 0.92)),
      hitsPlayer,
      { bolts: 3, spreadDeg: 9, distance: 320, duration: 150, lineWidth: 4 }
    );
    return;
  }

  if (effect === 'fist') {
    const split = Math.max(1, Math.floor(damage * 0.9));
    spawnTravelingSpell(scene, x, y, dx, dy, effect, split, hitsPlayer, {
      radiusScale: 1.08,
      speedScale: 0.95,
      startOffsetX: px * 10,
      startOffsetY: py * 10,
    });
    spawnTravelingSpell(scene, x, y, dx, dy, effect, split, hitsPlayer, {
      radiusScale: 1.08,
      speedScale: 0.95,
      startOffsetX: -px * 10,
      startOffsetY: -py * 10,
    });
    return;
  }

  if (effect === 'dagger') {
    const split = Math.max(1, Math.floor(damage * 0.75));
    [-8, 0, 8].forEach((off) => {
      spawnTravelingSpell(scene, x, y, dx, dy, effect, split, hitsPlayer, {
        radiusScale: 0.82,
        speedScale: 1.25,
        startOffsetX: px * off,
        startOffsetY: py * off,
      });
    });
    return;
  }

  if (effect === 'missile') {
    const split = Math.max(1, Math.floor(damage * 0.42));
    const offsets = [-14, -7, 0, 7, 14];
    offsets.forEach((off, idx) => {
      scene.time.delayedCall(idx * 70, () => {
        spawnTravelingSpell(scene, x, y, dx, dy, effect, split, hitsPlayer, {
          radiusScale: 0.68,
          speedScale: 1.38,
          startOffsetX: px * off,
          startOffsetY: py * off,
        });
      });
    });
    return;
  }

  if (effect === 'magma') {
    spawnTravelingSpell(scene, x, y, dx, dy, effect, damage, hitsPlayer, {
      radiusScale: 1.28,
      speedScale: 0.78,
      distanceScale: 0.85,
    });
    return;
  }

  if (effect === 'spear') {
    spawnTravelingSpell(scene, x, y, dx, dy, effect, damage, hitsPlayer, {
      radiusScale: 1.12,
      speedScale: 1.08,
    });
    return;
  }

  if (effect === 'pink') {
    const split = Math.max(1, Math.floor(damage * 0.56));
    [-18, -6, 6, 18].forEach((off) => {
      spawnTravelingSpell(scene, x, y, dx, dy, effect, split, hitsPlayer, {
        radiusScale: 0.9,
        speedScale: 1.05,
        startOffsetX: px * off,
        startOffsetY: py * off,
      });
    });
    return;
  }

  if (effect === 'linesofcode') {
    const split = Math.max(1, Math.floor(damage * 0.5));
    const horizontal = Math.abs(nx) > Math.abs(ny);
    [-10, -6, -2, 2, 6, 10].forEach((off) => {
      spawnTravelingSpell(scene, x, y, dx, dy, effect, split, hitsPlayer, {
        speedScale: 1.2,
        radiusScale: 0.7,
        startOffsetX: px * off,
        startOffsetY: py * off,
        shape: 'rect',
        rectW: horizontal ? 4 : 22,
        rectH: horizontal ? 22 : 4,
      });
    });
    return;
  }

  if (effect === 'rainbowspheres') {
    const split = Math.max(1, Math.floor(damage * 0.72));
    const rainbow = [0xff0000, 0xff8000, 0xffff00, 0x00ff00];
    [-12, -4, 4, 12].forEach((off, idx) => {
      const extra = rotateVector(dx, dy, (idx - 1.5) * 6);
      spawnTravelingSpell(scene, x, y, extra.dx, extra.dy, effect, split, hitsPlayer, {
        radiusScale: 1.15,
        speedScale: 1.02,
        startOffsetX: px * off,
        startOffsetY: py * off,
        colorOverride: rainbow[idx % rainbow.length],
      });
    });
    return;
  }

  if (effect === 'void') {
    spawnTravelingSpell(scene, x, y, dx, dy, effect, damage, hitsPlayer, {
      radiusScale: 1.18,
      speedScale: 0.9,
    });
    return;
  }

  spawnTravelingSpell(scene, x, y, dx, dy, effect, damage, hitsPlayer);
}

export function spawnDirectedSpell(scene, options) {
  const { x, y, dx, dy, effect, damage, hitsPlayer } = options;
  try {
    if (castUsingTrainingGameScene(scene, options)) return;
  } catch (_) {
    // Fallback to survival-native spell implementation below.
  }
  if (effect === 'thunderstorm') {
    spawnThunderstormVolley(scene, x, y, dx, dy, damage, hitsPlayer);
    return;
  }
  const style = getStyle(effect);
  if (style.mega) {
    spawnMegaPulse(scene, x, y, dx, dy, effect, damage, hitsPlayer);
    return;
  }
  spawnEffectPattern(scene, x, y, dx, dy, effect, damage, hitsPlayer);
}

export function spawnPlayerSpell(scene, effect, damage) {
  const { vx, vy } = dirFromLast(scene.lastDirection);
  spawnDirectedSpell(scene, {
    x: scene.player.x,
    y: scene.player.y,
    dx: vx,
    dy: vy,
    effect,
    damage,
    hitsPlayer: false,
  });
}

export function spawnEnemySpellTowardPlayer(scene, enemy, effect, damage) {
  const dx = scene.player.x - enemy.x;
  const dy = scene.player.y - enemy.y;
  spawnDirectedSpell(scene, {
    x: enemy.x,
    y: enemy.y,
    dx,
    dy,
    effect,
    damage,
    hitsPlayer: true,
  });
}

export function registerSurvivalSpellOverlaps(scene) {
  scene.physics.add.overlap(
    scene.player,
    scene.enemySpellGroup,
    (player, bullet) => {
      if (!bullet || !bullet.active) return;
      if (scene.time.now < scene.invulnerableUntil) return;
      bullet.destroy();
      const dmg = bullet.getData('survivalDmg') || 12;
      scene.applySpellDamageToPlayer(dmg);
    },
    undefined,
    scene
  );

  scene.physics.add.overlap(
    scene.playerSpellGroup,
    scene.enemies,
    (a, b) => {
      const bullet = a.body && a.getData && a.getData('survivalDmg') != null ? a : b;
      const enemy = bullet === a ? b : a;
      if (!bullet.active || !enemy.active) return;
      bullet.destroy();
      const dmg = bullet.getData('survivalDmg') || 10;
      scene.applySpellDamageToEnemy(enemy, dmg);
    },
    undefined,
    scene
  );
}
