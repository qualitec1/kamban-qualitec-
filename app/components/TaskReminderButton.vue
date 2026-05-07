<template>
  <div class="relative">
    <button
      @click.stop="openModal"
      :title="hasReminder ? 'Lembrete ativo - clique para configurar' : 'Configurar lembrete'"
      :class="[
        'p-1.5 rounded-md transition-all',
        hasReminder 
          ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' 
          : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
      ]"
    >
      <svg 
        class="w-4 h-4" 
        :fill="hasReminder ? 'currentColor' : 'none'" 
        stroke="currentColor" 
        stroke-width="2" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </button>

    <!-- Modal com Teleport -->
    <Teleport to="body">
      <TaskReminderModal
        v-if="showModal"
        :show="showModal"
        :task-id="taskId"
        :task-title="taskTitle"
        @close="closeModal"
        @saved="handleSaved"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'

const props = defineProps<{
  taskId: string
  taskTitle: string
}>()

const { user } = useAuth()
const hasReminder = ref(false)
const showModal = ref(false)

console.log('[TaskReminderButton] Componente montado para task:', props.taskId)

// Watch para debug
watch(showModal, (newVal) => {
  console.log('[TaskReminderButton] showModal mudou para:', newVal)
})

onMounted(async () => {
  console.log('[TaskReminderButton] onMounted - taskId:', props.taskId, 'user:', user.value?.id)
  await checkReminder()
})

async function checkReminder() {
  if (!user.value) {
    console.log('[TaskReminderButton] checkReminder - usuário não autenticado')
    return
  }

  try {
    console.log('[TaskReminderButton] checkReminder - iniciando busca')
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any

    const { data, error } = await supabase
      .from('task_reminders')
      .select('enabled')
      .eq('task_id', props.taskId)
      .eq('user_id', user.value.id)
      .maybeSingle()

    if (error) {
      console.error('[TaskReminderButton] checkReminder - erro:', error)
      return
    }

    console.log('[TaskReminderButton] checkReminder - resultado:', data)
    hasReminder.value = data?.enabled ?? false
  } catch (err) {
    console.error('[TaskReminderButton] checkReminder - exceção:', err)
  }
}

function openModal(event: Event) {
  console.log('[TaskReminderButton] openModal - evento:', event)
  console.log('[TaskReminderButton] openModal - showModal antes:', showModal.value)
  showModal.value = true
  console.log('[TaskReminderButton] openModal - showModal depois:', showModal.value)
}

function closeModal() {
  console.log('[TaskReminderButton] closeModal - fechando modal')
  showModal.value = false
}

async function handleSaved() {
  console.log('[TaskReminderButton] handleSaved - lembrete salvo, atualizando status')
  await checkReminder()
}
</script>
