# VAULI — Recrear landing completa como secciones reutilizables + plantilla

> **Para agentic workers:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` para implementar este spec en paralelo (1 agente por sección). El spec fija contrato: nombre de archivo, tokens de diseño, blocks, presets. Cada agente implementa su sección sin invadir la otra.

**Meta:** recrear la landing completa de VAULI (referencia: `https://xd23xuy6o3qwm.kimi.page/`) como secciones reutilizables en el tema `nqln-theme-current`, y armar una plantilla `templates/product.vauli.json` que las use en orden. Todas las secciones deben poder añadirse al editor de temas para cualquier producto — precargadas con contenido VAULI, editables desde settings.

**Arquitectura:** 7 secciones nuevas independientes (`.liquid` en `sections/`) siguiendo la convención de las secciones METRIKASA + HydroLoko existentes. La plantilla JSON referencia esas 7 secciones nuevas + 4 existentes reutilizadas (`product-benefits-pop`, `product-usage-steps`, `product-comparison-table`, `faq-pop`).

**Stack:** Shopify Liquid, tema Ella/Halothemes con Online Store 2.0. Sin JS excepto donde ya lo tengan las secciones existentes (photo-grid). CSS puro con custom properties, clamp responsive, prefers-reduced-motion.

**Paleta VAULI observada:**
- Fondo: blanco / hueso `#f6f5f1`
- Acento verde éxito: `#20b19e`
- Acento rojo error: `#c33a3a`
- Amarillo/CTA: `#ffcd11` (Metrikasa)
- Negro texto: `#1a1a1a`

---

## Convenciones del tema (obligatorias, extraídas de `sections/icon-row-pop.liquid`)

- Comentario inicial explicando qué es la sección + GOTCHA `:empty { display:none }`
- `{%- style -%}` inline con `--<prefijo>-*` custom properties leyendo `section.settings` con defaults
- HTML con `id="<CamelCase>-{{ section.id }}"` en el wrapper, clases BEM
- `page-width` clase del contenedor interior (o `max-width: var(--prefijo-max-width)` + `margin: 0 auto`)
- Loop `{%- for block in section.blocks -%}` con `{{ block.shopify_attributes }}`
- `{% stylesheet %}` con CSS del componente
- `{% schema %}` con settings + blocks + max_blocks + presets con contenido VAULI precargado
- Responsive: desktop → `@media (max-width: 989px)` tablet → `@media (max-width: 749px)` mobile
- `request.design_mode` para placeholder visual en editor
- `prefers-reduced-motion` respetado si hay animaciones
- `image_url` + `image_tag` (no `img_url` deprecado)
- ⚠️ **NO escribir `{% ... %}` literal dentro de comentarios CSS del `{% style %}`** — Shopify lo parseará como tag Liquid anidada y romperá el archivo.

---

## Sección 1 — `sections/product-story-split.liquid`

**Propósito:** "Hook emocional" — split imagen + texto que empatiza con el problema del cliente antes de vender el producto. Usa una narrativa: "Te va a sonar familiar" + H2 fuerte + 2-3 párrafos rich text.

**Schema — settings sección:**
- `paragraph` explicativo
- `image_picker` `image` — imagen del lado izquierdo (16:9 o similar, se recorta con `object-fit: cover`)
- `select` `image_position` — `left` / `right` (default `left`)
- `text` `eyebrow` — "Te va a sonar familiar"
- `text` `heading` — H2 grande
- `richtext` `body` — párrafos con `<strong>` para resaltar frases clave
- Header "Colores": `bg_color` (default `#ffffff`), `text_color`, `accent_color` (para el eyebrow)
- Header "Tamaños": `range` `heading_size` (default 32), `body_size` (default 16)
- Header "Espaciado": `content_max_width` (default 1100), `padding_top`/`padding_bottom` (default 64)

