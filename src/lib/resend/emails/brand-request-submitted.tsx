import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    brand: {
        name: string;
        status: string;
    };
}

export default function BrandRequestSubmitted({
    user = { name: "John Doe" },
    brand = { name: "Brand", status: "pending" },
}: Props) {
    return (
        <Layout
            heading="Brand Request Submitted"
            preview="Your brand request has been submitted"
        >
            <p>Hi {user.name},</p>

            <p>
                Your brand details have landed safely in our inbox! 🚀
                We&apos;re now on a mission to review your submission and will
                circle back with you faster than a spinning bobbin.
            </p>

            <p>Thanks for adding your spark to our sustainable revolution!</p>

            <div className="mt-10">
                <Button
                    href={getAbsoluteURL("/become-a-seller")}
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
