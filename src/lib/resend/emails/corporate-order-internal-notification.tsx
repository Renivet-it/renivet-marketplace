import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import { formatINR } from "@/lib/utils";

export default function CorporateOrderInternalNotificationEmail({
    order,
    adminHref,
}: {
    order: any;
    adminHref: string;
}) {
    return (
        <Html>
            <Head />
            <Preview>New corporate order: {order.publicOrderId}</Preview>
            <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Arial, sans-serif" }}>
                <Container style={{ backgroundColor: "#ffffff", padding: "24px", margin: "24px auto", maxWidth: "640px" }}>
                    <Heading>New Corporate Order</Heading>
                    <Section>
                        <Text>Order ID: {order.publicOrderId}</Text>
                        <Text>Company: {order.companyName}</Text>
                        <Text>Contact: {order.contactPersonName}</Text>
                        <Text>Email: {order.emailAddress}</Text>
                        <Text>Quantity: {order.quantity}</Text>
                        <Text>Total Value: {formatINR(order.totalPaise)}</Text>
                        <Text>Advance Paid: {formatINR(order.advancePaidPaise)}</Text>
                        <Text>Balance Due: {formatINR(order.balanceDuePaise)}</Text>
                        <Text>
                            Artwork:{" "}
                            {String((order.artworkFile as any)?.url ?? "Not available")}
                        </Text>
                        <Text>
                            Employee Sheet:{" "}
                            {String((order.employeeSheetFile as any)?.url ?? "Not available")}
                        </Text>
                    </Section>
                    <Section style={{ marginTop: "24px" }}>
                        <Button href={adminHref} style={{ backgroundColor: "#111827", color: "#ffffff", padding: "12px 18px", borderRadius: "8px", textDecoration: "none" }}>
                            Open in Admin
                        </Button>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}
