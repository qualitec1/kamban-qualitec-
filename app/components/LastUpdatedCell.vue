<template>
  <span
    v-if="updatedAt"
    class="text-xs text-neutral-400 whitespace-nowrap cursor-default"
    :title="fullDate"
  >
    {{ relative }}
  </span>
  <span v-else class="text-xs text-neutral-300">—</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ updatedAt: string | null }>()

const parsed = computed(() =>
  props.updatedAt ? new Date(props.updatedAt) : null
)

const fullDate = computed(() =>
  parsed.value
    ? parsed.value.toLocaleString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''
)

const relative = computed(() => {
  if (!parsed.value) return ''
  const now = Date.now()
  const diff = Math.floor((now - parsed.value.getTime()) / 1000)

  if (diff < 60)           return 'agora'
  if (diff < 3600)         return `${Math.floor(diff / 60)}min`
  if (diff < 86400)        return `${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7)    return `${Math.floor(diff / 86400)}d`
  if (diff < 86400 * 30)   return `${Math.floor(diff / (86400 * 7))}sem`
  if (diff < 86400 * 365)  return `${Math.floor(diff / (86400 * 30))}m`
  return `${Math.floor(diff / (86400 * 365))}a`
})
</script>
