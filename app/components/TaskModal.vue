<template>
  <BaseModal :model-value="props.modelValue" :title="draftTitle || task?.title || 'Tarefa'" size="xl" @update:model-value="onClose">
    <!-- Spinner apenas quando não há dados iniciais e ainda está carregando -->
    <div v-if="!dataLoaded" class="flex items-center justify-center py-12">
      <div class="w-6 h-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
    </div>

    <div v-else class="space-y-6">

      <!-- Título editável inline -->
      <div>
        <input
          v-model="draftTitle"
          type="text"
          maxlength="500"
          placeholder="Título da tarefa"
          :disabled="!canEditTasks"
          class="w-full text-xl font-semibold text-neutral-900 bg-transparent border-0 border-b-2 border-transparent focus:border-primary-400 outline-none pb-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          @blur="saveField('title', draftTitle)"
          @keydown.enter.prevent="saveField('title', draftTitle)"
        />
      </div>

      <!-- Grid de campos — 2 colunas em desktop, 1 em mobile -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- Status -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</label>
          <select
            v-model="draftStatusId"
            :disabled="!canEditTasks"
            class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            @change="saveField('status_id', draftStatusId)"
          >
            <option :value="null">Sem status</option>
            <option 
              v-for="s in statuses" 
              :key="s.id" 
              :value="s.id"
              :style="{ color: s.color }"
            >
              {{ s.name }}
            </option>
          </select>
          <!-- Indicador visual da cor do status selecionado -->
          <div 
            v-if="draftStatusId" 
            class="flex items-center gap-2 mt-1"
          >
            <div 
              class="w-3 h-3 rounded-full" 
              :style="{ backgroundColor: statuses.find(s => s.id === draftStatusId)?.color || '#6366f1' }"
            />
            <span class="text-xs text-neutral-500">
              {{ statuses.find(s => s.id === draftStatusId)?.name }}
            </span>
          </div>
        </div>

        <!-- Prioridade -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Prioridade</label>
          <select
            v-model="draftPriorityId"
            :disabled="!canEditTasks"
            class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            @change="saveField('priority_id', draftPriorityId)"
          >
            <option :value="null">Sem prioridade</option>
            <option 
              v-for="p in priorities" 
              :key="p.id" 
              :value="p.id"
              :style="{ color: p.color }"
            >
              {{ p.name }}
            </option>
          </select>
          <!-- Indicador visual da cor da prioridade selecionada -->
          <div 
            v-if="draftPriorityId" 
            class="flex items-center gap-2 mt-1"
          >
            <div 
              class="w-3 h-3 rounded-full" 
              :style="{ backgroundColor: priorities.find(p => p.id === draftPriorityId)?.color || '#6366f1' }"
            />
            <span class="text-xs text-neutral-500">
              {{ priorities.find(p => p.id === draftPriorityId)?.name }}
            </span>
          </div>
        </div>

        <!-- Data de início -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Início</label>
          <input
            v-model="draftStartDate"
            type="date"
            :disabled="!canEditTasks"
            class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            @change="saveField('start_date', draftStartDate || null)"
          />
        </div>

        <!-- Prazo -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Prazo</label>
          <input
            v-model="draftDueDate"
            type="date"
            :min="draftStartDate || undefined"
            :disabled="!canEditTasks"
            class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            @change="saveField('due_date', draftDueDate || null)"
          />
        </div>

        <!-- Orçamento -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Orçamento (R$)</label>
          <input
            v-model="draftBudget"
            type="text"
            inputmode="decimal"
            placeholder="0,00"
            :disabled="!canEditTasks"
            class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            @blur="saveBudget"
            @keydown.enter.prevent="saveBudget"
          />
        </div>

        <!-- Responsáveis -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Responsáveis</label>
          <AssigneeCell
            :task-id="taskId"
            :board-id="boardId"
            :initial-assignees="assignees"
            @update="handleAssigneesUpdate"
          />
        </div>
      </div>

      <!-- Descrição / Notas -->
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Descrição</label>
        <textarea
          v-model="draftDescription"
          rows="4"
          placeholder="Adicione uma descrição ou observações..."
          :disabled="!canEditTasks"
          class="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          @blur="saveField('description', draftDescription || null)"
        />
      </div>

      <!-- Subtarefas -->
      <div class="pt-4 border-t border-neutral-200">
        <SubtasksSection :key="taskId" :task-id="taskId" :board-id="boardId" />
      </div>

      <!-- Anexos -->
      <div class="pt-4 border-t border-neutral-200">
        <TaskAttachmentsManager :key="taskId" :task-id="taskId" :board-id="boardId" />
      </div>

      <!-- Histórico de Atividades -->
      <div class="pt-4 border-t border-neutral-200">
        <TaskActivityHistory :key="taskId" :task-id="taskId" />
      </div>

      <!-- Metadados -->
      <div class="flex flex-wrap gap-4 pt-2 border-t border-neutral-100 text-xs text-neutral-400">
        <span v-if="taskCreatedAt">Criado em {{ formatDate(taskCreatedAt) }}</span>
        <span v-if="taskUpdatedAt">Atualizado {{ formatRelative(taskUpdatedAt) }}</span>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <TaskInviteButton 
            v-if="canEditTasks" 
            :task-id="taskId" 
            :board-id="boardId" 
          />
          <BaseButton 
            v-if="canEditTasks" 
            variant="ghost" 
            class="text-neutral-600 hover:bg-neutral-100" 
            @click="toggleArchive"
          >
            {{ task?.archived_at ? 'Desarquivar' : 'Arquivar' }}
          </BaseButton>
          <BaseButton 
            v-if="canEditTasks" 
            variant="ghost" 
            class="text-red-600 hover:bg-red-50" 
            @click="showDeleteConfirm = true"
          >
            Excluir tarefa
          </BaseButton>
        </div>
        <div class="flex items-center gap-2">
          <!-- Botão Salvar (aparece quando há alterações pendentes) -->
          <BaseButton
            v-if="canEditTasks && hasUnsavedChanges"
            variant="primary"
            :disabled="saving"
            @click="saveAllAndReload"
          >
            <svg v-if="saving" class="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </BaseButton>
          <BaseButton variant="ghost" @click="onClose">Fechar</BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- Modal de confirmação de exclusão -->
  <BaseModal v-model="showDeleteConfirm" title="Excluir tarefa?" size="sm" :close-on-backdrop="false">
    <div class="space-y-4">
      <p class="text-sm text-neutral-600">
        Tem certeza que deseja excluir a tarefa <span class="font-semibold">"{{ task?.title }}"</span>?
      </p>
      <p class="text-sm text-neutral-500">
        Esta ação não pode ser desfeita.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="showDeleteConfirm = false">Cancelar</BaseButton>
      <BaseButton variant="danger" @click="confirmDelete" :disabled="deleting">
        {{ deleting ? 'Excluindo...' : 'Excluir' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTaskDetail } from '~/composables/useTaskDetail'
import { useTaskStatuses, type TaskStatus } from '~/composables/useTaskStatuses'
import { useTaskPriorities, type TaskPriority } from '~/composables/useTaskPriorities'
import { useTaskAssignees } from '~/composables/useTaskAssignees'
import { useBoardPermissions } from '~/composables/useBoardPermissions'
import SubtasksSection from '~/components/SubtasksSection.vue'

const props = defineProps<{
  taskId: string
  boardId: string
  modelValue: boolean
  initialTask?: {
    title: string
    description?: string | null
    status_id?: string | null
    priority_id?: string | null
    start_date?: string | null
    due_date?: string | null
    budget?: number | null
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'updated', patch: { field: string; value: unknown }): void
  (e: 'deleted', taskId: string): void
}>()

const open = ref(props.modelValue)
watch(() => props.modelValue, v => { open.value = v })
watch(open, v => emit('update:modelValue', v))

const { task, loading, fetchTask, updateTask } = useTaskDetail()
const { statuses, fetchStatuses } = useTaskStatuses(props.boardId)
const { priorities, fetchPriorities } = useTaskPriorities(props.boardId)

// Typed aliases para garantir inferência correta no template
const typedStatuses = statuses as import('vue').Ref<TaskStatus[]>
const typedPriorities = priorities as import('vue').Ref<TaskPriority[]>
const { assignees, fetchAssignees } = useTaskAssignees(props.taskId)
const { canEdit: canEditTasks, fetchUserRole } = useBoardPermissions(props.boardId)

const showDeleteConfirm = ref(false)
const deleting = ref(false)
const saving = ref(false)

// Draft fields
const draftTitle       = ref('')
const draftDescription = ref('')
const draftStatusId    = ref<string | null>(null)
const draftPriorityId  = ref<string | null>(null)
const draftStartDate   = ref('')
const draftDueDate     = ref('')
const draftBudget      = ref('')

// Snapshot dos valores originais para detectar mudanças
const originalValues = ref<Record<string, any>>({})

// Flag para controlar se já carregou os dados
const dataLoaded = ref(false)

function syncDrafts() {
  if (!task.value) return
  // Se já tínhamos dados iniciais e o usuário pode ter editado, não sobrescrever
  // Apenas preencher campos que ainda estão vazios (ex: notes, archived_at não vêm do initialTask)
  if (props.initialTask && dataLoaded.value) return
  draftTitle.value       = task.value.title
  draftDescription.value = task.value.description ?? ''
  draftStatusId.value    = task.value.status_id
  draftPriorityId.value  = task.value.priority_id
  draftStartDate.value   = task.value.start_date ?? ''
  draftDueDate.value     = task.value.due_date ?? ''
  draftBudget.value      = task.value.budget != null ? String(task.value.budget).replace('.', ',') : ''
  
  // Salvar snapshot dos valores originais
  originalValues.value = {
    title: draftTitle.value,
    description: draftDescription.value,
    status_id: draftStatusId.value,
    priority_id: draftPriorityId.value,
    start_date: draftStartDate.value,
    due_date: draftDueDate.value,
    budget: draftBudget.value
  }
}

// Detectar se há mudanças não salvas
const hasUnsavedChanges = computed(() => {
  if (!dataLoaded.value) return false
  return (
    draftTitle.value !== originalValues.value.title ||
    draftDescription.value !== originalValues.value.description ||
    draftStatusId.value !== originalValues.value.status_id ||
    draftPriorityId.value !== originalValues.value.priority_id ||
    draftStartDate.value !== originalValues.value.start_date ||
    draftDueDate.value !== originalValues.value.due_date ||
    draftBudget.value !== originalValues.value.budget
  )
})

watch(task, syncDrafts)

// Computed para metadados — cast explícito para contornar inferência do Volar com #imports
const taskCreatedAt = computed((): string | null => (task.value as any)?.created_at ?? null)
const taskUpdatedAt = computed((): string | null => (task.value as any)?.updated_at ?? null)

async function loadAllData() {
  console.log('[TaskModal] Loading all data for task:', props.taskId)

  // Se temos dados iniciais, pré-popular os drafts imediatamente (sem spinner)
  const initial = props.initialTask as { title: string; description?: string | null; status_id?: string | null; priority_id?: string | null; start_date?: string | null; due_date?: string | null; budget?: number | null } | undefined
  if (initial) {
    draftTitle.value       = initial.title
    draftDescription.value = initial.description ?? ''
    draftStatusId.value    = initial.status_id ?? null
    draftPriorityId.value  = initial.priority_id ?? null
    draftStartDate.value   = initial.start_date ?? ''
    draftDueDate.value     = initial.due_date ?? ''
    draftBudget.value      = initial.budget != null
      ? String(initial.budget).replace('.', ',')
      : ''
    // Snapshot para detectar mudanças
    originalValues.value = {
      title: draftTitle.value,
      description: draftDescription.value,
      status_id: draftStatusId.value,
      priority_id: draftPriorityId.value,
      start_date: draftStartDate.value,
      due_date: draftDueDate.value,
      budget: draftBudget.value
    }
    // Marcar como carregado para mostrar o conteúdo imediatamente
    dataLoaded.value = true
  } else {
    dataLoaded.value = false
  }

  try {
    await Promise.all([
      fetchTask(props.taskId),       // busca campos extras (notes, archived_at, created_at…)
      fetchStatuses(),
      fetchPriorities(),
      fetchAssignees(props.taskId),
      fetchUserRole()
    ])
    dataLoaded.value = true
    console.log('[TaskModal] Data loaded successfully')
  } catch (error) {
    console.error('[TaskModal] Error loading data:', error)
  }
}

// Carrega dados quando o modal abre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await loadAllData()
  }
}, { immediate: true })

