# HydroLoko — 3 secciones destacadas para páginas de producto

> **Para agentic workers:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` para implementar este spec en paralelo (1 agente por sección). El spec fija contrato: nombre de archivo, tokens de diseño, blocks, presets y validación. Cada agente implementa una sección sin invadir la otra.

**Meta:** agregar 3 secciones reutilizables al tema Shopify `nqln-theme-current` para resaltar los puntos fuertes de HydroLoko en la página de producto. Deben poder añadirse al template desde el editor de temas (`section.max_blocks`, `presets`), quedar precargadas con el contenido de HydroLoko, y también servir para otros productos futuros de Metrikasa/NQLN con solo cambiar settings.

**Arquitectura:** 3 secciones independientes (`.liquid` en `sections/`) siguiendo la convención de las secciones METRIKASA existentes (`sections/icon-row-pop.liquid`, `sections/brand-banner.liquid`). Cada sección es autocontenida: `{% style %}` inline para las CSS custom properties dinámicas (colores/paddings desde `section.settings`), `{% stylesheet %}` para el resto del CSS del componente, `{% schema %}` con blocks y preset precargado con contenido HydroLoko.

**Stack:** Shopify Liquid, tema Ella/Halothemes con Online Store 2.0. Sin JS. CSS puro (grid, custom properties, `clamp()`, `prefers-reduced-motion`). Español como idioma principal (labels, presets, contenido).

---

## Convenciones del tema (guía de estilo obligatoria)

Extraídas de `sections/icon-row-pop.liquid` y `sections/brand-banner.liquid` (secciones METRIKASA custom):

- **Paleta base:** amarillo `#ffcd11`, negro `#1a1a1a`, blanco hueso `#f6f5f1`, verde éxito `#20b19e` (visto en badges), rojo error `#e00`.
- **Estructura de archivo:**
  1. `{%- comment -%}` explicando qué es la sección y su GOTCHA (`:empty { display:none }` en el tema).
  2. `{%- style -%}` inline con `--<prefijo>-*` custom properties leyendo `section.settings` con `default:` fallbacks. Incluye `padding_top`/`padding_bottom`.
  3. HTML con `id="<CamelCase>-{{ section.id }}"` en el wrapper, clases BEM (`.block__element--modifier`), `page-width` para el contenedor interior.
  4. Loop `{%- for block in section.blocks -%}` con `{{ block.shopify_attributes }}` en el `<li>` o wrapper del block.
  5. `{% stylesheet %}` con CSS del componente (BEM, custom properties, responsive con `@media (max-width: 989px)` tablet y `@media (max-width: 749px)` mobile).
  6. `{% javascript %}` **NO se usa** (todo CSS puro).
  7. `{% schema %}` con `settings` (paragraph explicativo + color + padding + tipografía), `blocks`, `max_blocks`, `presets` con contenido precargado.
- **Diseño responsive:** desktop 4 columnas → tablet 2 columnas → mobile 2 columnas o 1 columna según cabe. Usa `clamp(min, prefer, max)` para tipografía fluida.
- **Accesibilidad:** `role="list"` en `<ul>` si el CSS quita bullets, `aria-hidden="true"` en decorativos, `outline` en `:focus-visible`, respeta `prefers-reduced-motion`.
- **`request.design_mode`:** placeholder visual solo en editor de temas cuando un slot está vacío (evita "cajas invisibles" para el merchant).
- **`{% comment %} GOTCHA {% endcomment %}`:** el tema oculta `<div>:empty { display:none }`. Todo contenedor decorativo debe llevar contenido o `style="display:block;"`.
- **Nombres de archivo:** `kebab-case`. Prefijo `product-` para las 3 nuevas (viven en página de producto).
- **Nombres de section (`schema.name`):** en español, cortos, para el picker del editor.

---

## Sección 1 — `sections/product-benefits-pop.liquid`

**Propósito:** "¿Por qué elegir HydroLoko?" — 4 (hasta 6) beneficios con ícono ✅ / emoji / SVG a la izquierda, título fuerte + descripción corta al lado. Tarjetas apiladas verticalmente o en grid 2×2 según elección de layout.

