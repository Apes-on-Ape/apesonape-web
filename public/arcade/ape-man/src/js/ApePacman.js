import Pacman from './Pacman.js';

class ApePacman extends Pacman {
    constructor(options) {
        super(options);
        
        // Initialize ape loading
        this.selectedApe = null;
        this.apeImageLoaded = false;
        
        // Load selected ape asynchronously
        this.loadSelectedApeAsync();
        
        console.log('ApePacman created, loading ape...');
    }
    
    // Async method to load selected ape
    async loadSelectedApeAsync() {
        try {
            this.selectedApe = await ApePacman.loadSelectedApe();
        
        // Load the ape image if available
        if (this.selectedApe && this.selectedApe.image) {
            this.loadApeImage();
            console.log('Loading ape character:', this.selectedApe.tokenId || this.selectedApe.name);
        }
        
            console.log('ApePacman loaded with ape:', this.selectedApe ? this.selectedApe.tokenId : 'none');
        } catch (error) {
            console.error('Error loading selected ape:', error);
        }
    }
    
    // Static method to load selected ape from localStorage
    static async loadSelectedApe() {
        try {
            if (window.getArcadePlayableAvatarUrl || window.getArcadeProfilePortraitUrl) {
                const sitePfp = window.getArcadePlayableAvatarUrl
                    ? window.getArcadePlayableAvatarUrl()
                    : window.getArcadeProfilePortraitUrl();
                if (sitePfp) {
                    return {
                        image: sitePfp,
                        tokenId: 'profile',
                        name: 'Profile',
                    };
                }
            }
            // Use the global function to load from database
            if (window.NFT && window.NFT.loadSelectedApeForGame) {
                const apeData = await window.NFT.loadSelectedApeForGame();
                if (apeData) {
                    console.log('Loaded selected ape from database for ApePacman:', apeData);
                    return apeData;
                } else {
                    console.log('No selected ape found in database');
                }
            }
            
            // Fallback to localStorage if NFT module not available
            const savedApe = localStorage.getItem('selectedApe');
            if (savedApe) {
                const apeData = JSON.parse(savedApe);
                console.log('Loaded selected ape from localStorage for ApePacman:', apeData);
                return apeData;
            }
        } catch (error) {
            console.error('Error loading selected ape:', error);
        }
        
        console.log('No ape selected, using default character');
        return null;
    }
    
    // Load the ape image and prepare for display
    loadApeImage() {
        if (!this.selectedApe || !this.selectedApe.image) return;
        
        // Create image element to ensure it loads
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            console.log('Ape image loaded successfully');
            this.apeImageLoaded = true;
            this.updateSpriteForApe();
        };
        
        img.onerror = () => {
            console.error('Failed to load ape image, using default');
            this.apeImageLoaded = false;
        };
        
        img.src = this.selectedApe.image;
    }
    
    // Override setAnimation to use ape image instead of sprite sheet
    setAnimation(animation, index, callback) {
        if (this.selectedApe && this.apeImageLoaded) {
            // Use ape image instead of animation sprite sheet
            this.el.style.backgroundImage = `url('${this.selectedApe.image}')`;
            this.el.style.backgroundSize = 'cover';
            this.el.style.backgroundPosition = 'center';
            this.el.style.backgroundRepeat = 'no-repeat';
            this.el.style.borderRadius = '50%';
            this.el.style.border = '2px solid #FFD700';
            
            // Store animation reference for other methods
            this.animation = animation;
            this.currentFrame = 0;
            this.frameIncrement = 1;
            
            if (typeof callback === 'function') {
                this.callback = callback;
            }
        } else {
            // Fall back to default sprite animation
            super.setAnimation(animation, index, callback);
        }
    }
    
    // Override refresh to prevent frame changes when using ape image
    refresh() {
        if (this.selectedApe && this.apeImageLoaded) {
            // Just update the idle counter without changing background position
            this.idleCounter = (this.idleCounter + 1) % this.normalizeRefrashRate(this.animation.refreshRate);
        } else {
            // Use default sprite animation
            super.refresh();
        }
    }
    
    // Update sprite to display ape image
    updateSpriteForApe() {
        if (this.selectedApe && this.apeImageLoaded && this.el) {
            // Apply ape styling to the existing sprite element
            this.el.style.backgroundImage = `url('${this.selectedApe.image}')`;
            this.el.style.backgroundSize = 'cover';
            this.el.style.backgroundPosition = 'center';
            this.el.style.backgroundRepeat = 'no-repeat';
            this.el.style.borderRadius = '50%';
            this.el.style.border = '2px solid #FFD700';
            this.el.style.boxSizing = 'border-box';
        }
    }
    
    // Override render to ensure ape styling is applied
    render() {
        super.render();
        
        // Apply ape styling after initial render
        if (this.selectedApe && this.apeImageLoaded) {
            this.updateSpriteForApe();
        }
    }
}

export default ApePacman; 