/* ==========================================================================
   Bends — core behaviours
   Vanilla custom elements, no framework and no external dependency. Each
   element is self-contained so a section can be added, removed or reordered
   in the theme editor without anything else breaking.
   ========================================================================== */
(function () {
  'use strict';

  var Theme = window.BendsTheme || {};
  var strings = Theme.strings || {};

  /* ---------------------------------------------------------------- utils */

  var utils = {
    /** Announce a message to screen readers without moving focus. */
    announce: function (message) {
      var region = document.querySelector('[data-live-region]');
      if (!region || !message) return;
      region.textContent = '';
      window.setTimeout(function () {
        region.textContent = message;
      }, 60);
    },

    formatMoney: function (cents) {
      var format = Theme.moneyFormat || '${{amount}}';
      var value = (Number(cents) || 0) / 100;

      function withDelimiter(number, precision, thousands, decimal) {
        var fixed = number.toFixed(precision);
        var parts = fixed.split('.');
        var whole = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        return parts[1] ? whole + decimal + parts[1] : whole;
      }

      return format.replace(/\{\{\s*(\w+)\s*\}\}/g, function (_match, name) {
        switch (name) {
          case 'amount': return withDelimiter(value, 2, ',', '.');
          case 'amount_no_decimals': return withDelimiter(value, 0, ',', '.');
          case 'amount_with_comma_separator': return withDelimiter(value, 2, '.', ',');
          case 'amount_no_decimals_with_comma_separator': return withDelimiter(value, 0, '.', ',');
          case 'amount_with_space_separator': return withDelimiter(value, 2, ' ', ',');
          case 'amount_no_decimals_with_space_separator': return withDelimiter(value, 0, ' ', ',');
          case 'amount_with_apostrophe_separator': return withDelimiter(value, 2, "'", '.');
          default: return withDelimiter(value, 2, ',', '.');
        }
      });
    },

    storage: {
      get: function (key, fallback) {
        try {
          var raw = window.localStorage.getItem(key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch (error) {
          return fallback;
        }
      },
      set: function (key, value) {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          return false;
        }
      },
      remove: function (key) {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          /* nothing to clean up */
        }
      }
    },

    debounce: function (fn, wait) {
      var timer;
      return function () {
        var context = this;
        var args = arguments;
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          fn.apply(context, args);
        }, wait);
      };
    },

    /** Keep tab focus inside an open dialog. */
    trapFocus: function (container, previouslyFocused) {
      var selector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';

      function onKeydown(event) {
        if (event.key !== 'Tab') return;
        var focusable = Array.prototype.filter.call(
          container.querySelectorAll(selector),
          function (node) { return node.offsetParent !== null; }
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }

      container.addEventListener('keydown', onKeydown);

      var target = container.querySelector('[autofocus]') || container.querySelector(selector);
      if (target) target.focus();

      return function release() {
        container.removeEventListener('keydown', onKeydown);
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
          previouslyFocused.focus();
        }
      };
    },

    lockScroll: function (locked) {
      document.body.classList.toggle('scroll-locked', locked);
    },

    /** Fetch a section's rendered HTML so lists can update without a reload. */
    fetchSection: function (url) {
      return fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then(function (response) {
        if (!response.ok) throw new Error('Request failed: ' + response.status);
        return response.text();
      });
    },

    parseHTML: function (html) {
      return new DOMParser().parseFromString(html, 'text/html');
    },

    prefersReducedMotion: function () {
      return (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.getAttribute('data-motion') === 'off'
      );
    }
  };

  Theme.utils = utils;
  window.BendsTheme = Theme;

  /* ------------------------------------------------------------- cart api */

  var cartApi = {
    listeners: [],

    subscribe: function (fn) {
      cartApi.listeners.push(fn);
      return function () {
        cartApi.listeners = cartApi.listeners.filter(function (listener) { return listener !== fn; });
      };
    },

    publish: function (cart) {
      cartApi.listeners.forEach(function (fn) {
        try { fn(cart); } catch (error) { /* one bad listener must not stop the rest */ }
      });
      document.dispatchEvent(new CustomEvent('bends:cart:updated', { detail: { cart: cart } }));
    },

    get: function () {
      return fetch(Theme.routes.cart + '.js', { headers: { Accept: 'application/json' } })
        .then(function (response) { return response.json(); });
    },

    add: function (body) {
      return fetch(Theme.routes.cartAdd + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      }).then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw data;
          return data;
        });
      });
    },

    change: function (body) {
      return fetch(Theme.routes.cartChange + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      }).then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw data;
          return data;
        });
      });
    },

    update: function (body) {
      return fetch(Theme.routes.cartUpdate + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      }).then(function (response) { return response.json(); });
    }
  };

  Theme.cart = cartApi;

  /* ------------------------------------------------------- reveal on scroll */

  function initReveals(root) {
    var scope = root || document;
    var targets = scope.querySelectorAll('[data-reveal]:not(.is-revealed)');
    if (!targets.length) return;

    if (!Theme.animations || !Theme.animations.enabled || utils.prefersReducedMotion() || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (node) { node.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(targets, function (node) { observer.observe(node); });
  }

  Theme.initReveals = initReveals;

  /* ------------------------------------------------------------- header */

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.lastScroll = window.scrollY;
      this.isSticky = this.dataset.sticky === 'true';
      this.revealOnScroll = this.dataset.revealOnScroll === 'true';
      this.onScroll = this.onScroll.bind(this);

      this.measure();
      window.addEventListener('resize', utils.debounce(this.measure.bind(this), 150));
      if (this.isSticky) window.addEventListener('scroll', this.onScroll, { passive: true });

      this.bindMenu();
      this.bindSearch();
      this.bindDropdowns();
    }

    measure() {
      document.documentElement.style.setProperty('--header-height', this.offsetHeight + 'px');
    }

    onScroll() {
      var current = window.scrollY;
      this.classList.toggle('is-stuck', current > 8);
      if (this.revealOnScroll && current > 200) {
        this.classList.toggle('is-hidden', current > this.lastScroll);
      } else {
        this.classList.remove('is-hidden');
      }
      this.lastScroll = current;
    }

    bindMenu() {
      var nav = this.querySelector('[data-mobile-nav]');
      var toggle = this.querySelector('[data-menu-toggle]');
      if (!nav || !toggle) return;
      var release = null;

      var open = function () {
        nav.hidden = false;
        window.requestAnimationFrame(function () { nav.classList.add('is-open'); });
        toggle.setAttribute('aria-expanded', 'true');
        utils.lockScroll(true);
        release = utils.trapFocus(nav, toggle);
      };

      var close = function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        utils.lockScroll(false);
        if (release) { release(); release = null; }
        window.setTimeout(function () { nav.hidden = true; }, 260);
      };

      toggle.addEventListener('click', function () {
        if (nav.hidden) open(); else close();
      });

      Array.prototype.forEach.call(this.querySelectorAll('[data-menu-close]'), function (button) {
        button.addEventListener('click', close);
      });

      nav.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') close();
      });
    }

    bindSearch() {
      var panel = this.querySelector('[data-search-panel]');
      var toggle = this.querySelector('[data-search-toggle]');
      if (!panel || !toggle) return;
      var release = null;

      toggle.addEventListener('click', function () {
        var isOpen = !panel.hidden;
        if (isOpen) {
          panel.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          if (release) { release(); release = null; }
          window.setTimeout(function () { panel.hidden = true; }, 220);
        } else {
          panel.hidden = false;
          window.requestAnimationFrame(function () { panel.classList.add('is-open'); });
          toggle.setAttribute('aria-expanded', 'true');
          release = utils.trapFocus(panel, toggle);
        }
      });

      panel.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') toggle.click();
      });
    }

    bindDropdowns() {
      var details = this.querySelectorAll('[data-nav-details]');
      Array.prototype.forEach.call(details, function (node) {
        var summary = node.querySelector('summary');
        var closeTimer;

        node.addEventListener('mouseenter', function () {
          window.clearTimeout(closeTimer);
          if (window.matchMedia('(min-width: 990px)').matches) node.open = true;
        });

        node.addEventListener('mouseleave', function () {
          if (!window.matchMedia('(min-width: 990px)').matches) return;
          closeTimer = window.setTimeout(function () { node.open = false; }, 120);
        });

        node.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && node.open) {
            node.open = false;
            if (summary) summary.focus();
          }
        });

        document.addEventListener('click', function (event) {
          if (node.open && !node.contains(event.target)) node.open = false;
        });
      });
    }
  }

  /* -------------------------------------------------------- announcements */

  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.slides = Array.prototype.slice.call(this.querySelectorAll('[data-announcement-slide]'));
      if (this.slides.length < 2) return;

      this.index = 0;
      this.next = this.next.bind(this);

      var prevButton = this.querySelector('[data-announcement-prev]');
      var nextButton = this.querySelector('[data-announcement-next]');
      if (prevButton) prevButton.addEventListener('click', this.previous.bind(this));
      if (nextButton) nextButton.addEventListener('click', this.next);

      if (this.dataset.autorotate === 'true' && !utils.prefersReducedMotion()) {
        this.start();
        this.addEventListener('mouseenter', this.stop.bind(this));
        this.addEventListener('mouseleave', this.start.bind(this));
        this.addEventListener('focusin', this.stop.bind(this));
        this.addEventListener('focusout', this.start.bind(this));
      }
    }

    disconnectedCallback() { this.stop(); }

    start() {
      this.stop();
      var speed = parseInt(this.dataset.speed, 10) || 5000;
      this.timer = window.setInterval(this.next, speed);
    }

    stop() {
      if (this.timer) window.clearInterval(this.timer);
    }

    show(index) {
      var total = this.slides.length;
      this.index = (index + total) % total;
      this.slides.forEach(function (slide, i) {
        var active = i === this.index;
        slide.classList.toggle('is-active', active);
        if (active) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
      }, this);
    }

    next() { this.show(this.index + 1); }
    previous() { this.show(this.index - 1); }
  }

  /* ------------------------------------------------------- quantity input */

  class QuantityInput extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('[data-quantity-input]');
      if (!this.input) return;

      this.addEventListener('click', function (event) {
        var button = event.target.closest('button[name="plus"], button[name="minus"]');
        if (!button) return;
        event.preventDefault();
        var step = button.name === 'plus' ? 1 : -1;
        var min = parseInt(this.input.min, 10);
        var next = (parseInt(this.input.value, 10) || 0) + step;
        if (!isNaN(min) && next < min) next = min;
        var max = parseInt(this.input.max, 10);
        if (!isNaN(max) && next > max) next = max;
        this.input.value = next;
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      }.bind(this));
    }
  }

  /* --------------------------------------------------------- quick add */

  class ProductQuickAdd extends HTMLElement {
    connectedCallback() {
      var form = this.querySelector('[data-quick-add-form]');
      if (form) bindAddToCartForm(form);
    }
  }

  function bindAddToCartForm(form) {
    if (form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var button = form.querySelector('[type="submit"]');
      var original = button ? button.innerHTML : '';

      if (button) {
        button.setAttribute('aria-disabled', 'true');
        button.innerHTML = '<span class="spinner"></span>';
      }

      var formData = new FormData(form);
      var payload = { items: [] };
      var item = { quantity: parseInt(formData.get('quantity'), 10) || 1, id: formData.get('id') };
      var properties = {};
      var sellingPlan = formData.get('selling_plan');

      formData.forEach(function (value, key) {
        var match = key.match(/^properties\[(.+)\]$/);
        if (match && String(value).trim() !== '') properties[match[1]] = value;
      });

      if (Object.keys(properties).length) item.properties = properties;
      if (sellingPlan) item.selling_plan = sellingPlan;
      payload.items.push(item);

      cartApi.add(payload)
        .then(function () { return cartApi.get(); })
        .then(function (cart) {
          cartApi.publish(cart);
          utils.announce(strings.addedToCart);
          document.dispatchEvent(new CustomEvent('bends:cart:added', { detail: { cart: cart } }));
          if (button) { button.removeAttribute('aria-disabled'); button.innerHTML = original; }
        })
        .catch(function (error) {
          var message = (error && error.description) || strings.cartError;
          utils.announce(message);
          var errorNode = form.querySelector('[data-form-error]');
          if (errorNode) { errorNode.textContent = message; errorNode.hidden = false; }
          if (button) { button.removeAttribute('aria-disabled'); button.innerHTML = original; }
        });
    });
  }

  Theme.bindAddToCartForm = bindAddToCartForm;

  /* -------------------------------------------------------- cart drawer */

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.release = null;
      this.open = this.open.bind(this);
      this.close = this.close.bind(this);

      Array.prototype.forEach.call(this.querySelectorAll('[data-cart-close]'), function (node) {
        node.addEventListener('click', this.close);
      }, this);

      this.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') this.close();
      }.bind(this));

      document.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-cart-trigger]');
        if (!trigger || Theme.cartType !== 'drawer') return;
        event.preventDefault();
        this.open();
      }.bind(this));

      document.addEventListener('bends:cart:added', function () {
        this.refresh().then(this.open);
      }.bind(this));

      cartApi.subscribe(this.refresh.bind(this));
      this.bindContents();
    }

    open() {
      this.hidden = false;
      window.requestAnimationFrame(function () { this.classList.add('is-open'); }.bind(this));
      utils.lockScroll(true);
      var panel = this.querySelector('.cart-drawer__panel');
      this.release = utils.trapFocus(panel || this, document.activeElement);
    }

    close() {
      this.classList.remove('is-open');
      utils.lockScroll(false);
      if (this.release) { this.release(); this.release = null; }
      window.setTimeout(function () { this.hidden = true; }.bind(this), 300);
    }

    /** Re-render from the live cart page so Liquid stays the single source of truth. */
    refresh() {
      return utils.fetchSection(Theme.routes.root + '?section_id=cart-drawer')
        .then(function (html) {
          var doc = utils.parseHTML(html);
          var fresh = doc.querySelector('cart-drawer');
          if (!fresh) return;

          var body = this.querySelector('[data-cart-body]');
          var freshBody = fresh.querySelector('[data-cart-body]');
          if (body && freshBody) body.innerHTML = freshBody.innerHTML;

          var foot = this.querySelector('.cart-drawer__foot');
          var freshFoot = fresh.querySelector('.cart-drawer__foot');
          if (freshFoot && foot) {
            foot.innerHTML = freshFoot.innerHTML;
          } else if (freshFoot && !foot) {
            this.querySelector('.cart-drawer__panel').appendChild(freshFoot);
          } else if (!freshFoot && foot) {
            foot.remove();
          }

          var count = this.querySelector('[data-cart-count-text]');
          var freshCount = fresh.querySelector('[data-cart-count-text]');
          if (count && freshCount) count.textContent = freshCount.textContent;

          this.bindContents();
          initReveals(this);
        }.bind(this))
        .catch(function () { /* leave the drawer as it is rather than blanking it */ });
    }

    bindContents() {
      Array.prototype.forEach.call(this.querySelectorAll('[data-quick-add-form]'), bindAddToCartForm);
      bindCartControls(this);
    }
  }

  /** Quantity, removal, notes, discount code and terms — shared by drawer and page. */
  function bindCartControls(scope) {
    if (!scope || scope.dataset.cartBound === 'true') return;
    scope.dataset.cartBound = 'true';

    scope.addEventListener('change', function (event) {
      var input = event.target.closest('[data-quantity-input]');
      if (input) {
        var line = input.closest('[data-cart-item]');
        if (!line) return;
        setBusy(line, true);
        cartApi.change({ line: parseInt(line.dataset.line, 10), quantity: parseInt(input.value, 10) })
          .then(function (cart) { cartApi.publish(cart); refreshCartRegions(cart); })
          .catch(function () { utils.announce(strings.cartError); setBusy(line, false); });
        return;
      }

      var note = event.target.closest('[data-cart-note]');
      if (note) {
        cartApi.update({ note: note.value }).then(function () { utils.announce(strings.savedNote || ''); });
      }
    });

    scope.addEventListener('click', function (event) {
      var remove = event.target.closest('[data-cart-remove]');
      if (remove) {
        event.preventDefault();
        var line = remove.closest('[data-cart-item]');
        if (!line) return;
        setBusy(line, true);
        cartApi.change({ line: parseInt(line.dataset.line, 10), quantity: 0 })
          .then(function (cart) { cartApi.publish(cart); refreshCartRegions(cart); })
          .catch(function () { utils.announce(strings.cartError); setBusy(line, false); });
        return;
      }

      var applyDiscount = event.target.closest('[data-discount-apply]');
      if (applyDiscount) {
        event.preventDefault();
        var field = scope.querySelector('[data-discount-input]');
        var status = scope.querySelector('[data-discount-status]');
        if (field && field.value.trim()) {
          utils.storage.set('bends:discount', field.value.trim());
          if (status) status.hidden = false;
        }
        return;
      }

      var checkout = event.target.closest('[data-checkout-button]');
      if (checkout) {
        var terms = scope.querySelector('[data-cart-terms]');
        var termsError = scope.querySelector('[data-terms-error]');
        if (terms && !terms.checked) {
          event.preventDefault();
          if (termsError) termsError.hidden = false;
          terms.focus();
          utils.announce(strings.termsError || '');
          return;
        }
        if (termsError) termsError.hidden = true;

        var code = utils.storage.get('bends:discount', '');
        if (code) {
          event.preventDefault();
          window.location.href = Theme.routes.root + 'discount/' + encodeURIComponent(code) + '?redirect=/checkout';
        }
      }
    });
  }

  function setBusy(node, busy) {
    node.classList.toggle('is-busy', busy);
    node.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  /** Update every part of the page that shows cart state. */
  function refreshCartRegions(cart) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-cart-count]'), function (node) {
      node.textContent = cart.item_count;
      node.classList.toggle('is-empty', cart.item_count === 0);
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-cart-subtotal]'), function (node) {
      node.textContent = utils.formatMoney(cart.total_price);
    });

    var drawer = document.querySelector('cart-drawer');
    if (drawer && typeof drawer.refresh === 'function') drawer.refresh();

    if (document.body.classList.contains('template-cart')) {
      var main = document.querySelector('[data-cart-page]');
      if (main) {
        utils.fetchSection(Theme.routes.cart + '?section_id=main-cart').then(function (html) {
          var doc = utils.parseHTML(html);
          var fresh = doc.querySelector('[data-cart-page]');
          if (fresh) {
            main.innerHTML = fresh.innerHTML;
            main.dataset.cartBound = 'false';
            bindCartControls(main);
            initReveals(main);
          }
        });
      }
    }
  }

  cartApi.subscribe(refreshCartRegions);

  /* ---------------------------------------------------- predictive search */

  class PredictiveSearchForm extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('[data-search-input]');
      this.results = this.querySelector('[data-search-results]');
      this.reset = this.querySelector('[data-search-reset]');
      if (!this.input || !this.results) return;

      this.cache = {};
      this.onInput = utils.debounce(this.search.bind(this), 250);
      this.input.addEventListener('input', this.onInput);
      this.input.addEventListener('focus', this.onInput);

      if (this.reset) {
        this.reset.addEventListener('click', function () {
          this.input.value = '';
          this.hideResults();
          this.input.focus();
        }.bind(this));
      }

      document.addEventListener('click', function (event) {
        if (!this.contains(event.target)) this.hideResults();
      }.bind(this));

      this.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { this.hideResults(); this.input.focus(); }
      }.bind(this));
    }

    hideResults() {
      this.results.hidden = true;
      this.results.innerHTML = '';
      this.input.setAttribute('aria-expanded', 'false');
      if (this.reset) this.reset.hidden = true;
    }

    search() {
      var term = this.input.value.trim();
      if (this.reset) this.reset.hidden = term.length === 0;

      if (this.dataset.enabled !== 'true' || term.length < 2) {
        this.hideResults();
        return;
      }

      if (this.cache[term]) {
        this.render(this.cache[term]);
        return;
      }

      var params = new URLSearchParams();
      params.set('q', term);
      params.set('section_id', 'predictive-search');
      params.set('resources[limit]', this.dataset.limit || '4');
      params.set('resources[limit_scope]', 'each');

      fetch(Theme.routes.predictiveSearch + '?' + params.toString())
        .then(function (response) { return response.text(); })
        .then(function (html) {
          var doc = utils.parseHTML(html);
          var content = doc.querySelector('[data-predictive-results]');
          var markup = content ? content.innerHTML : '';
          this.cache[term] = markup;
          this.render(markup);
        }.bind(this))
        .catch(function () { this.hideResults(); }.bind(this));
    }

    render(markup) {
      if (!markup || !markup.trim()) {
        this.results.innerHTML = '<p class="search-form__empty text-small text-muted">' + (strings.searchNoResults || '') + '</p>';
      } else {
        this.results.innerHTML = markup;
      }
      this.results.hidden = false;
      this.input.setAttribute('aria-expanded', 'true');
    }
  }

  /* ---------------------------------------------------------- quick view */

  class QuickViewModal extends HTMLElement {
    connectedCallback() {
      this.body = this.querySelector('[data-quick-view-body]');
      this.release = null;
      this.close = this.close.bind(this);

      Array.prototype.forEach.call(this.querySelectorAll('[data-quick-view-close]'), function (node) {
        node.addEventListener('click', this.close);
      }, this);

      this.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') this.close();
      }.bind(this));

      document.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-quick-view]');
        if (!trigger) return;
        event.preventDefault();
        this.load(trigger.dataset.productUrl, trigger);
      }.bind(this));
    }

    load(url, trigger) {
      if (!url || !this.body) return;
      this.hidden = false;
      window.requestAnimationFrame(function () { this.classList.add('is-open'); }.bind(this));
      utils.lockScroll(true);
      this.body.innerHTML = '<div class="quick-view__loading"><span class="spinner"></span></div>';

      utils.fetchSection(url + (url.indexOf('?') === -1 ? '?' : '&') + 'section_id=quick-view-product')
        .then(function (html) {
          var doc = utils.parseHTML(html);
          var content = doc.querySelector('[data-quick-view-content]');
          this.body.innerHTML = content ? content.innerHTML : '';
          this.release = utils.trapFocus(this.querySelector('.quick-view__panel'), trigger);
          document.dispatchEvent(new CustomEvent('bends:quickview:loaded', { detail: { root: this.body } }));
          initReveals(this.body);
        }.bind(this))
        .catch(function () {
          this.body.innerHTML = '<p class="text-small">' + (strings.cartError || '') + '</p>';
        }.bind(this));
    }

    close() {
      this.classList.remove('is-open');
      utils.lockScroll(false);
      if (this.release) { this.release(); this.release = null; }
      window.setTimeout(function () {
        this.hidden = true;
        if (this.body) this.body.innerHTML = '';
      }.bind(this), 260);
    }
  }

  /* ------------------------------------------------------ page furniture */

  function initBackToTop() {
    var button = document.querySelector('[data-back-to-top]');
    if (!button) return;

    var onScroll = function () {
      button.hidden = window.scrollY < 600;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: utils.prefersReducedMotion() ? 'auto' : 'smooth' });
      var main = document.getElementById('MainContent');
      if (main) main.focus();
    });
  }

  function initScrollProgress() {
    var bar = document.querySelector('[data-scroll-progress]');
    if (!bar) return;

    var update = function () {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = height > 0 ? (window.scrollY / height) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, ratio)) + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', utils.debounce(update, 150));
    update();
  }

  function initThemeToggle() {
    var toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
      var root = document.documentElement;
      var current = root.getAttribute('data-bends-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var mode = root.getAttribute('data-dark-mode');
      var isDark = current === 'dark' || (!current && mode === 'auto_toggle' && prefersDark);
      var next = isDark ? 'light' : 'dark';

      root.setAttribute('data-bends-theme', next);
      toggle.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
      utils.storage.set('bends:theme', next);
    });
  }

  function initLocalization() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-localization-select]'), function (select) {
      select.addEventListener('change', function () {
        var form = select.closest('form');
        if (form) form.submit();
      });
    });
  }

  /* --------------------------------------------------------------- boot */

  function defineElement(name, constructor) {
    if (!window.customElements.get(name)) window.customElements.define(name, constructor);
  }

  defineElement('site-header', SiteHeader);
  defineElement('announcement-bar', AnnouncementBar);
  defineElement('quantity-input', QuantityInput);
  defineElement('product-quick-add', ProductQuickAdd);
  defineElement('cart-drawer', CartDrawer);
  defineElement('predictive-search-form', PredictiveSearchForm);
  defineElement('quick-view-modal', QuickViewModal);

  function boot() {
    initReveals();
    initBackToTop();
    initScrollProgress();
    initThemeToggle();
    initLocalization();
    bindCartControls(document.querySelector('[data-cart-page]'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-quick-add-form]'), bindAddToCartForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* The theme editor swaps section markup in place — rebind when it does. */
  document.addEventListener('shopify:section:load', function (event) {
    initReveals(event.target);
    initLocalization();
    Array.prototype.forEach.call(event.target.querySelectorAll('[data-quick-add-form]'), bindAddToCartForm);
  });
})();
