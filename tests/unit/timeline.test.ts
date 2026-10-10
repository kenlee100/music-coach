import { describe, expect, it } from 'vitest'
import { addChord, barTicks, migrateProgression, moveWithPush, normalizeTimeline, resizeWithPush, type TimelineEvent } from '../../app/domain/timeline'

const event = (id: string, startTick: number, durationTicks: TimelineEvent['durationTicks'] = 16): TimelineEvent => ({ id, chord: 'C', startTick, durationTicks })
const validChord = (name: string) => ['C', 'G', 'Am'].includes(name)

describe('timeline domain', () => {
  it('uses 64 ticks for 4/4 and 48 for 3/4', () => {
    expect(barTicks(4)).toBe(64)
    expect(barTicks(3)).toBe(48)
  })

  it('migrates each legacy chord into an independent bar', () => {
    const fourFour = migrateProgression(['C', 'G'], 4, validChord)
    expect(fourFour.bars).toHaveLength(2)
    expect(fourFour.bars[0]!.events[0]!.durationTicks).toBe(64)
    expect(migrateProgression(['Am'], 3, validChord).bars[0]!.events[0]!.durationTicks).toBe(48)
  })

  it('rejects overlapping or out-of-range stored events', () => {
    expect(normalizeTimeline({ version: 2, bars: [{ id: 'b', events: [event('a', 0), event('b', 8)] }] }, 4, validChord)).toBeNull()
    expect(normalizeTimeline({ version: 2, bars: [{ id: 'b', events: [event('a', 40, 16)] }] }, 3, validChord)).toBeNull()
  })

  it('rejects malformed bars without throwing', () => {
    expect(() => normalizeTimeline({ version: 2, bars: [null] }, 4, validChord)).not.toThrow()
    expect(normalizeTimeline({ version: 2, bars: [null] }, 4, validChord)).toBeNull()
  })

  it('adds quarter-note chords to the earliest available gap', () => {
    let timeline = migrateProgression([], 4, validChord)
    timeline = addChord(timeline, 'C', 4)
    timeline = addChord(timeline, 'G', 4)
    expect(timeline.bars[0]!.events.map(item => item.startTick)).toEqual([0, 16])
  })

  it('pushes a collision chain right and stops at boundaries', () => {
    const events = [event('a', 0), event('b', 16), event('c', 32)]
    expect(moveWithPush(events, 'a', 16, 4)?.map(item => item.startTick)).toEqual([16, 32, 48])
    expect(moveWithPush(events, 'a', 32, 4)).toBeNull()
  })

  it('resizes only to standard durations and pushes neighbours', () => {
    const result = resizeWithPush([event('a', 0), event('b', 16)], 'a', 32, 'right', 4)
    expect(result?.map(item => [item.startTick, item.durationTicks])).toEqual([[0, 32], [32, 16]])
  })
})
