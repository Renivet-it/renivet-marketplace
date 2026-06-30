import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

const luxury = {
    navy: "#14213d",
    gold: "#9a6b2f",
    goldSoft: "#e8d8c0",
    sand: "#f6f0e7",
    panel: "#fffdf9",
    ink: "#1f2937",
    muted: "#667085",
    line: "#decdb8",
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 34,
        paddingHorizontal: 0,
        fontSize: 11,
        backgroundColor: luxury.sand,
        color: luxury.ink,
    },
    hero: {
        backgroundColor: luxury.navy,
        paddingTop: 30,
        paddingBottom: 28,
        paddingHorizontal: 34,
    },
    eyebrow: {
        fontSize: 10,
        color: luxury.goldSoft,
        letterSpacing: 3,
        textTransform: "uppercase",
    },
    title: {
        marginTop: 12,
        fontSize: 28,
        color: "#ffffff",
        fontWeight: 700,
    },
    subtitle: {
        marginTop: 10,
        fontSize: 12,
        color: "#dbe4f0",
        lineHeight: 1.6,
    },
    sectionWrap: {
        paddingHorizontal: 28,
        paddingTop: 18,
    },
    metricGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    metricCard: {
        width: "47%",
        padding: 16,
        backgroundColor: luxury.panel,
        borderRadius: 16,
        border: `1 solid ${luxury.line}`,
    },
    metricLabel: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 2,
        color: luxury.muted,
    },
    metricValue: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: 700,
        color: luxury.navy,
    },
    panel: {
        marginTop: 14,
        padding: 18,
        backgroundColor: luxury.panel,
        borderRadius: 18,
        border: `1 solid ${luxury.line}`,
    },
    panelTitle: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 2.2,
        color: luxury.gold,
        fontWeight: 700,
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingTop: 8,
    },
    label: {
        width: "40%",
        fontSize: 11,
        color: luxury.muted,
    },
    value: {
        width: "58%",
        fontSize: 11,
        color: luxury.ink,
        textAlign: "right",
    },
    note: {
        marginTop: 14,
        padding: 16,
        backgroundColor: luxury.goldSoft,
        borderRadius: 16,
        border: `1 solid ${luxury.line}`,
    },
    noteText: {
        fontSize: 11,
        lineHeight: 1.6,
        color: luxury.navy,
    },
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "#fbf7f1",
        border: `1 solid ${luxury.line}`,
        fontSize: 10,
        color: luxury.ink,
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
                    <Text style={styles.eyebrow}>Renivet Corporate Atelier</Text>
                    <Text style={styles.title}>Corporate Order Dossier</Text>
                    <Text style={styles.subtitle}>
                        Premium commercial summary for managed procurement,
                        production handoff, and payment tracking.
                    </Text>
                </View>

                <View style={styles.sectionWrap}>
                    <View style={styles.metricGrid}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Order ID</Text>
                            <Text style={styles.metricValue}>{order.publicOrderId}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Order Value</Text>
                            <Text style={styles.metricValue}>{toMoney(order.totalPaise)}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Advance Paid</Text>
                            <Text style={styles.metricValue}>
                                {toMoney(order.advancePaidPaise)}
                            </Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Balance Due</Text>
                            <Text style={styles.metricValue}>
                                {toMoney(order.balanceDuePaise)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Company Information</Text>
                        <InfoRow label="Company" value={order.companyName} />
                        <InfoRow label="Contact Person" value={order.contactPersonName} />
                        <InfoRow label="Email" value={order.emailAddress} />
                        <InfoRow label="Phone" value={order.mobileNumber} />
                        <InfoRow label="Delivery Address" value={order.deliveryAddress} />
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
                        <InfoRow label="Quantity" value={String(order.quantity)} />
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
                        <InfoRow label="GST" value={toMoney(order.gstPaise)} />
                        <InfoRow label="Total" value={toMoney(order.totalPaise)} />
                        <InfoRow
                            label="Expected Timeline"
                            value={settings.expectedTimelineText}
                        />
                    </View>

                    <View style={styles.note}>
                        <Text style={styles.noteText}>
                            This corporate order dossier is generated for premium
                            procurement coordination across finance, production, and
                            brand operations. All commercial amounts and configuration
                            snapshots reflect the current recorded order state.
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
