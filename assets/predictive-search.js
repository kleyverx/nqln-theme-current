if (!customElements.get('predictive-search')) {
  class PredictiveSearch extends HTMLElement {
    constructor() {
      super();
      this.cachedResults = {};
      this.input = this.querySelector('input[type="search"]');
      this.predictiveSearchResults = this.querySelector('#predictive-search');
      this.trendingPanel = this.querySelector('#predictive-search-trending');
      this.statusElement = this.querySelector('.predictive-search-status');
      this.isOpen = false;
      this.abortController = null;

      this.setupEventListeners();
    }

    debounce(fn, delay) {
      let timer = null;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    setupEventListeners() {
      const form = this.querySelector('form');
      if (form) {
        form.addEventListener('submit', this.onFormSubmit.bind(this));
      }

      this.clearButton = this.querySelector('.predictive-search-form__clear');

      this.debouncedOnChange = this.debounce(this.onChange.bind(this), 300);
      this.input.addEventListener('input', (e) => {
        this.toggleClearButton();
        this.debouncedOnChange(e);
      });
      this.input.addEventListener('focus', this.onFocus.bind(this));

      if (this.clearButton) {
        this.clearButton.addEventListener('click', () => {
          this.input.value = '';
          this.toggleClearButton();
          this.close();
          this.showTrending();
          this.input.focus();
        });
      }

      document.addEventListener('click', this.onDocumentClick.bind(this));
      document.addEventListener('keydown', this.onKeydown.bind(this));
    }

    getQuery() {
      return this.input.value.trim();
    }

    toggleClearButton() {
      if (this.getQuery().length > 0) {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    }

    onChange() {
      const searchTerm = this.getQuery();
      if (!searchTerm.length) {
        this.close();
        this.showTrending();
        return;
      }
      this.hideTrending();
      this.getSearchResults(searchTerm);
    }

    onFormSubmit(event) {
      if (!this.getQuery().length) {
        event.preventDefault();
      }
    }

    onFocus() {
      const searchTerm = this.getQuery();

      if (!searchTerm.length) {
        this.showTrending();
        return;
      }

      if (this.cachedResults[this.getCacheKey(searchTerm)]) {
        this.hideTrending();
        this.open();
      } else {
        this.hideTrending();
        this.getSearchResults(searchTerm);
      }
    }

    onDocumentClick(event) {
      if (!this.contains(event.target)) {
        this.close();
        this.hideTrending();
      }
    }

    onKeydown(event) {
      if (event.key === 'Escape') {
        this.close();
        this.hideTrending();
        this.input.blur();
      }
    }

    showTrending() {
      if (!this.trendingPanel) return;
      this.trendingPanel.style.display = 'block';
    }

    hideTrending() {
      if (!this.trendingPanel) return;
      this.trendingPanel.style.display = 'none';
    }

    getCacheKey(searchTerm) {
      return searchTerm.replace(/\s+/g, '-').toLowerCase();
    }

    getSearchResults(searchTerm, retryCount = 0) {
      const cacheKey = this.getCacheKey(searchTerm);

      this.setLoadingState();

      if (this.cachedResults[cacheKey]) {
        this.renderSearchResults(this.cachedResults[cacheKey]);
        return;
      }

      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      const productsToShow = this.dataset.productToShow || 5;

      fetch(
        `${routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent('resources[type]')}=product&${encodeURIComponent('resources[limit]')}=${productsToShow}&section_id=predictive-search`,
        { signal: this.abortController.signal }
      )
        .then((response) => {
          if (response.status === 429 && retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            return new Promise((resolve) => setTimeout(resolve, delay)).then(() => {
              return this.getSearchResults(searchTerm, retryCount + 1);
            });
          }
          if (!response.ok) {
            throw new Error(response.status);
          }
          return response.text();
        })
        .then((text) => {
          if (!text) return;
          const parsed = new DOMParser().parseFromString(text, 'text/html');
          const section = parsed.querySelector('#shopify-section-predictive-search');
          if (!section) return;
          const resultsMarkup = section.innerHTML;
          this.cachedResults[cacheKey] = resultsMarkup;
          this.renderSearchResults(resultsMarkup);
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          this.close();
        });
    }

    setLoadingState() {
      if (this.statusElement) {
        this.statusElement.setAttribute('aria-hidden', 'false');
        this.statusElement.textContent = this.getAttribute('data-loading-text') || 'Cargando...';
      }
      this.setAttribute('loading', '');
    }

    renderSearchResults(resultsMarkup) {
      this.predictiveSearchResults.innerHTML = resultsMarkup;
      this.removeAttribute('loading');
      this.open();

      const liveRegion = this.predictiveSearchResults.querySelector(
        '[data-predictive-search-live-region-count-value]'
      );
      if (liveRegion && this.statusElement) {
        this.statusElement.textContent = liveRegion.textContent;
        setTimeout(() => {
          this.statusElement.setAttribute('aria-hidden', 'true');
        }, 1000);
      }
    }

    open() {
      this.predictiveSearchResults.style.display = 'block';
      this.input.setAttribute('aria-expanded', 'true');
      this.isOpen = true;
    }

    close() {
      this.predictiveSearchResults.style.display = 'none';
      this.input.setAttribute('aria-expanded', 'false');
      this.isOpen = false;
      this.removeAttribute('loading');
    }
  }

  customElements.define('predictive-search', PredictiveSearch);
}
