import { siteConfig } from "@/config/site";
import {
  Body,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Tailwind,
} from "@react-email/components";

interface Props {
  children: React.ReactNode;
  preview: string;
}

export default function Layout({ children, preview }: Props) {
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
        <Body className="font-sans bg-gray-200">
          <div className="p-6 md:p-10">
            {/* --- Logo Section --- */}
            <div className="text-center mb-6">
              <Img
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw"
                alt={siteConfig.name}
                width={90}
                height={90}
                style={{
                  margin: "0 auto",
                  display: "block",
                }}
              />
            </div>

            {/* --- Main Content Card (wider) --- */}
            <div
              className="bg-white shadow-md mx-auto"
              style={{
                maxWidth: "800px",
                borderRadius: "16px",
                padding: "48px",
              }}
            >
              {children}

              {/* --- Footer Section (Warm regards + Contact) --- */}
              <div style={{ marginTop: "40px" }}>
                <p className="my-0">Warm regards,</p>
                <p className="my-0 font-semibold">The Renivet Team 🌿</p>
                <p className="my-0">📩 support@renivet.com</p>
                <p className="my-0">🌐 www.renivet.com</p>
              </div>
            </div>

            {/* --- Social Icons --- */}
            <div
              style={{
                marginTop: "48px",
                display: "flex",
                justifyContent: "center",
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

            {/* --- Copyright + Contact --- */}
            <p
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "14px",
                color: "rgba(0,0,0,0.6)",
              }}
            >
              <span>
                Copyright © {new Date().getFullYear()} {siteConfig.name}
              </span>{" "}
              <span>|</span> <span>All Rights Reserved</span>
            </p>

            <div
              className="mt-5"
              style={{
                textAlign: "center",
                fontSize: "14px",
                color: "#444",
              }}
            >
              <p style={{ margin: "0" }}>We love hearing from you!</p>
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
          </div>
        </Body>
      </Tailwind>
    </Html>
  );
}
