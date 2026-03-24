-- ============================================================
--  MIGRACIÓN: Nuevos tipos de habitación con precios reales
--  Hotel Merecure - Cravo Norte
-- ============================================================

-- 1. Agregar columnas de precio por persona/pareja y precio fijo
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS price_single  NUMERIC(10,2);
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS price_double  NUMERIC(10,2);
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS price_fixed   NUMERIC(10,2);
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS has_ac        BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Eliminar habitaciones y tipos viejos
DELETE FROM reservations;  -- ⚠️ Solo en setup inicial
DELETE FROM rooms;
DELETE FROM room_type_amenities;
DELETE FROM room_types;

-- 3. Insertar los 6 tipos reales
INSERT INTO room_types (name, description, base_price, max_occupancy, price_single, price_double, price_fixed, has_ac) VALUES
  ('Doble Ventilador',        'Cama doble con ventilador.',                                     40000, 3, 40000, 50000, NULL,   FALSE),
  ('Doble A/C',               'Cama doble con aire acondicionado.',                             60000, 3, 60000, 70000, NULL,   TRUE),
  ('Triple Ventilador',       'Tres camas sencillas con ventilador.',                           70000, 3, NULL,  NULL,  70000,  FALSE),
  ('Triple A/C',              'Cama doble y camas adicionales con aire acondicionado.',         90000, 4, NULL,  NULL,  90000,  TRUE),
  ('Doble + Sencilla A/C',    'Cama doble y una cama sencilla con aire acondicionado.',         80000, 3, NULL,  NULL,  80000,  TRUE),
  ('Familiar A/C (5 camas)',  'Cama doble y dos camarotes con aire acondicionado (5 camas).',  150000, 5, NULL,  NULL,  150000, TRUE);

-- 4. Insertar las 22 habitaciones reales
INSERT INTO rooms (room_type_id, room_number, floor) VALUES
  -- Piso 1
  ((SELECT id FROM room_types WHERE name = 'Doble Ventilador'),       '101', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '102', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '103', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '104', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '105', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble Ventilador'),       '106', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble Ventilador'),       '107', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '108', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '109', 1),
  ((SELECT id FROM room_types WHERE name = 'Triple A/C'),             '110', 1),
  ((SELECT id FROM room_types WHERE name = 'Triple Ventilador'),      '111', 1),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '112', 1),
  ((SELECT id FROM room_types WHERE name = 'Familiar A/C (5 camas)'), '113', 1),
  ((SELECT id FROM room_types WHERE name = 'Familiar A/C (5 camas)'), '114', 1),
  -- Piso 2
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '201', 2),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '202', 2),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '203', 2),
  ((SELECT id FROM room_types WHERE name = 'Doble Ventilador'),       '204', 2),
  ((SELECT id FROM room_types WHERE name = 'Doble Ventilador'),       '205', 2),
  ((SELECT id FROM room_types WHERE name = 'Doble A/C'),              '206', 2),
  ((SELECT id FROM room_types WHERE name = 'Triple A/C'),             '207', 2),
  ((SELECT id FROM room_types WHERE name = 'Doble + Sencilla A/C'),   '208', 2);

-- 5. Amenidades por tipo
-- Wi-Fi para todos
INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id FROM room_types rt CROSS JOIN amenities a WHERE a.name = 'Wi-Fi Gratis';

-- A/C para los que tienen
INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id FROM room_types rt CROSS JOIN amenities a WHERE a.name = 'Aire Acondicionado' AND rt.has_ac = TRUE;

-- Agua caliente para todos
INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id FROM room_types rt CROSS JOIN amenities a WHERE a.name = 'Agua Caliente'
ON CONFLICT DO NOTHING;

-- 6. Refrescar cache de PostgREST
SELECT pg_notify('pgrst', 'reload schema');
