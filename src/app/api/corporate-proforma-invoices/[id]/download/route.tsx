import {
    CorporateCommercialDocumentTemplate,
    type CorporateCommercialDocumentData,
} from "@/components/pdf/corporate-commercial-document-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    corporateOrders,
    corporateProformaInvoices,
    corporateQuotes,
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
import { eq } from "drizzle-orm";
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
    const quote = !order && invoice.quoteId
        ? await db.query.corporateQuotes.findFirst({
              where: eq(corporateQuotes.id, invoice.quoteId),
              with: { profile: true, brand: true },
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
    if (quote && !canViewAdmin && quote.profile.userId !== userId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const [settings, product] = await Promise.all([
        getCorporateDocumentSettings(),
        quote?.productId
            ? db.query.products.findFirst({
                  where: eq(products.id, quote.productId),
              })
            : Promise.resolve(null),
    ]);

    const taxableValuePaise = invoice.subtotalPaise;
    const gstRateBps =
        order?.gstRateBps ??
        quote?.gstRateBps ??
        (taxableValuePaise > 0
            ? Math.round(
                  (invoice.gstAmountPaise / taxableValuePaise) * 10_000
              )
            : 0);
    const orderConfig = (order?.productConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const productType = configText(orderConfig.productType, [
        "name",
        "title",
        "label",
    ]);
    const gsm = configText(orderConfig.gsmOption, ["gsm", "name", "label"]);
    const fabric = configText(orderConfig.fabricComposition, [
        "name",
        "composition",
        "label",
    ]);
    const hsn = configText(orderConfig, ["hsnCode"]);

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

    const data: CorporateCommercialDocumentData = {
        title: "Proforma Invoice",
        subtitle:
            "Commercial proposal issued before supply. This is not a tax invoice.",
        documentNumber: invoice.invoiceNumber,
        documentDate: invoice.invoiceDate ?? invoice.createdAt,
        validUntil: invoice.validUntil,
        fromLabel: "From",
        toLabel: "To",
        from: {
            name: settings.legalName,
            address: corporatePartyAddress(settings) || "Not provided",
            gstin: settings.gstin,
            email: settings.email,
            phone: settings.phone,
        },
        to: order
            ? {
                  name: order.companyName,
                  address: [
                      order.deliveryAddress,
                      order.deliveryCity,
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
                  name: quote!.profile.companyName || "Corporate customer",
                  address: billingAddress || "Not provided",
                  gstin: quote!.profile.gstNumber,
                  email: quote!.profile.email,
                  phone: quote!.profile.phone,
              },
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
                  { label: "Supplier brand", value: quote!.brand.name },
                  {
                      label: "Quote validity",
                      value: invoice.validUntil
                          ? new Date(invoice.validUntil).toLocaleDateString(
                                "en-IN"
                            )
                          : null,
                  },
              ],
        item: order
            ? {
                  description: productType || "Corporate merchandise",
                  detail: [gsm && `${gsm} GSM`, fabric]
                      .filter(Boolean)
                      .join(" | ") ||
                      "Customization and specifications confirmed in the self-service order",
                  hsn,
                  quantity: order.quantity,
                  unitRatePaise: Math.round(
                      taxableValuePaise / Math.max(1, order.quantity)
                  ),
                  amountPaise: taxableValuePaise,
                  gstRateBps,
                  gstAmountPaise: invoice.gstAmountPaise,
              }
            : {
                  description: product?.title ?? "Corporate merchandise",
                  detail: "Customization and specifications as approved in the corporate quote",
                  sku: product?.sku ?? product?.nativeSku,
                  hsn: product?.hsCode,
                  quantity: quote!.quantity,
                  unitRatePaise: Math.round(
                      taxableValuePaise / Math.max(1, quote!.quantity)
                  ),
                  amountPaise: taxableValuePaise,
                  gstRateBps,
                  gstAmountPaise: invoice.gstAmountPaise,
              },
        totals: {
            taxableValuePaise,
            gstRateBps,
            gstAmountPaise: invoice.gstAmountPaise,
            totalAmountPaise: invoice.totalAmountPaise,
        },
        notes: [
            invoice.paymentTerms || settings.defaultPaymentTerms,
            invoice.deliveryTimeline ||
                "Delivery timeline will be confirmed upon order review.",
            invoice.termsAndConditions ||
                "Supply is subject to payment confirmation and order acceptance.",
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
