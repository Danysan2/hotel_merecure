-- ============================================================
--  HOTEL MERECURE — Esquema de base de datos (3NF)
--  Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- Extensión para hashear contraseñas con bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
--  1. TABLAS DE CATÁLOGO / LOOKUP
--     Sin dependencias externas, base de todo el esquema
-- ============================================================

-- Roles del personal
CREATE TABLE roles (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(50) NOT NULL UNIQUE  -- 'admin', 'recepcionista'
);

-- Tipos de documento de identidad
CREATE TABLE document_types (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR(20) NOT NULL UNIQUE,  -- 'CC', 'CE', 'PASAPORTE', 'NIT'
  name VARCHAR(60) NOT NULL
);

-- Estados de una reserva
CREATE TABLE reservation_statuses (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(50) NOT NULL UNIQUE   -- 'pendiente', 'confirmada', 'activa', 'completada', 'cancelada'
);

-- Métodos de pago
CREATE TABLE payment_methods (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(50) NOT NULL UNIQUE   -- 'efectivo', 'transferencia', 'tarjeta'
);

-- Amenidades (atributos independientes de la habitación)
CREATE TABLE amenities (
  id          SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(60)  -- nombre del Material Icon
);


-- ============================================================
--  2. PERSONAL / AUTENTICACIÓN
-- ============================================================

CREATE TABLE staff (
  id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  role_id       SMALLINT    NOT NULL REFERENCES roles(id),
  username      VARCHAR(60) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,            -- bcrypt via pgcrypto
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) UNIQUE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
--  3. HABITACIONES
-- ============================================================

-- Tipo de habitación (Doble, Familiar, Suite…)
CREATE TABLE room_types (
  id             SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name           VARCHAR(100) NOT NULL UNIQUE,
  description    TEXT,
  base_price     NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  max_occupancy  SMALLINT     NOT NULL CHECK (max_occupancy > 0)
);

-- Relación tipo ↔ amenidades (evita repetir datos en room_types → 3NF)
CREATE TABLE room_type_amenities (
  room_type_id SMALLINT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  amenity_id   SMALLINT NOT NULL REFERENCES amenities(id)  ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

-- Habitaciones físicas del hotel
CREATE TABLE rooms (
  id           INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_type_id SMALLINT    NOT NULL REFERENCES room_types(id),
  room_number  VARCHAR(10) NOT NULL UNIQUE,   -- '101', '102'…
  floor        SMALLINT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  notes        TEXT
);


-- ============================================================
--  4. HUÉSPEDES
-- ============================================================

CREATE TABLE guests (
  id               INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  document_type_id SMALLINT     NOT NULL REFERENCES document_types(id),
  document_number  VARCHAR(50)  NOT NULL,
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  email            VARCHAR(150),
  phone            VARCHAR(25),
  nationality      VARCHAR(80),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_type_id, document_number)  -- un doc único por tipo
);


-- ============================================================
--  5. RESERVAS
-- ============================================================

CREATE TABLE reservations (
  id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  guest_id      INTEGER     NOT NULL REFERENCES guests(id),
  room_id       INTEGER     NOT NULL REFERENCES rooms(id),
  status_id     SMALLINT    NOT NULL REFERENCES reservation_statuses(id),
  created_by    INTEGER     REFERENCES staff(id),   -- NULL = reserva web
  check_in      DATE        NOT NULL,
  check_out     DATE        NOT NULL,
  num_guests    SMALLINT    NOT NULL CHECK (num_guests > 0),
  total_price   NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  source        VARCHAR(30) NOT NULL DEFAULT 'web',  -- 'web', 'presencial', 'telefono'
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_dates   CHECK (check_out > check_in),
  -- Evita reservar la misma habitación en fechas solapadas
  -- (la restricción fuerte se maneja con una función/trigger abajo)
  CONSTRAINT no_past_checkin CHECK (check_in >= CURRENT_DATE)
);

-- Índice para acelerar consultas de disponibilidad
CREATE INDEX idx_reservations_room_dates
  ON reservations (room_id, check_in, check_out);

CREATE INDEX idx_reservations_guest
  ON reservations (guest_id);


-- ============================================================
--  6. PAGOS
--     Un pago puede hacerse en partes (abono + saldo)
-- ============================================================

CREATE TABLE payments (
  id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reservation_id    INTEGER       NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  payment_method_id SMALLINT      NOT NULL REFERENCES payment_methods(id),
  registered_by     INTEGER       REFERENCES staff(id),
  amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  notes             TEXT
);


