const PhaserGlobal = globalThis.Phaser;

if (!PhaserGlobal) {
  throw new Error('Phaser global runtime is not available. Ensure phaser.min.js loads before game modules.');
}

export default PhaserGlobal;
