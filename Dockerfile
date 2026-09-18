# ---- Stage 1: install all dependencies (needed to compile TypeScript) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: generate the Prisma client and compile to JavaScript ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Stage 3: install production-only dependencies ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 4: minimal runtime image ----
# Keeping this separate from the build stages means the final image never
# contains TypeScript source, the Nest CLI, or other build-only tooling.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
# The Prisma client is generated code that lives inside node_modules; the
# production install above does not run `prisma generate` (the `prisma`
# CLI needs to resolve dev tooling), so copy the already-generated client
# from the builder stage instead of regenerating it here.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY package.json ./

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
USER nestjs

EXPOSE 3000

# Apply any pending migrations, then start the API. `prisma migrate deploy`
# is safe to run on every container start: it is a no-op when the database
# is already up to date.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
