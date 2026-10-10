export const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const NATURAL_PITCHES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const TYPES = [
  ['', 'major', '大三和弦', '1 · 3 · 5', [0, 4, 7]], ['m', 'minor', '小三和弦', '1 · ♭3 · 5', [0, 3, 7]],
  ['7', 'seventh', '屬七和弦', '1 · 3 · 5 · ♭7', [0, 4, 7, 10]], ['maj7', 'seventh', '大七和弦', '1 · 3 · 5 · 7', [0, 4, 7, 11]],
  ['m7', 'seventh', '小七和弦', '1 · ♭3 · 5 · ♭7', [0, 3, 7, 10]], ['m7♭5', 'seventh', '半減七和弦', '1 · ♭3 · ♭5 · ♭7', [0, 3, 6, 10]],
  ['dim', 'other', '減三和弦', '1 · ♭3 · ♭5', [0, 3, 6]], ['aug', 'other', '增三和弦', '1 · 3 · ♯5', [0, 4, 8]],
  ['sus2', 'other', '掛二和弦', '1 · 2 · 5', [0, 2, 7]], ['sus4', 'other', '掛四和弦', '1 · 4 · 5', [0, 5, 7]]
] as const

export interface Chord { name: string; root: string; suffix: string; type: string; label: string; formula: string; notes: string[] }
export interface ScaleDefinition { id: string; label: string; formula: string; steps: number[]; degrees: number[]; context: string }
export interface Scale extends ScaleDefinition { name: string; notes: string[]; displayNotes: string[] }
export const CHORDS: Chord[] = PITCHES.flatMap(root => TYPES.map(([suffix, type, label, formula, steps]) => ({
  name: `${root}${suffix}`, root, suffix, type, label, formula,
  notes: steps.map(step => PITCHES[(PITCHES.indexOf(root) + step) % 12]!)
})))
export const getChord = (name: string) => CHORDS.find(chord => chord.name === name) || CHORDS[0]!
export function noteToMidi(note: string, octave: number) {
  const pitch = PITCHES.indexOf(note as typeof PITCHES[number])
  if (pitch < 0) throw new Error(`Unknown pitch: ${note}`)
  return 12 * (octave + 1) + pitch
}

export const PRESETS = [
  { title: '流行萬用', names: ['C', 'G', 'Am', 'F'] },
  { title: '爵士回家', names: ['Dm7', 'G7', 'Cmaj7'] },
  { title: '民謠下行', names: ['C', 'Am', 'F', 'G'] }
]

export const STRINGS = [
  { name: '高 E', midi: 64 }, { name: 'B', midi: 59 }, { name: 'G', midi: 55 },
  { name: 'D', midi: 50 }, { name: 'A', midi: 45 }, { name: '低 E', midi: 40 }
]

