/**
 * Arena Esports Audio & Voice Synthesizer Service
 * Generates procedural audio effects and voice announcer callouts with zero external dependencies.
 */

class ArenaSoundService {
  constructor() {
    this.audioCtx = null;
    this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem('arena_audio_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.masterEnabled = parsed.master !== false;
        this.voiceEnabled = parsed.voice !== false;
      } else {
        this.masterEnabled = true;
        this.voiceEnabled = true;
      }
    } catch (e) {
      this.masterEnabled = true;
      this.voiceEnabled = true;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('arena_audio_settings', JSON.stringify({
        master: this.masterEnabled,
        voice: this.voiceEnabled
      }));
    } catch (e) {}
  }

  setMasterEnabled(enabled) {
    this.masterEnabled = Boolean(enabled);
    this.saveSettings();
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    this.saveSettings();
  }

  isMasterEnabled() {
    return this.masterEnabled;
  }

  isVoiceEnabled() {
    return this.voiceEnabled;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // --- Procedural Synth Sound Effects ---

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    if (!this.masterEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  playCountdown(count) {
    if (!this.masterEnabled) return;
    if (count > 0) {
      this.playTone(440, 'sine', 0.12, 0.25); // Beep A4
    } else {
      this.playTone(880, 'triangle', 0.35, 0.35); // High buzzer A5
    }
  }

  playTestCasePass() {
    if (!this.masterEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two-tone rising chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playWarning() {
    if (!this.masterEnabled) return;
    // Low alert buzz
    this.playTone(220, 'sawtooth', 0.25, 0.25);
  }

  playVictory() {
    if (!this.masterEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heroic triumphant chord progression
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch (e) {}
  }

  playDefeat() {
    if (!this.masterEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Descending minor chord
      const notes = [440, 415.30, 392, 349.23];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (e) {}
  }

  // --- Voice Announcer Speech Synthesis ---

  announce(text) {
    if (!this.masterEnabled || !this.voiceEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Cancel any existing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // Fast esports cadence
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }
}

export const arenaSound = new ArenaSoundService();
export default arenaSound;
