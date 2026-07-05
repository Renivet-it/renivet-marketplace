import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 32,
        fontSize: 11,
        color: "#0f172a",
    },
    title: {
        fontSize: 20,
        marginBottom: 8,
        fontWeight: 700,
    },
    subtitle: {
        fontSize: 11,
        marginBottom: 18,
        color: "#475569",
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    lineItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        paddingBottom: 4,
        marginBottom: 4,
    },
});

export function BrandPayoutStatementTemplate(props: {
    cycleKey: string;
    payoutDate: string;
    brandName: string;
    summary: Record<string, unknown>;
    lineItems: Array<{
        description: string;
        amountPaise: number;
        lineType: string;
    }>;
}) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Renivet Brand Payout Statement</Text>
                <Text style={styles.subtitle}>
                    Cycle {props.cycleKey} | Payout date {props.payoutDate}
                </Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{props.brandName}</Text>
                    {Object.entries(props.summary).map(([key, value]) => (
                        <View key={key} style={styles.row}>
                            <Text>{key}</Text>
                            <Text>{String(value)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Line Items</Text>
                    {props.lineItems.map((item, index) => (
                        <View key={`${item.lineType}-${index}`} style={styles.lineItem}>
                            <Text>{item.description}</Text>
                            <Text>{(item.amountPaise / 100).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
}