**Preset "VAULI — Historia":**
- eyebrow: "Te va a sonar familiar"
- heading: "Lo que compraste con esfuerzo, no debería terminar en la basura."
- body (richtext):
  - P1: "Hacer mercado cuesta. Y duele todavía más abrir la nevera a los pocos días y encontrar el queso reseco, la carne quemada por el hielo o las fresas que ya no sirven para nada."
  - P2: "La nevera no perdona: el aire es el enemigo de tus alimentos. Por eso el vacío funciona — al extraer el aire de la bolsa, <strong>tus alimentos se conservan hasta 5 veces más tiempo</strong>, con su sabor, su textura y su frescura intactos."
  - P3: "<strong>Con VAULI, cada bolsa sellada es comida que no se bota y plata que no se pierde.</strong>"

**Layout:** grid 2 columnas 1fr 1fr desktop, stack vertical en mobile (imagen arriba).

---

## Sección 2 — `sections/product-vs-columns.liquid`

**Propósito:** Comparativa "SIN [PRODUCTO]" vs "CON [PRODUCTO]" en 2 columnas de texto. Cada columna con un H3 en color y 4-6 filas: label bold + texto italic. Diferente al `product-comparison-table` (que es tabla ✓/✗); esta es narrativa.

**Schema — settings sección:**
- `paragraph` explicativo
- `text` `eyebrow` — "La diferencia"
- `text` `heading` — "Sin VAULI vs. con VAULI"
- `richtext` `subheading` — descripción corta
- `text` `col_bad_label` — "SIN VAULI"
- `text` `col_good_label` — "CON VAULI"
- Header "Colores": `bg_color`, `text_color`, `col_bad_color` (default `#c33a3a`), `col_good_color` (default `#20b19e`)
- Header "Espaciado": `content_max_width` (default 900), padding

**Schema — blocks (`type: "fila"`, max 8):**
- `text` `topic` — la categoría (ej. "Carnes en el freezer")
- `text` `bad_text` — descripción columna mala
- `text` `good_text` — descripción columna buena

**Preset "VAULI — Sin vs Con"** con 4 filas:
1. topic: "Carnes en el freezer" — bad: "Se queman por hielo en semanas." — good: "Selladas duran meses."
2. topic: "Quesos y embutidos" — bad: "Se resecan y agarran olores." — good: "Frescos como el primer día."
3. topic: "Frutas y vegetales" — bad: "Se dañan en días." — good: "Hasta 5 veces más tiempo."
4. topic: "El freezer" — bad: "Bolsas deformes y desorden." — good: "Porciones planas, etiquetadas y apilables."

**Layout:** 2 columnas iguales. Cada columna un card con H3 arriba (rojo/verde) + `<ul>` de items. En mobile: stack vertical (columna mala arriba, columna buena abajo).

---

## Sección 3 — `sections/product-feature-cards.liquid`

**Propósito:** 3-6 cards con **imagen arriba + título + descripción**. Diferente a `product-benefits-pop` (que no tiene imagen por card). Ideal para "tecnología", "componentes", "materiales".

**Schema — settings sección:**
- `paragraph` explicativo
- `text` `eyebrow` — "Tecnología VAULI"
- `text` `heading` — "Pequeño por fuera, potente por dentro"
- `richtext` `subheading` opcional
- `select` `columns` — 2/3/4 (default 3)
- Header "Colores": bg, text
- Header "Fotos": `aspect_ratio` select (`3/4`, `4/3`, `1/1`, `16/9`), `image_radius` range
- Header "Espaciado": `content_max_width`, padding

**Schema — blocks (`type: "feature"`, max 6):**
- `image_picker` `image`
- `text` `title`
- `textarea` `description`

**Preset "VAULI — Tecnología"** con 3 blocks:
1. title: "Sellador portátil inteligente" — desc: "Control de porciones, sellado de alta velocidad, conservación óptima y batería de larga duración en un solo equipo."
2. title: "Apagado automático" — desc: "El display LED muestra la batería en todo momento y el equipo se apaga solo al terminar el sellado."
3. title: "Carga USB-C" — desc: "Lo cargas con cualquier cargador de teléfono. Sin enchufe fijo ni adaptadores raros: lo usas donde quieras."

**Layout:** grid `repeat(var(--cols), 1fr)` desktop → 2 cols tablet → 1 col mobile.

---

## Sección 4 — `sections/product-kit-contents.liquid`

