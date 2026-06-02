import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/TopMenu.module.css";
import type { Conversation } from "../models/conversation";


interface NotificationItem {
  id: number;
  text: string;
}

const dummyNotifications: NotificationItem[] = [
  { id: 1, text: "Novi follower" },
  { id: 2, text: "Poruka stigla" },
];

interface TopMenuProps {
  conversations?: Conversation[];
  notifications?: NotificationItem[];
}

export default function TopMenu({ conversations = [], notifications = [] }: TopMenuProps) {
  const navigate = useNavigate();

  const [showChats, setShowChats] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Using dummy data directly for notifications as requested
  const [notifList, setNotifList] = useState<NotificationItem[]>(
    notifications.length ? notifications : dummyNotifications
  );

  const deleteNotification = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevents the dropdown wrapper from closing on click
    setNotifList((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className={styles.navbar}>
      <h3 className={styles.brand} onClick={() => navigate("/")}>
        MyApp
      </h3>

      <div className={styles.menu}>
        <button className={styles.menuBtn} onClick={() => navigate("/")}>
          Javni Chat
        </button>

        {/* CHATS DROPDOWN */}
        <div className={styles.dropdown}>
          <button 
            className={styles.menuBtn} 
            onClick={() => { setShowChats(!showChats); setShowNotifications(false); }}
          >
            Razgovori
          </button>

          {showChats && (
            <div className={styles.dropdownContent}>
              {conversations.length === 0 && <p className={styles.emptyText}>Nema razgovora</p>}

              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={styles.item}
                  onClick={() => {
                    setShowChats(false);
                    navigate(`/chat/${conv.id}`);
                  }}
                >
                  <strong>Razgovor #{conv.id}</strong>
                  <p className={styles.messageText}>Last message...</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTIFICATIONS DROPDOWN */}
        <div className={styles.dropdown}>
          <button 
            className={styles.menuBtn} 
            onClick={() => { setShowNotifications(!showNotifications); setShowChats(false); }}
          >
            Notifikacije ({notifList.length})
          </button>

          {showNotifications && (
            <div className={styles.dropdownContent}>
              {notifList.length === 0 && <p className={styles.emptyText}>Nema notifikacija</p>}

              {notifList.map((notif) => (
                <div key={notif.id} className={styles.itemNotif}>
                  <span>{notif.text}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => deleteNotification(e, notif.id)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}