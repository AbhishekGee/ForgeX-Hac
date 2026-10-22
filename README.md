# LastMinute Meds

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

## Demo: the full order lifecycle

1. Open `/` (customer). Type `Paracetamol`, continue, bump the quantity in the cart, then **Find pharmacies**.
2. Pick an open pharmacy with everything in stock — **Order from this pharmacy**. The order starts `awaiting_shop`.
3. Open `/pharmacy` in another tab (or browser profile). Pick the same pharmacy shown on the order and click **Confirm reserved**.
4. Open `/partner` in a third tab. The order now appears under **Available jobs** — click **Accept delivery**, then **Picked up, out for delivery**, then **Mark delivered**.
5. Back on `/`, the customer's order auto-updates (polls every 4s) through to **Delivered**, showing the rider's name.
6. Open `/admin` to see the order counted in total orders, delivered revenue, and the "Orders by status" / "Recent orders" lists.

Demo auth is a shared PIN per role (`SHOP_PIN`, `PARTNER_PIN`, `ADMIN_PIN` env vars) — leave them unset locally and every role is open with no PIN prompt, which is the easiest way to run the demo above.

## What does what

| Tool | Role |
| --- | --- |
| Claude | `/api/extract` reads the prescription photo into a medicine list with confidence scores. `/api/instructions` rewords approved label text, and its output is rejected if it adds any number not in the approved text. |
| n8n | Optional. The app posts stock requests and orders to an n8n webhook, which sends WhatsApp messages to shops. Shop replies come back through `/api/shops/reply`. Workflow: `n8n/lastminute-meds.workflow.json`. |
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

1. Import `n8n/lastminute-meds.workflow.json` into n8n.
2. Set n8n environment variables: `N8N_SHARED_SECRET`, `APP_URL` (your Vercel URL), `SHOP_PHONES` (JSON like `{"s1":"91XXXXXXXXXX"}`), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN` (WhatsApp Cloud API).
3. Activate the workflow. Copy the production URL of the **App event** webhook into Vercel as `N8N_WEBHOOK_URL`, and use the same `N8N_SHARED_SECRET` in Vercel.
4. To let shops reply from WhatsApp, point your WhatsApp inbound handler at the **Shop reply** webhook with `{shopId, medicine, inStock, price}`.

The workflow JSON has not been run against a live n8n or WhatsApp account. Check node settings after import.

## Safety rules (in code)

- Controlled drugs (`CONTROLLED` in `lib/medicines.js`) are never offered.
- Prescription-only drugs (`RX_ONLY`) are offered only with a prescription photo.
- Unknown stock is shown as "waiting", never as in stock. A shop must confirm before an order is allowed, and the server re-checks stock and opening hours when the order is placed.
- Low-confidence reads go to the pharmacist review queue on `/shop`.
- Instruction text is demo text with no dose numbers. Replace `APPROVED_INFO` with pharmacist-approved label text before real use.

## Known limits

- State is one JSON blob with read-modify-write, fine for a demo, not for traffic.
- `SHOP_PIN`/`PARTNER_PIN`/`ADMIN_PIN` are single shared PINs per role, not real accounts or sessions.
- No payments (cash on delivery, demo only), no live location (distances use a fixed demo point), no real pharmacy/rider onboarding.
- Demo drug lists are short and not clinically reviewed.
- The pharmacist review queue is "mark checked" only — it does not yet notify the patient of the outcome.
