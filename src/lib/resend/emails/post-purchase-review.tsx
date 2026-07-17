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
import * as React from "react";

export default function PostPurchaseReviewEmail({
    firstName,
    reviewUrl,
    unsubscribeUrl,
}: {
    firstName: string;
    reviewUrl: string;
    unsubscribeUrl: string;
}) {
    return (
        <Html>
            <Head />
            <Preview>How was your Renivet order?</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={heading}>How was your order, {firstName}?</Heading>
                    <Text style={paragraph}>
                        Your delivery should be with you by now. We’d love to hear how it went and
                        what you thought about the product.
                    </Text>
                    <Section style={buttonWrap}>
                        <Button href={reviewUrl} style={button}>
                            Leave a review
                        </Button>
                    </Section>
                    <Text style={footer}>
                        <a href={unsubscribeUrl} style={link}>
                            Unsubscribe from marketing emails
                        </a>
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

const main = { backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif", padding: "32px 0" };
const container = { backgroundColor: "#ffffff", borderRadius: "16px", margin: "0 auto", maxWidth: "560px", padding: "32px" };
const heading = { color: "#111827", fontSize: "28px", margin: "0 0 16px" };
const paragraph = { color: "#4b5563", fontSize: "16px", lineHeight: "26px", margin: "0 0 20px" };
const buttonWrap = { margin: "28px 0", textAlign: "center" as const };
const button = { backgroundColor: "#111827", color: "#ffffff", borderRadius: "8px", padding: "14px 28px", textDecoration: "none", fontWeight: "bold" };
const footer = { color: "#6b7280", fontSize: "12px", textAlign: "center" as const, marginTop: "24px" };
const link = { color: "#6b7280", textDecoration: "underline" };
