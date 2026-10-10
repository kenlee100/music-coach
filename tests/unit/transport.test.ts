import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePracticeTransport } from '../../app/composables/usePracticeTransport'
import type { Timeline } from '../../app/domain/timeline'

const playChord = vi.fn(async () => undefined)
const stopAudio = vi.fn()
vi.mock('~/services/audio.client', () => ({
  playChord,
  playMidi: vi.fn(async () => undefined),
  stopAudio
}))

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('practice transport lifecycle', () => {
  it('invalidates callbacks from a stopped playback generation', async () => {
    vi.useFakeTimers()
    const timeline: Timeline = {
      version: 2,
      bars: [{ id: 'bar-1', events: [{ id: 'event-1', chord: 'C', startTick: 16, durationTicks: 16 }] }]
    }
    let transport!: ReturnType<typeof usePracticeTransport>
    const wrapper = mount(defineComponent({
      setup() {
        transport = usePracticeTransport({
          timeline: ref(timeline),
          bpm: ref(60),
          meter: ref(4),
          countIn: ref(false),
          loop: ref(false),
          notify: vi.fn()
        })
        return () => null
      }
    }))

    await transport.togglePlayback()
    await vi.advanceTimersByTimeAsync(500)
    await transport.togglePlayback()
    await transport.togglePlayback()
    await vi.advanceTimersByTimeAsync(500)
    expect(playChord).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    expect(playChord).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    await vi.runAllTimersAsync()
    expect(stopAudio).toHaveBeenCalled()
  })
})
