"use client";

import { useState } from "react";
import { useSignUp, SignUp } from "@clerk/nextjs";

function CustomPhoneSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  if (!isLoaded) return null;

  // Utility → format phone number with +91 if missing
  const formatPhone = (number: string) => {
    let trimmed = number.trim();
    if (!trimmed.startsWith("+")) {
      trimmed = "+91" + trimmed.replace(/^0+/, ""); // remove leading 0 if present
    }
    return trimmed;
  };

  // Step 1 → Request OTP
  const handlePhoneSubmit = async () => {
    try {
      const formatted = formatPhone(phoneNumber);
      await signUp.create({ phoneNumber: formatted });
      await signUp.preparePhoneNumberVerification();
      setStep("otp");
    } catch (err) {
      console.error("Error sending OTP:", err);
    }
  };

  // Step 2 → Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const attempt = await signUp.attemptPhoneNumberVerification({
        code: otpCode,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
      } else {
        setStep("details");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
    }
  };

  // Step 3 → Add name + password + fallback email
  const handleFinish = async () => {
    try {
      const formatted = formatPhone(phoneNumber);
      const defaultPassword = `${formatted}@123`;

      // create a dummy email if email is required
      const dummyEmail = formatted.replace(/\D/g, "") + "@gmail.com";

      await signUp.update({
        firstName: firstName || "User",
        lastName: lastName || "Test",
        emailAddress: dummyEmail,
        password: defaultPassword,
      });

    } catch (err) {
      console.error("Error finishing signup:", err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border rounded-2xl shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Create Account with Phone
      </h2>
      <p className="text-center text-gray-500 text-sm">
        Sign up securely using your mobile number
      </p>

      {step === "phone" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-500"
          />
          <button
            onClick={handlePhoneSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Send OTP
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Enter OTP
          </label>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter the OTP you received"
            className="w-full p-3 border rounded-lg focus:ring focus:ring-green-300 focus:border-green-500"
          />
          <button
            onClick={handleVerifyOtp}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Verify OTP
          </button>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            className="w-full p-3 border rounded-lg focus:ring focus:ring-purple-300 focus:border-purple-500"
          />

          <label className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            className="w-full p-3 border rounded-lg focus:ring focus:ring-purple-300 focus:border-purple-500"
          />

          <button
            onClick={handleFinish}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Finish Sign Up
          </button>
        </div>
      )}
    </div>
  );
}

// Wrapper page
export default function CustomSignUpPage() {
  return (
    <div className="flex flex-col gap-10 items-center justify-center w-full min-h-screen bg-gray-50 py-10">
      {/* Phone OTP Signup */}
      <CustomPhoneSignUp />

      <div className="w-full max-w-md flex items-center gap-2">
        <div className="flex-grow h-px bg-gray-300"></div>
        <span className="text-gray-500 text-sm">OR</span>
        <div className="flex-grow h-px bg-gray-300"></div>
      </div>
      {/* Google + Email */}
        <SignUp routing="hash" signInUrl="/auth/signin" />
    </div>
  );
}


