/**
 * Mirrors GameScene.initializeCharacterSpells() — single source for survival + UI copy.
 */
export function buildCharacterSpells() {
  const baseMovementSpeeds = [120, 115, 110, 105, 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 52, 50];

  const calculateStats = (speed) => {
    const normalizedSpeed = (speed - 50) / (120 - 50);
    const spellDamage = Math.round(20 - normalizedSpeed * 15);
    const megaDamage = Math.round(60 - normalizedSpeed * 30);
    const spellCooldown = Math.round(2000 - normalizedSpeed * 1500);
    const megaCooldown = Math.round(15000 - normalizedSpeed * 10000);
    const speedMultiplier = Math.round((speed / 80) * 100) / 100;
    return {
      speedMultiplier,
      spellDamage,
      megaDamage,
      spellCooldown,
      megaCooldown,
    };
  };

  const ids = [
    'player1',
    'player2',
    'player3',
    'player4',
    'player5',
    'player6',
    'player7',
    'player8',
    'player9',
    'player10',
    'player11',
    'player12',
    'player13',
    'player14',
    'player15',
    'player16',
  ];

  const spellRows = [
    { spell: { name: 'Lightning Strike', effect: 'lightning' }, mega: { name: 'Thunderstorm', effect: 'thunderstorm' } },
    { spell: { name: 'Ice Shard', effect: 'ice' }, mega: { name: 'Blizzard', effect: 'blizzard' } },
    { spell: { name: 'Shadow Bolt', effect: 'shadow' }, mega: { name: 'Shadow Realm', effect: 'shadowrealm' } },
    { spell: { name: 'Fireball', effect: 'fire' }, mega: { name: 'Inferno', effect: 'inferno' } },
    { spell: { name: 'Nature Spike', effect: 'nature' }, mega: { name: 'Forest Rage', effect: 'forestrage' } },
    { spell: { name: 'Void Blast', effect: 'void' }, mega: { name: 'Void Rift', effect: 'voidrift' } },
    { spell: { name: 'Golden Ray', effect: 'golden' }, mega: { name: 'Divine Judgment', effect: 'divine' } },
    { spell: { name: 'Iron Shot', effect: 'iron' }, mega: { name: 'Iron Storm', effect: 'ironstorm' } },
    { spell: { name: 'Two Fists', effect: 'fist' }, mega: { name: "King's Fury", effect: 'kingsfury' } },
    { spell: { name: 'Quick Daggers', effect: 'dagger' }, mega: { name: "Rogue's Gambit", effect: 'roguesgambit' } },
    { spell: { name: 'Giant Magma Balls', effect: 'magma' }, mega: { name: "Devil's Wrath", effect: 'devilswrath' } },
    { spell: { name: 'Tiny Missiles', effect: 'missile' }, mega: { name: "Mafia's Revenge", effect: 'mafiasrevenge' } },
    { spell: { name: 'Giant Spear Power', effect: 'spear' }, mega: { name: "Colosseum's Fury", effect: 'colosseum' } },
    { spell: { name: 'Pink Circles', effect: 'pink' }, mega: { name: "Trickster's Chaos", effect: 'trickster' } },
    { spell: { name: 'Lines of Code', effect: 'linesofcode' }, mega: { name: 'System Crash', effect: 'systemcrash' } },
    { spell: { name: '3 Rainbow Spheres', effect: 'rainbowspheres' }, mega: { name: 'Goblin Kingdom', effect: 'goblinkingdom' } },
  ];

  const out = {};
  ids.forEach((id, i) => {
    const s = calculateStats(baseMovementSpeeds[i]);
    const row = spellRows[i];
    out[id] = {
      name: id,
      speedMultiplier: s.speedMultiplier,
      damageMultiplier: 1.0,
      defenseMultiplier: 1.0,
      spell: {
        name: row.spell.name,
        damage: s.spellDamage,
        cooldown: s.spellCooldown,
        effect: row.spell.effect,
      },
      megaSpell: {
        name: row.mega.name,
        damage: s.megaDamage,
        cooldown: s.megaCooldown,
        effect: row.mega.effect,
      },
    };
  });
  return out;
}
