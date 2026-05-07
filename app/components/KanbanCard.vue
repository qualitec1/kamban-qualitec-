<template>
  <div class="select-none">
    <!-- Card principal -->
    <div
      ref="cardRef"
      draggable="true"
      class="bg-white rounded-lg p-3 border border-neutral-200 shadow-sm hover:shadow-md transition-all group/card"
      :class="{ 
        'opacity-50 scale-95': isDragging, 
        'cursor-pointer': !isDragging,
        'cursor-move': isDragging,
        'ring-2 ring-primary-400': isLongPressing,
        'rounded-b-none': showSubtasks && subtasks.length > 0
      }"
      :style="dragStyle"
      @click="handleClick"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchCancel"
    >
      <div class="flex items-center justify-between gap-2 mb-2">
        <h3 class="text-body-sm font-medium text-neutral-900 flex-1">{{ task.title }}</h3>
        <TaskReminderButton :task-id="task.id" :task-title="task.title" />
      </div>
      
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-label-xs text-muted flex-wrap">
          <!-- Status com cor real -->
          <div v-if="task.status_id && statusData" class="flex items-center gap-1">
            <div 
              class="w-2 h-2 rounded-full" 
              :style="{ backgroundColor: statusData.color }"
            />
            <span>{{ statusData.name }}</span>
          </div>
          
          <!-- Priority com cor real -->
          <div v-if="task.priority_id && priorityData" class="flex items-center gap-1">
            <div
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: priorityData.color }"
            />
            <span>{{ priorityData.name }}</span>
          </div>
          
          <!-- Due date -->
          <div v-if="task.due_date" class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ formatDate(task.due_date) }}</span>
          </div>

          <!-- Subtasks indicator -->
          <button
            v-if="subtasks.length > 0"
            @click.stop="toggleSubtasks"
            class="flex items-center gap-1 hover:text-primary-600 transition-colors"
            :title="showSubtasks ? 'Ocultar subtarefas' : 'Mostrar subtarefas'"
          >
            <svg 
              class="w-3 h-3 transition-transform"
              :class="{ 'rotate-180': showSubtasks }"
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span>{{ completedSubtasksCount }}/{{ subtasks.length }}</span>
          </button>
        </div>

        <!-- Assignees section -->
        <div class="flex items-center gap-1 shrink-0" ref="assigneeRef">
          <!-- Avatars -->
          <AvatarStack v-if="assignees.length > 0" :assignees="assignees" :max-visible="2" />
          
          <!-- Add assignee button (always visible on mobile, hover on desktop) -->
          <button
            v-if="canEdit"
            @click.stop="toggleAssigneeDropdown"
            class="w-6 h-6 rounded-full bg-neutral-100 hover:bg-primary-100 flex items-center justify-center transition-colors opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
            :class="{ 'opacity-100': assigneeDropdownOpen }"
            title="Adicionar responsável"
          >
            <svg class="w-3 h-3 text-neutral-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Assignee Dropdown -->
      <Teleport to="body">
        <div
          v-if="assigneeDropdownOpen"
          ref="dropdownRef"
          class="fixed z-[99999] w-[320px] bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden"
          :style="dropdownStyle"
        >
          <!-- Chips de responsáveis selecionados -->
          <div v-if="assignees.length > 0" class="px-3 py-2 border-b border-neutral-200 bg-neutral-50">
            <div class="flex flex-wrap gap-1.5">
              <div
                v-for="assignee in assignees"
                :key="assignee.id"
                class="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs hover:border-neutral-300 transition-colors"
              >
                <Avatar
                  :profile="assignee"
                  size="xs"
                />
                <span class="text-xs text-neutral-700 max-w-[80px] truncate">
                  {{ assignee.full_name || assignee.email }}
                </span>
                <button
                  type="button"
                  @click.stop="removeAssignee(assignee.id)"
                  class="p-0.5 rounded hover:bg-neutral-100 transition-colors"
                >
                  <svg class="w-2.5 h-2.5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Campo de busca -->
          <div class="px-3 py-2 border-b border-neutral-200">
            <div class="relative">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar membros..."
                class="w-full pl-9 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loadingMembers" class="px-3 py-4 text-xs text-neutral-400 text-center">
            Carregando...
          </div>

          <!-- Lista de membros -->
          <div v-else class="max-h-[240px] overflow-y-auto">
            <div v-if="filteredMembers.length > 0" class="py-1">
              <button
                v-for="member in filteredMembers"
                :key="member.user_id"
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                @mousedown.prevent="toggleAssignee(member.user_id)"
              >
                <Avatar
                  :profile="{
                    id: member.user_id,
                    full_name: member.profile.full_name,
                    email: member.profile.email,
                    avatar_url: member.profile.avatar_url
                  }"
                  size="xs"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium text-neutral-800 truncate">
                    {{ member.profile.full_name || 'Sem nome' }}
                  </div>
                  <div class="text-[10px] text-neutral-500 truncate">
                    {{ member.profile.email }}
                  </div>
                </div>
                <svg
                  v-if="isAssigned(member.user_id)"
                  class="w-4 h-4 text-primary-600 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
            <div v-else class="px-3 py-4 text-xs text-neutral-400 text-center">
              Nenhum membro encontrado
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- Subtasks expandable section -->
    <div
      v-if="showSubtasks && subtasks.length > 0"
      class="bg-neutral-50 border border-t-0 border-neutral-200 rounded-b-lg"
    >
      <div
        v-for="subtask in subtasks"
        :key="subtask.id"
        class="border-b border-neutral-100 last:border-b-0"
      >
        <!-- Subtask row -->
        <div
          class="flex items-center gap-2.5 px-3 py-2.5 text-xs group/subtask hover:bg-neutral-100 transition-all"
          :class="{ 'bg-neutral-100 shadow-inner': expandedSubtaskId === subtask.id }"
        >
          <button
            @click.stop="toggleSubtaskDone(subtask.id, !subtask.is_done)"
            class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all hover:scale-110"
            :class="subtask.is_done 
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-600 shadow-sm' 
              : 'border-neutral-300 hover:border-primary-400 hover:bg-primary-50'"
          >
            <svg
              v-if="subtask.is_done"
              class="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            @click.stop="toggleSubtaskPreview(subtask.id)"
            class="flex-1 text-left truncate font-medium transition-colors"
            :class="subtask.is_done ? 'line-through text-neutral-400' : 'text-neutral-700 hover:text-neutral-900'"
          >
            {{ subtask.title }}
          </button>
          
          <!-- Info badges -->
          <div class="flex items-center gap-1 shrink-0">
            <!-- Has assignees indicator -->
            <div v-if="subtask.assignees && subtask.assignees.length > 0" class="flex items-center">
              <div class="w-1.5 h-1.5 rounded-full bg-primary-500" />
            </div>
            
            <!-- Has due date indicator -->
            <div v-if="subtask.due_date" class="flex items-center">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </div>
          </div>
          
          <!-- Expand icon -->
          <button
            @click.stop="toggleSubtaskPreview(subtask.id)"
            class="p-1 hover:bg-neutral-200 rounded-md transition-all"
            :class="{ 'bg-neutral-200': expandedSubtaskId === subtask.id }"
          >
            <svg 
              class="w-3.5 h-3.5 text-neutral-500 transition-transform shrink-0"
              :class="{ 'rotate-180': expandedSubtaskId === subtask.id }"
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <!-- Subtask preview (expanded) -->
        <div
          v-if="expandedSubtaskId === subtask.id"
          class="px-4 py-3 bg-gradient-to-br from-white to-neutral-50 space-y-3 border-t border-neutral-200"
          @click.stop
        >
          <!-- Title and description -->
          <div class="space-y-1.5">
            <h4 class="text-xs font-semibold text-neutral-800">{{ subtask.title }}</h4>
            <p v-if="subtask.description" class="text-[11px] text-neutral-600 leading-relaxed line-clamp-3">
              {{ subtask.description }}
            </p>
          </div>

          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-2">
            <!-- Status -->
            <div v-if="subtask.status_id" class="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-neutral-200">
              <div 
                class="w-2.5 h-2.5 rounded-full shrink-0" 
                :style="{ backgroundColor: getStatusColor(subtask.status_id) }"
              />
              <div class="flex-1 min-w-0">
                <p class="text-[9px] text-neutral-400 uppercase tracking-wide">Status</p>
                <p class="text-[11px] text-neutral-700 font-medium truncate">{{ getStatusName(subtask.status_id) }}</p>
              </div>
            </div>
            
            <!-- Priority -->
            <div v-if="subtask.priority_id" class="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-neutral-200">
              <div 
                class="w-2.5 h-2.5 rounded-full shrink-0" 
                :style="{ backgroundColor: getPriorityColor(subtask.priority_id) }"
              />
              <div class="flex-1 min-w-0">
                <p class="text-[9px] text-neutral-400 uppercase tracking-wide">Prioridade</p>
                <p class="text-[11px] text-neutral-700 font-medium truncate">{{ getPriorityName(subtask.priority_id) }}</p>
              </div>
            </div>
            
            <!-- Due date -->
            <div v-if="subtask.due_date" class="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-neutral-200">
              <svg class="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div class="flex-1 min-w-0">
                <p class="text-[9px] text-neutral-400 uppercase tracking-wide">Prazo</p>
                <p class="text-[11px] text-neutral-700 font-medium">{{ formatDate(subtask.due_date) }}</p>
              </div>
            </div>
            
            <!-- Budget -->
            <div v-if="subtask.budget" class="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-neutral-200">
              <svg class="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1 min-w-0">
                <p class="text-[9px] text-neutral-400 uppercase tracking-wide">Orçamento</p>
                <p class="text-[11px] text-neutral-700 font-medium">R$ {{ formatBudget(subtask.budget) }}</p>
              </div>
            </div>
          </div>

          <!-- Assignees -->
          <div v-if="subtask.assignees && subtask.assignees.length > 0" class="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-neutral-200">
            <svg class="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div class="flex-1 min-w-0">
              <p class="text-[9px] text-neutral-400 uppercase tracking-wide mb-1">Responsáveis</p>
              <AvatarStack :assignees="subtask.assignees" :max-visible="4" />
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 pt-1">
            <button
              @click.stop="openSubtaskModal(subtask.id)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all hover:shadow-sm"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar completo
            </button>
            <button
              v-if="!subtask.is_done"
              @click.stop="toggleSubtaskDone(subtask.id, true)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all hover:shadow-md"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Subtask Modal -->
  <SubtaskModal
    v-if="selectedSubtaskId"
    v-model="showSubtaskModal"
    :subtask-id="selectedSubtaskId"
    :task-id="task.id"
    :board-id="boardId || ''"
    @updated="handleSubtaskUpdated"
    @deleted="handleSubtaskDeleted"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { TaskRow } from '~/composables/useTasks'
