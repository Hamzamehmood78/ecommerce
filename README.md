# ShopEase — Full-Stack E-Commerce Platform (MERN)

A complete online store with a customer storefront and a role-based admin panel, built from scratch with React, Node.js, Express and MongoDB.

### 🔗 Live demo

| | |
|---|---|
| **Storefront** | https://ecommerce-eight-delta-90.vercel.app |
| **Admin panel** | https://ecommerce-eight-delta-90.vercel.app/admin/login — click **"Login as demo admin"** |
| **Source code** | https://github.com/Hamzamehmood78/ecommerce |

> **Please note**
> - This is a **portfolio demo**. Payments run in Stripe **test mode**: use card `4242 4242 4242 4242`, any future expiry date, any CVC. No real money moves and no orders are fulfilled.
> - The backend is on a free hosting plan and **sleeps when idle**, so the first visit can take up to a minute. A message appears while it wakes up.
> - The demo admin is a limited staff account: it cannot see payments, store settings or staff management.

![Home page](docs/screenshots/home.png)
![Admin dashboard](docs/screenshots/admin-dashboard.png)

---

## Highlights

- **Two apps in one:** a fast customer storefront and a full admin panel, with **separate login sessions** for each.
- **Guest checkout** and account checkout, Stripe card payments and Cash on Delivery.
- **Server-side pricing:** the browser never decides prices, tax, discounts or stock. Everything is recalculated on the server, and card payments are verified against the order total.
- **Role-based admin:** a Super Admin can create staff accounts with per-section permissions.
- **Production-minded:** rate limiting, account lockout, input sanitisation, security headers, CORS allow-list, SEO and a sitemap.

---

## Features

### Customer storefront
- Home page with banner slider, categories, featured products, deal of the day (countdown), new arrivals, real customer reviews and newsletter
- Shop with filters (category, brand, price, size, color, rating), sorting, grid/list view and pagination
- Live search suggestions, category mega-menu, mini-cart and **Quick View**
- Product page: image gallery, size/color variants, stock status, delivery check, share buttons, related products
- **Reviews** with photos (up to 3), verified-purchase badge and helpful votes. Only customers who received the product can review it
- "Notify me" emails for out-of-stock products, wishlist with price-drop alerts
- Cart for guests and accounts (merged on login), **Save for Later**, coupons
- Multi-step checkout: saved addresses, delivery methods, COD or card, order review
- **Guest checkout** with an optional "create account" email link, plus **order tracking** by order number and email
- My Account: profile and avatar, saved addresses, change password, order history with status timeline
- Cancel an order (while pending/processing), **return and refund requests**, reorder, printable invoice
- Notification bell, forgot/reset password by email, About, Contact form, FAQs and policy pages

### Admin panel
- **Dashboard:** date-range filter, revenue and order stats, sales chart, orders-by-status chart, top products, low-stock alerts, recent orders with quick status update
- **Products:** create/edit with multi-image upload (Cloudinary), search/filter/sort, status switch, bulk actions and CSV export
- **Categories:** tree view with drag-and-drop ordering
- **Inventory:** stock levels, manual adjustments with required reasons, full stock history, low-stock threshold
- **Orders:** search, status tabs, detail page, status updates with customer emails, tracking numbers, internal notes, **invoice and shipping label printing**, cancel with reason, return approval and **automatic Stripe refunds**, CSV export
- **Customers:** list and profile, order history, block/unblock, CSV export
- **Reviews** moderation and replies, **coupons** (percentage/flat, limits, expiry), **banners**, homepage control
- **Reports:** sales, products, customers and order status with CSV export
- **Store settings:** store info shown across the storefront, **currency** (9 options), **tax**, shipping rates, policy pages and an **email template editor**
- **Staff accounts** with per-section permissions, contact messages inbox, payments and refunds, real-time-style notifications (polling)

### Security and engineering
- JWT authentication, bcrypt password hashing, separate customer and admin sessions
- Permission checks on every admin route (Super Admin vs staff)
- Login **rate limiting and account lockout** (5 failed attempts), IP rate limits on registration, password reset and guest endpoints
- Password reset with hashed, single-use, expiring tokens and no user enumeration
- Input sanitisation against NoSQL injection, request size limits, `helmet` security headers, CORS allow-list
- Image uploads limited to JPG/PNG/WebP/GIF (no SVG) and 5 MB
- Stripe payments verified server-side (amount, currency, owner, single use) with automatic refund if the total changes
- Audit trail for stock changes, fire-and-forget notifications that never block orders
- SEO: per-page meta tags, `sitemap.xml`, `robots.txt`, lazy-loaded images

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Payments | Stripe (test mode) |
| Images | Cloudinary |
| Email | Nodemailer with Brevo SMTP |
| Hosting | Vercel (frontend), Render (backend) |

