// Mapeamento de ícones para status e prioridades
// Inspirado no Monday.com

export const STATUS_ICONS: Record<string, string> = {
  'feito': 'checkmark', // ✓
  'concluído': 'checkmark',
  'done': 'checkmark',
  'em andamento': 'clock', // ⏱
  'in progress': 'clock',
  'parado': 'pause', // ⏸
  'blocked': 'pause',
  'não iniciado': 'circle', // ○
  'not started': 'circle',
  'a fazer': 'circle',
  'todo': 'circle',
}

export const PRIORITY_ICONS: Record<string, string> = {
  'crítica': 'warning', // ⚠
  'critical': 'warning',
  'alta': 'arrow-up', // ↑
  'high': 'arrow-up',
  'média': 'minus', // −
  'medium': 'minus',
  'baixa': 'arrow-down', // ↓
  'low': 'arrow-down',
}

export function getIconForStatus(statusName: string): string {
  const normalized = statusName.toLowerCase().trim()
  return STATUS_ICONS[normalized] || 'circle'
}

export function getIconForPriority(priorityName: string): string {
  const normalized = priorityName.toLowerCase().trim()
  return PRIORITY_ICONS[normalized] || 'minus'
}

export function renderIcon(iconType: string, className = 'w-5 h-5'): string {
  const icons: Record<string, string> = {
    checkmark: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
    clock: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
    pause: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>`,
    circle: `<svg class="${className}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`,
    warning: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    'arrow-up': `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>`,
    minus: `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>`,
    'arrow-down': `<svg class="${className}" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>`,
  }
  return icons[iconType] || icons.circle
}
