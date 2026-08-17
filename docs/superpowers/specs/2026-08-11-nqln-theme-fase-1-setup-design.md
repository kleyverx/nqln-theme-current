# NQLN Theme — Fase 1: Setup + Base

> **Para agentic workers:** SUB-SKILL requerida: usa `superpowers:executing-plans` o `superpowers:subagent-driven-development` cuando se cree el implementation plan (siguiente paso tras aprobación de este spec).

**Meta:** iniciar la construcción de un tema Shopify totalmente propio para nqlnstore.com desde el Shopify Skeleton Theme oficial, conservando el tema Halo/Ella actual en el mismo repo como referencia congelada. Fase 1 entrega solo el **setup + base**: layout limpio, snippets de tokens/meta/SEO, y CSS base. Sin diseño visual finalizado, sin templates de página, sin apps integradas — todo eso vive en fases posteriores.

**Producto:** repo dual (Halo legacy + tema nuevo) con el skeleton customizado a nivel base, funcionando en Shopify como "tema sin publicar" con preview URL. El tema publicado en la tienda **sigue siendo Halo** durante toda la Fase 1 (y hasta que el usuario decida publicar el nuevo en la Fase 8).

**Stack:** Shopify Liquid, Online Store 2.0, JSON templates, Web Components nativos, CSS custom properties, sin framework JS. Español como idioma principal (`es.default.json`). Deploy con Shopify CLI (`shopify theme push --unpublished`).

**Fuera de alcance de este spec:** diseño visual final, header y footer visibles, cualquier template (home, colecciones, producto, carrito, cuenta), integración de apps de terceros, migración de contenido de Halo, definición final de tokens de color/tipografía. Cada uno de esos temas es una fase separada con su propio spec.

---

## Precondiciones (verificar antes de arrancar)

- **Shopify CLI 3.x** instalado en la máquina de desarrollo (`shopify version` debe imprimir ≥3.0.0)
- **Autenticado con la store**: `shopify login --store nqlnstore.myshopify.com` (o usar `shopify theme dev --store=nqlnstore.myshopify.com` la primera vez)
- **Permisos en la store**: la cuenta autenticada debe tener rol Owner o Staff con permisos "Themes" para poder subir temas nuevos
- **Repo local en clean state**: `git status` sin cambios sin commitear al empezar el setup (para que el commit grande del `git mv` sea limpio)
- **Backup del tema publicado (opcional pero recomendado)**: en Shopify Admin → Temas → menú (⋯) del tema publicado (Halo) → "Descargar archivo del tema" — genera un ZIP que sirve como respaldo por si acaso

## Contexto y motivación

El tema actual (Halo/Ella v6.5.0) es un fork de un tema vendor con años de customización directa in-situ: ~2000 archivos, ~1000 líneas de CSS/JS inline en `layout/theme.liquid`, múltiples versiones de header (`header-mobile`, `header-single-line`, `header-vertical-menu`, etc.), y monkey-patches globales de `fetch`/`XHR` que rompieron el carrito en /cart en el pasado.

Recientes proyectos custom (VAULI landing con 11 secciones + HydroLoko con 4 secciones + block Benefits en sidebar) han requerido **CSS blindado sistemático con `!important` y máxima especificidad** para ganar contra reglas globales del tema padre — un patrón de trabajo insostenible a largo plazo. Ver `docs/superpowers/specs/2026-08-05-vauli-landing-sections-design.md` como referencia del volumen de blindaje necesario.

**Decisión del usuario en esta conversación:** revertir la memoria previa `NQLN Platform scope: NO tocar Halo en Fase 1` y arrancar un tema propio desde cero, en paralelo, hasta reemplazar Halo completamente.

