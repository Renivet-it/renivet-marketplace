import React from "react";
import Layout from "./layout";

interface EmailTemplateProps {
  firstName: string;
  discount: string;
  expiryDate: string;
  brandName: string;
  emailContent: string; // 🆕 dynamic HTML from Quill
  additionalMessage?: string;
  ctaText?: string;
}

export const DynamicMarketingEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  discount,
  expiryDate,
  brandName,
  emailContent,
  additionalMessage,
  ctaText = "Redeem Now",
}) => (
  <Layout preview={`${discount}% OFF at ${brandName}`} heading="Exclusive Offer Just for You">
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Personalized Greeting */}
        <p style={greetingStyle}>Hi {firstName},</p>

        {/* 🆕 Inject the custom content written in ReactQuill */}
        <div
          style={dynamicSectionStyle}
          dangerouslySetInnerHTML={{ __html: emailContent }}
        />

        {/* Core campaign details */}
        <div style={discountContainer}>
          <p style={discountText}>{discount}% OFF</p>
          <p style={offerText}>on your next purchase at {brandName}</p>
        </div>

        {/* Optional additional message */}
        {additionalMessage && (
          <p style={paragraphStyle}>{additionalMessage}</p>
        )}

        {/* Urgency Section */}
        <p style={urgentText}>
          Hurry! This offer is valid until {expiryDate}.
        </p>

        {/* CTA Button */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a
            href="https://renivet.com" // Replace dynamically if needed later
            style={ctaButtonStyle}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </div>
  </Layout>
);

// --- Styles (copied & extended from your current file) ---
const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  lineHeight: 1.6,
  color: "#333333",
};

const contentStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  padding: "30px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const greetingStyle = {
  fontSize: "16px",
  margin: "0 0 20px 0",
  lineHeight: 1.5,
};

const paragraphStyle = {
  fontSize: "16px",
  margin: "0 0 20px 0",
  lineHeight: 1.5,
};

const discountContainer = {
  backgroundColor: "#F8F9FA",
  borderLeft: "4px solid #3498DB",
  padding: "20px",
  margin: "25px 0",
  borderRadius: "0 4px 4px 0",
};

const discountText = {
  color: "#2C3E50",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0 0 5px 0",
  lineHeight: 1.2,
};

const offerText = {
  color: "#7F8C8D",
  fontSize: "16px",
  margin: "0",
};

const urgentText = {
  ...paragraphStyle,
  color: "#E74C3C",
  fontWeight: "bold" as const,
};

const ctaButtonStyle = {
  display: "inline-block",
  backgroundColor: "#3498DB",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: "bold" as const,
  padding: "12px 24px",
  borderRadius: "4px",
  textDecoration: "none",
  textAlign: "center" as const,
  margin: "0 auto",
};

const dynamicSectionStyle = {
  fontSize: "16px",
  lineHeight: 1.6,
  margin: "0 0 20px 0",
};
