# Theatre Booking

A mobile application for browsing theatres and shows, selecting seats, and managing reservations. Built with React Native (Expo) on the frontend and Node.js/Express on the backend, with a MariaDB database.

## Tech Stack

- **Frontend**: React Native (Expo Router)
- **Backend**: Node.js, Express
- **Database**: MariaDB

## Prerequisites

- Node.js (v18 or later)
- MariaDB
- Expo CLI (`npm install -g expo-cli`)
- Expo Go SDK 52 app on your mobile device, or an Android/iOS emulator

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Catlord923/theatre-booking.git
```

### 2. Database setup

Import `theatre_schema.sql` followed by `theatre_seed.sql` into your MariaDB instance.

### 3. Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your values.

Start the backend:

```bash
node src/app.js
```

### 4. Frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` and set your backend IP.

Start the frontend:

```bash
npx expo start
```

Then scan the QR code with Expo Go.

## Functionality

- **Register & Login**: Create an account and sign in with JWT-based authentication. Tokens are stored securely on the device and refreshed automatically.
- **Theatres**: Browse and search available theatres by name or location.
- **Shows**: Browse and search shows, filterable by theatre, title, or date.
- **Show Detail**: View show information and available showtimes with live seat availability.
- **Seat Booking**: Interactive seat map with Standard, VIP, and Wheelchair categories. Select seats and confirm a reservation.
- **My Bookings**: View all past and upcoming reservations with seat and pricing details.
- **Modify Reservation**: Swap seats on an upcoming reservation via the seat map.
- **Cancel Reservation**: Cancel any upcoming reservation.
- **Profile**: View account info and navigate the app.

## License

MIT
