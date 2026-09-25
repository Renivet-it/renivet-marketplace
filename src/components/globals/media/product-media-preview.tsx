"use client";

import { getAdminMediaProxyUrl } from "@/lib/media/admin-media-source";
import { useEffect, useState } from "react";

interface ProductMediaPreviewProps {
    src: string;
    alt: string;
    className?: string;
    mediaId?: string;
}

export function ProductMediaPreview({
    src,
    alt,
    className,
    mediaId,
}: ProductMediaPreviewProps) {
    const [source, setSource] = useState(src);
    const [hasRetried, setHasRetried] = useState(false);

    useEffect(() => {
        setSource(src);
        setHasRetried(false);
    }, [src]);

    return (
        // Admin media URLs can come from multiple UploadThing app hosts and
        // may be signed. Load the source URL directly so Next's optimizer
        // allowlist and proxy do not delay or reject the preview.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={source}
            alt={alt}
            loading="eager"
            decoding="async"
            className={className}
            onError={() => {
                if (mediaId && !hasRetried) {
                    setHasRetried(true);
                    setSource(getAdminMediaProxyUrl(mediaId));
                }
            }}
        />
    );
}
