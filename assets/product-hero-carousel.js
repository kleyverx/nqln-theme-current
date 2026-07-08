/* Product Hero Carousel — custom element nativo (sin frameworks, patrón del tema).
   Maneja: cambio de slide con transición suave (producto entra desde la derecha),
   flechas prev/next, autoplay opcional, y acordeones por slide. */
if (!customElements.get('product-hero-carousel')) {
  customElements.define(
    'product-hero-carousel',
    class ProductHeroCarousel extends HTMLElement {
      constructor() {
        super();
        this.slides = Array.from(this.querySelectorAll('.phc__slide'));
        this.index = this.slides.findIndex((s) => s.classList.contains('is-active'));
        if (this.index < 0) this.index = 0;
        this.isAnimating = false;
        this.autoplayMs = parseInt(this.dataset.autoplay || '0', 10);
        this._timer = null;
      }

      connectedCallback() {
        if (!this.slides.length) return;

        this.addEventListener('click', this.onClick.bind(this));
        this.show(this.index, 0); // asegura estado inicial
        if (this.autoplayMs > 0) this.startAutoplay();

        // Pausa autoplay al interactuar
        this.addEventListener('mouseenter', () => this.stopAutoplay());
        this.addEventListener('mouseleave', () => { if (this.autoplayMs > 0) this.startAutoplay(); });
      }

      disconnectedCallback() {
        this.stopAutoplay();
      }

      onClick(e) {
        // e.target puede ser un nodo de texto (sin .closest); normalizamos a Element.
        var el = e.target;
        if (el && el.nodeType !== 1) el = el.parentElement;
        if (!el || typeof el.closest !== 'function') return;

        var nav = el.closest('[data-phc-next], [data-phc-prev]');
        if (nav) {
          if (nav.hasAttribute('data-phc-next')) this.next();
          else this.prev();
          return;
        }
        var head = el.closest('.phc__acc-head');
        if (head) this.toggleAcc(head);
      }

      toggleAcc(head) {
        var item = head.closest('.phc__acc-item');
        if (!item) return;
        var body = item.querySelector('.phc__acc-body');
        var open = item.classList.toggle('is-open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (body) body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
      }

      next() { this.go(this.index + 1); }
      prev() { this.go(this.index - 1); }

      go(target) {
        if (this.isAnimating || this.slides.length < 2) return;
        var n = this.slides.length;
        var nextIndex = ((target % n) + n) % n;
        if (nextIndex === this.index) return;
        this.show(nextIndex);
      }

      show(nextIndex, duration) {
        var current = this.slides[this.index];
        var nextSlide = this.slides[nextIndex];
        if (!nextSlide) return;

        this.isAnimating = true;

        // Cierra acordeones abiertos del slide saliente para que no “salten”
        if (current && current !== nextSlide) {
          current.querySelectorAll('.phc__acc-item.is-open').forEach(function (it) {
            it.classList.remove('is-open');
            var b = it.querySelector('.phc__acc-body');
            if (b) b.style.maxHeight = '0px';
            var h = it.querySelector('.phc__acc-head');
            if (h) h.setAttribute('aria-expanded', 'false');
          });

          current.classList.add('is-leaving');
          current.classList.remove('is-active');
        }

        nextSlide.classList.remove('is-leaving');
        // forzar reflow para reiniciar la animación de entrada del producto
        void nextSlide.offsetWidth;
        nextSlide.classList.add('is-active');

        this.index = nextIndex;

        var done = function () {
          if (current) current.classList.remove('is-leaving');
          this.isAnimating = false;
        }.bind(this);

        if (duration === 0) { done(); }
        else { setTimeout(done, 600); }
      }

      startAutoplay() {
        this.stopAutoplay();
        this._timer = setInterval(this.next.bind(this), this.autoplayMs);
      }
      stopAutoplay() {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
      }
    }
  );
}
