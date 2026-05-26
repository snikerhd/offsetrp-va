let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

function getAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  // Create or resume context
  try {
    return new AudioContextClass();
  } catch (e) {
    return null;
  }
}

export function playClick() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(550, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
  
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

export function playSuccess() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  // High-quality modern chime chord
  const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
    
    gain.gain.setValueAtTime(0.02, now + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.35);
  });
}

export function playRadioChirp() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  // Pitch modulation oscillator
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.linearRampToValueAtTime(1300, now + 0.03);
  osc.frequency.linearRampToValueAtTime(950, now + 0.07);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
  
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1100, now);
  filter.Q.setValueAtTime(4.0, now);
  
  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.12);

  // Play static chirp blend
  setTimeout(() => {
    playStaticVolume(0.015, 0.08);
  }, 10);
}

export function playStatic() {
  playStaticVolume(0.02, 0.15);
}

function playStaticVolume(volume: number, duration: number) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, ctx.currentTime);
  filter.Q.setValueAtTime(2.0, ctx.currentTime);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start();
  noise.stop(ctx.currentTime + duration);
}
