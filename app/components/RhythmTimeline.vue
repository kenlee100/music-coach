<script setup lang="ts">
import { getChord } from '~/domain/theory'
import { DURATION_TICKS, barTicks, moveWithPush, resizeWithPush, type DurationTicks, type Meter, type Timeline, type TimelineEvent } from '~/domain/timeline'

const props = defineProps<{
  modelValue: Timeline
  meter: Meter
  playingEventId?: string
  playbackTick?: number | null
  playbackPhase?: 'idle' | 'count-in' | 'playing'
}>()
const emit = defineEmits<{
  'update:modelValue': [value: Timeline]
  remove: [barId: string, eventId: string]
  'add-bar': []
  'remove-bar': [barId: string, barIndex: number]
  announce: [message: string]
}>()

const labels: Record<number, string> = { 64: '全音符', 48: '附點二分音符', 32: '二分音符', 16: '四分音符', 8: '八分音符', 4: '十六分音符', 2: '三十二分音符', 1: '六十四分音符' }
const playbackLabels: Record<string, string> = { completed: '播放完成', playing: '正在播放', pending: '尚未播放' }
const drag = ref<{ barId: string; event: TimelineEvent; originX: number; edge?: 'left' | 'right'; preview?: TimelineEvent[] } | null>(null)
const detailEventId = ref('')
const lastGestureWasDrag = ref(false)

function updateBar(barId: string, events: TimelineEvent[]) {
  emit('update:modelValue', { ...props.modelValue, bars: props.modelValue.bars.map(bar => bar.id === barId ? { ...bar, events } : bar) })
}

function begin(event: PointerEvent, barId: string, item: TimelineEvent, edge?: 'left' | 'right') {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  lastGestureWasDrag.value = false
  drag.value = { barId, event: { ...item }, originX: event.clientX, edge }
}

function durationCandidates(meter: Meter, maxDuration: number): DurationTicks[] {
  return [...new Set([barTicks(meter), ...DURATION_TICKS])]
    .filter(value => value <= maxDuration)
    .sort((a, b) => b - a) as DurationTicks[]
}

function snapDuration(original: DurationTicks, raw: number, delta: number, meter: Meter, maxDuration: number): DurationTicks {
  const candidates = durationCandidates(meter, maxDuration)
  if (Math.abs(delta) < 4) return original

  const directional = candidates.filter(value => delta < 0 ? value < original : value > original)
  if (!directional.length) return original
  return directional.sort((a, b) => Math.abs(a - raw) - Math.abs(b - raw))[0]!
}

function move(event: PointerEvent) {
  if (!drag.value) return
  if (Math.abs(event.clientX - drag.value.originX) > 6) lastGestureWasDrag.value = true
  const bar = props.modelValue.bars.find(item => item.id === drag.value!.barId)
  if (!bar) return
  const timelineBar = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.timeline-bar')].find(item => item.dataset.barId === drag.value!.barId)
  const track = timelineBar?.querySelector<HTMLElement>('.bar-track')
  if (!track) return
  const delta = Math.round((event.clientX - drag.value.originX) / track.clientWidth * barTicks(props.meter))
  if (drag.value.edge) {
    const original = drag.value.event
    const fixedEdge = drag.value.edge === 'right' ? original.startTick : original.startTick + original.durationTicks
    const maxDuration = drag.value.edge === 'right' ? barTicks(props.meter) - fixedEdge : fixedEdge
    const raw = drag.value.edge === 'right' ? original.durationTicks + delta : original.durationTicks - delta
    const duration = snapDuration(original.durationTicks, raw, raw - original.durationTicks, props.meter, maxDuration)
    drag.value.preview = resizeWithPush(bar.events, drag.value.event.id, duration, drag.value.edge, props.meter) || undefined
  } else {
    drag.value.preview = moveWithPush(bar.events, drag.value.event.id, drag.value.event.startTick + delta, props.meter) || undefined
  }
}

function commit() {
  if (drag.value?.preview) {
    updateBar(drag.value.barId, drag.value.preview)
    emit('announce', '時間軸位置已更新')
  }
  drag.value = null
}

function cancel() {
  drag.value = null
  lastGestureWasDrag.value = false
  emit('announce', '已取消時間軸調整')
}

function toggleDetail(eventId: string) {
  if (lastGestureWasDrag.value) {
    lastGestureWasDrag.value = false
    return
  }
  detailEventId.value = detailEventId.value === eventId ? '' : eventId
}

function closeDetail() {
  detailEventId.value = ''
}

function escape() {
  if (drag.value) {
    cancel()
    return
  }
  closeDetail()
}

function keyboard(event: KeyboardEvent, barId: string, item: TimelineEvent) {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    emit('remove', barId, item.id)
    return
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleDetail(item.id)
    return
  }
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
  event.preventDefault()
  const bar = props.modelValue.bars.find(value => value.id === barId)
  if (!bar) return
  const result = moveWithPush(bar.events, item.id, item.startTick + (event.key === 'ArrowRight' ? 1 : -1), props.meter)
  if (result) {
    updateBar(barId, result)
    emit('announce', `${item.chord} 已移動一個六十四分音符`)
  } else {
    emit('announce', '已到達小節邊界')
  }
}

function eventLabel(item: TimelineEvent) {
  const chord = getChord(item.chord)
  return `${chord.name}，${chord.label}，組成音 ${chord.notes.join('、')}，${labels[item.durationTicks]}，第 ${Math.floor(item.startTick / 16) + 1} 拍`
}

