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
        objectPosition: "left",
        // Start at the same left edge as the seller name beneath it.
        marginLeft: 0,
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
        padding: 4,
        fontSize: 6,
        fontFamily: "Helvetica-Bold",
        borderRightWidth: 1,
        borderRightColor: border,
    },
    td: {
        padding: 4,
        fontSize: 6,
        borderRightWidth: 1,
        borderRightColor: border,
    },
    last: { borderRightWidth: 0 },
    no: { width: "3%" },
    product: { width: "15%" },
    hsn: { width: "7%" },
    qty: { width: "4%" },
    gross: { width: "8%" },
    productDiscount: { width: "8%" },
    couponDiscount: { width: "8%" },
    totalDiscount: { width: "10%" },
    discountPercent: { width: "9%", fontSize: 6 },
    taxable: { width: "8%" },
    rate: { width: "5%", fontSize: 6, paddingLeft: 3, paddingRight: 3 },
    tax: { width: "6%" },
    total: { width: "8%" },
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
    /** Coupon discount saved against this order, in paise. */
    discountAmount?: number;
    couponCode?: string | null;
    items: InvoiceItem[];
    brand: {
        name: string;
        logoUrl?: string | null;
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
    const intra = Boolean(
        order.brand.confidential?.state &&
            order.state &&
            order.brand.confidential.state.trim().toLowerCase() ===
                order.state.trim().toLowerCase()
    );
    const lines = items.map((item, index) => {
        const qty = Math.max(1, Number(item.quantity ?? 1));
        const unitPrice = Number(
            item.variant?.price ?? item.product?.price ?? 0
        );
        const compareAtPrice = Number(
            item.variant?.compareAtPrice ?? item.product?.compareAtPrice ?? 0
        );
        const originalUnitPrice =
            compareAtPrice > unitPrice ? compareAtPrice : unitPrice;
        const gross = originalUnitPrice * qty;
        const productDiscount = Math.max(0, gross - unitPrice * qty);
        const rate = Number(item.gstRateBps ?? 0);
        const lineTotal = unitPrice * qty;
        const taxable = rate
            ? Math.round((lineTotal * 10000) / (10000 + rate))
            : lineTotal;
        return {
            index,
            qty,
            gross,
            productDiscount,
            taxable,
            tax: lineTotal - taxable,
            lineTotal,
            rate,
            title: item.product?.title ?? "Product",
            hsn: item.product?.hsCode ?? item.variant?.hsCode ?? "-",
        };
    });
    const shippingCharge = Math.max(0, Number(order.deliveryAmount ?? 0));
    // `discount_amount` is stored in paise and is the coupon discount source.
    // `money()` converts it to rupees wherever it is displayed.
    const couponDiscount = Math.max(0, Number(order.discountAmount ?? 0));
    const saleTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    let allocatedCouponDiscount = 0;
    const displayLines = lines.map((line, index) => {
        const lineCouponDiscount =
            index === lines.length - 1
                ? Math.max(0, couponDiscount - allocatedCouponDiscount)
                : Math.round(
                      couponDiscount * (line.lineTotal / Math.max(saleTotal, 1))
                  );
        allocatedCouponDiscount += lineCouponDiscount;
        const lineTotal = Math.max(0, line.lineTotal - lineCouponDiscount);
        const taxable = line.rate
            ? Math.round((lineTotal * 10000) / (10000 + line.rate))
            : lineTotal;
        const lineTotalDiscount = line.productDiscount + lineCouponDiscount;

        return {
            ...line,
            couponDiscount: lineCouponDiscount,
            totalDiscount: lineTotalDiscount,
            discountPercentage: line.gross
                ? (lineTotalDiscount / line.gross) * 100
                : 0,
            taxable,
            tax: lineTotal - taxable,
            total: lineTotal,
        };
    });
    const taxable = displayLines.reduce((sum, line) => sum + line.taxable, 0);
    const tax = displayLines.reduce((sum, line) => sum + line.tax, 0);
    const cgst = intra ? Math.round(tax / 2) : 0;
    const sgst = intra ? tax - cgst : 0;
    const igst = intra ? 0 : tax;
    const seller = order.brand.confidential;
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Image
                            src={
                                order.brand.logoUrl ||
                                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
                            }
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
                            ["Gross", styles.gross],
                            ["Product\ndiscount", styles.productDiscount],
                            ["Discount\u00A0%", styles.discountPercent],
                            ["Coupon\ndiscount", styles.couponDiscount],
                            ["Total discount", styles.totalDiscount],
                            ["Net price", styles.taxable],
                            ["GST", styles.rate],
                            ["Tax", styles.tax],
                            ["Total", styles.total],
                        ].map(([t, c], i) => (
                            <Text
                                key={String(t)}
                                wrap={i !== 6}
                                style={[
                                    styles.th,
                                    c as object,
                                    i === 12 ? styles.last : {},
                                ]}
                            >
                                {t as string}
                            </Text>
                        ))}
                    </View>
                    {displayLines.map((l) => (
                        <View key={l.index} style={styles.row}>
                            <Text style={[styles.td, styles.no]}>
                                {l.index + 1}
                            </Text>
                            <Text style={[styles.td, styles.product]}>
                                {l.title}
                            </Text>
                            <Text style={[styles.td, styles.hsn]}>{l.hsn}</Text>
                            <Text style={[styles.td, styles.qty]}>{l.qty}</Text>
                            <Text style={[styles.td, styles.gross]}>
                                {money(l.gross)}
                            </Text>
                            <Text style={[styles.td, styles.productDiscount]}>
                                -{money(l.productDiscount)}
                            </Text>
                            <Text style={[styles.td, styles.discountPercent]}>
                                {l.discountPercentage.toFixed(2)}%
                            </Text>
                            <Text style={[styles.td, styles.couponDiscount]}>
                                {l.couponDiscount
                                    ? `-${money(l.couponDiscount)}`
                                    : "-"}
                            </Text>
                            <Text style={[styles.td, styles.totalDiscount]}>
                                -{money(l.totalDiscount)}
                            </Text>
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
                                {money(l.total)}
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
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                            Coupon discount amount
                            {order.couponCode ? ` (${order.couponCode})` : ""}
                        </Text>
                        <Text style={styles.totalValue}>
                            {couponDiscount ? `-${money(couponDiscount)}` : "-"}
                        </Text>
                    </View>
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
