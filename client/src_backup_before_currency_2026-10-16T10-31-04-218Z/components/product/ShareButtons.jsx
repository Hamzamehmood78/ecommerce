import { Share2, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function ShareButtons({ productName }) {
  const url = window.location.href;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${productName} - ${url}`)}`, "_blank");
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center gap-3 text-muted">
      <Share2 size={16} />
      <button onClick={handleWhatsApp} className="text-sm hover:text-primary">
        WhatsApp
      </button>
      <button onClick={handleFacebook} className="text-sm hover:text-primary">
        Facebook
      </button>
      <button onClick={handleCopy} className="flex items-center gap-1 text-sm hover:text-primary">
        <Copy size={14} /> Copy Link
      </button>
    </div>
  );
}