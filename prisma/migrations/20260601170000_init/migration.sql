CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE roles (
  id SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE document_types (
  id SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL
);

CREATE TABLE reservation_statuses (
  id SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE payment_methods (
  id SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE amenities (
  id SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(60)
);

CREATE TABLE staff (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  role_id SMALLINT NOT NULL REFERENCES roles(id),
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE room_types (
  id SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  max_occupancy SMALLINT NOT NULL CHECK (max_occupancy > 0),
  price_single NUMERIC(10,2),
  price_double NUMERIC(10,2),
  price_fixed NUMERIC(10,2),
  has_ac BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE room_type_amenities (
  room_type_id SMALLINT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  amenity_id SMALLINT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

CREATE TABLE rooms (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_type_id SMALLINT NOT NULL REFERENCES room_types(id),
  room_number VARCHAR(10) NOT NULL UNIQUE,
  floor SMALLINT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT
);

CREATE TABLE guests (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  document_type_id SMALLINT NOT NULL REFERENCES document_types(id),
  document_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(25),
  nationality VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_type_id, document_number)
);

CREATE TABLE reservations (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  guest_id INTEGER NOT NULL REFERENCES guests(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  status_id SMALLINT NOT NULL REFERENCES reservation_statuses(id),
  created_by INTEGER REFERENCES staff(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_guests SMALLINT NOT NULL CHECK (num_guests > 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  source VARCHAR(30) NOT NULL DEFAULT 'web',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

CREATE INDEX idx_reservations_room_dates ON reservations (room_id, check_in, check_out);
CREATE INDEX idx_reservations_guest ON reservations (guest_id);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  payment_method_id SMALLINT NOT NULL REFERENCES payment_methods(id),
  registered_by INTEGER REFERENCES staff(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE booking_requests (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_type_id SMALLINT REFERENCES room_types(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_guests SMALLINT NOT NULL CHECK (num_guests > 0),
  contact_name VARCHAR(150),
  contact_phone VARCHAR(25),
  contact_email VARCHAR(150),
  whatsapp_sent BOOLEAN NOT NULL DEFAULT TRUE,
  converted_to INTEGER REFERENCES reservations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_req_dates CHECK (check_out > check_in)
);

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

CREATE OR REPLACE FUNCTION fn_no_past_checkin()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.check_in < CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha de check-in no puede ser en el pasado.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_no_past_checkin
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION fn_no_past_checkin();

CREATE OR REPLACE FUNCTION is_room_available(
  p_room_id INTEGER,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_reservation INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM reservations r
    JOIN reservation_statuses s ON s.id = r.status_id
    WHERE r.room_id = p_room_id
      AND s.name NOT IN ('cancelada', 'completada')
      AND r.id IS DISTINCT FROM p_exclude_reservation
      AND r.check_in < p_check_out
      AND r.check_out > p_check_in
  );
END;
$$;

CREATE OR REPLACE FUNCTION login_staff(p_username TEXT, p_password TEXT)
RETURNS TABLE(id INTEGER, username TEXT, full_name TEXT, role_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.username::TEXT, s.full_name::TEXT, r.name::TEXT
  FROM staff s
  JOIN roles r ON r.id = s.role_id
  WHERE s.username = p_username
    AND s.password_hash = crypt(p_password, s.password_hash)
    AND s.is_active = TRUE;
END;
$$;

CREATE VIEW room_status AS
  SELECT
    r.id,
    r.room_number,
    r.floor,
    rt.name AS room_type,
    CASE WHEN res.id IS NOT NULL THEN true ELSE false END AS is_occupied,
    res.id AS reservation_id,
    res.check_in,
    res.check_out,
    res.num_guests,
    g.first_name,
    g.last_name,
    g.phone,
    rs.name AS status
  FROM rooms r
  JOIN room_types rt ON rt.id = r.room_type_id
  LEFT JOIN reservations res ON (
    res.room_id = r.id
    AND CURRENT_DATE >= res.check_in
    AND CURRENT_DATE < res.check_out
    AND res.status_id IN (
      SELECT id FROM reservation_statuses WHERE name IN ('confirmada', 'activa')
    )
  )
  LEFT JOIN guests g ON g.id = res.guest_id
  LEFT JOIN reservation_statuses rs ON rs.id = res.status_id
  WHERE r.is_active = true
  ORDER BY r.room_number;
