import { useEffect, useState } from "react"
import type { Message } from "../models/message"
import { getPublicMessages } from "../services/message.service"

export default function PublicChat() {
    const [chat, setChat] = useState<Message[]>([])

    useEffect(() => {
        console.log("🔄 loading global messages")

        getPublicMessages()
            .then((data) => {
                setChat(data)
            })
            .catch((err) => {
                console.log("❌ ERROR LOADING MESSAGES:", err.message)
            })
    }, [])

   return (
    <div>
        <h2>Public Chat</h2>

        <div>
            {chat.length === 0 ? (
                <p>Nema poruka...</p>
            ) : (
                chat.map((msg, index) => (
                    <div key={index}>
                        <div>
                            <strong>
                                {msg.sender?.username || "Unknown"}
                            </strong>
                        </div>

                        <div>
                            {msg.content}
                        </div>

                        {msg.timestamp && (
                            <div>
                                <small>
                                    {new Date(msg.timestamp).toLocaleString()}
                                </small>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
)
}