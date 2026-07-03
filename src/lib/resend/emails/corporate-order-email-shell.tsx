import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const palette = {
    bg: "#f8fafc",          // Slate-50: Clean and modern background
    panel: "#ffffff",       // Pure white for the card
    ink: "#0f172a",         // Slate-900: High-readability text
    muted: "#475569",       // Slate-600: Secondary text
    brand: "#2d3121",       // Renivet Brand Green
    brandLight: "#f4f6f0",  // Soft sage green highlight
    line: "#e2e8f0",        // Slate-200: Subtle divider lines
    dark: "#0f172a",        // Slate-900: Secondary dark action background
};

export function CorporateOrderEmailShell({
    preview,
    eyebrow,
    title,
    intro,
    primaryAction,
    secondaryAction,
    children,
    footer,
}: {
    preview: string;
    eyebrow: string;
    title: string;
    intro: string;
    primaryAction?: { href: string; label: string };
    secondaryAction?: { href: string; label: string };
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body
                style={{
                    backgroundColor: palette.bg,
                    fontFamily:
                        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    margin: 0,
                    padding: "40px 0",
                    color: palette.ink,
                }}
            >
                <Container
                    style={{
                        maxWidth: "600px", // 600px is the gold standard for HTML emails
                        margin: "0 auto",
                        backgroundColor: palette.panel,
                        border: `1px solid ${palette.line}`,
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                    }}
                >
                    <Section
                        style={{
                            backgroundColor: palette.brand,
                            padding: "40px 40px 36px",
                            color: "#ffffff",
                            textAlign: "center" as const,
                        }}
                    >
                        <Img
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw"
                            alt="Renivet"
                            width={64}
                            height={64}
                            style={{
                                margin: "0 auto 20px",
                                display: "block",
                            }}
                        />
                        <Text
                            style={{
                                margin: 0,
                                fontSize: "11px",
                                letterSpacing: "0.25em",
                                textTransform: "uppercase",
                                color: "#c0c4b9",
                                fontWeight: 600,
                            }}
                        >
                            {eyebrow}
                        </Text>
                        <Text
                            style={{
                                margin: "12px 0 0",
                                fontSize: "26px",
                                lineHeight: "34px",
                                fontWeight: 700,
                                color: "#ffffff",
                            }}
                        >
                            {title}
                        </Text>
                        <Text
                            style={{
                                margin: "12px 0 0",
                                fontSize: "14px",
                                lineHeight: "22px",
                                color: "#f4f6f0",
                            }}
                        >
                            {intro}
                        </Text>
                    </Section>

                    <Section style={{ padding: "32px 40px 16px" }}>
                        {children}
                    </Section>

                    {primaryAction || secondaryAction ? (
                        <Section style={{ padding: "8px 40px 16px", textAlign: "center" as const }}>
                            {primaryAction ? (
                                <Button
                                    href={primaryAction.href}
                                    style={{
                                        backgroundColor: palette.brand,
                                        color: "#ffffff",
                                        padding: "12px 24px",
                                        borderRadius: "6px",
                                        textDecoration: "none",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        marginRight: secondaryAction ? "12px" : "0",
                                        display: "inline-block",
                                    }}
                                >
                                    {primaryAction.label}
                                </Button>
                            ) : null}
                            {secondaryAction ? (
                                <Button
                                    href={secondaryAction.href}
                                    style={{
                                        backgroundColor: "#ffffff",
                                        color: palette.ink,
                                        border: `1px solid ${palette.line}`,
                                        padding: "12px 24px",
                                        borderRadius: "6px",
                                        textDecoration: "none",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        display: "inline-block",
                                    }}
                                >
                                    {secondaryAction.label}
                                </Button>
                            ) : null}
                        </Section>
                    ) : null}

                    <Section style={{ padding: "16px 40px 40px" }}>
                        <Hr
                            style={{
                                borderColor: palette.line,
                                margin: "0 0 20px",
                            }}
                        />
                        {footer ?? (
                            <Text
                                style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    lineHeight: "20px",
                                    color: palette.muted,
                                    textAlign: "center" as const,
                                }}
                            >
                                Renivet Corporate Desk
                            </Text>
                        )}
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export function EmailMetricGrid({
    items,
}: {
    items: Array<{ label: string; value: string }>;
}) {
    return (
        <Section style={{ marginBottom: "20px" }}>
            {items.map((item) => (
                <Section
                    key={item.label}
                    style={{
                        display: "inline-block",
                        width: "47%",
                        minWidth: "220px",
                        verticalAlign: "top",
                        margin: "0 10px 12px 0",
                        padding: "16px 20px",
                        borderRadius: "8px",
                        backgroundColor: "#fafafa",
                        border: `1px solid ${palette.line}`,
                    }}
                >
                    <Text
                        style={{
                            margin: 0,
                            fontSize: "11px",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: palette.muted,
                            fontWeight: 600,
                        }}
                    >
                        {item.label}
                    </Text>
                    <Text
                        style={{
                            margin: "8px 0 0",
                            fontSize: "18px",
                            lineHeight: "24px",
                            fontWeight: 700,
                            color: palette.ink,
                        }}
                    >
                        {item.value}
                    </Text>
                </Section>
            ))}
        </Section>
    );
}

export function EmailDetailCard({
    title,
    rows,
}: {
    title: string;
    rows: Array<{ label: string; value: string }>;
}) {
    return (
        <Section
            style={{
                marginBottom: "20px",
                padding: "20px 24px",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                border: `1px solid ${palette.line}`,
            }}
        >
            <Text
                style={{
                    margin: "0 0 12px 0",
                    fontSize: "12px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: palette.brand,
                    fontWeight: 700,
                }}
            >
                {title}
            </Text>
            {rows.map((row, idx) => (
                <Section
                    key={`${title}-${row.label}`}
                    style={{
                        paddingTop: idx === 0 ? "0px" : "12px",
                        borderTop: idx === 0 ? "none" : `1px solid ${palette.line}`,
                        paddingBottom: "12px",
                    }}
                >
                    <Text
                        style={{
                            margin: 0,
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: palette.muted,
                            fontWeight: 600,
                        }}
                    >
                        {row.label}
                    </Text>
                    <Text
                        style={{
                            margin: "4px 0 0",
                            fontSize: "14px",
                            lineHeight: "20px",
                            color: palette.ink,
                            fontWeight: 500,
                        }}
                    >
                        {row.value}
                    </Text>
                </Section>
            ))}
        </Section>
    );
}

export function EmailNote({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Section
            style={{
                marginTop: "16px",
                padding: "16px 20px",
                borderRadius: "8px",
                backgroundColor: palette.brandLight,
                borderLeft: `4px solid ${palette.brand}`,
            }}
        >
            <Text
                style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: "22px",
                    color: palette.ink,
                }}
            >
                {children}
            </Text>
        </Section>
    );
}
