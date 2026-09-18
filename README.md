# Service Booking API

[![CI](https://github.com/ruwanthac/service-booking-api/actions/workflows/ci.yml/badge.svg)](https://github.com/ruwanthac/service-booking-api/actions/workflows/ci.yml)
![NestJS](https://img.shields.io/badge/NestJS-v11-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D)
![License](https://img.shields.io/badge/License-MIT-green)

A RESTful Service Booking API built with NestJS and PostgreSQL as part of the EN2H Software Engineer Intern (NestJS) Technical Assignment.

---

## Project Overview

This application provides a backend for a **Service Booking Platform**. Authenticated users can manage the service catalogue and oversee bookings, while customers can create bookings without an account. The API enforces business rules around booking availability, date validation, and status workflows, and exposes interactive documentation via Swagger.

---

## Quick Start

```bash
git clone https://github.com/ruwanthac/service-booking-api
cd service-booking-api

npm install

cp .env.example .env

docker compose up -d

npx prisma migrate dev

npm run start:dev
```

---

## Features

### Authentication

- JWT Authentication
- Register
- Login

### Service Management

- Create Service
- Get All Services
- Get Service By ID
- Update Service
- Delete Service

### Booking Management

- Create Booking (Public)
- Get All Bookings
- Get Booking By ID
- Update Booking
- Update Booking Status
- Cancel Booking

### Validation

- DTO validation using `class-validator`
- Global `ValidationPipe` with whitelist, transform, and forbid-non-whitelisted options

### Business Rules

- Booking must belong to an existing service
- Booking date cannot be in the past
- Prevent duplicate bookings for the same service, date and time
- Cancelled bookings cannot have their status updated
- Booking status workflow: `PENDING` → `CONFIRMED` → `COMPLETED`

### Search & Filtering

- Search bookings by customer name, email or phone
- Filter bookings by status

### Pagination

- `page` (default: `1`)
- `limit` (default: `10`, maximum: `100`)

### Documentation

- Swagger UI at `/api`

### Database

- Prisma ORM
- PostgreSQL

---

## API Features

- JWT Authentication
- CRUD Services
- CRUD Bookings
- Booking Status Workflow
- Booking Cancellation
- Booking Search
- Booking Filtering
- Pagination
- Duplicate Booking Prevention
- Swagger Documentation

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **NestJS** | Application framework |
| **TypeScript** | Language |
| **Prisma** | ORM and database migrations |
| **PostgreSQL** | Relational database |
| **JWT** | Stateless authentication |
| **Swagger** | API documentation |
| **Class Validator** | Request validation |
| **Docker Compose** | Local PostgreSQL container |

---

## Project Structure

The project follows the standard NestJS modular architecture to keep the codebase clean, scalable and maintainable.

```
service-booking-api/
├── prisma/
│   ├── migrations/          # Database migration history
│   └── schema.prisma        # Data models and relations
├── src/
│   ├── auth/                # Registration, login, JWT strategy and guard
│   ├── bookings/            # Booking controller, service, and DTOs
│   ├── services/            # Service controller, service, and DTOs
│   ├── prisma/              # Global Prisma module and service
│   ├── app.module.ts        # Root application module
│   └── main.ts              # Bootstrap, validation pipe, Swagger setup
├── docker-compose.yml       # Local PostgreSQL container
├── .env.example             # Environment variable template
└── README.md
```

---

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

---

## Environment Variables

Copy the example environment file and update values as needed:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `PORT` | HTTP port (default: `3000`) |
| `NODE_ENV` | Runtime environment (e.g. `development`) |

Example `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/booking_db?schema=public"
JWT_SECRET="your_jwt_secret_here"
PORT=3000
NODE_ENV=development
```

---

## Database Setup

This project uses Prisma Migrations to manage database schema changes.

Start PostgreSQL locally using Docker:

```bash
docker compose up -d
```

Apply migrations and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

---

## Running the Application

### Development

```bash
npm run start:dev
```

The server runs with hot-reload enabled.

### Production

```bash
npm run build
npm run start:prod
```

---

## Postman Collection

A Postman collection containing all API endpoints is included in the `postman/` directory for easy API testing.

---


## API Documentation

Interactive Swagger documentation is available once the application is running:

**http://localhost:3000/api**

Use the **Authorize** button in Swagger UI to attach a JWT bearer token to protected endpoints.

---

## Authentication

1. **Register** a new account via `POST /auth/register`.
2. **Login** via `POST /auth/login` to receive a JWT `accessToken`.
3. Include the token on protected endpoints using the `Authorization` header:

```http
Authorization: Bearer <token>
```

**Note:** Creating a booking (`POST /bookings`) is **public** and does not require authentication. All service endpoints and all other booking endpoints require a valid JWT.

### Example

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Login and receive a JWT |

### Services

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/services` | JWT | Create a new service |
| `GET` | `/services` | JWT | Get all services |
| `GET` | `/services/:id` | JWT | Get a service by ID |
| `PATCH` | `/services/:id` | JWT | Update a service |
| `DELETE` | `/services/:id` | JWT | Delete a service |

### Bookings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings` | Public | Create a booking |
| `GET` | `/bookings` | JWT | Get all bookings (supports `status`, `search`, `page`, `limit`) |
| `GET` | `/bookings/:id` | JWT | Get a booking by ID |
| `PATCH` | `/bookings/:id` | JWT | Update booking details |
| `PATCH` | `/bookings/:id/status` | JWT | Update booking status |
| `PATCH` | `/bookings/:id/cancel` | JWT | Cancel a booking |

---

## Business Rules

The following rules are enforced at the application and database layers:

| Rule | Behaviour |
|---|---|
| **Service must exist** | A booking cannot be created or updated to reference a non-existent service. Inactive services cannot be booked. |
| **No past dates** | `bookingDate` must be today or a future date (UTC comparison). |
| **No duplicate slots** | Only one booking is allowed per service for the same date and time. Enforced in application logic and by a unique database constraint on `(serviceId, bookingDate, bookingTime)`. |
| **Status workflow** | Status updates follow `PENDING` → `CONFIRMED` → `COMPLETED`. Skipping steps or reversing the flow is rejected. |
| **Cancelled bookings** | A cancelled booking cannot be updated via the status endpoint. Cancellation uses a dedicated endpoint. |
| **Service deletion** | A service with existing bookings cannot be deleted (foreign key restriction). |

---

## Bonus Features

- ✔ Swagger Documentation
- ✔ Pagination
- ✔ Search
- ✔ Status Filtering
- ✔ Duplicate Booking Prevention
- ✔ Validation

---

## Assumptions

- **Single user role** — All authenticated users share the same permissions; role-based access control is not implemented.
- **Public booking** — Customers can create bookings without registering or logging in.
- **Protected administration** — Service management and booking administration require JWT authentication.
- **Booking time format** — `bookingTime` is accepted as a string in `HH:mm` format (e.g. `14:30`).
- **Local development** — PostgreSQL is expected to run via the provided `docker-compose.yml` configuration.
- **Password storage** — Passwords are hashed with bcrypt before persistence; plaintext passwords are never stored.
- **Cancellation model** — Cancellation is handled by a dedicated endpoint and sets status to `CANCELLED`, separate from the forward status workflow.

---

## Future Improvements

- Refresh Tokens
- Unit Tests
- Docker Deployment (full application container)
- Email Notifications
- Booking Availability Calendar
- Rate Limiting
- Role-Based Authorization

---

## License

MIT

---

Developed as part of the EN2H Software Engineer Intern (NestJS) Technical Assignment.
