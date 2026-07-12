# Service Booking API

## Project Overview

A RESTful Booking Platform API built using NestJS, PostgreSQL and Prisma.

The system allows administrators to manage services while allowing customers to create bookings without authentication.

The application follows REST API best practices and uses JWT authentication for protected resources.

---

# Technology Stack

Framework
- NestJS

Language
- TypeScript

Database
- PostgreSQL

ORM
- Prisma

Authentication
- JWT

Password Hashing
- bcrypt

Validation
- class-validator

Documentation
- Swagger

Containerization
- Docker

---

# Modules

Authentication

Users

Services

Bookings

Prisma

Common

---

# Functional Requirements

Authentication

- Register
- Login

Services

- Create Service
- Update Service
- Delete Service
- Get All Services
- Get Service By ID

Bookings

- Create Booking
- Get All Bookings
- Get Booking By ID
- Update Booking Status
- Cancel Booking

---

# Business Rules

- Booking must belong to an existing Service.
- Booking date cannot be in the past.
- Cancelled bookings cannot become Completed.
- Only authenticated users manage Services.
- Customers create Bookings without authentication.
- Prevent duplicate bookings.

---

# Development Order

Phase 1

Infrastructure

✅ Completed

---

Phase 2

Database

✅ Completed

---

Phase 3

Prisma Module

---

Phase 4

Authentication Module

---

Phase 5

Services Module

---

Phase 6

Bookings Module

---

Phase 7

Swagger

---

Phase 8

Docker Finalization

---

Phase 9

README