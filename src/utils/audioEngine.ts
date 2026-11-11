import { RemixSettings, Song } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;
  private convolver: ConvolverNode | null = null;
  private wetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  private isInitialized = false;
  private currentSong: Song | null = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  
  // Callbacks
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onPlayStateCallback: ((isPlaying: boolean) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  // Procedural synth audio cache for offline/starter tracks
  private synthBlobs: Map<string, string> = new Map();

  constructor() {
    // Defer AudioContext creation to first user gesture
  }

  private initContext() {
    if (this.isInitialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      this.audioEl = new Audio();
      this.audioEl.crossOrigin = 'anonymous';
      this.audioEl.preload = 'auto';

      // Connect nodes
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioEl);
      this.biquadFilter = this.audioCtx.createBiquadFilter();
      this.biquadFilter.type = 'lowpass';
      this.biquadFilter.frequency.value = 20000;

      // Reverb Convolver & Gains
      this.convolver = this.audioCtx.createConvolver();
      this.convolver.buffer = this.createImpulseResponse(this.audioCtx, 2.5, 2.0);

      this.wetGain = this.audioCtx.createGain();
      this.wetGain.gain.value = 0;

      this.dryGain = this.audioCtx.createGain();
      this.dryGain.gain.value = 1;

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1;

      // Routing: source -> filter -> (dryGain -> masterGain, convolver -> wetGain -> masterGain) -> destination
      this.sourceNode.connect(this.biquadFilter);
      this.biquadFilter.connect(this.dryGain);
      this.dryGain.connect(this.masterGain);

      this.biquadFilter.connect(this.convolver);
      this.convolver.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);

      this.masterGain.connect(this.audioCtx.destination);

      // Audio element listeners
      this.audioEl.addEventListener('timeupdate', () => {
        if (!this.audioEl) return;
        this.currentTime = this.audioEl.currentTime;
        const dur = isFinite(this.audioEl.duration) && this.audioEl.duration > 0
          ? this.audioEl.duration
          : (this.currentSong?.duration || 120);
        this.duration = dur;
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.duration);
        }
      });

      this.audioEl.addEventListener('ended', () => {
        if (this.audioEl?.loop) {
          this.audioEl.currentTime = 0;
          this.audioEl.play().catch(() => {});
          return;
        }
        this.isPlaying = false;
        if (this.onPlayStateCallback) this.onPlayStateCallback(false);
        if (this.onEndedCallback) this.onEndedCallback();
      });

      this.audioEl.addEventListener('play', () => {
        this.isPlaying = true;
        if (this.onPlayStateCallback) this.onPlayStateCallback(true);
      });

      this.audioEl.addEventListener('pause', () => {
        this.isPlaying = false;
        if (this.onPlayStateCallback) this.onPlayStateCallback(false);
      });

      this.audioEl.addEventListener('error', () => {
        // Fallback to synthesized audio preview if external URL fails
        if (this.currentSong) {
          const fallback = this.getOrCreateSynthAudio(this.currentSong);
          if (this.audioEl && this.audioEl.src !== fallback) {
            this.audioEl.src = fallback;
            this.audioEl.play().catch(() => {});
          }
        }
      });

      this.isInitialized = true;
    } catch {
      // Audio context might fail on restricted environment, handle gracefully
    }
  }

  // Algorithmic Impulse Response for Reverb
  private createImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = ((Math.random() * 2) - 1) * factor;
      right[i] = ((Math.random() * 2) - 1) * factor;
    }
    return impulse;
  }

  // Generates a rich, pleasant procedural lo-fi track for starter/offline songs
  public getOrCreateSynthAudio(song: Song): string {
    if (this.synthBlobs.has(song.id)) {
      return this.synthBlobs.get(song.id)!;
    }

    try {
      const sampleRate = 44100;
      const durationSeconds = 30; // 30 second preview
      const numSamples = sampleRate * durationSeconds;
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate soft musical chords based on song title hash
      let seed = 0;
      for (let i = 0; i < song.title.length; i++) {
        seed = (seed + song.title.charCodeAt(i) * 31) % 10000;
      }
      const baseFreq = 130 + (seed % 100); // warm bass/mid C3-G3
      const chordRatios = [1, 1.25, 1.5, 1.875]; // Major 7th chord

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const beat = (t * 1.5) % 4; // 90 BPM rhythm
        const beatEnvelope = Math.exp(-((beat % 1) * 3));
        
        let sample = 0;
        chordRatios.forEach((ratio, idx) => {
          const freq = baseFreq * ratio * (idx === 0 ? 0.5 : 1);
          // Vibrato
          const vib = Math.sin(t * 5) * 1.5;
          sample += Math.sin(2 * Math.PI * (freq + vib) * t) * (0.25 / (idx + 1));
        });

        // Add soft crackle / vinyl noise & warm kick rhythm
        const vinylNoise = (Math.random() * 2 - 1) * 0.015;
        const kick = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-((t % 1.33) * 12)) * 0.3;

        data[i] = (sample * 0.5 * (0.6 + 0.4 * beatEnvelope) + kick + vinylNoise) * Math.min(1, Math.min(t, durationSeconds - t));
      }

      // Convert buffer to WAV Blob URL
      const wavBlob = this.bufferToWavBlob(buffer);
      const blobUrl = URL.createObjectURL(wavBlob);
      this.synthBlobs.set(song.id, blobUrl);
      return blobUrl;
    } catch {
      return '';
    }
  }

  private bufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF identifier
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // subchunk1size (16 for PCM)
    setUint16(1); // audio format (1 is PCM)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }

  public async playSong(song: Song, remix?: RemixSettings): Promise<void> {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.currentSong = song;
    let url = song.audioUrl;
    if (!url || url.startsWith('blob:mock') || url.startsWith('synth:')) {
      url = this.getOrCreateSynthAudio(song);
    }

    if (this.audioEl) {
      if (this.audioEl.src !== url) {
        this.audioEl.src = url;
        this.audioEl.load();
      }

      this.applyRemixSettings(remix || song.remixSettings);

      try {
        await this.audioEl.play();
        this.isPlaying = true;
      } catch {
        // Fallback to synth audio
        const synthUrl = this.getOrCreateSynthAudio(song);
        if (synthUrl && this.audioEl.src !== synthUrl) {
          this.audioEl.src = synthUrl;
          await this.audioEl.play().catch(() => {});
        }
      }
    }
  }

  public async togglePlay(): Promise<void> {
    if (!this.audioEl || !this.currentSong) return;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    if (this.audioEl.paused) {
      await this.audioEl.play().catch(() => {});
    } else {
      this.audioEl.pause();
    }
  }

  public seek(seconds: number) {
    if (!this.audioEl) return;
    this.audioEl.currentTime = Math.max(0, Math.min(seconds, this.duration || 1000));
  }

  public setVolume(volume: number) {
    const vol = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }
    if (this.audioEl) {
      this.audioEl.volume = vol;
    }
  }

  public setLoop(loop: boolean) {
    if (this.audioEl) {
      this.audioEl.loop = loop;
    }
  }

  public applyRemixSettings(remix?: RemixSettings) {
    if (!remix) {
      // Default natural playback
      if (this.audioEl) {
        this.audioEl.playbackRate = 1.0;
        (this.audioEl as unknown as { preservesPitch?: boolean }).preservesPitch = true;
      }
      if (this.biquadFilter && this.audioCtx) {
        this.biquadFilter.frequency.setValueAtTime(20000, this.audioCtx.currentTime);
      }
      if (this.wetGain && this.dryGain && this.audioCtx) {
        this.wetGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.dryGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
      }
      return;
    }

    // 1. Speed (0.5x to 2.0x)
    const speed = Math.max(0.5, Math.min(2.0, remix.speed || 1.0));
    if (this.audioEl) {
      // Pitch Shift control in semitones:
      // If pitchShift is non-zero, we calculate pitch ratio: 2^(pitchShift / 12)
      // When preservesPitch = false, playbackRate scales both pitch and speed.
      // Modern Web Audio allows detune or preservesPitch manipulation
      const pitchSemitones = remix.pitchShift || 0;
      if (pitchSemitones !== 0) {
        (this.audioEl as unknown as { preservesPitch?: boolean }).preservesPitch = false;
        const pitchRatio = Math.pow(2, pitchSemitones / 12);
        this.audioEl.playbackRate = Math.max(0.25, Math.min(3.0, speed * pitchRatio));
      } else {
        (this.audioEl as unknown as { preservesPitch?: boolean }).preservesPitch = true;
        this.audioEl.playbackRate = speed;
      }
    }

    // 2. Low Pass Filter (500Hz to 20000Hz)
    const lpFreq = Math.max(500, Math.min(20000, remix.lowPassFilter ?? 20000));
    if (this.biquadFilter && this.audioCtx) {
      this.biquadFilter.frequency.setValueAtTime(lpFreq, this.audioCtx.currentTime);
    }

    // 3. Reverb (0 to 100%)
    const reverbWet = Math.max(0, Math.min(1, (remix.reverb || 0) / 100));
    if (this.wetGain && this.dryGain && this.audioCtx) {
      this.wetGain.gain.setValueAtTime(reverbWet * 0.85, this.audioCtx.currentTime);
      this.dryGain.gain.setValueAtTime(Math.max(0.2, 1 - reverbWet * 0.4), this.audioCtx.currentTime);
    }

    // If restart on edit is enabled and audio is playing, restart from 0
    if (remix.restartOnEdit && this.audioEl && !this.audioEl.paused) {
      this.audioEl.currentTime = 0;
    }
  }

  public setCallbacks(callbacks: {
    onTimeUpdate?: (time: number, duration: number) => void;
    onPlayState?: (isPlaying: boolean) => void;
    onEnded?: () => void;
    onError?: (err: string) => void;
  }) {
    if (callbacks.onTimeUpdate) this.onTimeUpdateCallback = callbacks.onTimeUpdate;
    if (callbacks.onPlayState) this.onPlayStateCallback = callbacks.onPlayState;
    if (callbacks.onEnded) this.onEndedCallback = callbacks.onEnded;
    if (callbacks.onError) this.onErrorCallback = callbacks.onError;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration || this.currentSong?.duration || 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
