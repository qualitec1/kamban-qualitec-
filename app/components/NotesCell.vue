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
      @click="startEdit"
      :title="note || 'Adicionar nota'"
    >
      <span v-if="note" class="text-xs text-neutral-700 line-clamp-2">{{ note }}</span>
      <span v-else class="text-xs text-neutral-300 italic">Adicionar nota</span>
    </button>

    <!-- Display mode sem permissão (read-only) -->
    <div
      v-else
      class="w-full min-h-[44px] px-2 py-1.5 cursor-default"
      :title="note || 'Sem nota'"
    >
      <span v-if="note" class="text-xs text-neutral-500 line-clamp-2">{{ note }}</span>
      <span v-else class="text-xs text-neutral-300 italic">—</span>
    </div>
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

function startEdit() {
  if (!canEditTasks.value) return
  draft.value = props.note ?? ''
  editing.value = true
  nextTick(() => inputRef.value?.focus())
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
