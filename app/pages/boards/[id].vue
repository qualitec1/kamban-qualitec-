<template>
  <div class="flex flex-col h-full">

    <!-- Board header -->
    <div class="flex items-center justify-between mb-6 shrink-0">
      <div class="min-w-0">
        <h1 class="text-heading-lg font-semibold text-neutral-900 truncate">{{ board?.name ?? '...' }}</h1>
        <p v-if="board?.description" class="text-body-sm text-muted mt-0.5 truncate">{{ board.description }}</p>
      </div>
      <ClientOnly>
        <div class="flex items-center gap-2">
          <ColumnVisibilityMenu :board-id="boardId" />
          <!-- Toggle grupos vazios -->
          <button
            @click="toggleShowEmptyGroups"
            :title="showEmptyGroups ? 'Ocultar grupos vazios' : 'Mostrar grupos vazios'"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium transition-colors',
              showEmptyGroups
                ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            ]"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {{ showEmptyGroups ? 'Ocultar vazios' : 'Mostrar vazios' }}
          </button>
          <BaseButton v-if="canEdit" variant="primary" size="sm" @click="openAddGroup()">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo grupo
          </BaseButton>
        </div>
      </ClientOnly>
    </div>

    <LoadingState v-if="loading" message="Carregando board..." />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <!-- Grupos -->
    <div v-else class="flex-1 overflow-y-auto space-y-4">

      <div
        v-for="group in visibleGroups"
        :key="group.id"
        :data-group-id="group.id"
        :draggable="canEdit"
        class="bg-white border border-neutral-200 rounded-xl transition-all"
        :class="{
          'opacity-40 scale-[0.98]': draggingId === group.id,
          'border-primary-400 border-2': dragOverId === group.id && draggingId !== group.id
        }"
        @dragstart="onDragStart(group.id)"
        @dragover="onDragOver($event, group.id)"
        @drop="onDrop(group.id)"
        @dragend="onDragEnd"
        @touchstart.passive="onTouchStart($event, group.id)"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Cabeçalho do grupo -->
        <div
          class="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 group/header rounded-t-xl overflow-hidden"
          :style="`border-left: 4px solid ${group.color || '#6366f1'}`"
        >
          <!-- Handle de drag (visível no hover) -->
          <div
            v-if="canEdit"
            class="opacity-0 group-hover/header:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 text-muted shrink-0"
            title="Arrastar para reordenar"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
            </svg>
          </div>

          <!-- Botão colapsar -->
          <button
            @click="toggleCollapse(group.id)"
            class="p-0.5 text-muted hover:text-neutral-700 transition-colors rounded"
          >
            <svg
              class="w-4 h-4 transition-transform"
              :class="group.is_collapsed ? '-rotate-90' : ''"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Nome do grupo (editável inline) -->
          <input
            v-if="editingGroupId === group.id"
            :ref="el => { if (el) (el as HTMLInputElement).focus() }"
            :value="group.name"
            @blur="e => saveRename(group.id, (e.target as HTMLInputElement).value)"
            @keydown.enter="e => saveRename(group.id, (e.target as HTMLInputElement).value)"
            @keydown.esc="editingGroupId = null"
            class="flex-1 text-heading-sm font-semibold text-neutral-900 bg-transparent border-b border-primary-400 outline-none"
          />
          <span
            v-else
            class="flex-1 text-heading-sm font-semibold text-neutral-900 cursor-pointer hover:text-primary-600 transition-colors"
            @dblclick="canEdit && (editingGroupId = group.id)"
          >
            {{ group.name }}
          </span>

          <!-- Ações do grupo (visíveis no hover) -->
          <div class="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <!-- Adicionar grupo acima -->
            <button
              v-if="canEdit"
              @click="openAddGroup('before', group.id)"
              class="p-1.5 text-muted hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Adicionar grupo acima"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <!-- Adicionar grupo abaixo -->
            <button
              v-if="canEdit"
              @click="openAddGroup('after', group.id)"
              class="p-1.5 text-muted hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Adicionar grupo abaixo"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <!-- Renomear -->
            <button
              v-if="canEdit"
              @click="editingGroupId = group.id"
              class="p-1.5 text-muted hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Renomear grupo"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <!-- Deletar (só se não for o único grupo) -->
            <button
              v-if="canEdit && groups.length > 1"
              @click="handleDeleteGroup(group.id)"
              class="p-1.5 text-muted hover:text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
              title="Remover grupo"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Conteúdo do grupo (tarefas) -->
        <div v-if="!group.is_collapsed">
          <TaskRow
            v-for="task in tasksByGroup[group.id]"
            :key="task.id"
            :task="task"
          />
          <p
            v-if="!(tasksByGroup[group.id]?.length)"
            class="text-label-sm text-muted italic px-4 py-4"
          >Nenhuma tarefa ainda.</p>

          <!-- Botão Nova tarefa / Input inline de criação rápida (padrão Monday.com) -->
          <div v-if="canEdit" class="border-t border-neutral-100">
            <!-- Input inline — aparece quando creatingInGroup === group.id -->
            <div
              v-if="creatingInGroup === group.id"
              class="flex items-center gap-2 px-4 py-2"
            >
              <svg class="w-3.5 h-3.5 text-neutral-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <input
                :ref="el => { if (el && creatingInGroup === group.id) (el as HTMLInputElement).focus() }"
                v-model="newTaskTitle"
                type="text"
                placeholder="Nome da tarefa..."
                maxlength="500"
                class="flex-1 text-base text-neutral-800 bg-transparent outline-none placeholder:text-neutral-400"
                @keydown.enter="saveNewTask(group.id)"
                @keydown.esc="cancelCreateTask"
                @blur="cancelCreateTask"
              />
              <span class="text-xs text-neutral-300">Enter para salvar</span>
            </div>

            <!-- Botão padrão -->
            <button
              v-else
              type="button"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-label-sm text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
              @click="openCreateTask(group.id)"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nova tarefa
            </button>
          </div>
        </div>
      </div>

      <!-- Aviso quando grupos estão ocultos -->
      <div v-if="!showEmptyGroups && groups.length > 0 && visibleGroups.length === 0" class="text-center py-8">
        <p class="text-body-sm text-muted mb-2">Todos os grupos estão vazios e estão ocultos.</p>
        <button @click="toggleShowEmptyGroups" class="text-label-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          Mostrar grupos vazios
        </button>
      </div>

      <!-- Botão adicionar grupo no final (quando não há grupos) -->
      <div v-if="groups.length === 0 && !loading" class="text-center py-12">
        <p class="text-body text-muted mb-3">Nenhum grupo criado.</p>
        <BaseButton v-if="canEdit" variant="primary" @click="openAddGroup()">
          Criar primeiro grupo
        </BaseButton>
      </div>

      <!-- Botão flutuante adicionar grupo no final da lista -->
      <button
        v-if="canEdit && visibleGroups.length > 0"
        @click="openAddGroup()"
        class="w-full flex items-center gap-2 px-4 py-3 text-label-sm text-muted hover:text-primary-600 hover:bg-primary-50 rounded-xl border border-dashed border-neutral-200 hover:border-primary-300 transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Adicionar grupo
      </button>
    </div>

    <!-- Modal novo grupo -->
    <BaseModal v-model="showAddGroupModal" title="Novo grupo" size="sm">
      <form @submit.prevent="handleAddGroup" class="space-y-4">
        <BaseInput
          v-model="newGroupName"
          label="Nome do grupo"
          placeholder="Ex: Em andamento, Concluído, Backlog"
          required
          :error="addGroupError"
          autofocus
        />

        <div>
          <label class="text-label-md text-default block mb-2">Cor</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in groupColors"
              :key="color"
              type="button"
              @click="newGroupColor = color"
              class="w-7 h-7 rounded-full border-2 transition-all"
              :style="`background: ${color}`"
              :class="newGroupColor === color ? 'border-neutral-900 scale-110' : 'border-transparent'"
            />
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <BaseButton type="button" variant="ghost" @click="showAddGroupModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="addingGroup">
            {{ addingGroup ? 'Criando...' : 'Criar grupo' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useNuxtApp } from '#imports'
import { useTaskGroups } from '~/composables/useTaskGroups'
import { useBoards } from '~/composables/useBoards'
import { useAuth } from '~/composables/useAuth'
import { useTasks } from '~/composables/useTasks'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tables } from '#shared/types/database'

