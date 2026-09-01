import {
    CorporateCommercialDocumentTemplate,
    type CorporateCommercialDocumentData,
} from "@/components/pdf/corporate-commercial-document-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandConfidentials,
    brands,
    corporateExtraChargeRules,
    corporateFabricCompositions,
    corporateGsmOptions,
    corporateOrders,
    corporateProductTypes,
    corporateProformaInvoices,
    corporateQuotes,
    products,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import {
    corporatePartyAddress,
    getCorporateDocumentSettings,
} from "@/lib/services/corporate-documents";
import {
    assertCorporateTaxData,
    resolveCorporateDocumentDate,
} from "@/lib/utils/corporate-document-integrity";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { renderToStream } from "@react-pdf/renderer";
import { eq, inArray } from "drizzle-orm";
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

    const { id } = await params;
    const invoice = await db.query.corporateProformaInvoices.findFirst({
        where: eq(corporateProformaInvoices.id, id),
    });
    if (!invoice || invoice.status !== "issued") {
        return NextResponse.json(
            { message: "Proforma invoice not found" },
            { status: 404 }
        );
    }

    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const canViewAdmin = hasPermission(permissions, [
        BitFieldSitePermission.VIEW_ORDERS,
    ]);

    const order = invoice.orderId
        ? await db.query.corporateOrders.findFirst({
              where: eq(corporateOrders.id, invoice.orderId),
          })
        : null;
    const quote =
        !order && invoice.quoteId
            ? await db.query.corporateQuotes.findFirst({
                  where: eq(corporateQuotes.id, invoice.quoteId),
                  with: {
                      profile: true,
                  },
              })
            : null;

    if (!order && !quote) {
        return NextResponse.json(
            { message: "The related corporate record was not found" },
            { status: 404 }
        );
    }

    // Self-service order proformas are intentionally admin-only for now.
    if (order && !canViewAdmin) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (
        quote &&
        !canViewAdmin &&
        quote.profile.userId !== userId &&
        quote.profile.email.trim().toLowerCase() !==
            user?.email?.trim().toLowerCase()
    ) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const brandId = quote?.brandId || order?.brandId || null;

    const [
        settings,
        product,
        brand,
        brandConfidential,
        productTypeRecord,
        gsmOptionRecord,
        fabricCompositionRecord,
    ] = await Promise.all([
        getCorporateDocumentSettings(),
        quote?.productId
            ? db.query.products.findFirst({
                  where: eq(products.id, quote.productId),
              })
            : Promise.resolve(null),
        brandId
            ? db.query.brands.findFirst({
                  where: eq(brands.id, brandId),
              })
            : Promise.resolve(null),
        brandId
            ? db.query.brandConfidentials.findFirst({
                  where: eq(brandConfidentials.id, brandId),
              })
            : Promise.resolve(null),
        quote?.productTypeId
            ? db.query.corporateProductTypes.findFirst({
                  where: eq(corporateProductTypes.id, quote.productTypeId),
                  with: { hsnMaster: true },
              })
            : Promise.resolve(null),
        quote?.gsmOptionId
            ? db.query.corporateGsmOptions.findFirst({
                  where: eq(corporateGsmOptions.id, quote.gsmOptionId),
              })
            : Promise.resolve(null),
        quote?.fabricCompositionId
            ? db.query.corporateFabricCompositions.findFirst({
                  where: eq(
                      corporateFabricCompositions.id,
                      quote.fabricCompositionId
                  ),
              })
            : Promise.resolve(null),
    ]);

    const taxableValuePaise = invoice.subtotalPaise;
    const quantity = order?.quantity ?? quote?.quantity ?? 1;
    const baseSubtotalPaise =
        quote?.subtotalPaise ?? order?.subtotalPaise ?? taxableValuePaise;
    const customizationPaise =
        quote?.customizationCostPaise ?? order?.customizationPaise ?? 0;

    const gstRateBps =
        order?.gstRateBps ??
        (taxableValuePaise > 0
            ? Math.round((invoice.gstAmountPaise / taxableValuePaise) * 10_000)
            : 0);
    const orderConfig = (order?.productConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const orderProductTypeName = configText(orderConfig.productType, [
        "name",
        "title",
        "label",
    ]);
    const orderGsm = configText(orderConfig.gsmOption, [
        "gsm",
        "name",
        "label",
    ]);
    const orderFabric = configText(orderConfig.fabricComposition, [
        "name",
        "composition",
        "label",
    ]);
    const orderHsn = configText(orderConfig, ["hsnCode"]);

    // Supplier Brand Details
    const supplierName =
        brandConfidential?.registeredBusinessName ||
        brand?.name ||
        "Supplier Brand";
    const supplierAddress =
        [
            brandConfidential?.addressLine1,
            brandConfidential?.addressLine2,
            brandConfidential?.city,
            brandConfidential?.state,
            brandConfidential?.postalCode,
        ]
            .filter(Boolean)
            .join(", ") || "Address on file";
    const supplierGstin = brandConfidential?.gstin || "Not provided";
    const supplierEmail = brandConfidential?.corporateEmail ?? undefined;
    const supplierPhone = brandConfidential?.corporatePhone ?? undefined;

    // Fetch extra charge rules with amounts if selected
    let extraChargeDescriptions: string[] = [];
    if (
        Array.isArray(quote?.extraChargeRuleIds) &&
        quote.extraChargeRuleIds.length > 0
    ) {
        const extraRules = await db.query.corporateExtraChargeRules.findMany({
            where: inArray(
                corporateExtraChargeRules.id,
                quote.extraChargeRuleIds
            ),
        });
        extraChargeDescriptions = extraRules.map((r) => {
            const costPaise =
                r.chargeType === "per_unit"
                    ? r.amountPaise * quantity
                    : r.amountPaise;
            const costStr =
                costPaise > 0
                    ? ` (+INR ${(costPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                    : "";
            return `${r.name}${costStr}`;
        });
    }

    // Manual extra with amount
    const manualExtraPaise = quote?.manualExtraAmountPaise ?? 0;
    const manualCostStr =
        manualExtraPaise > 0
            ? ` (+INR ${(manualExtraPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
            : "";
    if (quote?.manualExtraDescription) {
        extraChargeDescriptions.push(
            `Custom: ${quote.manualExtraDescription}${manualCostStr}`
        );
    } else if (manualExtraPaise > 0) {
        extraChargeDescriptions.push(`Custom charges${manualCostStr}`);
    }

    const resolvedItemName =
        product?.title ||
        productTypeRecord?.name ||
        orderProductTypeName ||
        (orderConfig?.productType as any)?.name ||
        order?.productConfigSnapshot?.productScopeSummary ||
        "Corporate merchandise";

    const rawGsm = gsmOptionRecord?.label || orderGsm;
    const formattedGsm = rawGsm
        ? rawGsm.toLowerCase().endsWith("gsm")
            ? rawGsm
            : `${rawGsm} GSM`
        : null;

    const specsSummary = [
        formattedGsm,
        fabricCompositionRecord?.name || orderFabric,
    ]
        .filter(Boolean)
        .join(" | ");

    const extrasSummary = extraChargeDescriptions.join(", ");

    const itemDetail =
        specsSummary || "Specifications as approved in the corporate quote";

    const resolvedHsn =
        quote?.hsnCode ||
        productTypeRecord?.hsnMaster?.hsnCode ||
        product?.hsCode ||
        orderHsn ||
        (orderConfig?.hsnCode as string) ||
        null;

    const billing = (quote?.profile.billingAddress ?? {}) as Record<
        string,
        unknown
    >;
    const billingAddress = [
        billing.addressLine1 ?? billing.address,
        billing.addressLine2,
        billing.city,
        billing.state,
        billing.postalCode ?? billing.pincode,
        billing.country,
    ]
        .filter(
            (value): value is string =>
                typeof value === "string" && value.trim().length > 0
        )
        .join(", ");

    // Dynamic advance percentage
    let advancePercent = 30;
    if (quote && quote.totalAmountPaise > 0) {
        advancePercent = Math.round(
            (quote.advanceAmountPaise * 100) / quote.totalAmountPaise
        );
    } else if (order && order.totalPaise > 0) {
        advancePercent = Math.round(
            (order.advancePaise * 100) / order.totalPaise
        );
    }

    let dynamicAdvanceTerm: string;
    if (advancePercent >= 100) {
        dynamicAdvanceTerm =
            "100% advance on PO confirmation / full payment required.";
    } else if (advancePercent <= 0) {
        dynamicAdvanceTerm =
            "Payment on delivery / balance within 15 days of dispatch.";
    } else {
        dynamicAdvanceTerm = `${advancePercent}% advance on PO confirmation; balance within 15 days of dispatch.`;
    }

    const renivetAddress =
        corporatePartyAddress(settings) || "Bangalore, India";

    // Strict derivation from exact Quote / Invoice record
    const totalGstFromDb = quote?.gstAmountPaise ?? invoice.gstAmountPaise;
    const totalAmountFromDb =
        quote?.totalAmountPaise ?? invoice.totalAmountPaise;

    const customizationGstRateBps = gstRateBps;
    const customizationGstAmountPaise =
        customizationPaise > 0
            ? Math.round(
                  (customizationPaise * customizationGstRateBps) / 10_000
              )
            : 0;

    const baseGstAmountPaise =
        totalGstFromDb > customizationGstAmountPaise
            ? totalGstFromDb - customizationGstAmountPaise
            : totalGstFromDb > 0
              ? totalGstFromDb
              : Math.round(
                    (baseSubtotalPaise *
                        gstRateBps) /
                        10_000
                );

    const baseGstRateBps =
        baseSubtotalPaise > 0
            ? Math.round((baseGstAmountPaise / baseSubtotalPaise) * 10_000)
            : gstRateBps;

    const computedTotalGstPaise =
        totalGstFromDb > 0
            ? totalGstFromDb
            : baseGstAmountPaise + customizationGstAmountPaise;
    const computedTotalAmountPaise =
        totalAmountFromDb > 0
            ? totalAmountFromDb
            : baseSubtotalPaise + customizationPaise + computedTotalGstPaise;

    const rawDate =
        (invoice as any).issueDate ||
        invoice.invoiceDate ||
        (invoice as any).createdAt;
    let safeDate: Date;
    let safeValidUntil: Date | undefined;
    try {
        safeDate = resolveCorporateDocumentDate(rawDate, quote?.createdAt ?? order?.createdAt);
        safeValidUntil = invoice.validUntil
            ? resolveCorporateDocumentDate(invoice.validUntil)
            : undefined;
        assertCorporateTaxData(
            order?.gstNumber ?? quote?.profile.gstNumber,
            [{ hsnCode: resolvedHsn, taxable: true }]
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "CORPORATE_DOCUMENT_SOURCE_INVALID";
        return NextResponse.json({ message }, { status: 422 });
    }

    const data: CorporateCommercialDocumentData = {
        title: "PROFORMA INVOICE",
        subtitle:
            "Commercial proposal issued before supply. This is not a tax invoice.",
        documentType: "proforma_invoice",
        documentNumber: invoice.invoiceNumber,
        documentDate: safeDate,
        validUntil: safeValidUntil,
        fromLabel: "Seller",
        toLabel: "To",
        from: {
            name: settings.legalName || "Renivet",
            address: renivetAddress,
            gstin: settings.gstin,
            email: supplierEmail,
            phone: supplierPhone,
        },
        to: order
            ? {
                  name: order.companyName,
                  address: [
                      order.deliveryAddress,
                      order.deliveryCity,
                      order.deliveryState,
                      order.deliveryPincode,
                      order.deliveryCountry,
                  ]
                      .filter(Boolean)
                      .join(", "),
                  gstin: order.gstNumber,
                  email: order.emailAddress,
                  phone: order.mobileNumber,
              }
            : {
                  name:
                      quote!.profile.companyName ||
                      quote!.profile.contactPerson ||
                      "Corporate customer",
                  address: billingAddress || "Not provided",
                  gstin: quote!.profile.gstNumber,
                  email: quote!.profile.email,
                  phone: quote!.profile.phone,
              },
        shipTo: order
            ? {
                  name: order.companyName,
                  address: [
                      order.deliveryAddress,
                      order.deliveryCity,
                      order.deliveryState,
                      order.deliveryPincode,
                      order.deliveryCountry,
                  ]
                      .filter(Boolean)
                      .join(", "),
                  gstin: order.gstNumber,
              }
            : null,
        references: order
            ? [
                  { label: "Corporate order", value: order.publicOrderId },
                  { label: "Payment status", value: "Advance received" },
                  {
                      label: "Customer contact",
                      value: order.contactPersonName,
                  },
              ]
            : [
                  { label: "Quote number", value: quote!.quoteNumber },
                  {
                      label: "Brand fulfillment partner",
                      value: supplierName,
                  },
                  {
                      label: "Quote validity",
                      value: invoice.validUntil
                          ? new Date(invoice.validUntil).toLocaleDateString(
                                "en-IN"
                            )
                          : null,
                  },
              ],
        items: [
            {
                description: resolvedItemName,
                detail: itemDetail,
                sku: product?.sku ?? product?.nativeSku,
                hsn: resolvedHsn,
                quantity,
                unit: "pcs",
                unitRatePaise: Math.round(
                    baseSubtotalPaise / Math.max(1, quantity)
                ),
                amountPaise: baseSubtotalPaise,
                gstRateBps: baseGstRateBps,
                gstAmountPaise: baseGstAmountPaise,
                totalAmountPaise: baseSubtotalPaise + baseGstAmountPaise,
            },
            ...(customizationPaise > 0
                ? [
                      {
                          description: "Customization / Extras",
                          detail: extrasSummary || undefined,
                          hsn: resolvedHsn,
                          quantity: 1,
                          unit: "lot",
                          unitRatePaise: customizationPaise,
                          amountPaise: customizationPaise,
                          gstRateBps: customizationGstRateBps,
                          gstAmountPaise: customizationGstAmountPaise,
                          totalAmountPaise:
                              customizationPaise + customizationGstAmountPaise,
                      },
                  ]
                : []),
        ],
        totals: {
            subtotalPaise:
                customizationPaise > 0 ? baseSubtotalPaise : undefined,
            customizationPaise:
                customizationPaise > 0 ? customizationPaise : undefined,
            taxableValuePaise,
            baseGstRateBps: customizationPaise > 0 ? baseGstRateBps : undefined,
            baseGstAmountPaise:
                customizationPaise > 0 ? baseGstAmountPaise : undefined,
            customizationGstRateBps:
                customizationPaise > 0 ? customizationGstRateBps : undefined,
            customizationGstAmountPaise:
                customizationPaise > 0
                    ? customizationGstAmountPaise
                    : undefined,
            gstRateBps: baseGstRateBps,
            gstAmountPaise: computedTotalGstPaise,
            totalAmountPaise: computedTotalAmountPaise,
        },
        notes: [
            dynamicAdvanceTerm,
            invoice.deliveryTimeline ||
                "Delivery timeline will be confirmed upon order review.",
            invoice.termsAndConditions ||
                "This proforma invoice is not a tax invoice. Supply is subject to quote acceptance, receipt of the corporate purchase order, and payment confirmation.",
        ],
        bank: {
            bankName: settings.bankName,
            accountName: settings.bankAccountName,
            accountNumber: settings.bankAccountNumber,
            ifsc: settings.bankIfscCode,
            branch: settings.bankBranch,
        },
        signatoryName: settings.authorizedSignatoryName,
        declarationCompanyName: settings.legalName,
    };

    const stream = await renderToStream(
        <CorporateCommercialDocumentTemplate data={data} />
    );
    const chunks: Buffer[] = [];
    for await (const chunk of stream)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const safeNumber = invoice.invoiceNumber.replace(/[^a-z0-9_-]+/gi, "_");
    return new NextResponse(Buffer.concat(chunks), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="proforma-invoice_${safeNumber}.pdf"`,
            "Cache-Control": "private, no-store",
        },
    });
}
