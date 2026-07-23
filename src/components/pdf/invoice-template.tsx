import {
    Document,
    Font,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

Font.register({
    family: "NotoSans",
    src: "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
});
Font.register({
    family: "NotoSans",
    src: "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
    fontWeight: 700,
});
const ink = "#18212f";
const border = "#cbd5e1";
const money = (paise: number) =>
    `\u20B9${(Math.max(0, paise) / 100).toFixed(2)}`;

const styles = StyleSheet.create({
    page: { padding: 28, fontFamily: "NotoSans", fontSize: 8, color: ink },
    heading: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
        marginBottom: 3,
    },
    original: {
        fontSize: 7,
        textAlign: "center",
        color: "#475569",
        marginBottom: 16,
    },
    logo: {
        width: 145,
        height: 40,
        objectFit: "contain",
        marginLeft: -28,
        marginBottom: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottomWidth: 1,
        borderBottomColor: ink,
        paddingBottom: 10,
        marginBottom: 12,
    },
    sellerName: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 3 },
    small: { fontSize: 8, lineHeight: 1.45, color: "#334155" },
    grid: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: border,
        marginBottom: 12,
    },
    cell: { width: "50%", padding: 9 },
    cellRight: { borderLeftWidth: 1, borderLeftColor: border },
    label: { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4 },
    meta: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: border,
        marginBottom: 12,
    },
    metaCell: {
        width: "33.33%",
        padding: 7,
        borderRightWidth: 1,
        borderRightColor: border,
    },
    metaLast: { borderRightWidth: 0 },
    metaLabel: { color: "#64748b", fontSize: 7, marginBottom: 2 },
    metaValue: { fontSize: 7, lineHeight: 1.2 },
    table: { borderWidth: 1, borderColor: border },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: border,
    },
    head: { backgroundColor: "#eef2f7" },
    th: {
        padding: 6,
        fontFamily: "Helvetica-Bold",
        borderRightWidth: 1,
        borderRightColor: border,
    },
    td: { padding: 6, borderRightWidth: 1, borderRightColor: border },
    last: { borderRightWidth: 0 },
    no: { width: "5%" },
    product: { width: "28%" },
    hsn: { width: "10%" },
    qty: { width: "5%" },
    taxable: { width: "16%" },
    // Keep the GST value on one line even in a dense invoice table.
    rate: { width: "8%", fontSize: 7, paddingLeft: 4, paddingRight: 4 },
    tax: { width: "9%" },
    total: { width: "19%" },
    totals: {
        marginTop: 12,
        marginLeft: "55%",
        width: "45%",
        borderWidth: 1,
        borderColor: border,
    },
    totalRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: border,
    },
    totalLabel: { width: "62%", padding: 6 },
    totalValue: {
        width: "38%",
        padding: 6,
        textAlign: "right",
        borderLeftWidth: 1,
        borderLeftColor: border,
    },
    final: { fontFamily: "Helvetica-Bold", backgroundColor: "#eef2f7" },
    notes: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: border,
        paddingTop: 8,
    },
    footer: {
        position: "absolute",
        left: 28,
        right: 28,
        bottom: 25,
        textAlign: "center",
        color: "#64748b",
        fontSize: 7,
    },
});

type InvoiceItem = {
    quantity?: number;
    product?: {
        title?: string;
        price?: number;
        compareAtPrice?: number | null;
        hsCode?: string | null;
    };
    variant?: {
        price?: number;
        compareAtPrice?: number | null;
        hsCode?: string | null;
    };
    gstRateBps?: number;
};
type InvoiceOrder = {
    id: string;
    receiptId?: string;
    paymentMethod?: string | null;
    paymentId?: string | null;
    paymentStatus?: string | null;
    date: string | Date;
    customerName: string;
    address: string;
    state?: string;
    amount: number;
    deliveryAmount?: number;
    items: InvoiceItem[];
    brand: {
        name: string;
        confidential?: {
            addressLine1?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            gstin?: string;
        };
    };
};

