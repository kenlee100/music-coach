<script setup lang="ts">
import { fretboard, type Chord } from '~/domain/theory'

const props = defineProps<{ chord: Chord; guitarTheme: string }>()
const emit = defineEmits<{
  add: []
  'play-chord': []
  'play-note': [midi: number]
  'update:guitar-theme': [value: string]
}>()

const stringLabels = ['高E', 'B', 'G', 'D', 'A', '低E']
const cells = computed(() => fretboard(props.chord))
</script>

<template>
  <section id="fretboard" class="fretboard-panel">
    <div class="selected-bar">
      <div>
        <p class="kicker"><span>02</span> CURRENT CHORD</p>
        <div class="chord-name">{{ chord.name }}</div>
      </div>
      <div class="notes-readout">
        <p class="kicker">TONE MAP <span>{{ chord.formula }}</span></p>
        <strong>{{ chord.notes.join(' · ') }}</strong>
      </div>
      <button class="add-button" @click="emit('add')">加入時間軸 ＋</button>
    </div>
    <div class="listen-deck">
      <div>
        <p class="kicker">LISTEN / MONITOR</p>
        <strong>{{ chord.label }}</strong>
      </div>
      <button class="primary-sound" @click="emit('play-chord')">▶ 播放和弦</button>
    </div>
    <div class="fretboard-controls">
      <label>
        <span class="kicker">GUITAR FINISH</span>
        <select :value="guitarTheme" @change="emit('update:guitar-theme', ($event.target as HTMLSelectElement).value)">
          <option value="electric">電吉他</option>
          <option value="acoustic">木吉他</option>
        </select>
      </label>
      <p class="legend"><span class="root-dot" />根音 <span class="tone-dot" />組成音</p>
    </div>
    <div class="fretboard-scroll">
      <div class="fretboard-wrap" :class="guitarTheme" role="grid" :aria-label="`${guitarTheme === 'acoustic' ? '木吉他' : '電吉他'}指板`">
        <span v-for="string in 6" :key="`string-${string}`" class="fretboard-string" :class="`fretboard-string-${string}`" aria-hidden="true" />
        <template v-for="(string, stringIndex) in 6" :key="string">
          <span class="string-label">{{ stringLabels[stringIndex] }}</span>
          <template v-for="cell in cells.filter(value => value.stringIndex === stringIndex)" :key="`${cell.stringIndex}-${cell.fret}`">
            <button
              v-if="cell.active"
              class="note"
              :class="cell.root ? 'root' : 'tone'"
              :aria-label="`${cell.stringName} 弦第 ${cell.fret} 格 ${cell.note}`"
              @click="emit('play-note', cell.midi)"
            >
              {{ cell.note }}
            </button>
            <span v-else class="note inactive" aria-hidden="true" />
          </template>
        </template>
      </div>
      <div class="fret-labels"><span /><span v-for="fret in 22" :key="fret">{{ fret }}</span></div>
    </div>
  </section>
</template>
