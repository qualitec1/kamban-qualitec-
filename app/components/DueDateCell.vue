<template>
  <span
    v-if="dueDate"
    class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
    :class="labelClass"
    :title="fullDate"
  >
    <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    {{ label }}
  </span>
  <span v-else class="text-xs text-neutral-300">—</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ dueDate: string | null }>()

const today = new Date()
today.setHours(0, 0, 0, 0)

const parsed = computed(() => {
  if (!props.dueDate) return null
  const d = new Date(props.dueDate)
  d.setHours(0, 0, 0, 0)
  return d
})

const diffDays = computed(() => {
  if (!parsed.value) return null
  return Math.round((parsed.value.getTime() - today.getTime()) / 86_400_000)
})

const isOverdue = computed(() => diffDays.value !== null && diffDays.value < 0)
const isToday   = computed(() => diffDays.value === 0)
const isSoon    = computed(() => diffDays.value !== null && diffDays.value > 0 && diffDays.value <= 3)

const labelClass = computed(() => {
  if (isOverdue.value) return 'bg-danger-50 text-danger-600'
  if (isToday.value)   return 'bg-warning-50 text-warning-600'
  if (isSoon.value)    return 'bg-yellow-50 text-yellow-600'
  return 'bg-neutral-100 text-neutral-500'
})

const label = computed(() => {
  if (!parsed.value || diffDays.value === null) return ''
  if (isOverdue.value) return `Atrasado ${Math.abs(diffDays.value)}d`
  if (isToday.value)   return 'Hoje'
  if (diffDays.value === 1) return 'Amanhã'
  // Format as dd/mm
  return parsed.value.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
})

const fullDate = computed(() =>
  parsed.value
    ? parsed.value.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''
)
</script>
