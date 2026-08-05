import {
    CorporateCommercialDocumentTemplate,
    type CorporateCommercialDocumentData,
} from "@/components/pdf/corporate-commercial-document-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
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

    const quote = await db.query.corporateQuotes.findFirst({
        where: eq(corporateQuotes.id, invoice.quoteId),
        with: { profile: true, brand: true },
    });
    if (!quote)
        return NextResponse.json(
            { message: "Quote not found" },
            { status: 404 }
        );

    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const canViewAdmin = hasPermission(permissions, [
        BitFieldSitePermission.VIEW_ORDERS,
    ]);
    if (!canViewAdmin && quote.profile.userId !== userId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const [settings, product] = await Promise.all([
        getCorporateDocumentSettings(),
        quote.productId
            ? db.query.products.findFirst({
                  where: eq(products.id, quote.productId),
              })
            : Promise.resolve(null),
    ]);
    const billing = (quote.profile.billingAddress ?? {}) as Record<
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
    const taxableValuePaise = invoice.subtotalPaise;
    const gstHalf = Math.round(invoice.gstAmountPaise / 2);
    const data: CorporateCommercialDocumentData = {
        title: "Proforma Invoice",
        subtitle:
            "Commercial proposal issued before supply. This is not a tax invoice.",
        documentNumber: invoice.invoiceNumber,
        documentDate: invoice.invoiceDate ?? invoice.createdAt,
        validUntil: invoice.validUntil,
        fromLabel: "Issued by",
        toLabel: "Proforma for",
        from: {
            name: settings.legalName,
            address: corporatePartyAddress(settings) || "Not provided",
            gstin: settings.gstin,
            email: settings.email,
            phone: settings.phone,
        },
        to: {
            name: quote.profile.companyName || "Corporate customer",
            address: billingAddress || "Not provided",
            gstin: quote.profile.gstNumber,
            email: quote.profile.email,
            phone: quote.profile.phone,
        },
        references: [
            { label: "Quote number", value: quote.quoteNumber },
            { label: "Supplier brand", value: quote.brand.name },
            {
                label: "Quote validity",
                value: invoice.validUntil
                    ? new Date(invoice.validUntil).toLocaleDateString("en-IN")
                    : null,
            },
        ],
        item: {
            description: product?.title ?? "Corporate merchandise",
            detail: "Customization and specifications as approved in the corporate quote",
            sku: product?.sku ?? product?.nativeSku,
            hsn: product?.hsCode,
            quantity: quote.quantity,
            unitRatePaise: Math.round(
                taxableValuePaise / Math.max(1, quote.quantity)
            ),
            amountPaise: taxableValuePaise,
        },
        totals: {
            taxableValuePaise,
            cgstPaise: gstHalf,
            sgstPaise: invoice.gstAmountPaise - gstHalf,
            totalAmountPaise: invoice.totalAmountPaise,
        },
        notes: [
            invoice.paymentTerms || settings.defaultPaymentTerms,
            invoice.deliveryTimeline ||
                "Delivery timeline will be confirmed upon PO acceptance.",
            invoice.termsAndConditions ||
                "Supply is subject to receipt and acceptance of the corporate purchase order.",
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
