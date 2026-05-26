<template>
  <!-- Loading state -->
  <LoadingState v-if="isLoading" label="Carregando suas tarefas..." />

  <div v-else class="min-h-screen bg-neutral-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">Minhas Tarefas</h1>
        <p class="text-neutral-600">Tarefas criadas por você ou onde você é responsável</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">

        <!-- Total -->
        <StatCard label="Total" :value="filteredTasks.length" icon-bg="bg-primary-100">
          <template #icon>
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </template>
        </StatCard>

        <!-- Orçamento Total -->
        <StatCard label="Orçamento Total" :value="formatCurrency(totalBudget)" value-color="text-green-600" value-size="text-lg sm:text-2xl" icon-bg="bg-green-100">
          <template #icon>
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </template>
        </StatCard>

        <!-- Críticas -->
        <StatCard label="Críticas" :value="criticalCount" value-color="text-red-600" icon-bg="bg-red-100">
          <template #icon>
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </template>
        </StatCard>

        <!-- Prioridade Alta -->
        <StatCard label="Prioridade Alta" :value="highPriorityCount" value-color="text-orange-600" icon-bg="bg-orange-100">
          <template #icon>
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </template>
        </StatCard>

        <!-- Vencendo Hoje -->
        <StatCard label="Vencendo Hoje" :value="dueTodayCount" value-color="text-orange-600" icon-bg="bg-orange-100">
          <template #icon>
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </template>
        </StatCard>

        <!-- Atrasadas -->
        <StatCard label="Atrasadas" :value="overdueCount" value-color="text-red-600" icon-bg="bg-red-100">
          <template #icon>
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </template>
        </StatCard>

        <!-- Próxima a Vencer -->
        <StatCard label="Próxima a Vencer" layout="vertical">
          <div v-if="nextDueTask" class="flex items-center gap-2">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-base sm:text-lg font-bold text-blue-600 truncate group-hover:whitespace-nowrap">{{ formatDate(nextDueTask.due_date!) }}</p>
              <p class="text-xs text-neutral-500 truncate group-hover:whitespace-nowrap">{{ nextDueTask.title }}</p>
            </div>
          </div>
          <div v-else class="flex items-center gap-2">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-base sm:text-lg font-medium text-neutral-400 truncate group-hover:whitespace-nowrap">Sem prazo</p>
              <p class="text-xs text-neutral-400 truncate group-hover:whitespace-nowrap">Nenhuma tarefa com data</p>
            </div>
          </div>
        </StatCard>

      </div>

      <!-- Tasks Table -->
      <div class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <!-- Table Header com Filtros -->
        <div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-neutral-900">Todas as Tarefas</h2>
            <button
              v-if="hasActiveFilters"
              type="button"
              class="text-sm text-[#1C325C] hover:text-[#152847] font-medium"
              @click="clearFilters"
            >
              Limpar todos os filtros
            </button>
          </div>
          
          <!-- Filtros -->
          <div class="flex flex-wrap gap-2">
            <MyTasksFilter
              column-key="board"
              column-label="Filtrar por board"
              :options="boardOptions"
            />
            <MyTasksFilter
              column-key="status"
              column-label="Filtrar por status"
              :options="statusOptions"
            />
            <MyTasksFilter
              column-key="priority"
              column-label="Filtrar por prioridade"
              :options="priorityOptions"
            />
            <MyTasksFilter
              column-key="timeline"
              column-label="Filtrar por vencimento"
              :options="timelineOptions"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredTasks.length === 0 && !hasActiveFilters" class="px-6 py-12 text-center">
          <svg class="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-neutral-500 text-lg mb-2">Nenhuma tarefa encontrada</p>
          <p class="text-neutral-400 text-sm">Você não tem tarefas criadas ou atribuídas</p>
        </div>

        <!-- Empty State com Filtros -->
        <div v-else-if="filteredTasks.length === 0 && hasActiveFilters" class="px-6 py-12 text-center">
          <svg class="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <p class="text-neutral-500 text-lg mb-2">Nenhuma tarefa encontrada com os filtros aplicados</p>
          <button
            type="button"
            class="text-sm text-[#1C325C] hover:text-[#152847] font-medium"
            @click="clearFilters"
          >
            Limpar filtros
          </button>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tarefa</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Board</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Prioridade</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Vencimento</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-neutral-200">
              <tr v-for="task in filteredTasks" :key="task.id" class="hover:bg-neutral-50 transition-colors">
                <!-- Tarefa -->
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div>
                      <p class="text-sm font-medium text-neutral-900">{{ task.title }}</p>
                      <p v-if="task.description" class="text-xs text-neutral-500 mt-1 line-clamp-1">{{ task.description }}</p>
                    </div>
                  </div>
                </td>

                <!-- Board -->
                <td class="px-6 py-4">
                  <NuxtLink 
                    :to="`/boards/${task.board_id}`"
                    class="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {{ task.board?.name || 'Board' }}
                  </NuxtLink>
                </td>

                <!-- Status -->
                <td class="px-6 py-4">
                  <span 
                    v-if="task.status"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: task.status.color }"
                  >
                    {{ task.status.name }}
                  </span>
                  <span v-else class="text-xs text-neutral-400 italic">Sem status</span>
                </td>

                <!-- Prioridade -->
                <td class="px-6 py-4">
                  <span 
                    v-if="task.priority"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: task.priority.color }"
                  >
                    {{ task.priority.name }}
                  </span>
                  <span v-else class="text-xs text-neutral-400 italic">Sem prioridade</span>
                </td>

                <!-- Vencimento -->
                <td class="px-6 py-4">
                  <div v-if="task.due_date" class="flex items-center gap-2">
                    <span 
                      class="text-sm"
                      :class="{
                        'text-red-600 font-medium': isOverdue(task.due_date),
                        'text-orange-600 font-medium': isDueToday(task.due_date),
                        'text-neutral-600': !isOverdue(task.due_date) && !isDueToday(task.due_date)
                      }"
                    >
                      {{ formatDate(task.due_date) }}
                    </span>
                    <span 
                      v-if="isOverdue(task.due_date)"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                    >
                      Atrasada
                    </span>
                    <span 
                      v-else-if="isDueToday(task.due_date)"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      Hoje
                    </span>
                  </div>
                  <span v-else class="text-xs text-neutral-400 italic">Sem prazo</span>
                </td>

                <!-- Ações -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <!-- Ver Tarefa (abre modal completo) -->
                    <button
                      type="button"
                      class="inline-flex items-center px-3 py-1.5 border border-[#1C325C] rounded-lg text-xs font-medium text-[#1C325C] bg-white hover:bg-[#1C325C] hover:text-white transition-colors"
                      @click="openTaskModal(task)"
                    >
                      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Ver Tarefa
                    </button>
                    <!-- Ver no Board -->
                    <NuxtLink 
                      :to="`/boards/${task.board_id}`"
                      class="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Board
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal completo da tarefa -->
  <TaskModal
    v-if="selectedTask"
    v-model="showTaskModal"
    :task-id="selectedTask.id"
    :board-id="selectedTask.board_id"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useMyTasks } from '~/composables/useMyTasks'
