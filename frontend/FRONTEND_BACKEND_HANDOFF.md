# Frontend / Backend Handoff Notes

This frontend can keep moving while the backend is paused by using API-first services with local fallback data. Pages should call the intended backend endpoint, then show demo data when the request fails. When backend work resumes, replacing the fallback with real responses should not require redesigning the UI.

## Implemented or Frontend-Ready

- Product browsing: search term integration, category filter, min/max price filter, sorting, product detail navigation, and local add-product demo flow.
- Cart and checkout: cart management UI, multiple payment choices, card validation, and mock order placement flow.
- Orders: order list, status/date filters, expandable order items, CSV export, and shipment status fallback data.
- Reviews: review listing, filters, user review submission, delete behavior, and corporate/admin reply flow.
- Dashboards: role-aware USER, CORPORATE, and ADMIN dashboards with fallback data.
- Data visualization: reusable Chart.js widget for line, bar, and doughnut charts. Dashboard and analytics pages can render interactive charts without backend data.
- Profile/settings: frontend forms and local fallback behavior are present; profile endpoint contract is documented in `PROFILE_BACKEND_CONTRACT.md`.

## Backend Contracts Needed Later

### Analytics and Dashboards

- `GET /api/dashboard/user?range=7d|30d|90d`
- `GET /api/dashboard/corporate?range=7d|30d|90d`
- `GET /api/dashboard/admin?range=7d|30d|90d`
- `GET /api/analytics/overview`

Responses should match the existing dashboard model in `src/app/features/dashboard/models/widget.model.ts`.

### Catalog and Inventory

- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `GET /api/inventory/alerts`
- `PATCH /api/inventory/{productId}`

Product list items currently expect at least `id`, `name`, `categoryName`, `unitPrice`, and `storeName`.

### Orders, Payment, and Shipment

- `GET /api/orders`
- `GET /api/orders/{id}`
- `POST /api/orders`
- `PATCH /api/orders/{id}/status`
- `GET /api/shipments/order/{orderId}`
- `POST /api/payments/intent` or equivalent payment initialization endpoint

Order list items currently expect `id`, `status`, `grandTotal`, `createdAt`, `storeName`, and either `items` or `orderItems`.

### Reviews and Customers

- `GET /api/reviews`
- `POST /api/reviews`
- `DELETE /api/reviews/{id}`
- `POST /api/reviews/{id}/reply`
- `GET /api/customers`
- `GET /api/customers/{id}`
- `GET /api/customers/segments`

### Admin

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/{id}/status`
- `DELETE /api/admin/users/{id}`
- `GET /api/admin/stores`
- `PATCH /api/admin/stores/{id}/status`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/{id}`
- `DELETE /api/admin/categories/{id}`
- `GET /api/admin/audit-logs`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

## Frontend Work That Can Continue Without Backend

- Improve corporate product CRUD modals into full create/edit/delete UI using local state.
- Add inventory screen with low-stock badges and local reorder thresholds.
- Add admin user/store/category management screens backed by mock data.
- Add better empty/loading/error states for each feature.
- Add focused component tests for filtering, sorting, CSV export, dashboard role rendering, and review replies.
