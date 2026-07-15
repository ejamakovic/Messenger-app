import { useState, useEffect } from "react";
import { fetchSecureAttachmentBlob } from "../../services/attachments.service";

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderClassName?: string;
}

export default function SecureImage({ src, placeholderClassName, ...props }: SecureImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    let objectUrl = "";

    fetchSecureAttachmentBlob(src)
      .then((localUrl) => {
        if (localUrl.startsWith("blob:") && localUrl !== src) {
          objectUrl = localUrl;
        }
        setImageSrc(localUrl);
      })
      .catch((err) => console.error("Failed to load secure image:", err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!imageSrc) return <div className={placeholderClassName}>Loading...</div>;
  return <img src={imageSrc} {...props} alt={props.alt ?? "Secure content"} />;
}