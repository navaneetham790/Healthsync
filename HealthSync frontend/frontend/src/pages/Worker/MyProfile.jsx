import { useCallback, useEffect, useState } from "react";
import "./MyProfile.css";
import { FaUserCircle, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import WorkerService from "../../services/WorkerService";
import { notify } from "../../components/ToastProvider";
import { useLanguage } from "../../i18n/LanguageContext";

const LOCKED_FIELDS = [
  { key: "workerCode", label: "Worker ID" },
  { key: "fullName",   label: "Full Name" },
  { key: "email",      label: "Email Address" },
  { key: "riskLevel",  label: "Risk Level" },
];

const EDITABLE_FIELDS = [
  { key: "age",     label: "Age",                  type: "number" },
  { key: "phone",   label: "Phone Number",          type: "text" },
  { key: "address", label: "Address / Health History", type: "text" },
];

function MyProfile() {
  const { t } = useLanguage();
  const [profile, setProfile]   = useState(null);
  const [original, setOriginal] = useState(null);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [profilePicture, setProfilePicture] = useState("");

  const formatWorkerCode = (data) => {
    if (data.workerCode) return data.workerCode;
    return `MW${String(data.id || 1).padStart(3, "0")}`;
  };

  const load = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const localRegistry = JSON.parse(localStorage.getItem("healthsync_registered_workers") || "{}");
    const registered = localRegistry[String(user.workerCode || "MW001").toUpperCase()] ||
                       localRegistry[String(user.email || "").toLowerCase()] || {};

    const baseProfile = {
      id: user.id || 15,
      workerCode: formatWorkerCode(user),
      fullName: user.fullName || registered.fullName || "Bavana",
      email: user.email || registered.email || "717824f108@gmail.com",
      phone: user.phone || registered.phone || "9876543210",
      age: user.age || registered.age || 25,
      riskLevel: user.riskLevel || registered.riskLevel || "LOW",
      address: user.healthHistory || user.address || registered.address || registered.healthHistory || "Viral fever treated with Paracetamol"
    };

    try {
      const workerId = user.workerCode || user.id || "MW001";
      const { data } = await WorkerService.getProfile(workerId);
      const enriched = {
        ...baseProfile,
        ...data,
        workerCode: formatWorkerCode(data || user),
        phone: data.phone && data.phone !== "—" ? data.phone : baseProfile.phone,
        age: data.age && data.age > 0 ? data.age : baseProfile.age,
        address: data.healthHistory || data.address || baseProfile.address,
        riskLevel: data.riskLevel && data.riskLevel !== "Not assessed" ? data.riskLevel : baseProfile.riskLevel,
      };
      setProfile(enriched);
      setOriginal(enriched);
      setProfilePicture(localStorage.getItem(`healthsync-worker-picture-${enriched.id || enriched.email}`) || "");
    } catch {
      setProfile(baseProfile);
      setOriginal(baseProfile);
      setProfilePicture(localStorage.getItem(`healthsync-worker-picture-${baseProfile.id || baseProfile.email}`) || "");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const change = (key, value) => setProfile({ ...profile, [key]: value });
  const choosePicture = (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (!file.type.startsWith("image/")) return notify.warning("Choose an image file."); if (file.size > 2 * 1024 * 1024) return notify.warning("Choose an image smaller than 2 MB."); const reader = new FileReader(); reader.onload = () => { localStorage.setItem(`healthsync-worker-picture-${profile.id || profile.email}`, reader.result); setProfilePicture(reader.result); window.dispatchEvent(new CustomEvent("healthsync-profile-picture", { detail: { profilePicture: reader.result } })); notify.success("Profile picture updated successfully."); }; reader.readAsDataURL(file); };
  const deletePicture = () => { localStorage.removeItem(`healthsync-worker-picture-${profile.id || profile.email}`); setProfilePicture(""); window.dispatchEvent(new CustomEvent("healthsync-profile-picture", { detail: { profilePicture: "" } })); notify.success("Profile picture deleted successfully."); };

  const save = async () => {
    if (profile.age && (Number(profile.age) < 1 || Number(profile.age) > 120)) {
      notify.warning("Please enter a valid age.");
      return;
    }
    setSaving(true);
    try {
      const updatedData = {
        id:            profile.id || 15,
        workerCode:    profile.workerCode || "MW001",
        fullName:      profile.fullName || "Bavana",
        email:         profile.email || "717824f108@gmail.com",
        phone:         profile.phone,
        age:           Number(profile.age),
        address:       profile.address,
        healthHistory: profile.address,
      };

      await WorkerService.updateProfile(updatedData);

      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...existingUser,
        ...updatedData
      }));

      setOriginal(profile);
      setEditing(false);
      notify.success("Personal details updated successfully across database.");
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="worker-profile">Loading profile…</div>;

  return (
    <div className="worker-profile">
      <div className="profile-header">
        <h2>{t("My Profile")}</h2>
        <p>Manage your personal contact & health details.</p>
      </div>

      <div className="profile-card">
        <div className="profile-left">
          {profilePicture ? <img className="worker-profile-picture" src={profilePicture} alt={`${profile.fullName} profile`} /> : <FaUserCircle className="profile-image" />}
          <h3>{profile.fullName}</h3>
          <span>{t("Migrant Worker")}</span>
          <p className="worker-id-badge" style={{ marginTop: "10px", fontWeight: "bold", color: "#0F8F83" }}>
            {profile.workerCode}
          </p>
          <div className="profile-picture-actions"><label className="edit-picture-btn">Edit<input type="file" accept="image/*" onChange={choosePicture} /></label>{profilePicture && <button type="button" className="delete-picture-btn" onClick={deletePicture}>Delete</button>}</div>
        </div>

        <div className="profile-right">
          <div className="info-grid">
            {/* Account Locked fields */}
            {LOCKED_FIELDS.map(({ key, label }) => (
              <div className="info-box" key={key}>
                <label>{t(label)} <small>{t("(Account Detail - Locked)")}</small></label>
                <p>{profile[key] || "—"}</p>
              </div>
            ))}

            {/* Personal Editable fields */}
            {EDITABLE_FIELDS.map(({ key, label, type }) => (
              <div className="info-box" key={key}>
                <label>{t(label)} <small style={{ color: "#0F8F83" }}>{t("(Personal Detail)")}</small></label>
                {editing ? (
                  <input
                    type={type}
                    value={profile[key] ?? ""}
                    onChange={(e) => change(key, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                ) : (
                  <p>{profile[key] || "—"}</p>
                )}
              </div>
            ))}
          </div>

          {editing ? (
            <div className="worker-profile-actions" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button className="worker-cancel-btn" onClick={() => { setProfile(original); setEditing(false); }}>
                <FaTimes /> {t("Cancel")}
              </button>
              <button className="worker-save-btn" disabled={saving} onClick={save}>
                <FaSave /> {saving ? t("Updating DB…") : t("Save Changes")}
              </button>
            </div>
          ) : (
            <button className="worker-edit-btn" style={{ marginTop: "20px" }} onClick={() => setEditing(true)}>
              <FaEdit /> {t("Edit Personal Details (Age, Phone, Address)")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
