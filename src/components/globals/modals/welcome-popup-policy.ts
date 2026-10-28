export function getWelcomePopupDelay({
    pathname,
    hasVisited,
}: {
    pathname: string;
    hasVisited: boolean;
}): number | null {
    if (pathname === "/rewear") return 0;
    return hasVisited ? null : 3000;
}
