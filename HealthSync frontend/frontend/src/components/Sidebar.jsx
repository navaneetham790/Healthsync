import React from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

import {
  FaTachometerAlt,
  FaUserMd,
  FaUsers,
  FaFileAlt,
  FaClipboardList,
  FaCog,
  FaUserCircle,
  FaSearch,
  FaUserPlus,
  FaHeartbeat,
  FaPrescriptionBottleAlt,
  FaQrcode,
  FaRobot,
  FaCalendarAlt
} from "react-icons/fa";

function Sidebar({ role = "admin" }) {
  const { t } = useLanguage();

  const adminMenu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FaTachometerAlt /> },
    { name: "Create Doctor", path: "/admin/create-doctor", icon: <FaUserMd /> },
    { name: "Doctor Verification", path: "/admin/doctor-verifications", icon: <FaClipboardList /> },
    { name: "Manage Doctors", path: "/admin/manage-doctors", icon: <FaUsers /> },
    { name: "Manage Workers", path: "/admin/manage-workers", icon: <FaUsers /> },
    { name: "Analytics & Reports", path: "/admin/reports", icon: <FaFileAlt /> },
    { name: "Audit Logs", path: "/admin/auditlogs", icon: <FaClipboardList /> },
    { name: "Settings", path: "/admin/settings", icon: <FaCog /> },
    { name: "Profile", path: "/admin/profile", icon: <FaUserCircle /> },
  ];

  const doctorMenu = [
    { name: "Dashboard", path: "/doctor/dashboard", icon: <FaTachometerAlt /> },
    { name: "Search Worker", path: "/doctor/search-worker", icon: <FaSearch /> },
    { name: "Add Worker", path: "/doctor/add-worker", icon: <FaUserPlus /> },
    { name: "Add Health Record", path: "/doctor/add-health-record", icon: <FaHeartbeat /> },
    { name: "Prescription", path: "/doctor/create-prescription", icon: <FaPrescriptionBottleAlt /> },
    { name: "Drug Interaction", path: "/doctor/drug-interaction", icon: <FaHeartbeat /> },
    { name: "Generate QR", path: "/doctor/generate-qr", icon: <FaQrcode /> },
    { name: "Appointments", path: "/doctor/appointments", icon: <FaCalendarAlt /> },
    { name: "AI Risk Prediction", path: "/doctor/ai-risk", icon: <FaRobot /> },
    { name: "Settings", path: "/doctor/settings", icon: <FaCog /> },
    { name: "Profile", path: "/doctor/profile", icon: <FaUserCircle /> },
  ];

  const workerMenu = [
    { name: "Dashboard", path: "/worker/dashboard", icon: <FaTachometerAlt /> },
    { name: "My Profile", path: "/worker/profile", icon: <FaUserCircle /> },
    { name: "Health Records", path: "/worker/health-records", icon: <FaHeartbeat /> },
    { name: "Prescriptions", path: "/worker/prescriptions", icon: <FaPrescriptionBottleAlt /> },
    { name: "Appointment", path: "/worker/appointment", icon: <FaCalendarAlt /> },
    { name: "Appointment History", path: "/worker/appointment-history", icon: <FaClipboardList /> },
    { name: "QR Code", path: "/worker/qr-code", icon: <FaQrcode /> },
    { name: "Settings", path: "/worker/settings", icon: <FaCog /> },
  ];

  const menu =
    role === "admin"
      ? adminMenu
      : role === "doctor"
      ? doctorMenu
      : workerMenu;

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">

        <h2>HealthSync</h2>

      </div>

      <ul className="sidebar-menu">

        {menu.map((item) => (

          <li key={item.name}>

            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? "menu-link active" : "menu-link"
              }
            >
              <span className="menu-icon">{item.icon}</span>

              <span>{t(item.name)}</span>

            </NavLink>

          </li>

        ))}

      </ul>

    </aside>
  );
}

export default Sidebar;
