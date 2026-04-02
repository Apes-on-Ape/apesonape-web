/**
 * Parent Next.js iframe may append ?aoa_glyph_uid= & ?aoa_glyph_evm= so this runs BEFORE
 * other scripts — fixes race where iframe loaded before GlyphArcadeWalletSync wrote localStorage.
 */
(function () {
  try {
    var q = new URLSearchParams(window.location.search);
    var g = q.get('aoa_glyph_uid');
    var e = q.get('aoa_glyph_evm');
    if (g && String(g).trim()) localStorage.setItem('glyphUserId', String(g).trim());
    if (e && String(e).trim()) {
      var wallet = String(e).trim().toLowerCase();
      localStorage.setItem('glyphEvmWallet', wallet);
      // Keep legacy consumers aligned with Glyph canonical wallet.
      localStorage.setItem('connectedWallet', wallet);
    }
  } catch (err) {
    /* ignore */
  }
})();
