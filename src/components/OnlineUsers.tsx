import type { User } from "../models/user"
import { useNavigate } from "react-router-dom"

export default function OnlineUsers({ users, currentUser }: { users: User[], currentUser: User }) {
  const navigate = useNavigate()

  return (
    <div style={{ width: 200, borderRight: "1px solid gray" }}>
      <h3>Online Users</h3>

      {users
        .filter((u) => u.username !== currentUser.username)
        .map((u) => (
          <div
            key={u.username}
            onClick={() => navigate(`/chat/${u.username}`)}
            style={{
              cursor: "pointer",
              padding: "6px",
              borderRadius: "4px"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#eee"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {u.username}
          </div>
        ))}
    </div>
  )
}