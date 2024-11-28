"use client";

import { deleteBrandDemo, generateBrandDemoLink } from "@/actions";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-dash";
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
import { useMutation } from "@tanstack/react-query";
import Player from "next-video/player";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
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

    const { refetch } = trpc.general.brandsWaitlist.getBrandsWaitlist.useQuery({
        page,
        limit,
        search,
    });

    const { mutate: generateLink, isPending: isGenerating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Generating invite link...");
            return { toastId };
        },
        mutationFn: generateBrandDemoLink,
        onSuccess: (data, _, { toastId }) => {
            toast.success("Invite link generated and copied to clipboard", {
                id: toastId,
            });
            navigator.clipboard.writeText(data);
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: downloadVideo, isPending: isVideoDownloading } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Downloading video, please do not close the window..."
                );
                return { toastId };
            },
            mutationFn: async () => {
                if (!waitlist.demoUrl) throw new Error("No demo video found");

                const response = await fetch(waitlist.demoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;

                const fileName = waitlist.demoUrl.split("/").pop();
                if (!fileName) throw new Error("Invalid file name");

                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Video downloaded successfully", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: deleteVideo, isPending: isDeleting } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Deleting video...");
            return { toastId };
        },
        mutationFn: deleteBrandDemo,
        onSuccess: (_, __, { toastId }) => {
            toast.success("Video deleted successfully", { id: toastId });
            router.refresh();
            refetch();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
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

                    {waitlist.demoUrl && (
                        <div className="space-y-4 text-sm">
                            <div className="space-y-2">
                                <p>Demo Video</p>

                                <Player src={waitlist.demoUrl} />

                                <div className="flex flex-col items-center gap-2 md:flex-row">
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => downloadVideo()}
                                        disabled={isVideoDownloading}
                                    >
                                        <Icons.Download className="size-5" />
                                        Save
                                    </Button>

                                    <Button
                                        size="sm"
                                        className="w-full"
                                        variant="destructive"
                                        disabled={isDeleting}
                                        onClick={() => deleteVideo(waitlist)}
                                    >
                                        <Icons.Trash className="size-5" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <Separator />

                    <Button
                        className="w-full"
                        size="sm"
                        onClick={() => generateLink(waitlist.brandEmail)}
                        disabled={isGenerating}
                    >
                        Generate Demo Link
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
