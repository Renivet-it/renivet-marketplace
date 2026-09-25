interface ProductMediaPreviewProps {
    src: string;
    alt: string;
    className?: string;
}

export function ProductMediaPreview({
    src,
    alt,
    className,
}: ProductMediaPreviewProps) {
    return (
        // Admin media URLs can come from multiple UploadThing app hosts and
        // may be signed. Load the source URL directly so Next's optimizer
        // allowlist and proxy do not delay or reject the preview.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="async"
            className={className}
        />
    );
}
