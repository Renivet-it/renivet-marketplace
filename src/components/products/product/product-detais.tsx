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
                                onClick={() => setShowAllSpecifications(!showAllSpecifications)}
                                className="cursor-pointer text-14 font-bold capitalize text-radical-red"
                            >
                                {showAllSpecifications ? "See Less" : "See More"}
                            </button>
                        </div>
                    )}
            </div>
        </div>
    );
}
