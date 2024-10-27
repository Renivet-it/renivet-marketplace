import { IncomingHttpHeaders } from "http";
import { Icons } from "@/components/icons";
import { HTMLAttributes, ReactNode } from "react";
import { WebhookRequiredHeaders } from "svix";

declare global {
    type ValueOf<T> = T[keyof T];

    type GenericProps = HTMLAttributes<HTMLElement>;
    type LayoutProps = {
        children: ReactNode;
    };

    type SvixHeaders = IncomingHttpHeaders & WebhookRequiredHeaders;

    type SiteConfig = {
        name: string;
        description: string;
        longDescription?: string;
        og: {
            url: string;
            width: number;
            height: number;
        };
        developer: {
            name: string;
            url: string;
        };
        keywords: string[];
        links?: Partial<Record<keyof typeof Icons, string>>;
        menu: {
            name: string;
            href: string;
            icon: keyof typeof Icons;
            isExternal?: boolean;
        }[];
        footer: {
            menu: {
                name: string;
                items: {
                    name: string;
                    href: string;
                    isExternal?: boolean;
                }[];
            }[];
        };
        contact: {
            officeHours: string;
            email: string;
            phone: string;
            location: string;
        };
    };

    type ExtendedFile<T extends "image" | "video" | "document" = "image", K> = {
        id: string;
        type: T;
        use: K;
        file: File;
        url: string;
    };
}
