import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

const palette = {
    ink: "#0f172a",
    muted: "#475569",
    line: "#dbe3ea",
    soft: "#f8fafc",
    brand: "#2d3121",
    brandSoft: "#f3f5ee",
    white: "#ffffff",
    success: "#166534",
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 28,
        paddingHorizontal: 0,
        backgroundColor: palette.white,
        color: palette.ink,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    hero: {
        backgroundColor: palette.brand,
        paddingTop: 28,
        paddingBottom: 26,
        paddingHorizontal: 34,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heroLeft: {
        width: "76%",
    },
    eyebrow: {
        fontSize: 8,
        color: "#cfd5c4",
        letterSpacing: 2,
        textTransform: "uppercase",
        fontFamily: "Helvetica-Bold",
    },
    title: {
        marginTop: 8,
        fontSize: 24,
        color: palette.white,
        fontFamily: "Helvetica-Bold",
    },
    subtitle: {
        marginTop: 8,
        fontSize: 10,
        lineHeight: 1.5,
        color: "#eef2e7",
    },
    logo: {
        width: 48,
        height: 48,
        objectFit: "contain",
    },
    body: {
        paddingHorizontal: 34,
        paddingTop: 22,
    },
    snapshotGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    snapshotCard: {
        width: "23.5%",
        backgroundColor: palette.soft,
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: 8,
        padding: 12,
    },
    snapshotLabel: {
        fontSize: 8,
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        fontFamily: "Helvetica-Bold",
    },
    snapshotValue: {
        marginTop: 6,
        fontSize: 12,
        color: palette.ink,
        fontFamily: "Helvetica-Bold",
    },
    panel: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: palette.line,
        borderRadius: 8,
        padding: 16,
        backgroundColor: palette.white,
    },
    panelTitle: {
        fontSize: 10,
        color: palette.brand,
        textTransform: "uppercase",
        letterSpacing: 1.4,
        fontFamily: "Helvetica-Bold",
        marginBottom: 10,
    },
    panelSubTitle: {
        fontSize: 15,
        fontFamily: "Helvetica-Bold",
        color: palette.ink,
        marginBottom: 2,
    },
    panelCopy: {
        fontSize: 9,
        color: palette.muted,
        lineHeight: 1.5,
    },
    detailGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
    },
    detailColumn: {
        width: "48.5%",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#eef2f6",
    },
    rowLabel: {
        width: "56%",
        fontSize: 9,
        color: palette.muted,
    },
    rowValue: {
        width: "40%",
        fontSize: 9,
        color: palette.ink,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
    },
    highlightRow: {
        marginTop: 2,
        backgroundColor: palette.brandSoft,
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    highlightLabel: {
        fontSize: 9,
        color: palette.brand,
        fontFamily: "Helvetica-Bold",
    },
    highlightValue: {
        fontSize: 11,
        color: palette.brand,
        fontFamily: "Helvetica-Bold",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: palette.soft,
        borderWidth: 1,
        borderColor: palette.line,
        borderBottomWidth: 0,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginTop: 6,
    },
    tableHeaderTextLeft: {
        width: "72%",
        fontSize: 8,
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: "Helvetica-Bold",
    },
    tableHeaderTextRight: {
        width: "28%",
        fontSize: 8,
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
    },
    tableRow: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: palette.line,
        borderTopWidth: 0,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    tableLeft: {
        width: "72%",
        fontSize: 9,
        color: palette.ink,
        paddingRight: 10,
    },
    tableRight: {
        width: "28%",
        fontSize: 9,
        color: palette.ink,
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
    },
    noteBox: {
        marginTop: 14,
        padding: 12,
        borderRadius: 8,
        backgroundColor: palette.brandSoft,
        borderLeftWidth: 4,
        borderLeftColor: palette.brand,
    },
    noteTitle: {
        fontSize: 9,
        color: palette.brand,
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
    },
    noteCopy: {
        fontSize: 9,
        color: palette.ink,
        lineHeight: 1.5,
    },
    footer: {
        marginTop: 18,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: palette.line,
        fontSize: 8.5,
        color: palette.muted,
        textAlign: "center",
    },
});

function formatInr(amountPaise: number) {
    const abs = Math.abs(amountPaise / 100);
    return `INR ${abs.toFixed(2)}`;
}

function formatSignedInr(amountPaise: number) {
    if (amountPaise === 0) return "INR 0.00";
    return `${amountPaise < 0 ? "-" : ""}${formatInr(amountPaise)}`;
}

