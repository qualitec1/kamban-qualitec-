<template>
  <div class="relative flex-1 min-w-[140px] max-w-[300px] group">
    <!-- Editing mode (apenas se tiver permissão) -->
    <input
      v-if="editing && canEditTasks"
      ref="inputRef"
      v-model="draft"
      type="text"
      maxlength="200"
      class="w-full text-sm text-neutral-800 bg-white border border-primary-400 rounded px-2 py-1 outline-none min-h-[32px]"
      @blur="save"
      @keydown.enter="save"
      @keydown.esc="cancel"
    />

    <!-- Display mode -->
    <div v-else class="flex items-center gap-1 min-h-[44px]">
      <button
        type="button"
        class="flex-1 text-left text-sm text-neutral-800 truncate hover:text-primary-600 transition-colors"
        @click="$emit('openModal')"
        :title="title"
      >
        {{ title }}
      </button>
      
      <!-- Ícone de edição — aparece no hover (apenas se tiver permissão) -->
      <button
        v-if="canEditTasks"
        type="button"
        class="shrink-0 p-1 text-neutral-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop="startEdit"
        title="Editar título"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useBoardPermissions } from '~/composables/useBoardPermissions'

const props = defineProps<{
  taskId: string
  boardId: string
  title: string
}>()

const emit = defineEmits<{
  (e: 'update:title', value: string): void
  (e: 'openModal'): void
}>()

const supabase = useNuxtApp().$supabase as any
const { canEdit: canEditTasks, fetchUserRole } = useBoardPermissions(props.boardId)

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  if (!canEditTasks.value) return
  draft.value = props.title
  editing.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

async function save() {
  if (!canEditTasks.value) return
  editing.value = false
  const value = draft.value.trim()
  
  // Não salvar se vazio ou igual ao valor atual
  if (!value || value === props.title) {
    draft.value = props.title
    return
  }

  try {
    await supabase
      .from('tasks')
      .update({ title: value })
      .eq('id', props.taskId)
    
    emit('update:title', value)
  } catch {
    // silently fail
  }
}

function cancel() {
  editing.value = false
  draft.value = props.title
}

onMounted(() => {
  fetchUserRole()
})
</script>
