import { useEffect, useState } from "react"
import { getOnlineUsers } from "../services/user.service"

type User = {
  username: string
}

export default function OnlineUsers() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    console.log("🔄 loading online users")

    getOnlineUsers()
      .then((data) => {
        console.log("✅ ONLINE USERS:", data)
        setUsers(data)
      })
      .catch((err) => {
        console.log("❌ ERROR USERS:", err.message)
      })
  }, [])

  return (
    <div style={{ width: 200, borderRight: "1px solid gray" }}>
      <h3>Online Users</h3>

      {users.map((u) => (
      <div key={u.username}>
        {u.username}
      </div>
    ))}
    </div>
  )
}