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
const STATE_NAMES_BY_CODE: Record<string, string> = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "26": "Dadra and Nagar Haveli and Daman and Diu",
    "27": "Maharashtra",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
};
const stateName = (state?: string | null) => {
    const code = stateCode(state);
    return STATE_NAMES_BY_CODE[code] ?? state?.trim() ?? "Not provided";
};
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
    metaHalf: { width: "50%" },
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
    signaturePanel: { width: "49%", paddingRight: 12 },
    signatureBody: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    signatureIdentity: { width: "62%" },
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
        marginTop: 4,
        fontSize: 7,
        color: "#526254",
        textAlign: "left",
    },
    signatureLogo: {
        width: 54,
        height: 32,
        objectFit: "contain",
        objectPosition: "left",
        alignSelf: "flex-start",
        marginTop: 10,
        marginBottom: 3,
    },
    qrBlock: {
        width: "32%",
        alignItems: "center",
        marginTop: 6,
    },
    qrCode: { width: 58, height: 58 },
    registeredAddress: {
        marginTop: 12,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: line,
        fontSize: 6.5,
        lineHeight: 1.3,
        color: "#334155",
    },
    legalNotes: {
        marginTop: 10,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: line,
        fontSize: 6.5,
        lineHeight: 1.45,
        color: "#526254",
    },
    footer: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: line,
        paddingTop: 7,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerText: {
        width: "82%",
        fontSize: 6.5,
        color: "#66756a",
    },
    footerLogo: {
        width: 62,
        height: 18,
        objectFit: "contain",
        objectPosition: "right",
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
    qrCodeDataUrl?: string;
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
            bankAccountHolderName?: string;
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
                        <Text style={styles.label}>BILL TO</Text>
                        <Text style={styles.name}>{order.customerName}</Text>
                        <Text style={styles.text}>{order.address}</Text>
                    </View>
                    <View style={[styles.cell, styles.rightCell]}>
                        <Text style={styles.label}>SHIP TO</Text>
                        <Text style={styles.name}>{order.customerName}</Text>
                        <Text style={styles.text}>{order.address}</Text>
                    </View>
                </View>
                <View style={styles.grid}>
                    <View style={styles.cell}>
                        <Text style={styles.label}>SHIP FROM</Text>
                        <Text style={styles.name}>{order.brand.name}</Text>
                        <Text style={styles.text}>
                            {shipFromAddress}
                            {"\n"}State code: {stateCode(shipFromState)}
                        </Text>
                    </View>
                    <View style={[styles.cell, styles.rightCell]}>
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
                <View style={styles.meta}>
                    {[
                        ["Place of supply", stateName(order.state)],
                        ["Nature of supply", "Goods"],
                    ].map(([label, value], index) => (
                        <View
                            key={label}
                            style={[
                                styles.metaCell,
                                styles.metaHalf,
                                index === 1 ? styles.metaLast : {},
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
                    <View style={styles.signaturePanel}>
                        <Text style={styles.name}>
                            {seller?.bankAccountHolderName ?? order.brand.name}
                        </Text>
                        <View style={styles.signatureBody}>
                            <View style={styles.signatureIdentity}>
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
                            {order.qrCodeDataUrl ? (
                                <View style={styles.qrBlock}>
                                    <Image
                                        src={order.qrCodeDataUrl}
                                        style={styles.qrCode}
                                    />
                                </View>
                            ) : null}
                        </View>
                        <Text style={styles.registeredAddress}>
                            Registered address:{" "}
                            {seller?.bankAccountHolderName ?? order.brand.name},{" "}
                            {formatAddress([
                                seller?.addressLine1,
                                seller?.addressLine2,
                                seller?.city,
                                seller?.state,
                                seller?.postalCode,
                            ])}
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
                <View style={styles.legalNotes}>
                    <Text>
                        * GST under RCM is not applicable unless otherwise
                        specified.
                    </Text>
                    <Text>* This is a computer-generated tax invoice.</Text>
                    <Text>
                        * Goods once sold are subject to the applicable return
                        and exchange policy.
                    </Text>
                </View>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        If you have any questions, please use the Contact Us
                        section in the Renivet app or visit
                        www.renivet.com/contact.
                    </Text>
                    <Image src={renivetLogoUrl} style={styles.footerLogo} />
                </View>
            </Page>
        </Document>
    );
}
