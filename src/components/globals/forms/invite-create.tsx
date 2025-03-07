"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogClose, DialogFooter } from "@/components/ui/dialog-dash";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { URLBuilder } from "@/lib/builders";
import { trpc } from "@/lib/trpc/client";
import { cn, getAbsoluteURL, handleClientError } from "@/lib/utils";
import { CreateBrandInvite, createBrandInviteSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    brandId: string;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function InviteCreateForm({ brandId, setIsOpen }: PageProps) {
    const form = useForm<CreateBrandInvite>({
        resolver: zodResolver(createBrandInviteSchema),
        defaultValues: {
            brandId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            maxUses: 0,
        },
    });

    const { refetch } = trpc.brands.invites.getInvites.useQuery({ brandId });

    const { mutate: createInvite, isPending: isInviteCreating } =
        trpc.brands.invites.createInvite.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating invite...");
                return { toastId };
            },
            onSuccess: (data, __, { toastId }) => {
                const inviteLink = new URLBuilder(getAbsoluteURL())
                    .setPathTemplate("/i/:code")
                    .setPathParam("code", data.id)
                    .build();

                navigator.clipboard.writeText(inviteLink);
                toast.success("Invite link generated and copied", {
                    id: toastId,
                });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => createInvite(values))}
            >
                <FormField
                    control={form.control}
                    name="maxUses"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Max Uses</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter max uses"
                                    type="number"
                                    inputMode="numeric"
                                    {...field}
                                    disabled={isInviteCreating}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (isNaN(value)) field.onChange(0);
                                        else field.onChange(value);
                                    }}
                                />
                            </FormControl>

                            <FormDescription>
                                The maximum number of times this invite can be
                                used. Set to 0 for infinite uses.
                            </FormDescription>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-2 space-y-0">
                            <div className="flex items-center justify-between gap-2">
                                <FormLabel>Expires At</FormLabel>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="doNotExpire"
                                        checked={!field.value}
                                        disabled={isInviteCreating}
                                        onCheckedChange={(checked) =>
                                            checked
                                                ? field.onChange(null)
                                                : field.onChange(
                                                      new Date(
                                                          Date.now() +
                                                              7 *
                                                                  24 *
                                                                  60 *
                                                                  60 *
                                                                  1000
                                                      )
                                                  )
                                        }
                                    />
                                    <label
                                        htmlFor="doNotExpire"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        No Expiry
                                    </label>
                                </div>
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal",
                                                !field.value &&
                                                    "text-muted-foreground"
                                            )}
                                            disabled={
                                                !field.value || isInviteCreating
                                            }
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}

                                            <Icons.Calendar className="ml-auto size-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={field.value ?? undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date() ||
                                            !field.value ||
                                            isInviteCreating
                                        }
                                    />
                                </PopoverContent>
                            </Popover>

                            <FormDescription>
                                The date and time this invite will expire. Check
                                &ldquo;No Expiry&rdquo; for an invite that never
                                expires.
                            </FormDescription>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isInviteCreating}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button type="submit" size="sm" disabled={isInviteCreating}>
                        Create
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
