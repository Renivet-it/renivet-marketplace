import { formatCorporateDeliveryAddress } from "@/lib/corporate-delivery-address";
import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

const colors = {
    brand: "#2f4f3b",
    brandDark: "#1f3327",
    ink: "#1e2930",
    muted: "#56635d",
    line: "#d8d5c8",
    pale: "#f1f3eb",
    paleGreen: "#e8eee4",
    white: "#ffffff",
};

const styles = StyleSheet.create({
    page: {
        padding: 34,
        fontSize: 8.4,
        color: colors.ink,
        backgroundColor: colors.white,
        fontFamily: "Helvetica",
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingBottom: 16,
        borderBottom: `1.3 solid ${colors.brand}`,
    },
    brandLockup: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        width: 31,
        height: 31,
        marginRight: 10,
    },
    brandName: {
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: 1.5,
        color: "#111111",
    },
    brandDescriptor: {
        marginTop: 2,
        fontSize: 7.1,
        color: colors.muted,
    },
    documentTitle: {
        fontSize: 17.5,
        fontWeight: 700,
        color: colors.brand,
        textAlign: "right",
    },
    documentSubtitle: {
        marginTop: 3,
        fontSize: 7.6,
        color: colors.muted,
        textAlign: "right",
    },
    section: {
        marginTop: 14,
    },
    addressGrid: {
        flexDirection: "row",
        borderTop: `0.8 solid ${colors.line}`,
        borderLeft: `0.8 solid ${colors.line}`,
    },
    addressBox: {
        width: "50%",
        minHeight: 74,
        padding: 10,
        borderRight: `0.8 solid ${colors.line}`,
        borderBottom: `0.8 solid ${colors.line}`,
    },
    label: {
        fontSize: 7,
        fontWeight: 700,
        color: colors.brand,
        textTransform: "uppercase",
    },
    partyName: {
        marginTop: 4,
        fontSize: 10.5,
        fontWeight: 700,
        color: colors.ink,
    },
    detail: {
        marginTop: 3,
        fontSize: 8,
        lineHeight: 1.35,
        color: "#374151",
    },
    metaGrid: {
        flexDirection: "row",
        borderTop: `0.8 solid ${colors.line}`,
        borderLeft: `0.8 solid ${colors.line}`,
    },
    metaCell: {
        minHeight: 43,
        padding: 8,
        borderRight: `0.8 solid ${colors.line}`,
        borderBottom: `0.8 solid ${colors.line}`,
    },
    metaLabel: {
        fontSize: 6.9,
        color: colors.muted,
    },
    metaValue: {
        marginTop: 3,
        fontSize: 8.1,
        fontWeight: 700,
        color: colors.ink,
    },
    table: {
        marginTop: 14,
        borderTop: `0.8 solid ${colors.line}`,
        borderLeft: `0.8 solid ${colors.line}`,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.pale,
    },
    tableRow: {
        flexDirection: "row",
    },
    tableCell: {
        padding: 7,
        borderRight: `0.8 solid ${colors.line}`,
        borderBottom: `0.8 solid ${colors.line}`,
        justifyContent: "center",
    },
    tableHeading: {
        fontSize: 6.6,
        fontWeight: 700,
        color: colors.brand,
    },
    tableValue: {
        fontSize: 8,
        lineHeight: 1.35,
        color: colors.ink,
    },
    tableValueRight: {
        fontSize: 8,
        lineHeight: 1.35,
        color: colors.ink,
        textAlign: "right",
    },
    tableValueCenter: {
        fontSize: 8,
        lineHeight: 1.35,
        color: colors.ink,
        textAlign: "center",
    },
    lowerGrid: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 15,
    },
    productionBox: {
        width: "57%",
        minHeight: 184,
        padding: 12,
        border: `0.8 solid ${colors.line}`,
        backgroundColor: "#fbfcf9",
    },
    summaryBox: {
        width: "43%",
        minHeight: 184,
        borderTop: `0.8 solid ${colors.line}`,
        borderLeft: `0.8 solid ${colors.line}`,
    },
    sectionTitle: {
        marginBottom: 5,
        fontSize: 9,
        fontWeight: 700,
        color: colors.brandDark,
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    productionText: {
        fontSize: 8.1,
        lineHeight: 1.45,
        color: "#374151",
    },
    productionRule: {
        marginTop: 11,
        paddingTop: 9,
        borderTop: `0.8 solid ${colors.line}`,
    },
    totalRow: {
        flexDirection: "row",
        borderRight: `0.8 solid ${colors.line}`,
        borderBottom: `0.8 solid ${colors.line}`,
    },
    totalLabel: {
        width: "66%",
        padding: 8,
        fontSize: 8,
        color: "#374151",
    },
    totalValue: {
        width: "34%",
        padding: 8,
        borderLeft: `0.8 solid ${colors.line}`,
        fontSize: 8,
        color: colors.ink,
        textAlign: "right",
    },
    grandTotalLabel: {
        width: "66%",
        padding: 8,
        backgroundColor: colors.paleGreen,
        fontSize: 8.8,
        fontWeight: 700,
        color: colors.brandDark,
    },
    grandTotalValue: {
        width: "34%",
        padding: 8,
        borderLeft: `0.8 solid ${colors.line}`,
        backgroundColor: colors.paleGreen,
        fontSize: 8.8,
        fontWeight: 700,
        color: colors.brandDark,
        textAlign: "right",
    },
    amountWords: {
        padding: 8,
        borderRight: `0.8 solid ${colors.line}`,
        borderBottom: `0.8 solid ${colors.line}`,
        fontSize: 7.2,
        lineHeight: 1.35,
        color: colors.muted,
    },
    footer: {
        marginTop: 17,
        paddingTop: 10,
        borderTop: `0.8 solid ${colors.line}`,
    },
    footerText: {
        fontSize: 7,
        lineHeight: 1.45,
        color: colors.muted,
    },
    footerBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        paddingTop: 8,
        borderTop: `0.8 solid ${colors.line}`,
    },
    footerBrand: {
        fontSize: 7.2,
        fontWeight: 700,
        letterSpacing: 1,
        color: colors.brand,
    },
    notesGrid: {
        flexDirection: "row",
        marginTop: 15,
    },
    notePanel: {
        width: "50%",
        minHeight: 74,
        padding: 11,
        border: `0.8 solid ${colors.line}`,
    },
    notePanelRight: {
        borderLeftWidth: 0,
        backgroundColor: colors.pale,
    },
    noteTitle: {
        fontSize: 7.1,
        fontWeight: 700,
        color: colors.brand,
        textTransform: "uppercase",
        letterSpacing: 0.65,
    },
    noteText: {
        marginTop: 6,
        fontSize: 7.6,
        lineHeight: 1.4,
        color: "#374151",
    },
});

