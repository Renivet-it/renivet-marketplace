import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

// Register fonts - Helvetica is standard
const colors = {
    primary: "#111827", // Dark gray/black
    secondary: "#6B7280", // Light gray
    accent: "#F3F4F6", // Very light gray background
    border: "#E5E7EB", // Border gray
    text: "#374151",
};

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: colors.text,
        lineHeight: 1.5,
    },
    // Centered Header
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    logo: {
        width: 180,
        height: 50,
        objectFit: "contain",
        marginBottom: 10,
    },
    title: {
        fontSize: 20,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 1,
        color: colors.primary,
    },

    // Main Container
    mainContainer: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 4,
        padding: 0, // Inner padding handles spacing
    },

    // Address Grid (Seller / Buyer)
    addressGrid: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    addressBox: {
        flex: 1,
        padding: 16,
        paddingTop: 24, // Increased top padding to prevent clipping
    },
    addressBoxRight: {
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
        marginBottom: 4,
    },
    text: {
        fontSize: 9,
        marginBottom: 2,
    },

    // Order Details
    orderDetailsSection: {
        padding: 16,
        paddingBottom: 8,
    },
    detailsHeader: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary,
        paddingBottom: 4,
    },
    detailRow: {
        flexDirection: "row",
        marginTop: 4,
        gap: 4,
    },
    detailLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 9,
    },
    detailValue: {
        fontSize: 9,
    },

    // Items Section
    itemsSection: {
        padding: 16,
        paddingTop: 8,
    },

    // Table
    table: {
        width: "100%",
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 8,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#F3F4F6", // Light gray
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableHeaderCell: {
        padding: 8,
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableCell: {
        padding: 8,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    // Remove right border for last cell
    lastCell: {
        borderRightWidth: 0,
    },

    // Columns widths
    colIdx: { width: "8%" },
    colProduct: { width: "52%" },
    colQty: { width: "10%" },
    colPrice: { width: "15%" },
    colTotal: { width: "15%" },

    // Summary (Bottom Right)
    summaryContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 0,
    },
    summaryTable: {
        width: 200,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    summaryRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    summaryRowLast: {
        borderBottomWidth: 0,
    },
    summaryLabelCell: {
        flex: 1,
        padding: 8,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    summaryValueCell: {
        flex: 1,
        padding: 8,
        fontSize: 9,
        fontFamily: "Helvetica",
    },
    bold: {
        fontFamily: "Helvetica-Bold",
    },

    // Footer
    footer: {
        marginTop: 40,
        textAlign: "center",
        fontSize: 8,
        color: "#9CA3AF",
    },
});

function convertPaiseToRupees(value?: number) {
    if (!value) return "0.00";
    return (value / 100).toFixed(2);
}

interface InvoiceOrder {
    id: string;
    date: string | Date;
    customerName: string;
    address: string;
    phone: string;
    amount: number;
    items:
        | {
              title: string;
          }
        | any;
    brand: {
        name: string;
        confidential?: {
            addressLine1?: string;
            gstin?: string;
        };
    };
}

interface InvoiceTemplateProps {
    order: InvoiceOrder;
}

export const InvoiceTemplate = ({ order }: InvoiceTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Centered Header */}
            <View style={styles.header}>
                {/* Using the remote URL as requested/configured in previous steps, 
                     or falling back to the one user explicitly pasted if API route doesn't pass it.
                     However, the API route DOES pass `logoSrc` (if using the dynamic version) or this template uses a hardcoded one.
                     Let's stick to the URL user proved in the previous turn as the default "Design" source. 
                 */}
                <Image
                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNul0Kj0hnjfTvXWe4YdlSzoaZPyC7xGVghIDL"
                    style={styles.logo}
                />
                <Text style={styles.title}>INVOICE</Text>
            </View>

            {/* Main Content Box */}
            <View style={styles.mainContainer}>
                {/* 1. Address Grid */}
                <View style={styles.addressGrid}>
                    {/* Seller */}
                    <View style={styles.addressBox}>
                        <Text style={styles.sectionTitle}>Seller Details</Text>
                        <Text style={[styles.text, styles.bold]}>
                            {order.brand?.name || "N/A"}
                        </Text>
                        <Text style={styles.text}>
                            {order.brand?.confidential?.addressLine1 || "N/A"}
                        </Text>
                        <Text style={styles.text}>
                            GST: {order.brand?.confidential?.gstin || "N/A"}
                        </Text>
                    </View>

                    {/* Buyer */}
                    <View style={[styles.addressBox, styles.addressBoxRight]}>
                        <Text style={styles.sectionTitle}>Billing To</Text>
                        <Text style={[styles.text, styles.bold]}>
                            {order.customerName || "N/A"}
                        </Text>
                        <Text style={styles.text}>
                            {order.address || "N/A"}
                        </Text>
                        <Text style={styles.text}>
                            Phone: {order.phone || "N/A"}
                        </Text>
                    </View>
                </View>

                {/* 2. Order Details */}
                <View style={styles.orderDetailsSection}>
                    <Text style={styles.detailsHeader}>Order Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Order ID:</Text>
                        <Text style={styles.detailValue}>{order.id}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Order Date:</Text>
                        <Text style={styles.detailValue}>
                            {new Date(order.date).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* 3. Items */}
                <View style={styles.itemsSection}>
                    <Text style={styles.detailsHeader}>Items</Text>

                    <View style={styles.table}>
                        {/* Header */}
                        <View style={styles.tableHeader}>
                            <Text
                                style={[styles.tableHeaderCell, styles.colIdx]}
                            >
                                #
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    styles.colProduct,
                                ]}
                            >
                                Product
                            </Text>
                            <Text
                                style={[styles.tableHeaderCell, styles.colQty]}
                            >
                                Qty
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    styles.colPrice,
                                ]}
                            >
                                Unit Price
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    styles.colTotal,
                                    styles.lastCell,
                                ]}
                            >
                                Total
                            </Text>
                        </View>

                        {/* Row */}
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colIdx]}>
                                1
                            </Text>
                            <Text style={[styles.tableCell, styles.colProduct]}>
                                {order.items?.title || "Product"}
                            </Text>
                            <Text style={[styles.tableCell, styles.colQty]}>
                                1
                            </Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>
                                ₹{convertPaiseToRupees(order.amount)}
                            </Text>
                            <Text
                                style={[
                                    styles.tableCell,
                                    styles.colTotal,
                                    styles.lastCell,
                                ]}
                            >
                                ₹{convertPaiseToRupees(order.amount)}
                            </Text>
                        </View>
                        {/* If we had more rows, we would map them here. The last row should logically close the bottom border which is handled by the table container border. */}
                    </View>

                    {/* Summary */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryTable}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabelCell}>
                                    Subtotal
                                </Text>
                                <Text style={styles.summaryValueCell}>
                                    ₹{convertPaiseToRupees(order.amount)}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.summaryRow,
                                    styles.summaryRowLast,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.summaryLabelCell,
                                        styles.bold,
                                    ]}
                                >
                                    Total
                                </Text>
                                <Text
                                    style={[
                                        styles.summaryValueCell,
                                        styles.bold,
                                    ]}
                                >
                                    ₹{convertPaiseToRupees(order.amount)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>
                    This is a system-generated invoice and does not require a
                    signature.
                </Text>
                <Text>Thank you for shopping with Renivet!</Text>
            </View>
        </Page>
    </Document>
);
