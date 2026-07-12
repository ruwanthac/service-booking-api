# Service Booking API - Engineering Standards

## Project Goal

Build a clean, maintainable, scalable REST API using NestJS, Prisma and PostgreSQL.

This project should follow production-quality coding practices rather than simply satisfying the assignment requirements.

---

# Technology Stack

Framework:
- NestJS

Language:
- TypeScript

Database:
- PostgreSQL

ORM:
- Prisma

Authentication:
- JWT

Password Hashing:
- bcrypt

Validation:
- class-validator

Documentation:
- Swagger

Containerization:
- Docker

---

# Architecture

The project follows a layered architecture.

```
Controller
      ↓
Service
      ↓
PrismaService
      ↓
Database
```

Controllers must never access Prisma directly.

---

# Controller Rules

Controllers are responsible only for:

- Receiving HTTP requests
- Calling services
- Returning responses
- Applying Guards
- Applying DTO validation

Controllers must NOT contain:

- Business logic
- Database queries
- Complex validation
- Password hashing

Controllers should remain as thin as possible.

---

# Service Rules

Services contain all business logic.

Services are responsible for:

- Database operations
- Validation that depends on business rules
- Authentication
- Authorization
- Error handling
- Data transformations

---

# Prisma Rules

Prisma should only be accessed through PrismaService.

Never instantiate PrismaClient inside feature modules.

Use dependency injection.

---

# DTO Rules

Every endpoint that accepts input must use DTOs.

Use:

- class-validator
- class-transformer

Never validate request bodies manually.

---

# Authentication Rules

Use JWT Authentication.

Passwords must always be hashed using bcrypt.

Never store plaintext passwords.

Emails should always be converted to lowercase before saving.

---

# API Rules

Use REST principles.

Plural resource names.

Examples:

GET /services

POST /services

GET /bookings

PATCH /bookings/:id/status

DELETE /services/:id

---

# Error Handling

Use NestJS Exceptions.

Examples:

BadRequestException

UnauthorizedException

ForbiddenException

NotFoundException

ConflictException

InternalServerErrorException

Never throw generic Error objects.

---

# Validation

Business rules:

- Booking must reference an existing Service.
- Booking date cannot be in the past.
- Cancelled bookings cannot become completed.
- Duplicate bookings are not allowed.

---

# Folder Structure

src/

auth/

users/

services/

bookings/

prisma/

common/

Each module contains:

controller

service

module

dto

entities

---

# Naming Conventions

Classes:

PascalCase

Variables:

camelCase

DTOs:

CreateBookingDto

UpdateBookingDto

Enums:

BookingStatus

Files:

booking.service.ts

booking.controller.ts

booking.module.ts

---

# Coding Standards

Follow SOLID principles.

Prefer composition over duplication.

Avoid large functions.

Keep functions focused on one responsibility.

Use dependency injection.

Write readable code before clever code.

---

# Git

Use meaningful commit messages.

Examples:

feat: implement JWT authentication

feat: add booking CRUD

fix: prevent duplicate bookings

refactor: simplify booking validation

docs: update README

---

# AI Rules

Cursor must follow these rules.

Do NOT generate unrelated modules.

Implement one module at a time.

Explain generated code before applying it.

Never invent business rules.

Follow NestJS best practices.

Keep architecture consistent throughout the project.