function barPlaybackProgress(barIndex: number) {
  if (props.playbackPhase === 'count-in') return 0
  if (props.playbackTick === null || props.playbackTick === undefined) return null
  const ticks = barTicks(props.meter)
  return Math.max(0, Math.min(1, (props.playbackTick - barIndex * ticks) / ticks))
}

function barPlaybackState(barIndex: number) {
  if (props.playbackPhase === 'count-in') return 'pending'
  const progress = barPlaybackProgress(barIndex)
  if (progress === null) return ''
  if (progress >= 1) return 'completed'
  if (progress <= 0 && barIndex > 0) return 'pending'
  return 'playing'
}

function barPlaybackPercent(barIndex: number) {
  return (barPlaybackProgress(barIndex) || 0) * 100
}

function barPlaybackLabel(barIndex: number) {
  return playbackLabels[barPlaybackState(barIndex)] || ''
}

function eventPlaybackState(item: TimelineEvent, barIndex: number) {
  if (props.playbackTick === null || props.playbackTick === undefined) return ''
  const start = barIndex * barTicks(props.meter) + item.startTick
  const end = start + item.durationTicks
  if (props.playbackTick >= end) return 'played'
  if (props.playbackTick < start) return 'pending'
  return 'playing'
}
</script>

<template>
  <section class="timeline-editor" aria-label="和弦時間軸編輯器">
    <div class="timeline-toolbar">
      <p>拖曳和弦可移動位置，左右邊緣可調整標準時值；整小節和弦需先縮短才能移動。空白位置代表休止。</p>
      <button type="button" class="timeline-add-bar" @click="emit('add-bar')">＋ 新增小節</button>
    </div>
    <div class="timeline-grid" @pointermove="move" @pointerup="commit" @pointercancel="cancel" @keydown.esc="escape">
      <section v-for="(bar, barIndex) in modelValue.bars" :key="bar.id" class="timeline-bar" :class="`playback-${barPlaybackState(barIndex)}`" :data-bar-id="bar.id" :style="{ '--ticks': barTicks(meter), '--beats': meter * 4 }" :aria-label="`第 ${barIndex + 1} 小節${barPlaybackLabel(barIndex) ? `，${barPlaybackLabel(barIndex)}` : ''}`">
        <header class="bar-header">
          <span class="bar-number">第 {{ String(barIndex + 1).padStart(2, '0') }} 小節</span>
          <span v-if="barPlaybackLabel(barIndex)" class="bar-playback-status" aria-hidden="true">{{ barPlaybackLabel(barIndex) }}</span>
          <button type="button" class="bar-remove" :disabled="modelValue.bars.length === 1" :aria-label="`刪除第 ${barIndex + 1} 小節`" @click="emit('remove-bar', bar.id, barIndex)">刪除</button>
        </header>
        <div class="bar-sequence-scroll">
          <div class="timeline-ruler" aria-hidden="true"><span v-for="tick in meter * 4" :key="tick">{{ tick % 4 === 1 ? Math.ceil(tick / 4) : '·' }}</span></div>
          <div class="bar-track">
            <div v-if="barPlaybackProgress(barIndex) !== null" class="playback-progress" aria-hidden="true">
              <span class="playback-progress-complete" :style="{ width: `${barPlaybackPercent(barIndex)}%` }" />
              <i v-if="barPlaybackState(barIndex) === 'playing'" class="playback-playhead" :style="{ left: `${barPlaybackPercent(barIndex)}%` }" />
            </div>
            <div v-for="item in (drag?.barId === bar.id && drag.preview ? drag.preview : bar.events)" :key="item.id"
              class="timeline-event" :class="{ playing: eventPlaybackState(item, barIndex) === 'playing' || (playbackTick == null && item.id === playingEventId), played: eventPlaybackState(item, barIndex) === 'played', pending: eventPlaybackState(item, barIndex) === 'pending', dragging: drag?.event.id === item.id, 'detail-open': detailEventId === item.id }" role="group" tabindex="0"
              :data-testid="`timeline-event-${item.chord}`" :style="{ '--start': item.startTick, '--duration': item.durationTicks }"
              :aria-label="eventLabel(item)" :aria-describedby="`event-detail-${item.id}`" :aria-expanded="detailEventId === item.id"
              @pointerdown="begin($event, bar.id, item)" @click="toggleDetail(item.id)" @keydown="keyboard($event, bar.id, item)">
              <span class="resize-handle left" aria-hidden="true" @pointerdown.stop="begin($event, bar.id, item, 'left')" />
              <strong class="event-chord-name">{{ item.chord }}</strong>
              <span class="event-notes">{{ getChord(item.chord).notes.join(' · ') }}</span>
              <span class="duration-symbol" aria-hidden="true"><DurationSymbol :ticks="item.durationTicks" /></span>
              <div :id="`event-detail-${item.id}`" class="event-detail" role="group" aria-label="和弦詳情">
                <strong>{{ getChord(item.chord).name }}</strong><span>{{ getChord(item.chord).label }}</span><span>組成音：{{ getChord(item.chord).notes.join(' · ') }}</span><span class="event-duration"><DurationSymbol :ticks="item.durationTicks" />{{ labels[item.durationTicks] }}</span>
                <button type="button" class="detail-remove" :aria-label="`移除 ${item.chord}`" @pointerdown.stop @click.stop="emit('remove', bar.id, item.id)">移除和弦</button>
              </div>
              <span class="resize-handle right" aria-hidden="true" @pointerdown.stop="begin($event, bar.id, item, 'right')" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
