import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const renivetLogo = `data:image/png;base64,${readFileSync(
    join(process.cwd(), "public", "favicon-96x96.png")
).toString("base64")}`;

export const alt = "Renivet - Sustainable Marketplace";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "#f8f4ee",
                    color: "#17201c",
                    fontFamily: "Arial, sans-serif",
                    padding: "72px 84px",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(135deg, rgba(35, 91, 73, 0.16), rgba(224, 169, 83, 0.18))",
                    }}
                />
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 18,
                            fontSize: 34,
                            fontWeight: 700,
                        }}
                    >
                        {/* ImageResponse requires a native image element. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            alt="Renivet logo"
                            src={renivetLogo}
                            style={{
                                width: 58,
                                height: 58,
                                borderRadius: 14,
                                objectFit: "contain",
                            }}
                        />
                        Renivet
                    </div>
                    <div
                        style={{
                            border: "2px solid rgba(35, 91, 73, 0.28)",
                            borderRadius: 999,
                            padding: "12px 22px",
                            fontSize: 22,
                            color: "#235b49",
                        }}
                    >
                        Conscious shopping, curated
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 22,
                        maxWidth: 880,
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            fontSize: 78,
                            lineHeight: 1.02,
                            fontWeight: 800,
                            letterSpacing: 0,
                        }}
                    >
                        Sustainable Marketplace for Quality Products
                    </div>
                    <div
                        style={{
                            fontSize: 32,
                            lineHeight: 1.35,
                            color: "#405149",
                        }}
                    >
                        Discover eco-conscious brands, verified sellers, and
                        responsibly sourced products on Renivet.
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "relative",
                        fontSize: 24,
                        color: "#235b49",
                    }}
                >
                    <div>renivet.com</div>
                    <div style={{ display: "flex", gap: 14 }}>
                        <span>Ethical</span>
                        <span>|</span>
                        <span>Transparent</span>
                        <span>|</span>
                        <span>Responsible</span>
                    </div>
                </div>
            </div>
        ),
        size
    );
}
