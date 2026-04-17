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
          <!-- Toggle view mode -->
          <div class="flex items-center bg-neutral-100 rounded-lg p-0.5">
            <button
              @click="viewMode = 'horizontal'"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-sm font-medium transition-all',
                viewMode === 'horizontal'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              ]"
              title="Visualização horizontal (tabela)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Tabela
            </button>
            <button
              @click="viewMode = 'vertical'"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-sm font-medium transition-all',
                viewMode === 'vertical'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              ]"
              title="Visualização vertical (Kanban)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban
            </button>
          </div>
          <ColumnVisibilityMenu v-if="viewMode === 'horizontal'" :board-id="boardId" />
          <!-- Toggle tarefas arquivadas -->
          <button
            @click="toggleShowArchived"
            :title="showArchived ? 'Mostrar tarefas ativas' : 'Mostrar tarefas arquivadas'"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium transition-colors',
              showArchived
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            ]"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {{ showArchived ? 'Arquivadas' : 'Arquivo' }}
          </button>
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
          <!-- Botão excluir quadro -->
          <button
            v-if="canEdit"
            @click="showDeleteBoardModal = true"
            title="Excluir quadro"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir
          </button>
        </div>
      </ClientOnly>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <!-- Visualização horizontal (tabela) -->
    <div v-else-if="viewMode === 'horizontal'" class="flex-1 overflow-y-auto space-y-4">

      <div
        v-for="group in visibleGroups"
        :key="group.id"
        :data-group-id="group.id"
        class="bg-white border border-neutral-200 rounded-xl transition-all"
        :class="{
          'opacity-40 scale-[0.98]': draggingId === group.id,
          'border-primary-400 border-2': dragOverGroupId === group.id && draggingTaskId
        }"
        @dragover.prevent="onGroupDragOver($event, group.id)"
        @drop="onGroupDrop(group.id)"
      >
        <!-- Cabeçalho do grupo -->
        <div
          class="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 group/header rounded-t-xl overflow-hidden"
          :style="`border-left: 4px solid ${group.color || '#6366f1'}`"
        >
          <!-- Handle de drag (sempre visível com opacidade reduzida) -->
          <div
            v-if="canEdit"
            :draggable="true"
            class="opacity-30 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 text-muted shrink-0"
            title="Arrastar para reordenar grupo"
            @dragstart="onDragStart(group.id)"
            @dragend="onDragEnd"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
            </svg>
          </div>

          <!-- Botão colapsar -->
          <button
            @click="toggleCollapse(group.id)"
            class="p-0.5 text-muted hover:text-neutral-700 motion-interactive rounded active-press"
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
            <!-- Compartilhar grupo por e-mail -->
            <button
              v-if="canEdit"
              @click="openShareGroupModal(group.id)"
              class="p-1.5 text-muted hover:text-primary-600 rounded-lg hover:bg-primary-50 motion-interactive active-press"
              title="Compartilhar grupo por e-mail"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
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
        <Transition name="expand">
          <div 
            v-if="!group.is_collapsed"
            @dragover.prevent="onGroupDragOver($event, group.id)"
            @drop="onGroupDrop(group.id)"
          >
          <!-- Cabeçalho das colunas (estilo Monday.com) -->
          <TaskGroupHeader :board-id="boardId" />
          
          <TransitionGroup name="list" tag="div">
            <div
              v-for="task in tasksByGroup[group.id]"
              :key="task.id"
              :data-task-id="task.id"
              class="relative motion-reorder"
              :class="{
                'dragging': draggingTaskId === task.id,
                'border-t-2 border-primary-400': dragOverTaskId === task.id && draggingTaskId !== task.id
              }"
              @dragover.prevent="onTaskDragOver($event, task.id)"
              @drop="onTaskDrop(task.id, group.id)"
            >
              <TaskRow
                :task="task"
                :can-edit="canEdit"
                @task-deleted="handleTaskDeleted"
                @drag-start="onTaskDragStart(task.id)"
                @drag-end="onTaskDragEnd"
              />
            </div>
          </TransitionGroup>
          <div
            v-if="!(tasksByGroup[group.id]?.length)"
            class="px-4 py-8 text-center transition-colors"
            :class="{
              'bg-primary-50 border-2 border-dashed border-primary-300': dragOverGroupId === group.id && draggingTaskId
            }"
          >
            <p class="text-label-sm text-muted italic">Nenhuma tarefa ainda.</p>
            <p v-if="dragOverGroupId === group.id && draggingTaskId" class="text-label-xs text-primary-600 mt-1">
              Solte aqui para mover
            </p>
          </div>

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
              class="w-full flex items-center gap-2 px-4 py-2.5 text-label-sm text-muted hover:text-primary-600 hover:bg-primary-50 motion-interactive active-press"
              @click="openCreateTask(group.id)"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nova tarefa
            </button>
          </div>
        </div>
        </Transition>
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

    <!-- Visualização vertical (Kanban) -->
    <KanbanView
      v-else-if="viewMode === 'vertical'"
      :visible-groups="visibleGroups"
      :tasks-by-group="tasksByGroup"
      :statuses="statuses"
      :priorities="priorities"
      :can-edit="canEdit"
      @open-task="openTaskModal"
      @add-group="openAddGroup()"
      @create-task="handleCreateTaskFromKanban"
      @move-task="handleMoveTaskInKanban"
    />

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

    <!-- Modal compartilhar grupo -->
    <BaseModal v-model="showShareGroupModal" title="Compartilhar grupo por e-mail" size="md">
      <div class="space-y-4">
        <p class="text-body-sm text-muted">
          Selecione os membros que receberão um e-mail com as tarefas deste grupo.
        </p>

        <!-- Lista de membros do board -->
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <label
            v-for="member in boardMembers"
            :key="member.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer motion-interactive"
          >
            <input
              type="checkbox"
              :value="member.id"
              v-model="selectedMembers"
              class="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <Avatar :profile="member" size="sm" />
            <div class="flex-1 min-w-0">
              <p class="text-label-sm text-default truncate">{{ member.full_name || member.email }}</p>
              <p class="text-label-xs text-muted truncate">{{ member.email }}</p>
            </div>
          </label>

          <div v-if="!boardMembers.length" class="text-center py-8">
            <p class="text-body-sm text-muted">Nenhum membro encontrado</p>
          </div>
        </div>

        <!-- Mensagem opcional -->
        <div>
          <label class="text-label-md text-default block mb-2">Mensagem (opcional)</label>
          <textarea
            v-model="shareMessage"
            placeholder="Adicione uma mensagem personalizada..."
            rows="3"
            class="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-body-sm"
            maxlength="500"
          />
        </div>

        <div v-if="shareError" class="text-label-sm text-danger-600">
          {{ shareError }}
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <BaseButton type="button" variant="ghost" @click="showShareGroupModal = false">
            Cancelar
          </BaseButton>
          <BaseButton 
            type="button" 
            variant="primary" 
            :disabled="!selectedMembers.length || sharingGroup"
            @click="handleShareGroup"
          >
            {{ sharingGroup ? 'Enviando...' : `Enviar para ${selectedMembers.length} ${selectedMembers.length === 1 ? 'membro' : 'membros'}` }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal confirmação de exclusão do quadro -->
    <BaseModal v-model="showDeleteBoardModal" title="Excluir quadro?" size="sm" :close-on-backdrop="false">
      <div class="space-y-4">
        <p class="text-sm text-neutral-600">
          Tem certeza que deseja excluir o quadro <span class="font-semibold">"{{ board?.name }}"</span>?
        </p>
        <p class="text-sm text-danger-600 font-medium">
          Esta ação não pode ser desfeita. Todos os grupos, tarefas e subtarefas serão permanentemente removidos.
        </p>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="showDeleteBoardModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="confirmDeleteBoard" :disabled="deletingBoard">
          {{ deletingBoard ? 'Excluindo...' : 'Excluir quadro' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Task Modal -->
    <TaskModal
      v-if="selectedTaskId"
      :key="selectedTaskId"
      v-model="showTaskModal"
      :task-id="selectedTaskId"
      :board-id="boardId"
      @updated="handleTaskUpdated"
      @deleted="handleTaskDeletedFromModal"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from '#imports'
import { useTaskGroups } from '~/composables/useTaskGroups'
import { useBoardData } from '~/composables/useBoardData'
import { useTasks, type TaskRow } from '~/composables/useTasks'
import { useTaskStatuses } from '~/composables/useTaskStatuses'
import { useTaskPriorities } from '~/composables/useTaskPriorities'

const route = useRoute()
const boardId = route.params.id as string

console.log('[boards/[id].vue] Route params:', route.params)
console.log('[boards/[id].vue] Board ID:', boardId)

// Validar se o ID é válido (não é o literal "[id]")
if (!boardId || boardId === '[id]' || boardId.includes('[')) {
  console.error('[boards/[id].vue] Invalid board ID, redirecting to /boards')
  navigateTo('/boards')
}

// Usar composable otimizado para carregar dados
const {
  board,
  groups,
  tasksByGroup,
  canEdit,
  loading,
  error,
  fetchAll,
  invalidateCache,
  refreshGroupTasks
} = useBoardData(boardId)

// Composables para mutações
const { addGroup, renameGroup, deleteGroup, toggleCollapse, reorderGroups } = useTaskGroups()
const { deleteBoard } = useBoards()

// Carregar status e prioridades para exibir cores corretas
const { statuses, fetchStatuses } = useTaskStatuses(boardId)
const { priorities, fetchPriorities } = useTaskPriorities(boardId)

// Helper para obter status por ID
const getStatusById = (statusId: string | null) => {
  if (!statusId) return null
  return statuses.value.find(s => s.id === statusId)
}

// Helper para obter prioridade por ID
const getPriorityById = (priorityId: string | null) => {
  if (!priorityId) return null
  return priorities.value.find(p => p.id === priorityId)
}

// Preferência: modo de visualização (horizontal/vertical)
const viewMode = ref<'horizontal' | 'vertical'>('horizontal')
const viewModeStorageKey = `board-view-mode-${boardId}`

// Preferência: mostrar grupos vazios (persiste em localStorage)
const showEmptyGroups = ref(true)
const storageKey = `board-show-empty-${boardId}`

// Preferência: mostrar tarefas arquivadas
const showArchived = ref(false)
const archivedStorageKey = `board-show-archived-${boardId}`

function loadShowEmptyPref() {
  if (import.meta.client) {
    const saved = localStorage.getItem(storageKey)
    if (saved !== null) showEmptyGroups.value = saved === 'true'
    
    const archivedSaved = localStorage.getItem(archivedStorageKey)
    if (archivedSaved !== null) showArchived.value = archivedSaved === 'true'
    
    const viewModeSaved = localStorage.getItem(viewModeStorageKey)
    if (viewModeSaved !== null) viewMode.value = viewModeSaved as 'horizontal' | 'vertical'
  }
}

// Watch view mode changes and save to localStorage
watch(viewMode, (newMode) => {
  if (import.meta.client) {
    localStorage.setItem(viewModeStorageKey, newMode)
  }
})

function toggleShowEmptyGroups() {
  showEmptyGroups.value = !showEmptyGroups.value
  if (import.meta.client) {
    localStorage.setItem(storageKey, String(showEmptyGroups.value))
  }
}

function toggleShowArchived() {
  showArchived.value = !showArchived.value
  if (import.meta.client) {
    localStorage.setItem(archivedStorageKey, String(showArchived.value))
  }
  // Recarregar com novo filtro
  fetchAll(showArchived.value)
}

// Grupos filtrados: quando showEmptyGroups=false, oculta grupos sem tarefas
const taskCountByGroup = computed(() => {
  const counts: Record<string, number> = {}
  for (const groupId in tasksByGroup.value) {
    counts[groupId] = tasksByGroup.value[groupId]?.length ?? 0
  }
  return counts
})

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

// Drag and drop de tarefas
const draggingTaskId = ref<string | null>(null)
const dragOverTaskId = ref<string | null>(null)
const dragOverGroupId = ref<string | null>(null)

function onDragStart(groupId: string) {
  console.log('[Group Drag] Starting drag for group:', groupId)
  draggingId.value = groupId
}

function onDragOver(e: DragEvent, groupId: string) {
  e.preventDefault()
  console.log('[Group Drag] Dragging over group:', groupId)
  dragOverId.value = groupId
}

function onDrop(targetId: string) {
  console.log('[Group Drag] Dropped on group:', targetId, 'dragging:', draggingId.value)
  
  if (!draggingId.value || draggingId.value === targetId) {
    draggingId.value = null
    dragOverId.value = null
    return
  }

  const ids = groups.value.map(g => g.id)
  const fromIdx = ids.indexOf(draggingId.value)
  const toIdx = ids.indexOf(targetId)

  console.log('[Group Drag] Reordering from index', fromIdx, 'to', toIdx)

  if (fromIdx === -1 || toIdx === -1) return

  // Reordenar array localmente (optimistic update)
  const newIds = [...ids]
  newIds.splice(fromIdx, 1)
  newIds.splice(toIdx, 0, draggingId.value)

  console.log('[Group Drag] New order:', newIds)

  // Atualizar o array local imediatamente
  const reordered = newIds
    .map((id, idx) => {
      const g = groups.value.find(g => g.id === id)
      return g ? { ...g, sort_order: idx } : null
    })
    .filter(Boolean) as typeof groups.value
  
  groups.value = reordered

  draggingId.value = null
  dragOverId.value = null

  // Persistir no backend
  reorderGroups(boardId, newIds)
}

function onDragEnd() {
  console.log('[Group Drag] Drag ended')
  draggingId.value = null
  dragOverId.value = null
}

// Task drag and drop handlers
function onTaskDragStart(taskId: string) {
  draggingTaskId.value = taskId
}

function onTaskDragOver(e: DragEvent, taskId: string) {
  e.preventDefault()
  dragOverTaskId.value = taskId
  dragOverGroupId.value = null
}

function onGroupDragOver(e: DragEvent, groupId: string) {
  e.preventDefault()
  if (draggingTaskId.value) {
    dragOverGroupId.value = groupId
    dragOverTaskId.value = null
  } else if (draggingId.value) {
    dragOverId.value = groupId
  }
}

async function onGroupDrop(groupId: string) {
  if (draggingTaskId.value) {
    // Task dropped on group (for empty groups or group header)
    await handleTaskDropOnGroup(groupId)
  } else if (draggingId.value) {
    // Group reorder
    onDrop(groupId)
  }
  dragOverGroupId.value = null
}

async function onTaskDrop(targetTaskId: string, groupId: string) {
  if (!draggingTaskId.value || draggingTaskId.value === targetTaskId) {
    draggingTaskId.value = null
    dragOverTaskId.value = null
    return
  }

  // Find which group the dragged task currently belongs to
  let sourceGroupId: string | null = null
  let draggedTask: TaskRow | null = null
  
  for (const gId in tasksByGroup.value) {
    const tasks = tasksByGroup.value[gId]
    if (!tasks) continue
    const task = tasks.find(t => t.id === draggingTaskId.value)
    if (task) {
      sourceGroupId = gId
      draggedTask = task
      break
    }
  }

  if (!sourceGroupId || !draggedTask) {
    draggingTaskId.value = null
    dragOverTaskId.value = null
    return
  }

  // Check if this is a cross-group move
  if (sourceGroupId !== groupId) {
    // Cross-group move
    await handleCrossGroupMove(draggedTask, sourceGroupId, groupId)
  } else {
    // Same group reorder
    await handleSameGroupReorder(groupId, targetTaskId)
  }

  draggingTaskId.value = null
  dragOverTaskId.value = null
}

async function handleSameGroupReorder(groupId: string, targetTaskId: string) {
  console.log('[handleSameGroupReorder] Starting reorder:', { groupId, targetTaskId, draggingTaskId: draggingTaskId.value })
  
  const tasks = tasksByGroup.value[groupId]
  if (!tasks) {
    console.error('[handleSameGroupReorder] No tasks found for group')
    alert('Erro: Nenhuma tarefa encontrada no grupo')
    return
  }

  const fromIdx = tasks.findIndex(t => t.id === draggingTaskId.value)
  const toIdx = tasks.findIndex(t => t.id === targetTaskId)

  console.log('[handleSameGroupReorder] Indices:', { fromIdx, toIdx })

  if (fromIdx === -1 || toIdx === -1) {
    console.error('[handleSameGroupReorder] Invalid indices')
    alert('Erro: Índices inválidos')
    return
  }

  // Reordenar array localmente (otimistic update)
  const reordered = [...tasks]
  const [movedTask] = reordered.splice(fromIdx, 1)
  if (!movedTask) {
    console.error('[handleSameGroupReorder] No task to move')
    alert('Erro: Tarefa não encontrada')
    return
  }
  
  reordered.splice(toIdx, 0, movedTask)
  
  console.log('[handleSameGroupReorder] Reordered tasks:', reordered.map(t => t.title))
  
  tasksByGroup.value[groupId] = reordered

  // Persistir no backend
  const { reorderTasks } = useTasks()
  const taskIds = reordered.map(t => t.id)
  
  console.log('[handleSameGroupReorder] Calling backend with task IDs:', taskIds)
  
  try {
    const success = await reorderTasks({ groupId, taskIds })
    
    console.log('[handleSameGroupReorder] Backend result:', success)
    
    if (!success) {
      console.error('[handleSameGroupReorder] Backend returned false - refreshing tasks')
      alert('Erro ao reordenar tarefas. Verifique o console.')
      // Rollback em caso de erro
      await refreshGroupTasks(groupId, showArchived.value)
    } else {
      console.log('[handleSameGroupReorder] Success!')
    }
  } catch (error) {
    console.error('[handleSameGroupReorder] Exception:', error)
    alert('Erro ao reordenar tarefas: ' + (error as Error).message)
    await refreshGroupTasks(groupId, showArchived.value)
  }
}

async function handleCrossGroupMove(task: TaskRow, sourceGroupId: string, targetGroupId: string) {
  // Save original state for rollback
  const originalSourceTasks = [...(tasksByGroup.value[sourceGroupId] || [])]
  const originalTargetTasks = [...(tasksByGroup.value[targetGroupId] || [])]

  // Optimistic update: remove from source
  const sourceTasks = tasksByGroup.value[sourceGroupId]
  if (sourceTasks) {
    const index = sourceTasks.findIndex(t => t.id === task.id)
    if (index !== -1) {
      sourceTasks.splice(index, 1)
    }
  }

  // Optimistic update: add to target
  const targetTasks = tasksByGroup.value[targetGroupId]
  if (targetTasks) {
    const updatedTask = { ...task, group_id: targetGroupId }
    targetTasks.push(updatedTask)
  } else {
    tasksByGroup.value[targetGroupId] = [{ ...task, group_id: targetGroupId }]
  }

  // Call backend API
  const { moveTaskToGroup } = useTasks()
  
  console.log('Moving task:', {
    taskId: task.id,
    sourceGroupId,
    targetGroupId
  })
  
  const success = await moveTaskToGroup({
    taskId: task.id,
    sourceGroupId,
    targetGroupId
  })

  console.log('Move result:', success)

  if (success) {
    // Refresh both groups to sync with backend
    await Promise.all([
      refreshGroupTasks(sourceGroupId, showArchived.value),
      refreshGroupTasks(targetGroupId, showArchived.value)
    ])
  } else {
    // Rollback on error
    tasksByGroup.value[sourceGroupId] = originalSourceTasks
    tasksByGroup.value[targetGroupId] = originalTargetTasks
    
    // Show error message
    console.error('Failed to move task between groups')
    alert('Erro ao mover tarefa entre grupos. Verifique o console.')
  }
}

function onTaskDragEnd() {
  draggingTaskId.value = null
  dragOverTaskId.value = null
  dragOverGroupId.value = null
}

async function handleTaskDropOnGroup(targetGroupId: string) {
  if (!draggingTaskId.value) return

  // Find which group the dragged task currently belongs to
  let sourceGroupId: string | null = null
  let draggedTask: TaskRow | null = null
  
  for (const gId in tasksByGroup.value) {
    const tasks = tasksByGroup.value[gId]
    if (!tasks) continue
    const task = tasks.find(t => t.id === draggingTaskId.value)
    if (task) {
      sourceGroupId = gId
      draggedTask = task
      break
    }
  }

  if (!sourceGroupId || !draggedTask) {
    draggingTaskId.value = null
    return
  }

  // Only handle cross-group moves here
  if (sourceGroupId !== targetGroupId) {
    await handleCrossGroupMove(draggedTask, sourceGroupId, targetGroupId)
  }

  draggingTaskId.value = null
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
    // Invalidar cache e recarregar
    invalidateCache()
    await fetchAll(showArchived.value)
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
  const success = await deleteGroup(groupId, boardId)
  if (success) {
    invalidateCache()
    await fetchAll(showArchived.value)
  }
}

// Criação de tarefa — input inline
const creatingInGroup = ref<string | null>(null)
const newTaskTitle = ref('')
const { createTask } = useTasks()

// Compartilhar grupo por e-mail
const showShareGroupModal = ref(false)
const selectedGroupId = ref<string | null>(null)
const selectedMembers = ref<string[]>([])
const shareMessage = ref('')
const sharingGroup = ref(false)
const shareError = ref('')
const boardMembers = ref<Array<{
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}>>([])
const boardMembersComposable = useBoardMembers()

// Excluir quadro
const showDeleteBoardModal = ref(false)
const deletingBoard = ref(false)

// Task Modal
const showTaskModal = ref(false)
const selectedTaskId = ref<string | null>(null)

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
      // Atualizar tarefas do grupo
      await refreshGroupTasks(groupId, showArchived.value)
    }
  } catch { /* silently fail */ }
}

