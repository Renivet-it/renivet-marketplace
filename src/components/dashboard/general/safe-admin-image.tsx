import Image from "next/image";

export function isRenderableImageUrl(value: unknown): value is string {
    if (typeof value !== "string" || value.trim().length === 0) return false;

    return (
        value.startsWith("/") ||
        value.startsWith("http://") ||
        value.startsWith("https://")
    );
}

export function AdminImagePlaceholder({
    fill,
    label = "No image",
}: {
    fill?: boolean;
    label?: string;
}) {
    return (
        <div
            className={
                fill
                    ? "absolute inset-0 flex items-center justify-center rounded-md bg-muted text-[10px] font-medium uppercase text-muted-foreground"
                    : "flex size-10 items-center justify-center rounded-md bg-muted text-[10px] font-medium uppercase text-muted-foreground"
            }
        >
            {label}
        </div>
    );
}

export function SafeAdminImage({
    alt,
    className = "object-cover",
    fill,
    height,
    placeholderLabel,
    src,
    width,
}: {
    alt: string;
    className?: string;
    fill?: boolean;
    height?: number;
    placeholderLabel?: string;
    src: unknown;
    width?: number;
}) {
    if (!isRenderableImageUrl(src)) {
        return <AdminImagePlaceholder fill={fill} label={placeholderLabel} />;
    }

    if (fill) {
        return <Image src={src} alt={alt} fill className={className} />;
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={width ?? 40}
            height={height ?? 40}
            className={className}
        />
    );
}