**Propósito:** "Qué incluye" — split imagen izquierda + lista de items del kit + card promocional lateral para venta cruzada (repuesto).

**Schema — settings sección:**
- `paragraph` explicativo
- `image_picker` `image` — foto del contenido del kit desplegado
- `text` `eyebrow` — "Qué incluye"
- `text` `heading` — "Todo lo que necesitas, en un solo kit"
- `richtext` `intro` opcional
- Header "Card promocional (opcional)":
  - `text` `promo_title` — "¿Se te acabaron las bolsas?"
  - `richtext` `promo_body` — "Pack de repuesto de 10 bolsas por solo <strong>$9.99</strong>"
  - `text` `promo_cta_label` — "Agregar repuesto"
  - `url` `promo_cta_link`
- Header "Colores": bg, text, accent
- Header "Espaciado": `content_max_width`, padding

**Schema — blocks (`type: "item"`, max 10):**
- `text` `text` — el item de la lista

**Preset "VAULI — Kit":**
- items: "1 bomba de extracción de aire VAULI", "10 bolsas grandes 30 x 35 cm", "10 bolsas medianas 22 x 21 cm", "1 cable de carga USB-C"
- promo_title: "¿Se te acabaron las bolsas?"
- promo_body: "Pack de repuesto de 10 bolsas por solo <strong>$9.99</strong>"
- promo_cta_label: "Agregar repuesto"

**Layout:** grid 2 cols (imagen + contenido). En mobile stack. Cada item con un ícono ✓ decorativo (SVG check, mismo que product-variant.liquid del tema).

---

## Sección 5 — `sections/product-uses-chips.liquid`

**Propósito:** Casos de uso con chips/tags. Split imagen + eyebrow + H2 + párrafo + wrap de chips clickeables (opcionalmente enlazables).

**Schema — settings sección:**
- `paragraph` explicativo
- `image_picker` `image`
- `select` `image_position` — `left` / `right`
- `text` `eyebrow` — "Para todo lo que compras"
- `text` `heading` — "Un kit, toda tu cocina organizada"
- `richtext` `body` opcional
- Header "Colores": bg, text, `chip_bg` (default `#f6f5f1`), `chip_color` (default `#1a1a1a`)
- Header "Espaciado": `content_max_width`, padding

**Schema — blocks (`type: "chip"`, max 12):**
- `text` `label`
- `url` `link` opcional

**Preset "VAULI — Usos":**
- body: "Del mercado al freezer, del freezer a la mesa. Si se come, se puede sellar."
- chips: "Carnes y pescados", "Quesos y embutidos", "Frutas y vegetales", "Meal prep de la semana", "Sobras y porciones", "Marinados más rápidos al vacío"

**Layout:** grid 2 cols. Chips con `display: inline-flex; flex-wrap: wrap; gap`; cada chip es un pill con border-radius grande.

---

## Sección 6 — `sections/product-testimonials.liquid`

**Propósito:** 3-6 reseñas manuales curadas (no de app). Cada card: 5 estrellas + quote + nombre + ciudad.

**Schema — settings sección:**
- `paragraph` explicativo
- `text` `eyebrow` — "Reseñas de clientes"
- `text` `heading` — "Los que ya lo usan, lo recomiendan"
- `richtext` `subheading` opcional
- `text` `footnote` — texto al final (ej. "Reseñas de clientes de NQLN Store")
- Header "Colores": bg, text, `star_color` (default `#ffb800`)
- Header "Espaciado": `content_max_width`, padding

**Schema — blocks (`type: "testimonial"`, max 6):**
- `range` `rating` 1-5 (default 5)
- `textarea` `quote`
- `text` `author_name`
- `text` `author_location`

**Preset "VAULI — Reseñas"** con 3 testimonios:
1. rating 5, quote: "El queso me duraba 4 días, ahora me dura semanas. Pagó solo con lo que dejé de botar." — María G. — Caracas
2. rating 5, quote: "Organizé todo el freezer con porciones planas. Cabe el doble y sé qué hay en cada bolsa." — José R. — Valencia
3. rating 5, quote: "Lo cargo como un teléfono y lo guardo en cualquier gaveta. Lo uso cada vez que hago mercado." — Andreína M. — Maracaibo

