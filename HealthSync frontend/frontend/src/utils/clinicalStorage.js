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