async function handleCreateTaskFromKanban({ groupId, title }: { groupId: string; title: string }) {
  try {
    const task = await createTask({ boardId, groupId, title })
    if (task) {
      // Atualizar tarefas do grupo
      await refreshGroupTasks(groupId, showArchived.value)
    }
  } catch { /* silently fail */ }
}

async function handleMoveTaskInKanban({ taskId, sourceGroupId, targetGroupId }: { taskId: string; sourceGroupId: string; targetGroupId: string }) {
  // Encontrar a tarefa
  const sourceTasks = tasksByGroup.value[sourceGroupId]
  if (!sourceTasks) return
  
  const task = sourceTasks.find(t => t.id === taskId)
  if (!task) return
  
  // Usar a função existente de cross-group move
  await handleCrossGroupMove(task, sourceGroupId, targetGroupId)
}

function handleTaskDeleted(taskId: string) {
  // Remove a tarefa de todos os grupos localmente
  for (const groupId in tasksByGroup.value) {
    const tasks = tasksByGroup.value[groupId]
    if (!tasks) continue
    const index = tasks.findIndex(t => t.id === taskId)
    if (index !== -1) {
      tasks.splice(index, 1)
      break
    }
  }
}

async function openShareGroupModal(groupId: string) {
  selectedGroupId.value = groupId
  selectedMembers.value = []
  shareMessage.value = ''
  shareError.value = ''
  sharingGroup.value = false
  
  // Fetch board members
  await boardMembersComposable.fetchMembers(boardId)
  boardMembers.value = boardMembersComposable.members.value.map(m => ({
    id: m.user_id,
    full_name: m.profile?.full_name || null,
    email: m.profile?.email || '',
    avatar_url: m.profile?.avatar_url || null
  }))
  
  showShareGroupModal.value = true
}

