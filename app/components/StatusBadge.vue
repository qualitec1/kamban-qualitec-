<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium truncate max-w-[120px]"
    :style="{ backgroundColor: bgColor, color: textColor }"
    :title="status.name"
  >
    {{ status.name }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TaskStatus } from '~/composables/useTaskStatuses'

const props = defineProps<{ status: TaskStatus }>()

// Derive a readable text color (white or dark) based on background luminance
const textColor = computed(() => {
  const hex = props.status.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#1a1a1a' : '#ffffff'
})

const bgColor = computed(() => props.status.color)
</script>
