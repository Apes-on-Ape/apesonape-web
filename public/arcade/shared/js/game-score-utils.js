// Game Score Utilities - Independent Score Saving
// This module provides score saving functionality that works with or without the achievement system

function normalizeArcadeWallet(w) {
    if (!w || typeof w !== 'string') return '';
    return w.trim().toLowerCase();
}

function readGlyphIdentityPayload() {
    var payload = {};
    try {
        var gid =
            localStorage.getItem('glyphUserId') ||
            sessionStorage.getItem('glyphUserId') ||
            '';
        if (gid && String(gid).trim()) {
            payload.glyph_user_id = String(gid).trim();
        }
    } catch (_) {}

    try {
        var gEvm =
            localStorage.getItem('glyphEvmWallet') ||
            sessionStorage.getItem('glyphEvmWallet') ||
            '';
        if (gEvm && String(gEvm).trim()) {
            payload.glyph_evm_wallet = String(gEvm).trim().toLowerCase();
        }
    } catch (_) {}

    try {
        if (!payload.glyph_evm_wallet) {
            var q = new URLSearchParams(window.location.search);
            var fromUrl = q.get('aoa_glyph_evm');
            if (fromUrl && String(fromUrl).trim()) {
                payload.glyph_evm_wallet = String(fromUrl).trim().toLowerCase();
            }
        }
    } catch (_) {}

    return payload;
}

async function waitForArcadeWallet(timeoutMs) {
    var timeout = typeof timeoutMs === 'number' ? timeoutMs : 1500;
    var start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            if (typeof window.getArcadeWalletForDatabase === 'function') {
                var w = window.getArcadeWalletForDatabase();
                if (w) return w;
            }
            var g = String(localStorage.getItem('glyphEvmWallet') || '').trim().toLowerCase();
            if (/^0x[a-f0-9]{40}$/.test(g)) return g;
        } catch (_) {}
        await new Promise(function (r) { setTimeout(r, 100); });
    }
    return '';
}