import { useTaskAssignees } from '~/composables/useTaskAssignees'
import { useBoardMembers } from '~/composables/useBoardMembers'
import { useSubtasks } from '~/composables/useSubtasks'
import { useTaskStatuses } from '~/composables/useTaskStatuses'
import { useTaskPriorities } from '~/composables/useTaskPriorities'

const props = defineProps<{
  task: TaskRow
  statuses: Array<{ id: string; name: string; color: string }>
  priorities: Array<{ id: string; name: string; color: string }>
  isDragging?: boolean
  boardId?: string
  canEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'drag-start'): void
  (e: 'drag-end'): void
  (e: 'touch-drag-start', data: { taskId: string; x: number; y: number }): void
  (e: 'touch-drag-move', data: { x: number; y: number }): void
  (e: 'touch-drag-end'): void
}>()

const cardRef = ref<HTMLElement | null>(null)
const isLongPressing = ref(false)
const isTouchDragging = ref(false)
const longPressTimer = ref<number | null>(null)
const touchStartPos = ref({ x: 0, y: 0 })
const currentTouchPos = ref({ x: 0, y: 0 })

// Assignee management
const assigneeRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const assigneeDropdownOpen = ref(false)
const dropdownStyle = ref<Record<string, string>>({})
const searchQuery = ref('')

