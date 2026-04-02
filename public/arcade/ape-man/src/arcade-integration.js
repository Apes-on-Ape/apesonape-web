import './styles.css';
import Game from './js/Game.js';

class ArcadePacman {
    constructor() {
        // Set the base path for assets immediately
        window.JSPACMAN_ASSETS_PATH = '/ape-man/src/';
        window.JSPACMAN_IMG_PATH = '/ape-man/src/img/';
        window.JSPACMAN_AUDIO_PATH = '/ape-man/src/audio/';
        
        this.game = null;
        this.isRunning = false;
        
        // Initialize wallet and NFT handling
        this.initializeWallet();
    }
    
    initializeWallet() {
        // Check for wallet connection from arcade
        const connectedWallet =
            typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';
        if (connectedWallet) {
            console.log('Found wallet connection from arcade:', connectedWallet);
            
            // Merge with wallet-guard's partial window.Wallet (never replace the whole object)
            window.Wallet = window.Wallet || {};
            window.Wallet.currentWallet = connectedWallet;
            if (typeof window.Wallet.getCurrentWallet !== 'function') {
                window.Wallet.getCurrentWallet = function () {
                    return this.currentWallet;
                };
            }
            
            // Load selected ape from localStorage
            try {
                const selectedApe = localStorage.getItem('selectedApe');
                if (selectedApe) {
                    window.selectedApe = JSON.parse(selectedApe);
                    console.log('Selected ape loaded from localStorage:', window.selectedApe);
                }
            } catch (e) {
                console.error('Error loading selected ape from localStorage:', e);
            }
        } else {
            console.log('No wallet connection found');
        }
        
        // Set up a periodic check for wallet changes
        setInterval(() => this.checkWalletChanges(), 5000);
    }
    
    checkWalletChanges() {
        const connectedWallet =
            typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';
        
        // If wallet changed
        if (window.Wallet && window.Wallet.currentWallet !== connectedWallet) {
            console.log('Wallet connection changed, updating...');
            
            if (connectedWallet) {
                window.Wallet.currentWallet = connectedWallet;
                
                // Reload selected ape from localStorage
                try {
                    const selectedApe = localStorage.getItem('selectedApe');
                    if (selectedApe) {
                        window.selectedApe = JSON.parse(selectedApe);
                        console.log('Selected ape updated from localStorage:', window.selectedApe);
                    }
                } catch (e) {
                    console.error('Error loading selected ape from localStorage:', e);
                }
            } else {
                // Wallet disconnected
                window.Wallet.currentWallet = null;
                window.selectedApe = null;
            }
        }
    }

    start() {
        if (this.isRunning) return;
        
        const container = document.getElementById('arcadeContainer');
        const gameContainer = document.createElement('div');
        gameContainer.className = 'js-pacman-container';
        
        const playground = document.createElement('div');
        playground.className = 'js-pacman-playground';
        
        // Create title
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = 'APE-MAN';
        playground.appendChild(title);
        
        playground.appendChild(playground);
        gameContainer.appendChild(playground);
        container.appendChild(gameContainer);

        const vw = container.clientWidth;
        const vh = container.clientHeight;

        this.game = new Game({
            el: playground,
            width: vw,
            height: vh
        });

        this.isRunning = true;
    }

    stop() {
        if (!this.isRunning) return;
        
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }

        const container = document.getElementById('arcadeContainer');
        const gameContainer = container.querySelector('.js-pacman-container');
        if (gameContainer) {
            container.removeChild(gameContainer);
        }

        this.isRunning = false;
    }
}

// Export a singleton instance
const arcadePacman = new ArcadePacman();
export default arcadePacman; 