const GameScoreUtils = {
    /**
     * Save game score independently - works with or without achievement system
     * @param {string} gameId - The game identifier
     * @param {number} score - The score to save
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - Whether the save was successful
     */
    async saveGameScore(gameId, score, options = {}) {
        const { success = true, onComplete = null } = options;

        console.log(`🎮 Saving game score: ${gameId}, score: ${score}`);

        try {
            // Canonical wallet is Glyph-only.
            let wallet = '';
            if (typeof window.getArcadeWalletForDatabase === 'function') {
                wallet = window.getArcadeWalletForDatabase();
            }

            if (!wallet) {
                wallet = await waitForArcadeWallet(2000);
            }
            if (!wallet) {
                console.error('❌ No wallet address available for score saving');
                if (onComplete) onComplete(false, { error: 'No wallet connected' });
                return false;
            }

            // Try achievement system first if available
            if (window.achievementSystem) {
                console.log('📊 Using achievement system for score saving');
                try {
                    const result = await window.achievementSystem.completeGame(gameId, score, {
                        success: success,
                        onComplete: (achievementSuccess, achievementResult) => {
                            console.log('✅ Achievement system completed:', achievementSuccess);
                            if (onComplete) onComplete(achievementSuccess, achievementResult);
                        }
                    });
                    if (result === true) {
                        return true;
                    }
                    console.warn('⚠️ Achievement save returned false, falling back to direct API');
                } catch (achievementError) {
                    console.warn('⚠️ Achievement system failed, falling back to direct API:', achievementError);
                    // Continue to fallback
                }
            }

            // Fallback to direct API call
            console.log('📡 Using direct API for score saving');
            const result = await this.saveScoreDirect(gameId, score, wallet, success);
            
            if (onComplete) onComplete(result, { method: 'direct_api' });
            return result;

        } catch (error) {
            console.error('💥 Error in saveGameScore:', error);
            if (onComplete) onComplete(false, { error: error.message });
            return false;
        }
    },

    /**
     * Direct API call to save score
     * @param {string} gameId - The game identifier
     * @param {number} score - The score to save
     * @param {string} walletAddress - The wallet address
     * @param {boolean} success - Whether the game was successful
     * @returns {Promise<boolean>} - Whether the save was successful
     */
    async saveScoreDirect(gameId, score, walletAddress, success = true) {
        try {
            const requestData = {
                wallet_address: normalizeArcadeWallet(walletAddress),
                game_id: gameId,
                score: score,
                // Don't send any user stats - let the server handle current values
                // This prevents data corruption when client sends zeros
                timestamp: new Date().toISOString(),
                ...readGlyphIdentityPayload()
            };

            console.log('📤 Sending score to API:', requestData);

            const response = await fetch('/api/achievements/save_game_stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Score saved successfully via direct API:', result);
                
                // Trigger achievement events if available (for point-based achievements)
                this.triggerScoreAchievements(gameId, score, success);
                
                return true;
            } else {
                let errorBody = '';
                try {
                    errorBody = await response.text();
                } catch (_) {}
                console.error('❌ Failed to save score via API:', response.status, response.statusText, errorBody);
                return false;
            }
        } catch (error) {
            console.error('💥 Error in saveScoreDirect:', error);
            return false;
        }
    },

    /**
     * Trigger score-related achievements manually
     * @param {string} gameId - The game identifier
     * @param {number} score - The score achieved
     * @param {boolean} success - Whether the game was successful
     */
    triggerScoreAchievements(gameId, score, success = true) {
        // Trigger game end event for achievements
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameEnd', { 
                gameId: gameId, 
                score: score,
                success: success 
            });

            // Trigger first score achievement if this might be their first points
            if (score > 0) {
                window.triggerAchievementEvent('firstScore', { gameId, score });
            }

            // Trigger score milestone achievements
            const scoreMilestones = [1000, 5000, 10000, 25000, 50000];
            for (const milestone of scoreMilestones) {
                if (score >= milestone) {
                    window.triggerAchievementEvent('scoreMilestone', { 
                        gameId, 
                        score, 
                        milestone 
                    });
                }
            }
        }
    },

    /**
     * Get user's high score for a specific game
     * @param {string} gameId - The game identifier
     * @returns {Promise<number>} - The high score
     */
    async getUserHighScore(gameId) {
        try {
            // Try achievement system first
            if (window.achievementSystem && typeof window.achievementSystem.getUserHighScore === 'function') {
                return await window.achievementSystem.getUserHighScore(gameId);
            }

            // Glyph-only wallet resolution
            const wallet = typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';

            if (!wallet) {
                console.warn('No wallet connected for high score lookup');
                return 0;
            }

            const response = await fetch('/api/achievements/get_high_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: wallet,
                    game_id: gameId,
                    glyph_user_id: (localStorage.getItem('glyphUserId') || '').trim(),
                    glyph_evm_wallet: (localStorage.getItem('glyphEvmWallet') || '').trim().toLowerCase()
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result.high_score || 0;
            } else {
                console.error('Failed to get high score:', response.status);
                return 0;
            }
        } catch (error) {
            console.error('Error getting high score:', error);
            return 0;
        }
    },

    /**
     * Get user's rank for a specific game
     * @param {string} gameId - The game identifier
     * @returns {Promise<number>} - The user's rank
     */
    async getUserRank(gameId) {
        try {
            // Try achievement system first
            if (window.achievementSystem && typeof window.achievementSystem.getUserRank === 'function') {
                return await window.achievementSystem.getUserRank(gameId);
            }

            // Glyph-only wallet resolution
            const wallet = typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';

            if (!wallet) {
                console.warn('No wallet connected for rank lookup');
                return 0;
            }

            const response = await fetch('/api/achievements/get_user_rank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: wallet,
                    game_id: gameId,
                    glyph_user_id: (localStorage.getItem('glyphUserId') || '').trim(),
                    glyph_evm_wallet: (localStorage.getItem('glyphEvmWallet') || '').trim().toLowerCase()
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result.rank || 0;
            } else {
                console.error('Failed to get user rank:', response.status);
                return 0;
            }
        } catch (error) {
            console.error('Error getting user rank:', error);
            return 0;
        }
    }
};

// Make it globally available
window.GameScoreUtils = GameScoreUtils;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameScoreUtils;
} 