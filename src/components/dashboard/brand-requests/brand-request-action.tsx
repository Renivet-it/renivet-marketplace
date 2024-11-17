"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-dash";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { DEFAULT_AVATAR_URL } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { hideEmail } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { TableBrandRequests } from "./brand-requests-table";

interface PageProps {
    request: TableBrandRequests;
}

export function BrandRequestAction({ request }: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.brands.requests.getRequests.useQuery({
        page,
        limit,
        search,
    });

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="size-8 p-0">
                    <Icons.Settings2 className="size-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </SheetTrigger>

            <SheetContent className="space-y-4 p-4">
                <SheetHeader>
                    <SheetTitle className="sr-only hidden">
                        Waitlist Actions
                    </SheetTitle>

                    <div className="flex items-center gap-2 text-start">
                        <Avatar>
                            <AvatarImage
                                src={
                                    request.owner.avatarUrl ??
                                    DEFAULT_AVATAR_URL
                                }
                                alt={request.registrant}
                            />
                            <AvatarFallback>
                                {request.registrant[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <p className="text-sm font-semibold">
                                {request.registrant}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {hideEmail(request.registrantEmail)}
                            </p>
                        </div>
                    </div>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    );
}
