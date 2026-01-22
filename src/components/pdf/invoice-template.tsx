import {
    Document,
    Font,
    G,
    Page,
    Path,
    StyleSheet,
    Svg,
    Text,
    View,
} from "@react-pdf/renderer";

// Register fonts - Helvetica is standard
const colors = {
    primary: "#111827", // Dark gray/black
    secondary: "#6B7280", // Light gray
    accent: "#F3F4F6", // Very light gray background
    border: "#E5E7EB", // Border gray
};

const styles = StyleSheet.create({
    page: {
        padding: 48,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: colors.primary,
        lineHeight: 1.5,
    },
    // Header Section
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 48,
        alignItems: "center",
    },
    logoContainer: {
        width: 150,
        height: 45,
    },
    headerRight: {
        alignItems: "flex-end",
    },
    title: {
        fontSize: 24,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: "row",
        marginBottom: 2,
    },
    metaLabel: {
        color: colors.secondary,
        marginRight: 8,
    },
    metaValue: {
        fontFamily: "Helvetica-Bold",
    },

    // Billing/Seller Grid
    gridContainer: {
        flexDirection: "row",
        marginBottom: 32,
        gap: 24,
    },
    gridCol: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 9,
        color: colors.secondary,
        textTransform: "uppercase",
        fontFamily: "Helvetica-Bold",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    entityName: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
    },
    addressText: {
        fontSize: 10,
        color: "#374151",
        marginBottom: 2,
    },

    // Table
    tableContainer: {
        marginTop: 16,
        marginBottom: 32,
    },
    tableHeaderConfig: {
        flexDirection: "row",
        backgroundColor: colors.accent,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    tableHeaderCell: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#374151",
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    tableCell: {
        fontSize: 10,
        color: colors.primary,
    },
    // Columns
    colItem: { flex: 2 },
    colQty: { width: 60, textAlign: "center" },
    colPrice: { width: 80, textAlign: "right" },
    colTotal: { width: 80, textAlign: "right" },

    // Summary
    summaryContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    summaryBlock: {
        width: 200,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    summaryLabel: {
        color: colors.secondary,
        fontSize: 10,
    },
    summaryValue: {
        fontFamily: "Helvetica-Bold",
        fontSize: 10,
    },
    totalRow: {
        borderTopWidth: 2,
        borderTopColor: colors.primary,
        paddingTop: 8,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
    },
    totalValue: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
    },

    // Footer
    footer: {
        position: "absolute",
        bottom: 48,
        left: 48,
        right: 48,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 16,
    },
    footerText: {
        fontSize: 8,
        color: colors.secondary,
        textAlign: "center",
        marginBottom: 4,
    },
});

function convertPaiseToRupees(value: number) {
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
    // No longer need logoBase64 prop
}