**Punto de partida elegido:** Shopify Skeleton Theme (https://github.com/Shopify/skeleton-theme) — versión ultra-mínima del Dawn oficial. ~50 archivos, sin estilos ni componentes finales, solo estructura Online Store 2.0 con los hooks obligatorios (`content_for_header`, `content_for_layout`, `settings_schema.json` mínimo, translations en inglés). Base probada por Shopify, garantiza compatibilidad con checkout y features nativas.

---

## Convenciones del proyecto

Aplicables a Fase 1 y a todas las fases siguientes del tema nuevo:

1. **Español primero.** Todo el texto UI usa `{{ 'key' | t }}` con entradas en `locales/es.default.json`. `en.json` es fallback secundario.
2. **Design tokens via CSS variables.** Nunca hardcodear `#ffcd11` ni `16px` en CSS. Siempre `var(--color-brand-primary)` y `var(--space-md)`. Los tokens vienen de `config/settings_schema.json` (editables por el merchant) y se emiten en `snippets/global-tokens.liquid`.
3. **CSS scoped por sección/snippet.** Cada `.liquid` de section/snippet trae su CSS en `{% stylesheet %}`. Solo `assets/base.css` es global. Cero CSS inline en `theme.liquid` más allá del `{% render 'global-tokens' %}`.
4. **JS por Web Components nativos.** Nada de jQuery. Nada de monkey-patches globales de `fetch`/`XHR`. Cada componente interactivo es un `<custom-element>` con su class extendiendo `HTMLElement`, definido en `assets/<component>.js` y cargado por la section que lo usa.
5. **Sin `img_url` ni filtros deprecados.** Solo `image_url` + `image_tag`.
6. **HTML semántico.** `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<button>`, `<details>/<summary>`. Con `aria-label`, `role`, `aria-expanded` donde corresponda. Skip link a `#MainContent` obligatorio.
7. **WCAG 2.1 AA.** Contraste ≥4.5:1 para texto, ≥3:1 para UI. Focus visible en todos los interactivos. Respeta `prefers-reduced-motion`.
8. **Sin tags Liquid literales dentro de comentarios CSS del bloque `{% style %}`** (Shopify los parsea y rompe el archivo — bug ya visto en fase legacy).
9. **`request.design_mode`** para placeholders visuales cuando settings/blocks están vacíos, para que el merchant vea qué configurar.

---

## Sección 1 — Estructura del repo

### Antes (hoy)

```
c:\Users\Kley Marg\Desktop\nqln-theme-current\
├── assets/           (~237 archivos Halo)
├── config/           (settings_schema.json Halo, settings_data.json)
├── layout/           (theme.liquid Halo ~1000 líneas)
├── locales/          (~15 idiomas)
├── sections/         (~127 archivos Halo + custom recientes)
├── snippets/         (~370 archivos Halo + custom)
├── templates/        (JSON templates Halo + custom VAULI/HydroLoko)
├── docs/
│   └── superpowers/
│       └── specs/    (specs previos incluyendo VAULI, HydroLoko, NQLN Platform)
├── .gitignore
├── CLAUDE.md
└── (otros archivos raíz)
```

### Después de Fase 1

```
c:\Users\Kley Marg\Desktop\nqln-theme-current\
├── _legacy-halo/                    ← 🆕 todo Halo movido acá, congelado
│   ├── assets/
│   ├── config/
│   ├── layout/
│   ├── locales/
│   ├── sections/
│   ├── snippets/
│   └── templates/
├── assets/                          ← 🆕 tema nuevo desde skeleton
│   └── base.css                     ← reset + tipografía base + utilidades
├── config/
│   ├── settings_schema.json         ← settings del tema nuevo (tokens placeholder)
│   └── settings_data.json           ← empty inicial
├── layout/
│   └── theme.liquid                 ← ~150 líneas, sin CSS/JS inline gigante
├── locales/
│   ├── es.default.json              ← español como default
│   └── en.json                      ← fallback
├── sections/                        ← vacío en Fase 1 (se llena en Fase 2+)
├── snippets/
│   ├── global-tokens.liquid         ← 🆕 emite CSS vars desde settings.*
│   ├── meta-tags.liquid             ← 🆕 Open Graph + Twitter cards
│   └── schema-jsonld.liquid         ← 🆕 Product, Breadcrumb, Organization JSON-LD
├── templates/                       ← lo mínimo del skeleton (index.json, product.json, etc.)
├── docs/
│   └── superpowers/
│       └── specs/                   ← se preserva completo
├── .shopifyignore                   ← 🆕 excluye _legacy-halo/ del CLI push
├── .gitignore                       ← preservado, sin cambios
├── CLAUDE.md                        ← actualizado: explica repo dual
└── README.md                        ← 🆕 explica cómo trabajar con el repo dual
```

### Detalles de setup

1. **Mover Halo a `_legacy-halo/`**: `git mv assets _legacy-halo/assets`, y así con `config`, `layout`, `locales`, `sections`, `snippets`, `templates`. Un solo commit descriptivo: `chore: mueve Halo actual a _legacy-halo/ (congelado) para dar paso al tema nuevo`.
2. **Clonar Skeleton Theme**: `git clone https://github.com/Shopify/skeleton-theme.git /tmp/skeleton` (o en carpeta temporal fuera del repo), luego copiar su contenido a la raíz del repo (`cp -r /tmp/skeleton/{assets,config,layout,locales,sections,snippets,templates,.gitignore.shopify} .`). NO copiar su `.git/`.
3. **`.shopifyignore`**: archivo nuevo en la raíz con contenido:
   ```
   # Congelado: Halo legacy. No subir a Shopify.
   _legacy-halo/
   
   # Docs y specs no van al tema
   docs/
   
   # Screenshots temporales
   vauli-template.png
   .playwright-mcp/
   ```
4. **Verificar**: `shopify theme check` debe pasar sin errores en la raíz. `_legacy-halo/` no debe generar warnings porque el CLI lo respeta vía `.shopifyignore`.

### Riesgos y mitigación

- **Riesgo:** el commit del `git mv` es enorme (~2000 archivos) — puede ser difícil revisar en GitHub. **Mitigación:** git detecta renames automáticamente si el contenido no cambió, así que aparecerá como `renamed:` en la mayoría de casos (mucho más ligero visualmente).
- **Riesgo:** olvidar mover algún archivo raíz de Halo (ej. `vauli-template.png` — ya en .gitignore) que rompa el tema activo. **Mitigación:** el tema activo en Shopify (Halo publicado) NO se afecta por esto — Shopify tiene su propia copia del tema en su CDN. Este mv es solo en el repo local; hasta que hagamos `shopify theme push`, nada llega a Shopify.

---

## Sección 2 — Design Tokens (placeholder en Fase 1, refinados en Fase 3)

Los tokens finales se definen en la **Fase 3** cuando el usuario pase mockups. En Fase 1 se declaran valores placeholder mínimos derivados de la paleta METRIKASA/NQLN ya establecida en el trabajo custom actual (VAULI/HydroLoko), para que el skeleton se pueda cargar y probar.

### Placeholder inicial

En `config/settings_schema.json`, grupo "Colores" con settings tipo `color`:

| Setting ID | Label | Default |
|---|---|---|
| `color_brand_primary` | Color primario | `#ffcd11` (amarillo Metrikasa) |
| `color_brand_secondary` | Color secundario | `#20b19e` (verde éxito) |
| `color_brand_danger` | Color de error | `#c33a3a` (rojo) |
| `color_text` | Color texto principal | `#1a1a1a` (negro) |
| `color_text_muted` | Color texto secundario | `#666666` (gris) |
| `color_bg` | Color fondo principal | `#ffffff` (blanco) |
| `color_bg_soft` | Color fondo alterno | `#f6f5f1` (hueso) |
| `color_border` | Color borde | `#e5e5e5` (gris claro) |

Grupo "Tipografía":

| Setting ID | Label | Default |
|---|---|---|
| `font_heading` | Fuente títulos | `font_picker` — Helvetica bold |
| `font_body` | Fuente texto | `font_picker` — Helvetica |
| `size_h1_desktop` | Tamaño H1 desktop | `range` 20-60px default 32 |
| `size_h1_mobile` | Tamaño H1 mobile | `range` 18-40px default 24 |
| `size_body` | Tamaño texto cuerpo | `range` 12-20px default 16 |

Grupo "Espaciado":

| Setting ID | Label | Default |
|---|---|---|
| `space_scale` | Escala base | `range` 2-6px default 4 (los demás son múltiplos) |
| `radius_sm` | Radio pequeño | `range` 0-8px default 4 |
| `radius_md` | Radio medio | `range` 0-16px default 8 |
| `radius_lg` | Radio grande | `range` 0-24px default 16 |

### Emisión en `snippets/global-tokens.liquid`

```liquid
{%- comment -%}
  Emite todos los design tokens del tema como CSS custom properties
  en :root, leyendo desde settings.*. Se incluye en layout/theme.liquid
  dentro del <head>. Cuando el merchant cambia un setting en el editor,
  esta variable se re-renderiza y el tema entero se actualiza.
{%- endcomment -%}
<style>
  :root {
    /* Colores */
    --color-brand-primary: {{ settings.color_brand_primary | default: '#ffcd11' }};
    --color-brand-secondary: {{ settings.color_brand_secondary | default: '#20b19e' }};
    --color-brand-danger: {{ settings.color_brand_danger | default: '#c33a3a' }};
    --color-text: {{ settings.color_text | default: '#1a1a1a' }};
    --color-text-muted: {{ settings.color_text_muted | default: '#666666' }};
    --color-bg: {{ settings.color_bg | default: '#ffffff' }};
    --color-bg-soft: {{ settings.color_bg_soft | default: '#f6f5f1' }};
    --color-border: {{ settings.color_border | default: '#e5e5e5' }};

    /* Tipografía */
    --font-heading: {{ settings.font_heading.family }}, {{ settings.font_heading.fallback_families }};
    --font-body: {{ settings.font_body.family }}, {{ settings.font_body.fallback_families }};
    --font-size-h1: {{ settings.size_h1_desktop | default: 32 }}px;
    --font-size-h1-mobile: {{ settings.size_h1_mobile | default: 24 }}px;
    --font-size-body: {{ settings.size_body | default: 16 }}px;
    --font-weight-body: 400;
    --font-weight-strong: 600;
    --font-weight-heading: 800;

    /* Espaciado (escala 4px) */
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

    /* Sombras (fijas por ahora, editables en Fase 3 si hace falta) */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
</style>
```

### Refinamiento en Fase 3

Cuando lleguen los mockups en Fase 3:
- Ajustar los defaults exactos según diseño
- Posiblemente añadir tokens nuevos (colores de estado hover, gradients, etc.)
- Ajustar escalas de tipografía y espaciado
- Documentar componentes base (Button, Input, Card, Badge, Modal) como snippets reusables

---

## Sección 3 — `layout/theme.liquid`

Archivo principal que envuelve todas las páginas. Objetivo: **corto, limpio, ~150 líneas**, sin CSS/JS inline gigante ni monkey-patches.

### Estructura

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

### Snippets referenciados (todos nuevos en Fase 1)

**`snippets/global-tokens.liquid`** — Sección 2. Emite CSS custom properties.

**`snippets/meta-tags.liquid`** — Open Graph + Twitter cards para compartir en redes:
```liquid
<meta property="og:type" content="{% if request.page_type == 'product' %}product{% else %}website{% endif %}">
<meta property="og:title" content="{{ page_title | escape }}">
<meta property="og:description" content="{{ page_description | default: shop.description | escape }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:site_name" content="{{ shop.name | escape }}">
{%- if request.page_type == 'product' and product.featured_image -%}
  <meta property="og:image" content="{{ product.featured_image | image_url: width: 1200 }}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="{{ 1200 | divided_by: product.featured_image.aspect_ratio | at_most: 1200 }}">
{%- elsif settings.social_share_image -%}
  <meta property="og:image" content="{{ settings.social_share_image | image_url: width: 1200 }}">
{%- endif -%}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page_title | escape }}">
<meta name="twitter:description" content="{{ page_description | default: shop.description | escape }}">
```

**`snippets/schema-jsonld.liquid`** — Structured data para SEO. Emite `Organization` siempre, `Product` en templates product, `BreadcrumbList` en templates product/collection. (Detalle exacto de esquemas en la implementación).

**`header-group` y `footer-group`** — section groups vacíos en Fase 1 (se llenan en Fase 2 con `sections/header.liquid` y `sections/footer.liquid`). Un section group vacío no renderiza nada.

### Lo que se elimina explícitamente vs Halo

- ❌ Bloques `<style>` inline con 500+ líneas de CSS
- ❌ Scripts inline de terceros (Brevo, Lottie) — se cargan solo donde se usen
- ❌ Canvas `letter-glitch` de fondo
- ❌ JS de traducir strings en runtime (usamos `locales/es.default.json` desde el principio)
- ❌ Monkey-patches globales de `window.fetch`, `XMLHttpRequest.prototype.open/send`, `halo.redirectTo`
- ❌ CSS de "z-index fixes" (evitamos crear el problema desde el diseño)
- ❌ Múltiples bloques `<style>` para variant picker, share button, product form etc. — cada componente resuelve su propio CSS en su sección

---

## Sección 4 — Header (spec de referencia, se implementa en Fase 2)

Documento la decisión de arquitectura del header en este spec para que Fase 2 tenga contexto, aunque el código sea de Fase 2.

### Un solo `sections/header.liquid` responsive

```
┌────────────────────────────────────────────────────────────────┐
│  ANNOUNCEMENT BAR (opcional, blocks tipo "mensaje")            │
│  ENVÍO GRATIS +$20 · PAGO CONTRA ENTREGA · GARANTÍA 15 DÍAS   │
├────────────────────────────────────────────────────────────────┤
│  HEADER PRINCIPAL                                              │
│  ┌────┐ ┌───────────┐              ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │Logo│ │Search bar │              │Wl│ │Us│ │Fv│ │Ct│        │
│  └────┘ └───────────┘              └──┘ └──┘ └──┘ └(0)        │
├────────────────────────────────────────────────────────────────┤
│  NAV MENU (desktop; en mobile va en drawer)                    │
│  Catálogo · Ofertas · Marcas · Tiendas físicas · Contacto     │
└────────────────────────────────────────────────────────────────┘
```

- **Desktop (≥990px)**: layout completo horizontal.
- **Mobile (<990px)**: hamburger izq + logo center + cart der. Nav en drawer lateral izquierdo. Search en modal fullscreen.

### Web Components nativos

- `<cart-drawer>` — lateral con contenido de `/cart.js`, actualiza sin recargar.
- `<mobile-menu-drawer>` — menú lateral con nav.
- `<search-modal>` — modal fullscreen con predictive search de Shopify.
- `<header-sticky>` — sticky al scroll, esconde announcement bar al bajar.

Cada uno un `.js` en `assets/`, cargado por el `{% javascript %}` de la sección header.

### Settings del header (definidos en Fase 2)

Announcement bar toggle + blocks de mensajes, logo image_picker con anchos, search toggle, ícono wishlist toggle (depende de si mantenemos Growave — decisión Fase 8), nav linklist selector, sticky toggle, colores desde tokens globales por default.

### Accesibilidad

- Skip link a `#MainContent` (en theme.liquid, ya definido en Sec 3).
- `<nav aria-label="Menú principal">`.
- Drawers con focus trap + ESC cierra + click backdrop cierra.
- `aria-expanded` en los botones que abren drawer/modal.

---

## Sección 5 — Footer (spec de referencia, se implementa en Fase 2)

Un solo `sections/footer.liquid` con blocks configurables.

```
┌────────────────────────────────────────────────────────────────┐
│  FOOTER (dark bg default)                                      │
│  ┌──────────┬─────────┬─────────┬─────────┬───────────────┐  │
│  │ Brand    │ Catálogo│ Ayuda   │ Empresa │ Newsletter    │  │
│  │ Logo     │ Nuevos  │ Envíos  │ Sobre   │ [email input] │  │
│  │ Social   │ Ofertas │ Devolut │ Tiendas │ [Suscribirse] │  │
│  │          │ Marcas  │ Pagos   │ Contacto│               │  │
│  └──────────┴─────────┴─────────┴─────────┴───────────────┘  │
├────────────────────────────────────────────────────────────────┤
│  BOTTOM BAR                                                    │
│  © 2026 NQLN Store · Términos · Privacidad     [pago icons]   │
└────────────────────────────────────────────────────────────────┘
```

### Blocks disponibles

- `brand` — logo + tagline + iconos redes sociales (settings IG/FB/TT/WA/YT)
- `links` — título + Shopify linklist selector (reusable para "Catálogo", "Ayuda", etc.)
- `newsletter` — título + input email + botón (form `action="{{ routes.customer_newsletter_url }}"`, provider-agnostic)
- `text` — bloque libre + imagen opcional
- `payment_icons` — auto-detecta métodos de pago habilitados en Shopify (`shop.enabled_payment_types`)

### Bottom bar (fijo, no block)

Copyright dinámico + 3 links legales (settings de URL) + payment icons opcional.

### Settings

- `color_footer_bg` (default `#1a1a1a`), `color_footer_text` (default `#f6f5f1`), `color_footer_accent` (default `--color-brand-primary`)
- `max_blocks: 6`
- `show_bottom_bar` toggle
- `legal_terms_url`, `legal_privacy_url`, `legal_cookies_url`

---

## Sección 6 — Decomposición del proyecto completo

Este spec cubre solo **Fase 1**. Las fases 2-8 se especifican cada una con su propio spec cuando la fase anterior termine y se valide.

| # | Fase | Contenido | Estimado |
|---|---|---|---|
| **1** | **Setup + base** ← este spec | Fork skeleton, mover Halo a `_legacy-halo/`, `.shopifyignore`, `theme.liquid`, `global-tokens`, `meta-tags`, `schema-jsonld`, `base.css`. Tokens placeholder. | 1-2 días |
| **2** | **Header + Footer** | Section groups `header-group` y `footer-group`. Sections `header.liquid` y `footer.liquid` con blocks. Announcement bar. Web components de cart-drawer, mobile-menu-drawer, search-modal, header-sticky. Mobile toolbar sticky. | 3-5 días |
| **3** | **Design system + tokens finales** | Con los primeros mockups del usuario, refinar tokens (colores exactos, tipografía definitiva, escalas). Componentes base (Button, Input, Card, Badge, Modal, Chip) como snippets reusables con demo docs. | 2-3 días |
| **4** | **Home** | Sections: hero, product-grid, testimonials, categorias-grid, brand-marquee, video-showcase, cta-banner, newsletter. Template `templates/index.json`. | 5-7 días |
| **5** | **Colecciones + búsqueda** | Template `templates/collection.json` con hero, grid, filtros (facetas), sort, paginación. Template `templates/search.json` con predictive search. | 5-7 días |
| **6** | **Producto** | Template `templates/product.json` con hero (galería + info + variantes + qty + CTA). Migrar/reimplementar las 11 secciones custom actuales (`product-story-split`, `product-benefits-simple`, `product-usage-split`, `product-vs-columns`, `product-feature-cards`, `product-kit-contents`, `product-uses-chips`, `product-testimonials`, `product-faq-simple`, `product-cta-final`, `product-comparison-table`, `product-photo-grid`) al nuevo sistema de tokens. Migrar templates de VAULI y HydroLoko. | 7-10 días |
| **7** | **Carrito + Cuenta** | `templates/cart.json`, `templates/customers/*.json` (login, register, account, orders, addresses). Cart drawer con recomendaciones. | 5-7 días |
| **8** | **Integración de apps + go-live** | Reintegrar Growave/BON Loyalty, AliReviews, Pandectes GDPR, Gameball, Brevo, MageNative (o reemplazar por alternativas nativas caso por caso). Migrar settings de Halo si es posible. Testing E2E. Go-live y monitoring. | 5-10 días |

**Total estimado: 30-50 días de trabajo continuo (~6-10 semanas).**

### Reglas de convivencia entre Halo y tema nuevo

Durante todas las fases 1-7:
- **Halo sigue publicado y sirviendo tráfico real** en nqlnstore.com.
- El tema nuevo se sube como "sin publicar" con `shopify theme push --unpublished` y se accede vía preview URL de Shopify (`*.shopifypreview.com`).
- `shopify theme dev` permite preview local con hot reload (`localhost:9292`).

Solo en **Fase 8** publicamos el tema nuevo. Shopify guarda el Halo publicado anterior como respaldo (podemos rollback en 1 click desde el admin).

---

## Sección 7 — Contrato de éxito de Fase 1

La Fase 1 se considera terminada cuando **todos** los siguientes están OK:

### 7.1 Estructura del repo

- [ ] `_legacy-halo/` contiene todos los archivos de Halo (verificable con `ls _legacy-halo/` — debe listar `assets/ config/ layout/ locales/ sections/ snippets/ templates/`)
- [ ] Raíz del repo contiene el skeleton limpio con las mismas 7 carpetas Shopify + `docs/`
- [ ] `.shopifyignore` existe en raíz con `_legacy-halo/`, `docs/`, `vauli-template.png`, `.playwright-mcp/`
- [ ] `CLAUDE.md` actualizado explicando la estructura dual del repo
- [ ] `README.md` nuevo explica cómo trabajar (`shopify theme dev`, `shopify theme push --unpublished`, dónde vive Halo, dónde vive el nuevo)

### 7.2 Skeleton funcional en Shopify

- [ ] `shopify theme push --unpublished` sube el tema como "en desarrollo"
- [ ] El tema aparece en Shopify Admin → Tienda online → Temas → "Sin publicar" con nombre "NQLN Theme"
- [ ] El preview URL de Shopify abre sin errores JS/Liquid en la consola del navegador
- [ ] La home renderiza el default del skeleton (sin diseño finalizado, esperado en Fase 1)
- [ ] Templates básicos (product, collection, cart) del skeleton cargan sin error

### 7.3 Base mínima customizada

- [ ] `layout/theme.liquid` reescrito según Sección 3 (~150 líneas, sin CSS/JS inline gigante)
- [ ] `snippets/global-tokens.liquid` emite CSS variables desde `settings.*` (verificable inspeccionando `<style>` en `<head>` del preview URL)
- [ ] `snippets/meta-tags.liquid` presente y renderiza Open Graph correcto
- [ ] `snippets/schema-jsonld.liquid` presente y renderiza JSON-LD válido (verificable con Google Rich Results Test)
- [ ] `assets/base.css` con reset + tipografía base + utilidades globales mínimas
- [ ] `config/settings_schema.json` tiene los settings de tokens placeholder (colores, fuentes, spacing, radius de Sección 2)
- [ ] `locales/es.default.json` en español con al menos `accessibility.skip_to_text` y traducciones mínimas del skeleton

### 7.4 Validación técnica

- [ ] `shopify theme check` pasa sin errores de severidad **error** (severidad `suggestion` y `style` aceptables — se anotan como deuda técnica en un issue separado si son >5)
- [ ] Lighthouse en preview URL (mobile):
  - Performance ≥ 85
  - Accessibility ≥ 90
  - Best Practices ≥ 90
  - SEO ≥ 90
- [ ] Sin errores en la consola del navegador al cargar cualquier página del preview
- [ ] HTML del preview valida con W3C Validator (o al menos sin errores críticos)

### 7.5 Documentación

- [ ] Este spec commiteado en `docs/superpowers/specs/2026-08-11-nqln-theme-fase-1-setup-design.md` ← ya listo con este documento
- [ ] Plan de implementación de Fase 1 commiteado en `docs/superpowers/plans/YYYY-MM-DD-nqln-theme-fase-1-setup.md` ← se genera después con writing-plans skill
- [ ] `README.md` de la raíz explica el workflow completo

### 7.6 Rollback plan

Si algo sale mal después del setup:
- Revertir el commit del setup restaura todo el estado anterior (git tracked)
- El tema publicado en Shopify no se toca en Fase 1 (Halo publicado sigue intacto)
- No hay migración de datos ni de settings del merchant — cero riesgo para la tienda en vivo

---

## Qué NO va en Fase 1

Reforzando el fuera de alcance (para prevenir scope creep):

- ❌ Header o footer visibles (Fase 2)
- ❌ Cualquier template además de los defaults del skeleton (Fase 4+)
- ❌ Diseño visual finalizado (Fase 3+)
- ❌ Integración de apps de terceros (Fase 8)
- ❌ Migración de VAULI/HydroLoko (Fase 6)
- ❌ Migración de settings guardados en Halo (Fase 8, si aplica)
- ❌ Publicar el tema nuevo (Fase 8, decisión del usuario)
- ❌ Reescribir componentes VAULI/HydroLoko (se hace en Fase 6 con el nuevo sistema de tokens)

---

## Referencias

- Shopify Skeleton Theme: https://github.com/Shopify/skeleton-theme
- Shopify Dawn (referencia canónica): https://github.com/Shopify/dawn
- Shopify Online Store 2.0 docs: https://shopify.dev/docs/themes
- Shopify Theme Check: https://shopify.dev/docs/themes/tools/theme-check
- Spec previo relacionado (NQLN Platform, decisión de NO tocar Halo — ahora revertida): `docs/superpowers/specs/2026-05-26-nqln-customer-data-design.md`
- Trabajo custom actual (base para portar en Fase 6): specs en `docs/superpowers/specs/2026-07-08-hydroloko-product-sections-design.md` y `docs/superpowers/specs/2026-08-05-vauli-landing-sections-design.md`
