import { getAbsoluteURL } from "@/lib/utils";
import { Button, Hr, Section, Text } from "@react-email/components";
import Layout from "./layout";

interface SupportNotificationEmailProps {
    subject?: string;
    intro: string;
    details?: string[];
    href?: string | null;
    actionLabel?: string;
    eyebrow?: string;
    footerNote?: string;
}

export default function SupportNotificationEmail({
    subject = "Support update from Renivet",
    intro,
    details = [],
    href,
    actionLabel = "Open support case",
    eyebrow = "Support Update",
    footerNote = "This is an automated update from the Renivet support team.",
}: SupportNotificationEmailProps) {
    const absoluteHref = href
        ? href.startsWith("http")
            ? href
            : getAbsoluteURL(href)
        : null;

    return (
        <Layout preview={subject} heading={subject}>
            <Text className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {eyebrow}
            </Text>

            <Text className="mb-0 mt-4 text-base leading-7 text-slate-700">
                {intro}
            </Text>

            {details.length > 0 && (
                <Section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <Text className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Case Summary
                    </Text>
                    {details.map((detail, index) => {
                        const [label, ...rest] = detail.split(":");
                        const value = rest.join(":").trim();
                        const hasLabelValue =
                            rest.length > 0 && value.length > 0;

                        return (
                            <div
                                key={`${detail}-${index}`}
                                style={{
                                    marginBottom:
                                        index === details.length - 1
                                            ? "0"
                                            : "12px",
                                    paddingBottom:
                                        index === details.length - 1
                                            ? "0"
                                            : "12px",
                                    borderBottom:
                                        index === details.length - 1
                                            ? "none"
                                            : "1px solid #E2E8F0",
                                }}
                            >
                                {hasLabelValue ? (
                                    <>
                                        <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            {label}
                                        </Text>
                                        <Text className="m-0 mt-1 text-sm leading-6 text-slate-700">
                                            {value}
                                        </Text>
                                    </>
                                ) : (
                                    <Text className="m-0 text-sm leading-6 text-slate-700">
                                        {detail}
                                    </Text>
                                )}
                            </div>
                        );
                    })}
                </Section>
            )}

            {absoluteHref && (
                <>
                    <div className="mt-8">
                        <Button
                            href={absoluteHref}
                            className="bg-brand px-8 py-3 text-white"
                            style={{
                                display: "inline-block",
                                borderRadius: "999px",
                                textDecoration: "none",
                                fontWeight: "600",
                            }}
                        >
                            {actionLabel}
                        </Button>
                    </div>

                    <Text className="mb-0 mt-4 text-xs leading-6 text-slate-500">
                        If the button does not work, copy and open this link:
                    </Text>
                    <Text className="mt-1 text-xs leading-6 text-slate-500">
                        {absoluteHref}
                    </Text>
                </>
            )}

            <Hr className="my-8 border-slate-200" />

            <Text className="m-0 text-sm leading-6 text-slate-500">
                {footerNote}
            </Text>
        </Layout>
    );
}
