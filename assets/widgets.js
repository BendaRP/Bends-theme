/* ==========================================================================
   Bends — widgets: compliance, growth tools and section behaviours
   ========================================================================== */
(function () {
  'use strict';

  var Theme = window.BendsTheme || {};
  var utils = Theme.utils;
  if (!utils) return;
  var strings = Theme.strings || {};

  var CONSENT_KEY = 'bends:consent';

  /* ------------------------------------------------------ cookie consent */

  class CookieConsent extends HTMLElement {
    connectedCallback() {
      this.preferences = this.querySelector('[data-cookie-preferences]');
      var stored = utils.storage.get(CONSENT_KEY, null);

      if (stored) {
        this.apply(stored, false);
      } else {
        this.reveal();
      }

      var accept = this.querySelector('[data-cookie-accept]');
      var decline = this.querySelector('[data-cookie-decline]');
      var customise = this.querySelector('[data-cookie-customise]');
      var save = this.querySelector('[data-cookie-save]');

      if (accept) {
        accept.addEventListener('click', function () {
          this.apply({ analytics: true, marketing: true, preferences: true }, true);
          this.dismiss();
        }.bind(this));
      }

      if (decline) {
        decline.addEventListener('click', function () {
          this.apply({ analytics: false, marketing: false, preferences: false }, true);
          this.dismiss();
        }.bind(this));
      }

      if (customise) {
        customise.addEventListener('click', function () {
          var panel = this.querySelector('[data-cookie-preferences]');
          if (!panel) return;
          var open = panel.hidden;
          panel.hidden = !open;
          customise.setAttribute('aria-expanded', open ? 'true' : 'false');
        }.bind(this));
      }

      if (save) {
        save.addEventListener('click', function () {
          var choice = {};
          Array.prototype.forEach.call(this.querySelectorAll('[data-cookie-category]'), function (input) {
            choice[input.dataset.cookieCategory] = input.checked;
          });
          this.apply(choice, true);
          this.dismiss();
        }.bind(this));
      }

      document.addEventListener('click', function (event) {
        if (!event.target.closest('[data-cookie-reopen]')) return;
        event.preventDefault();
        this.reveal();
        var panel = this.querySelector('[data-cookie-preferences]');
        if (panel) panel.hidden = false;
      }.bind(this));
    }

    reveal() {
      this.hidden = false;
      window.requestAnimationFrame(function () { this.classList.add('is-open'); }.bind(this));
    }

    dismiss() {
      this.classList.remove('is-open');
      window.setTimeout(function () { this.hidden = true; }.bind(this), 260);
    }

    /** Hand the decision to Shopify so tracking really is gated, not just hidden. */
    apply(choice, persist) {
      if (persist) utils.storage.set(CONSENT_KEY, choice);

      var api = window.Shopify && window.Shopify.customerPrivacy;
      if (api && typeof api.setTrackingConsent === 'function') {
        api.setTrackingConsent(
          {
            analytics: Boolean(choice.analytics),
            marketing: Boolean(choice.marketing),
            preferences: Boolean(choice.preferences),
            sale_of_data: Boolean(choice.marketing)
          },
          function () {}
        );
      }

      document.dispatchEvent(new CustomEvent('bends:consent', { detail: { consent: choice } }));
    }
  }

  /* ------------------------------------------------------ accessibility */

  var A11Y_KEY = 'bends:a11y';

  class AccessibilityTools extends HTMLElement {
    connectedCallback() {
      this.panel = this.querySelector('#AccessibilityPanel');
      this.trigger = this.querySelector('[data-a11y-toggle]');
      this.guide = this.querySelector('[data-a11y-reading-guide]');
      this.state = utils.storage.get(A11Y_KEY, { scale: 100, classes: [], motion: false, guide: false });
      this.release = null;

      this.restore();
      this.bind();
    }

    bind() {
      if (this.trigger) {
        this.trigger.addEventListener('click', function () {
          if (this.panel.hidden) this.open(); else this.close();
        }.bind(this));
      }

      var closeButton = this.querySelector('[data-a11y-close]');
      if (closeButton) closeButton.addEventListener('click', this.close.bind(this));

      this.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !this.panel.hidden) this.close();
      }.bind(this));

      Array.prototype.forEach.call(this.querySelectorAll('[data-a11y-text]'), function (button) {
        button.addEventListener('click', function () {
          var step = button.dataset.a11yText === 'up' ? 10 : -10;
          this.state.scale = Math.min(180, Math.max(80, this.state.scale + step));
          this.applyScale();
          this.persist();
        }.bind(this));
      }, this);

      Array.prototype.forEach.call(this.querySelectorAll('[data-a11y-toggle-class]'), function (button) {
        button.addEventListener('click', function () {
          var name = button.dataset.a11yToggleClass;
          var index = this.state.classes.indexOf(name);
          if (index > -1) this.state.classes.splice(index, 1);
          else this.state.classes.push(name);
          this.applyClasses();
          this.persist();
        }.bind(this));
      }, this);

      var motion = this.querySelector('[data-a11y-motion]');
      if (motion) {
        motion.addEventListener('click', function () {
          this.state.motion = !this.state.motion;
          this.applyMotion();
          this.persist();
        }.bind(this));
      }

      var guideButton = this.querySelector('[data-a11y-guide]');
      if (guideButton) {
        guideButton.addEventListener('click', function () {
          this.state.guide = !this.state.guide;
          this.applyGuide();
          this.persist();
        }.bind(this));
      }

      var reset = this.querySelector('[data-a11y-reset]');
      if (reset) {
        reset.addEventListener('click', function () {
          this.state = { scale: 100, classes: [], motion: false, guide: false };
          this.restore();
          utils.storage.remove(A11Y_KEY);
        }.bind(this));
      }
    }

    open() {
      this.panel.hidden = false;
      this.trigger.setAttribute('aria-expanded', 'true');
      this.release = utils.trapFocus(this.panel, this.trigger);
    }

    close() {
      this.panel.hidden = true;
      this.trigger.setAttribute('aria-expanded', 'false');
      if (this.release) { this.release(); this.release = null; }
    }

    persist() { utils.storage.set(A11Y_KEY, this.state); }

    restore() {
      this.applyScale();
      this.applyClasses();
      this.applyMotion();
      this.applyGuide();
    }

    applyScale() {
      document.documentElement.style.fontSize = this.state.scale + '%';
      var value = this.querySelector('[data-a11y-text-value]');
      if (value) value.textContent = this.state.scale + '%';
    }

    applyClasses() {
      var all = ['a11y-contrast', 'a11y-invert', 'a11y-grayscale', 'a11y-links', 'a11y-readable', 'a11y-cursor'];
      all.forEach(function (name) {
        var on = this.state.classes.indexOf(name) > -1;
        document.documentElement.classList.toggle(name, on);
        var button = this.querySelector('[data-a11y-toggle-class="' + name + '"]');
        if (button) button.setAttribute('aria-pressed', on ? 'true' : 'false');
      }, this);
    }

    applyMotion() {
      document.documentElement.setAttribute('data-motion', this.state.motion ? 'off' : 'on');
      var button = this.querySelector('[data-a11y-motion]');
      if (button) button.setAttribute('aria-pressed', this.state.motion ? 'true' : 'false');
    }

    applyGuide() {
      if (!this.guide) return;
      this.guide.hidden = !this.state.guide;
      var button = this.querySelector('[data-a11y-guide]');
      if (button) button.setAttribute('aria-pressed', this.state.guide ? 'true' : 'false');

      if (this.state.guide && !this.guideBound) {
        this.guideBound = true;
        document.addEventListener('mousemove', function (event) {
          if (this.guide.hidden) return;
          this.guide.style.top = event.clientY + 'px';
        }.bind(this));
      }
    }
  }

  /* ------------------------------------------------------------ wishlist */

  var WISHLIST_KEY = 'bends:wishlist';

  var wishlist = {
    all: function () {
      var list = utils.storage.get(WISHLIST_KEY, []);
      return Array.isArray(list) ? list : [];
    },
    has: function (handle) { return wishlist.all().indexOf(handle) > -1; },
    toggle: function (handle) {
      var list = wishlist.all();
      var index = list.indexOf(handle);
      if (index > -1) list.splice(index, 1);
      else list.push(handle);
      utils.storage.set(WISHLIST_KEY, list);
      document.dispatchEvent(new CustomEvent('bends:wishlist:changed', { detail: { list: list } }));
      return index === -1;
    }
  };

  Theme.wishlist = wishlist;

  function syncWishlistButtons(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-wishlist-toggle]'), function (button) {
      var saved = wishlist.has(button.dataset.productHandle);
      var label = saved ? strings.wishlistRemove : strings.wishlistAdd;
      button.setAttribute('aria-pressed', saved ? 'true' : 'false');
      if (label) {
        button.setAttribute('aria-label', label);
        button.setAttribute('title', label);
      }
    });

    var counts = document.querySelectorAll('[data-wishlist-count]');
    var total = wishlist.all().length;
    Array.prototype.forEach.call(counts, function (node) {
      node.textContent = total;
      node.hidden = total === 0;
    });
  }

  function initWishlist() {
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-wishlist-toggle]');
      if (!button) return;
      event.preventDefault();
      var added = wishlist.toggle(button.dataset.productHandle);
      utils.announce(added ? strings.savedToWishlist : strings.removedFromWishlist);
      syncWishlistButtons();
    });

    document.addEventListener('bends:wishlist:changed', function () { syncWishlistButtons(); });
    syncWishlistButtons();
  }

  /* ------------------------------------------- wishlist and history lists */

  function renderHandleList(container) {
    var source = container.dataset.source;
    var handles = source === 'wishlist'
      ? wishlist.all()
      : (utils.storage.get('bends:recently-viewed', []) || []);

    var empty = container.querySelector('[data-list-empty]');
    var grid = container.querySelector('[data-list-grid]');
    if (!grid) return;

    var exclude = container.dataset.exclude;
    if (exclude) handles = handles.filter(function (handle) { return handle !== exclude; });

    var limit = parseInt(container.dataset.limit, 10) || 8;
    handles = handles.slice(0, limit);

    if (!handles.length) {
      if (empty) empty.hidden = false;
      grid.innerHTML = '';
      container.classList.add('is-empty');
      return;
    }

    if (empty) empty.hidden = true;
    container.classList.remove('is-empty');
    grid.innerHTML = '';

    handles.forEach(function (handle) {
      utils.fetchSection(Theme.routes.root + 'products/' + handle + '?section_id=product-card-fragment')
        .then(function (html) {
          var doc = utils.parseHTML(html);
          var card = doc.querySelector('[data-card-fragment]');
          if (!card) return;
          grid.insertAdjacentHTML('beforeend', card.innerHTML);
          Theme.initReveals(grid);
          syncWishlistButtons(grid);
        })
        .catch(function () { /* a deleted product simply drops out of the list */ });
    });
  }

  function initHandleLists(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-handle-list]'), function (container) {
      renderHandleList(container);

      var clear = container.querySelector('[data-list-clear]');
      if (clear) {
        clear.addEventListener('click', function () {
          utils.storage.remove(container.dataset.source === 'wishlist' ? WISHLIST_KEY : 'bends:recently-viewed');
          renderHandleList(container);
          syncWishlistButtons();
        });
      }

      document.addEventListener('bends:wishlist:changed', function () {
        if (container.dataset.source === 'wishlist') renderHandleList(container);
      });
    });
  }

  /* --------------------------------------------------------------- modal */

  function initModals() {
    document.addEventListener('click', function (event) {
      var opener = event.target.closest('[data-modal-open]');
      if (opener) {
        var modal = document.querySelector('[data-modal="' + opener.dataset.modalOpen + '"]');
        if (!modal) return;
        event.preventDefault();
        modal.hidden = false;
        window.requestAnimationFrame(function () { modal.classList.add('is-open'); });
        utils.lockScroll(true);
        modal.dataset.release = 'true';
        modal.releaseFocus = utils.trapFocus(modal.querySelector('.modal__panel') || modal, opener);
        return;
      }

      var closer = event.target.closest('[data-modal-close]');
      if (closer) {
        var openModal = closer.closest('[data-modal]');
        if (openModal) closeModal(openModal);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      var open = document.querySelector('[data-modal].is-open');
      if (open) closeModal(open);
    });
  }

  function closeModal(modal) {
    modal.classList.remove('is-open');
    utils.lockScroll(false);
    if (modal.releaseFocus) { modal.releaseFocus(); modal.releaseFocus = null; }
    window.setTimeout(function () { modal.hidden = true; }, 240);
  }

  /* ------------------------------------------------- unit switch and copy */

  function initUnitSwitch(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-unit-switch]'), function (widget) {
      var modal = widget.closest('[data-modal]');
      if (!modal) return;
      var body = modal.querySelector('.modal__body');
      if (!body) return;

      var originals = null;

      widget.addEventListener('click', function (event) {
        var button = event.target.closest('[data-unit]');
        if (!button) return;

        Array.prototype.forEach.call(widget.querySelectorAll('[data-unit]'), function (node) {
          var active = node === button;
          node.classList.toggle('is-active', active);
          node.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        var cells = body.querySelectorAll('td, th');
        if (!originals) {
          originals = Array.prototype.map.call(cells, function (cell) { return cell.textContent; });
        }

        Array.prototype.forEach.call(cells, function (cell, index) {
          var original = originals[index];
          if (button.dataset.unit === 'cm') {
            cell.textContent = original;
            return;
          }
          cell.textContent = original.replace(/(\d+(?:[.,]\d+)?)/g, function (match) {
            var number = parseFloat(match.replace(',', '.'));
            if (isNaN(number)) return match;
            return (number / 2.54).toFixed(1);
          });
        });
      });
    });
  }

  function initCopyButtons() {
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-copy]');
      if (!button) return;
      event.preventDefault();
      var value = button.dataset.copy;

      var done = function () {
        button.classList.add('is-copied');
        utils.announce(strings.copied);
        window.setTimeout(function () { button.classList.remove('is-copied'); }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(function () {});
        return;
      }

      var field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'absolute';
      field.style.left = '-9999px';
      document.body.appendChild(field);
      field.select();
      try { document.execCommand('copy'); done(); } catch (error) { /* clipboard unavailable */ }
      document.body.removeChild(field);
    });
  }

  function initNativeShare(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-share]'), function (widget) {
      if (widget.dataset.native !== 'true' || !navigator.share) return;
      var item = widget.querySelector('.share__native');
      if (item) item.hidden = false;

      var button = widget.querySelector('[data-share-native]');
      if (!button) return;
      button.addEventListener('click', function () {
        navigator.share({ title: widget.dataset.title, url: widget.dataset.url }).catch(function () {});
      });
    });
  }

  /* --------------------------------------------------------- before/after */

  class BeforeAfter extends HTMLElement {
    connectedCallback() {
      this.handle = this.querySelector('[data-ba-handle]');
      this.overlay = this.querySelector('[data-ba-overlay]');
      if (!this.handle || !this.overlay) return;

      this.setPosition(parseFloat(this.dataset.start || '50'));

      this.handle.addEventListener('input', function () {
        this.setPosition(parseFloat(this.handle.value));
      }.bind(this));
    }

    setPosition(percent) {
      this.style.setProperty('--ba-position', percent + '%');
      this.handle.value = percent;
      this.handle.setAttribute('aria-valuenow', Math.round(percent));
    }
  }

  /* -------------------------------------------------------------- slider */

  class MediaSlider extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-slider-track]');
      if (!this.track) return;

      this.prev = this.querySelector('[data-slider-prev]');
      this.next = this.querySelector('[data-slider-next]');
      this.dots = Array.prototype.slice.call(this.querySelectorAll('[data-slider-dot]'));
      this.slides = Array.prototype.slice.call(this.track.children);
      this.index = 0;

      if (this.prev) this.prev.addEventListener('click', function () { this.go(this.index - 1); }.bind(this));
      if (this.next) this.next.addEventListener('click', function () { this.go(this.index + 1); }.bind(this));

      this.dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () { this.go(i); }.bind(this));
      }, this);

      this.track.addEventListener('scroll', utils.debounce(this.syncFromScroll.bind(this), 90), { passive: true });

      if (this.dataset.autoplay === 'true' && !utils.prefersReducedMotion()) {
        this.startAutoplay();
        this.addEventListener('mouseenter', this.stopAutoplay.bind(this));
        this.addEventListener('mouseleave', this.startAutoplay.bind(this));
        this.addEventListener('focusin', this.stopAutoplay.bind(this));
      }

      this.update();
    }

    disconnectedCallback() { this.stopAutoplay(); }

    startAutoplay() {
      this.stopAutoplay();
      var speed = parseInt(this.dataset.speed, 10) || 5000;
      this.timer = window.setInterval(function () { this.go(this.index + 1); }.bind(this), speed);
    }

    stopAutoplay() { if (this.timer) window.clearInterval(this.timer); }

    go(index) {
      var total = this.slides.length;
      if (!total) return;
      this.index = (index + total) % total;
      var slide = this.slides[this.index];
      if (!slide) return;

      this.track.scrollTo({
        left: slide.offsetLeft - this.track.offsetLeft,
        behavior: utils.prefersReducedMotion() ? 'auto' : 'smooth'
      });
      this.update();
    }

    syncFromScroll() {
      var scrollStart = Math.abs(this.track.scrollLeft);
      var closest = 0;
      var smallest = Infinity;

      this.slides.forEach(function (slide, i) {
        var distance = Math.abs(Math.abs(slide.offsetLeft - this.track.offsetLeft) - scrollStart);
        if (distance < smallest) { smallest = distance; closest = i; }
      }, this);

      this.index = closest;
      this.update();
    }

    update() {
      this.dots.forEach(function (dot, i) {
        var active = i === this.index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      }, this);

      if (this.dataset.loop === 'false') {
        if (this.prev) this.prev.disabled = this.index === 0;
        if (this.next) this.next.disabled = this.index === this.slides.length - 1;
      }
    }
  }

  /* ----------------------------------------------------------- counters */

  function initCounters(scope) {
    var nodes = (scope || document).querySelectorAll('[data-counter]');
    if (!nodes.length) return;

    if (!('IntersectionObserver' in window) || utils.prefersReducedMotion()) {
      Array.prototype.forEach.call(nodes, function (node) {
        node.textContent = node.dataset.counter;
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var node = entry.target;
        observer.unobserve(node);

        var target = parseFloat(String(node.dataset.counter).replace(/[^0-9.]/g, '')) || 0;
        var suffix = String(node.dataset.counter).replace(/[0-9.,]/g, '');
        var duration = 1400;
        var started = null;

        var step = function (timestamp) {
          if (!started) started = timestamp;
          var progress = Math.min(1, (timestamp - started) / duration);
          var eased = 1 - Math.pow(1 - progress, 3);
          node.textContent = Math.round(target * eased).toLocaleString() + suffix;
          if (progress < 1) window.requestAnimationFrame(step);
        };

        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });

    Array.prototype.forEach.call(nodes, function (node) { observer.observe(node); });
  }

  /* --------------------------------------------------------------- popup */

  class SitePopup extends HTMLElement {
    connectedCallback() {
      this.key = 'bends:popup:' + (this.dataset.popupId || 'default');
      this.panel = this.querySelector('[data-popup-panel]');
      if (utils.storage.get(this.key, false)) return;

      Array.prototype.forEach.call(this.querySelectorAll('[data-popup-close]'), function (node) {
        node.addEventListener('click', this.dismiss.bind(this));
      }, this);

      this.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') this.dismiss();
      }.bind(this));

      var form = this.querySelector('form');
      if (form) {
        form.addEventListener('submit', function () {
          utils.storage.set(this.key, true);
        }.bind(this));
      }

      if (this.dataset.trigger === 'exit') this.bindExitIntent();
      else if (this.dataset.trigger === 'scroll') this.bindScroll();
      else this.bindDelay();
    }

    bindDelay() {
      var delay = (parseInt(this.dataset.delay, 10) || 5) * 1000;
      window.setTimeout(this.reveal.bind(this), delay);
    }

    bindScroll() {
      var threshold = parseInt(this.dataset.scrollPercent, 10) || 40;
      var onScroll = function () {
        var height = document.documentElement.scrollHeight - window.innerHeight;
        if (height <= 0) return;
        if ((window.scrollY / height) * 100 >= threshold) {
          window.removeEventListener('scroll', onScroll);
          this.reveal();
        }
      }.bind(this);
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    bindExitIntent() {
      var onLeave = function (event) {
        if (event.clientY > 12) return;
        document.removeEventListener('mouseleave', onLeave);
        this.reveal();
      }.bind(this);

      /* Touch devices have no cursor to leave the viewport — fall back to a delay. */
      if (window.matchMedia('(pointer: coarse)').matches) {
        window.setTimeout(this.reveal.bind(this), (parseInt(this.dataset.delay, 10) || 20) * 1000);
      } else {
        document.addEventListener('mouseleave', onLeave);
      }
    }

    reveal() {
      if (this.dataset.shown === 'true' || utils.storage.get(this.key, false)) return;
      this.dataset.shown = 'true';
      this.hidden = false;
      window.requestAnimationFrame(function () { this.classList.add('is-open'); }.bind(this));
      this.release = utils.trapFocus(this.panel || this, document.activeElement);
    }

    dismiss() {
      utils.storage.set(this.key, true);
      this.classList.remove('is-open');
      if (this.release) { this.release(); this.release = null; }
      window.setTimeout(function () { this.hidden = true; }.bind(this), 260);
    }
  }

  /* ---------------------------------------------------------- spin to win */

  class SpinWheel extends HTMLElement {
    connectedCallback() {
      this.wheel = this.querySelector('[data-wheel]');
      this.button = this.querySelector('[data-spin]');
      this.result = this.querySelector('[data-spin-result]');
      this.codeNode = this.querySelector('[data-spin-code]');
      this.emailField = this.querySelector('[data-spin-email]');
      this.key = 'bends:spin';

      var previous = utils.storage.get(this.key, null);
      if (previous && this.result) {
        this.showResult(previous.label, previous.code);
      }

      if (this.button) this.button.addEventListener('click', this.spin.bind(this));
    }

    prizes() {
      try {
        return JSON.parse(this.querySelector('[data-prizes]').textContent);
      } catch (error) {
        return [];
      }
    }

    spin() {
      if (this.spinning) return;
      var prizes = this.prizes();
      if (!prizes.length) return;

      if (this.emailField && !this.emailField.checkValidity()) {
        this.emailField.reportValidity();
        return;
      }

      this.spinning = true;
      this.button.disabled = true;

      /* Weighted draw, so a merchant can make the big prize genuinely rare. */
      var totalWeight = prizes.reduce(function (sum, prize) { return sum + (prize.weight || 1); }, 0);
      var roll = Math.random() * totalWeight;
      var index = 0;
      for (var i = 0; i < prizes.length; i += 1) {
        roll -= prizes[i].weight || 1;
        if (roll <= 0) { index = i; break; }
      }

      var segment = 360 / prizes.length;
      var target = 360 * 5 + (360 - (index * segment + segment / 2));

      if (this.wheel && !utils.prefersReducedMotion()) {
        this.wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.16, 1)';
        this.wheel.style.transform = 'rotate(' + target + 'deg)';
      }

      window.setTimeout(function () {
        var prize = prizes[index];
        utils.storage.set(this.key, prize);
        this.showResult(prize.label, prize.code);
        this.spinning = false;
      }.bind(this), utils.prefersReducedMotion() ? 200 : 4100);
    }

    showResult(label, code) {
      if (this.result) {
        this.result.hidden = false;
        var title = this.result.querySelector('[data-spin-title]');
        if (title) title.textContent = label;
      }
      if (this.codeNode) {
        this.codeNode.textContent = code;
        this.codeNode.dataset.copy = code;
      }
      if (this.button) this.button.disabled = true;
    }
  }


  /* -------------------------------------------------------- video facade */

  /* A poster image stands in for the embed until the visitor presses play,
     so an external player never costs anything on first load. */
  class VideoFacade extends HTMLElement {
    connectedCallback() {
      var button = this.querySelector('[data-video-play]');
      var template = this.querySelector('[data-video-embed]');
      if (!button || !template) return;

      button.addEventListener('click', function () {
        var frame = this.querySelector('.frame');
        if (!frame) return;
        frame.innerHTML = template.innerHTML;
        var iframe = frame.querySelector('iframe');
        if (iframe) iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        this.classList.add('is-playing');
      }.bind(this));
    }
  }

  /* ---------------------------------------------------------- sticky cta */

  class StickyCta extends HTMLElement {
    connectedCallback() {
      this.key = 'bends:sticky-cta:dismissed';
      if (utils.storage.get(this.key, false)) return;

      var threshold = parseInt(this.dataset.scrollPercent, 10) || 0;
      var close = this.querySelector('[data-sticky-cta-close]');

      if (close) {
        close.addEventListener('click', function () {
          utils.storage.set(this.key, true);
          this.hidden = true;
        }.bind(this));
      }

      var onScroll = function () {
        var height = document.documentElement.scrollHeight - window.innerHeight;
        var percent = height > 0 ? (window.scrollY / height) * 100 : 100;
        this.hidden = percent < threshold;
      }.bind(this);

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  /* ------------------------------------------------------------- marquee */

  /* Duplicates the track so the loop is seamless, and stops entirely when the
     visitor has asked for reduced motion. */
  function initMarquees(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-marquee]'), function (marquee) {
      var track = marquee.querySelector('[data-marquee-track]');
      if (!track || track.dataset.cloned === 'true') return;

      if (utils.prefersReducedMotion()) {
        marquee.classList.add('is-static');
        return;
      }

      track.dataset.cloned = 'true';
      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('data-marquee-track');
      marquee.appendChild(clone);

      var speed = parseInt(marquee.dataset.speed, 10) || 30;
      marquee.style.setProperty('--marquee-duration', speed + 's');
    });
  }

  /* ----------------------------------------------------------- accordion */

  function initAccordions(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-accordion]'), function (group) {
      if (group.dataset.single !== 'true') return;

      Array.prototype.forEach.call(group.querySelectorAll('details'), function (item) {
        item.addEventListener('toggle', function () {
          if (!item.open) return;
          Array.prototype.forEach.call(group.querySelectorAll('details'), function (other) {
            if (other !== item) other.open = false;
          });
        });
      });
    });
  }

  /* -------------------------------------------------------------- facets */

  function initFacets(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-facets]'), function (facets) {
      var form = facets.querySelector('[data-facet-form]');
      if (!form) return;

      /* With scripting on, changing a filter applies it straight away and the
         explicit Apply button becomes redundant. */
      var apply = facets.querySelector('.facets__apply');
      if (apply) apply.hidden = true;

      var submit = utils.debounce(function () {
        var params = new URLSearchParams(new FormData(form));
        var url = form.action + '?' + params.toString();
        navigate(url, facets);
      }, 350);

      form.addEventListener('change', submit);
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        submit();
      });
    });

    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-facet-toggle]'), function (toggle) {
      var panel = document.getElementById(toggle.getAttribute('aria-controls'));
      if (!panel) return;
      toggle.addEventListener('click', function () {
        var open = panel.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (panel.closest('.collection-layout--drawer')) utils.lockScroll(open);
      });
    });
  }

  /* Swap the grid and the filter panel without a full page load. */
  function navigate(url, facets) {
    var grid = document.querySelector('[data-collection-grid]');
    if (grid) grid.classList.add('is-loading');

    utils.fetchSection(url)
      .then(function (html) {
        var doc = utils.parseHTML(html);

        var freshGrid = doc.querySelector('[data-collection-grid]');
        if (grid && freshGrid) grid.innerHTML = freshGrid.innerHTML;

        var freshFacets = doc.querySelector('[data-facets]');
        if (facets && freshFacets) {
          facets.innerHTML = freshFacets.innerHTML;
          initFacets(facets.parentElement || document);
        }

        var freshChips = doc.querySelector('.facets__active');
        var chips = document.querySelector('.facets__active');
        if (chips && freshChips) chips.innerHTML = freshChips.innerHTML;
        else if (chips && !freshChips) chips.remove();

        window.history.replaceState({}, '', url);
        Theme.initReveals(grid || document);
        syncWishlistButtons(grid || document);
      })
      .catch(function () { window.location.href = url; })
      .then(function () { if (grid) grid.classList.remove('is-loading'); });
  }

  /* ------------------------------------------------------------- hotspots */

  function initHotspots(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-hotspot-toggle]'), function (button) {
      button.addEventListener('click', function () {
        var hotspot = button.closest('.shoppable__hotspot');
        if (!hotspot) return;
        var open = hotspot.classList.toggle('is-open');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (!open) return;
        Array.prototype.forEach.call(document.querySelectorAll('.shoppable__hotspot.is-open'), function (other) {
          if (other === hotspot) return;
          other.classList.remove('is-open');
          var otherButton = other.querySelector('[data-hotspot-toggle]');
          if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  /* ------------------------------------------------------ confirm actions */

  function initConfirmations() {
    document.addEventListener('click', function (event) {
      var target = event.target.closest('[data-confirm]');
      if (!target) return;
      if (!window.confirm(target.dataset.confirm)) event.preventDefault();
    });
  }

  /* --------------------------------------------------------------- boot */

  function defineElement(name, constructor) {
    if (!window.customElements.get(name)) window.customElements.define(name, constructor);
  }

  defineElement('cookie-consent', CookieConsent);
  defineElement('accessibility-tools', AccessibilityTools);
  defineElement('before-after', BeforeAfter);
  defineElement('media-slider', MediaSlider);
  defineElement('site-popup', SitePopup);
  defineElement('spin-wheel', SpinWheel);
  defineElement('video-facade', VideoFacade);
  defineElement('sticky-cta', StickyCta);

  function boot(scope) {
    initHandleLists(scope);
    initUnitSwitch(scope);
    initNativeShare(scope);
    initCounters(scope);
    initMarquees(scope);
    initAccordions(scope);
    initFacets(scope);
    initHotspots(scope);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initWishlist();
      initModals();
      initCopyButtons();
      initConfirmations();
      boot();
    });
  } else {
    initWishlist();
    initModals();
    initCopyButtons();
    initConfirmations();
    boot();
  }

  document.addEventListener('shopify:section:load', function (event) { boot(event.target); });
  document.addEventListener('bends:quickview:loaded', function (event) {
    boot(event.detail.root);
    syncWishlistButtons(event.detail.root);
  });
})();
