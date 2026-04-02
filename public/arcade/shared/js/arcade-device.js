/**
 * Arcade device detection — used for PC-only games (e.g. Tailstrike Arena) and layout hooks.
 * Sets documentElement classes: arcade-is-mobile | arcade-is-desktop
 */
(function (global) {
    'use strict';

    function isMobileDevice() {
        var ua = navigator.userAgent || '';
        if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            return true;
        }
        if (/iPad|Tablet/i.test(ua)) {
            return true;
        }
        if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
            return true;
        }
        if (global.matchMedia && global.matchMedia('(max-width: 900px)').matches) {
            if ('ontouchstart' in global || navigator.maxTouchPoints > 0) {
                return true;
            }
        }
        return false;
    }

    function isDesktop() {
        return !isMobileDevice();
    }

    global.ArcadeDevice = {
        isMobile: isMobileDevice,
        isDesktop: isDesktop
    };

    if (typeof document !== 'undefined') {
        document.documentElement.classList.add(isMobileDevice() ? 'arcade-is-mobile' : 'arcade-is-desktop');
    }

    /* Help canvas games reflow when the mobile browser UI shows/hides (dvh + resize). */
    if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.addEventListener('resize', function () {
            window.dispatchEvent(new Event('resize'));
        });
    }
})(typeof window !== 'undefined' ? window : this);
