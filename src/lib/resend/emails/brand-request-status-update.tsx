import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    brand:
        | {
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

export default function BrandRequestStatusUpdate({
    user = { name: "John Doe" },
    // brand = {
    //     name: "Brand",
    //     status: "rejected",
    //     rejectionReason:
    //         "Please add a proper not-blurry logo, and also add a demo video. It is hard to verify your brand without these.",
    // },
    brand = {
        id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
        name: "Brand",
        status: "approved",
    },
}: Props) {
    return (
        <Layout
            heading={
                brand.status === "approved"
                    ? "Brand Request Approved"
                    : "Brand Request Rejected"
            }
            preview={
                brand.status === "approved"
                    ? "Your brand request has been approved"
                    : "Your brand request has been rejected"
            }
        >
            <p>Hi {user.name},</p>

            {brand.status === "approved" ? (
                <>
                    <p>
                        Guess what? Your brand request has been approved! 🌟
                        Now, let&apos;s get you fully set up. Please complete
                        your verification through your dashboard to kick off the
                        product onboarding process.
                    </p>

                    <p>
                        Once your verification is green-lighted, you&apos;re all
                        set to dazzle our community with your products!
                    </p>

                    <p>
                        We can&apos;t wait to see what you bring to the Renivet
                        revolution. Let&apos;s make sustainability stylish
                        together!
                    </p>
                </>
            ) : (
                <>
                    <p>
                        Your brand request has been rejected. Please find the
                        reason below:
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
                            ? getAbsoluteURL(
                                  `/dashboard/brands/${brand?.id}/verification`
                              )
                            : getAbsoluteURL("/become-a-seller")
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
                        ? "Complete Verification"
                        : "Reapply"}
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
