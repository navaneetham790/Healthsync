import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { notify } from "../../components/ToastProvider";
import "../Admin/Settings.css";
import { useLanguage } from "../../i18n/LanguageContext";

const defaults = { name: "", email: "", phone: "", newPassword: "", twoFactor: false, emailNotifications: true, pushNotifications: true, theme: "light", language: "English" };

function TwoFactorSettings({ role, service }) {
  const { setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const title = role === "doctor" ? "Doctor Settings" : "Worker Settings";

  useEffect(() => {
    service.getSettings().then(({ data }) => {
      // The navbar choice is the current browser theme. Do not let an older
      // database value reset it while moving from one Doctor/Worker page to another.
      const activeTheme = localStorage.getItem("healthsync-theme");
      const savedLanguage = localStorage.getItem("healthsync-language");
      const next = { ...defaults, ...data, theme: activeTheme || data.theme || defaults.theme, language: role === "worker" ? (savedLanguage || data.language || "English") : data.language };
      setSettings(next);
      applyTheme(next.theme);
      if (role === "worker") setLanguage(localStorage.getItem("healthsync-language") || next.language || "English");
    }).catch(() => notify.error("Unable to load security settings.")).finally(() => setLoading(false));
  }, [service]);
  const applyTheme = (theme) => { document.documentElement.dataset.theme = theme; document.body.classList.toggle("healthsync-dark", theme === "dark"); localStorage.setItem("healthsync-theme", theme); window.dispatchEvent(new CustomEvent("healthsync-theme", { detail: { theme } })); };
  const change = (key, value) => { setSettings((current) => ({ ...current, [key]: value })); if (key === "theme") applyTheme(value); if (key === "language") setLanguage(value); };
  const save = async (event) => { event.preventDefault(); if (settings.newPassword && settings.newPassword.length < 8) return notify.warning("New password must contain at least 8 characters."); setSaving(true); try { const { data } = await service.updateSettings(settings); const next = { ...settings, ...data, newPassword: "" }; setSettings(next); applyTheme(next.theme); if (role === "worker") setLanguage(next.language || "English"); notify.success("Settings saved successfully."); } catch (error) { notify.error(error.response?.data?.message || "Unable to save settings."); } finally { setSaving(false); } };
  const Toggle = ({ label, name, description }) => <label className="setting-toggle"><span><strong>{label}</strong>{description && <small>{description}</small>}</span><input type="checkbox" checked={Boolean(settings[name])} disabled={loading} onChange={(event) => change(name, event.target.checked)} /><i /></label>;

  return <div className={`settings-page ${settings.theme === "dark" ? "settings-dark" : ""}`}><header className="settings-heading"><h2>{t(title)}</h2><p>{t("Manage your account, preferences, and security.")}</p></header><form onSubmit={save}>
    <section className="settings-section"><h3>{t("Profile settings")}</h3><p className="section-description">{t("Your registered account details.")}</p><div className="settings-grid"><label>{t("Name")}<input value={settings.name} readOnly /></label><label>{t("Email")}<input value={settings.email} readOnly /></label><label>{t("Phone number")}<input value={settings.phone || "—"} readOnly /></label><label>{t("Change password")}<span className="settings-password"><input type={showPassword ? "text" : "password"} value={settings.newPassword} onChange={(event) => change("newPassword", event.target.value)} minLength="8" placeholder={t("Leave blank to keep current password")} /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></span></label></div></section>
    <section className="settings-section"><h3>{t("Account settings")}</h3><Toggle label={t("Two-factor authentication")} name="twoFactor" description={t("Send a 6-digit verification code to your registered email when you sign in.")} /></section>
    <section className="settings-section"><h3>{t("Notification settings")}</h3><Toggle label={t("Email notifications")} name="emailNotifications" /><Toggle label={t("Push notifications")} name="pushNotifications" /></section>
    <section className="settings-section"><h3>{t("Application settings")}</h3><div className="settings-grid"><label>{t("Theme")}<select value={settings.theme} onChange={(event) => change("theme", event.target.value)}><option value="light">{t("Light")}</option><option value="dark">{t("Dark")}</option></select></label>{role === "worker" && <label>{t("Language")}<select value={settings.language} onChange={(event) => change("language", event.target.value)}><option value="English">{t("English")}</option><option value="Hindi">{t("Hindi")}</option><option value="Tamil">{t("Tamil")}</option><option value="Malayalam">{t("Malayalam")}</option></select></label>}</div><div className="settings-actions"><button className="save-btn" disabled={saving || loading}>{saving ? t("Saving") : t("Save settings")}</button></div></section>
  </form></div>;
}

export default TwoFactorSettings;
