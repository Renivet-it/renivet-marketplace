import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 32,
        fontSize: 11,
        color: "#0f172a",
    },
    title: {
        fontSize: 20,
        marginBottom: 8,
        fontWeight: 700,
    },
    subtitle: {
        fontSize: 11,
        marginBottom: 18,
        color: "#475569",
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    lineItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        paddingBottom: 4,
        marginBottom: 4,
    },
    footer: {
        marginTop: 18,
        fontSize: 10,
        color: "#475569",
    },
});

function formatInr(amountPaise: number) {
    return `Rs. ${(amountPaise / 100).toFixed(2)}`;
}

export function BrandPayoutStatementTemplate(props: {
    cycleKey: string;
    payoutDate: string;
    brandName: string;
    summary: Record<string, unknown>;
    lineItems: Array<{
        description: string;
        amountPaise: number;
        lineType: string;
    }>;
}) {
    const summary = props.summary as {
        grossSalesPaise?: number;
        commissionPaise?: number;
        returnsPaise?: number;
        carrierClaimsPaise?: number;
        holdbackPaise?: number;
        holdbackReleasePaise?: number;
        overrideNetPaise?: number;
        tdsPaise?: number;
        netPayablePaise?: number;
        transactionId?: string | null;
        metadata?: {
            tdsFinancialYear?: string;
            tdsNote?: string;
            tdsCumulativeCommissionBeforePaise?: number;
            tdsCumulativeCommissionAfterPaise?: number;
            tdsDeductedYtdPaise?: number;
        };
    };

    const deductions = props.lineItems.filter((item) =>
        ["refund_deduction", "carrier_claim", "override", "holdback", "tds"].includes(
            item.lineType
        )
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Renivet Brand Payout Statement</Text>
                <Text style={styles.subtitle}>
                    Cycle {props.cycleKey} | Payout date {props.payoutDate}
                </Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{props.brandName}</Text>
                    <View style={styles.row}>
                        <Text>Gross sales</Text>
                        <Text>{formatInr(summary.grossSalesPaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Commission</Text>
                        <Text>{formatInr(summary.commissionPaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Returns</Text>
                        <Text>{formatInr(summary.returnsPaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Carrier claims</Text>
                        <Text>{formatInr(summary.carrierClaimsPaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Holdback</Text>
                        <Text>{formatInr(summary.holdbackPaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Previous holdback release</Text>
                        <Text>{formatInr(summary.holdbackReleasePaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Override net</Text>
                        <Text>{formatInr(summary.overrideNetPaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>TDS (1% u/s 194-O)</Text>
                        <Text>
                            {(summary.tdsPaise ?? 0) > 0
                                ? `-${formatInr(summary.tdsPaise ?? 0)}`
                                : "Nil"}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text>TDS FY</Text>
                        <Text>{summary.metadata?.tdsFinancialYear ?? "-"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Commission YTD</Text>
                        <Text>
                            {formatInr(
                                summary.metadata?.tdsCumulativeCommissionAfterPaise ?? 0
                            )}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text>TDS deducted YTD</Text>
                        <Text>{formatInr(summary.metadata?.tdsDeductedYtdPaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Net payout</Text>
                        <Text>{formatInr(summary.netPayablePaise ?? 0)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Transaction ID</Text>
                        <Text>{summary.transactionId ?? "Pending"}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {props.lineItems.map((item, index) => (
                        <View key={`${item.lineType}-${index}`} style={styles.lineItem}>
                            <Text>{item.description}</Text>
                            <Text>{formatInr(item.amountPaise)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Deductions and Adjustments</Text>
                    {deductions.map((item, index) => (
                        <View key={`${item.lineType}-deduction-${index}`} style={styles.lineItem}>
                            <Text>{item.description}</Text>
                            <Text>{formatInr(item.amountPaise)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TDS Status</Text>
                    <Text>{summary.metadata?.tdsNote ?? "TDS status unavailable."}</Text>
                </View>

                <Text style={styles.footer}>
                    Disputes? Email finance@renivet.com within 48 hours of receipt.
                </Text>
            </Page>
        </Document>
    );
}
