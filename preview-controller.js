import { getAudioContext, playMidiTone, scheduleMidiTone, stopAudio } from './audio-engine.js';

export function createPreviewController({ onStateChange = () => {}, onCellChange = () => {}, onChordHint = () => {} } = {}) {
  let state = { mode: 'idle', token: 0 };
  let timers = [];

  function emit() {
    onStateChange({ ...state });
  }

  function cancel() {
    state = { mode: 'idle', token: state.token + 1 };
    timers.forEach(timer => clearTimeout(timer));
    timers = [];
    stopAudio('preview');
    onCellChange(null);
    onChordHint(null);
    emit();
  }

  function begin(mode) {
    cancel();
    state = { mode, token: state.token + 1 };
    emit();
    return state.token;
  }

  function later(callback, delay, token) {
    const timer = setTimeout(() => {
      if (token === state.token) callback();
    }, delay);
    timers.push(timer);
  }

  function playChord(midis, hint, duration = 1.45) {
    const token = begin('chord');
    onChordHint(hint);
    const start = getAudioContext().currentTime;
    midis.forEach((midi, index) => scheduleMidiTone(midi, start + index * 0.025, duration, 0.12, 'preview'));
    later(cancel, duration * 1000, token);
  }

  function playScale(cells, interval = 0.22) {
    const token = begin('scale');
    cells.forEach((cell, index) => {
      playMidiTone(cell.midi, index * interval, Math.min(0.28, interval * 0.9), 0.12, 'preview');
      later(() => onCellChange(cell), index * interval * 1000, token);
    });
    later(cancel, (cells.length * interval + 0.12) * 1000, token);
  }

  function playNote(cell) {
    const token = begin('note');
    playMidiTone(cell.midi, 0, 0.4, 0.12, 'preview');
    onCellChange(cell);
    later(cancel, 440, token);
  }

  return { cancel, playChord, playScale, playNote, snapshot: () => ({ ...state }) };
}
