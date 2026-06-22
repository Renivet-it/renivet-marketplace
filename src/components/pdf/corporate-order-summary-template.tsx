import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 28,
        fontSize: 11,
    },
    title: {
        fontSize: 22,
        marginBottom: 8,
    },
    section: {
        marginTop: 14,
        padding: 12,
        border: "1px solid #d1d5db",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        gap: 12,
    },
    label: {
        color: "#475569",
    },
    value: {
        width: "56%",
        textAlign: "right",
    },
});

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

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Renivet Corporate Order Summary</Text>
                <Text>{order.publicOrderId}</Text>

                <View style={styles.section}>
                    <Text>Company Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Company</Text>
                        <Text style={styles.value}>{order.companyName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Contact</Text>
                        <Text style={styles.value}>
                            {order.contactPersonName}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{order.emailAddress}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.value}>{order.mobileNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Address</Text>
                        <Text style={styles.value}>{order.deliveryAddress}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text>Product Configuration</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Product Type</Text>
                        <Text style={styles.value}>{product.productType?.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>GSM</Text>
                        <Text style={styles.value}>{product.gsmOption?.label}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fabric</Text>
                        <Text style={styles.value}>
                            {product.fabricComposition?.name}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Colors</Text>
                        <Text style={styles.value}>
                            {(product.colors ?? [])
                                .map((item: any) => item.name)
                                .join(", ")}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Quantity</Text>
                        <Text style={styles.value}>{String(order.quantity)}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text>Branding</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Print Method</Text>
                        <Text style={styles.value}>{branding.printMethod?.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Logo Placements</Text>
                        <Text style={styles.value}>
                            {(branding.logoLocations ?? [])
                                .map((item: any) => item.name)
                                .join(", ")}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text>Pricing</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Subtotal</Text>
                        <Text style={styles.value}>
                            INR {(order.subtotalPaise / 100).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Customization</Text>
                        <Text style={styles.value}>
                            INR {(order.customizationPaise / 100).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>GST</Text>
                        <Text style={styles.value}>
                            INR {(order.gstPaise / 100).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total</Text>
                        <Text style={styles.value}>
                            INR {(order.totalPaise / 100).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Advance Paid</Text>
                        <Text style={styles.value}>
                            INR {(order.advancePaidPaise / 100).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Balance Due</Text>
                        <Text style={styles.value}>
                            INR {(order.balanceDuePaise / 100).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Expected Timeline</Text>
                        <Text style={styles.value}>
                            {settings.expectedTimelineText}
                        </Text>
                    </View>
                    {pricing.appliedExtraCharges?.length ? (
                        <View style={{ marginTop: 8 }}>
                            <Text>Applied Extras</Text>
                            {pricing.appliedExtraCharges.map((item: any) => (
                                <View key={item.id} style={styles.row}>
                                    <Text style={styles.label}>{item.name}</Text>
                                    <Text style={styles.value}>
                                        INR {(item.amountPaise / 100).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            </Page>
        </Document>
    );
}
