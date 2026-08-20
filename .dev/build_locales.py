#!/usr/bin/env python3
"""Emit locales/he.default.json and locales/en.json from a single source.

Hebrew is the default locale, so the storefront reads right-to-left out of the
box. Generating both files from one table means theme-check's MatchingTranslations
rule can never fail on a key that exists in one language but not the other.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Leaves are (hebrew, english). Plural leaves are dicts of form -> (he, en).
T = {
    "general": {
        "meta": {
            "tags": ("מתויג ב־{{ tags }}", "Tagged {{ tags }}"),
            "page": ("עמוד {{ page }}", "Page {{ page }}"),
        },
        "accessibility": {
            "skip_to_text": ("דלג לתוכן", "Skip to content"),
        },
        "search": {
            "search": ("חיפוש", "Search"),
            "placeholder": ("מה מחפשים?", "What are you looking for?"),
            "submit": ("בצע חיפוש", "Search"),
            "reset": ("נקה חיפוש", "Clear search term"),
            "results_with_count": {
                "one": ("תוצאה אחת", "{{ count }} result"),
                "other": ("{{ count }} תוצאות", "{{ count }} results"),
            },
            "no_results": (
                "לא מצאנו תוצאות עבור “{{ terms }}”. אפשר לנסות מילה אחרת או לעיין בקטגוריות.",
                "No results for “{{ terms }}”. Try another word, or browse the categories below.",
            ),
            "no_results_short": ("אין תוצאות", "No results"),
            "suggestions": ("הצעות", "Suggestions"),
            "products": ("מוצרים", "Products"),
            "collections": ("קטגוריות", "Collections"),
            "pages": ("עמודים", "Pages"),
            "articles": ("מאמרים", "Articles"),
            "view_all": ("הצג את כל התוצאות", "View all results"),
            "results_for": ("תוצאות עבור “{{ terms }}”", "Results for “{{ terms }}”"),
        },
        "share": {
            "title": ("שיתוף", "Share"),
            "copy_link": ("העתקת קישור", "Copy link"),
            "copied": ("הקישור הועתק", "Link copied"),
            "share_on": ("שיתוף ב־{{ platform }}", "Share on {{ platform }}"),
            "close": ("סגירת השיתוף", "Close share"),
        },
        "pagination": {
            "label": ("ניווט בין עמודים", "Pagination"),
            "previous": ("הקודם", "Previous"),
            "next": ("הבא", "Next"),
            "page": ("עמוד {{ number }}", "Page {{ number }}"),
        },
        "breadcrumbs": {
            "label": ("מיקום באתר", "Breadcrumb"),
            "home": ("דף הבית", "Home"),
        },
        "password_page": {
            "login_form_heading": ("כניסה עם סיסמה", "Enter using password"),
            "login_form_password_label": ("סיסמה", "Password"),
            "login_form_password_placeholder": ("הסיסמה שלך", "Your password"),
            "login_form_submit": ("כניסה", "Enter"),
            "admin_link_html": (
                'האם זו החנות שלך? <a href="/admin" class="link">התחברות לניהול</a>',
                'Are you the store owner? <a href="/admin" class="link">Log in here</a>',
            ),
            "powered_by_shopify_html": ("החנות פועלת על {{ shopify }}", "This shop will be powered by {{ shopify }}"),
        },
        "continue_shopping": ("המשך בקנייה", "Continue shopping"),
        "close": ("סגירה", "Close"),
        "back": ("חזרה", "Back"),
        "back_to_top": ("חזרה לראש העמוד", "Back to top"),
        "loading": ("טוען…", "Loading…"),
        "view": ("צפייה", "View"),
        "learn_more": ("מידע נוסף", "Learn more"),
        "show_more": ("הצג עוד", "Show more"),
        "show_less": ("הצג פחות", "Show less"),
        "required": ("שדה חובה", "Required"),
        "optional": ("לא חובה", "Optional"),
        "error": ("אירעה שגיאה. אפשר לנסות שוב.", "Something went wrong. Please try again."),
    },
    "accessibility": {
        "skip_to_content": ("דילוג לתוכן הראשי", "Skip to main content"),
        "close": ("סגירה", "Close"),
        "menu": ("תפריט", "Menu"),
        "open_menu": ("פתיחת התפריט", "Open menu"),
        "close_menu": ("סגירת התפריט", "Close menu"),
        "next_slide": ("השקופית הבאה", "Next slide"),
        "previous_slide": ("השקופית הקודמת", "Previous slide"),
        "slide_of": ("שקופית {{ current }} מתוך {{ total }}", "Slide {{ current }} of {{ total }}"),
        "carousel": ("קרוסלה", "Carousel"),
        "play_video": ("הפעלת הווידאו", "Play video"),
        "pause_video": ("עצירת הווידאו", "Pause video"),
        "play_model": ("צפייה בתלת מימד", "Play 3D viewer"),
        "toggle_dark_mode": ("מעבר בין מצב בהיר לכהה", "Switch between light and dark mode"),
        "loading": ("טוען", "Loading"),
        "new_window": ("נפתח בחלון חדש", "Opens in a new window"),
        "external_link": ("קישור חיצוני", "External link"),
        "vendor": ("יצרן", "Vendor"),
        "unit_price": ("מחיר ליחידה", "Unit price"),
        "star_rating": ("דירוג {{ rating }} מתוך {{ scale }}", "Rated {{ rating }} out of {{ scale }}"),
        "quantity_for": ("כמות עבור {{ title }}", "Quantity for {{ title }}"),
        "remove_item": ("הסרת {{ title }} מהסל", "Remove {{ title }} from the cart"),
        "increase_quantity": ("הגדלת הכמות", "Increase quantity"),
        "decrease_quantity": ("הקטנת הכמות", "Decrease quantity"),
        "zoom_image": ("הגדלת התמונה", "Zoom image"),
        "thumbnail_for": ("תמונה ממוזערת {{ index }}", "Thumbnail {{ index }}"),
        "announcement": ("הודעה", "Announcement"),
        "progress_bar": ("התקדמות", "Progress"),
        "opens_dialog": ("פותח חלון", "Opens a dialog"),
        "collapsible_content": ("תוכן נפתח", "Collapsible content"),
        "country_selector": ("בחירת מדינה או אזור", "Country or region selector"),
        "language_selector": ("בחירת שפה", "Language selector"),
    },
    "newsletter": {
        "label": ("כתובת אימייל", "Email address"),
        "placeholder": ("הכתובת שלך", "your@email.com"),
        "button_label": ("הרשמה", "Subscribe"),
        "success": ("תודה, נרשמת בהצלחה.", "Thanks for subscribing."),
        "confirmation": ("שלחנו לך אימייל לאישור.", "We've sent you a confirmation email."),
    },
    "products": {
        "product": {
            "add_to_cart": ("הוספה לסל", "Add to cart"),
            "add_to_cart_with_price": ("הוספה לסל · {{ price }}", "Add to cart · {{ price }}"),
            "sold_out": ("אזל מהמלאי", "Sold out"),
            "unavailable": ("לא זמין", "Unavailable"),
            "pre_order": ("הזמנה מוקדמת", "Pre-order"),
            "on_sale": ("במבצע", "On sale"),
            "sale_badge": ("מבצע", "Sale"),
            "save_percent": ("חיסכון {{ percent }}%", "Save {{ percent }}%"),
            "save_amount": ("חיסכון {{ amount }}", "Save {{ amount }}"),
            "new_badge": ("חדש", "New"),
            "bestseller_badge": ("רב־מכר", "Bestseller"),
            "low_stock_badge": ("מלאי אחרון", "Almost gone"),
            "price": {
                "regular_price": ("מחיר רגיל", "Regular price"),
                "sale_price": ("מחיר מבצע", "Sale price"),
                "unit_price": ("מחיר ליחידה", "Unit price"),
                "from_price_html": ("החל מ־{{ price }}", "From {{ price }}"),
            },
            "quantity": {
                "label": ("כמות", "Quantity"),
                "input_label": ("כמות עבור {{ product }}", "Quantity for {{ product }}"),
                "minimum_of": ("מינימום {{ quantity }} יחידות", "Minimum of {{ quantity }}"),
                "maximum_of": ("מקסימום {{ quantity }} יחידות", "Maximum of {{ quantity }}"),
                "multiples_of": ("בכפולות של {{ quantity }}", "Increments of {{ quantity }}"),
                "in_cart_html": ("<span>{{ quantity }}</span> כבר בסל", "<span>{{ quantity }}</span> in your cart"),
            },
            "vendor": ("מותג", "Brand"),
            "sku": ("מק״ט", "SKU"),
            "barcode": ("ברקוד", "Barcode"),
            "type": ("סוג", "Type"),
            "view_full_details": ("לעמוד המוצר המלא", "View full details"),
            "quick_view": ("הצצה מהירה", "Quick view"),
            "quick_add": ("הוספה מהירה", "Quick add"),
            "choose_options": ("בחירת אפשרויות", "Choose options"),
            "media": {
                "gallery_label": ("גלריית תמונות המוצר", "Product media gallery"),
                "open_lightbox": ("פתיחת התמונה בגודל מלא", "Open image in full size"),
                "close_lightbox": ("סגירת התצוגה", "Close viewer"),
                "video": ("וידאו", "Video"),
                "model": ("תלת מימד", "3D model"),
            },
            "inventory": {
                "in_stock": ("במלאי", "In stock"),
                "in_stock_count": {
                    "one": ("נותרה יחידה אחת במלאי", "{{ count }} left in stock"),
                    "other": ("נותרו {{ count }} יחידות במלאי", "{{ count }} left in stock"),
                },
                "low_stock": ("מלאי נמוך — כדאי להזדרז", "Low stock — order soon"),
                "out_of_stock": ("אזל מהמלאי", "Out of stock"),
                "backorder": ("זמין בהזמנה מראש", "Available on backorder"),
                "unavailable": ("לא זמין כרגע", "Currently unavailable"),
            },
            "pickup": {
                "available_at_html": ("איסוף עצמי מ־<span>{{ location }}</span>", "Pickup available at <span>{{ location }}</span>"),
                "unavailable_at_html": ("אין איסוף עצמי מ־<span>{{ location }}</span>", "Pickup not available at <span>{{ location }}</span>"),
                "view_store_info": ("פרטי החנות", "View store information"),
                "check_other_stores": ("בדיקת זמינות בסניפים נוספים", "Check availability at other stores"),
                "pick_up_available": ("איסוף עצמי אפשרי", "Pickup available"),
                "refresh": ("רענון", "Refresh"),
            },
            "notify_me": {
                "title": ("להודיע לי כשחוזר למלאי", "Tell me when it's back"),
                "body": ("נשלח לך אימייל אחד ברגע שהמוצר יחזור למלאי.", "We'll send you one email the moment it's back."),
                "email_label": ("אימייל", "Email"),
                "submit": ("עדכנו אותי", "Notify me"),
                "success": ("מעולה — נעדכן אותך.", "Great — we'll be in touch."),
                "subject": ("בקשה לעדכון מלאי: {{ product }}", "Back in stock request: {{ product }}"),
            },
            "share": ("שיתוף המוצר", "Share this product"),
            "size_chart": ("טבלת מידות", "Size guide"),
            "sold_out_alternatives": ("מוצרים דומים שכן במלאי", "Similar pieces, in stock now"),
            "variant_sold_out": ("האפשרות הזו אזלה", "This option is sold out"),
            "variant_unavailable": ("האפשרות הזו אינה זמינה", "This option is unavailable"),
            "variant_unavailable_with_option": ("{{ option }} — לא זמין", "{{ option }} — unavailable"),
            "subscription": {
                "title": ("תדירות אספקה", "Delivery frequency"),
                "one_time": ("רכישה חד־פעמית", "One-time purchase"),
                "subscribe": ("מנוי", "Subscribe"),
                "save_html": ("חיסכון {{ percent }}", "Save {{ percent }}"),
                "cancel_anytime": ("אפשר לבטל בכל עת", "Cancel anytime"),
            },
            "volume_pricing": {
                "title": ("כמה שיותר, זול יותר", "Buy more, pay less"),
                "quantity": ("כמות", "Quantity"),
                "price": ("מחיר ליחידה", "Price each"),
                "save": ("חיסכון", "You save"),
                "most_popular": ("הכי משתלם", "Best value"),
                "each": ("ליחידה", "each"),
            },
            "complementary": ("הולך מצוין עם", "Pairs well with"),
            "bundle": {
                "title": ("להשלים את הסט", "Complete the set"),
                "total": ("סה״כ לסט", "Bundle total"),
                "add_bundle": ("הוספת הסט לסל", "Add the set"),
                "saving": ("חיסכון של {{ amount }}", "You save {{ amount }}"),
            },
            "gift": {
                "unlocked": ("מגיעה לך מתנה!", "Your gift is unlocked"),
                "locked": ("עוד {{ quantity }} יחידות ותקבלו מתנה", "Add {{ quantity }} more to unlock your gift"),
            },
            "custom_field": {
                "label": ("הקדשה אישית", "Personalisation"),
                "help": ("הטקסט יופיע על המוצר בדיוק כפי שנכתב.", "Your text appears exactly as typed."),
                "characters_left": ("נותרו {{ count }} תווים", "{{ count }} characters left"),
            },
            "discount_code": {
                "copy": ("העתקת הקוד", "Copy code"),
                "copied": ("הקוד הועתק", "Code copied"),
            },
        },
        "facets": {
            "title": ("סינון", "Filter"),
            "apply": ("החלת הסינון", "Apply"),
            "clear": ("ניקוי", "Clear"),
            "clear_all": ("ניקוי הכל", "Clear all"),
            "sort_by_label": ("מיון לפי", "Sort by"),
            "filter_by_label": ("סינון לפי", "Filter by"),
            "filter_and_sort": ("סינון ומיון", "Filter and sort"),
            "from": ("מ־", "From"),
            "to": ("עד", "To"),
            "product_count": {
                "one": ("מוצר אחד", "{{ count }} product"),
                "other": ("{{ count }} מוצרים", "{{ count }} products"),
            },
            "product_count_simple": {
                "one": ("מוצר אחד", "{{ count }} product"),
                "other": ("{{ count }} מוצרים", "{{ count }} products"),
            },
            "show_more": ("הצג עוד", "Show more"),
            "show_less": ("הצג פחות", "Show less"),
            "max_price": ("המחיר הגבוה ביותר הוא {{ price }}", "The highest price is {{ price }}"),
            "reset": ("איפוס", "Reset"),
            "active_filters": ("מסננים פעילים", "Active filters"),
            "remove_filter": ("הסרת המסנן {{ filter }}", "Remove filter {{ filter }}"),
            "in_stock_only": ("להציג רק פריטים במלאי", "In stock only"),
        },
        "compare": {
            "title": ("השוואה", "Compare"),
            "add": ("הוספה להשוואה", "Add to compare"),
            "remove": ("הסרה מההשוואה", "Remove from compare"),
            "view": ("השוואת הפריטים", "Compare items"),
            "empty": ("עדיין לא נבחרו פריטים להשוואה.", "No items selected yet."),
        },
    },
    "collections": {
        "general": {
            "no_matches": ("אין מוצרים שתואמים לסינון הזה.", "No products match this filter."),
            "link_title": ("מעבר אל {{ title }}", "Browse {{ title }}"),
            "view_all": ("לכל המוצרים", "View all"),
            "items_with_count": {
                "one": ("מוצר אחד", "{{ count }} product"),
                "other": ("{{ count }} מוצרים", "{{ count }} products"),
            },
            "empty": ("הקטגוריה הזו ריקה כרגע.", "This collection is empty right now."),
            "browse_all": ("לעיון בכל המוצרים", "Browse everything"),
        },
        "sorting": {
            "featured": ("מומלצים", "Featured"),
            "best_selling": ("הנמכרים ביותר", "Best selling"),
            "az": ("א׳ עד ת׳", "A to Z"),
            "za": ("ת׳ עד א׳", "Z to A"),
            "price_ascending": ("מחיר: מהנמוך לגבוה", "Price: low to high"),
            "price_descending": ("מחיר: מהגבוה לנמוך", "Price: high to low"),
            "date_ascending": ("הישן ביותר", "Oldest first"),
            "date_descending": ("החדש ביותר", "Newest first"),
        },
    },
    "blogs": {
        "article": {
            "read_more": ("להמשך הקריאה", "Read more"),
            "read_time": ("{{ minutes }} דקות קריאה", "{{ minutes }} min read"),
            "back_to_blog": ("חזרה אל {{ title }}", "Back to {{ title }}"),
            "published_on": ("פורסם ב־{{ date }}", "Published {{ date }}"),
            "written_by": ("מאת {{ author }}", "By {{ author }}"),
            "tags": ("תגיות", "Tags"),
            "share": ("שיתוף המאמר", "Share this article"),
            "empty": ("עדיין לא פורסמו מאמרים.", "No articles published yet."),
            "related": ("מאמרים נוספים", "Keep reading"),
        },
        "comments": {
            "title": ("תגובות", "Comments"),
            "name": ("שם", "Name"),
            "email": ("אימייל", "Email"),
            "message": ("תגובה", "Comment"),
            "post": ("פרסום התגובה", "Post comment"),
            "moderated": ("התגובות נבדקות לפני הפרסום.", "Comments are reviewed before they appear."),
            "success": ("התגובה פורסמה. תודה!", "Your comment was posted. Thanks!"),
            "success_moderated": ("התגובה התקבלה ותפורסם לאחר אישור.", "Your comment was received and will appear once approved."),
            "with_count": {
                "one": ("תגובה אחת", "{{ count }} comment"),
                "other": ("{{ count }} תגובות", "{{ count }} comments"),
            },
        },
    },
    "cart": {
        "general": {
            "title": ("סל הקניות", "Your cart"),
            "empty": ("הסל שלך ריק", "Your cart is empty"),
            "empty_body": ("כמה דברים יפים מחכים לך בהמשך.", "There are a few good things waiting for you."),
            "continue_shopping": ("להתחיל לקנות", "Start shopping"),
            "subtotal": ("סכום ביניים", "Subtotal"),
            "total": ("סה״כ", "Total"),
            "savings": ("חסכת", "You save"),
            "savings_total": ("סך החיסכון שלך", "Your total saving"),
            "taxes_and_shipping_at_checkout": ("מיסים ומשלוח מחושבים בקופה.", "Taxes and shipping are calculated at checkout."),
            "checkout": ("מעבר לתשלום", "Checkout"),
            "view_cart": ("צפייה בסל", "View cart"),
            "update": ("עדכון", "Update"),
            "remove": ("הסרה", "Remove"),
            "item_added": ("נוסף לסל", "Added to your cart"),
            "items_count": {
                "one": ("פריט אחד", "{{ count }} item"),
                "other": ("{{ count }} פריטים", "{{ count }} items"),
            },
            "error": ("לא הצלחנו לעדכן את הסל. אפשר לנסות שוב.", "We couldn't update your cart. Please try again."),
            "quantity_error": ("נותרו רק {{ quantity }} יחידות במלאי.", "Only {{ quantity }} left in stock."),
            "open": ("פתיחת הסל", "Open cart"),
            "close": ("סגירת הסל", "Close cart"),
            "count_label": ("{{ count }} פריטים בסל", "{{ count }} items in cart"),
            "keep_shopping": ("להמשיך לקנות", "Keep shopping"),
        },
        "note": {
            "label": ("הערה להזמנה", "Order note"),
            "placeholder": ("הוראות מיוחדות, בקשת עטיפה, וכו׳", "Special instructions, gift wrap, anything else"),
            "add": ("הוספת הערה", "Add a note"),
            "saved": ("ההערה נשמרה", "Note saved"),
        },
        "discount": {
            "label": ("קוד הנחה", "Discount code"),
            "placeholder": ("הקלד קוד", "Enter code"),
            "apply": ("החלה", "Apply"),
            "applied": ("הקוד יוחל בקופה", "Your code will be applied at checkout"),
            "remove": ("הסרת הקוד", "Remove code"),
            "help": ("הקוד מוחל בשלב התשלום.", "The code is applied at checkout."),
        },
        "shipping": {
            "free_progress_html": ("עוד <strong>{{ amount }}</strong> ומשלוח חינם", "You're <strong>{{ amount }}</strong> away from free shipping"),
            "free_unlocked": ("מעולה — יש לך משלוח חינם", "Nice — you've unlocked free shipping"),
            "milestone_progress_html": ("עוד <strong>{{ amount }}</strong> ומקבלים {{ reward }}", "<strong>{{ amount }}</strong> more unlocks {{ reward }}"),
            "milestone_unlocked": ("{{ reward }} — נפתח!", "{{ reward }} — unlocked!"),
            "estimated_delivery": ("משלוח משוער: {{ date }}", "Estimated delivery: {{ date }}"),
        },
        "terms": {
            "label_html": ('קראתי ואני מאשר/ת את <a href="{{ url }}" target="_blank" rel="noopener">התקנון ותנאי השימוש</a>', 'I have read and accept the <a href="{{ url }}" target="_blank" rel="noopener">terms and conditions</a>'),
            "label_plain": ("קראתי ואני מאשר/ת את התקנון ותנאי השימוש", "I have read and accept the terms and conditions"),
            "error": ("יש לאשר את התקנון לפני המעבר לתשלום.", "Please accept the terms before checking out."),
        },
        "upsell": {
            "title": ("להוסיף גם?", "Add one more?"),
            "add": ("הוספה", "Add"),
            "added": ("נוסף", "Added"),
        },
        "trust": {
            "secure_checkout": ("תשלום מאובטח בתקן SSL", "Secure SSL checkout"),
            "easy_returns": ("החזרות בתוך 30 יום", "30-day returns"),
        },
        "countdown": {
            "title": ("הסל שמור עבורך", "Your cart is reserved"),
            "body_html": ("הפריטים שמורים עוד <strong data-cart-countdown></strong> דקות", "Items held for <strong data-cart-countdown></strong> more minutes"),
            "expired": ("שמירת הסל הסתיימה, אבל הפריטים עדיין כאן.", "The hold expired, but your items are still here."),
        },
    },
    "customer": {
        "account": {
            "title": ("החשבון שלי", "My account"),
            "details": ("פרטי החשבון", "Account details"),
            "view_addresses": ("הכתובות שלי", "My addresses"),
            "return": ("חזרה לחשבון", "Return to account"),
        },
        "orders": {
            "title": ("היסטוריית הזמנות", "Order history"),
            "order_number": ("הזמנה", "Order"),
            "date": ("תאריך", "Date"),
            "payment_status": ("סטטוס תשלום", "Payment"),
            "fulfillment_status": ("סטטוס משלוח", "Fulfilment"),
            "total": ("סה״כ", "Total"),
            "none": ("עדיין לא ביצעת הזמנות.", "You haven't placed an order yet."),
            "view": ("צפייה בהזמנה", "View order"),
        },
        "order": {
            "title": ("הזמנה {{ name }}", "Order {{ name }}"),
            "date_html": ("בוצעה ב־{{ date }}", "Placed on {{ date }}"),
            "cancelled_html": ("ההזמנה בוטלה ב־{{ date }}", "Order cancelled on {{ date }}"),
            "cancelled_reason": ("סיבה: {{ reason }}", "Reason: {{ reason }}"),
            "billing_address": ("כתובת לחיוב", "Billing address"),
            "shipping_address": ("כתובת למשלוח", "Shipping address"),
            "payment_status": ("סטטוס תשלום", "Payment status"),
            "fulfillment_status": ("סטטוס משלוח", "Fulfilment status"),
            "product": ("מוצר", "Product"),
            "sku": ("מק״ט", "SKU"),
            "price": ("מחיר", "Price"),
            "quantity": ("כמות", "Quantity"),
            "total": ("סה״כ", "Total"),
            "subtotal": ("סכום ביניים", "Subtotal"),
            "shipping": ("משלוח", "Shipping"),
            "tax": ("מס", "Tax"),
            "discount": ("הנחה", "Discount"),
            "track_shipment": ("מעקב אחר המשלוח", "Track shipment"),
            "tracking_number": ("מספר מעקב: {{ number }}", "Tracking number: {{ number }}"),
        },
        "addresses": {
            "title": ("הכתובות שלי", "My addresses"),
            "default": ("כתובת ברירת מחדל", "Default address"),
            "add_new": ("הוספת כתובת", "Add a new address"),
            "edit": ("עריכה", "Edit"),
            "delete": ("מחיקה", "Delete"),
            "delete_confirm": ("למחוק את הכתובת?", "Delete this address?"),
            "first_name": ("שם פרטי", "First name"),
            "last_name": ("שם משפחה", "Last name"),
            "company": ("חברה", "Company"),
            "address1": ("רחוב ומספר", "Address"),
            "address2": ("דירה, כניסה, קומה", "Apartment, suite, etc."),
            "city": ("עיר", "City"),
            "country": ("מדינה", "Country"),
            "province": ("מחוז", "Province"),
            "zip": ("מיקוד", "Postal code"),
            "phone": ("טלפון", "Phone"),
            "set_default": ("קביעה ככתובת ברירת מחדל", "Set as default address"),
            "save": ("שמירה", "Save"),
            "cancel": ("ביטול", "Cancel"),
            "none": ("עדיין לא נשמרו כתובות.", "No addresses saved yet."),
        },
        "login": {
            "title": ("התחברות", "Log in"),
            "email": ("אימייל", "Email"),
            "password": ("סיסמה", "Password"),
            "forgot_password": ("שכחת סיסמה?", "Forgot your password?"),
            "submit": ("התחברות", "Log in"),
            "guest_title": ("המשך כאורח", "Continue as a guest"),
            "guest_body": ("אפשר להשלים את הרכישה בלי לפתוח חשבון.", "You can complete your purchase without creating an account."),
            "guest_continue": ("המשך ללא חשבון", "Continue without an account"),
            "no_account": ("אין לך חשבון?", "New here?"),
            "create_account": ("פתיחת חשבון", "Create an account"),
        },
        "recover_password": {
            "title": ("איפוס סיסמה", "Reset your password"),
            "subtext": ("נשלח אליך קישור לאיפוס הסיסמה.", "We'll email you a reset link."),
            "submit": ("שליחת קישור", "Send the link"),
            "success": ("שלחנו לך אימייל עם קישור לאיפוס.", "We've emailed you a reset link."),
            "cancel": ("חזרה להתחברות", "Back to log in"),
        },
        "reset_password": {
            "title": ("בחירת סיסמה חדשה", "Choose a new password"),
            "password": ("סיסמה חדשה", "New password"),
            "password_confirm": ("אישור הסיסמה", "Confirm password"),
            "submit": ("שמירת הסיסמה", "Save password"),
        },
        "register": {
            "title": ("פתיחת חשבון", "Create an account"),
            "first_name": ("שם פרטי", "First name"),
            "last_name": ("שם משפחה", "Last name"),
            "email": ("אימייל", "Email"),
            "password": ("סיסמה", "Password"),
            "submit": ("יצירת חשבון", "Create account"),
            "has_account": ("כבר יש לך חשבון?", "Already have an account?"),
            "login": ("התחברות", "Log in"),
        },
        "activate_account": {
            "title": ("הפעלת החשבון", "Activate your account"),
            "subtext": ("יש לבחור סיסמה כדי להפעיל את החשבון.", "Choose a password to activate your account."),
            "password": ("סיסמה", "Password"),
            "password_confirm": ("אישור הסיסמה", "Confirm password"),
            "submit": ("הפעלה", "Activate"),
            "decline": ("דחיית ההזמנה", "Decline invitation"),
        },
        "log_out": ("התנתקות", "Log out"),
        "log_in": ("התחברות", "Log in"),
    },
    "gift_cards": {
        "issued": {
            "title": ("כרטיס מתנה על סך {{ value }}", "Here's your {{ value }} gift card"),
            "subtext": ("כרטיס המתנה שלך", "Your gift card"),
            "code": ("קוד הכרטיס", "Gift card code"),
            "copy_code": ("העתקת הקוד", "Copy code"),
            "copied": ("הקוד הועתק", "Code copied"),
            "expires_on": ("בתוקף עד {{ date }}", "Expires on {{ date }}"),
            "shop_link": ("למעבר לחנות", "Start shopping"),
            "print": ("הדפסה", "Print"),
            "add_to_apple_wallet": ("הוספה ל־Apple Wallet", "Add to Apple Wallet"),
            "remaining_html": ("נותרו {{ balance }}", "{{ balance }} remaining"),
            "qr_image_alt": ("קוד QR של כרטיס המתנה", "Gift card QR code"),
        },
        "recipient": {
            "checkbox": ("שליחה כמתנה", "Send as a gift"),
            "email_label": ("אימייל המקבל/ת", "Recipient email"),
            "name_label": ("שם המקבל/ת", "Recipient name"),
            "message_label": ("ברכה", "Message"),
            "max_characters": ("עד {{ max_chars }} תווים", "{{ max_chars }} characters max"),
            "send_on": ("תאריך שליחה", "Send on"),
        },
    },
    "wishlist": {
        "title": ("רשימת המשאלות", "Wishlist"),
        "add": ("הוספה לרשימה", "Save to wishlist"),
        "remove": ("הסרה מהרשימה", "Remove from wishlist"),
        "added": ("נשמר ברשימה", "Saved to your wishlist"),
        "removed": ("הוסר מהרשימה", "Removed from your wishlist"),
        "empty": ("הרשימה שלך ריקה", "Your wishlist is empty"),
        "empty_body": ("סמן/י את הלב על כל מוצר כדי לשמור אותו כאן.", "Tap the heart on any product to keep it here."),
        "count": {
            "one": ("פריט אחד", "{{ count }} item"),
            "other": ("{{ count }} פריטים", "{{ count }} items"),
        },
        "clear": ("ניקוי הרשימה", "Clear wishlist"),
        "share": ("שיתוף הרשימה", "Share wishlist"),
    },
    "recently_viewed": {
        "title": ("נצפו לאחרונה", "Recently viewed"),
        "clear": ("ניקוי ההיסטוריה", "Clear history"),
        "empty": ("עוד לא צפית במוצרים.", "You haven't viewed anything yet."),
    },
    "compliance": {
        "cookies": {
            "title": ("אנחנו משתמשים בעוגיות", "We use cookies"),
            "body": (
                "אנחנו משתמשים בעוגיות כדי להפעיל את החנות, לזכור את הסל שלך ולשפר את החוויה. אפשר לבחור אילו עוגיות לאשר.",
                "We use cookies to run the store, remember your cart and improve your experience. You choose which ones to allow.",
            ),
            "accept": ("אישור הכל", "Accept all"),
            "decline": ("דחייה", "Decline"),
            "customise": ("הגדרות", "Preferences"),
            "save": ("שמירת ההעדפות", "Save preferences"),
            "policy_link": ("מדיניות הפרטיות", "Privacy policy"),
            "necessary": ("עוגיות הכרחיות", "Strictly necessary"),
            "necessary_body": ("נדרשות לתפעול החנות ולסל הקניות. לא ניתן לכבות אותן.", "Required to run the store and your cart. These can't be switched off."),
            "analytics": ("עוגיות ניתוח", "Analytics"),
            "analytics_body": ("עוזרות לנו להבין איך משתמשים בחנות.", "Help us understand how the store is used."),
            "marketing": ("עוגיות שיווק", "Marketing"),
            "marketing_body": ("מאפשרות להציג לך פרסום רלוונטי.", "Let us show you relevant advertising."),
            "preferences": ("עוגיות העדפה", "Preferences"),
            "preferences_body": ("זוכרות בחירות כמו שפה ומטבע.", "Remember choices like language and currency."),
            "reopen": ("הגדרות עוגיות", "Cookie settings"),
        },
        "accessibility": {
            "title": ("כלי נגישות", "Accessibility tools"),
            "open": ("פתיחת כלי הנגישות", "Open accessibility tools"),
            "text_size": ("גודל טקסט", "Text size"),
            "increase_text": ("הגדלת טקסט", "Larger text"),
            "decrease_text": ("הקטנת טקסט", "Smaller text"),
            "contrast": ("ניגודיות", "Contrast"),
            "contrast_high": ("ניגודיות גבוהה", "High contrast"),
            "contrast_invert": ("היפוך צבעים", "Invert colours"),
            "grayscale": ("גווני אפור", "Greyscale"),
            "highlight_links": ("הדגשת קישורים", "Highlight links"),
            "readable_font": ("גופן קריא", "Readable font"),
            "stop_animations": ("עצירת אנימציות", "Stop animations"),
            "big_cursor": ("סמן גדול", "Large cursor"),
            "reading_guide": ("סרגל קריאה", "Reading guide"),
            "reset": ("איפוס ההגדרות", "Reset all"),
            "statement": ("הצהרת נגישות", "Accessibility statement"),
            "coordinator": ("רכז/ת נגישות: {{ contact }}", "Accessibility coordinator: {{ contact }}"),
        },
    },
    "sections": {
        "announcements": {
            "previous": ("ההודעה הקודמת", "Previous announcement"),
            "next": ("ההודעה הבאה", "Next announcement"),
            "carousel": ("סרגל הודעות", "Announcement bar"),
        },
        "header": {
            "menu": ("תפריט", "Menu"),
            "search": ("חיפוש", "Search"),
            "account": ("החשבון שלי", "Account"),
            "cart": ("סל הקניות", "Cart"),
            "wishlist": ("רשימת משאלות", "Wishlist"),
            "close_menu": ("סגירת התפריט", "Close menu"),
        },
        "footer": {
            "payment_methods": ("אמצעי תשלום", "Payment methods"),
            "copyright_html": ("© {{ year }} {{ shop }}. כל הזכויות שמורות.", "© {{ year }} {{ shop }}. All rights reserved."),
            "follow_us": ("עקבו אחרינו", "Follow us"),
        },
        "quick_order": {
            "title": ("הזמנה מהירה", "Quick order"),
        },
        "countdown": {
            "days": ("ימים", "Days"),
            "hours": ("שעות", "Hours"),
            "minutes": ("דקות", "Minutes"),
            "seconds": ("שניות", "Seconds"),
            "ended": ("המבצע הסתיים", "This offer has ended"),
        },
        "before_after": {
            "label": ("גרירה להשוואה", "Drag to compare"),
            "before": ("לפני", "Before"),
            "after": ("אחרי", "After"),
        },
        "order_tracking": {
            "title": ("מעקב הזמנה", "Track your order"),
            "order_number": ("מספר הזמנה", "Order number"),
            "email": ("אימייל", "Email"),
            "submit": ("מעקב", "Track"),
            "help": ("מספר ההזמנה מופיע באימייל האישור.", "Your order number is in your confirmation email."),
        },
        "popup": {
            "close": ("סגירת החלון", "Close popup"),
            "no_thanks": ("לא תודה", "No thanks"),
        },
        "spin": {
            "title": ("סובבו וזכו", "Spin to win"),
            "spin": ("סיבוב", "Spin"),
            "you_won": ("זכית ב־{{ prize }}", "You won {{ prize }}"),
            "your_code": ("הקוד שלך", "Your code"),
            "already_played": ("כבר השתתפת. הקוד שלך עדיין תקף.", "You've already played. Your code is still valid."),
            "email_first": ("הכניסו אימייל כדי לסובב", "Enter your email to spin"),
        },
        "referral": {
            "title": ("הזמינו חבר", "Refer a friend"),
            "body": ("שתפו את הקישור שלכם וקבלו הטבה על כל רכישה ראשונה.", "Share your link and get rewarded on every first order."),
            "your_link": ("הקישור שלך", "Your link"),
            "copy": ("העתקה", "Copy"),
        },
        "stats": {
            "label": ("נתונים", "By the numbers"),
        },
        "testimonials": {
            "verified": ("רכישה מאומתת", "Verified purchase"),
        },
        "instagram": {
            "follow": ("עקבו אחרינו באינסטגרם", "Follow us on Instagram"),
            "shop_the_look": ("לקנות את הלוק", "Shop the look"),
        },
        "size_chart": {
            "units_cm": ("ס״מ", "cm"),
            "units_in": ("אינץ׳", "in"),
            "switch_units": ("החלפת יחידות", "Switch units"),
        },
    },
    "templates": {
        "404": {
            "title": ("העמוד לא נמצא", "We couldn't find that page"),
            "subtext": ("הקישור אולי השתנה, אבל יש עוד הרבה מה לגלות.", "The link may have changed — there's still plenty to see."),
            "search": ("חיפוש באתר", "Search the store"),
        },
        "contact": {
            "form": {
                "title": ("יצירת קשר", "Get in touch"),
                "name": ("שם", "Name"),
                "email": ("אימייל", "Email"),
                "phone": ("טלפון", "Phone"),
                "subject": ("נושא", "Subject"),
                "message": ("הודעה", "Message"),
                "send": ("שליחה", "Send"),
                "post_success": ("תודה, ההודעה התקבלה. נחזור אליך בהקדם.", "Thanks — we've got your message and will reply soon."),
                "error_heading": ("יש לתקן את הפרטים הבאים:", "Please correct the following:"),
            },
        },
        "search": {
            "title": ("חיפוש", "Search"),
        },
        "cart": {
            "title": ("סל הקניות", "Your cart"),
        },
        "thank_you": {
            "title": ("תודה על ההזמנה", "Thank you for your order"),
            "subtext": ("שלחנו אישור לאימייל שלך.", "We've sent a confirmation to your email."),
        },
    },
    "onboarding": {
        "product_title": ("שם המוצר לדוגמה", "Example product title"),
        "collection_title": ("שם הקטגוריה", "Collection name"),
        "article_title": ("כותרת המאמר", "Article title"),
        "article_excerpt": ("תקציר קצר של המאמר מופיע כאן.", "A short summary of the article appears here."),
        "no_content": ("אפשר לבחור תוכן להצגה כאן דרך עורך התבנית.", "Choose content to show here from the theme editor."),
    },
}


PLURAL_FORMS = {"zero", "one", "two", "few", "many", "other"}


def is_leaf(value):
    return isinstance(value, tuple) and len(value) == 2 and all(isinstance(v, str) for v in value)


def is_plural(value):
    return (
        isinstance(value, dict)
        and value
        and set(value).issubset(PLURAL_FORMS)
        and all(is_leaf(v) for v in value.values())
    )


def extract(node, index, path="root"):
    if is_leaf(node):
        return node[index]
    if is_plural(node):
        return {form: leaf[index] for form, leaf in node.items()}
    if isinstance(node, dict):
        return {key: extract(value, index, f"{path}.{key}") for key, value in node.items()}
    raise SystemExit(f"Malformed translation node at {path}: {node!r}")


def flatten(node, prefix=""):
    keys = set()
    for key, value in node.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys |= flatten(value, path)
        else:
            keys.add(path)
    return keys


def main():
    hebrew = extract(T, 0)
    english = extract(T, 1)

    he_keys, en_keys = flatten(hebrew), flatten(english)
    if he_keys != en_keys:
        raise SystemExit(f"Key mismatch: {he_keys ^ en_keys}")

    targets = {"he.default.json": hebrew, "en.json": english}
    for filename, payload in targets.items():
        path = ROOT / "locales" / filename
        path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    print(f"locales written: {len(he_keys)} keys x {len(targets)} languages")


if __name__ == "__main__":
    main()
