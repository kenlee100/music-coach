<script setup lang="ts">
import type { DurationTicks } from '~/domain/timeline'

const props = defineProps<{ ticks: DurationTicks }>()

const flags: Partial<Record<DurationTicks, number>> = { 8: 1, 4: 2, 2: 3, 1: 4 }
const flagCount = computed(() => flags[props.ticks] || 0)
const isOpen = computed(() => props.ticks === 64 || props.ticks === 48 || props.ticks === 32)
const hasStem = computed(() => props.ticks !== 64)
</script>

<template>
  <svg class="duration-glyph" viewBox="0 0 40 52" focusable="false" aria-hidden="true">
    <ellipse cx="15" cy="38" rx="9" ry="6" :fill="isOpen ? 'none' : 'currentColor'" stroke="currentColor" stroke-width="3" transform="rotate(-18 15 38)" />
    <path v-if="hasStem" d="M 23 37 V 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    <path
      v-for="flag in flagCount"
      :key="flag"
      :d="`M 23 ${7 + (flag - 1) * 7} C 35 ${10 + (flag - 1) * 7}, 35 ${18 + (flag - 1) * 7}, 27 ${22 + (flag - 1) * 7}`"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
    <circle v-if="ticks === 48" cx="34" cy="38" r="2.5" fill="currentColor" />
  </svg>
</template>
