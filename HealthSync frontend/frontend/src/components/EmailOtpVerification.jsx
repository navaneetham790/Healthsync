import { useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { notify } from "./ToastProvider";

export default function EmailOtpVerification({ email, onVerified }) {
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

  useEffect(() => { setSent(false); setOtp(""); setVerified(false); onVerified(null); }, [email, onVerified]);
  const send = async () => {
    if (!validEmail) return notify.warning("Enter a valid email address first.");
    setSending(true);
    try { await AuthService.sendEmailOtp(email); setSent(true); notify.success("Verification code sent to your email."); }
    catch (error) { notify.error(error.response?.data?.message || "Unable to send verification code."); }
    finally { setSending(false); }
  };
  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) return notify.warning("Enter the 6-digit verification code.");
    setVerifying(true);
    try { const { data } = await AuthService.verifyEmailOtp(email, otp); onVerified(data.verificationToken); setVerified(true); notify.success("Email verified successfully."); }
    catch (error) { onVerified(null); setVerified(false); notify.error(error.response?.data?.message || "Incorrect verification code."); }
    finally { setVerifying(false); }
  };
  if (verified) return <small className="phone-verified">Email verified</small>;

  return <div className="phone-otp-verification"><button type="button" onClick={send} disabled={sending || !validEmail}>{sending ? "Sending code..." : sent ? "Resend code" : "Send code to email"}</button>{sent && <div><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength="6" placeholder="Enter 6-digit code" /><button type="button" onClick={verify} disabled={verifying}>{verifying ? "Verifying..." : "Verify code"}</button></div>}</div>;
}
