import { siteConfig } from "@/config/site";
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Tailwind,
} from "@react-email/components";

interface Props extends LayoutProps {
    preview: string;
    heading: string;
}

export default function Layout({ children, heading, preview }: Props) {
    return (
        <Html>
            <Preview>{preview}</Preview>

            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#2d3121",
                            },
                        },
                    },
                }}
            >
                <Head />
                <Body className="font-sans">
                    <div className="bg-gray-200 p-4 md:p-5 md:py-10">
                        <Container>
                            <div>
                                <Img
                                    src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw"
                                    alt={siteConfig.name}
                                    width={70}
                                    height={70}
                                    style={{
                                        marginLeft: "auto",
                                        marginRight: "auto",
                                    }}
                                />
                            </div>

                            <div className="mt-5 bg-white p-4 md:mt-10 md:p-8">
                                <Heading
                                    as="h1"
                                    className="m-0 text-xl md:text-2xl"
                                >
                                    {heading}
                                </Heading>

                                <div className="mt-2 md:mt-5">
                                    {children}

                                    <div className="mt-5">
                                        <p className="my-0">Regards,</p>
                                        <p className="my-0">
                                            {siteConfig.name} Team
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="mt-10"
                                style={{
                                    width: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        width: "fit-content",
                                        marginLeft: "auto",
                                        marginRight: "auto",
                                    }}
                                >
                                    {siteConfig?.links?.Facebook && (
                                        <Link
                                            href={siteConfig.links.Facebook}
                                            className="bg-brand mx-1 flex items-center justify-center rounded-full p-2 text-white"
                                        >
                                            <Img
                                                src="https://img.icons8.com/?size=100&id=87311&format=png&color=FFFFFF"
                                                alt="Facebook"
                                                width={20}
                                                height={20}
                                            />
                                        </Link>
                                    )}

                                    {siteConfig?.links?.Twitter && (
                                        <Link
                                            href={siteConfig.links.Twitter}
                                            className="bg-brand mx-1 flex items-center justify-center rounded-full p-2 text-white"
                                        >
                                            <Img
                                                src="https://img.icons8.com/?size=100&id=A4DsujzAX4rw&format=png&color=FFFFFF"
                                                alt="X"
                                                width={20}
                                                height={20}
                                            />
                                        </Link>
                                    )}

                                    {siteConfig?.links?.Instagram && (
                                        <Link
                                            href={siteConfig.links.Instagram}
                                            className="bg-brand mx-1 flex items-center justify-center rounded-full p-2 text-white"
                                        >
                                            <Img
                                                src="https://img.icons8.com/?size=100&id=32292&format=png&color=FFFFFF"
                                                alt="Instagram"
                                                width={20}
                                                height={20}
                                            />
                                        </Link>
                                    )}

                                    {siteConfig?.links?.Linkedin && (
                                        <Link
                                            href={siteConfig.links.Linkedin}
                                            className="bg-brand mx-1 flex items-center justify-center rounded-full p-2 text-white"
                                        >
                                            <Img
                                                src="https://img.icons8.com/?size=100&id=8808&format=png&color=FFFFFF"
                                                alt="LinkedIn"
                                                width={20}
                                                height={20}
                                            />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <p
                                style={{
                                    margin: "8px 0 0 0",
                                    textAlign: "center",
                                    fontSize: "14px",
                                    color: "rgba(0, 0, 0, 0.6)",
                                }}
                            >
                                <span>
                                    Copyright &copy; {new Date().getFullYear()}{" "}
                                    {siteConfig.name}
                                </span>{" "}
                                <span>|</span> <span>All Rights Reserved</span>
                            </p>

                            <div
                                className="mt-5"
                                style={{
                                    textAlign: "center",
                                    fontSize: "14px",
                                }}
                            >
                                <p style={{ margin: "0" }}>
                                    We love hearing from you!
                                </p>
                                <p style={{ margin: "4px 0 0 0" }}>
                                    Have any questions or feedback? Feel free to{" "}
                                    <Link
                                        href={`mailto:${siteConfig.contact.email}`}
                                        className="text-brand underline"
                                    >
                                        contact us
                                    </Link>
                                    .
                                </p>
                            </div>
                        </Container>
                    </div>
                </Body>
            </Tailwind>
        </Html>
    );
}
