let audioContext;

export const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
};

export const playCardFlipSound = () => {
  if (!audioContext) initAudio();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.value = 800;
  gainNode.gain.value = 0.1;
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
};

export const playCardMatchSound = () => {
  if (!audioContext) initAudio();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
  gainNode.gain.value = 0.1;
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
};

export const playWinSound = () => {
  if (!audioContext) initAudio();

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.1;
  gainNode.connect(audioContext.destination);
  
  notes.forEach((note, i) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = note;
    oscillator.connect(gainNode);
    oscillator.start(audioContext.currentTime + i * 0.1);
    oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
  });
};