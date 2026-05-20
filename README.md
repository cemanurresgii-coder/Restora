# Restora — Digital Restaurant & Booking System

> MIS2006 — Web Programming Course Project · Haliç University

## Project Overview

Restora is a full-stack digital restaurant experience built with **React + Vite** and **Firebase**. Customers can browse an interactive menu with dietary filters, make table reservations with real-time availability, and track orders. Restaurant staff can manage reservations and process orders. Managers have access to an analytics dashboard with revenue, table utilization, and staff performance data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Backend / DB | Firebase (Firestore + Auth) |
| Routing | React Router DOM v6 |
| Icons | Lucide React |
| Charts | Recharts |
| Map | Leaflet + OpenStreetMap |
| Notifications | EmailJS + Firestore |
| Testing | Vitest |

---

## User Roles

| Role | Access |
|---|---|
| **Customer** | Browse menu, filter by dietary needs, make/cancel reservations, place orders |
| **Staff** | Manage reservations, process and update order status |
| **Manager** | Full dashboard: revenue, table analytics, popular items, staff performance |

---

## Project Structure

```
src/
├── firebase/
│   ├── config.js          # Firebase initialization (add your keys here)
│   └── seed.js            # One-time Firestore data seeder
├── store/
│   ├── useAuthStore.js    # Auth + role state (Zustand)
│   ├── useMenuStore.js    # Menu items global state
│   ├── useReservationStore.js  # Reservations + availability logic
│   └── useOrderStore.js   # Active orders + status tracking
├── services/
│   ├── menuService.js         # Firestore CRUD — menu items
│   ├── reservationService.js  # Firestore CRUD — reservations
│   ├── orderService.js        # Firestore CRUD — orders
│   └── dashboardService.js    # Aggregated stats
├── components/layout/
│   ├── Navbar.jsx         # Role-aware navigation
│   └── ProtectedRoute.jsx # Auth + role guard
└── pages/
    ├── auth/Login.jsx
    ├── customer/Menu.jsx
    ├── staff/Reservations.jsx
    └── manager/Dashboard.jsx
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run

```bash
npm run dev
```

Uygulama Firebase'e bağlıdır. Kullanıcı rolü Firestore'daki `users` koleksiyonundan okunur ve rol bazlı ekran yönlendirmesi otomatik yapılır.

---

## Firestore Collections

| Collection | Description |
|---|---|
| `users` | `{ role: 'customer' | 'staff' | 'manager' }` keyed by Firebase Auth UID |
| `menuItems` | Dish records with category, price, dietary flags, nutritional info |
| `reservations` | Booking records with tableId, zone, status, guest info |
| `orders` | Order records with items array, status, tableId |
| `tables` | Table configurations (zone, capacity) |
| `reviews` | Customer ratings and comments per menu item |
| `notifications` | In-app notifications per user with read/unread tracking |
| `emailLog` | Audit trail of all sent email/SMS notifications |

---

## Features Implemented

- [x] Vite + React project setup with Tailwind CSS v4 custom brand theme
- [x] Firebase Auth + Firestore with 3 user roles and protected routes
- [x] Interactive menu — dietary filters, nutritional info, search, user reviews
- [x] High-quality dish images (Unsplash) + YouTube recipe search per item
- [x] Table reservation with real-time availability and auto-assignment
- [x] Zone preference (Indoor / Window / Outdoor) in reservation flow
- [x] In-app ordering with item customization and special requests
- [x] Mock payment gateway (card formatting, brand detection, simulated approval)
- [x] Kitchen order queue — Kanban board (Pending → Preparing → Ready → Served)
- [x] Staff dashboard — manage reservations, table statuses, kitchen queue
- [x] Manager dashboard — KPI cards, revenue trend, popular items, peak hours
- [x] Revenue per table chart, staff performance report, inventory usage report
- [x] CSV export for sales and inventory data
- [x] Dual-channel notification system (in-app Firestore + EmailJS)
- [x] Interactive map — Leaflet + OpenStreetMap + Google Maps directions
- [x] Customer dietary profile saved to Firestore, auto-applied on menu load
- [x] Unit tests — 30+ test cases for reservation logic and order calculations
- [x] API documentation (`API_DOCS.md`)

---

## Team & Responsibilities

| İsim | Rol |
|---|---|
| Azra Altıntaş | |Order System and Notifications cart customization payment modal notification service
| Cemanur Eşgi | Integration, Testing & Deployment — Map, video, unit tests, environment setup |
| Rümeysa Özdemir | |Front Lead Customer Menu filtering reservetion flow dietary profile reviews
| Zehra İkbal Sayın | Backend & Database — Firestore schema, service layer, auth/role system, API docs |
| Hilal Yalçın | |Staff Manager Panel Kitchen Queue analytics charts reports CSV export 
---

## Live Demo

>restora-inky.vercel.app
---

## License

Academic project — Haliç University, 2026.
