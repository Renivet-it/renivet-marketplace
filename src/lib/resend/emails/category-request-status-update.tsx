import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    category:
        | {
              status: "rejected";
              content: string;
              rejectionReason?: string;
          }
        | {
              content: string;
              status: "approved";
          };
    brand: {
        id: string;
        name: string;
    };
}

export default function CategoryRequestStatusUpdate({
    user = { name: "John Doe" },
    category = {
        content:
            "I want to request a product type, 'ABC', under the category 'XYZ'.",
        status: "rejected",
        rejectionReason:
            "The category 'XYZ' already exists. Please choose a different category.",
    },
    brand = {
        id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
        name: "Brand",
    },
    // brand = {
    //     id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
    //     name: "Brand",
    //     status: "approved",
    // },
}: Props) {
    return (
        <Layout
            heading={
                category.status === "approved"
                    ? "Category Request Approved"
                    : "Category Request Rejected"
            }
            preview={
                category.status === "approved"
                    ? "Your category request has been approved"
                    : "Your category request has been rejected"
            }
        >
            <p>Hi {user.name},</p>

            {category.status === "approved" ? (
                <p>
                    Your category request has been approved. You can now start
                    categorizing your products under your requested category.
                    Good luck!
                </p>
            ) : (
                <>
                    <p>
                        Your category request has been rejected. Please find the
                        reason below:
                    </p>

                    <p>
                        <strong>Reason: </strong>
                        {category.rejectionReason ?? "No reason provided"}
                    </p>
                </>
            )}

            <div className="mt-10">
                <Button
                    href={getAbsoluteURL(`/dashboard/brands/${brand.id}`)}
                    className="bg-brand px-10 py-3 text-white"
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "block",
                        width: "fit-content",
                    }}
                >
                    Start Selling
                </Button>
            </div>

            <p className="mb-0">
                <strong>Brand: </strong>
                {brand.name}
            </p>

            <p className="my-0">
                <strong>Content: </strong>
                {category.content}
            </p>

            <p className="mt-0">
                <strong>Status: </strong>
                {convertValueToLabel(category.status)}
            </p>
        </Layout>
    );
}
