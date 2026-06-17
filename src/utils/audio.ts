/**
 * Web Audio API synthesizer for background music and game sound effects.
 * This guarantees audio works dynamic, lightweight and asset-free.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmInterval: any = null;
  private isBgmPlaying = false;
  private tempo = 135; // BPM
  private beatStep = 0;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Main music gain
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.bgmGain.connect(this.ctx.destination);

      // Sound FX gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    }
    
    // Resume context if suspended (browser security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Plays background music
  public startMusic() {
    this.initCtx();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    // Simple upbeat loop: base & melody
    const stepDuration = 60 / this.tempo / 2; // eighth notes
    let lastScheduledTime = this.ctx!.currentTime;

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      
      const now = this.ctx.currentTime;
      // Schedule ahead
      if (now > lastScheduledTime - 0.1) {
        this.scheduleNotes(this.beatStep, lastScheduledTime);
        this.beatStep = (this.beatStep + 1) % 16;
        lastScheduledTime += stepDuration;
      }
      this.bgmInterval = setTimeout(playStep, 50);
    };

    playStep();
  }

  public stopMusic() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  private scheduleNotes(step: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Happy pentatonic scale notes (C-D-E-G-A)
    const melody = [
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50 // C6
    ];

    const bass = [
      130.81, // C3
      146.83, // D3
      164.81, // E3
      196.00, // G3
      220.00, // A3
    ];

    // Bassline (Step sequencer 16 steps)
    // Plays on downbeats (0, 4, 8, 12, etc)
    const baseStep = Math.floor(step / 4);
    const bassPatterns = [
      [0, 0, 3, 3], // C, C, G, G
      [2, 2, 4, 4], // E, E, A, A
    ];
    const patternGroup = Math.floor(step / 8) % 2;
    const bassNoteIndex = bassPatterns[patternGroup][baseStep % 4];

    if (step % 2 === 0) {
      this.playSynthNote(bass[bassNoteIndex], 0.25, 'triangle', 0.08, time);
    }

    // Melody pattern - simple algorithmic melody
    const melodyTriggerChance = [
      true, false, true, false,
      true, true, false, true,
      true, false, true, false,
      true, true, true, false
    ];

    if (melodyTriggerChance[step]) {
      // Pick note based on time/step
      const noteOffset = (step * 3 + Math.floor(time)) % melody.length;
      const noteFreq = melody[noteOffset];
      this.playSynthNote(noteFreq, 0.18, 'sine', 0.04, time);
    }
  }

  private playSynthNote(freq: number, duration: number, type: OscillatorType, volume: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      // Volume envelope (Attack Decay Sustain Release)
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gainNode);
      gainNode.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch (e) {
      console.warn("Failed to schedule synth note:", e);
    }
  }

  // Quick sound when sector changes
  public playTick() {
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      // Pitch drop for a snappy "tick"
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gainNode.gain.setValueAtTime(0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gainNode);
      gainNode.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn("Failed to play tick sound:", e);
    }
  }

  // Celebratory sound when win settles
  public playWin() {
    try {
      this.initCtx();
      if (!this.ctx || !this.sfxGain) return;

      const now = this.ctx.currentTime;
      const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Sweet C-Major arpeggio

      arpeggio.forEach((freq, idx) => {
        const noteTime = now + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const subOsc = this.ctx!.createOscillator();
        const gainNode = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        subOsc.type = 'sine'; // enrich harmonic tone
        subOsc.frequency.setValueAtTime(freq * 1.5, noteTime);

        gainNode.gain.setValueAtTime(0, noteTime);
        gainNode.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.connect(gainNode);
        subOsc.connect(gainNode);
        gainNode.connect(this.sfxGain!);

        osc.start(noteTime);
        subOsc.start(noteTime);
        osc.stop(noteTime + 0.45);
        subOsc.stop(noteTime + 0.45);
      });
    } catch (e) {
      console.warn("Failed to play win fanfare:", e);
    }
  }
}

export const audioEngine = new AudioEngine();
