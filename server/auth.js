import crypto from 'node:crypto'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const secret = process.env.ADMIN_SESSION_SECRET || 'dev-only-change-me'

if (process.env.NODE_ENV === 'production' && secret === 'dev-only-change-me') {
  throw new Error('ADMIN_SESSION_SECRET is required in production.')
}

const base64url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const sign = (payload) =>
  crypto.createHmac('sha256', secret).update(payload).digest('base64url')

export function createAdminToken(user) {
  const payload = base64url(JSON.stringify({
    id: user.id,
    username: user.username,
    role_name: user.role_name,
    exp: Date.now() + SESSION_TTL_MS,
  }))
  return `${payload}.${sign(payload)}`
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature || signature !== sign(payload)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!data.id || !data.username || Date.now() > data.exp) return null
    return data
  } catch {
    return null
  }
}

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const user = verifyAdminToken(token)

  if (!user) {
    return res.status(401).json({ error: 'Sesion invalida o expirada.' })
  }

  req.user = user
  next()
}
