/**
 * TDD — Segurança: Middleware Guards de Rota
 *
 * Garante que:
 * - Usuário não autenticado é redirecionado para /login
 * - Usuário sem role master não acessa rotas master-only
 * - Usuário sem role collaborator não acessa rotas collaborator-only
 * - Manipulação de estado client-side não bypassa guards
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do Nuxt composables
const mockNavigateTo = vi.fn()
const mockAbortNavigation = vi.fn()
const mockCreateError = vi.fn((opts) => opts)

vi.mock('#imports', () => ({
  navigateTo: mockNavigateTo,
  abortNavigation: mockAbortNavigation,
  createError: mockCreateError,
  useState: vi.fn(),
  defineNuxtRouteMiddleware: (fn: Function) => fn,
}))

import { checkAuthGuard, checkMasterOnly, checkCollaboratorOnly } from '../../app/utils/middlewareChecks'

describe('authGuard — proteção de rotas autenticadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── RED: Usuário não autenticado é redirecionado ───────────
  it('redireciona para /login quando não autenticado', () => {
    const result = checkAuthGuard({ user: null, path: '/boards' })
    expect(result.redirect).toBe('/login')
  })

  // ── RED: Rotas públicas passam sem autenticação ────────────
  it('permite acesso a /login sem autenticação', () => {
    const result = checkAuthGuard({ user: null, path: '/login' })
    expect(result.redirect).toBeNull()
    expect(result.allowed).toBe(true)
  })

  it('permite acesso a /forgot-password sem autenticação', () => {
    const result = checkAuthGuard({ user: null, path: '/forgot-password' })
    expect(result.allowed).toBe(true)
  })

  it('permite acesso a /reset-password sem autenticação', () => {
    const result = checkAuthGuard({ user: null, path: '/reset-password' })
    expect(result.allowed).toBe(true)
  })

  // ── RED: Usuário autenticado acessa rotas protegidas ───────
  it('permite acesso a /boards com usuário autenticado', () => {
    const result = checkAuthGuard({
      user: { id: '1', role: 'collaborator' },
      path: '/boards',
    })
    expect(result.allowed).toBe(true)
    expect(result.redirect).toBeNull()
  })

  // ── RED: Manipulação de estado não bypassa guard ───────────
  it('bloqueia acesso mesmo com user parcialmente preenchido (sem id)', () => {
    const result = checkAuthGuard({ user: { id: '', role: 'master' }, path: '/boards' })
    expect(result.redirect).toBe('/login')
  })
})

describe('masterOnly — proteção de rotas administrativas', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── RED: Collaborator não acessa rota master ───────────────
  it('bloqueia collaborator de acessar rota master-only', () => {
    const result = checkMasterOnly({ user: { id: '1', role: 'collaborator' } })
    expect(result.allowed).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  // ── RED: Guest não acessa rota master ─────────────────────
  it('bloqueia guest de acessar rota master-only', () => {
    const result = checkMasterOnly({ user: { id: '1', role: 'guest' } })
    expect(result.allowed).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  // ── RED: Observer não acessa rota master ──────────────────
  it('bloqueia observer de acessar rota master-only', () => {
    const result = checkMasterOnly({ user: { id: '1', role: 'observer' } })
    expect(result.allowed).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  // ── RED: Master acessa rota master ────────────────────────
  it('permite master acessar rota master-only', () => {
    const result = checkMasterOnly({ user: { id: '1', role: 'master' } })
    expect(result.allowed).toBe(true)
  })

  // ── RED: Sem usuário bloqueia ──────────────────────────────
  it('bloqueia acesso sem usuário autenticado', () => {
    const result = checkMasterOnly({ user: null })
    expect(result.allowed).toBe(false)
    expect(result.redirect).toBe('/login')
  })

  // ── RED: Role injetada manualmente não bypassa ─────────────
  it('bloqueia role inválida/injetada', () => {
    const result = checkMasterOnly({ user: { id: '1', role: 'superadmin' as any } })
    expect(result.allowed).toBe(false)
  })
})

describe('collaboratorOnly — proteção de rotas de colaboração', () => {
  beforeEach(() => vi.clearAllMocks())

  it('permite master acessar rota collaborator-only', () => {
    const result = checkCollaboratorOnly({ user: { id: '1', role: 'master' } })
    expect(result.allowed).toBe(true)
  })

  it('permite collaborator acessar rota collaborator-only', () => {
    const result = checkCollaboratorOnly({ user: { id: '1', role: 'collaborator' } })
    expect(result.allowed).toBe(true)
  })

  it('bloqueia guest de acessar rota collaborator-only', () => {
    const result = checkCollaboratorOnly({ user: { id: '1', role: 'guest' } })
    expect(result.allowed).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  it('bloqueia observer de acessar rota collaborator-only', () => {
    const result = checkCollaboratorOnly({ user: { id: '1', role: 'observer' } })
    expect(result.allowed).toBe(false)
    expect(result.statusCode).toBe(403)
  })
})
