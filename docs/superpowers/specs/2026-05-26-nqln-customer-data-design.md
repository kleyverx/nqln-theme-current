# NQLN Platform — Módulo G: Datos Personalizados de Clientes

**Fecha:** 2026-05-26
**Autor:** Kleyver Urbina (con asistencia de Claude Code)
**Status:** Spec aprobada — pendiente plan de implementación
**Tienda:** nqlnstore.com (Shopify Grow plan)

---

## 1. Resumen ejecutivo

Construir una app Shopify pública unlisted llamada **"NQLN Platform"**, hospedada en el servidor Coolify del merchant, que sirva como **plataforma modular** para reemplazar progresivamente apps externas y añadir capacidades que Shopify no ofrece nativamente.

La **Fase 1** implementa el **Módulo G: Datos personalizados de clientes** — captura, almacenamiento, cálculo automático y uso (vía campañas segmentadas) de hasta 28 piezas de información personalizada por cliente. Aplica a los 257,010 clientes existentes y a todos los futuros.

Esta Fase 1 **no toca el tema Halo del storefront**. La integración storefront se hará en una fase posterior, después del sub-proyecto H (tema custom NQLN optimizado). El ROI de Fase 1 viene exclusivamente vía **campañas segmentadas** (email + WhatsApp) a los 257k clientes existentes.

**Tiempo estimado de Fase 1:** 3-4 semanas de implementación + 8-12 horas de setup inicial.

---

## 2. Contexto y motivación

### El problema actual

- El merchant maneja un catálogo de ~1,600 productos en 65 colecciones (variety/gadgets/hogar, no moda) y 257,010 clientes.
- Depende de muchas apps externas que cada una posee una parte de la data y no son interoperables.
- El tema Halo está mal optimizado: LCP 3.35s (p75 CrUX), render delay 2.18s (84% del LCP), forced reflows 271ms, 1.7MB+ de JS de terceros.
- No hay segmentación significativa de clientes — todos reciben los mismos emails/promos.
- No hay un programa de fidelidad propio.

### La oportunidad

Con un servidor Coolify ya pagado y la decisión estratégica del merchant de convertir su Shopify en una experiencia tipo Amazon, una app propia consolida módulos múltiples bajo un mismo backend, da control de datos y métricas, y elimina la dependencia de apps de terceros con costos recurrentes.

### Por qué empezar por el Módulo G

1. Es la **fundación** que habilitará los siguientes módulos (fidelidad, recomendaciones, campañas).
2. Tiene el **menor riesgo técnico** (no toca el storefront, no requiere Shopify Plus).
3. **ROI inmediato** vía campañas segmentadas a los 257k clientes existentes.

---

## 3. Alcance

### Dentro del alcance (Fase 1)

- App Shopify pública unlisted, Node.js + Remix v2 oficial, en Coolify.
- 33 customer metafields bajo namespace `nqln.*`.
- 3 extensions de Shopify: Customer Account UI ("Mis Preferencias"), Admin Block ("Datos NQLN"), Thank You Page (captura post-compra).
- Backfill inicial de los 257,010 clientes con cálculos automáticos y bono de bienvenida según LTV.
- Captura automática vía webhooks (`orders/paid`, `customers/create`, `customers/update`, GDPR).
- Programa de fidelidad: tier basado en `loyalty_lifetime_points` (Bronze/Silver/Gold/Platinum), puntos por compras + acciones, canje 100 pts = $5.
- 8 Customer Segments creados automáticamente al instalar.
- Dashboard de métricas internas en `/app/metrics/*`.
- Despliegue en Coolify con Docker Compose (app + Postgres + Redis + BullMQ).
- Campaña de relanzamiento del programa a los 257k clientes (email + WhatsApp).

### Fuera del alcance (Fase 1)

- **Integración con el tema Halo** (se hará en una segunda fase del Módulo G cuando exista el sub-proyecto H tema custom).
- **App móvil nativa** (sub-proyecto A).
- **Bundles "arma tu combo"** (sub-proyecto B).
- **Descuentos escalonados con Functions** (sub-proyecto C).
- **Programa de fidelidad avanzado** con redemption flows complejos (Fase 2 del Módulo D).
- **Push notifications** (depende de la app móvil).
- **POS UI extensions** (sub-proyecto F).
- **SMS** (decisión del merchant: omitido).

---

## 4. Arquitectura general

