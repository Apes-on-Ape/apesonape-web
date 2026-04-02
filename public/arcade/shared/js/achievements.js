// Achievements and Experience System for Ape Arcade
// This module handles achievements, experience points, and leveling

/** Set by the main site (`GlyphArcadeWalletSync`) when signed in — links arcade rows to `user_profiles`. */
function getArcadeGlyphUserIdPayload() {
    try {
        var gid = localStorage.getItem('glyphUserId');
        if (gid && String(gid).trim()) return { glyph_user_id: String(gid).trim() };
    } catch (e) { /* ignore */ }
    return {};
}

/** Glyph holder EVM — server resolves Privy profile by `wallet_address` (Privy id ≠ Glyph account id). */
function getArcadeGlyphEvmPayload() {
    try {
        var w = localStorage.getItem('glyphEvmWallet');
        if (w && String(w).trim()) return { glyph_evm_wallet: String(w).trim().toLowerCase() };
    } catch (e) { /* ignore */ }
    return {};
}

function getArcadeGlyphSessionPayload() {
    return { ...getArcadeGlyphUserIdPayload(), ...getArcadeGlyphEvmPayload() };
}

function getCanonicalArcadeWallet() {
    try {
        return typeof window.getArcadeWalletForDatabase === 'function'
            ? window.getArcadeWalletForDatabase()
            : '';
    } catch (e) { /* ignore */ }
    return '';
}

class AchievementSystem {
    constructor() {
        this.currentUser = null;
        this.userStats = {};
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        
        // Load session stats from sessionStorage or initialize if not exists
        this.sessionStats = this.loadSessionStats();
        
        // Experience values for different actions
        this.experienceValues = {
            // Game completion XP (base values)
            'block_dodger': 10,
            'neon_racer': 12,
            'ape_man': 8,
            'flappy_ape': 6,
            'galaxy_ape': 15,
            
            // Score multipliers (XP = base + score/1000)
            'score_bonus': 0.001, // 1 XP per 1000 points
            
            // Social activities
            'clubroom_visit': 5,
            'chat_message': 2,
            'emoji_reaction': 1,
            'voice_chat_minute': 3,
            
            // Other activities
            'nft_connect': 25,
            'settings_access': 5,
            'profile_update': 10
        };
        
        this.init();
    }

    loadSessionStats() {
        try {
            const savedStats = sessionStorage.getItem('achievementSessionStats');
            console.log('🔍 Checking for saved session stats...');
            
            if (savedStats) {
                const parsed = JSON.parse(savedStats);
                // Convert gamesSwitched back to a Set
                parsed.gamesSwitched = new Set(parsed.gamesSwitched || []);
                console.log('📊 Loaded session stats from storage:', {
                    gamesPlayed: parsed.gamesPlayed,
                    uniqueGames: parsed.gamesSwitched.size,
                    games: Array.from(parsed.gamesSwitched)
                });
                return parsed;
            } else {
                console.log('📭 No saved session stats found, creating new ones');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load session stats from storage:', error);
        }
        
        // Initialize new session stats
        const newStats = {
            gamesPlayed: 0,
            sessionsStartTime: Date.now(),
            gamesSwitched: new Set(),
            consecutiveGames: 0,
            lastGameTime: null,
            sessionStartTime: Date.now(),
            dailyStats: {},
            musicPlays: 0,
            musicChanges: 0,
            continuousPlayTime: 0,
            lastActivityTime: Date.now(),
            scoreStreak: 0,
            lastScore: 0,
            perfectGames: 0,
            settingsAccessed: false,
            profileUpdated: false
        };
        
        console.log('🆕 Initialized new session stats');
        return newStats;
    }

    saveSessionStats() {
        try {
            // Convert Set to array for JSON serialization
            const statsToSave = {
                ...this.sessionStats,
                gamesSwitched: Array.from(this.sessionStats.gamesSwitched)
            };
            sessionStorage.setItem('achievementSessionStats', JSON.stringify(statsToSave));
            console.log('💾 Saved session stats to storage');
        } catch (error) {
            console.warn('⚠️ Failed to save session stats:', error);
        }
    }

    /**
     * Parent app (`GlyphArcadeWalletSync`) may write `glyphEvmWallet` after this iframe's scripts run.
     * Re-read canonical wallet and reload DB state when it differs from `currentUser`.
     */
    async syncCurrentUserWithArcadeStorageIfNeeded() {
        if (typeof window.getArcadeWalletForDatabase !== 'function') return;
        const canonical = window.getArcadeWalletForDatabase();
        if (!canonical || canonical === this.currentUser) return;
        console.log('🔗 Resyncing arcade achievement user to canonical wallet:', canonical);
        this.currentUser = canonical;
        this.unlockedAchievements.clear();
        this.initializeDefaultUserStats();
        await this.loadUserData();
        if (!this.unlockedAchievements.has('welcome')) {
            await this.unlockAchievement('welcome');
        }
        await this.onNFTConnect();
        this.updateLevelDisplay();
    }

    async init() {
        console.log('🔧 Initializing Achievement System...');
        
        try {
            // Load achievements first
            await this.loadAchievements();
            
            // Glyph-only canonical wallet for arcade persistence
            var connectedWallet =
                typeof window.getArcadeWalletForDatabase === 'function'
                    ? window.getArcadeWalletForDatabase()
                    : '';
            if (connectedWallet) {
                console.log('👛 Arcade DB wallet:', connectedWallet);
                this.currentUser = connectedWallet;
                
                // Load user data from database
                await this.loadUserData();
                
                // Check for welcome achievement
                if (!this.unlockedAchievements.has('welcome')) {
                    console.log('🎉 First time user detected, unlocking welcome achievement');
                    await this.unlockAchievement('welcome');
                }
            } else {
                console.log('⚠️ No wallet connected, using local session only');
                this.initializeDefaultUserStats();
            }

            // Parent may populate Glyph keys after iframe init (Next.js `GlyphArcadeWalletSync`).
            await this.syncCurrentUserWithArcadeStorageIfNeeded();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateLevelDisplay();
            
            console.log('✅ Achievement System initialized');
            console.log('📊 Current stats:', this.userStats);
            console.log('🏆 Unlocked achievements:', Array.from(this.unlockedAchievements));
        } catch (error) {
            console.error('❌ Error during achievement system initialization:', error);
            // Fallback to default initialization
            this.initializeDefaultUserStats();
            this.setupEventListeners();
            this.updateLevelDisplay();
        }
    }

    initializeDefaultData() {
        console.log('🔧 Initializing default achievement data...');
        this.userStats = {
            level: 1,
            experience: 0,
            total_games_played: 0,
            total_points: 0,
            block_dodger_games: 0,
            neon_racer_games: 0,
            ape_man_games: 0,
            flappy_ape_games: 0,
            galaxy_ape_games: 0
        };
        
        // Add some default achievements
        this.achievements.set('welcome', {
            id: 'welcome',
            name: 'Welcome!',
            description: 'Welcome to Ape Arcade!',
            icon: '🌴',
            reward_xp: 10
        });
        
        this.achievements.set('first_game', {
            id: 'first_game',
            name: 'First Game',
            description: 'Play your first game',
            icon: '🎮',
            reward_xp: 25
        });
        
        console.log('✅ Default achievement data initialized');
    }

    async loadUserData() {
        if (!this.currentUser) {
            console.log('⚠️ No current user, using default stats');
            this.initializeDefaultUserStats();
            return;
        }

        try {
            console.log('📡 Loading user data for wallet:', this.currentUser);
            
            const response = await fetch('/api/achievements/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: this.currentUser,
                    ...getArcadeGlyphSessionPayload()
                })
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('📊 User data loaded from database:', userData);
                if (typeof window.setArcadeProfileAvatarFromApi === 'function') {
                    window.setArcadeProfileAvatarFromApi(userData);
                }
                
                // Merge database data with local stats, prioritizing database values
                this.userStats = {
                    level: userData.level || 1,
                    experience: userData.experience || 0,
                    total_games_played: userData.total_games_played || 0,
                    total_points: userData.total_points || 0,
                    block_dodger_games: userData.block_dodger_games || 0,
                    neon_racer_games: userData.neon_racer_games || 0,
                    ape_man_games: userData.ape_man_games || 0,
                    flappy_ape_games: userData.flappy_ape_games || 0,
                    galaxy_ape_games: userData.galaxy_ape_games || 0,
                    clubroom_visits: userData.clubroom_visits || 0,
                    messages_sent: userData.messages_sent || 0,
                    reactions_sent: userData.reactions_sent || 0,
                    nft_count: userData.nft_count || 0,
                    first_game_played: userData.first_game_played,
                    last_game_played: userData.last_game_played
                };
                
                // Load unlocked achievements
                if (userData.achievements && Array.isArray(userData.achievements)) {
                    userData.achievements.forEach(achievement => {
                        this.unlockedAchievements.add(achievement.achievement_id);
                    });
                    console.log('🏆 Loaded unlocked achievements:', Array.from(this.unlockedAchievements));
                }
                
                console.log('✅ User data loaded successfully');
                console.log('📊 Final user stats:', this.userStats);
            } else {
                console.warn('⚠️ Failed to load user data, using defaults');
                this.initializeDefaultUserStats();
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            this.initializeDefaultUserStats();
        }
    }

