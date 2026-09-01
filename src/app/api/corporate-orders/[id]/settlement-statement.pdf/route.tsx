import {
    CorporateSettlementStatementTemplate,
    type CorporateSettlementData,
} from "@/components/pdf/corporate-settlement-statement-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandConfidentials,
    brandMembers,
    corporateOrders,
    corporateSettlementStatements,
    corporateTaxInvoices,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import {
    corporatePartyAddress,
    getCorporateDocumentSettings,
} from "@/lib/services/corporate-documents";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { renderToStream } from "@react-pdf/renderer";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
    _request: Request,
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
                brand: true,
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
                { message: "A brand must be assigned to generate settlement statement" },
                { status: 422 }
            );
        }

        const [statement, invoice, settings, brandConfidential] =
            await Promise.all([
                db.query.corporateSettlementStatements.findFirst({
                    where: eq(corporateSettlementStatements.orderId, order.id),
                    orderBy: [desc(corporateSettlementStatements.createdAt)],
                }),
                db.query.corporateTaxInvoices.findFirst({
                    where: eq(corporateTaxInvoices.orderId, order.id),
                    orderBy: [desc(corporateTaxInvoices.createdAt)],
                }),
                getCorporateDocumentSettings(),
                db.query.brandConfidentials.findFirst({
                    where: eq(brandConfidentials.id, order.brand.id),
                }),
            ]);

        // Fallback calculations if not explicitly saved:
        const grossPaidPaise =
            statement?.grossPaidPaise ??
            invoice?.totalAmountPaise ??
            order.totalAmountPaise ??
            802000;

        const gstEmbeddedPaise =
            statement?.gstEmbeddedPaise ??
            (invoice ? invoice.cgstPaise + invoice.sgstPaise + invoice.igstPaise : order.gstPaise ?? 102000);

        const taxableValuePaise =
            statement?.taxableValuePaise ??
            (grossPaidPaise - gstEmbeddedPaise);

        const commissionPercentBps =
            statement?.commissionPercentBps ??
            (order.quote?.commissionAmountPaise && taxableValuePaise > 0
                ? Math.round((order.quote.commissionAmountPaise * 10000) / taxableValuePaise)
                : 2000); // default 20%

        const commissionAmountPaise =
            statement?.commissionAmountPaise ??
            Math.round((taxableValuePaise * commissionPercentBps) / 10000);

        const commissionGstRateBps =
            statement?.commissionGstRateBps ?? order.commissionGstRateBps;
        if (commissionGstRateBps == null) {
            return NextResponse.json(
                {
                    error: "Commission GST rate is not set for this order",
                },
                { status: 422 }
            );
        }
        const commissionGstAmountPaise =
            statement?.commissionGstAmountPaise ??
            Math.round((commissionAmountPaise * commissionGstRateBps) / 10000);

        const tcsPercentBps = statement?.tcsPercentBps ?? 50; // 0.5%
        const tcsAmountPaise =
            statement?.tcsAmountPaise ??
            Math.round((taxableValuePaise * tcsPercentBps) / 10000);

        const tdsPercentBps = statement?.tdsPercentBps ?? 10; // 0.1%
        const tdsAmountPaise =
            statement?.tdsAmountPaise ??
            Math.round((grossPaidPaise * tdsPercentBps) / 10000);

        const netRemittancePaise =
            statement?.netRemittancePaise ??
            (taxableValuePaise -
                commissionAmountPaise -
                commissionGstAmountPaise -
                tcsAmountPaise -
                tdsAmountPaise);

        const statementNumber =
            statement?.statementNumber ??
            `SET/2627/${String(order.sequenceNo ?? 1).padStart(5, "0")}`;
        const statementDate = statement?.statementDate ?? new Date();

        const invoiceNumber =
            invoice?.invoiceNumber ??
            `BAM/2627/${String(order.sequenceNo ?? 1).padStart(5, "0")}`;

        const brandAddress =
            corporatePartyAddress(brandConfidential ?? {}) ||
            "Registered brand address";

        const settlementData: CorporateSettlementData = {
            statementNumber,
            statementDate,
            orderNumber: order.publicOrderId,
            invoiceNumber,
            grossPaidPaise,
            gstEmbeddedPaise,
            taxableValuePaise,
            commissionPercent: commissionPercentBps / 100,
            commissionAmountPaise,
            commissionGstRatePercent: commissionGstRateBps / 100,
            commissionGstAmountPaise,
            tcsPercent: tcsPercentBps / 100,
            tcsAmountPaise,
            tdsPercent: tdsPercentBps / 100,
            tdsAmountPaise,
            netRemittancePaise,
            brand: {
                name: order.brand.name,
                legalName: brandConfidential?.bankAccountHolderName || order.brand.name,
                gstin: brandConfidential?.gstin || null,
                pan: brandConfidential?.pan || null,
                address: brandAddress,
                bankAccountName: brandConfidential?.bankAccountHolderName || null,
                bankName: brandConfidential?.bankName || null,
                bankAccountNumber: brandConfidential?.bankAccountNumber || null,
                bankIfscCode: brandConfidential?.bankIfscCode || null,
                bankBranch: brandConfidential?.bankBranch || null,
            },
            renivet: {
                name: "Renivet Marketplace Pvt Ltd",
                address: settings.addressLine1 ? `${settings.addressLine1}, ${settings.city || ""}, ${settings.state || ""} - ${settings.postalCode || ""}` : "Renivet HQ, Kolkata, West Bengal - 700135",
                gstin: settings.gstin || "19AAACR1234F1Z5",
                pan: settings.pan || "AAACR1234F",
                supportEmail: settings.supportEmail || "support@renivet.com",
            },
            notes: statement?.notes || null,
        };

        const stream = await renderToStream(
            <CorporateSettlementStatementTemplate data={settlementData} />
        );
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        const safeStatementNumber = statementNumber.replace(/[^a-z0-9_-]+/gi, "_");

        return new NextResponse(Buffer.concat(chunks), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="renivet-settlement-statement_${safeStatementNumber}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Settlement statement download error:", error);
        return NextResponse.json(
            { message: "Failed to generate settlement statement" },
            { status: 500 }
        );
    }
}
