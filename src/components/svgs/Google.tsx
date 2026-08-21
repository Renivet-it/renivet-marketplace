import { SVGProps } from "react";

export function Google({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            focusable="false"
            viewBox="0 0 24 24"
            {...props}
        >
            <path
                d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.94v2.79h3.59c2.1-1.94 3.31-4.79 3.31-7.76Z"
                fill="#4285F4"
            />
            <path
                d="M12 21.73c2.64 0 4.85-.88 6.47-2.39l-3.59-2.79c-.99.67-2.26 1.07-3.88 1.07-2.55 0-4.7-1.72-5.47-4.03H1.82v2.88A9.77 9.77 0 0 0 12 21.73Z"
                fill="#34A853"
            />
            <path
                d="M6.53 13.59A5.88 5.88 0 0 1 6.22 12c0-.55.09-1.08.31-1.59V7.53H1.82A9.72 9.72 0 0 0 1 12c0 1.61.39 3.14 1.08 4.47l4.45-2.88Z"
                fill="#FBBC05"
            />
            <path
                d="M12 6.38c1.44 0 2.73.5 3.74 1.47l3.19-3.19C16.84 2.72 14.64 1.5 12 1.5A9.77 9.77 0 0 0 1.82 7.53l4.71 2.88C7.3 8.1 9.45 6.38 12 6.38Z"
                fill="#EA4335"
            />
        </svg>
    );
}
