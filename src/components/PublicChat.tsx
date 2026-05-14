import styles from "../styles/PublicChat.module.css"
import type { Message } from "../models/message"
import type { User } from "../models/user"
import { API_URL } from "../services/api"
import { useState } from "react"

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

  const [previewImage, setPreviewImage] =
    useState<string | null>(null)

  return (

    <div
      ref={containerRef}
      onScroll={onScroll}
      className={styles.chatContainer}
    >

      {messages.map((msg) => {

        const isMine =
          msg.sender?.username ===
          currentUser.username

        return (

          <div
            key={msg.id}
            className={
              isMine
                ? styles.messageRowMine
                : styles.messageRowTheirs
            }
          >

            <div
              className={
                isMine
                  ? styles.bubbleMine
                  : styles.bubbleTheirs
              }
            >

              <div className={styles.username}>
                {msg.sender?.username}
              </div>

              {msg.content && (
                <div className={styles.content}>
                  {msg.content}
                </div>
              )}

              {msg.attachments &&
                msg.attachments.length > 0 && (

                  <div className={styles.attachments}>

                    {msg.attachments.map((att) => {

                      const isImage =
                        att.fileType?.startsWith("image/")

                      const isVideo =
                        att.fileType?.startsWith("video/")

                      return (

                        <div key={att.id}>

                          {isImage && (

                            <img
                              src={`${API_URL}${att.fileUrl}`}
                              alt="attachment"
                              className={styles.image}
                              onClick={() =>
                                setPreviewImage(
                                  `${API_URL}${att.fileUrl}`
                                )
                              }
                            />

                          )}

                          {isVideo && (

                            <video
                              controls
                              className={styles.video}
                            >

                              <source
                                src={`${API_URL}${att.fileUrl}`}
                                type={att.fileType}
                              />

                            </video>

                          )}

                        </div>
                      )
                    })}

                  </div>

                )}

            </div>

          </div>
        )
      })}

      {previewImage && (

        <div
          className={styles.imageOverlay}
          onClick={() =>
            setPreviewImage(null)
          }
        >

          <img
            src={previewImage}
            className={styles.previewImage}
            alt="preview"
          />

        </div>

      )}

    </div>
  )
}