/** Rotas públicas — não exigem autenticação */
export const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'] as const

/** Rotas exclusivas para role master */
export const MASTER_ONLY_ROUTES = ['/members'] as const

export type PublicRoute  = typeof PUBLIC_ROUTES[number]
export type MasterRoute  = typeof MASTER_ONLY_ROUTES[number]
