"use client";

import { IframeHTMLAttributes } from "react";

type MapIframeProps = IframeHTMLAttributes<HTMLIFrameElement>;

export function MapIframe({
    width = 600,
    height = 450,
    ...props
}: MapIframeProps) {
    return (
        <iframe
            width={width}
            height={height}
            style={{ border: 0 }}
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            {...props}
        />
    );
}
