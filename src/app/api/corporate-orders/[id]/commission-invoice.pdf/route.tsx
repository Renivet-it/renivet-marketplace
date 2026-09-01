import {
    InvoiceTemplate,
    type InvoiceOrder,
} from "@/components/pdf/invoice-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { brandConfidentials, brandMembers } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import {
    corporatePartyAddress,
    getCorporateDocumentSettings,
    nextCorporateDocumentNumber,
} from "@/lib/services/corporate-documents";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { renderToStream } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

const renivetLogoUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL";

function text(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function formatAddress(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    const record = value as Record<string, unknown>;
    return [
        record.addressLine1 ?? record.address,
        record.addressLine2,
        record.street,
        record.area,
        record.landmark,
        record.city,
        record.state,
        record.postalCode ?? record.pincode ?? record.zip,
        record.country,
    ]
        .map(text)
        .filter(Boolean)
        .join(", ");
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const order = await db.query.corporateOrders.findFirst({
            where: (table, { eq }) => eq(table.id, id),
            with: {
                brand: {
                    with: {
                        members: true,
                    },
                },
                quote: true,
            },
        });
        if (!order) {
            return NextResponse.json(
                { message: "Corporate order not found" },
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
        const brandMembership = canViewAdmin
            ? null
            : order.brand
              ? await db.query.brandMembers.findFirst({
                    where: and(
                        eq(brandMembers.brandId, order.brand.id),
                        eq(brandMembers.memberId, userId)
                    ),
                })
              : null;
        const isBrandOwner = order.brand?.ownerId === userId;

        if (!canViewAdmin && !brandMembership && !isBrandOwner && order.userId !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        if (!order.brand) {
            return NextResponse.json(
                { message: "A brand must be assigned to generate commission invoice" },
                { status: 422 }
            );
        }

        const [settings, brandConfidential] = await Promise.all([
            getCorporateDocumentSettings(),
            db.query.brandConfidentials.findFirst({
                where: eq(brandConfidentials.id, order.brand.id),
            }),
        ]);

        const commissionTaxablePaise =
            order.commissionAmountPaise ||
            (order.quote?.commissionAmountPaise ?? 0) ||
            Math.round(((order.subtotalPaise ?? 400000) * 1000) / 10000); // default 10%

        const commissionGstRateBps =
            order.commissionGstRateBps ||
            (order.quote?.commissionGstRateBps ?? 1800);

        const commissionGstPaise =
            order.commissionGstAmountPaise ||
            Math.round((commissionTaxablePaise * commissionGstRateBps) / 10_000);

        const commissionTotalPaise =
            order.commissionTotalPaise ||
            commissionTaxablePaise + commissionGstPaise;

        const renivetStateCode = (settings.gstin || "19").slice(0, 2);
        const brandStateCode = (brandConfidential?.gstin || "19").slice(0, 2);
        const intra = renivetStateCode === brandStateCode;

        const cgstPaise = intra ? Math.round(commissionGstPaise / 2) : 0;
        const sgstPaise = intra ? commissionGstPaise - cgstPaise : 0;
        const igstPaise = intra ? 0 : commissionGstPaise;

        const commissionNumber = await nextCorporateDocumentNumber("CINV");
        const invoiceDate = order.createdAt ?? new Date();

        const downloadUrl = `${new URL(request.url).origin}/api/corporate-orders/${order.id}/commission-invoice.pdf`;
        const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 180,
        });

        const brandAddress =
            corporatePartyAddress(brandConfidential ?? {}) ||
            "Registered brand address";

        const invoiceOrder: InvoiceOrder = {
            id: order.publicOrderId,
            receiptId: order.publicOrderId,
            invoiceNumber: commissionNumber,
            paymentMethod: "Account Deduction / Payout Settlement",
            paymentId: `ORD-${order.publicOrderId}`,
            date: invoiceDate,
            orderDate: order.createdAt ?? invoiceDate,
            customerName: order.brand.name,
            address: brandAddress,
            state: brandConfidential?.state || settings.state || "West Bengal",
            amount: commissionTotalPaise,
            deliveryAmount: 0,
            customerGstin: brandConfidential?.gstin || "Unregistered",
            copyType: "original",
            qrCodeDataUrl,
            poReference: order.publicOrderId,
            displayUnitPricing: true,
            taxDisplay: "standard",
            declarationCompanyName: "Renivet Marketplace Pvt Ltd",
            sellerOfRecord: true,
            paymentSummary: {
                paymentStatus: "paid_in_full",
                paymentPercentBps: 10_000,
                paidAmountPaise: commissionTotalPaise,
                fullPaymentAmountPaise: commissionTotalPaise,
                balanceDuePaise: 0,
            },
            taxSummary: {
                taxableValuePaise: commissionTaxablePaise,
                cgstPaise,
                sgstPaise,
                igstPaise,
                totalAmountPaise: commissionTotalPaise,
            },
            items: [
                {
                    quantity: 1,
                    gstRateBps: commissionGstRateBps,
                    mrpPaise: commissionTaxablePaise,
                    discountPaise: 0,
                    taxableValuePaise: commissionTaxablePaise,
                    cgstPaise,
                    sgstPaise,
                    igstPaise,
                    totalPaise: commissionTotalPaise,
                    product: {
                        title: `Marketplace Facilitation & Platform Commission Services (Order: ${order.publicOrderId})`,
                        price: commissionTaxablePaise,
                        compareAtPrice: commissionTaxablePaise,
                        hsCode: "9985",
                        sku: "SAC-9985",
                    },
                },
            ],
            brand: {
                name: "Renivet Marketplace Pvt Ltd",
                logoUrl: renivetLogoUrl,
                confidential: {
                    addressLine1: settings.addressLine1 || "Renivet HQ",
                    addressLine2: settings.addressLine2 || undefined,
                    city: settings.city || "Kolkata",
                    state: settings.state || "West Bengal",
                    postalCode: settings.postalCode || "700135",
                    gstin: settings.gstin || "19AAACR1234F1Z5",
                    cin: settings.cin || undefined,
                    email: settings.supportEmail || "support@renivet.com",
                    phone: settings.supportPhone || "+91-9876543210",
                    bankName: settings.bankName || "HDFC Bank",
                    bankAccountHolderName:
                        settings.bankAccountName || "Renivet Marketplace Pvt Ltd",
                    bankAccountNumber: settings.bankAccountNumber || undefined,
                    bankAccountType: settings.bankAccountType || "Current",
                    bankIfscCode: settings.bankIfscCode || undefined,
                    bankBranch: settings.bankBranch || undefined,
                    authorizedSignatoryName:
                        settings.authorizedSignatoryName || "Renivet Marketplace",
                },
            },
        };

        const stream = await renderToStream(
            <InvoiceTemplate order={invoiceOrder} />
        );
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        const safeInvoiceNumber = commissionNumber.replace(/[^a-z0-9_-]+/gi, "_");

        return new NextResponse(Buffer.concat(chunks), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="renivet-commission-invoice_${safeInvoiceNumber}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Commission invoice download error:", error);
        return NextResponse.json(
            { message: "Failed to generate commission invoice" },
            { status: 500 }
        );
    }
}
