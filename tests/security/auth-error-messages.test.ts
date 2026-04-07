/**
 * TDD — Segurança: Mensagens de Erro de Autenticação
 *
 * Garante que NUNCA é revelado se o erro foi:
 * - Email não encontrado
 * - Senha incorreta
 * - Conta bloqueada
 * - Conta inexistente
 *
 * Sempre retorna: "Credenciais inválidas"
 */

import { describe, it, expect } from 'vitest'
import { normalizeAuthError } from '../../app/utils/authErrors'

describe('Mensagens de erro de autenticação — sem vazamento de informação', () => {

  // ── RED: Email não encontrado ──────────────────────────────
  it('retorna mensagem genérica para email não encontrado', () => {
    const result = normalizeAuthError('Invalid login credentials')
    expect(result).toBe('Credenciais inválidas')
    expect(result).not.toContain('email')
    expect(result).not.toContain('encontrado')
    expect(result).not.toContain('existe')
  })

  // ── RED: Senha incorreta ───────────────────────────────────
  it('retorna mensagem genérica para senha incorreta', () => {
    const result = normalizeAuthError('Invalid password')
    expect(result).toBe('Credenciais inválidas')
    expect(result).not.toContain('senha')
    expect(result).not.toContain('password')
    expect(result).not.toContain('incorreta')
  })

  // ── RED: Conta desativada ──────────────────────────────────
  it('retorna mensagem genérica para conta desativada', () => {
    const result = normalizeAuthError('User account is disabled')
    expect(result).toBe('Credenciais inválidas')
    expect(result).not.toContain('desativada')
    expect(result).not.toContain('disabled')
    expect(result).not.toContain('bloqueada')
  })

  // ── RED: Erro de rede/servidor ─────────────────────────────
  it('retorna mensagem genérica para erros de servidor', () => {
    const result = normalizeAuthError('Internal server error')
    expect(result).toBe('Credenciais inválidas')
  })

  // ── RED: Erro nulo/undefined ───────────────────────────────
  it('retorna mensagem genérica para erro nulo', () => {
    expect(normalizeAuthError(null)).toBe('Credenciais inválidas')
    expect(normalizeAuthError(undefined)).toBe('Credenciais inválidas')
    expect(normalizeAuthError('')).toBe('Credenciais inválidas')
  })

  // ── RED: Erro de rate limit não revela bloqueio ────────────
  it('não revela que o IP está bloqueado por rate limit', () => {
    const result = normalizeAuthError('Too many requests')
    expect(result).toBe('Credenciais inválidas')
    expect(result).not.toContain('bloqueado')
    expect(result).not.toContain('tentativas')
    expect(result).not.toContain('rate')
  })

  // ── RED: Mensagem de recuperação é sempre genérica ─────────
  it('mensagem de recuperação de senha nunca revela se email existe', async () => {
    const { normalizeRecoveryMessage } = await import('../../app/utils/authErrors')
    const exists = normalizeRecoveryMessage(true)
    const notExists = normalizeRecoveryMessage(false)
    expect(exists).toBe(notExists)
    expect(exists).toBe('Se o email for válido, você receberá as instruções de recuperação.')
  })
})