// Subtasks management
const showSubtasks = ref(false)
const expandedSubtaskId = ref<string | null>(null)
const selectedSubtaskId = ref<string | null>(null)
const showSubtaskModal = ref(false)
const { subtasks, fetchSubtasks, toggleSubtask } = useSubtasks(props.task.id)

const { assignees, loading: loadingAssignees, fetchAssignees, addAssignee: addAssigneeToTask, removeAssignee: removeAssigneeFromTask } = useTaskAssignees(props.task.id)
const { members, loading: loadingMembers, fetchMembers } = useBoardMembers()

// Carregar statuses e priorities para as subtarefas
const { statuses: taskStatuses, fetchStatuses: fetchTaskStatuses } = useTaskStatuses(props.boardId || '')
const { priorities: taskPriorities, fetchPriorities: fetchTaskPriorities } = useTaskPriorities(props.boardId || '')

const statusData = computed(() => 
  props.task.status_id ? props.statuses.find(s => s.id === props.task.status_id) : null
)

const priorityData = computed(() => 
  props.task.priority_id ? props.priorities.find(p => p.id === props.task.priority_id) : null
)

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return members.value
  
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(member => {
    const name = member.profile.full_name?.toLowerCase() || ''
    const email = member.profile.email?.toLowerCase() || ''
    return name.includes(query) || email.includes(query)
  })
})

