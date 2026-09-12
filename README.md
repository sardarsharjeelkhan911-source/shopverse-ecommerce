# ShopVerse — E-commerce Store

A modern, professional, dependency-free e-commerce website. Built with plain HTML, CSS, and JavaScript — no frameworks, no build steps. Ready to deploy on Vercel.

## Features

- Responsive product grid with search and category filters
- Shopping cart drawer with localStorage persistence
- Cash on Delivery checkout flow
- Hero, categories, promo, and newsletter sections

## Run locally

Just open `index.html` in a browser, or serve the folder:

```
powershell -ExecutionPolicy Bypass -c "Start-Process http://localhost:8000; python -m http.server 8000"
```

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repository.
3. Framework preset stays **Other** (it is static). Click **Deploy**.
4. Open the generated `https://your-project.vercel.app` URL.

## Files

- `index.html` — page structure
- `css/styles.css` — styling
- `js/script.js` — app logic (products, cart, filters)
- `products.json` — product catalog (PKR prices)
- `vercel.json` — static-site config for Vercel