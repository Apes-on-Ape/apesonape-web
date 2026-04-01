// Shared NFT Module for Arcade Games
// This module handles NFT functionality across all games in the arcade

const NFT = {
    // NFT state
    selectedApe: null,
    
    getCanonicalWallet: function() {
        try {
            return typeof window.getArcadeWalletForDatabase === 'function'
                ? window.getArcadeWalletForDatabase()
                : '';
        } catch (_) {
            return '';
        }
    },

    // Load the selected Ape from localStorage
    loadSelectedApe: function() {
        // Loading NFT data
        
        // First check for wallet-specific ape in localStorage
        const connectedWallet = this.getCanonicalWallet();
        
        if (connectedWallet) {
            try {
                // Check for selected ape in localStorage (set by the arcade hub)
                const savedApe = localStorage.getItem('selectedApe');
                
                // Loading saved player data
                
                if (savedApe) {
                    try {
                        const apeData = JSON.parse(savedApe);
                        console.log('Parsed selectedApe:', apeData);
                        
                        // Store the selected ape
                        this.selectedApe = apeData;
                        window.selectedApe = apeData;
                        
                        // Update UI elements if they exist
                        this.updateUIWithSelectedApe(apeData);
                        
                        return apeData;
                    } catch (error) {
                        console.error('Error parsing selectedApe from localStorage:', error);
                    }
                } else {
                    console.log('No selected ape found in localStorage');
                    this.clearSelectedApeUI();
                }
            } catch (error) {
                console.error('Error loading selectedApe from localStorage:', error);
            }
        } else {
            console.log('No wallet connected, cannot load selected ape');
            this.clearSelectedApeUI();
        }
        
        return null;
    },
    
    // Load the selected Ape from database (preferred method)
    loadSelectedApeFromDatabase: async function() {
        const connectedWallet = this.getCanonicalWallet();
        
        if (!connectedWallet) {
            console.log('No wallet connected, cannot load selected ape from database');
            return null;
        }
        
        try {
            // Try to load from database first
            if (window.SecureDB && window.SecureDB.isReady()) {
                const userData = await window.SecureDB.user.getByWallet(connectedWallet);
                
                if (userData && userData.selected_ape) {
                    let apeData;
                    
                    // Parse the selected_ape JSON if it's a string
                    if (typeof userData.selected_ape === 'string') {
                        try {
                            apeData = JSON.parse(userData.selected_ape);
                        } catch (e) {
                            console.warn('Failed to parse selected_ape JSON:', e);
                            return null;
                        }
                    } else {
                        apeData = userData.selected_ape;
                    }
                    
                    console.log('Loaded selected ape from database:', apeData);
                    
                    // Store the selected ape
                    this.selectedApe = apeData;
                    window.selectedApe = apeData;
                    
                    // Also update localStorage for backward compatibility
                    localStorage.setItem('selectedApe', JSON.stringify(apeData));
                    
                    // Update UI elements if they exist
                    this.updateUIWithSelectedApe(apeData);
                    
                    return apeData;
                } else {
                    console.log('No selected ape found in database');
                }
            } else {
                console.log('SecureDB not available, falling back to localStorage');
            }
        } catch (error) {
            console.error('Error loading selected ape from database:', error);
        }
        
        // Fallback to localStorage if database fails
        return this.loadSelectedApe();
    },
    
    // Update UI elements with selected ape data
    updateUIWithSelectedApe: function(apeData) {
        // Update the selected Ape display in the menu (if these elements exist)
        const selectedApeContainer = document.getElementById('selectedApeContainer');
        const selectedApeImage = document.getElementById('selectedApeImage');
        const selectedApeId = document.getElementById('selectedApeId');
        
        if (selectedApeContainer) {
            selectedApeContainer.style.display = 'block';
        }
        
        if (selectedApeImage) {
            // Try to use the actual image if available
            const imageUrl = apeData.image || apeData.imageUrl;
            if (imageUrl && !imageUrl.includes('placehold.co')) {
                selectedApeImage.src = imageUrl;
                // Add error handling for image loading
                selectedApeImage.onerror = () => {
                    console.error('Failed to load NFT image in menu, using placeholder');
                    selectedApeImage.src = this.createApePlaceholder(apeData.tokenId);
                };
            } else {
                // Fall back to placeholder
                selectedApeImage.src = this.createApePlaceholder(apeData.tokenId);
            }
            selectedApeImage.alt = apeData.name || `Ape #${apeData.tokenId}`;
        }
        
        if (selectedApeId) {
            selectedApeId.textContent = apeData.name || `Ape #${apeData.tokenId}`;
        }
        
        // Update profile view if it exists
        const profileSelectedApeId = document.getElementById('profileSelectedApeId');
        const profileSelectedApeImage = document.getElementById('profileSelectedApeImage');
        
        if (profileSelectedApeId) {
            profileSelectedApeId.textContent = apeData.name || `Ape #${apeData.tokenId}`;
        }
        
        if (profileSelectedApeImage) {
            // Try to use the actual image if available
            const imageUrl = apeData.image || apeData.imageUrl;
            if (imageUrl && !imageUrl.includes('placehold.co')) {
                profileSelectedApeImage.src = imageUrl;
                // Add error handling for image loading
                profileSelectedApeImage.onerror = () => {
                    console.error('Failed to load NFT image in profile, using placeholder');
                    profileSelectedApeImage.src = this.createApePlaceholder(apeData.tokenId);
                };
            } else {
                // Fall back to placeholder
                profileSelectedApeImage.src = this.createApePlaceholder(apeData.tokenId);
            }
            profileSelectedApeImage.alt = apeData.name || `Ape #${apeData.tokenId}`;
        }
    },
    
    // Clear UI elements when no ape is selected
    clearSelectedApeUI: function() {
        // Hide the selected Ape container if no Ape is selected
        const selectedApeContainer = document.getElementById('selectedApeContainer');
        if (selectedApeContainer) {
            selectedApeContainer.style.display = 'none';
        }
        
        // Update profile elements if they exist
        const profileSelectedApeId = document.getElementById('profileSelectedApeId');
        const profileSelectedApeImage = document.getElementById('profileSelectedApeImage');
        
        if (profileSelectedApeId) {
            profileSelectedApeId.textContent = 'No Ape Selected';
        }
        
        if (profileSelectedApeImage) {
            profileSelectedApeImage.src = '';
            profileSelectedApeImage.alt = 'No Ape Selected';
        }
    },
    
    // Set selected ape (used by games to set the ape from localStorage)
    setSelectedApe: function(apeData) {
        this.selectedApe = apeData;
        window.selectedApe = apeData;
        
        if (apeData) {
            this.updateUIWithSelectedApe(apeData);
        } else {
            this.clearSelectedApeUI();
        }
    },
    
    // Check if the connected wallet has Ape NFTs
    checkApeStatus: async function() {
        try {
            console.log("Checking Ape status...");
            const walletAddress =
                (typeof window.getArcadeWalletForDatabase === 'function' && window.getArcadeWalletForDatabase()) ||
                '';
            if (!walletAddress) {
                throw new Error('No Glyph wallet connected for arcade session.');
            }
            const res = await fetch(
                '/api/portfolio?' + new URLSearchParams({ address: String(walletAddress).toLowerCase().trim() }),
                { method: 'GET', credentials: 'same-origin' }
            );
            if (!res.ok) {
                throw new Error('Failed to verify Ape holder status.');
            }
            const data = await res.json();
            const total =
                typeof data.total === 'number' ? data.total : (Array.isArray(data.tokenIds) ? data.tokenIds.length : 0);
            return total > 0;
        } catch (error) {
            console.error('Error in checkApeStatus:', error);
            throw error;
        }
    },
    
    // Fetch NFTs from wallet via site API
    fetchWalletNFTs: async function(walletAddress) {
        if (!walletAddress) return [];
        
        try {
            const response = await fetch(
                '/api/portfolio?' + new URLSearchParams({ address: String(walletAddress).toLowerCase().trim() }),
                { method: 'GET', credentials: 'same-origin' }
            );
            if (!response.ok) return [];
            const payload = await response.json();
            const tokenIds = Array.isArray(payload.tokenIds) ? payload.tokenIds : [];
            if (!tokenIds.length) return [];
            
            const nfts = [];
            
            // Only fetch up to 5 NFTs to avoid too many requests
            const numToFetch = Math.min(tokenIds.length, 5);
            
            for (let i = 0; i < numToFetch; i++) {
                try {
                    const tokenId = String(tokenIds[i]);
                    console.log(`Token ID ${i}:`, tokenId);
                    
                    // Create placeholder immediately as fallback
                    const placeholderUrl = this.createApePlaceholder(tokenId);
                    
                    // Initialize with a default NFT object using placeholder
                    let nftData = {
                        tokenId,
                        name: `Ape #${tokenId}`,
                        imageUrl: placeholderUrl,
                        metadata: null
                    };
                    
                    // Add NFT to list
                    nfts.push(nftData);
                    
                } catch (error) {
                    console.error(`Error fetching token ${i}:`, error);
                    
                    // Add placeholder NFT
                    nfts.push({
                        tokenId: i.toString(),
                        name: `Ape #${i}`,
                        imageUrl: this.createApePlaceholder(i.toString())
                    });
                }
            }
            
            return nfts;
        } catch (error) {
            console.error('Error fetching NFTs via portfolio API:', error);
            return [];
        }
    },
    
    // Fetch metadata with multiple IPFS gateway fallbacks
    fetchMetadataWithFallbacks: async function(cid) {
        // Array of IPFS gateways to try
        const gateways = [
            'https://ipfs.io/ipfs/',
            'https://dweb.link/ipfs/',
            'https://gateway.pinata.cloud/ipfs/', 
            'https://ipfs.fleek.co/ipfs/',
            'https://gateway.ipfs.io/ipfs/'
        ];
        
        let lastError = null;
        
        // Try each gateway until one works
        for (const gateway of gateways) {
            try {
                const url = `${gateway}${cid}`;
                console.log(`Trying to fetch metadata from: ${url}`);
                
                // Use fetch with mode: 'cors' to handle CORS restrictions
                const response = await fetch(url, { 
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const metadata = await response.json();
                    console.log('Successfully fetched metadata:', metadata);
                    return metadata;
                }
            } catch (error) {
                console.warn(`Error fetching from ${gateway}:`, error);
                lastError = error;
                // Continue to the next gateway
            }
        }
        
        // If we get here, all gateways failed
        throw new Error(`Failed to fetch metadata from all gateways: ${lastError?.message || 'Unknown error'}`);
    },
    
    // Helper function to normalize IPFS URLs
    normalizeIpfsUrl: function(url) {
        if (!url) return '';
        
        // Handle URLs with ipfs:// protocol
        if (url.startsWith('ipfs://')) {
            const cid = url.replace('ipfs://', '');
            return `https://ipfs.io/ipfs/${cid}`;
        }
        
        // Handle URLs with /ipfs/ path format from various gateways
        if (url.includes('/ipfs/')) {
            const parts = url.split('/ipfs/');
            if (parts.length > 1) {
                return `https://ipfs.io/ipfs/${parts[1]}`;
            }
        }
        
        // Fix URLs with gateway domain but no /ipfs/ path
        if (url.includes('ipfs.io') || 
            url.includes('gateway.pinata.cloud') ||
            url.includes('ipfs.dweb.link') ||
            url.includes('gateway.ipfs.io') ||
            url.includes('ipfs.infura.io')) {
            
            // Extract the CID portion by getting the last part of the path
            const parts = url.split('/');
            const potentialCid = parts[parts.length - 1];
            
            // If it looks like a CID (either v0 or v1)
            if (potentialCid && 
                (potentialCid.startsWith('Qm') || 
                 potentialCid.startsWith('bafy'))) {
                return `https://ipfs.io/ipfs/${potentialCid}`;
            }
        }
        
        // Check for direct Cloudflare gateway errors
        if (url.includes('re-ipfs.com') || url.includes('cloudflare-ipfs.com')) {
            // Fix the malformed URLs
            const parts = url.split(/[/-]ipfs\.com\/ipfs\/|cloudflare-ipfs\.com\/ipfs\//);
            if (parts.length > 1) {
                return `https://ipfs.io/ipfs/${parts[1]}`;
            }
        }
        
        // Return the original URL if we couldn't normalize it
        return url;
    },
    
    // Helper function to create a placeholder image
    createApePlaceholder: function(tokenId) {
        const id = String(tokenId).padStart(4, '0');
        return `https://placehold.co/200x200/222222/00ffff?text=Ape%20%23${id}`;
    },
    
    // Helper function to get IPFS URL from CID
    getIpfsUrl: function(cid) {
        return `https://ipfs.io/ipfs/${cid}`;
    },
    
    // Global function to load selected ape from database (for use by all games)
    loadSelectedApeForGame: async function() {
        const connectedWallet = this.getCanonicalWallet();
        
        if (!connectedWallet) {
            console.log('🦧 No wallet connected, cannot load selected ape from database');
            return null;
        }
        
        console.log('🦧 Loading selected ape for game, wallet:', connectedWallet.substring(0, 10) + '...');
        
        try {
            // Use the API to get selected ape from database
            console.log('🌐 Making API call to /api/user/get_selected_ape...');
            const response = await fetch(`/api/user/get_selected_ape?wallet_address=${encodeURIComponent(connectedWallet)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 API response for selected ape:', data);
                
                if (data.status === 'success' && data.selected_ape) {
                    console.log('🎯 Successfully loaded selected ape from database:', data.selected_ape);
                    
                    // Store the selected ape globally
                    this.selectedApe = data.selected_ape;
                    window.selectedApe = data.selected_ape;
                    
                    // Also update localStorage for backward compatibility
                    localStorage.setItem('selectedApe', JSON.stringify(data.selected_ape));
                    console.log('💾 Updated localStorage with selected ape');
                    
                    return data.selected_ape;
                } else if (data.status === 'no_ape_selected') {
                    console.log('ℹ️ No selected ape found in database for wallet:', connectedWallet.substring(0, 10) + '...');
                } else if (data.status === 'user_not_found') {
                    console.log('ℹ️ User not found in database for wallet:', connectedWallet.substring(0, 10) + '...');
                } else {
                    console.warn('⚠️ Unexpected API response:', data);
                }
            } else {
                console.error('❌ API request failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error loading selected ape from API:', error);
        }
        
        // Fallback to localStorage if database fails
        console.log('🔄 Falling back to localStorage...');
        const fallbackApe = this.loadSelectedApe();
        console.log('🔄 Fallback ape result:', fallbackApe);
        return fallbackApe;
    }
}; 

// Export the module for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NFT;
} 