```
┌──────────────────────────────────────────────────────────────────┐
│                        SHOPIFY (Grow plan)                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │  Storefront  │  │   Customer   │  │       Admin          │    │
│  │  (tema Halo) │  │   Account    │  │   (panel staff)      │    │
│  │              │  │              │  │                      │    │
│  │  Lee         │  │  Cust. Acct  │  │  Admin Block         │    │
│  │  customer.   │  │  UI Ext.     │  │  Polaris Ext.        │    │
│  │  metafields  │  │  (perfil)    │  │  (staff edita)       │    │
│  │  (Fase 2)    │  │              │  │                      │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
│                                                                  │
│             ┌──────────────────────────┐                         │
│             │  Customer Metafields     │ ← FUENTE ÚNICA          │
│             │  + Metaobjects           │   DE VERDAD             │
│             │  namespace: nqln         │                         │
│             └──────────────────────────┘                         │
└────────────────────────┬─────────────────────────────────────────┘
                         │ Webhooks (orders/paid, customers/*)
                         │ GraphQL Admin API (read/write metafields)
                         │ OAuth (App Bridge)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              NQLN PLATFORM (Coolify, servidor del merchant)      │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Remix App (Node.js 20 + TypeScript)               │          │
│  │  - shopify-app-remix (template oficial)            │          │
│  │  - App Bridge para UI embebida en admin            │          │
│  │  - /webhooks/* (handlers de eventos Shopify)       │          │
│  │  - /api/* (endpoints para extensions)              │          │
│  │  - /modules/customer-data/* (Módulo G — Fase 1)    │          │
│  │  - /modules/metrics/* (dashboard interno)          │          │
│  └────────────────────────────────────────────────────┘          │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Postgres 15 (Coolify, junto a la app)             │          │
│  │  - Sessions de OAuth (shopify-app-remix + Prisma)  │          │
│  │  - Audit logs (cambios y eventos)                  │          │
│  │  - Métricas pre-calculadas (LTV, retención, etc.)  │          │
│  │  - Estado de jobs de backfill                      │          │
│  │  - NO duplicamos datos de cliente: viven en        │          │
│  │    Shopify metafields                              │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Redis 7 + BullMQ                                  │          │
│  │  - Job queue (recálculos, backfill, notif.)        │          │
│  │  - Cache de respuestas                             │          │
│  └────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### Principios de arquitectura

1. **Shopify es la fuente única de verdad** de los datos del cliente. La app NO duplica datos del cliente en su Postgres (solo sessions, métricas pre-calculadas y audit logs).
2. **Modular desde el día 1.** Cada sub-proyecto futuro (D fidelidad avanzada, B bundles, C descuentos, E push) será una carpeta `/modules/<nombre>/*` en la misma app. No habrá apps separadas.
3. **Self-hosted con Docker.** Coolify deploya con Docker Compose (app + Postgres + Redis). Backups cada 6h.
4. **Sin lock-in.** Toda la lógica está en código del merchant. Los datos en Shopify (donde se pueden exportar). El servidor es del merchant.

---

## 5. Modelo de datos

### Namespace único: `nqln`

Las 28 definiciones de Customer Metafield se crean automáticamente al instalar la app, vía `metafieldDefinitionCreate` de la Admin GraphQL API. Aparecen pinned en la página del Customer en el admin de Shopify.

### Grupo 🅰️ — Intereses y contexto de compra (9 metafields)

| Key | Tipo | Ejemplo | Acceso |
|---|---|---|---|
| `nqln.interest_categories` | `list.collection_reference` | refs → [Hogar, Cocina, Gadgets] | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.shopping_for` | `list.single_line_text_field` (choices: self, kids, partner, parents, pets) | `["self","kids","pets"]` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.house_context` | `list.single_line_text_field` (choices: kitchen, bath, garden, office, garage) | `["kitchen","bath"]` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.owns_vehicle` | `list.single_line_text_field` (choices: car, motorcycle, bicycle, none) | `["motorcycle"]` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.has_pets` | `boolean` | `true` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.deal_sensitivity` | `single_line_text_field` (choices: deal_hunter, balanced, premium) | `"deal_hunter"` | Storefront PUBLIC_READ, CustomerAccount READ |
| `nqln.preferred_colors` | `list.color` | `["#000000","#808080"]` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.favorite_brands` | `list.single_line_text_field` (choices: NQLN, LEVNI CARE, VAULI, +futuros) | `["LEVNI CARE"]` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.size_details` | `json` (opcional) | `{"zapatos":"42","corrector":"M"}` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |

### Grupo 🅱️ — Demográficos + comunicación (11 metafields)

| Key | Tipo | Ejemplo | Acceso |
|---|---|---|---|
| `nqln.birthday` | `date` | `"1990-08-22"` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.kids_birthdays` | `json` | `[{"name":"Sofia","birthday":"2015-04-10"}]` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.is_parent` | `boolean` | `true` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.is_mother` | `boolean` | `true` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.is_father` | `boolean` | `false` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.gender` | `single_line_text_field` (choices: F, M, Otro, NoDecir) | `"F"` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.state` | `single_line_text_field` | `"Distrito Capital"` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.city` | `single_line_text_field` | `"Caracas"` | Storefront PUBLIC_READ, CustomerAccount READ_WRITE |
| `nqln.preferred_channel` | `single_line_text_field` (choices: email, whatsapp) | `"whatsapp"` | Admin-only, CustomerAccount READ_WRITE |
| `nqln.opt_in_whatsapp` | `boolean` (default false) | `true` | Admin-only, CustomerAccount READ_WRITE |
| `nqln.opt_in_push` | `boolean` (default false, activable solo desde app móvil futura) | `false` | Admin-only, CustomerAccount READ |

> Nota: el opt-in de email marketing usa el campo nativo `customer.acceptsMarketing` de Shopify, no un metafield. Su default depende del país (ver Sección 8 del spec, opt-in híbrido). SMS está excluido del alcance.

### Grupo 🅲 — Comportamiento (auto-calculado, 6 metafields)

| Key | Tipo | Ejemplo | Cómo se calcula |
|---|---|---|---|
| `nqln.lifetime_value` | `number_decimal` | `1905.50` | `SUM(order.total_price)` de pedidos pagados |
| `nqln.average_order_value` | `number_decimal` | `58.00` | LTV ÷ purchase_count |
| `nqln.purchase_count` | `number_integer` | `33` | Cantidad de pedidos pagados |
| `nqln.last_purchase_at` | `date_time` | `"2026-05-26T10:00:00Z"` | Fecha del último pedido pagado |
| `nqln.most_purchased_collection` | `single_line_text_field` | `"cocina"` | Colección con más unidades compradas |
| `nqln.deal_purchase_ratio` | `number_decimal` | `0.72` | Pedidos con productos %off ÷ total de pedidos |

Acceso para todos: Storefront PUBLIC_READ, CustomerAccount READ. NO editables desde extensions ni storefront (solo backend).

### Grupo 🅳 — Fidelidad (auto-calculado, 5 metafields)

| Key | Tipo | Ejemplo | Cómo se calcula |
|---|---|---|---|
| `nqln.loyalty_tier` | `single_line_text_field` (choices: bronze, silver, gold, platinum) | `"gold"` | Función escalonada sobre `loyalty_lifetime_points` |
| `nqln.loyalty_points` | `number_integer` | `1216` | Puntos disponibles para canje (decrementa al canjear) |
| `nqln.loyalty_lifetime_points` | `number_integer` | `4916` | Puntos totales acumulados (NO decrementa) |
| `nqln.loyalty_joined_at` | `date` | `"2024-03-15"` | Fecha de primera compra o registro |
| `nqln.loyalty_tier_recalc_at` | `date_time` | `"2026-05-26T10:00:00Z"` | Último recálculo de tier |

### Grupo 🅴 — Auditoría legal de consentimiento (2 metafields)

| Key | Tipo | Ejemplo | Para qué |
|---|---|---|---|
| `nqln.consent_method` | `single_line_text_field` (choices: explicit, implicit) | `"implicit"` | Cómo se obtuvo el consentimiento de marketing |
| `nqln.consent_timestamp` | `date_time` | `"2026-05-26T14:30:00Z"` | Fecha exacta del consentimiento |

**Total: 33 customer metafields** bajo namespace `nqln` (9 + 11 + 6 + 5 + 2). De los 100 permitidos por recurso en Shopify, quedan 67 libres para módulos futuros.

---

## 6. Backend Remix en Coolify

### Stack técnico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript (strict) |
| Framework | Remix v2 |
| Template base | `@shopify/shopify-app-template-remix` (oficial) |
| Auth Shopify | `@shopify/shopify-app-remix` |
| ORM | Prisma |
| DB | PostgreSQL 15 |
| Cache + Queue | Redis 7 |
| Job queue | BullMQ |
| HTTP client | `@shopify/admin-api-client` |
| Lint/format | Biome |
| Tests | Vitest |
| Container | Docker + Docker Compose |

### Estructura del repo

```
nqln-platform/
├── app/
│   ├── routes/
│   │   ├── _index.tsx
│   │   ├── auth.$.tsx
│   │   ├── app._index.tsx                  # Dashboard admin home
│   │   ├── app.customers.$id.tsx           # Debug view
│   │   ├── app.metrics.tsx                 # Dashboard métricas
│   │   ├── webhooks/
│   │   │   ├── webhooks.app.uninstalled.tsx
│   │   │   ├── webhooks.orders.paid.tsx
│   │   │   ├── webhooks.customers.create.tsx
│   │   │   ├── webhooks.customers.update.tsx
│   │   │   ├── webhooks.customers.data_request.tsx
│   │   │   ├── webhooks.customers.redact.tsx
│   │   │   └── webhooks.shop.redact.tsx
│   │   └── api/
│   │       ├── api.customer-data.preferences.tsx
│   │       ├── api.customer-data.admin.$id.tsx
│   │       ├── api.customer-data.thankyou.$orderId.tsx
│   │       └── api.health.tsx
│   ├── modules/
│   │   ├── customer-data/                  # Módulo G — Fase 1
│   │   │   ├── definitions.ts              # Las 28 definiciones
│   │   │   ├── installer.ts                # Crea definiciones + segmentos
│   │   │   ├── writer.ts
│   │   │   ├── reader.ts
│   │   │   ├── inference.ts                # is_parent, has_pets, etc.
│   │   │   ├── computed.ts                 # LTV, AOV, etc.
│   │   │   ├── loyalty.ts                  # Tier, puntos
│   │   │   ├── consent.ts                  # Híbrido por país
│   │   │   ├── backfill/
│   │   │   │   ├── job.ts                  # Job para 257k
│   │   │   │   └── bulk-mutation.ts
│   │   │   └── schemas.ts                  # Zod
│   │   ├── metrics/
│   │   │   ├── compute.ts                  # Cron c/1h
│   │   │   └── queries.ts
│   │   └── (loyalty/, bundles/, discounts/, push/, pos/ - futuro)
│   ├── lib/
│   │   ├── shopify.server.ts
│   │   ├── db.server.ts
│   │   ├── queue.server.ts
│   │   ├── auth.server.ts
│   │   ├── logger.server.ts                # Pino
│   │   └── env.server.ts                   # Validación con Zod
│   └── components/                          # Polaris UI
├── extensions/
│   ├── customer-data-account/              # Customer Account UI
│   ├── customer-data-admin/                # Admin Block
│   └── customer-data-thankyou/             # Thank you page
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── tests/
├── shopify.app.toml
├── package.json
├── biome.json
├── tsconfig.json
└── .env.example
```

### Esquema de Postgres (mínimo)

```prisma
model Session {  // OAuth, manejado por shopify-app-remix
  id          String   @id
  shop        String
  state       String
  isOnline    Boolean
  scope       String?
  expires     DateTime?
  accessToken String
}

model AuditLog {
  id           String   @id @default(cuid())
  shop         String
  customerId   String?
  module       String
  action       String
  payload      Json
  createdAt    DateTime @default(now())
  @@index([shop, customerId])
  @@index([shop, module, createdAt])
}

model Metric {
  id          String   @id @default(cuid())
  shop        String
  key         String
  granularity String   // day | week | month | hour
  periodStart DateTime
  value       Float
  meta        Json?
  @@unique([shop, key, granularity, periodStart])
}

model BackfillRun {
  id              String   @id @default(cuid())
  shop            String
  module          String
  status          String   // pending | running | completed | failed
  totalCustomers  Int
  processed       Int      @default(0)
  failed          Int      @default(0)
  startedAt       DateTime @default(now())
  finishedAt      DateTime?
  errorLog        Json?
}
```

### Patrón de módulos

Cada módulo bajo `app/modules/` sigue la misma estructura interna:
- `definitions.ts` — definiciones de metafields/functions/etc que crea
- `installer.ts` — lógica de instalación del módulo
- `webhooks.ts` — webhooks que escucha y cómo los maneja
- `api.ts` — endpoints HTTP que expone para extensions
- `jobs.ts` — jobs en cola
- `reader.ts` / `writer.ts`
- `schemas.ts` — Zod
- `computed.ts`
- `README.md`

---

## 7. Extensions de Shopify (3 piezas)

### 7.1. Customer Account UI Extension — "Mis Preferencias"

- **Target Shopify:** `customer-account.profile.block.render` + full-page extension
- **Dónde aparece:** página de perfil del cliente en la cuenta nueva de Shopify
- **Qué hace:** formulario para que el cliente edite preferencias, demográficos, canales. Resumen de tier + puntos. Banner invitando a descargar la app móvil para habilitar push.
- **Conecta con:** `GET/POST /api/customer-data/preferences` en el backend Remix, autenticado con session token JWT de la extension.

### 7.2. Admin Block Extension — "Datos NQLN"

- **Target Shopify:** `admin.customers.details.block.render`
- **Dónde aparece:** panel admin de Shopify, dentro de la página de cada Customer
- **Quién la usa:** merchant + staff
- **Qué hace:** muestra todos los metafields `nqln.*` del cliente organizados: tier + barra de progreso al siguiente, comportamiento (LTV, AOV, etc.), preferencias declaradas. Permite editar manualmente con un botón.
- **Conecta con:** `GET/POST /api/customer-data/admin/:id`

### 7.3. Thank You Page Extension — Captura post-compra

- **Target Shopify:** `purchase.thank-you.block.render` + `customer-account.order-status.block.render`
- **Dónde aparece:** página "Gracias por tu compra" después del checkout, y en estado del pedido
- **Quién la usa:** cliente, momento de alta intención
- **Qué hace:** 2-3 preguntas rápidas con incentivo de +100 puntos ("¿Para quién compraste?", "¿Cuándo es tu cumple?"). Solo aparece si faltan datos clave en el perfil.
- **Conecta con:** `POST /api/customer-data/thankyou/:orderId`

### Endpoints HTTP de la app

| Ruta | Quién la consume | Auth |
|---|---|---|
| `POST /webhooks/orders/paid` | Shopify | HMAC verify |
| `POST /webhooks/customers/{create,update,redact,data_request}` | Shopify | HMAC verify |
| `POST /webhooks/shop/redact` | Shopify | HMAC verify |
| `POST /webhooks/app/uninstalled` | Shopify | HMAC verify |
| `GET/POST /api/customer-data/preferences` | Customer Account UI Ext | Session token de extension |
| `GET/POST /api/customer-data/admin/:id` | Admin Block | Session token |
| `POST /api/customer-data/thankyou/:orderId` | Thank you ext | Session token |
| `GET /api/health` | Coolify healthcheck | Public |
| `GET /app/*` | Merchant (admin embebido) | OAuth Shopify |

---

## 8. Captura de datos: webhooks, opt-in y reglas de fidelidad

### 8.1. Opt-in híbrido por país (consent management)

Cuando se dispara `customers/create`, la app:

1. Detecta país desde `customer.defaultAddress.countryCode` (o IP si no hay dirección).
2. Si el país está en la lista de "opt-in explícito" (UE 27, UK, Canadá, USA, Australia, Brasil, Suiza, Noruega, Islandia):
   - `customer.acceptsMarketing` se mantiene en **false** hasta que el cliente marque checkbox.
   - `nqln.consent_method = "explicit"`.
3. Si el país NO está en esa lista (Venezuela, Colombia, México, Argentina, Perú, etc.):
   - `customer.acceptsMarketing = true` automáticamente. El cliente puede desmarcar después.
   - `nqln.consent_method = "implicit"`.
4. En cualquier caso: `nqln.consent_timestamp = now()`.
5. `nqln.opt_in_whatsapp`, `nqln.opt_in_push` se inicializan en **false** (siempre opt-in explícito por requisitos de Meta/Google/Apple).

### 8.2. Reglas de cálculo automático — programa de fidelidad

#### Tiers según `nqln.loyalty_lifetime_points`

| Tier | Rango lifetime_points | Multiplicador puntos por compra |
|---|---|---|
| 🥉 Bronze | 0 – 249 | ×1.0 |
| 🥈 Silver | 250 – 999 | ×1.2 |
| 🥇 Gold | 1,000 – 2,499 | ×1.5 |
| 💎 Platinum | 2,500+ | ×2.0 |

#### Cómo se ganan puntos

```
+1 punto base por cada $1 gastado × multiplicador del tier
+500 pts en mes de cumpleaños (1 vez/año)
+100 pts por cada dato de perfil completado (max 800 pts)
+200 pts en la primera compra (una sola vez)
```

#### Canje

- 100 puntos = $5 de descuento (configurable desde admin).
- Al canjear: `loyalty_points` decrementa, `loyalty_lifetime_points` se mantiene.
- El tier NO baja al canjear (preserva motivación).

#### Inferencias automáticas (post `orders/paid`)

- 2+ compras en colección "bebes-y-ninos" → `is_parent = true`
- Compra en colección "maternidad-y-bebes" → `is_mother = true`
- Compra en colección "mascotas" → `has_pets = true`
- Compra en colección "motos" → `owns_vehicle += ["motorcycle"]`
- `deal_purchase_ratio > 0.6` → `deal_sensitivity = "deal_hunter"`
- `deal_purchase_ratio < 0.2` → `deal_sensitivity = "premium"`
- Default → `deal_sensitivity = "balanced"`
- `most_purchased_collection` = colección con más unidades compradas

### 8.3. Bono de bienvenida a los 257k clientes existentes (UNA SOLA VEZ)

Job de backfill al instalar la app calcula LTV de cada cliente desde su histórico de pedidos pagados y otorga:

| LTV histórico | Bono inicial (puntos) | Tier resultante |
|---|---|---|
| < $50 | +50 pts | 🥉 Bronze |
| $50 – $499 | +250 pts | 🥈 Silver |
| $500 – $1,499 | +750 pts | 🥈 Silver (cerca de Gold) |
| $1,500+ | +2,000 pts | 🥇 Gold (a 500 pts de Platinum) |

**Nadie arranca en Platinum.** Platinum se gana exclusivamente con compras post-relanzamiento del programa, preservando la exclusividad del top tier.

### 8.4. Campaña de relanzamiento del programa (paralela al backfill)

- **Email + WhatsApp masivo (Día 0):** "🎁 ¡Nuevo programa NQLN Rewards! Te regalamos [X] puntos por ser parte de nuestra familia desde [fecha primera compra]."
- **Página "Reclama tu bono"** en el customer account: el cliente entra a ver/activar. Reactivación natural de clientes inactivos.
- **Bonus de primer mes:**
  - 1ra compra post-relanzamiento → ×2 puntos extra (acumulable con multiplicador del tier).
  - Referir un amigo → +500 pts cuando el referido compre.
  - Completar perfil 100% → +200 pts extra.

### 8.5. Flujo del webhook `orders/paid` (paso a paso)

1. Cliente paga, Shopify confirma orden con status `paid`.
2. Shopify envía POST a `/webhooks/orders/paid` con HMAC signature.
3. La app valida HMAC, encola job `recalc-customer-{id}` en BullMQ, responde 200 OK en <5s.
4. Worker lee todos los pedidos pagados del cliente desde Shopify GraphQL.
5. Recalcula: LTV, AOV, purchase_count, last_purchase_at, most_purchased_collection, deal_purchase_ratio.
6. Recalcula tier según `loyalty_lifetime_points`.
7. Otorga puntos base × multiplicador, suma a `loyalty_points` y `loyalty_lifetime_points`.
8. Aplica inferencias (is_parent, has_pets, owns_vehicle, deal_sensitivity).
9. Escribe todos los metafields actualizados en Shopify con UN solo `metafieldsSet` (atómico).
10. Si hubo upgrade de tier, dispara campaña "felicitaciones" en background.
11. Registra evento en AuditLog y actualiza Metric pre-calculada.

**Idempotencia:** cada job se deduplica por `order.id`. Reintentos de Shopify no duplican puntos.

### 8.6. GDPR webhooks (obligatorios)

- `customers/data_request`: exportar todos los metafields `nqln.*` del cliente como JSON.
- `customers/redact`: borrar todos los metafields `nqln.*` del cliente.
- `shop/redact`: 48h tras uninstall, borrar todos los datos del shop en Postgres.

---

## 9. Uso de los datos: campañas y segmentación

La Fase 1 NO toca el tema Halo. El ROI inmediato viene de campañas dirigidas a los 257k clientes vía Shopify Customer Segments.

### 9.1. Los 8 segmentos creados automáticamente al instalar

| # | Nombre | Filtro ShopifyQL | Uso típico |
|---|---|---|---|
| 1 | VIPs (Oro + Platinum) | `metafield.nqln.loyalty_tier IN ("gold","platinum")` | Acceso anticipado a ofertas |
| 2 | Cazadores de ofertas | `metafield.nqln.deal_purchase_ratio > 0.6` | Notificación de ofertas flash |
| 3 | Cumpleañeros del mes | `metafield.nqln.birthday MATCHES MONTH(NOW())` | Cupón + bonus de cumple |
| 4 | Madres | `metafield.nqln.is_mother = true` | Campaña Día de las Madres (1,324 productos) |
| 5 | Padres con hijos | `metafield.nqln.is_parent = true` | Día del Niño / Padre |
| 6 | Dueños de mascotas | `metafield.nqln.has_pets = true` | Lanzamientos en col. Mascotas |
| 7 | Fans de Cocina/Hogar | `metafield.nqln.most_purchased_collection = "cocina"` | Recomendaciones por afinidad |
| 8 | Inactivos con LTV alto | `metafield.nqln.lifetime_value > 500 AND metafield.nqln.last_purchase_at < (NOW() - 90 days)` | Reactivación |

### 9.2. Canales de envío

| Canal | Implementación | Costo aprox. |
|---|---|---|
| ✉️ Email | Shopify Email nativo (gratis hasta cierto volumen) o Resend/Mailgun desde Coolify | $0 – $20/mes |
| 📱 WhatsApp | WhatsApp Business Cloud API (oficial de Meta) directamente desde Coolify, con plantillas pre-aprobadas | ~$0.005 USD/mensaje en LatAm |
| 🔔 Push app | Firebase Cloud Messaging (gratis) — disponible cuando exista sub-proyecto A | $0 |

### 9.3. Caveat sobre Shopify Customer Segments

Los segmentos de Shopify se reindexan cada 15-30 min. Para campañas urgentes (oferta flash de 1h), la app mantiene una lista paralela en Postgres que se actualiza en tiempo real.

---

## 10. Despliegue en Coolify

### 10.1. Stack Docker (3 servicios)

- `app` — Remix en Node 20-alpine, puerto 3000, healthcheck `/api/health`
- `db` — Postgres 15-alpine con volumen persistente
- `redis` — Redis 7-alpine con AOF persistence

### 10.2. Pasos de setup en Coolify

1. New Resource → Docker Compose, conectar repo Git privado.
2. Pegar ruta del docker-compose: `docker/docker-compose.yml`.
3. Configurar Secrets en Coolify (NO en el repo):
   - `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES`
   - `DB_PASSWORD` (generada fuerte)
   - `WHATSAPP_API_TOKEN` (cuando se active WhatsApp)
   - `RESEND_API_KEY` (si se usa Resend para email)
4. Asignar dominio (ej: `nqln-platform.tudominio.com`) — Coolify configura DNS + Let's Encrypt.
5. Deploy → Coolify hace build, ejecuta `prisma migrate deploy`, arranca stack.
6. Verificar `GET /api/health → 200 OK`.

### 10.3. CI/CD vía webhook de Coolify

`git push main` → webhook a Coolify → `git pull` → `docker build` → `migrate` → restart stack → health check → cambio activo. Si el health check falla, Coolify mantiene la versión anterior viva.

### 10.4. Backups

- Coolify scheduled backups de Postgres cada 6 horas.
- Retención: 7 días local + 30 días en S3 opcional.
- Restore en 1 click desde panel.
- Los metafields de Shopify NO se respaldan aquí (viven en Shopify). El Postgres solo guarda sessions + audit + métricas.

### 10.5. Ambientes

| Ambiente | Branch | Dominio | Tienda Shopify |
|---|---|---|---|
| Production | `main` | `nqln-platform.tudominio.com` | nqlnstore.com (real) |
| Staging | `staging` | `staging-nqln.tudominio.com` | Dev store de Shopify Partners (gratis) |

---

## 11. Métricas internas (Dashboard)

### 11.1. KPIs trackeados (Fase 1)

#### Programa de fidelidad
- Distribución de clientes por tier (count + %)
- Puntos otorgados / canjeados por día/semana/mes
- Tasa de upgrade de tier mensual
- LTV promedio por tier
- Top 10 clientes por puntos

#### Engagement con datos personalizados
- % de clientes con perfil completo
- Avg. cantidad de datos llenados por cliente
- Top 5 categorías declaradas como favoritas
- % opt-in WhatsApp por país
- Cumpleañeros del mes

#### Performance de campañas
- Open rate por segmento (cuando se envíen campañas)
- Click rate
- Revenue atribuido a campaña
- Cost per conversion (WhatsApp)

#### Operacional
- Webhooks/hora recibidos
- p95 latencia de procesamiento
- Errores 5xx/4xx
- % API quota Shopify usado
- Backfill progress (durante migración inicial)

### 11.2. Tecnología

- UI: Remix `/app/metrics/*` con Polaris
- Charts: Recharts o Tremor
- Datos: Prisma queries a Postgres
- Cacheado: tabla `Metric` pre-calculada por cron c/1h + Redis
- Refresh: cron job c/1h actualiza Metric, KPIs en tiempo real son queries directas

---

## 12. Decisiones técnicas clave (decision log)

| Decisión | Alternativas consideradas | Por qué se eligió |
|---|---|---|
| Metafields planos vs JSON único | JSON único más fácil de manipular | Metafields planos permiten filtrar en Customer Segments |
| Tier por `loyalty_lifetime_points` vs por LTV | LTV en USD | Premia compras + acciones (no solo gasto). Usuario lo pidió explícitamente. |
| Bono inicial diferenciado vs igual para todos | +200 pts fijo para todos | Reconocer lealtad histórica sin regalar tiers altos. Mantiene exclusividad de Platinum. |
| Opt-in híbrido vs siempre explícito vs siempre implícito | A o B individuales | Cumple GDPR en países que aplican y maximiza captura donde no |
| App pública unlisted vs custom app | Plus se requiere para custom apps con Functions | El merchant está en plan Grow; pública unlisted es necesaria para próximos módulos con Functions |
| Sin SMS | Incluir SMS | Decisión del merchant: SMS no es prioritario por ahora |
| Push solo desde app móvil | Push también vía web push | Mejor UX nativa; activación natural al descargar la app |
| Cart Transform `merge`/`expand` solo (sin `lineUpdate`) | Esperar a Plus para `lineUpdate` | El catálogo del merchant no necesita lineUpdate; merge/expand cubre bundles típicos |
| NO tocar tema Halo en Fase 1 | Integración mínima en Halo o esperar a H | Cero trabajo desechable; Halo se reemplazará por sub-proyecto H |
| WhatsApp Business Cloud API oficial vs Twilio | Twilio para WhatsApp | Cloud API directo de Meta es más barato y oficial |
| Coolify self-hosted vs Vercel/Fly | Hosting managed | Merchant ya paga Coolify; costo $0 extra |
| Remix vs Next.js vs Rails | Next.js o Rails | Template oficial Shopify es Remix; menos boilerplate, soporte directo |
| Prisma vs Drizzle vs SQL plain | Drizzle, SQL plano | Prisma es estándar en template Shopify, type-safe, migraciones versionadas |
| BullMQ vs Inngest/Trigger.dev | SaaS managed | Self-hosted, sin dependencia externa, gratis |
| Biome vs ESLint+Prettier | ESLint+Prettier | 10x más rápido en CI, setup simple |

---

## 13. Lo que NO está en este spec (out of scope explícito)

- Sub-proyecto A — App móvil nativa (React Native + Shopify Checkout Kit). Backloggeado, con decisiones técnicas ya guardadas en memoria del proyecto.
- Sub-proyecto B — Bundles "Arma tu combo" (Cart Transform Function `merge`/`expand`).
- Sub-proyecto C — Ofertas escalonadas (Discount Function).
- Sub-proyecto D — Fidelidad avanzada (más allá de lo del Módulo G actual: niveles personalizables, redemption store completo).
- Sub-proyecto E — Push de carrito abandonado en app móvil (depende de A).
- Sub-proyecto F — POS UI Extensions.
- Sub-proyecto H — Tema custom NQLN optimizado (reemplazo de Halo).
- Integración con storefront de Halo (queda para Fase 2 del Módulo G post-H).
- Migración manual de apps externas existentes (bundle-builder, ecomsend, etc.) — se hace cuando los módulos B/C/D/E estén disponibles.
- SMS como canal.

---

## 14. Estimaciones de tiempo

| Tarea | Estimación |
|---|---|
| Setup inicial (repo, Docker, Coolify, dev store) | 8-12 horas |
| Implementación Módulo G (backend + extensions) | 3-4 semanas |
| Backfill de los 257k clientes (job en ejecución) | 6-12 horas (async, sin afectar tienda) |
| Campaña de relanzamiento (preparación + envío) | 3-5 días |
| **Total Fase 1 hasta producción** | **4-5 semanas** desde commit del spec |

---

## 15. Glosario

- **Customer metafield**: campo custom adjunto a un recurso Customer en Shopify, con namespace + key + tipo + valor.
- **Metafield definition**: schema formal del metafield (tipo, validaciones, acceso). Requerido para que Shopify lo trate como first-class.
- **Customer Segment**: filtro de clientes en Shopify basado en sintaxis ShopifyQL. Puede filtrar por metafields.
- **LTV (Lifetime Value)**: suma de `total_price` de todos los pedidos pagados del cliente.
- **AOV (Average Order Value)**: LTV ÷ purchase_count.
- **HMAC**: firma criptográfica que valida que el webhook viene realmente de Shopify.
- **Idempotencia**: que aplicar la misma operación 2+ veces produzca el mismo resultado que aplicarla 1 vez.
- **Coolify**: plataforma open-source self-hosted tipo Heroku para deployar apps en VPS propio.
- **App pública unlisted**: app en el Shopify App Store que no aparece en búsquedas, solo se instala con link directo. Permite usar Functions en plan Grow.
- **Plan Grow**: tier medio de Shopify (post-rebrand 2024), entre Basic y Advanced.
- **WhatsApp Business Cloud API**: API oficial de Meta para enviar mensajes de WhatsApp programáticamente. Requiere plantillas pre-aprobadas para mensajes masivos.

---

## Referencias

- Docs Shopify Customer Metafields: https://shopify.dev/docs/apps/build/metafields
- Docs Customer Account UI Extensions: https://shopify.dev/docs/api/customer-account-ui-extensions
- Docs Admin Block Extensions: https://shopify.dev/docs/api/admin-extensions
- Docs Shopify Functions (limits): https://shopify.dev/docs/apps/build/functions
- Docs Cart Transform Function: https://shopify.dev/docs/api/functions/latest/cart-transform
- Docs Shopify Customer Segments: https://shopify.dev/docs/apps/build/customers/segments
- Docs Webhooks GDPR: https://shopify.dev/docs/apps/build/privacy-law-compliance
- Shopify CLI Remix template: https://shopify.dev/docs/apps/build/scaffold-app
- Coolify docs: https://coolify.io/docs
