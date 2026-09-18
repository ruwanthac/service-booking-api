# Multi-Tenant Booking Platform — Project Plan

> Put this file in the root of the `service-booking-api` repo (you can also copy the "Working rules" section into `CLAUDE.md`).
> **First task for Claude Code:** read the existing code, compare it to this plan, and report what already exists and what is missing before changing anything.

---

## 1. What we are building

Upgrade the existing **Service Booking API** (NestJS, TypeScript, PostgreSQL, Prisma, JWT, Swagger, Docker Compose) into a **multi-tenant appointment booking platform** for small businesses such as salons, clinics, or vehicle service garages.

- One deployment serves many businesses (**tenants**). Each tenant has its own staff, services, working hours, and customers.
- Customers see **only real open time slots** and can book, view, and cancel appointments.
- Owners and staff manage services, schedules, and bookings, and see a simple dashboard.
- Confirmation and reminder emails are sent through a background queue.

**Purpose:** a finished, portfolio-quality project for a junior software engineer's CV. It will **not** be launched publicly and will have no real users. "Finished" means: complete, tested, containerised, documented, and demonstrable with a seeded demo and a video.

**Hard requirement:** the developer (a student) must be able to explain every design decision in an interview. Prefer simple, readable solutions over clever ones, and explain trade-offs.

---

## 2. Tech stack

| Area | Choice |
|---|---|
| Backend | NestJS, TypeScript (existing) |
| Database | PostgreSQL + Prisma (existing) |
| Cache / queue / rate limits | Redis, BullMQ, `@nestjs/throttler` |
| Auth | JWT access + refresh tokens (rotation), bcrypt |
| Docs | Swagger/OpenAPI (existing) |
| Testing | Jest, Supertest, k6 (load) |
| CI | GitHub Actions |
| Containers | Docker, Docker Compose |
| Email (dev) | Mailpit or MailHog container |
| Frontend | React + Vite + TypeScript + Tailwind, in `/web` (kept minimal) |
| Logging | pino (structured logs, request IDs) |

Do not add new frameworks or services without asking first.

---

## 3. Scope

### Must have
1. **Multi-tenancy** with strict data isolation
2. **Roles and permissions:** `OWNER`, `STAFF`, `CUSTOMER`
3. **Availability engine** (working hours, breaks, time off, service duration, buffers)
4. **Concurrency-safe booking** (no double-booking) with a status workflow and cancellation rules
5. **Background email notifications** (confirmation, reminder, cancellation) with retries
6. **Redis caching** and **rate limiting**
7. **Auth hardening:** refresh token rotation, env validation, Helmet, CORS
8. **Minimal frontend:** public booking page and owner dashboard
9. **Quality:** unit + e2e tests, CI, Docker, seed data, load tests, README, architecture diagram, design decisions

### Nice to have (only after everything above is done)
- PayHere **sandbox** payments with webhook handling and refunds on cancellation
- Audit log of booking changes

### Explicitly out of scope
Public deployment, real payments, SMS/WhatsApp, Google Calendar sync, reviews, custom subdomains, mobile app, and multi-branch businesses. Record these under "Future work" in the README instead of building them.

---

## 4. Architecture decisions (proposed; confirm with the developer before implementing)

**Multi-tenancy model:** shared database, shared schema, `tenantId` column on every tenant-owned table.
- Every query on tenant-owned data must be scoped by `tenantId`, taken from the authenticated user's token, never from request input.
- Centralise the scoping (for example a Prisma client extension or a tenant-aware base service) so it is hard to forget.
- Add tests proving Tenant A cannot read or modify Tenant B's data through any endpoint.
- Stretch idea (only if time allows): Postgres Row-Level Security as a second layer.

**Double-booking prevention:** enforce it in the **database**, not only in application code.
- Use a PostgreSQL exclusion constraint (`btree_gist` extension) on `(staff_id, tstzrange(start_at, end_at))` for bookings with an active status.
- Prisma cannot express this natively, so add it in a raw SQL migration and document it.
- The API catches the constraint violation and returns `409 Conflict` with a clear message.

**Time handling:** store all timestamps in UTC; interpret working hours in the tenant's timezone (default `Asia/Colombo`). Cover DST-free and edge cases (midnight, end of day) with tests.

