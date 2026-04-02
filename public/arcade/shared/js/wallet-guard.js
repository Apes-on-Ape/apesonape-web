// Legacy filename retained for compatibility; access guard is intentionally disabled.
(function () {
  'use strict';

  var ARCADE_WALLET_SYNC_EVENT = 'aoa-glyph-arcade-sync';

  async function loadSelectedApe() {
    if (window.NFT && window.NFT.loadSelectedApeForGame) {
      try {
        var apeData = await window.NFT.loadSelectedApeForGame();
        if (apeData) {
          window.selectedApe = apeData;
          if (window.NFT.setSelectedApe) window.NFT.setSelectedApe(apeData);
        }
      } catch (e) {
        console.error('loadSelectedApe:', e);
      }
      return;
    }

    try {
      var raw = localStorage.getItem('selectedApe');
      if (!raw) return;
      var parsed = parseSelectedApe(raw);
      window.selectedApe = parsed;
      if (window.NFT && window.NFT.setSelectedApe) window.NFT.setSelectedApe(parsed);
    } catch (_) {
      // ignore
    }
  }

  function parseSelectedApe(value) {
    var parsed = value;
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  }

  window.Wallet = window.Wallet || {};
  window.Wallet.loadSelectedApe = loadSelectedApe;

  window.getArcadeProfilePortraitUrl = function () {
    try {
      var u = localStorage.getItem('arcadeProfileAvatarUrl');
      return u && u.trim() ? u.trim() : null;
    } catch (e) {
      return null;
    }
  };

  // Selected Ape first, then Forever Ape, then profile avatar.
  window.getArcadePlayableAvatarUrl = function () {
    try {
      var raw = localStorage.getItem('selectedApe');
      if (raw && raw.trim()) {
        try {
          var parsed = parseSelectedApe(raw);
          var selectedImage =
            parsed && (parsed.image || parsed.imageUrl || parsed.avatar_url)
              ? String(parsed.image || parsed.imageUrl || parsed.avatar_url).trim()
              : '';
          if (selectedImage) return selectedImage;
        } catch (_) {
          // ignore
        }
      }

      var foreverApeImage = localStorage.getItem('arcadeForeverApeImageUrl');
      if (foreverApeImage && foreverApeImage.trim()) return foreverApeImage.trim();
      return typeof window.getArcadeProfilePortraitUrl === 'function' ? window.getArcadeProfilePortraitUrl() : null;
    } catch (e) {
      return null;
    }
  };

  window.getArcadeProfileDisplayName = function () {
    try {
      var n = localStorage.getItem('arcadeProfileDisplayName');
      return n && n.trim() ? n.trim() : null;
    } catch (e) {
      return null;
    }
  };

  window.setArcadeProfileFromApi = function (userData) {
    try {
      if (!userData) return;

      if (userData.profile_avatar_url && String(userData.profile_avatar_url).trim()) {
        localStorage.setItem('arcadeProfileAvatarUrl', String(userData.profile_avatar_url).trim());
      } else {
        localStorage.removeItem('arcadeProfileAvatarUrl');
      }

      if (userData.profile_display_name && String(userData.profile_display_name).trim()) {
        localStorage.setItem('arcadeProfileDisplayName', String(userData.profile_display_name).trim());
      } else {
        localStorage.removeItem('arcadeProfileDisplayName');
      }

      if (userData.forever_ape_id != null && String(userData.forever_ape_id) !== '') {
        localStorage.setItem('arcadeForeverApeId', String(userData.forever_ape_id));
      } else {
        localStorage.removeItem('arcadeForeverApeId');
      }

      if (userData.forever_ape_image_url && String(userData.forever_ape_image_url).trim()) {
        localStorage.setItem('arcadeForeverApeImageUrl', String(userData.forever_ape_image_url).trim());
      } else {
        localStorage.removeItem('arcadeForeverApeImageUrl');
      }

      if (userData.selected_ape) {
        var selectedApe = typeof userData.selected_ape === 'string' ? userData.selected_ape : JSON.stringify(userData.selected_ape);
        localStorage.setItem('selectedApe', selectedApe);
        try {
          var parsedApe = parseSelectedApe(userData.selected_ape);
          window.selectedApe = parsedApe;
          if (window.NFT && typeof window.NFT.setSelectedApe === 'function') {
            window.NFT.setSelectedApe(parsedApe);
          }
        } catch (_) {
          // ignore
        }
      }
    } catch (_) {
      // ignore
    }
  };

  window.setArcadeProfileAvatarFromApi = function (userData) {
    window.setArcadeProfileFromApi(userData);
  };

  function createArcadeProfileAvatarLoadPromise() {
    try {
      var wallet = typeof window.getArcadeWalletForDatabase === 'function'
        ? window.getArcadeWalletForDatabase()
        : (localStorage.getItem('glyphEvmWallet') || '');
      if (!wallet || !String(wallet).trim()) return Promise.resolve(null);

      var body = { wallet_address: String(wallet).trim() };
      try {
        var gid = localStorage.getItem('glyphUserId');
        if (gid && String(gid).trim()) body.glyph_user_id = String(gid).trim();
        var ge = localStorage.getItem('glyphEvmWallet');
        if (ge && String(ge).trim()) body.glyph_evm_wallet = String(ge).trim().toLowerCase();
      } catch (_) {
        // ignore
      }

      return fetch('/api/achievements/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (data) {
          if (data && typeof window.setArcadeProfileFromApi === 'function') {
            window.setArcadeProfileFromApi(data);
          }
          return data;
        })
        .catch(function () {
          return null;
        });
    } catch (_) {
      return Promise.resolve(null);
    }
  }

  window.refreshArcadeProfileAvatar = function () {
    window.arcadeProfileAvatarLoadPromise = createArcadeProfileAvatarLoadPromise();
    return window.arcadeProfileAvatarLoadPromise;
  };

  window.arcadeProfileAvatarLoadPromise = createArcadeProfileAvatarLoadPromise();

  window.whenArcadeProfileAvatarReady = function () {
    return window.arcadeProfileAvatarLoadPromise || Promise.resolve(null);
  };

  // Re-sync avatar/profile whenever Glyph identity is synced after iframe load.
  function onIdentitySync() {
    if (typeof window.refreshArcadeProfileAvatar === 'function') {
      window.refreshArcadeProfileAvatar();
    }
  }

  window.addEventListener(ARCADE_WALLET_SYNC_EVENT, onIdentitySync);
  window.addEventListener('aoa-glyph-user-id-sync', onIdentitySync);
  window.addEventListener('storage', function (e) {
    if (!e) return;
    if (e.key === 'glyphEvmWallet' || e.key === 'glyphUserId' || e.key === 'connectedWallet') {
      onIdentitySync();
    }
  });
})();
