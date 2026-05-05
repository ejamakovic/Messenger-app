import { useEffect, useState } from "react"
import { getOnlineUsers } from "../services/user.service"
import type { User } from "../models/user"

export default function OnlineUsers({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    getOnlineUsers()
      .then(setUsers)
      .catch((err) => {
        console.log("❌ ERROR USERS:", err.message)
      })
  }, [])

  return (
    <div style={{ width: 200, borderRight: "1px solid gray" }}>
      <h3>Online Users</h3>

      {users
        .filter((u) => u.username !== currentUser.username)
        .map((u) => (
          <div key={u.username}>
            {u.username}
          </div>
        ))}
    </div>
  )
}