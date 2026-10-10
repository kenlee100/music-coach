<script setup lang="ts">
import { DURATION_TICKS, barTicks, moveWithPush, resizeWithPush, type DurationTicks, type Meter, type Timeline, type TimelineEvent } from '~/domain/timeline'

const props = defineProps<{ modelValue: Timeline; meter: Meter; playingEventId?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: Timeline]; remove: [barId: string, eventId: string]; announce: [message: string] }>()
const labels: Record<number, string> = { 64: '全音符', 48: '附點二分', 32: '二分', 16: '四分', 8: '八分', 4: '十六分', 2: '三十二分', 1: '六十四分' }
const drag = ref<{ barId: string; event: TimelineEvent; originX: number; edge?: 'left' | 'right'; preview?: TimelineEvent[] } | null>(null)

function updateBar(barId: string, events: TimelineEvent[]) { emit('update:modelValue', { ...props.modelValue, bars: props.modelValue.bars.map(bar => bar.id === barId ? { ...bar, events } : bar) }) }
function begin(event: PointerEvent, barId: string, item: TimelineEvent, edge?: 'left' | 'right') {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag.value = { barId, event: { ...item }, originX: event.clientX, edge }
}
function move(event: PointerEvent) {
  if (!drag.value) return
  const bar = props.modelValue.bars.find(item => item.id === drag.value!.barId); if (!bar) return
  const grid = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.timeline-bar')].find(item => item.dataset.barId === drag.value!.barId); if (!grid) return
  const delta = Math.round((event.clientX - drag.value.originX) / grid.clientWidth * barTicks(props.meter))
  if (drag.value.edge) {
    const raw = drag.value.edge === 'right' ? drag.value.event.durationTicks + delta : drag.value.event.durationTicks - delta
    const duration = [...DURATION_TICKS].sort((a, b) => Math.abs(a - raw) - Math.abs(b - raw))[0] as DurationTicks
    drag.value.preview = resizeWithPush(bar.events, drag.value.event.id, duration, drag.value.edge, props.meter) || undefined
  } else drag.value.preview = moveWithPush(bar.events, drag.value.event.id, drag.value.event.startTick + delta, props.meter) || undefined
}
function commit() {
  if (drag.value?.preview) { updateBar(drag.value.barId, drag.value.preview); emit('announce', '時間軸位置已更新') }
  drag.value = null
}
function cancel() { drag.value = null; emit('announce', '已取消時間軸調整') }
function keyboard(event: KeyboardEvent, barId: string, item: TimelineEvent) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
  event.preventDefault(); const bar = props.modelValue.bars.find(value => value.id === barId); if (!bar) return
  const result = moveWithPush(bar.events, item.id, item.startTick + (event.key === 'ArrowRight' ? 1 : -1), props.meter)
  if (result) { updateBar(barId, result); emit('announce', `${item.chord} 已移動一個六十四分音符`) } else emit('announce', '已到達小節邊界')
}
</script>

<template>
  <div class="timeline-scroll" @pointermove="move" @pointerup="commit" @pointercancel="cancel" @keydown.esc="cancel">
    <div class="timeline-ruler" aria-hidden="true"><span v-for="tick in meter * 4" :key="tick">{{ tick % 4 === 1 ? Math.ceil(tick / 4) : '·' }}</span></div>
    <section v-for="(bar, barIndex) in modelValue.bars" :key="bar.id" class="timeline-bar" :data-bar-id="bar.id" :style="{ '--ticks': barTicks(meter) }" :aria-label="`第 ${barIndex + 1} 小節`">
      <span class="bar-number">{{ String(barIndex + 1).padStart(2, '0') }}</span>
      <div v-for="item in (drag?.barId === bar.id && drag.preview ? drag.preview : bar.events)" :key="item.id"
        class="timeline-event" :class="{ playing: item.id === playingEventId, dragging: drag?.event.id === item.id }" role="group" tabindex="0"
        :data-testid="`timeline-event-${item.chord}`"
        :style="{ '--start': item.startTick, '--duration': item.durationTicks }" :aria-label="`${item.chord}，${labels[item.durationTicks]}，第 ${item.startTick + 1} 格`"
        @pointerdown="begin($event, bar.id, item)" @keydown="keyboard($event, bar.id, item)">
        <span class="resize-handle left" aria-hidden="true" @pointerdown.stop="begin($event, bar.id, item, 'left')" />
        <strong>{{ item.chord }}</strong><small>{{ labels[item.durationTicks] }}</small>
        <span class="resize-handle right" aria-hidden="true" @pointerdown.stop="begin($event, bar.id, item, 'right')" />
        <span class="event-actions"><button type="button" :aria-label="`移除 ${item.chord}`" @pointerdown.stop @click.stop="emit('remove', bar.id, item.id)">×</button></span>
      </div>
    </section>
  </div>
</template>
