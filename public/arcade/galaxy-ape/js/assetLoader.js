// Run Ape - Asset Loader Module
// Handles loading and caching of game assets

const AssetLoader = {
    // Asset storage
    images: {},
    loadedCount: 0,
    totalCount: 0,
    loadingComplete: false,
    
    // Asset definitions
    assets: {
        // Space objects from the downloaded pack
        'spaceship': 'assets/images/space-pack/Space Pixel/RocketGrey.png',
        'satellite': 'assets/images/space-pack/Space Pixel/Satellite.png',
        'ufo-blue': 'assets/images/space-pack/Space Pixel/UfoBlue.png',
        'ufo-grey': 'assets/images/space-pack/Space Pixel/UfoGrey.png',
        'earth': 'assets/images/space-pack/Space Pixel/Earth.png',
        'blue-planet': 'assets/images/space-pack/Space Pixel/BluePlanet.png',
        'purple-planet': 'assets/images/space-pack/Space Pixel/PurplePlanet.png',
        'red-planet': 'assets/images/space-pack/Space Pixel/RedPlanet.png',
        'saturn': 'assets/images/space-pack/Space Pixel/Saturn.png',
        'sun': 'assets/images/space-pack/Space Pixel/Sun.png',
        'astronaut': 'assets/images/space-pack/Space Pixel/Astronaut.png',
        'hurricane': 'assets/images/space-pack/Space Pixel/Hurricane.png',
        'white-star': 'assets/images/space-pack/Space Pixel/WhiteStar.png',
        'yellow-star': 'assets/images/space-pack/Space Pixel/YellowStar.png',
        'full-moon': 'assets/images/space-pack/Space Pixel/FullMoon.png',
        'red-moon': 'assets/images/space-pack/Space Pixel/RedMoon.png'
    },
    
    // Initialize and start loading assets
    init: function() {
        this.totalCount = Object.keys(this.assets).length;
        this.loadedCount = 0;
        this.loadingComplete = false;
        
        console.log(`Starting to load ${this.totalCount} assets...`);
        
        // Load all assets
        for (const [key, path] of Object.entries(this.assets)) {
            this.loadImage(key, path);
        }
    },
    
    // Load a single image
    loadImage: function(key, path) {
        const img = new Image();
        
        img.onload = () => {
            this.loadedCount++;
            console.log(`Loaded asset: ${key} (${this.loadedCount}/${this.totalCount})`);
            
            if (this.loadedCount >= this.totalCount) {
                this.loadingComplete = true;
                console.log('All assets loaded successfully!');
            }
        };
        
        img.onerror = () => {
            console.warn(`Failed to load asset: ${key} from ${path}`);
            this.loadedCount++; // Still count it to prevent hanging
            
            if (this.loadedCount >= this.totalCount) {
                this.loadingComplete = true;
                console.log('Asset loading complete (some assets failed)');
            }
        };
        
        img.src = path;
        this.images[key] = img;
    },
    
    // Get an image by key
    getImage: function(key) {
        return this.images[key] || null;
    },
    
    // Check if an image is loaded
    isLoaded: function(key) {
        const img = this.images[key];
        return img && img.complete && img.naturalWidth > 0;
    },
    
    // Get loading progress as percentage
    getProgress: function() {
        return this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0;
    },
    
    // Check if all assets are loaded
    isAllLoaded: function() {
        return this.loadingComplete;
    },
    
    // Draw an image with fallback to shapes if not loaded
    drawImageOrFallback: function(ctx, key, x, y, width, height, fallbackColor = '#FF0000') {
        const img = this.getImage(key);
        
        if (img && this.isLoaded(key)) {
            // Draw the actual image
            ctx.drawImage(img, x, y, width, height);
            return true;
        } else {
            // Draw fallback rectangle
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(x, y, width, height);
            return false;
        }
    },
    
    // Create a canvas from an image for pixel manipulation
    createCanvas: function(key, width = null, height = null) {
        const img = this.getImage(key);
        if (!img || !this.isLoaded(key)) return null;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width || img.naturalWidth;
        canvas.height = height || img.naturalHeight;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        return canvas;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = AssetLoader;
} 