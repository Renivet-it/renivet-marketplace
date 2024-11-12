"use client";

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
import { NewsletterSubscriber } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    subscriber: NewsletterSubscriber;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function SubscriberDeleteModal({
    subscriber,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const { refetch } =
        trpc.newsletterSubscribers.getNewsletterSubscribers.useQuery({
            page,
            limit,
        });

    const { mutate: deleteSubscriber, isPending: isDeleting } =
        trpc.newsletterSubscribers.deleteNewsletterSubscriber.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting subscriber...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Subscriber deleted", { id: toastId });
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
                        Are you sure you want to delete this subscriber?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this subscriber will remove it from the
                        subscribers list. This action cannot be undone.
                        {subscriber.isActive && (
                            <>
                                <br />
                                <br />
                                <span>
                                    {" "}
                                    This subscriber is currently active.
                                    Deleting this subscriber will remove it from
                                    the active subscribers list.
                                </span>
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => deleteSubscriber({ id: subscriber.id })}
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
