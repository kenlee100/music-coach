export const TICKS_PER_WHOLE = 64
export const DURATION_TICKS = [64, 32, 16, 8, 4, 2, 1] as const
export type Meter = 3 | 4
export type DurationTicks = typeof DURATION_TICKS[number] | 48

export interface TimelineEvent {
  id: string
  chord: string
  startTick: number
  durationTicks: DurationTicks
}

export interface TimelineBar { id: string; events: TimelineEvent[] }
export interface Timeline { version: 2; bars: TimelineBar[] }

export const barTicks = (meter: Meter) => meter * 16
export const isDuration = (value: number, meter?: Meter): value is DurationTicks =>
  DURATION_TICKS.includes(value as typeof DURATION_TICKS[number]) || (meter === 3 && value === barTicks(meter))
export const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
export const createEmptyTimeline = (): Timeline => ({ version: 2, bars: [{ id: createId('bar'), events: [] }] })

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function isValidEvent(value: unknown, meter: Meter): value is TimelineEvent {
  if (!isRecord(value)) return false
  return Boolean(typeof value.id === 'string' && value.id && typeof value.chord === 'string' && value.chord &&
    Number.isInteger(value.startTick) && Number(value.startTick) >= 0 && Number.isInteger(value.durationTicks) &&
    isDuration(Number(value.durationTicks), meter) && Number(value.startTick) + Number(value.durationTicks) <= barTicks(meter))
}

export function normalizeTimeline(value: unknown, meter: Meter, validChord: (name: string) => boolean): Timeline | null {
  if (!isRecord(value) || value.version !== 2 || !Array.isArray(value.bars)) return null
  if (value.bars.some(bar => !isRecord(bar) || !Array.isArray(bar.events) || bar.events.some(event => !isValidEvent(event, meter) || !validChord(event.chord)))) return null
  const bars = value.bars.map(bar => ({
    id: typeof bar.id === 'string' && bar.id ? bar.id : createId('bar'),
    events: (bar.events as unknown[]).filter((event): event is TimelineEvent => isValidEvent(event, meter) && validChord(event.chord))
  }))
  if (bars.some(bar => [...bar.events].sort((a, b) => a.startTick - b.startTick)
    .some((event, index, events) => index > 0 && events[index - 1]!.startTick + events[index - 1]!.durationTicks > event.startTick))) return null
  return { version: 2, bars: bars.length ? bars : createEmptyTimeline().bars }
}

export function migrateProgression(value: unknown, meter: Meter, validChord: (name: string) => boolean): Timeline {
  const current = normalizeTimeline(value, meter, validChord)
  if (current) return current
  if (!Array.isArray(value)) return createEmptyTimeline()
  const durationTicks = barTicks(meter) as DurationTicks
  const chords = value.filter((name): name is string => typeof name === 'string' && validChord(name))
  return {
    version: 2,
    bars: chords.length ? chords.map(chord => ({ id: createId('bar'), events: [{ id: createId('event'), chord, startTick: 0, durationTicks }] })) : createEmptyTimeline().bars
  }
}

function shifted(events: TimelineEvent[], ids: Set<string>, delta: number) {
  return events.map(event => ids.has(event.id) ? { ...event, startTick: event.startTick + delta } : { ...event })
}

export function moveWithPush(events: TimelineEvent[], eventId: string, targetStart: number, meter: Meter): TimelineEvent[] | null {
  const original = events.find(event => event.id === eventId)
  if (!original) return null
  const limit = barTicks(meter)
  const direction = Math.sign(targetStart - original.startTick)
  if (!direction) return events.map(event => ({ ...event }))
  const ordered = [...events].sort((a, b) => a.startTick - b.startTick)
  const moving = new Set([eventId])
  let candidate = Math.max(0, Math.min(limit - original.durationTicks, targetStart))
  let next = ordered.map(event => event.id === eventId ? { ...event, startTick: candidate } : { ...event })
  let changed = true
  while (changed) {
    changed = false
    const active = next.filter(event => moving.has(event.id))
    for (const event of next) {
      if (moving.has(event.id)) continue
      const collision = active.some(item => item.startTick < event.startTick + event.durationTicks && item.startTick + item.durationTicks > event.startTick)
      if (!collision) continue
      moving.add(event.id)
      changed = true
    }
    if (changed) next = shifted(ordered, moving, candidate - original.startTick)
  }
  const group = next.filter(event => moving.has(event.id))
  const min = Math.min(...group.map(event => event.startTick))
  const max = Math.max(...group.map(event => event.startTick + event.durationTicks))
  if (min < 0 || max > limit) return null
  const sorted = [...next].sort((a, b) => a.startTick - b.startTick)
  if (sorted.some((event, index) => index > 0 && sorted[index - 1]!.startTick + sorted[index - 1]!.durationTicks > event.startTick)) return null
  return sorted
}

export function resizeWithPush(events: TimelineEvent[], eventId: string, durationTicks: DurationTicks, edge: 'left' | 'right', meter: Meter) {
  const event = events.find(item => item.id === eventId)
  if (!event) return null
  const nextStart = edge === 'left' ? event.startTick + event.durationTicks - durationTicks : event.startTick
  const resized = events.map(item => item.id === eventId ? { ...item, startTick: nextStart, durationTicks } : { ...item })
  const ordered = [...resized].sort((a, b) => a.startTick - b.startTick)
  if (edge === 'right') {
    for (let index = 1; index < ordered.length; index++) {
      const previous = ordered[index - 1]!
      const current = ordered[index]!
      if (current.startTick < previous.startTick + previous.durationTicks) current.startTick = previous.startTick + previous.durationTicks
    }
  } else {
    for (let index = ordered.length - 2; index >= 0; index--) {
      const current = ordered[index]!
      const next = ordered[index + 1]!
      if (current.startTick + current.durationTicks > next.startTick) current.startTick = next.startTick - current.durationTicks
    }
  }
  if (ordered.some(item => item.startTick < 0 || item.startTick + item.durationTicks > barTicks(meter))) return null
  return ordered
}

export function addChord(timeline: Timeline, chord: string, meter: Meter): Timeline {
  const capacity = barTicks(meter)
  for (const bar of timeline.bars) {
    const ordered = [...bar.events].sort((a, b) => a.startTick - b.startTick)
    let cursor = 0
    for (const event of ordered) {
      if (event.startTick - cursor >= 16) break
      cursor = event.startTick + event.durationTicks
    }
    if (capacity - cursor >= 16) {
      return { ...timeline, bars: timeline.bars.map(item => item.id === bar.id ? { ...item, events: [...item.events, { id: createId('event'), chord, startTick: cursor, durationTicks: 16 }] } : item) }
    }
  }
  return { ...timeline, bars: [...timeline.bars, { id: createId('bar'), events: [{ id: createId('event'), chord, startTick: 0, durationTicks: 16 }] }] }
}
