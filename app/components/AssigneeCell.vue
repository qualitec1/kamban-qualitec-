<template>
  <div class="relative" ref="rootRef">
    <!-- Clickable cell (apenas se tiver permissão) -->
    <button
      v-if="canEditAssignees"
      type="button"
      class="flex items-center h-full min-h-[44px] w-full justify-center cursor-pointer hover:bg-neutral-50 transition-colors"
      @click="toggleDropdown"
      :disabled="loading"
      :title="assignees.length > 0 ? `${assignees.length} responsável(is)` : 'Adicionar responsável'"
    >
      <!-- Loading skeleton -->
      <div v-if="loading" class="w-6 h-6 rounded-full bg-neutral-100 animate-pulse" />

      <!-- Assignees -->
      <AvatarStack v-else-if="assignees.length > 0" :assignees="assignees" />

      <!-- Empty state (no assignees or error) -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5 text-neutral-300"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437.695Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Read-only view (sem permissão de edição) -->
    <div
      v-else
      class="flex items-center h-full min-h-[44px] w-full justify-center cursor-default"
      :title="assignees.length > 0 ? `${assignees.length} responsável(is)` : 'Sem responsável'"
    >
      <!-- Loading skeleton -->
      <div v-if="loading" class="w-6 h-6 rounded-full bg-neutral-100 animate-pulse" />

      <!-- Assignees -->
      <AvatarStack v-else-if="assignees.length > 0" :assignees="assignees" />

      <!-- Empty state (no assignees or error) -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5 text-neutral-300"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437.695Z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Dropdown estilo Monday.com -->
    <Teleport to="body">
      <div
        v-if="open && canEditAssignees"
        ref="dropdownRef"
        class="fixed z-[99999] w-[380px] bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden"
        :style="dropdownStyle"
      >
        <!-- Chips de responsáveis selecionados -->
        <div v-if="assignees.length > 0" class="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="assignee in assignees"
              :key="assignee.id"
              class="inline-flex items-center gap-2 px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm hover:border-neutral-300 transition-colors"
            >
              <!-- Avatar pequeno -->
              <Avatar
                :profile="{
                  id: assignee.id,
                  full_name: assignee.full_name,
                  email: assignee.email,
                  avatar_url: assignee.avatar_url
                }"
                size="xs"
              />
              
              <!-- Nome truncado -->
              <span class="text-xs text-neutral-700 max-w-[120px] truncate">
                {{ assignee.full_name || assignee.email }}
              </span>
              
              <!-- Botão remover -->
              <button
                type="button"
                @click.stop="removeAssigneeById(assignee.id)"
                class="p-0.5 rounded hover:bg-neutral-100 transition-colors"
              >
                <svg class="w-3 h-3 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Campo de busca -->
        <div class="px-4 py-3 border-b border-neutral-200">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Pesquise nomes, funções ou equipes"
              class="w-full pl-10 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingMembers" class="px-4 py-6 text-sm text-neutral-400 text-center">
          Carregando membros...
        </div>

        <!-- Pessoas sugeridas -->
        <div v-else class="max-h-[320px] overflow-y-auto">
          <div class="px-4 py-2">
            <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Pessoas sugeridas</h3>
          </div>

          <!-- Lista de membros -->
          <div v-if="filteredMembers.length > 0" class="pb-2">
            <button
              v-for="member in filteredMembers"
              :key="member.user_id"
              type="button"
              class="w-full text-left px-4 py-2.5 hover:bg-neutral-50 transition-colors flex items-center gap-3"
              @mousedown.prevent="toggleAssignee(member.user_id)"
            >
              <!-- Avatar -->
              <Avatar
                :profile="{
                  id: member.user_id,
                  full_name: member.profile.full_name,
                  email: member.profile.email,
                  avatar_url: member.profile.avatar_url
                }"
                size="sm"
              />

              <!-- Nome e email -->
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-neutral-800 truncate">
                  {{ member.profile.full_name || 'Sem nome' }}
                </div>
                <div class="text-xs text-neutral-500 truncate">
                  {{ member.profile.email }}
                </div>
              </div>

              <!-- Checkmark se selecionado -->
              <svg
                v-if="isAssigned(member.user_id)"
                class="w-5 h-5 text-primary-600 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>

          <!-- Empty state busca -->
          <div v-else-if="searchQuery" class="px-4 py-6 text-sm text-neutral-400 text-center">
            Nenhum membro encontrado
          </div>

          <!-- Empty state geral -->
          <div v-else class="px-4 py-6 text-sm text-neutral-400 text-center">
            Nenhum membro disponível
          </div>

          <!-- Opções adicionais -->
          <div class="border-t border-neutral-200 mt-2">
            <!-- Convidar novo membro -->
            <div v-if="!showInviteForm">
              <button
                type="button"
                class="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-center gap-3 text-sm text-neutral-700"
                @click.stop="showInviteForm = true"
              >
                <div class="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                  </svg>
                </div>
                <span>Convidar novo membro por e-mail</span>
              </button>
            </div>

            <!-- Formulário de convite inline -->
            <div v-else class="px-4 py-3 space-y-3 bg-neutral-50">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-neutral-700">Digite o endereço de e-mail para convidar</h4>
                <button
                  type="button"
                  @click.stop="cancelInvite"
                  class="p-1 rounded hover:bg-neutral-200 transition-colors"
                >
                  <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Input de email -->
              <div>
                <input
                  v-model="inviteEmail"
                  type="email"
                  placeholder="exemplo@email.com"
                  class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="{ 'border-red-300 focus:ring-red-500': inviteError }"
                  @keyup.enter="handleInvite"
                />
              </div>

              <!-- Select de papel -->
              <div>
                <select
                  v-model="inviteRole"
                  class="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="observer">Observador (somente leitura)</option>
                  <option value="guest">Convidado (acesso limitado)</option>
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                </select>
              </div>

              <!-- Erro -->
              <div v-if="inviteError" class="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-xs text-red-700">{{ inviteError }}</p>
              </div>

              <!-- Botões -->
              <div class="flex gap-2">
                <button
                  type="button"
                  @click.stop="cancelInvite"
                  class="flex-1 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  @click.stop="handleInvite"
                  :disabled="!inviteEmail || inviting"
                  class="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ inviting ? 'Convidando...' : 'Convidar novo membro' }}
                </button>
              </div>
            </div>

            <!-- Atribuir automaticamente -->
            <button
              type="button"
              class="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-center gap-3 text-sm text-neutral-700"
              @click.stop="autoAssign"
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
              </div>
              <span>Atribuir pessoas automaticamente</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskAssignees } from '~/composables/useTaskAssignees'
