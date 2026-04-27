interface PageProps {
    specification: Record<string, string>;
}

export default function ProductSpecification({ specification }: PageProps) {
    return (
        <div className="border-b border-neutral-200 pb-3">
            <label className="pb-1 text-xs font-semibold uppercase leading-none tracking-[0.08em] text-neutral-500">
                {specification.key}
            </label>
            <p className="text-sm capitalize leading-[1.4] text-neutral-900">
                {specification.value}
            </p>
        </div>
    );
}
