// Run Ape - Wallet Module

const Wallet = {
    // Current wallet address
    currentWallet: null,
    
    // Initialize wallet connection
    init: function() {
        console.log('Initializing wallet connection...');
        this.checkForArcadeWallet();
    },
    
    // Check if wallet is connected through the arcade
    checkForArcadeWallet: function() {
        // Use canonical Glyph wallet from shared resolver.
        const storedWallet =
            typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';
        
        if (storedWallet) {
            console.log('Found wallet in localStorage:', storedWallet);
            this.currentWallet = storedWallet;
            try {
                localStorage.setItem('connectedWallet', storedWallet);
                localStorage.setItem('walletProvider', 'glyph');
            } catch (_) {}
            return true;
        }
        
        console.log('No wallet found');
        return false;
    },
    
    // Get current wallet address
    getCurrentWallet: function() {
        return this.currentWallet;
    },
    
    // Check if wallet is connected
    isConnected: function() {
        return !!this.currentWallet;
    },
    
    // Format wallet address for display
    formatWalletAddress: function(address) {
        if (!address) return '';
        
        if (address.length > 10) {
            return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        }
        
        return address;
    }
};

// Initialize wallet when the script loads
document.addEventListener('DOMContentLoaded', function() {
    Wallet.init();
}); 