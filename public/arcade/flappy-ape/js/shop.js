// Flappy Ape - Shop Module
const Shop = {
    modal: null,
    content: null,
    loading: null,
    error: null,
    points: 0,
    
    // Initialize DOM elements
    initialize() {
        this.modal = document.getElementById('shopModal');
        this.content = document.getElementById('shopContent');
        this.loading = document.getElementById('shopLoading');
        this.error = document.getElementById('shopError');
        
        // Retrieve points from localStorage or initialize to 0
        this.loadPoints();
        
        console.log('Shop initialized successfully');
    },
    
    // Load points from localStorage
    loadPoints() {
        try {
            const savedPoints = localStorage.getItem('arcade_points');
            if (savedPoints) {
                this.points = parseInt(savedPoints, 10) || 0;
            } else {
                this.points = 0;
            }
        } catch (error) {
            console.error('Error loading points:', error);
            this.points = 0;
        }
    },
    
    // Save points to localStorage
    savePoints() {
        try {
            localStorage.setItem('arcade_points', this.points.toString());
        } catch (error) {
            console.error('Error saving points:', error);
        }
    },
    
    // Add points (called when game ends)
    addPoints(points) {
        this.loadPoints(); // Refresh from storage first
        this.points += points;
        this.savePoints();
    },
    
    // Spend points
    spendPoints(amount) {
        if (this.points >= amount) {
            this.points -= amount;
            this.savePoints();
            return true;
        }
        return false;
    },
    
    // Show shop
    show() {
        this.loadPoints(); // Refresh points from storage
        this.modal.style.display = 'block';
        this.render();
    },
    
    // Render shop items
    render() {
        this.hideLoading();
        this.hideError();
        
        // Clear content
        this.content.innerHTML = '';
        
        // Add points display
        const pointsSection = document.createElement('div');
        pointsSection.className = 'points-section';
        pointsSection.innerHTML = `
            <h3>Your Arcade Points: ${this.points}</h3>
            <p>Earn points by playing games in the arcade!</p>
        `;
        
        this.content.appendChild(pointsSection);
        
        // Add shop items
        CONFIG.SHOP_ITEMS.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            
            // Convert ETH cost to points (1 ETH = 100 points for simplicity)
            const pointsCost = Math.round(item.cost * 100);
            
            itemElement.innerHTML = `
                <div class="shop-item-info">
                    <h3 class="shop-item-name">${item.name}</h3>
                    <p class="shop-item-description">${item.description}</p>
                </div>
                <div class="shop-item-price">${pointsCost} Points</div>
                <button class="arcade-button buy-button" data-item-id="${item.id}" data-cost="${pointsCost}">Buy</button>
            `;
            
            this.content.appendChild(itemElement);
        });
        
        // Add event listeners for buy buttons
        document.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.itemId;
                const pointsCost = parseInt(button.dataset.cost, 10);
                const item = CONFIG.SHOP_ITEMS.find(i => i.id === itemId);
                if (item) {
                    this.buyItem(item, pointsCost);
                }
            });
        });
    },
    
    // Buy item
    async buyItem(item, pointsCost) {
        try {
            this.loadPoints(); // Refresh points from storage
            
            if (this.points < pointsCost) {
                this.showError('Not enough points! Keep playing to earn more.');
                return;
            }
            
            this.showLoading();
            
            // Process purchase with points
            if (this.spendPoints(pointsCost)) {
                // Apply item effect
                this.applyItemEffect(item);
                
                // Update UI
                this.render();
                
                // Show success message
                this.showSuccess(`Successfully purchased ${item.name}`);
            } else {
                this.showError('Failed to purchase item - not enough points');
            }
        } catch (error) {
            console.error('Error buying item:', error);
            this.showError('Failed to purchase item');
        } finally {
            this.hideLoading();
        }
    },
    
    // Apply item effect
    applyItemEffect(item) {
        switch (item.id) {
            case 'extra_life':
                Game.addLife();
                break;
            case 'slow_motion':
                Game.setSlowMotion(item.value);
                break;
            case 'wider_gap':
                Game.setWiderGap(item.value);
                break;
            case 'double_points':
                Game.setDoublePoints(item.duration);
                break;
        }
    },
    
    // Show loading state
    showLoading() {
        this.loading.style.display = 'block';
        this.error.style.display = 'none';
    },
    
    // Hide loading state
    hideLoading() {
        this.loading.style.display = 'none';
    },
    
    // Show error message
    showError(message) {
        this.hideLoading();
        this.error.textContent = message;
        this.error.style.display = 'block';
    },
    
    // Hide error message
    hideError() {
        this.error.style.display = 'none';
    },
    
    // Show success message
    showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.textContent = message;
        
        this.content.insertBefore(successElement, this.content.firstChild);
        
        setTimeout(() => {
            successElement.remove();
        }, 3000);
    }
}; 