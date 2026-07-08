# NQLN Platform — Plan 1: Setup base de la plataforma

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tener la app "NQLN Platform" scaffoldeada (Remix oficial Shopify), con TypeScript strict, Postgres + Redis vía Docker, health endpoint, OAuth funcionando contra un dev store, y desplegada en Coolify — la base sobre la que se construyen los módulos G/D/B/C/E/F.

**Architecture:** App monolítica modular en Node.js 20 + Remix v2, usando `@shopify/shopify-app-remix` para OAuth/webhooks. Persistencia en Postgres (Prisma), colas en Redis (BullMQ). Despliegue en Coolify con Docker Compose (3 servicios: app + db + redis). Shopify es la fuente de verdad de datos de cliente; Postgres solo guarda sessions, audit logs y métricas.

**Tech Stack:** TypeScript, Remix v2, `@shopify/shopify-app-remix`, Prisma, PostgreSQL 15, Redis 7, BullMQ, Pino (logs), Zod (validación), Biome (lint/format), Vitest (tests), Docker.

**Spec de referencia:** `docs/superpowers/specs/2026-05-26-nqln-customer-data-design.md` (Secciones 4, 6, 10).

---

## Prerequisitos (Task 0 — sin código, verificar antes de empezar)

- [ ] **Cuenta Shopify Partners** creada en https://partners.shopify.com (gratis)
- [ ] **Development store** creado desde el Partners dashboard (Stores → Add store → Development store). Anota su dominio `*.myshopify.com`
- [ ] **Node.js 20+** instalado: `node --version` → debe ser v20.x o superior
- [ ] **Docker + Docker Compose** instalados: `docker --version` y `docker compose version`
- [ ] **Shopify CLI** instalado: `npm install -g @shopify/cli@latest` → `shopify version`
- [ ] **Acceso a Coolify** (panel web del servidor del merchant) + un subdominio disponible (ej: `nqln-platform.tudominio.com`) apuntando al servidor
- [ ] **Git** y un repo remoto privado vacío (GitHub/GitLab) para `nqln-platform`

---

## File Structure (qué se crea en este plan)

```
nqln-platform/                          # repo NUEVO, separado del tema
├── app/
│   ├── routes/
│   │   ├── _index/route.tsx            # (del template) landing
│   │   ├── app._index.tsx              # (del template) home admin
│   │   ├── auth.$.tsx                  # (del template) OAuth
│   │   └── api.health.tsx              # NUEVO health endpoint
│   ├── lib/
│   │   ├── env.server.ts               # NUEVO validación env con Zod
│   │   ├── logger.server.ts            # NUEVO Pino logger
│   │   ├── db.server.ts                # NUEVO Prisma client singleton
│   │   └── queue.server.ts             # NUEVO BullMQ + Redis
│   └── shopify.server.ts               # (del template) config Shopify
├── app/modules/                        # NUEVO (vacío, placeholder .gitkeep)
├── prisma/
│   └── schema.prisma                   # MODIFICAR esquema mínimo
├── tests/
│   ├── env.test.ts                     # NUEVO
│   ├── health.test.ts                  # NUEVO
│   └── queue.test.ts                   # NUEVO
├── docker/
│   ├── Dockerfile                      # NUEVO
│   └── docker-compose.yml              # NUEVO
├── scripts/
│   └── entrypoint.sh                   # NUEVO
├── biome.json                          # NUEVO
├── vitest.config.ts                    # NUEVO
├── tsconfig.json                       # MODIFICAR strict
├── .env.example                        # NUEVO
└── shopify.app.toml                    # (del template)
```

---

### Task 1: Scaffold de la app con Shopify CLI

**Files:**
- Create: todo el proyecto `nqln-platform/` (generado por CLI)

- [ ] **Step 1: Generar el proyecto**

Run en el directorio padre (NO dentro del tema):
```bash
npm init @shopify/app@latest -- --template remix --flavor typescript
```
Cuando pregunte el nombre: `nqln-platform`. Esto crea la carpeta con el template oficial Remix + TypeScript.

- [ ] **Step 2: Inicializar git y conectar al remoto**

