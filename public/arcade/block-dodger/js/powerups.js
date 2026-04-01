// Block Dodger - PowerUps Module

// Add roundRect polyfill for older browsers if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.arcTo(x + width, y, x + width, y + radius, radius);
        this.lineTo(x + width, y + height - radius);
        this.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        this.lineTo(x + radius, y + height);
        this.arcTo(x, y + height, x, y + height - radius, radius);
        this.lineTo(x, y + radius);
        this.arcTo(x, y, x + radius, y, radius);
        this.closePath();
        return this;
    };
}

const PowerUps = {
    // Array to store all active powerups
    list: [],
    
    // Timer for spawning new powerups
    spawnTimer: null,
    
    // Last update timestamp for animation
    lastUpdateTime: 0,
    
    // Powerup types and their configurations
    types: {
        SLOWDOWN: {
            name: "Time Warp",
            description: "Slows down all blocks temporarily",
            color: "#00FFFF", // Cyan
            duration: 5000, // 5 seconds of effect
            effect: function() {
                // Slow down all blocks by 50%
                Game.applyTemporaryBlockSpeed(0.5);
                
                // Show visual effect
                UI.showNotification("Time Warp activated! Blocks slowed for 5 seconds", 3000);
                Effects.showScreenFlash("#00FFFF", 0.3);
            },
            width: 15,  // Smaller size as requested
            height: 15, // Smaller size as requested
            icon: "⏱️",
            spawnChance: 0.3 // 30% of spawned powerups
        },
        
        GHOSTMODE: {
            name: "Ghost Mode",
            description: "Blocks pass through you temporarily",
            color: "#7700FF", // Purple
            duration: 3000, // 3 seconds of effect
            effect: function() {
                // Set player to invincible
                Player.data.isInvincible = true;
                
                // Show visual effect
                UI.showNotification("Ghost Mode activated! Invincible for 3 seconds", 3000);
                Effects.showScreenFlash("#7700FF", 0.3);
                
                // Set timeout to return to normal
                setTimeout(() => {
                    Player.data.isInvincible = false;
                    UI.showNotification("Ghost Mode deactivated", 2000);
                }, this.duration);
            },
            width: 15,  // Smaller size as requested
            height: 15, // Smaller size as requested
            icon: "👻",
            spawnChance: 0.3 // 30% of spawned powerups
        },
        
        SHRINKBLOCKS: {
            name: "Miniaturizer",
            description: "Shrinks all blocks temporarily",
            color: "#00FF00", // Green
            duration: 8000, // 8 seconds of effect
            effect: function() {
                // Shrink all blocks by 50%
                Blocks.applySizeMultiplier(0.5);
                
                // Show visual effect
                UI.showNotification("Miniaturizer activated! Blocks shrunk for 8 seconds", 3000);
                Effects.showScreenFlash("#00FF00", 0.3);
                
                // Set timeout to return to normal
                setTimeout(() => {
                    Blocks.resetSizeMultiplier();
                    UI.showNotification("Miniaturizer deactivated", 2000);
                }, this.duration);
            },
            width: 15,  // Smaller size as requested
            height: 15, // Smaller size as requested
            icon: "🔍",
            spawnChance: 0.4 // 40% of spawned powerups
        }
    },
    
    // Flag to enable frequent powerup spawning for debugging
    debugMode: false,
    
    // Fixed DOM powerup elements
    domPowerups: [],
    
    // Initialize the powerups system
    init: function() {
        console.log("PowerUps system initialized - FALLING DOM POWERUPS");
        
        // Clear any existing powerups
        this.list = [];
        
        // Clear any existing DOM powerups
        this.clearDOMPowerups();
        
        // Clear any existing timer
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
        }
        
        // Get the game container element
        const gameContainer = document.getElementById("gameContainer");
        if (!gameContainer) {
            console.error("Cannot find game container for DOM powerups!");
            return;
        }
        
        console.log("Game container found:", gameContainer.id, gameContainer.clientWidth, gameContainer.clientHeight);
        
        // Initialize the last update time
        this.lastUpdateTime = Date.now();
        
        // Start the animation loop
        requestAnimationFrame(this.animate.bind(this));
        
        // Show notification
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification("💎 Falling Powerups Enabled", 2000);
        }
        
        // Create one powerup to start (reduced from 2)
        console.log("Creating initial powerup...");
        this.spawn();
        
        // Set an interval to spawn powerups - REDUCED rate
        this.spawnTimer = setInterval(() => {
            // Only spawn if game is active
            if (Game && Game.isGameActive && Game.isGameActive() && !Game.isGameOver()) {
                // Reduced chance to spawn a powerup (15% instead of 50%)
                if (Math.random() < 0.15) {
                    console.log("Spawn timer triggered - spawning powerup");
                    this.spawn();
                }
            } else {
                console.log("Game not active, skipping powerup spawn");
                
                // If game is over, clear all powerups
                if (Game && Game.isGameOver && Game.isGameOver()) {
                    this.clear();
                }
            }
        }, 3000); // Check every 3 seconds instead of 1 for less frequent spawns
    },
    
    // Animation loop
    animate: function() {
        // Calculate delta time
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        
        // Update positions
        this.update(deltaTime);
        
        // Request next frame if game is active
        if (Game && Game.isGameActive && Game.isGameActive() && !Game.isGameOver()) {
            requestAnimationFrame(this.animate.bind(this));
        } else {
            console.log("Game not active, animation loop paused");
            
            // If game is over, clear all powerups
            if (Game && Game.isGameOver && Game.isGameOver()) {
                this.clear();
            }
        }
    },
    
    // Create a DOM-based powerup that falls
    createFallingPowerup: function(type, x, y, speed) {
        // Get the game container
        const gameContainer = document.getElementById("gameContainer");
        if (!gameContainer) return null;
        
        // Get powerup config
        const powerupConfig = this.types[type];
        if (!powerupConfig) return null;
        
        // Create a new DOM element for the powerup
        const powerupElement = document.createElement("div");
        powerupElement.className = "dom-powerup falling";
        powerupElement.dataset.type = type;
        
        // Create powerup data
        const powerup = {
            element: powerupElement,
            x: x,
            y: y,
            width: 15,  // Smaller size as requested
            height: 15, // Smaller size as requested
            speed: speed || 2,
            type: type
        };
        
        // Style the powerup for smaller size
        powerupElement.style.position = "absolute";
        powerupElement.style.left = x + "px";
        powerupElement.style.top = y + "px";
        powerupElement.style.width = powerup.width + "px";
        powerupElement.style.height = powerup.height + "px";
        powerupElement.style.backgroundColor = powerupConfig.color;
        powerupElement.style.border = "1px solid white"; // Thinner border for smaller size
        powerupElement.style.borderRadius = "3px"; // Smaller radius
        powerupElement.style.zIndex = "100";
        powerupElement.style.display = "flex";
        powerupElement.style.justifyContent = "center";
        powerupElement.style.alignItems = "center";
        powerupElement.style.color = "white";
        powerupElement.style.fontWeight = "bold";
        powerupElement.style.boxShadow = "0 0 5px " + powerupConfig.color; // Smaller glow
        powerupElement.style.cursor = "pointer";
        
        // For small powerups, display the icon but with smaller font size
        powerupElement.textContent = powerupConfig.icon;
        powerupElement.style.fontSize = "8px"; // Small font size for the icon
        
        // Create styles for the animation if they don't exist
        if (!document.getElementById("powerup-animation-style")) {
            const styleElement = document.createElement("style");
            styleElement.id = "powerup-animation-style";
            styleElement.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    100% { transform: scale(1.1); }
                }
                @keyframes fadeOut {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .dom-powerup.falling {
                    animation: pulse 0.7s infinite alternate;
                    transition: top 0.1s linear;
                }
            `;
            document.head.appendChild(styleElement);
        }
        
        // Add click event to activate the powerup
        powerupElement.addEventListener("click", () => {
            this.activatePowerup(type);
            
            // Add fade out animation
            powerupElement.style.animation = "fadeOut 0.5s forwards";
            
            // Remove the element after animation
            setTimeout(() => {
                if (powerupElement.parentNode) {
                    powerupElement.parentNode.removeChild(powerupElement);
                }
                
                // Remove from our array
                const index = this.list.findIndex(p => p.element === powerupElement);
                if (index !== -1) {
                    this.list.splice(index, 1);
                }
            }, 500);
        });
        
        // Add to the game container
        gameContainer.appendChild(powerupElement);
        
        // Add to our list
        this.list.push(powerup);
        
        return powerup;
    },
    
    // Spawn a new falling powerup
    spawn: function() {
        // Get the game container to determine dimensions
        const gameContainer = document.getElementById("gameContainer");
        if (!gameContainer) {
            console.error("Cannot find gameContainer for spawning powerups!");
            return;
        }
        
        console.log("Attempting to spawn powerup - container found:", gameContainer);
        
        // Get container dimensions
        const containerWidth = gameContainer.clientWidth;
        console.log("Container width:", containerWidth);
        
        // Select a random powerup type
        const type = this.selectPowerupType();
        const speed = 1 + Math.random() * 2; // Random speed between 1-3
        
        // Create at a random x position at the top
        const x = Math.random() * (containerWidth - 15); // 15px is powerup width
        const y = -20; // Start above the visible area
        
        // Create the powerup
        const powerup = this.createFallingPowerup(type, x, y, speed);
        
        if (powerup) {
            console.log(`Successfully spawned ${type} powerup at x: ${x}, speed: ${speed}`);
        } else {
            console.error(`Failed to spawn ${type} powerup!`);
        }
    },
    
    // Clear all DOM-based powerups
    clearDOMPowerups: function() {
        // Remove any existing DOM powerups
        const existingPowerups = document.querySelectorAll(".dom-powerup");
        existingPowerups.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clear our array
        this.list = [];
        
        // Clear any existing timer
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = null;
        }
    },
    
    // Select which powerup type to spawn based on probabilities
    selectPowerupType: function() {
        const types = Object.keys(this.types);
        
        // Calculate total probability
        let totalProbability = 0;
        types.forEach(type => {
            totalProbability += this.types[type].spawnChance;
        });
        
        // Select a powerup type based on probabilities
        const random = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        
        for (const type of types) {
            cumulativeProbability += this.types[type].spawnChance;
            if (random <= cumulativeProbability) {
                return type;
            }
        }
        
        // Fallback to first type
        return types[0];
    },
    
    // Update all powerups
    update: function(deltaTime) {
        // Don't update if game is over or not active
        if (Game && Game.isGameOver && Game.isGameOver()) {
            return;
        }
    
        // Get the game container to determine boundaries
        const gameContainer = document.getElementById("gameContainer");
        if (!gameContainer) {
            console.error("Cannot find gameContainer in update function!");
            return;
        }
        
        const containerHeight = gameContainer.clientHeight;
        
        // Log status once per second (not every frame)
        if (Math.random() < 0.01) {
            console.log(`Updating ${this.list.length} powerups, container height: ${containerHeight}`);
        }
        
        // Calculate time factor (60 FPS is our baseline)
        const timeFactor = Math.min(deltaTime / 16.67, 3); // Cap at 3x to prevent huge jumps
        
        // Keep track of powerups to remove
        const powerupsToRemove = [];
        
        // Update each powerup position
        for (let i = 0; i < this.list.length; i++) {
            const powerup = this.list[i];
            
            // Update y position based on speed and time factor
            powerup.y += powerup.speed * timeFactor;
            
            // Update DOM element position
            if (powerup.element) {
                powerup.element.style.top = powerup.y + "px";
            }
            
            // Check if powerup is off screen
            if (powerup.y > containerHeight) {
                powerupsToRemove.push(i);
                console.log("Powerup moved off screen");
            }
            
            // Check for collision with player if we have player data
            if (Player && Player.data) {
                if (this.isColliding(Player.data, powerup)) {
                    // Activate the powerup effect
                    this.activatePowerup(powerup.type);
                    
                    // Play sound effect
                    if (Sound && Sound.playSoundSafely) {
                        Sound.playSoundSafely('point');
                    }
                    
                    // Remove the powerup
                    powerupsToRemove.push(i);
                    
                    // Add fade out animation to element
                    if (powerup.element) {
                        powerup.element.style.animation = "fadeOut 0.5s forwards";
                        
                        // Remove after animation
                        setTimeout(() => {
                            if (powerup.element && powerup.element.parentNode) {
                                powerup.element.parentNode.removeChild(powerup.element);
                            }
                        }, 500);
                    }
                    
                    console.log(`Powerup collected!`);
                }
            }
        }
        
        // Remove powerups that are off screen or collected (in reverse order)
        for (let i = powerupsToRemove.length - 1; i >= 0; i--) {
            const index = powerupsToRemove[i];
            const powerup = this.list[index];
            
            // Remove DOM element
            if (powerup.element && powerup.element.parentNode) {
                powerup.element.parentNode.removeChild(powerup.element);
            }
            
            // Remove from list
            this.list.splice(index, 1);
        }
    },
    
    // Check if two objects are colliding
    isColliding: function(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    },
    
    // Activate a powerup's effect
    activatePowerup: function(type) {
        const powerupConfig = this.types[type];
        if (powerupConfig && typeof powerupConfig.effect === 'function') {
            powerupConfig.effect.call(powerupConfig);
            console.log(`Activated ${powerupConfig.name} powerup`);
            
            // Add another notification for confirmation
            if (typeof UI !== 'undefined' && UI.showNotification) {
                UI.showNotification(`${powerupConfig.name} powerup activated!`, 3000);
            }
        }
    },
    
    // Clear all powerups
    clear: function() {
        this.clearDOMPowerups();
    },
    
    // Force spawn all powerup types for debugging
    forceSpawnAll: function() {
        // Get the game container to determine dimensions
        const gameContainer = document.getElementById("gameContainer");
        if (!gameContainer) return;
        
        // Get container dimensions
        const containerWidth = gameContainer.clientWidth;
        
        // Force spawn one of each type of powerup
        const types = Object.keys(this.types);
        types.forEach((type, index) => {
            // Calculate position
            const spacing = containerWidth / (types.length + 1);
            const x = spacing * (index + 1);
            const y = -20;
            
            // Create the powerup with specific type
            this.createFallingPowerup(type, x, y, 2);
            console.log(`Force spawned ${type} powerup at x: ${x}`);
        });
        
        UI.showNotification("Force spawned all powerup types", 2000);
    },
    
    // Create fixed test powerups for debugging
    createFixedTestPowerups: function() {
        // Create test powerups at fixed positions for debugging
        // This helps verify if PowerUps are rendering correctly
        
        console.log("Creating fixed test powerups");
        UI.showNotification("Created test powerups", 2000);
    }
}; 