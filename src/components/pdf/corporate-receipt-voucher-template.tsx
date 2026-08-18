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
        paddingTop: 26,
        paddingHorizontal: 26,
        paddingBottom: 28,
        backgroundColor: "#ffffff",
        color: ink,
        fontSize: 7.4,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 1.2,
        borderBottomColor: moss,
        paddingBottom: 8,
        marginBottom: 10,
    },
    logo: {
        width: 118,
        height: 32,
        objectFit: "contain",
        objectPosition: "left",
    },
    headerCopy: { width: "55%", alignItems: "flex-end" },
    title: {
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 15,
        textAlign: "right",
        textTransform: "uppercase",
    },
    subtitle: { marginTop: 2, color: muted, fontSize: 7, textAlign: "right" },
    grid: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: line,
        marginBottom: 9,
    },
    party: { width: "50%", minHeight: 74, padding: 7 },
    rightCell: { borderLeftWidth: 1, borderLeftColor: line },
    sectionLabel: {
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 7,
        marginBottom: 3,
        textTransform: "uppercase",
    },
    name: { fontFamily: "Helvetica-Bold", fontSize: 8.5, marginBottom: 2 },
    body: { color: "#334155", fontSize: 7.2, lineHeight: 1.35 },
    meta: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: line,
        marginBottom: 9,
    },
    metaCell: {
        flexGrow: 1,
        minHeight: 32,
        padding: 5,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    metaLast: { borderRightWidth: 0 },
    metaLabel: { color: "#66756a", fontSize: 6.3, marginBottom: 1.5 },
    metaValue: { fontSize: 7.2, lineHeight: 1.25 },
    paymentTable: { borderWidth: 1, borderColor: line, marginBottom: 10 },
    paymentHead: {
        padding: 5,
        color: moss,
        backgroundColor: paperAlt,
        fontFamily: "Helvetica-Bold",
        fontSize: 6.5,
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    paymentRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    paymentLabel: { width: "38%", padding: 5, color: "#66756a" },
    paymentValue: {
        width: "62%",
        padding: 5,
        borderLeftWidth: 1,
        borderLeftColor: line,
        textAlign: "right",
    },
    lower: {
        marginTop: 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    declaration: {
        width: "51%",
        minHeight: 66,
        padding: 8,
        borderWidth: 1,
        borderColor: line,
        color: muted,
    },
    declarationTitle: {
        marginBottom: 4,
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 7,
    },
    declarationText: { color: muted, fontSize: 7.2, lineHeight: 1.35 },
    generatedNote: {
        marginTop: 7,
        color: "#66756a",
        fontSize: 6.5,
        fontFamily: "Helvetica-Oblique",
    },
    totals: { width: "43%", borderWidth: 1, borderColor: line },
    amountRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    amountLabel: { width: "62%", padding: 6 },
    amountValue: {
        width: "38%",
        padding: 6,
        textAlign: "right",
        borderLeftWidth: 1,
        borderLeftColor: line,
    },
    final: {
        backgroundColor: paperAlt,
        fontFamily: "Helvetica-Bold",
        fontSize: 8.2,
    },
    bank: {
        marginTop: 12,
        paddingTop: 7,
        borderTopWidth: 1,
        borderTopColor: line,
    },
    bankRow: { flexDirection: "row", paddingVertical: 1.2 },
    bankLabel: { width: "22%", color: "#66756a" },
    bankValue: { width: "78%", color: "#334155" },
    footer: {
        position: "absolute",
        left: 26,
        right: 26,
        bottom: 8,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: line,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerText: { width: "82%", color: "#66756a", fontSize: 6.2 },
    footerLogo: {
        width: 62,
        height: 14,
        objectFit: "contain",
        objectPosition: "right",
    },
});

export type CorporateReceiptVoucherData = {
    voucherNumber: string;
    voucherDate: string | Date;
    orderNumber: string;
    quoteNumber?: string | null;
    poReference?: string | null;
    amountPaise: number;
    paymentMode: string;
    paymentReference?: string | null;
    seller: {
        name: string;
        onBehalfOfBrand?: string | null;
        address: string;
        gstin?: string | null;
        bankName?: string | null;
        bankAccountName?: string | null;
        bankAccountNumber?: string | null;
        bankIfscCode?: string | null;
        signatoryName: string;
        logoUrl?: string | null;
    };
    buyer: { name: string; address: string; gstin?: string | null };
};

function money(value: number) {
    return `INR ${(value / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function CorporateReceiptVoucherTemplate({
    data,
}: {
    data: CorporateReceiptVoucherData;
}) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image src={renivetLogoUrl} style={styles.logo} />
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>Receipt Voucher</Text>
                        <Text style={styles.subtitle}>
                            Mandatory under §31(3)(d) CGST Act — Advance received against supply of goods
                        </Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    <Party
                        label="Received by"
                        party={{
                            ...data.seller,
                            onBehalfOf: data.seller.onBehalfOfBrand
                                ? `(on behalf of ${data.seller.onBehalfOfBrand})`
                                : undefined,
                        }}
                    />
                    <Party label="Received from" party={data.buyer} right />
                </View>

                <View style={styles.meta}>
                    <Meta label="Voucher number" value={data.voucherNumber} />
                    <Meta
                        label="Voucher date"
                        value={new Date(data.voucherDate).toLocaleDateString(
                            "en-IN"
                        )}
                    />
                    <Meta label="Order number" value={data.orderNumber} last />
                </View>
                <View style={styles.meta}>
                    <Meta
                        label="Against"
                        value={[
                            data.poReference ? `PO: ${data.poReference}` : null,
                            data.quoteNumber
                                ? `Quote: ${data.quoteNumber}`
                                : `Order: ${data.orderNumber}`,
                        ]
                            .filter(Boolean)
                            .join(" | ")}
                    />
                    <Meta label="Payment mode" value={data.paymentMode} />
                    <Meta
                        label="Transaction ID / Ref"
                        value={data.paymentReference || "Not available"}
                        last
                    />
                </View>

                <View style={styles.paymentTable}>
                    <Text style={styles.paymentHead}>PAYMENT & GST TREATMENT</Text>
                    <PaymentRow
                        label="Nature of receipt"
                        value="Advance against supply of goods"
                    />
                    <PaymentRow
                        label="GST declaration"
                        value="GST on advance for supply of goods is exempt per Notification 66/2017-Central Tax. GST will be charged on the Tax Invoice at the time of supply."
                    />
                    <PaymentRow
                        label="Adjustment"
                        value="Adjusted against the final tax invoice on dispatch"
                    />
                </View>

                <View style={styles.lower}>
                    <View style={styles.declaration}>
                        <Text style={styles.declarationTitle}>STATUTORY GST DECLARATION</Text>
                        <Text style={styles.declarationText}>
                            GST on advance for supply of goods is exempt per
                            Notification 66/2017-Central Tax. GST will be
                            charged on the Tax Invoice at the time of supply.
                        </Text>
                        <Text style={styles.generatedNote}>
                            Computer-generated voucher - no signature required.
                        </Text>
                    </View>
                    <View style={styles.totals}>
                        <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>
                                Amount received
                            </Text>
                            <Text style={styles.amountValue}>
                                {money(data.amountPaise)}
                            </Text>
                        </View>
                        <View style={[styles.amountRow, styles.final]}>
                            <Text style={styles.amountLabel}>
                                Receipt total
                            </Text>
                            <Text style={styles.amountValue}>
                                {money(data.amountPaise)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bank}>
                    <Text style={styles.sectionLabel}>BANK DETAILS</Text>
                    <BankRow label="Bank name" value={data.seller.bankName} />
                    <BankRow
                        label="Account name"
                        value={data.seller.bankAccountName || "Renivet"}
                    />
                    <BankRow
                        label="Account number"
                        value={data.seller.bankAccountNumber}
                    />
                    <BankRow
                        label="IFSC code"
                        value={data.seller.bankIfscCode}
                    />
                </View>

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        This is a computer-generated receipt voucher. For
                        assistance, visit renivet.com/contact.
                    </Text>
                    <Image src={renivetLogoUrl} style={styles.footerLogo} />
                </View>
            </Page>
        </Document>
    );
}

function Party({
    label,
    party,
    right = false,
}: {
    label: string;
    party: {
        name: string;
        onBehalfOf?: string | null;
        address: string;
        gstin?: string | null;
    };
    right?: boolean;
}) {
    return (
        <View style={[styles.party, ...(right ? [styles.rightCell] : [])]}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <Text style={styles.name}>{party.name}</Text>
            {party.onBehalfOf ? (
                <Text style={[styles.body, { color: moss, marginBottom: 2 }]}>
                    {party.onBehalfOf}
                </Text>
            ) : null}
            <Text style={styles.body}>{party.address}</Text>
            <Text style={styles.body}>
                GSTIN: {party.gstin || "Not provided"}
            </Text>
        </View>
    );
}

function Meta({
    label,
    value,
    last = false,
}: {
    label: string;
    value: string;
    last?: boolean;
}) {
    return (
        <View style={[styles.metaCell, ...(last ? [styles.metaLast] : [])]}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
        </View>
    );
}

function PaymentRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{label}</Text>
            <Text style={styles.paymentValue}>{value}</Text>
        </View>
    );
}

function BankRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>{label}</Text>
            <Text style={styles.bankValue}>{value || "Not provided"}</Text>
        </View>
    );
}