import { useSubtaskAssignees } from '~/composables/useSubtaskAssignees'
import { useBoardMembers } from '~/composables/useBoardMembers'
import { useBoardGuests } from '~/composables/useBoardGuests'
import type { Database } from '#shared/types/database'

type AccessRole = Database['public']['Enums']['board_access_role']

const props = defineProps<{
  taskId: string
  boardId: string
  initialAssignees?: any[] // Assignees que já vêm com a tarefa
  isSubtask?: boolean // Flag para indicar se é uma subtask
}>()

const emit = defineEmits<{
  (e: 'update', assignees: any[]): void
}>()

const { assignees, loading, fetchAssignees, addAssignee, removeAssignee } = props.isSubtask 
  ? useSubtaskAssignees(props.taskId)
  : useTaskAssignees(props.taskId)
const { members, loading: loadingMembers, fetchMembers, getUserRole, canEdit, addMember } = useBoardMembers()
const { orgUsers, fetchOrgUsers } = useBoardGuests()

// Se temos assignees iniciais, usar eles imediatamente
if (props.initialAssignees && props.initialAssignees.length > 0) {
  assignees.value = props.initialAssignees
}

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const userRole = ref<string | null>('collaborator') // Valor padrão otimista
const searchQuery = ref('')

// Invite form state
const showInviteForm = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<AccessRole>('observer')
const inviting = ref(false)
const inviteError = ref<string | null>(null)

const canEditAssignees = computed(() => {
  // Se ainda não carregou o role, assumir que pode editar (otimista)
  if (userRole.value === null) return true
  return canEdit(userRole.value as any)
})

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return members.value
  
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(member => {
    const name = member.profile.full_name?.toLowerCase() || ''
    const email = member.profile.email?.toLowerCase() || ''
    return name.includes(query) || email.includes(query)
  })
})

function calcPosition() {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceRight = window.innerWidth - rect.left

  const dropdownHeight = 500
  const dropdownWidth = 380

  const top = spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4
  const left = spaceRight >= dropdownWidth ? rect.left : rect.right - dropdownWidth

  dropdownStyle.value = {
    top: `${Math.max(8, top)}px`,
    left: `${Math.max(8, left)}px`,
  }
}

