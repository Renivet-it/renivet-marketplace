import {
    CorporateCommercialDocumentTemplate,
    type CorporateCommercialDocumentData,
} from "@/components/pdf/corporate-commercial-document-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandConfidentials,
    brandMembers,
    corporateExtraChargeRules,
    corporatePurchaseOrders,
    corporateVendorPurchaseOrders,
    products,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import {
    corporatePartyAddress,
    getCorporateDocumentSettings,
} from "@/lib/services/corporate-documents";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { renderToStream } from "@react-pdf/renderer";
import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function configText(value: unknown, keys: string[]) {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    for (const key of keys) {
        const candidate = record[key];
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
        }
        if (typeof candidate === "number") return String(candidate);
    }
    return null;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId)
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const { id } = await params;
    const order = await db.query.corporateOrders.findFirst({
        where: (table, { eq }) => eq(table.id, id),
        with: { brand: true, quote: { with: { profile: true } } },
    });
    if (!order?.brand)
        return NextResponse.json(
            { message: "Corporate order or supplier brand not found" },
            { status: 404 }
        );

    const canViewAllOrders = hasPermission(permissions, [
        BitFieldSitePermission.VIEW_ORDERS,
    ]);
    const brandMembership = canViewAllOrders
        ? null
        : await db.query.brandMembers.findFirst({
              where: and(
                  eq(brandMembers.brandId, order.brand.id),
                  eq(brandMembers.memberId, userId)
              ),
          });
    if (!canViewAllOrders && !brandMembership) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const vendorPo = await db.query.corporateVendorPurchaseOrders.findFirst({
        where: eq(corporateVendorPurchaseOrders.orderId, order.id),
        orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
    });
    if (!vendorPo || vendorPo.status === "cancelled") {
        return NextResponse.json(
            { message: "Renivet purchase order has not been issued" },
            { status: 404 }
        );
    }

    const [settings, brandDetails, customerPo, product] = await Promise.all([
        getCorporateDocumentSettings(),
        db.query.brandConfidentials.findFirst({
            where: eq(brandConfidentials.id, order.brand.id),
        }),
        db.query.corporatePurchaseOrders.findFirst({
            where: eq(corporatePurchaseOrders.corporateOrderId, order.id),
            orderBy: [desc(corporatePurchaseOrders.createdAt)],
        }),
        order.quote?.productId
            ? db.query.products.findFirst({
                  where: eq(products.id, order.quote.productId),
              })
            : Promise.resolve(null),
    ]);

    const productConfig = (order.productConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const productType = configText(productConfig.productType, [
        "name",
        "title",
        "label",
    ]);
    const rawGsm = configText(productConfig.gsmOption, [
        "gsm",
        "name",
        "label",
    ]);
    const formattedGsm = rawGsm
        ? rawGsm.toLowerCase().endsWith("gsm")
            ? rawGsm
            : `${rawGsm} GSM`
        : null;

    const fabric = configText(productConfig.fabricComposition, [
        "name",
        "composition",
        "label",
    ]);

    // Robust HSN Code Resolution
    const hsn =
        order.quote?.hsnCode ||
        (order as any).hsnCode ||
        product?.hsCode ||
        configText(productConfig, ["hsnCode"]) ||
        null;

    const docNumber =
        (vendorPo as any).foNumber ||
        (vendorPo as any).poNumber ||
        "FO/2627/00001";
    const unitPricePaise =
        (vendorPo as any).unitSellPricePaise ||
        (vendorPo as any).unitBuyPricePaise ||
        (order.quote?.unitPricePaise ??
            (order.unitPricePaise ?? Math.round(order.subtotalPaise / Math.max(1, order.quantity))));

    const baseSubtotalPaise = unitPricePaise * vendorPo.quantity;
    const totalTaxablePaise =
        vendorPo.taxableValuePaise ?? baseSubtotalPaise;
    const customizationPaise = Math.max(
        0,
        totalTaxablePaise - baseSubtotalPaise
    );
    const gstAmountPaise =
        (vendorPo.cgstPaise ?? 0) +
        (vendorPo.sgstPaise ?? 0) +
        (vendorPo.igstPaise ?? 0);
    const totalAmountPaise =
        vendorPo.totalAmountPaise ?? totalTaxablePaise + gstAmountPaise;
    const sizeBreakdown = Object.entries(order.sizeBreakdown ?? {})
        .map(([size, quantity]) => ({ size, quantity: Number(quantity) }))
        .filter((row) => row.size.trim() && Number.isFinite(row.quantity));

    // Fetch extra charge rules with amounts if selected
    let extraChargeDescriptions: string[] = [];
    if (
        Array.isArray(order.quote?.extraChargeRuleIds) &&
        order.quote.extraChargeRuleIds.length > 0
    ) {
        const extraRules = await db.query.corporateExtraChargeRules.findMany({
            where: inArray(
                corporateExtraChargeRules.id,
                order.quote.extraChargeRuleIds
            ),
        });
        extraChargeDescriptions = extraRules.map((r) => {
            const costPaise =
                r.chargeType === "per_unit"
                    ? r.amountPaise * vendorPo.quantity
                    : r.amountPaise;
            const costStr =
                costPaise > 0
                    ? ` (+INR ${(costPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                    : "";
            return `${r.name}${costStr}`;
        });
    }

    const manualExtraPaise = order.quote?.manualExtraAmountPaise ?? 0;
    const manualCostStr =
        manualExtraPaise > 0
            ? ` (+INR ${(manualExtraPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
            : "";
    if (order.quote?.manualExtraDescription) {
        extraChargeDescriptions.push(
            `Custom: ${order.quote.manualExtraDescription}${manualCostStr}`
        );
    } else if (manualExtraPaise > 0) {
        extraChargeDescriptions.push(`Custom charges${manualCostStr}`);
    }

    const extrasSummary = extraChargeDescriptions.join(" | ");
    const specsSummary = [formattedGsm, fabric].filter(Boolean).join(" | ");
    const itemDetail = [
        specsSummary,
        extrasSummary ? `Extras: ${extrasSummary}` : null,
    ]
        .filter(Boolean)
        .join(" | ") ||
        "Manufacture and fulfil as per approved corporate specifications.";

    const data: CorporateCommercialDocumentData = {
        title: "Brand Fulfillment Order",
        subtitle:
            "Operational instruction — NOT a purchase order. Renivet is not buying from the brand.",
        documentType: "fulfillment_order",
        documentNumber: docNumber,
        documentDate: vendorPo.issueDate || new Date(),
        validUntil: vendorPo.expectedDeliveryDate,
        fromLabel: "Fulfilled By",
        toLabel: "Fulfillment Brand (Supplier)",
        from: {
            name: settings.legalName,
            address: corporatePartyAddress(settings) || "Not provided",
            gstin: settings.gstin,
            email: settings.email,
            phone: settings.phone,
        },
        to: {
            name: order.brand.name,
            address:
                corporatePartyAddress(brandDetails ?? {}) || "Not provided",
            gstin: brandDetails?.gstin,
            email: order.brand.email,
            phone: order.brand.phone,
        },
        references: [
            { label: "FO number", value: docNumber },
            {
                label: "Document date",
                value: vendorPo.issueDate
                    ? new Date(vendorPo.issueDate).toLocaleDateString("en-IN")
                    : new Date().toLocaleDateString("en-IN"),
            },
            {
                label: "Expected delivery",
                value: vendorPo.expectedDeliveryDate
                    ? new Date(
                          vendorPo.expectedDeliveryDate
                      ).toLocaleDateString("en-IN")
                    : "As per agreed timeline",
            },
            { label: "Corporate order", value: order.publicOrderId },
            {
                label: "Corporate buyer",
                value: `${order.companyName}${order.gstNumber ? ` (GSTIN: ${order.gstNumber})` : ""}`,
            },
            {
                label: "Delivery mode",
                value:
                    vendorPo.deliveryMode === "direct_to_customer"
                        ? "Direct to corporate buyer"
                        : "Renivet warehouse",
            },
            {
                label: "Deliver to address",
                value:
                    vendorPo.deliveryAddress ||
                    order.deliveryAddress ||
                    "As specified in delivery instructions",
            },
            {
                label: "Packaging & QC",
                value:
                    vendorPo.deliveryInstructions ||
                    "Standard protective packaging with corporate packing slip",
            },
            {
                label: "Marketplace billing",
                value: "Renivet issues Tax Invoice on brand behalf",
            },
        ],
        items: [
            {
                description:
                    product?.title ?? productType ?? "Corporate merchandise",
                detail: itemDetail,
                sku: product?.sku ?? product?.nativeSku,
                hsn,
                quantity: vendorPo.quantity,
                unitRatePaise: unitPricePaise,
                amountPaise: baseSubtotalPaise,
                totalAmountPaise: baseSubtotalPaise,
            },
            ...(customizationPaise > 0
                ? [
                      {
                          description: "Customization / Extras",
                          detail:
                              extrasSummary ||
                              "Customization included with the product supply.",
                          hsn,
                          quantity: 1,
                          unit: "lot",
                          unitRatePaise: customizationPaise,
                          amountPaise: customizationPaise,
                          totalAmountPaise: customizationPaise,
                      },
                  ]
                : []),
        ],
        sizeBreakdown,
        totals: {
            subtotalPaise:
                customizationPaise > 0 ? baseSubtotalPaise : undefined,
            customizationPaise:
                customizationPaise > 0 ? customizationPaise : undefined,
            taxableValuePaise: totalTaxablePaise,
            gstRateBps: vendorPo.gstRateBps,
            gstAmountPaise,
            cgstPaise: vendorPo.cgstPaise,
            sgstPaise: vendorPo.sgstPaise,
            igstPaise: vendorPo.igstPaise,
            totalAmountPaise,
        },
        notes: Array.from(
            new Set([
                "Operational instruction — NOT a purchase order. Renivet is NOT buying from the brand.",
                "Renivet will generate the Tax Invoice on your behalf per our marketplace agreement.",
                vendorPo.deliveryInstructions
                    ? `Packaging & Shipping: ${vendorPo.deliveryInstructions}`
                    : "Packaging & Shipping: Ship to corporate address per the delivery instructions above.",
            ])
        ),
        signatoryName: settings.authorizedSignatoryName,
        declarationCompanyName: settings.legalName,
        showSignatureBlock: false,
    };

    const stream = await renderToStream(
        <CorporateCommercialDocumentTemplate data={data} />
    );
    const chunks: Buffer[] = [];
    for await (const chunk of stream)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const safeNumber = docNumber.replace(/[^a-z0-9_-]+/gi, "_");
    return new NextResponse(Buffer.concat(chunks), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="fulfillment-order_${safeNumber}.pdf"`,
            "Cache-Control": "private, no-store",
        },
    });
}
