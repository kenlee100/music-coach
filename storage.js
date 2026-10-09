import { CHORDS, PITCHES, getChord, getDefaultScaleId, getScaleOptions, RHYTHMS } from './theory.js';

const KEYS = {
  progression: 'chordcraft-progression',
  practice: 'chordroom-practice',
  theme: 'chordroom-theme',
  guitarTheme: 'chordroom-guitar-theme'
};

function readValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(readValue(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function clampTempo(value) {
  return Math.min(240, Math.max(40, Number(value) || 90));
}

export function loadProgression(fallback) {
  const stored = readJson(KEYS.progression, fallback);
  if (!Array.isArray(stored)) return [...fallback];
  const valid = stored.filter(name => typeof name === 'string' && getChord(name));
  return valid.length === stored.length ? valid : [...fallback];
}

export function saveProgression(sequence) {
  const safeSequence = sequence.filter(name => typeof name === 'string' && getChord(name));
  return writeValue(KEYS.progression, JSON.stringify(safeSequence));
}

function normalizePracticeSettings(stored, restoreSelections = false) {
  const currentChord = restoreSelections && CHORDS.some(chord => chord.name === stored.currentChord)
    ? stored.currentChord : 'Cmaj7';
  const chord = getChord(currentChord);
  return {
    version: 2,
    bpm: clampTempo(stored.bpm),
    meter: Number(stored.meter) === 3 ? 3 : 4,
    rhythm: RHYTHMS[stored.rhythm] ? stored.rhythm : 'quarter',
    countIn: stored.countIn !== false,
    currentChord,
    key: restoreSelections && PITCHES.includes(stored.key) ? stored.key : 'C',
    viewMode: restoreSelections && stored.viewMode === 'scale' ? 'scale' : 'chord',
    selectedScaleId: restoreSelections && getScaleOptions(chord).some(option => option.id === stored.selectedScaleId)
      ? stored.selectedScaleId : getDefaultScaleId(chord)
  };
}

function migratePracticeSettings(stored) {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return normalizePracticeSettings({});
  const version = stored.version == null ? 0 : Number(stored.version);
  if (version === 0 || version === 1) return normalizePracticeSettings(stored);
  if (version === 2) return normalizePracticeSettings(stored, true);
  return normalizePracticeSettings({});
}

export function loadPracticeSettings() {
  return migratePracticeSettings(readJson(KEYS.practice, {}));
}

export function savePracticeSettings(settings) {
  return writeValue(KEYS.practice, JSON.stringify(normalizePracticeSettings(settings, true)));
}

export function loadTheme() {
  const value = readValue(KEYS.theme);
  return ['system', 'light', 'dark'].includes(value) ? value : 'system';
}

export function saveTheme(value) {
  return writeValue(KEYS.theme, ['system', 'light', 'dark'].includes(value) ? value : 'system');
}

export function loadGuitarTheme() {
  return readValue(KEYS.guitarTheme) === 'acoustic' ? 'acoustic' : 'electric';
}

export function saveGuitarTheme(value) {
  return writeValue(KEYS.guitarTheme, value === 'acoustic' ? 'acoustic' : 'electric');
}
