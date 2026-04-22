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
  ctaText = "Explore Renivet",
}) => (
  <Layout preview="Discover responsible fashion & lifestyle brands. Only on Renivet.">
    {/* Greeting */}
    <p style={greetingStyle}>Hi {firstName},</p>

    {/* Dynamic Email Content from ReactQuill — used when admin writes custom content */}
    {emailContent && emailContent.trim() !== "<p><br></p>" ? (
      <div
        style={dynamicSectionStyle}
        dangerouslySetInnerHTML={{
          __html: injectResponsiveImageStyles(emailContent),
        }}
      />
    ) : (
      /* ── Default Campaign Template ── */
      <>
        {/* Headline */}
        <h1 style={headlineStyle}>
          Trying a new brand shouldn&apos;t feel risky.
        </h1>

        {/* Body paragraphs */}
        <p style={bodyStyle}>Discovering new brands is exciting.</p>
        <p style={bodyStyle}>But it can also feel uncertain.</p>

        <p style={bodyStyle}>
          Will the quality be good?
          <br />
          Will it look the same in real life?
          <br />
          Is the brand trustworthy?
        </p>

        <p style={bodyStyle}>
          So most of us end up going back to what&apos;s familiar.
        </p>

        <p style={bodyStyle}>
          That&apos;s exactly why we built{" "}
          <strong style={{ color: "#111" }}>Renivet</strong>.
        </p>

        <p style={bodyStyle}>
          A curated marketplace where you can discover fashion and lifestyle
          brands from across India — brands built with craftsmanship, care, and
          thoughtful production.
        </p>

        <p style={bodyStyle}>
          And to make your first step easier, we&apos;re offering:
        </p>

        {/* Offer Block */}
        <div style={offerBlockStyle}>
          <p style={offerAmountStyle}>₹1000 OFF your first order</p>
          <p style={offerConditionStyle}>on purchases above ₹3000.</p>
        </div>

        <p style={{ ...bodyStyle, marginTop: "24px" }}>
          A small invitation to explore something new.
        </p>
      </>
    )}

    {/* Optional additional message */}
    {additionalMessage && (
      <p style={bodyStyle}>{additionalMessage}</p>
    )}

    {/* CTA Button */}
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <a href="https://renivet.com" style={ctaButtonStyle}>
        {ctaText}
      </a>
    </div>

    {/* Footer Line */}
    <p style={footerLineStyle}>
      Discover responsible fashion &amp; lifestyle brands.
      <br />
      Only on Renivet.
    </p>
  </Layout>
);

function injectResponsiveImageStyles(html: string) {
  return html.replace(
    /<img(.*?)>/g,
    '<img$1 style="max-width:100%;height:auto;display:block;margin:28px auto;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,0.08);" />'
  );
}

// --- Styles ---
const greetingStyle: React.CSSProperties = {
  fontSize: "17px",
  margin: "0 0 24px 0",
  color: "#2C3E50",
  lineHeight: 1.8,
};

const headlineStyle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  color: "#111111",
  margin: "0 0 24px 0",
  lineHeight: 1.3,
};

const bodyStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#444444",
  lineHeight: 1.9,
  margin: "0 0 16px 0",
};

const dynamicSectionStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#333",
  lineHeight: 1.8,
  marginBottom: "24px",
};

const offerBlockStyle: React.CSSProperties = {
  backgroundColor: "#F5F0EB",
  borderLeft: "4px solid #111111",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "28px 0",
  textAlign: "center" as const,
};

const offerAmountStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#111111",
  margin: "0 0 6px 0",
};

const offerConditionStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#666666",
  margin: 0,
};

const ctaButtonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#111111",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 40px",
  borderRadius: "6px",
  textDecoration: "none",
  letterSpacing: "0.3px",
};

const footerLineStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#999999",
  textAlign: "center" as const,
  marginTop: "36px",
  lineHeight: 1.8,
};
