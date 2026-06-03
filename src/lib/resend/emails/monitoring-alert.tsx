import { getAbsoluteURL } from "@/lib/utils";
import { Button, Hr, Section, Text } from "@react-email/components";
import Layout from "./layout";

type AlertSeverity = "info" | "warning" | "critical";

interface MonitoringAlertEmailProps {
    severity: AlertSeverity;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    alertType?: string | null;
    dueAt?: Date | string | null;
    acknowledgedDueAt?: Date | string | null;
    href?: string | null;
}

const severityCopy: Record<
    AlertSeverity,
    {
        label: string;
        textClassName: string;
        bgClassName: string;
        borderClassName: string;
        intro: string;
    }
> = {
    critical: {
        label: "Critical",
        textClassName: "text-red-700",
        bgClassName: "bg-red-50",
        borderClassName: "border-red-200",
        intro: "This alert needs immediate ownership and follow-up.",
    },
    warning: {
        label: "Warning",
        textClassName: "text-amber-700",
        bgClassName: "bg-amber-50",
        borderClassName: "border-amber-200",
        intro: "This alert needs attention before it breaches SLA.",
    },
    info: {
        label: "Info",
        textClassName: "text-slate-700",
        bgClassName: "bg-slate-50",
        borderClassName: "border-slate-200",
        intro: "This monitoring update is available for review.",
    },
};

function formatAlertDate(value?: Date | string | null) {
    if (!value) return "Not set";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function humanize(value?: string | null) {
    if (!value) return "Monitoring alert";
    return value
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function MonitoringAlertEmail({
    severity,
    title,
    message,
    entityType,
    entityId,
    alertType,
    dueAt,
    acknowledgedDueAt,
    href = "/dashboard/general/monitoring-sla",
}: MonitoringAlertEmailProps) {
    const severityMeta = severityCopy[severity];
    const absoluteHref = href
        ? href.startsWith("http")
            ? href
            : getAbsoluteURL(href)
        : null;
    const subject = `[${severityMeta.label}] ${title}`;

    return (
        <Layout preview={subject} heading={title}>
            <Text className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Monitoring SLA Alert
            </Text>

            <Section
                className={`mt-5 rounded-2xl border p-5 ${severityMeta.bgClassName} ${severityMeta.borderClassName}`}
            >
                <Text
                    className={`m-0 text-xs font-semibold uppercase tracking-[0.18em] ${severityMeta.textClassName}`}
                >
                    {severityMeta.label} Priority
                </Text>
                <Text className="mb-0 mt-3 text-base leading-7 text-slate-800">
                    {severityMeta.intro}
                </Text>
                <Text className="mb-0 mt-2 text-sm leading-6 text-slate-700">
                    {message}
                </Text>
            </Section>

            <Section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <Text className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Alert Details
                </Text>

                {[
                    ["Alert Type", humanize(alertType)],
                    ["Entity", `${humanize(entityType)} ${entityId}`],
                    ["Acknowledge By", formatAlertDate(acknowledgedDueAt)],
                    ["Resolve By", formatAlertDate(dueAt)],
                ].map(([label, value], index) => (
                    <div
                        key={label}
                        style={{
                            marginTop: index === 0 ? "16px" : "12px",
                            paddingTop: index === 0 ? "0" : "12px",
                            borderTop:
                                index === 0 ? "none" : "1px solid #E2E8F0",
                        }}
                    >
                        <Text className="m-0 text-11 font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {label}
                        </Text>
                        <Text className="m-0 mt-1 text-sm leading-6 text-slate-700">
                            {value}
                        </Text>
                    </div>
                ))}
            </Section>

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
                            Open Monitoring Dashboard
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
                This automated alert was generated by Renivet monitoring. Please
                acknowledge ownership in the dashboard after review.
            </Text>
        </Layout>
    );
}
