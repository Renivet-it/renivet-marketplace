import {
    Document,
    Font,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";
import React from "react";

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

const belowTwenty = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
];
const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
];
const numberToIndianWords = (value: number): string => {
    const whole = Math.floor(Math.max(0, value));
    if (whole < 20) return belowTwenty[whole];
    if (whole < 100)
        return `${tens[Math.floor(whole / 10)]}${whole % 10 ? `-${belowTwenty[whole % 10]}` : ""}`;
    if (whole < 1_000)
        return `${belowTwenty[Math.floor(whole / 100)]} Hundred${whole % 100 ? ` and ${numberToIndianWords(whole % 100)}` : ""}`;
    const groups: Array<[number, string]> = [
        [10_000_000, "Crore"],
        [100_000, "Lakh"],
        [1_000, "Thousand"],
    ];
    for (const [divisor, label] of groups) {
        if (whole >= divisor) {
            const quotient = Math.floor(whole / divisor);
            const remainder = whole % divisor;
            return `${numberToIndianWords(quotient)} ${label}${remainder ? ` ${numberToIndianWords(remainder)}` : ""}`;
        }
    }
    return "";
};
const amountInWords = (paise: number) => {
    const rupees = Math.floor(Math.max(0, paise) / 100);
    const remainingPaise = Math.max(0, paise) % 100;
    return `Rupees ${numberToIndianWords(rupees) || "Zero"}${remainingPaise ? ` and ${numberToIndianWords(remainingPaise)} Paise` : ""} Only`;
};

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
    page: {
        paddingTop: 26,
        paddingHorizontal: 26,
        paddingBottom: 16,
        fontFamily: "NotoSans",
        fontSize: 7.4,
        color: ink,
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
    description: { width: "19%" },
    hsn: { width: "7%" },
    qty: { width: "5%" },
    mrp: { width: "8%" },
    discount: { width: "8%" },
    taxable: { width: "10%" },
    rate: { width: "6%" },
    tax: { width: "7%" },
    total: { width: "13%" },
    corporateNo: { width: "3%" },
    corporateDescription: { width: "23%" },
    corporateHsn: { width: "7%" },
    corporateQty: { width: "7%" },
    corporateMrp: { width: "10%" },
    corporateDiscount: { width: "10%" },
    corporateTaxable: { width: "13%" },
    corporateRate: { width: "7%" },
    corporateTax: { width: "9%" },
    corporateTotal: { width: "11%" },
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
    // Helvetica does not reliably contain the Indian Rupee glyph in PDF output.
    final: {
        backgroundColor: paperAlt,
        fontFamily: "NotoSans",
        fontWeight: 700,
    },
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
    qrLabel: { fontSize: 5.5, color: "#66756a", marginTop: 2 },
    registeredAddress: {
        marginTop: 12,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: line,
        fontSize: 6.5,
        lineHeight: 1.3,
        color: "#334155",
    },
    corporateDetails: {
        marginTop: 9,
        paddingTop: 7,
        borderTopWidth: 1,
        borderTopColor: line,
        flexDirection: "row",
    },
    corporateColumn: { width: "50%", paddingRight: 12 },
    corporateColumnRight: {
        paddingRight: 0,
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: line,
    },
    bankRow: { flexDirection: "row", paddingVertical: 1.2 },
    bankLabel: { width: "35%", color: "#66756a" },
    bankValue: { width: "65%", color: "#334155" },
    legalNotes: {
        marginTop: 7,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: line,
        fontSize: 6.5,
        lineHeight: 1.45,
        color: "#526254",
    },
    footer: {
        position: "absolute",
        bottom: 8,
        left: 26,
        right: 26,
        borderTopWidth: 1,
        borderTopColor: line,
        paddingTop: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerText: {
        width: "82%",
        fontSize: 6.2,
        color: "#66756a",
    },
    footerLogo: {
        width: 62,
        height: 14,
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
        sku?: string | null;
        nativeSku?: string | null;
    };
    variant?: {
        price?: number;
        compareAtPrice?: number | null;
        hsCode?: string | null;
        sku?: string | null;
        nativeSku?: string | null;
    };
    gstRateBps?: number;
    mrpPaise?: number;
    discountPaise?: number;
    taxableValuePaise?: number;
    cgstPaise?: number;
    sgstPaise?: number;
    igstPaise?: number;
    totalPaise?: number;
};
export type InvoiceOrder = {
    id: string;
    receiptId?: string;
    invoiceNumber?: string | null;
    paymentMethod?: string | null;
    paymentId?: string | null;
    date: string | Date;
    orderDate?: string | Date | null;
    customerName: string;
    address: string;
    state?: string;
    amount: number;
    deliveryAmount?: number;
    discountAmount?: number;
    couponCode?: string | null;
    customerGstin?: string | null;
    copyType?: "original" | "duplicate" | "triplicate";
    qrCodeDataUrl?: string;
    poReference?: string | null;
    poDate?: string | Date | null;
    receiptVoucherNumber?: string | null;
    balanceDueDate?: string | Date | null;
    eWayBillNumber?: string | null;
    displayUnitPricing?: boolean;
    /** Corporate orders use one combined GST value, not CGST/SGST/IGST. */
    taxDisplay?: "standard" | "single_gst";
    declarationCompanyName?: string;
    sellerOfRecord?: boolean;
    paymentSummary?: {
        paymentStatus: "unpaid" | "partially_paid" | "paid_in_full";
        paymentPercentBps: number;
        paidAmountPaise: number;
        fullPaymentAmountPaise: number;
        balanceDuePaise: number;
    };
    taxSummary?: {
        taxableValuePaise: number;
        cgstPaise: number;
        sgstPaise: number;
        igstPaise: number;
        totalAmountPaise: number;
    };
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
            cin?: string;
            email?: string;
            phone?: string;
            bankName?: string;
            bankAccountNumber?: string;
            bankAccountType?: string;
            bankIfscCode?: string;
            bankBranch?: string;
            authorizedSignatoryName?: string;
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
    const usesSingleGst = order.taxDisplay === "single_gst";
    const seller = order.brand.confidential;
    const shipFromState =
        seller?.isSameAsWarehouseAddress === false
            ? seller.warehouseState || seller.state
            : seller?.state;
    const intra = order.taxSummary
        ? order.taxSummary.igstPaise === 0
        : sameState(shipFromState, order.state);
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
        const total = Math.max(
            0,
            Number(item.totalPaise ?? Math.min(mrp, paidLineTotal))
        );
        const exactMrp = Math.max(0, Number(item.mrpPaise ?? mrp));
        const discount = Math.max(
            0,
            Number(item.discountPaise ?? exactMrp - total)
        );
        const hsn = item.product?.hsCode ?? item.variant?.hsCode ?? "-";
        const sku =
            item.variant?.sku ??
            item.variant?.nativeSku ??
            item.product?.sku ??
            item.product?.nativeSku ??
            "";
        const fallbackRate = Math.max(0, Number(item.gstRateBps ?? 0));
        const rate = /^(61|62|63)/.test(hsn)
            ? Math.round(total / qty) <= 250_000
                ? 500
                : 1800
            : fallbackRate;
        const taxable = Math.max(
            0,
            Number(
                item.taxableValuePaise ??
                    (rate
                        ? Math.round((total * 10_000) / (10_000 + rate))
                        : total)
            )
        );
        const tax = total - taxable;
        const cgst = Math.max(
            0,
            Number(item.cgstPaise ?? (intra ? Math.round(tax / 2) : 0))
        );
        const sgst = Math.max(
            0,
            Number(item.sgstPaise ?? (intra ? tax - cgst : 0))
        );
        const igst = Math.max(0, Number(item.igstPaise ?? (intra ? 0 : tax)));
        return {
            qty,
            mrp: exactMrp,
            discount,
            taxable,
            tax,
            cgst,
            sgst,
            igst,
            total,
            rate,
            hsn,
            title: item.product?.title ?? "Product",
            sku,
            unit: "Pc",
        };
    });
    const taxable =
        order.taxSummary?.taxableValuePaise ??
        lines.reduce((sum, item) => sum + item.taxable, 0);
    const cgst =
        order.taxSummary?.cgstPaise ??
        lines.reduce((sum, item) => sum + item.cgst, 0);
    const sgst =
        order.taxSummary?.sgstPaise ??
        lines.reduce((sum, item) => sum + item.sgst, 0);
    const igst =
        order.taxSummary?.igstPaise ??
        lines.reduce((sum, item) => sum + item.igst, 0);
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
        order.taxSummary?.totalAmountPaise ??
        lines.reduce((sum, item) => sum + item.total, 0) +
            netShipping +
            shippingGst;
    const totalGst = Math.max(0, invoiceTotal - taxable);
    const lineColumns = usesSingleGst
        ? [
              ["#", styles.corporateNo],
              ["Description", styles.corporateDescription],
              ["HSN", styles.corporateHsn],
              ["Qty / Unit", styles.corporateQty],
              [
                  order.displayUnitPricing ? "Rate\nINR" : "MRP\nINR",
                  styles.corporateMrp,
              ],
              ["Discount\nINR", styles.corporateDiscount],
              ["Taxable value\nINR", styles.corporateTaxable],
              ["GST\nrate", styles.corporateRate],
              ["GST\nINR", styles.corporateTax],
              ["Total\nINR", styles.corporateTotal],
          ]
        : [
              ["#", styles.no],
              ["Description", styles.description],
              ["HSN", styles.hsn],
              ["Qty / Unit", styles.qty],
              [
                  order.displayUnitPricing ? "Rate\nINR" : "MRP\nINR",
                  styles.mrp,
              ],
              ["Discount\nINR", styles.discount],
              ["Taxable value\nINR", styles.taxable],
              ["GST\nrate", styles.rate],
              ["CGST\nINR", styles.tax],
              ["SGST\nINR", styles.tax],
              ["IGST\nINR", styles.tax],
              ["Total\nINR", styles.total],
          ];
    const totalsRows = usesSingleGst
        ? [
              ["Taxable value", money(taxable)],
              [
                  `GST (${formatGstRate(Math.max(0, ...lines.map((item) => item.rate)))})`,
                  money(totalGst),
              ],
              ["Invoice total", money(invoiceTotal)],
              ...(order.paymentSummary
                  ? [
                        [
                            order.receiptVoucherNumber
                                ? `Less: advance (${order.receiptVoucherNumber})`
                                : `Amount paid (${order.paymentSummary.paymentPercentBps / 100}%)`,
                            money(order.paymentSummary.paidAmountPaise),
                        ],
                        [
                            "Balance due",
                            money(order.paymentSummary.balanceDuePaise),
                        ],
                        ...(order.balanceDueDate &&
                        order.paymentSummary.balanceDuePaise > 0
                            ? [
                                  [
                                      "Due date",
                                      new Date(
                                          order.balanceDueDate
                                      ).toLocaleDateString("en-IN"),
                                  ],
                              ]
                            : []),
                    ]
                  : []),
          ]
        : [
              ["Taxable value", money(taxable)],
              ["Shipping charges", money(shippingCharge)],
              ["Shipping discount", `-${money(shippingDiscount)}`],
              ["Net shipping", money(netShipping)],
              [
                  `Shipping GST (${formatGstRate(shippingGstRate)})`,
                  money(shippingGst),
              ],
              [
                  intra ? "CGST (incl. shipping)" : "IGST (incl. shipping)",
                  money(intra ? cgst + shippingCgst : igst + shippingGst),
              ],
              ...(intra
                  ? [["SGST (incl. shipping)", money(sgst + shippingSgst)]]
                  : []),
              ["Invoice total", money(invoiceTotal)],
              ...(order.paymentSummary
                  ? [
                        [
                            order.receiptVoucherNumber
                                ? `Less: advance (${order.receiptVoucherNumber})`
                                : `Amount paid (${order.paymentSummary.paymentPercentBps / 100}%)`,
                            money(order.paymentSummary.paidAmountPaise),
                        ],
                        [
                            "Balance due",
                            money(order.paymentSummary.balanceDuePaise),
                        ],
                        ...(order.balanceDueDate &&
                        order.paymentSummary.balanceDuePaise > 0
                            ? [
                                  [
                                      "Due date",
                                      new Date(
                                          order.balanceDueDate
                                      ).toLocaleDateString("en-IN"),
                                  ],
                              ]
                            : []),
                    ]
                  : []),
          ];
    const copyLabels = {
        original: "Original for Recipient",
        duplicate: "Duplicate for Supplier",
        triplicate: "Triplicate for Transporter",
    } as const;
    const customerType = order.customerGstin?.trim()
        ? "Registered"
        : "Unregistered";
    const supplyMeta: Array<[string, string]> = usesSingleGst
        ? [
              ["Nature of supply", "Goods"],
              ["Reverse Charge", "No"],
              ["Customer Type", customerType],
          ]
        : [
              [
                  "Place of supply",
                  `${stateName(order.state)} (${stateCode(order.state)})`,
              ],
              ["Nature of supply", "Goods"],
              ["Reverse Charge", "No"],
              ["Customer Type", customerType],
              ...(order.eWayBillNumber
                  ? [["E-way bill", order.eWayBillNumber] as [string, string]]
                  : []),
          ];
    const paymentStatusLabel = order.paymentSummary
        ? {
              unpaid: "Payment pending",
              partially_paid: "Partially paid",
              paid_in_full: "Paid in full",
          }[order.paymentSummary.paymentStatus]
        : null;
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
                            {copyLabels[order.copyType ?? "original"]}
                            {paymentStatusLabel
                                ? ` | ${paymentStatusLabel}`
                                : ""}
                        </Text>
                    </View>
                </View>
                <View style={styles.grid}>
                    <View style={styles.cell}>
                        <Text style={styles.label}>BILL TO</Text>
                        <Text style={styles.name}>{order.customerName}</Text>
                        <Text style={styles.text}>{order.address}</Text>
                        {customerType === "Registered" ? (
                            <Text style={styles.text}>
                                GSTIN: {order.customerGstin}
                            </Text>
                        ) : null}
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
                            {seller?.cin ? `\nCIN: ${seller.cin}` : ""}
                            {seller?.email ? `\nEmail: ${seller.email}` : ""}
                            {seller?.phone ? ` | Phone: ${seller.phone}` : ""}
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
                        ...(order.poReference
                            ? [["PO reference", order.poReference]]
                            : []),
                        [
                            "Invoice date",
                            new Date(order.date).toLocaleDateString("en-IN"),
                        ],
                        [
                            "Order date",
                            new Date(
                                order.orderDate ?? order.date
                            ).toLocaleDateString("en-IN"),
                        ],
                    ].map(([label, value], index) => (
                        <View
                            key={label}
                            style={[
                                styles.metaCell,
                                index === (order.poReference ? 4 : 3)
                                    ? styles.metaLast
                                    : {},
                                {
                                    width: order.poReference ? "20%" : "25%",
                                },
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
                            "Nature of Transaction",
                            intra ? "Intra-State" : "Inter-State",
                        ],
                        ...(order.paymentSummary
                            ? [
                                  [
                                      "Payment status",
                                      paymentStatusLabel ?? "Payment pending",
                                  ],
                                  [
                                      order.receiptVoucherNumber
                                          ? `Advance received (${order.receiptVoucherNumber})`
                                          : `Amount paid (${order.paymentSummary.paymentPercentBps / 100}%)`,
                                      money(
                                          order.paymentSummary.paidAmountPaise
                                      ),
                                  ],
                                  [
                                      "Balance due",
                                      money(
                                          order.paymentSummary.balanceDuePaise
                                      ),
                                  ],
                              ]
                            : []),
                    ].map(([label, value], index) => (
                        <View
                            key={label}
                            style={[
                                styles.metaCell,
                                index === (order.paymentSummary ? 5 : 2)
                                    ? styles.metaLast
                                    : {},
                                {
                                    width: order.paymentSummary
                                        ? "16.666%"
                                        : "33.333%",
                                },
                            ]}
                        >
                            <Text style={styles.metaLabel}>{label}</Text>
                            <Text style={styles.metaValue}>{value}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.meta}>
                    {supplyMeta.map(([label, value], index) => (
                        <View
                            key={label}
                            style={[
                                styles.metaCell,
                                index === supplyMeta.length - 1
                                    ? styles.metaLast
                                    : {},
                                {
                                    width: `${100 / supplyMeta.length}%`,
                                },
                            ]}
                        >
                            <Text style={styles.metaLabel}>{label}</Text>
                            <Text style={styles.metaValue}>{value}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.table}>
                    <View style={[styles.row, styles.head]}>
                        {lineColumns.map(([text, width], index) => (
                            <Text
                                key={text as string}
                                style={[
                                    styles.th,
                                    width as any,
                                    index === lineColumns.length - 1
                                        ? styles.last
                                        : {},
                                    index > 2 ? styles.right : {},
                                ]}
                            >
                                {text as string}
                            </Text>
                        ))}
                    </View>
                    {lines.map((item, index) => (
                        <View key={`${item.hsn}-${index}`} style={styles.row}>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateNo
                                        : styles.no,
                                ]}
                            >
                                {index + 1}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateDescription
                                        : styles.description,
                                ]}
                            >
                                {item.sku ? `${item.sku} | ` : ""}
                                {item.title}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateHsn
                                        : styles.hsn,
                                ]}
                            >
                                {item.hsn}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateQty
                                        : styles.qty,
                                    styles.right,
                                ]}
                            >
                                {item.qty} {item.unit}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateMrp
                                        : styles.mrp,
                                    styles.right,
                                ]}
                            >
                                {moneyBare(
                                    order.displayUnitPricing
                                        ? Math.round(item.mrp / item.qty)
                                        : item.mrp
                                )}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateDiscount
                                        : styles.discount,
                                    styles.right,
                                ]}
                            >
                                {moneyBare(
                                    order.displayUnitPricing
                                        ? Math.round(item.discount / item.qty)
                                        : item.discount
                                )}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateTaxable
                                        : styles.taxable,
                                    styles.right,
                                ]}
                            >
                                {moneyBare(item.taxable)}
                            </Text>
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateRate
                                        : styles.rate,
                                    styles.right,
                                ]}
                            >
                                {formatGstRate(item.rate)}
                            </Text>
                            {usesSingleGst ? (
                                <Text
                                    style={[
                                        styles.td,
                                        styles.corporateTax,
                                        styles.right,
                                    ]}
                                >
                                    {moneyBare(item.tax)}
                                </Text>
                            ) : (
                                <>
                                    <Text
                                        style={[
                                            styles.td,
                                            styles.tax,
                                            styles.right,
                                        ]}
                                    >
                                        {intra ? moneyBare(item.cgst) : "—"}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.td,
                                            styles.tax,
                                            styles.right,
                                        ]}
                                    >
                                        {intra ? moneyBare(item.sgst) : "—"}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.td,
                                            styles.tax,
                                            styles.right,
                                        ]}
                                    >
                                        {intra ? "—" : moneyBare(item.igst)}
                                    </Text>
                                </>
                            )}
                            <Text
                                style={[
                                    styles.td,
                                    usesSingleGst
                                        ? styles.corporateTotal
                                        : styles.total,
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
                                    <Text style={styles.qrLabel}>
                                        Scan for invoice details
                                    </Text>
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
                        {totalsRows.map(([label, value], index, rows) => (
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
                        <Text style={[styles.text, { padding: 5 }]}>
                            Amount in words: {amountInWords(invoiceTotal)}
                        </Text>
                    </View>
                </View>
                {order.poReference || seller?.bankName ? (
                    <View style={styles.corporateDetails}>
                        <View style={styles.corporateColumn}>
                            <Text style={styles.label}>BANK DETAILS</Text>
                            {[
                                ["Bank name", seller?.bankName],
                                [
                                    "Account name",
                                    seller?.bankAccountHolderName ??
                                        order.brand.name,
                                ],
                                ["Account number", seller?.bankAccountNumber],
                                ["Account type", seller?.bankAccountType],
                                ["IFSC code", seller?.bankIfscCode],
                                ["Branch", seller?.bankBranch],
                            ].map(([label, value]) => (
                                <View key={label} style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>
                                        {label}
                                    </Text>
                                    <Text style={styles.bankValue}>
                                        {value || "Not provided"}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <View
                            style={[
                                styles.corporateColumn,
                                styles.corporateColumnRight,
                            ]}
                        >
                            <Text style={styles.label}>DECLARATION</Text>
                            <Text style={styles.text}>
                                We declare that this invoice shows the actual
                                price of the goods described and that all
                                particulars are true and correct.
                            </Text>
                            <Text style={[styles.signature, { marginTop: 10 }]}>
                                For{" "}
                                {order.declarationCompanyName ??
                                    order.brand.name}
                                {"\n"}
                                {seller?.authorizedSignatoryName ??
                                    "Authorised Signatory"}
                            </Text>
                        </View>
                    </View>
                ) : null}
                <View style={styles.legalNotes}>
                    <Text>
                        * GST under RCM is not applicable unless otherwise
                        specified.
                    </Text>
                    <Text>
                        {order.sellerOfRecord
                            ? "* This is a direct B2B sale by Renivet, the seller of record, to the corporate customer."
                            : `* This transaction is between ${seller?.bankAccountHolderName ?? order.brand.name} and the customer. Renivet facilitates payment collection and logistics on the seller's behalf.`}
                    </Text>
                    <Text>* This is a computer-generated tax invoice.</Text>
                    <Text>* E&amp;OE - Errors and Omissions Excepted.</Text>
                    <Text>
                        * Goods once sold are subject to the applicable return
                        and exchange policy.
                    </Text>
                </View>
                <View style={styles.footer} fixed>
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
