import { getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        firstName: string;
        lastName: string;
    };
}

export default function AccountCreated({
    user = { firstName: "John", lastName: "Doe" },
}: Props) {
    return (
        <Layout
            preview="Your account has been created"
            heading="Welcome to Renivet"
        >
            <p>
                Hi {user.firstName} {user.lastName},
            </p>

            <p>
                Your account has been created. You can now start using Renivet
                and purchase your favorite products.
            </p>

            <div className="mt-10">
                <Button
                    href={getAbsoluteURL("/shop")}
                    className="bg-brand px-10 py-3 text-white"
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "block",
                        width: "fit-content",
                    }}
                >
                    Shop Now
                </Button>
            </div>
        </Layout>
    );
}
