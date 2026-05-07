---------------------------------------------------------------
-- THEATRES & HALLS
---------------------------------------------------------------

INSERT INTO theatres (name, location, description) VALUES
  ('National Theatre',           'Athens, Agiou Konstantinou 22',   'Greece''s premier state theatre.'),
  ('Odeon of Herodes Atticus',   'Athens, Acropolis Hill',          'Open-air ancient Roman theatre.'),
  ('Thessaloniki State Theatre', 'Thessaloniki, Ethnikis Aminis 2', 'Northern Greece''s main stage.');

INSERT INTO halls (theatre_id, name, total_seats) VALUES
  (1, 'Main Stage',  500),  -- hall_id 1
  (1, 'Studio',      100),  -- hall_id 2
  (2, 'Open Air',   5000),  -- hall_id 3
  (3, 'Main Hall',   600);  -- hall_id 4

---------------------------------------------------------------
-- SEATS
---------------------------------------------------------------

-- Hall 1 - Main Stage (rows A-T, seats 1-25; rows A-C VIP, ends wheelchair)
INSERT INTO seats (hall_id, row_label, seat_number, category)
SELECT 1, r.row_label, n.seat_number,
  CASE WHEN r.row_label IN ('A','B','C') THEN 'vip'
       WHEN n.seat_number IN (1, 25)     THEN 'wheelchair'
       ELSE 'standard' END
FROM
  (SELECT 'A' AS row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D'
   UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H'
   UNION SELECT 'I' UNION SELECT 'J' UNION SELECT 'K' UNION SELECT 'L'
   UNION SELECT 'M' UNION SELECT 'N' UNION SELECT 'O' UNION SELECT 'P'
   UNION SELECT 'Q' UNION SELECT 'R' UNION SELECT 'S' UNION SELECT 'T') r,
  (SELECT 1 AS seat_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
   UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
   UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
   UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16
   UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
   UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
   UNION SELECT 25) n;

-- Hall 2 - Studio (rows A-J, seats 1-10; seats 1-2 are VIP)
INSERT INTO seats (hall_id, row_label, seat_number, category)
SELECT 2, r.row_label, n.seat_number,
  CASE WHEN n.seat_number <= 2 THEN 'vip' ELSE 'standard' END
FROM
  (SELECT 'A' AS row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D'
   UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H'
   UNION SELECT 'I' UNION SELECT 'J') r,
  (SELECT 1 AS seat_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
   UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
   UNION SELECT 9 UNION SELECT 10) n;

-- Hall 3 - Open Air (rows A-T, seats 1-20; center front VIP, ends wheelchair)
INSERT INTO seats (hall_id, row_label, seat_number, category)
SELECT 3, r.row_label, n.seat_number,
  CASE WHEN r.row_label IN ('A','B') AND n.seat_number BETWEEN 8 AND 13 THEN 'vip'
       WHEN n.seat_number IN (1, 20) THEN 'wheelchair'
       ELSE 'standard' END
FROM
  (SELECT 'A' AS row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D'
   UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H'
   UNION SELECT 'I' UNION SELECT 'J' UNION SELECT 'K' UNION SELECT 'L'
   UNION SELECT 'M' UNION SELECT 'N' UNION SELECT 'O' UNION SELECT 'P'
   UNION SELECT 'Q' UNION SELECT 'R' UNION SELECT 'S' UNION SELECT 'T') r,
  (SELECT 1 AS seat_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
   UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
   UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
   UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16
   UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20) n;

-- Hall 4 - Main Hall (rows A-T, seats 1-15; rows A-C are VIP, ends wheelchair)
INSERT INTO seats (hall_id, row_label, seat_number, category)
SELECT 4, r.row_label, n.seat_number,
  CASE WHEN r.row_label IN ('A','B','C') THEN 'vip'
       WHEN n.seat_number IN (1, 15)     THEN 'wheelchair'
       ELSE 'standard' END
FROM
  (SELECT 'A' AS row_label UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D'
   UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H'
   UNION SELECT 'I' UNION SELECT 'J' UNION SELECT 'K' UNION SELECT 'L'
   UNION SELECT 'M' UNION SELECT 'N' UNION SELECT 'O' UNION SELECT 'P'
   UNION SELECT 'Q' UNION SELECT 'R' UNION SELECT 'S' UNION SELECT 'T') r,
  (SELECT 1 AS seat_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
   UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
   UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
   UNION SELECT 13 UNION SELECT 14 UNION SELECT 15) n;

---------------------------------------------------------------
-- SHOWS & SHOWTIMES
---------------------------------------------------------------

-- National Theatre (theatre_id 1)
INSERT INTO shows (theatre_id, title, description, duration_min, age_rating) VALUES
  (1, 'Hamlet', 'Shakespeare''s classic tragedy of revenge and indecision.', 180, '13+'),
  (1, 'Medea',  'Euripides'' powerful tragedy of love, betrayal, and vengeance.', 120, 'ALL');

-- Odeon of Herodes Atticus (theatre_id 2)
INSERT INTO shows (theatre_id, title, description, duration_min, age_rating) VALUES
  (2, 'La Traviata', 'Verdi''s beloved opera following the tragic story of Violetta.', 150, 'ALL');

-- Thessaloniki State Theatre (theatre_id 3)
INSERT INTO shows (theatre_id, title, description, duration_min, age_rating) VALUES
  (3, 'The Wizard of Oz', 'Follow Dorothy and her companions on a magical journey through the land of Oz.', 135, 'ALL');

-- Showtimes for Hamlet - Main Stage, hall 1
INSERT INTO showtimes (show_id, hall_id, start_time, price_std, price_vip) VALUES
  (1, 1, '2026-07-10 20:00:00', 25.00, 50.00),
  (1, 1, '2026-07-11 20:00:00', 25.00, 50.00);

-- Showtimes for Medea - Studio, hall 2
INSERT INTO showtimes (show_id, hall_id, start_time, price_std, price_vip) VALUES
  (2, 2, '2026-07-15 19:30:00', 20.00, 40.00);

-- Showtimes for La Traviata - Open Air, hall 3
INSERT INTO showtimes (show_id, hall_id, start_time, price_std, price_vip) VALUES
  (3, 3, '2026-07-01 21:00:00', 30.00, 70.00);

-- Showtimes for The Wizard of Oz - Main Hall, hall 4
INSERT INTO showtimes (show_id, hall_id, start_time, price_std, price_vip) VALUES
  (4, 4, '2026-08-07 20:00:00', 22.00, 45.00),
  (4, 4, '2026-08-21 20:00:00', 22.00, 45.00);

---------------------------------------------------------------
-- USERS
---------------------------------------------------------------

-- Placeholder admin account (admin dashboard not currently implemented)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User', 'admin@theatres.gr', '$2b$12$examplehashedpassword1234567890', 'admin');

---------------------------------------------------------------
-- VERIFY
---------------------------------------------------------------

SELECT 'theatres'     AS tbl, COUNT(*) AS cnt FROM theatres
UNION SELECT 'halls',          COUNT(*) FROM halls
UNION SELECT 'shows',          COUNT(*) FROM shows
UNION SELECT 'showtimes',      COUNT(*) FROM showtimes
UNION SELECT 'seats',          COUNT(*) FROM seats
UNION SELECT 'users',          COUNT(*) FROM users;
-- Expected: 3 theatres, 4 halls, 4 shows, 6 showtimes, 1300 seats, 1 user (admin placeholder)
