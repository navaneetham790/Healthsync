import { useCallback, useEffect, useMemo, useState } from "react";
import "./ManageDoctors.css";
import AdminService from "../../services/AdminService";
import ConfirmDialog from "../../components/ConfirmDialog";
import { addNotification } from "../../utils/notifications";
import RecordDialog from "../../components/RecordDialog";
import { notify } from "../../components/ToastProvider";

const getDoctorDisplayId = (doctor) => {
  if (doctor.doctorId && String(doctor.doctorId).toUpperCase().startsWith("DR")) return doctor.doctorId;
  const customId = localStorage.getItem(`doctor_id_${doctor.id}`) || localStorage.getItem(`doctor_id_${doctor.email?.toLowerCase()}`);
  if (customId) return customId;
  if (Number(doctor.id) === 6 || Number(doctor.id) === 1) return "DR001";
  return `DR${String(doctor.id).padStart(3, "0")}`;
};

const normalizeDoctor = (doctor) => {
  const doctorId = getDoctorDisplayId(doctor);
  return { ...doctor, doctorId, name: doctor.fullName ?? doctor.name, mobile: doctor.phone ?? doctor.mobile };
};

function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [terminationMessage, setTerminationMessage] = useState("");

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AdminService.getDoctors();
      setDoctors((Array.isArray(data) ? data : data.content || []).map(normalizeDoctor));
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to load doctors from the database.");
      setDoctors([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);
  const visibleDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return doctors;
    return doctors.filter((doctor) => String(doctor.doctorId || doctor.id).toLowerCase().includes(query) || (doctor.name || "").toLowerCase().includes(query));
  }, [doctors, search]);

  const remove = async () => {
    setDeleting(true);
    try {
      await AdminService.deleteDoctor(selected.id, terminationMessage);
      addNotification("admin", `Doctor ${selected.name} was deleted.`, "warning");
      await loadDoctors();
      notify.success("Termination email sent and doctor deleted successfully.");
      setSelected(null); setTerminationMessage("");
    } catch (error) { notify.error(error.response?.data?.message || "Unable to send the email or delete the doctor."); }
    finally { setDeleting(false); }
  };
  const save = async (doctor) => {
    try { await AdminService.updateDoctor(doctor.id, doctor); await loadDoctors(); notify.success("Doctor updated successfully."); setEditing(null); }
    catch (error) { notify.error(error.response?.data?.message || "Unable to update doctor."); }
  };

  return <div className="manageDoctors"><div className="pageHeader"><h2>Manage Doctors</h2><p>Search, update, or remove doctors stored in the HealthSync database.</p></div><div className="tableContainer"><div className="table-toolbar"><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by doctor name or ID..." aria-label="Search doctors by name or ID" /></div><table><thead><tr><th>Doctor ID</th><th>Name</th><th>Specialization</th><th>Hospital</th><th>Mobile</th><th>Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading real database data...</td></tr> : visibleDoctors.length ? visibleDoctors.map((doctor) => <tr key={doctor.id}><td><strong>{doctor.doctorId}</strong></td><td>{doctor.name}</td><td>{doctor.specialization || "—"}</td><td>{doctor.hospital || "—"}</td><td>{doctor.mobile || "—"}</td><td><button className="editBtn" onClick={() => setEditing(doctor)}>Edit</button><button className="deleteBtn" onClick={() => { setTerminationMessage("Your HealthSync account has been terminated."); setSelected(doctor); }}>Delete</button></td></tr>) : <tr><td colSpan="6">No doctors found in the database.</td></tr>}</tbody></table></div><RecordDialog record={editing} mode="edit" title="Edit doctor" fields={["doctorId", "name", "specialization", "hospital", "mobile"]} onClose={() => setEditing(null)} onSave={save}/><ConfirmDialog open={Boolean(selected)} title="Send termination message" message={`This message will be sent only to ${selected?.name || "this doctor"}'s registered email. The doctor will be deleted after the email is sent.`} textValue={terminationMessage} onTextChange={setTerminationMessage} textPlaceholder="Type the message for the doctor..." onCancel={() => { setSelected(null); setTerminationMessage(""); }} onConfirm={remove} busy={deleting} confirmLabel="Send and delete"/></div>;
}
export default ManageDoctors;
