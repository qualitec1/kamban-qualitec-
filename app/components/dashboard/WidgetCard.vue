<template>
  <div
    :class="[
      'widget-card bg-white rounded-lg shadow-sm border relative overflow-hidden',
      isSelected ? 'border-2 border-[#0073ea]' : 'border border-[#e6e9ef]',
      isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : 'h-full'
    ]"
    @click="handleClick"
  >
    <!-- Cabeçalho do widget -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
      
      <!-- Lado esquerdo: drag handle + título -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Drag handle (oculto em fullscreen) -->
        <div
          v-if="!isFullscreen"
          class="shrink-0 cursor-move text-neutral-400 hover:text-neutral-600 transition-colors min-w-[24px] min-h-[24px]"
          title="Arrastar widget"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="4" cy="3" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="4" cy="13" r="1.5" />
            <circle cx="12" cy="3" r="1.5" />
            <circle cx="12" cy="8" r="1.5" />
            <circle cx="12" cy="13" r="1.5" />
          </svg>
        </div>

        <!-- Título (editável) -->
        <input
          v-if="isRenaming"
          ref="titleInput"
          v-model="editableTitle"
          type="text"
          class="text-sm font-semibold text-neutral-800 bg-transparent border-b-2 border-primary-500 outline-none flex-1 min-w-0"
          @blur="saveTitle"
          @keydown.enter="saveTitle"
          @keydown.esc="cancelRename"
          @click.stop
        />
        <h3 v-else class="text-sm font-semibold text-neutral-800 truncate">
          {{ currentTitle }}
        </h3>
      </div>

      <!-- Lado direito: ações -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- Botão voltar (apenas em fullscreen) -->
        <button
          v-if="isFullscreen"
          type="button"
          class="min-w-[32px] min-h-[32px] w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
          title="Voltar ao tamanho normal"
          @click.stop="exitFullscreen"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        </button>

        <!-- Filtro -->
        <button
          v-if="showFilter && !isFullscreen"
          type="button"
          class="min-w-[32px] min-h-[32px] w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
          title="Filtrar widget"
          @click.stop="$emit('filter')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>

        <!-- Menu (três pontos) -->
        <div class="relative" ref="menuButtonRef">
          <button
            type="button"
            class="min-w-[32px] min-h-[32px] w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title="Mais opções"
            @click.stop="toggleMenu"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>

          <!-- Dropdown menu com Teleport -->
          <Teleport to="body">
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showMenu"
                ref="menuDropdownRef"
                class="fixed bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-[9999] w-56"
                :style="menuPosition"
                @click.stop
              >
              <!-- Tela cheia -->
              <button
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                @click="handleFullscreen"
              >
                <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                Tela cheia
              </button>

              <!-- Configurações -->
              <button
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                @click="handleSettings"
              >
                <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configurações
              </button>

              <!-- Renomear -->
              <button
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                @click="handleRename"
              >
                <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Renomear
              </button>

              <!-- Duplicar -->
              <button
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                @click="handleDuplicate"
              >
                <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Duplicar
              </button>

              <!-- Acoplar este widget (desabilitado) -->
              <button
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-neutral-400 cursor-not-allowed flex items-center gap-3"
                disabled
              >
                <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                Acoplar este widget
              </button>

              <!-- Exportar -->
              <button
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3 justify-between"
                @click="handleExport"
              >
                <div class="flex items-center gap-3">
                  <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Exportar
                </div>
                <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <!-- Divider -->
              <div class="my-2 border-t border-neutral-200"></div>

              <!-- Excluir -->
              <button
                type="button"
                class="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                @click="handleDelete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Excluir
              </button>
            </div>
          </Transition>
        </Teleport>
        </div>
      </div>
    </div>

    <!-- Conteúdo do widget -->
    <div class="p-4 overflow-auto" :style="{ height: isFullscreen ? 'calc(100vh - 57px)' : 'calc(100% - 57px)' }">
      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <div class="h-4 bg-neutral-200 rounded animate-pulse"></div>
        <div class="h-4 bg-neutral-200 rounded animate-pulse w-5/6"></div>
        <div class="h-4 bg-neutral-200 rounded animate-pulse w-4/6"></div>
      </div>

      <!-- Slot de conteúdo -->
      <slot v-else></slot>
    </div>

    <!-- Ponto azul decorativo (canto inferior direito quando selecionado) -->
    <div
      v-if="isSelected && !isFullscreen"
      class="absolute bottom-0 right-0 w-3 h-3 bg-[#0073ea] rounded-tl-full"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from '#imports'

