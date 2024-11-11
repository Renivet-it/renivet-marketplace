import { uploadRouter } from "@/app/api/uploadthing/core";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

export function ServerProvider({ children }: LayoutProps) {
    return (
        <ClerkProvider dynamic>
            <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
            {children}
        </ClerkProvider>
    );
}
