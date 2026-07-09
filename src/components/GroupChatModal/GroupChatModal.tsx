import { useEffect, useState } from "react";
import { X, Users } from "lucide-react";
import styles from "./GroupChatModal.module.css";
import { getAllUsers } from "../../services/user.service";
import { createGroupConversation } from "../../services/conversation.service";
import type { UserModel } from "../../models/user";

type Props = {
  currentUserId: number;
  onClose: () => void;
  onCreated: (conversationId: number) => void;
};

export default function GroupChatModal({ currentUserId, onClose, onCreated }: Props) {
  const [allUsers, setAllUsers] = useState<UserModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users.filter((u) => u.id !== currentUserId));
      } catch (err) {
        console.error("Failed to load users for group chat picker:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUserId]);

  const toggleUser = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    if (selectedIds.length < 2) {
      alert("Odaberite barem 2 korisnika za grupni chat.");
      return;
    }
    if (groupName.trim().length === 0) {
      alert("Unesite naziv grupe.");
      return;
    }

    setCreating(true);
    try {
      const conversation = await createGroupConversation(groupName.trim(), [
        currentUserId,
        ...selectedIds,
      ]);
      onCreated(conversation.id);
    } catch (err) {
      console.error("Failed to create group conversation:", err);
      alert("Greška prilikom kreiranja grupnog chata.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Users size={18} />
            <span>Novi grupni chat</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <input
          className={styles.groupNameInput}
          placeholder="Naziv grupe"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <div className={styles.userListScroll}>
          {loading ? (
            <div className={styles.loadingText}>Učitavanje korisnika...</div>
          ) : allUsers.length === 0 ? (
            <div className={styles.loadingText}>Nema dostupnih korisnika.</div>
          ) : (
            allUsers.map((u) => (
              <label key={u.id} className={styles.userRow}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={() => toggleUser(u.id)}
                />
                <span>@{u.username}</span>
              </label>
            ))
          )}
        </div>

        <button className={styles.createBtn} onClick={handleCreate} disabled={creating}>
          {creating ? "Kreiranje..." : "Kreiraj grupu"}
        </button>
      </div>
    </div>
  );
}