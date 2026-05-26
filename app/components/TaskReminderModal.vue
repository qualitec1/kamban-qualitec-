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
          <p class="text-sm text-neutral-600 truncate max-w-[200px]">{{ taskTitle }}</p>
        </div>
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-5">
      <!-- Ativar/Desativar -->
      <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
        <div class="flex-1">
          <h4 class="font-medium text-neutral-900">Ativar lembrete</h4>
          <p class="text-sm text-neutral-500 mt-0.5">Receba um email antes do prazo</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="config.enabled" class="sr-only peer" />
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
        </div>

        <!-- Notificar todos os responsáveis -->
        <div class="border border-neutral-200 rounded-xl overflow-hidden">
          <div class="flex items-start justify-between p-4">
            <div class="flex-1 pr-4">
              <h4 class="font-medium text-neutral-900 flex items-center gap-2">
                <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Notificar todos os responsáveis
              </h4>
              <p class="text-sm text-neutral-500 mt-1">
                Aplica este lembrete para todos os membros atribuídos a esta tarefa
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input type="checkbox" v-model="config.notifyAllAssignees" class="sr-only peer" />
              <div class="w-14 h-7 bg-neutral-300 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
              <div class="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-7 shadow-sm"></div>
            </label>
          </div>

          <!-- Lista de responsáveis (quando ativado) -->
          <div v-if="config.notifyAllAssignees && assignees.length > 0" class="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
            <p class="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Responsáveis que receberão o aviso</p>
            <div class="space-y-2">
              <div
                v-for="assignee in assignees"
                :key="assignee.id"
                class="flex items-center gap-2.5"
              >
                <!-- Avatar -->
                <div
                  v-if="assignee.avatar_url"
                  class="w-7 h-7 rounded-full bg-cover bg-center border border-white shadow-sm shrink-0"
                  :style="{ backgroundImage: `url(${assignee.avatar_url})` }"
                ></div>
                <div
                  v-else
                  class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold shrink-0"
                >
                  {{ getInitials(assignee.full_name) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-neutral-800 truncate">{{ assignee.full_name }}</p>
                  <p class="text-xs text-neutral-400 truncate">{{ assignee.email }}</p>
                </div>
                <!-- Badge "você" -->
                <span v-if="assignee.id === currentUserId" class="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full shrink-0">você</span>
              </div>
            </div>
          </div>

          <!-- Sem responsáveis -->
          <div v-else-if="config.notifyAllAssignees && assignees.length === 0" class="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
            <p class="text-sm text-neutral-400 text-center">Nenhum responsável atribuído a esta tarefa</p>
          </div>
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
                <template v-if="config.notifyAllAssignees && assignees.length > 1">
                  <strong>{{ assignees.length }} responsáveis</strong> receberão um email <strong>{{ daysBeforeText }}</strong> às <strong>{{ config.reminderTime }}</strong>
                </template>
                <template v-else>
                  Você receberá um email <strong>{{ daysBeforeText }}</strong> às <strong>{{ config.reminderTime }}</strong>
                </template>
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

const currentUserId = computed(() => user.value?.id ?? '')

const isOpen = computed({
  get: () => props.show,
  set: (value) => { if (!value) emit('close') }
})

const config = ref({
  enabled: false,
  reminderTime: '09:00',
  daysBefore: 1,
  notifyAllAssignees: false
})

// Lista de responsáveis da tarefa
interface Assignee {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}
const assignees = ref<Assignee[]>([])

const daysBeforeText = computed(() => {
  const d = config.value.daysBefore
  if (d === 0) return 'no dia do prazo'
  if (d === 1) return '1 dia antes do prazo'
  if (d === 7) return '1 semana antes do prazo'
  return `${d} dias antes do prazo`
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadConfig()
    loadAssignees()
  }
})

onMounted(async () => {
  await Promise.all([loadConfig(), loadAssignees()])
  loading.value = false
})

async function loadAssignees() {
  try {
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any

    const { data, error } = await supabase
      .from('task_assignees')
      .select('profiles:user_id(id, full_name, email, avatar_url)')
      .eq('task_id', props.taskId)

    if (error) throw error

    assignees.value = (data ?? [])
      .map((row: any) => row.profiles)
      .filter(Boolean) as Assignee[]
  } catch (err) {
    console.error('[TaskReminderModal] loadAssignees error:', err)
    assignees.value = []
  }
}

async function loadConfig() {
  if (!user.value) return

  try {
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any

    const { data, error } = await supabase
      .from('task_reminders')
      .select('*')
      .eq('task_id', props.taskId)
      .eq('user_id', user.value.id)
      .maybeSingle()

    if (error) throw error

    if (data) {
      config.value = {
        enabled: data.enabled,
        reminderTime: data.reminder_time.substring(0, 5),
        daysBefore: data.days_before,
        notifyAllAssignees: data.notify_all_assignees ?? false
      }
    }
  } catch (err) {
    console.error('[TaskReminderModal] loadConfig error:', err)
  }
}

async function handleSave() {
  if (!user.value) { alert('Você precisa estar logado'); return }

  saving.value = true

  try {
    const { $supabase } = useNuxtApp()
    const supabase = $supabase as any

    if (!config.value.enabled) {
      // Desativar: remove apenas o lembrete do usuário atual
      const { error } = await supabase
        .from('task_reminders')
        .delete()
        .eq('task_id', props.taskId)
        .eq('user_id', user.value.id)

      if (error) throw error
    } else {
      // Usar RPC com SECURITY DEFINER para criar lembretes para outros responsáveis
      const { error } = await supabase.rpc('upsert_reminders_for_assignees', {
        p_task_id:       props.taskId,
        p_days_before:   config.value.daysBefore,
        p_reminder_time: config.value.reminderTime + ':00',
        p_notify_all:    config.value.notifyAllAssignees
      })

      if (error) throw error
    }

    emit('saved')
    isOpen.value = false
  } catch (err: any) {
    console.error('[TaskReminderModal] handleSave error:', err)
    alert('Erro ao salvar: ' + (err.message || 'Tente novamente'))
  } finally {
    saving.value = false
  }
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
</script>
