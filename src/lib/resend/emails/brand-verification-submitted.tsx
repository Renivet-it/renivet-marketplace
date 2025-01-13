import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        firstName: string;
        lastName: string;
    };
    brand: {
        id: string;
        name: string;
        status: string;
    };
}

export default function BrandVerificationtSubmitted({
    user = { firstName: "John", lastName: "Doe" },
    brand = {
        id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
        name: "Brand",
        status: "pending",
    },
}: Props) {
    return (
        <Layout
            heading="Brand Verification Request Submitted"
            preview="Your brand verification request has been submitted"
        >
            <p>
                Hi {user.firstName} {user.lastName},
            </p>

            <p>
                Your brand verification request has been submitted. We will
                review your request and get back to you as soon as possible.
            </p>

            <div className="mt-10">
                <Button
                    href={getAbsoluteURL(
                        `/dashboard/brands/${brand.id}/verification`
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
