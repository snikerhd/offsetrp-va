// Audio utility for police terminal sounds
// Uses Web Audio API for generating procedural sounds

let soundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

export const getSoundEnabled = () => soundEnabled;

// Create audio context lazily to avoid browser restrictions
const getAudioContext = (): AudioContext | null => {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    console.warn('Web Audio API not supported');
    return null;
  }
};

// Play a short click sound
export const playClick = () => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Silently fail if audio doesn't work
  }
};

// Play success sound (two-tone chime)
export const playSuccess = () => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const playTone = (freq: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    playTone(523.25, ctx.currentTime, 0.1);     // C5
    playTone(659.25, ctx.currentTime + 0.08, 0.15); // E5
  } catch (e) {
    // Silently fail
  }
};

// Play radio chirp sound (classic police radio effect)
export const playRadioChirp = () => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    
    // Chirp pattern: quick frequency sweep
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03);
    oscillator.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.06);
    oscillator.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Silently fail
  }
};

// Play static noise (radio static effect)
export const playStatic = () => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Silently fail
  }
};

// Play alert/warning sound
export const playAlert = () => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 440;
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Silently fail
  }
};