**Schema — settings sección:**
- `paragraph` explicativo.
- `text` `heading` (default: "¿Por qué elegir HydroLoko?").
- `richtext` `subheading` (opcional, un párrafo introductorio).
- `select` `layout` con opciones `stacked` (lista vertical, 1 col) y `grid_2` (grid 2×2 en desktop). Default: `grid_2`.
- Header "Colores": `color` `bg_color` (default `#f6f5f1`), `color` `text_color` (default `#1a1a1a`), `color` `accent_color` (default `#20b19e` — verde para el ícono ✅ / borde).
- Header "Tamaño y espaciado": `range` `padding_top`/`padding_bottom` 0–120 px default 48.

**Schema — blocks (`type: "beneficio"`, max 6):**
- `textarea` `svg_code` (opcional, prioridad si está presente).
- `text` `icon_emoji` (default `✅`). Se muestra si `svg_code` está vacío.
- `text` `title` (default: "Sella grietas y huecos").
- `textarea` `description` (default: "Aplicación fácil con brocha o rodillo. Para grietas mayores a 1 mm, rellenar antes de aplicar.").

**Preset "HydroLoko — Beneficios"** con 4 blocks precargados con exactamente el texto original:
1. `✅ Sella grietas y huecos con aplicación fácil — para grietas mayores a 1 mm, rellenar antes de aplicar.`
2. `✅ Barrera duradera — crea una capa protectora que resiste la humedad continua.`
3. `✅ Uso interior y exterior — techos, paredes, baños, ventanas, juntas y más.`
4. `✅ Fórmula de alta eficiencia — diseñada para superficies de alta exposición al agua.`

---

## Sección 2 — `sections/product-usage-steps.liquid`

**Propósito:** "Modo de uso — 4 pasos" — pasos numerados grandes tipo timeline horizontal (o vertical en mobile) que replican el diseño del empaque HydroLoko. Baja la fricción de compra.

**Schema — settings sección:**
- `paragraph` explicativo.
- `text` `heading` (default: "Modo de uso").
- `richtext` `subheading` (default: "En solo 4 pasos, sin equipos especiales.").
- `select` `number_style` con opciones `circle_filled` (círculo relleno con número blanco dentro) y `circle_outline` (círculo con contorno + número dentro). Default: `circle_filled`.
- Header "Colores": `color` `bg_color` (default `#1a1a1a` — fondo negro para contrastar), `color` `text_color` (default `#f6f5f1`), `color` `number_bg` (default `#ffcd11` — amarillo Metrikasa), `color` `number_color` (default `#1a1a1a`).
- Header "Tamaño y espaciado": `range` `padding_top`/`padding_bottom` 0–120 px default 64.

**Schema — blocks (`type: "paso"`, max 6):**
- `text` `title` (default: "Paso").
- `textarea` `description` (default: "Descripción del paso.").
- `text` `number_override` (opcional, para usar romanos ① ② ③ ④ como en el empaque o dejar vacío para autonumerar).

**Preset "HydroLoko — Modo de uso"** con 4 blocks:
1. Título "LIMPIEZA" — desc: "Limpia bien la superficie donde se va a aplicar HydroLoko. Debe estar libre de polvo, grasa y restos sueltos." — number_override: "①"
2. Título "1ERA CAPA" — desc: "Aplica una primera capa con brocha o rodillo de manera uniforme sobre toda la superficie a impermeabilizar." — number_override: "②"
3. Título "SECADO Y SEGUNDA CAPA" — desc: "Deja secar entre 4 y 6 horas. Luego aplica una segunda capa de manera perpendicular a la primera para mayor cobertura." — number_override: "③"
4. Título "CURADO FINAL" — desc: "Deja curar por 24 horas antes del uso. Tiempo recomendado para techos, terrazas, ventanas y baños." — number_override: "④"

**Layout:** timeline horizontal desktop (grid 4 cols con línea/flecha conectora entre pasos), stack vertical en tablet/mobile.

---

## Sección 3 — `sections/product-comparison-table.liquid`

**Propósito:** "Tabla comparativa HydroLoko vs pintura común" — cierra la venta con ✅ vs ❌ fila a fila. La tabla debe ser legible en mobile (no scroll horizontal fijo; se convierte a tarjetas apiladas en mobile).

