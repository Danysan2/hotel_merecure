// ── Utilidades de sesión admin ───────────────────────────────
// La sesión dura 8 horas. Si el admin deja el panel abierto toda la
// noche, al volver se le pide que vuelva a iniciar sesión.

const SESSION_KEY  = 'admin_user'
const SESSION_TTL  = 8 * 60 * 60 * 1000   // 8 horas en ms

/**
 * Guarda la sesión con timestamp de expiración.
 */
export function saveSession(userData) {
  const payload = {
    data:      userData,
    expiresAt: Date.now() + SESSION_TTL,
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

/**
 * Devuelve el usuario si la sesión es válida, o null si expiró / está manipulada.
 */
export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const payload = JSON.parse(raw)

    // Valida estructura mínima esperada
    if (
      typeof payload !== 'object'       ||
      typeof payload.expiresAt !== 'number' ||
      typeof payload.data !== 'object'  ||
      !payload.data.id                  ||
      !payload.data.username
    ) {
      clearSession()
      return null
    }

    // Valida expiración
    if (Date.now() > payload.expiresAt) {
      clearSession()
      return null
    }

    return payload.data
  } catch {
    clearSession()
    return null
  }
}

/**
 * Elimina la sesión.
 */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