    initializeDefaultUserStats() {
            this.userStats = {
                level: 1,
                experience: 0,
                total_games_played: 0,
                total_points: 0,
                block_dodger_games: 0,
                neon_racer_games: 0,
                ape_man_games: 0,
                flappy_ape_games: 0,
                galaxy_ape_games: 0,
                clubroom_visits: 0,
                messages_sent: 0,
                reactions_sent: 0,
                nft_count: 0,
                first_game_played: null,
                last_game_played: null
            };
        console.log('🔧 Initialized default user stats');
    }

    async loadAchievements() {
        console.log('🏆 Loading achievements...');
        try {
            // Load all achievements
            const response = await fetch('/api/achievements/list');
            if (response.ok) {
                const achievements = await response.json();
                if (Array.isArray(achievements) && achievements.length > 0) {
                achievements.forEach(achievement => {
                    this.achievements.set(achievement.id, achievement);
                });
                    console.log('✅ Loaded', achievements.length, 'achievements from database');
                } else {
                    console.log('⚠️ No achievements found in database, using defaults');
                    this.loadDefaultAchievements();
                }
            } else {
                console.warn('⚠️ Failed to load achievements, status:', response.status);
                this.loadDefaultAchievements();
            }

            // Load user's unlocked achievements
            if (this.currentUser) {
                console.log('🔓 Loading user achievements...');
                const userAchievementsResponse = await fetch('/api/achievements/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wallet_address: this.currentUser,
                        ...getArcadeGlyphSessionPayload()
                    })
                });
                
