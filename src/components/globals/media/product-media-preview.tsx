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
    const proxySource = mediaId ? getAdminMediaProxyUrl(mediaId) : src;
    const [source, setSource] = useState(proxySource);
    const [hasRetried, setHasRetried] = useState(false);

    useEffect(() => {
        setSource(mediaId ? getAdminMediaProxyUrl(mediaId) : src);
        setHasRetried(false);
    }, [mediaId, src]);

    return (
        // Persisted admin media loads through the authenticated same-origin
        // route first. Fall back to the original URL for newly uploaded or
        // legacy records that are not available through the proxy yet.
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
                    setSource(src);
                }
            }}
        />
    );
}
