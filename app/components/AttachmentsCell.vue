<template>
  <div class="flex items-center gap-1 min-w-[40px]">
    <!-- Skeleton -->
    <div v-if="loading" class="w-8 h-4 rounded bg-neutral-100 animate-pulse" />

    <!-- Com arquivos -->
    <button
      v-else-if="count > 0"
      type="button"
      class="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-primary-600 transition-colors min-h-[44px] lg:min-h-[36px] px-2 rounded hover:bg-primary-50"
      :title="tooltip"
      @click.stop="openModal"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <span>{{ count }}</span>
    </button>

    <!-- Sem arquivos -->
    <button
      v-else
      type="button"
      class="text-neutral-300 hover:text-primary-600 transition-colors min-h-[44px] lg:min-h-[36px] px-2 rounded hover:bg-primary-50"
      title="Adicionar anexos"
      @click.stop="openModal"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    </button>

    <!-- Modal de anexos -->
    <AttachmentsModal
      :task-id="taskId"
      :is-subtask="isSubtask"
      :open="modalOpen"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskAttachments } from '~/composables/useTaskAttachments'

const props = defineProps<{ 
  taskId: string
  isSubtask?: boolean
  initialCount?: number
}>()

const { count, loading, fetchCount } = useTaskAttachments(props.taskId, props.isSubtask)
const modalOpen = ref(false)

// Se o pai já passou a contagem, usar imediatamente sem request
if (props.initialCount !== undefined) {
  count.value = props.initialCount
}

const tooltip = computed(() =>
  count.value === 0
    ? 'Sem anexos'
    : `${count.value} anexo${count.value > 1 ? 's' : ''}`
)

function openModal() {
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  // Recarregar contagem real após fechar modal (pode ter adicionado/removido)
  fetchCount()
}

onMounted(() => {
  // Só faz request se não recebeu a contagem via prop
  if (props.initialCount === undefined) {
    fetchCount()
  }
})
</script>
