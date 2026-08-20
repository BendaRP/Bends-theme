/* ==========================================================================
   Bends — product page behaviours
   ========================================================================== */
(function () {
  'use strict';

  var Theme = window.BendsTheme || {};
  var utils = Theme.utils;
  if (!utils) return;
  var strings = Theme.strings || {};

  /* ------------------------------------------------------- variant picker */

  class VariantPicker extends HTMLElement {
    connectedCallback() {
      var dataNode = this.querySelector('[data-variant-data]');
      if (!dataNode) return;

      try {
        this.variants = JSON.parse(dataNode.textContent);
      } catch (error) {
        return;
      }

      this.form = document.getElementById(this.dataset.form);
      this.addEventListener('change', this.onChange.bind(this));
      this.updateAvailability();
    }

    /** The option values currently chosen, in option order. */
    selectedOptions() {
      var values = [];
      var selects = this.querySelectorAll('[data-option-select]');

      if (selects.length) {
        Array.prototype.forEach.call(selects, function (select) {
          values[parseInt(select.dataset.index, 10) - 1] = select.value;
        });
        return values;
      }

      Array.prototype.forEach.call(this.querySelectorAll('[data-option-input]:checked'), function (input) {
        values[parseInt(input.dataset.index, 10) - 1] = input.value;
      });
      return values;
    }

    findVariant(values) {
      return this.variants.find(function (variant) {
        return variant.options.every(function (option, index) { return option === values[index]; });
      });
    }

    onChange() {
      var values = this.selectedOptions();
      var variant = this.findVariant(values);

      this.updateLabels(values);
      this.updateAvailability();

      if (!variant) {
        this.setUnavailable();
        return;
      }

      this.current = variant;
      this.updateForm(variant);
      this.updatePrice(variant);
      this.updateSku(variant);
      this.updateInventory(variant);
      this.updateMedia(variant);
      this.updateUrl(variant);

      document.dispatchEvent(new CustomEvent('bends:variant:changed', { detail: { variant: variant } }));
    }

    updateLabels(values) {
      Array.prototype.forEach.call(this.querySelectorAll('[data-option-value]'), function (node) {
        var index = parseInt(node.dataset.optionValue, 10) - 1;
        if (values[index]) node.textContent = values[index];
      });
    }

    /** Mark impossible combinations so the range still reads clearly. */
    updateAvailability() {
      var values = this.selectedOptions();
      var hide = this.dataset.hideUnavailable === 'true';
      var variants = this.variants;

      Array.prototype.forEach.call(this.querySelectorAll('[data-option-input]'), function (input) {
        var index = parseInt(input.dataset.index, 10) - 1;
        var candidate = values.slice();
        candidate[index] = input.value;

        var match = variants.find(function (variant) {
          return candidate.every(function (value, i) {
            return value === undefined || i === index ? variant.options[i] === candidate[i] : variant.options[i] === value;
          });
        });

        var available = Boolean(match && match.available);
        var label = input.nextElementSibling;
        if (!label) return;

        label.classList.toggle('is-unavailable', !available);
        if (hide) label.hidden = !match;
        label.setAttribute('title', available ? input.value : strings.soldOut || '');
      });
    }

    setUnavailable() {
      var button = this.form && this.form.querySelector('[data-add-to-cart]');
      if (!button) return;
      button.setAttribute('disabled', 'disabled');
      var text = button.querySelector('[data-add-to-cart-text]');
      if (text) text.textContent = strings.unavailable || '';
    }

    updateForm(variant) {
      if (!this.form) return;
      var input = this.form.querySelector('[data-variant-input]');
      if (input) input.value = variant.id;

      var button = this.form.querySelector('[data-add-to-cart]');
      if (!button) return;
      var text = button.querySelector('[data-add-to-cart-text]');

      if (variant.available) {
        button.removeAttribute('disabled');
        if (text) text.textContent = strings.addToCart || '';
      } else {
        button.setAttribute('disabled', 'disabled');
        if (text) text.textContent = strings.soldOut || '';
      }
    }

    updatePrice(variant) {
      var root = document.querySelector('[data-product-info]') || document;
      var price = root.querySelector('.price--large');
      if (!price) return;

      var current = price.querySelector('.price__current');
      if (current) current.textContent = utils.formatMoney(variant.price);

      var compare = price.querySelector('.price__compare');
      var onSale = variant.compare_at_price > variant.price;
      price.classList.toggle('price--on-sale', onSale);

      if (compare) {
        if (onSale) {
          compare.textContent = utils.formatMoney(variant.compare_at_price);
          compare.hidden = false;
        } else {
          compare.hidden = true;
        }
      }

      var savings = price.querySelector('.price__savings');
      if (savings) savings.hidden = !onSale;
    }

    updateSku(variant) {
      var node = document.querySelector('[data-sku-value]');
      if (node) node.textContent = variant.sku || '';
    }

    updateInventory(variant) {
      var block = document.querySelector('[data-inventory-block]');
      if (!block) return;

      var label = block.querySelector('[data-inventory-label]');
      var threshold = parseInt(block.dataset.threshold, 10) || 10;
      if (!label) return;

      if (!variant.available) {
        label.textContent = strings.soldOut || '';
        block.dataset.state = 'out';
      } else if (variant.inventory_management && variant.inventory_quantity > 0 && variant.inventory_quantity <= threshold) {
        label.textContent = String(variant.inventory_quantity);
        block.dataset.state = 'low';
      } else {
        block.dataset.state = 'in';
      }
    }

    updateMedia(variant) {
      if (!variant.featured_media_id) return;
      var gallery = document.querySelector('product-gallery');
      if (gallery && typeof gallery.showMediaId === 'function') gallery.showMediaId(variant.featured_media_id);
    }

    updateUrl(variant) {
      if (this.dataset.updateUrl !== 'true' || !window.history.replaceState) return;
      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }
  }

  /* -------------------------------------------------------------- gallery */

  class ProductGallery extends HTMLElement {
    connectedCallback() {
      this.slides = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-slide]'));
      this.thumbs = Array.prototype.slice.call(this.querySelectorAll('[data-gallery-thumb]'));
      this.index = 0;
      if (!this.slides.length) return;

      this.thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          this.show(parseInt(thumb.dataset.index, 10));
        }.bind(this));
      }, this);

      var prev = this.querySelector('[data-gallery-prev]');
      var next = this.querySelector('[data-gallery-next]');
      if (prev) prev.addEventListener('click', function () { this.show(this.index - 1); }.bind(this));
      if (next) next.addEventListener('click', function () { this.show(this.index + 1); }.bind(this));

      this.bindZoom();
      this.bindSwipe();
    }

    show(index) {
      var total = this.slides.length;
      this.index = (index + total) % total;

      this.slides.forEach(function (slide, i) {
        var active = i === this.index;
        slide.classList.toggle('is-active', active);
        if (active) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');

        if (!active) {
          var video = slide.querySelector('video');
          if (video && !video.paused) video.pause();
        }
      }, this);

      this.thumbs.forEach(function (thumb, i) {
        thumb.classList.toggle('is-active', i === this.index);
        thumb.setAttribute('aria-current', i === this.index ? 'true' : 'false');
      }, this);

      var counter = this.querySelector('[data-gallery-current]');
      if (counter) counter.textContent = this.index + 1;
    }

    showMediaId(mediaId) {
      var target = this.slides.findIndex(function (slide) {
        return String(slide.dataset.mediaId) === String(mediaId);
      });
      if (target > -1) this.show(target);
    }

    bindZoom() {
      var mode = this.dataset.zoom;
      if (mode === 'none') return;

      if (mode === 'lightbox') {
        var lightbox = document.querySelector('[data-lightbox]');
        if (!lightbox) return;
        var release = null;

        this.addEventListener('click', function (event) {
          var trigger = event.target.closest('[data-gallery-zoom]');
          if (!trigger) return;
          lightbox.hidden = false;
          window.requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
          utils.lockScroll(true);
          release = utils.trapFocus(lightbox, trigger);

          var item = lightbox.querySelector('[data-lightbox-item][data-index="' + trigger.dataset.index + '"]');
          if (item) item.scrollIntoView({ block: 'center', behavior: 'auto' });
        });

        var close = function () {
          lightbox.classList.remove('is-open');
          utils.lockScroll(false);
          if (release) { release(); release = null; }
          window.setTimeout(function () { lightbox.hidden = true; }, 240);
        };

        Array.prototype.forEach.call(lightbox.querySelectorAll('[data-lightbox-close]'), function (node) {
          node.addEventListener('click', close);
        });
        lightbox.addEventListener('click', function (event) {
          if (event.target === lightbox) close();
        });
        lightbox.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') close();
        });
        return;
      }

      if (mode === 'hover') {
        this.addEventListener('mousemove', function (event) {
          var frame = event.target.closest('.product-gallery__slide.is-active .frame');
          if (!frame) return;
          var image = frame.querySelector('img');
          if (!image) return;
          var rect = frame.getBoundingClientRect();
          image.style.transformOrigin =
            ((event.clientX - rect.left) / rect.width) * 100 + '% ' +
            ((event.clientY - rect.top) / rect.height) * 100 + '%';
          frame.classList.add('is-magnified');
        });

        this.addEventListener('mouseleave', function () {
          Array.prototype.forEach.call(this.querySelectorAll('.frame'), function (frame) {
            frame.classList.remove('is-magnified');
          });
        }.bind(this));
        return;
      }

      if (mode === 'inline') {
        this.addEventListener('click', function (event) {
          var trigger = event.target.closest('[data-gallery-zoom]');
          if (!trigger) return;
          var frame = trigger.closest('.frame');
          if (frame) frame.classList.toggle('is-magnified');
        });
      }
    }

    bindSwipe() {
      var startX = 0;
      var tracking = false;

      this.addEventListener('touchstart', function (event) {
        startX = event.touches[0].clientX;
        tracking = true;
      }, { passive: true });

      this.addEventListener('touchend', function (event) {
        if (!tracking) return;
        tracking = false;
        var delta = event.changedTouches[0].clientX - startX;
        if (Math.abs(delta) < 45) return;
        var rtl = Theme.direction === 'rtl';
        var forward = rtl ? delta > 0 : delta < 0;
        this.show(this.index + (forward ? 1 : -1));
      }.bind(this), { passive: true });
    }
  }

  /* ----------------------------------------------------------- sticky atc */

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      var form = document.querySelector('[data-product-form]');
      var buyButtons = document.querySelector('[data-buy-buttons]');
      this.select = this.querySelector('[data-sticky-variant]');
      var addButton = this.querySelector('[data-sticky-add]');

      if (addButton && form) {
        addButton.addEventListener('click', function () {
          if (this.select) {
            var variantInput = form.querySelector('[data-variant-input]');
            if (variantInput) variantInput.value = this.select.value;
          }
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }.bind(this));
      }

      document.addEventListener('bends:variant:changed', function (event) {
        if (this.select) this.select.value = event.detail.variant.id;
      }.bind(this));

      if (!buyButtons || !('IntersectionObserver' in window)) return;

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          this.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
        }, this);
      }.bind(this), { rootMargin: '0px 0px -20% 0px' });

      observer.observe(buyButtons);
    }
  }

  /* ---------------------------------------------------------------- tabs */

  class ProductTabs extends HTMLElement {
    connectedCallback() {
      this.tabs = Array.prototype.slice.call(this.querySelectorAll('[role="tab"]'));
      if (!this.tabs.length) return;

      this.tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () { this.select(index); }.bind(this));
        tab.addEventListener('keydown', function (event) {
          var direction = 0;
          if (event.key === 'ArrowRight') direction = Theme.direction === 'rtl' ? -1 : 1;
          if (event.key === 'ArrowLeft') direction = Theme.direction === 'rtl' ? 1 : -1;
          if (event.key === 'Home') { this.select(0); this.tabs[0].focus(); return; }
          if (event.key === 'End') { this.select(this.tabs.length - 1); this.tabs[this.tabs.length - 1].focus(); return; }
          if (!direction) return;
          event.preventDefault();
          var next = (index + direction + this.tabs.length) % this.tabs.length;
          this.select(next);
          this.tabs[next].focus();
        }.bind(this));
      }, this);
    }

    select(index) {
      this.tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.setAttribute('tabindex', active ? '0' : '-1');
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
      });
    }
  }

  /* ------------------------------------------------------------ countdown */

  class CountdownTimer extends HTMLElement {
    connectedCallback() {
      var raw = (this.dataset.deadline || '').trim().replace(' ', 'T');
      this.deadline = new Date(raw).getTime();
      if (isNaN(this.deadline)) { this.hidden = true; return; }

      this.nodes = {
        days: this.querySelector('[data-countdown-days]'),
        hours: this.querySelector('[data-countdown-hours]'),
        minutes: this.querySelector('[data-countdown-minutes]'),
        seconds: this.querySelector('[data-countdown-seconds]')
      };
      this.ended = this.querySelector('[data-countdown-ended]');
      this.clock = this.querySelector('[data-countdown]');

      this.tick();
      this.timer = window.setInterval(this.tick.bind(this), 1000);
    }

    disconnectedCallback() {
      if (this.timer) window.clearInterval(this.timer);
    }

    tick() {
      var remaining = this.deadline - Date.now();

      if (remaining <= 0) {
        window.clearInterval(this.timer);
        if (this.dataset.hideWhenDone === 'true') {
          this.hidden = true;
        } else {
          if (this.clock) this.clock.hidden = true;
          if (this.ended) this.ended.hidden = false;
        }
        return;
      }

      var seconds = Math.floor(remaining / 1000);
      var pad = function (value) { return String(value).padStart(2, '0'); };

      if (this.nodes.days) this.nodes.days.textContent = pad(Math.floor(seconds / 86400));
      if (this.nodes.hours) this.nodes.hours.textContent = pad(Math.floor((seconds % 86400) / 3600));
      if (this.nodes.minutes) this.nodes.minutes.textContent = pad(Math.floor((seconds % 3600) / 60));
      if (this.nodes.seconds) this.nodes.seconds.textContent = pad(seconds % 60);
    }
  }

  /* -------------------------------------------------------------- bundle */

  class ProductBundle extends HTMLElement {
    connectedCallback() {
      this.basePrice = parseInt(this.dataset.basePrice, 10) || 0;
      this.total = this.querySelector('[data-bundle-total]');
      this.addButton = this.querySelector('[data-bundle-add]');

      this.addEventListener('change', this.recalculate.bind(this));
      document.addEventListener('bends:variant:changed', function (event) {
        this.basePrice = event.detail.variant.price;
        this.recalculate();
      }.bind(this));
      this.recalculate();

      if (this.addButton) {
        this.addButton.addEventListener('click', this.addAll.bind(this));
      }
    }

    items() {
      return Array.prototype.slice.call(this.querySelectorAll('[data-bundle-item]:checked'));
    }

    recalculate() {
      var sum = this.items().reduce(function (carry, node) {
        return carry + (parseInt(node.dataset.price, 10) || 0);
      }, this.basePrice);

      if (this.total) this.total.textContent = utils.formatMoney(sum);
    }

    addAll() {
      var items = this.items().map(function (node) {
        return { id: node.dataset.variantId, quantity: 1 };
      });

      if (this.addButton.dataset.baseVariant) {
        items.unshift({ id: this.addButton.dataset.baseVariant, quantity: 1 });
      }
      if (!items.length) return;

      var original = this.addButton.innerHTML;
      this.addButton.innerHTML = '<span class="spinner"></span>';

      Theme.cart.add({ items: items })
        .then(function () { return Theme.cart.get(); })
        .then(function (cart) {
          Theme.cart.publish(cart);
          document.dispatchEvent(new CustomEvent('bends:cart:added', { detail: { cart: cart } }));
          this.addButton.innerHTML = original;
        }.bind(this))
        .catch(function () {
          utils.announce(strings.cartError);
          this.addButton.innerHTML = original;
        }.bind(this));
    }
  }

  /* --------------------------------------------------- pickup availability */

  class PickupAvailability extends HTMLElement {
    connectedCallback() {
      if (!this.dataset.available) return;
      this.fetchAvailability();
      document.addEventListener('bends:variant:changed', function (event) {
        this.dataset.variant = event.detail.variant.id;
        this.fetchAvailability();
      }.bind(this));
    }

    fetchAvailability() {
      var url = this.dataset.baseUrl + 'variants/' + this.dataset.variant + '/?section_id=pickup-availability';
      utils.fetchSection(url)
        .then(function (html) {
          var doc = utils.parseHTML(html);
          var content = doc.querySelector('[data-pickup-content]');
          this.innerHTML = content ? content.innerHTML : '';
        }.bind(this))
        .catch(function () { this.innerHTML = ''; }.bind(this));
    }
  }

  /* ----------------------------------------------------- smaller helpers */

  function initVolumePricing(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-volume-pricing]'), function (widget) {
      widget.addEventListener('click', function (event) {
        var tier = event.target.closest('[data-volume-tier]');
        if (!tier) return;

        Array.prototype.forEach.call(widget.querySelectorAll('[data-volume-tier]'), function (node) {
          var active = node === tier;
          node.classList.toggle('is-active', active);
          node.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        var form = document.querySelector('[data-product-form]');
        var input = document.querySelector('[data-quantity-input][form], [data-product-info] [data-quantity-input]');
        if (input) {
          input.value = tier.dataset.quantity;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (form) {
          var hidden = form.querySelector('input[name="quantity"]');
          if (hidden) hidden.value = tier.dataset.quantity;
        }
      });
    });
  }

  function initDescriptionToggle(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-description-toggle]'), function (button) {
      button.addEventListener('click', function () {
        var description = button.parentElement.querySelector('[data-description]');
        if (!description) return;
        var collapsed = description.classList.toggle('product-description--collapsed');
        button.textContent = collapsed ? strings.showMore || 'Show more' : strings.showLess || 'Show less';
      });
    });
  }

  function initCustomFields(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-custom-field]'), function (field) {
      var counter = field.parentElement.querySelector('[data-custom-field-counter]');
      if (!counter) return;
      var template = counter.textContent;
      var max = parseInt(field.getAttribute('maxlength'), 10) || 0;

      field.addEventListener('input', function () {
        counter.textContent = template.replace(/\d+/, String(max - field.value.length));
      });
    });
  }

  function initShippingEstimate(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-shipping-estimate]'), function (node) {
      var text = node.querySelector('[data-shipping-estimate-text]');
      if (!text) return;

      var cutoff = parseInt(node.dataset.cutoffHour, 10);
      var minDays = parseInt(node.dataset.minDays, 10) || 0;
      var maxDays = parseInt(node.dataset.maxDays, 10) || 0;
      var now = new Date();
      var offset = now.getHours() >= cutoff ? 1 : 0;

      /** Skip weekends so the promised date is one the carrier can actually meet. */
      function addWorkingDays(date, days) {
        var result = new Date(date.getTime());
        var added = 0;
        while (added < days) {
          result.setDate(result.getDate() + 1);
          var day = result.getDay();
          if (day !== 5 && day !== 6) added += 1;
        }
        return result;
      }

      var earliest = addWorkingDays(now, minDays + offset);
      var latest = addWorkingDays(now, maxDays + offset);
      var format = new Intl.DateTimeFormat(document.documentElement.lang || undefined, { weekday: 'long', day: 'numeric', month: 'long' });

      text.textContent = minDays === maxDays
        ? format.format(earliest)
        : format.format(earliest) + ' – ' + format.format(latest);
    });
  }

  function initSocialProof(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-social-proof]'), function (node) {
      var text = node.querySelector('[data-social-proof-text]');
      if (!text || text.textContent.indexOf('{{ count }}') === -1) return;

      var min = parseInt(node.dataset.min, 10) || 2;
      var max = parseInt(node.dataset.max, 10) || 20;
      var template = text.textContent;

      var render = function () {
        var count = Math.floor(Math.random() * (max - min + 1)) + min;
        text.textContent = template.replace('{{ count }}', count);
      };

      render();
      window.setInterval(render, 25000);
    });
  }

  function initFreeGift(scope) {
    var widgets = (scope || document).querySelectorAll('[data-free-gift]');
    if (!widgets.length) return;

    var update = function () {
      var input = document.querySelector('[data-product-info] [data-quantity-input]');
      var quantity = input ? parseInt(input.value, 10) || 1 : 1;

      Array.prototype.forEach.call(widgets, function (widget) {
        var target = parseInt(widget.dataset.quantity, 10) || 0;
        var title = widget.querySelector('[data-free-gift-title]');
        var unlocked = quantity >= target;
        widget.classList.toggle('is-unlocked', unlocked);
        if (!title) return;
        title.textContent = unlocked ? widget.dataset.unlockedText : widget.dataset.lockedText;
      });
    };

    document.addEventListener('change', function (event) {
      if (event.target.matches('[data-quantity-input]')) update();
    });
    update();
  }

  function initComplementary(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-complementary]'), function (node) {
      var list = node.querySelector('[data-complementary-list]');
      if (!list || !node.dataset.url) return;

      utils.fetchSection(node.dataset.url)
        .then(function (html) {
          var doc = utils.parseHTML(html);
          var content = doc.querySelector('[data-recommendations-content]');
          if (content && content.innerHTML.trim()) {
            list.innerHTML = content.innerHTML;
            Theme.initReveals(list);
          } else {
            node.hidden = true;
          }
        })
        .catch(function () { node.hidden = true; });
    });
  }

  function initAnchorLinks(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-anchor-link]'), function (link) {
      link.addEventListener('click', function (event) {
        var id = link.getAttribute('href').slice(1);
        var target = document.getElementById(id) || document.querySelector('[data-anchor="' + id + '"]');
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: utils.prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  function initRecentlyViewed() {
    var node = document.querySelector('[data-recently-viewed-product]');
    if (!node || !Theme.recentlyViewed || !Theme.recentlyViewed.enabled) return;

    var handle;
    try { handle = JSON.parse(node.textContent); } catch (error) { return; }
    if (!handle) return;

    var list = utils.storage.get('bends:recently-viewed', []);
    if (!Array.isArray(list)) list = [];
    list = list.filter(function (item) { return item !== handle; });
    list.unshift(handle);
    utils.storage.set('bends:recently-viewed', list.slice(0, Theme.recentlyViewed.limit || 12));
  }

  /* --------------------------------------------------------------- boot */

  function defineElement(name, constructor) {
    if (!window.customElements.get(name)) window.customElements.define(name, constructor);
  }

  defineElement('variant-picker', VariantPicker);
  defineElement('product-gallery', ProductGallery);
  defineElement('sticky-atc', StickyAtc);
  defineElement('product-tabs', ProductTabs);
  defineElement('countdown-timer', CountdownTimer);
  defineElement('product-bundle', ProductBundle);
  defineElement('pickup-availability', PickupAvailability);

  function boot(scope) {
    initVolumePricing(scope);
    initDescriptionToggle(scope);
    initCustomFields(scope);
    initShippingEstimate(scope);
    initSocialProof(scope);
    initFreeGift(scope);
    initComplementary(scope);
    initAnchorLinks(scope);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(); initRecentlyViewed(); });
  } else {
    boot();
    initRecentlyViewed();
  }

  document.addEventListener('bends:quickview:loaded', function (event) { boot(event.detail.root); });
  document.addEventListener('shopify:section:load', function (event) { boot(event.target); });
})();
