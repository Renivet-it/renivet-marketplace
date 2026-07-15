import { siteConfig } from "@/config/site";
import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
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
    imageUrl?: string | null;
    imageAlt?: string | null;
}

const LOGO_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw";

function chunkProducts(products: ProductDigestItem[], size: number) {
    const rows: ProductDigestItem[][] = [];

    for (let index = 0; index < products.length; index += size) {
        rows.push(products.slice(index, index + size));
    }

    return rows;
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
    const productRows = chunkProducts(products, 2);

    return (
        <Html>
            <Head />
            <Preview>Fresh arrivals are now live on Renivet</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={brandBar}>
                        <Img
                            src={LOGO_URL}
                            alt={siteConfig.name}
                            width={56}
                            height={56}
                            style={logo}
                        />
                        <Text style={brandLabel}>Renivet New Arrivals</Text>
                    </Section>

                    <Section style={heroCard}>
                        <Text style={eyebrow}>Conscious finds, curated for you</Text>
                        <Heading style={heading}>
                            Fresh arrivals for you, {firstName}
                        </Heading>
                        <Text style={paragraph}>
                            {intro ??
                                "We pulled together the newest responsible products now live on Renivet so you can browse the latest drops in one place."}
                        </Text>
                    </Section>

                    <Section style={listWrap}>
                        {productRows.map((row, rowIndex) => (
                            <Row key={`row-${rowIndex}`} style={gridRow}>
                                {row.length === 1 ? (
                                    <Column style={singleGridColumn}>
                                        <Section style={card}>
                                            {row[0]?.imageUrl ? (
                                                <Img
                                                    src={row[0].imageUrl}
                                                    alt={row[0].imageAlt ?? row[0].title}
                                                    width={248}
                                                    height={248}
                                                    style={cardImage}
                                                />
                                            ) : (
                                                <Section style={imageFallback}>
                                                    <Text style={imageFallbackText}>
                                                        Renivet Pick
                                                    </Text>
                                                </Section>
                                            )}
                                            <Section style={cardContentColumn}>
                                                <Text style={cardTitle}>
                                                    {row[0]?.title}
                                                </Text>
                                                <Text style={cardMeta}>
                                                    {[row[0]?.brandName, row[0]?.priceLabel]
                                                        .filter(Boolean)
                                                        .join(" | ")}
                                                </Text>
                                                {row[0]?.description ? (
                                                    <Text style={cardBody}>
                                                        {row[0].description}
                                                    </Text>
                                                ) : null}
                                                <Link href={row[0]!.url} style={cardLink}>
                                                    View product
                                                </Link>
                                            </Section>
                                        </Section>
                                    </Column>
                                ) : (
                                    row.map((product) => (
                                        <Column key={product.url} style={gridColumn}>
                                            <Section style={card}>
                                                {product.imageUrl ? (
                                                    <Img
                                                        src={product.imageUrl}
                                                        alt={product.imageAlt ?? product.title}
                                                        width={248}
                                                        height={248}
                                                        style={cardImage}
                                                    />
                                                ) : (
                                                    <Section style={imageFallback}>
                                                        <Text style={imageFallbackText}>
                                                            Renivet Pick
                                                        </Text>
                                                    </Section>
                                                )}
                                                <Section style={cardContentColumn}>
                                                    <Text style={cardTitle}>
                                                        {product.title}
                                                    </Text>
                                                    <Text style={cardMeta}>
                                                        {[product.brandName, product.priceLabel]
                                                            .filter(Boolean)
                                                            .join(" | ")}
                                                    </Text>
                                                    {product.description ? (
                                                        <Text style={cardBody}>
                                                            {product.description}
                                                        </Text>
                                                    ) : null}
                                                    <Link href={product.url} style={cardLink}>
                                                        View product
                                                    </Link>
                                                </Section>
                                            </Section>
                                        </Column>
                                    ))
                                )}
                            </Row>
                        ))}
                    </Section>

                    <Section style={buttonWrap}>
                        <Button href={ctaUrl} style={button}>
                            Explore all new arrivals
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footerWrap}>
                        <Text style={footerTitle}>The Renivet Team</Text>
                        <Text style={footerText}>
                            Thoughtful products, better stories, and more conscious
                            shopping.
                        </Text>
                        <Text style={footerLinks}>
                            <Link href="https://renivet.com" style={footerLink}>
                                renivet.com
                            </Link>
                            {"  "}{"|"}{"  "}
                            <Link
                                href={`mailto:${siteConfig.contact.email}`}
                                style={footerLink}
                            >
                                {siteConfig.contact.email}
                            </Link>
                        </Text>
                        <Text style={unsubscribeText}>
                            <Link href={unsubscribeUrl} style={unsubscribeLink}>
                                Unsubscribe from marketing emails
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const main = {
    backgroundColor: "#f3f4f6",
    fontFamily:
        "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif",
    margin: "0",
    padding: "32px 12px",
};

const container = {
    margin: "0 auto",
    maxWidth: "760px",
};

const brandBar = {
    padding: "0 0 18px",
    textAlign: "center" as const,
};

const logo = {
    display: "block",
    margin: "0 auto 10px",
};

const brandLabel = {
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.18em",
    margin: "0",
    textTransform: "uppercase" as const,
};

const heroCard = {
    background:
        "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(239,246,255,1) 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "34px 36px",
};

const eyebrow = {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    margin: "0 0 14px",
    textTransform: "uppercase" as const,
};

const heading = {
    color: "#0f172a",
    fontSize: "34px",
    fontWeight: "700",
    letterSpacing: "-0.03em",
    lineHeight: "40px",
    margin: "0 0 16px",
};

const paragraph = {
    color: "#475569",
    fontSize: "16px",
    lineHeight: "27px",
    margin: "0",
};

const listWrap = {
    margin: "22px 0 0",
};

const gridRow = {
    marginBottom: "18px",
    textAlign: "center" as const,
};

const gridColumn = {
    padding: "0 9px",
    verticalAlign: "top" as const,
    width: "50%",
};

const singleGridColumn = {
    margin: "0 auto",
    padding: "0 9px",
    verticalAlign: "top" as const,
    width: "50%",
};

const card = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    overflow: "hidden" as const,
    padding: "0",
};

