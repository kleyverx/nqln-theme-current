# NQLN Theme — Fase 1: Setup + Base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inicializar el tema Shopify nuevo desde el Skeleton oficial en la raíz del repo, preservando Halo en `_legacy-halo/`, y customizar la base (layout, tokens, meta, SEO, CSS base, i18n) para dejar el skeleton listo para construir header/footer en la Fase 2.

**Architecture:** Repo dual — Halo congelado en `_legacy-halo/` (excluido del CLI via `.shopifyignore`), Skeleton Theme oficial de Shopify en la raíz customizado con el layout/theme.liquid, snippets de tokens/meta/SEO propios, y un CSS base mínimo. Deploy como tema "sin publicar" en Shopify (Halo publicado sigue intacto sirviendo tráfico real).

**Tech Stack:** Shopify Liquid, Online Store 2.0, JSON templates, CSS custom properties, español default. Shopify CLI 3.x para push/dev. Git para versionado.

**Spec:** `docs/superpowers/specs/2026-08-11-nqln-theme-fase-1-setup-design.md`

## Global Constraints

- **Idioma UI:** todo texto va por `{{ 'key' | t }}` con entradas en `locales/es.default.json`; `en.json` es fallback secundario. Nunca hardcodear texto.
- **Tokens obligatorios:** nunca `#ffcd11` ni `16px` directo — siempre `var(--color-brand-primary)` y `var(--space-md)`. Definidos en `config/settings_schema.json`, emitidos en `snippets/global-tokens.liquid`.
- **CSS scoped:** cada section/snippet trae su CSS en `{% stylesheet %}`. Solo `assets/base.css` es global. Cero CSS inline gigante en `theme.liquid`.
- **JS por Web Components nativos:** sin jQuery, sin monkey-patches globales de `fetch`/`XHR`, sin `halo.*` global.
- **Filtros de imagen:** solo `image_url` + `image_tag`. `img_url`/`img_tag` prohibidos.
- **HTML semántico + WCAG 2.1 AA:** `<nav>`, `<main>`, `<section>`, `<button>`, `<details>`. Contraste ≥4.5:1. Focus visible. Skip link a `#MainContent`. `prefers-reduced-motion` respetado.
- **Prohibido `{% ... %}` literal dentro de comentarios CSS del bloque `{% style %}`** (Shopify los parsea y rompe el archivo).
- **`request.design_mode`** para placeholders visuales cuando settings/blocks están vacíos.
- **Tema publicado en Shopify NO se toca en toda la Fase 1.** Halo sigue sirviendo tráfico real. El tema nuevo se sube solo como `--unpublished`.
- **Commits en español** siguiendo el estilo del historial (`chore:`, `feat:`, `fix:`, `docs:`, etc.).

---

## Task 1: Precondiciones y backup

**Files:**
- No modifica archivos. Solo verifica entorno y respalda.

**Interfaces:**
- Consumes: nada (task 0 del plan)
- Produces: entorno listo (CLI autenticado, git limpio, backup del tema publicado descargado)

- [ ] **Step 1: Verificar Shopify CLI instalado y versión ≥3.0**

Run:
```bash
shopify version
```
Expected: `3.x.x` o superior. Si no está instalado o es versión antigua, instalar desde https://shopify.dev/docs/api/shopify-cli antes de continuar.

- [ ] **Step 2: Verificar autenticación con la store**

Run:
```bash
shopify theme list --store nqlnstore.myshopify.com
```
Expected: lista de temas de la tienda (incluyendo el Halo publicado). Si pide login, ejecutar `shopify login --store nqlnstore.myshopify.com` primero.

- [ ] **Step 3: Verificar git status limpio**

Run:
```bash
git status
```
Expected: `nothing to commit, working tree clean`. Si hay cambios pendientes, commitearlos o hacer stash antes de continuar (el setup requiere un working tree limpio para que los `git mv` masivos sean legibles).

- [ ] **Step 4: Descargar backup del tema Halo publicado desde Shopify Admin**

Manual (una sola vez):
1. Ir a https://nqlnstore.myshopify.com/admin/themes
2. Localizar el tema publicado (probablemente "Halo" o similar)
3. Click en menú `⋯` → "Descargar archivo del tema"
4. Guardar el ZIP como `~/backups/nqln-halo-YYYY-MM-DD.zip` (fuera del repo)

Esto es el respaldo por si algo sale mal. NO se commitea al repo.

- [ ] **Step 5: Verificar que el spec de referencia está en el repo**

Run:
```bash
ls docs/superpowers/specs/2026-08-11-nqln-theme-fase-1-setup-design.md
```
Expected: el archivo existe. Si no, el plan no puede ejecutarse correctamente.

- [ ] **Step 6: No hay commit en esta task (solo verificaciones)**

Sin commit. Passing = precondiciones OK, listo para Task 2.

---

## Task 2: Mover Halo actual a `_legacy-halo/`

**Files:**
- Move: `assets/` → `_legacy-halo/assets/`
- Move: `config/` → `_legacy-halo/config/`
- Move: `layout/` → `_legacy-halo/layout/`
- Move: `locales/` → `_legacy-halo/locales/`
- Move: `sections/` → `_legacy-halo/sections/`
- Move: `snippets/` → `_legacy-halo/snippets/`
- Move: `templates/` → `_legacy-halo/templates/`

**Interfaces:**
- Consumes: entorno OK de Task 1
- Produces: repo con Halo movido; raíz vacía de las 7 carpetas Shopify (lista para Task 3)

- [ ] **Step 1: Crear carpeta `_legacy-halo/`**

Run:
```bash
mkdir -p _legacy-halo
```
Expected: carpeta creada sin error.

- [ ] **Step 2: Mover las 7 carpetas Shopify con `git mv`**

Run (una por una para poder revisar si algo falla):
```bash
git mv assets _legacy-halo/assets
git mv config _legacy-halo/config
git mv layout _legacy-halo/layout
git mv locales _legacy-halo/locales
git mv sections _legacy-halo/sections
git mv snippets _legacy-halo/snippets
git mv templates _legacy-halo/templates
```
Expected: cada comando ejecuta sin error. `docs/` NO se mueve (queda en la raíz).

- [ ] **Step 3: Verificar la estructura resultante**

Run:
```bash
ls _legacy-halo/
ls . | grep -E '^(assets|config|layout|locales|sections|snippets|templates)$'
```
Expected:
- `_legacy-halo/` contiene las 7 carpetas
- El segundo comando devuelve **vacío** (las 7 carpetas ya no están en la raíz)

- [ ] **Step 4: Verificar que git detectó los renames correctamente**

Run:
```bash
git status --short | head -20
```
Expected: mayoría de archivos con prefijo `R ` (renamed) — git detecta que el contenido no cambió, solo la ruta. Si aparecen como `D` (deleted) + `??` (untracked) en vez de `R`, git no detectó el rename (raro, pero funciona igual — el commit tendrá el mismo efecto).

- [ ] **Step 5: Commit del mv masivo**

```bash
git commit -m "$(cat <<'EOF'
chore: mueve Halo actual a _legacy-halo/ (congelado)

Preparacion para arrancar el tema nuevo desde skeleton en la raiz del
repo. Halo queda intacto en _legacy-halo/ como referencia para portar
features y como respaldo (no se sube al tema publicado gracias al
.shopifyignore que se agrega en la siguiente task).

El tema publicado en Shopify (Halo) sigue intacto en la CDN de Shopify.
Este commit solo mueve archivos en el repo local; hasta que se ejecute
'shopify theme push', nada llega al Shopify Admin.

Ref: docs/superpowers/specs/2026-08-11-nqln-theme-fase-1-setup-design.md
Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 2

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```
Expected: commit exitoso. Ejecutar `git log --oneline -1` para confirmar.

- [ ] **Step 6: Push del commit para snapshot remoto**

```bash
git push origin main
```
Expected: push exitoso. Sirve como checkpoint recuperable si algo sale mal en las siguientes tasks.

---

## Task 3: Importar Shopify Skeleton Theme como base

**Files:**
- Create (import from skeleton): `assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/` en la raíz (~50 archivos)

**Interfaces:**
- Consumes: raíz sin las 7 carpetas Shopify (post Task 2)
- Produces: skeleton importado en raíz, listo para customizar en tasks 4-13

- [ ] **Step 1: Clonar Shopify Skeleton Theme a carpeta temporal**

