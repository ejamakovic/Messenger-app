// src/components/ChatSettings/ChatSettingsModal.tsx
import { useEffect, useState } from "react";
import { X, Image as ImageIcon, Users, UserPlus, Settings, Trash2, Shield, Film } from "lucide-react";
import styles from "./ChatSettingsModal.module.css";
import type { Conversation } from "../../models/conversation";
import type { ConversationMemberDto } from "../../models/conversationMember";
import type { UserModel } from "../../models/user";
import type { Attachment } from "../../models/attachment";
import {
  getConversationMembers,
  getAvailableUsersForConversation,
  addConversationMember,
  removeConversationMember,
  changeConversationMemberRole,
  updateConversationDetails,
  uploadConversationImage,
  getConversationMedia,
} from "../../services/conversation.service";
import { buildAttachmentUrl, buildAvatarUrl } from "../../services/attachments.service";
import SecureImage from "../SecureImage/SecureImage";

type Tab = "info" | "members" | "add" | "media";

type Props = {
  conversation: Conversation;
  currentUserId: number;
  otherUser?: UserModel | null; // for PRIVATE chats
  onClose: () => void;
  onUpdated: (updated: Partial<Conversation>) => void;
};

export default function ChatSettingsModal({ conversation, currentUserId, otherUser, onClose, onUpdated }: Props) {
  const isGroup = conversation.type === "GROUP";
  const [tab, setTab] = useState<Tab>("info");

  const [members, setMembers] = useState<ConversationMemberDto[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserModel[]>([]);
  const [media, setMedia] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(conversation.name || "");
  const [saving, setSaving] = useState(false);

  const myMembership = members.find((m) => m.user.id === currentUserId);
  const canManage = myMembership?.role === "ADMIN" || myMembership?.role === "OWNER";

  useEffect(() => {
    if (isGroup && (tab === "members" || tab === "info")) {
      getConversationMembers(conversation.id).then(setMembers).catch(console.error);
    }
    if (isGroup && tab === "add") {
      setLoading(true);
      getAvailableUsersForConversation(conversation.id)
        .then(setAvailableUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
    if (tab === "media") {
      setLoading(true);
      getConversationMedia(conversation.id)
        .then(setMedia)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [tab, conversation.id, isGroup]);

  const handleSaveName = async () => {
    if (!name.trim() || name === conversation.name) return;
    setSaving(true);
    try {
      const updated = await updateConversationDetails(conversation.id, name.trim());
      onUpdated({ name: updated.name });
    } catch (err) {
      console.error("Failed to update group name:", err);
      alert("Greška prilikom ažuriranja naziva grupe.");
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadConversationImage(conversation.id, file);
      onUpdated({ imageUrl: res.imageUrl });
    } catch (err) {
      console.error("Failed to upload group image:", err);
      alert("Greška prilikom promjene slike grupe.");
    }
  };

  const handleAddMember = async (userId: number) => {
    try {
      await addConversationMember(conversation.id, userId);
      setAvailableUsers((prev) => prev.filter((u) => u.id !== userId));
      getConversationMembers(conversation.id).then(setMembers);
    } catch (err) {
      console.error("Failed to add member:", err);
      alert("Greška prilikom dodavanja člana.");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm("Ukloniti ovog člana iz grupe?")) return;
    try {
      await removeConversationMember(conversation.id, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err: any) {
      console.error("Failed to remove member:", err);
      alert(err?.response?.data || "Greška prilikom uklanjanja člana.");
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      const updated = await changeConversationMemberRole(conversation.id, userId, role);
      setMembers((prev) => prev.map((m) => (m.user.id === userId ? { ...m, role: updated.role } : m)));
    } catch (err: any) {
      console.error("Failed to change role:", err);
      alert(err?.response?.data || "Greška prilikom promjene uloge.");
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{isGroup ? "Postavke grupe" : "Postavke chata"}</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.tabs}>
          <button className={tab === "info" ? styles.tabActive : styles.tab} onClick={() => setTab("info")}>
            <Settings size={14} /> Info
          </button>
          {isGroup && (
            <button className={tab === "members" ? styles.tabActive : styles.tab} onClick={() => setTab("members")}>
              <Users size={14} /> Članovi
            </button>
          )}
          {isGroup && canManage && (
            <button className={tab === "add" ? styles.tabActive : styles.tab} onClick={() => setTab("add")}>
              <UserPlus size={14} /> Dodaj
            </button>
          )}
          <button className={tab === "media" ? styles.tabActive : styles.tab} onClick={() => setTab("media")}>
            <Film size={14} /> Mediji
          </button>
        </div>

        <div className={styles.body}>
          {tab === "info" && (
            <div className={styles.infoTab}>
              <div className={styles.avatarRow}>
                <div className={styles.avatarLarge}>
                  {isGroup ? (
                    conversation.imageUrl ? (
                      <SecureImage src={buildAttachmentUrl({ fileUrl: conversation.imageUrl })} />
                    ) : (
                      <Users size={28} />
                    )
                  ) : otherUser?.avatarUrl ? (
                    <img src={buildAvatarUrl(otherUser.avatarUrl)} alt={otherUser.username} />
                  ) : (
                    <span>{(otherUser?.username || "?").substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                {isGroup && canManage && (
                  <label className={styles.changeImageBtn}>
                    <ImageIcon size={14} /> Promijeni sliku
                    <input type="file" accept="image/*" hidden onChange={handleImagePick} />
                  </label>
                )}
              </div>

              {isGroup ? (
                <>
                  <label className={styles.fieldLabel}>Naziv grupe</label>
                  <input
                    className={styles.textInput}
                    value={name}
                    disabled={!canManage}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {canManage && (
                    <button className={styles.saveBtn} disabled={saving} onClick={handleSaveName}>
                      {saving ? "Spremanje..." : "Spremi naziv"}
                    </button>
                  )}
                </>
              ) : (
                <p className={styles.privateInfoText}>@{otherUser?.username}</p>
              )}
            </div>
          )}

          {tab === "members" && isGroup && (
            <div className={styles.list}>
              {members.map((m) => (
                <div key={m.id} className={styles.memberRow}>
                  <div className={styles.memberInfo}>
                    <div className={styles.avatarSmall}>
                      {m.user.avatarUrl ? (
                        <img src={buildAvatarUrl(m.user.avatarUrl)} alt={m.user.username} />
                      ) : (
                        m.user.username.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <span>@{m.user.username}</span>
                    <span className={styles.roleBadge}>{m.role}</span>
                  </div>

                  {canManage && m.role !== "OWNER" && m.user.id !== currentUserId && (
                    <div className={styles.memberActions}>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user.id, e.target.value)}
                      >
                        <option value="MEMBER">Član</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button onClick={() => handleRemoveMember(m.user.id)} title="Ukloni">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  {m.role === "OWNER" && <Shield size={14} className={styles.ownerIcon} />}
                </div>
              ))}
            </div>
          )}

          {tab === "add" && isGroup && canManage && (
            <div className={styles.list}>
              {loading ? (
                <p className={styles.emptyText}>Učitavanje...</p>
              ) : availableUsers.length === 0 ? (
                <p className={styles.emptyText}>Svi korisnici su već u grupi.</p>
              ) : (
                availableUsers.map((u) => (
                  <div key={u.id} className={styles.memberRow}>
                    <span>@{u.username}</span>
                    <button onClick={() => handleAddMember(u.id)}>Dodaj</button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "media" && (
            <div className={styles.mediaGrid}>
              {loading ? (
                <p className={styles.emptyText}>Učitavanje...</p>
              ) : media.length === 0 ? (
                <p className={styles.emptyText}>Nema podijeljenih medija.</p>
              ) : (
                media.map((att) => (
                  <div key={att.id} className={styles.mediaThumb}>
                    {att.fileType?.startsWith("video/") ? (
                      <video src={buildAttachmentUrl(att)} />
                    ) : (
                      <SecureImage src={buildAttachmentUrl(att)} />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}