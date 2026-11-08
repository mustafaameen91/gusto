# Gusto Restaurant — مطعم جوستو

Restaurant POS and back-office system: cashier, kitchen and drinks screens, menu and recipes,
inventory and transfers, purchases and suppliers, shifts, expenses, accounting (GL) and reports.

| Folder | What it is | Stack |
|---|---|---|
| `gusto-backend/` | REST API + WebSocket | Node, Express, mysql2, Socket.IO |
| `gusto-frontend/` | Web app (Arabic RTL) | Vue 3, Vuetify, Vite |
| `gusto-electron/` | Desktop shell, thermal printing, customer display | Electron |

## First-time setup

```bash
# 1. Database (MySQL 5.7+). Creates gusto_db with all tables and setup data.
mysql -u root -p < gusto-backend/database/schema.sql

# 2. Backend — check gusto-backend/.env (host, user, password, port, db)
cd gusto-backend && npm install && npm run dev      # http://localhost:3128

# 3. Frontend
cd gusto-frontend && npm install && npm run dev     # http://localhost:8080

# 4. Desktop app (optional)
cd gusto-electron && npm install && npm run dev
```

Default login: `admin@gusto.com` / `admin123`. Change it after the first login.

### Test data (local only)

```bash
mysql -u root -p < gusto-backend/database/seed-test-data.sql
```

Adds one user per role (`supervisor@`, `cashier@`, `kitchen@`, `waiter@`, `purchases@`,
`storage@gusto.com`, all with password `123456`), 17 menu items with recipes and sizes,
19 ingredients, kitchen portions, 3 suppliers and 2 credit customers. Safe to run twice.
Don't load it on the restaurant's real database.

## Database

`gusto-backend/database/schema.sql` is the single source of truth. It already contains every
change from the original system's migrations, so there are no migration files to run. The
script is safe to run again: it only creates what is missing.

It seeds the chart of accounts, posting settings, expense categories, two storage locations
(main store and kitchen internal store), the admin user and six starter menu categories.

Sales revenue is split between **4101 drinks sales** and **4102 food sales**. A category counts
as drinks when its name contains مشروب, عصير, drink, beverage or juice; everything else is food.

## Before going live

- [ ] Replace the starter logo: `gusto-frontend/src/assets/logo.png`, `logo.svg`,
      `gusto-frontend/public/logo.svg`, `favicon.svg`, and `gusto-electron/assets/logo.png`,
      `icon.png`, `icon.ico`, `icon.icns`.
- [ ] Set the production URL in `gusto-electron/main.js` (`FRONTEND_URL`) or pass `GUSTO_URL`.
- [ ] Set `ALLOWED_ORIGINS` for the backend if the frontend is served from another domain.
- [ ] Production build: copy `gusto-frontend/dist` to `gusto-backend/gusto-frontend/dist`, which is
      where `server.js` serves the web app from.
- [ ] Check the business-day window: sales reports count a day from 07:00 to 02:59
      (`getCafeDayRange` in the backend). Adjust it to the restaurant's opening hours.