                if (userAchievementsResponse.ok) {
                    const userAchievementsData = await userAchievementsResponse.json();
                    if (typeof window.setArcadeProfileAvatarFromApi === 'function') {
                        window.setArcadeProfileAvatarFromApi(userAchievementsData);
                    }
                    const userAchievements = userAchievementsData.achievements || [];
                    userAchievements.forEach(achievement => {
                        this.unlockedAchievements.add(achievement.achievement_id);
                    });
                    console.log('✅ Loaded', userAchievements.length, 'unlocked achievements');
                } else {
                    console.warn('⚠️ Failed to load user achievements, status:', userAchievementsResponse.status);
                }
            }
        } catch (error) {
            console.error('❌ Failed to load achievements:', error);
            this.loadDefaultAchievements();
        }
    }

    loadDefaultAchievements() {
        console.log('🔧 Loading default achievements...');
        const defaultAchievements = [
            // Core Game Achievements
            { id: 'welcome', name: 'Welcome to the Jungle!', description: 'Join the Ape Arcade for the first time', icon: '🌴', reward_xp: 150, category: 'general' },
            { id: 'first_game', name: 'First Game', description: 'Play your first game', icon: '🎮', reward_xp: 375, category: 'games' },
            { id: 'first_score', name: 'First Score', description: 'Get your first score in any game', icon: '📈', reward_xp: 225, category: 'games' },
            
            // Score Achievements (Single Game) - Adjusted for 10k max score
            { id: 'score_500', name: 'First Steps', description: 'Score 500 points in a single game', icon: '🥉', reward_xp: 300, category: 'games' },
            { id: 'score_1k', name: 'Getting Good', description: 'Score 1,000 points in a single game', icon: '🥈', reward_xp: 450, category: 'games' },
            { id: 'score_2k', name: 'Skilled Player', description: 'Score 2,000 points in a single game', icon: '🥇', reward_xp: 600, category: 'games' },
            { id: 'score_5k', name: 'Expert Player', description: 'Score 5,000 points in a single game', icon: '👑', reward_xp: 1125, category: 'games' },
            { id: 'score_10k', name: 'Perfect Score', description: 'Score 10,000 points in a single game', icon: '💎', reward_xp: 2250, category: 'games' },
            
            // Total Games Played
            { id: 'games_10', name: 'Getting Started', description: 'Play 10 games total', icon: '🎯', reward_xp: 450, category: 'games' },
            { id: 'games_25', name: 'Regular Player', description: 'Play 25 games total', icon: '🎲', reward_xp: 750, category: 'games' },
            { id: 'games_50', name: 'Dedicated Player', description: 'Play 50 games total', icon: '🎪', reward_xp: 1125, category: 'games' },
            { id: 'games_100', name: 'Arcade Enthusiast', description: 'Play 100 games total', icon: '🎨', reward_xp: 1500, category: 'games' },
            { id: 'games_250', name: 'Arcade Veteran', description: 'Play 250 games total', icon: '🏆', reward_xp: 2250, category: 'games' },
            { id: 'games_500', name: 'Arcade Master', description: 'Play 500 games total', icon: '👑', reward_xp: 3000, category: 'games' },
            
            // Block Dodger Achievements
            { id: 'block_dodger_1', name: 'Block Dodger Rookie', description: 'Play 1 Block Dodger game', icon: '🎮', reward_xp: 225, category: 'games' },
            { id: 'block_dodger_5', name: 'Block Dodger Explorer', description: 'Play 5 Block Dodger games', icon: '🕹️', reward_xp: 375, category: 'games' },
            { id: 'block_dodger_10', name: 'Block Dodger Enthusiast', description: 'Play 10 Block Dodger games', icon: '🎯', reward_xp: 525, category: 'games' },
            { id: 'block_dodger_25', name: 'Block Dodger Expert', description: 'Play 25 Block Dodger games', icon: '🏅', reward_xp: 750, category: 'games' },
            { id: 'block_dodger_50', name: 'Block Dodger Master', description: 'Play 50 Block Dodger games', icon: '🏆', reward_xp: 1125, category: 'games' },
            { id: 'block_dodger_100', name: 'Block Dodger Legend', description: 'Play 100 Block Dodger games', icon: '👑', reward_xp: 1500, category: 'games' },
            
            // Neon Racer Achievements
            { id: 'neon_racer_1', name: 'Neon Racer Rookie', description: 'Play 1 Neon Racer game', icon: '🏎️', reward_xp: 225, category: 'games' },
            { id: 'neon_racer_5', name: 'Neon Racer Explorer', description: 'Play 5 Neon Racer games', icon: '🚗', reward_xp: 375, category: 'games' },
            { id: 'neon_racer_10', name: 'Neon Racer Enthusiast', description: 'Play 10 Neon Racer games', icon: '🏁', reward_xp: 525, category: 'games' },
            { id: 'neon_racer_25', name: 'Neon Racer Expert', description: 'Play 25 Neon Racer games', icon: '🏅', reward_xp: 750, category: 'games' },
            { id: 'neon_racer_50', name: 'Neon Racer Master', description: 'Play 50 Neon Racer games', icon: '🏆', reward_xp: 1125, category: 'games' },
            { id: 'neon_racer_100', name: 'Neon Racer Legend', description: 'Play 100 Neon Racer games', icon: '👑', reward_xp: 1500, category: 'games' },
            
            // Ape-Man Achievements
            { id: 'ape_man_1', name: 'Ape-Man Rookie', description: 'Play 1 Ape-Man game', icon: '👻', reward_xp: 225, category: 'games' },
            { id: 'ape_man_5', name: 'Ape-Man Explorer', description: 'Play 5 Ape-Man games', icon: '🍒', reward_xp: 375, category: 'games' },
            { id: 'ape_man_10', name: 'Ape-Man Enthusiast', description: 'Play 10 Ape-Man games', icon: '🔵', reward_xp: 525, category: 'games' },
            { id: 'ape_man_25', name: 'Ape-Man Expert', description: 'Play 25 Ape-Man games', icon: '🏅', reward_xp: 750, category: 'games' },
            { id: 'ape_man_50', name: 'Ape-Man Master', description: 'Play 50 Ape-Man games', icon: '🏆', reward_xp: 1125, category: 'games' },
            { id: 'ape_man_100', name: 'Ape-Man Legend', description: 'Play 100 Ape-Man games', icon: '👑', reward_xp: 1500, category: 'games' },
            
            // Galaxy Ape Achievements
            { id: 'galaxy_ape_1', name: 'Galaxy Ape Rookie', description: 'Play 1 Galaxy Ape game', icon: '🚀', reward_xp: 225, category: 'games' },
            { id: 'galaxy_ape_5', name: 'Galaxy Ape Explorer', description: 'Play 5 Galaxy Ape games', icon: '🌟', reward_xp: 375, category: 'games' },
            { id: 'galaxy_ape_10', name: 'Galaxy Ape Enthusiast', description: 'Play 10 Galaxy Ape games', icon: '🛸', reward_xp: 525, category: 'games' },
            { id: 'galaxy_ape_25', name: 'Galaxy Ape Expert', description: 'Play 25 Galaxy Ape games', icon: '🏅', reward_xp: 750, category: 'games' },
            { id: 'galaxy_ape_50', name: 'Galaxy Ape Master', description: 'Play 50 Galaxy Ape games', icon: '🏆', reward_xp: 1125, category: 'games' },
            { id: 'galaxy_ape_100', name: 'Galaxy Ape Legend', description: 'Play 100 Galaxy Ape games', icon: '👑', reward_xp: 1500, category: 'games' },
            
            // Flappy Ape Achievements
            { id: 'flappy_ape_1', name: 'Flappy Ape Rookie', description: 'Play 1 Flappy Ape game', icon: '🐦', reward_xp: 225, category: 'games' },
            { id: 'flappy_ape_5', name: 'Flappy Ape Explorer', description: 'Play 5 Flappy Ape games', icon: '🕊️', reward_xp: 375, category: 'games' },
            { id: 'flappy_ape_10', name: 'Flappy Ape Enthusiast', description: 'Play 10 Flappy Ape games', icon: '🦅', reward_xp: 525, category: 'games' },
            { id: 'flappy_ape_25', name: 'Flappy Ape Expert', description: 'Play 25 Flappy Ape games', icon: '🏅', reward_xp: 750, category: 'games' },
            { id: 'flappy_ape_50', name: 'Flappy Ape Master', description: 'Play 50 Flappy Ape games', icon: '🏆', reward_xp: 1125, category: 'games' },
            { id: 'flappy_ape_100', name: 'Flappy Ape Legend', description: 'Play 100 Flappy Ape games', icon: '👑', reward_xp: 1500, category: 'games' },
            
            // Cumulative Points - Adjusted for realistic totals
            { id: 'points_5k', name: 'Point Collector', description: 'Accumulate 5,000 total points', icon: '💰', reward_xp: 450, category: 'games' },
            { id: 'points_25k', name: 'Point Hoarder', description: 'Accumulate 25,000 total points', icon: '💸', reward_xp: 750, category: 'games' },
            { id: 'points_50k', name: 'Point Magnate', description: 'Accumulate 50,000 total points', icon: '💵', reward_xp: 1125, category: 'games' },
            { id: 'points_100k', name: 'Point Tycoon', description: 'Accumulate 100,000 total points', icon: '💎', reward_xp: 1500, category: 'games' },
            { id: 'points_250k', name: 'Point Mogul', description: 'Accumulate 250,000 total points', icon: '💸', reward_xp: 2250, category: 'games' },
            { id: 'points_500k', name: 'Point Stacker', description: 'Accumulate 500,000 total points', icon: '🏆', reward_xp: 3000, category: 'games' },
            { id: 'points_1000k', name: 'Point Millionaire', description: 'Accumulate 1,000,000 total points', icon: '💰', reward_xp: 6000, category: 'games' },
            
            // Consecutive Play Achievements
            { id: 'daily_streak_7', name: 'Weekly Warrior', description: 'Play games for 7 consecutive days', icon: '📅', reward_xp: 1500, category: 'progression' },
            { id: 'daily_streak_14', name: 'Fortnight Fighter', description: 'Play games for 14 consecutive days', icon: '🗓️', reward_xp: 2250, category: 'progression' },
            { id: 'daily_streak_30', name: 'Monthly Master', description: 'Play games for 30 consecutive days', icon: '📆', reward_xp: 3750, category: 'progression' },
            
            // Session Achievements
            { id: 'game_hopper', name: 'Game Hopper', description: 'Play all 5 games in one session', icon: '🦘', reward_xp: 1125, category: 'games' },
            { id: 'endurance_test', name: 'Endurance Test', description: 'Play for 2+ hours continuously', icon: '💪', reward_xp: 3000, category: 'progression' },
            
            // Ape Collection Achievements
            { id: 'ape_collector_1', name: 'First Ape', description: 'Have 1 ape in your wallet', icon: '🐵', reward_xp: 450, category: 'collection' },
            { id: 'ape_collector_5', name: 'Ape Squad', description: 'Have 5 apes in your wallet', icon: '🦍', reward_xp: 750, category: 'collection' },
            { id: 'ape_collector_10', name: 'Ape Crew', description: 'Have 10 apes in your wallet', icon: '🙊', reward_xp: 1125, category: 'collection' },
            { id: 'ape_collector_20', name: 'Ape Colony', description: 'Have 20 apes in your wallet', icon: '🙈', reward_xp: 1500, category: 'collection' },
            { id: 'ape_collector_30', name: 'Ape Army', description: 'Have 30 apes in your wallet', icon: '🙉', reward_xp: 2250, category: 'collection' },
            { id: 'ape_collector_40', name: 'Ape Empire', description: 'Have 40 apes in your wallet', icon: '👑', reward_xp: 3000, category: 'collection' },
            { id: 'ape_collector_50', name: 'Ape Dynasty', description: 'Have 50 apes in your wallet', icon: '💎', reward_xp: 4500, category: 'collection' },
            
            // Special Achievements
            { id: 'easter_egg', name: 'Easter Egg Hunter', description: 'Find hidden secrets around the arcade', icon: '🥚', reward_xp: 1500, category: 'secrets' },
            { id: 'developer_tribute', name: 'Developer Tribute', description: 'Discover the developers\' special message', icon: '👨‍💻', reward_xp: 750, category: 'secrets' },
            { id: 'feedback_hero', name: 'Feedback Hero', description: 'Report valuable feedback to the team', icon: '📝', reward_xp: 750, category: 'community' },
            { id: 'bug_hunter', name: 'Bug Hunter', description: 'Report a bug to the development team', icon: '🐛', reward_xp: 1125, category: 'community' }
        ];

        defaultAchievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
        
        console.log('✅ Loaded', defaultAchievements.length, 'default achievements');
    }

    // Experience and Leveling Functions
    calculateRequiredXP(level) {
        if (level <= 1) return 0;
        return Math.pow(level - 1, 2) * 50 + (level - 1) * 100;
    }

    calculateLevelFromXP(xp) {
        for (let level = 1; level <= 100; level++) {
            if (xp < this.calculateRequiredXP(level + 1)) {
                return level;
            }
        }
        return 100; // Max level
    }

    async addExperience(amount, source = 'unknown') {
        if (!this.currentUser || amount <= 0) {
            console.log('⚠️ Cannot add experience: no user or invalid amount');
            return;
        }

        const oldLevel = this.userStats.level;
        const oldXP = this.userStats.experience;
        const newXP = oldXP + amount;
        const newLevel = this.calculateLevelFromXP(newXP);

        console.log(`📈 Adding ${amount} XP (${source}). Level: ${oldLevel} → ${newLevel}, XP: ${oldXP} → ${newXP}`);

        this.userStats.experience = newXP;
        this.userStats.level = newLevel;

        // Check for level up
        if (newLevel > oldLevel) {
            console.log(`🎉 LEVEL UP! ${oldLevel} → ${newLevel}`);
            await this.handleLevelUp(oldLevel, newLevel);
        }

        // Update database with new experience and level
        try {
            console.log('💾 Saving experience to database...');
            const response = await fetch('/api/achievements/add_experience', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: this.currentUser,
                    experience: amount,
                    source: source,
                    ...getArcadeGlyphSessionPayload()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Experience saved to database:', result);
                
                // Update local stats with the response from database
                if (result.new_level) {
                    this.userStats.level = result.new_level;
                }
                if (result.total_xp) {
                    this.userStats.experience = result.total_xp;
                }
            } else {
                console.warn('⚠️ Failed to save experience to database, status:', response.status);
                const errorText = await response.text();
                console.warn('⚠️ Error response:', errorText);
                
                // Try alternative save method
                await this.saveGameStats('experience_update', 0, true);
            }
        } catch (error) {
            console.error('❌ Failed to save experience:', error);
            
            // Try alternative save method
            try {
                await this.saveGameStats('experience_update', 0, true);
            } catch (fallbackError) {
                console.error('❌ Fallback save also failed:', fallbackError);
            }
        }

        // Check for achievements
        await this.checkAchievements();
        
        // Update UI
        this.updateLevelDisplay();
    }

    async handleLevelUp(oldLevel, newLevel) {
        // Level up!
        
        // Show level up notification
        this.showLevelUpNotification(oldLevel, newLevel);
        
        // No specific level achievements in our simplified system
        // Achievements are now focused on games played, scores, and collections
    }

    // Game Event Handlers
    async onGameStart(gameId) {
        console.log('🎮 Game started:', gameId);
        
        this.sessionStats.gamesPlayed++;
        this.sessionStats.gamesSwitched.add(gameId);
        this.sessionStats.consecutiveGames++;
        this.sessionStats.lastGameTime = Date.now();

        console.log('📊 Session stats updated:');
        console.log('  - Total games played this session:', this.sessionStats.gamesPlayed);
        console.log('  - Unique games played this session:', this.sessionStats.gamesSwitched.size);
        console.log('  - Games in session:', Array.from(this.sessionStats.gamesSwitched));

        // Update stats (ensure per-game counter exists — dynamic key must not be NaN)
        this.userStats.total_games_played++;
        const runKey = `${gameId}_games`;
        const prevRuns = Number(this.userStats[runKey]);
        this.userStats[runKey] = (Number.isFinite(prevRuns) ? prevRuns : 0) + 1;

        // Track first game timestamp
        if (!this.userStats.first_game_played) {
            this.userStats.first_game_played = new Date().toISOString();
        }

        // Update last game timestamp
        this.userStats.last_game_played = new Date().toISOString();

        // Save session stats
        this.saveSessionStats();

        // Save updated game stats to database immediately
        if (this.currentUser) {
            await this.saveGameStats(gameId, 0, true); // 0 score for game start, true for immediate save
        }

        // First game achievement - "First Game"
        // Check if this is the first game and achievement hasn't been unlocked yet
        if (this.userStats.total_games_played === 1 && !this.unlockedAchievements.has('first_game')) {
            console.log('🎉 First game detected! Unlocking first_game achievement');
            await this.unlockAchievement('first_game');
        }

        // Check individual game achievements
        await this.checkIndividualGameAchievements(gameId);

        // Check other game-related achievements
        await this.checkGameAchievements(gameId);
        
        // Check total games achievements
        await this.checkGameMasterAchievements();
    }

    async onGameEnd(gameId, score, success = true, gameData = {}) {
        // Game ended

        // Award base game XP
        const baseXP = this.experienceValues[gameId] || 10;
        const scoreXP = Math.floor(score * this.experienceValues.score_bonus);
        const totalXP = baseXP + scoreXP;

        await this.addExperience(totalXP, `${gameId}_completion`);

        // Check score achievements
        await this.checkScoreAchievements(score);

        // Track session games for Game Hopper achievement
        await this.onGameHopper();
        
        // Additional game data can be processed here in the future if needed
        
        // Check endurance test
        await this.onEnduranceTest();
        
        // Check daily habit
        await this.onDailyHabit();
        
        // Check weekly warrior
        await this.onWeeklyWarrior();

        // Update last game time
        this.userStats.last_game_played = new Date().toISOString();
        
        // Save game stats
        await this.saveGameStats(gameId, score);
    }

    async onNFTConnect(apeCount = null) {
        console.log('🦍 NFT connection detected, ape count:', apeCount);
        
        // If apeCount is provided, use it; otherwise use the latest server-synced value
        if (apeCount === null) {
            try {
                apeCount = Number(this.userStats.nft_count || 0);
                console.log('🦍 Using server-synced ape count:', apeCount);
            } catch (error) {
                console.error('❌ Error loading ape count:', error);
                apeCount = 0;
            }
        }
        
        // Check NFT collection achievements
        if (apeCount >= 1) await this.unlockAchievement('ape_collector_1');
        if (apeCount >= 5) await this.unlockAchievement('ape_collector_5');
        if (apeCount >= 10) await this.unlockAchievement('ape_collector_10');
        if (apeCount >= 20) await this.unlockAchievement('ape_collector_20');
        if (apeCount >= 30) await this.unlockAchievement('ape_collector_30');
        if (apeCount >= 40) await this.unlockAchievement('ape_collector_40');
        if (apeCount >= 50) await this.unlockAchievement('ape_collector_50');
        
        // Store NFT count in user stats
        this.userStats.nft_count = apeCount;
    }

    async onWelcome() {
        await this.unlockAchievement('welcome');
    }

    async onFirstScore() {
        console.log('📈 First score achieved!');
        await this.unlockAchievement('first_score');
    }

    async onBugReport() {
        console.log('🐛 Bug report submitted');
        await this.unlockAchievement('bug_hunter');
    }

    async onFeedback() {
        console.log('📝 Feedback provided');
        await this.unlockAchievement('feedback_hero');
    }

    async onEasterEgg() {
        console.log('🥚 Easter egg found');
        await this.unlockAchievement('easter_egg');
    }

    async onDeveloperMessage() {
        console.log('👨‍💻 Developer message found');
        await this.unlockAchievement('developer_tribute');
    }

    async onGameHopper() {
        // Game Hopper - Play all 5 games in one session
        console.log('🦘 Checking Game Hopper achievement...');
        console.log('📊 Session games switched:', Array.from(this.sessionStats.gamesSwitched));
        
        // Use the sessionStats.gamesSwitched Set that's already being populated in onGameStart
        const uniqueGamesPlayed = this.sessionStats.gamesSwitched.size;
            
        console.log('🎮 Unique games played this session:', uniqueGamesPlayed);
        
        if (uniqueGamesPlayed >= 5) {
            console.log('🏆 Game Hopper achievement unlocked! Played all 5 games in one session');
                await this.unlockAchievement('game_hopper');
        } else {
            console.log(`📈 Progress: ${uniqueGamesPlayed}/5 games played this session`);
            }
        
        // Save session stats after checking
        this.saveSessionStats();
    }

    async onEnduranceTest() {
        // Endurance Test - Play for 2+ hours continuously
        const sessionStart = parseInt(sessionStorage.getItem('sessionStartTime') || Date.now().toString());
        const now = Date.now();
        const sessionDuration = (now - sessionStart) / (1000 * 60 * 60); // hours
        
        if (sessionDuration >= 2) {
            await this.unlockAchievement('endurance_test');
        }
    }

    async onDailyHabit() {
        // Disabled until streak progression is moved to server-side state.
        return;
    }

    async onWeeklyWarrior() {
        return;
    }

    // Achievement Checking Functions
    async checkAchievements() {
        console.log('🔍 Checking all achievements...');
        
        try {
            // Check game master achievements (total games played)
            await this.checkGameMasterAchievements();
            
            // Check total points achievements
            await this.checkTotalPointsAchievements();
            
            // Check time-based achievements
            await this.checkTimeBasedAchievements();
            
            // Check special achievements
            await this.checkSpecialAchievements();
            
            // Check progress achievements
            await this.checkProgressAchievements();
            
            console.log('✅ Achievement check completed');
        } catch (error) {
            console.error('❌ Error checking achievements:', error);
        }
    }

    async checkGameMasterAchievements() {
        // Total games achievements
        const totalGames = this.userStats.total_games_played || 0;
        if (totalGames >= 10) await this.unlockAchievement('games_10');
        if (totalGames >= 25) await this.unlockAchievement('games_25');
        if (totalGames >= 50) await this.unlockAchievement('games_50');
        if (totalGames >= 100) await this.unlockAchievement('games_100');
        if (totalGames >= 250) await this.unlockAchievement('games_250');
        if (totalGames >= 500) await this.unlockAchievement('games_500');
    }

    async checkIndividualGameAchievements(gameId) {
        // Check individual game achievements based on the specific game
        const gameKey = `${gameId}_games`;
        const gameCount = this.userStats[gameKey] || 0;
        
        // Block Dodger achievements
        if (gameId === 'block_dodger') {
            if (gameCount >= 1) await this.unlockAchievement('block_dodger_1');
            if (gameCount >= 5) await this.unlockAchievement('block_dodger_5');
            if (gameCount >= 10) await this.unlockAchievement('block_dodger_10');
            if (gameCount >= 25) await this.unlockAchievement('block_dodger_25');
            if (gameCount >= 50) await this.unlockAchievement('block_dodger_50');
            if (gameCount >= 100) await this.unlockAchievement('block_dodger_100');
        }
        
        // Neon Racer achievements
        if (gameId === 'neon_racer') {
            if (gameCount >= 1) await this.unlockAchievement('neon_racer_1');
            if (gameCount >= 5) await this.unlockAchievement('neon_racer_5');
            if (gameCount >= 10) await this.unlockAchievement('neon_racer_10');
            if (gameCount >= 25) await this.unlockAchievement('neon_racer_25');
            if (gameCount >= 50) await this.unlockAchievement('neon_racer_50');
            if (gameCount >= 100) await this.unlockAchievement('neon_racer_100');
        }
        
        // Ape-Man achievements
        if (gameId === 'ape_man') {
            if (gameCount >= 1) await this.unlockAchievement('ape_man_1');
            if (gameCount >= 5) await this.unlockAchievement('ape_man_5');
            if (gameCount >= 10) await this.unlockAchievement('ape_man_10');
            if (gameCount >= 25) await this.unlockAchievement('ape_man_25');
            if (gameCount >= 50) await this.unlockAchievement('ape_man_50');
            if (gameCount >= 100) await this.unlockAchievement('ape_man_100');
        }
        
        // Galaxy Ape achievements
        if (gameId === 'galaxy_ape') {
            if (gameCount >= 1) await this.unlockAchievement('galaxy_ape_1');
            if (gameCount >= 5) await this.unlockAchievement('galaxy_ape_5');
            if (gameCount >= 10) await this.unlockAchievement('galaxy_ape_10');
            if (gameCount >= 25) await this.unlockAchievement('galaxy_ape_25');
            if (gameCount >= 50) await this.unlockAchievement('galaxy_ape_50');
            if (gameCount >= 100) await this.unlockAchievement('galaxy_ape_100');
        }
        
        // Flappy Ape achievements
        if (gameId === 'flappy_ape') {
            if (gameCount >= 1) await this.unlockAchievement('flappy_ape_1');
            if (gameCount >= 5) await this.unlockAchievement('flappy_ape_5');
            if (gameCount >= 10) await this.unlockAchievement('flappy_ape_10');
            if (gameCount >= 25) await this.unlockAchievement('flappy_ape_25');
            if (gameCount >= 50) await this.unlockAchievement('flappy_ape_50');
            if (gameCount >= 100) await this.unlockAchievement('flappy_ape_100');
        }
    }

    async checkScoreAchievements(score) {
        console.log('🎯 Checking score achievements for score:', score);
        
        // Single game score achievements - Updated for 10k max score
        if (score >= 500) {
            console.log('🏆 Score 500+ achieved, unlocking score_500');
            await this.unlockAchievement('score_500');
        }
        if (score >= 1000) {
            console.log('🏆 Score 1000+ achieved, unlocking score_1k');
            await this.unlockAchievement('score_1k');
        }
        if (score >= 2000) {
            console.log('🏆 Score 2000+ achieved, unlocking score_2k');
            await this.unlockAchievement('score_2k');
        }
        if (score >= 5000) {
            console.log('🏆 Score 5000+ achieved, unlocking score_5k');
            await this.unlockAchievement('score_5k');
        }
        if (score >= 10000) {
            console.log('🏆 Score 10000+ achieved, unlocking score_10k');
            await this.unlockAchievement('score_10k');
        }

        // Update total points and check cumulative achievements
        this.userStats.total_points = (this.userStats.total_points || 0) + score;
        await this.checkTotalPointsAchievements();

        // First score achievement
        if (score > 0 && !this.unlockedAchievements.has('first_score')) {
            console.log('🏆 First score achieved, unlocking first_score');
            await this.unlockAchievement('first_score');
        }
    }

    getCurrentGameId() {
        // Try to determine current game from URL or global variables
        const path = window.location.pathname;
        if (path.includes('block-dodger')) return 'block_dodger';
        if (path.includes('neon-racer')) return 'neon_racer';
        if (path.includes('ape-man')) return 'ape_man';
        if (path.includes('flappy-ape')) return 'flappy_ape';
        if (path.includes('galaxy-ape')) return 'galaxy_ape';
        
        // Fallback: check for game-specific elements or variables
        if (window.gameConfig && window.gameConfig.gameId) {
            return window.gameConfig.gameId;
        }
        
        return 'unknown';
    }

    async checkSpecialAchievements() {
        // Special achievements are now handled separately through specific event triggers
        // No time-based special achievements in the simplified system
    }

    async checkProgressAchievements() {
        // Progress achievements are now handled by consecutive days and endurance tests
        // which are checked in their respective functions
    }

    async checkTotalPointsAchievements() {
        const totalPoints = this.userStats.total_points || 0;
        if (totalPoints >= 5000) await this.unlockAchievement('points_5k');
        if (totalPoints >= 25000) await this.unlockAchievement('points_25k');
        if (totalPoints >= 50000) await this.unlockAchievement('points_50k');
        if (totalPoints >= 100000) await this.unlockAchievement('points_100k');
        if (totalPoints >= 250000) await this.unlockAchievement('points_250k');
        if (totalPoints >= 500000) await this.unlockAchievement('points_500k');
        if (totalPoints >= 1000000) await this.unlockAchievement('points_1000k');
    }

    async checkTimeBasedAchievements() {
        const now = Date.now();
        const sessionDuration = (now - this.sessionStats.sessionStartTime) / (1000 * 60); // minutes

        // Endurance test - 2 hours continuous play
        if (sessionDuration >= 120) {
            await this.unlockAchievement('endurance_test');
        }

        // Check for daily play tracking
        const today = new Date().toDateString();
        if (!this.sessionStats.dailyStats[today]) {
            this.sessionStats.dailyStats[today] = true;
            await this.checkConsecutiveDays();
        }
    }

    async checkConsecutiveDays() {
        return;
    }

    async checkApeCollectionAchievements() {
        // Check ape collection achievements based on wallet
        try {
            const walletAddress = getCanonicalArcadeWallet();
            if (!walletAddress) return;

            // Get NFT count from wallet or stored data
            // This would typically involve checking the actual wallet NFT count
            // For now, we'll use a stored count that gets updated when NFTs are connected
            const apeCount = parseInt(localStorage.getItem('apeCount') || '0');
            
            if (apeCount >= 1) await this.unlockAchievement('ape_collector_1');
            if (apeCount >= 5) await this.unlockAchievement('ape_collector_5');
            if (apeCount >= 10) await this.unlockAchievement('ape_collector_10');
            if (apeCount >= 20) await this.unlockAchievement('ape_collector_20');
            if (apeCount >= 30) await this.unlockAchievement('ape_collector_30');
            if (apeCount >= 40) await this.unlockAchievement('ape_collector_40');
            if (apeCount >= 50) await this.unlockAchievement('ape_collector_50');
        } catch (error) {
            console.warn('Could not check ape collection achievements:', error);
        }
    }

    getConsecutiveDaysFromStorage() {
        return 0;
    }

    async checkGameAchievements(gameId) {
        // Game Hopper achievement is now handled in onGameHopper() method
        // This method can be used for other game-related achievements in the future
        console.log('🎮 Checking game achievements for:', gameId);
    }

    // Achievement Unlocking
    async unlockAchievement(achievementId) {
        if (this.unlockedAchievements.has(achievementId)) {
            console.log(`⚠️ Achievement ${achievementId} already unlocked`);
            return; // Already unlocked
        }

        const achievement = this.achievements.get(achievementId);
        if (!achievement) {
            console.warn('⚠️ Achievement not found:', achievementId);
            return;
        }

        console.log('🎉 Unlocking achievement:', achievement.name);
        
        this.unlockedAchievements.add(achievementId);

        // Award XP
        if (achievement.reward_xp > 0) {
            console.log(`💰 Awarding ${achievement.reward_xp} XP for achievement`);
            await this.addExperience(achievement.reward_xp, `achievement_${achievementId}`);
        }

        // Save to database (only if user is connected)
        if (this.currentUser) {
            try {
                const response = await fetch('/api/achievements/unlock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wallet_address: this.currentUser,
                        achievement_id: achievementId,
                        ...getArcadeGlyphSessionPayload()
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Achievement saved to database:', result);
                } else {
                    console.warn('⚠️ Failed to save achievement to database, status:', response.status);
                }
            } catch (error) {
                console.error('❌ Failed to save achievement:', error);
            }
        } else {
            console.log('⚠️ No wallet connected, achievement not saved to database');
        }

        // Show notification
        this.showAchievementNotification(achievement);
    }

    // UI Functions
    showAchievementNotification(achievement) {
        // Add CSS if not already present
        this.addNotificationStyles();
        
        // Create achievement notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-popup">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    <div class="achievement-xp">+${achievement.reward_xp} XP</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Play sound effect (if available)
        this.playAchievementSound();
    }

    addNotificationStyles() {
        if (document.getElementById('achievement-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'achievement-styles';
        styles.textContent = `
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
                border: 2px solid #f7931e;
                border-radius: 12px;
                padding: 15px;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                transform: translateX(24px);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
                font-family: 'Press Start 2P', monospace;
                color: white;
                box-sizing: border-box;
                width: min(400px, calc(100vw - 32px));
                max-width: calc(100vw - 32px);
                pointer-events: none;
            }
            
            .achievement-notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .achievement-popup {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .achievement-icon {
                font-size: 32px;
                min-width: 40px;
                text-align: center;
            }
            
            .achievement-content {
                flex: 1;
            }
            
            .achievement-title {
                color: #f7931e;
                font-size: 10px;
                margin-bottom: 5px;
                text-transform: uppercase;
            }
            
            .achievement-name {
                font-size: 12px;
                margin-bottom: 5px;
                color: #ffd700;
            }
            
            .achievement-desc {
                font-size: 8px;
                margin-bottom: 5px;
                color: #e2e8f0;
                line-height: 1.3;
            }
            
            .achievement-xp {
                font-size: 10px;
                color: #48bb78;
                font-weight: bold;
            }
            
            .level-up-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                z-index: 10001;
                background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                border: 3px solid #f7931e;
                border-radius: 20px;
                padding: 30px;
                text-align: center;
                color: #2d3748;
                font-family: 'Press Start 2P', monospace;
                box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                transition: transform 0.4s ease;
            }
            
            .level-up-notification.show {
                transform: translate(-50%, -50%) scale(1);
            }
            
            .level-up-title {
                font-size: 24px;
                margin-bottom: 15px;
                color: #e53e3e;
                text-shadow: 2px 2px 0px #ffd700;
            }
            
            .level-up-levels {
                font-size: 32px;
                margin-bottom: 10px;
                color: #2d3748;
            }
            
            .level-up-congrats {
                font-size: 12px;
                color: #4a5568;
            }
        `;
        
        document.head.appendChild(styles);
    }

    showLevelUpNotification(oldLevel, newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-popup">
                <div class="level-up-title">LEVEL UP!</div>
                <div class="level-up-levels">${oldLevel} → ${newLevel}</div>
                <div class="level-up-congrats">Congratulations!</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);

        this.playLevelUpSound();
    }

    updateLevelDisplay() {
        // Update level display in UI elements
        const levelElements = document.querySelectorAll('.user-level');
        const xpElements = document.querySelectorAll('.user-xp');
        const progressElements = document.querySelectorAll('.user-progress');

        levelElements.forEach(el => el.textContent = `Level ${this.userStats.level}`);
        xpElements.forEach(el => el.textContent = `${this.userStats.experience} XP`);

        // Update progress bars
        const currentLevelXP = this.calculateRequiredXP(this.userStats.level);
        const nextLevelXP = this.calculateRequiredXP(this.userStats.level + 1);
        const progress = ((this.userStats.experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

        progressElements.forEach(el => {
            el.style.width = `${Math.min(progress, 100)}%`;
        });
    }

    // Utility Functions
    playAchievementSound() {
        // Play achievement sound if audio is enabled
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAL...');
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            // Ignore audio errors
        }
    }

    playLevelUpSound() {
        // Play level up sound if audio is enabled
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAL...');
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            // Ignore audio errors
        }
    }

    async saveGameStats(gameId, score, immediate = false) {
        await this.syncCurrentUserWithArcadeStorageIfNeeded();
        if (!this.currentUser) {
            console.log('⚠️ No wallet connected, skipping game stats save');
            return;
        }

        try {
            console.log(`💾 Saving game stats: ${gameId}, score: ${score}, immediate: ${immediate}`);
            
            // Debug: Show current game counts before save
            this.debugGameCounts();
            
            const requestData = {
                wallet_address: this.currentUser,
                game_id: gameId,
                score: score,
                total_points: this.userStats.total_points || 0,  // Send current total points, server will add the score
                total_games: this.userStats.total_games_played || 0,
                block_dodger_games: this.userStats.block_dodger_games || 0,
                neon_racer_games: this.userStats.neon_racer_games || 0,
                ape_man_games: this.userStats.ape_man_games || 0,
                flappy_ape_games: this.userStats.flappy_ape_games || 0,
                galaxy_ape_games: this.userStats.galaxy_ape_games || 0,
                clubroom_visits: this.userStats.clubroom_visits || 0,
                first_game_played: this.userStats.first_game_played,
                last_game_played: this.userStats.last_game_played,
                level: this.userStats.level || 1,
                experience: this.userStats.experience || 0,
                timestamp: new Date().toISOString(),
                ...getArcadeGlyphSessionPayload()
            };
            
            console.log('📤 Sending data to API:', requestData);
            
            const response = await fetch('/api/achievements/save_game_stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Game stats saved to database:', result);

                if (result.canonical_wallet && result.canonical_wallet !== this.currentUser) {
                    try {
                        var glyphWallet = getCanonicalArcadeWallet();
                        if (glyphWallet) localStorage.setItem('connectedWallet', glyphWallet);
                    } catch (e) { /* ignore */ }
                    this.currentUser = result.canonical_wallet;
                    await this.loadUserData();
                }
                
                // Sync local stats with server response to ensure consistency
                if (result.user_data) {
                    const ud = result.user_data;
                    this.userStats.level = ud.level ?? this.userStats.level;
                    this.userStats.experience = ud.experience ?? this.userStats.experience;
                    this.userStats.total_games_played = ud.total_games_played ?? this.userStats.total_games_played;
                    this.userStats.total_points = ud.total_points ?? this.userStats.total_points;
                    this.userStats.block_dodger_games = ud.block_dodger_games ?? this.userStats.block_dodger_games;
                    this.userStats.neon_racer_games = ud.neon_racer_games ?? this.userStats.neon_racer_games;
                    this.userStats.ape_man_games = ud.ape_man_games ?? this.userStats.ape_man_games;
                    this.userStats.flappy_ape_games = ud.flappy_ape_games ?? this.userStats.flappy_ape_games;
                    this.userStats.galaxy_ape_games = ud.galaxy_ape_games ?? this.userStats.galaxy_ape_games;
                    this.userStats.clubroom_visits = ud.clubroom_visits ?? this.userStats.clubroom_visits;
                    this.userStats.first_game_played = ud.first_game_played ?? this.userStats.first_game_played;
                    this.userStats.last_game_played = ud.last_game_played ?? this.userStats.last_game_played;
                    
                    // Update high scores if they exist
                    if (result.user_data[`${gameId}_score`]) {
                        this.userStats[`${gameId}_score`] = result.user_data[`${gameId}_score`];
                    }
                    
                    console.log('🔄 Synced local stats with server data');
                    
                    // Debug: Show game counts after sync
                    console.log('📊 Game counts after sync:');
                    this.debugGameCounts();
                    
                    // Trigger profile refresh if we're in the arcade menu
                    if (
                        typeof window !== 'undefined' &&
                        window.location &&
                        (window.location.pathname.includes('arcade-menu') ||
                            window.location.pathname === '/arcade' ||
                            window.location.pathname === '/arcade/')
                    ) {
                        // Delay to ensure database is updated
                        setTimeout(() => {
                            if (typeof loadProfileData === 'function' && this.currentUser) {
                                console.log('🔄 Refreshing profile data after game completion');
                                loadProfileData(this.currentUser);
                            }
                        }, 1000);
                    }
                }
                
                return result;
            } else {
                console.error('❌ Failed to save game stats:', response.status, response.statusText);
                return null;
            }
        } catch (error) {
            console.error('💥 Error saving game stats:', error);
            return null;
        }
    }

    /**
     * Unified game completion handler - all games should use this
     * @param {string} gameId - The game identifier (block_dodger, neon_racer, etc.)
     * @param {number} score - The final score achieved
     * @param {Object} options - Additional options
     * @param {boolean} options.success - Whether the game was completed successfully
     * @param {Function} options.onComplete - Callback function to call after processing
     * @param {Object} options.gameSpecificData - Any game-specific data for achievements
     */
    async completeGame(gameId, score, options = {}) {
        const { 
            success = true, 
            onComplete = null, 
            gameSpecificData = {} 
        } = options;

        console.log(`🎮 Game completed: ${gameId}, Score: ${score}, Success: ${success}`);

        try {
            // 1. Save game statistics (includes score, game counts, etc.)
            const saveResult = await this.saveGameStats(gameId, score, true);
            
            if (!saveResult) {
                console.error('❌ Failed to save game stats');
                if (onComplete) onComplete(false);
                return false;
            }

            // 2. Trigger achievement for game completion
            if (window.triggerAchievementEvent) {
                window.triggerAchievementEvent('gameEnd', { 
                    gameId: gameId,
                    score: score,
                    success: success,
                    ...gameSpecificData
                });
            }

            // 3. Check for score-based achievements
            if (score > 0) {
                // Trigger first score achievement if this is their first points
                if (window.triggerAchievementEvent && this.userStats.total_points === 0) {
                    window.triggerAchievementEvent('firstScore', { gameId, score });
                }

                // Trigger score milestone achievements
                const scoreMilestones = [1000, 5000, 10000, 25000, 50000];
                for (const milestone of scoreMilestones) {
                    if (score >= milestone) {
                        if (window.triggerAchievementEvent) {
                            window.triggerAchievementEvent('scoreMilestone', { 
                                gameId, 
                                score, 
                                milestone 
                            });
                        }
                    }
                }
            }

            // 4. Check for game-specific achievements
            const gameCountField = `${gameId}_games`;
            const gameCount = this.userStats[gameCountField] || 0;
            
            // Game master achievements
            const gameMilestones = [1, 10, 25, 50, 100];
            for (const milestone of gameMilestones) {
                if (gameCount >= milestone) {
                    if (window.triggerAchievementEvent) {
                        window.triggerAchievementEvent('gameMilestone', { 
                            gameId, 
                            gameCount, 
                            milestone 
                        });
                    }
                }
            }

            // 5. Check for total games milestones
            const totalGames = this.userStats.total_games_played || 0;
            const totalMilestones = [1, 10, 50, 100, 250, 1000];
            for (const milestone of totalMilestones) {
                if (totalGames >= milestone) {
                    if (window.triggerAchievementEvent) {
                        window.triggerAchievementEvent('totalGamesMilestone', { 
                            totalGames, 
                            milestone 
                        });
                    }
                }
            }

            console.log('✅ Game completion processing finished successfully');
            
            if (onComplete) onComplete(true, saveResult);
            return true;

        } catch (error) {
            console.error('💥 Error in completeGame:', error);
            if (onComplete) onComplete(false, null);
            return false;
        }
    }

    /**
     * Get user's high score for a specific game
     * @param {string} gameId - The game identifier
     * @returns {Promise<number>} The high score
     */
    async getUserHighScore(gameId) {
        if (!this.currentUser) return 0;

        try {
            const response = await fetch('/api/achievements/get_high_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: this.currentUser,
                    game_id: gameId,
                    ...getArcadeGlyphSessionPayload()
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
    }

    /**
     * Get user's rank in the leaderboard for a specific game
     * @param {string} gameId - The game identifier
     * @returns {Promise<Object>} Object with rank and total players
     */
    async getUserRank(gameId) {
        if (!this.currentUser) return { rank: 0, totalPlayers: 0 };

        try {
            const response = await fetch('/api/achievements/get_user_rank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: this.currentUser,
                    game_id: gameId,
                    ...getArcadeGlyphSessionPayload()
                })
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    rank: result.rank || 0,
                    totalPlayers: result.total_players || 0
                };
            } else {
                console.error('Failed to get user rank:', response.status);
                return { rank: 0, totalPlayers: 0 };
            }
        } catch (error) {
            console.error('Error getting user rank:', error);
            return { rank: 0, totalPlayers: 0 };
        }
    }

    setupEventListeners() {
        // Listen for custom achievement events
        document.addEventListener('achievementEvent', (event) => {
            const { type, data } = event.detail;
            this.handleAchievementEvent(type, data);
        });
    }

    async handleAchievementEvent(type, data) {
        switch (type) {
            case 'gameStart':
                await this.onGameStart(data.gameId);
                break;
            case 'gameEnd':
                await this.onGameEnd(data.gameId, data.score, data.success, data);
                break;
            case 'nftConnect':
                await this.onNFTConnect(data.apeCount);
                break;
            case 'clubroomVisit':
                await this.onClubroomVisit();
                break;
            case 'chatMessage':
                await this.onChatMessage();
                break;
            case 'musicPlay':
                await this.onMusicPlay();
                break;
            case 'musicChange':
                await this.onMusicChange();
                break;
            case 'welcome':
                await this.onWelcome();
                break;
            case 'firstScore':
                await this.onFirstScore();
                break;
            case 'bugReport':
                await this.onBugReport();
                break;
            case 'feedback':
                await this.onFeedback();
                break;
            case 'easterEgg':
                await this.onEasterEgg();
                break;
            case 'developerMessage':
                await this.onDeveloperMessage();
                break;
            case 'gameHopper':
                await this.onGameHopper();
                break;
            case 'enduranceTest':
                await this.onEnduranceTest();
                break;
            case 'dailyHabit':
                await this.onDailyHabit();
                break;
            case 'weeklyWarrior':
                await this.onWeeklyWarrior();
                break;
        }
    }

    // Public API
    getLevel() {
        return this.userStats.level;
    }

    getExperience() {
        return this.userStats.experience;
    }

    getAchievements() {
        return Array.from(this.unlockedAchievements);
    }

    getProgress() {
        const currentLevelXP = this.calculateRequiredXP(this.userStats.level);
        const nextLevelXP = this.calculateRequiredXP(this.userStats.level + 1);
        return {
            level: this.userStats.level,
            experience: this.userStats.experience,
            currentLevelXP,
            nextLevelXP,
            progress: ((this.userStats.experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
        };
    }

    // Handle wallet connection
    async onWalletConnect(walletAddress) {
        console.log('👛 Wallet connected, updating achievement system:', walletAddress);
        
        if (this.currentUser !== walletAddress) {
            // Clear existing data when switching wallets
            this.currentUser = walletAddress;
            this.unlockedAchievements.clear();
            this.initializeDefaultUserStats();
            
            // Load user data from database for the new wallet
            await this.loadUserData();
            
            // Check for welcome achievement
            if (!this.unlockedAchievements.has('welcome')) {
                console.log('🎉 First time user detected, unlocking welcome achievement');
                await this.unlockAchievement('welcome');
            }
            
            // Check for NFT collection achievements
            await this.onNFTConnect();
            
            // Update UI
            this.updateLevelDisplay();
            
            console.log('✅ Achievement system updated for new wallet connection');
        }
    }

    // Handle wallet disconnection
    onWalletDisconnect() {
        console.log('👛 Wallet disconnected, switching to local mode');
        this.currentUser = null;
        this.initializeDefaultUserStats();
        this.updateLevelDisplay();
        try {
            localStorage.removeItem('arcadeProfileAvatarUrl');
            localStorage.removeItem('arcadeProfileDisplayName');
            localStorage.removeItem('arcadeForeverApeId');
            localStorage.removeItem('arcadeForeverApeImageUrl');
        } catch (e) {}
    }

    // Force refresh user data from database
    async refreshUserData() {
        if (!this.currentUser) {
            console.log('⚠️ No wallet connected, skipping user data refresh');
            return;
        }

        try {
            console.log('🔄 Refreshing user data from server...');
            const response = await fetch('/api/achievements/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: this.currentUser,
                    ...getArcadeGlyphSessionPayload()
                })
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('📊 User data refreshed from database:', userData);
                if (typeof window.setArcadeProfileAvatarFromApi === 'function') {
                    window.setArcadeProfileAvatarFromApi(userData);
                }
                
                // Update local stats with fresh data from server
                this.userStats = {
                    level: userData.level || 1,
                    experience: userData.experience || 0,
                    total_games_played: userData.total_games_played || 0,
                    total_points: userData.total_points || 0,
                    block_dodger_games: userData.block_dodger_games || 0,
                    neon_racer_games: userData.neon_racer_games || 0,
                    ape_man_games: userData.ape_man_games || 0,
                    flappy_ape_games: userData.flappy_ape_games || 0,
                    galaxy_ape_games: userData.galaxy_ape_games || 0,
                    clubroom_visits: userData.clubroom_visits || 0,
                    messages_sent: userData.messages_sent || 0,
                    reactions_sent: userData.reactions_sent || 0,
                    nft_count: userData.nft_count || 0,
                    first_game_played: userData.first_game_played,
                    last_game_played: userData.last_game_played
                };
                
                console.log('✅ User data refreshed successfully');
            } else {
                console.warn('⚠️ Failed to refresh user data, status:', response.status);
            }
        } catch (error) {
            console.error('❌ Failed to refresh user data:', error);
        }
    }

    clearSessionStats() {
        this.sessionStats = {
            gamesPlayed: 0,
            sessionsStartTime: Date.now(),
            gamesSwitched: new Set(),
            consecutiveGames: 0,
            lastGameTime: null,
            sessionStartTime: Date.now(),
            dailyStats: {},
            musicPlays: 0,
            musicChanges: 0,
            continuousPlayTime: 0,
            lastActivityTime: Date.now(),
            scoreStreak: 0,
            lastScore: 0,
            perfectGames: 0,
            settingsAccessed: false,
            profileUpdated: false
        };
        sessionStorage.removeItem('achievementSessionStats');
        console.log('🗑️ Session stats cleared');
    }

    async onClubroomVisit() {
        console.log('🏠 Clubroom visit detected');
        
        // Update local stats
        this.userStats.clubroom_visits = (this.userStats.clubroom_visits || 0) + 1;
        
        // Save to database using dedicated endpoint
        if (this.currentUser) {
            try {
                const response = await fetch('/api/achievements/update_clubroom_visits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wallet_address: this.currentUser,
                        clubroom_visits: this.userStats.clubroom_visits,
                        ...getArcadeGlyphSessionPayload()
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Clubroom visit saved to database:', result);
                } else {
                    console.warn('⚠️ Failed to save clubroom visit to database, status:', response.status);
                }
            } catch (error) {
                console.error('❌ Failed to save clubroom visit:', error);
            }
        }
    }

    async onChatMessage() {
        console.log('💬 Chat message sent');
        
        // Update local stats
        this.userStats.messages_sent = (this.userStats.messages_sent || 0) + 1;
        
        // Save to database
        if (this.currentUser) {
            try {
                const response = await fetch('/api/achievements/save_chat_message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wallet_address: this.currentUser,
                        messages_sent: this.userStats.messages_sent,
                        ...getArcadeGlyphSessionPayload()
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Chat message saved to database:', result);
                } else {
                    console.warn('⚠️ Failed to save chat message to database, status:', response.status);
                }
            } catch (error) {
                console.error('❌ Failed to save chat message:', error);
            }
        }
        
        // Award XP for social activity
        await this.addExperience(this.experienceValues.chat_message, 'chat_message');
    }

    async onMusicPlay() {
        console.log('🎵 Music played');
        
        // Update session stats
        this.sessionStats.musicPlays++;
        this.saveSessionStats();
    }

    async onMusicChange() {
        console.log('🎶 Music changed');
        
        // Update session stats
        this.sessionStats.musicChanges++;
        this.saveSessionStats();
    }

    // Debug function to show current game counts
    debugGameCounts() {
        console.log('🎮 Current Game Counts:');
        console.log('  - Total games played:', this.userStats.total_games_played);
        console.log('  - Block Dodger games:', this.userStats.block_dodger_games);
        console.log('  - Neon Racer games:', this.userStats.neon_racer_games);
        console.log('  - Ape Man games:', this.userStats.ape_man_games);
        console.log('  - Flappy Ape games:', this.userStats.flappy_ape_games);
        console.log('  - Galaxy Ape games:', this.userStats.galaxy_ape_games);
        console.log('  - Clubroom visits:', this.userStats.clubroom_visits);
    }
}