**Layout:** grid 3 cols desktop, 1 col mobile. Estrellas como caracteres Unicode con color configurable. Blockquote con quote grande.

---

## Sección 7 — `sections/product-cta-final.liquid`

**Propósito:** Bloque grande de cierre de venta. Título + subtítulo + precio + botón CTA + trust badges de garantía.

**Schema — settings sección:**
- `paragraph` explicativo
- `text` `heading` — H2 fuerte
- `richtext` `subheading`
- `text` `price_text` — texto libre del precio (ej. "$49.99") — permite hardcodear o dejar vacío para no mostrar
- `text` `cta_label` — "AGREGAR AL CARRITO"
- `url` `cta_link` — link (puede ser `/cart` o ancla al hero)
- `richtext` `trust_line` — trust badges de cierre (ej. "Garantía de 15 días · Envío gratis +$20 · Pago contra entrega")
- Header "Colores": `bg_color` (default `#1a1a1a` fondo oscuro), `text_color` (default `#f6f5f1`), `cta_bg` (default `#ffcd11` amarillo Metrikasa), `cta_color` (default `#1a1a1a`)
- Header "Espaciado": `content_max_width` (default 900), padding

**Preset "VAULI — CTA final":**
- heading: "Tu comida rinde más cuando no se bota"
- subheading: "Kit de Sellado al Vacío VAULI — Bomba de extracción + 20 bolsas"
- price_text: "$49.99"
- cta_label: "AGREGAR AL CARRITO"
- cta_link: "#comprar"
- trust_line: "Garantía de 15 días · Envío gratis +$20 · Pago contra entrega en Caracas"
- bg_color: `#1a1a1a`, cta_bg: `#ffcd11`

**Layout:** stack vertical centrado. Fondo oscuro con contraste alto. Botón CTA grande con animación sutil de hover.

---

## Plantilla — `templates/product.vauli.json`

Después de crear las 7 secciones, arma la plantilla JSON con este orden vertical (usa el hero nativo `main` de main-product y luego las secciones custom):

```
main                              # Hero del tema (galería + info + botones)
product-story-split               # Hook emocional (#5)
product-benefits-pop              # Beneficios clave (ya existe, con contenido VAULI en settings del template)
product-usage-steps               # Modo de uso (ya existe, con contenido VAULI)
product-vs-columns                # Sin vs Con
product-feature-cards             # Tecnología
product-kit-contents              # Qué incluye
product-uses-chips                # Casos de uso
product-testimonials              # Reseñas
faq-pop                           # FAQ (ya existe en el tema)
product-cta-final                 # CTA de cierre
```

La plantilla debe:
1. Referenciar cada sección por su `type` (nombre de archivo sin `.liquid`)
2. Cada sección lleva sus settings de VAULI en el JSON (título, imágenes vacías, textos, etc.)
3. Order de renderizado por el array `order` del JSON

---

## Reglas comunes para las 7 secciones

- Cada sección debe pasar Theme Check
- Cada sección se puede agregar a cualquier página producto vía "Agregar sección"
- El contenido de VAULI va literal en los presets (sin resumir)
- Sin `img_url` deprecado — usar `image_url` + `image_tag`
- Sin `{% ... %}` literal dentro de comentarios CSS del `{% style %}`
- Respetar `prefers-reduced-motion` si hay animaciones
- Español: labels, defaults, contenido literal

## Fuera de alcance

- Recrear el hero de producto (ya lo hace `main-product.liquid`)
- Crear header/footer nuevos (el tema ya los tiene)
- Announcement bar (ya existe `header-group.json`)
- Traducciones inglés
- Integración con app de reviews reales

## Contrato de éxito

Cuando termine:
1. 7 archivos nuevos en `sections/`
2. 1 plantilla nueva `templates/product.vauli.json`
3. Al aplicar `product.vauli` como plantilla a un producto en Shopify Admin, la página se ve como la landing de referencia
4. El merchant puede editar cada sección desde el theme editor