export const SCALE_DEFINITIONS: Record<string, ScaleDefinition> = {
  ionian: { id: 'ionian', label: '大音階（Ionian）', formula: '1 · 2 · 3 · 4 · 5 · 6 · 7', steps: [0, 2, 4, 5, 7, 9, 11], degrees: [0, 1, 2, 3, 4, 5, 6], context: '大調中心的基本選擇。' },
  lydian: { id: 'lydian', label: 'Lydian', formula: '1 · 2 · 3 · ♯4 · 5 · 6 · 7', steps: [0, 2, 4, 6, 7, 9, 11], degrees: [0, 1, 2, 3, 4, 5, 6], context: '適合強調升四度的明亮色彩。' },
  mixolydian: { id: 'mixolydian', label: 'Mixolydian', formula: '1 · 2 · 3 · 4 · 5 · 6 · ♭7', steps: [0, 2, 4, 5, 7, 9, 10], degrees: [0, 1, 2, 3, 4, 5, 6], context: '常用於屬和弦或降七度色彩。' },
  majorPentatonic: { id: 'majorPentatonic', label: '大調五聲音階', formula: '1 · 2 · 3 · 5 · 6', steps: [0, 2, 4, 7, 9], degrees: [0, 1, 2, 4, 5], context: '音數精簡，適合旋律與基本即興。' },
  aeolian: { id: 'aeolian', label: '自然小音階（Aeolian）', formula: '1 · 2 · ♭3 · 4 · 5 · ♭6 · ♭7', steps: [0, 2, 3, 5, 7, 8, 10], degrees: [0, 1, 2, 3, 4, 5, 6], context: '自然小調中心的基本選擇。' },
  dorian: { id: 'dorian', label: 'Dorian', formula: '1 · 2 · ♭3 · 4 · 5 · 6 · ♭7', steps: [0, 2, 3, 5, 7, 9, 10], degrees: [0, 1, 2, 3, 4, 5, 6], context: '小三度配大六度，適合較明亮的小和弦語境。' },
  phrygian: { id: 'phrygian', label: 'Phrygian', formula: '1 · ♭2 · ♭3 · 4 · 5 · ♭6 · ♭7', steps: [0, 1, 3, 5, 7, 8, 10], degrees: [0, 1, 2, 3, 4, 5, 6], context: '降二度帶來強烈的暗色張力。' },
  minorPentatonic: { id: 'minorPentatonic', label: '小調五聲音階', formula: '1 · ♭3 · 4 · 5 · ♭7', steps: [0, 3, 5, 7, 10], degrees: [0, 2, 3, 4, 6], context: '常見的小調旋律與即興素材。' },
  lydianDominant: { id: 'lydianDominant', label: 'Lydian Dominant', formula: '1 · 2 · 3 · ♯4 · 5 · 6 · ♭7', steps: [0, 2, 4, 6, 7, 9, 10], degrees: [0, 1, 2, 3, 4, 5, 6], context: '屬七和弦上加入升四度色彩。' },
  halfWholeDiminished: { id: 'halfWholeDiminished', label: '半－全減音階', formula: '1 · ♭2 · ♯2 · 3 · ♯4 · 5 · 6 · ♭7', steps: [0, 1, 3, 4, 6, 7, 9, 10], degrees: [0, 1, 1, 2, 3, 4, 5, 6], context: '對稱音階，常用於帶張力的屬七和弦。' },
  locrian: { id: 'locrian', label: 'Locrian', formula: '1 · ♭2 · ♭3 · 4 · ♭5 · ♭6 · ♭7', steps: [0, 1, 3, 5, 6, 8, 10], degrees: [0, 1, 2, 3, 4, 5, 6], context: '包含降五度，對應半減和弦的基本選擇。' },
  locrianNatural2: { id: 'locrianNatural2', label: 'Locrian ♮2', formula: '1 · 2 · ♭3 · 4 · ♭5 · ♭6 · ♭7', steps: [0, 2, 3, 5, 6, 8, 10], degrees: [0, 1, 2, 3, 4, 5, 6], context: '保留降五度並使用自然二度。' },
  wholeHalfDiminished: { id: 'wholeHalfDiminished', label: '全－半減音階', formula: '1 · 2 · ♭3 · 4 · ♭5 · ♭6 · 6 · 7', steps: [0, 2, 3, 5, 6, 8, 9, 11], degrees: [0, 1, 2, 3, 4, 5, 5, 6], context: '對稱音階，適合減七和弦色彩。' },
  wholeTone: { id: 'wholeTone', label: '全音音階', formula: '1 · 2 · 3 · ♯4 · ♯5 · ♭7', steps: [0, 2, 4, 6, 8, 10], degrees: [0, 1, 2, 3, 4, 6], context: '對稱的全音結構，適合增和弦色彩。' },
  lydianAugmented: { id: 'lydianAugmented', label: 'Lydian Augmented', formula: '1 · 2 · 3 · ♯4 · ♯5 · 6 · 7', steps: [0, 2, 4, 6, 8, 9, 11], degrees: [0, 1, 2, 3, 4, 5, 6], context: '同時包含升四度與升五度的明亮張力。' }
}