const completedSubtasksCount = computed(() => 
  subtasks.value.filter(s => s.is_done).length
)

const dragStyle = computed(() => {
  if (!isTouchDragging.value) return {}
  
  return {
    position: 'fixed' as const,
    left: `${currentTouchPos.value.x - 160}px`,
    top: `${currentTouchPos.value.y - 40}px`,
    width: '320px',
    zIndex: 9999,
    pointerEvents: 'none' as const,
    transform: 'rotate(3deg)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  }
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  // Parse a data como local, não UTC
  const [year, month, day] = dateStr.split('T')[0].split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function handleClick() {
  if (!isTouchDragging.value && !isLongPressing.value) {
    emit('click')
  }
}

// Subtask functions
function toggleSubtasks() {
  showSubtasks.value = !showSubtasks.value
  if (!showSubtasks.value) {
    expandedSubtaskId.value = null
  }
}

function toggleSubtaskPreview(subtaskId: string) {
  if (expandedSubtaskId.value === subtaskId) {
    expandedSubtaskId.value = null
  } else {
    expandedSubtaskId.value = subtaskId
  }
}

async function toggleSubtaskDone(subtaskId: string, isDone: boolean) {
  await toggleSubtask(subtaskId, isDone)
}

function openSubtaskModal(subtaskId: string) {
  selectedSubtaskId.value = subtaskId
  showSubtaskModal.value = true
}

function handleSubtaskUpdated() {
  fetchSubtasks()
}

function handleSubtaskDeleted(subtaskId: string) {
  fetchSubtasks()
  if (expandedSubtaskId.value === subtaskId) {
    expandedSubtaskId.value = null
  }
  selectedSubtaskId.value = null
  showSubtaskModal.value = false
}

// Helper functions for subtask preview
function getStatusColor(statusId: string): string {
  const status = taskStatuses.value.find(s => s.id === statusId)
  return status?.color || '#6366f1'
}

function getStatusName(statusId: string): string {
  const status = taskStatuses.value.find(s => s.id === statusId)
  return status?.name || ''
}

function getPriorityColor(priorityId: string): string {
  const priority = taskPriorities.value.find(p => p.id === priorityId)
  return priority?.color || '#6366f1'
}

function getPriorityName(priorityId: string): string {
  const priority = taskPriorities.value.find(p => p.id === priorityId)
  return priority?.name || ''
}

function formatBudget(budget: number): string {
  return budget.toFixed(2).replace('.', ',')
}

// Assignee functions
function calcDropdownPosition() {
  if (!assigneeRef.value) return
  const rect = assigneeRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceRight = window.innerWidth - rect.left

  const dropdownHeight = 400
  const dropdownWidth = 320

  const top = spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4
  const left = spaceRight >= dropdownWidth ? rect.left : rect.right - dropdownWidth

  dropdownStyle.value = {
    top: `${Math.max(8, top)}px`,
    left: `${Math.max(8, left)}px`,
  }
}

function toggleAssigneeDropdown() {
  if (!props.canEdit) return
  
  calcDropdownPosition()
  assigneeDropdownOpen.value = !assigneeDropdownOpen.value
  
  if (assigneeDropdownOpen.value) {
    searchQuery.value = ''
  }
}

function isAssigned(userId: string): boolean {
  return assignees.value.some(a => a.id === userId)
}

async function toggleAssignee(userId: string) {
  if (!props.canEdit) return
  
  const assigned = isAssigned(userId)
  const previousAssignees = [...assignees.value]
  
  // Optimistic update
  if (assigned) {
    assignees.value = assignees.value.filter(a => a.id !== userId)
  } else {
    const member = members.value.find(m => m.user_id === userId)
    if (member) {
      assignees.value.push({
        id: member.user_id,
        full_name: member.profile.full_name,
        email: member.profile.email,
        avatar_url: member.profile.avatar_url
      })
    }
  }

  // Persist to database (com envio de email)
  try {
    if (assigned) {
      const success = await removeAssigneeFromTask(userId, props.task.id)
      if (!success) throw new Error('Failed to remove assignee')
    } else {
      const success = await addAssigneeToTask(userId, props.task.id)
      if (!success) throw new Error('Failed to add assignee')
    }
  } catch (err) {
    // Reverter em caso de erro
    assignees.value = previousAssignees
    console.error('Error toggling assignee:', err)
  }
}

async function removeAssignee(userId: string) {
  if (!props.canEdit) return
  
  const previousAssignees = [...assignees.value]
  assignees.value = assignees.value.filter(a => a.id !== userId)
  
  try {
    const success = await removeAssigneeFromTask(userId, props.task.id)
    if (!success) {
      assignees.value = previousAssignees
    }
  } catch (err) {
    assignees.value = previousAssignees
    console.error('Error removing assignee:', err)
  }
}

function onClickOutside(e: MouseEvent) {
  if (!assigneeDropdownOpen.value) return
  const target = e.target as Node
  
  if (assigneeRef.value && assigneeRef.value.contains(target)) return
  if (dropdownRef.value && dropdownRef.value.contains(target)) return
  
  assigneeDropdownOpen.value = false
}

function handleDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.task.id)
  }
  emit('drag-start')
}

