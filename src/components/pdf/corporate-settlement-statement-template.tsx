import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

const ink = "#1e2a22";
const moss = "#3f5e42";
const line = "#d8d6c8";
const paperAlt = "#edefe6";
const muted = "#526254";
const renivetLogoUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL";

const styles = StyleSheet.create({
    page: {
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 26,
        backgroundColor: "#ffffff",
        color: ink,
        fontSize: 7.2,
        fontFamily: "Helvetica",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 1.2,
        borderBottomColor: moss,
        paddingBottom: 8,
        marginBottom: 8,
    },
    logo: {
        width: 115,
        height: 30,
        objectFit: "contain",
        objectPosition: "left",
    },
    headerCopy: {
        width: "58%",
        alignItems: "flex-end",
    },
    title: {
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 14,
        textAlign: "right",
        textTransform: "uppercase",
    },
    subtitle: {
        marginTop: 2,
        color: muted,
        fontSize: 6.8,
        textAlign: "right",
    },
    grid: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: line,
        marginBottom: 8,
    },
    party: {
        width: "50%",
        minHeight: 66,
        padding: 6,
    },
    rightCell: {
        borderLeftWidth: 1,
        borderLeftColor: line,
    },
    sectionLabel: {
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 6.8,
        marginBottom: 2.5,
        textTransform: "uppercase",
    },
    name: {
        fontFamily: "Helvetica-Bold",
        fontSize: 8,
        marginBottom: 1.5,
    },
    body: {
        color: "#334155",
        fontSize: 6.8,
        lineHeight: 1.35,
    },
    meta: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: line,
        marginBottom: 8,
    },
    metaCell: {
        width: "25%",
        minHeight: 28,
        padding: 4.5,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    metaLast: {
        borderRightWidth: 0,
    },
    metaLabel: {
        color: "#66756a",
        fontSize: 6.1,
        marginBottom: 1.5,
        textTransform: "uppercase",
    },
    metaValue: {
        fontSize: 6.9,
        lineHeight: 1.25,
        fontFamily: "Helvetica-Bold",
    },
    waterfallTable: {
        borderWidth: 1,
        borderColor: line,
        marginBottom: 8,
    },
    waterfallHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4.5,
        paddingHorizontal: 6,
        color: moss,
        backgroundColor: paperAlt,
        fontFamily: "Helvetica-Bold",
        fontSize: 6.8,
        borderBottomWidth: 1,
        borderBottomColor: line,
        textTransform: "uppercase",
    },
    waterfallRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3.8,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: line,
        fontSize: 7,
    },
    waterfallSubtotal: {
        backgroundColor: paperAlt,
        fontFamily: "Helvetica-Bold",
        paddingVertical: 4.2,
    },
    waterfallNet: {
        backgroundColor: paperAlt,
        fontFamily: "Helvetica-Bold",
        color: moss,
        fontSize: 8,
        paddingVertical: 4.8,
    },
    deductionValue: {
        color: "#991b1b",
    },
    summaryTable: {
        borderWidth: 1,
        borderColor: line,
        marginBottom: 8,
    },
    summaryHead: {
        flexDirection: "row",
        backgroundColor: paperAlt,
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    summaryHeadCell: {
        paddingVertical: 4,
        paddingHorizontal: 3,
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 6.1,
        borderRightWidth: 1,
        borderRightColor: line,
        textTransform: "uppercase",
    },
    summaryRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: line,
        minHeight: 24,
        alignItems: "center",
    },
    summaryCell: {
        paddingVertical: 3.5,
        paddingHorizontal: 3,
        fontSize: 6.5,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    // Column widths total 100%
    colOrder: { width: "24%" },
    colInvoice: { width: "17%" },
    colTaxable: { width: "12%", textAlign: "right" },
    colCommission: { width: "12%", textAlign: "right" },
    colGstCommn: { width: "10%", textAlign: "right" },
    colTcs: { width: "8%", textAlign: "right" },
    colTds: { width: "6%", textAlign: "right" },
    colNet: { width: "11%", textAlign: "right", fontFamily: "Helvetica-Bold" },
    wrapText: {
        flexWrap: "wrap",
    },
    lower: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    declaration: {
        width: "54%",
        padding: 6,
        borderWidth: 1,
        borderColor: line,
        minHeight: 65,
    },
    declarationTitle: {
        marginBottom: 3,
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 6.8,
        textTransform: "uppercase",
    },
    declarationText: {
        color: muted,
        fontSize: 6.4,
        lineHeight: 1.35,
    },
    bankBox: {
        width: "44%",
        padding: 6,
        borderWidth: 1,
        borderColor: line,
        minHeight: 65,
    },
    bankRow: {
        flexDirection: "row",
        marginTop: 1.5,
    },
    bankLabel: {
        width: "38%",
        color: "#66756a",
        fontSize: 6.2,
    },
    bankValue: {
        width: "62%",
        fontSize: 6.6,
        fontFamily: "Helvetica-Bold",
    },
    signatoryBlock: {
        marginTop: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingTop: 4,
    },
    signatoryText: {
        fontSize: 6.6,
        color: muted,
        lineHeight: 1.3,
    },
    footer: {
        position: "absolute",
        bottom: 12,
        left: 24,
        right: 24,
        borderTopWidth: 0.5,
        borderTopColor: line,
        paddingTop: 3,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 6.2,
        color: "#66756a",
    },
});

