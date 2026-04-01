/**
 * Leaderboards are shown on the site arcade hub only (/arcade/leaderboard).
 * Games load this stub so existing Leaderboard.* calls stay no-ops.
 */
(function () {
  var noop = function () {};
  window.Leaderboard = {
    init: noop,
    show: noop,
    close: noop,
    showWalletPoints: noop,
    lastUserInteraction: null,
  };
})();
