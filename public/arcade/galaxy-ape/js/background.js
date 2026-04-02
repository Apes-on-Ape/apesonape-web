// Run Ape - Background Module

const Background = {
    // Background image
    bgImage: null,
    bgLoaded: false,
    
    // Floor properties
    floorOffset: 0,
    
    // Background scrolling
    bgOffset: 0,
    bgScrollSpeed: 0.5, // Slower than game speed for parallax effect
    
    // Scale ratio for responsive design
    scaleRatio: 1,
    
    // Canvas reference
    canvas: null,
    
    // Parallax layers for background
    layers: [],
    
    // Stars for space theme
    stars: [],
    
    // Ground properties
    groundHeight: 0,
    groundY: 0,
    
    // Initialize background
    init: function(canvas) {
        this.scaleRatio = 1;
        this.canvas = canvas;
        
        // Load background image
        this.bgImage = new Image();
        this.bgImage.src = 'assets/images/bg.png';
        this.bgImage.onload = () => {
            console.log('Background image loaded successfully');
            this.bgLoaded = true;
        };
        this.bgImage.onerror = (error) => {
            console.error('Error loading background image:', error);
        };
        
        // Initialize layers array (for parallax effects if needed)
        this.layers = [];
        
        // Initialize parallax objects array
        this.parallaxObjects = [];
        
        // Initialize star field array
        this.starField = [];
        
        // Initialize stars for space theme
        this.stars = [];
        
        // Set initial ground height and position
        this.groundHeight = CONFIG.GROUND_HEIGHT;
        this.groundY = canvas.height - this.groundHeight;
        
        console.log('Background initialized');
    },
    
    // Update scale for responsive design
    updateScale: function(canvas, scaleRatio) {
        this.scaleRatio = scaleRatio;
        this.canvas = canvas;
    },
    
    // Update background state
    update: function(deltaTime, gameSpeed, canvas) {
        // Use the stored canvas reference if no canvas is provided
        if (!canvas && this.canvas) {
            canvas = this.canvas;
        }
        
        // Update floor offset for scrolling effect
        this.floorOffset = (this.floorOffset + gameSpeed) % 100;
        
        // Update background offset for slow scrolling effect - don't use modulo to prevent jumps
        this.bgOffset += this.bgScrollSpeed;
        
        // Reset bgOffset when it gets too large to prevent floating point precision issues
        if (this.bgOffset > 10000) {
            this.bgOffset = 0;
        }
    },
    
    // Draw background
    draw: function(ctx, canvas) {
        // Use the stored canvas reference if no canvas is provided
        if (!canvas && this.canvas) {
            canvas = this.canvas;
        }
        
        // Check if context is available
        if (!ctx) {
            console.error('No context available for Background.draw');
            return;
        }
        
        // Store context for use in other methods
        this.ctx = ctx;
        
        // Draw simple space background
        this.drawSimpleBackground(ctx, canvas);
        
        // Draw ground/horizon
        this.drawGround(ctx, canvas);
    },
    
    // Draw simple space background
    drawSimpleBackground: function(ctx, canvas) {
        // Draw space gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000011');    // Very dark blue at top
        gradient.addColorStop(0.5, '#000033');  // Slightly lighter in middle
        gradient.addColorStop(1, '#000055');    // Even lighter at bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw simple stars
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 100; i++) {
            const x = (i * 37 + this.bgOffset * 0.1) % canvas.width;
            const y = (i * 17) % (canvas.height - CONFIG.GROUND_HEIGHT * this.scaleRatio);
            const size = 1 + (i % 3);
            ctx.fillRect(x, y, size, size);
        }
    },
    
    // Draw enhanced space station floor
    drawGround: function(ctx, canvas) {
        // Use the stored canvas reference if no canvas is provided
        if (!canvas && this.canvas) {
            canvas = this.canvas;
        }
        
        // Check if canvas is available
        if (!canvas) {
            console.error('No canvas available for Background.drawGround');
            return;
        }
        
        const groundHeight = CONFIG.GROUND_HEIGHT * this.scaleRatio;
        const groundY = canvas.height - groundHeight;
        
        // Draw metallic space station floor base
        const gradient = ctx.createLinearGradient(0, groundY, 0, groundY + groundHeight);
        gradient.addColorStop(0, '#4A4A4A');  // Lighter top
        gradient.addColorStop(0.3, '#3A3A3A'); // Mid tone
        gradient.addColorStop(1, '#2A2A2A');  // Darker bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, groundY, canvas.width, groundHeight);
        
        // Draw floor surface highlight
        ctx.fillStyle = '#6A6A6A';
        ctx.fillRect(0, groundY, canvas.width, 3);
        
        // Draw floor panel seams
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1;
        const panelWidth = 80;
        
        for (let x = (-this.floorOffset % panelWidth); x < canvas.width; x += panelWidth) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x, groundY + groundHeight);
            ctx.stroke();
        }
        
        // Draw metallic rivets
        ctx.fillStyle = '#8A8A8A';
        const rivetSize = 2;
        const rivetSpacing = 40;
        
        for (let x = (-this.floorOffset % rivetSpacing) + rivetSpacing / 2; x < canvas.width; x += rivetSpacing) {
            // Top row of rivets
            ctx.fillRect(x - rivetSize / 2, groundY + 8, rivetSize, rivetSize);
            // Bottom row of rivets
            ctx.fillRect(x - rivetSize / 2, groundY + groundHeight - 10, rivetSize, rivetSize);
        }
        
        // Draw energy conduits/pipes
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 2;
        const conduitSpacing = 120;
        
        for (let x = (-this.floorOffset % conduitSpacing) + conduitSpacing / 2; x < canvas.width; x += conduitSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, groundY + 15);
            ctx.lineTo(x, groundY + groundHeight - 15);
            ctx.stroke();
            
            // Add conduit glow
            ctx.strokeStyle = '#FFAA44';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.strokeStyle = '#FF6600';
            ctx.lineWidth = 2;
        }
        
        // Draw warning stripes at the edge
        ctx.fillStyle = '#FFD700';
        const stripeWidth = 4;
        const stripeSpacing = 12;
        
        for (let x = (-this.floorOffset % (stripeSpacing * 2)); x < canvas.width; x += stripeSpacing * 2) {
            ctx.fillRect(x, groundY, stripeWidth, 4);
        }
        
        // Add subtle floor texture pattern
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        const textureSize = 3;
        const textureSpacing = 15;
        
        for (let x = (-this.floorOffset % textureSpacing); x < canvas.width; x += textureSpacing) {
            for (let y = groundY + 5; y < groundY + groundHeight - 5; y += textureSpacing) {
                if (Math.random() > 0.7) {
                    ctx.fillRect(x, y, textureSize, textureSize);
                }
            }
        }
        
        // Draw floor edge shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, groundY + groundHeight - 5, canvas.width, 5);
    },
    
    // Reset background
    reset: function() {
        this.floorOffset = 0;
        this.bgOffset = 0;
    },
    
    // Adjust background elements after canvas resize
    adjustPositionAfterResize: function(oldWidth, oldHeight, newWidth, newHeight) {
        // Calculate scale ratio
        const widthRatio = newWidth / oldWidth;
        const heightRatio = newHeight / oldHeight;
        
        // Adjust ground position
        const game = window.Game || Game;
        this.groundHeight = CONFIG.GROUND_HEIGHT * game.scaleRatio;
        this.groundY = newHeight - this.groundHeight;
        
        // Ensure layers array exists before trying to iterate
        if (this.layers && Array.isArray(this.layers)) {
            // Adjust layers
            this.layers.forEach(layer => {
                // Scale width and height
                layer.width = layer.width * widthRatio;
                layer.height = layer.height * heightRatio;
                
                // Adjust x position
                layer.x = (layer.x / oldWidth) * newWidth;
            });
        }
        
        // Ensure stars array exists before trying to iterate
        if (this.stars && Array.isArray(this.stars)) {
            // Adjust stars
            this.stars.forEach(star => {
                star.x = (star.x / oldWidth) * newWidth;
                star.y = (star.y / oldHeight) * newHeight;
                star.size = star.size * ((widthRatio + heightRatio) / 2); // Average scaling
            });
        }
        
        console.log('Background elements adjusted after resize');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = Background;
} 