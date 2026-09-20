const HEALTH_RECORDS_KEY = "healthsync_local_health_records";
const PRESCRIPTIONS_KEY = "healthsync_local_prescriptions";

function getStoredArray(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredArray(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.error(`Failed to store key ${key}`, err);
  }
}

export function saveLocalHealthRecord(record) {
  const list = getStoredArray(HEALTH_RECORDS_KEY);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const newRecord = {
    id: "rec-" + Date.now(),
    workerId: Number(record.workerId),
    diagnosis: record.diagnosis || "",
    summary: record.summary || "",
    bloodPressure: record.bloodPressure || "",
    sugar: record.sugar || "",
    bmi: record.bmi || 0,
    notes: record.notes || "",
    date: record.visitDate || record.date || new Date().toISOString().slice(0, 10),
    visitDate: record.visitDate || record.date || new Date().toISOString().slice(0, 10),
    doctorName: user.fullName || "Dr. Navaneetha M",
    doctorEmail: user.email || "",
    hospitalName: user.hospitalName || "HealthSync Medical Center",
    type: "RECORD",
    createdAt: new Date().toISOString()
  };

  list.unshift(newRecord);
  setStoredArray(HEALTH_RECORDS_KEY, list);
  return newRecord;
}

export function getLocalHealthRecords(workerId) {
  const list = getStoredArray(HEALTH_RECORDS_KEY);
  if (!workerId) return list;
  return list.filter((item) => String(item.workerId) === String(workerId));
}

export function getAllLocalHealthRecords() {
  return getStoredArray(HEALTH_RECORDS_KEY);
}

export function saveLocalPrescription(prescription) {
  const list = getStoredArray(PRESCRIPTIONS_KEY);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const newPrescription = {
    id: "presc-" + Date.now(),
    workerId: Number(prescription.workerId),
    medicine: prescription.medicine || "",
    dosage: prescription.dosage || "-",
    frequency: prescription.frequency || "-",
    duration: prescription.duration || "",
    instructions: prescription.instructions || "",
    date: prescription.prescriptionDate || prescription.date || new Date().toISOString().slice(0, 10),
    prescriptionDate: prescription.prescriptionDate || prescription.date || new Date().toISOString().slice(0, 10),
    doctorName: prescription.doctorName || user.fullName || "Dr. Navaneetha M",
    doctorEmail: user.email || "",
    hospitalName: user.hospitalName || "HealthSync Medical Center",
    type: "PRESCRIPTION",
    createdAt: new Date().toISOString()
  };

  list.unshift(newPrescription);
  setStoredArray(PRESCRIPTIONS_KEY, list);
  return newPrescription;
}

export function getLocalPrescriptions(workerId) {
  const list = getStoredArray(PRESCRIPTIONS_KEY);
  if (!workerId) return list;
  return list.filter((item) => String(item.workerId) === String(workerId));
}

export function getAllLocalPrescriptions() {
  return getStoredArray(PRESCRIPTIONS_KEY);
}

const APPOINTMENTS_KEY = "healthsync_local_appointments";

const DEFAULT_APPOINTMENTS = [
  {
    id: "app-mw001",
    workerId: 15,
    workerCode: "MW001",
    workerName: "Bavana",
    doctor: "Dr. Navaneetha M",
    doctorEmail: "717824i335@kce.ac.in",
    appointmentAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    reason: "General Health Checkup & Vitals Assessment",
    status: "PENDING",
    doctorNotes: "",
    followUpDate: "",
    cancelReason: ""
  }
];

export function getAllLocalAppointments() {
  const list = getStoredArray(APPOINTMENTS_KEY);
  if (!list || list.length === 0) {
    setStoredArray(APPOINTMENTS_KEY, DEFAULT_APPOINTMENTS);
    return DEFAULT_APPOINTMENTS;
  }
  return list;
}

export function saveLocalAppointment(data) {
  const list = getAllLocalAppointments();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const appointmentDateStr = data.appointmentAt || (data.date ? (data.time ? `${data.date}T${data.time}:00` : `${data.date}T09:00:00`) : new Date(Date.now() + 86400000).toISOString());
  const newApp = {
    id: "app-" + Date.now(),
    workerId: data.workerId ? Number(data.workerId) : (user.id || 15),
    workerCode: data.workerCode || "MW001",
    workerName: data.workerName || user.fullName || "Worker",
    doctor: data.doctor || "Dr. Navaneetha M",
    doctorEmail: data.doctorEmail || "717824i335@kce.ac.in",
    appointmentAt: appointmentDateStr,
    date: data.date || (appointmentDateStr.includes("T") ? appointmentDateStr.split("T")[0] : appointmentDateStr),
    time: data.time || "09:00",
    reason: data.reason || "General Consultation",
    status: "PENDING",
    doctorNotes: "",
    followUpDate: "",
    cancelReason: ""
  };
  list.unshift(newApp);
  setStoredArray(APPOINTMENTS_KEY, list);
  return newApp;
}

export function updateLocalAppointmentStatus(id, status, details = {}) {
  const list = getAllLocalAppointments();
  const updated = list.map((item) => {
    if (String(item.id) === String(id)) {
      return {
        ...item,
        status,
        doctorNotes: details.doctorNotes !== undefined ? details.doctorNotes : item.doctorNotes,
        followUpDate: details.followUpDate !== undefined ? details.followUpDate : item.followUpDate,
        cancelReason: details.cancelReason !== undefined ? details.cancelReason : item.cancelReason,
      };
    }
    return item;
  });
  setStoredArray(APPOINTMENTS_KEY, updated);
  return updated.find((item) => String(item.id) === String(id));
}
