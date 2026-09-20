import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { notify } from "../../components/ToastProvider";
import "../Admin/Settings.css";
import { useLanguage } from "../../i18n/LanguageContext";

function getInitialSettings(role) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const activeTheme = localStorage.getItem("healthsync-theme") || "light";
  const savedLanguage = localStorage.getItem("healthsync-language") || "English";
  const localSettings = JSON.parse(localStorage.getItem(`healthsync-settings-${role}`) || "{}");

  const defaultName = role === "doctor" ? (user.fullName || "Dr. Navaneetha M") : (user.fullName || "Bavana");
  const defaultEmail = role === "doctor" ? (user.email || "717824i335@kce.ac.in") : (user.email || "717824f108@gmail.com");
  const defaultPhone = user.phone || "9876543210";

  const savedTwoFactor = localStorage.getItem(`healthsync-${role}-twofactor`);
  const initialTwoFactor = savedTwoFactor !== null ? savedTwoFactor === "true" : (localSettings.twoFactor ?? false);

  return {
    name: user.fullName || user.name || defaultName,
    email: user.email || defaultEmail,
    phone: user.phone || defaultPhone,
    newPassword: "",
    twoFactor: initialTwoFactor,
    emailNotifications: true,
    pushNotifications: true,
    theme: activeTheme,
    language: savedLanguage,
    ...localSettings,
    twoFactor: initialTwoFactor,
    ...(user.fullName ? { name: user.fullName } : {}),
    ...(user.email ? { email: user.email } : {}),
    ...(user.phone ? { phone: user.phone } : {})
  };
}

function TwoFactorSettings({ role, service }) {
  const { setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState(() => getInitialSettings(role));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const title = role === "doctor" ? "Doctor Settings" : "Worker Settings";

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const { data } = await service.getSettings();
        if (!isMounted || !data) return;

        const activeTheme = localStorage.getItem("healthsync-theme");
        const savedLanguage = localStorage.getItem("healthsync-language");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        setSettings((prev) => {
          const next = {
            ...prev,
            ...data,
            name: data.name || user.fullName || prev.name,
            email: data.email || user.email || prev.email,
            phone: data.phone || user.phone || prev.phone,
            theme: activeTheme || data.theme || prev.theme,
            language: role === "worker" ? (savedLanguage || data.language || prev.language) : (data.language || prev.language)
          };
          applyTheme(next.theme);
          if (role === "worker") setLanguage(next.language || "English");
          return next;
        });
      } catch (err) {
        console.warn("Could not fetch remote settings, using session user settings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [service, role, setLanguage]);

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle("healthsync-dark", theme === "dark");
    localStorage.setItem("healthsync-theme", theme);
    window.dispatchEvent(new CustomEvent("healthsync-theme", { detail: { theme } }));
  };

  const change = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    if (key === "theme") applyTheme(value);
    if (key === "language") setLanguage(value);
    if (key === "twoFactor") {
      localStorage.setItem(`healthsync-${role}-twofactor`, String(value));
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (settings.newPassword && settings.newPassword.length < 8) {
      return notify.warning("New password must contain at least 8 characters.");
    }
    setSaving(true);
    try {
      localStorage.setItem(`healthsync-settings-${role}`, JSON.stringify(settings));
      localStorage.setItem(`healthsync-${role}-twofactor`, String(Boolean(settings.twoFactor)));
      if (settings.language) {
        localStorage.setItem("healthsync-language", settings.language);
      }
      applyTheme(settings.theme);

      let updatedData = {};
      try {
        const { data } = await service.updateSettings(settings);
        if (data) updatedData = data;
      } catch (e) {
        console.warn("Backend updateSettings failed, saved locally:", e);
      }

      setSettings((prev) => ({ ...prev, ...updatedData, newPassword: "" }));
      if (role === "worker") setLanguage(settings.language || "English");
      notify.success("Settings saved successfully.");
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ label, name, description }) => (
    <label className="setting-toggle">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        checked={Boolean(settings[name])}
        disabled={loading}
        onChange={(event) => change(name, event.target.checked)}
      />
      <i />
    </label>
  );

  return (
    <div className={`settings-page ${settings.theme === "dark" ? "settings-dark" : ""}`}>
      <header className="settings-heading">
        <h2>{t(title)}</h2>
        <p>{t("Manage your account, preferences, and security.")}</p>
      </header>

      <form onSubmit={save}>
        <section className="settings-section">
          <h3>{t("Profile settings")}</h3>
          <p className="section-description">{t("Your registered account details.")}</p>
          <div className="settings-grid">
            <label>
              {t("Name")}
              <input value={settings.name || ""} readOnly />
            </label>
            <label>
              {t("Email")}
              <input value={settings.email || ""} readOnly />
            </label>
            <label>
              {t("Phone number")}
              <input value={settings.phone || "—"} readOnly />
            </label>
            <label>
              {t("Change password")}
              <span className="settings-password">
                <input
                  type={showPassword ? "text" : "password"}
                  value={settings.newPassword}
                  onChange={(event) => change("newPassword", event.target.value)}
                  minLength="8"
                  placeholder={t("Leave blank to keep current password")}
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </span>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3>{t("Account settings")}</h3>
          <Toggle
            label={t("Two-factor authentication")}
            name="twoFactor"
            description={t("Send a 6-digit verification code to your registered email when you sign in.")}
          />
        </section>

        <section className="settings-section">
          <h3>{t("Notification settings")}</h3>
          <Toggle label={t("Email notifications")} name="emailNotifications" />
          <Toggle label={t("Push notifications")} name="pushNotifications" />
        </section>

        <section className="settings-section">
          <h3>{t("Application settings")}</h3>
          <div className="settings-grid">
            <label>
              {t("Theme")}
              <select value={settings.theme} onChange={(event) => change("theme", event.target.value)}>
                <option value="light">{t("Light")}</option>
                <option value="dark">{t("Dark")}</option>
              </select>
            </label>
            {role === "worker" && (
              <label>
                {t("Language")}
                <select value={settings.language} onChange={(event) => change("language", event.target.value)}>
                  <option value="English">{t("English")}</option>
                  <option value="Hindi">{t("Hindi")}</option>
                  <option value="Tamil">{t("Tamil")}</option>
                  <option value="Malayalam">{t("Malayalam")}</option>
                </select>
              </label>
            )}
          </div>
          <div className="settings-actions">
            <button className="save-btn" disabled={saving || loading}>
              {saving ? t("Saving") : t("Save settings")}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default TwoFactorSettings;
