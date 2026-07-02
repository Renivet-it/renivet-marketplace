import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const palette = {
    bg: "#f4efe7",
    panel: "#fffdf9",
    ink: "#14213d",
    muted: "#6b7280",
    gold: "#9a6b2f",
    goldSoft: "#efe1cf",
    line: "#e7d9c8",
    dark: "#1f2937",
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
                        "'Georgia', 'Times New Roman', serif",
                    margin: 0,
                    padding: "24px 0",
                    color: palette.ink,
                }}
            >
                <Container
                    style={{
                        maxWidth: "680px",
                        margin: "0 auto",
                        backgroundColor: palette.panel,
                        border: `1px solid ${palette.line}`,
                        borderRadius: "24px",
                        overflow: "hidden",
                        boxShadow: "0 24px 80px rgba(20, 33, 61, 0.08)",
                    }}
                >
                    <Section
                        style={{
                            background:
                                "linear-gradient(135deg, #14213d 0%, #1f325e 55%, #9a6b2f 100%)",
                            padding: "32px 36px 28px",
                            color: "#ffffff",
                        }}
                    >
                        <Text
                            style={{
                                margin: 0,
                                fontSize: "11px",
                                letterSpacing: "0.32em",
                                textTransform: "uppercase",
                                color: "#d8c4a8",
                            }}
                        >
                            {eyebrow}
                        </Text>
                        <Text
                            style={{
                                margin: "14px 0 0",
                                fontSize: "34px",
                                lineHeight: "40px",
                                fontWeight: 700,
                                color: "#ffffff",
                            }}
                        >
                            {title}
                        </Text>
                        <Text
                            style={{
                                margin: "14px 0 0",
                                fontSize: "15px",
                                lineHeight: "26px",
                                color: "#eef2ff",
                            }}
                        >
                            {intro}
                        </Text>
                    </Section>

                    <Section style={{ padding: "30px 36px 12px" }}>
                        {children}
                    </Section>

                    {primaryAction || secondaryAction ? (
                        <Section style={{ padding: "8px 36px 0" }}>
                            {primaryAction ? (
                                <Button
                                    href={primaryAction.href}
                                    style={{
                                        backgroundColor: palette.gold,
                                        color: "#ffffff",
                                        padding: "14px 24px",
                                        borderRadius: "999px",
                                        textDecoration: "none",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        marginRight: secondaryAction ? "12px" : "0",
                                    }}
                                >
                                    {primaryAction.label}
                                </Button>
                            ) : null}
                            {secondaryAction ? (
                                <Button
                                    href={secondaryAction.href}
                                    style={{
                                        backgroundColor: palette.dark,
                                        color: "#ffffff",
                                        padding: "14px 24px",
                                        borderRadius: "999px",
                                        textDecoration: "none",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {secondaryAction.label}
                                </Button>
                            ) : null}
                        </Section>
                    ) : null}

                    <Section style={{ padding: "24px 36px 34px" }}>
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
        <Section style={{ marginBottom: "16px" }}>
            {items.map((item) => (
                <Section
                    key={item.label}
                    style={{
                        display: "inline-block",
                        width: "46%",
                        minWidth: "220px",
                        verticalAlign: "top",
                        margin: "0 12px 12px 0",
                        padding: "16px 18px",
                        borderRadius: "18px",
                        backgroundColor: "#fbf8f2",
                        border: `1px solid ${palette.line}`,
                    }}
                >
                    <Text
                        style={{
                            margin: 0,
                            fontSize: "11px",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: palette.muted,
                        }}
                    >
                        {item.label}
                    </Text>
                    <Text
                        style={{
                            margin: "10px 0 0",
                            fontSize: "20px",
                            lineHeight: "26px",
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
                marginBottom: "16px",
                padding: "18px 20px",
                borderRadius: "20px",
                backgroundColor: "#ffffff",
                border: `1px solid ${palette.line}`,
            }}
        >
            <Text
                style={{
                    margin: 0,
                    fontSize: "12px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: palette.gold,
                    fontWeight: 700,
                }}
            >
                {title}
            </Text>
            {rows.map((row) => (
                <Section
                    key={`${title}-${row.label}`}
                    style={{
                        paddingTop: "12px",
                    }}
                >
                    <Text
                        style={{
                            margin: 0,
                            fontSize: "12px",
                            color: palette.muted,
                        }}
                    >
                        {row.label}
                    </Text>
                    <Text
                        style={{
                            margin: "4px 0 0",
                            fontSize: "15px",
                            lineHeight: "24px",
                            color: palette.ink,
                            fontWeight: 600,
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
                marginTop: "10px",
                padding: "16px 18px",
                borderRadius: "18px",
                backgroundColor: palette.goldSoft,
                border: `1px solid ${palette.line}`,
            }}
        >
            <Text
                style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "24px",
                    color: palette.ink,
                }}
            >
                {children}
            </Text>
        </Section>
    );
}