```bash
cd nqln-platform
git init
git add -A
git commit -m "chore: scaffold Shopify Remix app from official template"
git remote add origin <URL_DE_TU_REPO_PRIVADO>
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Verificar que el proyecto arranca**

Run: `npm install && npm run dev`
Expected: el CLI pide loguearte en Partners, elegir el dev store, y abre un túnel. Debe mostrar una URL de preview. Detén con Ctrl+C tras confirmar que arranca sin errores.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initial install and dependency lock"
```

---

### Task 2: TypeScript strict + Biome

**Files:**
- Modify: `tsconfig.json`
- Create: `biome.json`

- [ ] **Step 1: Activar strict en tsconfig.json**

Asegura que `compilerOptions` incluya:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 2: Instalar y configurar Biome**

```bash
npm install --save-dev --save-exact @biomejs/biome
```

Create `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "files": { "ignore": ["build", "node_modules", "prisma/migrations"] }
}
```

- [ ] **Step 3: Añadir scripts a package.json**

En `"scripts"` agrega:
```json
"lint": "biome check app tests",
"lint:fix": "biome check --write app tests",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Verificar**

Run: `npm run typecheck && npm run lint`
Expected: typecheck pasa sin errores; biome puede reportar formato — corre `npm run lint:fix` para arreglar.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json biome.json package.json package-lock.json
git commit -m "chore: enable TypeScript strict mode and Biome linting"
```

---

### Task 3: Estructura de carpetas + Vitest

**Files:**
- Create: `app/modules/.gitkeep`, `app/lib/.gitkeep`, `tests/.gitkeep`
- Create: `vitest.config.ts`

- [ ] **Step 1: Crear carpetas**

```bash
mkdir -p app/modules app/lib tests
touch app/modules/.gitkeep app/lib/.gitkeep
```

- [ ] **Step 2: Instalar Vitest**

```bash
npm install --save-dev vitest
```

- [ ] **Step 3: Crear vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
});
```

- [ ] **Step 4: Añadir script de test a package.json**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Crear test de humo `tests/smoke.test.ts`**

```typescript
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs the test suite", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Verificar que Vitest corre**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 7: Commit**

```bash
git add app/modules app/lib tests vitest.config.ts package.json package-lock.json
git commit -m "chore: add Vitest and modular folder structure"
```

---

### Task 4: Validación de variables de entorno con Zod (TDD)

**Files:**
- Create: `app/lib/env.server.ts`
- Create: `tests/env.test.ts`
- Create: `.env.example`

- [ ] **Step 1: Escribir el test que falla `tests/env.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { parseEnv } from "../app/lib/env.server";

describe("parseEnv", () => {
  it("returns a typed config when all required vars are present", () => {
    const result = parseEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://u:p@db:5432/nqln",
      REDIS_URL: "redis://redis:6379",
      SHOPIFY_API_KEY: "key",
      SHOPIFY_API_SECRET: "secret",
      SHOPIFY_APP_URL: "https://app.example.com",
      SCOPES: "read_customers,write_customers",
    });
    expect(result.DATABASE_URL).toBe("postgresql://u:p@db:5432/nqln");
    expect(result.NODE_ENV).toBe("production");
  });

  it("throws when a required var is missing", () => {
    expect(() =>
      parseEnv({ NODE_ENV: "production" } as Record<string, string>),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- env`
Expected: FAIL — "Cannot find module '../app/lib/env.server'".

- [ ] **Step 3: Implementar `app/lib/env.server.ts`**

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_API_SECRET: z.string().min(1),
  SHOPIFY_APP_URL: z.string().url(),
  SCOPES: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }
  return parsed.data;
}

export const env: Env = parseEnv(process.env);
```

Nota: `zod` ya viene como dependencia transitiva, pero asegúralo: `npm install zod`.

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- env`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Crear `.env.example`**

```
NODE_ENV=development
DATABASE_URL=postgresql://nqln:changeme@localhost:5432/nqln_platform
REDIS_URL=redis://localhost:6379
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=https://nqln-platform.tudominio.com
SCOPES=read_customers,write_customers,read_orders,read_products
```

- [ ] **Step 6: Commit**

