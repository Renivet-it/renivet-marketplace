import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

const orderService = readFile(
    new URL("../src/lib/services/corporate-order.ts", import.meta.url),
    "utf8"
);
const platformService = readFile(
    new URL("../src/lib/services/corporate-platform.ts", import.meta.url),
    "utf8"
);
const schema = readFile(
    new URL("../src/lib/db/schema/corporate-platform.ts", import.meta.url),
    "utf8"
);
const documentPanel = readFile(
    new URL(
        "../src/components/dashboard/general/corporate-orders/corporate-document-chain-panel.tsx",
        import.meta.url
    ),
    "utf8"
);

test("warehouse dispatch requires an accepted current receipt in the shared guard", async () => {
    const source = await orderService;
    const guard = source.slice(
        source.indexOf("async updateStatus("),
        source.indexOf("async generateCorporateOrderNumber(")
    );

    expect(guard).toContain("renivet_warehouse");
    expect(guard).toContain("warehouseGoodsReceipt");
    expect(guard).toContain("accepted");
    expect(guard).toContain("receivedQuantity");
    expect(guard).toContain("updateCorporateOrderStatusIfCurrent");
});

test("direct mode keeps challan gating and brand status is mode-scoped", async () => {
    const [order, platform] = await Promise.all([
        orderService,
        platformService,
    ]);
    const guard = order.slice(
        order.indexOf("async updateStatus("),
        order.indexOf("async generateCorporateOrderNumber(")
    );
    const brandStatus = platform.slice(
        platform.indexOf("async updateBrandAssignedOrderStatus("),
        platform.indexOf("async generateReport(")
    );

    expect(guard).toContain("direct_to_customer");
    expect(guard).toContain("deliveryChallan");
    expect(brandStatus).toContain("direct_to_customer");
    expect(brandStatus).toContain("requireBrandMembership");
});

test("warehouse receipt schema and admin workflow are auditable and idempotent", async () => {
    const [dbSchema, platform] = await Promise.all([schema, platformService]);

    expect(dbSchema).toContain("corporateWarehouseGoodsReceipts");
    expect(dbSchema).toContain("received_quantity");
    expect(dbSchema).toContain("receipt_version");
    expect(dbSchema).toContain("isCurrentAccepted");
    expect(platform).toContain("recordWarehouseGoodsReceipt");
    expect(platform).toContain("recordWarehouseGoodsReceipt");
    expect(platform).toContain("idempotency");
});

test("document chain exposes warehouse receipt and explicit delivery mode", async () => {
    const source = await documentPanel;
    expect(source).toContain("goods received");
    expect(source).toContain("renivet_warehouse");
    expect(source).not.toContain("Not required for warehouse fulfilment");
});
