# Unicommerce Inventory Sync - Layman Plan

Date: 2026-04-13
Audience: Managers and non-technical stakeholders
Purpose: Explain what we will build, why, and how it will work in simple terms.

## 1) What problem we are solving
We want products that already live in Unicommerce to appear in our Renivet system, without manual re-entry. This will be used only for inventory management: we will fetch products (and their stock) from Unicommerce and store them in our database so our app can show correct stock.

## 2) What will and will not change
What will be added:
- A secure connection to Unicommerce (credentials stored safely).
- A sync process that regularly pulls products and stock from Unicommerce.
- A mapping step so Unicommerce product fields match our product fields.
- A simple admin control to trigger or monitor sync.

What will not change:
- We are not changing your order flow.
- We are not pushing data back to Unicommerce.
- We are not changing pricing or marketing logic from Unicommerce.

## 3) How it works (plain-English flow)
1. We connect to Unicommerce using their official API credentials.
2. The system requests the list of products from Unicommerce.
3. For each item, we translate Unicommerce fields into our product format.
4. We store or update the product in our database by matching SKU.
5. We also update stock quantities for the same SKU.
6. This runs on a schedule (for example every 30-60 minutes), and can be triggered manually when needed.

## 4) Key terms explained simply
- SKU: A unique product code. We use SKU to match products between Unicommerce and Renivet.
- Product: The main item (for example a shirt).
- Variant: A version of the product (for example shirt size M or color Blue).
- Sync: A process that checks Unicommerce and updates our system.

## 5) Data we will pull from Unicommerce
We will only pull what we need for inventory:
- SKU (required)
- Product name / title
- Variant info (size, color if provided)
- Stock quantity
- Optional fields if available: barcode, weight, dimensions

## 6) How we match products
- If a SKU already exists in our system, we update its quantity and basic info.
- If a SKU does not exist, we create a new product (or new variant).
- This avoids duplicates and keeps inventory accurate.

## 7) Where the data will be stored
- Products table: main product details.
- Product variants table: size/color variations and their stock.
- We already use these tables today, so no major change to the app is needed.

## 8) Security and access
- Unicommerce credentials are stored in environment variables (not in code).
- Access is limited to authorized system services only.
- Logs will record sync success/failure for audit.

## 9) Monitoring and safety checks
- If a sync fails, we log the error and keep the last known inventory.
- We can add alerts if repeated failures happen.
- The sync is read-only (Unicommerce data is not modified).

## 10) Rollout plan (simple timeline)
Phase 1: Connect and fetch sample products
- Verify API access and pull a test list.

Phase 2: Build mapping and store in our DB
- Confirm correct data is saved (SKU, name, quantity).

Phase 3: Schedule sync
- Run automatically on a timer and allow manual run.

Phase 4: Go live
- Monitor for 1-2 weeks and fix any gaps.

## 11) Risks and how we handle them
- Risk: SKU mismatch.
  Mitigation: Require SKU mapping rules before sync.
- Risk: Unicommerce API downtime.
  Mitigation: Keep last successful inventory; retry later.
- Risk: Incorrect category mapping.
  Mitigation: Start with a limited set of products and expand gradually.

## 12) What the manager will need to decide
- How frequently to sync (example: every 30 or 60 minutes).
- Whether to import all products or only certain brands/categories.
- Which team member is the final reviewer of the first test sync.

## 13) What success looks like
- Inventory shown in Renivet matches Unicommerce.
- New items in Unicommerce appear in Renivet without manual work.
- No duplicate products and fewer stock-related order issues.

---
If you want this document adjusted for a shorter one-page summary or a more detailed technical plan, I can prepare that as well.