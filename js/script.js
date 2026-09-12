// ===== ShopVerse App =====
(function () {
  "use strict";

  const state = {
    products: [],
    filter: "all",
    cart: JSON.parse(localStorage.getItem("shopverse-cart") || "[]")
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const fmt = (n) => "Rs. " + n.toLocaleString("en-PK");

  const emojis = ["\uD83C\uDFA7", "\uD83D\uDCAA", "\uD83D\uDC54", "\uD83D\uDC5C", "\uD83D\uDCA1", "\uD83C\uDF73", "\uD83D\uDDA5", "\uD83D\uDC41", "\uD83E\uDDE1", "\uD83D\uDD0B", "\uD83C\uDF6E", "\uD83D\uDD0A"];

  const categoryIcons = {
    "Electronics": "\uD83D\uDCF1",
    "Fashion": "\uD83D\uDC54",
    "Home & Living": "\uD83C\uDFE0",
    "Gaming": "\uD83C\uDFAE"
  };

  const categoryColors = {
    "Electronics": "#4f46e5",
    "Fashion": "#ec4899",
    "Home & Living": "#10b981",
    "Gaming": "#8b5cf6"
  };

  // ---------- Load ----------
  async function init() {
    const res = await fetch("products.json");
    state.products = await res.json();
    state.products.forEach((p, i) => (p.__emoji = emojis[i % emojis.length]));
    renderCategories();
    renderProducts();
    renderCart();
    bindEvents();
    updateCartCount();
  }

  // ---------- Categories ----------
  function renderCategories() {
    const cats = [...new Set(state.products.map((p) => p.category))];
    const counts = {};
    state.products.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
    $("#categoryGrid").innerHTML = cats
      .map(
        (c) => `
        <div class="category-card" data-cat="${c}">
          <div class="category-icon" style="background:${categoryColors[c] || "#4f46e5"}">${categoryIcons[c] || "\uD83D\uDCB0"}</div>
          <h3>${c}</h3>
          <p>${counts[c]} products</p>
        </div>`
      )
      .join("");
  }

  // ---------- Products ----------
  function renderProducts() {
    const q = ($("#searchInput").value || "").trim().toLowerCase();
    let list = state.products;
    if (state.filter !== "all") list = list.filter((p) => p.category === state.filter);
    if (q) list = list.filter((p) => (p.name + " " + p.category + " " + p.description).toLowerCase().includes(q));

    $("#noResults").style.display = list.length ? "none" : "block";
    $("#productGrid").innerHTML = list.map((p) => productCard(p)).join("");
  }

  function productCard(p) {
    const badge = p.badge ? `<span class="badge">${p.badge}</span>` : "";
    const stars = "&#9733;".repeat(Math.round(p.rating));
    const old = p.oldPrice ? `<span class="old-price">${fmt(p.oldPrice)}</span>` : "";
    return `
      <div class="product-card">
        <div class="product-img" style="background:${p.color}">
          ${badge}
          <span class="product-emoji">${p.__emoji}</span>
        </div>
        <div class="product-body">
          <span class="product-cat">${p.category}</span>
          <h3>${p.name}</h3>
          <p class="desc">${p.description}</p>
          <div class="product-rating">
            <span class="stars">${stars}</span>
            <span>${p.rating}</span>
            <span class="review-count">(${p.reviews})</span>
          </div>
          <div class="product-foot">
            <div class="price">${fmt(p.price)} <small>PKR</small>${old}</div>
            <button class="add-btn" data-add="${p.id}">Add to Cart</button>
          </div>
        </div>
      </div>`;
  }

  // ---------- Cart ----------
  function saveCart() {
    localStorage.setItem("shopverse-cart", JSON.stringify(state.cart));
  }

  function addToCart(id) {
    const item = state.cart.find((i) => i.id === id);
    if (item) item.qty++;
    else state.cart.push({ id, qty: 1 });
    saveCart();
    renderCart();
    showToast("Added to cart \uD83D\uDECD");
  }

  function changeQty(id, delta) {
    const item = state.cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    state.cart = state.cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
  }

  function renderCart() {
    const box = $("#cartItems");
    const total = cartTotal();
    if (!state.cart.length) {
      box.innerHTML = '<p class="cart-empty">Your cart is empty. Let\'s add something nice! &#128522;</p>';
    } else {
      box.innerHTML = state.cart
        .map((ci) => {
          const p = state.products.find((x) => x.id === ci.id);
          if (!p) return "";
          return `
            <div class="cart-item">
              <div class="cart-item-color" style="background:${p.color}">${p.__emoji}</div>
              <div class="cart-item-info">
                <h4>${p.name}</h4>
                <p>${fmt(p.price)}</p>
                <div class="cart-item-qty">
                  <button class="qty-btn" data-qty="${ci.id}" data-delta="-1">&minus;</button>
                  <span>${ci.qty}</span>
                  <button class="qty-btn" data-qty="${ci.id}" data-delta="1">+</button>
                </div>
              </div>
              <button class="remove-btn" data-remove="${ci.id}" title="Remove">&times;</button>
            </div>`;
        })
        .join("");
    }
    $("#cartTotal").textContent = fmt(total);
    updateCartCount();
  }

  function cartTotal() {
    return state.cart.reduce((sum, ci) => {
      const p = state.products.find((x) => x.id === ci.id);
      return sum + (p ? p.price * ci.qty : 0);
    }, 0);
  }

  function updateCartCount() {
    $("#cartCount").textContent = state.cart.reduce((s, i) => s + i.qty, 0);
  }

  // ---------- UI ----------
  function showToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function bindEvents() {
    // Filters
    $$(".filter-chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        $$(".filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        state.filter = chip.dataset.filter;
        renderProducts();
      })
    );

    // Category click scrolls and sets filter
    $("#categoryGrid").addEventListener("click", (e) => {
      const card = e.target.closest(".category-card");
      if (!card) return;
      state.filter = card.dataset.cat;
      $$(".filter-chip").forEach((c) =>
        c.classList.toggle("active", c.dataset.filter === state.filter)
      );
      renderProducts();
      $("#products").scrollIntoView({ behavior: "smooth" });
    });

    // Search
    $("#searchInput").addEventListener("input", renderProducts);
    $("#searchToggle").addEventListener("click", () => $("#searchBar").classList.toggle("open"));

    // Mobile menu
    $("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("open"));
    $$("#nav a").forEach((a) => a.addEventListener("click", () => $("#nav").classList.remove("open")));

    // Add to cart (event delegation)
    $("#productGrid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (btn) addToCart(btn.dataset.add);
    });

    // Cart drawer open/close
    $("#cartBtn").addEventListener("click", () => openCart());
    $("#closeCart").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);

    // Cart interactions
    $("#cartItems").addEventListener("click", (e) => {
      const q = e.target.closest("[data-qty]");
      const r = e.target.closest("[data-remove]");
      if (q) changeQty(q.dataset.qty, parseInt(q.dataset.delta, 10));
      if (r) removeItem(r.dataset.remove);
    });

    // Checkout
    $("#checkoutBtn").addEventListener("click", checkout);

    // Newsletter
    $("#newsletterForm").addEventListener("submit", (e) => {
      e.preventDefault();
      $("#newsletterMsg").textContent = "\u2705 Check your inbox — welcome to the family!";
      e.target.reset();
    });
  }

  function openCart() {
    $("#cartDrawer").classList.add("open");
    $("#overlay").classList.add("open");
  }

  function closeCart() {
    $("#cartDrawer").classList.remove("open");
    $("#overlay").classList.remove("open");
  }

  function checkout() {
    if (!state.cart.length) {
      showToast("Your cart is empty");
      return;
    }
    const total = cartTotal();
    state.cart = [];
    saveCart();
    renderCart();
    closeCart();
    showToast("\uD83C\uDF89 Order placed! " + fmt(total) + " — Cash on Delivery");
  }

  document.addEventListener("DOMContentLoaded", init);
})();