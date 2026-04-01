// Arcade System - Shared UI Module

const UI = {
    // UI Elements
    elements: {
        walletButton: null,
        walletStatus: null,
        pointsDisplay: null,
        apeSelector: null,
        gameSelector: null,
        modal: null,
        modalContent: null,
        modalClose: null
    },
    
    // Initialize UI
    initialize: function() {
        this.createElements();
        this.setupEventListeners();
        this.updateWalletStatus();
    },
    
    // Create UI elements
    createElements: function() {
        // Create header
        const header = document.createElement('header');
        header.className = 'arcade-header';
        
        // Wallet section
        const walletSection = document.createElement('div');
        walletSection.className = 'wallet-section';
        
        this.elements.walletButton = document.createElement('button');
        this.elements.walletButton.className = 'wallet-button';
        this.elements.walletButton.textContent = 'Connect Wallet';
        
        this.elements.walletStatus = document.createElement('div');
        this.elements.walletStatus.className = 'wallet-status';
        
        this.elements.pointsDisplay = document.createElement('div');
        this.elements.pointsDisplay.className = 'points-display';
        this.elements.pointsDisplay.textContent = 'Points: 0';
        
        walletSection.appendChild(this.elements.walletButton);
        walletSection.appendChild(this.elements.walletStatus);
        walletSection.appendChild(this.elements.pointsDisplay);
        
        // Ape selector
        this.elements.apeSelector = document.createElement('div');
        this.elements.apeSelector.className = 'ape-selector';
        this.elements.apeSelector.style.display = 'none';
        
        // Game selector
        this.elements.gameSelector = document.createElement('div');
        this.elements.gameSelector.className = 'game-selector';
        
        const games = [
            { id: 'neon-racer', name: 'Neon Racer', image: 'assets/images/neon-racer.jpg' },
            { id: 'block-dodger', name: 'Block Dodger', image: 'assets/images/block-dodger.jpg' }
        ];
        
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.dataset.gameId = game.id;
            
            const gameImage = document.createElement('img');
            gameImage.src = game.image;
            gameImage.alt = game.name;
            
            const gameName = document.createElement('h3');
            gameName.textContent = game.name;
            
            gameCard.appendChild(gameImage);
            gameCard.appendChild(gameName);
            this.elements.gameSelector.appendChild(gameCard);
        });
        
        // Modal
        this.elements.modal = document.createElement('div');
        this.elements.modal.className = 'modal';
        this.elements.modal.style.display = 'none';
        
        this.elements.modalContent = document.createElement('div');
        this.elements.modalContent.className = 'modal-content';
        
        this.elements.modalClose = document.createElement('span');
        this.elements.modalClose.className = 'modal-close';
        this.elements.modalClose.textContent = '×';
        
        this.elements.modal.appendChild(this.elements.modalContent);
        this.elements.modal.appendChild(this.elements.modalClose);
        
        // Assemble header
        header.appendChild(walletSection);
        header.appendChild(this.elements.apeSelector);
        
        // Add to document
        document.body.insertBefore(header, document.body.firstChild);
        document.body.appendChild(this.elements.gameSelector);
        document.body.appendChild(this.elements.modal);
        
        // Add styles
        this.addStyles();
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Wallet button
        this.elements.walletButton.addEventListener('click', async () => {
            if (!Wallet.isConnected) {
                await Wallet.connect();
            } else {
                Wallet.disconnect();
            }
            this.updateWalletStatus();
        });
        
        // Game cards
        this.elements.gameSelector.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                this.loadGame(gameId);
            });
        });
        
        // Modal close
        this.elements.modalClose.addEventListener('click', () => {
            this.hideModal();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.modal) {
                this.hideModal();
            }
        });
    },
    
    // Update wallet status
    updateWalletStatus: async function() {
        if (Wallet.isConnected) {
            this.elements.walletButton.textContent = 'Disconnect Wallet';
            this.elements.walletStatus.textContent = `Connected: ${Wallet.address.slice(0, 6)}...${Wallet.address.slice(-4)}`;
            this.elements.apeSelector.style.display = 'block';
            
            // Update points
            const points = await Database.getWalletPoints(Wallet.address);
            this.elements.pointsDisplay.textContent = `Points: ${points}`;
            
            // Load Apes
            await this.loadApes();
        } else {
            this.elements.walletButton.textContent = 'Connect Wallet';
            this.elements.walletStatus.textContent = 'Not Connected';
            this.elements.apeSelector.style.display = 'none';
            this.elements.pointsDisplay.textContent = 'Points: 0';
        }
    },
    
    // Load user's Apes
    loadApes: async function() {
        const apes = await Wallet.getApes();
        this.elements.apeSelector.innerHTML = '';
        
        if (apes.length === 0) {
            this.elements.apeSelector.innerHTML = '<p>No Apes found in your wallet</p>';
            return;
        }
        
        apes.forEach(ape => {
            const apeCard = document.createElement('div');
            apeCard.className = 'ape-card';
            apeCard.dataset.tokenId = ape.tokenId;
            
            const apeImage = document.createElement('img');
            apeImage.src = ape.image;
            apeImage.alt = ape.name;
            
            const apeName = document.createElement('h4');
            apeName.textContent = ape.name;
            
            apeCard.appendChild(apeImage);
            apeCard.appendChild(apeName);
            
            apeCard.addEventListener('click', async () => {
                await Wallet.selectApe(ape.tokenId, ape.image);
                this.showModal('Ape Selected', `You have selected ${ape.name} as your character!`);
            });
            
            this.elements.apeSelector.appendChild(apeCard);
        });
    },
    
    // Load game
    loadGame: function(gameId) {
        if (!Wallet.isConnected) {
            this.showModal('Wallet Required', 'Please connect your wallet to play games.');
            return;
        }
        
        const selectedApe = Wallet.getSelectedApe();
        if (!selectedApe) {
            this.showModal('Ape Required', 'Please select an Ape to play games.');
            return;
        }
        
        // Hide game selector
        this.elements.gameSelector.style.display = 'none';
        
        // Load game
        const gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        document.body.appendChild(gameContainer);
        
        // Load game script
        const script = document.createElement('script');
        script.src = `games/${gameId}/js/main.js`;
        document.body.appendChild(script);
    },
    
    // Show modal
    showModal: function(title, message) {
        this.elements.modalContent.innerHTML = `
            <h2>${title}</h2>
            <p>${message}</p>
        `;
        this.elements.modal.style.display = 'block';
    },
    
    // Hide modal
    hideModal: function() {
        this.elements.modal.style.display = 'none';
    },
    
    // Add styles
    addStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            .arcade-header {
                background: #1a1a1a;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
            }
            
            .wallet-section {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .wallet-button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .wallet-button:hover {
                background: #45a049;
            }
            
            .wallet-status {
                color: #888;
            }
            
            .points-display {
                color: #ffd700;
            }
            
            .ape-selector {
                display: flex;
                gap: 1rem;
                overflow-x: auto;
                padding: 1rem;
            }
            
            .ape-card {
                background: #2a2a2a;
                border-radius: 8px;
                padding: 0.5rem;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .ape-card:hover {
                transform: scale(1.05);
            }
            
            .ape-card img {
                width: 100px;
                height: 100px;
                object-fit: cover;
                border-radius: 4px;
            }
            
            .ape-card h4 {
                margin: 0.5rem 0 0;
                text-align: center;
                font-size: 0.9rem;
            }
            
            .game-selector {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 2rem;
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .game-card {
                background: #2a2a2a;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .game-card:hover {
                transform: scale(1.05);
            }
            
            .game-card img {
                width: 100%;
                height: 150px;
                object-fit: cover;
            }
            
            .game-card h3 {
                margin: 1rem;
                text-align: center;
                color: white;
            }
            
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background: #2a2a2a;
                padding: 2rem;
                border-radius: 8px;
                max-width: 500px;
                width: 90%;
                position: relative;
                color: white;
            }
            
            .modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                font-size: 1.5rem;
                cursor: pointer;
                color: #888;
            }
            
            .modal-close:hover {
                color: white;
            }
            
            #game-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100;
            }
        `;
        document.head.appendChild(style);
    }
}; 