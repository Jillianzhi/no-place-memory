export type SfxCue =
  | 'contact_click'
  | 'entry_door'
  | 'radio_static'
  | 'window_slide'
  | 'glass_wipe'
  | 'clock_mechanism'
  | 'wood_door'
  | 'paper_pickup'
  | 'paper_drop'
  | 'paper_place'
  | 'ticket_stamp'
  | 'board_power'
  | 'bus_door'
  | 'old_lamp'
  | 'bike_bell'
  | 'metal_door'
  | 'projector_start'
  | 'archive_bag'
  | 'screen_receive'
  | 'photo_flip'
  | 'tape_stop'
  | 'dossier_reveal'
  | 'dossier_close'
  | 'material_error';

export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private currentMusic: HTMLAudioElement | null = null;
  private pendingMusic: { path: string; fade: boolean } | null = null;
  private fadeFrame = 0;
  private readonly musicVolume = 0.17;

  unlock(): void {
    if (!this.context) {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context = new AudioCtor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.38;
      this.master.connect(this.context.destination);
    } else if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    if (this.pendingMusic) this.startMusic(this.pendingMusic.path, this.pendingMusic.fade);
  }

  playMusic(path: string, fade = true): void {
    this.pendingMusic = { path, fade };
    if (this.context) this.startMusic(path, fade);
  }

  stopMusic(duration = 1200): void {
    this.pendingMusic = null;
    const outgoing = this.currentMusic;
    this.currentMusic = null;
    if (!outgoing) return;
    this.fade(outgoing, outgoing.volume, 0, duration, () => this.removeMusic(outgoing));
  }

  playSfx(cue: SfxCue): void {
    if (!this.context || !this.master) return;
    if (this.context.state === 'suspended') void this.context.resume();
    document.documentElement.dataset.lastSfx = cue;

    switch (cue) {
      case 'contact_click':
        this.click(620, 0, 0.075);
        this.noise(0.07, 0.045, 0.01, 'bandpass', 1280, 1.2);
        break;
      case 'entry_door':
        this.click(116, 0, 0.3);
        this.tone(88, 0.42, 0.2, 0.08, 'triangle', 62);
        this.noise(0.72, 0.16, 0.12, 'bandpass', 520, 1.6);
        this.click(74, 0.74, 0.28);
        break;
      case 'radio_static':
        this.click(132, 0, 0.28);
        this.click(860, 0.09, 0.09);
        this.noise(1.45, 0.27, 0.06, 'bandpass', 1450, 0.72);
        this.noise(0.92, 0.12, 0.32, 'highpass', 2480, 0.55);
        this.tone(84, 1.18, 0.075, 0.14, 'sine', 112);
        this.tone(420, 0.86, 0.055, 0.18, 'sawtooth', 980);
        for (const offset of [0.2, 0.39, 0.58, 0.8, 1.04, 1.24]) this.click(1040 + offset * 430, offset, 0.072);
        break;
      case 'window_slide':
        this.noise(0.82, 0.18, 0, 'bandpass', 690, 1.15);
        this.tone(215, 0.7, 0.07, 0.04, 'sawtooth', 148);
        this.click(1040, 0.72, 0.13);
        break;
      case 'glass_wipe':
        this.noise(0.48, 0.16, 0, 'bandpass', 1120, 0.9);
        this.noise(0.42, 0.08, 0.08, 'highpass', 2100, 0.55);
        break;
      case 'clock_mechanism':
        this.click(148, 0, 0.22);
        this.tone(360, 0.62, 0.075, 0.03, 'sawtooth', 118);
        for (const [index, offset] of [0.08, 0.22, 0.37, 0.53, 0.7, 0.9].entries()) {
          this.click(index === 5 ? 116 : 720 + index * 34, offset, index === 5 ? 0.25 : 0.125);
        }
        this.tone(74, 0.36, 0.13, 0.84, 'triangle', 52);
        this.click(1120, 1.02, 0.075);
        break;
      case 'wood_door':
        this.click(92, 0, 0.24);
        this.tone(410, 0.9, 0.075, 0.05, 'sawtooth', 118);
        this.noise(0.86, 0.12, 0.06, 'bandpass', 430, 2.2);
        this.click(68, 0.78, 0.26);
        break;
      case 'paper_pickup':
        this.paper(0, 0.32, 0.18);
        this.click(1680, 0.08, 0.045);
        this.click(2240, 0.2, 0.035);
        break;
      case 'paper_drop':
        this.paper(0, 0.28, 0.16);
        this.noise(0.12, 0.18, 0.2, 'lowpass', 780, 0.7);
        this.tone(118, 0.16, 0.12, 0.2, 'triangle', 82);
        break;
      case 'paper_place':
        this.paper(0, 0.42, 0.15);
        this.noise(0.18, 0.14, 0.28, 'bandpass', 980, 0.8);
        this.click(150, 0.38, 0.13);
        break;
      case 'ticket_stamp':
        this.paper(0, 0.26, 0.13);
        this.click(172, 0.2, 0.3);
        this.tone(82, 0.19, 0.15, 0.21, 'triangle', 56);
        this.click(930, 0.39, 0.08);
        break;
      case 'board_power':
        this.click(126, 0, 0.23);
        this.tone(92, 0.78, 0.07, 0.08, 'square', 101);
        this.tone(184, 0.68, 0.035, 0.14, 'sine', 192);
        this.click(1540, 0.24, 0.055);
        break;
      case 'bus_door':
        this.click(82, 0, 0.24);
        this.noise(0.95, 0.22, 0.03, 'bandpass', 610, 0.7);
        this.tone(126, 0.72, 0.06, 0.12, 'sawtooth', 84);
        this.click(66, 0.88, 0.31);
        break;
      case 'old_lamp':
        this.click(118, 0, 0.3);
        this.tone(100, 0.1, 0.08, 0.1, 'square', 112);
        this.tone(100, 0.1, 0.11, 0.27, 'square', 116);
        this.click(1830, 0.13, 0.045);
        this.click(2140, 0.31, 0.055);
        this.tone(100, 0.9, 0.07, 0.43, 'square', 100);
        this.tone(200, 0.86, 0.028, 0.45, 'sine', 200);
        break;
      case 'bike_bell':
        this.bell(0);
        this.bell(0.34);
        break;
      case 'metal_door':
        this.click(74, 0, 0.32);
        this.tone(148, 0.72, 0.13, 0.02, 'triangle', 92);
        this.tone(510, 0.45, 0.045, 0.04, 'sine', 360);
        this.noise(0.52, 0.1, 0.08, 'bandpass', 360, 2.4);
        break;
      case 'projector_start':
        this.click(132, 0, 0.25);
        this.tone(72, 1.2, 0.1, 0.08, 'sawtooth', 82);
        this.tone(144, 1.05, 0.04, 0.14, 'sine', 164);
        for (const offset of [0.2, 0.38, 0.56, 0.74, 0.92]) this.click(740, offset, 0.055);
        break;
      case 'archive_bag':
        this.paper(0, 0.65, 0.2);
        this.noise(0.42, 0.13, 0.18, 'bandpass', 740, 0.65);
        this.click(104, 0.56, 0.16);
        break;
      case 'screen_receive':
        this.paper(0, 0.24, 0.08);
        this.tone(330, 0.82, 0.08, 0.12, 'sine', 438);
        this.tone(495, 0.92, 0.055, 0.17, 'sine', 658);
        this.tone(660, 0.7, 0.035, 0.23, 'sine', 880);
        this.click(92, 0.16, 0.18);
        break;
      case 'photo_flip': {
        const variation = Math.random() * 160;
        this.paper(0, 0.28, 0.13);
        this.click(1420 + variation, 0.12, 0.04);
        break;
      }
      case 'tape_stop':
        this.click(124, 0, 0.18);
        this.tone(520, 0.9, 0.1, 0.04, 'sawtooth', 74);
        this.noise(0.72, 0.08, 0.08, 'lowpass', 840, 0.7);
        this.click(68, 0.9, 0.25);
        break;
      case 'dossier_reveal':
        this.paper(0, 0.76, 0.22);
        for (const offset of [0.32, 0.42, 0.53, 0.68, 0.78]) this.click(780 + offset * 180, offset, 0.075);
        this.click(78, 0.96, 0.34);
        this.tone(92, 0.28, 0.15, 0.95, 'triangle', 62);
        break;
      case 'dossier_close':
        this.paper(0, 0.38, 0.18);
        this.click(72, 0.32, 0.32);
        this.tone(110, 0.22, 0.14, 0.34, 'triangle', 72);
        break;
      case 'material_error':
        this.click(96, 0, 0.14);
        this.noise(0.18, 0.08, 0.03, 'lowpass', 620, 0.8);
        break;
    }
  }

  pulse(kind: 'tap' | 'hold' | 'drag' | 'complete' | 'error'): void {
    if (kind === 'error') {
      this.playSfx('material_error');
      return;
    }
    const frequency = { tap: 440, hold: 196, drag: 330, complete: 660 }[kind];
    this.tone(frequency, 0.3, kind === 'complete' ? 0.2 : 0.1, 0, 'sine', frequency * 1.35);
  }

  private startMusic(path: string, fade: boolean): void {
    if (this.currentMusic?.dataset.path === path) return;
    const outgoing = this.currentMusic;
    const incoming = new Audio(path);
    incoming.dataset.path = path;
    incoming.loop = true;
    incoming.preload = 'auto';
    incoming.volume = fade ? 0 : this.musicVolume;
    incoming.dataset.volume = String(this.musicVolume);
    incoming.dataset.role = 'background-music';
    incoming.setAttribute('playsinline', '');
    incoming.style.display = 'none';
    document.body.append(incoming);
    this.currentMusic = incoming;
    void incoming.play().then(() => {
      if (this.currentMusic !== incoming) return;
      if (fade) this.fade(incoming, 0, this.musicVolume, 1450);
      if (outgoing) {
        if (fade) this.fade(outgoing, outgoing.volume, 0, 1200, () => this.removeMusic(outgoing));
        else this.removeMusic(outgoing);
      }
    }).catch(() => {
      incoming.remove();
      if (this.currentMusic === incoming) this.currentMusic = null;
    });
  }

  private removeMusic(audio: HTMLAudioElement): void {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.remove();
  }

  private fade(audio: HTMLAudioElement, from: number, to: number, duration: number, done?: () => void): void {
    if (audio === this.currentMusic && this.fadeFrame) cancelAnimationFrame(this.fadeFrame);
    const startedAt = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / Math.max(duration, 1));
      audio.volume = from + (to - from) * progress;
      if (progress < 1) {
        const frame = requestAnimationFrame(tick);
        if (audio === this.currentMusic) this.fadeFrame = frame;
      } else {
        if (audio === this.currentMusic) this.fadeFrame = 0;
        done?.();
      }
    };
    tick(startedAt);
  }

  private paper(start: number, duration: number, gain: number): void {
    this.noise(duration, gain, start, 'bandpass', 1480, 0.58);
    this.noise(duration * 0.72, gain * 0.45, start + 0.04, 'highpass', 2600, 0.45);
  }

  private bell(start: number): void {
    this.click(1280, start, 0.09);
    this.tone(1640, 0.92, 0.14, start, 'sine', 1580);
    this.tone(2360, 0.72, 0.08, start + 0.006, 'sine', 2280);
    this.tone(3180, 0.5, 0.035, start + 0.01, 'sine', 3050);
  }

  private click(frequency: number, start: number, gain: number): void {
    this.noise(0.055, gain, start, 'bandpass', Math.max(80, frequency), 1.8);
    this.tone(Math.max(42, frequency * 0.62), 0.075, gain * 0.72, start, 'triangle', Math.max(36, frequency * 0.42));
  }

  private tone(
    frequency: number,
    duration: number,
    gainValue: number,
    start = 0,
    type: OscillatorType = 'sine',
    endFrequency = frequency
  ): void {
    if (!this.context || !this.master) return;
    const at = this.context.currentTime + start;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), at + Math.min(0.018, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
  }

  private noise(
    duration: number,
    gainValue: number,
    start = 0,
    type: BiquadFilterType = 'bandpass',
    frequency = 1000,
    q = 0.8
  ): void {
    if (!this.context || !this.master) return;
    const at = this.context.currentTime + start;
    const frameCount = Math.max(1, Math.ceil(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) channel[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, at);
    filter.Q.setValueAtTime(q, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), at + Math.min(0.018, duration * 0.18));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(at);
    source.stop(at + duration + 0.02);
  }
}