import { useMyTasksFilters } from '~/composables/useMyTasksFilters'

definePageMeta({ layout: 'default' })

const { user } = useAuth()
const { tasks, loading: isLoading, fetchMyTasks } = useMyTasks()
const { filterTasks, hasActiveFilters, clearFilters } = useMyTasksFilters()

// Modal de tarefa
const showTaskModal = ref(false)
const selectedTask = ref<{ id: string; board_id: string } | null>(null)

function openTaskModal(task: { id: string; board_id: string }) {
  selectedTask.value = task
  showTaskModal.value = true
}

// Tarefas filtradas
const filteredTasks = computed(() => filterTasks(tasks.value))

// Opções de filtro
const boardOptions = computed(() => {
  const boards = new Map<string, string>()
  tasks.value.forEach(task => {
    if (task.board_id && task.board?.name) {
      boards.set(task.board_id, task.board.name)
    }
  })
  return Array.from(boards.entries()).map(([id, name]) => ({
    value: id,
    label: name
  })).sort((a, b) => a.label.localeCompare(b.label))
})

const statusOptions = computed(() => {
  const statuses = new Map<string, { name: string; color: string }>()
  tasks.value.forEach(task => {
    if (task.status_id && task.status) {
      statuses.set(task.status_id, { name: task.status.name, color: task.status.color })
    }
  })
  const options = Array.from(statuses.entries()).map(([id, status]) => ({
    value: id,
    label: status.name
  }))
  // Adicionar "Sem status" no início
  options.unshift({ value: 'no-status', label: 'Sem status' })
  return options
})

