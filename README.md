# Bends

A Shopify Online Store 2.0 theme built for conversion, Hebrew-first, with the
CRO toolkit that stores usually rent from a shelf of paid apps built into the
theme itself.

`shopify theme check --fail-level warning` runs clean: **0 errors, 0 warnings.**

---

## Installing

1. Download or build `bends.zip` (see [Packaging](#packaging)).
2. In the Shopify admin: **Online Store → Themes → Add theme → Upload zip file**.
3. Open **Customize** and work through [First run](#first-run).

The theme has no build step and no dependencies. What is in the repository is
what runs.

---

## What makes it not look like a template

Roughly nine in ten Shopify stores run one of a handful of themes, and shoppers
recognise a stock storefront quickly. Bends is built so that two shops using it
have no reason to resemble each other.

**The signature shape.** One setting — **Layout and shape → Media frame shape** —
switches every image frame, card and overlay in the theme between an arch, a cut
notch, a pill, a rounded rectangle or a hard square. The arch is the default and
it is the thing people will remember. It is one decision that changes the whole
storefront's silhouette.

**The ink accent.** Section headings can carry a hand-drawn stroke under their
last word — brush, scribble, straight rule or double rule. It is drawn in CSS
from an SVG mask, so it inherits the accent colour and costs nothing to load.

**The offset grid.** Product and collection grids can stagger alternate cards
down the page, so a row of products reads as an editorial layout rather than a
spreadsheet. Switch it off per section if you would rather it did not.

**Four starting personalities.** `Atelier` (warm editorial, the default),
`Noir` (square, uppercase, high contrast, dark mode on), `Bloom` (soft, pill
shapes, generous shadows) and `Kinetic` (hard offsets, heavy type, notched
corners). Pick one in **Theme settings → the preset dropdown at the top**, then
change anything you like from there.

Everything else — colour, type, radius, spacing, shadow, animation, button
behaviour — is a setting. There is no hard-coded colour or size anywhere in the
stylesheets; they are all read from CSS custom properties that
`snippets/css-variables.liquid` generates from your settings.

---

## First run

Six things to set before you launch.

| Where | What |
| --- | --- |
| Theme settings → Brand | Logo, favicon, social links |
| Theme settings → Colours | Pick a preset, then adjust the five schemes |
| Theme settings → Cart | Free shipping threshold, terms page |
| Theme settings → Compliance | Privacy policy page, accessibility statement page, accessibility coordinator |
| Theme settings → Analytics | GA4, Meta and TikTok IDs (they stay off until a visitor consents) |
| Online Store → Menus | `main-menu` and `footer` |

Then, in the Shopify admin rather than the theme editor:

- **Search and discovery** — turn on the filters you want the collection page to offer.
- **Shipping** — create the free-shipping rate that matches your cart threshold.
- **Discounts** — create the automatic discounts behind quantity breaks, free gifts and cart milestones.

The theme shows shoppers these offers; the admin is what actually honours them
at checkout. Bends never promises a discount it cannot deliver.

---

## Hebrew and right to left

Hebrew is the default locale. `locales/he.default.json` ships as the default and
`locales/en.json` mirrors it key for key.

The layout sets `dir="rtl"` automatically for Hebrew, Arabic, Persian, Urdu and
the other right-to-left locales Shopify supports. There is no separate RTL
stylesheet: every rule uses logical properties (`margin-inline-start`,
`inset-inline-end`, `padding-block`) so one stylesheet serves both directions.
The handful of things that genuinely cannot be expressed logically — the notch
clip path, marquee direction, arrow icons — are mirrored explicitly.

To edit storefront wording without touching code: **Online Store → Themes →
… → Edit default theme content**.

To sell in English too, add the language under **Settings → Languages** and the
selector appears in the header and footer on its own.

> Section and setting labels inside the theme editor are in English. Storefront
> text — everything a shopper reads — is fully translated, and that is what the
> locale files cover. Adding Hebrew editor labels means moving every schema label
> to `t:` keys with matching `*.schema.json` locale files; the structure is ready
> for it, but it is not done.

---

## What is built in

### Product page — 43 draggable blocks

Breadcrumbs · vendor · title · price · star rating · SKU · live stock with a
depletion bar · description · variant picker (swatches, buttons or dropdowns) ·
quantity · quantity breaks · buy buttons · subscriptions · urgency text · live
viewer count · countdown · delivery estimate · delivery steps · local pickup ·
benefits list · icon row · payment and security badges · share · size guide with
a cm/inch converter · popup · collapsible rows · tabs · goes-well-with ·
bundle builder · single upsell · free gift by quantity · copyable discount code ·
comparison table · personalisation field · review score line · text · image ·
video · button · jump links · separator · custom Liquid · app blocks.

Plus, as theme settings: a sticky add-to-cart bar, price inside the button, four
zoom modes, five gallery layouts, and a sold-out path that always offers a back
in stock reminder and similar products rather than a dead end.

### Sections — 30 of them

Hero (image, uploaded video or gradient background) · slideshow · image with
text · multi-column · multi-row · collage · rich text · featured collection ·
featured product · collection list · testimonials · featured-on logos · results
counters · timeline · pricing table · comparison table · before-and-after slider ·
shoppable image with hotspots · customer gallery · scrolling text · video ·
newsletter · blog posts · collapsible content · order tracking · wishlist ·
recently viewed · related products · custom Liquid · dividers · icon bar · apps.

### Cart

Slide-out drawer, cart page or confirmation popup. Free shipping progress with
optional extra reward milestones, in-cart upsells, discount code field, order
note, per-line and total savings, a cart hold timer, payment and security badges,
and a terms tick box that blocks checkout until it is ticked — commonly required
for Israeli storefronts.

### Without a single app

Wishlist and recently-viewed (stored in the visitor's own browser), quick view,
quick add, predictive search, AJAX filtering, back in stock requests, exit-intent
popup, spin to win, dark mode, skeleton loading, scroll progress, and structured
data for products, offers, ratings, breadcrumbs, articles and the organisation.

---

## Compliance

Two tools ship for Israeli obligations, and both are groundwork rather than
compliance in a box.

**Cookie consent** (Privacy Protection Law Amendment 13 in mind). Accept, decline
or choose by category. The choice is handed to Shopify's own
`customerPrivacy.setTrackingConsent`, so declining genuinely stops tracking
rather than hiding a bar. `assets/analytics.js` requests no tag at all until
consent exists — decline, or simply never answer, and GA4, Meta and TikTok are
never loaded.

**Accessibility tools.** A floating panel offering text size, high contrast,
inverted colours, greyscale, highlighted links, a readable font, stopped
animations, a large cursor and a reading guide. Choices persist between visits.

Underneath the panel, the storefront itself is built to be accessible: semantic
landmarks, real headings, visible focus rings, keyboard-reachable menus and
dialogs with focus trapping, 24px minimum touch targets, `prefers-reduced-motion`
respected everywhere, and alt text on every image.

> **Please read this part.** A widget is not an accessibility statement and a
> banner is not a privacy policy. Israeli law expects a real accessibility audit,
> a published accessibility statement, a named coordinator, and a privacy policy
> written for your actual data practices. These tools give your developer a
> running start; they do not replace legal advice or an audit, and this README is
> not legal advice either.

---

## Performance

What the theme does: one CSS file for tokens and layout plus one for components,
four deferred scripts, no external libraries, no web font requests beyond
Shopify's own font CDN, `srcset` and explicit dimensions on every image, lazy
loading everywhere except the hero, and a click-to-load facade for YouTube and
Vimeo so an external player never costs anything on first paint.

What is not claimed: a measured Core Web Vitals score. LCP depends on your
images, your apps and your traffic. Run PageSpeed Insights against your own
store after you have added real content, and treat the hero image as the first
thing to optimise.

---

## Development

```bash
npm install -g @shopify/cli
gem install liquid

.dev/validate.sh          # the full acceptance run
.dev/check.sh             # theme check, compact output
.dev/parse_liquid.rb      # compile every template with the real Liquid engine
```

`theme check` is static analysis — it never compiles a template. A filter used
inside an `if` condition, a `}` sitting inside a string inside `{{ }}`, or a
filter passed as a tag argument all sail past it and only fail when a shopper
loads the page. `parse_liquid.rb` runs the real parser over all 111 templates,
so those never ship again.

Three files are generated and should not be edited by hand:

| File | Generator |
| --- | --- |
| `config/settings_data.json` | `.dev/build_settings_data.py` |
| `locales/he.default.json` | `.dev/build_locales.py` |
| `locales/en.json` | `.dev/build_locales.py` |

`build_settings_data.py` also validates the schema as it runs — duplicate setting
ids, select defaults that are not in their own options list, range defaults that
are unreachable or exceed Shopify's 101-step limit, and colour roles pointing at
settings that do not exist all fail the build rather than reaching a merchant.

`build_locales.py` emits both languages from one table, so a key can never exist
in one language and not the other.

`check_contrast.py` verifies every shipped palette against WCAG, including the
derived control-border colour.

### Demo content language

The theme's default locale is Hebrew, so every schema `default` that a shopper
sees ships in Hebrew and a fresh install reads coherently right to left. Setting
labels, section names and the info text explaining a setting stay in English —
those are admin-facing.

### Packaging

```bash
zip -r bends.zip . -x '.git/*' '.dev/*' '*.zip' '.gitignore' '.theme-check.yml'
```

---

## Honest limits

Things the theme deliberately does not pretend to do:

- **Reviews.** The star rating and structured data read Shopify's standard
  `reviews.rating` metafields, so any review app that writes to them works with
  no theme changes. Bends does not collect or store reviews itself.
- **Subscriptions.** The picker appears when a product has selling plans. Creating
  selling plans needs a subscription app — that is Shopify's architecture, not a
  gap here.
- **Referrals and loyalty.** Share links and a panel are here; tracking who
  referred whom needs a backend.
- **Third-party review feeds and TikTok feeds.** Trustpilot, Facebook and TikTok
  embeds need those platforms' own scripts. Use the custom Liquid block, and put
  it behind marketing consent.
- **Live chat.** Paste the provider's embed into **Theme settings → Custom code →
  before the closing body tag**.
- **Urgency.** The countdown takes a real end date and the stock counter reads
  real inventory. The live viewer block shows a range you choose rather than a
  measured figure, and it says so in the editor. Set it honestly for your traffic
  or leave it out.
