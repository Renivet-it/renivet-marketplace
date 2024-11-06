"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-general";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-general";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_MESSAGES } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, handleClientError } from "@/lib/utils";
import {
    UpdateUserGeneral,
    updateUserGeneralSchema,
    UserWithAddressesAndRoles,
} from "@/lib/validations";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import { ElementRef, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";

interface PageProps {
    user: UserWithAddressesAndRoles;
}

export function UserGeneralUpdateForm({ user }: PageProps) {
    const [preview, setPreview] = useState<string | null>(user.avatarUrl);
    const [file, setFile] = useState<File | null>(null);

    const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();

    const avatarInputRef = useRef<ElementRef<"input">>(null!);

    const form = useForm<UpdateUserGeneral>({
        resolver: zodResolver(updateUserGeneralSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
        },
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    }, []);

    const { routeConfig } = useUploadThing("profilePictureUploader");

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 4 * 1024 * 1024,
    });

    const { mutateAsync: updateUserAsync } =
        trpc.users.updateUserGeneral.useMutation();

    const { mutate: updateUser, isPending: isUserUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Saving changes...");
            return { toastId };
        },
        mutationFn: async (values: UpdateUserGeneral) => {
            if (!isClerkUserLoaded || !clerkUser)
                throw new Error(DEFAULT_MESSAGES.ERRORS.USER_FETCHING);

            if (file) {
                const { publicUrl } = await clerkUser.setProfileImage({
                    file,
                });

                values.avatarUrl = publicUrl;
            }

            return await updateUserAsync(values);
        },
        onSuccess: (_, data, { toastId }) => {
            toast.success("Changes saved successfully", { id: toastId });
            form.reset(data);
            clerkUser?.reload();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => updateUser(values))}>
                <Separator />

                <CardContent className="space-y-6 pt-6">
                    <FormField
                        control={form.control}
                        name="avatarUrl"
                        render={() => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex items-center gap-5">
                                        <div
                                            {...getRootProps()}
                                            className={cn(
                                                "relative cursor-pointer border-2 border-dashed border-input text-center",
                                                isDragActive &&
                                                    "border-green-500 bg-green-50",
                                                preview && "border-0 p-0",
                                                isUserUpdating &&
                                                    "cursor-not-allowed opacity-50"
                                            )}
                                            onClick={() =>
                                                avatarInputRef.current.click()
                                            }
                                        >
                                            <input
                                                {...getInputProps()}
                                                ref={avatarInputRef}
                                                disabled={isUserUpdating}
                                            />

                                            {preview ? (
                                                <Avatar className="size-20">
                                                    <AvatarImage
                                                        src={preview}
                                                        alt={user.firstName}
                                                    />
                                                    <AvatarFallback>
                                                        {user.firstName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="flex aspect-square size-20 items-center justify-center p-4">
                                                    <Icons.CloudUpload className="size-8 md:size-10" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col items-center gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={isUserUpdating}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        avatarInputRef.current.click();
                                                    }}
                                                >
                                                    {preview
                                                        ? "Change Image"
                                                        : "Upload Image"}
                                                </Button>

                                                <p className="text-xs text-muted-foreground">
                                                    (Max 4MB)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor={field.name}>
                                        First Name
                                    </FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="John"
                                            disabled={isUserUpdating}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor={field.name}>
                                        Last Name
                                    </FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Doe"
                                            disabled={isUserUpdating}
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>

                <Separator
                    className={cn(!form.formState.isDirty && "hidden")}
                />

                <CardFooter
                    className={cn(
                        "justify-end gap-2 py-4 transition-all ease-in-out",
                        !form.formState.isDirty && "p-0 opacity-0"
                    )}
                >
                    <Button
                        type="reset"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            !form.formState.isDirty && "pointer-events-none h-0"
                        )}
                        disabled={isUserUpdating || !form.formState.isDirty}
                        onClick={() => form.reset()}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        size="sm"
                        className={cn(
                            !form.formState.isDirty && "pointer-events-none h-0"
                        )}
                        disabled={isUserUpdating || !form.formState.isDirty}
                    >
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}
