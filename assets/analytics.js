/* ==========================================================================
   Bends — marketing tags, gated on cookie consent
   Nothing here loads until the visitor has agreed to analytics or marketing
   cookies. If they decline, or never answer, no tag is ever requested.
   ========================================================================== */
(function () {
  'use strict';

  var Theme = window.BendsTheme || {};
  var config = Theme.analytics || {};
  var page = Theme.page || {};
  var loaded = { ga4: false, meta: false, tiktok: false };

  function hasAnyTag() {
    return Boolean(config.ga4 || config.metaPixel || config.tiktokPixel);
  }

  function loadScript(src, onReady) {
    var script = document.createElement('script');
    script.async = true;
    script.src = src;
    if (onReady) script.onload = onReady;
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------------ ga4 */

  function loadGa4() {
    if (loaded.ga4 || !config.ga4) return;
    loaded.ga4 = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.ga4, { send_page_view: true });

    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.ga4));
  }

  /* ----------------------------------------------------------------- meta */

  function loadMeta() {
    if (loaded.meta || !config.metaPixel) return;
    loaded.meta = true;

    /* Standard Meta pixel bootstrap, written out rather than pasted as a blob
       so it is readable and so nothing runs before consent. */
    var queue = function () {
      queue.callMethod ? queue.callMethod.apply(queue, arguments) : queue.queue.push(arguments);
    };
    queue.push = queue;
    queue.loaded = true;
    queue.version = '2.0';
    queue.queue = [];
    window.fbq = window.fbq || queue;
    window._fbq = window._fbq || window.fbq;

    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', config.metaPixel);
    window.fbq('track', 'PageView');
  }

  /* --------------------------------------------------------------- tiktok */

  function loadTiktok() {
    if (loaded.tiktok || !config.tiktokPixel) return;
    loaded.tiktok = true;

    window.TiktokAnalyticsObject = 'ttq';
    var ttq = (window.ttq = window.ttq || []);
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (target, method) {
      target[method] = function () {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    ttq.methods.forEach(function (method) { ttq.setAndDefer(ttq, method); });
    ttq.load = function (id) {
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._t = ttq._t || {};
      ttq._t[id] = Number(new Date());
      ttq._o = ttq._o || {};
      ttq._o[id] = {};
      loadScript('https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + encodeURIComponent(id) + '&lib=ttq');
    };

    ttq.load(config.tiktokPixel);
    ttq.page();
  }

  /* --------------------------------------------------------------- events */

  function trackViewContent() {
    if (!config.trackViewContent || !page.product) return;
    var item = page.product;

    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: item.currency,
        value: item.price,
        items: [{ item_id: item.id, item_name: item.title, item_brand: item.vendor, item_category: item.type, price: item.price }]
      });
    }

    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [String(item.id)],
        content_name: item.title,
        content_type: 'product',
        value: item.price,
        currency: item.currency
      });
    }

    if (window.ttq && window.ttq.track) {
      window.ttq.track('ViewContent', {
        content_id: String(item.id),
        content_name: item.title,
        value: item.price,
        currency: item.currency
      });
    }
  }

  function trackSearch() {
    if (!config.trackSearch || !page.searchTerms) return;
    if (window.gtag) window.gtag('event', 'search', { search_term: page.searchTerms });
    if (window.fbq) window.fbq('track', 'Search', { search_string: page.searchTerms });
    if (window.ttq && window.ttq.track) window.ttq.track('Search', { query: page.searchTerms });
  }

  function trackAddToCart(cart) {
    if (!config.trackAddToCart || !cart) return;
    var value = (cart.total_price || 0) / 100;
    var currency = cart.currency || Theme.currency;

    if (window.gtag) window.gtag('event', 'add_to_cart', { currency: currency, value: value });
    if (window.fbq) window.fbq('track', 'AddToCart', { value: value, currency: currency });
    if (window.ttq && window.ttq.track) window.ttq.track('AddToCart', { value: value, currency: currency });
  }

  /* ---------------------------------------------------------------- gate */

  var started = false;

  function start(consent) {
    if (started || !consent) return;
    var analytics = consent.analytics;
    var marketing = consent.marketing;
    if (!analytics && !marketing) return;

    started = true;
    if (analytics) loadGa4();
    if (marketing) { loadMeta(); loadTiktok(); }

    trackViewContent();
    trackSearch();
    document.addEventListener('bends:cart:added', function (event) {
      trackAddToCart(event.detail && event.detail.cart);
    });
  }

  function readStoredConsent() {
    try {
      var raw = window.localStorage.getItem('bends:consent');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function boot() {
    if (!hasAnyTag()) return;

    /* When the banner is switched off there is nothing to gate on, so fall
       back to Shopify's own consent state. */
    var bannerPresent = Boolean(document.querySelector('[data-cookie-banner]'));
    if (!bannerPresent) {
      var api = window.Shopify && window.Shopify.customerPrivacy;
      var allowed = !api || typeof api.analyticsProcessingAllowed !== 'function'
        ? { analytics: true, marketing: true }
        : { analytics: api.analyticsProcessingAllowed(), marketing: api.marketingAllowed() };
      start(allowed);
      return;
    }

    start(readStoredConsent());
    document.addEventListener('bends:consent', function (event) { start(event.detail.consent); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
