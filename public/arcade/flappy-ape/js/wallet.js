// Flappy Ape - Wallet Module
const Wallet = {
    account: null,
    balance: '0',
    
    // Initialize wallet from Glyph-synced arcade storage
    async initialize() {
        try {
            const wallet =
                typeof window.getArcadeWalletForDatabase === 'function'
                    ? window.getArcadeWalletForDatabase()
                    : '';
            if (wallet) {
                await this.handleAccountsChanged([wallet]);
            } else {
                this.account = null;
                this.balance = '0';
                this.updateUI();
            }
        } catch (error) {
            console.error('Error initializing wallet:', error);
            throw error;
        }
    },
    
    // Check if wallet is connected
    async checkConnection() {
        try {
            const wallet =
                typeof window.getArcadeWalletForDatabase === 'function'
                    ? window.getArcadeWalletForDatabase()
                    : '';
            await this.handleAccountsChanged(wallet ? [wallet] : []);
        } catch (error) {
            console.error('Error checking connection:', error);
            throw error;
        }
    },
    
    // Connect wallet
    async connect() {
        try {
            let wallet =
                typeof window.getArcadeWalletForDatabase === 'function'
                    ? window.getArcadeWalletForDatabase()
                    : '';
            if (!wallet) {
                const fromGlyphStorage = String(localStorage.getItem('glyphEvmWallet') || '')
                    .trim()
                    .toLowerCase();
                if (/^0x[a-f0-9]{40}$/.test(fromGlyphStorage)) {
                    wallet = fromGlyphStorage;
                }
            }
            if (!wallet) {
                throw new Error('Sign in with Glyph first to connect wallet');
            }
            localStorage.setItem('connectedWallet', wallet);
            localStorage.setItem('walletProvider', 'glyph');
            await this.handleAccountsChanged([wallet]);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    },
    
    // Handle account changes
    async handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.account = null;
            this.balance = '0';
        } else {
            this.account = accounts[0];
            await this.updateBalance();
        }
        this.updateUI();
    },
    
    // Update balance
    async updateBalance() {
        try {
            if (this.account) {
                this.balance = '0';
            }
        } catch (error) {
            console.error('Error updating balance:', error);
            throw error;
        }
    },
    
    // Update UI
    updateUI() {
        const walletButton = document.getElementById('walletButton');
        if (walletButton) {
            if (this.account) {
                const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                walletButton.textContent = `${shortAddress} (${parseFloat(this.balance).toFixed(4)} ETH)`;
            } else {
                walletButton.textContent = 'Connect Wallet';
            }
        }
    },
    
    // Get current account
    getCurrentAccount() {
        return this.account;
    },
    
    // Get current balance
    getCurrentBalance() {
        return this.balance;
    },
    
    // Check if wallet is connected
    isConnected() {
        return this.account !== null;
    }
}; 