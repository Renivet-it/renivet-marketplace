import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

const platformSource = readFile(
    new URL("./corporate-platform.ts", import.meta.url),
    "utf8"
);
const routerSource = readFile(
    new URL("../trpc/routes/general/corporate-platform.ts", import.meta.url),
    "utf8"
);
const orderSource = readFile(
    new URL("./corporate-order.ts", import.meta.url),
    "utf8"
);

test("shipment status writers delegate guarded order transitions", async () => {
    const source = await platformSource;
    const saveShipment = source.slice(
        source.indexOf("async saveShipment("),
        source.indexOf("async updateConsigneeAddress(")
    );
    const delhivery = source.slice(
        source.indexOf("async createForwardOrder("),
        source.indexOf("async scheduleCorporatePickup(")
    );

    expect(saveShipment).toContain("corporateOrderService.updateStatus");
    expect(delhivery).toContain("corporateOrderService.updateStatus");
    expect(saveShipment).not.toContain(
        "corporateOrderQueries.updateCorporateOrder(order.id, {\n                status: nextOrderStatus"
    );
    expect(saveShipment).not.toContain("this.notifyCustomerOrderDelivered");
    expect(delhivery).not.toContain(
        'corporateOrderQueries.updateCorporateOrder(order.id, {\n                status: "ready_for_dispatch"'
    );
});

test("brand status mutation is permission guarded and delegates transitions", async () => {
    const [source, router] = await Promise.all([platformSource, routerSource]);
    const brandMethod = source.slice(
        source.indexOf("async updateBrandAssignedOrderStatus("),
        source.indexOf("async generateReport(")
    );
    const routerMethod = router.slice(
        router.indexOf("updateBrandAssignedOrderStatus:"),
        router.indexOf("generateReport:")
    );

    expect(brandMethod).toContain("corporateOrderService.updateStatus");
    expect(routerMethod).toContain(
        "isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS)"
    );
});

test("the shared guard covers delivered and fails closed for warehouse mode", async () => {
    const source = await orderSource;
    expect(source).toContain(
        '["ready_for_dispatch", "dispatched", "delivered"]'
    );
    expect(source).toContain('deliveryMode === "renivet_warehouse"');
    expect(source).toContain("updateCorporateOrderStatusIfCurrent");
});

test("brand status transitions are idempotent", async () => {
    const source = await platformSource;
    const brandMethod = source.slice(
        source.indexOf("async updateBrandAssignedOrderStatus("),
        source.indexOf("async generateReport(")
    );
    expect(brandMethod).toContain("if (!didTransition) return updated");
});

test("brand assignment does not write order status directly", async () => {
    const source = await orderSource;
    const assignment = source.slice(
        source.indexOf("async assignBrand("),
        source.indexOf("async updateStatus(")
    );
    expect(assignment).not.toContain("status: nextStatus");
    expect(assignment).toContain("this.updateStatus");
});
