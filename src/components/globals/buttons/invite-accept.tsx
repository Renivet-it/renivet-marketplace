"use client";

import { acceptBrandInvite } from "@/actions";
import { Button } from "@/components/ui/button-general";
import { handleClientError } from "@/lib/utils";
import { CachedUser, InviteWithBrand } from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PageProps {
    user: CachedUser;
    invite: InviteWithBrand;
}

export function InviteAcceptButton({ user, invite }: PageProps) {
    const router = useRouter();

    const { mutate: acceptInvite, isPaused: isInviteAccepting } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Joining brand...");
            return { toastId };
        },
        mutationFn: acceptBrandInvite,
        onSuccess: (_, __, { toastId }) => {
            toast.success(`You have joined ${invite.brand.name}`, {
                id: toastId,
            });
            router.push(`/dashboard/brands/${invite.brand.id}`);
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Button
            disabled={isInviteAccepting}
            onClick={() =>
                acceptInvite({
                    brandId: invite.brand.id,
                    memberId: user.id,
                    code: invite.id,
                })
            }
        >
            Accept Invite
        </Button>
    );
}
