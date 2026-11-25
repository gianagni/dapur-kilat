// Dapur Kilat: tiny WebAudio synth effects. No audio files, no network.
// The context is created on the first user gesture, so autoplay rules never block
// the game; every call before that is a silent no-op.

/** One short tone: a frequency, a length and a shape, through a gain envelope. */
function tone(context, frequency, seconds, type, volume, when = 0) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime + when);
  gain.gain.setValueAtTime(volume, context.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + when + seconds);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(context.currentTime + when);
  oscillator.stop(context.currentTime + when + seconds + 0.02);
}

/** A burst of filtered noise, for the wok sizzle. */
function noise(context, seconds, volume) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + seconds);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
}

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      context = new AudioContextClass();
      return context;
    } catch {
      return null;
    }
  }

  return {
    /** Call from any user gesture; it only unlocks the context. */
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
    },
    isMuted() {
      return muted;
    },
    pick() {
      if (muted) return;
      const ctx = ensure();
      if (ctx) tone(ctx, 520, 0.07, 'triangle', 0.12);
    },
    chop() {
      if (muted) return;
      const ctx = ensure();
      if (ctx) {
        tone(ctx, 180, 0.08, 'square', 0.14);
        tone(ctx, 120, 0.1, 'square', 0.1, 0.05);
      }
    },
    sizzle() {
      if (muted) return;
      const ctx = ensure();
      if (ctx) noise(ctx, 0.35, 0.1);
    },
    plate() {
      if (muted) return;
      const ctx = ensure();
      if (ctx) {
        tone(ctx, 660, 0.09, 'sine', 0.12);
        tone(ctx, 880, 0.12, 'sine', 0.1, 0.07);
      }
    },
    serve() {
      if (muted) return;
      const ctx = ensure();
      if (ctx) {
        tone(ctx, 784, 0.1, 'sine', 0.14);
        tone(ctx, 1047, 0.14, 'sine', 0.14, 0.09);
        tone(ctx, 1319, 0.18, 'sine', 0.12, 0.18);
      }
    },
    error() {
      if (muted) return;
      const ctx = ensure();
      if (ctx) tone(ctx, 140, 0.22, 'sawtooth', 0.1);
    },
    lost() {
      if (muted) return;
      const ctx = ensure();
      if (ctx) {
        tone(ctx, 330, 0.15, 'triangle', 0.12);
        tone(ctx, 220, 0.25, 'triangle', 0.12, 0.12);
      }
    },
  };
}