-- ============================================================
--  7. SOLICITUDES WEB (leads desde la barra de reserva)
--     Se guardan antes de confirmar — el recepcionista las
--     convierte en reservas formales.
-- ============================================================

CREATE TABLE booking_requests (
  id             INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_type_id   SMALLINT     REFERENCES room_types(id),
  check_in       DATE         NOT NULL,
  check_out      DATE         NOT NULL,
  num_guests     SMALLINT     NOT NULL CHECK (num_guests > 0),
  contact_name   VARCHAR(150),
  contact_phone  VARCHAR(25),
  contact_email  VARCHAR(150),
  whatsapp_sent  BOOLEAN NOT NULL DEFAULT TRUE,
  converted_to   INTEGER      REFERENCES reservations(id), -- NULL = aún no procesada
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_req_dates CHECK (check_out > check_in)
);


-- ============================================================
--  8. TRIGGER — updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  9. FUNCIÓN — verificar disponibilidad de habitación
-- ============================================================

CREATE OR REPLACE FUNCTION is_room_available(
  p_room_id   INTEGER,
  p_check_in  DATE,
  p_check_out DATE,
  p_exclude_reservation INTEGER DEFAULT NULL  -- para ediciones
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM reservations r
    JOIN reservation_statuses s ON s.id = r.status_id
    WHERE r.room_id = p_room_id
      AND s.name NOT IN ('cancelada', 'completada')
      AND r.id IS DISTINCT FROM p_exclude_reservation
      AND r.check_in  < p_check_out
      AND r.check_out > p_check_in
  );
END;
$$;


-- ============================================================
--  10. DATOS INICIALES
-- ============================================================

-- Roles
INSERT INTO roles (name) VALUES ('admin'), ('recepcionista');

-- Tipos de documento
INSERT INTO document_types (code, name) VALUES
  ('CC',        'Cédula de Ciudadanía'),
  ('CE',        'Cédula de Extranjería'),
  ('PASAPORTE', 'Pasaporte'),
  ('NIT',       'NIT');

-- Estados de reserva
INSERT INTO reservation_statuses (name) VALUES
  ('pendiente'),
  ('confirmada'),
  ('activa'),
  ('completada'),
  ('cancelada');

-- Métodos de pago
INSERT INTO payment_methods (name) VALUES
  ('efectivo'),
  ('transferencia'),
  ('tarjeta');

-- Amenidades
INSERT INTO amenities (name, icon) VALUES
  ('Wi-Fi Gratis',    'wifi'),
  ('Aire Acondicionado', 'ac_unit'),
  ('Agua Caliente',   'shower'),
  ('TV Cable',        'tv'),
  ('Parqueadero',     'local_parking'),
  ('Desayuno incluido', 'free_breakfast');

-- Tipos de habitación
INSERT INTO room_types (name, description, base_price, max_occupancy) VALUES
  ('Habitación Doble',    'Cómoda habitación con cama doble.',                  120000, 2),
  ('Habitación Familiar', 'Amplia habitación para toda la familia.',            180000, 5),
  ('Habitación Premium',  'Habitación doble con acabados especiales.',          160000, 2);

-- Amenidades por tipo (todas tienen wifi, AC y agua caliente)
INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM room_types rt
CROSS JOIN amenities a
WHERE a.name IN ('Wi-Fi Gratis', 'Aire Acondicionado', 'Agua Caliente');

-- TV y parqueadero para Familiar y Premium
INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM room_types rt
CROSS JOIN amenities a
WHERE rt.name IN ('Habitación Familiar', 'Habitación Premium')
  AND a.name IN ('TV Cable', 'Parqueadero')
ON CONFLICT DO NOTHING;

-- Habitaciones físicas
INSERT INTO rooms (room_type_id, room_number, floor) VALUES
  (1, '101', 1), (1, '102', 1), (1, '103', 1),
  (2, '201', 2), (2, '202', 2),
  (3, '301', 3), (3, '302', 3);

-- ============================================================
--  USUARIOS DEL SISTEMA (contraseñas hasheadas con bcrypt)
--  admin       → Admin2024!
--  recepcion   → Recep2024!
-- ============================================================

INSERT INTO staff (role_id, username, password_hash, full_name, email)
VALUES
  (
    (SELECT id FROM roles WHERE name = 'admin'),
    'admin',
    crypt('Admin2024!', gen_salt('bf', 12)),
    'Administrador General',
    'admin@hotelmerecure.com'
  ),
  (
    (SELECT id FROM roles WHERE name = 'recepcionista'),
    'recepcion',
    crypt('Recep2024!', gen_salt('bf', 12)),
    'Recepcionista',
    'recepcion@hotelmerecure.com'
  );