type Board = Tables<'boards'>
type TaskRow = Pick<Tables<'tasks'>, 'id' | 'title' | 'group_id' | 'board_id' | 'status_id' | 'priority_id' | 'due_date' | 'start_date' | 'description' | 'budget' | 'updated_at'>

const route = useRoute()
const boardId = route.params.id as string

const { groups, loading, error, fetchGroups, addGroup, renameGroup, deleteGroup, toggleCollapse, reorderGroups } = useTaskGroups()
const { boards, fetchBoards } = useBoards()
const { isMaster, user } = useAuth()
const { $supabase } = useNuxtApp() as unknown as { $supabase: SupabaseClient }

// Busca o access_role do usuário neste board específico
const boardAccessRole = ref<string | null>(null)

async function fetchBoardAccessRole() {
  if (!user.value) return
  if (isMaster.value) { boardAccessRole.value = 'owner'; return }
  const { data } = await $supabase
    .from('board_members')
    .select('access_role')
    .eq('board_id', boardId)
    .eq('user_id', user.value.id)
    .single()
  boardAccessRole.value = data?.access_role ?? null
}

// canEdit: master global OU owner/editor no board específico
const canEdit = computed(() =>
  isMaster.value ||
  boardAccessRole.value === 'owner' ||
  boardAccessRole.value === 'editor'
)
const board = computed<Board | undefined>(() => boards.value.find(b => b.id === boardId))

