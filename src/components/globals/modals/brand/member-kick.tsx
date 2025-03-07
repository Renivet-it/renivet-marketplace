"use client";

import { TableMember } from "@/components/dashboard/brands/members";
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
    data: TableMember;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function MemberKickModal({ data, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.brands.members.getMembers.useQuery({
        brandId: data.brandId,
        limit,
        page,
        search,
    });

    const { mutate: kickMember, isPending: isKicking } =
        trpc.brands.members.kickMember.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Kicking member...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Member kicked", { id: toastId });
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
                        Are you sure you want to kick this member?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Kicking this member will remove them from the brand, and
                        will loose all roles and permissions. They can be
                        re-invited later.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isKicking}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isKicking}
                        onClick={() =>
                            kickMember({
                                brandId: data.brandId,
                                memberId: data.memberId,
                            })
                        }
                    >
                        Kick
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
