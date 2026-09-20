import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">

      <Sidebar role="admin" />

      <div className="admin-main">

        <Navbar />

        <div className="admin-content">
          <Outlet />
        </div>

      </div>

    </div>
  );
}

export default AdminLayout;