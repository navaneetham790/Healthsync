import { useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { notify } from "./ToastProvider";

export default function PhoneOtpVerification({ phone, onVerified }) {
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const validPhone = /^\d{10}$/.test(String(phone).replace(/\D/g, ""));
  useEffect(() => { setSent(false); setOtp(""); onVerified(null); }, [phone]);
  const send = async () => { if (!validPhone) return notify.warning("Enter a valid 10-digit mobile number first."); setSending(true); try { await AuthService.sendPhoneOtp(phone); setSent(true); notify.success("OTP sent to this mobile number."); } catch (error) { notify.error(error.response?.data?.message || "Unable to send OTP."); } finally { setSending(false); } };
  const verify = async () => { if (!/^\d{6}$/.test(otp)) return notify.warning("Enter the 6-digit OTP."); setVerifying(true); try { const { data } = await AuthService.verifyPhoneOtp(phone, otp); onVerified(data.verificationToken); notify.success("Mobile number verified."); } catch (error) { onVerified(null); notify.error(error.response?.data?.message || "Invalid OTP."); } finally { setVerifying(false); } };
  return <div className="phone-otp-verification"><button type="button" onClick={send} disabled={sending || !validPhone}>{sending ? "Sending OTP..." : sent ? "Resend OTP" : "Send OTP"}</button>{sent && <div><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength="6" placeholder="Enter 6-digit OTP" /><button type="button" onClick={verify} disabled={verifying}>{verifying ? "Verifying..." : "Verify"}</button></div>}</div>;
}