Run:
```bash
git clone --depth 1 https://github.com/Shopify/skeleton-theme.git /tmp/nqln-skeleton
```
Expected: clone exitoso. `--depth 1` evita descargar todo el historial (no lo necesitamos).

- [ ] **Step 2: Verificar que el skeleton tiene la estructura esperada**

Run:
```bash
ls /tmp/nqln-skeleton/
```
Expected: contiene `assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`, `.gitignore` (o `.gitignore.shopify`). Sin errores.

- [ ] **Step 3: Copiar contenido del skeleton a la raíz del repo (excluyendo .git)**

Run:
```bash
cp -r /tmp/nqln-skeleton/assets .
cp -r /tmp/nqln-skeleton/config .
cp -r /tmp/nqln-skeleton/layout .
cp -r /tmp/nqln-skeleton/locales .
cp -r /tmp/nqln-skeleton/sections .
cp -r /tmp/nqln-skeleton/snippets .
cp -r /tmp/nqln-skeleton/templates .
```
Expected: copias exitosas. NO copiar `.git/` del skeleton (rompería el repo actual).

- [ ] **Step 4: Verificar que ambos temas coexisten**

Run:
```bash
ls -1
```
Expected output incluye:
- `_legacy-halo/` (Halo, del Task 2)
- `assets/` `config/` `layout/` `locales/` `sections/` `snippets/` `templates/` (skeleton, recién copiado)
- `docs/`, `CLAUDE.md`, `.gitignore`

- [ ] **Step 5: Limpiar carpeta temporal**

Run:
```bash
rm -rf /tmp/nqln-skeleton
```
Expected: sin error.

- [ ] **Step 6: Stage y commit del skeleton importado**

```bash
git add assets config layout locales sections snippets templates
git status --short | wc -l
```
Expected: número razonable de archivos nuevos (probablemente 30-60 según versión actual del skeleton). Si es 0, algo salió mal — investigar antes de commitear.

Commit:
```bash
git commit -m "$(cat <<'EOF'
chore: importa Shopify Skeleton Theme como base del tema nuevo

Copia el contenido del oficial https://github.com/Shopify/skeleton-theme
en la raiz del repo. Este skeleton es la version ultra-minima del tema
Dawn: estructura Online Store 2.0 correcta, hooks obligatorios de
Shopify (content_for_header, content_for_layout), settings_schema.json
base, translations base y templates JSON minimos.

Las tasks siguientes customizan este skeleton (theme.liquid, tokens,
snippets de meta/SEO/JSON-LD, CSS base, i18n en espanol) para dejar
la Fase 1 completa.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push origin main
```
Expected: commit + push exitosos.

---

## Task 4: Crear `.shopifyignore` para excluir Halo del CLI

**Files:**
- Create: `.shopifyignore` (raíz)

**Interfaces:**
- Consumes: `_legacy-halo/` existente (Task 2), skeleton en raíz (Task 3)
- Produces: `.shopifyignore` — a partir de acá `shopify theme push` NO sube Halo aunque esté en el mismo repo

- [ ] **Step 1: Crear `.shopifyignore` con el contenido específico**

Create file `.shopifyignore` (raíz) con este contenido exacto:

```
# Congelado: Halo legacy. Se preserva como referencia local pero NO se
# sube al tema publicado. Ver docs/superpowers/specs/
#   2026-08-11-nqln-theme-fase-1-setup-design.md
_legacy-halo/

# Documentacion del proyecto (specs, plans). No forma parte del tema.
docs/

# Screenshots temporales usados durante brainstorming.
vauli-template.png

# Playwright MCP output (screenshots, snapshots) durante debugging.
.playwright-mcp/

# Backup local del tema (nunca commitear al repo, doble seguridad).
*.zip
```

- [ ] **Step 2: Verificar que Shopify CLI respeta el `.shopifyignore`**

Run (dry-run — NO sube nada):
```bash
shopify theme push --unpublished --dry-run --store nqlnstore.myshopify.com
```
Expected: la salida lista los archivos que se subirían. **Verificar** que ninguna ruta empieza con `_legacy-halo/` ni `docs/`. Si aparecen, revisar el `.shopifyignore` (nombre exacto, sin extensión, en la raíz).

Nota: `--dry-run` puede no estar disponible en todas las versiones del CLI. Si el flag es rechazado, saltar este step y verificar manualmente inspeccionando qué se sube en la Task 14.

- [ ] **Step 3: Commit**

```bash
git add .shopifyignore
git commit -m "$(cat <<'EOF'
chore: agrega .shopifyignore para excluir Halo y docs del CLI push

El .shopifyignore le dice a Shopify CLI que no incluya ciertos paths
en 'theme push'. Excluidos:
- _legacy-halo/ (Halo actual, congelado en el repo pero no en el tema)
- docs/ (specs, plans — no forman parte del tema)
- vauli-template.png (screenshot temporal)
- .playwright-mcp/ (output de debugging)
- *.zip (backups locales)

Con esto podemos hacer 'shopify theme push --unpublished' y sube solo
el skeleton nuevo, no todo el repo.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push origin main
```
Expected: commit + push exitosos.

---

## Task 5: Customizar `layout/theme.liquid`

**Files:**
- Modify (reemplazar completo): `layout/theme.liquid`

**Interfaces:**
- Consumes: `snippets/global-tokens.liquid` (Task 6), `snippets/meta-tags.liquid` (Task 7), `snippets/schema-jsonld.liquid` (Task 8), `assets/base.css` (Task 10). **Nota:** estos snippets/assets aún no existen. El `theme.liquid` los referencia; en Fase 1 los renders/asset_url a snippets/assets inexistentes fallan silenciosamente en Shopify (no rompen la página). Se crean en las tasks siguientes.
- Produces: `theme.liquid` de ~150 líneas que envuelve toda la app

- [ ] **Step 1: Reemplazar todo el contenido de `layout/theme.liquid`**

Sobreescribir el archivo `layout/theme.liquid` con este contenido exacto:

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="theme-color" content="{{ settings.color_bg | default: '#ffffff' }}">
    <link rel="canonical" href="{{ canonical_url }}">
    {%- if settings.favicon -%}
      <link rel="shortcut icon" href="{{ settings.favicon | image_url: width: 32, height: 32 }}" type="image/png">
    {%- endif -%}
    <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>

    <title>
      {{- page_title -}}
      {%- if current_tags %} &ndash; {{ current_tags | join: ', ' }}{% endif -%}
      {%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
    </title>
    {%- if page_description -%}
      <meta name="description" content="{{ page_description | escape }}">
    {%- endif -%}

    {% render 'meta-tags' %}
    {% render 'schema-jsonld' %}

    {{ content_for_header }}
    {% render 'global-tokens' %}
    {{ 'base.css' | asset_url | stylesheet_tag }}
  </head>

  <body class="template-{{ request.page_type }}">
    <a href="#MainContent" class="skip-to-content-link visually-hidden">
      {{- 'accessibility.skip_to_text' | t -}}
    </a>

    {% sections 'header-group' %}

    <main id="MainContent" role="main" tabindex="-1">
      {{ content_for_layout }}
    </main>

    {% sections 'footer-group' %}
  </body>
</html>
```

- [ ] **Step 2: Crear los section groups vacíos `header-group.json` y `footer-group.json`**

`{% sections 'header-group' %}` y `{% sections 'footer-group' %}` en `theme.liquid` requieren archivos `sections/header-group.json` y `sections/footer-group.json`. En Fase 1 los dejamos **vacíos** (Fase 2 los llena).

Create `sections/header-group.json` con:
```json
{
  "type": "header",
  "name": "Header",
  "sections": {},
  "order": []
}
```

Create `sections/footer-group.json` con:
```json
{
  "type": "footer",
  "name": "Footer",
  "sections": {},
  "order": []
}
```

- [ ] **Step 3: Verificar que Liquid es sintácticamente válido**

Run:
```bash
shopify theme check --category=LiquidHTMLSyntaxError layout/theme.liquid
```
Expected: sin errores de sintaxis Liquid/HTML. Warnings de "missing snippet" para `meta-tags`, `schema-jsonld`, `global-tokens` son esperadas (se crean en tasks 6-8). Otros warnings anotables pero no bloqueantes.

- [ ] **Step 4: Commit**

```bash
git add layout/theme.liquid sections/header-group.json sections/footer-group.json
git commit -m "$(cat <<'EOF'
feat(layout): reescribe theme.liquid limpio (~150 lineas)

Reemplaza el theme.liquid del skeleton por la version del tema NQLN
segun spec de Fase 1. Cambios clave respecto al skeleton default:

- meta viewport con viewport-fit=cover para safe-area de iOS
- meta theme-color desde settings.color_bg
- canonical + favicon condicional
- preconnect a cdn.shopify.com
- title con separador em-dash, incluye shop.name
- meta description condicional
- renders de snippets: meta-tags (OG/Twitter), schema-jsonld (SEO
  estructurado), global-tokens (CSS vars desde settings)
- base.css como unico CSS global
- content_for_header obligatorio en head
- skip link a #MainContent con visually-hidden por default
- sections header-group y footer-group (vacios en Fase 1, se llenan
  en Fase 2 con header.liquid y footer.liquid)
- main con id, role y tabindex para skip link

Sin JS/CSS inline gigante, sin monkey-patches, sin canvas glitch, sin
scripts inline de terceros, sin traducciones runtime — todo eso vive
en el legacy Halo y no viaja al tema nuevo.

Los snippets referenciados se crean en Tasks 6-8. Warnings de missing
snippet son esperadas hasta entonces.

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 5

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```
Expected: commit exitoso.

---

## Task 6: Crear `snippets/global-tokens.liquid`

**Files:**
- Create: `snippets/global-tokens.liquid`

**Interfaces:**
- Consumes: settings del `config/settings_schema.json` (Task 9) — los defaults dentro del snippet cubren el caso donde el setting aún no existe.
- Produces: CSS custom properties globales (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`) disponibles en todo el tema. Consumido por `theme.liquid` (Task 5) y por cualquier CSS futuro.

