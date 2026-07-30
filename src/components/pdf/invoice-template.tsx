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

const ink = "#1e2a22";
const moss = "#3f5e42";
const line = "#d8d6c8";
const paperAlt = "#edefe6";
const renivetLogoUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL";

const money = (paise: number) =>
    `\u20B9${(Math.max(0, paise) / 100).toFixed(2)}`;
const moneyBare = (paise: number) => (Math.max(0, paise) / 100).toFixed(2);

const STATE_CODES: Record<string, string> = {
    "andaman and nicobar islands": "35",
    an: "35",
    "andhra pradesh": "37",
    "andhra pradesh ap": "37",
    "arunachal pradesh": "12",
    ar: "12",
    assam: "18",
    as: "18",
    bihar: "10",
    br: "10",
    chandigarh: "04",
    ch: "04",
    chhattisgarh: "22",
    cg: "22",
    ct: "22",
    "dadra and nagar haveli and daman and diu": "26",
    dd: "26",
    dn: "26",
    delhi: "07",
    dl: "07",
    goa: "30",
    ga: "30",
    gujarat: "24",
    gj: "24",
    haryana: "06",
    hr: "06",
    "himachal pradesh": "02",
    hp: "02",
    "jammu and kashmir": "01",
    jk: "01",
    jharkhand: "20",
    jh: "20",
    karnataka: "29",
    ka: "29",
    kerala: "32",
    kl: "32",
    ladakh: "38",
    la: "38",
    lakshadweep: "31",
    ld: "31",
    "madhya pradesh": "23",
    mp: "23",
    maharashtra: "27",
    mh: "27",
    manipur: "14",
    mn: "14",
    meghalaya: "17",
    ml: "17",
    mizoram: "15",
    mz: "15",
    nagaland: "13",
    nl: "13",
    odisha: "21",
    od: "21",
    or: "21",
    puducherry: "34",
    py: "34",
    punjab: "03",
    pb: "03",
    rajasthan: "08",
    rj: "08",
    sikkim: "11",
    sk: "11",
    "tamil nadu": "33",
    tn: "33",
    telangana: "36",
    tg: "36",
    ts: "36",
    tripura: "16",
    tr: "16",
    "uttar pradesh": "09",
    up: "09",
    uttarakhand: "05",
    uk: "05",
    ut: "05",
    "west bengal": "19",
    wb: "19",
};
const normalizeState = (state?: string | null) =>
    (state ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z]+/g, " ")
        .trim();
const stateCode = (state?: string | null) =>
    STATE_CODES[normalizeState(state)] ?? "-";
const sameState = (first?: string | null, second?: string | null) => {
    const firstCode = stateCode(first);
    const secondCode = stateCode(second);
    return firstCode !== "-" && secondCode !== "-"
        ? firstCode === secondCode
        : Boolean(
              first &&
                  second &&
                  normalizeState(first) === normalizeState(second)
          );
};
const formatGstRate = (basisPoints: number) => `${basisPoints / 100}%`;
const formatAddress = (parts: Array<string | null | undefined>) =>
    parts.filter((part): part is string => Boolean(part?.trim())).join(", ") ||
    "Not provided";