const formatGstRate = (basisPoints: number) => {
    const percentage = basisPoints / 100;
    return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(2)}%`;
};

export function InvoiceTemplate({ order }: { order: InvoiceOrder }) {
    const items = Array.isArray(order.items) ? order.items : [];
    const listTotal =
        items.reduce(
            (s, i) =>
                s +
                Number(i.variant?.price ?? i.product?.price ?? 0) *
                    Math.max(1, Number(i.quantity ?? 1)),
            0
        ) || order.amount;
    const intra = Boolean(
        order.brand.confidential?.state &&
            order.state &&
            order.brand.confidential.state.trim().toLowerCase() ===
                order.state.trim().toLowerCase()
    );
    const lines = items.map((item, index) => {
        const qty = Math.max(1, Number(item.quantity ?? 1));
        const listLineValue =
            Number(item.variant?.price ?? item.product?.price ?? 0) * qty;
        const gross =
            listLineValue > 0
                ? Math.round(order.amount * (listLineValue / listTotal))
                : Math.round(order.amount / Math.max(items.length, 1));
        const rate = Number(item.gstRateBps ?? 0);
        const taxable = rate
            ? Math.round((gross * 10000) / (10000 + rate))
            : gross;
        return {
            index,
            qty,
            gross,
            taxable,
            tax: gross - taxable,
            rate,
            title: item.product?.title ?? "Product",
            hsn: item.product?.hsCode ?? item.variant?.hsCode ?? "-",
        };
    });
    const taxable = lines.reduce((s, l) => s + l.taxable, 0);
    const tax = lines.reduce((s, l) => s + l.tax, 0);
    const cgst = intra ? Math.round(tax / 2) : 0;
    const sgst = intra ? tax - cgst : 0;
    const igst = intra ? 0 : tax;
    const shippingCharge = Math.max(0, Number(order.deliveryAmount ?? 0));
    const seller = order.brand.confidential;
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
                            style={styles.logo}
                        />
                        <Text style={styles.sellerName}>
                            {order.brand.name}
                        </Text>
                        <Text style={styles.small}>
                            {seller?.addressLine1 ?? "Seller address pending"}
                            {"\n"}
                            {seller?.city ?? ""} {seller?.state ?? ""}{" "}
                            {seller?.postalCode ?? ""}
                            {"\n"}GSTIN: {seller?.gstin ?? "Not provided"}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.heading}>TAX INVOICE</Text>
                        <Text style={styles.original}>
                            Original for Recipient
                        </Text>
                    </View>
                </View>
                <View style={styles.grid}>
                    <View style={styles.cell}>
                        <Text style={styles.label}>BILL TO</Text>
                        <Text style={styles.sellerName}>
                            {order.customerName}
                        </Text>
                        <Text style={styles.small}>{order.address}</Text>
                    </View>
                    <View style={[styles.cell, styles.cellRight]}>
                        <Text style={styles.label}>SHIP TO</Text>
                        <Text style={styles.sellerName}>
                            {order.customerName}
                        </Text>
                        <Text style={styles.small}>
                            {order.address}
                            {"\n"}Place of supply:{" "}
                            {order.state ?? "Not provided"}
                        </Text>
                    </View>
                </View>
                <View style={styles.meta}>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Order number</Text>
                        <Text style={styles.metaValue}>{order.id}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Invoice number</Text>
                        <Text style={styles.metaValue}>
                            {order.receiptId ?? order.id}
                        </Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Invoice date</Text>
                        <Text style={styles.metaValue}>
                            {new Date(order.date).toLocaleDateString("en-IN")}
                        </Text>
                    </View>
                </View>
                <View style={styles.meta}>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Payment mode</Text>
                        <Text style={styles.metaValue}>
                            {order.paymentMethod?.toUpperCase() === "COD"
                                ? "Cash on delivery"
                                : "Prepaid"}
                        </Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Transaction ID</Text>
                        <Text style={styles.metaValue}>
                            {order.paymentId ?? "Not available"}
                        </Text>
                    </View>
                    <View style={[styles.metaCell, styles.metaLast]}>
                        <Text style={styles.metaLabel}>GST treatment</Text>
                        <Text style={styles.metaValue}>
                            {intra
                                ? "CGST + SGST (Intra-state)"
                                : "IGST (Inter-state)"}
                        </Text>
                    </View>
                </View>
                <View style={styles.table}>
                    <View style={[styles.row, styles.head]}>
                        {[
                            ["#", styles.no],
                            ["Description", styles.product],
                            ["HSN", styles.hsn],
                            ["Qty", styles.qty],
                            ["Net price", styles.taxable],
                            ["GST", styles.rate],
                            ["Tax", styles.tax],
                            ["Total", styles.total],
                        ].map(([t, c], i) => (
                            <Text
                                key={String(t)}
                                style={[
                                    styles.th,
                                    c as object,
                                    i === 7 ? styles.last : {},
                                ]}
                            >
                                {t as string}
                            </Text>
                        ))}
                    </View>
                    {lines.map((l) => (
                        <View key={l.index} style={styles.row}>
                            <Text style={[styles.td, styles.no]}>
                                {l.index + 1}
                            </Text>
                            <Text style={[styles.td, styles.product]}>
                                {l.title}
                            </Text>
                            <Text style={[styles.td, styles.hsn]}>{l.hsn}</Text>
                            <Text style={[styles.td, styles.qty]}>{l.qty}</Text>
                            <Text style={[styles.td, styles.taxable]}>
                                {money(l.taxable)}
                            </Text>
                            <Text style={[styles.td, styles.rate]} wrap={false}>
                                {formatGstRate(l.rate)}
                            </Text>
                            <Text style={[styles.td, styles.tax]}>
                                {money(l.tax)}
                            </Text>
                            <Text
                                style={[styles.td, styles.total, styles.last]}
                            >
                                {money(l.gross)}
                            </Text>
                        </View>
                    ))}
                </View>
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Shipping charges</Text>
                        <Text style={styles.totalValue}>
                            {money(shippingCharge)}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                            Shipping discount (waived)
                        </Text>
                        <Text style={styles.totalValue}>
                            -{money(shippingCharge)}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Net price</Text>
                        <Text style={styles.totalValue}>{money(taxable)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                            {intra ? "CGST" : "IGST"}
                        </Text>
                        <Text style={styles.totalValue}>
                            {money(intra ? cgst : igst)}
                        </Text>
                    </View>
                    {intra ? (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>SGST</Text>
                            <Text style={styles.totalValue}>{money(sgst)}</Text>
                        </View>
                    ) : null}
                    <View style={[styles.totalRow, styles.final]}>
                        <Text style={styles.totalLabel}>Invoice total</Text>
                        <Text style={styles.totalValue}>
                            {money(order.amount)}
                        </Text>
                    </View>
                </View>
                <View style={styles.notes}>
                    <Text style={styles.label}>Declaration</Text>
                    <Text style={styles.small}>
                        This is a computer-generated tax invoice. Goods once
                        sold are subject to the applicable return and exchange
                        policy.
                    </Text>
                </View>
                <Text style={styles.footer}>
                    This is a system-generated invoice and does not require a
                    signature.
                </Text>
            </Page>
        </Document>
    );
}