**Project layout (suggested):**
```
/src
  /common        (guards, decorators, filters, tenant scoping, logging)
  /auth
  /tenants
  /users
  /staff
  /services
  /availability
  /bookings
  /notifications (BullMQ producers/processors)
  /dashboard
/prisma          (schema, migrations, seed)
/web             (React frontend)
/test            (e2e)
/load-tests      (k6 scripts)
/docs            (architecture diagram, ADRs)
```

---

## 5. Data model (starting point; refine as needed)

- **Tenant:** id, name, slug (unique), timezone, settings (cancellation window hours, slot interval minutes, booking lead time)
- **User:** id, tenantId, email (unique per tenant), passwordHash, name, role (`OWNER | STAFF | CUSTOMER`)
- **StaffProfile:** id, tenantId, userId, displayName, active
- **Service:** id, tenantId, name, description, durationMinutes, bufferMinutes, price, active
- **StaffService:** staffId, serviceId (which staff can perform which service)
- **WorkingHours:** id, tenantId, staffId, weekday (0–6), startTime, endTime, plus optional breaks
- **TimeOff:** id, tenantId, staffId (nullable for business-wide holidays), startAt, endAt, reason
- **Booking:** id, tenantId, serviceId, staffId, customerId, startAt, endAt, status, notes, createdAt, cancelledAt, cancelReason
- **RefreshToken:** id, userId, tokenHash, expiresAt, revokedAt, replacedBy
- **NotificationLog:** id, tenantId, bookingId, type, status, attempts, lastError
- **AuditLog (optional):** id, tenantId, actorId, entity, entityId, action, before, after, createdAt

Add indexes for common queries (bookings by staff and time range, bookings by tenant and date, users by tenant and email).

**Booking status workflow:** `PENDING → CONFIRMED → COMPLETED`, plus `CANCELLED` and `NO_SHOW`. Invalid transitions return `409` or `400`. Only `PENDING` and `CONFIRMED` bookings block a time slot.

---

## 6. Feature specifications

### 6.1 Auth and roles
- Register a business (creates Tenant + OWNER), register customer under a tenant slug, login, refresh, logout.
- Refresh token rotation with reuse detection (revoke the chain if an old token is reused).
- Permission matrix:

| Action | OWNER | STAFF | CUSTOMER |
|---|---|---|---|
| Manage tenant settings, services, staff | ✅ | ❌ | ❌ |
| Manage own working hours / time off | ✅ | ✅ (own) | ❌ |
| View all tenant bookings | ✅ | ✅ (own by default) | ❌ |
| Update booking status | ✅ | ✅ (own) | ❌ |
| Create booking | ✅ | ✅ | ✅ (self) |
| View / cancel own bookings | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ❌ | ❌ |

### 6.2 Availability engine
- Input: tenant, service, date range, optional staff.
- Output: list of available slots per staff member.
- Rules: within working hours, outside breaks and time off, no overlap with active bookings (including buffer time), respect slot interval and minimum booking lead time.
- Pure function core (easy to unit test), with a thin service layer that loads data.
- Cache results in Redis with a short TTL; invalidate when bookings, working hours, or time off change.

### 6.3 Bookings
- Create: validate the slot is still available, then insert; the database constraint is the final guard.
- Cancel: allowed only outside the tenant's cancellation window (for customers); owners can override.
- Reschedule (nice to have): cancel + rebook in one transaction.
- List with filters (date range, status, staff), search, and pagination.

### 6.4 Notifications
- On booking creation: enqueue a confirmation email.
- Schedule a delayed reminder job (for example 24 hours before start); remove it if the booking is cancelled.
- On cancellation: enqueue a cancellation email.
- Retries with exponential backoff; failures recorded in `NotificationLog`.
- Use Mailpit/MailHog in development, so nothing real is sent.

### 6.5 Dashboard (owner)
- Bookings per day, busiest hours, cancellations and no-show rate, bookings per staff member (date range filter).

### 6.6 Frontend (keep it small)
- Public booking page `/b/:tenantSlug`: choose service → staff (or any) → date → slot → details → confirmation.
- Customer "my bookings" page with cancel.
- Owner dashboard: bookings list/calendar view, services and staff management, stats.
- Backend quality matters more than UI polish. Clean and simple is enough.

### 6.7 Cross-cutting
- Global validation pipe with DTOs, consistent error format, and correct status codes.
- Rate limiting (stricter on auth endpoints), Helmet, CORS allow-list.
- Environment variable validation at startup (fail fast).
- `/health` endpoint checking DB and Redis.
- Structured logs with request ID; never log passwords or tokens.

---

## 7. Testing requirements

