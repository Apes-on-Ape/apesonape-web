// Neon Racer - Sound Module

const Sound = {
    // Sound state
    isSoundEnabled: true,
    sounds: {},
    currentTrack: null,
    currentTrackName: "",
    soundCloudArtist: "apeprofessore",
    
    // Updated to use the specific Neon Racer playlist from ApeProfessore
    soundCloudPlaylistUrl: "https://soundcloud.com/apeprofessore/sets/arcade",
    
    // Initialize sounds
    init: function() {
        this.sounds = {};
        this.effectsVolume = 0.7;
        this.isMuted = false;
        
        // Load sound effects
        this.preloadSoundEffects();
        
        // Make sure we initialize the activeAudioElements array
        window.activeAudioElements = window.activeAudioElements || [];
        
        // Initialize SoundCloud API (but don't play music yet)
        this.initSoundCloudAPI(false);
    },
    
    // Load sound effects
    loadSounds: function() {
        // Use default sounds if not configured
        const soundUrls = Config.SOUND_URLS || {};
        
        // Only load crash sound
        if (soundUrls.crash) {
            this.createSound('crash', soundUrls.crash);
        } else {
            // Create a dummy sound that won't cause errors when played
            this.sounds['crash'] = { 
                play: () => Promise.resolve(), 
                volume: 0.3, 
                cloneNode: () => ({ 
                    play: () => Promise.resolve(), 
                    volume: 0.3,
                    onended: null
                }) 
            };
        }
    },
    
    // Preload sound effects
    preloadSoundEffects: function() {
        // Use default sounds if not configured
        const soundUrls = Config.SOUND_URLS || {};
        // Loading sound effects
        
        // Only load crash sound
        if (soundUrls.crash) {
            // Loading crash sound
            this.createSound('crash', soundUrls.crash);
        } else {
            console.warn(`Sound URL not configured for crash`);
            // Create a dummy sound that won't cause errors when played
            this.sounds['crash'] = { 
                play: () => Promise.resolve(), 
                volume: 0.3, 
                cloneNode: () => ({ 
                    play: () => Promise.resolve(), 
                    volume: 0.3,
                    onended: null
                }) 
            };
        }
        
        // Sound preloading completed
    },
    
    // Create a sound and add to the sounds collection
    createSound: function(name, url) {
        try {
            const audio = new Audio(url);
            
            // Handle load errors gracefully
            audio.onerror = () => {
                console.warn(`Sound ${name} at ${url} failed to load. Using silent audio.`);
                // Create a silent audio context as fallback
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    const silentAudio = new Audio();
                    // Store the silentAudio object in place of the failed audio
                    this.sounds[name] = silentAudio;
                } catch (e) {
                    console.error(`Cannot create fallback for ${name}:`, e);
                }
            };
            
            audio.volume = 0.3;
            this.sounds[name] = audio;
            return audio;
        } catch (e) {
            console.error(`Error creating sound ${name}:`, e);
            // Return a dummy audio object that won't throw errors when play() is called
            return { play: () => Promise.resolve(), volume: 0.3, cloneNode: () => ({ play: () => Promise.resolve(), volume: 0.3 }) };
        }
    },
    
    // Play a sound effect safely
    playSound: function(name) {
        if (!this.isSoundEnabled || name !== 'crash') return;
        
        try {
            // If sound exists, clone and play it for overlapping sounds
            if (this.sounds[name]) {
                let clone = null;
                
                // Try to clone the sound or create a fallback
                try {
                    if (this.sounds[name].cloneNode) {
                        clone = this.sounds[name].cloneNode();
                    } else {
                        // If cloneNode isn't available or fails
                        clone = this.sounds[name];
                    }
                } catch (e) {
                    console.warn(`Error cloning sound ${name}, using silent fallback:`, e);
                    // Create a silent fallback that doesn't throw errors
                    clone = { 
                        play: () => Promise.resolve(), 
                        volume: 0.3,
                        onended: null 
                    };
                }
                
                // Set volume if the property exists
                if (clone.volume !== undefined) {
                    clone.volume = 0.3;
                }
                
                // Handle play errors gracefully using a try-catch around the Promise
                try {
                    const playPromise = clone.play && typeof clone.play === 'function' 
                        ? clone.play() 
                        : Promise.resolve();
                        
                    if (playPromise && playPromise.catch) {
                        playPromise.catch(e => {
                            console.warn(`Could not play sound ${name}:`, e);
                        });
                    }
                } catch (e) {
                    console.warn(`Error playing sound ${name}:`, e);
                }
                
                // Add to active sounds and clean up when done
                window.activeAudioElements = window.activeAudioElements || [];
                
                // Only add to active elements if it's a valid Audio element
                if (clone instanceof HTMLAudioElement) {
                    window.activeAudioElements.push(clone);
                    
                    // Only set onended if it's a valid audio element
                    if (clone.onended !== undefined) {
                        clone.onended = () => {
                            const index = window.activeAudioElements.indexOf(clone);
                            if (index !== -1) {
                                window.activeAudioElements.splice(index, 1);
                            }
                        };
                    }
                }
            } else {
                console.warn(`Sound ${name} not found`);
            }
        } catch (e) {
            console.error(`Error playing sound ${name}:`, e);
        }
    },
    
    // Alias for playSound for backward compatibility
    playSoundSafely: function(name) {
        this.playSound(name);
    },
    
    // Toggle sound on/off
    toggleSound: function() {
        this.isSoundEnabled = !this.isSoundEnabled;
        // Sound state toggled
        return this.isSoundEnabled;
    },
    
    // Initialize SoundCloud API
    initSoundCloudAPI: function(autoPlay = false) {
        // Initializing SoundCloud API
        
        // Check if we already have an iframe in the DOM (added directly in HTML)
        const existingPlayer = document.getElementById('soundcloud-player');
        
        if (existingPlayer) {
            // Found existing SoundCloud player
            
            // Initialize the widget for the existing iframe
            if (window.SC && window.SC.Widget) {
                // Initializing widget from existing iframe
                const widget = window.SC.Widget(existingPlayer);
                
                widget.bind(window.SC.Widget.Events.READY, () => {
                    // SoundCloud widget ready
                    // Store for later use
                    this.scWidget = widget;
                    
                    // Load playlist info when the widget is ready
                    this.scWidget.getSounds(sounds => {
                        // Loaded playlist tracks
                        
                        // Setup handler for when track ends to play next random track
                        this.scWidget.bind(window.SC.Widget.Events.FINISH, () => {
                            // Track finished - playing next
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
                                    // Track playing
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
                // SoundCloud API loaded
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
            // SoundCloud API already loaded
            this.createSoundCloudPlayer(autoPlay);
        }
    },
    
    // Create SoundCloud player
    createSoundCloudPlayer: function(autoPlay = false) {
        // Creating SoundCloud player
        
        // Remove any existing player
        const existingPlayer = document.getElementById('soundcloud-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }
        
        // Create a hidden iframe with visual mode and neon colors
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
        
        // Use the playlist URL with visual=true and neon magenta color
        // Only auto-play if explicitly requested
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff00ff&auto_play=${autoPlay ? 'true' : 'false'}&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
        
        document.body.appendChild(iframe);
        
        console.log('SoundCloud player created with Neon Racer playlist');
        
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
                        console.log(`Loaded Neon Racer playlist with ${sounds.length} tracks`);
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
        
        // Set autoplay to true to force playback with neon magenta styling
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff00ff&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
        
        // Set a generic current track name since we can't get specific track info in fallback mode
        this.currentTrack = "unknown";
        this.currentTrackName = "Neon Racer Mix";
        
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
            
            // Empty source or non-autoplay source with neon styling
            replacementIframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff00ff&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
            
            // Replace the old iframe
            iframe.parentNode.replaceChild(replacementIframe, iframe);
        }
        
        this.currentTrack = null;
        this.currentTrackName = "";
    },
    
    // Stop all sounds
    stopAllSounds: function() {
        // Stop all active audio elements
        if (window.activeAudioElements) {
            window.activeAudioElements.forEach(audio => {
                try {
                    if (audio && typeof audio.pause === 'function') {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                } catch (e) {
                    console.warn('Error stopping audio element:', e);
                }
            });
            window.activeAudioElements = [];
        }
        
        // Stop SoundCloud track
        this.stopSoundCloudTrack();
    },
    
    // Enhanced toggle sound function
    toggleSound: function() {
        this.isSoundEnabled = !this.isSoundEnabled;
        
        if (!this.isSoundEnabled) {
            this.stopAllSounds();
            this.stopSoundCloudTrack();
        } else if (Game && !Game.isGameOver()) {
            // If we're enabling sound during gameplay, start a track
            this.playRandomSoundCloudTrack();
        }
        
        console.log(`Sound ${this.isSoundEnabled ? 'enabled' : 'disabled'}`);
        return this.isSoundEnabled;
    },
    
    // Clean up sound resources
    cleanUp: function() {
        this.stopAllSounds();
    }
}; 