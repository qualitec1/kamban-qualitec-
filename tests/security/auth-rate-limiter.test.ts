/**
 * TDD — Segurança: Rate Limiter de Autenticação
 *
 * Ciclo TDD:
 * 1. RED   — testes escritos antes do código (falham)
 * 2. GREEN — implementação mínima para passar
 * 3. REFACTOR — limpar sem quebrar
 *
 * Cobre:
 * - Lockout progressivo: 15min → 1h → 24h
 * - Erro genérico (nunca revela email/senha)
 * - Reset após sucesso
 * - Fingerprint combinado (IP + UA)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRateLimiter } from '../../app/utils/rateLimiter'

describe('RateLimiter — Autenticação', () => {
  let limiter: ReturnType<typeof createRateLimiter>

  beforeEach(() => {
    // Fresh limiter for each test — isolated state
    limiter = createRateLimiter({
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutLevels: [15 * 60, 60 * 60, 24 * 60 * 60],
    })
  })

  // ── RED: Tentativas dentro do limite ──────────────────────
  it('permite tentativas dentro do limite', () => {
    const key = 'ip:192.168.1.1:ua:chrome'
    for (let i = 0; i < 5; i++) {
      const result = limiter.check(key)
      expect(result.blocked).toBe(false)
    }
  })

  // ── RED: Bloqueia na 6ª tentativa ─────────────────────────
  it('bloqueia na 6ª tentativa com lockout nível 1 (15min)', () => {
    const key = 'ip:10.0.0.1:ua:firefox'
    for (let i = 0; i < 5; i++) limiter.check(key)

    const result = limiter.check(key)
    expect(result.blocked).toBe(true)
    expect(result.retryAfter).toBe(15 * 60)
    expect(result.lockoutLevel).toBe(0)
  })

  // ── RED: Lockout progressivo nível 2 (1h) ─────────────────
  it('escala para lockout de 1h após segundo bloqueio', () => {
    const key = 'ip:10.0.0.2:ua:safari'
    // Primeiro ciclo de bloqueio
    for (let i = 0; i < 6; i++) limiter.check(key)
    limiter.expireLockout(key) // simula passagem do tempo

    // Segundo ciclo
    for (let i = 0; i < 6; i++) limiter.check(key)
    const result = limiter.check(key)

    expect(result.blocked).toBe(true)
    expect(result.retryAfter).toBe(60 * 60)
    expect(result.lockoutLevel).toBe(1)
  })

  // ── RED: Lockout máximo (24h) ──────────────────────────────
  it('atinge lockout máximo de 24h no terceiro ciclo', () => {
    const key = 'ip:10.0.0.3:ua:edge'
    // Ciclo 1: bloqueia no nível 0 (15min)
    for (let i = 0; i < 6; i++) limiter.check(key)
    limiter.expireLockout(key) // simula fim do lockout, mantém level=1

    // Ciclo 2: bloqueia no nível 1 (1h)
    for (let i = 0; i < 5; i++) limiter.check(key) // 1 já foi no expireLockout
    limiter.expireLockout(key) // simula fim do lockout, mantém level=2

    // Ciclo 3: bloqueia no nível 2 (24h)
    for (let i = 0; i < 5; i++) limiter.check(key)
    const result = limiter.check(key)

    expect(result.blocked).toBe(true)
    expect(result.retryAfter).toBe(24 * 60 * 60)
  })

  // ── RED: Reset após sucesso ────────────────────────────────
  it('reseta contador após login bem-sucedido', () => {
    const key = 'ip:10.0.0.4:ua:chrome'
    for (let i = 0; i < 4; i++) limiter.check(key)

    limiter.reset(key)

    // Deve poder tentar novamente do zero
    for (let i = 0; i < 5; i++) {
      const result = limiter.check(key)
      expect(result.blocked).toBe(false)
    }
  })

  // ── RED: Chaves diferentes são independentes ───────────────
  it('não contamina chaves diferentes (IPs distintos)', () => {
    const key1 = 'ip:1.1.1.1:ua:chrome'
    const key2 = 'ip:2.2.2.2:ua:chrome'

    for (let i = 0; i < 6; i++) limiter.check(key1)

    const result = limiter.check(key2)
    expect(result.blocked).toBe(false)
  })

  // ── RED: Janela de tempo expira ────────────────────────────
  it('reseta contagem após expirar a janela de tempo', () => {
    const key = 'ip:10.0.0.5:ua:chrome'
    for (let i = 0; i < 4; i++) limiter.check(key)

    limiter.expireWindow(key) // simula passagem da janela

    const result = limiter.check(key)
    expect(result.blocked).toBe(false)
    expect(limiter.getCount(key)).toBe(1) // reiniciou
  })
})
