import { db } from "@/lib/db";
import {
    orderItems,
    orders,
    orderShipmentItems,
    orderShipments,
} from "@/lib/db/schema";
import { createOrder as createDelhiveryOrder } from "@/lib/delhivery/orders";
import {
    convertPaiseToRupees,
    generateOrderId,
    generatePickupLocationCode,
    generateReceiptId,
    getRawNumberFromPhone,
} from "@/lib/utils";
import type { OrderWithItemAndBrand } from "@/lib/validations";

type SourceOrder = OrderWithItemAndBrand | null;

const DEFAULT_DIMENSION = 10;
const DEFAULT_WEIGHT_GRAMS = 100;

function getSafeNumber(value: unknown, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function getVariantOrProductPrice(
    item: NonNullable<SourceOrder>["items"][number]
) {
    return getSafeNumber(item.variant?.price ?? item.product.price ?? 0, 0);
}

function buildReplacementDimensions(items: NonNullable<SourceOrder>["items"]) {
    const aggregate = items.reduce(
        (acc, item) => {
            const baseLength = Math.max(
                getSafeNumber(
                    item.variant?.length ?? item.product.length,
                    DEFAULT_DIMENSION
                ),
                DEFAULT_DIMENSION
            );
            const baseWidth = Math.max(
                getSafeNumber(
                    item.variant?.width ?? item.product.width,
                    DEFAULT_DIMENSION
                ),
                DEFAULT_DIMENSION
            );
            const baseHeight = Math.max(
                getSafeNumber(
                    item.variant?.height ?? item.product.height,
                    DEFAULT_DIMENSION
                ),
                DEFAULT_DIMENSION
            );
            const baseWeight = Math.max(
                getSafeNumber(
                    item.variant?.weight ?? item.product.weight,
                    DEFAULT_WEIGHT_GRAMS
                ),
                DEFAULT_WEIGHT_GRAMS
            );

            return {
                length: Math.max(acc.length, baseLength),
                width: Math.max(acc.width, baseWidth),
                height: acc.height + baseHeight * item.quantity,
                weight: acc.weight + baseWeight * item.quantity,
            };
        },
        {
            length: DEFAULT_DIMENSION,
            width: DEFAULT_DIMENSION,
            height: DEFAULT_DIMENSION,
            weight: DEFAULT_WEIGHT_GRAMS,
        }
    );

    return {
        length: Math.max(aggregate.length, DEFAULT_DIMENSION),
        width: Math.max(aggregate.width, DEFAULT_DIMENSION),
        height: Math.max(aggregate.height, DEFAULT_DIMENSION),
        weight: Math.max(aggregate.weight, DEFAULT_WEIGHT_GRAMS),
    };
}

export async function createDisputeReplacementOrder({
    sourceOrder,
    brandId,
    orderItemId,
    quantityOverrides,
}: {
    sourceOrder: SourceOrder;
    brandId: string;
    orderItemId?: string | null;
    quantityOverrides?: Record<string, number>;
}) {
    if (!sourceOrder) {
        throw new Error("Source order could not be loaded");
    }

    const brandItems = sourceOrder.items
        .filter(
            (item) =>
                item.product.brandId === brandId &&
                (!orderItemId || item.id === orderItemId)
        )
        .map((item) => {
            const overrideQuantity = quantityOverrides?.[item.id];
            const normalizedQuantity =
                typeof overrideQuantity === "number" &&
                Number.isFinite(overrideQuantity)
                    ? Math.max(1, Math.trunc(overrideQuantity))
                    : item.quantity;

            return {
                ...item,
                quantity: normalizedQuantity,
            };
        });

    if (!brandItems.length) {
        throw new Error("No matching order items found for this brand");
    }

    const brand = brandItems[0]?.product.brand;
    const address = sourceOrder.address;

    if (!brand || !address) {
        throw new Error("Source order is missing brand or address details");
    }

    const replacementOrderId = generateOrderId(brand.name);
    const replacementReceiptId = generateReceiptId();
    const totalItems = brandItems.reduce((sum, item) => sum + item.quantity, 0);
    const replacementListAmount = brandItems.reduce(
        (sum, item) => sum + getVariantOrProductPrice(item) * item.quantity,
        0
    );

    const dimensions = buildReplacementDimensions(brandItems);
    const productDescription = brandItems
        .map((item) => item.product.title)
        .filter(Boolean)
        .join(", ");

    const delhiveryPayload = {
        pickup_location: {
            name: generatePickupLocationCode({
                brandId,
                brandName: brand.name,
            }),
        },
        shipments: [
            {
                name: address.fullName,
                add: address.street,
                city: address.city,
                state: address.state,
                country: "India",
                pin: address.zip,
                phone: String(getRawNumberFromPhone(address.phone)),
                order: replacementOrderId,
                payment_mode: "Prepaid" as const,
                total_amount: +convertPaiseToRupees(replacementListAmount),
                cod_amount: 0,
                products_desc: productDescription || "Dispute replacement",
                weight: dimensions.weight,
                shipment_length: dimensions.length / 10,
                shipment_width: dimensions.width / 10,
                shipment_height: dimensions.height / 10,
                quantity: String(totalItems),
                seller_name: brand.name,
                seller_add: brand.address || "Warehouse Address",
                return_name: brand.name,
                return_add: brand.address || "Warehouse Address",
                return_city: address.city,
                return_phone: String(getRawNumberFromPhone(address.phone)),
                return_state: address.state,
                return_country: "India",
                return_pin: address.zip,
                fragile_shipment: false,
                plastic_packaging: false,
            },
        ],
    };

    const delhiveryResponse = await createDelhiveryOrder(delhiveryPayload);

    if (
        !delhiveryResponse?.success ||
        delhiveryResponse?.data?.success !== true
    ) {
        throw new Error(
            "Failed to create the replacement shipment in Delhivery"
        );
    }

    const pkg = delhiveryResponse.data.packages?.[0];

    const created = await db.transaction(async (tx) => {
        const createdOrder = await tx
            .insert(orders)
            .values({
                id: replacementOrderId,
                userId: sourceOrder.userId,
                receiptId: replacementReceiptId,
                paymentId: null,
                paymentMethod: "support_replacement",
                paymentStatus: "paid",
                status: "pending",
                addressId: sourceOrder.addressId,
                totalItems,
                taxAmount: 0,
                deliveryAmount: 0,
                discountAmount: replacementListAmount,
                totalAmount: 0,
            })
            .returning()
            .then((res) => res[0]);

        const createdOrderItems = await tx
            .insert(orderItems)
            .values(
                brandItems.map((item) => ({
                    orderId: replacementOrderId,
                    productId: item.productId,
                    variantId: item.variantId,
                    sku: item.sku,
                    quantity: item.quantity,
                }))
            )
            .returning();

        const shipment = await tx
            .insert(orderShipments)
            .values({
                orderId: replacementOrderId,
                brandId,
                uploadWbn: delhiveryResponse.data.upload_wbn || null,
                status: "pending",
                delhiveryClientId: pkg?.client || null,
                delhiverySortCode: pkg?.sort_code || null,
                courierName: "Delhivery",
                awbNumber: pkg?.waybill || null,
                isAwbGenerated: true,
                givenLength: dimensions.length,
                givenWidth: dimensions.width,
                givenHeight: dimensions.height,
            })
            .returning()
            .then((res) => res[0]);

        if (createdOrderItems.length) {
            await tx.insert(orderShipmentItems).values(
                createdOrderItems.map((item) => ({
                    shipmentId: shipment.id,
                    orderItemId: item.id,
                }))
            );
        }

        return {
            order: createdOrder,
            shipment,
        };
    });

    return {
        replacementOrderId,
        replacementReceiptId,
        awbNumber: created.shipment.awbNumber,
        uploadWbn: created.shipment.uploadWbn,
        courierName: created.shipment.courierName,
        order: created.order,
        shipment: created.shipment,
    };
}
