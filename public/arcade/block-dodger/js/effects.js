// Block Dodger - Effects Module

const Effects = {
    // Explosion state
    explosionActive: false,
    explosionFrame: 0,
    flashElement: null, // Element for screen flash effect
    
    // Initialize effects
    init: function() {
        // Create screen flash element if it doesn't exist
        if (!this.flashElement) {
            this.flashElement = document.createElement('div');
            this.flashElement.id = 'screenFlash';
            this.flashElement.style.position = 'absolute';
            this.flashElement.style.top = '0';
            this.flashElement.style.left = '0';
            this.flashElement.style.width = '100%';
            this.flashElement.style.height = '100%';
            this.flashElement.style.pointerEvents = 'none';
            this.flashElement.style.zIndex = '999';
            this.flashElement.style.opacity = '0';
            this.flashElement.style.transition = 'opacity 0.3s ease-in-out';
            document.body.appendChild(this.flashElement);
        }
    },
    
    // Show a quick screen flash with the specified color and opacity
    showScreenFlash: function(color, maxOpacity = 0.5) {
        // Initialize if not already done
        if (!this.flashElement) {
            this.init();
        }
        
        // Set color and show flash
        this.flashElement.style.backgroundColor = color;
        this.flashElement.style.opacity = maxOpacity;
        
        // Hide flash after a short delay
        setTimeout(() => {
            this.flashElement.style.opacity = '0';
        }, 300);
    },
    
    // Show explosion animation
    showExplosion: function(x, y) {
        this.explosionActive = true;
        this.explosionFrame = 0;
        
        // Store explosion position
        const explosionX = x + 15;
        const explosionY = y + 15;
        
        // Create particle system for the explosion
        const particles = [];
        const particleCount = 50;
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            const size = 1 + Math.random() * 4;
            const life = 40 + Math.random() * 20;
            
            particles.push({
                x: explosionX,
                y: explosionY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: this.getExplosionParticleColor(i, particleCount),
                life: life,
                maxLife: life
            });
        }
        
        const animate = () => {
            if (!this.explosionActive) return;
            
            // Reduce visual effects when score is high
            const shouldReduceEffects = Game.getScore() > 50;
            
            // Clear explosion area (with a bit of extra space for glow effects)
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(explosionX, explosionY, Config.EXPLOSION_SIZE + this.explosionFrame * (shouldReduceEffects ? 4 : 8) + 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Draw shockwave
            ctx.beginPath();
            ctx.arc(explosionX, explosionY, Config.EXPLOSION_SIZE + this.explosionFrame * (shouldReduceEffects ? 4 : 8), 0, Math.PI * 2);
            
            // Create gradient for shockwave
            const shockwaveGradient = ctx.createRadialGradient(
                explosionX, explosionY, (Config.EXPLOSION_SIZE + this.explosionFrame * (shouldReduceEffects ? 4 : 8)) * 0.7,
                explosionX, explosionY, Config.EXPLOSION_SIZE + this.explosionFrame * (shouldReduceEffects ? 4 : 8)
            );
            shockwaveGradient.addColorStop(0, `rgba(255, 200, 50, ${0.7 - this.explosionFrame / (shouldReduceEffects ? 35 : 25)})`);
            shockwaveGradient.addColorStop(0.5, `rgba(255, 100, 50, ${0.5 - this.explosionFrame / (shouldReduceEffects ? 40 : 30)})`);
            shockwaveGradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
            
            ctx.fillStyle = shockwaveGradient;
            ctx.fill();
            
            // Draw bright inner explosion
            if (this.explosionFrame < (shouldReduceEffects ? 7 : 10)) {
                ctx.beginPath();
                ctx.arc(explosionX, explosionY, Config.EXPLOSION_SIZE + this.explosionFrame * (shouldReduceEffects ? 2 : 3), 0, Math.PI * 2);
                
                // Inner explosion gradient
                const innerGradient = ctx.createRadialGradient(
                    explosionX, explosionY, 0,
                    explosionX, explosionY, Config.EXPLOSION_SIZE + this.explosionFrame * (shouldReduceEffects ? 2 : 3)
                );
                innerGradient.addColorStop(0, `rgba(255, 255, 200, ${1 - this.explosionFrame / (shouldReduceEffects ? 15 : 10)})`);
                innerGradient.addColorStop(0.4, `rgba(255, 180, 50, ${0.8 - this.explosionFrame / (shouldReduceEffects ? 18 : 12)})`);
                innerGradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
                
                ctx.fillStyle = innerGradient;
                ctx.fill();
            }
            
            // Add glow effect only if not reducing effects
            if (!shouldReduceEffects) {
                ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
                ctx.shadowBlur = 30;
            }
            
            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Skip dead particles
                if (p.life <= 0) continue;
                
                // Update position
                p.x += p.vx;
                p.y += p.vy;
                
                // Apply drag
                p.vx *= 0.96;
                p.vy *= 0.96;
                
                // Apply gravity
                p.vy += 0.1;
                
                // Reduce life
                p.life--;
                
                // Calculate opacity based on life
                const opacity = p.life / p.maxLife;
                
                // Draw particle
                ctx.fillStyle = p.color.replace('OPACITY', opacity.toFixed(2));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * opacity, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            // Draw glowing lines from center only if not reducing effects
            if (!shouldReduceEffects && this.explosionFrame < 15) {
                const lineCount = 12;
                const lineLength = Config.EXPLOSION_SIZE + this.explosionFrame * 10;
                const lineOpacity = 1 - this.explosionFrame / 15;
                
                ctx.strokeStyle = `rgba(255, 255, 200, ${lineOpacity})`;
                ctx.lineWidth = 2;
                
                for (let i = 0; i < lineCount; i++) {
                    const angle = (i / lineCount) * Math.PI * 2;
                    const x2 = explosionX + Math.cos(angle) * lineLength;
                    const y2 = explosionY + Math.sin(angle) * lineLength;
                    
                    ctx.beginPath();
                    ctx.moveTo(explosionX, explosionY);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
            
            this.explosionFrame++;
            
            if (this.explosionFrame < (shouldReduceEffects ? 20 : 30)) {
                requestAnimationFrame(animate);
            } else {
                this.explosionActive = false;
                // Game over screen will be shown after points are updated
            }
        };
        
        animate();
    },
    
    // Get a color for an explosion particle based on its index
    getExplosionParticleColor: function(index, total) {
        // Colors range from bright yellow/white in center to red/orange at edges
        const colorIndex = index / total;
        
        if (colorIndex < 0.2) {
            return 'rgba(255, 255, 200, OPACITY)'; // Bright yellow/white
        } else if (colorIndex < 0.5) {
            return 'rgba(255, 230, 50, OPACITY)';  // Yellow
        } else if (colorIndex < 0.8) {
            return 'rgba(255, 150, 50, OPACITY)';  // Orange
        } else {
            return 'rgba(255, 50, 0, OPACITY)';    // Red
        }
    }
}; 