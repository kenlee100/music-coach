import { describe, expect, it } from 'vitest'
import { getChord, noteToMidi } from '../../app/domain/theory'

describe('chord audio pitches', () => {
  it('maps chord note names to the intended MIDI pitches', () => {
    const chord = getChord('C')
    const midi = chord.notes.map((note, index) => noteToMidi(note, index === 0 ? 3 : 4))

    expect(midi).toEqual([48, 64, 67])
  })
})
