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
        color: ink,
        backgroundColor: "#ffffff",
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
    party: { width: "50%", minHeight: 70, padding: 7 },
    rightCell: { borderLeftWidth: 1, borderLeftColor: line },
    label: {
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
        flexWrap: "wrap",
        borderWidth: 1,
        borderColor: line,
        marginBottom: 9,
    },
    metaCell: {
        width: "33.333%",
        minHeight: 31,
        padding: 5,
        borderRightWidth: 1,
        borderRightColor: line,
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    metaLabel: { color: "#66756a", fontSize: 6.3, marginBottom: 1.5 },
    metaValue: { fontSize: 7.1, lineHeight: 1.25 },
    table: { borderWidth: 1, borderColor: line },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    tableHead: { backgroundColor: paperAlt },
    th: {
        padding: 4,
        color: moss,
        fontFamily: "Helvetica-Bold",
        fontSize: 6.1,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    td: {
        minHeight: 39,
        padding: 4,
        fontSize: 6.6,
        lineHeight: 1.3,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    no: { width: "4%" },
    product: { width: "31%" },
    sku: { width: "15%" },
    hsn: { width: "9%" },
    quantity: { width: "10%", textAlign: "right" },
    rate: { width: "14%", textAlign: "right" },
    amount: { width: "17%", textAlign: "right" },
    proformaProduct: { width: "25%" },
    proformaHsn: { width: "8%" },
    proformaQuantity: { width: "7%", textAlign: "right" },
    proformaRate: { width: "12%", textAlign: "right" },
    proformaTaxable: { width: "12%", textAlign: "right" },
    proformaGstRate: { width: "8%", textAlign: "right" },
    proformaGstAmount: { width: "12%", textAlign: "right" },
    proformaTotal: { width: "12%", textAlign: "right" },
    purchaseProduct: { width: "32%" },
    purchaseHsn: { width: "7%" },
    purchaseQuantity: { width: "6%", textAlign: "right" },
    purchaseRate: { width: "11%", textAlign: "right" },
    purchaseTaxable: { width: "11%", textAlign: "right" },
    purchaseGstRate: { width: "7%", textAlign: "right" },
    purchaseGstAmount: { width: "10%", textAlign: "right" },
    purchaseTotal: { width: "12%", textAlign: "right" },
    last: { borderRightWidth: 0 },
    itemDetail: { marginTop: 2, color: "#66756a" },
    lower: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    lowerTotalsOnly: { justifyContent: "flex-end" },
    identity: { width: "51%", paddingRight: 12 },
    identityName: {
        fontFamily: "Helvetica-Bold",
        fontSize: 8.5,
        marginBottom: 6,
    },
    bankRow: { flexDirection: "row", paddingVertical: 1.2 },
    bankLabel: { width: "37%", color: "#66756a" },
    bankValue: { width: "63%", color: "#334155" },
    signature: { marginTop: 12, color: muted, fontSize: 7, lineHeight: 1.45 },
    totals: { width: "43%", borderWidth: 1, borderColor: line },
    totalRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    totalLabel: { width: "62%", padding: 5 },
    totalValue: {
        width: "38%",
        padding: 5,
        textAlign: "right",
        borderLeftWidth: 1,
        borderLeftColor: line,
    },
    grandTotal: { backgroundColor: paperAlt, fontFamily: "Helvetica-Bold" },
    notes: {
        marginTop: 10,
        paddingTop: 7,
        borderTopWidth: 1,
        borderTopColor: line,
        color: muted,
        fontSize: 6.7,
        lineHeight: 1.45,
    },
    notesTitle: { color: moss, fontFamily: "Helvetica-Bold", marginBottom: 3 },
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

export type CorporateCommercialParty = {
    name: string;
    address: string;
    gstin?: string | null;
    email?: string | null;
    phone?: string | null;
};

export type CorporateCommercialDocumentData = {
    title: "Proforma Invoice" | "Purchase Order" | "Delivery Challan";
    subtitle: string;
    documentNumber: string;
    documentDate: string | Date;
    validUntil?: string | Date | null;
    fromLabel: string;
    toLabel: string;
    from: CorporateCommercialParty;
    to: CorporateCommercialParty;
    references?: Array<{ label: string; value?: string | null }>;
    item: {
        description: string;
        detail?: string | null;
        sku?: string | null;
        hsn?: string | null;
        quantity: number;
        unit?: string;
        unitRatePaise?: number | null;
        amountPaise?: number | null;
        gstRateBps?: number | null;
        gstAmountPaise?: number | null;
    };
    totals?: {
        taxableValuePaise: number;
        cgstPaise?: number;
        sgstPaise?: number;
        igstPaise?: number;
        gstRateBps?: number | null;
        gstAmountPaise?: number | null;
        totalAmountPaise: number;
    } | null;
    notes?: string[];
    bank?: {
        bankName?: string | null;
        accountName?: string | null;
        accountNumber?: string | null;
        ifsc?: string | null;
        branch?: string | null;
    } | null;
    signatoryName: string;
    declarationCompanyName: string;
    showSignatureBlock?: boolean;
};

function money(value?: number | null) {
    if (value === null || value === undefined) return "-";
    return `INR ${(value / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function date(value: string | Date) {
    return new Date(value).toLocaleDateString("en-IN");
}

export function CorporateCommercialDocumentTemplate({
    data,
}: {
    data: CorporateCommercialDocumentData;
}) {
    const isProforma = data.title === "Proforma Invoice";
    const isPurchaseOrder = data.title === "Purchase Order";
    const showDetailedTax = isProforma || isPurchaseOrder;
    const showSku = !isProforma && !isPurchaseOrder;
    const showSignatureBlock = data.showSignatureBlock !== false;
    const references = [
        {
            label: isProforma ? "PI number" : "Document number",
            value: data.documentNumber,
        },
        {
            label: isProforma ? "Date" : "Document date",
            value: date(data.documentDate),
        },
        ...(data.validUntil
            ? [{ label: "Valid until", value: date(data.validUntil) }]
            : []),
        ...(data.references ?? []),
    ];
    const hasPricing = Boolean(data.totals);
    const gstRateBps =
        data.item.gstRateBps ?? data.totals?.gstRateBps ?? null;
    const gstAmountPaise =
        data.item.gstAmountPaise ?? data.totals?.gstAmountPaise ?? null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image src={renivetLogoUrl} style={styles.logo} />
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>{data.title}</Text>
                    {data.subtitle ? (
                        <Text style={styles.subtitle}>{data.subtitle}</Text>
                    ) : null}
                    </View>
                </View>

                <View style={styles.grid}>
                    <Party label={data.fromLabel} party={data.from} />
                    <Party label={data.toLabel} party={data.to} right />
                </View>

                <View style={styles.meta}>
                    {references.map((entry) => (
                        <View key={entry.label} style={styles.metaCell}>
                            <Text style={styles.metaLabel}>{entry.label}</Text>
                            <Text style={styles.metaValue}>
                                {entry.value || "Not provided"}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHead]}>
                        <Text style={[styles.th, styles.no]}>#</Text>
                        <Text
                            style={[
                                styles.th,
                                isProforma
                                    ? styles.proformaProduct
                                    : isPurchaseOrder
                                      ? styles.purchaseProduct
                                      : styles.product,
                            ]}
                        >
                            Description
                        </Text>
                        {showSku ? (
                            <Text
                                style={[styles.th, styles.sku]}
                            >
                                SKU
                            </Text>
                        ) : null}
                        <Text
                            style={[
                                styles.th,
                                isProforma
                                    ? styles.proformaHsn
                                    : isPurchaseOrder
                                      ? styles.purchaseHsn
                                      : styles.hsn,
                            ]}
                        >
                            HSN
                        </Text>
                        <Text
                            style={[
                                styles.th,
                                isProforma
                                    ? styles.proformaQuantity
                                    : isPurchaseOrder
                                      ? styles.purchaseQuantity
                                      : styles.quantity,
                            ]}
                        >
                            Qty
                        </Text>
                        <Text
                            style={[
                                styles.th,
                                isProforma
                                    ? styles.proformaRate
                                    : isPurchaseOrder
                                      ? styles.purchaseRate
                                      : styles.rate,
                            ]}
                        >
                            {showDetailedTax ? "Unit price excl. GST" : "Rate INR"}
                        </Text>
                        {showDetailedTax ? (
                            <>
                                <Text
                                    style={[
                                        styles.th,
                                        isProforma
                                            ? styles.proformaTaxable
                                            : styles.purchaseTaxable,
                                    ]}
                                >
                                    Taxable
                                </Text>
                                <Text
                                    style={[
                                        styles.th,
                                        isProforma
                                            ? styles.proformaGstRate
                                            : styles.purchaseGstRate,
                                    ]}
                                >
                                    GST rate
                                </Text>
                                <Text
                                    style={[
                                        styles.th,
                                        isProforma
                                            ? styles.proformaGstAmount
                                            : styles.purchaseGstAmount,
                                    ]}
                                >
                                    GST amount
                                </Text>
                            </>
                        ) : null}
                        <Text
                            style={[
                                styles.th,
                                isProforma
                                    ? styles.proformaTotal
                                    : isPurchaseOrder
                                      ? styles.purchaseTotal
                                      : styles.amount,
                                styles.last,
                            ]}
                        >
                            {showDetailedTax ? "Total incl. GST" : "Total INR"}
                        </Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.td, styles.no]}>1</Text>
                        <View
                            style={[
                                styles.td,
                                isProforma
                                    ? styles.proformaProduct
                                    : isPurchaseOrder
                                      ? styles.purchaseProduct
                                      : styles.product,
                            ]}
                        >
                            <Text>{data.item.description}</Text>
                            {data.item.detail ? (
                                <Text style={styles.itemDetail}>
                                    {data.item.detail}
                                </Text>
                            ) : null}
                        </View>
                        {showSku ? (
                            <Text
                                style={[styles.td, styles.sku]}
                            >
                                {data.item.sku || "-"}
                            </Text>
                        ) : null}
                        <Text
                            style={[
                                styles.td,
                                isProforma
                                    ? styles.proformaHsn
                                    : isPurchaseOrder
                                      ? styles.purchaseHsn
                                      : styles.hsn,
                            ]}
                        >
                            {data.item.hsn || "-"}
                        </Text>
                        <Text
                            style={[
                                styles.td,
                                isProforma
                                    ? styles.proformaQuantity
                                    : isPurchaseOrder
                                      ? styles.purchaseQuantity
                                      : styles.quantity,
                            ]}
                        >
                            {data.item.quantity} {data.item.unit || "pcs"}
                        </Text>
                        <Text
                            style={[
                                styles.td,
                                isProforma
                                    ? styles.proformaRate
                                    : isPurchaseOrder
                                      ? styles.purchaseRate
                                      : styles.rate,
                            ]}
                        >
                            {hasPricing ? money(data.item.unitRatePaise) : "-"}
                        </Text>
                        {showDetailedTax ? (
                            <>
                                <Text
                                    style={[
                                        styles.td,
                                        isProforma
                                            ? styles.proformaTaxable
                                            : styles.purchaseTaxable,
                                    ]}
                                >
                                    {hasPricing ? money(data.item.amountPaise) : "-"}
                                </Text>
                                <Text
                                    style={[
                                        styles.td,
                                        isProforma
                                            ? styles.proformaGstRate
                                            : styles.purchaseGstRate,
                                    ]}
                                >
                                    {gstRateBps === null
                                        ? "-"
                                        : `${(gstRateBps / 100).toFixed(2)}%`}
                                </Text>
                                <Text
                                    style={[
                                        styles.td,
                                        isProforma
                                            ? styles.proformaGstAmount
                                            : styles.purchaseGstAmount,
                                    ]}
                                >
                                    {hasPricing ? money(gstAmountPaise) : "-"}
                                </Text>
                            </>
                        ) : null}
                        <Text
                            style={[
                                styles.td,
                                isProforma
                                    ? styles.proformaTotal
                                    : isPurchaseOrder
                                      ? styles.purchaseTotal
                                      : styles.amount,
                                styles.last,
                            ]}
                        >
                            {hasPricing
                                ? money(
                                      showDetailedTax
                                          ? data.totals?.totalAmountPaise
                                          : data.item.amountPaise
                                  )
                                : "-"}
                        </Text>
                    </View>
                </View>

                <View
                    style={[
                        styles.lower,
                        ...(showSignatureBlock
                            ? []
                            : [styles.lowerTotalsOnly]),
                    ]}
                >
                    {showSignatureBlock ? (
                        <View style={styles.identity}>
                        <Text style={styles.identityName}>
                            {data.declarationCompanyName.toUpperCase()}
                        </Text>
                        {data.bank ? (
                            <>
                                <Text style={styles.label}>BANK DETAILS</Text>
                                <BankRow
                                    label="Bank name"
                                    value={data.bank.bankName}
                                />
                                <BankRow
                                    label="Account name"
                                    value={data.bank.accountName || "Renivet"}
                                />
                                <BankRow
                                    label="Account number"
                                    value={data.bank.accountNumber}
                                />
                                <BankRow
                                    label="IFSC code"
                                    value={data.bank.ifsc}
                                />
                                {data.bank.branch ? (
                                    <BankRow
                                        label="Branch"
                                        value={data.bank.branch}
                                    />
                                ) : null}
                            </>
                        ) : null}
                        <Text style={styles.signature}>
                            For {data.declarationCompanyName}
                            {"\n"}
                            {data.signatoryName}
                            {"\n"}
                            Authorised Signatory
                        </Text>
                        </View>
                    ) : null}

                    {data.totals ? (
                        <View style={styles.totals}>
                            <Total
                                label="Taxable value"
                                value={data.totals.taxableValuePaise}
                            />
                            {showDetailedTax ? (
                                <Total
                                    label={`GST${
                                        gstRateBps === null
                                            ? ""
                                            : ` (${(gstRateBps / 100).toFixed(2)}%)`
                                    }`}
                                    value={gstAmountPaise ?? 0}
                                />
                            ) : null}
                            {!showDetailedTax && data.totals.cgstPaise ? (
                                <Total
                                    label="CGST"
                                    value={data.totals.cgstPaise}
                                />
                            ) : null}
                            {!showDetailedTax && data.totals.sgstPaise ? (
                                <Total
                                    label="SGST"
                                    value={data.totals.sgstPaise}
                                />
                            ) : null}
                            {!showDetailedTax && data.totals.igstPaise ? (
                                <Total
                                    label="IGST"
                                    value={data.totals.igstPaise}
                                />
                            ) : null}
                            <Total
                                label={
                                    showDetailedTax
                                        ? "Grand total incl. GST"
                                        : "Document total"
                                }
                                value={data.totals.totalAmountPaise}
                                final
                            />
                        </View>
                    ) : null}
                </View>

                {data.notes?.length ? (
                    <View style={styles.notes}>
                        <Text style={styles.notesTitle}>
                            TERMS AND INSTRUCTIONS
                        </Text>
                        {data.notes.map((note, index) => (
                            <Text key={`${index}-${note}`}>* {note}</Text>
                        ))}
                    </View>
                ) : null}

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        This is a computer-generated corporate document. For
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
    party: CorporateCommercialParty;
    right?: boolean;
}) {
    return (
        <View style={[styles.party, ...(right ? [styles.rightCell] : [])]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.name}>{party.name}</Text>
            <Text style={styles.body}>{party.address}</Text>
            <Text style={styles.body}>
                GSTIN: {party.gstin || "Not provided"}
            </Text>
            {party.email ? (
                <Text style={styles.body}>{party.email}</Text>
            ) : null}
            {party.phone ? (
                <Text style={styles.body}>{party.phone}</Text>
            ) : null}
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

function Total({
    label,
    value,
    final = false,
}: {
    label: string;
    value: number;
    final?: boolean;
}) {
    return (
        <View style={[styles.totalRow, ...(final ? [styles.grandTotal] : [])]}>
            <Text style={styles.totalLabel}>{label}</Text>
            <Text style={styles.totalValue}>{money(value)}</Text>
        </View>
    );
}
