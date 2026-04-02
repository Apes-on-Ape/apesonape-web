import { buildCharacterSpells } from '../data/characterSpellDefinitions.js';
import {
  registerSurvivalSpellOverlaps,
  spawnEnemySpellTowardPlayer,
  spawnPlayerSpell,
} from '../survival/survivalSpellEffects.js';

const ALL_CHARACTERS = [
  'player1', 'player2', 'player3', 'player4', 'player5', 'player6',
  'player7', 'player8', 'player9', 'player10', 'player11', 'player12',
  'player13', 'player14', 'player15', 'player16',
];

/** Arena ids — must match preload keys `arena-${id}` */
const ARENA_IDS = [
  'classic',
  'volcano',
  'hell',
  'forest',
  'ape_station',
  'gm_jungle',
  'samurai_desert',
  'gobs_mine',
];

/**
 * Wave survival: fighter vs waves. O = spell, P = mega · SPACE = basic shot.
 * Enemies use their character's spell projectiles. Every 5 completed waves → new arena (no repeat until all used).
 */
export default class SurvivalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SurvivalScene' });
  }

  init(data) {
    this.selectedCharacter = data.selectedCharacter || 'player1';
    this.wave = 1;
    this.score = 0;
    this.playerHp = 100;
    this.maxHp = 100;
    this.waveClearing = false;
    this.spawnQueue = 0;
    this.enemiesRemaining = 0;
    this.isBossWave = false;
    this.player = null;
    this.playerSpeed = 220;
    this.damageMult = 1;
    this.speedBoostUntil = 0;
    this.damageBoostUntil = 0;
    this.invulnerableUntil = 0;
    this.lastDirection = 'down';
    this.shootCooldown = 0;
    this.enemyShootBaseDelay = 2800;

    this.characterSpells = null;
    this.currentSpell = null;
    this.currentMegaSpell = null;
    this.currentSpellCooldown = 0;
    this.currentMegaSpellCooldown = 0;
    this.megaSpellUses = 3;
    this.isSpellcasting = false;

    this.currentArenaId = 'classic';
    this.healthDropTimer = null;
    /** @type {Set<string>} */
    this.arenasUsed = new Set(['classic']);
    /** @type {Phaser.GameObjects.Image} */
    this.arenaImage = null;
  }

  preload() {
    this.load.image('arena-classic', 'assets/arenas/arena_classic.png');
    this.load.image('arena-volcano', 'assets/arenas/volcano_scene.webp');
    this.load.image('arena-hell', 'assets/arenas/hell_portal.webp');
    this.load.image('arena-forest', 'assets/arenas/forest_mushrooms.webp');
    this.load.image('arena-ape_station', 'assets/arenas/ape_station.jpg');
    this.load.image('arena-gm_jungle', 'assets/arenas/gm_jungle.webp');
    this.load.image('arena-samurai_desert', 'assets/arenas/samurai_desert.webp');
    this.load.image('arena-gobs_mine', 'assets/arenas/gobs_mine.jpg');

    ALL_CHARACTERS.forEach((id) => {
      const base = `assets/characters/players/${id}`;
      this.load.spritesheet(`${id}_walk`, `${base}/walk.png`, { frameWidth: 64, frameHeight: 64 });
      this.load.spritesheet(`${id}_spellcast`, `${base}/spellcast.png`, { frameWidth: 64, frameHeight: 64 });
    });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.characterSpells = buildCharacterSpells();
    const cs = this.characterSpells[this.selectedCharacter];
    this.currentSpell = cs.spell;
    this.currentMegaSpell = cs.megaSpell;
    this.playerSpeed = Math.round(220 * (cs.speedMultiplier || 1));

    this.createArenaBackground();

    this.physics.world.setBounds(32, 32, w - 64, h - 64);
    this.cameras.main.setBounds(0, 0, w, h);

    this.createWalkAnimations();
    this.createSpellcastAnimations();

    this.player = this.physics.add.sprite(w / 2, h / 2, `${this.selectedCharacter}_walk`, 18);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(2);
    this.player.setDepth(5);
    this.player.setDrag(0);
    if (this.player.body) {
      this.player.body.setSize(20, 28);
      this.player.body.setOffset(22, 20);
    }

    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.playerBullets = this.physics.add.group();
    this.powerups = this.physics.add.group();
    this.playerSpellGroup = this.physics.add.group();
    this.enemySpellGroup = this.physics.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.oKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.createHud();

    this.physics.add.overlap(this.player, this.enemyBullets, this.onPlayerHitByBullet, undefined, this);
    this.physics.add.overlap(this.player, this.powerups, this.onPickupPowerup, undefined, this);
    this.physics.add.overlap(this.playerBullets, this.enemies, this.onEnemyHitByPlayer, undefined, this);
    registerSurvivalSpellOverlaps(this);

    this.add
      .text(w / 2, 28, 'SURVIVAL — WASD · SPACE basic · O spell · P mega (×3)', {
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0.88);

    this.time.delayedCall(400, () => this.startWave());
    this.startHealthDropSpawns();
  }

  createArenaBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    if (this.arenaImage) {
      this.arenaImage.destroy();
      this.arenaImage = null;
    }
    const key = `arena-${this.currentArenaId}`;
    const texKey = this.textures.exists(key) ? key : 'arena-classic';
    this.arenaImage = this.add.image(0, 0, texKey).setOrigin(0, 0).setDisplaySize(w, h).setDepth(0);
  }

  pickNextArena() {
    const unused = ARENA_IDS.filter((id) => !this.arenasUsed.has(id));
    let next;
    if (unused.length === 0) {
      this.arenasUsed.clear();
      next = Phaser.Utils.Array.GetRandom(ARENA_IDS);
    } else {
      next = Phaser.Utils.Array.GetRandom(unused);
    }
    this.arenasUsed.add(next);
    this.currentArenaId = next;
    this.createArenaBackground();
  }

  createWalkAnimations() {
    ALL_CHARACTERS.forEach((character) => {
      if (!this.textures.exists(`${character}_walk`)) return;
      ['up', 'left', 'down', 'right'].forEach((dir, di) => {
        const key = `${character}_walk_${dir}`;
        if (this.anims.exists(key)) return;
        const starts = [0, 9, 18, 27];
        const ends = [8, 17, 26, 35];
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(`${character}_walk`, { start: starts[di], end: ends[di] }),
          frameRate: 10,
          repeat: -1,
        });
      });
    });
  }

  createSpellcastAnimations() {
    ALL_CHARACTERS.forEach((character) => {
      if (!this.textures.exists(`${character}_spellcast`)) return;
      ['up', 'left', 'down', 'right'].forEach((dir, di) => {
        const key = `${character}_spellcast_${dir}`;
        if (this.anims.exists(key)) return;
        const starts = [0, 7, 14, 21];
        const ends = [6, 13, 20, 27];
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(`${character}_spellcast`, { start: starts[di], end: ends[di] }),
          frameRate: 12,
          repeat: 0,
        });
      });
    });
  }

  createHud() {
    const x = 24;
    this.hudWave = this.add.text(x, 56, 'WAVE 1', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffcc00',
      stroke: '#000',
      strokeThickness: 4,
    }).setDepth(200);

    this.hudScore = this.add.text(x, 88, 'SCORE 0', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#66ffcc',
      stroke: '#000',
      strokeThickness: 3,
    }).setDepth(200);

    this.hudArena = this.add.text(x, 118, 'ARENA classic', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ccccff',
      stroke: '#000',
      strokeThickness: 3,
    }).setDepth(200);

    this.hpBarBg = this.add.rectangle(x + 100, 24, 204, 18, 0x220000, 0.9).setOrigin(0, 0.5).setDepth(200);
    this.hpBarFill = this.add.rectangle(x + 102, 24, 200, 14, 0xff3333, 1).setOrigin(0, 0.5).setDepth(201);
    this.hudHpLabel = this.add.text(x, 24, 'HP', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(200);

    // Spell cooldown bar
    const spellBarY = 146;
    this.spellCdBg = this.add.rectangle(x, spellBarY, 236, 16, 0x1a1a2a, 0.88).setOrigin(0, 0).setDepth(200);
    this.spellCdBg.setStrokeStyle(2, 0x4169e1, 1);
    this.spellCdFill = this.add.rectangle(x + 2, spellBarY + 2, 0, 12, 0x4169e1, 1).setOrigin(0, 0).setDepth(201);
    this.spellCdText = this.add.text(x + 8, spellBarY + 1, 'SPELL READY', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(202);

    // Mega cooldown bar
    const megaBarY = 168;
    this.megaCdBg = this.add.rectangle(x, megaBarY, 236, 16, 0x2a1a1a, 0.88).setOrigin(0, 0).setDepth(200);
    this.megaCdBg.setStrokeStyle(2, 0xff6600, 1);
    this.megaCdFill = this.add.rectangle(x + 2, megaBarY + 2, 0, 12, 0xff6600, 1).setOrigin(0, 0).setDepth(201);
    this.megaCdText = this.add.text(x + 8, megaBarY + 1, 'MEGA READY', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(202);
  }

  updateHpBar() {
    const t = Phaser.Math.Clamp(this.playerHp / this.maxHp, 0, 1);
    this.hpBarFill.width = 200 * t;
    this.hpBarFill.setFillStyle(t < 0.3 ? 0xff0000 : 0xff4444);
  }

  updateHud() {
    this.hudWave.setText(`WAVE ${this.wave}${this.isBossWave ? ' — BOSS' : ''}`);
    this.hudScore.setText(`SCORE ${this.score.toLocaleString()}`);
    if (typeof window !== 'undefined') {
      // Expose latest runtime score so GameOver save uses exact displayed value.
      window.__tailstrikeLastSurvivalScore = this.score;
    }
    if (this.hudArena) {
      this.hudArena.setText(`ARENA ${this.currentArenaId}`);
    }
    this.updateHpBar();
    this.updateCooldownHud();
  }

  updateCooldownHud() {
    if (!this.spellCdFill || !this.megaCdFill || !this.currentSpell || !this.currentMegaSpell) return;
    const barW = 232;

    const spellPct = Phaser.Math.Clamp(this.currentSpellCooldown / Math.max(1, this.currentSpell.cooldown), 0, 1);
    this.spellCdFill.width = barW * spellPct;
    if (this.currentSpellCooldown > 0) {
      this.spellCdText.setText(`SPELL CD ${Math.ceil(this.currentSpellCooldown / 1000)}s`);
    } else {
      this.spellCdText.setText('SPELL READY');
    }

    const megaPct = Phaser.Math.Clamp(this.currentMegaSpellCooldown / Math.max(1, this.currentMegaSpell.cooldown), 0, 1);
    this.megaCdFill.width = barW * megaPct;
    if (this.currentMegaSpellCooldown > 0) {
      this.megaCdText.setText(`MEGA CD ${Math.ceil(this.currentMegaSpellCooldown / 1000)}s`);
    } else if (this.megaSpellUses <= 0) {
      this.megaCdText.setText('MEGA USED');
      this.megaCdFill.width = 0;
    } else {
      this.megaCdText.setText(`MEGA READY x${this.megaSpellUses}`);
    }
  }

  showDamageNumber(x, y, damage, color = '#ff0000') {
    const damageText = this.add.text(
      x + Phaser.Math.Between(-15, 15),
      y - 20,
      `-${damage}`,
      {
        fontSize: '18px',
        fill: color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    );
    damageText.setOrigin(0.5, 0.5);
    damageText.setDepth(1000);
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => damageText.destroy(),
    });
  }

  randomEnemyCharacter() {
    const pool = ALL_CHARACTERS.filter((c) => c !== this.selectedCharacter);
    return Phaser.Utils.Array.GetRandom(pool);
  }

  edgeSpawnPoint() {
    const w = this.scale.width;
    const h = this.scale.height;
    const edge = Phaser.Math.Between(0, 3);
    const pad = 48;
    switch (edge) {
      case 0:
        return { x: Phaser.Math.Between(pad, w - pad), y: pad };
      case 1:
        return { x: Phaser.Math.Between(pad, w - pad), y: h - pad };
      case 2:
        return { x: pad, y: Phaser.Math.Between(pad, h - pad) };
      default:
        return { x: w - pad, y: Phaser.Math.Between(pad, h - pad) };
    }
  }

  startWave() {
    this.waveClearing = false;
    this.isBossWave = this.wave > 0 && this.wave % 5 === 0;
    if (this.isBossWave) {
      this.spawnQueue = 1;
      this.enemiesRemaining = 1;
    } else {
      this.spawnQueue = Math.min(15, 2 + this.wave * 2);
      this.enemiesRemaining = this.spawnQueue;
    }
    this.updateHud();
    this.spawnNextEnemyOrFinish();
  }

  spawnNextEnemyOrFinish() {
    if (this.spawnQueue <= 0) return;
    const { x, y } = this.edgeSpawnPoint();
    const charId = this.randomEnemyCharacter();
    const isBoss = this.isBossWave;
    const scale = isBoss ? 2.4 : 2;
    const hp = isBoss ? 42 + this.wave * 7 : 10 + this.wave * 3;

    const spr = this.physics.add.sprite(x, y, `${charId}_walk`, 18);
    spr.setCollideWorldBounds(false);
    spr.setScale(scale);
    spr.setDepth(4);
    spr.setData('charId', charId);
    spr.setData('hp', hp);
    spr.setData('maxHp', hp);
    spr.setData('isBoss', isBoss);
    const waveShootReduction = Math.min(1400, this.wave * 55);
    const shootDelay = Math.max(950, this.enemyShootBaseDelay - waveShootReduction + Phaser.Math.Between(-180, 180));
    spr.setData('shootDelay', shootDelay);
    spr.setData('nextShot', this.time.now + Phaser.Math.Between(400, 1200));
    if (spr.body) {
      const bw = isBoss ? 28 : 20;
      const bh = isBoss ? 36 : 28;
      spr.body.setSize(bw, bh);
      spr.body.setOffset((64 - bw) / 2, (64 - bh) / 2);
    }

    this.enemies.add(spr);
    this.spawnQueue -= 1;

    if (this.spawnQueue > 0) {
      this.time.delayedCall(350, () => this.spawnNextEnemyOrFinish());
    }
  }

  updateEnemies(time) {
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      const body = e.body;
      if (!body) return;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const baseSpeed = e.getData('isBoss') ? 45 : 46;
      const growth = Math.min(this.wave * 3, 95);
      const speed = baseSpeed + growth;
      body.setVelocity((dx / len) * speed, (dy / len) * speed);

      let dir = 'down';
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
      else dir = dy > 0 ? 'down' : 'up';
      const charId = e.getData('charId');
      const key = `${charId}_walk_${dir}`;
      if (this.anims.exists(key)) e.anims.play(key, true);

      if (time > e.getData('nextShot')) {
        this.enemyShoot(e);
        e.setData('nextShot', time + e.getData('shootDelay'));
      }
    });
  }

  enemyShoot(enemy) {
    const charId = enemy.getData('charId');
    const cfg = this.characterSpells[charId];
    if (!cfg) return;
    const spell = cfg.spell;
    const base = enemy.getData('isBoss') ? 1.15 : 0.85;
    const growth = Math.min(1.5, 0.55 + this.wave * 0.065);
    const dmg = Math.max(3, Math.floor(spell.damage * base * growth));
    spawnEnemySpellTowardPlayer(this, enemy, spell.effect, dmg);
  }

  tryPlayerShoot(time) {
    if (this.shootCooldown > time) return;
    this.shootCooldown = time + 280;

    const bx = this.player.x;
    const by = this.player.y;
    let vx = 0;
    let vy = -1;
    switch (this.lastDirection) {
      case 'up':
        vx = 0;
        vy = -1;
        break;
      case 'down':
        vx = 0;
        vy = 1;
        break;
      case 'left':
        vx = -1;
        vy = 0;
        break;
      case 'right':
        vx = 1;
        vy = 0;
        break;
      default:
        break;
    }

    const bullet = this.add.circle(bx, by, 7, 0x66ccff, 1);
    this.physics.add.existing(bullet);
    bullet.body.setCircle(7);
    const speed = 420;
    bullet.body.setVelocity(vx * speed, vy * speed);
    bullet.setDepth(4);
    bullet.setData('damage', Math.round(18 * this.damageMult));
    this.playerBullets.add(bullet);

    this.time.delayedCall(900, () => {
      if (bullet && bullet.active) bullet.destroy();
    });
  }

  tryUseSpell(time) {
    if (this.isSpellcasting || this.currentSpellCooldown > 0 || !this.player?.active) return;
    const sp = this.currentSpell;
    const dmg = Math.floor(sp.damage * this.damageMult * (this.characterSpells[this.selectedCharacter].damageMultiplier || 1));
    this.isSpellcasting = true;
    const anim = `${this.selectedCharacter}_spellcast_${this.lastDirection}`;
    if (this.anims.exists(anim)) {
      this.player.anims.play(anim);
      this.time.delayedCall(700, () => {
        this.isSpellcasting = false;
        if (this.player?.anims) this.player.anims.stop();
      });
    } else {
      this.time.delayedCall(200, () => {
        this.isSpellcasting = false;
      });
    }
    spawnPlayerSpell(this, sp.effect, dmg);
    this.currentSpellCooldown = sp.cooldown;
  }

  tryUseMegaSpell(time) {
    if (this.isSpellcasting || this.megaSpellUses <= 0 || this.currentMegaSpellCooldown > 0 || !this.player?.active) {
      return;
    }
    const sp = this.currentMegaSpell;
    const dmg = Math.floor(sp.damage * this.damageMult * (this.characterSpells[this.selectedCharacter].damageMultiplier || 1));
    this.isSpellcasting = true;
    const anim = `${this.selectedCharacter}_spellcast_${this.lastDirection}`;
    if (this.anims.exists(anim)) {
      this.player.anims.play(anim);
      this.time.delayedCall(700, () => {
        this.isSpellcasting = false;
        if (this.player?.anims) this.player.anims.stop();
      });
    } else {
      this.time.delayedCall(200, () => {
        this.isSpellcasting = false;
      });
    }
    spawnPlayerSpell(this, sp.effect, dmg);
    this.megaSpellUses -= 1;
    this.currentMegaSpellCooldown = sp.cooldown;
    this.updateCooldownHud();
  }

  applySpellDamageToPlayer(dmg) {
    const d = Math.max(1, Math.floor(dmg));
    if (this.time.now < this.invulnerableUntil) return;
    this.showDamageNumber(this.player.x, this.player.y, d, '#ff0000');
    this.playerHp -= d;
    this.invulnerableUntil = this.time.now + 700;
    this.player.setAlpha(0.5);
    this.time.delayedCall(200, () => {
      if (this.player) this.player.setAlpha(1);
    });
    this.cameras.main.shake(100, 0.01);
    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.gameOver();
    }
    this.updateHud();
  }

  applySpellDamageToEnemy(enemy, raw) {
    if (!enemy.active) return;
    const dmg = Math.max(1, Math.floor(raw));
    this.showDamageNumber(enemy.x, enemy.y, dmg, '#ff6600');
    let hp = enemy.getData('hp') - dmg;
    enemy.setData('hp', hp);
    if (hp <= 0) {
      const isBoss = enemy.getData('isBoss');
      const mult = isBoss ? 500 : 100;
      this.score += mult * this.wave;
      enemy.destroy();
      this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
      if (this.enemiesRemaining === 0 && !this.waveClearing) {
        this.onWaveCleared();
      }
    } else {
      enemy.setTint(0xffaaaa);
      this.time.delayedCall(80, () => {
        if (enemy.active) enemy.clearTint();
      });
    }
    this.updateHud();
  }

  onPlayerHitByBullet(player, bullet) {
    if (!bullet.active) return;
    if (this.time.now < this.invulnerableUntil) return;
    bullet.destroy();
    const dmg = bullet.getData('damage') || 10;
    this.showDamageNumber(this.player.x, this.player.y, dmg, '#ff0000');
    this.playerHp -= dmg;
    this.invulnerableUntil = this.time.now + 900;
    this.player.setAlpha(0.5);
    this.time.delayedCall(200, () => {
      if (this.player) this.player.setAlpha(1);
    });
    this.cameras.main.shake(120, 0.012);
    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.gameOver();
    }
    this.updateHud();
  }

  onEnemyHitByPlayer(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();
    const dealt = bullet.getData('damage') || 18;
    this.showDamageNumber(enemy.x, enemy.y, dealt, '#ff6600');
    let hp = enemy.getData('hp') - dealt;
    enemy.setData('hp', hp);
    if (hp <= 0) {
      const isBoss = enemy.getData('isBoss');
      const mult = isBoss ? 500 : 100;
      this.score += mult * this.wave;
      enemy.destroy();
      this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
      if (this.enemiesRemaining === 0 && !this.waveClearing) {
        this.onWaveCleared();
      }
    } else {
      enemy.setTint(0xffaaaa);
      this.time.delayedCall(80, () => {
        if (enemy.active) enemy.clearTint();
      });
    }
    this.updateHud();
  }

  onWaveCleared() {
    if (this.waveClearing) return;
    this.waveClearing = true;
    if (this.wave % 5 === 0) {
      this.pickNextArena();
    }
    this.score += 50 * this.wave;
    this.spawnHealthDrop();
    this.time.delayedCall(1400, () => {
      this.waveClearing = false;
      this.wave += 1;
      this.enemyShootBaseDelay = Math.max(1000, 2800 - this.wave * 60);
      this.startWave();
    });
    this.updateHud();
  }

  spawnPowerupRing() {
    const cx = this.player.x;
    const cy = this.player.y;
    const types = [
      { t: 'health', color: 0xff66aa, label: '♥' },
      { t: 'speed', color: 0x66ff66, label: 'S' },
      { t: 'damage', color: 0xffcc33, label: 'D' },
    ];
    const pick = Phaser.Utils.Array.GetRandom(types);
    const g = this.add.rectangle(cx + Phaser.Math.Between(-40, 40), cy + Phaser.Math.Between(-40, 40), 36, 36, pick.color, 0.95);
    this.physics.add.existing(g);
    g.body.setSize(32, 32);
    g.setDepth(6);
    g.setData('ptype', pick.t);
    const label = this.add
      .text(g.x, g.y, pick.label, { fontSize: '18px', color: '#111', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(7);
    g.setData('label', label);
    this.powerups.add(g);
  }

  startHealthDropSpawns() {
    // Keep health drops available around the arena throughout survival runs.
    for (let i = 0; i < 3; i += 1) {
      this.spawnHealthDrop();
    }
    if (this.healthDropTimer) {
      this.healthDropTimer.remove(false);
      this.healthDropTimer = null;
    }
    this.healthDropTimer = this.time.addEvent({
      delay: 9000,
      loop: true,
      callback: () => {
        const activeDrops = this.powerups.getChildren().filter((p) => p.active && p.getData('ptype') === 'health').length;
        if (activeDrops < 6) {
          this.spawnHealthDrop();
        }
      },
    });
  }

  spawnHealthDrop() {
    const margin = 72;
    const x = Phaser.Math.Between(margin, this.scale.width - margin);
    const y = Phaser.Math.Between(margin, this.scale.height - margin);
    const g = this.add.rectangle(x, y, 36, 36, 0xff66aa, 0.95);
    this.physics.add.existing(g);
    g.body.setSize(32, 32);
    g.setDepth(6);
    g.setData('ptype', 'health');
    const label = this.add
      .text(g.x, g.y, '♥', { fontSize: '18px', color: '#111', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(7);
    g.setData('label', label);
    this.powerups.add(g);
  }

  onPickupPowerup(player, pup) {
    const t = pup.getData('ptype');
    if (t === 'health') {
      const healAmount = Math.max(1, Math.floor(this.maxHp * 0.5));
      this.playerHp = Math.min(this.maxHp, this.playerHp + healAmount);
    } else if (t === 'speed') {
      this.speedBoostUntil = this.time.now + 8000;
    } else if (t === 'damage') {
      this.damageBoostUntil = this.time.now + 8000;
    }
    const label = pup.getData('label');
    if (label && label.destroy) label.destroy();
    pup.destroy();
    this.updateHud();
  }

  gameOver() {
    if (this.healthDropTimer) {
      this.healthDropTimer.remove(false);
      this.healthDropTimer = null;
    }
    this.physics.pause();
    this.scene.start('GameOverScene', {
      result: 'defeat',
      survivalScore: this.score,
      survivalWave: this.wave,
      isSurvival: true,
    });
  }

  update(time, delta) {
    if (!this.player || !this.player.body) return;

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.start('MainMenuScene');
      return;
    }

    this.currentSpellCooldown = Math.max(0, this.currentSpellCooldown - delta);
    this.currentMegaSpellCooldown = Math.max(0, this.currentMegaSpellCooldown - delta);
    this.updateCooldownHud();

    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const n = Math.sqrt(vx * vx + vy * vy);
      vx /= n;
      vy /= n;
      if (Math.abs(vx) > Math.abs(vy)) this.lastDirection = vx > 0 ? 'right' : 'left';
      else this.lastDirection = vy > 0 ? 'down' : 'up';
    }

    let spd = this.playerSpeed;
    if (time < this.speedBoostUntil) spd *= 1.35;
    this.damageMult = time < this.damageBoostUntil ? 1.45 : 1;

    this.player.body.setVelocity(vx * spd, vy * spd);

    const walkKey = `${this.selectedCharacter}_walk_${this.lastDirection}`;
    if ((vx !== 0 || vy !== 0) && this.anims.exists(walkKey)) {
      this.player.anims.play(walkKey, true);
    } else if (this.anims.exists(`${this.selectedCharacter}_walk_${this.lastDirection}`)) {
      this.player.anims.stop();
      const fr = { up: 0, left: 9, down: 18, right: 27 }[this.lastDirection];
      this.player.setFrame(fr);
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.tryPlayerShoot(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.oKey)) {
      this.tryUseSpell(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this.tryUseMegaSpell(time);
    }

    this.updateEnemies(time);

    const margin = 80;
    this.enemyBullets.getChildren().forEach((b) => {
      if (b.x < -margin || b.x > this.scale.width + margin || b.y < -margin || b.y > this.scale.height + margin) {
        b.destroy();
      }
    });
    this.playerBullets.getChildren().forEach((b) => {
      if (b.x < -margin || b.x > this.scale.width + margin || b.y < -margin || b.y > this.scale.height + margin) {
        b.destroy();
      }
    });
    this.enemySpellGroup.getChildren().forEach((b) => {
      if (b.x < -margin || b.x > this.scale.width + margin || b.y < -margin || b.y > this.scale.height + margin) {
        b.destroy();
      }
    });
    this.playerSpellGroup.getChildren().forEach((b) => {
      if (b.x < -margin || b.x > this.scale.width + margin || b.y < -margin || b.y > this.scale.height + margin) {
        b.destroy();
      }
    });

    this.powerups.getChildren().forEach((p) => {
      const label = p.getData('label');
      if (label && label.active) {
        label.setPosition(p.x, p.y);
      }
    });
  }
}
