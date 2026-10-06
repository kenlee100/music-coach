import { PITCHES } from './theory.js';

let audioContext;
let activeNodes = [];

export function getAudioContext() {
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function trackNode(node) {
  activeNodes.push(node);
  node.onended = () => {
    activeNodes = activeNodes.filter(item => item !== node);
  };
}

export function stopAudio() {
  activeNodes.forEach(node => {
    try { node.stop(); } catch {}
  });
  activeNodes = [];
}

function frequency(note, octave = 4) {
  return 440 * Math.pow(2, (PITCHES.indexOf(note) - 9 + (octave - 4) * 12) / 12);
}

export function scheduleTone(note, start, duration, octave = 4, volume = 0.12) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency(note, octave);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
  trackNode(oscillator);
}

export function playTone(note, delay = 0, duration = 1, octave = 4) {
  scheduleTone(note, getAudioContext().currentTime + delay, duration, octave);
}

export function scheduleClick(start, accent, isBeat) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(accent ? 1560 : isBeat ? 1080 : 760, start);
  gain.gain.setValueAtTime(accent ? 0.16 : isBeat ? 0.09 : 0.045, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.055);
  trackNode(oscillator);
}

export function scheduleChord(chord, start, duration) {
  chord.notes.forEach((note, index) => scheduleTone(note, start + index * 0.018, duration, index === 0 ? 3 : 4, 0.075));
}
