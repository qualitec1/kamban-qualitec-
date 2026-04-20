<template>
  <!-- Layout mobile: coluna fixa + área rolável -->
  <div class="flex lg:hidden items-center bg-neutral-50 border-b border-neutral-100 overflow-hidden">
    <!-- Área fixa à esquerda (título) -->
    <div class="flex-shrink-0 flex items-center gap-2 bg-neutral-50 z-20 border-r border-neutral-100 sticky left-0">
      <!-- Espaço para seta de expansão -->
      <div class="flex-shrink-0 w-8" />
      
      <!-- Coluna de título (fixa) - largura reduzida -->
      <div class="py-3" style="width: 140px; min-width: 140px; max-width: 140px;">
        <div class="text-xs font-semibold text-neutral-600 uppercase tracking-wide px-2">
          Tarefa
        </div>
      </div>
    </div>

    <!-- Área rolável horizontalmente - sincronizada com as linhas -->
    <div 
      ref="headerScrollRef"
      class="flex-1 overflow-x-auto scrollbar-thin touch-pan-x"
      @scroll="onHeaderScroll"
    >
      <div class="flex items-center gap-1 pr-4 py-3">
        <!-- Colunas dinâmicas baseadas na visibilidade (exceto título) - largura fixa menor -->
        <template v-for="col in orderedColumns" :key="col.key">
          <div
            v-if="isVisible(col.key)"
            class="relative flex-shrink-0 group/col"
            style="width: 110px; min-width: 110px;"
          >
            <div class="text-xs font-semibold text-neutral-600 uppercase tracking-wide px-2 truncate">
              {{ col.label }}
            </div>
            <!-- Handle de redimensionamento (apenas desktop) -->
            <div
              class="hidden lg:block absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover/col:opacity-100 hover:!opacity-100 transition-opacity z-10"
              :class="{ '!opacity-100 bg-primary-500': resizingColumn === col.key }"
              @mousedown="startResize($event, col.key)"
              @touchstart="startResize($event, col.key)"
            >
              <div class="absolute -left-2 -right-2 top-0 bottom-0" />
              <div class="absolute right-0 top-0 bottom-0 w-0.5 bg-primary-400 hover:bg-primary-500" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Layout desktop: tudo em uma linha -->
  <div class="hidden lg:flex items-center gap-2 px-4 min-h-[52px] min-w-max bg-neutral-50 border-b border-neutral-100">
    
    <!-- Espaço para botão expand/collapse (p-0.5 + w-4 + h-4 = ~20px) -->
    <div class="flex-shrink-0 p-0.5">
      <div class="w-4 h-4" />
    </div>
    
    <!-- Espaço para drag handle (p-0.5 + w-4 + h-4 = ~20px) -->
    <div class="flex-shrink-0 p-0.5">
      <div class="w-4 h-4" />
    </div>
    
    <!-- Coluna de título (sempre visível) -->
    <div 
      class="relative flex-shrink-0 group/col"
      :style="getColumnStyle('title')"
    >
      <div class="text-xs font-semibold text-neutral-600 uppercase tracking-wide px-2">
        Tarefa
      </div>
      <!-- Handle de redimensionamento -->
      <div
        class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover/col:opacity-100 hover:!opacity-100 transition-opacity z-10"
        :class="{ '!opacity-100 bg-primary-500': resizingColumn === 'title' }"
        @mousedown="startResize($event, 'title')"
        @touchstart="startResize($event, 'title')"
      >
        <div class="absolute -left-2 -right-2 top-0 bottom-0" />
        <div class="absolute right-0 top-0 bottom-0 w-0.5 bg-primary-400 hover:bg-primary-500" />
      </div>
    </div>

    <!-- Colunas dinâmicas baseadas na visibilidade -->
    <template v-for="col in orderedColumns" :key="col.key">
      <div
        v-if="isVisible(col.key)"
        class="relative flex-shrink-0 group/col"
        :style="getColumnStyle(col.key)"
      >
        <div class="text-xs font-semibold text-neutral-600 uppercase tracking-wide px-2 truncate">
          {{ col.label }}
        </div>
        <!-- Handle de redimensionamento -->
        <div
          class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover/col:opacity-100 hover:!opacity-100 transition-opacity z-10"
          :class="{ '!opacity-100 bg-primary-500': resizingColumn === col.key }"
          @mousedown="startResize($event, col.key)"
          @touchstart="startResize($event, col.key)"
        >
          <div class="absolute -left-2 -right-2 top-0 bottom-0" />
          <div class="absolute right-0 top-0 bottom-0 w-0.5 bg-primary-400 hover:bg-primary-500" />
        </div>
      </div>
    </template>
    
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useBoardColumns } from '~/composables/useBoardColumns'
import { useColumnResize } from '~/composables/useColumnResize'

const props = defineProps<{
  boardId: string
}>()

const { orderedColumns, isVisible } = useBoardColumns(props.boardId)
const { getWidth, setWidth, getColumnStyle: getColStyle, getScrollPosition, setScrollPosition } = useColumnResize(props.boardId)

const headerScrollRef = ref<HTMLElement | null>(null)
const isScrolling = ref(false)

// Função helper para obter o estilo
function getColumnStyle(key: string) {
  return getColStyle(key).value
}

const resizingColumn = ref<string | null>(null)
const startX = ref(0)
const startWidth = ref(0)

function startResize(e: MouseEvent | TouchEvent, columnKey: string) {
  e.preventDefault()
  e.stopPropagation()
  
  resizingColumn.value = columnKey
  startWidth.value = getWidth(columnKey)
  
  if (e instanceof MouseEvent) {
    startX.value = e.clientX
  } else if (e instanceof TouchEvent && e.touches[0]) {
    startX.value = e.touches[0].clientX
  }
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchmove', onResize)
  document.addEventListener('touchend', stopResize)
  
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}

function onResize(e: MouseEvent | TouchEvent) {
  if (!resizingColumn.value) return
  
  let currentX = 0
  if (e instanceof MouseEvent) {
    currentX = e.clientX
  } else if (e instanceof TouchEvent && e.touches[0]) {
    currentX = e.touches[0].clientX
  }
  
  const diff = currentX - startX.value
  const newWidth = startWidth.value + diff
  
  setWidth(resizingColumn.value, newWidth)
}

function stopResize() {
  resizingColumn.value = null
  
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', onResize)
  document.removeEventListener('touchend', stopResize)
  
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

function onHeaderScroll() {
  if (headerScrollRef.value && !isScrolling.value) {
    isScrolling.value = true
    setScrollPosition(headerScrollRef.value.scrollLeft)
    nextTick(() => {
      isScrolling.value = false
    })
  }
}

// Sincronizar scroll quando a posição mudar (de outro componente)
if (import.meta.client) {
  watch(() => getScrollPosition(), (newScrollLeft) => {
    if (headerScrollRef.value && !isScrolling.value && Math.abs(headerScrollRef.value.scrollLeft - newScrollLeft) > 1) {
      headerScrollRef.value.scrollLeft = newScrollLeft
    }
  })
}

// Restaurar posição de scroll ao montar
onMounted(() => {
  if (headerScrollRef.value) {
    headerScrollRef.value.scrollLeft = getScrollPosition()
  }
})
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* Touch action para permitir scroll horizontal suave */
.touch-pan-x {
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}
</style>
