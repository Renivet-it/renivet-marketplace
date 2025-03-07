import { convertValueToLabel, getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    brand: {
        id: string;
        name: string;
        status: string;
    };
}

export default function BrandVerificationtSubmitted({
    user = { name: "John Doe" },
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
            <p>Hi {user.name},</p>

            <p>
                Your brand verification request is now zooming through our
                system! We&apos;re on it and will circle back with you as soon
                as we&apos;ve dotted the i&apos;s and crossed the t&apos;s.
            </p>

            <p>
                Hang tight - we&apos;ll update you in no time, and soon
                you&apos;ll be all set to showcase your fabulous products on
                Renivet!
            </p>

            <p>
                Thanks for your patience as we make sure everything is tip-top.
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
