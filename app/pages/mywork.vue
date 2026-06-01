<template>
  <div class="min-h-screen bg-neutral-50 p-6">
    <div class="max-w-7xl mx-auto">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">Meu Trabalho</h1>
        <p class="text-neutral-600">Tarefas que você concluiu</p>
      </div>

      <!-- Widgets Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        <!-- Task Status -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 class="font-semibold text-[18px] leading-snug text-neutral-900 mb-6" style="font-family: 'Plus Jakarta Sans', sans-serif;">
            Task Status
          </h3>
          <div v-if="widgetsLoading" class="flex items-center justify-center py-8">
            <div class="w-5 h-5 rounded-full border-2 border-[#4744e5] border-t-transparent animate-spin" />
          </div>
          <div v-else-if="statusData.length === 0" class="text-sm text-neutral-400 py-4 text-center">
            Nenhum dado disponível
          </div>
          <div v-else class="space-y-4">
            <div v-for="s in statusData" :key="s.name">
              <div class="flex justify-between mb-1" style="font-family: 'Inter', sans-serif; font-size: 13px; letter-spacing: 0.04em; font-weight: 600; line-height: 1.2;">
                <span :style="{ color: s.color }">{{ s.name }}</span>
                <span class="text-neutral-800">{{ statusPercent(s.count) }}%</span>
              </div>
              <div class="w-full bg-[#f0edef] h-2 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ width: statusPercent(s.count) + '%', backgroundColor: s.color }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Team Workload -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 class="font-semibold text-[18px] leading-snug text-neutral-900 mb-6" style="font-family: 'Plus Jakarta Sans', sans-serif;">
            Team Workload
          </h3>
          <div v-if="widgetsLoading" class="flex items-center justify-center py-8">
            <div class="w-5 h-5 rounded-full border-2 border-[#4744e5] border-t-transparent animate-spin" />
          </div>
          <div v-else-if="workloadData.length === 0" class="text-sm text-neutral-400 py-4 text-center">
            Nenhum membro encontrado
          </div>
          <div v-else class="space-y-4">
            <div v-for="m in workloadData" :key="m.userId" class="flex items-center gap-3">
              <!-- Avatar -->
              <img
                v-if="m.avatarUrl"
                :src="m.avatarUrl"
                :alt="m.name"
                class="w-8 h-8 rounded-full object-cover border border-neutral-200 shrink-0"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-[#e1dfff] text-[#4744e5] flex items-center justify-center text-[11px] font-bold shrink-0"
              >
                {{ initials(m.name) }}
              </div>
              <!-- Barra -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between mb-1" style="font-family: 'Inter', sans-serif; font-size: 13px; letter-spacing: 0.04em; font-weight: 600; line-height: 1.2;">
                  <span class="text-neutral-800 truncate">{{ m.name }}</span>
                  <span class="text-neutral-500 shrink-0 ml-2">{{ m.taskCount }} tasks</span>
                </div>
                <div class="w-full bg-[#f0edef] h-1.5 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full bg-[#4744e5] transition-all duration-500"
                    :style="{ width: workloadPercent(m.taskCount) + '%' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vence em Breve -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <h3 class="font-semibold text-[18px] leading-snug text-neutral-900 mb-6" style="font-family: 'Plus Jakarta Sans', sans-serif;">
            Vence em Breve
          </h3>
          <div v-if="widgetsLoading" class="flex items-center justify-center py-8">
            <div class="w-5 h-5 rounded-full border-2 border-[#4744e5] border-t-transparent animate-spin" />
          </div>
          <div v-else-if="upcomingTasks.length === 0" class="text-sm text-neutral-400 py-4 text-center">
            Nenhuma tarefa próxima
          </div>
          <div v-else class="space-y-5">
            <!-- Hoje -->
            <div v-if="upcomingToday.length">
              <p class="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-2">Today</p>
              <div class="space-y-2 pl-3 border-l-2 border-red-500">
                <div v-for="t in upcomingToday" :key="t.id" class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-neutral-800 truncate">{{ t.title }}</span>
                  <span class="text-xs text-neutral-400 shrink-0 ml-2">{{ t.boardName }}</span>
                </div>
              </div>
            </div>
            <!-- Amanhã -->
            <div v-if="upcomingTomorrow.length">
              <p class="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-2">Tomorrow</p>
              <div class="space-y-2 pl-3 border-l-2 border-orange-500">
                <div v-for="t in upcomingTomorrow" :key="t.id" class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-neutral-800 truncate">{{ t.title }}</span>
                  <span class="text-xs text-neutral-400 shrink-0 ml-2">{{ t.boardName }}</span>
                </div>
              </div>
            </div>
            <!-- Próximos 7 dias -->
            <div v-if="upcomingNext7.length">
              <p class="text-[11px] font-bold text-purple-500 uppercase tracking-widest mb-2">Next 7 Days</p>
              <div class="space-y-2 pl-3 border-l-2 border-purple-400">
                <div v-for="t in upcomingNext7" :key="t.id" class="flex items-center justify-between">
                  <span class="text-sm text-neutral-700 truncate">{{ t.title }}</span>
                  <span class="text-xs text-neutral-400 shrink-0 ml-2">{{ formatDateShort(t.dueDate) }}</span>
                </div>
              </div>
            </div>
            <!-- Próximos 30 dias -->
            <div v-if="upcomingNext30.length">
              <p class="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Next 30 Days</p>
              <div class="space-y-2 pl-3 border-l-2 border-neutral-300">
                <div v-for="t in upcomingNext30" :key="t.id" class="flex items-center justify-between">
                  <span class="text-sm text-neutral-600 truncate">{{ t.title }}</span>
                  <span class="text-xs text-neutral-400 shrink-0 ml-2">{{ formatDateShort(t.dueDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl p-5 shadow-sm border border-neutral-200">
          <p class="text-sm text-neutral-500 mb-1">Total concluídas</p>
          <p class="text-3xl font-bold text-green-600">{{ tasks.length }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-neutral-200">
          <p class="text-sm text-neutral-500 mb-1">Orçamento total</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalBudget) }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-neutral-200">
          <p class="text-sm text-neutral-500 mb-1">Boards diferentes</p>
          <p class="text-3xl font-bold text-[#1C325C]">{{ uniqueBoards }}</p>
        </div>
      </div>

      <!-- Tabela -->
      <div class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-neutral-900">Tarefas Concluídas</h2>
          <span class="text-sm text-neutral-500">{{ tasks.length }} tarefa{{ tasks.length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="w-8 h-8 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-neutral-500 text-lg mb-1">Nenhuma tarefa concluída ainda</p>
          <p class="text-neutral-400 text-sm">Quando você concluir tarefas, elas aparecerão aqui</p>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Prazo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Orçamento</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-neutral-100">
              <tr v-for="task in tasks" :key="task.id" class="hover:bg-neutral-50 transition-colors">
                <!-- Tarefa -->
                <td class="px-6 py-4">
                  <p class="text-sm font-medium text-neutral-900">{{ task.title }}</p>
                  <p v-if="task.description" class="text-xs text-neutral-400 mt-0.5 line-clamp-1">{{ task.description }}</p>
                </td>

                <!-- Board -->
                <td class="px-6 py-4">
                  <NuxtLink :to="`/boards/${task.board_id}`" class="text-sm text-primary-600 hover:underline">
                    {{ task.board?.name || '—' }}
                  </NuxtLink>
                </td>

                <!-- Status -->
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: task.status?.color || '#22c55e' }"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    {{ task.status?.name || 'Concluído' }}
                  </span>
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
                  <span v-else class="text-xs text-neutral-400 italic">—</span>
                </td>

                <!-- Prazo -->
                <td class="px-6 py-4">
                  <span v-if="task.due_date" class="text-sm text-neutral-600">{{ formatDate(task.due_date) }}</span>
                  <span v-else class="text-xs text-neutral-400 italic">Sem prazo</span>
                </td>

                <!-- Orçamento -->
                <td class="px-6 py-4">
                  <span v-if="task.budget" class="text-sm font-medium text-green-600">{{ formatCurrency(task.budget) }}</span>
                  <span v-else class="text-xs text-neutral-400 italic">—</span>
                </td>

                <!-- Ações -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center px-3 py-1.5 border border-[#1C325C] rounded-lg text-xs font-medium text-[#1C325C] bg-white hover:bg-[#1C325C] hover:text-white transition-colors"
                      @click="openModal(task)"
                    >
                      <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Ver
                    </button>
                    <NuxtLink
                      :to="`/boards/${task.board_id}`"
                      class="inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-600 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  <!-- TaskModal -->
  <TaskModal
    v-if="selectedTask"
    v-model="showModal"
    :task-id="selectedTask.id"
    :board-id="selectedTask.board_id"
    :initial-task="selectedTask"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboard } from '~/composables/useDashboard'

definePageMeta({ layout: 'default' })

const supabase = useNuxtApp().$supabase as any
const { user } = useAuth()

const tasks = ref<any[]>([])
const loading = ref(false)
const showModal = ref(false)
const selectedTask = ref<{
  id: string
  board_id: string
  title: string
  description?: string | null
  status_id?: string | null
  priority_id?: string | null
  start_date?: string | null
  due_date?: string | null
  budget?: number | null
} | null>(null)

// ── Dashboard widgets ──────────────────────────────────────────────────────
const { upcomingTasks, fetchUpcomingTasks } = useDashboard()
const widgetsLoading = ref(false)

// Status agrupado por nome (deduplicado entre boards)
interface StatusItem { name: string; color: string; count: number }
const statusData = ref<StatusItem[]>([])

// Workload: membros responsáveis em boards criados pelo usuário
interface WorkloadMember { userId: string; name: string; avatarUrl: string | null; taskCount: number }
const workloadData = ref<WorkloadMember[]>([])

// ── Computed ───────────────────────────────────────────────────────────────
const totalBudget = computed(() => tasks.value.reduce((s, t) => s + (t.budget || 0), 0))
const uniqueBoards = computed(() => new Set(tasks.value.map(t => t.board_id)).size)

const totalStatusCount = computed(() => statusData.value.reduce((s, d) => s + d.count, 0))
function statusPercent(count: number) {
  if (!totalStatusCount.value) return 0
  return Math.round((count / totalStatusCount.value) * 100)
}

const maxWorkload = computed(() => Math.max(...workloadData.value.map(m => m.taskCount), 1))
function workloadPercent(count: number) {
  return Math.round((count / maxWorkload.value) * 100)
}

// Upcoming agrupados por período
const upcomingToday    = computed(() => upcomingTasks.value.filter(t => t.daysUntilDue === 0))
const upcomingTomorrow = computed(() => upcomingTasks.value.filter(t => t.daysUntilDue === 1))
const upcomingNext7    = computed(() => upcomingTasks.value.filter(t => t.daysUntilDue >= 2 && t.daysUntilDue <= 7))
const upcomingNext30   = computed(() => upcomingTasks.value.filter(t => t.daysUntilDue >= 8 && t.daysUntilDue <= 30))

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Queries ────────────────────────────────────────────────────────────────
async function fetchCompletedTasks() {
  if (!user.value) return
  loading.value = true
  try {
    const { data: created } = await supabase
      .from('tasks')
      .select(`*, board:boards!inner(id, name), priority:task_priorities(id, name, color), status:task_statuses!inner(id, name, color, is_done), task_assignees(user_id)`)
      .eq('created_by', user.value.id)
      .eq('status.is_done', true)
      .is('archived_at', null)

    const { data: assigned } = await supabase
      .from('tasks')
      .select(`*, board:boards!inner(id, name), priority:task_priorities(id, name, color), status:task_statuses!inner(id, name, color, is_done), task_assignees!inner(user_id)`)
      .eq('task_assignees.user_id', user.value.id)
      .eq('status.is_done', true)
      .is('archived_at', null)

    const all = [...(created || []), ...(assigned || [])]
    const unique = Array.from(new Map(all.map(t => [t.id, t])).values())
    tasks.value = unique
      .filter(t => t.status?.is_done === true)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  } catch (e) {
    console.error('[mywork] Erro ao carregar tarefas:', e)
  } finally {
    loading.value = false
  }
}

/**
 * Task Status — apenas boards privados do usuário.
 * Inclui tarefas sem status (status_id = NULL) como "Sem status".
 * Agrupa por nome para evitar duplicatas entre boards.
 */
async function fetchMyTaskStatus(boardIds: string[]) {
  if (!boardIds.length) return
  try {
    // Buscar TODAS as tarefas com seu status (LEFT JOIN via select aninhado)
    const { data: taskRows } = await supabase
      .from('tasks')
      .select('status_id, task_statuses(id, name, color, is_done)')
      .in('board_id', boardIds)
      .is('archived_at', null)

    if (!taskRows) return

    // Agrupar por nome (case-insensitive), incluindo NULL como "Sem status"
    const byName = new Map<string, StatusItem>()

    for (const t of taskRows) {
      const status = (t as any).task_statuses
      const key   = status ? status.name.toLowerCase().trim() : '__no_status__'
      const name  = status ? status.name  : 'Sem status'
      const color = status ? status.color : '#C4C4C4'

      if (byName.has(key)) {
        byName.get(key)!.count++
      } else {
        byName.set(key, { name, color, count: 1 })
      }
    }

    statusData.value = Array.from(byName.values()).sort((a, b) => b.count - a.count)
  } catch (e) {
    console.error('[mywork] Erro ao carregar status:', e)
  }
}

/**
 * Busca membros responsáveis por tarefas nos boards criados pelo usuário logado.
 * Agrupa por pessoa e conta quantas tarefas ativas (não arquivadas, não concluídas) cada um tem.
 */
async function fetchTeamWorkload(boardIds: string[]) {
  if (!boardIds.length) return

  try {
    // Buscar IDs de status "concluído" para excluir
    const { data: doneStatuses } = await supabase
      .from('task_statuses')
      .select('id')
      .in('board_id', boardIds)
      .eq('is_done', true)

    const doneIds: string[] = (doneStatuses || []).map((s: any) => s.id)

    // Buscar task_assignees com perfil, filtrando pelos boards do usuário
    const { data: rows } = await supabase
      .from('task_assignees')
      .select(`
        user_id,
        profiles:user_id ( id, full_name, avatar_url ),
        tasks!inner ( id, board_id, archived_at, status_id )
      `)
      .in('tasks.board_id', boardIds)
      .is('tasks.archived_at', null)

    if (!rows) return

    const map = new Map<string, WorkloadMember>()
    for (const row of rows) {
      const task = row.tasks as any
      // Excluir tarefas concluídas
      if (doneIds.includes(task.status_id)) continue

      const uid = row.user_id
      if (!map.has(uid)) {
        const profile = row.profiles as any
        map.set(uid, {
          userId: uid,
          name: profile?.full_name || 'Sem nome',
          avatarUrl: profile?.avatar_url || null,
          taskCount: 0
        })
      }
      map.get(uid)!.taskCount++
    }

    workloadData.value = Array.from(map.values())
      .filter(m => m.taskCount > 0)
      .sort((a, b) => b.taskCount - a.taskCount)
  } catch (e) {
    console.error('[mywork] Erro ao carregar workload:', e)
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function openModal(task: any) {
  selectedTask.value = {
    id: task.id,
    board_id: task.board_id,
    title: task.title,
    description: task.description,
    status_id: task.status_id,
    priority_id: task.priority_id,
    start_date: task.start_date,
    due_date: task.due_date,
    budget: task.budget,
  }
  showModal.value = true
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateShort(dateStr: string) {
  const parts = dateStr.split('-').map(Number)
  const m = parts[1]
  const d = parts[2]
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[(m ?? 1) - 1]} ${d}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ── Mount ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchCompletedTasks()

  // Boards privados criados pelo usuário → Task Status pessoal
  const { data: privateBoards } = await supabase
    .from('boards')
    .select('id')
    .eq('created_by', user.value?.id)
    .eq('visibility', 'private')

  const privateBoardIds = (privateBoards || []).map((b: any) => b.id) as string[]

  // Todos os boards criados pelo usuário → Team Workload + Vence em Breve
  const { data: allMyBoards } = await supabase
    .from('boards')
    .select('id')
    .eq('created_by', user.value?.id)

  const allMyBoardIds = (allMyBoards || []).map((b: any) => b.id) as string[]

  widgetsLoading.value = true
  await Promise.all([
    privateBoardIds.length ? fetchMyTaskStatus(privateBoardIds) : Promise.resolve(),
    allMyBoardIds.length  ? fetchTeamWorkload(allMyBoardIds)   : Promise.resolve(),
    allMyBoardIds.length  ? fetchUpcomingTasks(allMyBoardIds)  : Promise.resolve(),
  ])
  widgetsLoading.value = false
})
</script>
