import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma.js'
import { createAdminToken, requireAdmin } from './auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const port = Number(process.env.PORT || 3000)
const appTimezone = process.env.APP_TIMEZONE || 'America/Bogota'
const reservationWebhookUrl = process.env.N8N_RESERVATION_WEBHOOK || ''

app.use(express.json({ limit: '1mb' }))

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: appTimezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const todayDateOnly = () => dateFormatter.format(new Date())

const parseDateOnly = (value) => {
  if (!value || typeof value !== 'string') return null
  return new Date(`${value}T00:00:00.000Z`)
}

const dateOnly = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

const asNumber = (value) => value == null ? null : Number(value)

const addDays = (date, days) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

const monthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const getDateRange = (filter) => {
  const start = parseDateOnly(todayDateOnly())
  if (filter === 'hoy') return { start, end: addDays(start, 1) }
  if (filter === 'semana') return { start, end: addDays(start, 7) }
  if (filter === 'mes') {
    return {
      start,
      end: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)),
    }
  }
  return { start, end: null }
}

const calculateNights = (checkIn, checkOut) => {
  const start = parseDateOnly(checkIn)
  const end = parseDateOnly(checkOut)
  if (!start || !end) return 0
  return Math.max(1, Math.round((end - start) / 86400000))
}

const calculatePrice = (roomType, numGuests, checkIn, checkOut) => {
  const nights = calculateNights(checkIn, checkOut)
  const perNight = roomType.priceFixed
    ? Number(roomType.priceFixed)
    : Number(numGuests) >= 2
      ? Number(roomType.priceDouble || roomType.priceSingle || roomType.basePrice)
      : Number(roomType.priceSingle || roomType.priceDouble || roomType.basePrice)

  return nights * perNight
}

const isRoomAvailable = async ({ roomId, checkIn, checkOut, excludeReservationId = null }) => {
  const conflicts = await prisma.reservation.count({
    where: {
      roomId: Number(roomId),
      id: excludeReservationId ? { not: Number(excludeReservationId) } : undefined,
      status: { name: { notIn: ['cancelada', 'completada'] } },
      checkIn: { lt: parseDateOnly(checkOut) },
      checkOut: { gt: parseDateOnly(checkIn) },
    },
  })

  return conflicts === 0
}

const roomTypeDto = (rt) => ({
  id: rt.id,
  name: rt.name,
  description: rt.description,
  base_price: asNumber(rt.basePrice),
  max_occupancy: rt.maxOccupancy,
  price_single: asNumber(rt.priceSingle),
  price_double: asNumber(rt.priceDouble),
  price_fixed: asNumber(rt.priceFixed),
  has_ac: rt.hasAc,
})

const docTypeDto = (doc) => ({
  id: doc.id,
  code: doc.code,
  name: doc.name,
})

const roomDto = (room, activeReservation = null) => ({
  id: room.id,
  room_number: room.roomNumber,
  floor: room.floor,
  room_type: room.roomType.name,
  is_occupied: Boolean(activeReservation),
  reservation_id: activeReservation?.id || null,
  check_in: dateOnly(activeReservation?.checkIn),
  check_out: dateOnly(activeReservation?.checkOut),
  num_guests: activeReservation?.numGuests || null,
  first_name: activeReservation?.guest?.firstName || null,
  last_name: activeReservation?.guest?.lastName || null,
  phone: activeReservation?.guest?.phone || null,
  status: activeReservation?.status?.name || null,
})

const reservationDto = (reservation) => ({
  id: reservation.id,
  check_in: dateOnly(reservation.checkIn),
  check_out: dateOnly(reservation.checkOut),
  num_guests: reservation.numGuests,
  source: reservation.source,
  notes: reservation.notes,
  total_price: asNumber(reservation.totalPrice),
  guests: reservation.guest ? {
    first_name: reservation.guest.firstName,
    last_name: reservation.guest.lastName,
    phone: reservation.guest.phone,
    email: reservation.guest.email,
  } : null,
  rooms: reservation.room ? {
    id: reservation.room.id,
    room_number: reservation.room.roomNumber,
    floor: reservation.room.floor,
    room_types: reservation.room.roomType ? { name: reservation.room.roomType.name } : null,
  } : null,
  reservation_statuses: reservation.status ? { name: reservation.status.name } : null,
})

const getActiveRooms = async () => {
  const today = parseDateOnly(todayDateOnly())
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: { roomType: true },
    orderBy: { roomNumber: 'asc' },
  })

  const activeReservations = await prisma.reservation.findMany({
    where: {
      checkIn: { lte: today },
      checkOut: { gt: today },
      status: { name: { in: ['confirmada', 'activa'] } },
    },
    include: { guest: true, status: true },
  })

  const activeByRoom = new Map(activeReservations.map((r) => [r.roomId, r]))
  return rooms.map((room) => roomDto(room, activeByRoom.get(room.id)))
}

