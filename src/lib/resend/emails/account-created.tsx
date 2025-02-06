import { getAbsoluteURL } from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        firstName: string;
        lastName: string;
    };
    addCode: boolean;
}

const code = process.env.FIRST_100_CODE;

export default function AccountCreated({
    user = { firstName: "John", lastName: "Doe" },
    addCode = false,
}: Props) {
    return (
        <Layout
            preview="Your account has been created"
            heading="Welcome to Renivet"
        >
            <p>
                Hi {user.firstName} {user.lastName},
            </p>

            <p>Buckle up! Your Renivet account is all set. 🚀</p>

            {addCode && !!code?.length && (
                <div>
                    <p>
                        As one of our first 100 customers, use the code below to
                        get a special discount on your first purchase.
                    </p>

                    <div className="bg-gray-100 p-4 text-center">
                        <p className="text-lg font-bold">{code}</p>
                    </div>
                </div>
            )}

            <p>
                Get ready to explore, engage, and enjoy. We can&apos;t wait to
                see the magic you&apos;ll create and discover here.
            </p>

            <p>
                Thanks for joining us on this journey of sustainability and
                style.
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
