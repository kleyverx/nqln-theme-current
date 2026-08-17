class NewsletterPopup extends HTMLElement {
    constructor() {
        super();

        this.popup = this;
        this.timeToShow = parseInt(this.popup.getAttribute('data-delay'));
        const delayEnabledAttr = this.popup.getAttribute('data-delay-enabled');
        this.delayEnabled = (delayEnabledAttr === null) ? true : (delayEnabledAttr === 'true' || delayEnabledAttr === '1');
        this.expiresDate = this.popup.getAttribute('data-expire');
        this.countryIso = (this.popup.getAttribute('data-country-iso') || '').toUpperCase();
        this.dialMap = {};
        this.dialCodesUrl = this.popup.getAttribute('data-dial-codes-url') || '';
        // Configuración de scroll y exit intent desde atributos
        this.hasShown = false;
        this.scrollThreshold = parseInt(this.popup.getAttribute('data-scroll-threshold') || '0');
        const exitAttr = this.popup.getAttribute('data-exit-intent');
        this.enableExitIntent = (exitAttr === null) ? true : (exitAttr === 'true' || exitAttr === '1');
        // Endpoint para guardar datos en metafields vía App Proxy
        this.metafieldsEndpoint = this.popup.getAttribute('data-metafields-endpoint') || '';

        // Eliminamos la restricción de ventana de sesión: el popup puede abrir
        // por delay, porcentaje de scroll o intención de salida sin límite de tiempo

        // Inicializar triggers si no hay cookie de cierre
        if (!this.shouldNeverShow()) {
            this.initTriggers();
        }
        
        document.body.addEventListener('click', this.onBodyClickEvent.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));

        this.querySelector('[data-close-newsletter-popup]').addEventListener(
            'click',
            this.softClose.bind(this)
        );

        this.querySelector('#ContactPopup').addEventListener(
            'submit',
            this.prepareSubmission.bind(this),
        );

        this.querySelector('#ContactPopup').addEventListener(
            'submit',
            this.onSubmitAndDismiss.bind(this)
        );

        // Cerrar y no volver a mostrar si marcan el checkbox de dismiss
        const dismissCheckbox = this.querySelector('#dismiss');
        if (dismissCheckbox) {
            dismissCheckbox.addEventListener('change', () => {
                if (dismissCheckbox.checked) {
                    this.setHardDismiss();
                }
            });
        }

        // Sin país/código separados: no cargamos ni sincronizamos códigos de país
    }

    prepareSubmission(event) {
        try {
            const form = this.querySelector('#ContactPopup');
            const tagsInput = form && form.querySelector('input[name="contact[tags]"]');
            if (!tagsInput) return;

            const parts = [];
            const baseTag = (tagsInput.value || '').trim();
            if (baseTag) parts.push(baseTag);

            const firstNameEl = form.querySelector('input[name="newsletter[first_name]"]');
            const lastNameEl = form.querySelector('input[name="newsletter[last_name]"]');
            const phoneEl = form.querySelector('input[name="newsletter[phone]"]');
            const emailEl = form.querySelector('input[name="contact[email]"]') || form.querySelector('input[name="email"]');

            const firstName = firstNameEl && firstNameEl.offsetParent !== null ? (firstNameEl.value || '').trim() : '';
            const lastName = lastNameEl && lastNameEl.offsetParent !== null ? (lastNameEl.value || '').trim() : '';
            const phone = phoneEl && phoneEl.offsetParent !== null ? (phoneEl.value || '').trim() : '';
            const email = emailEl ? (emailEl.value || '').trim() : '';

            if (firstName) parts.push('Nombre: ' + firstName);
            if (lastName) parts.push('Apellido: ' + lastName);
            if (phone) {
                parts.push('Teléfono: ' + phone);
            }

            tagsInput.value = parts.join(', ');

            // Enviar a endpoint de App Proxy para guardar en metafields
            if (this.metafieldsEndpoint) {
                const payload = {
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    phone
                };
                try {
                    const body = JSON.stringify(payload);
                    if (navigator.sendBeacon) {
                        const blob = new Blob([body], { type: 'application/json' });
                        navigator.sendBeacon(this.metafieldsEndpoint, blob);
                    } else {
                        fetch(this.metafieldsEndpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body
                        });
                    }
                } catch(_) {}
            }
        } catch (e) {
            // swallow errors to avoid blocking submission
        }
    }

    setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + d.toUTCString();
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    }

    getCookie(cname) {
        const name = cname + '=';
        const ca = document.cookie.split(';');

        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }

        return '';
    }

    deleteCookie(name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // Determina si nunca debe mostrarse (hard dismiss o suscrito)
    shouldNeverShow() {
        const cookieClosed = this.getCookie('newsletter-popup') === 'closed';
        const hardDismiss = localStorage.getItem('newsletter_hard_dismiss') === 'true';
        const subscribed = localStorage.getItem('newsletter_subscribed') === 'true' || localStorage.getItem('newsletter_submitted') === 'true';
        return cookieClosed || hardDismiss || subscribed;
    }

    // Sin ventana de sesión: siempre permitimos evaluar apertura si no está bloqueado

    initTriggers() {
        // Disparo por delay configurado
        if (this.delayEnabled && this.timeToShow && this.timeToShow > 0) {
            this.delayTimer = setTimeout(() => this.tryOpen(), this.timeToShow);
        }
        // Disparo por porcentaje de scroll
        if (this.scrollThreshold && this.scrollThreshold > 0) {
            this.onScroll = this.handleScroll.bind(this);
            window.addEventListener('scroll', this.onScroll, { passive: true });
            // Comprobación inicial por si ya está avanzada la página
            this.handleScroll();
        }
        // Disparo por exit intent (salida del sitio)
        if (this.enableExitIntent) {
            this.onExitIntent = (e) => {
                if (this.hasShown) return;
                const fromDocument = (e.relatedTarget === null);
                const outTop = e.clientY <= 0;
                const outLeft = e.clientX <= 0;
                const outRight = e.clientX >= window.innerWidth;
                if (fromDocument && (outTop || outLeft || outRight)) {
                    this.tryOpen();
                }
            };
            // Usamos mouseout en window para detectar cuando el puntero sale de la ventana
            window.addEventListener('mouseout', this.onExitIntent);
        }
    }

    handleScroll() {
        if (this.hasShown) return;
        const doc = document.documentElement;
        const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
        const docHeight = Math.max(doc.scrollHeight, doc.offsetHeight);
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(docHeight - winHeight, 1);
        const percent = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
        if (percent >= this.scrollThreshold) {
            this.tryOpen();
        }
    }

    tryOpen() {
        if (this.shouldNeverShow()) return;
        this.openPopup();
    }

    openPopup() {
        if (this.hasShown) return;
        this.hasShown = true;
        document.body.classList.add('newsletter-show');
        setTimeout(() => {
            document.body.classList.add('show-newsletter-image');
        }, 700);
        // Enfocar email al abrir
        setTimeout(() => {
            const emailInput = this.querySelector('#NewsletterForm--Popup');
            if (document.body.classList.contains('newsletter-show') && emailInput) {
                try { emailInput.focus(); } catch(e) {}
            }
        }, 50);
        // Limpiar listeners
        if (this.onScroll) window.removeEventListener('scroll', this.onScroll);
        if (this.onExitIntent) window.removeEventListener('mouseout', this.onExitIntent);
        if (this.delayTimer) { try { clearTimeout(this.delayTimer); } catch(e) {} }
    }

    // Cierre suave: oculta sin reprogramar reaparición
    softClose() {
        document.body.classList.remove('newsletter-show');
        setTimeout(() => {
            document.body.classList.remove('show-newsletter-image');
        }, 700);
        this.hasShown = false;
    }

    // Cierre definitivo: no volver a mostrar
    setHardDismiss() {
        try { this.setCookie('newsletter-popup', 'closed', this.expiresDate); } catch(_) {}
        localStorage.setItem('newsletter_hard_dismiss', 'true');
        document.body.classList.remove('newsletter-show');
        setTimeout(() => {
            document.body.classList.remove('show-newsletter-image');
        }, 700);
        // Cancelar cualquier reprogramación
        // No se programa re-apertura en cierre definitivo
    }

    onBodyClickEvent(event){
        if ((!this.contains(event.target)) && ($(event.target).closest('[data-open-newsletter-popup]').length === 0) && document.querySelector('body').classList.contains('newsletter-show')){
            this.softClose();
        }
    }

    onKeyDown(event) {
        if (event.key === 'Escape' && document.body.classList.contains('newsletter-show')) {
            this.softClose();
        }
    }

    // Al enviar, marcamos como suscrito y cerramos definitivamente
    onSubmitAndDismiss(event) {
        try {
            localStorage.setItem('newsletter_subscribed', 'true');
        } catch(_) {}
        this.setHardDismiss();
    }

    syncCountryAndDialCode() {
        const countryEl = this.querySelector('select[name="newsletter[country]"]');
        const codeEl = this.querySelector('input[name="newsletter[phone_code]"]');
        if (!countryEl || !codeEl) return;

        let iso = this.countryIso;
        const selected = countryEl.options[countryEl.selectedIndex];
        if (selected) {
            const dataset = selected.dataset || {};
            // Shopify puede usar data-code o data-country-code
            const candidate = dataset.code || dataset.countryCode || selected.getAttribute('data-country-code') || selected.getAttribute('data-code');
            if (candidate) {
                iso = (candidate || iso).toUpperCase();
            }
        } else {
            // Try to select option by dataset code initially
            for (let i = 0; i < countryEl.options.length; i++) {
                const opt = countryEl.options[i];
                const optData = opt.dataset || {};
                const optIso = (optData.code || optData.countryCode || opt.getAttribute('data-country-code') || opt.getAttribute('data-code') || '').toUpperCase();
                if (optIso && optIso === iso) {
                    countryEl.selectedIndex = i;
                    break;
                }
            }
        }
        const dial = this.dialMap[iso] || '';
        if (dial) {
            codeEl.value = '+' + dial;
        }
        // No flags: only update visible dial code
    }

    async loadDialCodes() {
        // Try to fetch from asset; fallback to a minimal set if it fails
        try {
            if (!this.dialCodesUrl) throw new Error('No dial codes URL');
            const res = await fetch(this.dialCodesUrl, { credentials: 'omit' });
            if (!res.ok) throw new Error('Failed to load dial codes');
            const data = await res.json();
            if (data && typeof data === 'object') {
                this.dialMap = data;
                return;
            }
        } catch (_) {
            this.dialMap = {
                'US': '1', 'CA': '1', 'GB': '44', 'FR': '33', 'DE': '49', 'IT': '39', 'ES': '34', 'PT': '351',
                'MX': '52', 'AR': '54', 'CO': '57', 'CL': '56', 'PE': '51', 'VE': '58', 'BR': '55'
            };
        }
    }

    // Flags removed for simplicity
}

customElements.define('newsletter-popup', NewsletterPopup);

class NewsletterMessagePopup extends HTMLElement {
    constructor() {
        super();

        this.querySelector('[data-close-newsletter-message-popup]').addEventListener(
            'click',
            this.close.bind(this)
        );

        document.body.addEventListener('click', this.onBodyClickEvent.bind(this));
    }

    close(){
        document.body.classList.remove('newsletter-message-show');
    }

    onBodyClickEvent(event){
        if (!this.contains(event.target)){
            this.close();
        }
    }
}

customElements.define('newsletter-message-popup', NewsletterMessagePopup);