async function handleShareGroup() {
  if (!selectedGroupId.value || selectedMembers.value.length === 0) {
    shareError.value = 'Selecione pelo menos um membro'
    return
  }

  sharingGroup.value = true
  shareError.value = ''

  try {
    const supabase = useNuxtApp().$supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      shareError.value = 'Sessão expirada. Faça login novamente.'
      sharingGroup.value = false
      return
    }

    const response = await $fetch('/api/groups/share', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: {
        groupId: selectedGroupId.value,
        memberIds: selectedMembers.value,
        message: shareMessage.value.trim() || undefined
      }
    })

    if (response.success) {
      showShareGroupModal.value = false
      // Show success toast (you can add a toast notification system later)
      console.log('[Share Group] Success:', response.message)
    }
  } catch (error: any) {
    console.error('[Share Group] Error:', error)
    console.error('[Share Group] Error details:', {
      status: error.status,
      statusCode: error.statusCode,
      data: error.data,
      message: error.message
    })
    
    // Extrair mensagem de erro mais específica
    let errorMessage = 'Erro ao compartilhar grupo. Tente novamente.'
    
    if (error.data?.message) {
      errorMessage = error.data.message
    } else if (error.statusCode === 500) {
      errorMessage = 'Erro no servidor. Verifique a configuração do Supabase.'
    } else if (error.statusCode === 403) {
      errorMessage = 'Você não tem permissão para compartilhar este grupo.'
    } else if (error.statusCode === 401) {
      errorMessage = 'Sessão expirada. Faça login novamente.'
    }
    
    shareError.value = errorMessage
  } finally {
    sharingGroup.value = false
  }
}

