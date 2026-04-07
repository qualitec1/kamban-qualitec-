const GENERIC_AUTH_ERROR = 'Credenciais inválidas'
const GENERIC_RECOVERY_MESSAGE = 'Se o email for válido, você receberá as instruções de recuperação.'

/**
 * Normaliza qualquer erro de autenticação para uma mensagem genérica.
 * NUNCA revela se o erro foi email não encontrado, senha incorreta,
 * conta bloqueada ou qualquer outro detalhe interno.
 */
export function normalizeAuthError(_error: unknown): string {
  return GENERIC_AUTH_ERROR
}

/**
 * Mensagem de recuperação de senha — sempre idêntica,
 * independente de o email existir ou não.
 */
export function normalizeRecoveryMessage(_emailExists: boolean): string {
  return GENERIC_RECOVERY_MESSAGE
}