- [ ] **Step 1: Crear el archivo con el contenido completo**

Create `snippets/global-tokens.liquid` con este contenido:

```liquid
{%- comment -%}
  Emite todos los design tokens del tema como CSS custom properties
  en :root, leyendo desde settings.*. Se incluye en layout/theme.liquid
  dentro del <head>. Cuando el merchant cambia un setting en el editor,
  esta variable se re-renderiza en la siguiente peticion y el tema
  entero se actualiza sin tocar codigo.

  Los defaults inline (via | default: '...') cubren el caso donde el
  setting aun no fue definido en config/settings_schema.json (util en
  Fase 1 antes de que ese schema exista).

  Fase 1: valores placeholder derivados de la paleta METRIKASA/NQLN.
  Fase 3: refinamiento con mockups del usuario.
{%- endcomment -%}
<style>
  :root {
    /* Colores brand */
    --color-brand-primary: {{ settings.color_brand_primary | default: '#ffcd11' }};
    --color-brand-secondary: {{ settings.color_brand_secondary | default: '#20b19e' }};
    --color-brand-danger: {{ settings.color_brand_danger | default: '#c33a3a' }};

    /* Colores neutros */
    --color-text: {{ settings.color_text | default: '#1a1a1a' }};
    --color-text-muted: {{ settings.color_text_muted | default: '#666666' }};
    --color-bg: {{ settings.color_bg | default: '#ffffff' }};
    --color-bg-soft: {{ settings.color_bg_soft | default: '#f6f5f1' }};
    --color-border: {{ settings.color_border | default: '#e5e5e5' }};

    /* Tipografia */
    {%- if settings.font_heading -%}
      --font-heading: {{ settings.font_heading.family }}, {{ settings.font_heading.fallback_families }};
    {%- else -%}
      --font-heading: system-ui, -apple-system, sans-serif;
    {%- endif -%}
    {%- if settings.font_body -%}
      --font-body: {{ settings.font_body.family }}, {{ settings.font_body.fallback_families }};
    {%- else -%}
      --font-body: system-ui, -apple-system, sans-serif;
    {%- endif -%}

    --font-size-h1: {{ settings.size_h1_desktop | default: 32 }}px;
    --font-size-h1-mobile: {{ settings.size_h1_mobile | default: 24 }}px;
    --font-size-body: {{ settings.size_body | default: 16 }}px;
    --font-weight-body: 400;
    --font-weight-strong: 600;
    --font-weight-heading: 800;

    /* Espaciado (escala base 4px por defecto) */
    --space-base: {{ settings.space_scale | default: 4 }}px;
    --space-xs: calc(var(--space-base) * 1);   /* 4px */
    --space-sm: calc(var(--space-base) * 2);   /* 8px */
    --space-md: calc(var(--space-base) * 4);   /* 16px */
    --space-lg: calc(var(--space-base) * 6);   /* 24px */
    --space-xl: calc(var(--space-base) * 10);  /* 40px */
    --space-2xl: calc(var(--space-base) * 16); /* 64px */
    --space-3xl: calc(var(--space-base) * 24); /* 96px */

    /* Radios */
    --radius-sm: {{ settings.radius_sm | default: 4 }}px;
    --radius-md: {{ settings.radius_md | default: 8 }}px;
    --radius-lg: {{ settings.radius_lg | default: 16 }}px;
    --radius-full: 9999px;

    /* Sombras (fijas por ahora; editables en Fase 3 si hace falta) */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
</style>
```

- [ ] **Step 2: Verificar sintaxis Liquid**

Run:
```bash
shopify theme check snippets/global-tokens.liquid
```
Expected: sin errores. Puede haber sugerencias menores (ej. "prefer schema"), no bloqueantes.

- [ ] **Step 3: Commit**

```bash
git add snippets/global-tokens.liquid
git commit -m "$(cat <<'EOF'
feat(snippets): agrega global-tokens que emite CSS vars desde settings

Snippet que se incluye en layout/theme.liquid dentro del <head>. Emite
todos los design tokens del tema (colores, tipografia, espaciado,
radios, sombras) como CSS custom properties en :root.

Los tokens se leen desde settings.* (config/settings_schema.json de
Task 9), con defaults inline como fallback para cuando el setting aun
no existe (util durante desarrollo de Fase 1).

Cuando el merchant edita un color/fuente/tamano desde el theme editor,
el snippet se re-renderiza y todo el tema hereda el cambio sin tocar
ninguna otra parte del codigo.

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 6

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Crear `snippets/meta-tags.liquid`

**Files:**
- Create: `snippets/meta-tags.liquid`

**Interfaces:**
- Consumes: `product`, `page_title`, `page_description`, `canonical_url`, `shop`, `settings.social_share_image` (opcional).
- Produces: meta tags Open Graph y Twitter cards en el `<head>`.

- [ ] **Step 1: Crear el archivo**

Create `snippets/meta-tags.liquid` con este contenido:

```liquid
{%- comment -%}
  Open Graph y Twitter Cards para compartir en redes sociales.
  Se incluye en layout/theme.liquid antes de content_for_header.

  En templates de producto: usa product.featured_image como og:image.
  En otros templates: usa settings.social_share_image (si existe).

  page_title, page_description y canonical_url son variables globales
  de Shopify Liquid disponibles en cualquier template.
{%- endcomment -%}
<meta property="og:type" content="{% if request.page_type == 'product' %}product{% else %}website{% endif %}">
<meta property="og:title" content="{{ page_title | escape }}">
<meta property="og:description" content="{{ page_description | default: shop.description | escape }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:site_name" content="{{ shop.name | escape }}">
<meta property="og:locale" content="{{ request.locale.iso_code | replace: '-', '_' }}">
{%- if request.page_type == 'product' and product.featured_image -%}
  <meta property="og:image" content="{{ product.featured_image | image_url: width: 1200 }}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="{{ 1200 | divided_by: product.featured_image.aspect_ratio | at_most: 1200 }}">
  <meta property="og:image:alt" content="{{ product.featured_image.alt | default: product.title | escape }}">
{%- elsif settings.social_share_image -%}
  <meta property="og:image" content="{{ settings.social_share_image | image_url: width: 1200 }}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="{{ 1200 | divided_by: settings.social_share_image.aspect_ratio | at_most: 1200 }}">
{%- endif -%}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page_title | escape }}">
<meta name="twitter:description" content="{{ page_description | default: shop.description | escape }}">
{%- if request.page_type == 'product' and product.featured_image -%}
  <meta name="twitter:image" content="{{ product.featured_image | image_url: width: 1200 }}">
{%- elsif settings.social_share_image -%}
  <meta name="twitter:image" content="{{ settings.social_share_image | image_url: width: 1200 }}">
{%- endif -%}
```

- [ ] **Step 2: Verificar sintaxis**

Run:
```bash
shopify theme check snippets/meta-tags.liquid
```
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add snippets/meta-tags.liquid
git commit -m "$(cat <<'EOF'
feat(snippets): agrega meta-tags con Open Graph y Twitter Cards

Snippet incluido en layout/theme.liquid que emite meta tags para
compartir en redes sociales (Facebook, LinkedIn, WhatsApp, Twitter/X):

- og:type dinamico (product vs website)
- og:title, og:description con fallback a shop.description
- og:url = canonical_url
- og:image:
  * Templates de producto -> product.featured_image (1200px)
  * Otros templates -> settings.social_share_image (si existe)
- og:image:width/height calculados para conservar aspect ratio
- twitter:card summary_large_image

Usa filtros image_url (no img_url deprecado) segun convencion del tema.

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 7

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Crear `snippets/schema-jsonld.liquid`

**Files:**
- Create: `snippets/schema-jsonld.liquid`

**Interfaces:**
- Consumes: `product`, `collection`, `shop`, `canonical_url`, `settings.favicon`.
- Produces: `<script type="application/ld+json">` con schemas Organization + Product + BreadcrumbList según el tipo de página.

- [ ] **Step 1: Crear el archivo**

Create `snippets/schema-jsonld.liquid` con este contenido:

```liquid
{%- comment -%}
  Structured data (JSON-LD) para SEO. Se incluye en layout/theme.liquid
  antes de content_for_header.

  Emite:
  - Organization: siempre (identifica la marca a Google)
  - Product: solo en templates de producto (activa Rich Results con
    precio, disponibilidad, reviews si estan cargadas)
  - BreadcrumbList: en templates product/collection (activa breadcrumbs
    en resultados de busqueda de Google)

  Testeable con Google Rich Results Test:
  https://search.google.com/test/rich-results

  Referencia: https://developers.google.com/search/docs/appearance/structured-data
{%- endcomment -%}

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": {{ shop.name | json }},
  "url": {{ shop.url | json }}
  {%- if settings.favicon -%}
  ,"logo": {{ settings.favicon | image_url: width: 512 | json }}
  {%- endif -%}
}
</script>

