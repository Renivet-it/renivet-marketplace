"use client";

import { Icons } from "@/components/icons";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { cn, convertValueToLabel } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import Link from "next/link";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    product: ProductWithBrand;
}

export function ProductPassport({ className, product, ...props }: PageProps) {
    return (
        <div className={cn("space-y-6 pt-6", className)} {...props}>
            <div className="space-y-2 text-balance text-center">
                <h3 className="text-2xl font-semibold md:text-3xl">
                DecodeX - Behind the Product
                </h3>
                <p className="text-sm text-muted-foreground md:text-base">
                    With total transparency, we want to tell our community the
                    story and the impact behind every single product to help you
                    make better and conscious decisions.
                </p>
            </div>

            <div className="grid gap-10 md:grid-cols-5">
                <div className="space-y-4 md:col-span-3">
                    <h4 className="text-xl font-semibold">Product Values</h4>

                    {product.values?.data && product.values.data.length > 0 ? (
                        <Accordion type="single" collapsible>
                            {product.values.data.map((value) => (
                                <AccordionItem
                                    key={value.title}
                                    value={value.title}
                                >
                                    <AccordionTrigger className="gap-4 text-lg hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <Icons.Shield
                                                className={cn(
                                                    "size-4",
                                                    value.status === "verified"
                                                        ? "text-green-500"
                                                        : "text-yellow-500"
                                                )}
                                            />
                                            {value.title}
                                            <Badge
                                                variant={
                                                    value.status === "verified"
                                                        ? "secondary"
                                                        : "destructive"
                                                }
                                            >
                                                {convertValueToLabel(
                                                    value.status
                                                )}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="space-y-4">
                                        <p className="text-muted-foreground">
                                            {value.description}
                                        </p>

                                        <Button
                                            asChild
                                            variant="link"
                                            className="h-auto p-0"
                                        >
                                            <Link
                                                href={value.docUrl}
                                                target="_blank"
                                            >
                                                <Icons.FileText className="mr-2 size-4" />
                                                View Certificate
                                            </Link>
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-muted-foreground">
                           Coming Soon
                        </p>
                    )}
                </div>

                {/* Product Journey */}
                <div className="space-y-4 md:col-span-2">
                    <h4 className="text-xl font-semibold">Product Journey</h4>
                    {product.journey?.data &&
                    product.journey.data.length > 0 ? (
                        <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-40px)] before:w-0.5 before:bg-border">
                            {product.journey.data.map((journey) => (
                                <div key={journey.title} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="absolute -left-0.5 size-6 rounded-full border bg-background" />
                                        <h5 className="font-medium">
                                            {journey.title}
                                        </h5>
                                    </div>

                                    {journey.entries.length > 0 && (
                                        <div className="space-y-3">
                                            {journey.entries.map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    className="rounded-lg border p-3"
                                                >
                                                    <div className="mb-2 font-medium">
                                                        {entry.name}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Icons.MapPin className="size-3" />
                                                            {entry.location}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                           Coming Soon
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