```bash
git add app/lib/env.server.ts tests/env.test.ts .env.example package.json package-lock.json
git commit -m "feat: typed env validation with Zod"
```

---

### Task 5: Logger estructurado con Pino

**Files:**
- Create: `app/lib/logger.server.ts`

- [ ] **Step 1: Instalar Pino**

```bash
npm install pino
```

- [ ] **Step 2: Implementar `app/lib/logger.server.ts`**

```typescript
import pino from "pino";
import { env } from "./env.server";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: { app: "nqln-platform" },
});

export function childLogger(module: string) {
  return logger.child({ module });
}
```

- [ ] **Step 3: Verificar manualmente**

Run:
```bash
node --import tsx -e "import('./app/lib/logger.server.ts').then(m => m.logger.info('hello'))"
```
(Si `tsx` no está: `npm install --save-dev tsx`.)
Expected: una línea JSON con `"level":"info"`, `"app":"nqln-platform"`, `"msg":"hello"`.

- [ ] **Step 4: Commit**

```bash
git add app/lib/logger.server.ts package.json package-lock.json
git commit -m "feat: structured logging with Pino"
```

---

### Task 6: Esquema Prisma mínimo

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/lib/db.server.ts`

- [ ] **Step 1: Reemplazar `prisma/schema.prisma`**

El template trae un modelo `Session`. Añade los modelos del spec (Sección 6). El archivo completo:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  firstName     String?
  lastName      String?
  email         String?
  accountOwner  Boolean   @default(false)
  locale        String?
  collaborator  Boolean?  @default(false)
  emailVerified Boolean?  @default(false)
}

model AuditLog {
  id         String   @id @default(cuid())
  shop       String
  customerId String?
  module     String
  action     String
  payload    Json
  createdAt  DateTime @default(now())

  @@index([shop, customerId])
  @@index([shop, module, createdAt])
}

model Metric {
  id          String   @id @default(cuid())
  shop        String
  key         String
  granularity String
  periodStart DateTime
  value       Float
  meta        Json?

  @@unique([shop, key, granularity, periodStart])
}

model BackfillRun {
  id             String    @id @default(cuid())
  shop           String
  module         String
  status         String
  totalCustomers Int
  processed      Int       @default(0)
  failed         Int       @default(0)
  startedAt      DateTime  @default(now())
  finishedAt     DateTime?
  errorLog       Json?
}
```

- [ ] **Step 2: Cambiar el provider de SQLite a Postgres**

El template usa SQLite por defecto. Ya lo cambiamos en el schema arriba (`provider = "postgresql"`). Asegúrate de que `DATABASE_URL` en `.env` apunte a Postgres local (lo levantamos en Task 9).

- [ ] **Step 3: Crear `app/lib/db.server.ts` (singleton Prisma)**

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
```

- [ ] **Step 4: Verificar que el schema es válido**

Run: `npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid 🚀".

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma app/lib/db.server.ts
git commit -m "feat: Prisma schema (Session, AuditLog, Metric, BackfillRun) on Postgres"
```

---

### Task 7: Health endpoint (TDD)

**Files:**
- Create: `app/lib/health.server.ts`
- Create: `app/routes/api.health.tsx`
- Create: `tests/health.test.ts`

- [ ] **Step 1: Escribir el test que falla `tests/health.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { computeHealth } from "../app/lib/health.server";

