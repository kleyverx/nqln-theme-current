/* Video Showcase Carousel — custom element nativo (patrón del tema, sin frameworks).
   Muestra N videos por slide (data-per-slide) y las flechas avanzan de N en N.
   Loop opcional al llegar al final. Iframes directos (sin miniatura/play). */
if (!customElements.get('video-showcase-carousel')) {
  customElements.define(
    'video-showcase-carousel',
    class VideoShowcaseCarousel extends HTMLElement {
      constructor() {
        super();
        this.track = this.querySelector('.vsc__track');
        this.slides = Array.from(this.querySelectorAll('.vsc__slide'));
        this.cells = Array.from(this.querySelectorAll('.vsc__cell'));
        this.per = Math.max(1, parseInt(this.dataset.perSlide || '2', 10));
        this.gap = 140;
        this.page = 0;   // índice de página (desktop: grupo de N videos · móvil: 1 video)
        this.autoplayMs = parseInt(this.dataset.autoplay || '0', 10);
        this._timer = null;
      }

      isMobile() { return window.innerWidth <= 749; }

      connectedCallback() {
        if (!this.track || !this.slides.length) return;
        // exponer per/gap al CSS para el cálculo del ancho de cada slide
        this.style.setProperty('--vsc-per', this.per);
        this.style.setProperty('--vsc-gap', this.gap + 'px');

        this.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('resize', this.debounce(() => this.update(), 150));
        this.update();
        if (this.autoplayMs > 0) this.startAutoplay();
        this.addEventListener('mouseenter', () => this.stopAutoplay());
        this.addEventListener('mouseleave', () => { if (this.autoplayMs > 0) this.startAutoplay(); });
      }

      disconnectedCallback() { this.stopAutoplay(); }

      onClick(e) {
        var el = e.target;
        if (el && el.nodeType !== 1) el = el.parentElement;
        if (!el || typeof el.closest !== 'function') return;
        var nav = el.closest('[data-vsc-next], [data-vsc-prev]');
        if (!nav) return;
        if (nav.hasAttribute('data-vsc-next')) this.next(); else this.prev();
      }

      // Desktop: cada <li> es un grupo de N videos → nº de slides.
      // Móvil: se navega video a video → nº de celdas.
      pages() { return this.isMobile() ? this.cells.length : this.slides.length; }

      next() { this.go(this.page + 1); }
      prev() { this.go(this.page - 1); }

      go(p) {
        var max = this.pages() - 1;
        if (p > max) p = 0;      // loop al inicio
        if (p < 0) p = max;      // loop al final
        this.page = p;
        this.update();
      }

      update() {
        // el paso es siempre el ancho del viewport, tanto en desktop (slide=100%)
        // como en móvil (celda=100%). En móvil solo cambia CUÁNTAS páginas hay.
        var vw = this.querySelector('.vsc__viewport');
        var step = vw ? vw.clientWidth : 0;
        // clamp por si cambió el nº de páginas al cruzar el breakpoint
        if (this.page > this.pages() - 1) this.page = 0;
        this.track.style.transform = 'translateX(' + (-this.page * step) + 'px)';
      }

      startAutoplay() { this.stopAutoplay(); this._timer = setInterval(this.next.bind(this), this.autoplayMs); }
      stopAutoplay() { if (this._timer) { clearInterval(this._timer); this._timer = null; } }

      debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
    }
  );
}
