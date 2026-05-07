import "../styles/Chat.css"
import type { Message } from "../models/message"
import type { User } from "../models/user"
import { API_URL } from "../services/api"

type Props = {
  currentUser: User
  messages: Message[]
  containerRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
}

export default function PublicChat({
  currentUser,
  messages,
  containerRef,
  onScroll,
}: Props) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="chatContainer"
    >
      {messages.map((msg) => {
        const isMine =
          msg.sender?.username === currentUser.username

        return (
          <div
            key={msg.id}
            className={`messageRow ${
              isMine ? "mine" : "theirs"
            }`}
          >
            <div
              className={`bubble ${
                isMine
                  ? "mineBubble"
                  : "theirsBubble"
              }`}
            >
              <div className="username">
                {msg.sender?.username}
              </div>

              {msg.content && (
                <div className="messageContent">
                  {msg.content}
                </div>
              )}

              {msg.attachments &&
                msg.attachments.length > 0 && (
                  <div className="attachments">
                    {msg.attachments.map((att) => (
                      <img
                        key={att.id}
                        src={`${API_URL}${att.fileUrl}`}
                        alt="attachment"
                        className="image"
                      />
                    ))}
                  </div>
                )}
            </div>
          </div>
        )
      })}
    </div>
  )
}