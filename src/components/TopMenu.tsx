import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TopMenu.css";

const dummyConversations = [
  {
    id: 1,
    user: "Amar",
    lastMessage: { text: "E gdje si?" },
  },
  {
    id: 2,
    user: "Lejla",
    lastMessage: { text: "Vidimo se kasnije" },
  },
];

const dummyNotifications = [
  { id: 1, text: "Novi follower" },
  { id: 2, text: "Poruka stigla" },
];

const TopMenu = ({ conversations = [], notifications = [] }) => {
  const navigate = useNavigate();

  const [showChats, setShowChats] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifList, setNotifList] = useState(
    notifications.length ? notifications : dummyNotifications
  );

  const deleteNotification = (id: any) => {
    setNotifList((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="navbar">
      <h3 className="brand" onClick={() => navigate("/")}>
        MyApp
      </h3>

      <div className="menu">
        <button onClick={() => navigate("/")}>
          Javni Chat
        </button>

        <div className="dropdown">
          <button onClick={() => setShowChats(!showChats)}>
            Razgovori
          </button>

          {showChats && (
            <div className="dropdownContent">
              {conversations.length === 0 && <p>Nema razgovora</p>}

              {conversations.map((msg) => {
                const otherUser =
                  msg.sender.username === JSON.parse(localStorage.getItem("user") || "{}").username
                    ? msg.receiver?.username
                    : msg.sender?.username;

                return (
                  <div
                    key={msg.id}
                    className="item"
                    onClick={() => navigate(`/chat/${otherUser}`)}
                  >
                    <strong>{otherUser}</strong>
                    <p className="messageText">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dropdown">
          <button onClick={() => setShowNotifications(!showNotifications)}>
            Notifikacije ({notifList.length})
          </button>

          {showNotifications && (
            <div className="dropdownContent">
              {notifList.length === 0 && <p>Nema notifikacija</p>}

              {notifList.map((notif) => (
                <div key={notif.id} className="item">
                  <span>{notif.text}</span>
                  <button
                    className="deleteBtn"
                    onClick={() => deleteNotification(notif.id)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopMenu;