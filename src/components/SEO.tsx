import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { seoConfig } from "@/seo.config";

interface SEOProps {
  language: "sv" | "en";
  path: string;
}

export const SEO = ({ language, path }: SEOProps) => {
  const config = seoConfig[language];
  const currentUrl = `${config.alternateUrls[language]}${path}`;
  const baseUrl = config.alternateUrls[language];
  const imageUrl = `${baseUrl}${config.image.url}`;

  useEffect(() => {
    // Add structured data
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(config.structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [language]);

  return (
    <Helmet>
      {/* Basic meta tags */}
      <html lang={language} />
      <title>{config.title}</title>
      <meta name="description" content={config.description} />
      <meta name="keywords" content={config.keywords} />

      {/* Open Graph meta tags */}
      <meta property="og:title" content={config.title} />
      <meta property="og:description" content={config.description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Gouda Cars" />
      <meta
        property="og:locale"
        content={language === "sv" ? "sv_SE" : "en_US"}
      />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content={config.image.width.toString()} />
      <meta
        property="og:image:height"
        content={config.image.height.toString()}
      />
      <meta property="og:image:alt" content={config.image.alt} />
      <meta property="og:image:type" content={config.image.type} />

      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={config.title} />
      <meta name="twitter:description" content={config.description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={config.image.alt} />

      {/* Canonical and alternate language links */}
      <link rel="canonical" href={currentUrl} />
      {Object.entries(config.alternateUrls).map(([lang, url]) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${url}${path}`}
        />
      ))}

      {/* Additional meta tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#55B7FF" />
      <meta name="robots" content="index, follow" />

      {/* Favicon */}
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="msapplication-TileColor" content="#55B7FF" />
    </Helmet>
  );
};