- **Unit tests:** availability engine (many edge cases), status transitions, cancellation rules, token rotation.
- **E2E tests (Supertest, real Postgres + Redis in Docker):** auth flows, booking lifecycle, permissions per role.
- **Tenant isolation tests:** for every tenant-owned endpoint, verify cross-tenant access fails.
- **Concurrency test:** fire N (e.g. 20) simultaneous requests for the same slot; exactly one succeeds, the rest get `409`.
- Report the **real** coverage percentage from Jest. Do not invent numbers.
- Load test with **k6**: availability search and booking creation; record requests/sec and p95 latency, with and without Redis caching. Store scripts in `/load-tests` and results in the README.

---

## 8. DevOps requirements

- **Docker:** multi-stage Dockerfile for the API; Docker Compose runs API, PostgreSQL, Redis, Mailpit, and (optionally) the frontend.
- **One-command demo:** `docker compose up` followed by a seed command creates 2 demo tenants with staff, services, working hours, and sample bookings, plus documented demo logins.
- **GitHub Actions:** on every push and PR run lint, unit tests, e2e tests (with Postgres and Redis service containers), and Docker build. Add a CI badge to the README.
- Provide `.env.example` with every variable documented.

---

## 9. Documentation deliverables

- **README:** overview, screenshots, architecture diagram (Mermaid), quick start, environment variables, API overview with Swagger link, testing instructions, load test results, and "Future work".
- **Design decisions (ADRs or a README section):** multi-tenancy model, database-level double-booking prevention, timezone handling, why BullMQ, caching and invalidation strategy, and known limitations.
- **Demo video script** (2–3 minutes): booking flow, owner dashboard, cancellation, email arriving, a quick look at CI and tests.

---

## 10. Suggested 6-week schedule

Each week ends with all tests green and the README updated.

| Week | Goal | Acceptance criteria |
|---|---|---|
| **1** | Foundation: audit repo, tests, CI, Docker | Existing code reviewed and gaps listed; unit + e2e test setup working; GitHub Actions running lint/tests/build; Compose runs API + Postgres + Redis + Mailpit; `/health` and env validation added |
| **2** | Multi-tenancy + roles | Tenant model and scoped queries; permission guards; refresh token rotation; tenant isolation tests passing |
| **3** | Availability + safe booking | Availability engine with unit tests; exclusion-constraint migration; status workflow; cancellation rules; concurrency test passing |
| **4** | Background jobs, caching, hardening | BullMQ emails with retries and reminders; Redis caching + invalidation; rate limiting; structured logging |
| **5** | Frontend + seed data | Booking page, customer page, owner dashboard; dashboard API; seed script; Compose runs everything |
| **6** | Proof and polish | k6 results; final coverage number; README, diagram, ADRs; demo video; cleanup and refactor |

**Scope freeze:** at the end of week 2, no new features. New ideas go to "Future work".

---

## 11. Definition of done

- [ ] `docker compose up` + seed works from a fresh clone using only the README
- [ ] Demo tenants and logins documented
- [ ] Tenant isolation tests and concurrency test pass in CI
- [ ] Real coverage number recorded in the README
- [ ] k6 results (with real numbers) in the README
- [ ] Swagger docs complete and accurate
- [ ] Architecture diagram and design decisions written
- [ ] Demo video recorded
- [ ] No secrets in the repo or git history; `.env.example` provided
- [ ] CV and LinkedIn updated with truthful, measured claims only

---

## 12. Working rules for Claude Code

1. **Explore first.** Read the existing repo and summarise what exists vs. this plan before writing code.
2. **Plan before coding.** For each week, propose a short task list and wait for approval. Work in small steps.
3. **One feature at a time,** on its own branch, with tests in the same change. Use conventional commit messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
4. **Teach as you go.** The developer must understand every line. Explain design choices and trade-offs in plain language, and prefer simple, conventional NestJS patterns.
5. **Do not expand scope.** Do not add libraries, services, or features that are not in this plan without asking.
6. **Never invent numbers** (coverage, latency, throughput). Only report what was measured by running the tools.
7. **Security basics always:** no secrets in code, validate all input, never trust a tenant ID from the request, never log sensitive data.
8. **Keep the repo runnable at all times:** the main branch must always build and pass tests.
9. **Flag risks and unknowns** (for example timezone edge cases or Prisma limitations) instead of guessing.
10. **Update docs** (README, `.env.example`, Swagger, ADRs) in the same change as the code they describe.
