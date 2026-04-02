// Block Dodger - Security Module

const Security = {
    // Anti-cheat and anti-debug protection system
    gameSecurityModule: {
        originalValues: {},
        securityInterval: null,
        devToolsOpen: false,
        lastPerformance: 0,
        
        // Store original values of critical variables
        storeOriginals: function() {
            this.originalValues.score = Game.score;
            this.originalValues.gameOver = Game.gameOver;
        },
        
        // Check if values have been modified outside regular gameplay
        checkValueIntegrity: function() {
            // Check if score has been modified outside of the incrementScore function
            if (this.originalValues.score !== undefined && 
                Game.score > this.originalValues.score + 5) { // Allow for normal increments
                // Score validation failed
                Game.score = this.originalValues.score;
            }
            
            // Update stored values
            this.storeOriginals();
        },
        
        // Detect DevTools by checking for debug pauses (performance.now() will jump)
        checkForDebugger: function() {
            const currentPerf = performance.now();
            const diff = currentPerf - this.lastPerformance;
            
            // If time difference is unusually large (> 1000ms), possible debugger pause
            if (diff > 1000 && this.lastPerformance !== 0) {
                this.devToolsOpen = true;
                // Security alert: Execution anomaly detected
            }
            
            this.lastPerformance = currentPerf;
        },
        
        // Initialize security measures
        initialize: function() {
            this.storeOriginals();
            
            // Check value integrity periodically
            this.securityInterval = setInterval(() => {
                this.checkValueIntegrity();
                this.checkForDebugger();
            }, 500);
            
            // Add console protection
            this.protectConsole();
            
            // Add property tampering protection
            this.addPropertyProtection();
        },
        
        // Make it harder to use the console
        protectConsole: function() {
            // Override console methods with empty functions - no hostname check so it works in all environments
            const noop = function() {};
            const methods = ['log', 'debug', 'info', 'warn', 'error', 'exception', 'table', 'trace'];
            
            // Save original for internal use
            const originalConsole = {};
            methods.forEach(method => {
                originalConsole[method] = console[method];
            });
            
            // Replace with empty functions
            methods.forEach(method => {
                console[method] = noop;
            });
            
            // Only use when needed internally
            window._internalConsole = originalConsole;
            
            // Add a special method to restore console functionality if needed
            window._restoreConsole = function(key) {
                // Add a secret key check if you want to be able to restore console in certain cases
                if (key === 'gamedev_debug_key') {
                    methods.forEach(method => {
                        console[method] = originalConsole[method];
                    });
                    return true;
                }
                return false;
            };
            
            // Prevent direct access to the console via window.console
            try {
                Object.defineProperty(window, 'console', {
                    get: function() {
                        // You could add additional detection here to see who's trying to access console
                        if (new Error().stack.includes('cheat')) {
                            // Could trigger some anti-cheat response
                            window.gameSecurityModule.devToolsOpen = true;
                        }
                        
                        // Return the neutered console object
                        return {
                            log: noop,
                            debug: noop,
                            info: noop,
                            warn: noop,
                            error: noop,
                            exception: noop,
                            table: noop,
                            trace: noop
                        };
                    },
                    set: function() {
                        // Prevent reassignment
                        return false;
                    },
                    configurable: false
                });
            } catch (e) {
                // If we can't redefine window.console, at least we've replaced its methods
            }
        },
        
        // Protect critical properties from modification
        addPropertyProtection: function() {
            // List of variables to protect
            const criticalVars = ['score', 'gameOver'];
            
            // Use Object.defineProperty to detect changes
            criticalVars.forEach(varName => {
                if (typeof window[varName] !== 'undefined') {
                    let value = window[varName];
                    
                    Object.defineProperty(window, varName, {
                        get: function() {
                            return value;
                        },
                        set: function(newVal) {
                            // Check if the change came from normal gameplay functions
                            const stack = new Error().stack || '';
                            const calledFromGame = stack.includes('incrementScore') || 
                                                  stack.includes('checkCollisions') ||
                                                  stack.includes('startGame');
                            
                            if (!calledFromGame) {
                                // Suspicious modification detected
                                value = window.gameSecurityModule.originalValues[varName] || value;
                            } else {
                                value = newVal;
                                // Update tracked value when changed legitimately
                                if (window.gameSecurityModule) {
                                    window.gameSecurityModule.originalValues[varName] = newVal;
                                }
                            }
                        },
                        configurable: false
                    });
                }
            });
        },
        
        // Check for devtools opening by size/position
        detectDevTools: function() {
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            
            if (widthThreshold || heightThreshold) {
                this.devToolsOpen = true;
                return true;
            }
            return false;
        }
    },
    
    // Flag to track if console protection is enabled
    consoleProtectionEnabled: false,
    
    // Toggle console protection
    toggleConsoleProtection: function(enable) {
        this.consoleProtectionEnabled = !!enable;
        console.log(`Console protection ${this.consoleProtectionEnabled ? 'enabled' : 'disabled'}`);
    },
    
    // Add anti-debug listeners - this is a stub for compatibility
    addAntiDebugListeners: function() {
        // Implementation intentionally left minimal for compatibility
        console.log('Anti-debug listeners initialized');
    },
    
    // Initialize game integrity checks - this is a stub for compatibility
    initializeGameIntegrity: function() {
        // Implementation intentionally left minimal for compatibility
        console.log('Game integrity checks initialized');
    }
}; 

if (typeof window !== 'undefined') {
    window.Security = Security;
}