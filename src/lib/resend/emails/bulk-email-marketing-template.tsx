import React from "react";
import Layout from "./email-layout";

interface EmailTemplateProps {
  firstName: string;
  discount: string;
  expiryDate: string;
  brandName: string;
  emailContent: string;
  additionalMessage?: string;
  ctaText?: string;
}

export const DynamicMarketingEmailTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = ({
  firstName,
  discount,
  expiryDate,
  brandName,
  emailContent,
  additionalMessage,
  ctaText = "Shop Now",
}) => (
  <Layout preview={`${brandName} | Personalized Offer`}>
    {/* Greeting */}
    <p style={greetingStyle}>Hi {firstName},</p>

    {/* Dynamic Email Content */}
    <div
      style={dynamicSectionStyle}
      dangerouslySetInnerHTML={{
        __html: injectResponsiveImageStyles(emailContent),
      }}
    />

    {/* Optional message */}
    {additionalMessage && <p style={paragraphStyle}>{additionalMessage}</p>}


    {/* CTA */}
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <a href="https://renivet.com" style={ctaButtonStyle}>
        {ctaText}
      </a>
    </div>
  </Layout>
);

function injectResponsiveImageStyles(html: string) {
  return html.replace(
    /<img(.*?)>/g,
    "<img$1 style=\"max-width:100%;height:auto;display:block;margin:28px auto;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,0.08);\" />"
  );
}

// --- Styles ---
const greetingStyle = {
  fontSize: "18px",
  margin: "0 0 24px 0",
  color: "#2C3E50",
  lineHeight: 1.8,
};

const dynamicSectionStyle = {
  fontSize: "16px",
  color: "#333",
  lineHeight: 1.8,
  marginBottom: "24px",
};

const paragraphStyle = {
  fontSize: "16px",
  color: "#555",
  marginBottom: "24px",
};

const urgentText = {
  fontSize: "15px",
  color: "#E63946",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  marginTop: "16px",
};

const ctaButtonStyle = {
  display: "inline-block",
  backgroundColor: "#007BFF",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  padding: "14px 38px",
  borderRadius: "8px",
  textDecoration: "none",
  boxShadow: "0 3px 8px rgba(0, 123, 255, 0.25)",
};
