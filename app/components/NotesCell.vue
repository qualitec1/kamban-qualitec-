<template>
  <div class="relative min-w-[120px] max-w-[200px]" ref="rootRef">
    <!-- Editing mode (apenas se tiver permissão) -->
    <input
      v-if="editing && canEditTasks"
      ref="inputRef"
      v-model="draft"
      type="text"
      maxlength="200"
      placeholder="Adicionar nota..."
      class="w-full min-h-[44px] text-xs text-neutral-700 bg-white border border-primary-400 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-200 transition-shadow"
      @blur="save"
      @keydown.enter="save"
      @keydown.esc="cancel"
    />

    <!-- Display mode com permissão de edição -->
    <button
      v-else-if="canEditTasks"
      type="button"
      class="w-full min-h-[44px] text-left px-2 py-1.5 rounded hover:bg-neutral-50 transition-colors"
      @click="note ? showNoteModal = true : startEdit()"
      :title="note || 'Adicionar nota'"
    >
      <span v-if="note" class="text-xs text-neutral-700 line-clamp-2">{{ note }}</span>
      <span v-else class="text-xs text-neutral-300 italic">Adicionar nota</span>
    </button>

    <!-- Display mode sem permissão (read-only) -->
    <button
      v-else
      type="button"
      class="w-full min-h-[44px] text-left px-2 py-1.5 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
      @click="note ? showNoteModal = true : null"
      :title="note || 'Sem nota'"
    >
      <span v-if="note" class="text-xs text-neutral-500 line-clamp-2">{{ note }}</span>
      <span v-else class="text-xs text-neutral-300 italic">—</span>
    </button>

    <!-- Modal de visualização da nota -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showNoteModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          @click="showNoteModal = false"
        >
          <div
            class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 class="text-lg font-semibold text-neutral-900">Nota</h3>
              <div class="flex items-center gap-2">
                <!-- Botão editar (apenas se tiver permissão) -->
                <button
                  v-if="canEditTasks"
                  type="button"
                  class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                  @click="editFromModal"
                  title="Editar nota"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <!-- Botão fechar -->
                <button
                  type="button"
                  class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                  @click="showNoteModal = false"
                  title="Fechar"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Conteúdo -->
            <div class="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              <p class="text-sm text-neutral-700 whitespace-pre-wrap break-words">{{ note }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useBoardPermissions } from '~/composables/useBoardPermissions'

const props = defineProps<{
  taskId: string
  boardId: string
  note: string | null
}>()

const emit = defineEmits<{
  (e: 'update:note', value: string | null): void
}>()

const supabase = useNuxtApp().$supabase as any

const { canEdit, fetchUserRole } = useBoardPermissions(props.boardId)
const canEditTasks = computed(() => canEdit.value)

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const showNoteModal = ref(false)

function startEdit() {
  if (!canEditTasks.value) return
  draft.value = props.note ?? ''
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

function editFromModal() {
  showNoteModal.value = false
  startEdit()
}

async function save() {
  editing.value = false
  const value = draft.value.trim() || null
  
  // Não salvar se não mudou
  if (value === props.note) return
  
  // Optimistic update
  emit('update:note', value)
  
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ notes: value })
      .eq('id', props.taskId)
    
    if (error) {
      console.error('Erro ao salvar nota:', error)
      // Reverter em caso de erro
      emit('update:note', props.note)
    }
  } catch (err) {
    console.error('Erro ao salvar nota:', err)
    // Reverter em caso de erro
    emit('update:note', props.note)
  }
}

function cancel() {
  editing.value = false
  draft.value = props.note ?? ''
}

onMounted(() => {
  fetchUserRole()
})
</script>