// Achievement System Singleton
window.AchievementSystem = window.AchievementSystem || new AchievementSystem();

// When the parent document updates `localStorage` (Glyph sync), iframe receives `storage` — resync wallet.
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', function (e) {
        if (!e.key || !['glyphEvmWallet', 'glyphUserId'].includes(e.key)) return;
        var sys = window.AchievementSystem;
        if (sys && typeof sys.syncCurrentUserWithArcadeStorageIfNeeded === 'function') {
            sys.syncCurrentUserWithArcadeStorageIfNeeded().catch(function () { /* ignore */ });
        }
    });
}

// Convenience functions for triggering events
window.triggerAchievementEvent = (type, data) => {
    document.dispatchEvent(new CustomEvent('achievementEvent', { detail: { type, data } }));
};

// Debug function for troubleshooting
window.debugAchievementSystem = () => {
    console.log('🔍 ACHIEVEMENT SYSTEM DEBUG:');
    console.log('Current user:', window.AchievementSystem.currentUser);
    console.log('User stats:', window.AchievementSystem.userStats);
    console.log('Unlocked achievements:', Array.from(window.AchievementSystem.unlockedAchievements));
    console.log('Connected wallet:', getCanonicalArcadeWallet());
    
    // Test database connection
    if (window.AchievementSystem.currentUser) {
        fetch('/api/achievements/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: window.AchievementSystem.currentUser })
        })
        .then(response => response.json())
        .then(data => {
            console.log('📊 Database user data:', data);
        })
        .catch(error => {
            console.error('❌ Database error:', error);
        });
    }
};

