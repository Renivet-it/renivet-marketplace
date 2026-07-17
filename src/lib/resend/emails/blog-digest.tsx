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

interface BlogDigestItem {
    title: string;
    description: string;
    url: string;
    targetKeyword?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
}

const LOGO_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw";

export default function BlogDigestEmail({
    firstName,
    intro,
    ctaUrl,
    posts,
    unsubscribeUrl,
}: {
    firstName: string;
    intro?: string;
    ctaUrl: string;
    posts: BlogDigestItem[];
    unsubscribeUrl: string;
}) {
    return (
        <Html>
            <Head />
            <Preview>New reads from Renivet</Preview>
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
                        <Text style={brandLabel}>Renivet Journal</Text>
                    </Section>

                    <Section style={heroCard}>
                        <Text style={eyebrow}>Fresh stories from the community</Text>
                        <Heading style={heading}>
                            New reads from Renivet, {firstName}
                        </Heading>
                        <Text style={paragraph}>
                            {intro ??
                                "Here is the latest set of stories, explainers, and sustainability reads we have published for the community."}
                        </Text>
                    </Section>

                    <Section style={listWrap}>
                        {posts.map((post) => (
                            <Section key={post.url} style={card}>
                                <Row>
                                    <Column style={cardImageColumn}>
                                        {post.imageUrl ? (
                                            <Img
                                                src={post.imageUrl}
                                                alt={post.imageAlt ?? post.title}
                                                width={160}
                                                height={160}
                                                style={cardImage}
                                            />
                                        ) : (
                                            <Section style={imageFallback}>
                                                <Text style={imageFallbackText}>
                                                    Renivet Story
                                                </Text>
                                            </Section>
                                        )}
                                    </Column>
                                    <Column style={cardContentColumn}>
                                        {post.targetKeyword ? (
                                            <Text style={cardMeta}>
                                                Focus keyword: {post.targetKeyword}
                                            </Text>
                                        ) : null}
                                        <Text style={cardTitle}>{post.title}</Text>
                                        <Text style={cardBody}>{post.description}</Text>
                                        <Link href={post.url} style={cardLink}>
                                            Read article
                                        </Link>
                                    </Column>
                                </Row>
                            </Section>
                        ))}
                    </Section>

                    <Section style={buttonWrap}>
                        <Button href={ctaUrl} style={button}>
                            Explore the blog
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footerWrap}>
                        <Text style={footerTitle}>The Renivet Team</Text>
                        <Text style={footerText}>
                            Better products, better context, and a more conscious way
                            to discover them.
                        </Text>
                        <Text style={footerLinks}>
                            <Link href="https://renivet.com/blogs" style={footerLink}>
                                renivet.com/blogs
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
        "linear-gradient(135deg, rgba(7,89,133,1) 0%, rgba(15,23,42,1) 100%)",
    borderRadius: "24px",
    padding: "40px 42px",
};

const eyebrow = {
    color: "#cbd5e1",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    margin: "0 0 14px",
    textTransform: "uppercase" as const,
};

const heading = {
    color: "#ffffff",
    fontSize: "36px",
    fontWeight: "700",
    letterSpacing: "-0.03em",
    lineHeight: "42px",
    margin: "0 0 16px",
};

const paragraph = {
    color: "#e2e8f0",
    fontSize: "16px",
    lineHeight: "28px",
    margin: "0",
};

const listWrap = {
    margin: "22px 0 0",
};

const card = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    marginBottom: "18px",
    overflow: "hidden" as const,
    padding: "0",
};

const cardImageColumn = {
    padding: "18px 0 18px 18px",
    verticalAlign: "top" as const,
    width: "178px",
};

const cardContentColumn = {
    padding: "18px 18px 18px 16px",
    verticalAlign: "top" as const,
};

const cardImage = {
    borderRadius: "14px",
    display: "block",
    height: "160px",
    objectFit: "cover" as const,
    width: "160px",
};

const imageFallback = {
    alignItems: "center",
    background:
        "linear-gradient(135deg, rgba(224,242,254,1) 0%, rgba(226,232,240,1) 100%)",
    borderRadius: "14px",
    display: "flex",
    height: "160px",
    justifyContent: "center",
    width: "160px",
};

const imageFallbackText = {
    color: "#0369a1",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    margin: "0",
    textTransform: "uppercase" as const,
};

const cardMeta = {
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    margin: "0 0 10px",
    textTransform: "uppercase" as const,
};

const cardTitle = {
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: "28px",
    margin: "0 0 12px",
};

const cardBody = {
    color: "#334155",
    fontSize: "15px",
    lineHeight: "24px",
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
