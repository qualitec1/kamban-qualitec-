<template>
  <BaseModal v-model="isOpen" size="sm">
    <template #title>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-neutral-900">Configurar Lembrete</h3>
          <p class="text-sm text-neutral-600">{{ taskTitle }}</p>
        </div>
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Ativar/Desativar -->
      <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
        <div class="flex-1">
          <h4 class="font-medium text-neutral-900">Ativar lembrete</h4>
          <p class="text-sm text-neutral-600 mt-0.5">Receba um email antes do prazo</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            v-model="config.enabled"
            class="sr-only peer"
          />
          <div class="w-14 h-7 bg-neutral-300 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
          <div class="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-7 shadow-sm"></div>
        </label>
      </div>

      <template v-if="config.enabled">
        <!-- Dias antes -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">Avisar com antecedência</label>
          <select 
            v-model.number="config.daysBefore"
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option :value="0">No dia do prazo</option>
            <option :value="1">1 dia antes</option>
            <option :value="2">2 dias antes</option>
            <option :value="3">3 dias antes</option>
            <option :value="7">1 semana antes</option>
          </select>
        </div>

        <!-- Horário -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">Horário do lembrete</label>
          <input 
            type="time" 
            v-model="config.reminderTime"
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          <p class="mt-1.5 text-xs text-neutral-500">Horário em que você receberá o email</p>
        </div>

        <!-- Preview -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div class="flex gap-3">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-sm text-blue-900">
              <p class="font-medium mb-1">Resumo</p>
              <p class="text-blue-700">
                Você receberá um email <strong>{{ daysBeforeText }}</strong> às <strong>{{ config.reminderTime }}</strong>
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          @click="isOpen = false"
          :disabled="saving"
          class="px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          @click="handleSave"
          :disabled="saving"
          class="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'

const props = defineProps<{
  show: boolean
  taskId: string
  taskTitle: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { user } = useAuth()
const loading = ref(true)
const saving = ref(false)

// v-model local para o BaseModal
const isOpen = computed({
  get: () => props.show,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

const config = ref({
  enabled: false,
  reminderTime: '09:00',
  daysBefore: 1
})

console.log('[TaskReminderModal] Componente criado para task:', props.taskId)

// Watch para debug
watch(() => props.show, (newVal) => {
  console.log('[TaskReminderModal] prop show mudou para:', newVal)
  if (newVal) {
    console.log('[TaskReminderModal] Modal deve estar visível agora')
    loadConfig()
  }
})

const daysBeforeText = computed(() => {
  const days = config.value.daysBefore
  if (days === 0) return 'no dia do prazo'
  if (days === 1) return '1 dia antes do prazo'
  if (days === 7) return '1 semana antes do prazo'
  return `${days} dias antes do prazo`
})

onMounted(async () => {
  console.log('[TaskReminderModal] onMounted - carregando configuração')
  await loadConfig()
  loading.value = false
})

async function loadConfig() {
  if (!user.value) {
    console.log('[TaskReminderModal] loadConfig - usuário não autenticado')
    return
  }

  try {
    console.log('[TaskReminderModal] loadConfig - buscando configuração existente')
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any

    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('task_id', props.taskId)
      .eq('user_id', user.value.id)
      .maybeSingle()

    if (error) {
      console.error('[TaskReminderModal] loadConfig - erro:', error)
      return
    }

    console.log('[TaskReminderModal] loadConfig - resultado:', data)

    if (data) {
      config.value = {
        enabled: data.enabled,
        reminderTime: data.reminder_time.substring(0, 5), // HH:MM
        daysBefore: data.days_before
      }
    }
  } catch (err) {
    console.error('[TaskReminderModal] loadConfig - exceção:', err)
  }
}

async function handleSave() {
  if (!user.value) {
    console.log('[TaskReminderModal] handleSave - usuário não autenticado')
    alert('Você precisa estar logado')
    return
  }

  saving.value = true
  console.log('[TaskReminderModal] handleSave - salvando configuração:', config.value)

  try {
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any

    if (!config.value.enabled) {
      // Deletar lembrete
      console.log('[TaskReminderModal] handleSave - deletando lembrete')
      const { error } = await supabase
        .from('task_reminders')
        .delete()
        .eq('task_id', props.taskId)
        .eq('user_id', user.value.id)

      if (error) {
        console.error('[TaskReminderModal] handleSave - erro ao deletar:', error)
        throw error
      }
    } else {
      // Salvar/atualizar lembrete
      console.log('[TaskReminderModal] handleSave - salvando lembrete')
      const { error } = await supabase
        .from('task_reminders')
        .upsert({
          task_id: props.taskId,
          user_id: user.value.id,
          enabled: config.value.enabled,
          reminder_time: config.value.reminderTime + ':00',
          days_before: config.value.daysBefore
        }, {
          onConflict: 'task_id,user_id'
        })

      if (error) {
        console.error('[TaskReminderModal] handleSave - erro ao salvar:', error)
        throw error
      }
    }

    console.log('[TaskReminderModal] handleSave - sucesso!')
    emit('saved')
    isOpen.value = false
  } catch (err: any) {
    console.error('[TaskReminderModal] handleSave - exceção:', err)
    alert('Erro ao salvar: ' + (err.message || 'Tente novamente'))
  } finally {
    saving.value = false
  }
}
</script>
