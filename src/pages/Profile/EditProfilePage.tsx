import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EditProfilePage.module.css";
import TopMenu from "../../components/TopMenu/TopMenu";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, uploadAvatar } from "../../services/profile.service";
import { useInbox } from "../../hooks/useInbox";
import { Camera, ArrowLeft } from "lucide-react";
import { buildAvatarUrl } from "../../services/attachments.service";

export default function EditProfilePage() {
  const { user, token, saveSession } = useAuth();
  const navigate = useNavigate();

  const { conversations, notifications, setNotifications } = useInbox(user);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(buildAvatarUrl(user?.avatarUrl));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = user.avatarUrl;

      if (avatarFile) {
        const res = await uploadAvatar(user.id, avatarFile);
        avatarUrl = res.avatarUrl;
      }

      const updated = await updateProfile(user.id, { firstName, lastName, email, bio, avatarUrl });

      saveSession(updated, token ?? "");
      alert("Profil je uspješno ažuriran.");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Greška prilikom spremanja profila.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className={styles.appSpinnerView}>Učitavanje...</div>;
  }

  return (
    <div className={styles.masterWrapper}>
      <TopMenu
        user={user}
        conversations={conversations}
        notifications={notifications}
        onNotificationRead={(id) =>
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "OPENED" } : n)))
        }
        onNotificationRemove={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />

      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Nazad
        </button>

        <div className={styles.editCard}>
          <h2>Uredi profil</h2>

          <div className={styles.avatarEditRow}>
            <div className={styles.avatarLarge}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <span>{user.username.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className={styles.hiddenFileInput}
              onChange={handleAvatarPick}
            />
            <button className={styles.changeAvatarBtn} onClick={() => fileInputRef.current?.click()}>
              <Camera size={14} /> Promijeni sliku
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>Korisničko ime</label>
            <input type="text" value={user.username} disabled />
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Ime</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Prezime</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Biografija</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Spremanje..." : "Spremi promjene"}
          </button>
        </div>
      </div>
    </div>
  );
}