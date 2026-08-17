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
├── assets/                 # tema nuevo
├── blocks/
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
| 1 | Setup + base (repo dual, layout, tokens, meta, SEO, i18n) | en curso |
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
