"use client";

import { TableBan } from "@/components/dashboard/brands/bans";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    ban: TableBan;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BanRemoveModal({ ban, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.brands.bans.getBannedMembers.useQuery({
        brandId: ban.brandId,
        limit,
        page,
        search,
    });

    const { mutate: unbanMember, isPending: isUnbanning } =
        trpc.brands.bans.unbanMember.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Unbanning member...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Member unbanned", { id: toastId });
                setIsOpen(false);
                router.refresh();
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to unban this user?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Unbanning this user will allow them to join the brand
                        again.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isUnbanning}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isUnbanning}
                        onClick={() =>
                            unbanMember({
                                memberId: ban.member.id,
                                brandId: ban.brandId,
                            })
                        }
                    >
                        Unban
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
