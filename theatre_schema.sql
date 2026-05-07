---------------------------------------------------------------
-- Theatre Seat Booking App
-- MariaDB Database Schema Setup
---------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS theatre_booking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE theatre_booking;

---------------------------------------------------------------
-- TABLES
---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  user_id      INT UNSIGNED         NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)         NOT NULL,
  email        VARCHAR(255)         NOT NULL UNIQUE,
  password     VARCHAR(255)         NULL     COMMENT 'bcrypt hash; NULL when using OIDC',
  external_id  VARCHAR(255)         NULL     UNIQUE COMMENT 'sub claim from OIDC provider',
  role         ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at   DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS theatres (
  theatre_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(150) NOT NULL,
  location     VARCHAR(255) NOT NULL,
  description  TEXT         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (theatre_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS halls (
  hall_id      INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  theatre_id   INT UNSIGNED      NOT NULL,
  name         VARCHAR(100)      NOT NULL,
  total_seats  SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (hall_id),
  CONSTRAINT fk_halls_theatre
    FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shows (
  show_id      INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  theatre_id   INT UNSIGNED      NOT NULL,
  title        VARCHAR(200)      NOT NULL,
  description  TEXT              NULL,
  duration_min SMALLINT UNSIGNED NOT NULL COMMENT 'duration in minutes',
  age_rating   VARCHAR(10)       NOT NULL DEFAULT 'ALL',
  created_at   DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (show_id),
  CONSTRAINT fk_shows_theatre
    FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seats (
  seat_id      INT UNSIGNED                        NOT NULL AUTO_INCREMENT,
  hall_id      INT UNSIGNED                        NOT NULL,
  row_label    CHAR(2)                             NOT NULL COMMENT 'e.g. A, B, AA',
  seat_number  SMALLINT UNSIGNED                   NOT NULL,
  category     ENUM('standard','vip','wheelchair') NOT NULL DEFAULT 'standard',
  PRIMARY KEY (seat_id),
  UNIQUE KEY uq_seat (hall_id, row_label, seat_number),
  CONSTRAINT fk_seats_hall
    FOREIGN KEY (hall_id) REFERENCES halls(hall_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS showtimes (
  showtime_id  INT UNSIGNED                              NOT NULL AUTO_INCREMENT,
  show_id      INT UNSIGNED                              NOT NULL,
  hall_id      INT UNSIGNED                              NOT NULL,
  start_time   DATETIME                                  NOT NULL,
  price_std    DECIMAL(8,2)                              NOT NULL COMMENT 'price for standard seat',
  price_vip    DECIMAL(8,2)                              NOT NULL COMMENT 'price for VIP seat',
  status       ENUM('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  PRIMARY KEY (showtime_id),
  CONSTRAINT fk_st_show
    FOREIGN KEY (show_id) REFERENCES shows(show_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_st_hall
    FOREIGN KEY (hall_id) REFERENCES halls(hall_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
  reservation_id  INT UNSIGNED                            NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED                            NOT NULL,
  showtime_id     INT UNSIGNED                            NOT NULL,
  status          ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  total_price     DECIMAL(10,2)                           NOT NULL,
  created_at      DATETIME                                NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME                                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (reservation_id),
  CONSTRAINT fk_res_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_res_showtime
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservation_seats (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  reservation_id INT UNSIGNED  NOT NULL,
  seat_id        INT UNSIGNED  NOT NULL,
  showtime_id    INT UNSIGNED  NOT NULL,
  price_paid     DECIMAL(8,2)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_seat_showtime (seat_id, showtime_id), -- prevents double-booking at DB level
  CONSTRAINT fk_rs_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rs_seat
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rs_showtime
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

---------------------------------------------------------------
-- VIEWS
---------------------------------------------------------------

-- Available (unreserved) seats per showtime
-- Excludes seats tied to active, non-cancelled reservations
CREATE OR REPLACE VIEW v_available_seats AS
SELECT
  s.seat_id,
  s.hall_id,
  s.row_label,
  s.seat_number,
  s.category,
  st.showtime_id,
  st.start_time,
  CASE s.category
    WHEN 'vip' THEN st.price_vip
    ELSE st.price_std
  END AS price
FROM seats s
JOIN showtimes st ON st.hall_id = s.hall_id
WHERE NOT EXISTS (
  SELECT 1 FROM reservation_seats rs
  WHERE rs.seat_id     = s.seat_id
    AND rs.showtime_id = st.showtime_id
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.reservation_id = rs.reservation_id
        AND r.status != 'cancelled'
    )
);

-- Full reservation details (useful for admin reporting - future implementation)
CREATE OR REPLACE VIEW v_reservation_details AS
SELECT
  r.reservation_id,
  r.user_id,
  u.name        AS user_name,
  u.email       AS user_email,
  r.showtime_id,
  sh.title      AS show_title,
  st.start_time,
  t.name        AS theatre_name,
  t.location    AS theatre_location,
  rs.seat_id,
  s.row_label,
  s.seat_number,
  s.category    AS seat_category,
  rs.price_paid,
  r.total_price,
  r.status,
  r.created_at
FROM reservations r
JOIN users             u  ON u.user_id         = r.user_id
JOIN showtimes         st ON st.showtime_id    = r.showtime_id
JOIN shows             sh ON sh.show_id        = st.show_id
JOIN theatres          t  ON t.theatre_id      = sh.theatre_id
JOIN reservation_seats rs ON rs.reservation_id = r.reservation_id
JOIN seats             s  ON s.seat_id         = rs.seat_id;