const CHORD_SCALE_OPTIONS: Record<string, { defaultId: string; options: string[] }> = {
  '': { defaultId: 'ionian', options: ['ionian', 'lydian', 'mixolydian', 'majorPentatonic'] },
  m: { defaultId: 'aeolian', options: ['aeolian', 'dorian', 'phrygian', 'minorPentatonic'] },
  '7': { defaultId: 'mixolydian', options: ['mixolydian', 'lydianDominant', 'halfWholeDiminished'] },
  maj7: { defaultId: 'ionian', options: ['ionian', 'lydian'] },
  m7: { defaultId: 'aeolian', options: ['aeolian', 'dorian', 'phrygian', 'minorPentatonic'] },
  'm7♭5': { defaultId: 'locrian', options: ['locrian', 'locrianNatural2'] },
  dim: { defaultId: 'wholeHalfDiminished', options: ['wholeHalfDiminished', 'locrian'] },
  aug: { defaultId: 'wholeTone', options: ['wholeTone', 'lydianAugmented'] },
  sus2: { defaultId: 'ionian', options: ['ionian', 'dorian', 'mixolydian'] },
  sus4: { defaultId: 'ionian', options: ['ionian', 'mixolydian', 'dorian'] }
}

const scaleConfiguration = (chord: Chord) => CHORD_SCALE_OPTIONS[chord.suffix] || CHORD_SCALE_OPTIONS['']!
export const getScaleOptions = (chord: Chord) => scaleConfiguration(chord).options.map(id => SCALE_DEFINITIONS[id]!)
export const getDefaultScaleId = (chord: Chord) => scaleConfiguration(chord).defaultId
export function spellTone(root: string, degree: number, target: string) {
  const rootLetter = LETTERS.indexOf(root[0] as typeof LETTERS[number])
  const letter = LETTERS[(rootLetter + degree) % 7]!
  let offset = (PITCHES.indexOf(target as typeof PITCHES[number]) - NATURAL_PITCHES[letter]! + 12) % 12
  if (offset > 6) offset -= 12
  const accidental = offset > 0 ? '♯'.repeat(offset) : '♭'.repeat(-offset)
  return `${letter}${accidental}`
}
export function scaleFor(chord: Chord, selectedId: string): Scale {
  const definition = getScaleOptions(chord).find(option => option.id === selectedId) || SCALE_DEFINITIONS[getDefaultScaleId(chord)]!
  const rootIndex = PITCHES.indexOf(chord.root as typeof PITCHES[number])
  const notes = definition.steps.map(step => PITCHES[(rootIndex + step) % 12]!)
  const displayNotes = notes.map((note, index) => spellTone(chord.root, definition.degrees[index]!, note))
  return { ...definition, name: `${chord.root} ${definition.label}`, notes, displayNotes }
}

export interface FretCell { stringName: string; stringIndex: number; fret: number; midi: number; note: string; displayName: string; active: boolean; root: boolean }
export function fretboard(chord: Chord, viewMode: 'chord' | 'scale' = 'chord', selectedScaleId = getDefaultScaleId(chord)): FretCell[] {
  const scale = scaleFor(chord, selectedScaleId)
  const activeNotes = viewMode === 'scale' ? scale.notes : chord.notes
  const displayNotes = viewMode === 'scale' ? scale.displayNotes : chord.notes
  const noteSet = new Set(activeNotes)
  return STRINGS.flatMap((string, stringIndex) => Array.from({ length: 22 }, (_, index) => {
    const fret = index + 1
    const midi = string.midi + fret
    const note = PITCHES[midi % 12]!
    const activeIndex = activeNotes.indexOf(note)
    return { stringName: string.name, stringIndex, fret, midi, note, displayName: activeIndex >= 0 ? displayNotes[activeIndex]! : note, active: noteSet.has(note), root: note === chord.root }
  }))
}
