import { useRef, useCallback, useEffect } from "react";

class SoundGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private isRunning = false;
  private crowdInterval: ReturnType<typeof setInterval> | null = null;
  private crowdNoiseSource: AudioBufferSourceNode | null = null;
  private crowdGainNode: GainNode | null = null;
  private bullAudioBuffer: AudioBuffer | null = null;

  constructor() {
    this.loadBullAudio();
  }

  private async loadBullAudio() {
    try {
      const response = await fetch("/models/collection-of-sounds-with-an-angry-growling-bull.mp3");
      const arrayBuffer = await response.arrayBuffer();
      // We need to wait for ctx to be created, so we'll decode it on first use or here if ready
      if (this.ctx) {
        this.bullAudioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      } else {
        // Store for later decoding
        const tempCtx = new AudioContext();
        this.bullAudioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
        tempCtx.close();
      }
    } catch (e) {
      console.error("Failed to load bull audio:", e);
    }
  }

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return { ctx: this.ctx, master: this.masterGain! };
  }

  playBullStep() {
    const { ctx, master } = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 60 + Math.random() * 20;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  playGrab() {
    const { ctx, master } = this.getCtx();
    // Impact thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(ctx.currentTime);
  }

  playShakeOff() {
    const { ctx, master } = this.getCtx();
    // Whoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);

    // Bull snort
    const snort = ctx.createOscillator();
    const snortGain = ctx.createGain();
    snort.type = "square";
    snort.frequency.setValueAtTime(90, ctx.currentTime + 0.05);
    snort.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
    snortGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
    snortGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    snort.connect(snortGain);
    snortGain.connect(master);
    snort.start(ctx.currentTime + 0.05);
    snort.stop(ctx.currentTime + 0.3);
  }

  playScore() {
    const { ctx, master } = this.getCtx();
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.25);
    });
  }

  playGameOver() {
    const { ctx, master } = this.getCtx();
    const notes = [392, 349, 330, 262]; // G4, F4, E4, C4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.4);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.4);
    });
  }

  startAmbient() {
    if (this.isRunning) return;
    const { ctx, master } = this.getCtx();
    this.isRunning = true;

    // Low drone
    this.ambientOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    this.ambientOsc.type = "sine";
    this.ambientOsc.frequency.value = 55;
    gain.gain.value = 0.04;
    this.ambientOsc.connect(gain);
    gain.connect(master);
    this.ambientOsc.start();
  }

  stopAmbient() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
    this.isRunning = false;
    this.stopCrowd();
  }

  // Crowd cheering ambient — procedural audience noise
  startCrowd() {
    if (this.crowdInterval) return;
    const { ctx, master } = this.getCtx();

    // Continuous crowd murmur (filtered noise)
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    this.crowdNoiseSource = ctx.createBufferSource();
    this.crowdNoiseSource.buffer = buffer;
    this.crowdNoiseSource.loop = true;

    // Bandpass filter to sound like crowd murmur
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    this.crowdGainNode = ctx.createGain();
    this.crowdGainNode.gain.value = 0.06;

    this.crowdNoiseSource.connect(filter);
    filter.connect(this.crowdGainNode);
    this.crowdGainNode.connect(master);
    this.crowdNoiseSource.start();

    // Random crowd bursts (claps, cheers, roars)
    this.crowdInterval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.4) {
        this.playCrowdClap();
      } else if (rand < 0.7) {
        this.playCrowdCheer();
      } else if (rand < 0.9) {
        this.playCrowdRoar();
      } else {
        this.playBullSnort();
      }
    }, 800 + Math.random() * 1500);
  }

  stopCrowd() {
    if (this.crowdInterval) {
      clearInterval(this.crowdInterval);
      this.crowdInterval = null;
    }
    if (this.crowdNoiseSource) {
      try { this.crowdNoiseSource.stop(); } catch (e) { }
      this.crowdNoiseSource = null;
    }
    this.crowdGainNode = null;
  }

  private playCrowdClap() {
    const { ctx, master } = this.getCtx();
    // Multiple short noise bursts = clapping
    for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
      const len = 0.03;
      const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < d.length; j++) {
        d[j] = (Math.random() * 2 - 1) * (1 - j / d.length);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      const offset = i * (0.08 + Math.random() * 0.04);
      g.gain.setValueAtTime(0.08 + Math.random() * 0.06, ctx.currentTime + offset);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + len);
      src.connect(g);
      g.connect(master);
      src.start(ctx.currentTime + offset);
    }
  }

  private playCrowdCheer() {
    const { ctx, master } = this.getCtx();
    // Rising tone = crowd "ooh!"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(500 + Math.random() * 200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }

  private playCrowdRoar() {
    const { ctx, master } = this.getCtx();
    // Big noise burst = crowd roar
    const len = 0.6 + Math.random() * 0.4;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const env = Math.sin((i / d.length) * Math.PI); // bell curve envelope
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600 + Math.random() * 400;
    filter.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.value = 0.07 + Math.random() * 0.04;

    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(ctx.currentTime);
  }

  playBullRoar() {
    const { ctx, master } = this.getCtx();

    if (this.bullAudioBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = this.bullAudioBuffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.4;
      source.connect(gain);
      gain.connect(master);
      source.start();
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 1.2);

    // Modulation for a "bellowing" effect
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    mod.frequency.value = 5;
    modGain.gain.value = 10;
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    mod.start();

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
    mod.stop(ctx.currentTime + 1.2);
  }

  playBullSnort() {
    const { ctx, master } = this.getCtx();
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

    const gain = ctx.createGain();
    gain.gain.value = 0.2;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start();
  }

  playHumanStep() {
    const { ctx, master } = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 150 + Math.random() * 50;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  playHumanScream() {
    const { ctx, master } = this.getCtx();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400 + Math.random() * 100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 200, ctx.currentTime + 0.4);

    osc2.type = "square";
    osc2.frequency.setValueAtTime(405 + Math.random() * 100, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(805 + Math.random() * 200, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  }

  playHumanGrunt() {
    const { ctx, master } = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120 + Math.random() * 40, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  startGame() {
    const { ctx, master } = this.getCtx();
    // Drum roll start
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 100 + i * 30;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15 + i * 0.02, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.12);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.12);
    }
    this.startAmbient();
    this.startCrowd();
  }
}

