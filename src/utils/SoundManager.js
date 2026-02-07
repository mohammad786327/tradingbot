
/**
 * SoundManager Utility
 * Handles audio playback using Web Audio API synthesis.
 * Generates distinct procedural sounds to ensure reliability without external assets.
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.volume = 0.6; // Default volume 60%
    this.throttleTime = 2000; // 2 seconds
    this.lastPlayedTime = 0;
    this.enabled = true;
    
    // Initialize on first interaction if possible, or lazy load
    this.init();
  }

  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        this.loadSettings();
      }
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
    }
  }

  loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
      if (settings.volume !== undefined) this.volume = settings.volume / 100;
      if (settings.soundEnabled !== undefined) this.enabled = settings.soundEnabled;
    } catch (e) {
      console.warn('Error loading sound settings:', e);
    }
  }

  /**
   * Main play method
   * @param {string} soundId - 'pulse', 'chime', 'beep', 'bell', 'alert', 'softpop'
   * @param {boolean} force - Ignore throttling (e.g. for preview)
   */
  async play(soundId = 'chime', force = false) {
    if (!this.enabled && !force) return;
    
    if (!this.audioContext) this.init();
    if (!this.audioContext) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('Could not resume audio context:', e);
        return;
      }
    }

    // Throttling
    const now = Date.now();
    if (!force && now - this.lastPlayedTime < this.throttleTime) {
      return;
    }
    this.lastPlayedTime = now;

    // Route to specific synthesizer
    const method = this[`play${soundId.charAt(0).toUpperCase() + soundId.slice(1)}`];
    if (typeof method === 'function') {
      method.call(this);
    } else {
      this.playChime(); // Fallback
    }
  }

  // --- SYNTHESIZERS ---

  /**
   * Pulse: Soft, musical ascending tone
   * Smooth sine sweep, non-aggressive.
   */
  playPulse() {
    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.3);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.volume, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  /**
   * Chime: Clear bell chime sound
   * Major triad chord with long decay.
   */
  playChime() {
    const t = this.audioContext.currentTime;
    // C Major Triad (C5, E5, G5)
    const freqs = [523.25, 659.25, 783.99];

    freqs.forEach((f, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = f;
      
      // Slight detune for realism
      if (i > 0) osc.detune.value = Math.random() * 10 - 5;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  /**
   * Beep: Simple electronic beep
   * Short square wave, retro style.
   */
  playBeep() {
    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);

    gain.gain.setValueAtTime(this.volume * 0.5, t);
    gain.gain.setValueAtTime(this.volume * 0.5, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Bell: Traditional alert bell
   * Triangle wave with complex harmonics and metallic decay.
   */
  playBell() {
    const t = this.audioContext.currentTime;
    
    // Fundamental
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.type = 'triangle';
    osc1.frequency.value = 600;
    
    // Overtone (Metallic character)
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1450; 
    
    // Envelope 1 (Body)
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(this.volume * 0.5, t + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    
    // Envelope 2 (Ring)
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(this.volume * 0.3, t + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.audioContext.destination);
    gain2.connect(this.audioContext.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1.2);
    osc2.stop(t + 1.2);
  }

  /**
   * Alert: Urgent attention-grabbing sound
   * Sawtooth frequency modulation (Siren-like).
   */
  playAlert() {
    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(1000, t + 0.1);
    osc.frequency.linearRampToValueAtTime(600, t + 0.2);
    osc.frequency.linearRampToValueAtTime(1000, t + 0.3);
    osc.frequency.linearRampToValueAtTime(600, t + 0.4);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.volume * 0.6, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  /**
   * Softpop: Gentle pop/click sound
   * Very short sine burst, low frequency.
   */
  playSoftpop() {
    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(this.volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  setVolume(volPercent) {
    this.volume = Math.max(0, Math.min(1, volPercent / 100));
  }
  
  setEnabled(enabled) {
      this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();
