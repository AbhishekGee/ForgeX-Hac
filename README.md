# LastMinute Meds (MVP)

A patient photographs a prescription (or types medicine names) and sees which open nearby chemist has each medicine, with price. They order, the shop confirms the reservation, and the patient gets plain-language instructions.

Prototype. All shops are invented demo data. Not medical advice. Every prescription read must be checked by a pharmacist.

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
4. Add environment variables: `ANTHROPIC_API_KEY`, optionally `CLAUDE_MODEL`, `SHOP_PIN`.
5. Redeploy. Open `/api/health` to confirm `store: "redis"` and `claude: true`.

Pages: `/` is the patient flow, `/shop` is the shopkeeper page (pick a shop, answer requests, confirm orders).

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
- `SHOP_PIN` is a single shared PIN, not real accounts.
- No payments, no rider dispatch (the shop delivers), no live location (distances use a fixed demo point).
- Demo drug lists are short and not clinically reviewed.