{%- if request.page_type == 'product' and product -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": {{ product.title | json }},
  "description": {{ product.description | strip_html | truncatewords: 60 | json }},
  "sku": {{ product.selected_or_first_available_variant.sku | default: product.id | json }},
  "url": {{ canonical_url | json }}
  {%- if product.featured_image -%}
  ,"image": {{ product.featured_image | image_url: width: 1200 | json }}
  {%- endif -%}
  {%- if product.vendor != blank -%}
  ,"brand": {
    "@type": "Brand",
    "name": {{ product.vendor | json }}
  }
  {%- endif -%}
  ,"offers": {
    "@type": "Offer",
    "url": {{ canonical_url | json }},
    "priceCurrency": {{ cart.currency.iso_code | json }},
    "price": {{ product.price | divided_by: 100.0 | json }},
    "availability": {%- if product.available -%}"https://schema.org/InStock"{%- else -%}"https://schema.org/OutOfStock"{%- endif -%}
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": {{ shop.url | json }}
    }
    {%- if collection -%}
    ,{
      "@type": "ListItem",
      "position": 2,
      "name": {{ collection.title | json }},
      "item": {{ shop.url | append: collection.url | json }}
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": {{ product.title | json }},
      "item": {{ canonical_url | json }}
    }
    {%- else -%}
    ,{
      "@type": "ListItem",
      "position": 2,
      "name": {{ product.title | json }},
      "item": {{ canonical_url | json }}
    }
    {%- endif -%}
  ]
}
</script>
{%- endif -%}

{%- if request.page_type == 'collection' and collection -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": {{ shop.url | json }}
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": {{ collection.title | json }},
      "item": {{ canonical_url | json }}
    }
  ]
}
</script>
{%- endif -%}
```

- [ ] **Step 2: Verificar sintaxis**

Run:
```bash
shopify theme check snippets/schema-jsonld.liquid
```
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add snippets/schema-jsonld.liquid
git commit -m "$(cat <<'EOF'
feat(snippets): agrega schema-jsonld para SEO estructurado

Emite JSON-LD segun schema.org para que Google active Rich Results:

- Organization: siempre. Identifica NQLN Store como marca.
- Product: en templates de producto. Activa precio, disponibilidad,
  imagen y marca en los resultados de Google.
- BreadcrumbList: en product y collection. Muestra la ruta de
  navegacion en los resultados de busqueda.

Testeable con Google Rich Results Test una vez el tema este desplegado:
https://search.google.com/test/rich-results

Los precios se emiten dividiendo cents por 100.0 (Shopify guarda todo
en cents). La disponibilidad usa las URIs oficiales de schema.org
(InStock / OutOfStock).

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 8

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Customizar `config/settings_schema.json` con tokens placeholder

**Files:**
- Modify (reemplazar completo): `config/settings_schema.json`

**Interfaces:**
- Consumes: nada.
- Produces: settings del theme editor (Colores, Tipografía, Espaciado y Radios) — leídos por `global-tokens.liquid` (Task 6).

- [ ] **Step 1: Reemplazar todo el contenido de `config/settings_schema.json`**

Sobreescribir con este contenido exacto:

```json
[
  {
    "name": "theme_info",
    "theme_name": "NQLN Theme",
    "theme_version": "0.1.0",
    "theme_author": "NQLN Store",
    "theme_documentation_url": "https://github.com/kleyverx/nqln-theme-current",
    "theme_support_url": "mailto:nqlnstore@gmail.com"
  },
  {
    "name": "Colores",
    "settings": [
      {
        "type": "header",
        "content": "Colores de marca"
      },
      {
        "type": "color",
        "id": "color_brand_primary",
        "label": "Color primario",
        "info": "CTAs principales, acentos fuertes",
        "default": "#ffcd11"
      },
      {
        "type": "color",
        "id": "color_brand_secondary",
        "label": "Color secundario",
        "info": "Checks, badges positivos, éxito",
        "default": "#20b19e"
      },
      {
        "type": "color",
        "id": "color_brand_danger",
        "label": "Color de error",
        "info": "Badges negativos, warnings",
        "default": "#c33a3a"
      },
      {
        "type": "header",
        "content": "Colores neutros"
      },
      {
        "type": "color",
        "id": "color_text",
        "label": "Texto principal",
        "default": "#1a1a1a"
      },
      {
        "type": "color",
        "id": "color_text_muted",
        "label": "Texto secundario",
        "default": "#666666"
      },
      {
        "type": "color",
        "id": "color_bg",
        "label": "Fondo principal",
        "default": "#ffffff"
      },
      {
        "type": "color",
        "id": "color_bg_soft",
        "label": "Fondo alterno (secciones)",
        "default": "#f6f5f1"
      },
      {
        "type": "color",
        "id": "color_border",
        "label": "Bordes y separadores",
        "default": "#e5e5e5"
      }
    ]
  },
  {
    "name": "Tipografía",
    "settings": [
      {
        "type": "font_picker",
        "id": "font_heading",
        "label": "Fuente títulos",
        "default": "helvetica_n7"
      },
      {
        "type": "font_picker",
        "id": "font_body",
        "label": "Fuente texto",
        "default": "helvetica_n4"
      },
      {
        "type": "range",
        "id": "size_h1_desktop",
        "label": "Tamaño H1 (desktop)",
        "min": 20,
        "max": 60,
        "step": 1,
        "unit": "px",
        "default": 32
      },
      {
        "type": "range",
        "id": "size_h1_mobile",
        "label": "Tamaño H1 (mobile)",
        "min": 16,
        "max": 40,
        "step": 1,
        "unit": "px",
        "default": 24
      },
      {
        "type": "range",
        "id": "size_body",
        "label": "Tamaño texto cuerpo",
        "min": 12,
        "max": 20,
        "step": 1,
        "unit": "px",
        "default": 16
      }
    ]
  },
  {
    "name": "Espaciado y bordes",
    "settings": [
      {
        "type": "range",
        "id": "space_scale",
        "label": "Escala base de espaciado",
        "info": "El resto de espaciados son múltiplos de este (xs=1x, sm=2x, md=4x, lg=6x, xl=10x, 2xl=16x, 3xl=24x)",
        "min": 2,
        "max": 6,
        "step": 1,
        "unit": "px",
        "default": 4
      },
      {
        "type": "range",
        "id": "radius_sm",
        "label": "Radio pequeño (botones, inputs)",
        "min": 0,
        "max": 8,
        "step": 1,
        "unit": "px",
        "default": 4
      },
      {
        "type": "range",
        "id": "radius_md",
        "label": "Radio medio (cards)",
        "min": 0,
        "max": 16,
        "step": 1,
        "unit": "px",
        "default": 8
      },
      {
        "type": "range",
        "id": "radius_lg",
        "label": "Radio grande (modals)",
        "min": 0,
        "max": 24,
        "step": 1,
        "unit": "px",
        "default": 16
      }
    ]
  },
  {
    "name": "Branding",
    "settings": [
      {
        "type": "image_picker",
        "id": "favicon",
        "label": "Favicon",
        "info": "Icono en la pestaña del navegador. Recomendado: 32x32 o 64x64 PNG cuadrado."
      },
      {
        "type": "image_picker",
        "id": "social_share_image",
        "label": "Imagen para compartir en redes",
        "info": "Se muestra al compartir el sitio en Facebook, WhatsApp, Twitter/X. Recomendado: 1200x630 JPG."
      }
    ]
  }
]
```

- [ ] **Step 2: Validar que el JSON es válido**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('config/settings_schema.json','utf8'))"
```
Expected: sin output (JSON válido). Si hay error, corregir la sintaxis JSON antes de continuar.

