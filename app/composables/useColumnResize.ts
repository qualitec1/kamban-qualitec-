import { reactive, computed } from 'vue'

// Larguras padrão das colunas (em pixels)
const DEFAULT_WIDTHS: Record<string, number> = {
  title: 300,
  status: 150,
  priority: 150,
  assignee: 180,
  dueDate: 120,
  timeline: 200,
  budget: 120,
  attachments: 100,
  notes: 200,
  lastUpdated: 150,
  labels: 180
}

// Larguras mínimas e máximas
const MIN_WIDTH = 80
const MAX_WIDTH = 600

// Estado global reativo compartilhado (singleton)
const globalState = reactive<{
  boards: Record<string, Record<string, number>>
  scrollPositions: Record<string, number>
}>({
  boards: {},
  scrollPositions: {}
})

// Inicializar board se não existir
function initBoard(boardId: string) {
  if (!globalState.boards[boardId]) {
    // Carregar do localStorage
    let initialWidths = { ...DEFAULT_WIDTHS }
    if (import.meta.client) {
      try {
        const storageKey = `board-column-widths-${boardId}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          initialWidths = { ...DEFAULT_WIDTHS, ...parsed }
        }
      } catch {
        // Usar padrão
      }
    }
    globalState.boards[boardId] = initialWidths
  }
}

export function useColumnResize(boardId: string) {
  const storageKey = `board-column-widths-${boardId}`
  
  // Garantir que o board está inicializado
  initBoard(boardId)
  
  // Salvar larguras no localStorage
  function saveWidths() {
    if (import.meta.client) {
      try {
        const widths = globalState.boards[boardId]
        if (widths) {
          localStorage.setItem(storageKey, JSON.stringify(widths))
        }
      } catch (error) {
        console.error('[useColumnResize] Error saving widths:', error)
      }
    }
  }
  
  // Obter largura de uma coluna
  function getWidth(columnKey: string): number {
    const widths = globalState.boards[boardId]
    return widths?.[columnKey] ?? DEFAULT_WIDTHS[columnKey] ?? 150
  }
  
  // Definir largura de uma coluna
  function setWidth(columnKey: string, width: number) {
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    if (globalState.boards[boardId]) {
      globalState.boards[boardId][columnKey] = clampedWidth
      saveWidths()
    }
  }
  
  // Resetar larguras para o padrão
  function resetWidths() {
    globalState.boards[boardId] = { ...DEFAULT_WIDTHS }
    saveWidths()
  }
  
  // Estilo CSS para uma coluna (computed reativo)
  function getColumnStyle(columnKey: string) {
    return computed(() => ({
      width: `${getWidth(columnKey)}px`,
      minWidth: `${MIN_WIDTH}px`,
      maxWidth: `${MAX_WIDTH}px`,
      flexShrink: 0
    }))
  }
  
  // Gerenciar posição de scroll compartilhada (para sincronizar header e rows em mobile)
  function getScrollPosition(): number {
    return globalState.scrollPositions[boardId] ?? 0
  }
  
  function setScrollPosition(scrollLeft: number) {
    globalState.scrollPositions[boardId] = scrollLeft
  }
  
  return {
    getWidth,
    setWidth,
    resetWidths,
    getColumnStyle,
    getScrollPosition,
    setScrollPosition,
    MIN_WIDTH,
    MAX_WIDTH
  }
}
