import { getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    brand: {
        id: string;
    };
    product: {
        title: string;
    };
}

export default function ProductReviewSubmitted({
    user = { name: "John Doe" },
    brand = { id: "9a49e106-67d0-458c-a441-02bdcf46dd81" },
    product = { title: "R. M. Williams Boots" },
}: Props) {
    return (
        <Layout
            heading="Product Review Request Submitted"
            preview="Your product has been submitted for review"
        >
            <p>Hi {user.name},</p>

            <p>
                Your product <strong>{product.title}</strong> has been submitted
                for review. We will review your product and get back to you as
                soon as possible.
            </p>

            <div className="mt-10">
                <Button
                    href={getAbsoluteURL(
                        `/dashboard/brands/${brand.id}/products`
                    )}
                    className="bg-brand px-10 py-3 text-white"
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "block",
                        width: "fit-content",
                    }}
                >
                    Track Request
                </Button>
            </div>

            <p className="mb-0">
                <strong>Product: </strong>
                {product.title}
            </p>

            <p className="mt-0">
                <strong>Status: </strong>
                Pending
            </p>
        </Layout>
    );
}
