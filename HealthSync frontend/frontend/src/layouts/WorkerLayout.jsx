import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import WorkerService from "../services/WorkerService";
import { addNotification } from "../utils/notifications";
import { useLanguage } from "../i18n/LanguageContext";

import "./WorkerLayout.css";

function WorkerLayout() {
  const { setLanguage } = useLanguage();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.fullName ? user.fullName.trim() : "Worker";
  const workerId = user.id || 1;

  // Keep every worker page in the language saved for this worker, including after refresh/navigation.
  useEffect(() => {
    WorkerService.getSettings()
      .then(({ data }) => setLanguage(localStorage.getItem("healthsync-language") || data?.language || "English"))
      .catch(() => setLanguage(localStorage.getItem("healthsync-language") || "English"));
  }, [setLanguage]);

  useEffect(() => {
    const checkAppointments = async () => {
      try {
        const { data } = await WorkerService.getAppointments(workerId);
        if (Array.isArray(data)) {
          const notifiedKey = `healthsync-notified-appointments-${workerId}`;
          const notified = JSON.parse(localStorage.getItem(notifiedKey) || "{}");
          let updated = false;

          data.forEach((app) => {
            const appId = app.id || app._id;
            const currentStatus = app.status ? app.status.toUpperCase() : "PENDING";
            const lastStatus = notified[appId];

            if (lastStatus !== undefined && lastStatus !== currentStatus) {
              if (currentStatus === "CONFIRMED" || currentStatus === "CANCELLED") {
                const dateStr = app.appointmentAt || app.date || "";
                const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString() : "";
                const msg = `Your appointment${dateFormatted ? " on " + dateFormatted : ""} has been ${currentStatus.toLowerCase() === "confirmed" ? "confirmed" : "cancelled"}.`;
                const type = currentStatus === "CONFIRMED" ? "success" : "warning";
                
                addNotification("worker:MW001", msg, type);
              }
            }
            if (lastStatus !== currentStatus) {
              notified[appId] = currentStatus;
              updated = true;
            }
          });

          if (updated) {
            localStorage.setItem(notifiedKey, JSON.stringify(notified));
          }
        }
      } catch (error) {
        console.error("Error checking appointments:", error);
      }
    };

    checkAppointments();
    const interval = setInterval(checkAppointments, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [workerId]);

  return (
    <div className="worker-layout">

      <Sidebar role="worker" />

      <div className="worker-main">

        <Navbar
          title="Worker Dashboard"
          subtitle="HealthSync Management System"
          userName={userName}
          userRole="Migrant Worker"
        />

        <div className="worker-content">
          <Outlet />
        </div>

      </div>

    </div>
  );
}

export default WorkerLayout;
