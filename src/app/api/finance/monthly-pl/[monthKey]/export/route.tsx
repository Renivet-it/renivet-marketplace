import { buildMonthlyPl } from "@/lib/finance/pl";
import { getFinanceModuleAccess } from "@/lib/finance/access";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    renderToStream,
} from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";

const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 11, color: "#0f172a" },
    title: { fontSize: 20, marginBottom: 8 },
    subtitle: { fontSize: 11, marginBottom: 18, color: "#475569" },
    sectionTitle: { fontSize: 12, marginBottom: 8, marginTop: 14 },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        paddingBottom: 4,
    },
});

function formatMoney(amountPaise: number) {
    return `INR ${(amountPaise / 100).toFixed(2)}`;
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ monthKey: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const access = await getFinanceModuleAccess({
        userId,
        sitePermissions: permissions,
        roles: user?.roles,
        moduleKey: "monthly_pl",
    });

    if (!access.canView && !access.canManage) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { monthKey } = await context.params;
    const snapshot = await financeComplianceQueries.getPlSnapshot(monthKey);
    if (!snapshot || snapshot.snapshotType !== "locked") {
        return NextResponse.json(
            { ok: false, error: "Only locked months can be exported." },
            { status: 400 }
        );
    }

    const summaryCandidate = snapshot.summary as Partial<Awaited<ReturnType<typeof buildMonthlyPl>>>;
    const summary =
        Array.isArray(summaryCandidate?.lines) && summaryCandidate?.metrics
            ? (summaryCandidate as Awaited<ReturnType<typeof buildMonthlyPl>>)
            : await buildMonthlyPl(monthKey);
    const stream = await renderToStream(
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Renivet Monthly P&amp;L</Text>
                <Text style={styles.subtitle}>
                    Locked snapshot for {monthKey}
                </Text>

                <Text style={styles.sectionTitle}>Summary metrics</Text>
                {[
                    ["Total income", formatMoney(summary.metrics.totalIncomePaise)],
                    ["Total OpEx", formatMoney(summary.metrics.totalOpexPaise)],
                    ["Refund impact", formatMoney(summary.metrics.totalRefundImpactPaise)],
                    ["Net P&L", formatMoney(summary.metrics.netProfitLossPaise)],
                    ["Pending exposure", formatMoney(summary.metrics.pendingExposurePaise)],
                    ["Bank balance end", formatMoney(summary.metrics.bankBalanceEndPaise)],
                    [
                        "Cash runway",
                        summary.metrics.cashRunwayMonths === null
                            ? "Needs inputs"
                            : `${summary.metrics.cashRunwayMonths} months`,
                    ],
                ].map(([label, value]) => (
                    <View key={String(label)} style={styles.row}>
                        <Text>{label}</Text>
                        <Text>{String(value)}</Text>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Line items</Text>
                {summary.lines.map((line) => (
                    <View key={line.key} style={styles.row}>
                        <View>
                            <Text>{line.label}</Text>
                            <Text>{line.sourceLabel}</Text>
                        </View>
                        <Text>{line.key === "cash_runway" ? line.description ?? "-" : formatMoney(line.amountPaise)}</Text>
                    </View>
                ))}
            </Page>
        </Document>
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return new NextResponse(Buffer.concat(chunks), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="renivet-pl-${monthKey}.pdf"`,
        },
    });
}
