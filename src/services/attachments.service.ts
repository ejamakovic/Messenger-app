// attachments.service.ts
import { api, API_URL } from "./api";

/**
 * Downloads a protected media attachment from the backend and converts it into a local Object URL.
 * Automatically utilizes the authenticated request instance to bypass the security filters.
 */
export async function fetchSecureAttachmentBlob(src: string): Promise<string> {
  if (!src) return "";
  
  // If it's a pending/optimistic file or base64 data string, use it instantly without network calls
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return src;
  }

  const response = await api.get(src, { responseType: "blob" });
  return URL.createObjectURL(response.data);
}

/**
 * Compiles a raw application asset url based on attachment metadata context
 */
export function buildAttachmentUrl(attachment: { id?: number; fileUrl: string }): string {
  if (attachment.id) {
    return `${API_URL}/attachments/${attachment.id}`;
  }
  
  return attachment.fileUrl.startsWith("http") || 
         attachment.fileUrl.startsWith("data:") || 
         attachment.fileUrl.startsWith("blob:")
    ? attachment.fileUrl
    : `${API_URL}${attachment.fileUrl}`;
}