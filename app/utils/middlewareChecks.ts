const VALID_ROLES = ['master', 'collaborator', 'guest', 'observer'] as const
type ValidRole = typeof VALID_ROLES[number]

interface User {
  id: string
  role: string
}

interface GuardResult {
  allowed: boolean
  redirect?: string | null
  statusCode?: number
}

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']

export function checkAuthGuard({ user, path }: { user: User | null; path: string }): GuardResult {
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return { allowed: true, redirect: null }
  }

  if (!user || !user.id) {
    return { allowed: false, redirect: '/login' }
  }

  return { allowed: true, redirect: null }
}

export function checkMasterOnly({ user }: { user: User | null }): GuardResult {
  if (!user || !user.id) {
    return { allowed: false, redirect: '/login' }
  }

  if (!VALID_ROLES.includes(user.role as ValidRole) || user.role !== 'master') {
    return { allowed: false, statusCode: 403 }
  }

  return { allowed: true }
}

export function checkCollaboratorOnly({ user }: { user: User | null }): GuardResult {
  if (!user || !user.id) {
    return { allowed: false, redirect: '/login' }
  }

  const allowed: ValidRole[] = ['master', 'collaborator']
  if (!allowed.includes(user.role as ValidRole)) {
    return { allowed: false, statusCode: 403 }
  }

  return { allowed: true }
}
