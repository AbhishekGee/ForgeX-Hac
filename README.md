# PharmFetch

A hyperlocal medicine delivery marketplace connecting three independent parties — **customers**, **pharmacies**, and **delivery partners** — plus an **admin** dashboard for marketplace operations.

A customer photographs a prescription (or types medicine names) and sees which open nearby pharmacy has each medicine, with price. They build a cart with quantities and order. The pharmacy confirms the reservation and packs it. A delivery partner accepts the job and updates delivery status. The customer sees live status (including the rider's name) and gets plain-language instructions. Admins see marketplace-wide metrics and every order, pharmacy and rider.

Prototype for a hackathon demo. All pharmacies, riders and orders are invented demo data. Not medical advice. Every prescription read must be checked by a pharmacist.

## The four interfaces

| Route | Role | What it does |
| --- | --- | --- |
| `/` | Customer | Search medicines (text or prescription photo), build a cart with quantities, pick a pharmacy, track delivery, get instructions. |
| `/pharmacy` | Pharmacy | Answer stock requests, confirm/cancel orders, manage inventory, clear the pharmacist review queue. `/shop` redirects here. |
| `/partner` | Delivery partner | See available (reserved, unassigned) deliveries, accept one, mark picked up / delivered. |
| `/admin` | Admin | Marketplace metrics (orders, revenue, pharmacy/partner counts, pending reviews), recent orders, pharmacy and rider rosters. |

## Order states

`awaiting_shop → accepted → preparing → ready_for_pickup → out_for_delivery → delivered`, with `rejected` (from `awaiting_shop`, pharmacy declines with a reason), `cancelled` (pharmacy cancels after accepting) and `failed_delivery` (partner reports a failed attempt) as terminal side-branches. Every transition is enforced centrally in `lib/orders.js` — invalid jumps (e.g. `awaiting_shop → delivered`) are rejected, and a full timestamped history is kept on the order and shown on the customer's tracking page.

Prescription-required medicines (`RX_ONLY` in `lib/medicines.js`) additionally carry an `order.prescriptionStatus` (`not_required` / `pending` / `approved` / `rejected`), set when the order is placed. A pharmacy cannot mark a `pending` order as `preparing` until it approves the prescription; rejecting it immediately cancels the order.

## Demo: Scenario A — standard order

1. Open `/` (customer). Use a "Frequently searched" chip (e.g. Paracetamol) or type a name, continue, bump the quantity in the cart, then **Find pharmacies**.
2. Pick an open, verified pharmacy with everything in stock — **Order from this pharmacy**.
3. Open `/pharmacy` in another tab. Pick the same pharmacy and **Accept order**, then **Mark preparing**, then **Ready for pickup**.
4. Open `/partner` in a third tab. The order appears under **Available jobs** — **Accept delivery**, then **Confirm pickup**, then **Mark delivered**.
5. Back on `/`, the customer's order auto-updates (polls every 4s) through the full timeline to **Delivered**, with the rider's name.
6. Open `/admin` to see the order counted in total orders, gross order value, platform revenue, and delivery completion rate.

## Demo: Scenario B — prescription-required order

1. On `/pharmacy`, switch to **City Care Pharmacy (demo)** — the only seeded pharmacy stocking Azithromycin (prescription-required).
2. As a customer, add Azithromycin from "Frequently searched" (note its `Rx` badge) with a prescription photo attached, and order it from City Care Pharmacy.
3. On `/pharmacy`, **Accept order** — note **Mark preparing** is unavailable until the prescription is reviewed.
4. Click **Approve prescription** — preparing is now unblocked. (Click **Reject prescription** instead on a second test order to see it immediately move to `rejected` with the fulfilment path blocked for good.)

## Demo: Scenario C — failure handling

- **Pharmacy rejection with reason**: on an `awaiting_shop` order, click **Reject** and pick a reason (Out of stock, Store closing, …) — it shows on the customer's order and in the admin's "Rejected orders" list.
- **Duplicate delivery acceptance**: have two delivery-partner tabs open on the same `ready_for_pickup` order; the second **Accept delivery** click is rejected server-side ("Already accepted by another partner").
- **Invalid transition**: any out-of-order status request (e.g. skipping straight to `delivered`) is rejected by the central state machine with a clear error.

Demo auth is a shared PIN per role (`SHOP_PIN`, `PARTNER_PIN`, `ADMIN_PIN` env vars) — leave them unset locally and every role is open with no PIN prompt, which is the easiest way to run the demos above.

## What does what

| Tool | Role |
| --- | --- |
| Claude | `/api/extract` reads the prescription photo into a medicine list with confidence scores. `/api/instructions` rewords approved label text, and its output is rejected if it adds any number not in the approved text. |
| n8n | Optional. The app posts stock requests and orders to an n8n webhook, which sends WhatsApp messages to shops. Shop replies come back through `/api/shops/reply`. Workflow: `n8n/pharmfetch.workflow.json`. |
| GitHub | Code, prompts and the prescription-only rule list (`lib/medicines.js`). CI (`.github/workflows/ci.yml`) runs the tests and the build on every push. |
| Vercel | Hosts the Next.js app and API routes. |

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY at minimum
npm run dev                  # http://localhost:3000
npm test
```

Without `ANTHROPIC_API_KEY` typed medicine names still work; photo reading returns a clear error. Without Redis the app keeps state in memory, which resets on restart.

## Deploy

1. Push this folder to a new GitHub repository.
2. In Vercel choose **Add New, Project** and import the repo. Framework is detected as Next.js.
3. In the project, add the **Upstash Redis** integration (Storage tab). It sets the `UPSTASH_REDIS_REST_*` or `KV_REST_API_*` variables the app reads. Shared state is needed: Vercel functions do not share memory, so without it shop replies will not reach the patient page.
4. Add environment variables: `ANTHROPIC_API_KEY`, optionally `CLAUDE_MODEL`, `SHOP_PIN`, `PARTNER_PIN`, `ADMIN_PIN`.
5. Redeploy. Open `/api/health` to confirm `store: "redis"` and `claude: true`.

## Connect n8n (optional)

1. Import `n8n/pharmfetch.workflow.json` into n8n.
2. Set n8n environment variables: `N8N_SHARED_SECRET`, `APP_URL` (your Vercel URL), `SHOP_PHONES` (JSON like `{"s1":"91XXXXXXXXXX"}`), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN` (WhatsApp Cloud API).
3. Activate the workflow. Copy the production URL of the **App event** webhook into Vercel as `N8N_WEBHOOK_URL`, and use the same `N8N_SHARED_SECRET` in Vercel.
4. To let shops reply from WhatsApp, point your WhatsApp inbound handler at the **Shop reply** webhook with `{shopId, medicine, inStock, price}`.

The workflow JSON has not been run against a live n8n or WhatsApp account. Check node settings after import.

## Safety rules (in code)

- Controlled drugs (`CONTROLLED` in `lib/medicines.js`) are never offered.
- Prescription-only drugs (`RX_ONLY`) are offered only with a prescription photo, and the resulting order cannot be prepared until a pharmacist approves it (`lib/orders.js`); rejecting it cancels the order outright.
- Unknown stock is shown as "waiting", never as in stock. A pharmacy must confirm before an order is allowed, and the server re-checks stock and opening hours when the order is placed.
- Low-confidence OCR reads go to the pharmacist review queue on `/pharmacy` (separate from the per-order prescription-approval gate above).
- Instruction text is demo text with no dose numbers. Replace `APPROVED_INFO` with pharmacist-approved label text before real use.
- A delivery can only be accepted by one partner, enforced atomically server-side in `/api/partners`, and a partner can only advance an order assigned to them.

## Known limits

- State is one JSON blob with read-modify-write, fine for a demo, not for traffic.
- `SHOP_PIN`/`PARTNER_PIN`/`ADMIN_PIN` are single shared PINs per role, not real accounts or sessions.
- No payments (cash on delivery, demo only), no live location (distances use a fixed demo point), no real pharmacy/rider onboarding beyond the demo licence/verification fields.
- Stock is boolean in/out per pharmacy, not a quantity count, so "prevent checkout past confirmed quantity" is enforced at the in-stock/out-of-stock level, not a numeric inventory count.
- Demo drug lists are short and not clinically reviewed. Pharmacy/pharmacist licence numbers are invented.
- No real payment capture exists, so refund states are not implemented — only order cancellation.
- No bottom tab bar / native-app chrome on mobile; navigation is a responsive hamburger menu plus the existing step indicator.
- No service worker/offline support — the manifest and icon make the app installable, not offline-capable.
