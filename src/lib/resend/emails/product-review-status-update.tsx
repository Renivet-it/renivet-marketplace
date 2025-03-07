import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    brand: {
        id: string;
    };
    product:
        | {
              id: string;
              status: "rejected";
              title: string;
              rejectionReason?: string;
          }
        | {
              id: string;
              title: string;
              status: "approved";
          };
}

export default function ProductReviewStatusUpdate({
    user = { name: "John Doe" },
    brand = {
        id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
    },
    product = {
        id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
        title: "R. M. Williams Boots",
        status: "rejected",
        rejectionReason:
            "Please add at least one image of the product. It is hard to verify your product without this.",
    },
    // product = {
    //     id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
    //     title: "R. M. Williams Boots",
    //     status: "approved",
    // },
}: Props) {
    return (
        <Layout
            heading={
                product.status === "approved"
                    ? "Product Approved"
                    : "Product Rejected"
            }
            preview={
                product.status === "approved"
                    ? "Your product is now verified"
                    : "Your product has been rejected"
            }
        >
            <p>Hi {user.name},</p>

            {product.status === "approved" ? (
                <p>
                    Your product is now verified. You can publish it in our
                    marketplace and start selling. Good luck!
                </p>
            ) : (
                <>
                    <p>
                        Your product has been rejected. Please make the
                        necessary changes and resubmit it for verification.
                    </p>

                    <p>
                        <strong>Reason: </strong>
                        {product.rejectionReason ?? "No reason provided"}
                    </p>
                </>
            )}

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
                    {product.status === "approved"
                        ? "Publish Product"
                        : "Resubmit Product"}
                </Button>
            </div>

            <p className="mb-0">
                <strong>Product: </strong>
                {product.title}
            </p>

            <p className="mt-0">
                <strong>Status: </strong>
                {convertValueToLabel(product.status)}
            </p>
        </Layout>
    );
}
