import React, { useEffect, useState } from "react";
import "./Profile.css";
import { FaUserCircle } from "react-icons/fa";
import RecordDialog from "../../components/RecordDialog";
import AdminService from "../../services/AdminService";
import { notify } from "../../components/ToastProvider";

function Profile() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "Administrator", email: "healthsyncproject3502@gmail.com", role: "Admin", department: "HealthSync", mobile: "9876543210", location: "Chennai", experience: "5 Years", status: "Active" });
  const [profilePicture, setProfilePicture] = useState("");
  useEffect(() => { const loadProfile = async () => { try { const [profileResponse, settingsResponse] = await Promise.all([AdminService.getProfile(), AdminService.getSettings()]); setProfile(profileResponse.data); setProfilePicture(settingsResponse.data.profilePicture || ""); localStorage.removeItem("healthsync-demo-profile"); } catch { setProfilePicture(""); } }; loadProfile(); }, []);
  const updatePicture = async (picture) => {
    try {
      const { data: settings } = await AdminService.getSettings();
      const { data } = await AdminService.updateSettings({ ...settings, profilePicture: picture });
      setProfilePicture(data.profilePicture || "");
      window.dispatchEvent(new CustomEvent("healthsync-profile-picture", { detail: { profilePicture: data.profilePicture || "" } }));
      notify.success(picture ? "Profile picture updated successfully." : "Profile picture deleted successfully.");
    } catch (error) { notify.error(error.response?.data?.message || "Unable to update profile picture."); }
  };
  const choosePicture = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify.warning("Choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { notify.warning("Choose an image smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => updatePicture(reader.result);
    reader.readAsDataURL(file);
  };
  const saveProfile = async (values) => {
    await AdminService.updateProfile(values);
    const { data } = await AdminService.getProfile();
    setProfile(data); setEditing(false); notify.success("Profile updated successfully.");
  };
  return (
    <div className="profile-page">

      <h2 className="profile-title">Admin Profile</h2>

      <div className="profile-card">

        <div className="profile-left">

          {profilePicture ? <img className="profile-avatar-image" src={profilePicture} alt={`${profile.name} profile`} /> : <FaUserCircle className="profile-icon" />}

          <h3>{profile.name}</h3>

          <div className="profile-picture-actions">
            <label className="edit-picture-btn">Edit<input type="file" accept="image/*" onChange={choosePicture} /></label>
            {profilePicture && <button type="button" className="delete-picture-btn" onClick={() => updatePicture("")}>Delete</button>}
          </div>

          <p>{profile.email}</p>

        </div>

        <div className="profile-right">

          <div className="profile-row">
            <span>Name</span>
            <strong>{profile.name}</strong>
          </div>

          <div className="profile-row">
            <span>Role</span>
            <strong>{profile.role}</strong>
          </div>

          <div className="profile-row">
            <span>Department</span>
            <strong>{profile.department}</strong>
          </div>

          <div className="profile-row">
            <span>Mobile</span>
            <strong>{profile.mobile}</strong>
          </div>

          <div className="profile-row">
            <span>Location</span>
            <strong>{profile.location}</strong>
          </div>

          <div className="profile-row">
            <span>Experience</span>
            <strong>{profile.experience}</strong>
          </div>

          <div className="profile-row">
            <span>Status</span>
            <strong className="active">{profile.status}</strong>
          </div>

          <div className="profile-buttons">

            <button className="edit-btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>

          </div>

        </div>

      </div>

      <RecordDialog record={editing ? profile : null} mode="edit" title="Edit profile" fields={["name", "email", "department", "mobile", "location", "experience"]} onClose={() => setEditing(false)} onSave={saveProfile} />

    </div>
  );
}

export default Profile;