## Architecture

```
Browser (React app on Vercel)
        │  HTTPS, JSON, JWT
        ▼
Express API (Render) ───► MongoDB Atlas
        ├──► Cloudinary   (product and review images)
        ├──► Stripe       (card payments and refunds)
        └──► Brevo SMTP   (order and account emails)
```

## Project structure

```
shopease-mern/
├── client/                 React app (Vite)
│   └── src/
│       ├── components/     layout, home, shop, product, cart, checkout, admin ...
│       ├── pages/          storefront pages and pages/admin/*
│       ├── context/        Auth, Cart, Wishlist, Currency providers
│       ├── hooks/          useDebounce, useStoreInfo, useDocumentMeta ...
│       └── utils/          currency and date helpers
├── server/
│   ├── controllers/        request handlers
│   ├── models/             Mongoose schemas
│   ├── routes/             API routes
│   ├── middleware/         auth, permissions, rate limiting, sanitising, uploads
│   ├── utils/              pricing, emails, notifications, refunds, stock log
│   └── scripts/            database backup and catalog copy tools
└── docs/screenshots/       images used in this README
```

---

## Run it locally

**Requirements:** Node.js 18 or newer, a free MongoDB Atlas cluster, a Cloudinary account and a Stripe test account.

```bash
# 1. Get the code
git clone https://github.com/Hamzamehmood78/ecommerce
cd ecommerce

# 2. Backend
cd server
cp .env.example .env        # then fill in the values (see below)
npm install
npm run dev                 # http://localhost:3000

# 3. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

**Sample data (optional):** from `server/` run `node seed.js` to create sample categories and products.
⚠️ This **deletes existing products and categories**, so never run it on a real database.

**Create your admin account:** register on the site, then in MongoDB Atlas open the `users` collection and change your user's `role` from `"customer"` to `"admin"`. Log in at `/admin/login`.

### Environment variables

**`server/.env`**

| Variable | Purpose |
|---|---|
| `PORT` | Local port (default 3000). Not needed on Render |
| `MONGO_URI` | MongoDB connection string (include the database name) |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `CLIENT_URL` | Frontend address for CORS and email links (comma-separate several) |
| `TRUST_PROXY` | Set to `1` when hosted behind a proxy (Render) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` for demos) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Real email delivery. Without them, local runs use a test inbox |
| `NODE_ENV` | `production` when deployed |
| `DISABLE_CARD_PAYMENTS` | Optional. `true` hides and blocks card payments |

**`client/.env`**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API address, e.g. `http://localhost:3000/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `VITE_DEMO_MODE` | `true` shows the demo banner and server wake-up notice |
| `VITE_DEMO_ADMIN_EMAIL`, `VITE_DEMO_ADMIN_PASSWORD` | Optional one-click demo admin login. Use a limited staff account only |

---

## API overview

All routes are under `/api`.

| Area | Examples |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/forgot-password` |
| Catalog | `GET /products`, `/products/:slug`, `/categories`, `/banners` |
| Cart and wishlist | `/cart`, `/cart/merge`, `/customers/wishlist` |
| Orders | `POST /orders`, `/orders/guest`, `/orders/track`, `/orders/my` |
| Reviews | `GET /reviews/product/:id`, `POST /reviews` |
| Payments | `POST /payments/create-intent` |
| Admin | `/orders/admin/all`, `/admin/stats`, `/inventory`, `/staff`, `/settings` |

Admin routes are protected by role and per-section permissions.

---

## Deployment

- **Database:** MongoDB Atlas (free M0). Allow network access and use a dedicated database user.
- **Backend:** Render web service, root directory `server`, start command `npm start`, environment variables as above.
- **Frontend:** Vercel project, root directory `client`. `client/vercel.json` handles single-page-app routing and proxies `/sitemap.xml` to the API.
- Auto-deploys on every push to `main`.

---

## Not included (honest limits)

- Stripe runs in **test mode** only. No real payments are processed.
- Only **Stripe** is integrated. Local payment gateways, PayPal and SMS notifications are not built.
- No Google sign-in, loyalty points, live chat or mobile app.
- Notifications use polling (every 60 seconds), not WebSockets.
- It is a single-page app, so link previews use the same page title for every URL.
- Automated tests are not written yet. The project was checked with manual test plans.

---

## Author

**YOUR NAME** — Full-Stack (MERN) Developer
[Upwork profile](https://www.upwork.com/freelancers/YOUR-ID) · [GitHub](https://github.com/YOUR-USERNAME)

*Available for freelance work. Feel free to explore the demo and get in touch.*