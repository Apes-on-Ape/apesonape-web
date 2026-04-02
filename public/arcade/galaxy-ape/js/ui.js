// Run Ape - UI Module for notifications and messages

const UI = {
    // Notification system
    notifications: [],
    
    // Initialize UI system
    init: function() {
        this.notifications = [];
        console.log('UI system initialized');
    },
    
    // Show notification
    showNotification: function(message, duration = 2000) {
        const notification = {
            message: message,
            duration: duration,
            startTime: Date.now(),
            alpha: 1.0
        };
        
        this.notifications.push(notification);
        console.log('Notification:', message);
    },
    
    // Update notifications
    update: function(deltaTime) {
        const currentTime = Date.now();
        
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            const elapsed = currentTime - notification.startTime;
            
            // Fade out in the last 500ms
            if (elapsed > notification.duration - 500) {
                const fadeTime = elapsed - (notification.duration - 500);
                notification.alpha = Math.max(0, 1 - (fadeTime / 500));
            }
            
            // Remove expired notifications
            if (elapsed >= notification.duration) {
                this.notifications.splice(i, 1);
            }
        }
    },
    
    // Draw notifications
    draw: function(ctx, canvas) {
        const startY = canvas.height * 0.3;
        const lineHeight = 30;
        
        for (let i = 0; i < this.notifications.length; i++) {
            const notification = this.notifications[i];
            const y = startY + (i * lineHeight);
            
            ctx.save();
            ctx.globalAlpha = notification.alpha;
            
            // Draw background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const textWidth = ctx.measureText(notification.message).width + 20;
            ctx.fillRect(
                (canvas.width - textWidth) / 2 - 10,
                y - 15,
                textWidth + 20,
                25
            );
            
            // Draw text
            ctx.font = 'bold 14px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(notification.message, canvas.width / 2, y);
            
            ctx.restore();
        }
    },
    
    // Reset UI system
    reset: function() {
        this.notifications = [];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = UI;
} 