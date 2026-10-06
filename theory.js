export const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const TYPES = [
  { suffix: '', type: 'major', label: '大三和弦', formula: '1 · 3 · 5', steps: [0, 4, 7], degrees: [0, 2, 4] },
  { suffix: 'm', type: 'minor', label: '小三和弦', formula: '1 · ♭3 · 5', steps: [0, 3, 7], degrees: [0, 2, 4] },
  { suffix: '7', type: 'seventh', label: '屬七和弦', formula: '1 · 3 · 5 · ♭7', steps: [0, 4, 7, 10], degrees: [0, 2, 4, 6] },
  { suffix: 'maj7', type: 'seventh', label: '大七和弦', formula: '1 · 3 · 5 · 7', steps: [0, 4, 7, 11], degrees: [0, 2, 4, 6] },
  { suffix: 'm7', type: 'seventh', label: '小七和弦', formula: '1 · ♭3 · 5 · ♭7', steps: [0, 3, 7, 10], degrees: [0, 2, 4, 6] },
  { suffix: 'm7♭5', type: 'seventh', label: '半減七和弦', formula: '1 · ♭3 · ♭5 · ♭7', steps: [0, 3, 6, 10], degrees: [0, 2, 4, 6] },
  { suffix: 'dim', type: 'other', label: '減三和弦', formula: '1 · ♭3 · ♭5', steps: [0, 3, 6], degrees: [0, 2, 4] },
  { suffix: 'aug', type: 'other', label: '增三和弦', formula: '1 · 3 · ♯5', steps: [0, 4, 8], degrees: [0, 2, 4] },
  { suffix: 'sus2', type: 'other', label: '掛二和弦', formula: '1 · 2 · 5', steps: [0, 2, 7], degrees: [0, 1, 4] },
  { suffix: 'sus4', type: 'other', label: '掛四和弦', formula: '1 · 4 · 5', steps: [0, 5, 7], degrees: [0, 3, 4] }
];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PITCHES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const PRESETS = [
  { title: '流行萬用', name: 'I–V–vi–IV', degrees: [0, 7, 9, 5], letterDegrees: [0, 4, 5, 3], suffixes: ['', '', 'm', ''] },
  { title: '爵士回家', name: 'ii–V–I', degrees: [2, 7, 0], letterDegrees: [1, 4, 0], suffixes: ['m7', '7', 'maj7'] },
  { title: '民謠下行', name: 'I–vi–IV–V', degrees: [0, 9, 5, 7], letterDegrees: [0, 5, 3, 4], suffixes: ['', 'm', '', ''] },
  { title: '12 小節藍調', name: 'I7–IV7–V7', degrees: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7], letterDegrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4], suffixes: Array(12).fill('7') }
];

export const STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'];
export const FRET_START = 1;
export const FRET_END = 22;
export const RHYTHMS = {
  quarter: { label: '四分', subdivisions: 1 },
  eighth: { label: '八分', subdivisions: 2 },
  sixteenth: { label: '十六分', subdivisions: 4 },
  swing: { label: 'Swing', subdivisions: 2 }
};

export const OPEN_SHAPES = {
  C: { frets: 'x 3 2 0 1 0', label: '開放和弦' }, D: { frets: 'x x 0 2 3 2', label: '開放和弦' },
  E: { frets: '0 2 2 1 0 0', label: '開放和弦' }, F: { frets: '1 3 3 2 1 1', label: '六弦橫按和弦' },
  G: { frets: '3 2 0 0 0 3', label: '開放和弦' }, A: { frets: 'x 0 2 2 2 0', label: '開放和弦' },
  Am: { frets: 'x 0 2 2 1 0', label: '開放和弦' }, Dm: { frets: 'x x 0 2 3 1', label: '開放和弦' },
  Em: { frets: '0 2 2 0 0 0', label: '開放和弦' }, Cmaj7: { frets: 'x 3 2 0 0 0', label: '開放和弦' },
  Dm7: { frets: 'x x 0 2 1 1', label: '開放和弦' }, Em7: { frets: '0 2 0 0 0 0', label: '開放和弦' },
  G7: { frets: '3 2 0 0 0 1', label: '開放和弦' }, A7: { frets: 'x 0 2 0 2 0', label: '開放和弦' }
};

