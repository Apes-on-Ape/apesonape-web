// Neon Racer - Visual Effects Module (Mobile Optimized)

const Effects = {
    // List of active particles
    particles: [],
    
    // List of active explosions
    explosions: [],
    
    // Performance optimization - frame skipping
    frameSkipCounter: 0,
    particleUpdateFrequency: 3, // Update particles every 3 frames for better performance (was 2)
    
    // Mobile detection and optimization
    isMobile: false,
    mobileOptimizationLevel: 'high', // 'high', 'medium', 'low'
    
    // Initialize the effects system
    init: function() {
        // Clear any existing effects
        this.particles = [];
        this.explosions = [];
        this.lastUpdate = 0;
        this.frameSkipCounter = 0;
        
        // Detect mobile device
        this.detectMobile();
        
        // Set optimization level based on device
        this.setOptimizationLevel();
        
        console.log('Effects initialized with mobile optimization:', {
            isMobile: this.isMobile,
            optimizationLevel: this.mobileOptimizationLevel,
            particleUpdateFrequency: this.particleUpdateFrequency
        });
    },
    
    // Detect mobile device
    detectMobile: function() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        
        // Additional mobile detection
        if (window.innerWidth <= 768 || window.innerHeight <= 768) {
            this.isMobile = true;
        }
        
        // Check for touch support
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.isMobile = true;
        }
    },
    
    // Set optimization level based on device performance
    setOptimizationLevel: function() {
        if (this.isMobile) {
            // Check for low-end devices
            const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
            const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores if not available
            
            if (memory < 4 || cores < 4) {
                this.mobileOptimizationLevel = 'high';
                this.particleUpdateFrequency = 4; // Update every 4 frames
            } else {
                this.mobileOptimizationLevel = 'medium';
                this.particleUpdateFrequency = 3; // Update every 3 frames
            }
        } else {
            this.mobileOptimizationLevel = 'low';
            this.particleUpdateFrequency = 2; // Update every 2 frames
        }
    },
    
    reset: function() {
        this.particles = [];
        this.explosions = [];
        this.lastUpdate = 0;
        this.frameSkipCounter = 0;
    },
    
    // Create an explosion effect at a position (heavily reduced for mobile)
    createExplosion: function(x, y, color = '#ff00ff', size = Config.EXPLOSION_SIZE) {
        // Skip explosions on high optimization mobile
        if (this.isMobile && this.mobileOptimizationLevel === 'high') {
            return;
        }
        
        // Create a new explosion
        const explosion = {
            x: x,
            y: y,
            size: size,
            alpha: 1.0,
            color: color,
            startTime: Date.now(),
            duration: this.isMobile ? 300 : 500 // Shorter duration on mobile
        };
        
        // Add to explosions array
        this.explosions.push(explosion);
        
        // Create very few particles for mobile
        let particleCount;
        if (this.isMobile) {
            if (this.mobileOptimizationLevel === 'high') {
                particleCount = 2; // Very minimal
            } else {
                particleCount = 4; // Minimal
            }
        } else {
            particleCount = Math.max(4, Math.floor(Config.PARTICLE_COUNT * 0.6));
        }
        
        this.createParticles(x, y, color, particleCount);
    },
    
    // Create particles at a position (heavily optimized for mobile)
    createParticles: function(x, y, color = '#ff00ff', count = 6) {
        // Skip particles on high optimization mobile
        if (this.isMobile && this.mobileOptimizationLevel === 'high') {
            return;
        }
        
        // Reduce count for mobile
        if (this.isMobile) {
            count = Math.floor(count * 0.5);
        }
        
        for (let i = 0; i < count; i++) {
            // Create particle with random properties
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const size = this.isMobile ? (1 + Math.random() * 2) : (2 + Math.random() * 3);
            const lifetime = this.isMobile ? (200 + Math.random() * 400) : (400 + Math.random() * 800);
            
            // Skip color variation on mobile for performance
            let particleColor = color;
            if (!this.isMobile && Math.random() > 0.5) {
                const colorVariation = Math.random() * 20;
                
                if (color.startsWith('#')) {
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    
                    const newR = Math.min(255, Math.max(0, r + (Math.random() * colorVariation - colorVariation/2)));
                    const newG = Math.min(255, Math.max(0, g + (Math.random() * colorVariation - colorVariation/2)));
                    const newB = Math.min(255, Math.max(0, b + (Math.random() * colorVariation - colorVariation/2)));
                    
                    particleColor = `rgb(${Math.floor(newR)}, ${Math.floor(newG)}, ${Math.floor(newB)})`;
                }
            }
            
            // Create the particle
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: particleColor,
                alpha: 1.0,
                startTime: Date.now(),
                lifetime: lifetime
            };
            
            // Add to particles array
            this.particles.push(particle);
        }
    },
    
    // Create a trail effect behind a moving object (disabled on mobile)
    createTrail: function(x, y, color = '#ff00ff', count = 1) {
        // Disable trails on mobile for performance
        if (this.isMobile) {
            return;
        }
        
        // Only create trail particles every few frames for better performance
        if (this.frameSkipCounter % 3 !== 0) return;
        
        for (let i = 0; i < count; i++) {
            const size = 1.5 + Math.random() * 1.5;
            const lifetime = 300 + Math.random() * 200;
            
            const offsetX = (Math.random() - 0.5) * 4;
            const offsetY = (Math.random() - 0.5) * 4;
            
            const vy = 1.5 + Math.random() * 1.5;
            
            // Simplified color variation
            let particleColor = color;
            if (Math.random() > 0.7) {
                const colorVariation = Math.random() * 15;
                if (color.startsWith('#')) {
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    
                    const newR = Math.min(255, Math.max(0, r + (Math.random() * colorVariation - colorVariation/2)));
                    const newG = Math.min(255, Math.max(0, g + (Math.random() * colorVariation - colorVariation/2)));
                    const newB = Math.min(255, Math.max(0, b + (Math.random() * colorVariation - colorVariation/2)));
                    
                    particleColor = `rgb(${Math.floor(newR)}, ${Math.floor(newG)}, ${Math.floor(newB)})`;
                }
            }
            
            const particle = {
                x: x + offsetX,
                y: y + offsetY,
                vx: (Math.random() - 0.5) * 0.5,
                vy: vy,
                size: size,
                color: particleColor,
                alpha: 0.8,
                startTime: Date.now(),
                lifetime: lifetime
            };
            
            this.particles.push(particle);
        }
    },
    
    // Create a trail effect specifically for the car (disabled on mobile)
    createCarTrail: function(x, y, color = '#ff00ff', count = 1) {
        // Disable car trails on mobile for performance
        if (this.isMobile) {
            return;
        }
        
        // Frame skipping for car trails
        if (this.frameSkipCounter % 4 !== 0) return;
        
        for (let i = 0; i < count; i++) {
            const size = 2 + Math.random() * 1;
            const lifetime = 300 + Math.random() * 100;
            
            const offsetX = (Math.random() - 0.5) * 4;
            const offsetY = (Math.random() - 0.5) * 2;
            
            const vy = 1 + Math.random() * 0.8;
            const vx = (Math.random() - 0.5) * 0.3;
            
            const particle = {
                x: x + offsetX,
                y: y + offsetY,
                vx: vx,
                vy: vy,
                size: size,
                color: color,
                alpha: 0.7,
                startTime: Date.now(),
                lifetime: lifetime
            };
            
            this.particles.push(particle);
        }
    },
    
    // Create a trail effect (disabled on mobile)
    createTrailEffect: function(x, y, color = '#ff00ff') {
        // Disable trail effects on mobile for performance
        if (this.isMobile) {
            return;
        }
        
        const count = 2;
        
        // Frame skipping
        if (this.frameSkipCounter % 3 !== 0) return;
        
        for (let i = 0; i < count; i++) {
            const size = 2 + Math.random() * 1.5;
            const lifetime = 300 + Math.random() * 150;
            
            const offsetX = (Math.random() - 0.5) * 6;
            const offsetY = (Math.random() - 0.5) * 2;
            
            const vy = 1.5 + Math.random() * 1;
            const vx = (Math.random() - 0.5) * 0.6;
            
            const particle = {
                x: x + offsetX,
                y: y + offsetY,
                vx: vx,
                vy: vy,
                size: size,
                color: color,
                alpha: 0.8,
                startTime: Date.now(),
                lifetime: lifetime
            };
            
            this.particles.push(particle);
        }
    },
    
    // Create a boost effect (directional particles) - simplified for mobile
    createBoostEffect: function(x, y, direction = 'up', color = '#ffff00', count = 5) {
        // Reduce count for mobile
        if (this.isMobile) {
            count = Math.floor(count * 0.6);
        }
        
        for (let i = 0; i < count; i++) {
            const size = this.isMobile ? (1 + Math.random() * 2) : (2 + Math.random() * 3);
            const lifetime = this.isMobile ? (200 + Math.random() * 150) : (300 + Math.random() * 200);
            let vx = 0, vy = 0;
            
            // Set velocity based on direction
            switch (direction) {
                case 'up':
                    vx = (Math.random() - 0.5) * 2;
                    vy = -2 - Math.random() * 3;
                    break;
                case 'down':
                    vx = (Math.random() - 0.5) * 2;
                    vy = 2 + Math.random() * 3;
                    break;
                case 'left':
                    vx = -2 - Math.random() * 3;
                    vy = (Math.random() - 0.5) * 2;
                    break;
                case 'right':
                    vx = 2 + Math.random() * 3;
                    vy = (Math.random() - 0.5) * 2;
                    break;
            }
            
            // Add some offset based on direction
            let offsetX = 0, offsetY = 0;
            
            switch (direction) {
                case 'up':
                    offsetX = (Math.random() - 0.5) * 10;
                    offsetY = 10 + Math.random() * 5;
                    break;
                case 'down':
                    offsetX = (Math.random() - 0.5) * 10;
                    offsetY = -10 - Math.random() * 5;
                    break;
                case 'left':
                    offsetX = 10 + Math.random() * 5;
                    offsetY = (Math.random() - 0.5) * 10;
                    break;
                case 'right':
                    offsetX = -10 - Math.random() * 5;
                    offsetY = (Math.random() - 0.5) * 10;
                    break;
            }
            
            const particle = {
                x: x + offsetX,
                y: y + offsetY,
                vx: vx,
                vy: vy,
                size: size,
                color: color,
                alpha: 0.8,
                startTime: Date.now(),
                lifetime: lifetime
            };
            
            this.particles.push(particle);
        }
    },
    
    // Create an effect when collecting items (simplified for mobile)
    createItemEffect: function(x, y, color = '#ffff00') {
        // Skip item effects on high optimization mobile
        if (this.isMobile && this.mobileOptimizationLevel === 'high') {
            return;
        }
        
        // Create fewer sparkling particles for mobile
        const particleCount = this.isMobile ? 4 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const size = this.isMobile ? (0.5 + Math.random() * 1.5) : (1 + Math.random() * 2);
            const lifetime = this.isMobile ? (200 + Math.random() * 200) : (300 + Math.random() * 300);
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: size,
                color: color,
                alpha: 1.0,
                startTime: Date.now(),
                lifetime: lifetime
            };
            
            this.particles.push(particle);
        }
        
        // Create a smaller burst effect for mobile
        const burstParticles = this.isMobile ? 2 : 4;
        const burstMax = this.isMobile ? 6 : 12;
        this.createBurstEffect(x, y, color, burstParticles, burstMax);
    },
    
    // Keep backward compatibility for any code that might still use createCoinEffect
    createCoinEffect: function(x, y, color = '#ffff00') {
        this.createItemEffect(x, y, color);
    },
    
    // Create a burst effect (particles radiating out) - simplified for mobile
    createBurstEffect: function(x, y, color = '#ffff00', minParticles = 8, maxParticles = 16) {
        // Skip burst effects on high optimization mobile
        if (this.isMobile && this.mobileOptimizationLevel === 'high') {
            return;
        }
        
        // Reduce particle count for mobile
        if (this.isMobile) {
            minParticles = Math.floor(minParticles * 0.5);
            maxParticles = Math.floor(maxParticles * 0.5);
        }
        
        const particleCount = minParticles + Math.floor(Math.random() * (maxParticles - minParticles));
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const size = this.isMobile ? (0.5 + Math.random() * 1.5) : (1 + Math.random() * 2);
            const lifetime = this.isMobile ? (300 + Math.random() * 100) : (400 + Math.random() * 200);
            
            const randomizedAngle = angle + (Math.random() * 0.2 - 0.1);
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(randomizedAngle) * speed,
                vy: Math.sin(randomizedAngle) * speed,
                size: size,
                color: color,
                alpha: 1.0,
                startTime: Date.now(),
                lifetime: lifetime
            };
            
            this.particles.push(particle);
        }
    },
    
    // Create shield effect around a player (simplified for mobile)
    createShieldEffect: function(x, y) {
        // Skip shield effects on high optimization mobile
        if (this.isMobile && this.mobileOptimizationLevel === 'high') {
            return;
        }
        
        const count = this.isMobile ? 10 : 20;
        const color = '#00ffff';
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 10;
            
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;
            
            const particle = {
                x: particleX,
                y: particleY,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: this.isMobile ? (1 + Math.random() * 2) : (2 + Math.random() * 3),
                color: color,
                alpha: 1.0,
                startTime: Date.now(),
                lifetime: this.isMobile ? (300 + Math.random() * 200) : (500 + Math.random() * 300)
            };
            
            this.particles.push(particle);
        }
    },
    
    // Update all effects (with enhanced frame skipping for mobile)
    update: function(delta) {
        // Increment frame counter for skipping
        this.frameSkipCounter++;
        
        // Update particles with mobile-optimized frequency
        if (this.frameSkipCounter % this.particleUpdateFrequency === 0) {
            this.updateParticles(delta);
        }
        
        // Always update explosions (they're less frequent and more important)
        this.updateExplosions(delta);
    },
    
    // Update particles (optimized for mobile)
    updateParticles: function(delta) {
        const currentTime = Date.now();
        
        // Update and remove expired particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Calculate age of particle
            const age = currentTime - particle.startTime;
            
            // Remove expired particles
            if (age > particle.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Update alpha based on lifetime (fade out)
            particle.alpha = 1.0 - (age / particle.lifetime);
        }
    },
    
    // Update explosions (optimized for mobile)
    updateExplosions: function(delta) {
        const currentTime = Date.now();
        
        // Update and remove expired explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            
            // Calculate age of explosion
            const age = currentTime - explosion.startTime;
            
            // Remove expired explosions
            if (age > explosion.duration) {
                this.explosions.splice(i, 1);
                continue;
            }
            
            // Update alpha based on duration (fade out)
            explosion.alpha = Math.max(0, 1.0 - (age / explosion.duration));
            
            // Expand the explosion with safety check
            const baseSize = Config.EXPLOSION_SIZE || 30;
            const expansionFactor = 1 + (age / explosion.duration);
            explosion.size = baseSize * expansionFactor;
            
            // Ensure size is finite and positive
            if (!isFinite(explosion.size) || explosion.size <= 0) {
                explosion.size = baseSize;
            }
        }
    },
    
    // Draw all effects (optimized for mobile)
    draw: function(ctx) {
        // Skip drawing on high optimization mobile if too many particles
        if (this.isMobile && this.mobileOptimizationLevel === 'high' && this.particles.length > 20) {
            return;
        }
        
        this.drawParticles(ctx);
        this.drawExplosions(ctx);
    },
    
    // Draw particles (optimized for mobile)
    drawParticles: function(ctx) {
        ctx.save();
        
        // Draw each particle
        for (const particle of this.particles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    // Draw explosions (optimized for mobile)
    drawExplosions: function(ctx) {
        ctx.save();
        
        // Draw each explosion
        for (const explosion of this.explosions) {
            // Safety check for finite values
            if (!isFinite(explosion.x) || !isFinite(explosion.y) || !isFinite(explosion.size) || explosion.size <= 0) {
                continue;
            }
            
            // Set up gradient for explosion
            const gradient = ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.size
            );
            
            gradient.addColorStop(0, `${explosion.color}`);
            gradient.addColorStop(0.5, `${explosion.color}88`);
            gradient.addColorStop(1, `${explosion.color}00`);
            
            ctx.globalAlpha = Math.max(0, Math.min(1, explosion.alpha));
            ctx.fillStyle = gradient;
            
            // Draw explosion
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}; 