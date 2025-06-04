import { useEffect } from "react";

interface AdBannerProps {
  slot: string;
  style?: React.CSSProperties;
  format?: string;
  responsive?: boolean;
}

export function AdBanner({
  slot,
  style,
  format = "auto",
  responsive = true,
}: AdBannerProps) {
  useEffect(() => {
    try {
      // @ts-expect-error: adsbygoogle is injected by the AdSense script and not typed
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={style || { display: "block" }}
      data-ad-client="ca-pub-5098435216044388"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : undefined}
    />
  );
}
