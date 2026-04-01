/**
 * Supabase + site base URL for AOA arcade under /arcade/
 * Same project as apesonape.io (see lib/constants.ts).
 */
(function () {
  'use strict';
  window.AOA_ARCADE_BASE = '/arcade';
  /** Next.js arcade hub (trailing slash matches site config). Safe before wallet-guard. */
  window.aoaArcadeHubHref = function () {
    var b = window.AOA_ARCADE_BASE || '/arcade';
    return b.replace(/\/$/, '') + '/';
  };
  /**
   * When games run inside the Next.js shell iframe, assigning window.location only
   * replaces the iframe — users see the lobby *inside* the game area. Navigate top instead.
   */
  window.aoaNavigateToArcadeHub = function () {
    var url = window.aoaArcadeHubHref();
    try {
      if (window.self !== window.top) {
        window.top.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (e) {
      window.location.href = url;
    }
  };
  window.SUPABASE_URL = 'https://bqcrbcpmimfojnjdhvrz.supabase.co';
  window.SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxY3JiY3BtaW1mb2puamRodnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjE1ODEsImV4cCI6MjA4MDI5NzU4MX0.tlDiLyCdrOAULzLH9fv0rm5wpiHqy4nzDvmpC9xXRGw';
  window.SUPABASE_KEY = window.SUPABASE_ANON_KEY;
})();