function toMoney(value?: number | null) {
    return `INR ${((value ?? 0) / 100).toFixed(2)}`;
}

function formatDate(value?: string | Date | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function toAmountWords(value?: number | null) {
    const amount = Math.max(0, Math.round((value ?? 0) / 100));
    return `Amount payable: INR ${amount.toLocaleString("en-IN")} only`;
}

function MetaCell({
    label,
    value,
    width,
}: {
    label: string;
    value: string;
    width: string;
}) {
    return (
        <View style={[styles.metaCell, { width }]}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
        </View>
    );
}

function TotalRow({
    label,
    value,
    emphasis = false,
}: {
    label: string;
    value: string;
    emphasis?: boolean;
}) {
    return (
        <View style={styles.totalRow}>
            <Text style={emphasis ? styles.grandTotalLabel : styles.totalLabel}>
                {label}
            </Text>
            <Text style={emphasis ? styles.grandTotalValue : styles.totalValue}>
                {value}
            </Text>
        </View>
    );
}

export function CorporateOrderSummaryTemplate({
    order,
    settings,
}: {
    order: any;
    settings: any;
}) {
    const product = order.productConfigSnapshot ?? {};
    const branding = order.brandingConfigSnapshot ?? {};
    const pricing = order.pricingSnapshot ?? {};
    const payment = order.commercialSnapshot?.payment ?? order.paymentSnapshot ?? {};
    const advancePaidPaise = payment.advancePaidPaise ?? order.advancePaidPaise;
    const balanceDuePaise = payment.balanceDuePaise ?? order.balanceDuePaise;
    const colorsSelected = (product.colors ?? [])
        .map((item: any) => item.name)
        .filter(Boolean)
        .join(", ");
    const placements = (branding.logoLocations ?? [])
        .map((item: any) => item.name)
        .filter(Boolean)
        .join(", ");
    const extras = (pricing.appliedExtraCharges ?? [])
        .map((item: any) => item.name)
        .filter(Boolean)
        .join(", ");
    const sizeBreakdown = Object.entries(order.sizeBreakdown ?? {})
        .map(([size, count]) => `${size}: ${count}`)
        .join(" | ");
    const productName = product.productType?.name || "Corporate garment";
    const hsnCode = product.hsnCode || "-";
    const unitPricePaise =
        pricing.unitPricePaise ??
        Math.round(
            (order.subtotalPaise ?? 0) / Math.max(order.quantity ?? 1, 1)
        );
    const taxableValue =
        (order.subtotalPaise ?? 0) + (order.customizationPaise ?? 0);
    const gstRate = `${((order.gstRateBps ?? 0) / 100).toFixed(2)}%`;
    const deliveryAddress = formatCorporateDeliveryAddress(order);
    const productionDetails = [
        `Fabric: ${product.fabricComposition?.name || "-"}`,
        `GSM: ${product.gsmOption?.label || "-"}`,
        colorsSelected ? `Colours: ${colorsSelected}` : "",
        branding.printMethod?.name
            ? `Branding: ${branding.printMethod.name}${placements ? ` - ${placements}` : ""}`
            : "",
        extras ? `Extras: ${extras}` : "",
        sizeBreakdown ? `Size run: ${sizeBreakdown}` : "",
    ]
        .filter(Boolean)
        .join("\n");

    return (
        <Document>
            <Page size="A4" style={styles.page} wrap={false}>
                <View style={styles.header}>
                    <View style={styles.brandLockup}>
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw"
                            style={styles.logo}
                        />
                        <View>
                            <Text style={styles.brandName}>RENIVET</Text>
                            <Text style={styles.brandDescriptor}>
                                Corporate procurement and fulfilment
                            </Text>
                        </View>
                    </View>
                    <View>
                        <Text style={styles.documentTitle}>
                            CORPORATE ORDER SUMMARY
                        </Text>
                        <Text style={styles.documentSubtitle}>
                            Original for customer - payment and production
                            record
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.addressGrid}>
                        <View style={styles.addressBox}>
                            <Text style={styles.label}>Bill To</Text>
                            <Text style={styles.partyName}>
                                {order.companyName}
                            </Text>
                            <Text style={styles.detail}>
                                {order.contactPersonName}
                                {order.emailAddress
                                    ? ` | ${order.emailAddress}`
                                    : ""}
                                {order.mobileNumber
                                    ? ` | ${order.mobileNumber}`
                                    : ""}
                            </Text>
                        </View>
                        <View style={styles.addressBox}>
                            <Text style={styles.label}>Ship To</Text>
                            <Text style={styles.partyName}>
                                {order.contactPersonName}
                            </Text>
                            <Text style={styles.detail}>{deliveryAddress}</Text>
                            {order.gstNumber ? (
                                <Text style={styles.detail}>
                                    GSTIN: {order.gstNumber}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.metaGrid}>
                        <MetaCell
                            label="Order number"
                            value={order.publicOrderId}
                            width="28%"
                        />
                        <MetaCell
                            label="Order date"
                            value={formatDate(order.createdAt)}
                            width="24%"
                        />
                        <MetaCell
                            label="Payment status"
                            value={
                                order.paymentStatus === "paid"
                                    ? "Paid"
                                    : "Advance paid"
                            }
                            width="24%"
                        />
                        <MetaCell
                            label="Expected timeline"
                            value={
                                settings.expectedTimelineText || "As confirmed"
                            }
                            width="24%"
                        />
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <TableHeading width="5%" value="#" align="center" />
                        <TableHeading width="34%" value="Description" />
                        <TableHeading width="11%" value="HSN" align="center" />
                        <TableHeading width="8%" value="Qty" align="center" />
                        <TableHeading
                            width="12%"
                            value="Unit price"
                            align="right"
                        />
                        <TableHeading
                            width="12%"
                            value="Taxable"
                            align="right"
                        />
                        <TableHeading width="6%" value="GST" align="center" />
                        <TableHeading width="12%" value="Total" align="right" />
                    </View>
                    <View style={styles.tableRow}>
                        <TableCell width="5%" value="1" align="center" />
                        <TableCell
                            width="34%"
                            value={`${productName}\n${product.gsmOption?.label || ""} ${product.fabricComposition?.name ? `| ${product.fabricComposition.name}` : ""}`.trim()}
                        />
                        <TableCell width="11%" value={hsnCode} align="center" />
                        <TableCell
                            width="8%"
                            value={String(order.quantity ?? 0)}
                            align="center"
                        />
                        <TableCell
                            width="12%"
                            value={toMoney(unitPricePaise)}
                            align="right"
                        />
                        <TableCell
                            width="12%"
                            value={toMoney(taxableValue)}
                            align="right"
                        />
                        <TableCell width="6%" value={gstRate} align="center" />
                        <TableCell
                            width="12%"
                            value={toMoney(order.totalPaise)}
                            align="right"
                        />
                    </View>
                </View>

                <View style={styles.lowerGrid}>
                    <View style={styles.productionBox}>
                        <Text style={styles.sectionTitle}>
                            Production specification
                        </Text>
                        <Text style={styles.productionText}>
                            {productionDetails}
                        </Text>
                        <View style={styles.productionRule}>
                            <Text style={styles.label}>Order note</Text>
                            <Text style={styles.productionText}>
                                {order.customerNotes ||
                                    "This summary records the confirmed corporate order configuration and payment schedule."}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.summaryBox}>
                        <TotalRow
                            label="Garment subtotal"
                            value={toMoney(order.subtotalPaise)}
                        />
                        <TotalRow
                            label="Branding and customization"
                            value={toMoney(order.customizationPaise)}
                        />
                        <TotalRow
                            label={`GST (${gstRate})`}
                            value={toMoney(order.gstPaise)}
                        />
                        <TotalRow
                            label="Order total"
                            value={toMoney(order.totalPaise)}
                            emphasis
                        />
                        <TotalRow
                            label="Advance received"
                            value={toMoney(advancePaidPaise)}
                        />
                        <TotalRow
                            label="Balance due"
                            value={toMoney(balanceDuePaise)}
                        />
                        <Text style={styles.amountWords}>
                            {toAmountWords(order.totalPaise)}
                        </Text>
                    </View>
                </View>

                <View style={styles.notesGrid}>
                    <View style={styles.notePanel}>
                        <Text style={styles.noteTitle}>Payment position</Text>
                        <Text style={styles.noteText}>
                            {balanceDuePaise > 0
                                ? `${toMoney(advancePaidPaise)} has been received. ${toMoney(balanceDuePaise)} remains payable against the final payment request.`
                                : "The full order value has been received. No further payment is due for this order."}
                        </Text>
                    </View>
                    <View style={[styles.notePanel, styles.notePanelRight]}>
                        <Text style={styles.noteTitle}>
                            Fulfilment next step
                        </Text>
                        <Text style={styles.noteText}>
                            Our operations team will review the artwork and
                            production details, then proceed according to the
                            stated timeline. Final tax documentation is issued
                            separately when applicable.
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        This is a computer-generated corporate order summary. It
                        records the agreed order specification, payment
                        position, and production requirements. Final tax
                        documentation is issued separately when applicable.
                    </Text>
                    <View style={styles.footerBottom}>
                        <Text style={styles.footerText}>
                            For support, visit the Renivet corporate procurement
                            portal.
                        </Text>
                        <Text style={styles.footerBrand}>RENIVET</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

type TableAlignment = "left" | "center" | "right";

function TableHeading({
    width,
    value,
    align = "left",
}: {
    width: string;
    value: string;
    align?: TableAlignment;
}) {
    return (
        <View style={[styles.tableCell, { width }]}>
            <Text style={[styles.tableHeading, { textAlign: align }]}>
                {value}
            </Text>
        </View>
    );
}

function TableCell({
    width,
    value,
    align = "left",
}: {
    width: string;
    value: string;
    align?: TableAlignment;
}) {
    return (
        <View style={[styles.tableCell, { width }]}>
            <Text
                style={
                    align === "right"
                        ? styles.tableValueRight
                        : align === "center"
                          ? styles.tableValueCenter
                          : styles.tableValue
                }
            >
                {value}
            </Text>
        </View>
    );
}
