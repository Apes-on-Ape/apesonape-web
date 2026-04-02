// Neon Racer - Environment Module

const Environment = {
    // Environment state
    buildings: [],
    lights: [],
    lastBuildingY: 0,
    lastLightY: 0,
    
    // Initialize environment
    init: function() {
        this.buildings = [];
        this.lights = [];
        this.lastBuildingY = 0;
        this.lastLightY = 0;
        
        // Create initial buildings and lights
        this.createInitialBuildings();
        this.createInitialLights();
    },
    
    // Create initial buildings
    createInitialBuildings: function() {
        // Create buildings for both sides
        for (let i = 0; i < 10; i++) {
            this.addBuilding('left');
            this.addBuilding('right');
        }
    },
    
    // Create initial lights
    createInitialLights: function() {
        // Create lights for both sides
        for (let i = 0; i < 20; i++) {
            this.addLight('left');
            this.addLight('right');
        }
    },
    
    // Add a new building
    addBuilding: function(side) {
        const building = {
            x: side === 'left' ? 0 : Config.GAME_WIDTH - 60,
            y: this.lastBuildingY - 200 - Math.random() * 100,
            width: 60,
            height: 200 + Math.random() * 200,
            color: this.getRandomBuildingColor(),
            windows: this.generateWindows()
        };
        
        this.buildings.push(building);
        this.lastBuildingY = building.y;
    },
    
    // Add a new light
    addLight: function(side) {
        const light = {
            x: side === 'left' ? 70 : Config.GAME_WIDTH - 70,
            y: this.lastLightY - 100 - Math.random() * 50,
            radius: 5 + Math.random() * 3,
            color: this.getRandomLightColor(),
            pulseSpeed: 0.05 + Math.random() * 0.05,
            pulseValue: Math.random() * Math.PI * 2
        };
        
        this.lights.push(light);
        this.lastLightY = light.y;
    },
    
    // Generate window pattern for buildings
    generateWindows: function() {
        const windows = [];
        const rows = 5 + Math.floor(Math.random() * 5);
        const cols = 3 + Math.floor(Math.random() * 3);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (Math.random() > 0.3) { // 70% chance of window
                    windows.push({
                        x: col * 15 + 10,
                        y: row * 20 + 10,
                        width: 10,
                        height: 15,
                        lit: Math.random() > 0.5
                    });
                }
            }
        }
        
        return windows;
    },
    
    // Get random building color
    getRandomBuildingColor: function() {
        const colors = [
            '#1a1a2e', // Dark blue
            '#16213e', // Navy
            '#0f3460', // Deep blue
            '#1b1b2f', // Dark purple
            '#1f1f3d'  // Dark indigo
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // Get random light color
    getRandomLightColor: function() {
        const colors = [
            '#ff00ff', // Pink
            '#00ffff', // Cyan
            '#ffff00', // Yellow
            '#ff3300', // Orange
            '#00ff66'  // Green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // Update environment
    update: function(delta) {
        // Update buildings
        this.buildings = this.buildings.filter(building => {
            building.y += Track.speed * delta;
            return building.y < Config.GAME_HEIGHT + building.height;
        });
        
        // Add new buildings if needed
        while (this.buildings.length < 10) {
            this.addBuilding('left');
            this.addBuilding('right');
        }
        
        // Update lights
        this.lights = this.lights.filter(light => {
            light.y += Track.speed * delta;
            light.pulseValue += light.pulseSpeed;
            if (light.pulseValue > Math.PI * 2) {
                light.pulseValue -= Math.PI * 2;
            }
            return light.y < Config.GAME_HEIGHT + light.radius;
        });
        
        // Add new lights if needed
        while (this.lights.length < 20) {
            this.addLight('left');
            this.addLight('right');
        }
    },
    
    // Draw environment
    draw: function(ctx) {
        // Draw buildings
        this.buildings.forEach(building => {
            // Draw building body
            ctx.fillStyle = building.color;
            ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Draw windows
            building.windows.forEach(window => {
                ctx.fillStyle = window.lit ? '#ffff00' : '#333333';
                ctx.fillRect(
                    building.x + window.x,
                    building.y + window.y,
                    window.width,
                    window.height
                );
            });
        });
        
        // Draw lights
        this.lights.forEach(light => {
            const pulse = Math.sin(light.pulseValue) * 0.3 + 0.7;
            
            // Draw light glow
            const gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius * 2
            );
            gradient.addColorStop(0, light.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw light core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius * pulse, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}; 