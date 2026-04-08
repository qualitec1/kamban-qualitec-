<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h4 class="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
        Histórico de Alterações
      </h4>
      <button
        v-if="!loading && activities.length > 0"
        @click="fetchActivities"
        class="text-xs text-primary-600 hover:text-primary-700 font-medium"
        title="Atualizar"
      >
        Atualizar
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="w-5 h-5 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
    </div>

    <!-- Timeline de atividades -->
    <div v-else-if="activities.length > 0" class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex gap-3 pb-3 border-b border-neutral-100 last:border-0"
      >
        <!-- Avatar do usuário -->
        <div class="shrink-0">
          <Avatar
            v-if="activity.actor"
            :profile="{
              id: activity.actor.id,
              full_name: activity.actor.full_name,
              email: activity.actor.email,
              avatar_url: activity.actor.avatar_url
            }"
            size="sm"
          />
          <div v-else class="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
            <svg class="w-3 h-3 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>

        <!-- Conteúdo -->
        <div class="flex-1 min-w-0">
          <p class="text-sm text-neutral-800">
            {{ formatActivityMessage(activity) }}
          </p>
          <p class="text-xs text-neutral-400 mt-1">
            {{ formatRelativeTime(activity.created_at) }}
          </p>

          <!-- Detalhes extras para algumas ações -->
          <div v-if="getActivityDetails(activity)" class="mt-2 text-xs bg-neutral-50 rounded px-2 py-1.5 text-neutral-600">
            {{ getActivityDetails(activity) }}
          </div>
        </div>

        <!-- Ícone da ação -->
        <div class="shrink-0">
          <div 
            class="w-7 h-7 rounded-full flex items-center justify-center"
            :class="getActionColor(activity.action)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path v-if="activity.action.includes('created')" stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              <path v-else-if="activity.action.includes('deleted')" stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              <path v-else-if="activity.action.includes('archived')" stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-8 text-center">
      <svg class="w-10 h-10 text-neutral-300 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-sm text-neutral-500">Nenhuma atividade registrada</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskActivity } from '~/composables/useTaskActivity'

const props = defineProps<{
  taskId: string
}>()

const { 
  activities, 
  loading, 
  fetchActivities, 
  formatActivityMessage, 
  formatRelativeTime 
} = useTaskActivity(props.taskId)

function getActionColor(action: string): string {
  if (action.includes('created')) return 'bg-green-100 text-green-600'
  if (action.includes('deleted')) return 'bg-red-100 text-red-600'
  if (action.includes('archived')) return 'bg-orange-100 text-orange-600'
  return 'bg-blue-100 text-blue-600'
}

function getActivityDetails(activity: any): string | null {
  const meta = activity.meta_json as any
  
  if (activity.action === 'task_due_date_changed' && meta.old_value && meta.new_value) {
    return `De ${new Date(meta.old_value).toLocaleDateString('pt-BR')} para ${new Date(meta.new_value).toLocaleDateString('pt-BR')}`
  }
  
  if (activity.action === 'task_start_date_changed' && meta.old_value && meta.new_value) {
    return `De ${new Date(meta.old_value).toLocaleDateString('pt-BR')} para ${new Date(meta.new_value).toLocaleDateString('pt-BR')}`
  }
  
  return null
}

onMounted(() => {
  fetchActivities()
})
</script>
