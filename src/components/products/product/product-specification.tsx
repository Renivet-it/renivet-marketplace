interface PageProps extends GenericProps {
    specification: Record<string, string>;
}
export default function ProductSpecification({
    className,
    specification,
    ...props
}: PageProps) {
    return (
        <div className="spec-item border-b border-[#eaeaec] pb-[10px]">
            <label className="pb-[5px] text-12 capitalize leading-none text-myntra-label">
                {specification.key}
            </label>
            <p className="text-16 capitalize leading-[1.2] text-myntra-primary">
                {specification.value}
            </p>
        </div>
    );
}
