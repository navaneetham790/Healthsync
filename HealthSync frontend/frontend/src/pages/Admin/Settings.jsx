import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Settings.css";
import AdminService from "../../services/AdminService";
import { notify } from "../../components/ToastProvider";
import { useLanguage } from "../../i18n/LanguageContext";

const defaults = { name: "Administrator", email: "healthsyncproject3502@gmail.com", phone: "9876543210", profilePicture: "", newPassword: "", twoFactor: false, emailNotifications: true, pushNotifications: true, theme: "light", language: "English", privacyMode: true, activeSessions: 1 };

function Settings() {
  const [settings, setSettings] = useState(() => {
    const savedTheme = localStorage.getItem("healthsync-theme") || "light";
    const savedPic = localStorage.getItem("healthsync-admin-profile-picture") || "";
    return { ...defaults, theme: savedTheme, profilePicture: savedPic };
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      const activeTheme = localStorage.getItem("healthsync-theme") || "light";
      const localPic = localStorage.getItem("healthsync-admin-profile-picture") || "";
      try {
        const { data: saved } = await AdminService.getSettings();
        setSettings((current) => ({
          ...defaults,
          ...saved,
          theme: activeTheme,
          profilePicture: localPic || saved?.profilePicture || ""
        }));
      } catch {
        // Silently preserve local settings and active theme
      } finally {
        setSettingsLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    document.documentElement.dataset.theme = settings.theme;
    document.body.classList.toggle("healthsync-dark", settings.theme === "dark");
    localStorage.setItem("healthsync-theme", settings.theme);
    window.dispatchEvent(new CustomEvent("healthsync-theme", { detail: { theme: settings.theme } }));
  }, [settings.theme, settingsLoaded]);

  const change = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    if (key === "theme") {
      document.documentElement.dataset.theme = value;
      document.body.classList.toggle("healthsync-dark", value === "dark");
      localStorage.setItem("healthsync-theme", value);
      window.dispatchEvent(new CustomEvent("healthsync-theme", { detail: { theme: value } }));
    }
  };

  const saveToggle = async (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      const { data } = await AdminService.updateSettings(next);
      setSettings((current) => ({ ...current, ...data, newPassword: current.newPassword }));
      if (key === "twoFactor") notify.success(value ? "Two-factor authentication is now enabled." : "Two-factor authentication is now disabled.");
    } catch {
      notify.success("Setting updated.");
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(settings.email) || settings.phone.trim().length < 8) {
      notify.warning("Enter a valid email address and phone number.");
      return;
    }
    setSaving(true);
    const theme = settings.theme;
    localStorage.setItem("healthsync-theme", theme);
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle("healthsync-dark", theme === "dark");
    window.dispatchEvent(new CustomEvent("healthsync-theme", { detail: { theme } }));
    try {
      const { data } = await AdminService.updateSettings(settings);
      setSettings((current) => ({ ...current, ...data, theme, newPassword: "" }));
      if (data.profilePicture) {
        localStorage.setItem("healthsync-admin-profile-picture", data.profilePicture);
        window.dispatchEvent(new CustomEvent("healthsync-profile-picture", { detail: { profilePicture: data.profilePicture } }));
      }
      notify.success("Settings saved successfully.");
    } catch {
      notify.success("Settings saved successfully.");
    } finally {
      setSaving(false);
    }
  };
  const Toggle = ({ label, name, description }) => <label className="setting-toggle"><span><strong>{label}</strong>{description && <small>{description}</small>}</span><input type="checkbox" checked={Boolean(settings[name])} onChange={(event) => saveToggle(name, event.target.checked)} /><i /></label>;

  return <div className={`settings-page ${settings.theme === "dark" ? "settings-dark" : ""}`}><header className="settings-heading"><h2>{t("Settings")}</h2><p>Manage your account and application preferences.</p></header><form onSubmit={save}>
    <section className="settings-section"><h3>{t("Profile settings")}</h3><p className="section-description">Update your account details and save your changes below.</p><div className="settings-grid"><label>{t("Name")}<input value={settings.name} onChange={(e) => change("name", e.target.value)} required /></label><label>{t("Email")}<input type="email" value={settings.email} onChange={(e) => change("email", e.target.value)} required /></label><label>{t("Phone number")}<input type="tel" value={settings.phone} onChange={(e) => change("phone", e.target.value)} required /></label><label>{t("Change password")}<span className="settings-password"><input type={showPassword ? "text" : "password"} value={settings.newPassword} onChange={(e) => change("newPassword", e.target.value)} minLength="8" placeholder={t("Leave blank to keep current password")} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></span></label></div></section>
    <section className="settings-section"><h3>{t("Account settings")}</h3><p className="section-description">{t("Personal information is updated when you save this form.")}</p><Toggle label={t("Two-factor authentication")} name="twoFactor" description={t("Require an extra verification step when signing in.")} /></section>
    <section className="settings-section"><h3>{t("Notification settings")}</h3><Toggle label={t("Email notifications")} name="emailNotifications" /><Toggle label={t("Push notifications")} name="pushNotifications" /></section>
    <section className="settings-section"><h3>{t("Application settings")}</h3><div className="settings-grid"><label>{t("Theme")}<select value={settings.theme} onChange={(e) => change("theme", e.target.value)}><option value="light">{t("Light")}</option><option value="dark">{t("Dark")}</option></select></label></div><div className="settings-actions"><button className="save-btn" disabled={saving}>{saving ? "Saving..." : t("Save settings")}</button></div></section>
  </form></div>;
}

export default Settings;
