// Debug Utility for Ape Arcade
// Automatically disables console logging in production

(function() {
    'use strict';

    // Detect if we're in production
    const isProduction = () => {
        // Check multiple indicators for production
        return (
            // Domain-based detection
            window.location.hostname === 'arcade.apesonape.io' ||
            window.location.hostname.includes('vercel.app') ||
            window.location.protocol === 'https:' && 
            !window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('127.0.0.1') &&
            !window.location.hostname.includes('192.168.')
        );
    };

    // Store original console methods
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug,
        trace: console.trace,
        table: console.table,
        group: console.group,
        groupCollapsed: console.groupCollapsed,
        groupEnd: console.groupEnd
    };

    // Create debug object
    window.ArcadeDebug = {
        isProduction: isProduction(),
        
        // Enable/disable debug mode
        enabled: !isProduction(),
        
        // Force enable debug (for testing)
        forceEnable: function() {
            this.enabled = true;
            this.restoreConsole();
        },
        
        // Force disable debug
        forceDisable: function() {
            this.enabled = false;
            this.disableConsole();
        },
        
        // Safe console methods that respect debug mode
        log: function(...args) {
            if (this.enabled) originalConsole.log(...args);
        },
        
        warn: function(...args) {
            if (this.enabled) originalConsole.warn(...args);
        },
        
        error: function(...args) {
            // Always show errors, even in production (but can be disabled)
            if (this.enabled || !this.isProduction) {
                originalConsole.error(...args);
            }
        },
        
        info: function(...args) {
            if (this.enabled) originalConsole.info(...args);
        },
        
        debug: function(...args) {
            if (this.enabled) originalConsole.debug(...args);
        },
        
        trace: function(...args) {
            if (this.enabled) originalConsole.trace(...args);
        },
        
        table: function(...args) {
            if (this.enabled) originalConsole.table(...args);
        },
        
        group: function(...args) {
            if (this.enabled) originalConsole.group(...args);
        },
        
        groupCollapsed: function(...args) {
            if (this.enabled) originalConsole.groupCollapsed(...args);
        },
        
        groupEnd: function(...args) {
            if (this.enabled) originalConsole.groupEnd(...args);
        },
        
        // Disable console methods
        disableConsole: function() {
            console.log = function() {};
            console.warn = function() {};
            console.info = function() {};
            console.debug = function() {};
            console.trace = function() {};
            console.table = function() {};
            console.group = function() {};
            console.groupCollapsed = function() {};
            console.groupEnd = function() {};
            
            // Keep errors in development, silence in production
            if (this.isProduction) {
                console.error = function() {};
            }
        },
        
        // Restore original console methods
        restoreConsole: function() {
            console.log = originalConsole.log;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
            console.info = originalConsole.info;
            console.debug = originalConsole.debug;
            console.trace = originalConsole.trace;
            console.table = originalConsole.table;
            console.group = originalConsole.group;
            console.groupCollapsed = originalConsole.groupCollapsed;
            console.groupEnd = originalConsole.groupEnd;
        }
    };

    // Auto-initialize: disable console in production
    if (window.ArcadeDebug.isProduction && !window.ArcadeDebug.enabled) {
        window.ArcadeDebug.disableConsole();
        
        // Show a single message about debug mode being disabled
        originalConsole.log(
            '%c🎮 APE ARCADE - Production Mode%c\n' +
            'Debug logging is disabled for optimal performance.\n' +
            'To enable debug mode, run: ArcadeDebug.forceEnable()',
            'color: #ff6b6b; font-weight: bold; font-size: 14px;',
            'color: #888; font-size: 12px;'
        );
        
        // Clear the console after a brief moment
        setTimeout(() => {
            if (typeof console.clear === 'function') {
                console.clear();
            }
        }, 2000);
    } else {
        // Development mode
        originalConsole.log(
            '%c🎮 APE ARCADE - Development Mode%c\n' +
            'Debug logging is enabled.\n' +
            'To disable debug mode, run: ArcadeDebug.forceDisable()',
            'color: #00ffff; font-weight: bold; font-size: 14px;',
            'color: #888; font-size: 12px;'
        );
    }

    // Expose debug info
    window.ArcadeDebug.info = function() {
        originalConsole.log('🔧 Arcade Debug Info:');
        originalConsole.log('- Environment:', this.isProduction ? 'Production' : 'Development');
        originalConsole.log('- Debug Enabled:', this.enabled);
        originalConsole.log('- Hostname:', window.location.hostname);
        originalConsole.log('- Protocol:', window.location.protocol);
        originalConsole.log('- URL:', window.location.href);
    };

})();

// Alternative usage: Direct replacement functions for easy migration
window.debugLog = (...args) => window.ArcadeDebug.log(...args);
window.debugWarn = (...args) => window.ArcadeDebug.warn(...args);
window.debugError = (...args) => window.ArcadeDebug.error(...args);
window.debugInfo = (...args) => window.ArcadeDebug.info(...args); 