async function confirmDeleteBoard() {
  if (!board.value || deletingBoard.value) return
  
  deletingBoard.value = true
  
  try {
    const success = await deleteBoard(boardId)
    
    if (success) {
      // Redirecionar para lista de quadros
      await navigateTo('/boards')
    } else {
      alert('Erro ao excluir quadro. Tente novamente.')
    }
  } catch (error) {
    console.error('[Delete Board] Error:', error)
    alert('Erro ao excluir quadro. Verifique o console.')
  } finally {
    deletingBoard.value = false
    showDeleteBoardModal.value = false
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function openTaskModal(taskId: string) {
  console.log('[openTaskModal] Opening task:', taskId)
  selectedTaskId.value = taskId
  showTaskModal.value = true
}

function handleTaskUpdated(patch: { field: string; value: unknown }) {
  // Atualizar a tarefa localmente
  if (!selectedTaskId.value) return
  
  for (const groupId in tasksByGroup.value) {
    const tasks = tasksByGroup.value[groupId]
    if (!tasks) continue
    const task = tasks.find(t => t.id === selectedTaskId.value)
    if (task) {
      (task as any)[patch.field] = patch.value
      break
    }
  }
}

function handleTaskDeletedFromModal(taskId: string) {
  // Remove a tarefa de todos os grupos localmente
  for (const groupId in tasksByGroup.value) {
    const tasks = tasksByGroup.value[groupId]
    if (!tasks) continue
    const index = tasks.findIndex(t => t.id === taskId)
    if (index !== -1) {
      tasks.splice(index, 1)
      break
    }
  }
  showTaskModal.value = false
  selectedTaskId.value = null
}

async function load() {
  await fetchAll(showArchived.value)
}

onMounted(async () => {
  loadShowEmptyPref()
  await Promise.all([
    fetchAll(showArchived.value),
    fetchStatuses(),
    fetchPriorities()
  ])
  
  // Check if there's a task query param to open automatically
  if (route.query.task) {
    const taskId = route.query.task as string
    // TODO: Open task modal with taskId
    // This will be implemented when TaskModal is integrated with the board page
    console.log('[Board] Auto-opening task:', taskId)
  }
})
</script>

<style scoped>
/* Transição de expansão para grupos colapsados */
.expand-enter-active,
.expand-leave-active {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}

/* Transição de lista para reordenação */
.list-move {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-active,
.list-leave-active {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Estado de drag */
.dragging {
  opacity: 0.4;
  transform: scale(0.98);
}
</style>
