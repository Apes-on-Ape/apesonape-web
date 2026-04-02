// Galaxy Ape - Sound Module

const Sound = {
    // Sound state
    isSoundEnabled: true,
    sounds: {},
    currentTrack: null,
    currentTrackName: "",
    soundCloudArtist: "apeprofessore",
    
    // SoundCloud playlist URL
    soundCloudPlaylistUrl: "https://soundcloud.com/apeprofessore/sets/arcade",
    
    // Initialize sounds
    init: function() {
        // Make sure we initialize the activeAudioElements array
        window.activeAudioElements = window.activeAudioElements || [];
        
        // Initialize SoundCloud API (but don't play music yet) with error handling
        try {
            this.initSoundCloudAPI(false);
        } catch (error) {
            console.error('SoundCloud initialization failed:', error);
        }
    },
    
    // Initialize SoundCloud API
    initSoundCloudAPI: function(autoPlay = false) {
        // Check if we already have an iframe in the DOM
        const existingPlayer = document.getElementById('soundcloud-player');
        
        if (existingPlayer) {
            // Initialize the widget for the existing iframe
            if (window.SC && window.SC.Widget) {
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
        
        // Create a hidden iframe with visual mode
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
        
        // Use the playlist URL with visual=true and color parameters
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff5500&auto_play=${autoPlay ? 'true' : 'false'}&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
        
        document.body.appendChild(iframe);
        
        console.log('SoundCloud player created with Arcade playlist');
        
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
                        console.log(`Loaded Galaxy Ape playlist with ${sounds.length} tracks`);
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
        
        // Set autoplay to true to force playback
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
        
        // Set a generic current track name since we can't get specific track info in fallback mode
        this.currentTrack = "unknown";
        this.currentTrackName = "Galaxy Ape Mix";
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
    
    // Play ArcadePlaylist (main method called by game when starting)
    playArcadePlaylist: function() {
        console.log('Starting arcade playlist for Galaxy Ape');
        this.playRandomSoundCloudTrack();
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
            
            // Empty source or non-autoplay source
            replacementIframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.soundCloudPlaylistUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
            
            // Replace the old iframe
            iframe.parentNode.replaceChild(replacementIframe, iframe);
        }
        
        this.currentTrack = null;
        this.currentTrackName = "";
        this.updateNowPlayingInfo();
    },
    
    // Update the now playing info
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
    
    // Function to safely play sounds (compatibility method)
    playSoundSafely: function(soundName) {
        if (!this.isSoundEnabled) {
            return;
        }
        
        // Special case for background music - use SoundCloud instead
        if (soundName === 'background') {
            this.playRandomSoundCloudTrack();
            return;
        }
    },
    
    // Play sound effect (dummy function to maintain compatibility)
    play: function(sound) {
        // No sound effects, just a placeholder for compatibility
        return;
    },
    
    // Stop all sounds
    stopAllSounds: function() {
        try {
            // Stop SoundCloud track
            this.stopSoundCloudTrack();
            
            // Stop all tracked audio elements
            if (window.activeAudioElements && window.activeAudioElements.length > 0) {
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
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        } catch (e) {
            console.error('Error stopping sounds:', e);
        }
    },
    
    // Set mute state
    setMute: function(muted) {
        if (this.isSoundEnabled !== !muted) {
            this.toggleSound();
        }
    }
};

// Initialize sound when the script loads
document.addEventListener('DOMContentLoaded', function() {
    Sound.init();
}); 