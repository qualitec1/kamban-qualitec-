<template>
  <div class="space-y-4">

    <!-- Lista de membros atuais -->
    <div v-if="members.length > 0" class="space-y-2">
      <p class="text-label-sm text-muted font-medium uppercase tracking-wide">Membros com acesso</p>
      <div
        v-for="m in members"
        :key="m.user_id"
        class="flex items-center justify-between gap-3 p-3 bg-neutral-50 rounded-xl"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span class="text-label-sm font-semibold text-primary-700">
              {{ initials(m.profile.full_name || m.profile.email) }}
            </span>
          </div>
          <div class="min-w-0">
            <p class="text-body-sm font-medium text-strong truncate">{{ m.profile.full_name || m.profile.email }}</p>
            <p class="text-micro text-muted truncate">{{ m.profile.email }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span :class="roleClass(m.access_role)" class="px-2 py-0.5 rounded-full text-micro font-medium">
            {{ roleLabel(m.access_role) }}
          </span>
          <button
            v-if="canManage"
            @click="handleRemove(m.user_id)"
            class="p-1 text-muted hover:text-danger-600 transition-colors"
            title="Remover acesso"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Formulário de convite -->
    <div v-if="canManage" class="border-t border-neutral-100 pt-4 space-y-3">
      <p class="text-label-sm text-muted font-medium uppercase tracking-wide">Convidar usuário</p>

      <BaseSelect
        v-model="selectedUserId"
        label="Usuário"
        :options="availableUserOptions"
        placeholder="Selecione um usuário..."
      />

      <BaseSelect
        v-model="selectedRole"
        label="Papel"
        :options="roleOptions"
      />

      <div v-if="inviteError" class="bg-danger-50 border border-danger-200 rounded-xl px-3 py-2">
        <p class="text-body-sm text-danger-700">{{ inviteError }}</p>
      </div>

      <BaseButton
        variant="primary"
        :disabled="!selectedUserId || inviting"
        @click="handleInvite"
        class="w-full"
      >
        {{ inviting ? 'Convidando...' : 'Convidar' }}
      </BaseButton>
    </div>

    <LoadingState v-if="loading" message="Carregando membros..." />
    <ErrorState v-if="error" :message="error" @retry="() => emit('retry')" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBoardMembers } from '~/composables/useBoardMembers'
import type { Database } from '#shared/types/database'

type AccessRole = Database['public']['Enums']['board_access_role']

interface OrgUser {
  id: string
  full_name: string | null
  email: string
}

const props = defineProps<{
  boardId: string
  canManage: boolean
  orgUsers: OrgUser[]
}>()

const emit = defineEmits<{
  retry: []
}>()

const { members, loading, error, fetchMembers, addMember, removeMember } = useBoardMembers()

const selectedUserId = ref('')
const selectedRole = ref<AccessRole>('observer')
const inviting = ref(false)
const inviteError = ref<string | null>(null)

const roleOptions = [
  { value: 'observer', label: 'Observador (somente leitura, sem edição)' },
  { value: 'guest',    label: 'Convidado (acesso limitado)' },
  { value: 'viewer',   label: 'Visualizador' },
  { value: 'editor',   label: 'Editor' }
]

const availableUserOptions = computed(() => {
  const memberIds = new Set(members.value.map(m => m.user_id))
  return props.orgUsers
    .filter(u => !memberIds.has(u.id))
    .map(u => ({ value: u.id, label: u.full_name || u.email }))
})

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function roleLabel(role: AccessRole) {
  const map: Record<AccessRole, string> = { owner: 'Dono', editor: 'Editor', viewer: 'Visualizador', guest: 'Convidado', observer: 'Observador' }
  return map[role] ?? role
}

function roleClass(role: AccessRole) {
  const map: Record<AccessRole, string> = {
    owner:    'bg-primary-100 text-primary-700',
    editor:   'bg-success-100 text-success-700',
    viewer:   'bg-neutral-100 text-neutral-600',
    guest:    'bg-warning-100 text-warning-700',
    observer: 'bg-blue-100 text-blue-700'
  }
  return map[role] ?? 'bg-neutral-100 text-neutral-600'
}

async function handleInvite() {
  if (!selectedUserId.value) return
  inviting.value = true
  inviteError.value = null

  const ok = await addMember(props.boardId, selectedUserId.value, selectedRole.value)
  if (!ok) {
    inviteError.value = 'Erro ao convidar usuário. Tente novamente.'
  } else {
    selectedUserId.value = ''
    selectedRole.value = 'observer'
  }
  inviting.value = false
}

async function handleRemove(userId: string) {
  await removeMember(props.boardId, userId)
}

onMounted(() => fetchMembers(props.boardId))
</script>