function formatInr(paise: number) {
    const rupees = (paise / 100).toFixed(2);
    const parts = rupees.split(".");
    const num = parts[0] ?? "0";
    const dec = parts[1] ?? "00";
    const lastThree = num.substring(num.length - 3);
    const otherNumbers = num.substring(0, num.length - 3);
    const formatted =
        otherNumbers !== ""
            ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
              "," +
              lastThree
            : lastThree;
    return `INR ${formatted}.${dec}`;
}

export type CorporateSettlementData = {
    statementNumber: string;
    version: number;
    statementDate: string | Date;
    orderNumber: string;
    invoiceNumber: string;
    grossPaidPaise: number;
    gstEmbeddedPaise: number;
    taxableValuePaise: number;
    commissionPercent: number;
    commissionAmountPaise: number;
    commissionGstRatePercent: number;
    commissionGstAmountPaise: number;
    tcsPercent: number;
    tcsAmountPaise: number;
    tdsPercent: number;
    tdsAmountPaise: number;
    netRemittancePaise: number;
    brand: {
        name: string;
        legalName?: string | null;
        gstin?: string | null;
        pan?: string | null;
        address: string;
        bankAccountName?: string | null;
        bankName?: string | null;
        bankAccountNumber?: string | null;
        bankIfscCode?: string | null;
        bankBranch?: string | null;
    };
    renivet: {
        name: string;
        address: string;
        gstin: string;
        pan: string;
        supportEmail: string;
    };
    notes?: string | null;
};

