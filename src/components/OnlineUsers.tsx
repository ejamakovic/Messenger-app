import styles from "../styles/OnlineUsers.module.css"
import type { UserModel } from "../models/user"
import { useNavigate } from "react-router-dom"

export default function OnlineUsers({
  users,
  currentUser
}: {
  users: UserModel[]
  currentUser: UserModel
}) {
  const navigate = useNavigate()

  return (<div className={styles.container}>

  <div className={styles.title}>
    Online Users
  </div>

  {users
    .filter(u => u.username !== currentUser.username)
    .map(u => (
      <div
        key={u.username}
        className={styles.user}
        onClick={() => navigate(`/chat/${u.username}`)}
      >
        {u.username}
      </div>
    ))}
</div>
)
}