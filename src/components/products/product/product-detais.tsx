import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { cn, hasItems } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { FileText } from "lucide-react";
import { Key, useState } from "react";
import ProductSpecification from "./product-specification";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
}
export function ProductDetails({ className, product, ...props }: PageProps) {
    const [showAllSpecifications, setShowAllSpecifications] = useState(false);
    const visibleSpecifications = showAllSpecifications
        ? product.specifications
        : product.specifications?.slice(0, 8);
    return (
        <div className={cn("space-y-3", className)}>
            <div className="product-details">
                <div className="description-heading flex gap-[5px]">
                    <h4 className="uppercas text-16 font-bold text-myntra-primary">
                        Product Details
                    </h4>
                    <FileText className="size-5 text-myntra-primary" />
                </div>
                <RichTextViewer
                    content={product.description ?? "<p></p>"}
                    customClasses={{
                        orderedList:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                        bulletList:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                        heading:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                    }}
                    editorClasses="pt-3"
                />
            </div>
            <div className="size-fit-section">
                <h4 className="pb-[5px] text-16 font-bold leading-[1.4] text-myntra-primary">
                    Size & Fit
                </h4>
                <RichTextViewer
                    content={product.sizeAndFit ?? "<p></p>"}
                    customClasses={{
                        orderedList:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                        bulletList:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                        heading:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                    }}
                />
            </div>
            <div className="material-section">
                <h4 className="pb-[5px] text-16 font-bold leading-[1.4] text-myntra-primary">
                    Material & Care
                </h4>
                <RichTextViewer
                    content={product.materialAndCare ?? "<p></p>"}
                    customClasses={{
                        orderedList:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                        bulletList:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                        heading:
                            "text-16 leading-[1.4] text-myntra-primary text-opacity-90",
                    }}
                />
            </div>
            <div className="specification-section">
                <h4 className="pb-[5px] text-16 font-bold leading-[1.4] text-myntra-primary">
                    Specifications
                </h4>
                <div className="spec-list grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-x-[10%]">
                    {hasItems(visibleSpecifications) &&
                        visibleSpecifications.map(
                            (
                                specification: Record<string, string>,
                                idx: Key
                            ) => {
                                return (
                                    <ProductSpecification
                                        key={idx}
                                        specification={specification}
                                    />
                                );
                            }
                        )}
                </div>
                {hasItems(product.specifications) &&
                    product.specifications.length > 8 &&
                    !showAllSpecifications && (
                        <div className="mt-4 text-left">
                            <button
                                onClick={() =>
                                    setShowAllSpecifications(
                                        !showAllSpecifications
                                    )
                                }
                                className="text-14 text-accent cursor-pointer font-bold capitalize"
                            >
                                {showAllSpecifications
                                    ? "See Less"
                                    : "See More"}
                            </button>
                        </div>
                    )}
            </div>

            <div className="collapsible-return-option">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-13 py-5 uppercase hover:no-underline">
                            Return and Exchange
                        </AccordionTrigger>
                        <AccordionContent>
                            <span className="font-bold leading-[1px]">
                                Return
                            </span>
                            <RichTextViewer
                                content={
                                    product.returnExchangePolicy?.returnDescription ??
                                    "<p>This item is not returnable</p>"
                                }
                                customClasses={{
                                    orderedList:
                                        "text-11 leading-[1px] font-[400] text-[#2F2F2F]",
                                    bulletList:
                                        "text-11 leading-[1px] font-[400] text-[#2F2F2F]",
                                    heading:
                                        "text-11 leading-[1px] font-[400] text-[#2F2F2F]",
                                }}
                                editorClasses="pt-3"
                            />
                        </AccordionContent>
                        <AccordionContent>
                            <span className="font-bold leading-[1px]">
                                Exchange
                            </span>
                            <RichTextViewer
                                content={
                                    product.returnExchangePolicy?.exchangeDescription ??
                                    "<p>This item is not exchangeable</p>"
                                }
                                customClasses={{
                                    orderedList:
                                        "text-11 leading-[1px] font-[400] text-[#2F2F2F]",
                                    bulletList:
                                        "text-11 leading-[1px] font-[400] text-[#2F2F2F]",
                                    heading:
                                        "text-11 leading-[1px] font-[400] text-[#2F2F2F]",
                                }}
                                editorClasses="pt-3"
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
