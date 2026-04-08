<template>
  <header class="shrink-0 flex items-center gap-4 h-14 bg-white border-b border-neutral-100 px-4 shadow-sm">

    <!-- Toggle sidebar -->
    <button
      @click="$emit('toggle-sidebar')"
      class="flex items-center justify-center w-9 h-9 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors duration-[150ms]"
      aria-label="Alternar menu"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Page title -->
    <div class="flex-1 min-w-0">
      <h1 class="text-headline text-strong truncate">
        <slot name="title">Início</slot>
      </h1>
    </div>

    <!-- Search -->
    <div class="hidden md:flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 w-56">
      <svg class="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        placeholder="Buscar..."
        class="bg-transparent text-body-sm text-strong placeholder:text-muted focus:outline-none w-full"
        aria-label="Buscar"
      />
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1.5">

      <!-- Notificações -->
      <NotificationsPanel />

      <!-- Avatar + Dropdown -->
      <div class="relative" ref="menuRef">
        <button
          @click="menuOpen = !menuOpen"
          class="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-neutral-100 transition-colors duration-[150ms]"
          aria-label="Menu do usuário"
          :aria-expanded="menuOpen"
        >
          <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span class="text-white text-xs font-semibold">{{ initials }}</span>
          </div>
          <span class="hidden md:block text-label-sm text-default max-w-[120px] truncate">{{ displayName }}</span>
          <svg
            class="hidden md:block w-3.5 h-3.5 text-neutral-400 transition-transform duration-[150ms]"
            :class="menuOpen ? 'rotate-180' : ''"
            fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown -->
        <Transition name="dropdown">
          <div
            v-if="menuOpen"
            class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-100 py-1 z-50"
            role="menu"
          >
            <!-- Info do usuário -->
            <div class="px-4 py-3 border-b border-neutral-100">
              <p class="text-label-md text-strong font-medium truncate">{{ displayName }}</p>
              <p class="text-micro text-muted truncate">{{ user?.email }}</p>
              <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-micro font-medium"
                :class="user?.role === 'master' ? 'bg-primary-50 text-primary-700' : 'bg-neutral-100 text-neutral-600'"
              >
                {{ user?.role === 'master' ? 'Master' : 'Colaborador' }}
              </span>
            </div>

            <!-- Ações -->
            <div class="py-1">
              <button
                class="w-full flex items-center gap-3 px-4 py-2.5 text-label-sm text-default hover:bg-neutral-50 transition-colors duration-[150ms]"
                role="menuitem"
              >
                <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Meu perfil
              </button>

              <button
                class="w-full flex items-center gap-3 px-4 py-2.5 text-label-sm text-default hover:bg-neutral-50 transition-colors duration-[150ms]"
                role="menuitem"
              >
                <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configurações
              </button>
            </div>

            <div class="border-t border-neutral-100 py-1">
              <button
                @click="handleLogout"
                :disabled="isLoading"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-label-sm transition-colors duration-[150ms] disabled:opacity-50"
                style="color: var(--color-error-600);"
                role="menuitem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {{ isLoading ? 'Saindo...' : 'Sair da conta' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

defineEmits<{ 'toggle-sidebar': [] }>()

const { user, logout, isLoading } = useAuth()

const menuOpen = ref(false)
const menuRef  = ref<HTMLElement | null>(null)

const displayName = computed(() =>
  user.value?.fullName || user.value?.email?.split('@')[0] || 'Usuário'
)

const initials = computed(() => {
  const name = user.value?.fullName || user.value?.email || 'U'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

async function handleLogout() {
  menuOpen.value = false
  await logout()
}

// Fecha ao clicar fora
function onClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
