/**
 * TDD — Segurança: Validação de Inputs
 *
 * Cobre:
 * - SQL Injection via campos de texto
 * - XSS via campos de texto
 * - Campos obrigatórios ausentes
 * - Tipos inválidos
 * - Tamanhos excessivos (DoS via payload)
 * - Email malformado
 * - Senha fraca
 */

import { describe, it, expect } from 'vitest'
import { validateLoginInput, validateRegisterInput, validateTaskInput } from '../../app/utils/inputValidation'

describe('validateLoginInput — validação de credenciais', () => {

  // ── RED: Campos obrigatórios ───────────────────────────────
  it('rejeita email vazio', () => {
    const result = validateLoginInput({ email: '', password: 'Senha123' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('email')
  })

  it('rejeita senha vazia', () => {
    const result = validateLoginInput({ email: 'user@test.com', password: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('password')
  })

  // ── RED: Email malformado ──────────────────────────────────
  it('rejeita email malformado', () => {
    const invalids = ['notanemail', 'a@', '@b.com', 'a@b', 'a b@c.com']
    for (const email of invalids) {
      const result = validateLoginInput({ email, password: 'Senha123' })
      expect(result.valid).toBe(false)
    }
  })

  // ── RED: SQL Injection ─────────────────────────────────────
  it('rejeita SQL injection no campo email', () => {
    const payloads = [
      "' OR '1'='1",
      "admin'--",
      "'; DROP TABLE users;--",
      "1' UNION SELECT * FROM profiles--",
    ]
    for (const payload of payloads) {
      const result = validateLoginInput({ email: payload, password: 'Senha123' })
      expect(result.valid).toBe(false)
    }
  })

  // ── RED: XSS ──────────────────────────────────────────────
  it('rejeita XSS no campo email', () => {
    const payloads = [
      '<script>alert(1)</script>@test.com',
      'user@<img src=x onerror=alert(1)>.com',
      'javascript:alert(1)@test.com',
    ]
    for (const payload of payloads) {
      const result = validateLoginInput({ email: payload, password: 'Senha123' })
      expect(result.valid).toBe(false)
    }
  })

  // ── RED: Payload excessivo (DoS) ───────────────────────────
  it('rejeita email com mais de 254 caracteres', () => {
    const longEmail = 'a'.repeat(250) + '@b.com'
    const result = validateLoginInput({ email: longEmail, password: 'Senha123' })
    expect(result.valid).toBe(false)
  })

  it('rejeita senha com mais de 128 caracteres', () => {
    const longPassword = 'A1' + 'a'.repeat(200)
    const result = validateLoginInput({ email: 'user@test.com', password: longPassword })
    expect(result.valid).toBe(false)
  })
})

describe('validateRegisterInput — validação de cadastro', () => {

  // ── RED: Senha fraca ───────────────────────────────────────
  it('rejeita senha sem letra maiúscula', () => {
    const result = validateRegisterInput({ email: 'u@t.com', password: 'senha123', fullName: 'Test' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('password')
  })

  it('rejeita senha sem número', () => {
    const result = validateRegisterInput({ email: 'u@t.com', password: 'SenhaForte', fullName: 'Test' })
    expect(result.valid).toBe(false)
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = validateRegisterInput({ email: 'u@t.com', password: 'Ab1', fullName: 'Test' })
    expect(result.valid).toBe(false)
  })

  it('aceita senha forte', () => {
    const result = validateRegisterInput({ email: 'u@t.com', password: 'Senha123', fullName: 'Test' })
    expect(result.valid).toBe(true)
  })

  // ── RED: XSS no nome ──────────────────────────────────────
  it('rejeita XSS no campo fullName', () => {
    const result = validateRegisterInput({
      email: 'u@t.com',
      password: 'Senha123',
      fullName: '<script>alert(1)</script>',
    })
    expect(result.valid).toBe(false)
  })

  // ── RED: Nome muito longo ──────────────────────────────────
  it('rejeita nome com mais de 100 caracteres', () => {
    const result = validateRegisterInput({
      email: 'u@t.com',
      password: 'Senha123',
      fullName: 'A'.repeat(101),
    })
    expect(result.valid).toBe(false)
  })
})

describe('validateTaskInput — validação de tarefas', () => {

  // ── RED: Título obrigatório ────────────────────────────────
  it('rejeita tarefa sem título', () => {
    const result = validateTaskInput({ title: '', boardId: 'uuid-1', groupId: 'uuid-2' })
    expect(result.valid).toBe(false)
  })

  // ── RED: XSS no título ────────────────────────────────────
  it('rejeita XSS no título da tarefa', () => {
    const result = validateTaskInput({
      title: '<img src=x onerror=alert(1)>',
      boardId: 'uuid-1',
      groupId: 'uuid-2',
    })
    expect(result.valid).toBe(false)
  })

  // ── RED: Título muito longo ────────────────────────────────
  it('rejeita título com mais de 500 caracteres', () => {
    const result = validateTaskInput({
      title: 'A'.repeat(501),
      boardId: 'uuid-1',
      groupId: 'uuid-2',
    })
    expect(result.valid).toBe(false)
  })

  // ── RED: boardId inválido (não UUID) ──────────────────────
  it('rejeita boardId que não é UUID válido', () => {
    const result = validateTaskInput({
      title: 'Minha tarefa',
      boardId: 'not-a-uuid',
      groupId: 'uuid-2',
    })
    expect(result.valid).toBe(false)
  })
})
