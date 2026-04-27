import { computed, useState } from '#imports'

export type ColumnKey =
  | 'timeline'
  | 'budget'
  | 'attachments'
  | 'notes'
  | 'lastUpdated'
  | 'priority'
  | 'status'
  | 'assignee'

export interface ColumnDef {
  key: ColumnKey
  label: string
  defaultVisible: boolean
}

export const ALL_COLUMNS: ColumnDef[] = [
  { key: 'assignee',    label: 'Responsável',       defaultVisible: true },
  { key: 'status',      label: 'Status',             defaultVisible: true },
  { key: 'priority',    label: 'Prioridade',         defaultVisible: true },
  { key: 'timeline',    label: 'Cronograma',         defaultVisible: true },
  { key: 'notes',       label: 'Notas',              defaultVisible: true },
  { key: 'attachments', label: 'Arquivos',           defaultVisible: true },
  { key: 'budget',      label: 'Orçamento',          defaultVisible: false },
  { key: 'lastUpdated', label: 'Última atualização', defaultVisible: false },
]

const DEFAULT_ORDER = ALL_COLUMNS.map(c => c.key)

export function useBoardColumns(boardId: string) {
  const visibilityKey = `board-columns-${boardId}`
  const orderKey      = `board-columns-order-${boardId}`

  function loadVisible(): Record<ColumnKey, boolean> {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(visibilityKey)
        if (saved) return JSON.parse(saved)
      } catch { /* ignore */ }
    }
    return Object.fromEntries(
      ALL_COLUMNS.map(c => [c.key, c.defaultVisible])
    ) as Record<ColumnKey, boolean>
  }

  function loadOrder(): ColumnKey[] {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(orderKey)
        if (saved) {
          const parsed: ColumnKey[] = JSON.parse(saved)
          const merged = parsed.filter(k => DEFAULT_ORDER.includes(k))
          DEFAULT_ORDER.forEach(k => { if (!merged.includes(k)) merged.push(k) })
          return merged
        }
      } catch { /* ignore */ }
    }
    return [...DEFAULT_ORDER]
  }

  // useState garante estado global reativo compartilhado entre todos os componentes
  const visible = useState<Record<ColumnKey, boolean>>(
    `board-col-visible-${boardId}`,
    () => loadVisible()
  )

  const order = useState<ColumnKey[]>(
    `board-col-order-${boardId}`,
    () => loadOrder()
  )

  const orderedColumns = computed(() =>
    order.value.map(k => ALL_COLUMNS.find(c => c.key === k)!).filter(Boolean)
  )

  function toggle(key: ColumnKey) {
    visible.value = { ...visible.value, [key]: !visible.value[key] }
    if (import.meta.client) {
      localStorage.setItem(visibilityKey, JSON.stringify(visible.value))
    }
  }

  function isVisible(key: ColumnKey): boolean {
    return visible.value[key] ?? true
  }

  function reorder(fromKey: ColumnKey, toKey: ColumnKey) {
    if (fromKey === toKey) return
    const arr = [...order.value]
    const fromIdx = arr.indexOf(fromKey)
    const toIdx   = arr.indexOf(toKey)
    if (fromIdx === -1 || toIdx === -1) return
    arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, fromKey)
    order.value = arr
    if (import.meta.client) {
      localStorage.setItem(orderKey, JSON.stringify(arr))
    }
  }

  const visibleCount = computed(() =>
    ALL_COLUMNS.filter(c => visible.value[c.key]).length
  )

  return { visible, order, orderedColumns, toggle, isVisible, reorder, visibleCount, ALL_COLUMNS }
}