- [ ] **Step 3: Verificar con theme-check**

Run:
```bash
shopify theme check config/settings_schema.json
```
Expected: sin errores. Warnings sobre traducciones (`t:` keys) son OK — el schema usa strings literales en español, es válido.

- [ ] **Step 4: Commit**

```bash
git add config/settings_schema.json
git commit -m "$(cat <<'EOF'
feat(config): schema con tokens placeholder (colores, fuentes, espacios)

Reemplaza el settings_schema.json del skeleton con la estructura de
tokens del tema NQLN. Cuatro grupos:

1. Colores: brand (primary/secondary/danger) + neutros (text/bg/border)
   Defaults derivados de la paleta METRIKASA/NQLN actual: amarillo
   #ffcd11, verde #20b19e, hueso #f6f5f1, etc.

2. Tipografia: font_heading + font_body (font_picker de Shopify) +
   escalas de tamano H1 desktop/mobile y body.

3. Espaciado y bordes: escala base configurable (default 4px, los
   demas son multiplos) + 3 radios (sm/md/lg).

4. Branding: favicon + social_share_image (para OG imagen fallback).

Los defaults son placeholder Fase 1. En Fase 3, con mockups del
usuario, se refinan los valores exactos.

Todos estos settings son leidos por snippets/global-tokens.liquid y
emitidos como CSS custom properties en :root, por lo que cambiar
cualquiera en el theme editor actualiza todo el tema sin tocar codigo.

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 9

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Crear `assets/base.css`

**Files:**
- Create: `assets/base.css`

**Interfaces:**
- Consumes: CSS custom properties emitidas por `snippets/global-tokens.liquid` (Task 6).
- Produces: reset + tipografía base + utilidades globales aplicadas a todo el tema.

- [ ] **Step 1: Crear el archivo**

Create `assets/base.css` con este contenido:

```css
/* NQLN Theme — Base CSS (Fase 1)
   Reset minimalista + tipografia base + utilidades globales.
   Todo lo demas se scopa por seccion/snippet via {% stylesheet %}. */

/* ============================================================
   RESET
   ============================================================ */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-body, system-ui, sans-serif);
  font-size: var(--font-size-body, 16px);
  font-weight: var(--font-weight-body, 400);
  line-height: 1.5;
  color: var(--color-text, #1a1a1a);
  background: var(--color-bg, #ffffff);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-family: var(--font-heading, inherit);
  font-weight: var(--font-weight-heading, 800);
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: inherit;
}

h1 { font-size: var(--font-size-h1-mobile, 24px); }
h2 { font-size: 22px; }
h3 { font-size: 18px; }
h4 { font-size: 16px; }
h5 { font-size: 14px; }
h6 { font-size: 12px; }

@media (min-width: 750px) {
  h1 { font-size: var(--font-size-h1, 32px); }
  h2 { font-size: 28px; }
  h3 { font-size: 20px; }
}

p {
  margin: 0 0 var(--space-md, 16px);
}

p:last-child {
  margin-bottom: 0;
}

a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

a:hover,
a:focus-visible {
  text-decoration-thickness: 2px;
}

img,
svg,
video {
  display: block;
  max-width: 100%;
  height: auto;
}

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}

