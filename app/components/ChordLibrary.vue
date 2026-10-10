<script setup lang="ts">
import type { Chord } from '~/domain/theory'

const props = defineProps<{ chords: readonly Chord[]; selectedName: string }>()
const emit = defineEmits<{ select: [chord: Chord] }>()

const search = ref('')
const filter = ref('all')
const filters = [
  { id: 'all', label: '全部' },
  { id: 'major', label: '大' },
  { id: 'minor', label: '小' },
  { id: 'seventh', label: '七' },
  { id: 'other', label: '其他' }
]
const filteredChords = computed(() => props.chords.filter(chord =>
  (filter.value === 'all' || chord.type === filter.value) &&
  chord.name.toLowerCase().includes(search.value.toLowerCase())
))
</script>

<template>
  <aside class="chord-panel">
    <div class="panel-title">
      <div>
        <p class="kicker"><span>01</span> CHORD LIBRARY</p>
        <h1>今天想練什麼？</h1>
      </div>
      <span>{{ filteredChords.length }}</span>
    </div>
    <label class="search">
      <span aria-hidden="true">⌕</span>
      <input v-model="search" type="search" placeholder="找和弦：Cmaj7、Dm、G7" aria-label="搜尋和弦">
    </label>
    <div class="filters" aria-label="和弦分類">
      <button
        v-for="item in filters"
        :key="item.id"
        class="filter"
        :class="{ active: filter === item.id }"
        @click="filter = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="chord-list">
      <button
        v-for="chord in filteredChords"
        :key="chord.name"
        class="chord-card"
        :class="{ active: selectedName === chord.name }"
        @click="emit('select', chord)"
      >
        <strong>{{ chord.name }}</strong>
        <small>{{ chord.notes.join(' · ') }}</small>
      </button>
    </div>
  </aside>
</template>
