// ===== ShopVerse Store — REST API client =====
// Loads products + places orders against the ShopVerse backend.
// If the API is unreachable it falls back to local data (products.json)
// and order placement becomes a local simulation (demo mode).
(function () {
  "use strict";

  var API_BASE = window.SHOPVERSE_API_URL || "http://localhost:5000";

  var state = {
    available: false,
    settings: {},
    offlineProducts: []
  };

  function hashNum(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  // Map a backend product record to the storefront product shape.
  function normalize(p) {
    var price = p.salePrice != null ? Number(p.salePrice) || 0 : Number(p.sellingPrice) || 0;
    var oldPrice = p.salePrice != null && p.salePrice < p.sellingPrice ? Number(p.sellingPrice) || 0 : null;
    var h = hashNum(p.slug || p.id);
    var hue = h % 360;
    var cat = p.category ? p.category.name : "General";
    var icon = p.images && p.images.length ? null : emojiFor(cat, h);
    var badge = "";
    if (p.featured) badge = "Featured";
    else if (p.active === false && p.stock > 0) badge = "Slow mover";
    if (!badge && p.stock != null && p.minStock != null && p.stock <= p.minStock) badge = "Low Stock";

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: cat,
      price: price,
      oldPrice: oldPrice,
      rating: p.rating || 4.5,
      reviews: p.reviews || Math.floor(h % 210) + 20,
      badge: badge,
      color: p.color || "hsl(" + hue + ",65%,55%)",
      description: p.shortDescription || p.description || "",
      stock: p.stock,
      __emoji: icon,
      imageUrl: p.images && p.images.length ? p.images[0].url : null
    };
  }

  function emojiFor(cat, h) {
    var map = {
      Electronics: "\uD83D\uDCF1",
      Fashion: "\uD83D\uDC54",
      "Home & Living": "\uD83C\uDFE0",
      Gaming: "\uD83C\uDFAE",
      Groceries: "\uD83C\uDF3F",
      Sports: "\u26BD",
      Books: "\uD83D\uDCDA"
    };
    if (map[cat]) return map[cat];
    var pills = ["\uD83D\uDCA1", "\uD83D\uDD0B", "\uD83D\uDD0A", "\uD83D\uDDA5", "\uD83E\uDDE1", "\uD83D\uDC8E", "\uD83C\uDF73", "\uD83E\uDDF3"];
    return pills[h % pills.length];
  }

  async function connect() {
    try {
      var [prodRes, settingsRes] = await Promise.all([
        fetch(API_BASE + "/api/store/products?pageSize=100"),
        fetch(API_BASE + "/api/store/settings")
      ]);
      if (!prodRes.ok) throw new Error("products failed");
      var prodData = await prodRes.json();
      var settingsData = settingsRes.ok ? await settingsRes.json() : {};
      state.products = (prodData.data && prodData.data.items || []).map(normalize);
      state.settings = settingsData.data || {};
      state.available = true;
      return state.products;
    } catch (err) {
      // Fallback: offline catalog
      var res = await fetch("products.json");
      if (!res.ok) throw err;
      state.offlineProducts = await res.json();
      state.available = false;
      return null;
    }
  }

  function products() {
    return state.available ? state.products : state.offlineProducts;
  }

  function isOffline() {
    return !state.available;
  }

  // Place a real order via the backend.
  // items: [{productId, qty}]; payload: customer info + address + coupon.
  async function createOrder(payload) {
    var res = await fetch(API_BASE + "/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    var body = await res.json().catch(function () { return null; });
    if (!res.ok) {
      var msg = body && body.message ? body.message : "Order failed";
      throw new Error(msg);
    }
    return body.data;
  }

  function settings() {
    return state.settings;
  }

  function baseURL() {
    return API_BASE;
  }

  window.ShopVerseAPI = {
    connect: connect,
    products: products,
    settings: settings,
    isOffline: isOffline,
    createOrder: createOrder,
    baseURL: baseURL
  };
})();