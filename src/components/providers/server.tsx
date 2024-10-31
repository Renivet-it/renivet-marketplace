import { ClerkProvider } from "@clerk/nextjs";

export function ServerProvider({ children }: LayoutProps) {
    return <ClerkProvider dynamic>{children}</ClerkProvider>;
}
