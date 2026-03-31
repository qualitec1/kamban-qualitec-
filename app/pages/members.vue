<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-title-lg text-strong mb-1">Gestão de membros</h2>
        <p class="text-body-md text-subtle">Altere perfis, status e vínculos de administração.</p>
      </div>
    </div>

    <!-- Loading / Error -->
    <LoadingState v-if="isLoading" message="Carregando membros..." />
    <ErrorState v-else-if="error" :message="error" @retry="fetchMembers" />

    <!-- Desktop: Table -->
    <div v-else class="hidden md:block bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-neutral-100 bg-neutral-50">
            <th class="text-left px-5 py-3 text-label-sm text-subtle font-medium">Membro</th>
            <th class="text-left px-5 py-3 text-label-sm text-subtle font-medium">Cargo</th>
            <th class="text-left px-5 py-3 text-label-sm text-subtle font-medium">Perfil</th>
            <th class="text-left px-5 py-3 text-label-sm text-subtle font-medium">Status</th>
            <th class="text-left px-5 py-3 text-label-sm text-subtle font-medium">Gerencia</th>
            <th class="text-right px-5 py-3 text-label-sm text-subtle font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="members.length === 0">
            <td colspan="5" class="px-5 py-10 text-center text-body-sm text-muted">Nenhum membro encontrado.</td>
          </tr>
          <tr
            v-for="member in members"
            :key="member.id"
            class="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60 transition-colors"
          >
            <!-- Avatar + name -->
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
                  <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.full_name ?? member.email" class="w-full h-full object-cover" />
                  <span v-else>{{ initials(member.full_name ?? member.email) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-body-sm text-strong font-medium truncate">{{ member.full_name ?? '—' }}</p>
                  <p class="text-micro text-muted truncate">{{ member.email }}</p>
                </div>
              </div>
            </td>

            <!-- Job title -->
            <td class="px-5 py-3">
              <span v-if="member.job_title" class="text-body-sm text-neutral-700">{{ member.job_title }}</span>
              <span v-else class="text-body-sm text-muted">—</span>
            </td>

            <!-- Role -->
            <td class="px-5 py-3">
              <span :class="roleBadge(member.role_global)">{{ roleLabel(member.role_global) }}</span>
            </td>
            <!-- Status -->
            <td class="px-5 py-3">
              <span :class="statusBadge(member.status)">{{ statusLabel(member.status) }}</span>
            </td>

            <!-- Managed count -->
            <td class="px-5 py-3">
              <span class="text-body-sm text-subtle">
                {{ managedCountFor(member.id) > 0 ? `${managedCountFor(member.id)} membro(s)` : '—' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-5 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <BaseButton size="sm" variant="ghost" @click="openEdit(member)">
                  Editar
                </BaseButton>
                <BaseButton size="sm" variant="outline" @click="openDelegate(member)">
                  Delegar
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: Cards -->
    <div v-if="!isLoading && !error" class="md:hidden space-y-3">
      <div v-if="members.length === 0" class="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 text-center">
        <p class="text-body-sm text-muted">Nenhum membro encontrado.</p>
      </div>
      <div
        v-for="member in members"
        :key="member.id"
        class="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 space-y-3"
      >
        <!-- Header: Avatar + Name -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
            <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.full_name ?? member.email" class="w-full h-full object-cover" />
            <span v-else>{{ initials(member.full_name ?? member.email) }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-body-md text-strong font-medium truncate">{{ member.full_name ?? '—' }}</p>
            <p class="text-micro text-muted truncate">{{ member.email }}</p>
          </div>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
          <div>
            <p class="text-micro text-muted mb-1">Perfil</p>
            <span :class="roleBadge(member.role_global)">{{ roleLabel(member.role_global) }}</span>
          </div>
          <div>
            <p class="text-micro text-muted mb-1">Status</p>
            <span :class="statusBadge(member.status)">{{ statusLabel(member.status) }}</span>
          </div>
          <div v-if="(member as any).job_title" class="col-span-2">
            <p class="text-micro text-muted mb-1">Cargo</p>
            <p class="text-body-sm text-neutral-700">{{ (member as any).job_title }}</p>
          </div>
          <div class="col-span-2" v-if="managedCountFor(member.id) > 0">
            <p class="text-micro text-muted mb-1">Gerencia</p>
            <p class="text-body-sm text-subtle">{{ managedCountFor(member.id) }} membro(s)</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <BaseButton size="sm" variant="ghost" block @click="openEdit(member)">
            Editar
          </BaseButton>
          <BaseButton size="sm" variant="outline" block @click="openDelegate(member)">
            Delegar
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Edit profile modal -->
    <BaseModal v-model="showEditModal" title="Editar membro" size="sm">
      <div v-if="editTarget" class="space-y-4">

        <!-- Identity (read-only) -->
        <div class="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
          <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
            <img v-if="editTarget.avatar_url" :src="editTarget.avatar_url" :alt="editTarget.full_name ?? editTarget.email" class="w-full h-full object-cover" />
            <span v-else>{{ initials(editTarget.full_name ?? editTarget.email) }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-body-sm text-strong font-medium truncate">{{ editTarget.full_name ?? '—' }}</p>
            <p class="text-micro text-muted truncate">{{ editTarget.email }}</p>
          </div>
        </div>

        <!-- Role select -->
        <BaseSelect
          v-model="editRole"
          label="Perfil de acesso"
          :options="roleOptions"
          :disabled="editTarget.role_global === 'master' && masterCount <= 1"
          :hint="editTarget.role_global === 'master' && masterCount <= 1 ? 'Deve existir ao menos um master.' : undefined"
        />

        <!-- Job title -->
        <BaseInput
          v-model="editJobTitle"
          label="Cargo"
          placeholder="Ex: Assistente Comercial, Auxiliar ADM..."
        />

        <!-- Status select -->
        <BaseSelect
          v-model="editStatus"
          label="Status"
          :options="statusOptions"
        />

        <p v-if="editError" class="text-micro text-error-600">{{ editError }}</p>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="showEditModal = false">Cancelar</BaseButton>
        <BaseButton :loading="saving" @click="saveEdit">Salvar</BaseButton>
      </template>
    </BaseModal>

    <!-- Delegate modal -->
    <BaseModal v-model="showDelegateModal" title="Delegar administração" size="md">
      <div v-if="selectedMaster" class="space-y-4">
        <p class="text-body-sm text-subtle">
          Selecione quais membros
          <span class="text-strong font-medium">{{ selectedMaster.full_name ?? selectedMaster.email }}</span>
          poderá administrar.
        </p>

        <LoadingState v-if="loadingRelations" message="Carregando..." />

        <ul v-else class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <li
            v-for="m in eligibleMembers"
            :key="m.id"
            class="flex items-center justify-between px-3 py-2.5 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {{ initials(m.full_name ?? m.email) }}
              </div>
              <div class="min-w-0">
                <p class="text-body-sm text-strong truncate">{{ m.full_name ?? m.email }}</p>
                <p class="text-micro text-muted truncate">{{ roleLabel(m.role_global) }}</p>
              </div>
            </div>
            <button
              :class="[
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ml-3',
                isManagedBy(m.id)
                  ? 'bg-primary border-primary text-white'
                  : 'border-neutral-300 hover:border-primary',
              ]"
              :aria-label="isManagedBy(m.id) ? 'Remover delegação' : 'Adicionar delegação'"
              :aria-pressed="isManagedBy(m.id)"
              @click="toggleRelation(m.id)"
            >
              <svg v-if="isManagedBy(m.id)" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </li>
          <li v-if="eligibleMembers.length === 0" class="text-center py-4 text-body-sm text-muted">
            Nenhum outro membro disponível.
          </li>
        </ul>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="showDelegateModal = false">Fechar</BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useManagedUsers } from '~/composables/useManagedUsers'
import type { Tables, Enums } from '#shared/types/database'

type Profile    = Tables<'profiles'>
type UserRole   = Enums<'user_role'>
type UserStatus = Enums<'user_status'>

definePageMeta({
  layout: 'default',
  middleware: ['master-only'],
})

const {
  members, isLoading, error,
  fetchMembers, fetchRelations, addRelation, removeRelation, getManagedIds,
  updateRole, updateStatus, updateJobTitle,
} = useManagedUsers()

// ── Edit modal ──────────────────────────────────────────────
const showEditModal = ref(false)
const editTarget    = ref<Profile | null>(null)
const editRole      = ref<UserRole>('collaborator')
const editStatus    = ref<UserStatus>('active')
const editJobTitle  = ref('')
const saving        = ref(false)
const editError     = ref<string | null>(null)

const masterCount = computed(() => members.value.filter(m => m.role_global === 'master').length)

const roleOptions = [
  { label: 'Master',       value: 'master' },
  { label: 'Colaborador',  value: 'collaborator' },
  { label: 'Convidado',    value: 'guest' },
  { label: 'Observador',   value: 'observer' },
]

const statusOptions = [
  { label: 'Ativo',    value: 'active' },
  { label: 'Inativo',  value: 'inactive' },
  { label: 'Pendente', value: 'pending' },
]

function openEdit(member: Profile) {
  editTarget.value    = member
  editRole.value      = member.role_global
  editStatus.value    = member.status
  editJobTitle.value  = (member as any).job_title ?? ''
  editError.value     = null
  showEditModal.value = true
}

async function saveEdit() {
  if (!editTarget.value) return
  saving.value    = true
  editError.value = null
  try {
    if (editRole.value !== editTarget.value.role_global) {
      await updateRole(editTarget.value.id, editRole.value)
    }
    if (editStatus.value !== editTarget.value.status) {
      await updateStatus(editTarget.value.id, editStatus.value)
    }
    const currentJobTitle = (editTarget.value as any).job_title ?? ''
    if (editJobTitle.value !== currentJobTitle) {
      await updateJobTitle(editTarget.value.id, editJobTitle.value)
    }
    showEditModal.value = false
  } catch (e: any) {
    editError.value = e.message ?? 'Erro ao salvar'
  } finally {
    saving.value = false
  }
}

// ── Delegate modal ───────────────────────────────────────────
const showDelegateModal  = ref(false)
const selectedMaster     = ref<Profile | null>(null)
const loadingRelations   = ref(false)

// pre-load all relations for managed count column
const allRelations = ref<Record<string, string[]>>({})

const eligibleMembers = computed(() =>
  selectedMaster.value
    ? members.value.filter(m => m.id !== selectedMaster.value!.id)
    : []
)

function isManagedBy(memberId: string): boolean {
  if (!selectedMaster.value) return false
  return getManagedIds(selectedMaster.value.id).includes(memberId)
}

function managedCountFor(masterId: string): number {
  return allRelations.value[masterId]?.length ?? 0
}

async function openDelegate(master: Profile) {
  selectedMaster.value     = master
  showDelegateModal.value  = true
  loadingRelations.value   = true
  try {
    await fetchRelations(master.id)
    allRelations.value[master.id] = getManagedIds(master.id)
  } finally {
    loadingRelations.value = false
  }
}

async function toggleRelation(memberId: string) {
  if (!selectedMaster.value) return
  if (isManagedBy(memberId)) {
    await removeRelation(selectedMaster.value.id, memberId)
  } else {
    await addRelation(selectedMaster.value.id, memberId)
  }
  allRelations.value[selectedMaster.value.id] = getManagedIds(selectedMaster.value.id)
}

// ── Helpers ──────────────────────────────────────────────────
onMounted(fetchMembers)

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function roleLabel(role: string): string {
  return ({ master: 'Master', collaborator: 'Colaborador', guest: 'Convidado', observer: 'Observador' } as Record<string, string>)[role] ?? role
}

function roleBadge(role: string): string {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'
  return ({
    master:       `${base} bg-primary-100 text-primary-700`,
    collaborator: `${base} bg-secondary-100 text-secondary-700`,
    guest:        `${base} bg-neutral-100 text-neutral-600`,
    observer:     `${base} bg-neutral-100 text-neutral-500`,
  } as Record<string, string>)[role] ?? `${base} bg-neutral-100 text-neutral-600`
}

function statusLabel(status: string): string {
  return ({ active: 'Ativo', inactive: 'Inativo', pending: 'Pendente' } as Record<string, string>)[status] ?? status
}

function statusBadge(status: string): string {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium'
  return ({
    active:   `${base} bg-success-100 text-success-700`,
    inactive: `${base} bg-neutral-100 text-neutral-500`,
    pending:  `${base} bg-warning-100 text-warning-700`,
  } as Record<string, string>)[status] ?? `${base} bg-neutral-100 text-neutral-600`
}
</script>
