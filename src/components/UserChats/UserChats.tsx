import { useNavigate } from "react-router-dom";
import type { Conversation } from "../../models/conversation";


export default function UserChats({
    conversations
} : {
    conversations: Conversation[]
}){
    const navigate = useNavigate()

    return (<div className="{styles.chats"> 

    </div>

    )
    
}