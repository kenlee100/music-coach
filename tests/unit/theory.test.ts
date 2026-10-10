import { describe, expect, it } from 'vitest'
import { fretboard, getChord, getDefaultScaleId, getScaleOptions, noteToMidi, scaleFor } from '../../app/domain/theory'

describe('chord audio pitches', () => {
  it('maps chord note names to the intended MIDI pitches', () => {
    const chord = getChord('C')
    const midi = chord.notes.map((note, index) => noteToMidi(note, index === 0 ? 3 : 4))

    expect(midi).toEqual([48, 64, 67])
  })
})

describe('compatible scales', () => {
  it('uses an explicit valid default for each chord type', () => {
    const chord = getChord('G7')
    const options = getScaleOptions(chord)

    expect(getDefaultScaleId(chord)).toBe('mixolydian')
    expect(options.map(option => option.id)).toContain(getDefaultScaleId(chord))
  })

  it('falls back to the explicit default and marks scale tones on all 22 frets', () => {
    const chord = getChord('C')
    const scale = scaleFor(chord, 'not-a-scale')
    const cells = fretboard(chord, 'scale', 'not-a-scale')

    expect(scale.id).toBe('ionian')
    expect(scale.notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    expect(cells).toHaveLength(132)
    expect(cells.filter(cell => cell.active).every(cell => scale.notes.includes(cell.note))).toBe(true)
  })

  it('spells the C whole-tone scale with B-flat', () => {
    expect(scaleFor(getChord('Caug'), 'wholeTone').displayNotes).toEqual(['C', 'D', 'E', 'F♯', 'G♯', 'B♭'])
  })
})