const priorityOptions = computed(() => {
  const priorities = new Map<string, { name: string; color: string }>()
  tasks.value.forEach(task => {
    if (task.priority_id && task.priority) {
      priorities.set(task.priority_id, { name: task.priority.name, color: task.priority.color })
    }
  })
  const options = Array.from(priorities.entries()).map(([id, priority]) => ({
    value: id,
    label: priority.name
  }))
  // Adicionar "Sem prioridade" no início
  options.unshift({ value: 'no-priority', label: 'Sem prioridade' })
  return options
})

const timelineOptions = [
  { value: 'no-date', label: 'Sem prazo' },
  { value: 'overdue', label: 'Atrasado' },
  { value: 'today', label: 'Hoje' },
  { value: 'next-7-days', label: 'Próximos 7 dias' },
  { value: 'next-30-days', label: 'Próximos 30 dias' }
]

// Computed stats (baseado em tarefas filtradas)
const totalBudget = computed(() => {
  return filteredTasks.value.reduce((sum, task) => {
    return sum + (task.budget || 0)
  }, 0)
})

const criticalCount = computed(() => {
  return filteredTasks.value.filter(t => 
    t.priority?.name?.toLowerCase().includes('crítica') || 
    t.priority?.name?.toLowerCase().includes('critica')
  ).length
})

const highPriorityCount = computed(() => {
  return filteredTasks.value.filter(t => 
    t.priority?.name?.toLowerCase().includes('alta') ||
    t.priority?.name?.toLowerCase().includes('high')
  ).length
})

const dueTodayCount = computed(() => {
  return filteredTasks.value.filter(t => t.due_date && isDueToday(t.due_date)).length
})

const overdueCount = computed(() => {
  return filteredTasks.value.filter(t => t.due_date && isOverdue(t.due_date)).length
})

// Próxima tarefa a vencer (não atrasada)
const nextDueTask = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Filtrar tarefas com data de vencimento (incluindo hoje e futuras)
  const tasksWithDueDate = filteredTasks.value.filter(t => {
    if (!t.due_date) return false
    
    const [year, month, day] = t.due_date.split('-').map(Number)
    const dueDate = new Date(year, month - 1, day)
    dueDate.setHours(0, 0, 0, 0)
    
    // Incluir tarefas de hoje e futuras (não atrasadas)
    return dueDate >= today
  })
  
  if (tasksWithDueDate.length === 0) return null
  
  // Ordenar por data de vencimento (mais próxima primeiro)
  tasksWithDueDate.sort((a, b) => {
    const [yearA, monthA, dayA] = a.due_date!.split('-').map(Number)
    const dateA = new Date(yearA, monthA - 1, dayA)
    dateA.setHours(0, 0, 0, 0)
    
    const [yearB, monthB, dayB] = b.due_date!.split('-').map(Number)
    const dateB = new Date(yearB, monthB - 1, dayB)
    dateB.setHours(0, 0, 0, 0)
    
    return dateA.getTime() - dateB.getTime()
  })
  
  return tasksWithDueDate[0]
})

// Helper functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function formatDate(dateStr: string): string {
  // Parse date as YYYY-MM-DD (local date, not UTC)
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
}

function isOverdue(dateStr: string): boolean {
  // Parse both dates as local dates (not UTC)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [year, month, day] = dateStr.split('-').map(Number)
  const dueDate = new Date(year, month - 1, day) // month is 0-indexed
  dueDate.setHours(0, 0, 0, 0)
  
  return dueDate < today
}

function isDueToday(dateStr: string): boolean {
  // Parse both dates as local dates (not UTC)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [year, month, day] = dateStr.split('-').map(Number)
  const dueDate = new Date(year, month - 1, day) // month is 0-indexed
  dueDate.setHours(0, 0, 0, 0)
  
  return dueDate.getTime() === today.getTime()
}

onMounted(async () => {
  if (user.value) {
    try {
      await Promise.race([
        fetchMyTasks(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao carregar tarefas')), 10000)
        )
      ])
      
      // Debug: verificar próxima tarefa
      console.log('[MyTasks] Total tasks:', tasks.value.length)
      console.log('[MyTasks] Filtered tasks:', filteredTasks.value.length)
      console.log('[MyTasks] Next due task:', nextDueTask.value)
      
      // Debug: listar todas as tarefas com data
      const tasksWithDate = filteredTasks.value.filter(t => t.due_date)
      console.log('[MyTasks] Tasks with due date:', tasksWithDate.map(t => ({
        title: t.title,
        due_date: t.due_date
      })))
    } catch (error) {
      console.error('[MyTasks] Error loading tasks:', error)
      alert('Erro ao carregar tarefas. Recarregue a página.')
    }
  }
})
</script>
