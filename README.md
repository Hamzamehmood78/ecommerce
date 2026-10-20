# ShopEase — Full-Stack E-Commerce (MERN)

A complete e-commerce store with a customer storefront and a role-based admin panel.

**🔗 Live demo:** https://YOUR-SITE.vercel.app
**🔐 Admin demo:** https://YOUR-SITE.vercel.app/admin/login (one-click "Login as demo admin" button)

> Demo store: payments run in Stripe **test mode** (card `4242 4242 4242 4242`, any future date, any CVC). No real orders.
> The server is on free hosting and sleeps when idle, so the first load can take up to a minute.

## Features
**Storefront:** search with live suggestions, filters and sorting, product gallery with variants, reviews with photos, Quick View, cart (guest + account), Save for Later, coupons, guest or account checkout, Stripe + Cash on Delivery, order tracking, returns and refunds, wishlist, notifications.

**Admin panel:** analytics dashboard with date filters and charts, products/inventory/orders management, invoices and shipping labels, customers, review moderation, coupons, banners, reports (CSV), staff roles and permissions, store settings (tax, currency, shipping, email templates).

**Engineering:** JWT auth with separate customer/admin sessions, account lockout and rate limiting, server-side price/tax/stock calculation, input sanitisation, security headers, CORS allow-list, SEO meta tags and sitemap.

## Tech stack
React, Vite, Tailwind CSS, React Router · Node.js, Express · MongoDB (Mongoose) · Stripe · Cloudinary · Nodemailer

## Run locally
```bash
git clone https://github.com/YOUR-USERNAME/shopease-mern.git
cd shopease-mern

cd server && npm install && npm run dev      # copy .env.example to .env first
cd client && npm install && npm run dev      # copy .env.example to .env first
```

## Author
YOUR NAME — [Upwork profile](https://www.upwork.com/freelancers/YOUR-ID)