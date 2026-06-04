import { getSession } from '../admin/auth'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const request = async (path, options = {}) => {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }

  if (options.auth) {
    const token = getSession()?.token
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(payload.error || 'Error al conectar con el servidor.', res.status)
  }

  return payload
}

export const publicApi = {
  getRoomTypes: () => request('/api/public/room-types'),
  getDocumentTypes: () => request('/api/public/document-types'),
}

export const adminApi = {
  login: (credentials) => request('/api/admin/login', { method: 'POST', body: credentials }),
  getRooms: () => request('/api/admin/rooms', { auth: true }),
  getReservations: ({ filter, page, pageSize }) => {
    const params = new URLSearchParams({
      filter,
      page: String(page),
      pageSize: String(pageSize),
    })
    return request(`/api/admin/reservations?${params}`, { auth: true })
  },
  getReservationFormData: () => request('/api/admin/reservation-form-data', { auth: true }),
  createReservation: (body) => request('/api/admin/reservations', {
    method: 'POST',
    auth: true,
    body,
  }),
  updateReservation: (id, body) => request(`/api/admin/reservations/${id}`, {
    method: 'PATCH',
    auth: true,
    body,
  }),
  cancelReservation: (id) => request(`/api/admin/reservations/${id}/cancel`, {
    method: 'PATCH',
    auth: true,
  }),
  getDashboard: () => request('/api/admin/dashboard', { auth: true }),
}
