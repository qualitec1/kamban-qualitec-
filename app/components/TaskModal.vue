<template>
  <BaseModal :model-value="props.modelValue" :title="task?.title ?? 'Tarefa'" size="xl" @update:model-value="onClose">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-6 h-6 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
    </div>

    <div v-else-if="task" class="space-y-6">

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
          <div class="flex items-center gap-2 min-h-[44px] px-1">
            <AvatarStack v-if="assignees.length > 0" :assignees="assignees" />
            <span v-else class="text-sm text-neutral-400 italic">Nenhum responsável</span>
          </div>
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
        <span v-if="task.created_at">Criado em {{ formatDate(task.created_at) }}</span>
        <span v-if="task.updated_at">Atualizado {{ formatRelative(task.updated_at) }}</span>
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
        <BaseButton variant="ghost" @click="onClose">Fechar</BaseButton>
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
import { ref, watch } from 'vue'
import { useTaskDetail } from '~/composables/useTaskDetail'
import { useTaskStatuses } from '~/composables/useTaskStatuses'
import { useTaskPriorities } from '~/composables/useTaskPriorities'
import { useTaskAssignees } from '~/composables/useTaskAssignees'
import { useBoardPermissions } from '~/composables/useBoardPermissions'
import SubtasksSection from '~/components/SubtasksSection.vue'

const props = defineProps<{
  taskId: string
  boardId: string
  modelValue: boolean
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
const { assignees, fetchAssignees } = useTaskAssignees(props.taskId)
const { canEdit: canEditTasks, fetchUserRole } = useBoardPermissions(props.boardId)

const showDeleteConfirm = ref(false)
const deleting = ref(false)

// Draft fields
const draftTitle       = ref('')
const draftDescription = ref('')
const draftStatusId    = ref<string | null>(null)
const draftPriorityId  = ref<string | null>(null)
const draftStartDate   = ref('')
const draftDueDate     = ref('')
const draftBudget      = ref('')

// Flag para controlar se já carregou os dados
const dataLoaded = ref(false)

function syncDrafts() {
  if (!task.value) return
  draftTitle.value       = task.value.title
  draftDescription.value = task.value.description ?? ''
  draftStatusId.value    = task.value.status_id
  draftPriorityId.value  = task.value.priority_id
  draftStartDate.value   = task.value.start_date ?? ''
  draftDueDate.value     = task.value.due_date ?? ''
  draftBudget.value      = task.value.budget != null ? String(task.value.budget).replace('.', ',') : ''
}

watch(task, syncDrafts)

// Função para carregar todos os dados
async function loadAllData() {
  console.log('[TaskModal] Loading all data for task:', props.taskId)
  dataLoaded.value = false
  
  try {
    await Promise.all([
      fetchTask(props.taskId),
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

function onClose() {
  emit('update:modelValue', false)
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
