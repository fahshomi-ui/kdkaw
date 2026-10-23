export const SESSION_STORAGE_KEY = "kdd-shopping-session-v1";
export const MAX_SESSION_MS = 7 * 60 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;

export interface ShoppingSession {
  readonly startedAt: number;
  readonly deadline: number;
}

export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let fallbackSession: ShoppingSession | null = null;
const storageFallbacks = new WeakMap<SessionStorage, ShoppingSession>();

function isSession(value: unknown): value is ShoppingSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as { startedAt?: unknown; deadline?: unknown };
  if (!Number.isFinite(record.startedAt) || !Number.isFinite(record.deadline))
    return false;
  const duration = (record.deadline as number) - (record.startedAt as number);
  return duration > 0 && duration <= MAX_SESSION_MS;
}

function createSession(now: number, random: () => number): ShoppingSession {
  let sample = 0;
  try {
    sample = random();
  } catch {
    sample = 0;
  }
  sample = Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0;
  const duration = HOUR_MS + Math.floor(sample * (MAX_SESSION_MS - HOUR_MS));
  return { startedAt: now, deadline: now + duration };
}

function writeSession(
  storage: SessionStorage,
  session: ShoppingSession
): boolean {
  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function loadShoppingSession(
  storage: SessionStorage | null,
  now: number = Date.now(),
  random: () => number = Math.random
): ShoppingSession {
  if (!storage) {
    if (fallbackSession) return fallbackSession;
    return (fallbackSession = createSession(now, random));
  }

  const cached = storageFallbacks.get(storage);
  if (cached) {
    writeSession(storage, cached);
    return cached;
  }

  let stored: string | null;
  try {
    stored = storage.getItem(SESSION_STORAGE_KEY);
  } catch {
    const session = fallbackSession ?? createSession(now, random);
    fallbackSession = session;
    storageFallbacks.set(storage, session);
    return session;
  }

  if (stored !== null) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isSession(parsed)) {
        return { startedAt: parsed.startedAt, deadline: parsed.deadline };
      }
    } catch {
      // Recover below from malformed storage.
    }
  }

  const session = createSession(now, random);
  if (!writeSession(storage, session)) {
    fallbackSession = session;
    storageFallbacks.set(storage, session);
  }
  return session;
}

export function getSessionCountdown(
  session: ShoppingSession,
  now: number = Date.now()
): {
  hours: number;
  minutes: number;
  seconds: number;
  remainingSeconds: number;
} {
  const raw =
    Number.isFinite(session.deadline) && Number.isFinite(now)
      ? session.deadline - now
      : 0;
  const duration = Math.max(0, session.deadline - session.startedAt);
  const remainingSeconds = Math.floor(
    Math.max(0, Math.min(MAX_SESSION_MS, duration, raw)) / 1000
  );
  return {
    hours: Math.floor(remainingSeconds / 3600),
    minutes: Math.floor((remainingSeconds % 3600) / 60),
    seconds: remainingSeconds % 60,
    remainingSeconds,
  };
}
