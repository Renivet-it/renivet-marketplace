import { SVGProps, useId } from "react";

export function RenivetText({
    width,
    height,
    className,
    ...props
}: SVGProps<SVGSVGElement>) {
    const id = useId();

    return (
        <svg
            id={`Renivet-Text-${id}`}
            data-name="Renivet-Text"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1300 255.67"
            height={height || 1300}
            width={width || 256}
            className={className}
            {...props}
        >
            <path d="m115.16,255.52l-34.86-50.35h-38.47v50.35H0V74.78h78.23c48.28,0,78.49,25.05,78.49,65.58,0,27.11-13.68,46.99-37.18,57.06l40.54,58.09h-44.93Zm-39.25-146.66h-34.08v63h34.08c25.56,0,38.47-11.88,38.47-31.5s-12.91-31.5-38.47-31.5Zm181.24,38.74v-.05h-41.55v32.59h41.55v-.02h83.93v-32.52h-83.93Zm0,74.35v-.07h-41.55v33.65h139.94v-33.58h-98.39Zm-41.55-147.16v33.58h41.55v-.02h95.02v-33.55h-136.58Zm789.79,72.81v-.05h-41.55v32.59h41.55v-.02h83.93v-32.52h-83.93Zm0,74.35v-.07h-41.55v33.65h139.94v-33.58h-98.39Zm-41.55-147.16v33.58h41.55v-.02h95.02v-33.55h-136.58Zm-383.42,0v180.74h-34.34l-90.11-109.73v109.73h-41.31V74.78h34.6l89.85,109.73v-109.73h41.31Zm65.87-.15l-.05,181.04h40.29l.02-181.04h-40.27Zm276.75.15l-78.23,180.74h-41.31l-77.97-180.74h45.18l54.99,129.1,55.77-129.1h41.57Zm277.29,34.08h-57.84v-34.08h157.5v34.08h-57.84v146.66h-41.83V108.86ZM666.42,0c-14.6,0-24.39,9.53-24.39,21.86s9.79,21.86,24.39,21.86,24.39-9.56,24.39-22.62c0-12.08-9.81-21.11-24.39-21.11Z" />
        </svg>
    );
}
