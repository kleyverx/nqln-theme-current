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

Estructura estándar Shopify Online Store 2.0 (`assets/ blocks/ config/ layout/ locales/ sections/ snippets/ templates/`). El skeleton oficial es la base — solo customizamos lo que no sirve del default.

### Design tokens (Fase 1)

Todo el sistema visual se declara en:
- `config/settings_schema.json` — settings editables desde el theme editor (colores, tipografía, espaciado, radios).
- `snippets/global-tokens.liquid` — emite esos settings como CSS custom properties en `:root` y carga las `@font-face` de las fuentes elegidas.
- `assets/base.css` — reset + tipografía base + utilidades globales, todo usando `var(--*)`.

Cambiar cualquier token en el theme editor actualiza el tema entero sin tocar código. **Regla clave: nunca hardcodear colores/espacios en CSS, siempre `var(--color-*)` y `var(--space-*)`.**

### Layout raíz

`layout/theme.liquid` es corto (~50 líneas), limpio, sin CSS/JS inline gigante. Sin monkey-patches de fetch/XHR/halo.* como los que tenía Halo. Sin scripts de terceros inline (Brevo, Lottie) — se cargan solo donde se usen.

Renders obligatorios en el head: `meta-tags` (Open Graph/Twitter), `schema-jsonld` (SEO estructurado), `global-tokens` (CSS vars).

### Sections y snippets

Cada `.liquid` de section/snippet trae su CSS en `{% stylesheet %}` (scoped, no hereda ni fugas). Solo `assets/base.css` es global. Los snippets deben llevar `{% doc %}` como header cuando aplique.

### JS

Web Components nativos (`class Foo extends HTMLElement { ... }`), sin jQuery, sin monkey-patches globales, sin `halo.*`. Cada componente interactivo su propio archivo `assets/<componente>.js` cargado por la section que lo usa.

## Convenciones

- **Español primero**. Todo texto UI va por `{{ 'key' | t }}` con entradas en `locales/es.default.json`. `en.json` es fallback secundario. Para el theme editor, keys `t:*` van en `locales/es.default.schema.json`.
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

- `docs/superpowers/specs/` — specs de diseño por fase (Fase 1 lista).
- `docs/superpowers/plans/` — plans de implementación por fase.
- Cada fase = un spec + un plan + N commits + testing.

## Contacto

nqlnstore@gmail.com
