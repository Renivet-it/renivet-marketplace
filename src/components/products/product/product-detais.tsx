"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { cn, hasItems } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { useEffect, useMemo, useState, type Key } from "react";
import ProductSpecification from "./product-specification";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
}

const STORAGE_KEY = "renivet-pdp-open-accordions";

function htmlToPreview(content: string | null | undefined) {
    const plainText = (content ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return plainText.length > 0 ? plainText : "Details will appear here soon.";
}

function ClosedPreview({ content }: { content: string | null | undefined }) {
    return (
        <p className="line-clamp-3 pr-8 text-[13px] leading-6 text-neutral-500">
            {htmlToPreview(content)}
        </p>
    );
}

export function ProductDetails({ className, product, ...props }: PageProps) {
    const [showAllSpecifications, setShowAllSpecifications] = useState(false);
    const [openItems, setOpenItems] = useState<string[]>(["material-care"]);
    const visibleSpecifications = showAllSpecifications
        ? product.specifications
        : product.specifications?.slice(0, 8);

    useEffect(() => {
        try {
            const rawValue = window.sessionStorage.getItem(STORAGE_KEY);
            if (!rawValue) return;
            const parsedValue = JSON.parse(rawValue) as string[];
            if (Array.isArray(parsedValue) && parsedValue.length > 0) {
                setOpenItems(parsedValue);
            }
        } catch {
            setOpenItems(["material-care"]);
        }
    }, []);

    const syncOpenItems = (value: string[]) => {
        setOpenItems(value);
        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch {
            // no-op
        }
    };

    const returnsPreview = useMemo(() => {
        return [
            htmlToPreview(product.returnExchangePolicy?.returnDescription),
            htmlToPreview(product.returnExchangePolicy?.exchangeDescription),
        ].join(" ");
    }, [product.returnExchangePolicy]);

    return (
        <div className={cn("", className)} {...props}>
            <Accordion
                type="multiple"
                value={openItems}
                onValueChange={syncOpenItems}
                className="w-full"
            >
                <AccordionItem value="details" className="border-b border-neutral-200">
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Product Details
                    </AccordionTrigger>
                    {!openItems.includes("details") && (
                        <ClosedPreview content={product.description} />
                    )}
                    <AccordionContent className="pb-6">
                        <RichTextViewer
                            content={product.description ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                bulletList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                heading:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                            }}
                            editorClasses="pt-1"
                        />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="specifications"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Specs &amp; Features
                    </AccordionTrigger>
                    {!openItems.includes("specifications") && (
                        <ClosedPreview
                            content={
                                hasItems(product.specifications)
                                    ? product.specifications
                                          .map((specification) =>
                                              `${specification.key}: ${specification.value}`.trim()
                                          )
                                          .join(" ")
                                    : null
                            }
                        />
                    )}
                    <AccordionContent className="pb-6">
                        <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-x-10">
                            {hasItems(visibleSpecifications) &&
                                visibleSpecifications.map(
                                    (
                                        specification: Record<string, string>,
                                        idx: Key
                                    ) => (
                                        <ProductSpecification
                                            key={idx}
                                            specification={specification}
                                        />
                                    )
                                )}
                        </div>
                        {hasItems(product.specifications) &&
                            product.specifications.length > 8 && (
                                <div className="mt-4 text-left">
                                    <button
                                        onClick={() =>
                                            setShowAllSpecifications(
                                                !showAllSpecifications
                                            )
                                        }
                                        className="cursor-pointer text-[13px] font-semibold uppercase tracking-[0.08em] text-neutral-900 underline underline-offset-4 transition-colors hover:text-neutral-600"
                                    >
                                        {showAllSpecifications
                                            ? "See Less"
                                            : "See More"}
                                    </button>
                                </div>
                            )}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="material-care"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Materials &amp; Care
                    </AccordionTrigger>
                    {!openItems.includes("material-care") && (
                        <ClosedPreview content={product.materialAndCare} />
                    )}
                    <AccordionContent className="pb-6">
                        <RichTextViewer
                            content={product.materialAndCare ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                bulletList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                heading:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                            }}
                            editorClasses="pt-1"
                        />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fit" className="border-b border-neutral-200">
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Fit
                    </AccordionTrigger>
                    {!openItems.includes("fit") && (
                        <ClosedPreview content={product.sizeAndFit} />
                    )}
                    <AccordionContent className="pb-6">
                        <RichTextViewer
                            content={product.sizeAndFit ?? "<p></p>"}
                            customClasses={{
                                orderedList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                bulletList:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                                heading:
                                    "text-[14px] leading-[1.8] text-neutral-700",
                            }}
                            editorClasses="pt-1"
                        />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem
                    value="return-exchange"
                    className="border-b border-neutral-200"
                >
                    <AccordionTrigger className="py-5 text-left text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-900 hover:no-underline [&[data-state=open]>svg]:rotate-45">
                        Returns &amp; Exchange
                    </AccordionTrigger>
                    {!openItems.includes("return-exchange") && (
                        <ClosedPreview content={returnsPreview} />
                    )}
                    <AccordionContent className="pb-6">
                        <div className="space-y-5">
                            <div>
                                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                                    Return Policy
                                </span>
                                <RichTextViewer
                                    content={
                                        product.returnExchangePolicy
                                            ?.returnDescription ??
                                        "<p>This item is not returnable</p>"
                                    }
                                    customClasses={{
                                        orderedList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        bulletList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        heading:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                    }}
                                    editorClasses="pt-1"
                                />
                            </div>
                            <div>
                                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                                    Exchange Policy
                                </span>
                                <RichTextViewer
                                    content={
                                        product.returnExchangePolicy
                                            ?.exchangeDescription ??
                                        "<p>This item is not exchangeable</p>"
                                    }
                                    customClasses={{
                                        orderedList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        bulletList:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                        heading:
                                            "text-[14px] leading-[1.8] text-neutral-700",
                                    }}
                                    editorClasses="pt-1"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
