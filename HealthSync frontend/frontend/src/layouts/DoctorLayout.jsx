import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DoctorService from "../services/DoctorService";

import "./DoctorLayout.css";

function DoctorLayout() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [doctorName, setDoctorName] = useState(savedUser.fullName || "Doctor");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await DoctorService.getProfile();
        if (data?.fullName) setDoctorName(data.fullName);
      } catch (_) { /* Keep the authenticated login name as a fallback. */ }
    };
    const syncProfile = (event) => { if (event.detail?.fullName) setDoctorName(event.detail.fullName); };
    loadProfile();
    window.addEventListener("healthsync-doctor-profile", syncProfile);
    return () => window.removeEventListener("healthsync-doctor-profile", syncProfile);
  }, []);

  return (
    <div className="doctor-layout">

      <Sidebar role="doctor" />

      <div className="doctor-main">

        <Navbar
          title="Doctor Dashboard"
          subtitle="HealthSync - Doctor Panel"
          userName={doctorName}
          userRole="Doctor"
        />

        <div className="doctor-content">

          <Outlet />

        </div>

      </div>

    </div>
  );
}

export default DoctorLayout;
