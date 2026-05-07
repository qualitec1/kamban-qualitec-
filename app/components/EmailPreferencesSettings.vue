<template>
  <div class="max-w-4xl mx-auto space-y-6">
    
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p class="mt-4 text-sm text-neutral-600">Carregando preferências...</p>
    </div>

    <template v-else-if="preferences">
      
      <!-- Card Informativo Superior -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-neutral-700 leading-relaxed">Receba um email com resumo das suas tarefas pendentes</p>
          </div>
        </div>
      </div>

      <!-- Notificações de Tarefas -->
      <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-neutral-900">Notificações de Tarefas</h3>
          <p class="mt-1 text-sm text-neutral-600">Escolha quais eventos de tarefas devem gerar notificações por email</p>
        </div>
        
        <div class="space-y-5">
          <label class="flex items-start gap-4 cursor-pointer group">
            <div class="relative flex items-center">
              <input 
                type="checkbox" 
                v-model="preferences.task_assigned_enabled"
                @change="savePreferences"
                class="peer sr-only"
              />
              <div class="w-11 h-6 bg-neutral-200 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
              <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
            </div>
            <div class="flex-1">
              <div class="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">Tarefa atribuída a mim</div>
              <p class="mt-0.5 text-sm text-neutral-600">Receba um email quando uma tarefa for atribuída a você com todas as informações</p>
            </div>
          </label>

          <label class="flex items-start gap-4 cursor-pointer group">
            <div class="relative flex items-center">
              <input 
                type="checkbox" 
                v-model="preferences.task_updated_enabled"
                @change="savePreferences"
                class="peer sr-only"
              />
              <div class="w-11 h-6 bg-neutral-200 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
              <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
            </div>
            <div class="flex-1">
              <div class="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">Atualizações em tarefas que participo</div>
              <p class="mt-0.5 text-sm text-neutral-600">Notificações quando houver mudanças em tarefas onde você é responsável</p>
            </div>
          </label>

          <label class="flex items-start gap-4 cursor-pointer group">
            <div class="relative flex items-center">
              <input 
                type="checkbox" 
                v-model="preferences.task_due_soon_enabled"
                @change="savePreferences"
                class="peer sr-only"
              />
              <div class="w-11 h-6 bg-neutral-200 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
              <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
            </div>
            <div class="flex-1">
              <div class="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">Tarefas próximas do vencimento</div>
              <p class="mt-0.5 text-sm text-neutral-600">Alertas quando suas tarefas estiverem próximas da data de vencimento</p>
            </div>
          </label>

          <label class="flex items-start gap-4 cursor-pointer group">
            <div class="relative flex items-center">
              <input 
                type="checkbox" 
                v-model="preferences.task_completed_enabled"
                @change="savePreferences"
                class="peer sr-only"
              />
              <div class="w-11 h-6 bg-neutral-200 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
              <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
            </div>
            <div class="flex-1">
              <div class="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">Tarefas concluídas</div>
              <p class="mt-0.5 text-sm text-neutral-600">Notificações quando tarefas que você criou forem concluídas</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Resumos Periódicos -->
      <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-neutral-900">Resumos Periódicos (Digest)</h3>
          <p class="mt-1 text-sm text-neutral-600">Receba um resumo consolidado das suas tarefas</p>
        </div>
        
        <label class="flex items-start gap-4 cursor-pointer group mb-6">
          <div class="relative flex items-center">
            <input 
              type="checkbox" 
              v-model="preferences.digest_enabled"
              @change="savePreferences"
              class="peer sr-only"
            />
            <div class="w-11 h-6 bg-neutral-200 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
          </div>
          <div class="flex-1">
            <div class="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">Ativar resumos periódicos</div>
            <p class="mt-0.5 text-sm text-neutral-600">Receba um email com resumo das suas tarefas pendentes</p>
          </div>
        </label>

        <div v-if="preferences.digest_enabled" class="space-y-4 pl-15 border-l-2 border-neutral-200">
          <div class="pl-4">
            <label class="block text-sm font-medium text-neutral-700 mb-2">Frequência</label>
            <select 
              v-model="preferences.digest_frequency" 
              @change="savePreferences"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="never">Nunca</option>
            </select>
          </div>

          <div v-if="preferences.digest_frequency === 'daily'" class="pl-4">
            <label class="block text-sm font-medium text-neutral-700 mb-2">Horário do envio</label>
            <input 
              type="time" 
              v-model="preferences.digest_time"
              @change="savePreferences"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p class="mt-1.5 text-xs text-neutral-500">Horário em que o resumo diário será enviado</p>
          </div>

          <div v-if="preferences.digest_frequency === 'weekly'" class="pl-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Dia da semana</label>
              <select 
                v-model.number="preferences.digest_day_of_week" 
                @change="savePreferences"
                class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option :value="0">Domingo</option>
                <option :value="1">Segunda-feira</option>
                <option :value="2">Terça-feira</option>
                <option :value="3">Quarta-feira</option>
                <option :value="4">Quinta-feira</option>
                <option :value="5">Sexta-feira</option>
                <option :value="6">Sábado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Horário</label>
              <input 
                type="time" 
                v-model="preferences.digest_time"
                @change="savePreferences"
                class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Limites de Email -->
      <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div class="flex items-start gap-3 mb-6">
          <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-neutral-900">Limites de Email</h3>
            <p class="mt-1 text-sm text-neutral-600">Controle a quantidade máxima de emails que você pode receber</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Máximo de emails por hora</label>
            <input 
              type="number" 
              v-model.number="preferences.max_emails_per_hour"
              @change="savePreferences"
              min="1"
              max="100"
              class="w-full px-4 py-3 text-lg border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p class="mt-1.5 text-xs text-neutral-500">Limite: 1-100 emails por hora</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Máximo de emails por dia</label>
            <input 
              type="number" 
              v-model.number="preferences.max_emails_per_day"
              @change="savePreferences"
              min="1"
              max="500"
              class="w-full px-4 py-3 text-lg border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p class="mt-1.5 text-xs text-neutral-500">Limite: 1-500 emails por dia</p>
          </div>
        </div>
      </div>

      <!-- Estatísticas de Emails -->
      <div v-if="stats" class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-neutral-900">Estatísticas de Emails</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex flex-col items-center text-center">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-4xl font-bold text-neutral-900 mb-2">{{ stats.emailsLastHour }}</div>
              <div class="text-sm font-medium text-neutral-700 mb-1">Última hora</div>
              <div class="text-xs text-neutral-500">Limite: {{ preferences.max_emails_per_hour }}</div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex flex-col items-center text-center">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="text-4xl font-bold text-neutral-900 mb-2">{{ stats.emailsLastDay }}</div>
              <div class="text-sm font-medium text-neutral-700 mb-1">Últimas 24 horas</div>
              <div class="text-xs text-neutral-500">Limite: {{ preferences.max_emails_per_day }}</div>
            </div>
          </div>
        </div>

        <div v-if="stats.recentEmails && stats.recentEmails.length > 0" class="mt-6 pt-6 border-t border-blue-200">
          <h4 class="text-sm font-semibold text-neutral-900 mb-3">Emails recentes</h4>
          <div class="space-y-2">
            <div 
              v-for="email in stats.recentEmails" 
              :key="email.id"
              class="flex items-center justify-between bg-white rounded-lg px-4 py-3 text-sm"
            >
              <span class="font-medium text-neutral-700">{{ formatEmailType(email.email_type) }}</span>
              <span class="text-neutral-500">{{ formatTime(email.sent_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensagem de Sucesso -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-success-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="font-medium">Preferências salvas com sucesso!</span>
        </div>
      </Transition>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { getEmailPreferences, updateEmailPreferences, getEmailStats } = useEmailNotifications()

const loading = ref(true)
const preferences = ref<any>(null)
const stats = ref<any>(null)
const showSuccess = ref(false)

onMounted(async () => {
  await loadPreferences()
  await loadStats()
  loading.value = false
})

async function loadPreferences() {
  preferences.value = await getEmailPreferences()
  
  if (!preferences.value) {
    preferences.value = {
      task_assigned_enabled: true,
      task_updated_enabled: true,
      task_due_soon_enabled: true,
      task_completed_enabled: false,
      digest_enabled: false,
      digest_frequency: 'daily',
      digest_time: '09:00:00',
      digest_day_of_week: 1,
      max_emails_per_hour: 10,
      max_emails_per_day: 50
    }
  }
}

async function loadStats() {
  stats.value = await getEmailStats()
}

async function savePreferences() {
  const success = await updateEmailPreferences(preferences.value)
  
  if (success) {
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  }
}

function formatEmailType(type: string): string {
  const types: Record<string, string> = {
    'task_assigned': 'Tarefa atribuída',
    'task_updated': 'Tarefa atualizada',
    'task_due_soon': 'Vencimento próximo',
    'task_completed': 'Tarefa concluída',
    'digest': 'Resumo periódico'
  }
  return types[type] || type
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}m atrás`
  if (hours < 24) return `${hours}h atrás`
  
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
