import { buildMonthlyPl } from "@/lib/finance/pl";
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
    page: { padding: 32, fontSize: 12, color: "#0f172a" },
    title: { fontSize: 20, marginBottom: 16 },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
});

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ monthKey: string }> }
) {
    const { monthKey } = await context.params;
    const snapshot = await buildMonthlyPl(monthKey);
    const stream = await renderToStream(
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Renivet Monthly P&amp;L</Text>
                {[
                    ["Month", monthKey],
                    ["Revenue", (snapshot.revenuePaise / 100).toFixed(2)],
                    ["Refunds", (snapshot.refundsPaise / 100).toFixed(2)],
                    ["COD Shortfall", (snapshot.codShortfallPaise / 100).toFixed(2)],
                    ["Razorpay Fees", (snapshot.razorpayFeesPaise / 100).toFixed(2)],
                    ["Delhivery Invoices", (snapshot.delhiveryInvoicePaise / 100).toFixed(2)],
                    ["Shiprocket Invoices", (snapshot.shiprocketInvoicePaise / 100).toFixed(2)],
                    ["Manual Expenses", (snapshot.manualExpensePaise / 100).toFixed(2)],
                    ["Net Contribution", (snapshot.netContributionPaise / 100).toFixed(2)],
                ].map(([label, value]) => (
                    <View key={String(label)} style={styles.row}>
                        <Text>{label}</Text>
                        <Text>{String(value)}</Text>
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
