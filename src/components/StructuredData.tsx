import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Escape "<" so text from Steam can never close the script tag early
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

// Home page only: WebSite gives Google the site name for results, WebApplication describes the tool
export function StructuredData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: SITE_NAME,
            alternateName: "DoINeedToUpgrade",
            url: `${SITE_URL}/`,
            inLanguage: "en",
          },
          {
            "@type": "WebApplication",
            name: SITE_NAME,
            description: SITE_DESCRIPTION,
            url: `${SITE_URL}/`,
            applicationCategory: "UtilityApplication",
            operatingSystem: ["Windows", "macOS", "Linux"],
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            image: `${SITE_URL}/icon-512.png`,
          },
        ],
      }}
    />
  );
}
