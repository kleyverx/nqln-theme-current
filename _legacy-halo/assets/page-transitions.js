/**
 * Page Transitions - Lightweight SPA-like navigation for Shopify
 * Intercepts internal link clicks on mobile, fetches via AJAX,
 * and swaps .content-for-layout with a crossfade animation.
 * Header, toolbar, and marquee stay in place (no reload flash).
 */
(function () {
  'use strict';

  // Disabled: JS page transitions break third-party apps and styles.
  // Using native CSS @view-transition { navigation: auto } instead (in theme.liquid).
  return;

  var CONTENT_SELECTOR = '.content-for-layout';
  var TRANSITION_DURATION = 150;
  var MOBILE_BREAKPOINT = 1024;
  var FETCH_TIMEOUT = 5000;

  var SKIP_PATTERNS = [
    '/cart', '/checkout', '/account', '/admin',
    '/password', '/challenge', '/policies',
    '/products/'
  ];

  var isNavigating = false;
  var pageCache = {};

  var _loadingBar = null;
  function getLoadingBar() {
    if (!_loadingBar) _loadingBar = document.getElementById('page-loading-bar');
    return _loadingBar;
  }

  var loadingInterval;

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function startLoadingBar() {
    var bar = getLoadingBar();
    if (!bar) return;
    
    clearInterval(loadingInterval);
    bar.classList.add('is-loading');
    bar.style.width = '15%';
    
    var progress = 15;
    loadingInterval = setInterval(function() {
      if (progress < 90) {
        progress += (95 - progress) * 0.1;
        bar.style.width = progress + '%';
      }
    }, 400);
  }

  function finishLoadingBar() {
    var bar = getLoadingBar();
    if (!bar) return;
    
    clearInterval(loadingInterval);
    bar.style.width = '100%';
    setTimeout(function() {
      bar.classList.remove('is-loading');
      setTimeout(function() {
        bar.style.width = '0';
      }, 500);
    }, 400);
  }

  function shouldSkip(url) {
    var p = url.pathname || '';
    for (var i = 0; i < SKIP_PATTERNS.length; i++) {
      if (p.indexOf(SKIP_PATTERNS[i]) === 0) return true;
    }
    return false;
  }

  function isInternalLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.target === '_blank') return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.closest('[data-no-transition], [data-cart-sidebar], [data-mobile-menu], [data-open-auth-sidebar], details-modal, [data-bon-trigger]')) return false;

    var url;
    try { url = new URL(anchor.href); } catch (e) { return false; }

    if (url.origin !== location.origin) return false;
    if (shouldSkip(url)) return false;
    if (url.pathname === location.pathname && url.hash) return false;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    // Skip javascript: void links
    if (anchor.getAttribute('href').indexOf('javascript:') === 0) return false;

    return true;
  }

  function fetchPage(url) {
    if (pageCache[url]) return Promise.resolve(pageCache[url]);

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT);

    return fetch(url, { signal: controller.signal })
      .then(function (r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        pageCache[url] = html;
        return html;
      })
      .catch(function (err) {
        clearTimeout(timer);
        throw err;
      });
  }

  function extractContent(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return {
      content: doc.querySelector(CONTENT_SELECTOR),
      title: doc.title || '',
      bodyClass: doc.body ? doc.body.className : ''
    };
  }

  function doSwap(container, newData) {
    container.innerHTML = newData.content.innerHTML;
    document.title = newData.title;
    if (newData.bodyClass) document.body.className = newData.bodyClass;
    window.scrollTo({ top: 0, behavior: 'instant' });
    reinitialize(container);
  }

  function swapWithTransition(newData) {
    var container = document.querySelector(CONTENT_SELECTOR);
    if (!container || !newData.content) return Promise.reject(new Error('no content'));

    // Native View Transition API (Safari 18+, Chrome 111+)
    if (document.startViewTransition) {
      try {
        var t = document.startViewTransition(function () { doSwap(container, newData); });
        return t.finished.catch(function () { return Promise.resolve(); });
      } catch (e) {
        doSwap(container, newData);
        return Promise.resolve();
      }
    }

    // Manual opacity fade fallback
    return new Promise(function (resolve) {
      container.style.transition = 'opacity ' + TRANSITION_DURATION + 'ms ease-out';
      container.style.opacity = '0';
      setTimeout(function () {
        doSwap(container, newData);
        container.style.opacity = '1';
        setTimeout(function () {
          container.style.transition = '';
          resolve();
        }, TRANSITION_DURATION);
      }, TRANSITION_DURATION);
    });
  }

  // Registry of loaded script URLs to avoid redeclaration SyntaxErrors (e.g. classes)
  var loadedScripts = new Set();
  document.querySelectorAll('script[src]').forEach(function(s) { if(s.src) loadedScripts.add(s.src); });

  function reinitialize(container) {
    // Re-execute scripts in the new content
    container.querySelectorAll('script').forEach(function (old) {
      if (old.src) {
        // Absolute URL check
        var scriptUrl = new URL(old.src, location.href).href;
        if (loadedScripts.has(scriptUrl)) {
          console.log('[pt] skipping already loaded script:', scriptUrl);
          return;
        }
        loadedScripts.add(scriptUrl);
        
        var s = document.createElement('script');
        Array.from(old.attributes).forEach(function (a) { s.setAttribute(a.name, a.value); });
        old.parentNode.replaceChild(s, old);
      } else {
        // Inline scripts: handle with extreme care
        // We skip very large inline scripts that look like libraries (e.g. compiled chunks)
        if (old.textContent.length > 10000) return;

        var s = document.createElement('script');
        Array.from(old.attributes).forEach(function (a) { s.setAttribute(a.name, a.value); });
        
        // Wrap in IIFE + try/catch to prevent failure of one script stopping others
        // and to avoid 'const/let/class' re-declaration errors
        s.textContent = '(function(){ try { ' + old.textContent + ' } catch(e) { console.warn("[pt] inline script error:", e); } })();';
        old.parentNode.replaceChild(s, old);
      }
    });

    // Force lazy images to load
    container.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      img.loading = 'eager';
    });

    // Sync cart count across all bubbles
    var counts = container.querySelectorAll('[data-cart-count]');
    if (counts.length) {
      var c = counts[0].textContent;
      document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = c; });
    }

    // Notify other scripts
    document.dispatchEvent(new CustomEvent('page:transition', { detail: { container: container } }));
    document.dispatchEvent(new Event('shopify:section:load'));

    // Re-init third-party apps after AJAX navigation
    // BON Loyalty
    if (window.BonLoyalty && typeof window.BonLoyalty.init === 'function') {
      try { window.BonLoyalty.init(); } catch(e) {}
    }
    if (window.bon && typeof window.bon.init === 'function') {
      try { window.bon.init(); } catch(e) {}
    }
    // Brevo
    if (window.Brevo && window.Brevo.push) {
      try { window.Brevo.push(['pageView']); } catch(e) {}
    }
    // Shopify reviews (SPR)
    if (window.SPR && typeof window.SPR.initDomEls === 'function') {
      try { window.SPR.initDomEls(); window.SPR.loadBadges(); window.SPR.loadProducts(); } catch(e) {}
    }
    // Judge.me
    if (window.jdgm && typeof window.jdgm.customizeBadges === 'function') {
      try { window.jdgm.customizeBadges(); } catch(e) {}
    }
    // Stamped.io
    if (window.StampedFn && typeof window.StampedFn.init === 'function') {
      try { window.StampedFn.init(); } catch(e) {}
    }
    // Loox
    if (window.loox && typeof window.loox.init === 'function') {
      try { window.loox.init(); } catch(e) {}
    }
    // Generic: many apps listen to these jQuery events
    if (window.jQuery) {
      try { window.jQuery(document).trigger('ajaxComplete'); } catch(e) {}
      try { window.jQuery(document).trigger('page:change'); } catch(e) {}
    }
    // Shopify Analytics
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.lib) {
      try { window.ShopifyAnalytics.lib.track('Viewed Product'); } catch(e) {}
    }
  }

  function navigateTo(url, pushState) {
    console.log('[pt] navigateTo', url);
    if (isNavigating) return;
    isNavigating = true;
    startLoadingBar();

    fetchPage(url)
      .then(function (html) {
        var data = extractContent(html);
        if (!data.content) throw new Error('no #MainContent in response');
        
        // Update URL before swap so page events see the new location
        if (pushState !== false) {
          history.pushState({ pt: true }, data.title, url);
        }

        return swapWithTransition(data).then(function () {
          finishLoadingBar();
        });
      })
      .catch(function (err) {
        console.warn('[pt]', err.message);
        finishLoadingBar();
        window.location.href = url;
      })
      .finally(function () {
        isNavigating = false;
      });
  }

  // Intercept link clicks
  document.addEventListener('click', function (e) {
    if (!isMobile()) return;
    var a = e.target.closest('a');
    if (!a || !isInternalLink(a)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigateTo(a.href, true);
  });

  // Browser back/forward
  window.addEventListener('popstate', function () {
    if (!isMobile()) return;
    navigateTo(location.href, false);
  });

  // Prefetch on touch
  document.addEventListener('touchstart', function (e) {
    if (!isMobile()) return;
    var a = e.target.closest('a');
    if (a && isInternalLink(a) && !pageCache[a.href]) {
      fetchPage(a.href).catch(function () {});
    }
  }, { passive: true, capture: true });

})();
