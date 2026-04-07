const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@<>'"`;]+@[^\s@<>'"`;]+\.[^\s@<>'"`;]{2,}$/
const XSS_PATTERNS = [/<[^>]*>/i, /javascript:/i, /on\w+\s*=/i, /data:/i]
const SQL_PATTERNS = [/('|")\s*(or|and|union|select|drop|insert|update|delete|--)/i, /;\s*(drop|delete|insert|update)/i]

interface ValidationResult {
  valid: boolean
  errors: string[]
}

function containsXSS(value: string): boolean {
  return XSS_PATTERNS.some(p => p.test(value))
}

function containsSQLInjection(value: string): boolean {
  return SQL_PATTERNS.some(p => p.test(value))
}

export function validateLoginInput(input: { email: unknown; password: unknown }): ValidationResult {
  const errors: string[] = []

  if (typeof input.email !== 'string' || !input.email.trim()) {
    errors.push('email')
  } else {
    const email = input.email.trim()
    if (email.length > 254) errors.push('email')
    else if (!EMAIL_REGEX.test(email)) errors.push('email')
    else if (containsXSS(email) || containsSQLInjection(email)) errors.push('email')
  }

  if (typeof input.password !== 'string' || !input.password) {
    errors.push('password')
  } else {
    if (input.password.length > 128) errors.push('password')
  }

  return { valid: errors.length === 0, errors }
}

export function validateRegisterInput(input: {
  email: unknown
  password: unknown
  fullName: unknown
}): ValidationResult {
  const errors: string[] = []

  const loginCheck = validateLoginInput({ email: input.email, password: input.password })
  errors.push(...loginCheck.errors)

  // Password strength
  if (typeof input.password === 'string' && input.password.length <= 128) {
    if (input.password.length < 8) errors.push('password')
    else if (!/[A-Z]/.test(input.password)) errors.push('password')
    else if (!/[0-9]/.test(input.password)) errors.push('password')
  }

  if (typeof input.fullName !== 'string' || !input.fullName.trim()) {
    errors.push('fullName')
  } else {
    if (input.fullName.length > 100) errors.push('fullName')
    else if (containsXSS(input.fullName)) errors.push('fullName')
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] }
}

export function validateTaskInput(input: {
  title: unknown
  boardId: unknown
  groupId?: unknown
}): ValidationResult {
  const errors: string[] = []

  if (typeof input.title !== 'string' || !input.title.trim()) {
    errors.push('title')
  } else {
    if (input.title.length > 500) errors.push('title')
    else if (containsXSS(input.title)) errors.push('title')
  }

  if (typeof input.boardId !== 'string' || !UUID_REGEX.test(input.boardId)) {
    errors.push('boardId')
  }

  return { valid: errors.length === 0, errors }
}
