// Stemma della squadra: immagine caricata, oppure il logo dell'app come fallback.
import BrandMark from "./BrandMark";

export default function TeamCrest({
  crestUrl,
  className,
}: {
  crestUrl?: string | null;
  className?: string;
}) {
  if (crestUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={crestUrl} alt="" className={`object-cover ${className ?? ""}`} />;
  }
  return <BrandMark className={className} />;
}
