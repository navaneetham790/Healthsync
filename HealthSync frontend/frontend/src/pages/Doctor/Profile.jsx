import { useCallback, useEffect, useState } from "react";
import "./Profile.css";
import { FaUserMd, FaEdit } from "react-icons/fa";
import DoctorService from "../../services/DoctorService";
import { notify } from "../../components/ToastProvider";

function Profile() {
  const [profile, setProfile] = useState(null); const [original, setOriginal] = useState(null); const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false); const [profilePicture, setProfilePicture] = useState("");
  const pictureKey = (person) => `healthsync-doctor-picture-${person.id || person.email}`;
  const load = useCallback(async () => {
    try {
      const { data } = await DoctorService.getProfile();
      if (data && (data.email || data.fullName)) {
        const enriched = { ...data, doctorCode: data.doctorCode || `DR${String(data.id || 1).padStart(3, "0")}` };
        setProfile(enriched);
        setOriginal(enriched);
        setProfilePicture(localStorage.getItem(pictureKey(enriched)) || "");
        return;
      }
    } catch (_) {}
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const fallbackProfile = {
      id: user.id || 1,
      doctorCode: user.doctorCode || "DR001",
      fullName: user.fullName || "Dr. Navaneetha M",
      email: user.email || "717824i335@kce.ac.in",
      phone: user.phone || "9003805461",
      specialization: user.specialization || "General Medicine",
      hospital: user.hospital || "Karpagam Medical College Hospital",
      hospitalAddress: user.hospitalAddress || "Coimbatore, Tamil Nadu",
      ...user
    };
    setProfile(fallbackProfile);
    setOriginal(fallbackProfile);
    setProfilePicture(localStorage.getItem(pictureKey(fallbackProfile)) || "");
  }, []);
  useEffect(() => { load(); }, [load]);
  const change = (name, value) => setProfile({ ...profile, [name]: value });
  const save = async () => {
    if (!profile.fullName?.trim()) return notify.warning("Name is required.");
    setSaving(true);
    try {
      let enriched = profile;
      try {
        const { data } = await DoctorService.updateProfile({ fullName: profile.fullName, phone: profile.phone, hospitalAddress: profile.hospitalAddress });
        if (data) enriched = { ...data, doctorCode: data.doctorCode || profile.doctorCode };
      } catch (_) {}
      setProfile(enriched);
      setOriginal(enriched);
      const signedInUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...signedInUser, fullName: enriched.fullName }));
      window.dispatchEvent(new CustomEvent("healthsync-doctor-profile", { detail: { fullName: enriched.fullName } }));
      setEditing(false);
      notify.success("Personal details updated successfully.");
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };
  const choosePicture = (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (!file.type.startsWith("image/")) return notify.warning("Choose an image file."); if (file.size > 2 * 1024 * 1024) return notify.warning("Choose an image smaller than 2 MB."); const reader = new FileReader(); reader.onload = () => { localStorage.setItem(pictureKey(profile), reader.result); setProfilePicture(reader.result); window.dispatchEvent(new CustomEvent("healthsync-profile-picture", { detail: { profilePicture: reader.result } })); notify.success("Profile picture updated successfully."); }; reader.readAsDataURL(file); };
  const deletePicture = () => { localStorage.removeItem(pictureKey(profile)); setProfilePicture(""); window.dispatchEvent(new CustomEvent("healthsync-profile-picture", { detail: { profilePicture: "" } })); notify.success("Profile picture deleted successfully."); };
  if (!profile) return <div className="doctor-profile-page">Loading profile…</div>;
  const Field = ({ label, name, permanent = false }) => <div className="doctor-detail-box"><label htmlFor={name}>{label}{permanent && <small>Professional detail</small>}</label><input id={name} value={profile[name] || ""} readOnly={permanent || !editing} onChange={(event) => change(name, event.target.value)} /></div>;
  return <div className="doctor-profile-page"><div className="doctor-page-header"><h2>Doctor Profile</h2><p>Live information from your account.</p></div><div className="doctor-profile-card"><div className="doctor-profile-image">{profilePicture ? <img className="doctor-profile-picture" src={profilePicture} alt={`${profile.fullName} profile`} /> : <FaUserMd className="doctor-avatar-icon" />}<h3>{profile.fullName}</h3><p>{profile.specialization || "Doctor"}</p><div className="profile-picture-actions"><label className="edit-picture-btn">Edit<input type="file" accept="image/*" onChange={choosePicture} /></label>{profilePicture && <button type="button" className="delete-picture-btn" onClick={deletePicture}>Delete</button>}</div></div><div className="doctor-profile-details"><Field label="Doctor ID" name="doctorCode" permanent /><Field label="Full Name" name="fullName" /><Field label="Email" name="email" permanent /><Field label="Phone Number" name="phone" /><Field label="Specialization" name="specialization" permanent /><Field label="Hospital" name="hospital" permanent />{editing ? <div className="profile-actions"><button type="button" className="doctor-cancel-btn" onClick={() => { setProfile(original); setEditing(false); }}>Cancel</button><button className="doctor-save-btn" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Personal Details"}</button></div> : <button className="doctor-edit-btn" onClick={() => setEditing(true)}><FaEdit /> Edit Personal Details</button>}</div></div></div>;
}
export default Profile;
