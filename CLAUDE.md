# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Qué es esto

Un **tema de Shopify** — el storefront en vivo de "INV MARG", una tienda venezolana. Es el **tema Ella de Halothemes (v6.5.0)** que ha sido fuertemente personalizado in situ. No hay paso de build, gestor de paquetes ni servidor de desarrollo local en este repo; es el código fuente crudo del tema que se sube/baja desde la tienda de Shopify en vivo.

El idioma principal de la tienda es **español (es)**. `locales/es.json` es el archivo de traducción de trabajo; las cadenas visibles para el usuario deben agregarse allí (y en `en.default.json` para mantener la paridad).

## Flujo de trabajo y "comandos"

Este repo se edita directamente y se sincroniza con Shopify vía Shopify CLI (o el Editor de Temas del admin). No hay herramientas de `npm`/test/build.

- **Validar Liquid antes de hacer commit** — al generar o editar archivos `.liquid`, usa el skill `shopify-plugin:shopify-liquid`, que ejecuta `search_docs.mjs` (consultar objetos/filtros) y `validate.mjs` (analizar el archivo). Esto es lo más parecido a un "linter" que hay aquí. El commit `512c557` ("Fix linter errors") se produjo de esta manera.
- **Validar JSON de configuración** con `node -e "require('./config/settings_data.json')"` — `settings_data.json` es un único objeto enorme y fácil de corromper.
- Los commits en este repo se escriben **en español** siguiendo el historial existente (p. ej. "Sincronizar tema...", y prefijos Conventional-Commit como `fix(localization):`).
- Los commits "Recuperación de datos" / "Sincronizar tema" significan que se bajó la exportación en vivo de Shopify — trátalos como la fuente de verdad y evita sobreescribirlos.

## Arquitectura

Estructura estándar de tema Shopify (`assets/ config/ layout/ locales/ sections/ snippets/ templates/`). Escala: ~127 sections, ~370 snippets, ~237 assets. Más allá de la estructura estándar, lo importante a saber:

### Base de vendor vs. trabajo personalizado
El grueso del tema es **código vendor de Halo/Ella**, reconocible por el prefijo `halo-*` (snippets, assets, sections) y los objetos JS globales `Shopify.theme`/`halo`. **No** reformatees ni "limpies" archivos vendor de forma masiva. Las adiciones personalizadas/específicas de la tienda hechas sobre la base vendor incluyen:
- `sections/whatsapp-button.liquid`, `sections/smart-app-banner.liquid`, `sections/main-menu-mobile.liquid`, `sections/custom-header-banner.liquid`, `sections/popup-descuento.liquid` (popup de descuento, controlado por cookie).
- Los grandes bloques inline `<style>`/`<script>` en [layout/theme.liquid](layout/theme.liquid) — esta es la principal superficie de personalización (ver abajo).

### `layout/theme.liquid` es el centro de personalización
De forma inusual, gran parte del comportamiento específico de la tienda vive como **CSS/JS inline directamente en [layout/theme.liquid](layout/theme.liquid)**, no en archivos de assets. Antes de agregar CSS/JS global en otro lugar, revisa aquí primero. Contiene:
- Un régimen de orden de apilamiento z-index (barra sticky de agregar al carrito, header, footer, marquee) — edita estas reglas `!important` con cuidado; corrigen bugs reales de solapamiento.
- Estilado global del selector de variantes (`.product-form__input`, swatches, estados sold-out/unavailable).
- Configuración de la View Transitions API (navegación de páginas en móvil, `@view-transition`), una barra superior de carga de página, boost de LCP con `fetchpriority`, y diferimiento de secciones bajo el pliegue con `content-visibility`.
- Parches JS en runtime: interceptar `/cart/add` (fetch/XHR/form) para abrir el sidebar del carrito en vez de redirigir; diferir scripts de terceros (Brevo, Lottie) hasta idle/interacción; traducir cadenas de UI que quedan en inglés ("Sold out" → "Agotado") vía MutationObserver.

Al corregir un bug de layout/solapamiento/traducción, la causa suele ser uno de estos bloques inline y no un archivo de section.

### JavaScript: Web Components, no un framework
La UI interactiva está construida con **custom elements nativos** (`customElements.define(...)`) — p. ej. `cart-items`, `menu-drawer`, `predictive-search`, `product-form`, `quick-add-modal`, `localization-form`. Los helpers principales (`trapFocus`, `pauseAllMedia`, `Shopify.getCart`, el objeto `halo`) viven en `assets/global.js` / `assets/vendor.js`, cargados vía `snippets/global-script.liquid`. No hay módulos JS ni bundling — cada componente es su propio archivo `assets/*.js` cargado por la section/snippet que lo usa. Sigue este patrón al agregar interactividad; no introduzcas un framework ni una herramienta de build.

### CSS: un archivo por componente
El CSS está dividido en muchos archivos `assets/component-*.css`, cargados bajo demanda por la section que los necesita (nombres de clase estilo BEM). Los estilos por componente son la norma; los estilos inline en `theme.liquid` se reservan para correcciones globales/transversales.

### Templates e integraciones de apps
- Los templates JSON (`templates/*.json`) definen la composición de la página; el comerciante los edita vía el Editor de Temas, así que prefiere construir **sections/snippets/blocks** en vez de codificar directo en los templates.
- Muchos templates `.liquid` son **endpoints de datos de apps**, no páginas — p. ej. `templates/*.magenative-*.liquid`, `templates/*.ssw-*.liquid`, `templates/*.ajax_*.liquid`, `*.foxkit.liquid`. Estos renderizan JSON/parciales para apps de terceros (app móvil MageNative, apps de búsqueda, Foxkit, carrito/quickshop AJAX). No los trates como páginas normales del storefront.
- Superficies de apps de terceros presentes en el tema: Growave / BON Loyalty (lealtad y wishlist), AliReviews, Pandectes (GDPR), Gameball, Brevo. Los hooks de estas aparecen como `{% render 'nombre-app-...' %}` en `theme.liquid` — déjalos en su lugar.

## Convenciones

- **Español primero.** El texto de la UI es en español. Las nuevas cadenas visibles para el usuario pasan por `{{ 'key' | t }}` con entradas en `locales/es.json` y `locales/en.default.json`. Los archivos de locale `*_pretty.json` y `*.schema.json` son generados/auxiliares — no los edites a mano.
- Usa `image_url`/`image_tag` (no los deprecados `img_url`/`img_tag`); pasa `width`/`alt` explícitos (el linter marca atributos de imagen faltantes).
- Prefiere `{% render %}` sobre `{% include %}` (el commit `512c557` migró estos).
- Mantén la accesibilidad intacta: el tema usa `trapFocus`, skip links y regiones ARIA live — presérvalos al editar componentes interactivos.
