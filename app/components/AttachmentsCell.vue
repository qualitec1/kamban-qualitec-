<template>
  <div class="flex items-center gap-1 min-w-[40px]" :title="tooltip">
    <!-- Skeleton -->
    <div v-if="loading" class="w-8 h-4 rounded bg-neutral-100 animate-pulse" />

    <!-- Com arquivos -->
    <button
      v-else-if="count > 0"
      type="button"
      class="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-primary-600 transition-colors"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <span>{{ count }}</span>
    </button>

    <!-- Sem arquivos -->
    <span v-else class="text-neutral-300">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTaskAttachments } from '~/composables/useTaskAttachments'

const props = defineProps<{ taskId: string }>()

const { count, loading, fetchCount } = useTaskAttachments(props.taskId)

const tooltip = computed(() =>
  count.value === 0
    ? 'Sem anexos'
    : `${count.value} anexo${count.value > 1 ? 's' : ''}`
)

onMounted(fetchCount)
</script>
