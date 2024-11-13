"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { DEFAULT_AVATAR_URL } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertValueToLabel,
    handleClientError,
    hideEmail,
} from "@/lib/utils";
import {
    UpdateBrandWaitlistStatus,
    updateBrandWaitlistStatusSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TableWaitlist } from "./waitlist-table";

interface PageProps {
    waitlist: TableWaitlist;
}

export function WaitlistAction({ waitlist }: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.brandsWaitlist.getBrandsWaitlist.useQuery({
        page,
        limit,
        search,
    });

    const form = useForm<UpdateBrandWaitlistStatus>({
        resolver: zodResolver(updateBrandWaitlistStatusSchema),
        defaultValues: {
            status: waitlist.status,
        },
    });

    const { mutate: updateStatus, isPending: isUpdating } =
        trpc.brandsWaitlist.updateBrandsWaitlistEntryStatus.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Saving changes...");
                return { toastId };
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success("Changes saved successfully", { id: toastId });
                form.reset(data.data);
                refetch();
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Sheet
            onOpenChange={(isOpen) => {
                if (!isOpen) form.reset();
            }}
        >
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
                                src={DEFAULT_AVATAR_URL}
                                alt={waitlist.brandName}
                            />
                            <AvatarFallback>
                                {waitlist.brandName[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <p className="text-sm font-semibold">
                                {waitlist.brandName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {hideEmail(waitlist.brandEmail)}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="grid grid-cols-3 items-center divide-x">
                    {Object.entries({
                        email: waitlist.brandEmail,
                        phone: waitlist.brandPhone,
                        website: waitlist.brandWebsite,
                    }).map(([key, value]) => {
                        const Icon = key.toLowerCase().includes("email")
                            ? Icons.Mail
                            : key.toLowerCase().includes("phone")
                              ? Icons.Phone
                              : key.toLowerCase().includes("website")
                                ? Icons.Globe
                                : Icons.User;

                        return (
                            <button
                                className="flex flex-col items-center gap-1 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:text-foreground/50"
                                key={key}
                                disabled={!value}
                                onClick={() => {
                                    navigator.clipboard.writeText(value!);
                                    return toast.success(
                                        `${convertValueToLabel(
                                            key
                                        )} copied to clipboard`
                                    );
                                }}
                            >
                                <Icon
                                    className={cn(
                                        "size-4",
                                        !value && "text-foreground/50"
                                    )}
                                />
                                Copy {convertValueToLabel(key)}
                            </button>
                        );
                    })}
                </div>

                <Separator />

                <div className="space-y-4 text-sm">
                    <div className="space-y-2">
                        <p>Registrant</p>

                        <div className="space-y-1 rounded-md bg-muted p-4">
                            <div className="flex items-center gap-1">
                                <p className="font-semibold">Name: </p>
                                <p>{waitlist.name}</p>
                            </div>

                            <div className="flex items-center gap-1">
                                <p className="font-semibold">Phone: </p>
                                <p
                                    className="cursor-pointer underline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            waitlist.phone
                                        );
                                        return toast.success(
                                            "Phone number copied to clipboard"
                                        );
                                    }}
                                >
                                    {waitlist.phone}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <p className="font-semibold">Email: </p>
                                <p
                                    className="cursor-pointer underline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            waitlist.email
                                        );
                                        return toast.success(
                                            "Email copied to clipboard"
                                        );
                                    }}
                                >
                                    {waitlist.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <Form {...form}>
                        <form
                            className="space-y-2"
                            onSubmit={form.handleSubmit((values) =>
                                updateStatus({
                                    id: waitlist.id,
                                    data: values,
                                })
                            )}
                        >
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>

                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={
                                                waitlist.status !== "pending" ||
                                                isUpdating
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                {[
                                                    "pending",
                                                    "approved",
                                                    "rejected",
                                                ].map((x) => (
                                                    <SelectItem
                                                        key={x}
                                                        value={x}
                                                        disabled={
                                                            x ===
                                                                waitlist.status ||
                                                            x === "pending"
                                                        }
                                                    >
                                                        {convertValueToLabel(x)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isUpdating || !form.formState.isDirty}
                            >
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
