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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    CreatedBannedBrandMember,
    createdBannedBrandMemberSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    data: TableMember;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function MemberBanModal({ data, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const form = useForm<CreatedBannedBrandMember>({
        resolver: zodResolver(createdBannedBrandMemberSchema),
        defaultValues: {
            brandId: data.brandId,
            memberId: data.memberId,
            reason: "",
        },
    });

    const { refetch } = trpc.brands.members.getMembers.useQuery({
        brandId: data.brandId,
        limit,
        page,
        search,
    });

    const { mutate: banMember, isPending: isBanning } =
        trpc.brands.members.banMember.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Banning member...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Member banned", { id: toastId });
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
                        Are you sure you want to ban this member?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Banning this member will remove them from the brand and
                        prevent them from rejoining.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit((data) => banMember(data))}
                    >
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>

                                    <FormControl>
                                        <Textarea
                                            minRows={3}
                                            placeholder="Enter a reason for banning this member..."
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <AlertDialogFooter>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isBanning}
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isBanning}
                            >
                                Ban
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
