<template>
  <div class="relative min-w-[120px] max-w-[200px]" ref="rootRef">
    <!-- Editing mode -->
    <input
      v-if="editing"
      ref="inputRef"
      v-model="draft"
      type="text"
      maxlength="200"
      class="w-full text-xs text-neutral-700 bg-white border border-primary-400 rounded px-2 py-0.5 outline-none"
      @blur="save"
      @keydown.enter="save"
      @keydown.esc="cancel"
    />

    <!-- Display mode -->
    <button
      v-else
      type="button"
      class="w-full text-left"
      @click="startEdit"
      :title="note || 'Adicionar nota'"
    >
      <span v-if="note" class="text-xs text-neutral-500 truncate block">{{ note }}</span>
      <span v-else class="text-xs text-neutral-300 italic">—</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  taskId: string
  note: string | null
}>()

const emit = defineEmits<{
  (e: 'update:note', value: string | null): void
}>()

const supabase = useNuxtApp().$supabase as any

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)

function startEdit() {
  draft.value = props.note ?? ''
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

async function save() {
  editing.value = false
  const value = draft.value.trim() || null
  if (value === props.note) return
  try {
    await supabase.from('tasks').update({ description: value }).eq('id', props.taskId)
    emit('update:note', value)
  } catch {
    // silently fail
  }
}

function cancel() {
  editing.value = false
}
</script>
