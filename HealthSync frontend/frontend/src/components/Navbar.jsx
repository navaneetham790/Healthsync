import React, { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaSignOutAlt, FaMoon, FaSun } from "react-icons/fa";
import { addNotification, readNotifications, writeNotifications } from "../utils/notifications";
import { useLanguage } from "../i18n/LanguageContext";
import AdminService from "../services/AdminService";

function Navbar({
  title = "Dashboard",
  subtitle = "HealthSync Management System",
  userName = "Admin",
  userRole = "Administrator"
}) {

  const navigate = useNavigate();
  const { t } = useLanguage();
  const recipient = userRole.toLowerCase().includes("doctor") ? "doctor" : userRole.toLowerCase().includes("worker") ? "worker:MW001" : "admin";
  const profilePath = userRole.toLowerCase().includes("doctor") ? "/doctor/profile" : userRole.toLowerCase().includes("worker") ? "/worker/profile" : "/admin/profile";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => readNotifications(recipient));
  const [profilePicture, setProfilePicture] = useState("");
  const [darkTheme, setDarkTheme] = useState(() => (localStorage.getItem("healthsync-theme") || document.documentElement.dataset.theme) === "dark");
  const notificationRef = useRef(null);

  useEffect(() => {
    const refresh = (event) => { if (!event.detail || event.detail.recipient === recipient) setNotifications(readNotifications(recipient)); };
    const storage = (event) => { if (event.key === `healthsync-notifications-${recipient}`) setNotifications(readNotifications(recipient)); };
    window.addEventListener("healthsync-notifications", refresh); window.addEventListener("storage", storage);
    setNotifications(readNotifications(recipient));
    return () => { window.removeEventListener("healthsync-notifications", refresh); window.removeEventListener("storage", storage); };
  }, [recipient]);
  useEffect(() => {
    if (recipient !== "admin") return undefined;
    let active = true;
    const pollDoctorApplications = async () => {
      try {
        const { data } = await AdminService.getDoctorApplications();
        // Versioned key intentionally rechecks already-submitted forms after
        // the notification feature is introduced.
        const seenKey = "healthsync-seen-doctor-applications-v2";
        const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]"));
        const submitted = (Array.isArray(data) ? data : []).filter((application) => application.status === "SUBMITTED");
        const newIds = submitted.filter((application) => !seen.has(application.id));
        if (active) newIds.forEach((application) => addNotification("admin", `Doctor verification form submitted by ${application.fullName || application.email}.`, "info"));
        localStorage.setItem(seenKey, JSON.stringify([...seen, ...submitted.map((application) => application.id)].slice(-200)));
      } catch (_) { /* Notifications must not interrupt the page. */ }
    };
    pollDoctorApplications();
    const timer = window.setInterval(pollDoctorApplications, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [recipient]);
  useEffect(() => { const closeOnOutsideClick = (event) => { if (!notificationRef.current?.contains(event.target)) setOpen(false); }; document.addEventListener("mousedown", closeOnOutsideClick); return () => document.removeEventListener("mousedown", closeOnOutsideClick); }, []);
  useEffect(() => {
    const applyTheme = (theme) => { const isDark = theme === "dark"; document.documentElement.dataset.theme = isDark ? "dark" : "light"; document.body.classList.toggle("healthsync-dark", isDark); setDarkTheme(isDark); };
    applyTheme(localStorage.getItem("healthsync-theme") || "light");
    const syncTheme = (event) => applyTheme(event.detail?.theme || localStorage.getItem("healthsync-theme") || "light");
    window.addEventListener("healthsync-theme", syncTheme);
    return () => window.removeEventListener("healthsync-theme", syncTheme);
  }, []);
  useEffect(() => {
    const loadPicture = async () => {
      if (recipient === "admin") {
        const localAdminPic = localStorage.getItem("healthsync-admin-profile-picture");
        if (localAdminPic) setProfilePicture(localAdminPic);
        try {
          const res = await AdminService.getSettings();
          const remotePic = res.data?.profilePicture;
          if (remotePic) {
            setProfilePicture(remotePic);
            localStorage.setItem("healthsync-admin-profile-picture", remotePic);
          } else if (localAdminPic) {
            setProfilePicture(localAdminPic);
          }
        } catch {
          if (localAdminPic) setProfilePicture(localAdminPic);
        }
      } else {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const rolePrefix = recipient.startsWith("worker") ? "worker" : "doctor";
        const key = `healthsync-${rolePrefix}-picture-${user.id || user.email}`;
        setProfilePicture(localStorage.getItem(key) || "");
      }
    };
    const syncPicture = (event) => {
      const pic = event.detail?.profilePicture || "";
      setProfilePicture(pic);
      if (recipient === "admin") {
        if (pic) localStorage.setItem("healthsync-admin-profile-picture", pic);
        else localStorage.removeItem("healthsync-admin-profile-picture");
      }
    };
    loadPicture();
    window.addEventListener("healthsync-profile-picture", syncPicture);
    return () => window.removeEventListener("healthsync-profile-picture", syncPicture);
  }, [recipient]);
  const unread = notifications.filter((item) => !item.read).length;
  const markAllRead = () => { const updated = notifications.map((item) => ({ ...item, read: true })); writeNotifications(recipient, updated); setNotifications(updated); };
  const removeNotification = (id) => { const updated = notifications.filter((item) => item.id !== id); writeNotifications(recipient, updated); setNotifications(updated); };
  useEffect(() => {
    const removeFromDeleteArea = (event) => {
      const card = event.target.closest?.(".notification-item");
      if (!card || event.clientX < card.getBoundingClientRect().right - 42) return;
      const cards = Array.from(card.parentElement.querySelectorAll(".notification-item"));
      const item = notifications.slice(0, 6)[cards.indexOf(card)];
      if (item) removeNotification(item.id);
    };
    document.addEventListener("click", removeFromDeleteArea);
    return () => document.removeEventListener("click", removeFromDeleteArea);
  }, [notifications, recipient]);
  const toggleTheme = () => {
    const nextTheme = darkTheme ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.body.classList.toggle("healthsync-dark", nextTheme === "dark");
    localStorage.setItem("healthsync-theme", nextTheme);
    setDarkTheme(!darkTheme);
    window.dispatchEvent(new CustomEvent("healthsync-theme", { detail: { theme: nextTheme } }));
  };

  const handleLogout = () => {

    // If later you use localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/login");

  };

  return (

    <header className="navbar">

      <div className="navbar-left">

        <h2>{t(title)}</h2>

        <p>{t(subtitle)}</p>

      </div>

      <div className="navbar-right">

        <div className="notification-wrap" ref={notificationRef}><button className="notification-btn" aria-label="Open notifications" onClick={() => setOpen(!open)}><FaBell />{unread > 0 && <span className="notification-count">{unread}</span>}</button>{open && <div className="notification-panel"><div className="notification-panel-header"><strong>Notifications</strong>{unread > 0 && <button onClick={markAllRead}>Mark all read</button>}</div>{notifications.length ? notifications.slice(0, 6).map((item) => <div className={`notification-item ${item.read ? "" : "unread"}`} key={item.id}><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString()}</small></div>) : <p className="notification-empty">—</p>}</div>}</div>

        <button type="button" className="theme-toggle-btn" aria-label={darkTheme ? "Use light theme" : "Use dark theme"} title={darkTheme ? "Light theme" : "Dark theme"} onClick={toggleTheme}>{darkTheme ? <FaSun /> : <FaMoon />}</button>

        <button type="button" className="user-info" onClick={() => navigate(profilePath)} aria-label="Open profile">

          {profilePicture ? <img className="user-profile-picture" src={profilePicture} alt="Profile" /> : <FaUserCircle className="user-icon" />}

          <div>

            <h4>{userName}</h4>

            <span>{t(userRole)}</span>

          </div>

        </button>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >

          <FaSignOutAlt />

          {t("Logout")}

        </button>

      </div>

    </header>

  );

}

export default Navbar;
