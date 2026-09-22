import { FileText, Image, Video, ExternalLink, CreditCard, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface ChatMessageProps {
  body: string;
  isFromAdmin: boolean;
  isOwn: boolean;
  timestamp: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  messageType?: string;
}

export default function ChatMessage({ body, isFromAdmin, isOwn, timestamp, attachmentUrl, attachmentName, messageType }: ChatMessageProps) {
  const renderAttachment = () => {
    if (!attachmentUrl) return null;
    const name = attachmentName || "Attachment";
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    const isVideo = ["mp4", "webm", "mov"].includes(ext);

    if (isImage) {
      return (
        <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-lg overflow-hidden max-w-[240px]">
          <img src={attachmentUrl} alt={name} className="w-full h-auto rounded-lg" />
        </a>
      );
    }
    if (isVideo) {
      return (
        <video src={attachmentUrl} controls className="mt-2 rounded-lg max-w-[240px]" />
      );
    }
    return (
      <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isOwn ? "bg-white/10 hover:bg-white/20" : "bg-muted hover:bg-muted/80"} transition-colors`}>
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate">{name}</span>
        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
      </a>
    );
  };

  const renderSpecialMessage = () => {
    if (messageType === "payment_link") {
      return (
        <div className={`mt-2 rounded-lg p-3 ${isOwn ? "bg-white/10" : "bg-accent/10 border border-accent/20"}`}>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold">Payment Link</span>
          </div>
          <a href={body} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline break-all flex items-center gap-1">
            {body} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
    }
    if (messageType === "service_link") {
      const serviceId = body.replace("/services/", "");
      return (
        <div className={`mt-1 rounded-lg p-3 ${isOwn ? "bg-white/10" : "bg-primary/10 border border-primary/20"}`}>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Service Recommendation</span>
          </div>
          <Link to={`/services/${serviceId}`} className="text-xs text-primary hover:underline flex items-center gap-1">
            View Service Details <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );
    }
    return null;
  };

  const isSpecial = messageType === "payment_link" || messageType === "service_link";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
        isOwn
          ? "btn-gradient text-primary-foreground rounded-br-sm"
          : "bg-muted text-foreground rounded-bl-sm"
      }`}>
        {isFromAdmin && !isOwn && <p className="text-[10px] font-semibold text-primary mb-0.5">Admin</p>}
        {!isSpecial && <p className="text-sm whitespace-pre-wrap">{body}</p>}
        {renderSpecialMessage()}
        {renderAttachment()}
        <p className={`text-[10px] mt-1 ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
