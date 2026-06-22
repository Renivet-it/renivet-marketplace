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
import { formatINR, getAbsoluteURL } from "@/lib/utils";

export default function CorporateOrderReceivedEmail({
    order,
    confirmationHref,
    pdfHref,
    expectedTimelineText,
}: {
    order: any;
    confirmationHref: string;
    pdfHref: string;
    expectedTimelineText: string;
}) {
    return (
        <Html>
            <Head />
            <Preview>Corporate order received: {order.publicOrderId}</Preview>
            <Body style={{ backgroundColor: "#f8f5ef", fontFamily: "Arial, sans-serif" }}>
                <Container style={{ backgroundColor: "#ffffff", padding: "24px", margin: "24px auto", maxWidth: "640px" }}>
                    <Heading>Corporate Order Received</Heading>
                    <Text>
                        Thank you for placing your corporate order with Renivet.
                    </Text>
                    <Section>
                        <Text>Order ID: {order.publicOrderId}</Text>
                        <Text>Amount Paid: {formatINR(order.advancePaidPaise)}</Text>
                        <Text>Balance Due: {formatINR(order.balanceDuePaise)}</Text>
                        <Text>Expected Timeline: {expectedTimelineText}</Text>
                    </Section>
                    <Section style={{ marginTop: "24px" }}>
                        <Button href={confirmationHref} style={{ backgroundColor: "#8d5b2f", color: "#ffffff", padding: "12px 18px", borderRadius: "8px", textDecoration: "none", marginRight: "12px" }}>
                            View Order
                        </Button>
                        <Button href={pdfHref} style={{ backgroundColor: "#1f2937", color: "#ffffff", padding: "12px 18px", borderRadius: "8px", textDecoration: "none" }}>
                            Download Summary PDF
                        </Button>
                    </Section>
                    <Text style={{ marginTop: "24px", color: "#6b7280" }}>
                        You can also review your order anytime at {getAbsoluteURL("/corporate-orders")}.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
