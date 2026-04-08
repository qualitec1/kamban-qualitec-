<template>
  <div class="space-y-3">
    <!-- Header com contador -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-neutral-700">
        Subtarefas
        <span v-if="subtasks.length > 0" class="text-neutral-400 font-normal">
          ({{ completedCount }}/{{ subtasks.length }})
        </span>
      </h3>
      
      <!-- Barra de progresso -->
      <div v-if="subtasks.length > 0" class="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          class="h-full bg-primary-500 transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Input para criar nova subtarefa -->
    <div class="flex items-center gap-2">
      <input
        v-model="newSubtaskTitle"
        type="text"
        placeholder="Adicionar subitem..."
        :disabled="!canEdit"
        class="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-neutral-50"
        @keydown.enter.prevent="handleCreate"
      />
      <button
        v-if="newSubtaskTitle.trim() && canEdit"
        type="button"
        class="px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors min-h-[44px]"
        :disabled="creating"
        @click="handleCreate"
      >
        {{ creating ? 'Criando...' : 'Adicionar' }}
      </button>
    </div>

    <!-- Lista de subtarefas -->
    <div v-if="subtasks.length > 0" ref="subtaskListRef" class="space-y-2">
      <SubtaskItem
        v-for="subtask in sortedSubtasks"
        :key="subtask.id"
        :subtask="subtask"
        :can-edit="canEdit"
        :can-drag="canEdit"
        @toggle="handleToggle"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </div>

    <!-- Estado vazio -->
    <p v-else class="text-sm text-neutral-400 italic py-2">
      Nenhuma subtarefa ainda
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSortable } from '@vueuse/core'
import { useSubtasks } from '~/composables/useSubtasks'
import { useBoardPermissions } from '~/composables/useBoardPermissions'
import SubtaskItem from '~/components/SubtaskItem.vue'

const props = defineProps<{
  taskId: string
  boardId: string
}>()

const { canEdit, fetchUserRole } = useBoardPermissions(props.boardId)
const {
  subtasks,
  loading,
  creating,
  fetchSubtasks,
  createSubtask,
  toggleSubtask,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks,
} = useSubtasks(props.taskId)

const newSubtaskTitle = ref('')
const subtaskListRef = ref<HTMLElement | null>(null)

// Debug: verificar permissões
watch(canEdit, (value) => {
  console.log('🔐 Permissão de edição (canEdit):', value)
}, { immediate: true })

const sortedSubtasks = computed(() => 
  [...subtasks.value].sort((a, b) => a.sort_order - b.sort_order)
)

const completedCount = computed(() => 
  subtasks.value.filter(s => s.is_done).length
)

const progressPercent = computed(() => 
  subtasks.value.length > 0 
    ? Math.round((completedCount.value / subtasks.value.length) * 100)
    : 0
)

async function handleCreate() {
  const title = newSubtaskTitle.value.trim()
  if (!title) return
  
  await createSubtask(title)
  newSubtaskTitle.value = ''
}

async function handleToggle(subtaskId: string, isDone: boolean) {
  await toggleSubtask(subtaskId, isDone)
}

async function handleUpdate(subtaskId: string, title: string) {
  await updateSubtask(subtaskId, { title })
}

async function handleDelete(subtaskId: string) {
  await deleteSubtask(subtaskId)
}

// Configurar drag & drop
onMounted(async () => {
  await Promise.all([
    fetchSubtasks(),
    fetchUserRole()
  ])
  
  // Inicializar sortable apenas se tiver permissão de edição
  if (canEdit.value && subtaskListRef.value) {
    useSortable(subtaskListRef.value, sortedSubtasks, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'opacity-50',
      dragClass: 'cursor-grabbing',
      onEnd: async () => {
        // Reordenar após soltar
        await reorderSubtasks(sortedSubtasks.value)
      }
    })
  }
})
</script>