const props = withDefaults(defineProps<{
  title: string
  size?: 'half' | 'full'
  loading?: boolean
  showFilter?: boolean
  widgetId?: string
}>(), {
  size: 'half',
  loading: false,
  showFilter: true
})

const emit = defineEmits<{
  'click': []
  'filter': []
  'resize-start': [event: MouseEvent | TouchEvent]
  'fullscreen': [widgetId: string]
  'exit-fullscreen': [widgetId: string]
  'rename': [widgetId: string, newTitle: string]
  'duplicate': [widgetId: string]
  'delete': [widgetId: string]
  'settings': []
  'export': []
}>()

const isSelected = ref(false)
const showMenu = ref(false)
const isFullscreen = ref(false)
const isRenaming = ref(false)
const currentTitle = ref(props.title)
const editableTitle = ref(props.title)
const titleInput = ref<HTMLInputElement | null>(null)
const menuButtonRef = ref<HTMLElement | null>(null)
const menuDropdownRef = ref<HTMLElement | null>(null)
const menuPosition = ref<Record<string, string>>({})

function handleClick() {
  isSelected.value = !isSelected.value
  emit('click')
}

function toggleMenu() {
  showMenu.value = !showMenu.value
  
  if (showMenu.value && menuButtonRef.value) {
    // Calcular posição do menu
    const rect = menuButtonRef.value.getBoundingClientRect()
    const menuWidth = 224 // w-56 = 14rem = 224px
    const menuHeight = 400 // altura aproximada do menu
    
    // Verificar espaço disponível
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceRight = window.innerWidth - rect.right
    
    // Posicionar abaixo ou acima
    const top = spaceBelow > menuHeight 
      ? rect.bottom + 4 
      : rect.top - menuHeight - 4
    
    // Posicionar à direita ou à esquerda
    const left = spaceRight > menuWidth
      ? rect.right - menuWidth
      : rect.left
    
    menuPosition.value = {
      top: `${Math.max(8, top)}px`,
      left: `${Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8))}px`
    }
  }
}

function handleFullscreen() {
  showMenu.value = false
  isFullscreen.value = true
  emit('fullscreen', props.widgetId || '')
  console.log('[WidgetCard] Fullscreen activated')
}

function exitFullscreen() {
  isFullscreen.value = false
  emit('exit-fullscreen', props.widgetId || '')
  console.log('[WidgetCard] Fullscreen exited')
}

function handleSettings() {
  showMenu.value = false
  emit('settings')
  console.log('[WidgetCard] Settings clicked')
}

async function handleRename() {
  showMenu.value = false
  isRenaming.value = true
  editableTitle.value = currentTitle.value
  
  await nextTick()
  titleInput.value?.focus()
  titleInput.value?.select()
  
  console.log('[WidgetCard] Rename mode activated')
}

function saveTitle() {
  if (editableTitle.value.trim() && editableTitle.value !== currentTitle.value) {
    currentTitle.value = editableTitle.value.trim()
    emit('rename', props.widgetId || '', currentTitle.value)
    console.log('[WidgetCard] Title renamed to:', currentTitle.value)
  }
  isRenaming.value = false
}

function cancelRename() {
  editableTitle.value = currentTitle.value
  isRenaming.value = false
  console.log('[WidgetCard] Rename cancelled')
}

function handleDuplicate() {
  showMenu.value = false
  emit('duplicate', props.widgetId || '')
  console.log('[WidgetCard] Duplicate clicked')
}

function handleExport() {
  showMenu.value = false
  emit('export')
  console.log('[WidgetCard] Export clicked')
}

function handleDelete() {
  showMenu.value = false
  
  // Confirmação antes de excluir
  if (confirm(`Tem certeza que deseja excluir o widget "${currentTitle.value}"?`)) {
    emit('delete', props.widgetId || '')
    console.log('[WidgetCard] Delete confirmed')
  }
}

// Fechar menu ao clicar fora
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (showMenu.value && 
      menuButtonRef.value && 
      !menuButtonRef.value.contains(target) &&
      menuDropdownRef.value &&
      !menuDropdownRef.value.contains(target)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.widget-card {
  height: 100%;
}

/* Animação de pulse para skeleton */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
