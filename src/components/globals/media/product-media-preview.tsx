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
    const isLocalPreview = src.startsWith("blob:") || src.startsWith("data:");
    const isPersistedMedia = Boolean(mediaId && !isLocalPreview);
    const fallbackSource = isPersistedMedia
        ? getAdminMediaProxyUrl(mediaId as string)
        : src;
    const [source, setSource] = useState(src);
    const [hasRetried, setHasRetried] = useState(false);

    useEffect(() => {
        setSource(src);
        setHasRetried(false);
    }, [isLocalPreview, mediaId, src]);

    return (
        // Product media is public-read and should render directly. Fall back
        // to the authenticated proxy for legacy/private files only when the
        // public source fails.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={source}
            alt={alt}
            loading="eager"
            decoding="async"
            className={className}
            onError={() => {
                if (isPersistedMedia && !hasRetried) {
                    setHasRetried(true);
                    setSource(fallbackSource);
                }
            }}
        />
    );
}