describe("computeHealth", () => {
  it("reports ok when db and redis checks succeed", async () => {
    const result = await computeHealth({
      checkDb: vi.fn().mockResolvedValue(true),
      checkRedis: vi.fn().mockResolvedValue(true),
    });
    expect(result.status).toBe("ok");
    expect(result.db).toBe(true);
    expect(result.redis).toBe(true);
  });

  it("reports degraded when a dependency fails", async () => {
    const result = await computeHealth({
      checkDb: vi.fn().mockResolvedValue(true),
      checkRedis: vi.fn().mockRejectedValue(new Error("down")),
    });
    expect(result.status).toBe("degraded");
    expect(result.redis).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- health`
Expected: FAIL — "Cannot find module '../app/lib/health.server'".

- [ ] **Step 3: Implementar `app/lib/health.server.ts`**

```typescript
type HealthChecks = {
  checkDb: () => Promise<boolean>;
  checkRedis: () => Promise<boolean>;
};

export type HealthResult = {
  status: "ok" | "degraded";
  db: boolean;
  redis: boolean;
  timestamp: string;
};

export async function computeHealth(checks: HealthChecks): Promise<HealthResult> {
  const safe = async (fn: () => Promise<boolean>) => {
    try {
      return await fn();
    } catch {
      return false;
    }
  };
  const [db, redis] = await Promise.all([safe(checks.checkDb), safe(checks.checkRedis)]);
  return {
    status: db && redis ? "ok" : "degraded",
    db,
    redis,
    timestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- health`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Crear la ruta `app/routes/api.health.tsx`**

```typescript
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "../lib/db.server";
import { computeHealth } from "../lib/health.server";

export async function loader(_args: LoaderFunctionArgs) {
  const result = await computeHealth({
    checkDb: async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    checkRedis: async () => {
      const { pingRedis } = await import("../lib/queue.server");
      return pingRedis();
    },
  });
  return json(result, { status: result.status === "ok" ? 200 : 503 });
}
```

(`pingRedis` se implementa en Task 8.)

- [ ] **Step 6: Commit**

```bash
git add app/lib/health.server.ts app/routes/api.health.tsx tests/health.test.ts
git commit -m "feat: health endpoint with db and redis checks"
```

---

### Task 8: Redis + BullMQ (TDD)

**Files:**
- Create: `app/lib/queue.server.ts`
- Create: `tests/queue.test.ts`

- [ ] **Step 1: Instalar BullMQ e ioredis**

```bash
npm install bullmq ioredis
```

- [ ] **Step 2: Escribir el test que falla `tests/queue.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { buildQueueName } from "../app/lib/queue.server";

describe("buildQueueName", () => {
  it("namespaces queue names by module", () => {
    expect(buildQueueName("customer-data", "recalc")).toBe("nqln:customer-data:recalc");
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `npm test -- queue`
Expected: FAIL — "Cannot find module '../app/lib/queue.server'".

- [ ] **Step 4: Implementar `app/lib/queue.server.ts`**

```typescript
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env.server";

export const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export function buildQueueName(module: string, job: string): string {
  return `nqln:${module}:${job}`;
}

const queues = new Map<string, Queue>();

export function getQueue(module: string, job: string): Queue {
  const name = buildQueueName(module, job);
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection });
    queues.set(name, queue);
  }
  return queue;
}

export async function pingRedis(): Promise<boolean> {
  const pong = await connection.ping();
  return pong === "PONG";
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npm test -- queue`
Expected: PASS — 1 test passed. (El test de `buildQueueName` no requiere Redis vivo.)

- [ ] **Step 6: Commit**

```bash
git add app/lib/queue.server.ts tests/queue.test.ts package.json package-lock.json
git commit -m "feat: BullMQ queue helpers and Redis connection"
```

---

### Task 9: Dockerfile multi-stage

**Files:**
- Create: `docker/Dockerfile`
- Create: `scripts/entrypoint.sh`

- [ ] **Step 1: Crear `scripts/entrypoint.sh`**

```bash
#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy
echo "Starting server..."
npm run start
```

- [ ] **Step 2: Crear `docker/Dockerfile`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache wget
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
CMD ["./entrypoint.sh"]
```

- [ ] **Step 3: Verificar que el build de Docker funciona**

Run: `docker build -f docker/Dockerfile -t nqln-platform:test .`
Expected: build termina sin error y crea la imagen `nqln-platform:test`.

- [ ] **Step 4: Commit**

```bash
git add docker/Dockerfile scripts/entrypoint.sh
git commit -m "build: multi-stage Dockerfile with migrate-on-start entrypoint"
```

---

### Task 10: docker-compose con Postgres + Redis

**Files:**
- Create: `docker/docker-compose.yml`

- [ ] **Step 1: Crear `docker/docker-compose.yml`**

```yaml
services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://nqln:${DB_PASSWORD}@db:5432/nqln_platform
      REDIS_URL: redis://redis:6379
      SHOPIFY_API_KEY: ${SHOPIFY_API_KEY}
      SHOPIFY_API_SECRET: ${SHOPIFY_API_SECRET}
      SHOPIFY_APP_URL: ${SHOPIFY_APP_URL}
      SCOPES: ${SCOPES}
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: nqln_platform
      POSTGRES_USER: nqln
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nqln -d nqln_platform"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

- [ ] **Step 2: Crear un `.env` local para compose (NO commitear)**

```bash
cat > docker/.env <<'EOF'
DB_PASSWORD=localdevpassword
SHOPIFY_API_KEY=placeholder
SHOPIFY_API_SECRET=placeholder
SHOPIFY_APP_URL=http://localhost:3000
SCOPES=read_customers,write_customers,read_orders,read_products
EOF
echo "docker/.env" >> .gitignore
```

- [ ] **Step 3: Levantar el stack localmente y verificar health**

Run:
```bash
cd docker && docker compose --env-file .env up -d --build
sleep 20
wget -qO- http://localhost:3000/api/health
```
Expected: JSON `{"status":"ok","db":true,"redis":true,...}`. Si `status` es `degraded`, revisa logs con `docker compose logs app`.

- [ ] **Step 4: Bajar el stack**

Run: `docker compose down`

- [ ] **Step 5: Commit**

```bash
cd ..
git add docker/docker-compose.yml .gitignore
git commit -m "build: docker-compose with app, Postgres and Redis"
```

---

### Task 11: Crear la primera migración Prisma

**Files:**
- Create: `prisma/migrations/*` (generado)

- [ ] **Step 1: Levantar solo Postgres para generar la migración**

```bash
cd docker && docker compose --env-file .env up -d db
cd ..
export DATABASE_URL="postgresql://nqln:localdevpassword@localhost:5432/nqln_platform"
```
(En Windows PowerShell: `$env:DATABASE_URL="postgresql://nqln:localdevpassword@localhost:5432/nqln_platform"`)

- [ ] **Step 2: Generar la migración inicial**

Run: `npx prisma migrate dev --name init`
Expected: crea `prisma/migrations/<timestamp>_init/migration.sql` y aplica el schema. Output "Your database is now in sync with your schema."

- [ ] **Step 3: Verificar las tablas**

Run: `npx prisma studio` (abre en navegador) o:
```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env exec db psql -U nqln -d nqln_platform -c "\dt"
```
Expected: ver las tablas `Session`, `AuditLog`, `Metric`, `BackfillRun`.

- [ ] **Step 4: Commit**

```bash
git add prisma/migrations
git commit -m "feat: initial Prisma migration"
```

---

### Task 12: Conectar a dev store y verificar OAuth

**Files:**
- Modify: `shopify.app.toml` (scopes)

- [ ] **Step 1: Configurar scopes en shopify.app.toml**

Asegura que la línea de scopes diga:
```toml
[access_scopes]
scopes = "read_customers,write_customers,read_orders,read_products"
```

- [ ] **Step 2: Correr la app en modo dev y instalarla en el dev store**

Run: `npm run dev`
Expected: el CLI abre un túnel y da una URL de instalación. Ábrela, elige tu dev store, autoriza la app.

- [ ] **Step 3: Verificar el OAuth flow**

En el admin del dev store → Apps → NQLN Platform debe abrir el home embebido sin errores. Verifica en la DB que se creó una `Session`:
```bash
npx prisma studio
```
Expected: una fila en la tabla `Session` con el shop del dev store.

- [ ] **Step 4: Verificar el health endpoint en dev**

Visita `<tunnel-url>/api/health`.
Expected: `{"status":"ok",...}` (con Postgres + Redis locales corriendo vía docker compose).

- [ ] **Step 5: Commit**

```bash
git add shopify.app.toml
git commit -m "chore: configure access scopes for customer data module"
```

---

### Task 13: Deploy a Coolify

**Files:** (ninguno — configuración en panel Coolify)

- [ ] **Step 1: Crear la app en Shopify Partners para producción**

En Partners → Apps → tu app → App setup, anota `Client ID` (=`SHOPIFY_API_KEY`) y `Client secret` (=`SHOPIFY_API_SECRET`).

- [ ] **Step 2: Push del código al repo**

```bash
git push origin main
```

- [ ] **Step 3: Crear el recurso en Coolify**

En el panel Coolify: New Resource → Docker Compose → conecta el repo privado → ruta del compose: `docker/docker-compose.yml`.

- [ ] **Step 4: Configurar Secrets en Coolify**

Agrega como environment/secrets (NO en el repo):
```
DB_PASSWORD=<password fuerte generado>
SHOPIFY_API_KEY=<de Partners>
SHOPIFY_API_SECRET=<de Partners>
SHOPIFY_APP_URL=https://nqln-platform.tudominio.com
SCOPES=read_customers,write_customers,read_orders,read_products
```

- [ ] **Step 5: Asignar dominio y desplegar**

En Coolify, asigna el dominio `nqln-platform.tudominio.com` al servicio `app` (Coolify configura Let's Encrypt). Pulsa Deploy.
Expected: build OK, migraciones aplicadas (ver logs `Running database migrations...`), stack arriba.

- [ ] **Step 6: Verificar health en producción**

Run: `curl https://nqln-platform.tudominio.com/api/health`
Expected: `{"status":"ok","db":true,"redis":true,...}` con HTTPS válido.

- [ ] **Step 7: Actualizar la URL de la app en Partners**

En Partners → App setup → App URL: `https://nqln-platform.tudominio.com`. Allowed redirection URLs: `https://nqln-platform.tudominio.com/auth/callback`, `https://nqln-platform.tudominio.com/auth/shopify/callback`, `https://nqln-platform.tudominio.com/api/auth/callback`.

- [ ] **Step 8: Reinstalar la app desde producción y verificar OAuth en prod**

Instala la app en el dev store usando la URL de producción. Verifica que el home embebido carga y se crea una Session.

- [ ] **Step 9: Configurar CI/CD (auto-deploy)**

En Coolify, activa "Auto Deploy on push" para la rama `main` (webhook a GitHub/GitLab). Haz un commit trivial y push para verificar que Coolify re-despliega solo.

---

## Self-Review (hecha por el autor del plan)

**1. Spec coverage:**
- Spec Sección 4 (Arquitectura: Remix + Postgres + Redis + BullMQ): ✅ Tasks 1, 6, 8.
- Spec Sección 6 (Backend stack, esquema Postgres, estructura): ✅ Tasks 1-8, esquema en Task 6.
- Spec Sección 10 (Despliegue Coolify, Docker, CI/CD, ambientes): ✅ Tasks 9, 10, 13.
- Health endpoint (Sección 10.1): ✅ Task 7.
- NOTA: las 33 metafield definitions, webhooks, extensions, backfill, métricas y campañas NO están en este plan — corresponden a los Planes 2-7 (decisión de alcance explícita en la conversación de brainstorm).

**2. Placeholder scan:** Sin "TBD"/"TODO". Los placeholders intencionales (`<URL_DE_TU_REPO_PRIVADO>`, `<de Partners>`, `tudominio.com`) son valores que solo el merchant conoce — se marcan como entrada del usuario, no como código faltante.

**3. Type consistency:** `pingRedis()` definida en Task 8 y consumida en Task 7 (health route) — consistente. `parseEnv`/`env` (Task 4) consumidos por `logger.server.ts` (Task 5) y `queue.server.ts` (Task 8) — consistente. `prisma` singleton (Task 6) consumido por health route (Task 7) — consistente. `buildQueueName`/`getQueue` (Task 8) — nombres consistentes.

**Resultado:** plan completo y coherente para el alcance "Setup base". Sin gaps dentro de su alcance.

---

## Próximos planes (después de ejecutar este)

- **Plan 2** — Modelo de datos: 33 metafield definitions + installer + 8 segmentos.
- **Plan 3** — Webhooks + cálculos automáticos (orders/paid → tier/puntos/inferencias, GDPR).
- **Plan 4** — Backfill de los 257k clientes (Bulk Operations + bono de bienvenida).
- **Plan 5** — Las 3 extensions (Customer Account UI, Admin Block, Thank You).
- **Plan 6** — Dashboard de métricas.
- **Plan 7** — Campañas + relanzamiento (email + WhatsApp).