// Preferência: mostrar grupos vazios (persiste em localStorage)
const showEmptyGroups = ref(true)
const storageKey = `board-show-empty-${boardId}`

function loadShowEmptyPref() {
  if (import.meta.client) {
    const saved = localStorage.getItem(storageKey)
    if (saved !== null) showEmptyGroups.value = saved === 'true'
  }
}

function toggleShowEmptyGroups() {
  showEmptyGroups.value = !showEmptyGroups.value
  if (import.meta.client) {
    localStorage.setItem(storageKey, String(showEmptyGroups.value))
  }
}

// Grupos filtrados: quando showEmptyGroups=false, oculta grupos sem tarefas
const tasksByGroup = ref<Record<string, TaskRow[]>>({})
const taskCountByGroup = ref<Record<string, number>>({})

async function fetchTasksForGroup(groupId: string) {
  const { data, error: fetchError } = await $supabase
    .from('tasks')
    .select('id, title, group_id, board_id, status_id, priority_id, due_date, start_date, description, budget, updated_at')
    .eq('group_id', groupId)

  if (!fetchError && data) {
    tasksByGroup.value[groupId] = data as TaskRow[]
    taskCountByGroup.value[groupId] = data.length
  } else {
    tasksByGroup.value[groupId] = []
    taskCountByGroup.value[groupId] = 0
  }
}

const visibleGroups = computed(() => {
  if (showEmptyGroups.value) return groups.value
  return groups.value.filter(g => (taskCountByGroup.value[g.id] ?? 0) > 0)
})

const editingGroupId = ref<string | null>(null)
const showAddGroupModal = ref(false)
const newGroupName = ref('')
const newGroupColor = ref('#6366f1')
const addGroupError = ref('')
const addingGroup = ref(false)

// Drag and drop de grupos
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

function onDragStart(groupId: string) {
  draggingId.value = groupId
}

function onDragOver(e: DragEvent, groupId: string) {
  e.preventDefault()
  dragOverId.value = groupId
}