ul, ol {
  margin: 0;
  padding: 0;
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

/* ============================================================
   ACCESIBILIDAD
   ============================================================ */

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.skip-to-content-link {
  position: absolute;
  top: 0;
  left: 0;
  padding: var(--space-md, 16px) var(--space-lg, 24px);
  background: var(--color-brand-primary, #ffcd11);
  color: var(--color-text, #1a1a1a);
  font-weight: var(--font-weight-strong, 600);
  text-decoration: none;
  z-index: 10000;
}

.skip-to-content-link:focus {
  clip: auto !important;
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  overflow: visible !important;
  outline: 2px solid var(--color-text, #1a1a1a);
  outline-offset: 2px;
}

*:focus-visible {
  outline: 2px solid var(--color-brand-secondary, #20b19e);
  outline-offset: 2px;
  border-radius: var(--radius-sm, 4px);
}

/* ============================================================
   UTILIDADES MINIMAS
   ============================================================ */

.page-width {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-md, 16px);
  padding-right: var(--space-md, 16px);
}

@media (min-width: 750px) {
  .page-width {
    padding-left: var(--space-lg, 24px);
    padding-right: var(--space-lg, 24px);
  }
}

/* Anti-flash: elemento vacio no debe tomar espacio (heredado del gotcha
   :empty { display: none } de Halo — replicado por si acaso). */
[data-empty-hide]:empty {
  display: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/base.css
git commit -m "$(cat <<'EOF'
feat(assets): agrega base.css con reset + tipografia + utilidades

CSS base global del tema NQLN. Cargado en layout/theme.liquid con
{{ 'base.css' | asset_url | stylesheet_tag }} en el <head>.

Contenido:

1. Reset minimalista: box-sizing border-box, margin/padding cero en
   headings/p/ul, colores heredados. Body con fuente y color desde
   los tokens globales (--font-body, --color-text, --color-bg).
   Respeta prefers-reduced-motion para scroll-behavior.

2. Escala tipografica base con clamps mobile vs desktop desde 750px.
   H1 usa --font-size-h1 (desktop) / --font-size-h1-mobile.

3. Accesibilidad:
   - .visually-hidden (screen-reader only) con !important para blindar
     contra overrides accidentales.
   - .skip-to-content-link fijo top:0 al recibir foco (WCAG bypass).
   - :focus-visible con outline de --color-brand-secondary por default,
     sobrescribible por componente.

4. Utilidades minimas:
   - .page-width: contenedor centrado max 1200px con padding lateral
     responsivo (16px mobile, 24px desktop).
   - [data-empty-hide]:empty: patron para ocultar decorativos vacios
     (heredado del bug :empty display:none de Halo).

Todos los valores usan var(--*) con fallback. Cero hardcodeados.

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 10

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Customizar `locales/es.default.json`

**Files:**
- Modify (reemplazar completo o crear si no existe): `locales/es.default.json`
- Modify: `locales/en.default.json` → renombrar a `locales/en.json` (fallback secundario, ya no default)

**Interfaces:**
- Consumes: nada.
- Produces: traducciones al español para las keys usadas en `theme.liquid` (Task 5) y snippets básicos.

- [ ] **Step 1: Verificar qué locales trae el skeleton por default**

Run:
```bash
ls locales/
```
Expected: al menos `en.default.json`. Otros idiomas posibles (`fr.json`, `de.json`, etc.) — los borramos si no los queremos.

- [ ] **Step 2: Renombrar `en.default.json` a `en.json` para que deje de ser el default**

Run:
```bash
git mv locales/en.default.json locales/en.json
```
Expected: renombrado exitoso. Al no haber ningún `.default.json`, Shopify tomará el nuevo `es.default.json` como default cuando lo creemos.

- [ ] **Step 3: Crear `locales/es.default.json`**

Create `locales/es.default.json` con contenido inicial (empezamos con las keys usadas en Task 5 más las básicas del skeleton — se expande en fases siguientes):

```json
{
  "accessibility": {
    "skip_to_text": "Saltar al contenido",
    "refresh_page": "Al elegir una selección se recarga la página completa.",
    "loading": "Cargando…"
  },
  "general": {
    "search": {
      "search": "Buscar",
      "placeholder": "Buscar productos…",
      "submit": "Enviar búsqueda"
    },
    "cart": {
      "view": "Ver carrito",
      "empty": "Tu carrito está vacío",
      "add": "Agregar al carrito",
      "checkout": "Finalizar compra"
    },
    "share": {
      "share": "Compartir",
      "copy_to_clipboard": "Copiar enlace",
      "share_url": "URL del producto",
      "success_message": "Enlace copiado al portapapeles"
    },
    "common": {
      "close": "Cerrar",
      "open": "Abrir",
      "menu": "Menú"
    }
  },
  "products": {
    "product": {
      "add_to_cart": "Agregar al carrito",
      "sold_out": "Agotado",
      "unavailable": "No disponible",
      "on_sale": "En oferta",
      "price": {
        "regular_price": "Precio normal",
        "sale_price": "Precio de oferta"
      }
    }
  },
  "customer": {
    "login": {
      "title": "Iniciar sesión",
      "email": "Correo electrónico",
      "password": "Contraseña",
      "submit": "Entrar"
    },
    "register": {
      "title": "Crear cuenta"
    },
    "account": {
      "title": "Mi cuenta",
      "logout": "Cerrar sesión"
    }
  },
  "sections": {
    "header": {
      "menu": "Menú",
      "search": "Buscar",
      "account": "Cuenta",
      "cart": "Carrito"
    },
    "footer": {
      "copyright": "© {{ year }} {{ shop_name }}. Todos los derechos reservados."
    }
  }
}
```

- [ ] **Step 4: Validar que el JSON es válido**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('locales/es.default.json','utf8'))"
```
Expected: sin output. Si hay error de sintaxis, arreglar antes de continuar.

- [ ] **Step 5: Verificar que Shopify detecta `es` como default**

Run:
```bash
shopify theme check locales/
```
Expected: sin errores. Puede haber warnings de "translation key missing in en.json" para keys nuevas — es aceptable en Fase 1 (en.json es fallback opcional).

- [ ] **Step 6: Commit**

```bash
git add locales/en.json locales/es.default.json
git commit -m "$(cat <<'EOF'
feat(locales): agrega es.default.json y renombra en a fallback

Establece espanol como idioma default del tema (locales/es.default.json).
Renombra el en.default.json del skeleton a en.json (fallback secundario).

Traducciones iniciales cubren las keys usadas por layout/theme.liquid y
los flows basicos (accessibility, general.search, general.cart,
general.share, products.product, customer, sections.header/footer).

Se expanden en fases siguientes conforme se van creando secciones que
necesiten mas keys. Las traducciones inglesas del skeleton siguen en
en.json por si algun visitante navega en /en (Shopify multilocale).

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 11

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Crear `README.md`

**Files:**
- Create: `README.md` (raíz)

**Interfaces:**
- Consumes: nada.
- Produces: documentación de workflow para desarrollo.

- [ ] **Step 1: Crear el archivo**

Create `README.md` con este contenido:

```markdown
# NQLN Theme — nqlnstore.com

Repositorio del tema Shopify de **NQLN Store** ([nqlnstore.com](https://nqlnstore.com)).

## Estructura dual

Este repo aloja **dos temas** en paralelo:

- **Tema nuevo (en construcción)** — en la raíz del repo. Basado en el [Shopify Skeleton Theme](https://github.com/Shopify/skeleton-theme) oficial y customizado siguiendo los specs en `docs/superpowers/specs/`. Estado: fase 1 (setup + base). Aún NO publicado.

- **Halo legacy** — en `_legacy-halo/`. Es el tema Ella/Halothemes que hoy sirve tráfico real en nqlnstore.com. Se conserva como referencia para portar features al tema nuevo. **NO se sube** al tema publicado desde este repo (excluido vía `.shopifyignore`).

## Setup local

Necesitas [Shopify CLI 3.x](https://shopify.dev/docs/api/shopify-cli) y estar autenticado con la store:

```bash
shopify version                                # verificar >=3.0.0
shopify login --store nqlnstore.myshopify.com  # una sola vez
```

## Desarrollo local (hot reload)

```bash
shopify theme dev --store nqlnstore.myshopify.com
```

Levanta un servidor local en `localhost:9292` con el tema nuevo (raíz del repo) y hot reload al editar archivos. Usa la CDN de Shopify para catálogo, imágenes, etc.

## Deploy a Shopify como tema "sin publicar"

```bash
shopify theme push --unpublished --store nqlnstore.myshopify.com
```

Sube el tema nuevo como "sin publicar" en Shopify Admin. Halo publicado sigue sirviendo tráfico real; el nuevo solo es accesible vía preview URL (`*.shopifypreview.com`).

## Actualizar un tema existente sin publicar

```bash
shopify theme push --theme=<theme-id> --store nqlnstore.myshopify.com
```

Encuentra el `<theme-id>` con `shopify theme list --store nqlnstore.myshopify.com`.

## Cuándo se publica el tema nuevo

Solo en la **Fase 8** del proyecto (ver `docs/superpowers/specs/`), cuando esté completo y probado. Hasta entonces, Halo publicado sigue intacto.

## Estructura del repo

```
nqln-theme-current/
├── _legacy-halo/           # Halo legacy (excluido del CLI)
├── assets/                 # 🆕 tema nuevo
├── config/
├── layout/
├── locales/
├── sections/
├── snippets/
├── templates/
├── docs/
│   └── superpowers/
│       ├── specs/          # specs de diseño por fase
│       └── plans/          # plans de implementación por fase
├── .shopifyignore          # excluye _legacy-halo/, docs/, etc.
├── CLAUDE.md               # contexto para Claude Code
└── README.md               # este archivo
```

## Roadmap del tema nuevo

| # | Fase | Estado |
|---|------|--------|
| 1 | Setup + base (repo dual, layout, tokens, meta, SEO, i18n) | ← actual |
| 2 | Header + Footer | pendiente |
| 3 | Design system + tokens finales (con mockups del usuario) | pendiente |
| 4 | Home | pendiente |
| 5 | Colecciones + búsqueda | pendiente |
| 6 | Producto (+ migrar VAULI/HydroLoko) | pendiente |
| 7 | Carrito + Cuenta | pendiente |
| 8 | Integración de apps + go-live | pendiente |

Cada fase tiene su spec + plan en `docs/superpowers/`.

## Convenciones

Ver `CLAUDE.md` para las convenciones del proyecto (idioma UI, tokens, CSS scoped, web components, semántica, WCAG, prohibiciones específicas de este tema).

## Contacto

nqlnstore@gmail.com
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: agrega README.md con workflow de desarrollo

Explica la estructura dual del repo (Halo en _legacy-halo/, tema nuevo
en raiz), como levantar el dev server con shopify CLI, como hacer push
del tema como 'sin publicar', el roadmap de 8 fases, y donde encontrar
las convenciones (CLAUDE.md) y los specs (docs/superpowers/specs/).

Es el primer punto de entrada para cualquier persona (o agente) que
abre el repo por primera vez.

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 12

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Actualizar `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (raíz)

**Interfaces:**
- Consumes: contenido actual de CLAUDE.md (contexto de Halo).
- Produces: CLAUDE.md actualizado que refleja la estructura dual y las convenciones nuevas del tema.

- [ ] **Step 1: Leer contenido actual de CLAUDE.md**

Run:
```bash
cat CLAUDE.md | head -30
```
Verificar el contenido actual y decidir qué preservar (probablemente el puntero al Cerebro Obsidian y la descripción de negocio) vs qué actualizar (arquitectura, convenciones).

- [ ] **Step 2: Reemplazar CLAUDE.md con la nueva versión**

Sobreescribir con este contenido (preserva la sección "Puntero al Cerebro" del archivo anterior, actualiza el resto):

```markdown
# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Puntero al Cerebro (Obsidian Vault)

Este proyecto (tema Shopify Liquid del storefront **nqlnstore.com**, ahora en transición de Halo/Ella a tema propio desde Skeleton) también está
documentado en el **Cerebro**, un wiki de todos los proyectos del escritorio (bóveda de Obsidian).
Para contexto de negocio, arquitectura resumida, conexiones con otros proyectos y mejoras
sugeridas, consulta primero:

- `C:/Users/Kley Marg/Documents/Obsidian Vault/Cerebro/proyectos/nqln-theme-current.md`
- Panorama general: `C:/Users/Kley Marg/Documents/Obsidian Vault/Cerebro/index.md` y
  `C:/Users/Kley Marg/Documents/Obsidian Vault/Cerebro/conexiones/mapa-general.md`

El Cerebro se mantiene desde su propia bóveda, no desde este repo. Tras cambios relevantes aquí,
abre Claude Code en la bóveda y pide: "re-analiza nqln-theme-current".

## Qué es esto

Repositorio del tema Shopify de **NQLN Store** (nqlnstore.com), tienda venezolana.

**Estructura dual actual (Fase 1 en curso — Setup + base del tema nuevo)**:

- **Tema nuevo** en la raíz del repo, basado en el [Shopify Skeleton Theme](https://github.com/Shopify/skeleton-theme) oficial. Está en construcción — Fase 1 (setup + base) completada; Fases 2-8 pendientes (ver `docs/superpowers/specs/`).

- **Halo legacy** en `_legacy-halo/`. Es el tema Ella/Halothemes v6.5.0 que hoy sirve tráfico real. Se conserva como referencia para portar features. Excluido del CLI push via `.shopifyignore`.

El tema publicado en Shopify sigue siendo Halo hasta la Fase 8, cuando se publica el nuevo.

Idioma principal: **español** (`locales/es.default.json`).

## Flujo de trabajo y "comandos"

- **Local dev con hot reload**: `shopify theme dev --store nqlnstore.myshopify.com` levanta `localhost:9292`.
- **Deploy como sin publicar**: `shopify theme push --unpublished --store nqlnstore.myshopify.com`.
- **Actualizar tema existente**: `shopify theme push --theme=<id> --store nqlnstore.myshopify.com`.
- **Lint Liquid + accesibilidad**: `shopify theme check` (o `shopify theme check <archivo>`).
- **Validar JSON**: `node -e "JSON.parse(require('fs').readFileSync('config/settings_schema.json','utf8'))"`.
- **Commits en español** siguiendo el estilo del historial (`chore:`, `feat:`, `fix:`, `docs:`).

## Arquitectura del tema nuevo

Estructura estándar Shopify Online Store 2.0 (`assets/ config/ layout/ locales/ sections/ snippets/ templates/`). El skeleton oficial es la base — solo customizamos lo que no sirve del default.

### Design tokens (Fase 1)

Todo el sistema visual se declara en:
- `config/settings_schema.json` — settings editables desde el theme editor (colores, tipografía, espaciado, radios).
- `snippets/global-tokens.liquid` — emite esos settings como CSS custom properties en `:root`.
- `assets/base.css` — reset + tipografía base + utilidades globales, todo usando `var(--*)`.

Cambiar cualquier token en el theme editor actualiza el tema entero sin tocar código. **Regla clave: nunca hardcodear colores/espacios en CSS, siempre `var(--color-*)` y `var(--space-*)`.**

### Layout raíz

`layout/theme.liquid` es corto (~150 líneas), limpio, sin CSS/JS inline gigante. Sin monkey-patches de fetch/XHR/halo.* como los que tenía Halo. Sin scripts de terceros inline (Brevo, Lottie) — se cargan solo donde se usen.

Renders obligatorios en el head: `meta-tags` (Open Graph/Twitter), `schema-jsonld` (SEO estructurado), `global-tokens` (CSS vars).

### Sections y snippets

Cada `.liquid` de section/snippet trae su CSS en `{% stylesheet %}` (scoped, no hereda ni fugas). Solo `assets/base.css` es global. Los snippets deben llevar `{% doc %}` como header.

### JS

Web Components nativos (`class Foo extends HTMLElement { ... }`), sin jQuery, sin monkey-patches globales, sin `halo.*`. Cada componente interactivo su propio archivo `assets/<componente>.js` cargado por la section que lo usa.

## Convenciones

- **Español primero**. Todo texto UI va por `{{ 'key' | t }}` con entradas en `locales/es.default.json`. `en.json` es fallback secundario.
- **Tokens obligatorios**: nunca `#ffcd11` ni `16px` directo en CSS — siempre `var(--color-brand-primary)` y `var(--space-md)`.
- **Filtros de imagen**: solo `image_url` + `image_tag`. `img_url`/`img_tag` prohibidos (deprecados).
- **HTML semántico + WCAG 2.1 AA**: `<nav>`, `<main>`, `<button>`, `<details>`. Contraste ≥4.5:1. Focus visible. Skip link a `#MainContent`. `prefers-reduced-motion` respetado.
- **Prohibido `{% ... %}` literal dentro de comentarios CSS del bloque `{% style %}`** (Shopify los parsea y rompe el archivo — bug ya visto en Halo).
- **`request.design_mode`** para placeholders visuales cuando settings/blocks están vacíos.
- **Commits en español** siguiendo el historial (`chore:`, `feat:`, `fix:`, `docs:`).
- **Tema publicado NO se toca** hasta la Fase 8. Cualquier push va siempre a tema "sin publicar" o al tema en desarrollo.

## Trabajando con `_legacy-halo/`

Es solo referencia. **No modificar** los archivos de Halo. Si necesitas portar una feature al tema nuevo:

1. Lee el archivo de Halo (`_legacy-halo/sections/foo.liquid`).
2. Escribe la versión nueva en la raíz (`sections/foo.liquid`) usando las convenciones actuales (tokens, CSS scoped, semántica, i18n).
3. NO copies el archivo tal cual — el nuevo es reescritura, no copia.

Si accidentalmente modificas algo en `_legacy-halo/`, revierte con `git checkout _legacy-halo/<archivo>`.

## Documentación de proyecto

- `docs/superpowers/specs/` — specs de diseño por fase (Fase 1 en curso).
- `docs/superpowers/plans/` — plans de implementación por fase.
- Cada fase = un spec + un plan + N commits + testing.

## Contacto

nqlnstore@gmail.com
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): actualiza CLAUDE.md para reflejar estructura dual del tema

Reescribe la seccion "Que es esto" y "Arquitectura" para explicar la
nueva estructura dual (tema nuevo en raiz + Halo en _legacy-halo/).
Preserva el "Puntero al Cerebro" del archivo anterior.

Documenta las convenciones del tema nuevo:
- Tokens via config/settings_schema.json + global-tokens.liquid + base.css
- Layout theme.liquid corto, sin CSS/JS inline gigante
- CSS scoped por seccion, JS por Web Components nativos
- Espanol first, image_url no img_url, WCAG 2.1 AA
- Prohibido {% ... %} literal en comentarios CSS de {% style %}
- Tema publicado NO se toca hasta Fase 8

Anade seccion "Trabajando con _legacy-halo/" que aclara que es solo
referencia y no se modifica (reescritura al portar, no copia).

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 13

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Deploy inicial + validación técnica

**Files:**
- No modifica archivos. Ejecuta comandos de validación y deploy.

**Interfaces:**
- Consumes: todo el tema construido en tasks 2-13.
- Produces: tema desplegado como "sin publicar" en Shopify, con métricas de calidad documentadas.

- [ ] **Step 1: Correr `shopify theme check` en el proyecto completo**

Run:
```bash
shopify theme check
```
Expected: sin errores de severidad `error`. Warnings de `suggestion` o `style` aceptables — si son más de 5, anotar los archivos afectados para deuda técnica.

Guarda la salida en un archivo temporal para referencia:
```bash
shopify theme check > /tmp/nqln-theme-check-fase1.txt 2>&1
cat /tmp/nqln-theme-check-fase1.txt | tail -20
```

- [ ] **Step 2: Push del tema como "sin publicar"**

Run:
```bash
shopify theme push --unpublished --store nqlnstore.myshopify.com --json > /tmp/nqln-theme-push-result.json 2>&1
cat /tmp/nqln-theme-push-result.json
```

Expected: JSON con `theme.id`, `theme.name` ("NQLN Theme" o similar), `theme.role` = `"unpublished"`. Anotar el `theme.id` para uso futuro.

Si el CLI no soporta `--json`:
```bash
shopify theme push --unpublished --store nqlnstore.myshopify.com
```
Y anotar manualmente el theme ID que aparece en la salida.

- [ ] **Step 3: Verificar en Shopify Admin**

Manual:
1. Abrir https://nqlnstore.myshopify.com/admin/themes
2. Confirmar que el tema aparece en "Sin publicar" con nombre "NQLN Theme"
3. Click en "Ver" o "Preview" del tema → debe abrir un preview URL de `*.shopifypreview.com`

- [ ] **Step 4: Verificar que el preview URL carga sin errores JS/Liquid**

Manual:
1. Abrir el preview URL en el navegador
2. Abrir DevTools → Console
3. Verificar que no hay errores en rojo (warnings de recursos 404 son aceptables si son de apps de Halo no configuradas en el tema nuevo)

Expected: la home renderiza con el default del skeleton (probablemente texto placeholder tipo "Welcome to your new theme" o similar). Sin errores JS críticos.

- [ ] **Step 5: Correr Lighthouse en el preview URL**

Manual:
1. Con el preview URL abierto, DevTools → Lighthouse tab
2. Categorías: Performance, Accessibility, Best Practices, SEO
3. Modo: Mobile
4. Ejecutar y anotar scores

Expected (mínimos según spec):
- Performance ≥ 85
- Accessibility ≥ 90
- Best Practices ≥ 90
- SEO ≥ 90

Si algún score no alcanza el mínimo, documentar el problema y decidir si se resuelve ahora o se anota como deuda técnica para Fase 2.

- [ ] **Step 6: Validar JSON-LD con Google Rich Results Test**

Manual:
1. Ir a https://search.google.com/test/rich-results
2. Pegar el preview URL de un producto (ej. `https://<preview-url>/products/<algun-handle>`)
3. Correr el test

Expected: detecta al menos `Organization` como structured data válido. En páginas de producto adicionalmente `Product` y `BreadcrumbList`. Sin errores críticos.

- [ ] **Step 7: Documentar resultados del deploy**

Create `docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-deploy-report.md` con este contenido:

```markdown
# NQLN Theme Fase 1 — Deploy Report

**Fecha**: [YYYY-MM-DD del deploy]
**Ejecutado por**: [nombre / agente]
**Commit**: [git rev-parse HEAD del momento del push]

## Deploy

- **Theme ID**: [id anotado en Step 2]
- **Theme name**: NQLN Theme
- **Role**: unpublished
- **Preview URL**: [URL de *.shopifypreview.com]

## Theme Check

Errores: [N]
Warnings suggestion: [N]
Warnings style: [N]

Deuda técnica anotada (si aplica):
- [archivo]: [issue]

## Lighthouse (mobile)

- Performance: [score]
- Accessibility: [score]
- Best Practices: [score]
- SEO: [score]

## Rich Results Test

- Organization: [pass/fail]
- Product (en URL de producto): [pass/fail]
- BreadcrumbList (en URL de producto): [pass/fail]

## Observaciones

[cualquier warning o issue no bloqueante]
```

- [ ] **Step 8: Commit del deploy report**

```bash
git add docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-deploy-report.md
git commit -m "$(cat <<'EOF'
docs: deploy report de Fase 1 (theme id, lighthouse, jsonld)

Registra el resultado del primer push del tema nuevo a Shopify como
'sin publicar':
- Theme ID asignado por Shopify
- Preview URL para compartir
- Scores de theme check, Lighthouse (mobile) y Rich Results Test
- Deuda tecnica anotada (si aplica)

Sirve de baseline para comparar contra las fases siguientes y detectar
regresiones de performance/accesibilidad/SEO.

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 14

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Task 15: Verificación del contrato de éxito completo

**Files:**
- No modifica archivos. Verifica que todo el spec de Fase 1 esté satisfecho.

**Interfaces:**
- Consumes: todo el trabajo de tasks 1-14 + el deploy report.
- Produces: confirmación de que Fase 1 está terminada y lista para Fase 2, o lista de gaps a resolver antes.

- [ ] **Step 1: Verificar checklist 7.1 (Estructura del repo)**

- [ ] `_legacy-halo/` contiene las 7 carpetas de Halo → `ls _legacy-halo/`
- [ ] Raíz contiene skeleton limpio con las 7 carpetas Shopify + `docs/` → `ls .`
- [ ] `.shopifyignore` existe en raíz con las entradas correctas → `cat .shopifyignore`
- [ ] `CLAUDE.md` actualizado → `head -5 CLAUDE.md` incluye la sección "Puntero al Cerebro" y menciona la estructura dual
- [ ] `README.md` existe en raíz y explica el workflow → `head -5 README.md`

- [ ] **Step 2: Verificar checklist 7.2 (Skeleton funcional en Shopify)**

- [ ] `shopify theme list --store nqlnstore.myshopify.com` incluye "NQLN Theme" como "unpublished"
- [ ] Preview URL abre sin errores (verificado manualmente en Task 14 Step 4)
- [ ] Home renderiza contenido del skeleton (verificado en Task 14 Step 4)

- [ ] **Step 3: Verificar checklist 7.3 (Base mínima customizada)**

- [ ] `layout/theme.liquid` es la versión custom de ~150 líneas → `wc -l layout/theme.liquid` debe ser entre 100 y 200
- [ ] `snippets/global-tokens.liquid` emite CSS vars → verificar en preview URL, view-source, buscar `--color-brand-primary`
- [ ] `snippets/meta-tags.liquid` presente → `ls snippets/meta-tags.liquid`
- [ ] `snippets/schema-jsonld.liquid` presente → `ls snippets/schema-jsonld.liquid`
- [ ] `assets/base.css` presente con reset + utilidades → `head -20 assets/base.css`
- [ ] `config/settings_schema.json` con tokens placeholder → validar JSON + verificar que tiene grupos "Colores", "Tipografía", "Espaciado y bordes", "Branding"
- [ ] `locales/es.default.json` en español con `accessibility.skip_to_text` → `grep skip_to_text locales/es.default.json`

- [ ] **Step 4: Verificar checklist 7.4 (Validación técnica)**

- [ ] `shopify theme check` sin errores de severidad `error` (verificado en Task 14 Step 1)
- [ ] Lighthouse scores mínimos alcanzados (verificado en Task 14 Step 5)
- [ ] Sin errores críticos en consola del navegador
- [ ] JSON-LD válido según Rich Results Test (verificado en Task 14 Step 6)

- [ ] **Step 5: Verificar checklist 7.5 (Documentación)**

- [ ] Spec de Fase 1 commiteado → `ls docs/superpowers/specs/2026-08-11-nqln-theme-fase-1-setup-design.md`
- [ ] Plan de Fase 1 commiteado → `ls docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md`
- [ ] Deploy report commiteado → `ls docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-deploy-report.md`
- [ ] `README.md` explica workflow completo

- [ ] **Step 6: Verificar checklist 7.6 (Rollback plan)**

Verificar (mental / lectura del CLAUDE.md, no ejecutar):
- Revertir commits del setup restauraría el estado anterior (git tracked)
- El tema publicado en Shopify (Halo) NO se tocó en toda la Fase 1
- No hay migración de datos ni settings del merchant

- [ ] **Step 7: Marcar Fase 1 como completa**

Si todos los checkbox de Steps 1-6 están marcados, la Fase 1 está terminada. 

Si algún checkbox NO está marcado, documentar el gap:

```bash
# Ejemplo si Lighthouse Performance quedó en 78 en vez de 85:
git commit --allow-empty -m "$(cat <<'EOF'
docs: Fase 1 completada con deuda tecnica

Fase 1 (Setup + base) del tema NQLN completada. Contrato de exito
verificado — todos los items PASS excepto:

- Lighthouse Performance mobile: 78 (esperado >=85)
  Causa probable: JS del skeleton default carga sync. Se resuelve en
  Fase 2 al reemplazar por web components con carga defer.

Gaps documentados y priorizados para Fase 2. Fase 1 se cierra.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Si todo pasa OK:

```bash
git commit --allow-empty -m "$(cat <<'EOF'
docs: Fase 1 completada, contrato de exito verificado

Fase 1 (Setup + base) del tema NQLN completada exitosamente. Todos los
items del contrato de exito (docs/superpowers/specs/2026-08-11-
nqln-theme-fase-1-setup-design.md seccion 7) verificados y aprobados.

Estado:
- Repo dual OK (Halo en _legacy-halo/, skeleton nuevo en raiz)
- .shopifyignore excluye Halo del CLI
- Tema desplegado en Shopify como 'sin publicar'
- theme check pasa sin errores
- Lighthouse mobile >= todos los minimos
- JSON-LD valido en Rich Results Test
- Docs completas (spec + plan + deploy report + README + CLAUDE.md)

Listo para Fase 2 (Header + Footer).

Ref: docs/superpowers/plans/2026-08-11-nqln-theme-fase-1-setup.md Task 15

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push origin main
```

**Fase 1 terminada.** El próximo paso es escribir el spec + plan de Fase 2 (Header + Footer) — un ciclo brainstorming → writing-plans nuevo para esa fase.