function toggleDropdown() {
  console.log('[AssigneeCell] toggleDropdown called')
  console.log('[AssigneeCell] canEditAssignees:', canEditAssignees.value)
  console.log('[AssigneeCell] userRole:', userRole.value)
  
  if (!canEditAssignees.value) {
    console.log('[AssigneeCell] Cannot edit assignees, aborting')
    return
  }
  
  calcPosition()
  open.value = !open.value
  console.log('[AssigneeCell] Dropdown open:', open.value)
  
  if (open.value) {
    searchQuery.value = ''
  }
}

function isAssigned(userId: string): boolean {
  return assignees.value.some(a => a.id === userId)
}

async function toggleAssignee(userId: string) {
  if (!canEditAssignees.value) return
  
  console.log('[AssigneeCell.toggleAssignee] ========== START ==========')
  console.log('[AssigneeCell.toggleAssignee] User ID:', userId)
  console.log('[AssigneeCell.toggleAssignee] Task ID:', props.taskId)
  console.log('[AssigneeCell.toggleAssignee] Is Subtask:', props.isSubtask)
  
  const assigned = isAssigned(userId)
  console.log('[AssigneeCell.toggleAssignee] Is currently assigned (local state):', assigned)
  
  // Salvar estado anterior
  const previousAssignees = [...assignees.value]
  console.log('[AssigneeCell.toggleAssignee] Previous assignees (local state):', previousAssignees.map(a => ({ id: a.id, name: a.full_name })))
  
  // Optimistic update
  if (assigned) {
    console.log('[AssigneeCell.toggleAssignee] → Removing assignee (optimistic)')
    assignees.value = assignees.value.filter(a => a.id !== userId)
  } else {
    console.log('[AssigneeCell.toggleAssignee] → Adding assignee (optimistic)')
    const member = members.value.find(m => m.user_id === userId)
    if (member) {
      const newAssignee = {
        id: member.user_id,
        full_name: member.profile.full_name,
        email: member.profile.email,
        avatar_url: member.profile.avatar_url
      }
      assignees.value.push(newAssignee)
      console.log('[AssigneeCell.toggleAssignee] ✓ Member found and added (optimistic):', newAssignee)
    } else {
      console.error('[AssigneeCell.toggleAssignee] ✗ Member not found in members list!')
    }
  }

  console.log('[AssigneeCell.toggleAssignee] New assignees (after optimistic update):', assignees.value.map(a => ({ id: a.id, name: a.full_name })))

  // Emit update immediately
  emit('update', assignees.value)
  console.log('[AssigneeCell.toggleAssignee] ✓ Update emitted')

  // Persist to database usando o composable (que envia email)
  try {
    if (assigned) {
      console.log('[AssigneeCell.toggleAssignee] → Calling removeAssignee()...')
      const success = await removeAssignee(userId, props.taskId)
      if (!success) {
        throw new Error('Failed to remove assignee')
      }
      console.log('[AssigneeCell.toggleAssignee] ✓ Assignee removed successfully')
    } else {
      console.log('[AssigneeCell.toggleAssignee] → Calling addAssignee() (will check DB and trigger email)...')
      console.log('[AssigneeCell.toggleAssignee] ⚠ Note: addAssignee will verify in DATABASE, not local state')
      const success = await addAssignee(userId, props.taskId)
      if (!success) {
        throw new Error('Failed to add assignee')
      }
      console.log('[AssigneeCell.toggleAssignee] ✓ Assignee added successfully (email should be sent if new)')
    }
    console.log('[AssigneeCell.toggleAssignee] ========== END (success) ==========')
  } catch (err) {
    // Reverter em caso de erro
    console.error('[AssigneeCell.toggleAssignee] ✗ Error:', err)
    assignees.value = previousAssignees
    emit('update', previousAssignees)
    console.error('[AssigneeCell.toggleAssignee] ✓ Reverted to previous state')
    console.log('[AssigneeCell.toggleAssignee] ========== END (error) ==========')
  }
}

async function removeAssigneeById(userId: string) {
  if (!canEditAssignees.value) return
  
  // Salvar estado atual antes da remoção
  const previousAssignees = [...assignees.value]
  
  // Optimistic update - remover apenas o usuário específico
  assignees.value = assignees.value.filter(a => a.id !== userId)
  
  // Emit update immediately
  emit('update', assignees.value)
  
  // Persist to database sem recarregar
  try {
    const supabase = useNuxtApp().$supabase as any
    const tableName = props.isSubtask ? 'subtask_assignees' : 'task_assignees'
    const idColumn = props.isSubtask ? 'subtask_id' : 'task_id'
    
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumn, props.taskId)
      .eq('user_id', userId)
    
    if (deleteError) {
      // Reverter em caso de erro
      assignees.value = previousAssignees
      emit('update', previousAssignees)
      console.error('Erro ao remover responsável:', deleteError)
    }
  } catch (err) {
    // Reverter em caso de erro
    assignees.value = previousAssignees
    emit('update', previousAssignees)
    console.error('Erro ao remover responsável:', err)
  }
}