// Enhanced debug function with database testing
window.debugDatabaseOperations = async () => {
    console.log('🔍 DATABASE OPERATIONS DEBUG:');
    
    const system = window.AchievementSystem;
    if (!system || !system.currentUser) {
        console.error('❌ No achievement system or wallet connected');
        return;
    }

    const wallet = system.currentUser;
    console.log('👛 Testing with wallet:', wallet);

    // Test 1: Load user data
    console.log('📡 Test 1: Loading user data...');
    try {
        const response = await fetch('/api/achievements/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: wallet })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ User data loaded:', data);
        } else {
            console.error('❌ Failed to load user data, status:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
    }

    // Test 2: Save game stats
    console.log('💾 Test 2: Saving game stats...');
    try {
        const response = await fetch('/api/achievements/save_game_stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: wallet,
                game_id: 'debug_test',
                score: 1000,
                total_points: system.userStats.total_points || 0,
                total_games: system.userStats.total_games_played || 0,
                block_dodger_games: system.userStats.block_dodger_games || 0,
                neon_racer_games: system.userStats.neon_racer_games || 0,
                ape_man_games: system.userStats.ape_man_games || 0,
                flappy_ape_games: system.userStats.flappy_ape_games || 0,
                galaxy_ape_games: system.userStats.galaxy_ape_games || 0,
                clubroom_visits: system.userStats.clubroom_visits || 0,
                first_game_played: system.userStats.first_game_played,
                last_game_played: system.userStats.last_game_played,
                level: system.userStats.level || 1,
                experience: system.userStats.experience || 0,
                timestamp: new Date().toISOString(),
                ...getArcadeGlyphSessionPayload()
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Game stats saved:', data);
        } else {
            console.error('❌ Failed to save game stats, status:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Error saving game stats:', error);
    }

    // Test 3: Add experience
    console.log('📈 Test 3: Adding experience...');
    try {
        const response = await fetch('/api/achievements/add_experience', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: wallet,
                experience: 50,
                source: 'debug_test',
                ...getArcadeGlyphSessionPayload()
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Experience added:', data);
        } else {
            console.error('❌ Failed to add experience, status:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Error adding experience:', error);
    }

    // Test 4: Unlock achievement
    console.log('🏆 Test 4: Unlocking achievement...');
    try {
        const response = await fetch('/api/achievements/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: wallet,
                achievement_id: 'debug_test'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Achievement unlocked:', data);
        } else {
            console.error('❌ Failed to unlock achievement, status:', response.status);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Error unlocking achievement:', error);
    }

    console.log('🔍 Database debug completed');
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementSystem;
}

 