function humanizeStatus(value?: string | null) {
    if (!value) return "-";
    return value.replaceAll("_", " ");
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
        payoutMethod?: string;
        reviewStatus?: string;
        executionStatus?: string;
        metadata?: {
            tdsFinancialYear?: string;
            tdsNote?: string;
            tdsCumulativeCommissionBeforePaise?: number;
            tdsCumulativeCommissionAfterPaise?: number;
            tdsDeductedYtdPaise?: number;
        };
    };

    const deductions = props.lineItems.filter((item) =>
        ["refund_deduction", "carrier_claim", "override", "holdback", "tds"].includes(item.lineType)
    );

    const orderItems = props.lineItems.filter(
        (item) => !["override"].includes(item.lineType)
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.hero}>
                    <View style={styles.heroLeft}>
                        <Text style={styles.eyebrow}>Renivet Finance</Text>
                        <Text style={styles.title}>Brand Payout Statement</Text>
                        <Text style={styles.subtitle}>
                            Official settlement summary for {props.brandName}. This document captures
                            payout calculation, deductions, TDS status, and execution reference for
                            the selected cycle.
                        </Text>
                    </View>
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw"
                        alt="Renivet logo"
                        style={styles.logo}
                    />
                </View>

                <View style={styles.body}>
                    <View style={styles.snapshotGrid}>
                        <View style={styles.snapshotCard}>
                            <Text style={styles.snapshotLabel}>Cycle</Text>
                            <Text style={styles.snapshotValue}>{props.cycleKey}</Text>
                        </View>
                        <View style={styles.snapshotCard}>
                            <Text style={styles.snapshotLabel}>Payout Date</Text>
                            <Text style={styles.snapshotValue}>{props.payoutDate}</Text>
                        </View>
                        <View style={styles.snapshotCard}>
                            <Text style={styles.snapshotLabel}>TDS FY</Text>
                            <Text style={styles.snapshotValue}>{summary.metadata?.tdsFinancialYear ?? "-"}</Text>
                        </View>
                        <View style={styles.snapshotCard}>
                            <Text style={styles.snapshotLabel}>Net Payable</Text>
                            <Text style={styles.snapshotValue}>{formatInr(summary.netPayablePaise ?? 0)}</Text>
                        </View>
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Brand Summary</Text>
                        <Text style={styles.panelSubTitle}>{props.brandName}</Text>
                        <Text style={styles.panelCopy}>
                            {humanizeStatus(summary.payoutMethod)} • {humanizeStatus(summary.reviewStatus)} •{" "}
                            {humanizeStatus(summary.executionStatus)}
                        </Text>

                        <View style={styles.detailGrid}>
                            <View style={styles.detailColumn}>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Gross sales</Text>
                                    <Text style={styles.rowValue}>{formatInr(summary.grossSalesPaise ?? 0)}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Commission</Text>
                                    <Text style={styles.rowValue}>{formatInr(summary.commissionPaise ?? 0)}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Returns</Text>
                                    <Text style={styles.rowValue}>{formatInr(summary.returnsPaise ?? 0)}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Carrier claims</Text>
                                    <Text style={styles.rowValue}>{formatInr(summary.carrierClaimsPaise ?? 0)}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Holdback</Text>
                                    <Text style={styles.rowValue}>{formatInr(summary.holdbackPaise ?? 0)}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Holdback release</Text>
                                    <Text style={styles.rowValue}>{formatInr(summary.holdbackReleasePaise ?? 0)}</Text>
                                </View>
                            </View>
                            <View style={styles.detailColumn}>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Override net</Text>
                                    <Text style={styles.rowValue}>{formatSignedInr(summary.overrideNetPaise ?? 0)}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>TDS (1% u/s 194-O)</Text>
                                    <Text style={styles.rowValue}>
                                        {(summary.tdsPaise ?? 0) > 0
                                            ? `-${formatInr(summary.tdsPaise ?? 0)}`
                                            : "Nil"}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Commission YTD</Text>
                                    <Text style={styles.rowValue}>
                                        {formatInr(summary.metadata?.tdsCumulativeCommissionAfterPaise ?? 0)}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>TDS deducted YTD</Text>
                                    <Text style={styles.rowValue}>
                                        {formatInr(summary.metadata?.tdsDeductedYtdPaise ?? 0)}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Transaction ID</Text>
                                    <Text style={styles.rowValue}>{summary.transactionId ?? "Pending"}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.highlightRow}>
                            <Text style={styles.highlightLabel}>Final net payout</Text>
                            <Text style={styles.highlightValue}>{formatInr(summary.netPayablePaise ?? 0)}</Text>
                        </View>
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Order Summary</Text>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderTextLeft}>Description</Text>
                            <Text style={styles.tableHeaderTextRight}>Amount</Text>
                        </View>
                        {orderItems.map((item, index) => (
                            <View
                                key={`${item.lineType}-${index}`}
                                style={[
                                    styles.tableRow,
                                    index === orderItems.length - 1 ? { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 } : null,
                                ]}
                            >
                                <Text style={styles.tableLeft}>{item.description}</Text>
                                <Text style={styles.tableRight}>{formatSignedInr(item.amountPaise)}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Deductions and Adjustments</Text>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderTextLeft}>Deduction</Text>
                            <Text style={styles.tableHeaderTextRight}>Amount</Text>
                        </View>
                        {(deductions.length ? deductions : [{ description: "No deductions or adjustments", amountPaise: 0, lineType: "none" }]).map(
                            (item, index, collection) => (
                                <View
                                    key={`${item.lineType}-deduction-${index}`}
                                    style={[
                                        styles.tableRow,
                                        index === collection.length - 1 ? { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 } : null,
                                    ]}
                                >
                                    <Text style={styles.tableLeft}>{item.description}</Text>
                                    <Text style={styles.tableRight}>{formatSignedInr(item.amountPaise)}</Text>
                                </View>
                            )
                        )}
                    </View>

                    <View style={styles.noteBox}>
                        <Text style={styles.noteTitle}>TDS Status</Text>
                        <Text style={styles.noteCopy}>
                            {summary.metadata?.tdsNote ?? "TDS status unavailable."}
                        </Text>
                    </View>

                    <Text style={styles.footer}>
                        This is a system-generated Renivet payout statement. For clarifications or disputes,
                        email finance@renivet.com within 48 hours of receipt.
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
