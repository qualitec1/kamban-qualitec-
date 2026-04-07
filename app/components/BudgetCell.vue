<template>
  <div class="relative min-w-[90px] max-w-[130px]">
    <!-- Editing -->
    <div v-if="editing" class="flex items-center gap-1">
      <span class="text-xs text-neutral-400 shrink-0">R$</span>
      <input
        ref="inputRef"
        v-model="draft"
        type="text"
        inputmode="decimal"
        placeholder="0,00"
        class="w-full text-xs text-neutral-700 bg-white border border-primary-400 rounded px-1.5 py-1 outline-none min-h-[32px]"
        @keydown.enter.prevent="save"
        @keydown.esc="cancel"
      />
      <button
        type="button"
        class="text-primary-600 hover:text-primary-700 shrink-0 p-1"
        @mousedown.prevent="save"
        title="Salvar"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>

    <!-- Display -->
    <button
      v-else
      type="button"
      class="w-full text-left min-h-[44px] flex items-center"
      @click="startEdit"
      :title="budget != null ? formatted : 'Adicionar orçamento'"
    >
      <span v-if="budget != null" class="text-xs font-medium text-neutral-600">{{ formatted }}</span>
      <span v-else class="text-xs text-neutral-300 italic">—</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = defineProps<{ taskId: string; budget: number | null }>()
const emit = defineEmits<{ (e: 'update:budget', value: number | null): void }>()

const supabase = useNuxtApp().$supabase as any
const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const formatted = computed(() => {
  if (props.budget == null) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(props.budget)
})

function startEdit() {
  // Use comma as decimal separator for pt-BR UX
  draft.value = props.budget != null ? String(props.budget).replace('.', ',') : ''
  editing.value = true
  nextTick(() => { inputRef.value?.focus(); inputRef.value?.select() })
}

async function save() {
  editing.value = false
  const raw = draft.value.trim().replace(',', '.')
  const value = raw === '' ? null : parseFloat(raw)
  if (value === props.budget) return
  if (value !== null && isNaN(value)) return
  try {
    await supabase.from('tasks').update({ budget: value }).eq('id', props.taskId)
    emit('update:budget', value)
  } catch { /* silently fail */ }
}

function cancel() {
  editing.value = false
}
</script>