// Recarrega quando o taskId mudar (enquanto o modal está aberto)
watch(() => props.taskId, async (newTaskId, oldTaskId) => {
  if (props.modelValue && newTaskId && newTaskId !== oldTaskId) {
    console.log('[TaskModal] TaskId changed from', oldTaskId, 'to', newTaskId)
    await loadAllData()
  }
})

async function saveField(field: string, value: unknown) {
  if (!task.value) return
  try {
    await updateTask(props.taskId, { [field]: value } as any)
    emit('updated', { field, value })
  } catch { /* silently fail */ }
}

async function saveBudget() {
  const raw = draftBudget.value.trim().replace(',', '.')
  const value = raw === '' ? null : parseFloat(raw)
  if (value !== null && isNaN(value)) return
  await saveField('budget', value)
}

async function confirmDelete() {
  if (!task.value || deleting.value) return
  
  deleting.value = true
  const supabase = useNuxtApp().$supabase as any
  
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', props.taskId)
    
    if (error) throw error
    
    // Fecha ambos os modais
    showDeleteConfirm.value = false
    emit('deleted', props.taskId)
    emit('update:modelValue', false)
  } catch (err) {
    console.error('Erro ao excluir tarefa:', err)
  } finally {
    deleting.value = false
  }
}

async function toggleArchive() {
  if (!task.value) return
  
  const supabase = useNuxtApp().$supabase as any
  const newArchivedAt = task.value.archived_at ? null : new Date().toISOString()
  
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ archived_at: newArchivedAt })
      .eq('id', props.taskId)
    
    if (error) throw error
    
    // Atualiza o estado local
    if (task.value) {
      task.value.archived_at = newArchivedAt
    }
    
    // Emite evento para remover da lista se foi arquivado
    if (newArchivedAt) {
      emit('deleted', props.taskId)
      emit('update:modelValue', false)
    }
  } catch (err) {
    console.error('Erro ao arquivar/desarquivar tarefa:', err)
  }
}

async function saveAllAndReload() {
  if (!task.value || saving.value) return
  saving.value = true

  try {
    // Salvar todos os campos de uma vez
    const budgetRaw = draftBudget.value.trim().replace(',', '.')
    const budgetValue = budgetRaw === '' ? null : parseFloat(budgetRaw)

    await updateTask(props.taskId, {
      title: draftTitle.value,
      description: draftDescription.value || null,
      status_id: draftStatusId.value,
      priority_id: draftPriorityId.value,
      start_date: draftStartDate.value || null,
      due_date: draftDueDate.value || null,
      budget: (!budgetValue || isNaN(budgetValue)) ? null : budgetValue
    } as any)

    emit('updated', { field: 'all', value: null })

    // Recarregar a página
    window.location.reload()
  } catch (err) {
    console.error('[TaskModal] Erro ao salvar:', err)
    saving.value = false
  }
}

function onClose() {
  emit('update:modelValue', false)
}

function handleAssigneesUpdate(newAssignees: any[]) {
  // Atualizar a lista local de assignees
  assignees.value = newAssignees
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRelative(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}
</script>
