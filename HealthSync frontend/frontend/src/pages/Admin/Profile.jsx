import React, { useEffect, useState } from "react";
import "./Profile.css";
import { FaUserCircle } from "react-icons/fa";
import RecordDialog from "../../components/RecordDialog";
import AdminService from "../../services/AdminService";
import { notify } from "../../components/ToastProvider";

const compressImage = (file, maxWidth = 320, maxHeight = 320, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

function Profile() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "Administrator", email: "healthsyncproject3502@gmail.com", role: "Admin", department: "HealthSync", mobile: "9876543210", location: "Chennai", experience: "5 Years", status: "Active" });
  const [profilePicture, setProfilePicture] = useState(() => localStorage.getItem("healthsync-admin-profile-picture") || "");

  useEffect(() => {
    const loadProfile = async () => {
      const localPic = localStorage.getItem("healthsync-admin-profile-picture");
      if (localPic) setProfilePicture(localPic);
      try {
        const [profileResponse, settingsResponse] = await Promise.allSettled([AdminService.getProfile(), AdminService.getSettings()]);
        if (profileResponse.status === "fulfilled" && profileResponse.value?.data) {
          setProfile(profileResponse.value.data);
        }
        if (settingsResponse.status === "fulfilled" && settingsResponse.value?.data?.profilePicture) {
          const pic = settingsResponse.value.data.profilePicture;
          setProfilePicture(pic);
          localStorage.setItem("healthsync-admin-profile-picture", pic);
        } else if (localPic) {
          setProfilePicture(localPic);
        }
      } catch {
        if (localPic) setProfilePicture(localPic);
      }
    };
    loadProfile();
  }, []);

  const updatePicture = async (picture) => {
    setProfilePicture(picture);
    if (picture) {
      localStorage.setItem("healthsync-admin-profile-picture", picture);
    } else {
      localStorage.removeItem("healthsync-admin-profile-picture");
    }
    window.dispatchEvent(new CustomEvent("healthsync-profile-picture", { detail: { profilePicture: picture } }));

    try {
      let currentSettings = {};
      try {
        const res = await AdminService.getSettings();
        currentSettings = res.data || {};
      } catch {}
      await AdminService.updateSettings({ ...currentSettings, profilePicture: picture });
    } catch {
      // Offline fallback: already safely persisted in localStorage
    }
    notify.success(picture ? "Profile picture updated successfully." : "Profile picture deleted successfully.");
  };

  const choosePicture = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify.warning("Choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { notify.warning("Choose an image smaller than 5 MB."); return; }
    try {
      const compressed = await compressImage(file);
      await updatePicture(compressed);
    } catch {
      notify.error("Unable to process the image.");
    }
  };

  const saveProfile = async (values) => {
    try {
      await AdminService.updateProfile(values);
      const { data } = await AdminService.getProfile();
      setProfile(data);
    } catch {
      setProfile((prev) => ({ ...prev, ...values }));
    }
    setEditing(false);
    notify.success("Profile updated successfully.");
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