export const useGameSounds = () => {
  const soundRef = useRef<SoundGenerator | null>(null);

  const getSound = useCallback(() => {
    if (!soundRef.current) {
      soundRef.current = new SoundGenerator();
    }
    return soundRef.current;
  }, []);

  useEffect(() => {
    // Start crowd audio on first user interaction (click/keypress)
    const startCrowdOnInteract = () => {
      getSound().startCrowd();
      window.removeEventListener("click", startCrowdOnInteract);
      window.removeEventListener("keydown", startCrowdOnInteract);
    };
    window.addEventListener("click", startCrowdOnInteract);
    window.addEventListener("keydown", startCrowdOnInteract);

    return () => {
      soundRef.current?.stopAmbient();
      window.removeEventListener("click", startCrowdOnInteract);
      window.removeEventListener("keydown", startCrowdOnInteract);
    };
  }, []);

  return {
    playStep: () => getSound().playBullStep(),
    playGrab: () => getSound().playGrab(),
    playShakeOff: () => getSound().playShakeOff(),
    playScore: () => getSound().playScore(),
    playGameOver: () => getSound().playGameOver(),
    playBullRoar: () => getSound().playBullRoar(),
    playBullSnort: () => getSound().playBullSnort(),
    playHumanScream: () => getSound().playHumanScream(),
    playHumanGrunt: () => getSound().playHumanGrunt(),
    playHumanStep: () => getSound().playHumanStep(),
    startGame: () => getSound().startGame(),
    stopAmbient: () => getSound().stopAmbient(),
  };
};
