"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Editor, EditorRef } from "@/components/ui/editor";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, generateUploadThingFileUrl, handleClientError } from "@/lib/utils";
import {
    BlogWithAuthorAndTag,
    CreateBlog,
    createBlogSchema,
    Tag,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";

interface PageProps {
    tags: Tag[];
    blog?: Omit<BlogWithAuthorAndTag, "author">;
}

export function BlogManageForm({ tags, blog }: PageProps) {
    const router = useRouter();

    const [preview, setPreview] = useState<string | null>(
        blog?.thumbnailUrl ?? null
    );
    const [file, setFile] = useState<File | null>(null);

    const editorRef = useRef<EditorRef>(null!);

    const { startUpload, routeConfig } = useUploadThing(
        "blogThumbnailUploader"
    );

    const form = useForm<CreateBlog>({
        resolver: zodResolver(createBlogSchema),
        defaultValues: {
            title: blog?.title ?? "",
            description: blog?.description ?? "",
            content: blog?.content ?? "",
            thumbnailUrl: blog?.thumbnailUrl ?? null,
            tagIds: blog?.tags.map((tag) => tag.tag.id) ?? [],
            isPublished: blog?.isPublished ?? false,
        },
        disabled: !tags.length,
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    }, []);

    const removeImage = () => {
        setPreview(null);
        setFile(null);
        form.setValue("thumbnailUrl", null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 4 * 1024 * 1024,
    });

    const { mutateAsync: createBlogAsync } =
        trpc.blogs.createBlog.useMutation();
    const { mutateAsync: updateBlogAsync } =
        trpc.blogs.updateBlog.useMutation();

    const { mutate: createBlog, isPending: isBlogCreating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Creating blog...");
            return { toastId };
        },
        mutationFn: async (values: CreateBlog) => {
            if (file) {
                const res = await startUpload([file]);
                if (!res?.length) throw new Error("Failed to upload image");

                const image = res[0];
                values.thumbnailUrl = generateUploadThingFileUrl(image.key);
            }

            await createBlogAsync(values);
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Blog created successfully", { id: toastId });
            router.push("/dashboard/general/blogs");
            setPreview(null);
            setFile(null);
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: updateBlog, isPending: isBlogUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Updating blog...");
            return { toastId };
        },
        mutationFn: async (values: CreateBlog) => {
            if (!blog) throw new Error("Blog not found");

            if (file) {
                const res = await startUpload([file]);
                if (!res?.length) throw new Error("Failed to upload image");

                const image = res[0];
                values.thumbnailUrl = generateUploadThingFileUrl(image.key);
            }

            await updateBlogAsync({
                id: blog.id,
                data: values,
            });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Blog updated successfully", { id: toastId });
            router.push("/dashboard/general/blogs");
            setPreview(null);
            setFile(null);
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) =>
                    blog ? updateBlog(values) : createBlog(values)
                )}
            >
                {!tags.length && (
                    <Notice>
                        <NoticeContent>
                            <NoticeTitle>
                                <NoticeIcon />
                                Warning
                            </NoticeTitle>

                            <p className="text-sm">
                                No tags found. Please create a tag before
                                creating a blog.
                            </p>
                        </NoticeContent>
                        <NoticeButton asChild>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                    router.push("/dashboard/general/tags")
                                }
                            >
                                Create Tag
                            </Button>
                        </NoticeButton>
                    </Notice>
                )}

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter blog title"
                                    disabled={
                                        isBlogCreating ||
                                        isBlogUpdating ||
                                        !tags.length
                                    }
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>

                            <FormControl>
                                <Textarea
                                    placeholder="Enter a brief description of the blog"
                                    minRows={3}
                                    disabled={
                                        isBlogCreating ||
                                        isBlogUpdating ||
                                        !tags.length
                                    }
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content</FormLabel>

                            <FormControl>
                                <Editor
                                    {...field}
                                    disabled={
                                        isBlogCreating ||
                                        isBlogUpdating ||
                                        !tags.length
                                    }
                                    ref={editorRef}
                                    content={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={() => (
                        <FormItem>
                            <FormLabel>Thumbnail</FormLabel>

                            <FormControl>
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "relative cursor-pointer rounded-md border-2 border-dashed border-input p-8 py-16 text-center",
                                        isDragActive &&
                                            "border-green-500 bg-green-50",
                                        preview && "border-0 p-0",
                                        (isBlogCreating ||
                                            isBlogUpdating ||
                                            !tags.length) &&
                                            "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <input
                                        {...getInputProps()}
                                        disabled={
                                            isBlogCreating ||
                                            isBlogUpdating ||
                                            !tags.length
                                        }
                                    />

                                    {preview ? (
                                        <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                            <Image
                                                src={preview}
                                                alt="Thumbnail preview"
                                                width={1000}
                                                height={1000}
                                                className="size-full object-cover"
                                            />

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-2 size-5 rounded-full bg-white/20 text-background backdrop-blur-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage();
                                                }}
                                            >
                                                <Icons.X className="size-4" />
                                                <span className="sr-only">
                                                    Remove image
                                                </span>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 md:space-y-4">
                                            <div className="flex justify-center">
                                                <Icons.CloudUpload className="size-10 md:size-12" />
                                            </div>

                                            <div className="space-y-1 md:space-y-0">
                                                <p className="text-sm md:text-base">
                                                    Choose a file or Drag and
                                                    Drop
                                                </p>
                                                <p className="text-xs text-muted-foreground md:text-sm">
                                                    Image (4 MB)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tagIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tags</FormLabel>

                            <FormControl>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Button
                                            key={tag.id}
                                            type="button"
                                            size="sm"
                                            disabled={
                                                isBlogCreating ||
                                                isBlogUpdating ||
                                                !tags.length
                                            }
                                            onClick={() => {
                                                const updatedTags =
                                                    field.value.includes(tag.id)
                                                        ? field.value.filter(
                                                              (id) =>
                                                                  id !== tag.id
                                                          )
                                                        : [
                                                              ...field.value,
                                                              tag.id,
                                                          ];
                                                field.onChange(updatedTags);
                                            }}
                                            className={cn(
                                                "rounded-full border border-primary bg-background text-xs text-foreground hover:text-background md:text-sm",
                                                field.value.includes(tag.id) &&
                                                    "bg-primary text-background"
                                            )}
                                        >
                                            {tag.name}
                                        </Button>
                                    ))}
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex w-min flex-row-reverse items-center justify-start gap-2">
                                <FormLabel className="whitespace-nowrap font-semibold">
                                    Published Immediately
                                </FormLabel>

                                <FormControl>
                                    <Switch
                                        disabled={
                                            isBlogCreating ||
                                            isBlogUpdating ||
                                            !tags.length
                                        }
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </div>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={
                        isBlogCreating ||
                        isBlogUpdating ||
                        !tags.length ||
                        (preview === blog?.thumbnailUrl &&
                            !form.formState.isDirty)
                    }
                    className="w-full"
                >
                    {blog ? "Update Blog" : "Create Blog"}
                </Button>
            </form>
        </Form>
    );
}
