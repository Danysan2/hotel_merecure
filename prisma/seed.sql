INSERT INTO roles (id, name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'admin'),
  (2, 'recepcionista')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO document_types (id, code, name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'CC', 'Cedula de Ciudadania'),
  (2, 'CE', 'Cedula de Extranjeria'),
  (3, 'PASAPORTE', 'Pasaporte'),
  (4, 'NIT', 'NIT')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;

INSERT INTO reservation_statuses (id, name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'pendiente'),
  (2, 'confirmada'),
  (3, 'activa'),
  (4, 'completada'),
  (5, 'cancelada')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO payment_methods (id, name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'efectivo'),
  (2, 'transferencia'),
  (3, 'tarjeta')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO amenities (id, name, icon) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Wi-Fi Gratis', 'wifi'),
  (2, 'Aire Acondicionado', 'ac_unit'),
  (3, 'Agua Caliente', 'shower'),
  (4, 'TV Cable', 'tv'),
  (5, 'Parqueadero', 'local_parking'),
  (6, 'Desayuno incluido', 'free_breakfast')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO room_types (id, name, description, base_price, max_occupancy, price_single, price_double, price_fixed, has_ac)
OVERRIDING SYSTEM VALUE VALUES
  (4, 'Cama Doble con ventilador', 'Cama doble con ventilador.', 40000.00, 2, 40000.00, 50000.00, NULL, false),
  (5, 'Cama Doble aire acondicionado', 'Cama doble con aire acondicionado.', 60000.00, 2, 60000.00, 70000.00, NULL, true),
  (6, 'Cama Doble + 2 Sencillas con ventilador', 'Tres camas sencillas con ventilador.', 70000.00, 4, NULL, NULL, 70000.00, false),
  (7, 'Cama Doble + 2 Sencillas aire acondicionado', 'Cama doble y camas adicionales con aire acondicionado.', 90000.00, 4, NULL, NULL, 90000.00, true),
  (8, 'Cama Doble + Sencilla aire acondicionado', 'Cama doble y una cama sencilla con aire acondicionado.', 80000.00, 3, NULL, NULL, 80000.00, true),
  (9, 'Familiar con ventilador(5 camas)', 'Cama doble y dos camarotes con aire acondicionado (5 camas).', 150000.00, 6, NULL, NULL, 150000.00, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  max_occupancy = EXCLUDED.max_occupancy,
  price_single = EXCLUDED.price_single,
  price_double = EXCLUDED.price_double,
  price_fixed = EXCLUDED.price_fixed,
  has_ac = EXCLUDED.has_ac;

INSERT INTO rooms (id, room_type_id, room_number, floor, is_active, notes)
OVERRIDING SYSTEM VALUE VALUES
  (8, 4, '101', 1, true, NULL),
  (9, 5, '102', 1, true, NULL),
  (10, 5, '103', 1, true, NULL),
  (11, 5, '104', 1, true, NULL),
  (12, 5, '105', 1, true, NULL),
  (13, 4, '106', 1, true, NULL),
  (14, 4, '107', 1, true, NULL),
  (15, 5, '108', 1, true, NULL),
  (16, 5, '109', 1, true, NULL),
  (17, 7, '110', 1, true, NULL),
  (18, 6, '111', 1, true, NULL),
  (19, 5, '112', 1, true, NULL),
  (20, 9, '113', 1, true, NULL),
  (21, 9, '114', 1, true, NULL),
  (22, 5, '201', 2, true, NULL),
  (23, 5, '202', 2, true, NULL),
  (24, 5, '203', 2, true, NULL),
  (25, 4, '204', 2, true, NULL),
  (26, 4, '205', 2, true, NULL),
  (27, 5, '206', 2, true, NULL),
  (28, 7, '207', 2, true, NULL),
  (29, 8, '208', 2, true, NULL)
ON CONFLICT (id) DO UPDATE SET
  room_type_id = EXCLUDED.room_type_id,
  room_number = EXCLUDED.room_number,
  floor = EXCLUDED.floor,
  is_active = EXCLUDED.is_active,
  notes = EXCLUDED.notes;

INSERT INTO staff (id, role_id, username, password_hash, full_name, email, is_active)
OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'admin', '$2a$12$oJgy29YOENf2VBxrYSxRUeh00ZNvgg362bwwJYGLbW7vmguMYPGtu', 'Administrador General', 'admin@hotelmerecure.com', true),
  (2, 2, 'recepcion', '$2a$12$GOlOUq9YWyg4FqH0zPsPJOrfqUgVzD9EulBoHi3TQgKqRh2r.B/Ti', 'Recepcionista', 'recepcion@hotelmerecure.com', true)
ON CONFLICT (id) DO UPDATE SET
  role_id = EXCLUDED.role_id,
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;

INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES
  (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1),
  (5, 2), (7, 2), (8, 2), (9, 2),
  (4, 3), (5, 3), (6, 3), (7, 3), (8, 3), (9, 3)
ON CONFLICT DO NOTHING;

SELECT setval('roles_id_seq', 2, true);
SELECT setval('document_types_id_seq', 4, true);
SELECT setval('reservation_statuses_id_seq', 5, true);
SELECT setval('payment_methods_id_seq', 3, true);
SELECT setval('amenities_id_seq', 6, true);
SELECT setval('room_types_id_seq', 9, true);
SELECT setval('rooms_id_seq', 29, true);
SELECT setval('staff_id_seq', 2, true);
