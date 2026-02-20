# RG Store — Inventory & POS System

A full-stack, mobile-responsive store inventory system with built-in POS, barcode scanning, and daily sales reports.

---

## Features

- **POS (Point of Sale)** — barcode scan to add items, cart management, cash/card payment, change calculator
- **Inventory Management** — product CRUD, barcode scan lookup, low stock alerts, stock adjustment
- **Sales Reports** — daily summary, hourly chart, top products, 7/14/30-day revenue trend, CSV export
- **Barcode Scanning** — camera-based (works on mobile browser)
- **Auth** — JWT login (username + password)
- **Mobile Responsive** — bottom nav on mobile, sidebar-style on desktop

---

## Prerequisites

Install these before proceeding:

1. **Node.js v20+** — https://nodejs.org/en/download
2. **PostgreSQL** (one of):
   - Local install: https://www.postgresql.org/download/
   - Docker: `docker run -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`
   - Cloud: [Neon](https://neon.tech) (free tier) or [Railway](https://railway.app)

---

## Quick Start

### 1. Set up the database

Create a PostgreSQL database named `rg_store`, then note your connection string:

```
postgresql://USER:PASSWORD@HOST:5432/rg_store
```

### 2. Configure backend environment

```bash
cd rg-store/backend
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/rg_store?schema=public"
JWT_SECRET="rg-store-super-secret-jwt-key-2024"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 3. Install and run backend

```bash
cd rg-store/backend
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data + admin user
npm run db:seed

# Start development server
npm run dev
```

Backend will run at `http://localhost:3001`

### 4. Install and run frontend

Open a new terminal:

```bash
cd rg-store/frontend
npm install
npm run dev
```

Frontend will run at `http://localhost:5173`

### 5. Login

Open `http://localhost:5173` in your browser.

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

---

## Alternative: Docker Compose (Full Stack)

If you have Docker installed:

```bash
cd rg-store
docker-compose up -d
```

This starts PostgreSQL + Backend together. Then run the frontend separately with `npm run dev`.

---

## Project Structure

```
rg-store/
├── backend/
│   └── src/
│       ├── index.ts              # Express app entry
│       ├── middleware/auth.ts    # JWT middleware
│       ├── routes/               # auth, products, sales, reports
│       ├── controllers/          # Business logic
│       └── prisma/
│           ├── schema.prisma     # Database schema
│           ├── client.ts         # Prisma client singleton
│           └── seed.ts           # Sample data seeder
├── frontend/
│   └── src/
│       ├── App.tsx               # Router
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── POSPage.tsx
│       │   ├── InventoryPage.tsx
│       │   └── ReportsPage.tsx
│       ├── components/
│       │   ├── BarcodeScanner.tsx
│       │   ├── Layout.tsx
│       │   └── ui/               # shadcn/ui components
│       ├── api/                  # Axios API clients
│       ├── context/AuthContext.tsx
│       ├── hooks/use-toast.ts
│       ├── lib/utils.ts
│       └── types/index.ts
└── docker-compose.yml
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| PUT | /api/auth/change-password | Change password (auth required) |

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List all products |
| GET | /api/products/:id | Get product by ID |
| GET | /api/products/barcode/:barcode | Get product by barcode |
| GET | /api/products/categories | List categories |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Soft-delete product |
| POST | /api/products/:id/adjust-stock | Adjust stock (IN/OUT) |

### Sales
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/sales | List sales (filter by date) |
| GET | /api/sales/:id | Get sale by ID |
| POST | /api/sales | Create sale (deducts stock) |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/reports/daily?date=YYYY-MM-DD | Daily report |
| GET | /api/reports/range?days=7 | Revenue trend |
| GET | /api/reports/inventory | Inventory summary |

---

## Deployment (Cloud)

### Backend → Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo → select `/rg-store/backend`
3. Add PostgreSQL plugin in Railway
4. Set environment variables (copy from `.env`, update `DATABASE_URL` to Railway's Postgres URL)
5. Set `FRONTEND_URL` to your Vercel URL

### Frontend → Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Import project → select `/rg-store/frontend` as root
3. Set environment variable: `VITE_API_URL=https://your-railway-backend-url.railway.app`
4. Deploy

---

## Default Login

```
Username: admin
Password: admin123
```

Change the password after first login via the API:
```bash
curl -X PUT http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"admin123","newPassword":"yourNewPassword"}'
```