export function CorporateSettlementStatementTemplate({
    data,
}: {
    data: CorporateSettlementData;
}) {
    const formattedDate = new Date(data.statementDate).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image src={renivetLogoUrl} style={styles.logo} />
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>SETTLEMENT STATEMENT</Text>
                    </View>
                </View>

                {/* 2-Column Party Grid */}
                <View style={styles.grid}>
                    <View style={styles.party}>
                        <Text style={styles.sectionLabel}>
                            ISSUED BY (RESELLER / SELLER OF RECORD)
                        </Text>
                        <Text style={styles.name}>{data.renivet.name}</Text>
                        <Text style={styles.body}>{data.renivet.address}</Text>
                        <Text style={styles.body}>
                            GSTIN: {data.renivet.gstin} | PAN: {data.renivet.pan}
                        </Text>
                    </View>
                    <View style={[styles.party, styles.rightCell]}>
                        <Text style={styles.sectionLabel}>
                            SETTLEMENT TO (SUPPLIER BRAND)
                        </Text>
                        <Text style={styles.name}>{data.brand.name}</Text>
                        <Text style={styles.body}>{data.brand.address}</Text>
                        <Text style={styles.body}>
                            GSTIN: {data.brand.gstin || "Unregistered"} | PAN: {data.brand.pan || "On file"}
                        </Text>
                    </View>
                </View>

                {/* 4-Cell Meta Row */}
                <View style={styles.meta}>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Statement Number</Text>
                        <Text style={styles.metaValue}>
                            {data.statementNumber} (v{data.version})
                        </Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Statement Date</Text>
                        <Text style={styles.metaValue}>{formattedDate}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Order Number</Text>
                        <Text style={[styles.metaValue, styles.wrapText]}>
                            {data.orderNumber}
                        </Text>
                    </View>
                    <View style={[styles.metaCell, styles.metaLast]}>
                        <Text style={styles.metaLabel}>Customer Tax Invoice</Text>
                        <Text style={[styles.metaValue, styles.wrapText]}>
                            {data.invoiceNumber}
                        </Text>
                    </View>
                </View>

                {/* Settlement Waterfall Table */}
                <View style={styles.waterfallTable}>
                    <View style={styles.waterfallHead}>
                        <Text>SETTLEMENT WATERFALL</Text>
                        <Text>AMOUNT</Text>
                    </View>

                    <View style={styles.waterfallRow}>
                        <Text>Corporate buyer paid (incl. GST)</Text>
                        <Text style={{ fontFamily: "Helvetica-Bold" }}>
                            {formatInr(data.grossPaidPaise)}
                        </Text>
                    </View>

                    <View style={styles.waterfallRow}>
                        <Text>- GST embedded in sale (brand&apos;s tax liability)</Text>
                        <Text style={styles.deductionValue}>
                            -{formatInr(data.gstEmbeddedPaise)}
                        </Text>
                    </View>

                    <View style={[styles.waterfallRow, styles.waterfallSubtotal]}>
                        <Text>= Taxable Value</Text>
                        <Text>{formatInr(data.taxableValuePaise)}</Text>
                    </View>

                    <View style={styles.waterfallRow}>
                        <Text>
                            - Platform Commission ({data.commissionPercent.toFixed(1)}% of Taxable Value)
                        </Text>
                        <Text style={styles.deductionValue}>
                            -{formatInr(data.commissionAmountPaise)}
                        </Text>
                    </View>

                    <View style={styles.waterfallRow}>
                        <Text>
                            - GST on commission ({data.commissionGstRatePercent}% of Commission under SAC 9985)
                        </Text>
                        <Text style={styles.deductionValue}>
                            -{formatInr(data.commissionGstAmountPaise)}
                        </Text>
                    </View>

                    {data.tcsAmountPaise > 0 ? (
                        <View style={styles.waterfallRow}>
                            <Text>- TCS ({data.tcsPercent}% of Taxable Value)</Text>
                            <Text style={styles.deductionValue}>
                                -{formatInr(data.tcsAmountPaise)}
                            </Text>
                        </View>
                    ) : null}

                    {data.tdsAmountPaise > 0 ? (
                        <View style={styles.waterfallRow}>
                            <Text>- TDS ({data.tdsPercent}% of Gross)</Text>
                            <Text style={styles.deductionValue}>
                                -{formatInr(data.tdsAmountPaise)}
                            </Text>
                        </View>
                    ) : null}

                    <View style={[styles.waterfallRow, styles.waterfallNet]}>
                        <Text>= NET REMITTANCE TO BRAND</Text>
                        <Text style={{ fontSize: 8.5 }}>
                            {formatInr(data.netRemittancePaise)}
                        </Text>
                    </View>
                </View>

                {/* Summary Table with Text-Wrapping and Separated Borders */}
                <View style={styles.summaryTable}>
                    <View style={styles.summaryHead}>
                        <Text style={[styles.summaryHeadCell, styles.colOrder]}>
                            Order No.
                        </Text>
                        <Text style={[styles.summaryHeadCell, styles.colInvoice]}>
                            Invoice No.
                        </Text>
                        <Text style={[styles.summaryHeadCell, styles.colTaxable]}>
                            Taxable Val
                        </Text>
                        <Text style={[styles.summaryHeadCell, styles.colCommission]}>
                            Commission
                        </Text>
                        <Text style={[styles.summaryHeadCell, styles.colGstCommn]}>
                            GST Commn
                        </Text>
                        <Text
                            style={[
                                styles.summaryHeadCell,
                                styles.colNet,
                                { borderRightWidth: 0 },
                            ]}
                        >
                            Net Payable
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCell, styles.colOrder]}>
                            <Text style={styles.wrapText}>{data.orderNumber}</Text>
                        </View>
                        <View style={[styles.summaryCell, styles.colInvoice]}>
                            <Text style={styles.wrapText}>{data.invoiceNumber}</Text>
                        </View>
                        <View style={[styles.summaryCell, styles.colTaxable]}>
                            <Text>{formatInr(data.taxableValuePaise)}</Text>
                        </View>
                        <View style={[styles.summaryCell, styles.colCommission]}>
                            <Text>{formatInr(data.commissionAmountPaise)}</Text>
                        </View>
                        <View style={[styles.summaryCell, styles.colGstCommn]}>
                            <Text>{formatInr(data.commissionGstAmountPaise)}</Text>
                        </View>
                        <View
                            style={[
                                styles.summaryCell,
                                styles.colNet,
                                { borderRightWidth: 0 },
                            ]}
                        >
                            <Text>{formatInr(data.netRemittancePaise)}</Text>
                        </View>
                    </View>
                </View>

                {/* Lower Block: Declarations & Brand Payout Bank */}
                <View style={styles.lower}>
                    <View style={styles.declaration}>
                        <Text style={styles.declarationTitle}>
                            Statutory Declarations & Notes
                        </Text>
                        <Text style={styles.declarationText}>
                            GST on commission is charged at {data.commissionGstRatePercent}% as recorded for this order.
                        </Text>
                        {data.notes ? (
                            <Text style={[styles.declarationText, { marginTop: 2, fontStyle: "italic" }]}>
                                Note: {data.notes}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.bankBox}>
                        <Text style={styles.declarationTitle}>
                            Brand Payout Bank Details
                        </Text>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Bank Name:</Text>
                            <Text style={styles.bankValue}>
                                {data.brand.bankName || "On file"}
                            </Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Account Name:</Text>
                            <Text style={[styles.bankValue, styles.wrapText]}>
                                {data.brand.bankAccountName || data.brand.name}
                            </Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>Account No:</Text>
                            <Text style={styles.bankValue}>
                                {data.brand.bankAccountNumber || "On file"}
                            </Text>
                        </View>
                        <View style={styles.bankRow}>
                            <Text style={styles.bankLabel}>IFSC Code:</Text>
                            <Text style={styles.bankValue}>
                                {data.brand.bankIfscCode || "On file"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Signatory Block */}
                <View style={styles.signatoryBlock}>
                    <View style={{ width: "60%" }}>
                        <Text style={styles.signatoryText}>
                            Settlement processed by: Renivet Marketplace Pvt Ltd
                        </Text>
                        <Text style={styles.signatoryText}>
                            Support: {data.renivet.supportEmail}
                        </Text>
                    </View>
                    <View style={{ width: "38%", alignItems: "flex-end" }}>
                        <Text style={[styles.signatoryText, { fontFamily: "Helvetica-Bold" }]}>
                            For Renivet Marketplace Pvt Ltd
                        </Text>
                        <Text style={[styles.signatoryText, { marginTop: 14 }]}>
                            Authorized Signatory
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        This is a computer-generated settlement statement. For assistance, visit renivet.com/contact.
                    </Text>
                    <Text>Page 1 of 1</Text>
                </View>
            </Page>
        </Document>
    );
}
