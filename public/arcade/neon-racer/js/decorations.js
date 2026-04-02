// Neon Racer - Track Decorations

const Decorations = {
    buildings: [],
    lights: [],
    lastSpawnTime: 0,
    
    init: function() {
        this.buildings = [];
        this.lights = [];
        this.lastSpawnTime = 0;
        this.spawnInitialDecorations();
    },
    
    reset: function() {
        this.buildings = [];
        this.lights = [];
        this.lastSpawnTime = 0;
        this.spawnInitialDecorations();
    },
    
    spawnInitialDecorations: function() {
        // Spawn initial buildings
        for (let i = 0; i < 5; i++) {
            this.spawnBuilding(-i * 200);
        }
        
        // Spawn initial lights
        for (let i = 0; i < 10; i++) {
            this.spawnLight(-i * 100);
        }
    },
    
    spawnBuilding: function(y) {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const width = Math.random() * 60 + 80; // Increased width between 80-140
        const height = Math.random() * 150 + 200; // Increased height between 200-350
        
        // Position buildings further from the road but still visible
        const roadEdge = side === 'left' ? 100 : Config.GAME_WIDTH - 100; // Road edge
        const buildingOffset = Math.random() * 50 + 50; // Offset from road edge (50-100)
        const x = side === 'left' ? roadEdge - width - buildingOffset : roadEdge + buildingOffset;
        
        // Generate random windows
        const windows = [];
        const windowRows = Math.floor(height / 40); // Larger windows
        const windowCols = Math.floor(width / 25); // Larger windows
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                if (Math.random() < 0.7) { // 70% chance for a window
                    windows.push({
                        x: col * 25 + 5,
                        y: row * 40 + 5,
                        width: 15,
                        height: 25,
                        lit: Math.random() < 0.3 // 30% chance for lit window
                    });
                }
            }
        }
        
        this.buildings.push({
            x: x,
            y: y,
            width: width,
            height: height,
            side: side,
            windows: windows,
            color: Config.NEON_COLORS[Math.floor(Math.random() * Config.NEON_COLORS.length)],
            depth: Math.random() * 0.4 + 0.6 // Adjusted depth factor between 0.6 and 1.0
        });
    },
    
    spawnLight: function(y) {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const roadEdge = side === 'left' ? 50 : Config.GAME_WIDTH - 50; // Road edge moved inward
        const x = side === 'left' ? roadEdge - 30 : roadEdge + 30;
        
        this.lights.push({
            x: x,
            y: y,
            side: side,
            color: Config.NEON_COLORS[Math.floor(Math.random() * Config.NEON_COLORS.length)],
            pulsePhase: Math.random() * Math.PI * 2
        });
    },
    
    update: function(delta, speed) {
        // Update buildings
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            const building = this.buildings[i];
            building.y += speed;
            
            // Remove if off screen
            if (building.y > Config.GAME_HEIGHT + building.height) {
                this.buildings.splice(i, 1);
            }
        }
        
        // Update lights
        for (let i = this.lights.length - 1; i >= 0; i--) {
            const light = this.lights[i];
            light.y += speed;
            light.pulsePhase += 0.05; // Update pulse animation
            
            // Remove if off screen
            if (light.y > Config.GAME_HEIGHT + 50) {
                this.lights.splice(i, 1);
            }
        }
        
        // Spawn new decorations
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime >= 1000) { // Spawn every second
            this.lastSpawnTime = currentTime;
            
            // Spawn new building if needed
            if (this.buildings.length < 5) {
                this.spawnBuilding(-200);
            }
            
            // Spawn new light if needed
            if (this.lights.length < 10) {
                this.spawnLight(-100);
            }
        }
    },
    
    draw: function(ctx) {
        // Draw buildings
        for (const building of this.buildings) {
            ctx.save();
            
            // Apply depth effect
            ctx.globalAlpha = building.depth;
            
            // Draw building base
            ctx.fillStyle = '#333333';
            ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Draw building outline with depth-based glow
            ctx.strokeStyle = building.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(building.x, building.y, building.width, building.height);
            
            // Add depth-based shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(building.x, building.y + building.height - 5, building.width, 5);
            
            // Draw windows with depth effect
            for (const window of building.windows) {
                ctx.fillStyle = window.lit ? building.color : '#666666';
                ctx.globalAlpha = window.lit ? building.depth : building.depth * 0.7;
                ctx.fillRect(
                    building.x + window.x,
                    building.y + window.y,
                    window.width,
                    window.height
                );
            }
            
            ctx.restore();
        }
        
        // Draw lights
        for (const light of this.lights) {
            ctx.save();
            
            // Calculate pulse effect
            const pulse = Math.sin(light.pulsePhase) * 0.2 + 0.8;
            
            // Draw light pole
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(light.x, light.y);
            ctx.lineTo(light.x, light.y + 30);
            ctx.stroke();
            
            // Draw light
            ctx.fillStyle = light.color;
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(light.x, light.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw glow
            ctx.shadowColor = light.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(light.x, light.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
}; 