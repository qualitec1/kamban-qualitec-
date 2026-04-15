<template>
  <!-- Overlay -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="close"
      >
        <!-- Modal container -->
        <div
          class="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col motion-interactive"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h2 class="text-lg font-semibold text-neutral-900">
              Atualizações da Tarefa
            </h2>
            <button
              type="button"
              class="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex items-center gap-4 px-6 py-3 border-b border-neutral-200">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="activeTab === 'updates' ? 'bg-primary-100 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'"
              @click="activeTab = 'updates'"
            >
              Atualizações
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="activeTab === 'files' ? 'bg-primary-100 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'"
              @click="activeTab = 'files'"
            >
              Arquivos
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="activeTab === 'activity' ? 'bg-primary-100 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'"
              @click="activeTab = 'activity'"
            >
              Atividades
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <!-- Tab: Atualizações -->
            <div v-if="activeTab === 'updates'" class="p-6 space-y-6">
              <!-- Composer -->
              <TaskUpdateComposer
                :task-id="taskId"
                :board-id="boardId"
                @created="handleUpdateCreated"
              />

              <!-- Loading state -->
              <div v-if="loading && updates.length === 0" class="flex items-center justify-center py-12">
                <svg class="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>

              <!-- Empty state -->
              <div v-else-if="updates.length === 0" class="flex flex-col items-center justify-center py-12 text-neutral-500">
                <svg class="w-16 h-16 mb-4 text-neutral-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <p class="text-sm">Nenhuma atualização ainda</p>
                <p class="text-xs mt-1">Seja o primeiro a comentar!</p>
              </div>

              <!-- Lista de atualizações -->
              <div v-else class="space-y-4">
                <TaskUpdateCard
                  v-for="update in updates"
                  :key="update.id"
                  :update="update"
                  :task-id="taskId"
                  :board-id="boardId"
                  @deleted="handleUpdateDeleted"
                  @updated="handleUpdateUpdated"
                />

                <!-- Load more button -->
                <button
                  v-if="hasMore"
                  type="button"
                  class="w-full py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  :disabled="loading"
                  @click="loadMore"
                >
                  <span v-if="loading">Carregando...</span>
                  <span v-else>Carregar mais</span>
                </button>
              </div>
            </div>

            <!-- Tab: Arquivos -->
            <div v-else-if="activeTab === 'files'" class="p-6">
              <div class="flex flex-col items-center justify-center py-12 text-neutral-500">
                <svg class="w-16 h-16 mb-4 text-neutral-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p class="text-sm">Em breve: visualização de arquivos</p>
              </div>
            </div>

            <!-- Tab: Atividades -->
            <div v-else-if="activeTab === 'activity'" class="p-6">
              <div class="flex flex-col items-center justify-center py-12 text-neutral-500">
                <svg class="w-16 h-16 mb-4 text-neutral-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm">Em breve: histórico de atividades</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useTaskUpdates } from '~/composables/useTaskUpdates'

const props = defineProps<{
  modelValue: boolean
  taskId: string
  boardId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const activeTab = ref<'updates' | 'files' | 'activity'>('updates')

const { updates, loading, hasMore, fetchUpdates } = useTaskUpdates(props.taskId)

function close() {
  emit('update:modelValue', false)
}

function handleUpdateCreated() {
  // Recarregar lista
  fetchUpdates(true)
  emit('updated')
}

function handleUpdateDeleted() {
  emit('updated')
}

function handleUpdateUpdated() {
  emit('updated')
}

function loadMore() {
  fetchUpdates(false)
}

// Carregar atualizações quando modal abrir
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    console.log('[TaskUpdatesModal] Modal opened', { taskId: props.taskId, boardId: props.boardId })
    if (!props.taskId) {
      console.error('[TaskUpdatesModal] taskId is required!')
      return
    }
    if (updates.value.length === 0) {
      fetchUpdates(true)
    }
  }
})

// Carregar ao montar se já estiver aberto
onMounted(() => {
  if (props.modelValue) {
    console.log('[TaskUpdatesModal] Mounted with modal open', { taskId: props.taskId, boardId: props.boardId })
    if (!props.taskId) {
      console.error('[TaskUpdatesModal] taskId is required!')
      return
    }
    fetchUpdates(true)
  }
})
</script>

<style scoped>
/* Animação do modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
