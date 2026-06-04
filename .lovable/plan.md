# WMS Outbound Panel — Plan

Build a warehouse management (WMS) outbound panel using mock data (no backend). The layout uses a persistent sidebar with six modules: Order, Pick, Sort, Pack, Manifest, Dispatch. Order is fully built; the other five render styled placeholder screens that share the same shell, ready to be filled in later.

## Design direction

- Operational, dense, enterprise WMS feel — think dashboards used on warehouse floors.
- Neutral slate background, strong typographic hierarchy, status pills with semantic colors (created / picked / packed / manifested / dispatched).
- Tokens added to `src/styles.css` for status colors (info, warning, success, muted) so every screen stays consistent.
- Shadcn `Sidebar` (collapsible icon variant) + shadcn `Table`, `Badge`, `Card`.

## Routes

```
src/routes/
  __root.tsx                       (existing — unchanged)
  index.tsx                        (redirect to /orders)
  _wms.tsx                         (layout: SidebarProvider + AppSidebar + header + <Outlet />)
  _wms.orders.tsx                  (Orders table)
  _wms.orders.$orderNo.tsx         (Order detail: stepper + items table)
  _wms.pick.tsx                    (placeholder)
  _wms.sort.tsx                    (placeholder)
  _wms.pack.tsx                    (placeholder)
  _wms.manifest.tsx                (placeholder)
  _wms.dispatch.tsx                (placeholder)
```

`_wms.tsx` is a pathless layout route so the sidebar wraps every WMS page. `index.tsx` issues a `<Navigate to="/orders" />`.

## Components

- `src/components/wms/app-sidebar.tsx` — six nav items with lucide icons (Package, Hand, Filter, Box, ClipboardList, Truck), active state via `useRouterState`, collapsible to icon strip.
- `src/components/wms/status-badge.tsx` — maps status string to a tokenized Badge variant.
- `src/components/wms/order-journey-stepper.tsx` — horizontal 5-step stepper (Created → Picked → Packed → Manifested → Dispatched) with done / current / pending states, connector lines, check icons.
- `src/components/wms/page-header.tsx` — title + subtitle + optional actions slot reused on every screen.

## Data

`src/lib/wms/mock-data.ts` exports:

- `orders: Order[]` — ~12 rows covering each status, with fields: `orderNo, extOrderNo, channel, seller, courier, sla, paymentMode, status, totalQuantity, items[]`.
- `Item { sku, name, quantity, status }`.
- `getOrder(orderNo)` helper.

Statuses: `created | picked | packed | manifested | dispatched`. Channels (Amazon, Flipkart, Shopify), couriers (Delhivery, BlueDart, XpressBees), payment modes (Prepaid, COD), SLAs (Same Day, Next Day, Standard).

## Orders screen (`/orders`)

- Page header "Orders" with order count and a (non-functional) search input + filter button.
- Card containing shadcn Table with columns exactly as requested: Order No, Ext Order No, Channel, Seller, Courier, SLA, Payment Mode, Status, Total Quantity.
- Status column uses `StatusBadge`.
- Entire row is a TanStack `Link` to `/orders/$orderNo` (cursor-pointer, hover bg).

## Order detail screen (`/orders/$orderNo`)

- Back link to `/orders`.
- Header with Order No + Ext Order No + channel/seller meta line.
- `OrderJourneyStepper` derived from the order's current status (steps before/at status marked done, current highlighted).
- Summary cards: Courier, SLA, Payment Mode, Total Quantity.
- Items table: SKU, Name, Quantity, Status (with `StatusBadge`).
- `notFoundComponent` if `orderNo` doesn't match mock data.

## Placeholder module screens

Each of `pick / sort / pack / manifest / dispatch` renders `PageHeader` + a centered empty-state card ("Pick module — coming soon") so navigation feels complete and the design system is visible.

## SEO / head

Each route sets its own `head()` with module-specific title and description. Order detail uses `Order ${orderNo} — WMS`.

## Technical details

- TanStack Router file-based routes with the `_wms` pathless layout (Outlet inside).
- Mock data only — no Lovable Cloud, no server functions.
- All colors via semantic tokens in `src/styles.css` (add `--status-created`, `--status-picked`, `--status-packed`, `--status-manifested`, `--status-dispatched` + foregrounds, registered in `@theme inline`).
- Sidebar uses `collapsible="icon"`; `SidebarTrigger` lives in the top header so it stays visible when collapsed.
- Type-safe links: `<Link to="/orders/$orderNo" params={{ orderNo }} />`.

## Out of scope (call out for follow-up)

- Real data / Lovable Cloud integration.
- Functional search, filters, pagination.
- Building out Pick / Sort / Pack / Manifest / Dispatch workflows (placeholders only).
- Auth / roles.