const notifyReservationWebhook = async (reservation) => {
  if (!reservationWebhookUrl || !reservation) return

  try {
    await fetch(reservationWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'INSERT',
        table: 'reservations',
        record: {
          id: reservation.id,
          guest_id: reservation.guestId,
          room_id: reservation.roomId,
          status_id: reservation.statusId,
          created_by: reservation.createdById,
          check_in: dateOnly(reservation.checkIn),
          check_out: dateOnly(reservation.checkOut),
          num_guests: reservation.numGuests,
          total_price: asNumber(reservation.totalPrice),
          source: reservation.source,
          notes: reservation.notes,
          created_at: reservation.createdAt,
          updated_at: reservation.updatedAt,
          guest: reservation.guest ? {
            first_name: reservation.guest.firstName,
            last_name: reservation.guest.lastName,
            email: reservation.guest.email,
            phone: reservation.guest.phone,
            document_number: reservation.guest.documentNumber,
          } : null,
          room: reservation.room ? {
            room_number: reservation.room.roomNumber,
            floor: reservation.room.floor,
            room_type: reservation.room.roomType?.name || null,
          } : null,
          status: reservation.status?.name || null,
        },
      }),
    })
  } catch (err) {
    console.error('[webhook] reservation notification failed:', err)
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/public/room-types', asyncRoute(async (_req, res) => {
  const roomTypes = await prisma.roomType.findMany({ orderBy: { name: 'asc' } })
  res.json(roomTypes.map(roomTypeDto))
}))

app.get('/api/public/document-types', asyncRoute(async (_req, res) => {
  const documentTypes = await prisma.documentType.findMany({ orderBy: { id: 'asc' } })
  res.json(documentTypes.map(docTypeDto))
}))

app.post('/api/admin/login', asyncRoute(async (req, res) => {
  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' })
  }

  const staff = await prisma.staff.findUnique({
    where: { username },
    include: { role: true },
  })

  const valid = staff?.isActive && await bcrypt.compare(password, staff.passwordHash)

  if (!valid) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
  }

  const user = {
    id: staff.id,
    username: staff.username,
    full_name: staff.fullName,
    role_name: staff.role.name,
  }

  res.json({ user, token: createAdminToken(user) })
}))

app.get('/api/admin/rooms', requireAdmin, asyncRoute(async (_req, res) => {
  res.json(await getActiveRooms())
}))

app.get('/api/admin/reservations', requireAdmin, asyncRoute(async (req, res) => {
  const filter = String(req.query.filter || 'hoy')
  const page = Math.max(0, Number(req.query.page || 0))
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)))
  const { start, end } = getDateRange(filter)

  const rows = await prisma.reservation.findMany({
    where: {
      status: { name: { in: ['confirmada', 'activa'] } },
      checkOut: { gte: start },
      checkIn: end ? { lte: end } : undefined,
    },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      status: true,
    },
    orderBy: { checkIn: 'asc' },
    skip: page * pageSize,
    take: pageSize + 1,
  })

  const hasMore = rows.length > pageSize
  res.json({
    data: rows.slice(0, pageSize).map(reservationDto),
    hasMore,
  })
}))

app.get('/api/admin/reservation-form-data', requireAdmin, asyncRoute(async (_req, res) => {
  const [documentTypes, rooms, roomTypes, confirmStatus] = await Promise.all([
    prisma.documentType.findMany({ orderBy: { id: 'asc' } }),
    getActiveRooms(),
    prisma.roomType.findMany({ orderBy: { name: 'asc' } }),
    prisma.reservationStatus.findUnique({ where: { name: 'confirmada' } }),
  ])

  res.json({
    documentTypes: documentTypes.map(docTypeDto),
    rooms,
    roomTypes: roomTypes.map(roomTypeDto),
    confirmStatus: confirmStatus ? { id: confirmStatus.id, name: confirmStatus.name } : null,
  })
}))

