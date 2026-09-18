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

### Option A — run everything in Docker

```bash
git clone https://github.com/ruwanthac/service-booking-api
cd service-booking-api

cp .env.example .env   # edit JWT_SECRET if you want a different value

docker compose up -d --build
```

This builds the API image and starts the API and PostgreSQL together. The
API container runs pending Prisma migrations automatically before it starts
listening. It's available at **http://localhost:3000**.

### Option B — run the API locally, database in Docker

```bash
git clone https://github.com/ruwanthac/service-booking-api
cd service-booking-api

npm install

cp .env.example .env

docker compose up -d postgres

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

### Reliability

- `GET /health` — reports whether the database is reachable
- Environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`) are validated at startup; the app fails fast with a clear error instead of starting in a broken state

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
| **Class Validator** | Request validation, environment variable validation |
| **Jest / Supertest** | Unit and end-to-end testing |
| **Docker / Docker Compose** | Containerized API + PostgreSQL |
| **GitHub Actions** | CI: lint, unit tests, e2e tests, build |

---

## Project Structure

The project follows the standard NestJS modular architecture to keep the codebase clean, scalable and maintainable.

```
service-booking-api/
├── .github/workflows/
│   └── ci.yml               # Lint, unit tests, e2e tests, build
├── prisma/
│   ├── migrations/          # Database migration history
│   └── schema.prisma        # Data models and relations
├── src/
│   ├── auth/                # Registration, login, JWT strategy and guard
│   ├── bookings/            # Booking controller, service, and DTOs
│   ├── services/            # Service controller, service, and DTOs
│   ├── health/              # GET /health (checks database connectivity)
│   ├── config/              # Startup environment variable validation
│   ├── prisma/              # Global Prisma module and service
│   ├── app.module.ts        # Root application module
│   └── main.ts              # Bootstrap, validation pipe, Swagger setup
├── test/
│   ├── app.e2e-spec.ts      # End-to-end tests (real Postgres)
│   └── jest-e2e.json
├── Dockerfile               # Multi-stage build for the API image
├── docker-compose.yml       # API + PostgreSQL, for running the full stack
├── docker-compose.test.yml  # Throwaway PostgreSQL used only by e2e tests
├── .env.example             # Environment variable template
├── .env.test                # Fixed test-only credentials for e2e tests
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

These variables are validated when the application starts (`src/config/env.validation.ts`): `DATABASE_URL` must be a valid `postgresql://` connection string, `JWT_SECRET` must be at least 8 characters, `PORT` must be a number between 1 and 65535, and `NODE_ENV` must be `development`, `test`, or `production`. If any variable is missing or malformed, the app fails immediately at startup with a descriptive error instead of starting in a broken state.

---

## Database Setup

This project uses Prisma Migrations to manage database schema changes.

Start PostgreSQL locally using Docker:

```bash
docker compose up -d postgres
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

### Docker

The `Dockerfile` is a multi-stage build: one stage installs all dependencies and compiles TypeScript, a second stage installs only production dependencies, and the final image contains just the compiled output, the generated Prisma client, and production `node_modules` — no source code or build tooling.

```bash
docker compose up -d --build   # API + PostgreSQL
docker compose logs -f api     # follow API logs
docker compose down            # stop (add -v to also delete the database volume)
```

The API container runs `prisma migrate deploy` automatically before starting, so a fresh `docker compose up` always ends up with an up-to-date schema.

---

## Testing

The project has two test suites:

- **Unit tests** (`npm test`) mock `PrismaService` and `JwtService`, so they run without a database. At the time of writing: **54 tests passing** across 6 suites, covering `AuthService`, `ServiceService`, `BookingService`, `HealthController`, and the environment validation logic. Run `npm run test:cov` for a coverage report — the current measured coverage (unit tests only; controllers and DTOs are exercised by the e2e suite instead) is **~45% statements / ~46% branches**.
- **End-to-end tests** (`npm run test:e2e`) boot the real Nest application and exercise it over HTTP with Supertest, against a real PostgreSQL instance — no mocks. At the time of writing: **15 tests passing**, covering register → login → create service → create booking (public) → list/filter bookings (JWT-protected) → update status → cancel, plus `GET /health`, duplicate-registration (`409`), duplicate-slot (`409`), invalid status transition (`400`), and missing-JWT (`401`) cases.

To run the e2e suite locally:

```bash
npm run test:e2e:db:up    # starts a throwaway Postgres on localhost:5433
npm run test:e2e          # applies migrations, then runs the e2e suite
npm run test:e2e:db:down  # stops and removes the throwaway database
```

The e2e suite reads its configuration from the committed `.env.test` file (test-only credentials, not used anywhere else) via Node's `--env-file` flag, so it never touches your local development database.

---

## Continuous Integration

Every push and pull request runs through GitHub Actions (`.github/workflows/ci.yml`):

1. Install dependencies
2. Lint (`eslint`, no auto-fix)
3. Unit tests
4. End-to-end tests, against a real `postgres:16` service container
5. Build

The badge at the top of this README reflects the status of the most recent run on the default branch.

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

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Reports `{ status: 'ok', database: 'up' }`, or `503` if the database is unreachable |

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
- ✔ Unit + End-to-End Tests
- ✔ CI Pipeline (GitHub Actions)
- ✔ Dockerized API + Database
- ✔ Health Check Endpoint
- ✔ Startup Environment Validation

---

## Assumptions

- **Single user role** — All authenticated users share the same permissions; role-based access control is not implemented.
- **Public booking** — Customers can create bookings without registering or logging in.
- **Protected administration** — Service management and booking administration require JWT authentication.
- **Booking time format** — `bookingTime` is accepted as a string in `HH:mm` format (e.g. `14:30`).
- **Local development** — PostgreSQL (and optionally the API itself) is expected to run via the provided `docker-compose.yml` configuration.
- **Password storage** — Passwords are hashed with bcrypt before persistence; plaintext passwords are never stored.
- **Cancellation model** — Cancellation is handled by a dedicated endpoint and sets status to `CANCELLED`, separate from the forward status workflow.

---

## Future Improvements

- Refresh Tokens
- Multi-tenancy and role-based authorization (see `PROJECT_PLAN.md`)
- Availability engine and concurrency-safe booking via a database exclusion constraint
- Email Notifications
- Redis caching and rate limiting
- Booking Availability Calendar
- Minimal frontend (public booking page + owner dashboard)

---

## License

MIT

---

Developed as part of the EN2H Software Engineer Intern (NestJS) Technical Assignment.
