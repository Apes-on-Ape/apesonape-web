import sharp from 'sharp';

function makeSvg(size) {
  const fontSize = Math.round(size * 0.38);
  const subSize  = Math.round(size * 0.09);
  const subY     = Math.round(size * 0.72);
  const spacing  = Math.round(size * 0.04);
  const subSpacing = Math.round(size * 0.055);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0054F9"/>
  <text
    x="50%" y="52%"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="${spacing}">AOA</text>
  <text
    x="50%" y="${subY}"
    font-family="Arial, sans-serif"
    font-weight="600"
    font-size="${subSize}"
    fill="rgba(255,255,255,0.5)"
    text-anchor="middle"
    letter-spacing="${subSpacing}">RECORDS</text>
</svg>`;
}

await Promise.all([
  sharp(Buffer.from(makeSvg(512))).png().toFile('public/icons/icon-512.png'),
  sharp(Buffer.from(makeSvg(192))).png().toFile('public/icons/icon-192.png'),
  sharp(Buffer.from(makeSvg(180))).png().toFile('public/icons/apple-touch-icon.png'),
]);

console.log('PWA icons generated.');