app.post('/api/admin/reservations', requireAdmin, asyncRoute(async (req, res) => {
  const { guest, reservation } = req.body || {}

  if (!guest || !reservation) {
    return res.status(400).json({ error: 'Faltan datos del huésped o de la reserva.' })
  }

  const roomId = Number(reservation.room_id)
  const numGuests = Number(reservation.num_guests)
  const checkIn = reservation.check_in
  const checkOut = reservation.check_out

  if (!roomId || !checkIn || !checkOut || checkOut <= checkIn || !numGuests || numGuests < 1) {
    return res.status(400).json({ error: 'Los datos de la reserva no son válidos.' })
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { roomType: true },
  })

  if (!room || !room.isActive) {
    return res.status(404).json({ error: 'La habitación no existe o no está activa.' })
  }

  if (numGuests > room.roomType.maxOccupancy) {
    return res.status(400).json({ error: `La habitación permite máximo ${room.roomType.maxOccupancy} personas.` })
  }

  if (!await isRoomAvailable({ roomId, checkIn, checkOut })) {
    return res.status(409).json({ error: 'La habitación ya tiene una reserva en esas fechas.' })
  }

  const status = await prisma.reservationStatus.findUnique({ where: { name: 'confirmada' } })
  if (!status) return res.status(500).json({ error: 'No se encontró el estado confirmada.' })

  const created = await prisma.$transaction(async (tx) => {
    const savedGuest = await tx.guest.upsert({
      where: {
        documentTypeId_documentNumber: {
          documentTypeId: Number(guest.document_type_id),
          documentNumber: String(guest.document_number),
        },
      },
      update: {
        firstName: guest.first_name,
        lastName: guest.last_name,
        phone: guest.phone || null,
        email: guest.email || null,
      },
      create: {
        documentTypeId: Number(guest.document_type_id),
        documentNumber: String(guest.document_number),
        firstName: guest.first_name,
        lastName: guest.last_name,
        phone: guest.phone || null,
        email: guest.email || null,
      },
    })

    return tx.reservation.create({
      data: {
        guestId: savedGuest.id,
        roomId,
        statusId: status.id,
        createdById: Number(req.user.id),
        checkIn: parseDateOnly(checkIn),
        checkOut: parseDateOnly(checkOut),
        numGuests,
        totalPrice: calculatePrice(room.roomType, numGuests, checkIn, checkOut),
        source: reservation.source || 'presencial',
        notes: reservation.notes || null,
      },
    })
  })

  const fullReservation = await prisma.reservation.findUnique({
    where: { id: created.id },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      status: true,
    },
  })

  await notifyReservationWebhook(fullReservation)
  res.status(201).json({ data: reservationDto(fullReservation) })
}))

app.patch('/api/admin/reservations/:id', requireAdmin, asyncRoute(async (req, res) => {
  const reservationId = Number(req.params.id)
  const { check_in: checkIn, check_out: checkOut } = req.body || {}

  if (!reservationId || !checkIn || !checkOut || checkOut <= checkIn) {
    return res.status(400).json({ error: 'Las fechas no son válidas.' })
  }

  const existing = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!existing) return res.status(404).json({ error: 'Reserva no encontrada.' })

  if (!await isRoomAvailable({
    roomId: existing.roomId,
    checkIn,
    checkOut,
    excludeReservationId: reservationId,
  })) {
    return res.status(409).json({ error: 'La habitación ya tiene otra reserva en esas fechas.' })
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      checkIn: parseDateOnly(checkIn),
      checkOut: parseDateOnly(checkOut),
    },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      status: true,
    },
  })

  res.json({ data: reservationDto(updated) })
}))

app.patch('/api/admin/reservations/:id/cancel', requireAdmin, asyncRoute(async (req, res) => {
  const reservationId = Number(req.params.id)
  const status = await prisma.reservationStatus.findUnique({ where: { name: 'cancelada' } })
  if (!reservationId) return res.status(400).json({ error: 'Reserva inválida.' })
  if (!status) return res.status(500).json({ error: 'No se encontró el estado cancelada.' })

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { statusId: status.id },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      status: true,
    },
  })

  res.json({ data: reservationDto(updated) })
}))

app.get('/api/admin/dashboard', requireAdmin, asyncRoute(async (_req, res) => {
  const today = parseDateOnly(todayDateOnly())
  const currentMonthStart = monthStart(today)
  const sixMoAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1))

  const reservations = await prisma.reservation.findMany({
    where: { createdAt: { gte: sixMoAgo } },
    include: { status: true },
  })

  const activeNow = await prisma.reservation.findMany({
    where: {
      checkIn: { lte: today },
      checkOut: { gte: today },
      status: { name: { in: ['confirmada', 'activa'] } },
    },
  })

  const nonCancelled = reservations.filter((r) => r.status.name !== 'cancelada')
  const monthRevenue = nonCancelled
    .filter((r) => r.createdAt >= currentMonthStart)
    .reduce((sum, r) => sum + Number(r.totalPrice || 0), 0)

  const chartData = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1))
    const monthReservations = nonCancelled.filter((r) =>
      r.createdAt.getUTCFullYear() === d.getUTCFullYear() &&
      r.createdAt.getUTCMonth() === d.getUTCMonth()
    )

    chartData.push({
      mes: months[d.getUTCMonth()],
      reservas: monthReservations.length,
      personas: monthReservations.reduce((sum, r) => sum + r.numGuests, 0),
      dinero: monthReservations.reduce((sum, r) => sum + Number(r.totalPrice || 0), 0),
    })
  }

  res.json({
    stats: {
      totalRes: activeNow.length,
      guests: activeNow.reduce((sum, r) => sum + r.numGuests, 0),
      revenue: monthRevenue,
    },
    chartData,
  })
}))

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' })
})

const distPath = path.resolve(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((err, _req, res, _next) => {
  console.error('[api]', err)
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor.',
  })
})

app.listen(port, () => {
  console.log(`Hotel Merecure API listening on port ${port}`)
})
