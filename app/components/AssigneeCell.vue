<template>
  <div class="relative" ref="rootRef">
    <!-- Clickable cell (apenas se tiver permissão) -->
    <button
      v-if="canEditAssignees"
      type="button"
      class="flex items-center h-full min-h-[44px] w-full justify-center"
      @click="toggleDropdown"
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
          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
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
          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Teleport dropdown to body -->
    <Teleport to="body">
      <div
        v-if="open && canEditAssignees"
        class="fixed z-[9999] w-64 bg-white border border-neutral-200 rounded-lg shadow-xl py-2 max-h-80 overflow-y-auto"
        :style="dropdownStyle"
      >
        <div class="px-3 py-2 text-xs font-medium text-neutral-500 border-b border-neutral-100">
          Selecionar responsável
        </div>

        <!-- Loading state -->
        <div v-if="loadingMembers" class="px-3 py-4 text-xs text-neutral-400 text-center">
          Carregando membros...
        </div>

        <!-- Members list -->
        <div v-else-if="members.length > 0" class="py-1">
          <button
            v-for="member in members"
            :key="member.user_id"
            type="button"
            class="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition-colors flex items-center gap-3"
            @mousedown.prevent="toggleAssignee(member.user_id)"
          >
            <!-- Checkbox -->
            <div
              class="w-4 h-4 rounded border flex items-center justify-center shrink-0"
              :class="isAssigned(member.user_id) ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'"
            >
              <svg
                v-if="isAssigned(member.user_id)"
                xmlns="http://www.w3.org/2000/svg"
                class="w-3 h-3 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

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

            <!-- Name -->
            <span class="text-xs text-neutral-800 truncate flex-1">
              {{ member.profile.full_name || member.profile.email }}
            </span>
          </button>
        </div>

        <!-- Empty state -->
        <div v-else class="px-3 py-4 text-xs text-neutral-400 text-center">
          Nenhum membro disponível
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskAssignees } from '~/composables/useTaskAssignees'
import { useBoardMembers } from '~/composables/useBoardMembers'

const props = defineProps<{
  taskId: string
  boardId: string
}>()

const emit = defineEmits<{
  (e: 'update', assignees: any[]): void
}>()

const { assignees, loading, fetchAssignees, addAssignee, removeAssignee } = useTaskAssignees(props.taskId)
const { members, loading: loadingMembers, fetchMembers, getUserRole, canEdit } = useBoardMembers()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const userRole = ref<string | null>(null)

const canEditAssignees = computed(() => canEdit(userRole.value as any))

function calcPosition() {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceRight = window.innerWidth - rect.left

  const top = spaceBelow > 320 ? rect.bottom + 4 : rect.top - 324
  const left = spaceRight >= 256 ? rect.left : rect.right - 256

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${Math.max(8, left)}px`,
  }
}

function toggleDropdown() {
  if (!canEditAssignees.value) return
  calcPosition()
  open.value = !open.value
}

function isAssigned(userId: string): boolean {
  return assignees.value.some(a => a.id === userId)
}

async function toggleAssignee(userId: string) {
  if (!canEditAssignees.value) return
  
  const assigned = isAssigned(userId)
  
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

  // Emit update immediately
  emit('update', assignees.value)

  // Persist to database
  if (assigned) {
    await removeAssignee(userId)
  } else {
    await addAssignee(userId)
  }
}

function onClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(async () => {
  fetchAssignees()
  fetchMembers(props.boardId)
  userRole.value = await getUserRole(props.boardId)
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>
