"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { FormControl } from "@/components/ui/form";
import { useUploadThing } from "@/lib/uploadthing";
import {
    cn,
    convertBytesToHumanReadable,
    getUploadThingFileKey,
} from "@/lib/utils";
import { CreateBrandConfidential } from "@/lib/validations";
import { useDropzone } from "@uploadthing/react";
import Link from "next/link";
import { Dispatch, SetStateAction, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";

interface PageProps {
    preview: string | null;
    file: File | null;
    setFile: Dispatch<SetStateAction<File | null>>;
    setPreview: Dispatch<SetStateAction<string | null>>;
    form: UseFormReturn<CreateBrandConfidential>;
    isPending: boolean;
}

export function BrandRequestBankVerificationUploaderDropzone({
    preview,
    file,
    setFile,
    setPreview,
    form,
    isPending,
}: PageProps) {
    const inputRef = useRef<HTMLInputElement>(null!);

    const { routeConfig } = useUploadThing("brandRequestDocUploader");

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file)
            return toast.error(
                "Could not upload file, did you select a file? If you did, was it under the size limit?"
            );

        setFile(file);
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        form.setValue("bankAccountVerificationDocumentUrl", previewUrl);
    };

    const removeDoc = () => {
        setFile(null);
        setPreview(null);
        form.setValue("bankAccountVerificationDocumentUrl", "");
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 4 * 1024 * 1024,
    });

    const fileKey = getUploadThingFileKey(preview || "");

    return (
        <>
            {preview && (
                <div className={cn("hidden space-y-2", preview && "block")}>
                    <div className="size-full">
                        <object
                            data={preview}
                            type="application/pdf"
                            width="100%"
                            height={300}
                        >
                            <Link href={preview}>Download Document</Link>
                        </object>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                        <p className="text-sm font-semibold">
                            {file
                                ? `${
                                      file.name.length > 20
                                          ? `${file.name.slice(0, 20)}...`
                                          : file.name
                                  } (${convertBytesToHumanReadable(file.size)})`
                                : fileKey.length > 20
                                  ? `${fileKey.slice(0, 20)}...`
                                  : fileKey}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={removeDoc}
                                disabled={isPending || !file}
                            >
                                Remove Document
                            </Button>
                            <Button
                                type="button"
                                onClick={() => inputRef.current.click()}
                                disabled={isPending}
                            >
                                Change Document
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div
                {...getRootProps()}
                className={cn(
                    "relative cursor-pointer rounded-md border-2 border-dashed border-input p-8 py-16 text-center",
                    isDragActive && "border-green-500 bg-green-50",
                    isPending && "cursor-not-allowed opacity-50",
                    preview && "hidden"
                )}
                onClick={() => inputRef.current.click()}
            >
                <FormControl>
                    <input
                        {...getInputProps()}
                        disabled={isPending}
                        ref={inputRef}
                    />
                </FormControl>

                <div className="space-y-2 md:space-y-4">
                    <div className="flex justify-center">
                        <Icons.CloudUpload className="size-10 md:size-12" />
                    </div>

                    <div className="space-y-1 md:space-y-0">
                        <p className="text-sm md:text-base">
                            Choose a file or Drag and Drop
                        </p>
                        <p className="text-xs text-muted-foreground md:text-sm">
                            Document (4 MB | .pdf)
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
