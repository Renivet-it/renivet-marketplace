import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AdminPageIntro({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[32px] border border-[#d9e4ef] bg-[linear-gradient(135deg,#ffffff_0%,#f6f9fc_42%,#edf4fb_100%)] shadow-[0_28px_80px_-52px_rgba(44,63,88,0.35)]">
            <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)] xl:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#5B9BD5]">
                        {eyebrow}
                    </p>
                    <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
                        {description}
                    </p>
                </div>
                {actions ? <div className="xl:justify-self-end">{actions}</div> : null}
            </div>
        </section>
    );
}

export function AdminMetricGrid({
    items,
}: {
    items: Array<{ label: string; value: string; tone?: "blue" | "gold" | "slate" }>;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {items.map((item) => (
                <div
                    key={item.label}
                    className={cn(
                        "rounded-[24px] border bg-white p-5 shadow-sm",
                        item.tone === "gold" && "border-[#e6d9bf] bg-[#fffdf8]",
                        item.tone === "blue" && "border-[#d7e6f5] bg-[#f8fbff]",
                        (!item.tone || item.tone === "slate") && "border-slate-200"
                    )}
                >
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {item.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</div>
                </div>
            ))}
        </div>
    );
}

export function AdminPanel({
    title,
    description,
    actions,
    children,
    className,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6", className)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

export function StatusBadge({
    children,
    tone = "slate",
}: {
    children: ReactNode;
    tone?: "green" | "amber" | "blue" | "rose" | "slate";
}) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
                tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
                tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700",
                tone === "slate" && "border-slate-200 bg-slate-50 text-slate-700"
            )}
        >
            {children}
        </span>
    );
}

export function EmptyQueue({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-500">{description}</div>
        </div>
    );
}