**Schema — settings sección:**
- `paragraph` explicativo.
- `text` `heading` (default: "HydroLoko vs pintura común").
- `richtext` `subheading` (opcional).
- `text` `col_a_label` (default: "HydroLoko"). Encabezado de la columna "buena".
- `text` `col_b_label` (default: "Solución genérica / pintura común"). Encabezado de la columna "mala".
- `text` `col_a_icon` (default: "✅").
- `text` `col_b_icon` (default: "❌").
- Header "Colores": `color` `bg_color` (default `#f6f5f1`), `color` `text_color` (default `#1a1a1a`), `color` `col_a_bg` (default `#e8fbf7` — verde muy pálido), `color` `col_a_accent` (default `#20b19e`), `color` `col_b_bg` (default `#fdecec` — rojo muy pálido), `color` `col_b_accent` (default `#e00`).
- Header "Tamaño y espaciado": `range` `padding_top`/`padding_bottom` 0–120 px default 48.

**Schema — blocks (`type: "fila"`, max 10):**
- `text` `criterion` (default: "Criterio").
- `textarea` `col_a_value` (default: "Ventaja de HydroLoko.").
- `textarea` `col_b_value` (default: "Limitación de la alternativa.").

**Preset "HydroLoko — Comparativa"** con 5 blocks (los del brief):
1. Impermeabilización real | Fórmula de alta eficiencia con barrera duradera | La pintura común no sella — solo cubre temporalmente
2. Versatilidad de superficies | Techos, paredes, baños, ventanas, grietas, juntas | Limitada a superficies planas sin grietas activas
3. Modo de aplicación | Brocha o rodillo — sin equipos especiales | Puede requerir preparación compleja o profesional
4. Uso interior y exterior | Sí — diseñado para ambos entornos | Generalmente limitado a uno u otro
5. Resultado a largo plazo | Previene daños estructurales y estéticos desde la primera aplicación | Requiere reaplicaciones frecuentes sin solucionar el fondo

**Layout:**
- Desktop: `<table>` semántica de 3 columnas (Criterio | HydroLoko | Pintura común), con columnas coloreadas suave según `col_a_bg` / `col_b_bg`. Iconos ✅ / ❌ como prefijo o pill en cada celda de valor.
- Mobile (< 749px): cada fila se convierte en un stack de 3 cajas (criterio en encabezado + 2 cajas coloreadas apiladas mostrando HydroLoko encima con pill verde y pintura común debajo con pill rojo).

---

## Reglas comunes para las 3 secciones

- Cada sección debe validar OK con `mcp__plugin_shopify-plugin_shopify-mcp__validate_theme`.
- Cada sección se puede agregar a la página de producto vía "Agregar sección" en el editor (`presets` obligatorio con `blocks` predefinidos).
- El content en presets va **literalmente** como en el brief del usuario (sin resumir, sin adaptar).
- No usar `img_url` (deprecado). Solo emojis/SVG/texto.
- No modificar ningún archivo existente. Solo crear 3 archivos nuevos en `sections/`.
- Cada sección debe respetar `prefers-reduced-motion` si tiene animación.
- `page-width` como clase del contenedor interior para heredar el ancho responsivo del tema.

---

## Contrato de éxito

Cuando el implementador termine, el merchant debe poder:
1. Abrir la personalización de la página de producto (HydroLoko o cualquiera).
2. Click "Agregar sección" → ver "Beneficios del producto", "Modo de uso" y "Tabla comparativa" en el picker.
3. Al agregarlas, aparecen con el contenido HydroLoko precargado.
4. Puede editar cualquier texto/color/icono desde el panel de settings sin tocar código.
5. Se ven correctamente en desktop, tablet y mobile.
6. `validate_theme` pasa sin errores para los 3 archivos.

## Fuera de alcance

- Modificar los templates de producto existentes (`templates/product.*.json`). El merchant elige dónde ponerlas.
- Traducciones a inglés (`locales/en.default.json`). Solo español por ahora — los textos van como literales en el schema, no como keys `t:`.
- Integración con metafields del producto (los textos son propios de la sección, no del producto).
- JS interactivo. Todo debe funcionar con CSS puro.
