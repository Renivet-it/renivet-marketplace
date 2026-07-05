import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
    Image,
} from "@react-pdf/renderer";
import { formatCorporateDeliveryAddress } from "@/lib/corporate-delivery-address";

const brandColors = {
    bg: "#f8fafc",          // Slate-50 background
    panel: "#ffffff",       // Pure white panels
    ink: "#0f172a",         // Slate-900: Primary dark text
    muted: "#475569",       // Slate-600: Muted secondary text
    brand: "#2d3121",       // Renivet Brand Green
    brandLight: "#f4f6f0",  // Soft sage green highlight
    line: "#e2e8f0",        // Slate-200: Divider lines
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 40,
        paddingHorizontal: 0,
        fontSize: 10,
        backgroundColor: "#ffffff", // Crisp white is the professional standard for printable documents
        color: brandColors.ink,
    },
    hero: {
        backgroundColor: brandColors.brand,
        paddingTop: 32,
        paddingBottom: 30,
        paddingHorizontal: 36,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heroLeft: {
        flexDirection: "column",
        width: "75%",
    },
    logo: {
        width: 50,
        height: 50,
    },
    eyebrow: {
        fontSize: 9,
        color: "#c0c4b9", // soft brand-tinted white
        letterSpacing: 2,
        textTransform: "uppercase",
        fontWeight: 700,
    },
    title: {
        marginTop: 8,
        fontSize: 24,
        color: "#ffffff",
        fontWeight: 700,
    },
    subtitle: {
        marginTop: 8,
        fontSize: 11,
        color: "#f4f6f0",
        lineHeight: 1.5,
    },
    sectionWrap: {
        paddingHorizontal: 36,
        paddingTop: 24,
    },
    metricGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    metricCard: {
        padding: 12,
        backgroundColor: "#fafafa",
        borderRadius: 6,
        border: `1 solid ${brandColors.line}`,
    },
    metricLabel: {
        fontSize: 8,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: brandColors.muted,
        fontWeight: 600,
    },
    metricValue: {
        marginTop: 6,
        fontSize: 10, // 10pt is the sweet spot for perfect, non-overlapping values
        fontWeight: 700,
        color: brandColors.ink,
    },
    panel: {
        marginTop: 16,
        padding: 16,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        border: `1 solid ${brandColors.line}`,
    },
    panelTitle: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: brandColors.brand,
        fontWeight: 700,
        marginBottom: 10,
        borderBottom: `1 solid ${brandColors.line}`,
        paddingBottom: 4,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottom: `0.5 solid #f1f5f9`, // add a very subtle row separator line for ease of reading
    },
    label: {
        width: "40%",
        fontSize: 9,
        color: brandColors.muted,
    },
    value: {
        width: "58%",
        fontSize: 9,
        color: brandColors.ink,
        fontWeight: 500,
        textAlign: "right",
    },
    note: {
        marginTop: 20,
        padding: 14,
        backgroundColor: brandColors.brandLight,
        borderRadius: 6,
        borderLeft: `3 solid ${brandColors.brand}`,
    },
    noteText: {
        fontSize: 9,
        lineHeight: 1.5,
        color: brandColors.ink,
    },
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 6,
    },
    chip: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: "#f1f5f9",
        border: `1 solid ${brandColors.line}`,
        fontSize: 8,
        color: brandColors.ink,
    },
});

