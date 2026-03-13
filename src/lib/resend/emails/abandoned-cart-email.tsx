import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface AbandonedCartEmailProps {
    customerName: string;
    checkoutUrl: string;
}

export const AbandonedCartEmail = ({
    customerName,
    checkoutUrl,
}: AbandonedCartEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>You left something behind! 🛒</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={headerTitle}>RENIVET</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={title}>
                            Did you forget something, {customerName}?
                        </Heading>
                        <Text style={paragraph}>
                            We noticed you left some great items in your cart.
                            They're still waiting for you, but they might sell
                            out soon!
                        </Text>
                        <Text style={paragraph}>
                            Don't miss out on these amazing finds. Complete your
                            purchase now before they're gone.
                        </Text>

                        <Section style={btnContainer}>
                            <Button style={button} href={checkoutUrl}>
                                Return To Cart
                            </Button>
                        </Section>

                        <Text style={paragraph}>
                            If you had any trouble during checkout, our support
                            team is always here to help. Just reply to this
                            email!
                        </Text>
                    </Section>

                    <Hr style={hr} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Renivet. All rights
                            reserved.
                        </Text>
                        <Text style={footerLinks}>
                            <Link
                                href="https://renivet.com/policies/privacy-policy"
                                style={link}
                            >
                                Privacy Policy
                            </Link>{" "}
                            •{" "}
                            <Link
                                href="https://renivet.com/policies/terms-and-conditions"
                                style={link}
                            >
                                Terms of Service
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AbandonedCartEmail;

const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const header = {
    backgroundColor: "#5B9BD5",
    padding: "32px 20px",
    textAlign: "center" as const,
};

const headerTitle = {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "4px",
    margin: "0",
    textTransform: "uppercase" as const,
};

const content = {
    padding: "40px 48px",
};

const title = {
    color: "#1f2937",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 20px",
    lineHeight: "1.25",
};

const paragraph = {
    color: "#4b5563",
    fontSize: "16px",
    lineHeight: "26px",
    margin: "0 0 20px",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#5B9BD5",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "16px 32px",
    transition: "background-color 0.2s",
};

const hr = {
    borderColor: "#e5e7eb",
    margin: "0",
};

const footer = {
    padding: "32px 48px",
    backgroundColor: "#f9fafb",
    textAlign: "center" as const,
};

const footerText = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "24px",
    margin: "0 0 8px",
};

const footerLinks = {
    color: "#9ca3af",
    fontSize: "12px",
    margin: "0",
};

const link = {
    color: "#6b7280",
    textDecoration: "underline",
};