export function spellTone(root, degree, target) {
  const rootLetter = LETTERS.indexOf(root[0]);
  const letter = LETTERS[(rootLetter + degree) % 7];
  const natural = NATURAL_PITCHES[letter];
  let offset = (PITCHES.indexOf(target) - natural + 12) % 12;
  if (offset > 6) offset -= 12;
  const accidental = offset > 0 ? '♯'.repeat(offset) : '♭'.repeat(-offset);
  return `${letter}${accidental}`;
}

export const CHORDS = PITCHES.flatMap(root => TYPES.map(definition => {
  const notes = definition.steps.map(step => PITCHES[(PITCHES.indexOf(root) + step) % 12]);
  return {
    name: `${root}${definition.suffix}`,
    notes,
    displayNotes: notes.map((note, index) => spellTone(root, definition.degrees[index], note)),
    ...definition
  };
}));

function notePitchClass(noteName) {
  const match = noteName.match(/^([A-G])([#♯♭]*)$/);
  if (!match) return -1;
  let pitch = NATURAL_PITCHES[match[1]];
  for (const accidental of match[2]) pitch += accidental === '♭' ? -1 : 1;
  return (pitch + 120) % 12;
}

export function getChord(name) {
  const exact = CHORDS.find(chord => chord.name === name);
  if (exact) return exact;
  const match = name.match(/^([A-G][#♯♭]*)(.*)$/);
  if (!match) return null;
  const [rootName, suffix] = match.slice(1);
  const definition = TYPES.find(type => type.suffix === suffix);
  const canonical = definition && CHORDS.find(chord => chord.name === `${PITCHES[notePitchClass(rootName)]}${suffix}`);
  if (!canonical) return null;
  return {
    ...canonical,
    name,
    displayNotes: canonical.notes.map((note, index) => spellTone(rootName, definition.degrees[index], note))
  };
}

export function presetItems(preset, key) {
  const rootIndex = PITCHES.indexOf(key);
  return preset.degrees.map((degree, index) =>
    `${spellTone(key, preset.letterDegrees[index], PITCHES[(rootIndex + degree) % 12])}${preset.suffixes[index]}`
  );
}

export function scaleFor(chord) {
  const rootName = chord.displayNotes[0];
  if (chord.name.includes('m7♭5')) return { name: `${rootName} 洛克里亞`, steps: [0, 1, 3, 5, 6, 8, 10], degrees: [0, 1, 2, 3, 4, 5, 6] };
  if (chord.name.includes('dim')) return { name: `${rootName} 全－半減音階`, steps: [0, 2, 3, 5, 6, 8, 9, 11], degrees: [0, 1, 2, 3, 4, 5, 5, 6] };
  if (chord.name.includes('aug')) return { name: `${rootName} 全音音階`, steps: [0, 2, 4, 6, 8, 10], degrees: [0, 1, 2, 3, 4, 5] };
  if (chord.name.endsWith('m') || chord.name.endsWith('m7')) return { name: `${rootName} 自然小音階`, steps: [0, 2, 3, 5, 7, 8, 10], degrees: [0, 1, 2, 3, 4, 5, 6] };
  if (chord.name.endsWith('7') && !chord.name.endsWith('maj7')) return { name: `${rootName} 混合利底亞`, steps: [0, 2, 4, 5, 7, 9, 10], degrees: [0, 1, 2, 3, 4, 5, 6] };
  return { name: `${rootName} 大音階`, steps: [0, 2, 4, 5, 7, 9, 11], degrees: [0, 1, 2, 3, 4, 5, 6] };
}

export function shapeFor(chord) {
  const open = OPEN_SHAPES[chord.name];
  if (open) return open.frets;
  const activeStrings = STRINGS.slice(2);
  for (let base = 0; base <= 11; base++) {
    for (let shift = 0; shift < chord.notes.length; shift++) {
      const frets = activeStrings.map((openString, index) => {
        let fret = (PITCHES.indexOf(chord.notes[(index + shift) % chord.notes.length]) - PITCHES.indexOf(openString) + 12) % 12;
        while (fret < base) fret += 12;
        return fret;
      });
      if (Math.max(...frets) - Math.min(...frets) <= 4) return `x x ${frets.join(' ')}`;
    }
  }
  return '無可用指型';
}
