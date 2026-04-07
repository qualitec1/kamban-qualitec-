export interface RateLimiterConfig {
  maxAttempts: number
  windowMs: number
  lockoutLevels: number[] // seconds
}

export interface RateLimitResult {
  blocked: boolean
  retryAfter?: number
  lockoutLevel?: number
}

interface Entry {
  count: number
  firstAt: number
  lockUntil: number
  level: number
}

export function createRateLimiter(config: RateLimiterConfig) {
  const store = new Map<string, Entry>()

  function check(key: string): RateLimitResult {
    const now = Date.now()
    let entry = store.get(key)

    if (!entry) {
      store.set(key, { count: 1, firstAt: now, lockUntil: 0, level: 0 })
      return { blocked: false }
    }

    // Currently locked out
    if (entry.lockUntil > now) {
      return {
        blocked: true,
        retryAfter: Math.ceil((entry.lockUntil - now) / 1000),
        lockoutLevel: entry.level - 1,
      }
    }

    // Window expired — reset count but keep level
    if (now - entry.firstAt > config.windowMs) {
      entry.count = 1
      entry.firstAt = now
      entry.lockUntil = 0
      return { blocked: false }
    }

    entry.count++

    if (entry.count > config.maxAttempts) {
      const lockSeconds = config.lockoutLevels[Math.min(entry.level, config.lockoutLevels.length - 1)]
      entry.lockUntil = now + lockSeconds * 1000
      const currentLevel = entry.level
      entry.level = Math.min(entry.level + 1, config.lockoutLevels.length - 1)
      return { blocked: true, retryAfter: lockSeconds, lockoutLevel: currentLevel }
    }

    return { blocked: false }
  }

  function reset(key: string) {
    store.delete(key)
  }

  function expireLockout(key: string) {
    const entry = store.get(key)
    if (entry) {
      entry.lockUntil = 0
      entry.count = 1
      entry.firstAt = Date.now()
    }
  }

  function expireWindow(key: string) {
    const entry = store.get(key)
    if (entry) {
      entry.firstAt = 0 // forces window reset on next check
    }
  }

  function getCount(key: string): number {
    return store.get(key)?.count ?? 0
  }

  return { check, reset, expireLockout, expireWindow, getCount }
}
