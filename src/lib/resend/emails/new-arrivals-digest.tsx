import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface ProductDigestItem {
    title: string;
    description?: string | null;
    url: string;
    brandName?: string | null;
    priceLabel?: string | null;
}

export default function NewArrivalsDigestEmail({
    firstName,
    intro,
    ctaUrl,
    products,
    unsubscribeUrl,
}: {
    firstName: string;
    intro?: string;
    ctaUrl: string;
    products: ProductDigestItem[];
    unsubscribeUrl: string;
}) {
    return (
        <Html>
            <Head />
            <Preview>Fresh arrivals are now live on Renivet</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={heading}>Fresh arrivals for you, {firstName}</Heading>
                    <Text style={paragraph}>
                        {intro ??
                            "We pulled together the newest conscious finds now live on Renivet so you can browse the latest drops in one place."}
                    </Text>
                    <Section style={listWrap}>
                        {products.map((product) => (
                            <Section key={product.url} style={card}>
                                <Text style={cardTitle}>{product.title}</Text>
                                <Text style={cardMeta}>
                                    {[product.brandName, product.priceLabel]
                                        .filter(Boolean)
                                        .join(" • ")}
                                </Text>
                                {product.description ? (
                                    <Text style={cardBody}>{product.description}</Text>
                                ) : null}
                                <Link href={product.url} style={cardLink}>
                                    View product
                                </Link>
                            </Section>
                        ))}
                    </Section>
                    <Section style={buttonWrap}>
                        <Button href={ctaUrl} style={button}>
                            Explore all new arrivals
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
const container = { backgroundColor: "#ffffff", borderRadius: "16px", margin: "0 auto", maxWidth: "620px", padding: "32px" };
const heading = { color: "#111827", fontSize: "28px", margin: "0 0 16px" };
const paragraph = { color: "#4b5563", fontSize: "16px", lineHeight: "26px", margin: "0 0 20px" };
const listWrap = { margin: "24px 0" };
const card = { border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "12px", padding: "16px" };
const cardTitle = { color: "#111827", fontSize: "18px", fontWeight: "700", margin: "0 0 6px" };
const cardMeta = { color: "#6b7280", fontSize: "13px", margin: "0 0 10px" };
const cardBody = { color: "#4b5563", fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" };
const cardLink = { color: "#0f766e", fontSize: "14px", fontWeight: "700", textDecoration: "underline" };
const buttonWrap = { margin: "28px 0", textAlign: "center" as const };
const button = { backgroundColor: "#111827", color: "#ffffff", borderRadius: "8px", padding: "14px 28px", textDecoration: "none", fontWeight: "bold" };
const footer = { color: "#6b7280", fontSize: "12px", textAlign: "center" as const, marginTop: "24px" };
const link = { color: "#6b7280", textDecoration: "underline" };