const cardContentColumn = {
    padding: "16px 16px 18px",
};

const cardImage = {
    display: "block",
    height: "248px",
    objectFit: "contain" as const,
    width: "248px",
};

const imageFallback = {
    alignItems: "center",
    background:
        "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
    display: "flex",
    height: "248px",
    justifyContent: "center",
    width: "248px",
};

const imageFallbackText = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    margin: "0",
    textTransform: "uppercase" as const,
};

const cardTitle = {
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: "700",
    lineHeight: "26px",
    margin: "0 0 8px",
};

const cardMeta = {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.02em",
    margin: "0 0 12px",
    textTransform: "uppercase" as const,
};

const cardBody = {
    color: "#334155",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 14px",
};

const cardLink = {
    color: "#0f766e",
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
};

const buttonWrap = {
    margin: "34px 0 0",
    textAlign: "center" as const,
};

const button = {
    backgroundColor: "#111827",
    borderRadius: "12px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    padding: "16px 34px",
    textDecoration: "none",
};

const divider = {
    borderColor: "#dbe3ee",
    margin: "34px 0 26px",
};

const footerWrap = {
    padding: "0 8px 18px",
    textAlign: "center" as const,
};

const footerTitle = {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 8px",
};

const footerText = {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 10px",
};

const footerLinks = {
    color: "#64748b",
    fontSize: "13px",
    margin: "0 0 16px",
};

const footerLink = {
    color: "#0f766e",
    textDecoration: "none",
};

const unsubscribeText = {
    color: "#94a3b8",
    fontSize: "12px",
    margin: "0",
};

const unsubscribeLink = {
    color: "#94a3b8",
    textDecoration: "underline",
};
