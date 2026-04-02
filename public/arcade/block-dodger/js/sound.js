// Block Dodger - Sound Module

const Sound = {
    // Sound state
    isSoundEnabled: true,
    sounds: {},
    currentTrack: null,
    currentTrackName: "",
    soundCloudArtist: "apeprofessore",
    
    // Updated to use the specific Block Dodger playlist from ApeProfessore
    soundCloudPlaylistUrl: "https://soundcloud.com/apeprofessore/sets/arcade",
    
    // Initialize sounds
    init: function() {
        // Sound effects (keep these for game events)
        this.sounds = {
            explosion: new Audio(Config.SOUND_URLS.explosion),
            point: new Audio(Config.SOUND_URLS.point)
        };
        
        // Set explosion sound volume and preload
        this.sounds.explosion.volume = 1.0; // Full volume for explosion
        this.sounds.explosion.preload = 'auto'; // Preload the explosion sound
        
        // Add event listeners to the explosion sound
        this.sounds.explosion.addEventListener('canplaythrough', () => {
            // Explosion sound loaded and ready
        });
        
        this.sounds.explosion.addEventListener('error', (e) => {
            console.error('Error loading explosion sound, using fallback:', e);
            // Create fallback beep sound
            this.createFallbackExplosionSound();
        });
        
        // Preload the sounds
        this.sounds.explosion.load();
        
        // Make sure we initialize the activeAudioElements array
        window.activeAudioElements = window.activeAudioElements || [];
        
        // Initialize SoundCloud API (but don't play music yet) with error handling
        try {
        this.initSoundCloudAPI(false);
        } catch (error) {
            console.error('SoundCloud initialization failed:', error);
        }
    },

    // Create fallback explosion sound using Web Audio API
    createFallbackExplosionSound: function() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a short explosion-like sound
            const duration = 0.3;
            const sampleRate = audioContext.sampleRate;
            const length = sampleRate * duration;
            const buffer = audioContext.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate explosion sound (noise burst with envelope)
            for (let i = 0; i < length; i++) {
                const envelope = Math.exp(-i / (length * 0.1)); // Quick decay
                data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
            }
            
            // Store as fallback
            this.fallbackExplosionBuffer = buffer;
            this.audioContext = audioContext;
        } catch (error) {
            console.error('Could not create fallback explosion sound:', error);
        }
    },

    // Play fallback explosion sound
    playFallbackExplosion: function() {
        if (this.fallbackExplosionBuffer && this.audioContext) {
            try {
                const source = this.audioContext.createBufferSource();
                source.buffer = this.fallbackExplosionBuffer;
                source.connect(this.audioContext.destination);
                source.start();
            } catch (error) {
                console.error('Error playing fallback explosion:', error);
            }
        }
    },
    
    // Initialize SoundCloud API
    initSoundCloudAPI: function(autoPlay = false) {
        // Initializing SoundCloud
        
        // Check if we already have an iframe in the DOM (added directly in HTML)
        const existingPlayer = document.getElementById('soundcloud-player');
        
        if (existingPlayer) {
            // Found existing SoundCloud player
            
            // Initialize the widget for the existing iframe
            if (window.SC && window.SC.Widget) {
                // Initializing widget from existing iframe
                const widget = window.SC.Widget(existingPlayer);
                
                widget.bind(window.SC.Widget.Events.READY, () => {
                    console.log('SoundCloud widget is ready');
                    // Store for later use
                    this.scWidget = widget;
                    
                    // Load playlist info when the widget is ready
                    this.scWidget.getSounds(sounds => {
                        console.log(`Loaded Arcade playlist with ${sounds.length} tracks`);
                        
                        // Setup handler for when track ends to play next random track
                        this.scWidget.bind(window.SC.Widget.Events.FINISH, () => {
                            console.log('Track finished, playing another random track');
                            this.playRandomSoundCloudTrack();
                        });
                        
                        // Don't automatically start playing music
                        if (autoPlay) {
                            // Get the current track info
                            this.scWidget.getCurrentSound(sound => {
                                if (sound) {
                                    this.currentTrack = sound.id;
                                    this.currentTrackName = sound.title;
                                    this.updateNowPlayingInfo();
                                    console.log(`Now playing: ${sound.title}`);
                                }
                            });
                        }
                    });
                });
                
                return;
            }
        }
        
        // If no existing player or SC not available, add the script
        if (!window.SC) {
            const script = document.createElement('script');
            script.src = 'https://w.soundcloud.com/player/api.js';
            script.async = true;
            
            script.onload = () => {
                console.log('SoundCloud API loaded successfully');
                // Wait a bit to ensure the API is fully initialized
                setTimeout(() => {
                    this.createSoundCloudPlayer(autoPlay);
                }, 500);
            };
            
            script.onerror = (e) => {
                console.error('Failed to load SoundCloud API:', e);
            };
            
            document.head.appendChild(script);
        } else {
            console.log('SoundCloud API already loaded');
            this.createSoundCloudPlayer(autoPlay);
        }
    },
    
    // Create SoundCloud player
    createSoundCloudPlayer: function(autoPlay = false) {
        console.log('Creating SoundCloud player');
        
        // Remove any existing player
        const existingPlayer = document.getElementById('soundcloud-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }
        
        // Create a hidden iframe with visual mode and color from the provided embed
        const iframe = document.createElement('iframe');
        iframe.id = 'soundcloud-player';
        iframe.width = "100%";
        iframe.height = "166";
        iframe.frameBorder = "no";
        iframe.allow = "autoplay";
        iframe.style.position = 'fixed';
        iframe.style.bottom = '-200px';
        iframe.style.left = '0';
        iframe.style.zIndex = '-1';
        
        // Use the playlist URL with visual=true and color parameters from the provided embed
        // Only auto-play if explicitly requested
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff5500&auto_play=${autoPlay ? 'true' : 'false'}&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
        
        document.body.appendChild(iframe);
        
        console.log('SoundCloud player created with Block Dodger playlist');
        
        // Initialize the widget once the iframe is loaded
        iframe.onload = () => {
            console.log('SoundCloud iframe loaded');
            if (window.SC && window.SC.Widget) {
                console.log('Initializing SoundCloud widget');
                const widget = window.SC.Widget(iframe);
                
                widget.bind(window.SC.Widget.Events.READY, () => {
                    console.log('SoundCloud widget is ready');
                    // Store for later use
                    this.scWidget = widget;
                    
                    // Load playlist info when the widget is ready
                    this.scWidget.getSounds(sounds => {
                        console.log(`Loaded Block Dodger playlist with ${sounds.length} tracks`);
                        // Don't automatically play music
                        if (autoPlay) {
                            // If autoplay is requested, pick a random track to play
                            this.playRandomSoundCloudTrack();
                        }
                    });
                });
            } else {
                console.error('SC.Widget not available');
            }
        };
    },
    
    // Play a random track from the SoundCloud playlist
    playRandomSoundCloudTrack: function() {
        console.log('Attempting to play random SoundCloud track');
        
        if (!this.isSoundEnabled) {
            console.log('Sound is disabled, not playing track');
            return;
        }
        
        // Try to use the widget if available
        if (window.SC && window.SC.Widget && this.scWidget) {
            console.log('Using SC widget to play random track from playlist');
            
            try {
                // Get all sounds in the playlist
                this.scWidget.getSounds(sounds => {
                    if (sounds && sounds.length > 0) {
                        // Pick a random track
                        const randomIndex = Math.floor(Math.random() * sounds.length);
                        console.log(`Playing track ${randomIndex + 1} of ${sounds.length}`);
                        
                        // Skip to the random track
                        this.scWidget.skip(randomIndex);
                        
                        // Play it
                        this.scWidget.play();
                        
                        // Get the track info
                        this.scWidget.getCurrentSound(sound => {
                            if (sound) {
                                this.currentTrack = sound.id;
                                this.currentTrackName = sound.title;
                                this.updateNowPlayingInfo();
                                console.log(`Now playing: ${sound.title}`);
                            }
                        });
                        
                        // Setup handler for when track ends to play next random track
                        this.scWidget.bind(window.SC.Widget.Events.FINISH, () => {
                            console.log('Track finished, playing another random track');
                            this.playRandomSoundCloudTrack();
                        });
                    } else {
                        console.warn('No tracks found in the playlist');
                        this.fallbackSoundCloudPlay();
                    }
                });
            } catch (e) {
                console.error('Error using SC widget:', e);
                this.fallbackSoundCloudPlay();
            }
        } else {
            console.log('SC Widget not available, using fallback method');
            this.fallbackSoundCloudPlay();
        }
    },
    
    // Fallback method to play SoundCloud music if widget API fails
    fallbackSoundCloudPlay: function() {
        console.log('Using fallback method to play SoundCloud music');
        
        const iframe = document.getElementById('soundcloud-player');
        if (!iframe) {
            console.log('Creating new iframe for playback');
            this.createSoundCloudPlayer();
            setTimeout(() => this.playRandomSoundCloudTrack(), 1000);
            return;
        }
        
        // Set autoplay to true to force playback with the same visual styling
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
        
        // Set a generic current track name since we can't get specific track info in fallback mode
        this.currentTrack = "unknown";
        this.currentTrackName = "Block Dodger Mix";
        this.updateNowPlayingInfo();
        
        // Create the widget when the iframe loads
        iframe.onload = () => {
            if (window.SC && window.SC.Widget) {
                console.log('Setting up widget for track end handling');
                const widget = window.SC.Widget(iframe);
                this.scWidget = widget;
                
                widget.bind(window.SC.Widget.Events.READY, () => {
                    // Get current sound info
                    widget.getCurrentSound(sound => {
                        if (sound) {
                            this.currentTrack = sound.id;
                            this.currentTrackName = sound.title;
                            this.updateNowPlayingInfo();
                            console.log(`Now playing: ${sound.title}`);
                        }
                    });
                    
                    widget.bind(window.SC.Widget.Events.FINISH, () => {
                        console.log('Track finished, playing next');
                        this.playRandomSoundCloudTrack();
                    });
                });
            }
        };
    },
    
    // Stop current SoundCloud track
    stopSoundCloudTrack: function() {
        console.log('Stopping SoundCloud track');
        
        // Try to use the widget if available
        if (window.SC && window.SC.Widget && this.scWidget) {
            console.log('Using SC widget to pause track');
            try {
                this.scWidget.pause();
                return;
            } catch (e) {
                console.error('Error pausing track with SC widget:', e);
            }
        }
        
        // Fallback: remove the iframe
        const iframe = document.getElementById('soundcloud-player');
        if (iframe) {
            console.log('Using fallback method to stop track');
            
            // Create a replacement with no autoplay
            const replacementIframe = document.createElement('iframe');
            replacementIframe.id = 'soundcloud-player';
            replacementIframe.width = "100%";
            replacementIframe.height = "166";
            replacementIframe.frameBorder = "no";
            replacementIframe.allow = "autoplay";
            replacementIframe.style.position = 'fixed';
            replacementIframe.style.bottom = '-200px';
            replacementIframe.style.left = '0';
            replacementIframe.style.zIndex = '-1';
            
            // Empty source or non-autoplay source with the same styling
            replacementIframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
            
            // Replace the old iframe
            iframe.parentNode.replaceChild(replacementIframe, iframe);
        }
        
        this.currentTrack = null;
        this.currentTrackName = "";
        this.updateNowPlayingInfo();
    },
    
    // Update the now playing info in the profile
    updateNowPlayingInfo: function() {
        const nowPlayingElement = document.getElementById('nowPlaying');
        if (nowPlayingElement) {
            if (this.currentTrackName) {
                nowPlayingElement.textContent = `Now Playing: ${this.currentTrackName}`;
                nowPlayingElement.style.display = 'block';
            } else {
                nowPlayingElement.style.display = 'none';
            }
        }
        // If element doesn't exist, do nothing
    },
    
    // Toggle sound on/off
    toggleSound: function() {
        this.isSoundEnabled = !this.isSoundEnabled;
        
        if (!this.isSoundEnabled) {
            this.stopAllSounds();
            this.stopSoundCloudTrack();
        } else if (Game && !Game.isGameOver()) {
            // If we're enabling sound during gameplay, start a track
            this.playRandomSoundCloudTrack();
        }
        
        return this.isSoundEnabled;
    },
    
    // Function to safely play sounds
    playSoundSafely: function(soundName) {
        if (!this.isSoundEnabled) {
            console.log(`Cannot play sound "${soundName}": Sound is disabled`);
            return;
        }
        
        // Special case for background music - use SoundCloud instead
        if (soundName === 'background') {
            console.log('Playing SoundCloud background music');
            this.playRandomSoundCloudTrack();
            return;
        }
        
        if (!this.sounds[soundName]) {
            console.log(`Cannot play sound "${soundName}": Sound not found`);
            return;
        }
        
        try {
            // Special handling for explosion sound
            if (soundName === 'explosion') {
                // Try to play the main explosion sound, fallback if it fails
                try {
                const explosionSound = new Audio(Config.SOUND_URLS.explosion);
                explosionSound.volume = 1.0;
                
                // Play the sound directly
                explosionSound.play().catch(err => {
                        console.error('Failed to play explosion sound, using fallback:', err);
                        this.playFallbackExplosion();
                });
                } catch (err) {
                    console.error('Failed to create explosion sound, using fallback:', err);
                    this.playFallbackExplosion();
                }
                
                return;
            }
            
            // For other sound effects, clone the sound to allow multiple instances
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = this.sounds[soundName].volume;
            
            // Track this audio element so we can stop it later if needed
            window.activeAudioElements.push(sound);
            
            // Add event listener to remove from tracking when it ends naturally
            sound.addEventListener('ended', function() {
                const index = window.activeAudioElements.indexOf(sound);
                if (index !== -1) {
                    window.activeAudioElements.splice(index, 1);
                }
            });
            
            // Play the sound
            sound.play().catch(error => {
                console.error(`Error playing sound ${soundName}:`, error);
                // Remove from tracking if it fails to play
                const index = window.activeAudioElements.indexOf(sound);
                if (index !== -1) {
                    window.activeAudioElements.splice(index, 1);
                }
            });
        } catch (error) {
            console.error(`Error playing sound ${soundName}:`, error);
        }
    },
    
    // Stop all sounds
    stopAllSounds: function() {
        console.log('Stopping all sounds');
        
        try {
            // Stop SoundCloud track
            this.stopSoundCloudTrack();
            
            // First pause all sounds in the sounds object
            Object.values(this.sounds).forEach(sound => {
                if (!sound.paused) {
                    console.log(`Stopping sound: ${sound.src.split('/').pop()}`);
                    sound.pause();
                    sound.currentTime = 0;
                }
            });
            
            // Stop all tracked audio elements
            if (window.activeAudioElements && window.activeAudioElements.length > 0) {
                console.log(`Stopping ${window.activeAudioElements.length} active audio elements`);
                window.activeAudioElements.forEach(audio => {
                    if (!audio.paused) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                });
                // Clear the array once all elements are stopped
                window.activeAudioElements = [];
            }
            
            // As a fallback, find and stop all Audio elements in the document
            const allAudioElements = document.querySelectorAll('audio');
            allAudioElements.forEach(audio => {
                if (!audio.paused) {
                    console.log(`Stopping additional audio element: ${audio.src.split('/').pop()}`);
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
            
            // For extra safety, create and close a new AudioContext to release any Web Audio API resources
            if (window.AudioContext || window.webkitAudioContext) {
                try {
                    const dummyContext = new (window.AudioContext || window.webkitAudioContext)();
                    dummyContext.suspend().then(() => dummyContext.close());
                } catch (e) {
                    console.log('Could not create dummy AudioContext:', e);
                }
            }
            
            // If any sound is still playing through the Web Audio API, this will forcefully suspend all audio contexts
            if (window.audioContextList) {
                window.audioContextList.forEach(ctx => {
                    try {
                        ctx.suspend();
                    } catch (e) {
                        console.log('Error suspending audio context:', e);
                    }
                });
            }
        } catch (e) {
            console.error('Error stopping sounds:', e);
        }
    },
    
    // Helper function to stop point sounds
    stopPointSounds: function() {
        if (!window.activeAudioElements) return;
        
        // Find and stop all point sounds
        const pointSoundElements = window.activeAudioElements.filter(audio => 
            audio.src === this.sounds.point.src || audio.src.includes('mixkit.co/active_storage/sfx/2570')
        );
        
        if (pointSoundElements.length > 0) {
            console.log(`Stopping ${pointSoundElements.length} point sounds`);
            pointSoundElements.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
                
                // Remove from tracking array
                const index = window.activeAudioElements.indexOf(audio);
                if (index !== -1) {
                    window.activeAudioElements.splice(index, 1);
                }
            });
        }
    },
    
    // Debug function to report SoundCloud player status
    debugSoundCloudStatus: function() {
        console.log('=============== SoundCloud Debug ===============');
        console.log('Sound enabled:', this.isSoundEnabled);
        console.log('Current track ID:', this.currentTrack);
        console.log('Current track name:', this.currentTrackName);
        
        const iframe = document.getElementById('soundcloud-player');
        console.log('Player iframe exists:', !!iframe);
        if (iframe) {
            console.log('Player iframe src:', iframe.src);
        }
        
        console.log('SC global object exists:', !!window.SC);
        console.log('SC.Widget exists:', !!(window.SC && window.SC.Widget));
        console.log('Stored widget exists:', !!this.scWidget);
        
        if (window.SC && window.SC.Widget && this.scWidget) {
            try {
                this.scWidget.getCurrentSound(info => {
                    console.log('Current sound info:', info);
                });
                
                this.scWidget.getPosition(position => {
                    console.log('Current position (ms):', position);
                });
                
                this.scWidget.isPaused(paused => {
                    console.log('Is paused:', paused);
                });
            } catch (e) {
                console.error('Error getting widget status:', e);
            }
        }
        
        console.log('==============================================');
    }
}; 