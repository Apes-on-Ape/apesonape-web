import Sound from './engine/Sound.js';

class SoundManager {
    constructor(options) {
        this.soundEnabled = !!options.soundEnabled;
        this.muted = false;
        
        if (this.soundEnabled) {
            const path = window.JSPACMAN_AUDIO_PATH || 'audio/';
            
            this.sounds = {
                intro     : new Sound(`${path}intro.mp3`),
                back      : new Sound(`${path}back.mp3`),
                dot       : new Sound(`${path}dot.mp3`),
                eaten     : new Sound(`${path}eaten.mp3`),
                eat       : new Sound(`${path}eat.mp3`),
                frightened: new Sound(`${path}frightened.mp3`),
                dead      : new Sound(`${path}dead.mp3`),
                bonus     : new Sound(`${path}bonus.mp3`),
                life      : new Sound(`${path}life.mp3`)
            };
            
            Object.keys(this.sounds).forEach(key => {
                options.addSound(this.sounds[key]);
            });
        }
        
        // Check if sound preference is stored for this browser session
        const storedMuted = sessionStorage.getItem('apeman_sound_muted');
        if (storedMuted !== null) {
            this.muted = storedMuted === 'true';
            if (this.muted) {
                this.mute(true);
            }
        }
    }
    
    play(sound) {
        if (this.soundEnabled && !this.muted) {
            this.sounds[sound].play();
        }
    }
    
    mute(muted) {
        this.muted = muted !== false;
        
        // Store preference in sessionStorage
        sessionStorage.setItem('apeman_sound_muted', String(this.muted));
        
        if (this.soundEnabled) {
            Object.keys(this.sounds).forEach(key => {
                this.sounds[key].mute(this.muted);
            });
        }
        
        return this.muted;
    }
    
    toggle() {
        return this.mute(!this.muted);
    }
    
    isMuted() {
        return this.muted;
    }
}

export default SoundManager;