function handleDragEnd() {
  emit('drag-end')
}

// Touch events para mobile
function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  
  touchStartPos.value = { x: touch.clientX, y: touch.clientY }
  currentTouchPos.value = { x: touch.clientX, y: touch.clientY }
  
  // Iniciar timer de long press (500ms)
  longPressTimer.value = window.setTimeout(() => {
    isLongPressing.value = true
    isTouchDragging.value = true
    
    // Vibração háptica se disponível
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    const t = e.touches[0]
    if (t) {
      emit('touch-drag-start', {
        taskId: props.task.id,
        x: t.clientX,
        y: t.clientY
      })
    }
  }, 500)
}

function handleTouchMove(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  
  const deltaX = Math.abs(touch.clientX - touchStartPos.value.x)
  const deltaY = Math.abs(touch.clientY - touchStartPos.value.y)
  
  // Se moveu mais de 10px antes do long press, cancelar
  if (!isTouchDragging.value && (deltaX > 10 || deltaY > 10)) {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
    isLongPressing.value = false
    return
  }
  
  // Se está arrastando, atualizar posição
  if (isTouchDragging.value) {
    e.preventDefault()
    currentTouchPos.value = { x: touch.clientX, y: touch.clientY }
    emit('touch-drag-move', { x: touch.clientX, y: touch.clientY })
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  if (isTouchDragging.value) {
    e.preventDefault()
    emit('touch-drag-end')
  }
  
  isLongPressing.value = false
  isTouchDragging.value = false
}

function handleTouchCancel() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  isLongPressing.value = false
  isTouchDragging.value = false
  
  if (isTouchDragging.value) {
    emit('touch-drag-end')
  }
}

onMounted(() => {
  // Carregar assignees e membros se boardId foi fornecido
  if (props.boardId) {
    fetchAssignees()
    fetchMembers(props.boardId)
    fetchSubtasks()
    fetchTaskStatuses()
    fetchTaskPriorities()
  }
  
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>
