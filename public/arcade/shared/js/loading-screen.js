// Arcade Loading Screen System
// Handles loading states during page transitions and initial loads

(function() {
    'use strict';

    let inIframe = false;
    try {
        inIframe = window.self !== window.top;
    } catch (e) {
        inIframe = true;
    }

    // The Next.js shell already renders a loader before iframe onLoad.
    // Disable the internal arcade loading overlay inside game iframes to avoid double-loading UX.
    if (inIframe) {
        try {
            const style = document.createElement('style');
            style.setAttribute('data-arcade-single-loader', 'true');
            style.textContent = '#loadingOverlay, #loadingScreen { display: none !important; }';
            document.head.appendChild(style);
        } catch (e0) {}
        window.ArcadeLoading = {
            show: function() {},
            hide: function() {},
            gameReady: function() {},
            updateMessage: function() {},
            isVisible: function() { return false; },
            validationCompleteAwaitGame: function() {}
        };
        return;
    }

    const LoadingScreen = {
        // Configuration
        config: {
            minDisplayTime: 1000, // Minimum time to show loading screen (ms)
            fadeInDuration: 300,
            fadeOutDuration: 500,
            stuckTimeout: 12000, // Portfolio / slow networks — avoid false "stuck" before validationCompleteAwaitGame clears this
            defaultMessage: 'Loading...',
            messages: {
                connecting: 'Connecting to arcade...',
                validating: 'Validating wallet & NFTs...',
                loading: 'Loading game...',
                transitioning: 'Returning to arcade...',
                initializing: 'Initializing systems...'
            }
        },

        // State
        currentOverlay: null,
        startTime: null,
        isShowing: false,
        stuckCheckTimer: null,
        autoRefreshTimer: null,
        /** True after wallet guard finishes; overlay stays until game calls gameReady() */
        pendingGameReady: false,
        gameReadyFallbackTimer: null,

        clearGameReadyFallback: function() {
            if (this.gameReadyFallbackTimer) {
                clearTimeout(this.gameReadyFallbackTimer);
                this.gameReadyFallbackTimer = null;
            }
        },

        /**
         * Called when holder verification is done but the game may still be loading scripts/assets.
         * Keeps the overlay visible with a "Loading game…" message until gameReady().
         */
        validationCompleteAwaitGame: function() {
            if (!this.isShowing) return;
            this.pendingGameReady = true;
            /** Wallet validation finished; stop the short "stuck" timer so we don't nag while assets load. */
            this.clearStuckDetection();
            this.updateMessage('loading', this.config.messages.loading);
            this.clearGameReadyFallback();
            var self = this;
            this.gameReadyFallbackTimer = setTimeout(function() {
                if (self.isShowing && self.pendingGameReady) {
                    console.warn('[ArcadeLoading] gameReady() not received within 60s; dismissing overlay');
                    self.pendingGameReady = false;
                    self.hide(true);
                }
            }, 60000);
        },

        // Initialize the loading screen system
        init: function() {
            // Handle page navigation loading
            this.setupNavigationLoading();
            
            // Handle beforeunload to show loading for outgoing navigation
            this.setupBeforeUnload();
        },

        // Setup navigation loading for internal links
        setupNavigationLoading: function() {
            // Handle clicks on navigation buttons
            document.addEventListener('click', (event) => {
                const element = event.target;
                
                // Check if clicked element or parent has navigation
                const navButton = element.closest('[href], [onclick*="location"], [onclick*="href"]');
                if (navButton) {
                    const href = navButton.getAttribute('href') || 
                                navButton.getAttribute('onclick');
                    
                    // Only show loading for internal navigation
                    if (href && (href.includes('.html') || href.includes('location'))) {
                        this.show('loading');
                    }
                }
            });
        },

        // Setup beforeunload handling
        setupBeforeUnload: function() {
            window.addEventListener('beforeunload', () => {
                // Save that we're navigating away
                sessionStorage.setItem('arcadeNavigating', 'true');
                sessionStorage.setItem('arcadeNavigateTime', Date.now().toString());
            });

            // Check if we just navigated to this page
            window.addEventListener('load', () => {
                const wasNavigating = sessionStorage.getItem('arcadeNavigating');
                const navigateTime = sessionStorage.getItem('arcadeNavigateTime');
                
                if (wasNavigating === 'true' && navigateTime) {
                    const timeSinceNavigate = Date.now() - parseInt(navigateTime);
                    
                    // If navigation was recent, show loading
                    if (timeSinceNavigate < 5000) {
                        this.show('loading');
                    }
                }
                
                // Clean up navigation flags
                sessionStorage.removeItem('arcadeNavigating');
                sessionStorage.removeItem('arcadeNavigateTime');
            });
        },

        // Show loading screen
        show: function(messageKey = 'loading', customMessage = null) {
            if (this.isShowing) return;

            this.clearGameReadyFallback();
            this.pendingGameReady = false;
            
            this.isShowing = true;
            this.startTime = Date.now();
            
            const message = customMessage || this.config.messages[messageKey] || this.config.defaultMessage;
            
            // Create overlay element
            this.currentOverlay = this.createOverlay(message);
            
            // Add to DOM
            document.body.appendChild(this.currentOverlay);
            
            // Trigger fade in
            requestAnimationFrame(() => {
                this.currentOverlay.style.opacity = '1';
            });
            
            // Set up stuck loading detection
            this.setupStuckDetection();
        },

        // Hide loading screen
        hide: function(forceImmediate = false) {
            if (!this.isShowing || !this.currentOverlay) return;

            this.clearGameReadyFallback();
            this.pendingGameReady = false;

            // Clear stuck detection timer
            this.clearStuckDetection();
            
            // Clear auto-refresh timer
            this.clearAutoRefreshTimer();

            const elapsed = Date.now() - this.startTime;
            const minTimeRemaining = Math.max(0, this.config.minDisplayTime - elapsed);

            const performHide = () => {
                if (!this.currentOverlay) return;

                this.currentOverlay.style.opacity = '0';
                
                setTimeout(() => {
                    if (this.currentOverlay && this.currentOverlay.parentNode) {
                        this.currentOverlay.parentNode.removeChild(this.currentOverlay);
                    }
                    this.currentOverlay = null;
                    this.isShowing = false;
                }, this.config.fadeOutDuration);
            };

            if (forceImmediate || minTimeRemaining === 0) {
                performHide();
            } else {
                setTimeout(performHide, minTimeRemaining);
            }
        },

        // Create overlay element
        createOverlay: function(message) {
            const overlay = document.createElement('div');
            overlay.className = 'arcade-loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                font-family: 'Press Start 2P', 'Courier New', monospace;
                color: #00ffff;
                text-align: center;
                opacity: 0;
                transition: opacity ${this.config.fadeInDuration}ms ease-in-out;
            `;
            
            overlay.innerHTML = `
                <div class="loading-content" style="text-align: center; animation: glow 2s ease-in-out infinite alternate;">
                    <div class="loading-logo" style="
                        font-size: 24px;
                        margin-bottom: 30px;
                        color: #ff6b6b;
                        text-shadow: 0 0 10px #ff6b6b;
                    ">
                        APE ARCADE
                    </div>
                    
                    <div class="loading-spinner" style="
                        width: 60px;
                        height: 60px;
                        border: 4px solid rgba(0, 255, 255, 0.3);
                        border-radius: 50%;
                        border-top-color: #00ffff;
                        border-right-color: #ff6b6b;
                        animation: spin 1.5s linear infinite;
                        margin: 0 auto 30px auto;
                        box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
                    "></div>
                    
                    <div class="loading-message" style="
                        font-size: 12px;
                        max-width: 400px;
                        line-height: 1.6;
                        margin: 0 auto 20px auto;
                        color: #ffffff;
                    ">
                        ${message}
                    </div>
                    
                    <div class="loading-tips" style="
                        font-size: 8px;
                        max-width: 300px;
                        line-height: 1.4;
                        margin: 0 auto 15px auto;
                        color: #888;
                        text-align: center;
                        opacity: 0.7;
                    ">
                        💡 Taking too long? Press F5 to refresh<br/>
                        Auto-refresh after 5 seconds if stuck
                    </div>
                    
                    <div class="loading-dots" style="
                        font-size: 16px;
                        color: #00ffff;
                        animation: dots 1.5s steps(4, end) infinite;
                    ">
                        ●●●
                    </div>
                </div>

                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    
                    @keyframes glow {
                        from { text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff; }
                        to { text-shadow: 0 0 15px #ff6b6b, 0 0 25px #ff6b6b, 0 0 35px #ff6b6b; }
                    }
                    
                    @keyframes dots {
                        0%, 20% { content: '●'; }
                        40% { content: '●●'; }
                        60% { content: '●●●'; }
                        80%, 100% { content: '●●●●'; }
                    }

                    .loading-dots::after {
                        content: '';
                        animation: dots 1.5s steps(4, end) infinite;
                    }
                </style>
            `;
            
            return overlay;
        },

        // Update message on existing overlay
        updateMessage: function(messageKey, customMessage = null) {
            if (!this.currentOverlay) return;
            
            const message = customMessage || this.config.messages[messageKey] || this.config.defaultMessage;
            const messageElement = this.currentOverlay.querySelector('.loading-message');
            
            if (messageElement) {
                messageElement.textContent = message;
            }
        },

        // Check if loading screen is currently showing
        isVisible: function() {
            return this.isShowing;
        },

        // Mark game as ready and hide loading screen
        gameReady: function() {
            this.clearGameReadyFallback();
            this.pendingGameReady = false;
            console.log('Game ready signal received, hiding loading screen');
            if (this.isShowing) {
                this.hide();
            }
        },

        // Set up stuck loading detection
        setupStuckDetection: function() {
            // Clear any existing timer
            this.clearStuckDetection();
            
            // Set timer to detect stuck loading
            this.stuckCheckTimer = setTimeout(() => {
                if (this.isShowing && this.currentOverlay) {
                    this.showStuckMessage();
                }
            }, this.config.stuckTimeout);
        },

        // Clear stuck detection timer
        clearStuckDetection: function() {
            if (this.stuckCheckTimer) {
                clearTimeout(this.stuckCheckTimer);
                this.stuckCheckTimer = null;
            }
        },

        // Show stuck loading message
        showStuckMessage: function() {
            if (!this.currentOverlay) return;
            
            // Find the loading content area
            const loadingContent = this.currentOverlay.querySelector('.loading-content');
            if (!loadingContent) return;
            
            // Check if stuck message already exists
            let stuckMessage = this.currentOverlay.querySelector('.stuck-message');
            if (stuckMessage) return; // Already showing
            
            // Create stuck message element
            stuckMessage = document.createElement('div');
            stuckMessage.className = 'stuck-message';
            stuckMessage.style.cssText = `
                margin-top: 30px;
                padding: 15px;
                background: rgba(255, 107, 107, 0.1);
                border: 2px solid #ff6b6b;
                border-radius: 8px;
                color: #ff6b6b;
                font-size: 10px;
                line-height: 1.4;
                text-align: center;
                animation: pulse 2s ease-in-out infinite;
                max-width: 350px;
                margin-left: auto;
                margin-right: auto;
            `;
            
            stuckMessage.innerHTML = `
                <div style="margin-bottom: 10px; font-weight: bold;">
                    ⚠️ Loading taking longer than expected
                </div>
                <div style="margin-bottom: 8px;">
                    Auto-refreshing in <span id="refresh-countdown">5</span> seconds...
                </div>
                <div style="font-size: 8px; opacity: 0.8;">
                    Or press F5 to refresh now
                </div>
                
                <style>
                    @keyframes pulse {
                        0%, 100% { opacity: 0.8; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.02); }
                    }
                </style>
            `;
            
            // Add the stuck message to the loading content
            loadingContent.appendChild(stuckMessage);
            
            // Start countdown for auto-refresh
            this.startAutoRefreshCountdown();
        },
        
        // Start auto-refresh countdown
        startAutoRefreshCountdown: function() {
            let countdown = 5;
            const countdownElement = document.getElementById('refresh-countdown');
            
            const countdownTimer = setInterval(() => {
                countdown--;
                if (countdownElement) {
                    countdownElement.textContent = countdown;
                }
                
                if (countdown <= 0) {
                    clearInterval(countdownTimer);
                    this.performSoftRefresh();
                }
            }, 1000);
            
            // Store timer reference for cleanup
            this.autoRefreshTimer = countdownTimer;
        },
        
        // Perform soft refresh
        performSoftRefresh: function() {
            console.log('Performing soft refresh due to stuck loading...');
            
            // Clear any timers
            this.clearStuckDetection();
            if (this.autoRefreshTimer) {
                clearInterval(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
            }
            
            // Hide loading screen
            this.hide(true);
            
            // Perform soft refresh
            window.location.reload();
        },
        
        // Clear auto-refresh timer
        clearAutoRefreshTimer: function() {
            if (this.autoRefreshTimer) {
                clearInterval(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
            }
        }
    };

    // Make LoadingScreen globally available
    window.ArcadeLoading = LoadingScreen;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => LoadingScreen.init());
    } else {
        LoadingScreen.init();
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, might be navigating away
            sessionStorage.setItem('arcadePageHidden', Date.now().toString());
        } else {
            // Page is visible again
            const hiddenTime = sessionStorage.getItem('arcadePageHidden');
            if (hiddenTime) {
                const timeHidden = Date.now() - parseInt(hiddenTime);
                
                // Only show loading if:
                // 1. Page was hidden for a very short time (likely navigation)
                // 2. AND we detect actual navigation (beforeunload was triggered)
                // 3. AND loading screen is not already visible
                const wasNavigating = sessionStorage.getItem('arcadeNavigating') === 'true';
                
                if (timeHidden < 500 && wasNavigating && !LoadingScreen.isVisible()) {
                    LoadingScreen.show('loading');
                }
                
                sessionStorage.removeItem('arcadePageHidden');
            }
        }
    });

})(); 