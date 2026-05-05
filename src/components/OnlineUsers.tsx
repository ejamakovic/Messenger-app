import type { User } from "../models/user"

export default function OnlineUsers({ users, currentUser }: { users: User[], currentUser: User }) {
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