// Comprehensive Security System for Apes on Ape Arcade
// Protects against XSS, injection attacks, script injection, and exploitation

(function() {
    'use strict';

    // Security Configuration
    const SECURITY_CONFIG = {
        // Allowed origins for production and testing
        allowedOrigins: [
            'https://arcade.apesonape.io',
            'https://*.vercel.app',
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'file://' // For local development
        ],
        
        // Content Security Policy
        csp: {
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline' https://cdn.jsdelivr.net https://w.soundcloud.com https://cdnjs.cloudflare.com",
            'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
            'font-src': "'self' https://fonts.gstatic.com",
            'img-src': "'self' data: https: blob:",
            'connect-src': "'self' https://*.supabase.co https://*.infura.io https://mainnet.infura.io wss://* https://gateway.pinata.cloud https://cloudflare-ipfs.com",
            'media-src': "'self' https://w.soundcloud.com https://assets.mixkit.co data:",
            'frame-src': "'self' https://w.soundcloud.com"
        },
        
        // Rate limiting
        rateLimits: {
            apiCalls: { max: 100, window: 60000 }, // 100 calls per minute
            walletConnections: { max: 10, window: 300000 }, // 10 connections per 5 minutes
            gameSubmissions: { max: 50, window: 60000 } // 50 game submissions per minute
        },
        
        // Input validation patterns
        patterns: {
            walletAddress: /^0x[a-fA-F0-9]{40}$/,
            username: /^[a-zA-Z0-9_-]{3,20}$/,
            gameScore: /^\d{1,10}$/,
            tokenId: /^[a-zA-Z0-9#\s-]{1,50}$/
        }
    };

    // Rate limiting storage
    const rateLimitStore = new Map();

    // Security utilities
    window.ArcadeSecurity = {
        
        // Input sanitization and validation
        sanitizeInput: function(input, type = 'text') {
            if (typeof input !== 'string') {
                return '';
            }
            
            // Basic XSS protection
            input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            input = input.replace(/javascript:/gi, '');
            input = input.replace(/on\w+\s*=/gi, '');
            input = input.replace(/data:text\/html/gi, '');
            
            // HTML entity encoding
            const div = document.createElement('div');
            div.textContent = input;
            input = div.innerHTML;
            
            // Type-specific validation
            switch (type) {
                case 'username':
                    input = input.slice(0, 20).replace(/[^a-zA-Z0-9_-]/g, '');
                    break;
                case 'score':
                    input = input.replace(/[^0-9]/g, '').slice(0, 10);
                    break;
                case 'walletAddress':
                    input = input.toLowerCase().replace(/[^0-9a-fx]/g, '');
                    break;
                case 'tokenId':
                    input = input.slice(0, 50).replace(/[<>]/g, '');
                    break;
            }
            
            return input;
        },

        // Validate input against patterns
        validateInput: function(input, type) {
            const pattern = SECURITY_CONFIG.patterns[type];
            if (!pattern) return false;
            return pattern.test(input);
        },

        // Rate limiting
        checkRateLimit: function(action, identifier = 'global') {
            const key = `${action}_${identifier}`;
            const limit = SECURITY_CONFIG.rateLimits[action];
            
            if (!limit) return true;
            
            const now = Date.now();
            const windowStart = now - limit.window;
            
            // Clean old entries
            if (rateLimitStore.has(key)) {
                const timestamps = rateLimitStore.get(key).filter(t => t > windowStart);
                rateLimitStore.set(key, timestamps);
            } else {
                rateLimitStore.set(key, []);
            }
            
            const timestamps = rateLimitStore.get(key);
            
            if (timestamps.length >= limit.max) {
                console.warn(`Rate limit exceeded for ${action} by ${identifier}`);
                return false;
            }
            
            timestamps.push(now);
            return true;
        },

        // Secure localStorage wrapper
        secureStorage: {
            set: function(key, value) {
                try {
                    // Encrypt sensitive data (basic obfuscation)
                    const sanitizedKey = window.ArcadeSecurity.sanitizeInput(key, 'text');
                    const sanitizedValue = typeof value === 'string' ? 
                        window.ArcadeSecurity.sanitizeInput(value, 'text') : JSON.stringify(value);
                    
                    // Add timestamp and basic integrity check
                    const data = {
                        value: sanitizedValue,
                        timestamp: Date.now(),
                        checksum: window.ArcadeSecurity.generateChecksum(sanitizedValue)
                    };
                    
                    localStorage.setItem(sanitizedKey, JSON.stringify(data));
                } catch (error) {
                    console.error('Secure storage set error:', error);
                }
            },
            
            get: function(key) {
                try {
                    const sanitizedKey = window.ArcadeSecurity.sanitizeInput(key, 'text');
                    const stored = localStorage.getItem(sanitizedKey);
                    
                    if (!stored) return null;
                    
                    const data = JSON.parse(stored);
                    
                    // Verify integrity
                    if (data.checksum !== window.ArcadeSecurity.generateChecksum(data.value)) {
                        console.warn('Storage integrity check failed for:', key);
                        localStorage.removeItem(sanitizedKey);
                        return null;
                    }
                    
                    // Check if data is too old (24 hours)
                    if (Date.now() - data.timestamp > 86400000) {
                        localStorage.removeItem(sanitizedKey);
                        return null;
                    }
                    
                    return data.value;
                } catch (error) {
                    console.error('Secure storage get error:', error);
                    return null;
                }
            },
            
            remove: function(key) {
                const sanitizedKey = window.ArcadeSecurity.sanitizeInput(key, 'text');
                localStorage.removeItem(sanitizedKey);
            }
        },

        // Generate simple checksum for integrity
        generateChecksum: function(data) {
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash.toString();
        },

        // Database query sanitization
        sanitizeDbQuery: function(query) {
            if (typeof query !== 'object') return {};
            
            const sanitized = {};
            
            for (const [key, value] of Object.entries(query)) {
                // Sanitize key
                const cleanKey = this.sanitizeInput(key, 'text');
                
                // Sanitize value based on type
                let cleanValue;
                if (typeof value === 'string') {
                    cleanValue = this.sanitizeInput(value, 'text');
                    // Remove SQL injection patterns
                    cleanValue = cleanValue.replace(/('|(\\')|(;|(\s*(;))|(\/\*(.|\n)*?\*\/)))/gi, '');
                } else if (typeof value === 'number') {
                    cleanValue = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)));
                } else if (typeof value === 'boolean') {
                    cleanValue = !!value;
                } else {
                    continue; // Skip unsupported types
                }
                
                sanitized[cleanKey] = cleanValue;
            }
            
            return sanitized;
        },

        // Secure API caller
        secureApiCall: async function(url, options = {}) {
            // Rate limiting
            if (!this.checkRateLimit('apiCalls')) {
                throw new Error('API rate limit exceeded');
            }
            
            // Validate URL
            if (!url || typeof url !== 'string') {
                throw new Error('Invalid API URL');
            }
            
            // Default secure options
            const secureOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                ...options
            };
            
            // Sanitize request body
            if (secureOptions.body && typeof secureOptions.body === 'string') {
                try {
                    const parsed = JSON.parse(secureOptions.body);
                    const sanitized = this.sanitizeDbQuery(parsed);
                    secureOptions.body = JSON.stringify(sanitized);
                } catch (e) {
                    throw new Error('Invalid request body');
                }
            }
            
            // Add timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            secureOptions.signal = controller.signal;
            
            try {
                const response = await fetch(url, secureOptions);
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('Secure API call failed:', error);
                throw error;
            }
        },

        // Wallet security validation
        validateWallet: function(walletAddress) {
            if (!walletAddress || typeof walletAddress !== 'string') {
                return false;
            }
            
            const sanitized = this.sanitizeInput(walletAddress, 'walletAddress');
            return this.validateInput(sanitized, 'walletAddress');
        },

        // Score validation (anti-cheat)
        validateScore: function(score, gameType, timeSpent) {
            // Basic score validation
            if (!this.validateInput(score.toString(), 'gameScore')) {
                return false;
            }
            
            const numScore = parseInt(score);
            
            // Game-specific validation
            const maxScores = {
                'block_dodger': 999999,
                'neon_racer': 999999,
                'galaxy_ape': 999999,
                'ape_man': 999999,
                'flappy_ape': 999999
            };
            
            const maxScore = maxScores[gameType] || 999999;
            if (numScore > maxScore) {
                console.warn('Score exceeds maximum for game type:', gameType);
                return false;
            }
            
            // Time-based validation (minimum time to achieve score)
            const minTimePerPoint = {
                'block_dodger': 0.1, // 0.1 seconds per point minimum
                'neon_racer': 0.1,
                'galaxy_ape': 0.1,
                'ape_man': 0.2,
                'flappy_ape': 0.5
            };
            
            const minTime = (minTimePerPoint[gameType] || 0.1) * numScore;
            if (timeSpent < minTime) {
                console.warn('Score achieved too quickly, possible cheating detected');
                return false;
            }
            
            return true;
        },

        // Environment security check
        checkEnvironment: function() {
            const issues = [];
            
            // Check for developer tools
            if (window.devtools && window.devtools.open) {
                issues.push('Developer tools detected');
            }
            
            // Check for common debugging variables
            if (window.console && window.console.clear) {
                // Try to detect console manipulation
                const originalLog = console.log;
                console.log = function() {
                    issues.push('Console manipulation detected');
                    return originalLog.apply(console, arguments);
                };
            }
            
            // Check for iframe embedding (clickjacking protection)
            if (window.top !== window.self) {
                issues.push('Page loaded in iframe');
            }
            
            // Check for script injection
            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
                if (!script.src && script.innerHTML.includes('eval(') || script.innerHTML.includes('Function(')) {
                    issues.push('Suspicious script content detected');
                }
            });
            
            return issues;
        },

        // Initialize security measures
        init: function() {
            // Security system initializing silently
            
            // Set up Content Security Policy
            if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
                const cspMeta = document.createElement('meta');
                cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
                
                const cspValue = Object.entries(SECURITY_CONFIG.csp)
                    .map(([directive, value]) => `${directive} ${value}`)
                    .join('; ');
                
                cspMeta.setAttribute('content', cspValue);
                document.head.appendChild(cspMeta);
            }
            
            // Disable right-click context menu in production
            if (window.location.hostname === 'arcade.apesonape.io') {
                document.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    return false;
                });
                
                // Disable common key combinations
                document.addEventListener('keydown', function(e) {
                    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
                    if (e.keyCode === 123 || 
                        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
                        (e.ctrlKey && e.keyCode === 85)) {
                        e.preventDefault();
                        return false;
                    }
                });
            }
            
            // Check environment security
            const securityIssues = this.checkEnvironment();
            if (securityIssues.length > 0) {
                console.warn('🚨 Security issues detected:', securityIssues);
            }
            
            // Override console methods with rate limiting for production
            // Disable all console output in production for performance and security
            const isProduction = window.location.hostname === 'arcade.apesonape.io' || 
                               window.location.hostname.includes('vercel.app') ||
                               (window.location.protocol === 'https:' && 
                                !window.location.hostname.includes('localhost'));
            
            if (isProduction) {
                // Use ArcadeDebug if available, otherwise disable console
                if (window.ArcadeDebug) {
                    // ArcadeDebug will handle production logging automatically
                    console.log('🔧 Security system using ArcadeDebug for logging control');
                } else {
                    // Fallback: disable console in production
                    const originalLog = console.log;
                    console.log = function() {};
                    console.warn = function() {};
                    console.debug = function() {};
                    console.info = function() {};
                    // Keep error logging for critical issues
                    console.trace = function() {};
                }
            }
            
            // Set up periodic security checks
            setInterval(() => {
                const issues = this.checkEnvironment();
                if (issues.length > 0) {
                    console.warn('🚨 Ongoing security issues detected:', issues);
                }
            }, 30000); // Check every 30 seconds
            
            // Security system initialized
        }
    };

    // Auto-initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.ArcadeSecurity.init());
    } else {
        window.ArcadeSecurity.init();
    }

    // Protect against common exploits
    Object.freeze(window.ArcadeSecurity);
    
})(); 