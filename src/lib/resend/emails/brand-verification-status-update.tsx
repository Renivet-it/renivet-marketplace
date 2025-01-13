import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        firstName: string;
        lastName: string;
    };
    brand:
        | {
              id: string;
              status: "rejected";
              name: string;
              rejectionReason?: string;
          }
        | {
              id: string;
              name: string;
              status: "approved";
          };
}

export default function BrandVerificationStatusUpdate({
    user = { firstName: "John", lastName: "Doe" },
    brand = {
        id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
        name: "Brand",
        status: "rejected",
        rejectionReason:
            "Please add a proper not-blurry logo, and also add a demo video. It is hard to verify your brand without these.",
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
                brand.status === "approved"
                    ? "Brand Verified"
                    : "Brand Verification Rejected"
            }
            preview={
                brand.status === "approved"
                    ? "Your brand is now verified"
                    : "Your brand verification request has been rejected"
            }
        >
            <p>
                Hi {user.firstName} {user.lastName},
            </p>

            {brand.status === "approved" ? (
                <p>
                    Your brand is now verified. You can now start selling your
                    products in our marketplace. Good luck!
                </p>
            ) : (
                <>
                    <p>
                        Your brand verification request has been rejected.
                        Please find the reason below:
                    </p>

                    <p>
                        <strong>Reason: </strong>
                        {brand.rejectionReason ?? "No reason provided"}
                    </p>
                </>
            )}

            <div className="mt-10">
                <Button
                    href={
                        brand.status === "approved"
                            ? getAbsoluteURL(`/dashboard/brands/${brand.id}`)
                            : getAbsoluteURL(
                                  `/dashboard/brands/${brand.id}/verification`
                              )
                    }
                    className="bg-brand px-10 py-3 text-white"
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "block",
                        width: "fit-content",
                    }}
                >
                    {brand.status === "approved"
                        ? "Go to Dashboard"
                        : "Resubmit Verification"}
                </Button>
            </div>

            <p className="mb-0">
                <strong>Brand: </strong>
                {brand.name}
            </p>

            <p className="mt-0">
                <strong>Status: </strong>
                {convertValueToLabel(brand.status)}
            </p>
        </Layout>
    );
}
