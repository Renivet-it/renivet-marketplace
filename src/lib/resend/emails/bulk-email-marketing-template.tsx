import React from "react";
import Layout from "./layout";

interface EmailTemplateProps {
  firstName: string;
  discount: string;
  expiryDate: string;
  brandName: string;
  additionalMessage?: string;
  ctaText?: string;
}

export const MarketingEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  discount,
  expiryDate,
  brandName,
  ctaText = "Redeem Now", // Default value for ctaText
}) => (
  <Layout
    preview={`${discount}% OFF at ${brandName}`}
    heading="Special Offer For You"
  >
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Personalized Greeting */}
        <p style={greetingStyle}>Hi {firstName},</p>
        {/* Opening Paragraph */}
        <p style={paragraphStyle}>
          We are thrilled to introduce something special — just for you.
        </p>
        {/* Discount Highlight */}
        <div style={discountContainer}>
          <p style={discountText}>{discount}% OFF</p>
          <p style={offerText}>on your next purchase at {brandName}</p>
        </div>
        {/* Main Content */}
        <p style={paragraphStyle}>
          Whether you are upgrading your tools or exploring something new, now is the perfect time.
        </p>
        {/* Urgency Section */}
        <p style={urgentText}>
          But hurry — this offer is valid only until {expiryDate}!
        </p>
        {/* Call-to-Action Button */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a
            href="https://renivet.com" // Placeholder URL, to be replaced in sendBulkEmail
            style={ctaButtonStyle}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </div>
  </Layout>
);

// Styles
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