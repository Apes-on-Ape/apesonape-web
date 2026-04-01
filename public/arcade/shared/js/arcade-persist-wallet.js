/**
 * Arcade DB rows (`user_profiles`, `game_scores`, achievements) must use the same wallet as
 * the main site: Glyph `evmWallet` when the user has a Glyph session (`glyphUserId` +
 * `glyphEvmWallet` from `GlyphArcadeWalletSync`).
 */
(function () {
  'use strict';

  var KEY_GLYPH_EVM = 'glyphEvmWallet';
  var KEY_CONNECTED = 'connectedWallet';

  function normalizeWallet(value) {
    var v = String(value || '').trim().toLowerCase();
    return /^0x[a-f0-9]{40}$/.test(v) ? v : '';
  }

  function getWalletFromUrl() {
    try {
      var q = new URLSearchParams(window.location.search);
      return normalizeWallet(q.get('aoa_glyph_evm'));
    } catch (_) {
      return '';
    }
  }

  function readCanonicalGlyphWallet() {
    var wallet = '';
    try {
      wallet = normalizeWallet(localStorage.getItem(KEY_GLYPH_EVM));
      if (!wallet) {
        wallet = normalizeWallet(sessionStorage.getItem(KEY_GLYPH_EVM));
      }
      if (!wallet) {
        wallet = getWalletFromUrl();
      }
      if (wallet) {
        // Keep both stores aligned to reduce race conditions across game loads.
        localStorage.setItem(KEY_GLYPH_EVM, wallet);
        try {
          sessionStorage.setItem(KEY_GLYPH_EVM, wallet);
        } catch (_) {
          /* ignore */
        }
      }
    } catch (_) {
      /* ignore */
    }
    return wallet;
  }

  function getArcadeWalletForDatabase() {
    try {
      var glyphWallet = readCanonicalGlyphWallet();
      if (glyphWallet) {
        // Keep legacy readers aligned to canonical Glyph wallet.
        try {
          localStorage.setItem(KEY_CONNECTED, glyphWallet);
        } catch (_) {
          /* ignore */
        }
        return glyphWallet;
      }
      // Never use non-Glyph fallback as canonical wallet.
      localStorage.removeItem(KEY_CONNECTED);
    } catch (e) {
      /* ignore */
    }
    return '';
  }

  // Backfill immediately on script load for games that only read connectedWallet.
  try {
    var seedWallet = readCanonicalGlyphWallet();
    if (seedWallet) {
      localStorage.setItem(KEY_CONNECTED, seedWallet);
    } else {
      localStorage.removeItem(KEY_CONNECTED);
    }
  } catch (_) {
    /* ignore */
  }

  window.getArcadeWalletForDatabase = getArcadeWalletForDatabase;
})();