export const InvoiceTemplate = ({ order }: InvoiceTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.logoContainer}>
                    <Svg viewBox="0 0 1602.86 477.1">
                        <Path d="M477.11 71.67v333.77c0 39.42-32.25 71.67-71.68 71.67H71.68c-39.42 0-71.68-32.25-71.68-71.67V71.67C0 32.25 32.26 0 71.68 0h333.76c39.42 0 71.68 32.25 71.68 71.67Z" />
                        <G>
                            <Path
                                fill="#fff"
                                d="M157.99 124.42s80.72-49.53 148.87-16.08c0 0-7.54 69.04-139.19 91.28 0 0 135.58 55.11 172.55-107.3 0 0-119.87-69.01-182.23 32.11Z"
                            />
                            <Path
                                fill="#fff"
                                d="M102.14 99.39s-77.63 191.88 10.07 295.29c0 0 15.04 15.22 29.18-26.57 0 0 56.78-155.78-39.25-268.72Zm29.21 244.89c-7.33 27.05-20.12 11.74-20.12 11.74-49.19-94.25-6.98-212.99-6.98-212.99 63.22 83.57 27.1 201.25 27.1 201.25Z"
                            />
                            <Path
                                fill="#fff"
                                d="M223.92 246.72c12 1.81 23.11 5.32 33.18 10.49 20.97 10.78 37.22 29.06 48.3 54.33 11.63 26.54 23.39 48.88 35.16 66.85-9.88-1.92-20.14-4.59-30.15-8.28-15.81-5.83-29-13.5-39.2-22.81-11.47-10.46-19.19-22.85-23.61-37.85-.97-4.12-5.49-22.28-13.92-42.39-3.08-7.34-6.33-14.12-9.76-20.35m-19.78-26.06c-19.62 0-33.18 3.51-33.18 3.51 36.28 17.78 52.81 91.52 52.81 91.52 24.15 83.96 128.28 92.09 167.7 92.09 9.47 0 15.21-.47 15.21-.47h0c-.53 0-32.6-.44-78.72-105.65-30.21-68.93-87.43-81-123.81-81h0Z"
                            />
                        </G>
                        <Path d="M669.96 339.09l-27.44-39.64h-30.29v39.64h-32.93v-142.31h61.6c38.02 0 61.8 19.72 61.8 51.64 0 21.34-10.77 37-29.27 44.93l31.92 45.74h-35.37Zm-30.9-115.47h-26.83v49.6h26.83c20.13 0 30.29-9.35 30.29-24.8s-10.16-24.8-30.29-24.8Zm142.7 30.5v-.04h-32.72v25.66h32.72v-.02h66.08v-25.61h-66.08Zm0 58.54v-.05h-32.72v26.49h110.19v-26.44h-77.47Zm-32.72-115.87v26.44h32.72v-.02h74.82v-26.42h-107.53Zm621.84 57.32v-.04h-32.72v25.66h32.72v-.02h66.08v-25.61h-66.08Zm0 58.54v-.05h-32.72v26.49h110.19v-26.44h-77.47Zm-32.72-115.87v26.44h32.72v-.02h74.82v-26.42h-107.53Zm-301.88 0v142.31h-27.04l-70.95-86.4v86.4h-32.53v-142.31h27.24l70.75 86.4v-86.4h32.53Zm51.87-.12l-.04 142.54h31.72l.02-142.54h-31.71Zm217.9.12l-61.6 142.31h-32.53l-61.39-142.31h35.58l43.3 101.65 43.91-101.65h32.73Zm218.33 26.84h-45.54v-26.84h124.01v26.84h-45.54v115.47h-32.93v-115.47Zm-420.38-85.72c-11.5 0-19.2 7.51-19.2 17.22s7.71 17.21 19.2 17.21 19.2-7.52 19.2-17.81c0-9.51-7.72-16.62-19.2-16.62Z" />
                    </Svg>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.title}>INVOICE</Text>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Invoice #</Text>
                        <Text style={styles.metaValue}>{order.id}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>
                            {new Date(order.date).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Addresses */}
            <View style={styles.gridContainer}>
                <View style={styles.gridCol}>
                    <Text style={styles.sectionLabel}>Sold By</Text>
                    <Text style={styles.entityName}>
                        {order.brand?.name || "N/A"}
                    </Text>
                    <Text style={styles.addressText}>
                        {order.brand?.confidential?.addressLine1 || "N/A"}
                    </Text>
                    <Text style={styles.addressText}>
                        GSTIN: {order.brand?.confidential?.gstin || "N/A"}
                    </Text>
                </View>
                <View style={styles.gridCol}>
                    <Text style={styles.sectionLabel}>Bill To</Text>
                    <Text style={styles.entityName}>
                        {order.customerName || "N/A"}
                    </Text>
                    <Text style={styles.addressText}>
                        {order.address || "N/A"}
                    </Text>
                    <Text style={styles.addressText}>
                        Phone: {order.phone || "N/A"}
                    </Text>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.tableContainer}>
                <View style={styles.tableHeaderConfig}>
                    <Text style={[styles.tableHeaderCell, styles.colItem]}>
                        Item Description
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colQty]}>
                        Qty
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                        Price
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                        Amount
                    </Text>
                </View>

                {/* Row - currently handling single item per order object structure */}
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colItem]}>
                        {order.items?.title || "Product"}
                    </Text>
                    <Text style={[styles.tableCell, styles.colQty]}>1</Text>
                    <Text style={[styles.tableCell, styles.colPrice]}>
                        ₹{convertPaiseToRupees(order.amount)}
                    </Text>
                    <Text style={[styles.tableCell, styles.colTotal]}>
                        ₹{convertPaiseToRupees(order.amount)}
                    </Text>
                </View>
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryBlock}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>
                            ₹{convertPaiseToRupees(order.amount)}
                        </Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>
                            ₹{convertPaiseToRupees(order.amount)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    This invoice is computer generated and no signature is
                    required.
                </Text>
                <Text style={styles.footerText}>
                    Thank you for shopping with Renivet!
                </Text>
            </View>
        </Page>
    </Document>
);