async function handleInvite() {
  if (!inviteEmail.value.trim()) return
  
  inviting.value = true
  inviteError.value = null
  
  try {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.value)) {
      inviteError.value = 'Por favor, insira um e-mail válido'
      inviting.value = false
      return
    }
    
    // Buscar usuário pelo email
    const user = orgUsers.value.find(u => u.email.toLowerCase() === inviteEmail.value.toLowerCase())
    
    if (!user) {
      inviteError.value = 'Usuário precisa ter uma conta no Kanban Qualitec'
      inviting.value = false
      return
    }
    
    // Verificar se já é membro do board
    const isMember = members.value.some(m => m.user_id === user.id)
    if (isMember) {
      inviteError.value = 'Este usuário já é membro do board'
      inviting.value = false
      return
    }
    
    // Adicionar membro ao board
    const success = await addMember(props.boardId, user.id, inviteRole.value)
    
    if (!success) {
      inviteError.value = 'Erro ao convidar usuário. Tente novamente.'
      inviting.value = false
      return
    }
    
    // Recarregar membros
    await fetchMembers(props.boardId)
    
    // Adicionar automaticamente como responsável da tarefa
    const newMember = members.value.find(m => m.user_id === user.id)
    if (newMember) {
      await addAssignee(user.id)
      assignees.value.push({
        id: newMember.user_id,
        full_name: newMember.profile.full_name,
        email: newMember.profile.email,
        avatar_url: newMember.profile.avatar_url
      })
      emit('update', assignees.value)
    }
    
    // Resetar formulário
    cancelInvite()
  } catch (error: any) {
    inviteError.value = error.message || 'Erro ao convidar usuário'
  } finally {
    inviting.value = false
  }
}

function cancelInvite() {
  showInviteForm.value = false
  inviteEmail.value = ''
  inviteRole.value = 'observer'
  inviteError.value = null
}

async function autoAssign() {
  if (!canEditAssignees.value) return
  
  // Adicionar todos os membros que ainda não estão atribuídos
  const membersToAdd = members.value.filter(member => !isAssigned(member.user_id))
  
  if (membersToAdd.length === 0) {
    // Todos já estão atribuídos
    open.value = false
    return
  }
  
  // Optimistic update - adicionar todos de uma vez
  const newAssignees = membersToAdd.map(member => ({
    id: member.user_id,
    full_name: member.profile.full_name,
    email: member.profile.email,
    avatar_url: member.profile.avatar_url
  }))
  
  assignees.value = [...assignees.value, ...newAssignees]
  
  // Emit update immediately
  emit('update', assignees.value)
  
  // Persist to database - adicionar todos em paralelo
  await Promise.all(
    membersToAdd.map(member => addAssignee(member.user_id))
  )
  
  // Fechar dropdown após atribuir
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  
  // Não fechar se clicar no botão principal
  if (rootRef.value && rootRef.value.contains(target)) return
  
  // Não fechar se clicar dentro do dropdown
  if (dropdownRef.value && dropdownRef.value.contains(target)) return
  
  // Fechar se clicar fora
  open.value = false
}

onMounted(async () => {
  console.log('[AssigneeCell] Component mounted')
  console.log('[AssigneeCell] Props:', { taskId: props.taskId, boardId: props.boardId, isSubtask: props.isSubtask })
  
  // Só buscar assignees se não foram passados via prop
  if (!props.initialAssignees || props.initialAssignees.length === 0) {
    console.log('[AssigneeCell] Fetching assignees...')
    fetchAssignees()
  } else {
    console.log('[AssigneeCell] Using initial assignees:', props.initialAssignees.length)
  }
  
  console.log('[AssigneeCell] Fetching members and user role...')
  fetchMembers(props.boardId)
  fetchOrgUsers()
  
  try {
    const role = await getUserRole(props.boardId)
    userRole.value = role
    console.log('[AssigneeCell] User role loaded:', role)
    console.log('[AssigneeCell] Can edit assignees:', canEditAssignees.value)
  } catch (error) {
    console.error('[AssigneeCell] Error loading user role:', error)
    // Manter valor padrão otimista
  }
  
  document.addEventListener('mousedown', onClickOutside)
  console.log('[AssigneeCell] Component ready')
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>
