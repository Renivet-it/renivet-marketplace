"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-dash";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CachedBrand } from "@/lib/validations";
import Image from "next/image";

interface PageProps {
    brand: CachedBrand;
}

export function PublicPage({ brand }: PageProps) {
    return (
        <>
            <div className="">
                <div
                    className={cn(
                        "flex aspect-[4/1] items-center justify-center overflow-hidden rounded-md border border-secondary",
                        !brand.coverUrl && "bg-muted"
                    )}
                >
                    {brand.coverUrl ? (
                        <Image
                            src={brand.coverUrl}
                            alt="Pottery Design"
                            height={2000}
                            width={2000}
                            className="size-full object-cover"
                        />
                    ) : (
                        <Button size="sm">
                            <Icons.Upload />
                            Upload Cover
                        </Button>
                    )}
                </div>

                <div className="flex -translate-y-5 items-center justify-between gap-5 px-10">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-32 border-2 border-secondary">
                            <AvatarImage
                                src={brand.logoUrl}
                                alt="Brand Logo"
                                className="size-full"
                            />
                            <AvatarFallback>{brand.name[0]}</AvatarFallback>
                        </Avatar>

                        <div>
                            <h3 className="text-2xl font-bold">{brand.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                @{brand.slug}
                            </p>
                        </div>
                    </div>

                    <div>
                        <Button size="sm">
                            <Icons.Forward />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            <Separator className="-translate-y-5" />

            <div className="grid -translate-y-5 grid-cols-5 gap-5">
                <div className="col-span-2 h-52 bg-red-500"></div>
                <div className="col-span-3 h-52 bg-red-500"></div>
            </div>
        </>
    );
}
