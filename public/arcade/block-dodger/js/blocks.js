// Block Dodger - Blocks Module

const Blocks = {
    // Array to store all blocks
    list: [],
    oscillationTime: 0,
    sizeMultiplier: 1.0, // Add size multiplier property
    
    // Spawn a new block
    spawn: function(difficultyLevel) {
        if (Game.isGameOver()) return;
        
        // Clean up blocks that are off-screen
        this.list = this.list.filter(block => block.y < canvas.height + block.height);
        
        // Get difficulty settings
        const difficulty = difficultyLevel || Config.DIFFICULTY_LEVELS[0];
        
        // Determine if we should spawn a special block based on difficulty
        let isSpecialBlock = Math.random() < difficulty.specialBlockChance;
        let specialBlockType = null;
        
        if (isSpecialBlock) {
            specialBlockType = this.selectSpecialBlockType();
        }
        
        // Base size between 20 and 40 pixels
        let size = Math.random() * 20 + 20;
        
        // Apply global size multiplier for powerup effects
        size *= this.sizeMultiplier;
        
        // Base colors (avoiding white)
        let color = Config.BLOCK_COLORS[Math.floor(Math.random() * Config.BLOCK_COLORS.length)];
        
        // Calculate block speed based on difficulty
        const baseSpeed = Config.INITIAL_BLOCK_SPEED * difficulty.blockSpeed;
        let speed = Math.min(baseSpeed, Config.MAX_BLOCK_SPEED);
        
        // Apply special block modifiers if this is a special block
        if (isSpecialBlock && specialBlockType) {
            const specialBlockConfig = Config.SPECIAL_BLOCKS[specialBlockType];
            size *= specialBlockConfig.sizeMultiplier;
            speed *= specialBlockConfig.speedMultiplier;
            color = specialBlockConfig.color;
        }
        
        // 20% chance to spawn block directly above player (reduced from 30%)
        const spawnAbovePlayer = Math.random() < 0.2;
        
        let block = {
            x: 0,
            y: -size,
            width: size,
            height: size,
            speed: speed,
            color: color,
            creationTime: performance.now(), // Track when this block was created
            specialType: specialBlockType
        };
        
        if (spawnAbovePlayer) {
            // Spawn block centered above player
            block.x = Player.data.x + (Player.data.width / 2) - (size / 2);
        } else {
            // Spawn block at random position
            block.x = Math.random() * (canvas.width - size);
        }
        
        // Add special properties for special blocks
        if (specialBlockType) {
            switch (specialBlockType) {
                case 'ZIGZAG':
                    block.oscillationAmount = Config.SPECIAL_BLOCKS.ZIGZAG.oscillationAmount;
                    block.oscillationOffset = Math.random() * Math.PI * 2; // Random phase
                    break;
                case 'SEEKING':
                    block.trackingStrength = Config.SPECIAL_BLOCKS.SEEKING.trackingStrength;
                    break;
            }
        }
        
        this.list.push(block);
    },
    
    // Apply a size multiplier to all blocks (for powerups)
    applySizeMultiplier: function(multiplier) {
        this.sizeMultiplier = multiplier;
        
        // Apply to existing blocks
        this.list.forEach(block => {
            const centerX = block.x + (block.width / 2);
            const centerY = block.y + (block.height / 2);
            
            // Apply multiplier to width and height
            block.width *= multiplier;
            block.height *= multiplier;
            
            // Recenter the block
            block.x = centerX - (block.width / 2);
            block.y = centerY - (block.height / 2);
        });
    },
    
    // Reset the size multiplier to normal
    resetSizeMultiplier: function() {
        // Calculate the inverse multiplier to return to normal size
        const inverseMultiplier = 1.0 / this.sizeMultiplier;
        this.applySizeMultiplier(inverseMultiplier);
        this.sizeMultiplier = 1.0;
    },
    
    // Select which type of special block to spawn based on probabilities
    selectSpecialBlockType: function() {
        const specialBlocks = Config.SPECIAL_BLOCKS;
        const types = Object.keys(specialBlocks);
        
        // Calculate total probability
        let totalProbability = 0;
        types.forEach(type => {
            totalProbability += specialBlocks[type].probability;
        });
        
        // Select a block type based on probabilities
        const random = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        
        for (const type of types) {
            cumulativeProbability += specialBlocks[type].probability;
            if (random <= cumulativeProbability) {
                return type;
            }
        }
        
        // Fallback to first type
        return types[0];
    },
    
    // Update all blocks
    update: function(deltaTime, difficultyLevel) {
        // Make sure we have a valid deltaTime to prevent extreme jumps
        const dt = Math.min(deltaTime || Config.FIXED_TIME_STEP, 50); // Cap at 50ms to prevent huge jumps
        
        // Calculate time factor (60 FPS is our baseline)
        const timeFactor = dt / Config.FIXED_TIME_STEP;
        
        // Increment oscillation time for zigzag blocks
        this.oscillationTime += dt * 0.001; // Convert to seconds
        
        // Keep track of blocks to remove
        const blocksToRemove = [];
        
        // Update each block
        for (let i = 0; i < this.list.length; i++) {
            const block = this.list[i];
            
            // Apply speed based on actual time elapsed, but prevent extreme jumps
            const blockMoveAmount = block.speed * timeFactor;
            block.y += blockMoveAmount;
            
            // Handle special block behaviors
            if (block.specialType) {
                switch (block.specialType) {
                    case 'ZIGZAG':
                        // Apply horizontal zigzag movement
                        const oscillationFactor = Math.sin((this.oscillationTime * 5) + block.oscillationOffset);
                        block.x += oscillationFactor * block.oscillationAmount * timeFactor * 0.05;
                        
                        // Keep block within canvas bounds
                        if (block.x < 0) block.x = 0;
                        if (block.x + block.width > canvas.width) block.x = canvas.width - block.width;
                        break;
                        
                    case 'SEEKING':
                        // Move toward player's position
                        if (Player.data) {
                            const playerCenterX = Player.data.x + Player.data.width / 2;
                            const blockCenterX = block.x + block.width / 2;
                            const direction = playerCenterX > blockCenterX ? 1 : -1;
                            const trackingAmount = block.trackingStrength * timeFactor;
                            
                            block.x += direction * trackingAmount * 2;
                            
                            // Keep block within canvas bounds
                            if (block.x < 0) block.x = 0;
                            if (block.x + block.width > canvas.width) block.x = canvas.width - block.width;
                        }
                        break;
                }
            }
            
            // Mark blocks that are off screen for removal
            if (block.y > canvas.height) {
                blocksToRemove.push(i);
            }
        }
        
        // Remove blocks that are off screen (in reverse order to avoid index issues)
        for (let i = blocksToRemove.length - 1; i >= 0; i--) {
            this.list.splice(blocksToRemove[i], 1);
        }
    },
    
    // Draw all blocks
    draw: function() {
        for (let i = 0; i < this.list.length; i++) {
            const block = this.list[i];
            
            if (block.specialType) {
                this.drawSpecialBlock(block);
            } else {
                this.drawEnhancedBlock(block);
            }
        }
    },
    
    // Draw enhanced block with lighting and texture effects
    drawEnhancedBlock: function(block) {
        // Save the current context state
        ctx.save();
        
        // Draw simple 2D block
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Restore the context state
        ctx.restore();
    },
    
    // Draw special block with effects specific to its type
    drawSpecialBlock: function(block) {
        ctx.save();
        
        // Base block
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Special effects based on block type
        switch (block.specialType) {
            case 'LARGE':
                // Add a pulsing glow
                const pulseAmount = Math.sin(performance.now() * 0.005) * 0.2 + 0.8;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3 * pulseAmount;
                ctx.strokeRect(block.x, block.y, block.width, block.height);
                break;
                
            case 'FAST':
                // Add motion lines
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const yOffset = i * 10;
                    ctx.moveTo(block.x, block.y + block.height + yOffset);
                    ctx.lineTo(block.x + block.width, block.y + block.height + yOffset);
                }
                ctx.stroke();
                break;
                
            case 'ZIGZAG':
                // Add zigzag pattern
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(block.x, block.y + block.height / 2);
                
                const zigzagSize = block.width / 4;
                for (let i = 0; i < 4; i++) {
                    const xPos = block.x + (i + 0.5) * zigzagSize;
                    const yOffset = (i % 2 === 0) ? -5 : 5;
                    ctx.lineTo(xPos, block.y + block.height / 2 + yOffset);
                }
                ctx.lineTo(block.x + block.width, block.y + block.height / 2);
                ctx.stroke();
                break;
                
            case 'SEEKING':
                // Add targeting indicator
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                
                // Draw line to player if player exists
                if (Player.data) {
                    const blockCenterX = block.x + block.width / 2;
                    const blockCenterY = block.y + block.height / 2;
                    const playerCenterX = Player.data.x + Player.data.width / 2;
                    const playerCenterY = Player.data.y + Player.data.height / 2;
                    
                    ctx.moveTo(blockCenterX, blockCenterY);
                    ctx.lineTo(playerCenterX, playerCenterY);
                    ctx.stroke();
                }
                
                ctx.setLineDash([]);
                break;
        }
        
        ctx.restore();
    },
    
    // Clear all blocks
    clear: function() {
        this.list = [];
    },
    
    // Update block positions when canvas is resized
    updateBlockPositions: function(oldWidth, oldHeight, newWidth, newHeight) {
        // Calculate scaling factors for x and y
        const xScale = newWidth / oldWidth;
        const yScale = newHeight / oldHeight;
        
        // Adjust each block's position and size based on canvas size change
        this.list.forEach(block => {
            // Scale position proportionally
            block.x = block.x * xScale;
            block.y = block.y * yScale;
            
            // Scale size proportionally if needed
            if (block.width && block.height) {
                block.width = block.width * xScale;
                block.height = block.height * yScale;
            }
            
            // Update fall speed based on height ratio to maintain gameplay feel
            if (block.speed) {
                block.speed = block.speed * yScale;
            }
        });
    },
    
    // Check if a block is colliding with the player
    checkCollisions: function() {
        // Check player movement bounds
        if (Player.data.x < 0) {
            Player.data.x = 0;
        } else if (Player.data.x + Player.data.width > canvas.width) {
            Player.data.x = canvas.width - Player.data.width;
        }
        
        // If player is invincible, don't check for collisions
        if (Player.isInvincible()) {
            return false;
        }
        
        // Check each block for collision with player
        for (let i = 0; i < this.list.length; i++) {
            const block = this.list[i];
            
            if (this.isColliding(Player.data, block)) {
                // Collision detected - trigger game over
                Game.triggerGameOver(block);
                return true;
            }
        }
        
        return false;
    },
    
    // Check if two objects are colliding
    isColliding: function(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
}; 