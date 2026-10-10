export const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const TYPES = [
  ['', 'major', '大三和弦', '1 · 3 · 5', [0, 4, 7]], ['m', 'minor', '小三和弦', '1 · ♭3 · 5', [0, 3, 7]],
  ['7', 'seventh', '屬七和弦', '1 · 3 · 5 · ♭7', [0, 4, 7, 10]], ['maj7', 'seventh', '大七和弦', '1 · 3 · 5 · 7', [0, 4, 7, 11]],
  ['m7', 'seventh', '小七和弦', '1 · ♭3 · 5 · ♭7', [0, 3, 7, 10]], ['m7♭5', 'seventh', '半減七和弦', '1 · ♭3 · ♭5 · ♭7', [0, 3, 6, 10]],
  ['dim', 'other', '減三和弦', '1 · ♭3 · ♭5', [0, 3, 6]], ['aug', 'other', '增三和弦', '1 · 3 · ♯5', [0, 4, 8]],
  ['sus2', 'other', '掛二和弦', '1 · 2 · 5', [0, 2, 7]], ['sus4', 'other', '掛四和弦', '1 · 4 · 5', [0, 5, 7]]
] as const

export interface Chord { name: string; root: string; suffix: string; type: string; label: string; formula: string; notes: string[] }
export const CHORDS: Chord[] = PITCHES.flatMap(root => TYPES.map(([suffix, type, label, formula, steps]) => ({
  name: `${root}${suffix}`, root, suffix, type, label, formula,
  notes: steps.map(step => PITCHES[(PITCHES.indexOf(root) + step) % 12]!)
})))
export const getChord = (name: string) => CHORDS.find(chord => chord.name === name) || CHORDS[0]!

export const PRESETS = [
  { title: '流行萬用', names: ['C', 'G', 'Am', 'F'] },
  { title: '爵士回家', names: ['Dm7', 'G7', 'Cmaj7'] },
  { title: '民謠下行', names: ['C', 'Am', 'F', 'G'] }
]

export const STRINGS = [
  { name: '高 E', midi: 64 }, { name: 'B', midi: 59 }, { name: 'G', midi: 55 },
  { name: 'D', midi: 50 }, { name: 'A', midi: 45 }, { name: '低 E', midi: 40 }
]

export interface FretCell { stringName: string; stringIndex: number; fret: number; midi: number; note: string; active: boolean; root: boolean }
export function fretboard(chord: Chord): FretCell[] {
  const noteSet = new Set(chord.notes)
  return STRINGS.flatMap((string, stringIndex) => Array.from({ length: 22 }, (_, index) => {
    const fret = index + 1
    const midi = string.midi + fret
    const note = PITCHES[midi % 12]!
    return { stringName: string.name, stringIndex, fret, midi, note, active: noteSet.has(note), root: note === chord.root }
  }))
}
