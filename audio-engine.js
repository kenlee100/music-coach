import { PITCHES } from './theory.js';

let audioContext;
const activeNodes = new Map([['transport', []], ['preview', []]]);

export function getAudioContext() {
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function trackNode(node, group = 'preview') {
  if (!activeNodes.has(group)) activeNodes.set(group, []);
  activeNodes.get(group).push(node);
  node.onended = () => {
    activeNodes.set(group, activeNodes.get(group).filter(item => item !== node));
  };
}

export function stopAudio(group) {
  const groups = group ? [group] : [...activeNodes.keys()];
  groups.forEach(name => {
    (activeNodes.get(name) || []).forEach(node => {
      try { node.stop(); } catch {}
    });
    activeNodes.set(name, []);
  });
}

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function scheduleMidiTone(midi, start, duration, volume = 0.12, group = 'preview') {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = midiToFrequency(midi);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
  trackNode(oscillator, group);
  return oscillator;
}

export function scheduleTone(note, start, duration, octave = 4, volume = 0.12, group = 'preview') {
  const midi = 12 * (octave + 1) + PITCHES.indexOf(note);
  return scheduleMidiTone(midi, start, duration, volume, group);
}

export function playTone(note, delay = 0, duration = 1, octave = 4) {
  scheduleTone(note, getAudioContext().currentTime + delay, duration, octave);
}

export function playMidiTone(midi, delay = 0, duration = 0.32, volume = 0.12, group = 'preview') {
  return scheduleMidiTone(midi, getAudioContext().currentTime + delay, duration, volume, group);
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
  trackNode(oscillator, 'transport');
}

export function scheduleChord(chord, start, duration) {
  chord.notes.forEach((note, index) => scheduleTone(note, start + index * 0.018, duration, index === 0 ? 3 : 4, 0.075, 'transport'));
}
