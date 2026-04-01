// Flappy Ape - Enhanced Game Module

/** Parse selected_ape whether it is an object or JSON string from DB */
function flappyParseSelectedApe(raw) {
    if (raw == null) return null;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return typeof raw === 'object' ? raw : null;
}

/** Resolve portrait URL from arcade / NFT shapes (image, image_url, metadata.image, ipfs, …) */
function flappyGetApePortraitUrl(ape) {
    const a = flappyParseSelectedApe(ape);
    if (!a || typeof a !== 'object') return null;

    let url =
        a.image ||
        a.imageUrl ||
        a.image_url ||
        a.pfp ||
        a.avatar ||
        a.profileImage ||
        a.url;

    const meta = a.metadata;
    if (!url && meta) {
        const m = typeof meta === 'string' ? flappyParseSelectedApe(meta) : meta;
        if (m && typeof m === 'object') {
            url = m.image || m.image_url || m.imageUrl;
        }
    }

    if (typeof url !== 'string') return null;
    url = url.trim();
    if (!url) return null;

    if (window.NFT && typeof window.NFT.normalizeIpfsUrl === 'function') {
        url = window.NFT.normalizeIpfsUrl(url);
    } else if (url.startsWith('ipfs://')) {
        url = 'https://ipfs.io/ipfs/' + url.replace(/^ipfs:\/\//i, '');
    }
    return url;
}

const Game = {
    canvas: null,
    ctx: null,
    
    // Game assets
    images: {
    bird: null,
        bg: null,
        fg: null,
        pipeNorth: null,
        pipeSouth: null
    },
    
    // Game state
    score: 0,
    highScore: 0,
    isGameOver: false,
    isPaused: false,
    
    // Enhanced game physics
    gravity: CONFIG.BIRD_GRAVITY,
    gap: CONFIG.PIPE_GAP,
    pipeSpeed: CONFIG.PIPE_SPEED,
    constant: 0,
    
    // Progressive difficulty
    difficultyLevel: 0,
    pipesPassedCount: 0,
    
    // Bird position and properties
    birdX: 50,
    birdY: 150,
    birdVelocity: 0,
    birdRadius: CONFIG.BIRD_SIZE / 2,
    birdWidth: 34,
    birdHeight: 24,
    birdSize: CONFIG.BIRD_SIZE,
    originalBirdSize: CONFIG.BIRD_SIZE,
    originalBirdRadius: CONFIG.BIRD_SIZE / 2,
    
    // Power-up system
    activePowerups: new Map(),
    powerups: [],
    doubleJumpAvailable: false,
    shieldActive: false,
    

    
    // Pipe array with enhanced properties
    pipes: [],
    pipePattern: 'normal',
    
    // Visual effects
    particles: [],
    screenShake: { intensity: 0, duration: 0 },
    backgroundColorIndex: 0,
    backgroundTransition: 0,
    
    // Wind system
    windForce: 0,
    windTimer: 0,
    windDirection: 1,
    
    // Performance tracking
    frameCount: 0,
    
    // Image loading status
    imagesLoaded: {
        bird: false,
        bg: false,
        fg: false,
        pipeNorth: false,
        pipeSouth: false
    },
    
    selectedApe: null,
    debug: CONFIG.DEBUG,
    gameStarted: false,
    
    // Initialize game
    async initialize() {
        console.log('Initializing Enhanced Flappy Ape game...');
        
        // Setup canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.GAME_WIDTH;
        this.canvas.height = CONFIG.GAME_HEIGHT;
        
        // Set initial bird dimensions
        this.birdWidth = 30;
        this.birdHeight = 30;
        this.birdSize = CONFIG.BIRD_SIZE;
        this.originalBirdSize = CONFIG.BIRD_SIZE;
        this.birdRadius = CONFIG.BIRD_SIZE / 2;
        this.originalBirdRadius = CONFIG.BIRD_SIZE / 2;
        
        // Load ape from localStorage
        await this.loadSelectedApe();
        
        // Try to load high score
        try {
        this.highScore = await Database.getUserBestScore();
        } catch (error) {
            console.error('Error loading game data:', error);
            this.highScore = 0;
        }
        
        // Set bird starting position
        this.resetGame();
        
        // Draw initial frame without starting game loop
        this.drawStatic();
        
        
    },
    
    // Reset game state
    async resetGame() {
        console.log('🔄 [Flappy Ape] Resetting game state...');
        
        // Reload selected ape from localStorage to pick up any changes
        await this.loadSelectedApe();
        
        // Reload the bird image with the updated selected ape
        this.reloadBirdImage();
        
        // Set bird starting position
        this.birdX = 50;
        this.birdY = this.canvas.height / 3;
        this.birdVelocity = 0;
        
        // Reset bird size
        this.birdSize = this.originalBirdSize;
        this.birdWidth = 30;
        this.birdHeight = 30;
        this.birdRadius = this.originalBirdRadius;
        
        // Reset difficulty
        this.difficultyLevel = 0;
        this.pipesPassedCount = 0;
        this.gravity = CONFIG.BIRD_GRAVITY;
        this.gap = CONFIG.PIPE_GAP;
        this.pipeSpeed = CONFIG.PIPE_SPEED;
        this.pipePattern = 'normal';
        
        // Reset power-ups
        this.activePowerups.clear();
        this.powerups = [];
        this.doubleJumpAvailable = false;
        this.shieldActive = false;
        

        
        // Reset pipes
        this.pipes = [];
        this.pipes.push({
            x: this.canvas.width,
            y: this.generatePipeY('normal'),
            passed: false,
            pattern: 'normal',
            moveOffset: 0,
            moveDirection: 1
        });
        
        // Reset visual effects
        this.particles = [];
        this.screenShake = { intensity: 0, duration: 0 };
        this.backgroundColorIndex = 0;
        this.backgroundTransition = 0;
        
        // Reset wind
        this.windForce = 0;
        this.windTimer = 0;
        this.windDirection = 1;
        
        // Reset counters
        this.frameCount = 0;
        this.score = 0;
        this.isGameOver = false;
        this.gameStarted = false;
        this.scoreSaved = false;
        this._drawRunning = false;
        
        // Reset listener flags to ensure proper event listener setup
        this.keyboardListenerAttached = false;
        this.touchListenerAttached = false;
        
        // Remove listener attributes from buttons to allow re-attachment
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.removeAttribute('data-listener-attached');
        }
        
        const menuReturnButton = document.getElementById('menuReturnButton');
        if (menuReturnButton) {
            menuReturnButton.removeAttribute('data-listener-attached');
        }
        
        // Track the last pipe's x position
        this.lastPipeX = this.canvas.width;
        
        // Update UI
        this.updateUI();
        
        console.log('✅ [Flappy Ape] Game state reset complete');
    },
    
    // Update difficulty based on pipes passed (every 5 pipes)
    updateDifficulty() {
        const newLevel = Math.floor(this.pipesPassedCount / 5);
        const maxLevel = CONFIG.DIFFICULTY.SPEED_MULTIPLIERS.length - 1;
        const level = Math.min(newLevel, maxLevel);
        
        if (level !== this.difficultyLevel) {
            this.difficultyLevel = level;
            
            // Update game parameters
            const speedMultiplier = CONFIG.DIFFICULTY.SPEED_MULTIPLIERS[level] || CONFIG.DIFFICULTY.SPEED_MULTIPLIERS[CONFIG.DIFFICULTY.SPEED_MULTIPLIERS.length - 1];
            const gapReduction = CONFIG.DIFFICULTY.GAP_REDUCTION[level] || CONFIG.DIFFICULTY.GAP_REDUCTION[CONFIG.DIFFICULTY.GAP_REDUCTION.length - 1];
            const gravityIncrease = CONFIG.DIFFICULTY.GRAVITY_INCREASE[level] || CONFIG.DIFFICULTY.GRAVITY_INCREASE[CONFIG.DIFFICULTY.GRAVITY_INCREASE.length - 1];
            
            this.pipeSpeed = CONFIG.PIPE_SPEED * speedMultiplier;
            this.gap = Math.max(100, CONFIG.PIPE_GAP - gapReduction); // Minimum gap of 100px
            this.gravity = CONFIG.BIRD_GRAVITY + gravityIncrease;
            
            // Update pipe pattern
            this.pipePattern = CONFIG.DIFFICULTY.PIPE_PATTERNS[level] || 'normal';
            
            // Visual feedback for difficulty increase
            this.addScreenShake(8, 500);
            this.spawnParticles(this.canvas.width / 2, this.canvas.height / 2, '#FF0000', 15);
            

        }
    },
    
    // Generate pipe Y position based on pattern
    generatePipeY(pattern, index = 0) {
        const pipeNorthHeight = this.imagesLoaded.pipeNorth ? this.images.pipeNorth.height : 242;
        const minY = -pipeNorthHeight + 40;
        const maxY = -100;
        const range = maxY - minY;
        
        switch (pattern) {
            case 'wave':
                return minY + (range / 2) + Math.sin(index * 0.5) * (range * 0.3);
            case 'zigzag':
                return minY + (index % 2 === 0 ? range * 0.3 : range * 0.7);
            case 'narrow':
                return minY + (range * 0.4) + (Math.random() - 0.5) * (range * 0.2);
            case 'extreme':
                return minY + Math.random() * range;
            default:
                return minY + Math.random() * range;
        }
    },
    
    // Spawn power-up
    spawnPowerup(x, y) {
        if (Math.random() < CONFIG.POWERUPS.SPAWN_CHANCE) {
            const types = Object.keys(CONFIG.POWERUPS.TYPES);
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.powerups.push({
                x: x,
                y: y,
                type: type,
                collected: false,
                pulse: 0
            });
        }
    },
    

    
    // Collect power-up
    collectPowerup(powerup) {
        const config = CONFIG.POWERUPS.TYPES[powerup.type];
        const duration = config.duration;
        
        // Set power-up active
        this.activePowerups.set(powerup.type, Date.now() + duration);
        
        // Apply immediate effects
        switch (powerup.type) {
            case 'SHIELD':
                this.shieldActive = true;
                break;
            case 'DOUBLE_JUMP':
                this.doubleJumpAvailable = true;
                break;
            case 'TINY_APE':
                this.birdSize = this.originalBirdSize * 0.5;
                this.birdWidth = 15;
                this.birdHeight = 15;
                break;
            case 'SLOWMO':
                // Handled in draw loop
                break;
            case 'COIN_MAGNET':
                // Handled in coin collection
                break;
        }
        
        // Visual feedback
        this.spawnParticles(powerup.x, powerup.y, config.color, 8);
        
        // Play sound if available
        if (typeof Sound !== 'undefined' && Sound.playSound) {
            Sound.playSound('score');
        }
        
        console.log(`Collected ${powerup.type} power-up!`);
    },
    
    // Update power-ups
    updatePowerups() {
        const currentTime = Date.now();
        
        // Check for expired power-ups
        for (const [type, expireTime] of this.activePowerups) {
            if (currentTime > expireTime) {
                this.activePowerups.delete(type);
                
                // Remove effects
                switch (type) {
                    case 'SHIELD':
                        this.shieldActive = false;
                        break;
                    case 'TINY_APE':
                        this.birdSize = this.originalBirdSize;
                        this.birdWidth = 30;
                        this.birdHeight = 30;
                        break;
                    case 'DOUBLE_JUMP':
                        this.doubleJumpAvailable = false;
                        break;
                }
                
                console.log(`${type} power-up expired`);
            }
        }
    },
    
    // Add screen shake effect
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    },
    
    // Spawn particle effects
    spawnParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 60,
                maxLife: 60,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    },
    
    // Update wind system
    updateWind() {
        if (!CONFIG.WIND.ENABLED) return;
        
        this.windTimer++;
        if (this.windTimer >= CONFIG.WIND.CHANGE_FREQUENCY) {
            this.windTimer = 0;
            this.windDirection = Math.random() > 0.5 ? 1 : -1;
            this.windForce = (Math.random() - 0.5) * CONFIG.WIND.MAX_FORCE * 2;
        }
    },
    
    // Update UI elements
    updateUI() {
        // Update score display
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    },
    
    // Draw static frame (for initial display before game starts)
    drawStatic() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = CONFIG.BACKGROUND.SKY;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        if (this.imagesLoaded.bg) {
            this.ctx.drawImage(this.images.bg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback background with gradient
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, CONFIG.BACKGROUND.SKY);
            gradient.addColorStop(1, '#E0F6FF');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Simple clouds
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(80, 80, 20, 0, Math.PI * 2);
            this.ctx.arc(100, 70, 25, 0, Math.PI * 2);
            this.ctx.arc(120, 85, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // Bird (same center + clip as drawBird during gameplay)
        this.drawBird();
    },
    
    // Load selected ape from localStorage
    async loadSelectedApe() {
        console.log('🎮 [Flappy Ape] Loading selected ape...');
        try {
            if (typeof window.whenArcadeProfileAvatarReady === 'function') {
                // Do not block game startup on slow profile/network calls.
                await Promise.race([
                    window.whenArcadeProfileAvatarReady(),
                    new Promise((resolve) => setTimeout(resolve, 1200)),
                ]);
            }
        } catch (e) {
            /* non-fatal */
        }
        try {
            // Use the global function to load from database
            if (window.NFT && window.NFT.loadSelectedApeForGame) {
                console.log('🎮 [Flappy Ape] Calling NFT.loadSelectedApeForGame()...');
                const apeData = await window.NFT.loadSelectedApeForGame();
                console.log('🎮 [Flappy Ape] NFT.loadSelectedApeForGame() returned:', apeData);
                
                if (apeData) {
                    this.selectedApe = flappyParseSelectedApe(apeData) || apeData;
                    console.log('🎮 [Flappy Ape] Loaded selected ape from database:', this.selectedApe);
                    
                    // Load images after getting the selected ape
                    this.loadImages();
                } else {
                    console.log('🎮 [Flappy Ape] No selected ape found, using default');
                    // Load images with default ape
                    this.loadImages();
                }
            } else {
                console.log('🎮 [Flappy Ape] NFT module not available, using localStorage fallback');
                // Fallback to localStorage if NFT module not available
            const savedApe = localStorage.getItem('selectedApe');
            if (savedApe) {
                try {
                    const parsed = JSON.parse(savedApe);
                    this.selectedApe = flappyParseSelectedApe(parsed) || parsed;
                } catch (e) {
                    this.selectedApe = null;
                }
                    console.log('🎮 [Flappy Ape] Loaded selected ape from localStorage:', this.selectedApe);
            } else {
                    console.log('🎮 [Flappy Ape] No selected ape found in localStorage, using default');
                }
                
                // Load images
                this.loadImages();
            }
        } catch (error) {
            console.error('🎮 [Flappy Ape] Error loading selected ape:', error);
            // Load images with default ape on error
            this.loadImages();
        }
    },
    
    // Load game images
    loadImages() {
        const tryArcadeLoadingGameReady = () => {
            const g = this.imagesLoaded;
            if (g.bird && g.bg && g.fg && g.pipeNorth && g.pipeSouth) {
                if (window.ArcadeLoading && typeof window.ArcadeLoading.gameReady === 'function') {
                    window.ArcadeLoading.gameReady();
                }
            }
        };

        console.log('🎮 [Flappy Ape] Loading images...');
        console.log('🎮 [Flappy Ape] Selected ape data:', this.selectedApe);
        
        // Load bird (ape) image — prefer site profile PFP from `/api/achievements/user`
        this.images.bird = new Image();
        const profileUrl =
            typeof window !== 'undefined' && window.getArcadePlayableAvatarUrl
                ? window.getArcadePlayableAvatarUrl()
                : typeof window !== 'undefined' && window.getArcadeProfilePortraitUrl
                  ? window.getArcadeProfilePortraitUrl()
                  : null;
        const portraitUrl = profileUrl || flappyGetApePortraitUrl(this.selectedApe);
        const apeImageUrl = portraitUrl || 'images/ape.png';
        this.images.bird.src = apeImageUrl;
        console.log('Loading selected ape image:', apeImageUrl, portraitUrl ? '(portrait)' : '(default)');
        
        this.images.bird.onload = () => {
            console.log('🎮 [Flappy Ape] Bird image loaded successfully');
            this.imagesLoaded.bird = true;
            this.drawStatic(); // Redraw when image loads
            tryArcadeLoadingGameReady();
        };
        
        this.images.bird.onerror = () => {
            console.warn('Failed to load selected ape image, using placeholder.png');
            // Fallback to placeholder.png in the project root
            this.images.bird.onerror = null; // Prevent infinite loop if placeholder fails
            this.images.bird.src = '/placeholder.png';
            this.images.bird.onload = () => {
                this.imagesLoaded.bird = true;
                this.drawStatic();
                tryArcadeLoadingGameReady();
            };
            this.images.bird.onerror = () => {
                // If placeholder also fails, fallback to default ape image
                console.error('Failed to load placeholder.png, using default ape image');
                this.images.bird.src = 'images/ape.png';
                this.images.bird.onload = () => {
                    this.imagesLoaded.bird = true;
                    this.drawStatic();
                    tryArcadeLoadingGameReady();
                };
            };
        };
        
        // Load background
        this.images.bg = new Image();
        this.images.bg.src = 'images/bg.png?v=' + Date.now();
        this.images.bg.onload = () => {
            this.imagesLoaded.bg = true;
            this.drawStatic();
            tryArcadeLoadingGameReady();
        };
        this.images.bg.onerror = () => {
            console.error('Failed to load background image');
            this.imagesLoaded.bg = false;
        };
        
        // Load foreground
        this.images.fg = new Image();
        this.images.fg.src = 'images/fg.png';
        this.images.fg.onload = () => {
            this.imagesLoaded.fg = true;
            tryArcadeLoadingGameReady();
        };
        this.images.fg.onerror = () => {
            console.error('Failed to load foreground image');
            this.imagesLoaded.fg = false;
        };
        
        // Load pipe images
        this.images.pipeNorth = new Image();
        this.images.pipeNorth.src = 'images/pipeNorth.png';
        this.images.pipeNorth.onload = () => {
            this.imagesLoaded.pipeNorth = true;
            tryArcadeLoadingGameReady();
        };
        this.images.pipeNorth.onerror = () => {
            console.error('Failed to load north pipe image');
            this.imagesLoaded.pipeNorth = false;
        };
        
        this.images.pipeSouth = new Image();
        this.images.pipeSouth.src = 'images/pipeSouth.png';
        this.images.pipeSouth.onload = () => {
            this.imagesLoaded.pipeSouth = true;
            tryArcadeLoadingGameReady();
        };
        this.images.pipeSouth.onerror = () => {
            console.error('Failed to load south pipe image');
            this.imagesLoaded.pipeSouth = false;
        };

        setTimeout(() => tryArcadeLoadingGameReady(), 0);
    },
    
    // Start the game
    async startGame() {
        console.log('🎮 [Flappy Ape] Starting game...');
        
        // Prevent multiple game loops from running
        if (this.gameStarted && !this.isGameOver) {
            console.log('🎮 [Flappy Ape] Game already running, skipping start');
            return;
        }
        
        // Ensure any existing game loop is stopped
        this.isGameOver = true;
        this._drawRunning = false;
        
        // Wait a frame to ensure cleanup
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Always reset the game state when starting
        await this.resetGame();
        
        this.gameStarted = true;
        this.isGameOver = false; // Ensure this is explicitly set
        
        console.log('🎮 [Flappy Ape] Game state reset, starting draw loop...');
        this.draw(); // Start the game loop
        
        // Trigger achievement for game start
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameStart', { gameId: 'flappy_ape' });
        }
    },
    
    // Enhanced main draw function (game loop)
    draw() {
        try {
            // Prevent multiple game loops from running
            if (this._drawRunning) {
                console.warn('🔄 [Flappy Ape] Draw loop already running, skipping');
                return;
            }
            this._drawRunning = true;
            
        if (this.isPaused || !this.canvas || !this.ctx) {
                this._drawRunning = false;
            requestAnimationFrame(() => this.draw());
            return;
        }
        
        // Increment frame counter
        this.frameCount++;
        
        // Apply screen shake effect
        let shakeX = 0, shakeY = 0;
        if (this.screenShake.duration > 0) {
            shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.duration -= 16; // Assuming 60fps
        }
        
        // Save context for shake effect
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        // Slow motion effect
        const slowMoActive = this.activePowerups.has('SLOWMO');
        const timeMultiplier = slowMoActive ? 0.5 : 1.0;
        
        // Dynamic background color transition
        if (this.gameStarted && this.frameCount % 300 === 0) {
            this.backgroundTransition += CONFIG.EFFECTS.BACKGROUND_TRANSITION.SPEED;
            if (this.backgroundTransition >= 1) {
                this.backgroundColorIndex = (this.backgroundColorIndex + 1) % CONFIG.EFFECTS.BACKGROUND_TRANSITION.COLORS.length;
                this.backgroundTransition = 0;
            }
        }
        
        // Clear canvas with dynamic background
        const currentBgColor = CONFIG.EFFECTS.BACKGROUND_TRANSITION.COLORS[this.backgroundColorIndex];
        const nextBgColor = CONFIG.EFFECTS.BACKGROUND_TRANSITION.COLORS[(this.backgroundColorIndex + 1) % CONFIG.EFFECTS.BACKGROUND_TRANSITION.COLORS.length];
        
        if (this.backgroundTransition > 0) {
            // Interpolate between colors
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, this.interpolateColor(currentBgColor, nextBgColor, this.backgroundTransition));
            gradient.addColorStop(1, '#E0F6FF');
            this.ctx.fillStyle = gradient;
        } else {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, currentBgColor);
            gradient.addColorStop(1, '#E0F6FF');
            this.ctx.fillStyle = gradient;
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background image
        if (this.imagesLoaded.bg && this.images.bg.complete) {
            this.ctx.globalAlpha = 0.8;
            this.ctx.drawImage(this.images.bg, 0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        } else {
            // Animated clouds
            this.drawAnimatedClouds();
        }
        
        // Draw wind indicator
        if (CONFIG.WIND.ENABLED && CONFIG.WIND.VISUAL_INDICATOR && Math.abs(this.windForce) > 0.05) {
            this.drawWindIndicator();
        }
        
        // Update systems
        if (this.gameStarted) {
            this.updateDifficulty();
            this.updatePowerups();
            this.updateWind();
        }
        
        // Get pipe dimensions
        const pipeNorthHeight = this.imagesLoaded.pipeNorth ? this.images.pipeNorth.height : 242;
        const pipeWidth = this.imagesLoaded.pipeNorth ? this.images.pipeNorth.width : CONFIG.PIPE_WIDTH;
        this.constant = pipeNorthHeight + this.gap;
        
        // Process pipes
        for (let i = 0; i < this.pipes.length; i++) {
            const pipe = this.pipes[i];
            
            // Handle moving pipes
            if (pipe.pattern === 'moving' || this.pipePattern === 'moving') {
                pipe.moveOffset += pipe.moveDirection * 0.5 * timeMultiplier;
                if (Math.abs(pipe.moveOffset) > 30) {
                    pipe.moveDirection *= -1;
                }
            }
            
            const pipeY = pipe.y + (pipe.moveOffset || 0);
            
            // Draw pipes with enhanced visuals
            if (this.imagesLoaded.pipeNorth && this.imagesLoaded.pipeSouth) {
                // Add glow effect for special patterns
                if (pipe.pattern !== 'normal' || this.pipePattern !== 'normal') {
                    this.ctx.shadowColor = '#00FF00';
                    this.ctx.shadowBlur = 10;
                }
                
                this.ctx.drawImage(this.images.pipeNorth, pipe.x, pipeY);
                this.ctx.drawImage(this.images.pipeSouth, pipe.x, pipeY + this.constant);
                
                // Reset shadow
                this.ctx.shadowBlur = 0;
            } else {
                // Enhanced fallback pipes
                const gradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
                gradient.addColorStop(0, CONFIG.PIPE_COLOR);
                gradient.addColorStop(0.5, '#66BB6A');
                gradient.addColorStop(1, CONFIG.PIPE_COLOR);
                this.ctx.fillStyle = gradient;
                
                this.ctx.fillRect(pipe.x, pipeY, pipeWidth, pipeNorthHeight);
                this.ctx.fillRect(pipe.x, pipeY + this.constant, pipeWidth, this.canvas.height);
            }
            
            // Move pipes only when game is started
            if (this.gameStarted) {
                pipe.x -= this.pipeSpeed * timeMultiplier;
                
                // Track the last pipe for spawning purposes
                if (i === this.pipes.length - 1) {
                    this.lastPipeX = pipe.x;
                }
                
                // Spawn new pipes
                const pipeSpacing = 200;
                if (this.lastPipeX <= this.canvas.width - pipeSpacing && i === this.pipes.length - 1) {
                    const pipeIndex = this.pipes.length;
                    const newPipeY = this.generatePipeY(this.pipePattern, pipeIndex);
                    
                    const newPipe = {
                        x: this.canvas.width,
                        y: newPipeY,
                        passed: false,
                        pattern: this.pipePattern,
                        moveOffset: 0,
                        moveDirection: 1
                    };
                    
                    this.pipes.push(newPipe);
                    
                    // Spawn power-ups
                    this.spawnPowerup(this.canvas.width + 25, newPipeY + this.gap / 2);
                }
                
                // Score when pipe is passed
                if (!pipe.passed && pipe.x + pipeWidth < this.birdX) {
                    // Calculate points: 50 base points * level speed multiplier
                    const basePoints = 50;
                    const levelMultiplier = CONFIG.DIFFICULTY.SPEED_MULTIPLIERS[this.difficultyLevel] || 1.0;
                    const points = Math.floor(basePoints * levelMultiplier);
                    
                    const oldScore = this.score;
                    this.score += points;
                    this.pipesPassedCount++; // Increment pipes passed counter
                    pipe.passed = true;
                    
                    // Check for first score achievement
                    if (oldScore === 0 && this.score > 0 && window.triggerAchievementEvent) {
                        window.triggerAchievementEvent('firstScore', {});
                    }
                    
                    // Visual feedback
                    this.spawnParticles(this.birdX, this.birdY, '#FFD700', 5);
                    
                    // Update UI
                    this.updateUI();
                }
            }
            
            // Remove off-screen pipes
            if (pipe.x + pipeWidth < 0) {
                this.pipes.splice(i, 1);
                i--;
                continue;
            }
            
            // Collision detection
                if (this.gameStarted && !this.isGameOver) {
                    if (this.checkCollision(pipe.x, pipeY, pipeWidth, pipeNorthHeight)) {
                        // Handle collision
                        if (!this.shieldActive) {
                            console.log('🎮 [Flappy Ape] Collision detected!');
                    this.gameOver();
                            return; // Exit draw loop immediately
                        } else {
                            console.log('🎮 [Flappy Ape] Shield protected from collision!');
                            this.shieldActive = false;
                            this.activePowerups.delete('SHIELD');
                            this.spawnParticles(this.birdX, this.birdY, '#00FFFF', 10);
                        }
                    }
                }
            }
        
        // Update bird physics
            if (this.gameStarted && !this.isGameOver) {
                // Apply gravity
                this.birdVelocity += this.gravity;
                
            // Apply wind effect
            if (CONFIG.WIND.ENABLED) {
                    this.birdVelocity += this.windForce * 0.1;
            }
            
                // Update bird position
                this.birdY += this.birdVelocity;
            
                // Check for ground collision
                if (this.birdY + this.birdRadius > this.canvas.height - 100) {
                if (!this.shieldActive) {
                        console.log('🎮 [Flappy Ape] Ground collision detected!');
                this.gameOver();
                        return; // Exit draw loop immediately
                    } else {
                        console.log('🎮 [Flappy Ape] Shield protected from ground collision!');
                        this.shieldActive = false;
                        this.activePowerups.delete('SHIELD');
                        this.birdY = this.canvas.height - 100 - this.birdRadius;
                        this.birdVelocity = 0;
                        this.spawnParticles(this.birdX, this.birdY, '#00FFFF', 10);
            }
        }
                
                // Check for ceiling collision
                if (this.birdY - this.birdRadius < 0) {
                    this.birdY = this.birdRadius;
                    this.birdVelocity = 0;
                }
            }
            
            // Draw power-ups
            this.drawPowerups(timeMultiplier);
            
            // Draw particles
            this.drawParticles();
            
            // Draw bird
            this.drawBird();
        
        // Draw UI overlays
        this.drawUIOverlays();
        
        // Restore context
        this.ctx.restore();
        
        // Continue game loop
        if (!this.isGameOver) {
                this._drawRunning = false;
            requestAnimationFrame(() => this.draw());
            } else {
                this._drawRunning = false;
            }
        } catch (error) {
            console.error('❌ [Flappy Ape] Critical error in draw loop:', error);
            console.error('❌ [Flappy Ape] Error stack:', error.stack);
            console.error('❌ [Flappy Ape] Game state at crash:', {
                gameStarted: this.gameStarted,
                isGameOver: this.isGameOver,
                isPaused: this.isPaused,
                frameCount: this.frameCount,
                score: this.score,
                birdX: this.birdX,
                birdY: this.birdY,
                pipesLength: this.pipes.length
            });
            
            // Reset draw flag
            this._drawRunning = false;
            
            // Try to recover by stopping the game
            this.isGameOver = true;
            this.gameStarted = false;
            
            // Show emergency game over screen
            this.showEmergencyGameOver();
        }
    },
    
    // Helper drawing methods
    interpolateColor(color1, color2, factor) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    drawAnimatedClouds() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.globalAlpha = 0.6;
        
        // Animated clouds that move based on frame count
        const cloudOffset = (this.frameCount * 0.2) % 400;
        
        for (let i = 0; i < 3; i++) {
            const x = (i * 150 - cloudOffset) % (this.canvas.width + 100);
            const y = 60 + i * 30;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 15 + i * 3, 0, Math.PI * 2);
            this.ctx.arc(x + 15, y - 5, 20 + i * 2, 0, Math.PI * 2);
            this.ctx.arc(x + 30, y, 18 + i * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
    },
    
    drawWindIndicator() {
        const windStrength = Math.abs(this.windForce) / CONFIG.WIND.MAX_FORCE;
        const alpha = windStrength * 0.7;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Wind direction arrow
        const centerX = this.canvas.width - 40;
        const centerY = 40;
        const arrowSize = 15;
        
        this.ctx.strokeStyle = this.windForce > 0 ? '#FF6B6B' : '#4ECDC4';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        if (this.windForce > 0) {
            // Right wind
            this.ctx.moveTo(centerX - arrowSize, centerY);
            this.ctx.lineTo(centerX + arrowSize, centerY);
            this.ctx.moveTo(centerX + arrowSize - 5, centerY - 5);
            this.ctx.lineTo(centerX + arrowSize, centerY);
            this.ctx.lineTo(centerX + arrowSize - 5, centerY + 5);
        } else {
            // Left wind
            this.ctx.moveTo(centerX + arrowSize, centerY);
            this.ctx.lineTo(centerX - arrowSize, centerY);
            this.ctx.moveTo(centerX - arrowSize + 5, centerY - 5);
            this.ctx.lineTo(centerX - arrowSize, centerY);
            this.ctx.lineTo(centerX - arrowSize + 5, centerY + 5);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    },
    

    
    drawPowerups(timeMultiplier) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            if (powerup.collected) continue;
            
            // Move powerup
            powerup.x -= this.pipeSpeed * timeMultiplier;
            powerup.pulse += 0.15;
            
            // Check collection
            const distToBird = Math.sqrt(
                Math.pow(powerup.x - (this.birdX + this.birdSize/2), 2) + 
                Math.pow(powerup.y - (this.birdY + this.birdSize/2), 2)
            );
            
            if (distToBird < 25) {
                this.collectPowerup(powerup);
                powerup.collected = true;
            }
            
            // Remove off-screen powerups
            if (powerup.x < -30) {
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Draw powerup with pulsing effect
            const config = CONFIG.POWERUPS.TYPES[powerup.type];
            const size = 20 + Math.sin(powerup.pulse) * 5;
            
            // Background circle
            this.ctx.fillStyle = config.color;
            this.ctx.shadowColor = config.color;
            this.ctx.shadowBlur = 10;
            this.ctx.globalAlpha = 0.8;
            
            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Icon
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(config.icon, powerup.x, powerup.y + 6);
        }
    },
    
    drawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gravity
            particle.life--;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Draw particle
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
    },
    
    drawBird() {
        this.ctx.save();
        
        // Create a circular clipping path
        this.ctx.beginPath();
        this.ctx.arc(this.birdX, this.birdY, this.birdRadius, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.clip();

        // Draw the ape image inside the circle
        if (this.imagesLoaded.bird && this.images.bird) {
            this.ctx.drawImage(
                this.images.bird,
                this.birdX - this.birdRadius,
                this.birdY - this.birdRadius,
                this.birdRadius * 2,
                this.birdRadius * 2
            );
        } else {
            // Fallback to a simple colored circle if image fails
            this.ctx.fillStyle = '#FFD700'; // Gold color
            this.ctx.fill();
        }

        this.ctx.restore();

        if (this.debug) {
            this.ctx.beginPath();
            this.ctx.arc(this.birdX, this.birdY, this.birdRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    },
    
    drawUIOverlays() {
        // Power-up status indicators
        const activeTypes = Array.from(this.activePowerups.keys());
        for (let i = 0; i < activeTypes.length; i++) {
            const type = activeTypes[i];
            const config = CONFIG.POWERUPS.TYPES[type];
            const expireTime = this.activePowerups.get(type);
            const timeLeft = Math.max(0, expireTime - Date.now());
            const progress = timeLeft / config.duration;
            
            const x = 10;
            const y = 10 + i * 25;
            
            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x, y, 100, 20);
            
            // Progress bar
            this.ctx.fillStyle = config.color;
            this.ctx.fillRect(x + 2, y + 2, (100 - 4) * progress, 16);
            
            // Icon and text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '8px "Press Start 2P"';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${config.icon} ${type}`, x + 5, y + 13);
        }
        
        // Enhanced difficulty indicator in top right
        const levelPanelWidth = 110;
        const levelPanelHeight = 50;
        const levelPanelX = this.canvas.width - levelPanelWidth - 5;
        const levelPanelY = 5;
        
        // Background with gradient and border
        const gradient = this.ctx.createLinearGradient(levelPanelX, levelPanelY, levelPanelX, levelPanelY + levelPanelHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(levelPanelX, levelPanelY, levelPanelWidth, levelPanelHeight);
        
        // Border with level-based color
        const levelColors = [
            '#4CAF50', // Level 1 - Green
            '#8BC34A', // Level 2 - Light Green  
            '#FFC107', // Level 3 - Yellow
            '#FF9800', // Level 4 - Orange
            '#FF5722', // Level 5 - Red Orange
            '#F44336', // Level 6 - Red
            '#9C27B0', // Level 7 - Purple
            '#673AB7', // Level 8 - Deep Purple
            '#3F51B5', // Level 9 - Indigo
            '#2196F3'  // Level 10 - Blue
        ];
        
        const borderColor = levelColors[Math.min(this.difficultyLevel, levelColors.length - 1)];
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(levelPanelX, levelPanelY, levelPanelWidth, levelPanelHeight);
        
        // Level text
        this.ctx.fillStyle = borderColor;
        this.ctx.font = 'bold 12px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LEVEL ${this.difficultyLevel + 1}`, levelPanelX + levelPanelWidth/2, levelPanelY + 18);
        
        // Speed multiplier
        const speedText = `${(this.pipeSpeed / CONFIG.PIPE_SPEED).toFixed(1)}x SPEED`;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '8px "Press Start 2P"';
        this.ctx.fillText(speedText, levelPanelX + levelPanelWidth/2, levelPanelY + 32);
        
        // Pipes passed indicator
        const pipesText = `${this.pipesPassedCount} PIPES`;
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '7px "Press Start 2P"';
        this.ctx.fillText(pipesText, levelPanelX + levelPanelWidth/2, levelPanelY + 44);
        
        // Progress bar for next level (every 5 pipes)
        const progressToNextLevel = this.pipesPassedCount % 5;
        const progressBarWidth = levelPanelWidth - 10;
        const progressBarHeight = 3;
        const progressBarX = levelPanelX + 5;
        const progressBarY = levelPanelY + levelPanelHeight + 2;
        
        // Progress bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
        
        // Progress bar fill
        const progressFill = (progressToNextLevel / 5) * progressBarWidth;
        this.ctx.fillStyle = borderColor;
        this.ctx.fillRect(progressBarX, progressBarY, progressFill, progressBarHeight);
    },
    
    checkCollision(pipeX, pipeY, pipeWidth, pipeNorthHeight) {
        const bird = { x: this.birdX, y: this.birdY, radius: this.birdRadius };

        // Check collision with top and bottom pipes
        for (let i = 0; i < 2; i++) {
            let rectX = pipeX;
            let rectY = (i === 0) ? pipeY : pipeY + pipeNorthHeight + this.gap;
            let rectWidth = pipeWidth;
            let rectHeight = this.imagesLoaded.pipeNorth ? this.images.pipeNorth.height : 242;

            // Find the closest point on the rectangle to the circle's center
            let closestX = Math.max(rectX, Math.min(bird.x, rectX + rectWidth));
            let closestY = Math.max(rectY, Math.min(bird.y, rectY + rectHeight));

            // Calculate the distance between the circle's center and this closest point
            let distanceX = bird.x - closestX;
            let distanceY = bird.y - closestY;
            let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            // If the distance is less than the circle's radius, there's a collision
            if (distanceSquared < (bird.radius * bird.radius)) {
                return true;
            }
        }
        
        // Check collision with top and bottom of canvas
        if (bird.y - bird.radius < 0 || bird.y + bird.radius > this.canvas.height) {
            return true;
        }

        return false;
    },
    
    // Enhanced jump function with double jump
    jump() {
        if (this.isGameOver) return;
        
        // If game hasn't started yet, start it
        if (!this.gameStarted) {
            this.startGame();
        }
        
        // Check for double jump (only if bird is falling down)
        if (this.birdVelocity > 0 && this.doubleJumpAvailable && this.activePowerups.has('DOUBLE_JUMP')) {
            this.birdVelocity = CONFIG.BIRD_JUMP * 0.8; // Slightly weaker double jump
            this.doubleJumpAvailable = false; // Use up the double jump
            
            // Visual feedback
            this.spawnParticles(this.birdX + this.birdSize/2, this.birdY + this.birdSize/2, '#FFD700', 8);
            
            console.log('Double jump activated!');
        } else {
        this.birdVelocity = CONFIG.BIRD_JUMP;
            
            // Reset double jump availability when making a regular jump
            if (this.activePowerups.has('DOUBLE_JUMP')) {
                this.doubleJumpAvailable = true;
            }
        }
        
        // Jump particles
        this.spawnParticles(this.birdX + this.birdSize/2, this.birdY + this.birdSize, '#FFFFFF', 3);
    },
    
    // Game over
    async gameOver() {
        try {
            console.log('🎮 [Flappy Ape] Game over triggered, score:', this.score);
        
            // Stop the game loop immediately
        this.gameStarted = false;
            this.isGameOver = true;
            this._drawRunning = false;
            
            // Play game over sound (use correct function name) - with error handling
            try {
                if (typeof Sound !== 'undefined' && Sound && Sound.playSoundSafely) {
                    Sound.playSoundSafely('die');
                } else if (typeof Sound !== 'undefined' && Sound && Sound.sounds && Sound.sounds.die) {
                    Sound.sounds.die.play().catch(e => console.warn('Sound play failed:', e));
                }
            } catch (soundError) {
                console.warn('⚠️ Error playing game over sound:', soundError);
            }
            
            // Trigger first death achievement - with error handling
            try {
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('firstDeath', {});
                }
            } catch (achievementError) {
                console.warn('⚠️ Error triggering achievement:', achievementError);
        }
        
        // Prevent multiple saves by tracking if we already saved this score
            if (this.scoreSaved) {
                console.log('🎮 [Flappy Ape] Score already saved, skipping save');
                return;
            }
        
            // Show the game over screen - with error handling
            try {
                const gameOverScreen = document.getElementById('gameOverScreen');
                const finalScoreElement = document.getElementById('finalScore');
                
                if (gameOverScreen) {
                    gameOverScreen.style.display = 'block';
                }
                
                if (finalScoreElement) {
                    finalScoreElement.textContent = this.score;
                }
            } catch (uiError) {
                console.error('❌ Error showing game over screen:', uiError);
            }
            
            // Save score through shared Glyph pipeline - with error handling
            try {
                if (window.GameScoreUtils) {
                    await GameScoreUtils.saveGameScore('flappy_ape', this.score, {
                        success: true,
                        onComplete: (saveSuccess, result) => {
                            if (saveSuccess) {
                                console.log('✅ Game score saved successfully');
                                        this.scoreSaved = true;
                                
                                // Update high score display
                                        try {
                                const highScoreElement = document.getElementById('highScore');
                                if (highScoreElement) {
                                    highScoreElement.textContent = Math.max(this.highScore, this.score);
                                            }
                                        } catch (updateError) {
                                            console.warn('⚠️ Error updating high score display:', updateError);
                                }
                            } else {
                                console.error('❌ Failed to save game score');
                            }
                        }
                    });
                } else {
                    console.log('GameScoreUtils unavailable, skipping score save');
                    this.scoreSaved = true;
                }
            } catch (saveError) {
                console.error('❌ Error saving score:', saveError);
            this.scoreSaved = true; // Mark as saved to prevent retries
        }
        
            // Trigger achievement for game end - with error handling
            try {
        if (window.triggerAchievementEvent) {
            window.triggerAchievementEvent('gameEnd', { 
                gameId: 'flappy_ape', 
                score: this.score,
                success: true 
            });
        }
            } catch (achievementError) {
                console.warn('⚠️ Error triggering game end achievement:', achievementError);
            }
            
            console.log('✅ [Flappy Ape] Game over completed successfully');
            
        } catch (error) {
            console.error('❌ [Flappy Ape] Critical error in gameOver:', error);
            console.error('❌ [Flappy Ape] Error stack:', error.stack);
            
            // Emergency fallback - ensure game state is stopped
            this.gameStarted = false;
            this.isGameOver = true;
            this._drawRunning = false;
            this.scoreSaved = true;
            
            // Try to show emergency game over screen
            try {
                this.showEmergencyGameOver();
            } catch (emergencyError) {
                console.error('❌ [Flappy Ape] Even emergency game over failed:', emergencyError);
                // Last resort - reload the page
                window.location.reload();
            }
        }
    },
    
    // Restart game
    async restart() {
        console.log('🔄 [Flappy Ape] Restart button clicked - refreshing page');
        
        // Simply refresh the page for a clean restart
        window.location.reload();
    },
    
    // Pause game
    pause() {
        if (!this.gameStarted) return;
        
        this.isPaused = true;
        document.getElementById('pauseMenu').style.display = 'block';
    },
    
    // Resume game
    resume() {
        this.isPaused = false;
        document.getElementById('pauseMenu').style.display = 'none';
        requestAnimationFrame(() => this.draw());
    },
    
    // Initialize the game
    async init() {
        // Add global error handlers to prevent crashes
        window.addEventListener('error', (event) => {
            console.error('❌ [Flappy Ape] Global error caught:', event.error);
            console.error('❌ [Flappy Ape] Error details:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
            
            // Don't let the error crash the game
            event.preventDefault();
            
            // Try to recover the game state
            if (this.gameStarted && !this.isGameOver) {
                console.log('🔄 [Flappy Ape] Attempting to recover from global error...');
                this.isGameOver = true;
                this.gameStarted = false;
                this._drawRunning = false;
            }
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ [Flappy Ape] Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
        
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Could not find game canvas element');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get 2d context');
            return;
        }
        
        // Calculate bird dimensions
        this.birdWidth = 30;
        this.birdHeight = 30;
        
        // Set canvas size (match CONFIG.GAME_* / CANVAS_*)
        this.canvas.width = CONFIG.CANVAS_WIDTH || CONFIG.GAME_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT || CONFIG.GAME_HEIGHT;
        
        // Create offscreen canvas for drawing
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // Load images
        this.loadImages({
            bg: 'images/bg.png',
            bird: this.characterImage || 'images/ape.png',
            pipeNorth: 'images/pipeNorth.png',
            pipeSouth: 'images/pipeSouth.png'
        });
        
        // Reset game state
        await this.resetGame();
        
        // Set initial bird position
        this.birdX = 50;
        this.birdY = this.canvas.height / 2 - this.birdHeight / 2;
        
        // Draw static frame
        this.drawStatic();
        
        // Event listeners
        this.setupEventListeners();
    },
    
    // Set up event listeners
    setupEventListeners() {
        console.log('🔄 [Flappy Ape] Setting up event listeners');
        
        // Game control buttons - use event delegation to prevent duplicates
        const restartButton = document.getElementById('restartButton');
        if (restartButton && !restartButton.hasAttribute('data-listener-attached')) {
            restartButton.setAttribute('data-listener-attached', 'true');
            restartButton.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                try {
                    console.log('🔄 [Flappy Ape] Restart button clicked (original)');
                    await this.restart();
                } catch (error) {
                    console.error('❌ [Flappy Ape] Error in restart:', error);
                }
            });
            console.log('✅ [Flappy Ape] Restart button listener attached');
        }
        
        const menuReturnButton = document.getElementById('menuReturnButton');
        if (menuReturnButton && !menuReturnButton.hasAttribute('data-listener-attached')) {
            menuReturnButton.setAttribute('data-listener-attached', 'true');
            menuReturnButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('🏠 [Flappy Ape] Menu return button clicked');
                try {
                    // Hide game over screen
                    document.getElementById('gameOverScreen').style.display = 'none';
                    
                    // Create play button for restarting
                    const gameContainer = document.querySelector('.game-container');
                    if (!document.getElementById('playModal')) {
                        const playModal = document.createElement('div');
                        playModal.id = 'playModal';
                        playModal.className = 'modal';
                        playModal.style.display = 'flex';
                        playModal.style.alignItems = 'center';
                        playModal.style.justifyContent = 'center';
                        
                        const playButton = document.createElement('button');
                        playButton.id = 'playButton';
                        playButton.className = 'arcade-button';
                        playButton.textContent = 'Play Game';
                        playButton.style.fontSize = '24px';
                        playButton.style.padding = '20px 40px';
                        
                        playButton.addEventListener('click', async (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            console.log('🎮 [Flappy Ape] Play button clicked from menu return');
                            playModal.style.display = 'none';
                            try {
                                await this.resetGame();
                                await this.startGame();
                            } catch (error) {
                                console.error('❌ [Flappy Ape] Error starting game:', error);
                            }
                        });
                        
                        playModal.appendChild(playButton);
                        gameContainer.appendChild(playModal);
                    } else {
                        document.getElementById('playModal').style.display = 'flex';
                    }
                    
                    this.resetGame();
                    this.drawStatic();
                    console.log('✅ [Flappy Ape] Menu return completed successfully');
                } catch (error) {
                    console.error('❌ [Flappy Ape] Error in menu return:', error);
                }
            });
            console.log('✅ [Flappy Ape] Menu return button listener attached');
        }
        
        // Keyboard controls - use a flag to prevent multiple listeners
        if (!this.keyboardListenerAttached) {
            this.keyboardListenerAttached = true;
            document.addEventListener('keydown', async (event) => {
            if (event.code === 'Space' || event.key === ' ' || event.key === 'ArrowUp') {
                event.preventDefault(); // Prevent page scrolling
                this.jump();
            }
            
            if (event.key === 'p' || event.key === 'P') {
                if (this.isPaused) {
                    this.resume();
                } else if (this.gameStarted && !this.isGameOver) {
                    this.pause();
                }
            }
            
            if (event.key === 'r' || event.key === 'R') {
                if (this.isGameOver) {
                        try {
                            await this.restart();
                        } catch (error) {
                            console.error('❌ [Flappy Ape] Error in keyboard restart:', error);
                        }
                }
            }
            
            if (event.key === 'f' || event.key === 'F') {
                // Flappy Easter Egg - Press 'F' key
                if (window.triggerAchievementEvent) {
                    window.triggerAchievementEvent('easterEgg', { game: 'flappy_ape', type: 'flappy_key' });
                }
            }
        });
            console.log('✅ [Flappy Ape] Keyboard listener attached');
        }
        
        // Mobile touch controls - use a flag to prevent multiple listeners
        if (!this.touchListenerAttached) {
            this.touchListenerAttached = true;
        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault(); // Prevent scrolling
            this.jump();
        }, { passive: false });
            console.log('✅ [Flappy Ape] Touch listener attached');
        }
        
        console.log('✅ [Flappy Ape] All event listeners setup completed');
    },
    
    // Reload the bird image with the updated selected ape
    reloadBirdImage() {
        // Load bird (ape) image
        this.images.bird = new Image();
        const profileUrl =
            typeof window !== 'undefined' && window.getArcadePlayableAvatarUrl
                ? window.getArcadePlayableAvatarUrl()
                : typeof window !== 'undefined' && window.getArcadeProfilePortraitUrl
                  ? window.getArcadeProfilePortraitUrl()
                  : null;
        const portraitUrl = profileUrl || flappyGetApePortraitUrl(this.selectedApe);
        const apeImageUrl = portraitUrl || 'images/ape.png';
        this.images.bird.src = apeImageUrl;
        console.log('Loading selected ape image:', apeImageUrl, portraitUrl ? '(portrait)' : '(default)');

        this.images.bird.onload = () => {
            this.imagesLoaded.bird = true;
            this.drawStatic(); // Redraw when image loads
        };

        this.images.bird.onerror = () => {
            console.warn('Failed to load selected ape image, using placeholder.png');
            // Fallback to placeholder.png in the project root
            this.images.bird.onerror = null; // Prevent infinite loop if placeholder fails
            this.images.bird.src = '/placeholder.png';
            this.images.bird.onload = () => {
                this.imagesLoaded.bird = true;
                this.drawStatic();
            };
            this.images.bird.onerror = () => {
                // If placeholder also fails, fallback to default ape image
                console.error('Failed to load placeholder.png, using default ape image');
                this.images.bird.src = 'images/ape.png';
                this.images.bird.onload = () => {
                    this.imagesLoaded.bird = true;
                    this.drawStatic();
                };
            };
        };
    },
    
    // Show emergency game over screen
    showEmergencyGameOver() {
        console.log('🎮 [Flappy Ape] Showing emergency game over screen');
        
                try {
            // Hide any existing game over screens
            const existingGameOver = document.getElementById('gameOverScreen');
            if (existingGameOver) {
                existingGameOver.style.display = 'none';
            }
                    
            // Remove any existing emergency screen
            const existingEmergency = document.getElementById('emergencyGameOverScreen');
            if (existingEmergency) {
                existingEmergency.remove();
            }
            
            // Create emergency game over screen
            const emergencyGameOverScreen = document.createElement('div');
            emergencyGameOverScreen.id = 'emergencyGameOverScreen';
            emergencyGameOverScreen.style.position = 'fixed';
            emergencyGameOverScreen.style.top = '0';
            emergencyGameOverScreen.style.left = '0';
            emergencyGameOverScreen.style.width = '100%';
            emergencyGameOverScreen.style.height = '100%';
            emergencyGameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            emergencyGameOverScreen.style.display = 'flex';
            emergencyGameOverScreen.style.flexDirection = 'column';
            emergencyGameOverScreen.style.alignItems = 'center';
            emergencyGameOverScreen.style.justifyContent = 'center';
            emergencyGameOverScreen.style.zIndex = '9999';
            emergencyGameOverScreen.style.color = 'white';
            emergencyGameOverScreen.style.fontFamily = 'Arial, sans-serif';
            
            const emergencyTitle = document.createElement('h2');
            emergencyTitle.textContent = 'Game Crashed';
            emergencyTitle.style.color = '#ff6b6b';
            emergencyTitle.style.marginBottom = '20px';
            
            const emergencyMessage = document.createElement('p');
            emergencyMessage.textContent = 'The game encountered an error. Please restart.';
            emergencyMessage.style.marginBottom = '30px';
            emergencyMessage.style.textAlign = 'center';
            
            const restartButton = document.createElement('button');
            restartButton.id = 'emergencyRestartButton';
            restartButton.textContent = 'Restart Game';
            restartButton.style.fontSize = '18px';
            restartButton.style.padding = '15px 30px';
            restartButton.style.backgroundColor = '#007bff';
            restartButton.style.color = 'white';
            restartButton.style.border = 'none';
            restartButton.style.borderRadius = '5px';
            restartButton.style.cursor = 'pointer';
            
            restartButton.addEventListener('click', async () => {
                console.log('🎮 [Flappy Ape] Emergency restart button clicked');
                try {
                    emergencyGameOverScreen.remove();
                    await this.restart();
                } catch (error) {
                    console.error('❌ [Flappy Ape] Error in emergency restart:', error);
                    // Force page reload as last resort
                    window.location.reload();
                }
            });
            
            emergencyGameOverScreen.appendChild(emergencyTitle);
            emergencyGameOverScreen.appendChild(emergencyMessage);
            emergencyGameOverScreen.appendChild(restartButton);
            
            // Append to body to ensure it's visible
            document.body.appendChild(emergencyGameOverScreen);
            
        } catch (error) {
            console.error('❌ [Flappy Ape] Error showing emergency game over screen:', error);
            // Last resort: reload the page
            window.location.reload();
        }
    }
}; 