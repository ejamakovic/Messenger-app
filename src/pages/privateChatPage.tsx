import { useParams } from "react-router-dom"
import PrivateChat from "../components/PrivateChat"

export default function PrivateChatPage() {
  const { username } = useParams()

  return (
    <div style={{ display: "flex", height: "100vh" }}>    

      {/* PRIVATE CHAT */}
      <PrivateChat chatWith={username || ""} />

    </div>
  )
}