function onDrop(targetId: string) {
  if (!draggingId.value || draggingId.value === targetId) {
    draggingId.value = null
    dragOverId.value = null
    return
  }

  const ids = groups.value.map(g => g.id)
  const fromIdx = ids.indexOf(draggingId.value)
  const toIdx = ids.indexOf(targetId)

  if (fromIdx === -1 || toIdx === -1) return

  // Reordenar array
  const newIds = [...ids]
  newIds.splice(fromIdx, 1)
  newIds.splice(toIdx, 0, draggingId.value)

  draggingId.value = null
  dragOverId.value = null

  reorderGroups(boardId, newIds)
}

function onDragEnd() {
  draggingId.value = null
  dragOverId.value = null
}

// Touch drag and drop
let touchDraggingId: string | null = null
let touchStartY = 0

function onTouchStart(e: TouchEvent, groupId: string) {
  touchDraggingId = groupId
  touchStartY = e.touches[0]!.clientY
  draggingId.value = groupId
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (!touchDraggingId) return
  const touch = e.touches[0]!
  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  const groupEl = el?.closest('[data-group-id]') as HTMLElement | null
  if (groupEl) {
    dragOverId.value = groupEl.dataset.groupId ?? null
  }
}

function onTouchEnd() {
  if (touchDraggingId && dragOverId.value && touchDraggingId !== dragOverId.value) {
    onDrop(dragOverId.value)
  }
  touchDraggingId = null
  draggingId.value = null
  dragOverId.value = null
}

// Contexto de posição para novo grupo
const addPosition = ref<'before' | 'after' | undefined>(undefined)
const addRefGroupId = ref<string | undefined>(undefined)

const groupColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#64748b'
]

function openAddGroup(position?: 'before' | 'after', refGroupId?: string) {
  addPosition.value = position
  addRefGroupId.value = refGroupId
  newGroupName.value = ''
  newGroupColor.value = '#6366f1'
  addGroupError.value = ''
  showAddGroupModal.value = true
}

async function handleAddGroup() {
  if (!newGroupName.value.trim()) {
    addGroupError.value = 'Nome obrigatório.'
    return
  }
  addingGroup.value = true
  addGroupError.value = ''

  const result = await addGroup({
    boardId,
    name: newGroupName.value,
    color: newGroupColor.value,
    position: addPosition.value,
    refGroupId: addRefGroupId.value
  })

  addingGroup.value = false
  if (result) {
    showAddGroupModal.value = false
  } else {
    addGroupError.value = 'Erro ao criar grupo. Tente novamente.'
  }
}

async function saveRename(groupId: string, name: string) {
  editingGroupId.value = null
  if (!name.trim()) return
  await renameGroup(groupId, name)
}

async function handleDeleteGroup(groupId: string) {
  await deleteGroup(groupId, boardId)
}

// Criação de tarefa — input inline
const creatingInGroup = ref<string | null>(null)
const newTaskTitle = ref('')
const { createTask } = useTasks()

function openCreateTask(groupId: string) {
  newTaskTitle.value = ''
  creatingInGroup.value = groupId
}

function cancelCreateTask() {
  creatingInGroup.value = null
  newTaskTitle.value = ''
}

async function saveNewTask(groupId: string) {
  const title = newTaskTitle.value.trim()
  creatingInGroup.value = null
  newTaskTitle.value = ''
  if (!title) return
  try {
    const task = await createTask({ boardId, groupId, title })
    if (task) {
      if (!tasksByGroup.value[groupId]) tasksByGroup.value[groupId] = []
      tasksByGroup.value[groupId].push(task)
      taskCountByGroup.value[groupId] = (taskCountByGroup.value[groupId] ?? 0) + 1
    }
  } catch { /* silently fail */ }
}

async function load() {
  await Promise.all([fetchGroups(boardId), fetchBoards(), fetchBoardAccessRole()])
  await Promise.all(groups.value.map(g => fetchTasksForGroup(g.id)))
}

onMounted(async () => {
  loadShowEmptyPref()
  await Promise.all([fetchGroups(boardId), fetchBoards(), fetchBoardAccessRole()])
  await Promise.all(groups.value.map(g => fetchTasksForGroup(g.id)))
})
</script>
