import { FRET_END, FRET_START, PITCHES, scaleFor, spellTone } from './theory.js';

export const GUITAR_STRINGS = [
  { stringNumber: 6, openMidi: 40, openName: 'E', label: '低音 E' },
  { stringNumber: 5, openMidi: 45, openName: 'A', label: 'A 弦' },
  { stringNumber: 4, openMidi: 50, openName: 'D', label: 'D 弦' },
  { stringNumber: 3, openMidi: 55, openName: 'G', label: 'G 弦' },
  { stringNumber: 2, openMidi: 59, openName: 'B', label: 'B 弦' },
  { stringNumber: 1, openMidi: 64, openName: 'E', label: '高音 E' }
];

export function midiPitchClass(midi) {
  return ((midi % 12) + 12) % 12;
}

export function midiDisplay(midi) {
  return `${PITCHES[midiPitchClass(midi)]}${Math.floor(midi / 12) - 1}`;
}

export function createFretboardModel(chord, viewMode = 'chord', selectedScaleId) {
  const rootPitchClass = PITCHES.indexOf(chord.notes[0]);
  const scale = scaleFor(chord, selectedScaleId);
  const scalePitchClasses = scale.steps.map(step => (rootPitchClass + step) % 12);
  const activePitchClasses = viewMode === 'scale'
    ? scalePitchClasses
    : chord.notes.map(note => PITCHES.indexOf(note));
  const displayNames = viewMode === 'scale'
    ? scale.steps.map((step, index) => spellTone(chord.displayNotes[0], scale.degrees[index], PITCHES[(rootPitchClass + step) % 12]))
    : chord.displayNotes;
  const strings = GUITAR_STRINGS.map(string => ({
    ...string,
    frets: Array.from({ length: FRET_END - FRET_START + 1 }, (_, index) => {
      const fret = index + FRET_START;
      const midi = string.openMidi + fret;
      const pitchClass = midiPitchClass(midi);
      const activeIndex = activePitchClasses.indexOf(pitchClass);
      return {
        stringNumber: string.stringNumber,
        fret,
        midi,
        pitchClass,
        pitchName: PITCHES[pitchClass],
        octave: Math.floor(midi / 12) - 1,
        display: midiDisplay(midi),
        displayName: activeIndex >= 0 ? displayNames[activeIndex] : PITCHES[pitchClass],
        active: activeIndex >= 0,
        kind: pitchClass === rootPitchClass ? 'root' : activeIndex >= 0 ? 'tone' : 'inactive'
      };
    })
  }));
  return { strings, scale, activePitchClasses, rootPitchClass, viewMode };
}

export function createScalePlaybackQueue(model) {
  return model.strings.flatMap(string => string.frets.filter(cell => cell.active));
}

export function createChordPreview(chord) {
  const pitchClasses = chord.notes.map(note => PITCHES.indexOf(note));
  const fretted = GUITAR_STRINGS.flatMap(string =>
    Array.from({ length: 7 }, (_, index) => {
      const fret = index + 1;
      const midi = string.openMidi + fret;
      return { stringNumber: string.stringNumber, fret, midi, pitchClass: midiPitchClass(midi) };
    }).filter(cell => pitchClasses.includes(cell.pitchClass))
  );
  const openStrings = GUITAR_STRINGS
    .map(string => ({ ...string, fret: 0, midi: string.openMidi, pitchClass: midiPitchClass(string.openMidi) }))
    .filter(cell => pitchClasses.includes(cell.pitchClass));
  return { fretted, openStrings };
}
