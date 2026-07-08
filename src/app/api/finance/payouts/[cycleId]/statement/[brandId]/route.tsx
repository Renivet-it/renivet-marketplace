import { BrandPayoutStatementTemplate } from "@/components/pdf/brand-payout-statement-template";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { renderToStream } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _req: NextRequest,
    context: {
        params: Promise<{
            cycleId: string;
            brandId: string;
        }>;
    }
) {
    const { cycleId, brandId } = await context.params;
    const cycle = await financeComplianceQueries.getPayoutCycle(cycleId);
    if (!cycle) {
        return NextResponse.json({ ok: false, error: "Cycle not found" }, { status: 404 });
    }

    const lineItems = await financeComplianceQueries.listPayoutLineItems(cycleId);
    const summary = (cycle.calculationSummary as { brands?: Array<Record<string, unknown>> }).brands?.find(
        (item) => item.brandId === brandId
    );

    if (!summary) {
        return NextResponse.json({ ok: false, error: "Brand summary not found" }, { status: 404 });
    }

    const stream = await renderToStream(
        <BrandPayoutStatementTemplate
            cycleKey={cycle.cycleKey}
            payoutDate={cycle.payoutDate}
            brandName={String(summary.brandName ?? brandId)}
            summary={summary}
            lineItems={lineItems
                .filter((item) => item.brandId === brandId)
                .map((item) => ({
                    description: item.description,
                    amountPaise: item.amountPaise,
                    lineType: item.lineType,
                }))}
        />
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return new NextResponse(Buffer.concat(chunks), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${cycle.cycleKey}-${brandId}.pdf"`,
        },
    });
}