function toMoney(value: number) {
    return `INR ${(value / 100).toFixed(2)}`;
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
    const extras = pricing.appliedExtraCharges ?? [];
    const colors = (product.colors ?? []).map((item: any) => item.name).filter(Boolean);
    const placements = (branding.logoLocations ?? [])
        .map((item: any) => item.name)
        .filter(Boolean);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.hero}>
                    <View style={styles.heroLeft}>
                        <Text style={styles.eyebrow}>Renivet Corporate Orders</Text>
                        <Text style={styles.title}>Corporate Order Summary</Text>
                        <Text style={styles.subtitle}>
                            Official order confirmation, commercial billing breakdown, and production specifications.
                        </Text>
                    </View>
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw"
                        style={styles.logo}
                    />
                </View>

                <View style={styles.sectionWrap}>
                    <View style={styles.metricGrid}>
                        <View style={[styles.metricCard, { width: "31%" }]}>
                            <Text style={styles.metricLabel}>Order ID</Text>
                            <Text style={styles.metricValue}>{order.publicOrderId}</Text>
                        </View>
                        <View style={[styles.metricCard, { width: "21%" }]}>
                            <Text style={styles.metricLabel}>Order Value</Text>
                            <Text style={styles.metricValue}>{toMoney(order.totalPaise)}</Text>
                        </View>
                        <View style={[styles.metricCard, { width: "21%" }]}>
                            <Text style={styles.metricLabel}>Advance Paid</Text>
                            <Text style={styles.metricValue}>
                                {toMoney(order.advancePaidPaise)}
                            </Text>
                        </View>
                        <View style={[styles.metricCard, { width: "21%" }]}>
                            <Text style={styles.metricLabel}>Balance Due</Text>
                            <Text style={styles.metricValue}>
                                {toMoney(order.balanceDuePaise)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Company Information</Text>
                        <InfoRow label="Company Name" value={order.companyName} />
                        <InfoRow label="Contact Person" value={order.contactPersonName} />
                        <InfoRow label="Email Address" value={order.emailAddress} />
                        <InfoRow label="Phone Number" value={order.mobileNumber} />
                        <InfoRow
                            label="Delivery Address"
                            value={formatCorporateDeliveryAddress(order)}
                        />
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Garment Configuration</Text>
                        <InfoRow
                            label="Product Type"
                            value={product.productType?.name || product.productTypeId || "-"}
                        />
                        <InfoRow
                            label="GSM"
                            value={product.gsmOption?.label || product.gsmOptionId || "-"}
                        />
                        <InfoRow
                            label="Fabric Composition"
                            value={
                                product.fabricComposition?.name ||
                                product.fabricCompositionId ||
                                "-"
                            }
                        />
                        <InfoRow label="Total Quantity" value={String(order.quantity)} />
                        {colors.length ? (
                            <View style={{ paddingTop: 8 }}>
                                <Text style={styles.label}>Selected Colors</Text>
                                <View style={styles.chipRow}>
                                    {colors.map((color: string) => (
                                        <Text key={color} style={styles.chip}>
                                            {color}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Branding and Extras</Text>
                        <InfoRow
                            label="Print Method"
                            value={branding.printMethod?.name || "-"}
                        />
                        {placements.length ? (
                            <View style={{ paddingTop: 8 }}>
                                <Text style={styles.label}>Logo Placements</Text>
                                <View style={styles.chipRow}>
                                    {placements.map((placement: string) => (
                                        <Text key={placement} style={styles.chip}>
                                            {placement}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        ) : null}
                        {extras.length ? (
                            <View style={{ paddingTop: 12 }}>
                                <Text style={styles.label}>Applied Extras</Text>
                                {extras.map((item: any) => (
                                    <InfoRow
                                        key={item.id}
                                        label={item.name}
                                        value={toMoney(item.amountPaise)}
                                    />
                                ))}
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Commercial Summary</Text>
                        <InfoRow label="Subtotal" value={toMoney(order.subtotalPaise)} />
                        <InfoRow
                            label="Customization"
                            value={toMoney(order.customizationPaise)}
                        />
                        <InfoRow label="GST Amount" value={toMoney(order.gstPaise)} />
                        <InfoRow label="Grand Total" value={toMoney(order.totalPaise)} />
                        <InfoRow
                            label="Estimated Timeline"
                            value={settings.expectedTimelineText}
                        />
                    </View>

                    <View style={styles.note}>
                        <Text style={styles.noteText}>
                            This corporate order summary is generated to facilitate procurement coordination across finance, production, and brand operations. All values and configurations reflect the current recorded order specifications.
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}
