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

export default function CorporateOrderBalanceReminderEmail({
    order,
    paymentHref,
}: {
    order: any;
    paymentHref: string;
}) {
    return (
        <Html>
            <Head />
            <Preview>
                Balance payment reminder for {order.publicOrderId}
            </Preview>
            <Body
                style={{
                    backgroundColor: "#f8f7f4",
                    fontFamily: "Arial, sans-serif",
                }}
            >
                <Container
                    style={{
                        backgroundColor: "#ffffff",
                        padding: "24px",
                        margin: "24px auto",
                        maxWidth: "640px",
                    }}
                >
                    <Heading>Balance Payment Reminder</Heading>
                    <Text>
                        Your corporate order is moving ahead and the remaining
                        balance is now ready for payment.
                    </Text>
                    <Section>
                        <Text>Order ID: {order.publicOrderId}</Text>
                        <Text>Company: {order.companyName}</Text>
                        <Text>Amount already paid: {formatINR(order.advancePaidPaise)}</Text>
                        <Text>Remaining balance: {formatINR(order.balanceDuePaise)}</Text>
                    </Section>
                    <Section style={{ marginTop: "24px" }}>
                        <Button
                            href={paymentHref}
                            style={{
                                backgroundColor: "#5B9BD5",
                                color: "#ffffff",
                                padding: "12px 18px",
                                borderRadius: "8px",
                                textDecoration: "none",
                            }}
                        >
                            Pay Remaining Balance
                        </Button>
                    </Section>
                    <Text style={{ marginTop: "24px", color: "#6b7280" }}>
                        If you have already completed this payment, you can
                        ignore this reminder.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
