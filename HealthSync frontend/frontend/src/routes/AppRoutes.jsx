import { Routes, Route, Navigate } from "react-router-dom";

/* ================= AUTH PAGES ================= */

import LandingPage from "../pages/Landing/LandingPage";
import LoginPortal from "../pages/Authentication/LoginPortal";
import AdminForgotPassword from "../pages/Authentication/AdminForgotPassword";
import DoctorForgotPassword from "../pages/Authentication/DoctorForgotPassword";
import WorkerForgotPassword from "../pages/Authentication/WorkerForgotPassword";
import ResetPassword from "../pages/Authentication/ResetPassword";
import TwoFactorSettings from "../pages/Authentication/TwoFactorSettings";
import WorkerQrDetails from "../pages/Public/WorkerQrDetails";
import DoctorVerification from "../pages/Public/DoctorVerification";

/* ================= LAYOUTS ================= */

import AdminLayout from "../layouts/AdminLayout";
import DoctorLayout from "../layouts/DoctorLayout";
import WorkerLayout from "../layouts/WorkerLayout";

/* ================= ADMIN ================= */

import Dashboard from "../pages/Admin/Dashboard";
import CreateDoctor from "../pages/Admin/CreateDoctor";
import ManageDoctors from "../pages/Admin/ManageDoctors";
import ManageWorkers from "../pages/Admin/ManageWorkers";
import Reports from "../pages/Admin/Reports";
import AuditLogs from "../pages/Admin/AuditLogs";
import Settings from "../pages/Admin/Settings";
import Profile from "../pages/Admin/Profile";
import DoctorVerifications from "../pages/Admin/DoctorVerifications";

/* ================= DOCTOR ================= */

import DoctorDashboard from "../pages/Doctor/Dashboard";
import SearchWorker from "../pages/Doctor/SearchWorker";
import AddWorker from "../pages/Doctor/AddWorker";
import AddHealthRecord from "../pages/Doctor/AddHealthRecord";
import CreatePrescription from "../pages/Doctor/CreatePrescription";
import DrugInteraction from "../pages/Doctor/DrugInteraction";
import GenerateQR from "../pages/Doctor/GenerateQR";
import DoctorProfile from "../pages/Doctor/Profile";
import DoctorAIRiskPrediction from "../pages/Doctor/AIRiskPrediction";
import DoctorAppointments from "../pages/Doctor/Appointments";
import DoctorService from "../services/DoctorService";

/* ================= WORKER ================= */

import WorkerDashboard from "../pages/Worker/Dashboard";
import WorkerProfilePage from "../pages/Worker/MyProfile";
import HealthRecords from "../pages/Worker/HealthRecords";
import HealthRecordDetails from "../pages/Worker/HealthRecordDetails";
import Prescriptions from "../pages/Worker/Prescriptions";
import PrescriptionDetails from "../pages/Worker/PrescriptionDetails";
import Appointment from "../pages/Worker/Appointment";
import AppointmentHistory from "../pages/Worker/AppointmentHistory";
import QRCode from "../pages/Worker/QRCode";
import WorkerService from "../services/WorkerService";

function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ================= */}

      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPortal />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/worker-qr/:token" element={<WorkerQrDetails />} />
      <Route path="/doctor-verification" element={<DoctorVerification />} />

      {/* ================= AUTH ================= */}

      <Route path="/admin-login" element={<Navigate to="/login" replace />} />
      <Route path="/doctor-login" element={<Navigate to="/login" replace />} />
      <Route path="/worker-login" element={<Navigate to="/login" replace />} />

      <Route
        path="/admin-forgot-password"
        element={<AdminForgotPassword />}
      />

      <Route
        path="/doctor-forgot-password"
        element={<DoctorForgotPassword />}
      />

      <Route
        path="/worker-forgot-password"
        element={<WorkerForgotPassword />}
      />

      {/* ================= ADMIN ================= */}

        <Route path="/admin" element={<AdminLayout />}>

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create-doctor" element={<CreateDoctor />} />
        <Route path="doctor-verifications" element={<DoctorVerifications />} />
        <Route path="manage-doctors" element={<ManageDoctors />} />
        <Route path="manage-workers" element={<ManageWorkers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />
        <Route path="auditlogs" element={<AuditLogs />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />

    </Route>
      {/* ================= DOCTOR ================= */}

      <Route path="/doctor" element={<DoctorLayout />}>

        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="search-worker" element={<SearchWorker />} />
        <Route path="worker-profile" element={<Navigate to="/doctor/search-worker" replace />} />
        <Route path="add-worker" element={<AddWorker />} />
        <Route path="add-health-record" element={<AddHealthRecord />} />
        <Route
          path="create-prescription"
          element={<CreatePrescription />}
        />
        <Route
          path="drug-interaction"
          element={<DrugInteraction />}
        />
        <Route path="generate-qr" element={<GenerateQR />} />
        <Route path="ai-risk" element={<DoctorAIRiskPrediction />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route path="settings" element={<TwoFactorSettings role="doctor" service={DoctorService} />} />

      </Route>

      {/* ================= WORKER ================= */}

      <Route path="/worker" element={<WorkerLayout />}>

        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="profile" element={<WorkerProfilePage />} />
        <Route path="health-records" element={<HealthRecords />} />
        <Route
          path="health-record-details"
          element={<HealthRecordDetails />}
        />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route
          path="prescription-details"
          element={<PrescriptionDetails />}
        />
        <Route path="appointment" element={<Appointment />} />
        <Route
          path="appointment-history"
          element={<AppointmentHistory />}
        />
        <Route path="qr-code" element={<QRCode />} />
        <Route path="ai-risk" element={<Navigate to="/worker/dashboard" replace />} />
        <Route path="settings" element={<TwoFactorSettings role="worker" service={WorkerService} />} />

      </Route>

    </Routes>
  );
}

export default AppRoutes;
