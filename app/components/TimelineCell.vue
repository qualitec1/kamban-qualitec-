<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      class="flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-600 transition-colors whitespace-nowrap min-h-[44px]"
      :title="tooltip"
      @click="toggleOpen"
    >
      <svg class="w-3.5 h-3.5 shrink-0 text-neutral-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span v-if="startDate || endDate" class="font-medium">{{ displayLabel }}</span>
      <span v-else class="text-neutral-300 italic">—</span>
    </button>

    <!-- Teleport para body — evita ser cortado por overflow:hidden dos pais -->
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-xl p-4 w-72"
        :style="popoverStyle"
      >
        <p class="text-xs font-semibold text-neutral-500 mb-3 uppercase tracking-wide">Cronograma</p>

        <div class="space-y-3">
          <div>
            <label class="text-xs text-neutral-500 block mb-1">Início</label>
            <input
              v-model="draftStart"
              type="date"
              class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-neutral-700"
            />
          </div>

          <div>
            <label class="text-xs text-neutral-500 block mb-1">Fim</label>
            <input
              v-model="draftEnd"
              type="date"
              :min="draftStart || undefined"
              class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-neutral-700"
            />
          </div>

          <div v-if="draftStart && draftEnd" class="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div class="h-full rounded-full bg-primary-400" :style="{ width: progressWidth }" />
          </div>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="flex-1 text-xs py-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors"
              @mousedown.prevent="clear"
            >
              Limpar
            </button>
            <button
              type="button"
              class="flex-1 text-xs py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
              @mousedown.prevent="save"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  taskId: string
  startDate: string | null
  endDate: string | null
}>()

const emit = defineEmits<{
  (e: 'update:startDate', v: string | null): void
  (e: 'update:endDate', v: string | null): void
}>()

const supabase = useNuxtApp().$supabase as any
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const popoverStyle = ref<Record<string, string>>({})
const draftStart = ref(props.startDate ?? '')
const draftEnd = ref(props.endDate ?? '')

function calcPosition() {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const popoverW = 288 // w-72
  const popoverH = 260

  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow > popoverH ? rect.bottom + 4 : rect.top - popoverH - 4

  let left = rect.left
  if (left + popoverW > window.innerWidth - 8) {
    left = window.innerWidth - popoverW - 8
  }
  left = Math.max(8, left)

  popoverStyle.value = { top: `${top}px`, left: `${left}px` }
}

function toggleOpen() {
  draftStart.value = props.startDate ?? ''
  draftEnd.value = props.endDate ?? ''
  calcPosition()
  open.value = !open.value
}

function fmt(d: string | null): string {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

const displayLabel = computed(() => {
  if (props.startDate && props.endDate) return `${fmt(props.startDate)} → ${fmt(props.endDate)}`
  if (props.startDate) return `De ${fmt(props.startDate)}`
  if (props.endDate) return `Até ${fmt(props.endDate)}`
  return ''
})

const tooltip = computed(() => {
  if (props.startDate && props.endDate)
    return `Início: ${props.startDate}  |  Fim: ${props.endDate}`
  return 'Definir cronograma'
})

const progressWidth = computed(() => {
  if (!draftStart.value || !draftEnd.value) return '0%'
  const start = new Date(draftStart.value).getTime()
  const end = new Date(draftEnd.value).getTime()
  const now = Date.now()
  if (end <= start) return '100%'
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
  return `${pct.toFixed(0)}%`
})

async function save() {
  open.value = false
  const s = draftStart.value || null
  const e = draftEnd.value || null
  try {
    await supabase.from('tasks').update({ start_date: s, due_date: e }).eq('id', props.taskId)
    emit('update:startDate', s)
    emit('update:endDate', e)
  } catch { /* silently fail */ }
}

async function clear() {
  draftStart.value = ''
  draftEnd.value = ''
  open.value = false
  try {
    await supabase.from('tasks').update({ start_date: null, due_date: null }).eq('id', props.taskId)
    emit('update:startDate', null)
    emit('update:endDate', null)
  } catch { /* silently fail */ }
}

function onClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