const styles = StyleSheet.create({
    page: { padding: 26, fontFamily: "NotoSans", fontSize: 7.4, color: ink },
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
    title: {
        fontFamily: "Helvetica-Bold",
        color: moss,
        fontSize: 15,
        textAlign: "right",
    },
    subtitle: {
        fontSize: 7,
        textAlign: "right",
        color: "#526254",
        marginTop: 2,
    },
    grid: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: line,
        marginBottom: 9,
    },
    cell: { width: "50%", padding: 7 },
    rightCell: { borderLeftWidth: 1, borderLeftColor: line },
    label: {
        fontFamily: "Helvetica-Bold",
        color: moss,
        fontSize: 7,
        marginBottom: 3,
    },
    name: { fontFamily: "Helvetica-Bold", fontSize: 8.5, marginBottom: 2 },
    text: { fontSize: 7.2, lineHeight: 1.35, color: "#334155" },
    meta: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: line,
        marginBottom: 9,
    },
    metaCell: {
        width: "33.333%",
        padding: 5,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    metaLast: { borderRightWidth: 0 },
    metaLabel: { fontSize: 6.3, color: "#66756a", marginBottom: 1.5 },
    metaValue: { fontSize: 7, lineHeight: 1.25 },
    table: { borderWidth: 1, borderColor: line },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: line,
    },
    head: { backgroundColor: paperAlt },
    th: {
        padding: 3.5,
        fontSize: 5.7,
        fontFamily: "Helvetica-Bold",
        color: moss,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    td: {
        padding: 3.5,
        fontSize: 6.1,
        borderRightWidth: 1,
        borderRightColor: line,
    },
    last: { borderRightWidth: 0 },
    no: { width: "3%" },
    description: { width: "25%" },
    hsn: { width: "8%" },
    qty: { width: "5%" },
    mrp: { width: "9%" },
    discount: { width: "10%" },
    taxable: { width: "11%" },
    rate: { width: "6%" },
    tax: { width: "13%" },
    total: { width: "10%" },
    right: { textAlign: "right" },
    summary: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    declaration: { width: "49%", paddingRight: 12 },
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
    final: { backgroundColor: paperAlt, fontFamily: "Helvetica-Bold" },
    signature: {
        marginTop: 20,
        fontSize: 7,
        color: "#526254",
        textAlign: "right",
    },
    signatureLogo: {
        width: 42,
        height: 24,
        objectFit: "contain",
        objectPosition: "right",
        alignSelf: "flex-end",
        marginTop: 14,
        marginBottom: -14,
    },
    footer: {
        position: "absolute",
        left: 26,
        right: 26,
        bottom: 18,
        textAlign: "center",
        fontSize: 6.5,
        color: "#66756a",
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
    invoiceNumber?: string | null;
    paymentMethod?: string | null;
    paymentId?: string | null;
    date: string | Date;
    customerName: string;
    address: string;
    state?: string;
    amount: number;
    deliveryAmount?: number;
    discountAmount?: number;
    couponCode?: string | null;
    items: InvoiceItem[];
    brand: {
        name: string;
        logoUrl?: string | null;
        confidential?: {
            addressLine1?: string;
            addressLine2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            gstin?: string;
            isSameAsWarehouseAddress?: boolean;
            warehouseAddressLine1?: string;
            warehouseAddressLine2?: string;
            warehouseCity?: string;
            warehouseState?: string;
            warehousePostalCode?: string;
        };
    };
};

export function InvoiceTemplate({ order }: { order: InvoiceOrder }) {
    const seller = order.brand.confidential;
    const shipFromState =
        seller?.isSameAsWarehouseAddress === false
            ? seller.warehouseState || seller.state
            : seller?.state;
    const intra = sameState(shipFromState, order.state);
    const sourceItems = Array.isArray(order.items) ? order.items : [];
    const sourceMerchandiseValue = sourceItems.reduce(
        (sum, item) =>
            sum +
            Math.max(
                0,
                Number(item.variant?.price ?? item.product?.price ?? 0)
            ) *
                Math.max(1, Number(item.quantity ?? 1)),
        0
    );
    // Product prices can change after checkout. Use the order's persisted paid
    // total as the tax-inclusive merchandise value shown on the invoice.
    const paidMerchandiseValue = Math.max(
        0,
        Number(order.amount ?? sourceMerchandiseValue)
    );
    let allocatedPaidValue = 0;
    const lines = sourceItems.map((item, index) => {
        const qty = Math.max(1, Number(item.quantity ?? 1));
        const saleUnit = Math.max(
            0,
            Number(item.variant?.price ?? item.product?.price ?? 0)
        );
        const mrpUnit = Math.max(
            saleUnit,
            Number(
                item.variant?.compareAtPrice ??
                    item.product?.compareAtPrice ??
                    saleUnit
            )
        );
        const mrp = mrpUnit * qty;
        const saleTotal = saleUnit * qty;
        const paidLineTotal =
            sourceMerchandiseValue > 0
                ? index === sourceItems.length - 1
                    ? Math.max(0, paidMerchandiseValue - allocatedPaidValue)
                    : Math.round(
                          (paidMerchandiseValue * saleTotal) /
                              sourceMerchandiseValue
                      )
                : saleTotal;
        allocatedPaidValue += paidLineTotal;
        const total = Math.min(mrp, paidLineTotal);
        const discount = Math.max(0, mrp - total);
        const hsn = item.product?.hsCode ?? item.variant?.hsCode ?? "-";
        const fallbackRate = Math.max(0, Number(item.gstRateBps ?? 0));
        const rate = /^(61|62|63)/.test(hsn)
            ? Math.round(total / qty) <= 250_000
                ? 500
                : 1800
            : fallbackRate;
        const taxable = rate
            ? Math.round((total * 10_000) / (10_000 + rate))
            : total;
        const tax = total - taxable;
        const cgst = intra ? Math.round(tax / 2) : 0;
        return {
            qty,
            mrp,
            discount,
            taxable,
            tax,
            cgst,
            sgst: intra ? tax - cgst : 0,
            total,
            rate,
            hsn,
            title: item.product?.title ?? "Product",
        };
    });
    const taxable = lines.reduce((sum, item) => sum + item.taxable, 0);
    const tax = lines.reduce((sum, item) => sum + item.tax, 0);
    const cgst = lines.reduce((sum, item) => sum + item.cgst, 0);
    const sgst = lines.reduce((sum, item) => sum + item.sgst, 0);
    const shippingCharge = Math.max(0, Number(order.deliveryAmount ?? 0));
    // Checkout currently treats delivery as waived; retain that behaviour until a shipping-discount field is persisted.
    const shippingDiscount = shippingCharge;
    const netShipping = Math.max(0, shippingCharge - shippingDiscount);
    // For mixed-rate orders, shipping follows the highest product GST rate.
    const shippingGstRate = Math.max(0, ...lines.map((item) => item.rate));
    const shippingGst = Math.round(netShipping * (shippingGstRate / 10_000));
    const shippingCgst = intra ? Math.round(shippingGst / 2) : 0;
    const shippingSgst = intra ? shippingGst - shippingCgst : 0;
    const invoiceTotal =
        lines.reduce((sum, item) => sum + item.total, 0) +
        netShipping +
        shippingGst;
    const shipFromAddress =
        seller?.isSameAsWarehouseAddress === false
            ? formatAddress([
                  seller.warehouseAddressLine1,
                  seller.warehouseAddressLine2,
                  seller.warehouseCity,
                  seller.warehouseState,
                  seller.warehousePostalCode,
              ])
            : formatAddress([
                  seller?.addressLine1,
                  seller?.addressLine2,
                  seller?.city,
                  seller?.state,
                  seller?.postalCode,
              ]);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image src={renivetLogoUrl} style={styles.logo} />
                    <View>
                        <Text style={styles.title}>TAX INVOICE</Text>
                        <Text style={styles.subtitle}>
                            Original for Recipient
                        </Text>
                    </View>
                </View>
                <View style={styles.grid}>
                    <View style={styles.cell}>
                        <Text style={styles.label}>BILL FROM</Text>
                        <Text style={styles.name}>{order.brand.name}</Text>
                        <Text style={styles.text}>
                            {formatAddress([
                                seller?.addressLine1,
                                seller?.addressLine2,
                                seller?.city,
                                seller?.state,
                                seller?.postalCode,
                            ])}
                            {"\n"}GSTIN: {seller?.gstin ?? "Not provided"}
                        </Text>
                    </View>
                    <View style={[styles.cell, styles.rightCell]}>
                        <Text style={styles.label}>SHIP FROM</Text>
                        <Text style={styles.name}>{order.brand.name}</Text>
                        <Text style={styles.text}>
                            {shipFromAddress}
                            {"\n"}State code: {stateCode(shipFromState)}
                        </Text>
                    </View>
                </View>
                <View style={styles.grid}>
                    <View style={styles.cell}>
                        <Text style={styles.label}>BILL TO</Text>
                        <Text style={styles.name}>{order.customerName}</Text>
                        <Text style={styles.text}>{order.address}</Text>
                    </View>
                    <View style={[styles.cell, styles.rightCell]}>
                        <Text style={styles.label}>SHIP TO</Text>
                        <Text style={styles.name}>{order.customerName}</Text>
                        <Text style={styles.text}>
                            {order.address}
                            {"\n"}Place of supply:{" "}
                            {order.state ?? "Not provided"} (
                            {stateCode(order.state)})
                        </Text>
                    </View>
                </View>
                <View style={styles.meta}>
                    {[
                        ["Order number", order.id],
                        [
                            "Invoice number",
                            order.invoiceNumber ?? order.receiptId ?? order.id,
                        ],
                        [
                            "Invoice date",
                            new Date(order.date).toLocaleDateString("en-IN"),
                        ],
                    ].map(([label, value], index) => (
                        <View
                            key={label}
                            style={[
                                styles.metaCell,
                                index === 2 ? styles.metaLast : {},
                            ]}
                        >
                            <Text style={styles.metaLabel}>{label}</Text>
                            <Text style={styles.metaValue}>{value}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.meta}>
                    {[
                        [
                            "Payment mode",
                            order.paymentMethod?.toUpperCase() === "COD"
                                ? "Cash on delivery"
                                : "Prepaid",
                        ],
                        ["Transaction ID", order.paymentId ?? "Not available"],
                        [
                            "GST treatment",
                            intra
                                ? "CGST + SGST (Intra-state)"
                                : "IGST (Inter-state)",
                        ],
                    ].map(([label, value], index) => (
                        <View
                            key={label}
                            style={[
                                styles.metaCell,
                                index === 2 ? styles.metaLast : {},
                            ]}
                        >
                            <Text style={styles.metaLabel}>{label}</Text>
                            <Text style={styles.metaValue}>{value}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.table}>
                    <View style={[styles.row, styles.head]}>
                        {[
                            ["#", styles.no],
                            ["Description", styles.description],
                            ["HSN", styles.hsn],
                            ["Qty", styles.qty],
                            ["MRP\nINR", styles.mrp],
                            ["Discount\nINR", styles.discount],
                            ["Taxable value\nINR", styles.taxable],
                            ["GST\nrate", styles.rate],
                            [
                                intra ? "CGST + SGST\nINR" : "IGST\nINR",
                                styles.tax,
                            ],
                            ["Total\nINR", styles.total],
                        ].map(([text, width], index) => (
                            <Text
                                key={text as string}
                                style={[
                                    styles.th,
                                    width as object,
                                    index === 9 ? styles.last : {},
                                    index > 2 ? styles.right : {},
                                ]}
                            >
                                {text as string}
                            </Text>
                        ))}
                    </View>
                    {lines.map((item, index) => (
                        <View key={`${item.hsn}-${index}`} style={styles.row}>
                            <Text style={[styles.td, styles.no]}>
                                {index + 1}
                            </Text>
                            <Text style={[styles.td, styles.description]}>
                                {item.title}
                            </Text>
                            <Text style={[styles.td, styles.hsn]}>
                                {item.hsn}
                            </Text>
                            <Text style={[styles.td, styles.qty, styles.right]}>
                                {item.qty}
                            </Text>
                            <Text style={[styles.td, styles.mrp, styles.right]}>
                                {moneyBare(item.mrp)}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    styles.discount,
                                    styles.right,
                                ]}
                            >
                                {moneyBare(item.discount)}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    styles.taxable,
                                    styles.right,
                                ]}
                            >
                                {moneyBare(item.taxable)}
                            </Text>
                            <Text
                                style={[styles.td, styles.rate, styles.right]}
                            >
                                {formatGstRate(item.rate)}
                            </Text>
                            <Text style={[styles.td, styles.tax, styles.right]}>
                                {intra
                                    ? `CGST ${moneyBare(item.cgst)}\nSGST ${moneyBare(item.sgst)}`
                                    : moneyBare(item.tax)}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    styles.total,
                                    styles.last,
                                    styles.right,
                                ]}
                            >
                                {moneyBare(item.total)}
                            </Text>
                        </View>
                    ))}
                </View>
                <View style={styles.summary}>
                    <View style={styles.declaration}>
                        <Text style={styles.label}>RCM DECLARATION</Text>
                        <Text style={styles.text}>
                            GST under RCM is not applicable unless otherwise
                            specified.
                        </Text>
                        <Text style={[styles.label, { marginTop: 11 }]}>
                            DECLARATION
                        </Text>
                        <Text style={styles.text}>
                            This is a computer-generated tax invoice. Goods once
                            sold are subject to the applicable return and
                            exchange policy.
                        </Text>
                        {order.brand.logoUrl ? (
                            <Image
                                src={order.brand.logoUrl}
                                style={styles.signatureLogo}
                            />
                        ) : null}
                        <Text style={styles.signature}>
                            For {order.brand.name}
                            {"\n"}Authorised Signatory
                        </Text>
                    </View>
                    <View style={styles.totals}>
                        {[
                            ["Taxable value", money(taxable)],
                            ["Shipping charges", money(shippingCharge)],
                            [
                                "Shipping discount",
                                `-${money(shippingDiscount)}`,
                            ],
                            ["Net shipping", money(netShipping)],
                            [
                                `Shipping GST (${formatGstRate(shippingGstRate)})`,
                                money(shippingGst),
                            ],
                            [
                                intra
                                    ? "CGST (incl. shipping)"
                                    : "IGST (incl. shipping)",
                                money(
                                    intra
                                        ? cgst + shippingCgst
                                        : tax + shippingGst
                                ),
                            ],
                            ...(intra
                                ? [
                                      [
                                          "SGST (incl. shipping)",
                                          money(sgst + shippingSgst),
                                      ],
                                  ]
                                : []),
                            ["Invoice total", money(invoiceTotal)],
                        ].map(([label, value], index, rows) => (
                            <View
                                key={label}
                                style={[
                                    styles.totalRow,
                                    index === rows.length - 1
                                        ? styles.final
                                        : {},
                                ]}
                            >
                                <Text style={styles.totalLabel}>{label}</Text>
                                <Text style={styles.totalValue}>{value}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <Text style={styles.footer}>
                    This is a system-generated invoice and does not require a
                    signature.
                </Text>
            </Page>
        </Document>
    );
}
