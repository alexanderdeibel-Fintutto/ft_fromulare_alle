import React, { useEffect } from 'react';

export default function SEOSchema() {
  useEffect(() => {
    // Set page title
    document.title = "Mietrendite-Rechner 2026 | Kostenlos Rendite berechnen | FinTuttO";
    
    // Helper to set/update meta tag
    const setMeta = (name, value, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', value);
    };

    // Set standard meta tags
    setMeta('description', 'Berechne kostenlos die Mietrendite deiner Immobilie. Brutto- & Netto-Rendite, Cashflow, Eigenkapitalrendite mit Finanzierungs-Simulation und PDF-Export.');
    setMeta('keywords', 'Mietrendite, Rendite Immobilie, Bruttomietrendite, Nettomietrendite, Eigenkapitalrendite, Immobilien Rechner');
    setMeta('author', 'FinTuttO GmbH');
    setMeta('robots', 'index, follow');

    // Set canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://fintutto.de';

    // Set Open Graph tags
    setMeta('og:type', 'website', true);
    setMeta('og:title', 'Mietrendite-Rechner | Kostenlos Rendite berechnen', true);
    setMeta('og:description', 'Berechne in 30 Sekunden, ob sich deine Immobilie lohnt. Brutto- & Netto-Rendite, Cashflow-Analyse, PDF-Export.', true);
    setMeta('og:image', 'https://fintutto.de/og-image.png', true);
    setMeta('og:locale', 'de_DE', true);
    setMeta('og:site_name', 'FinTuttO', true);

    // Set Twitter Card tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', 'Mietrendite-Rechner | Kostenlos Rendite berechnen');
    setMeta('twitter:description', 'Berechne in 30 Sekunden, ob sich deine Immobilie lohnt.');
    setMeta('twitter:image', 'https://fintutto.de/og-image.png');

    // Add JSON-LD schema
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": "https://fintutto.de/#app",
          "name": "FinTuttO Mietrendite-Rechner",
          "description": "Kostenloser Online-Rechner zur Berechnung der Mietrendite von Immobilien",
          "url": "https://fintutto.de/",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "127",
            "bestRating": "5",
            "worstRating": "1"
          },
          "author": {
            "@type": "Organization",
            "name": "FinTuttO GmbH",
            "url": "https://fintutto.de"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Was ist die Bruttomietrendite?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Die Bruttomietrendite berechnet sich aus der Jahresmiete geteilt durch den Kaufpreis mal 100. Sie gibt einen ersten Überblick, berücksichtigt aber keine Nebenkosten oder Finanzierung."
              }
            },
            {
              "@type": "Question",
              "name": "Was ist eine gute Mietrendite?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Eine Bruttomietrendite ab 5% gilt als gut, ab 6% als sehr gut. Bei der Nettomietrendite sind Werte ab 3,5% akzeptabel und ab 4,5% gut."
              }
            }
          ]
        }
      ]
    };

    let schemaTag = document.querySelector('script[type="application/ld+json"]');
    if (!schemaTag) {
      schemaTag = document.createElement('script');
      schemaTag.type = 'application/ld+json';
      document.head.appendChild(schemaTag);
    }
    schemaTag.textContent = JSON.stringify(schemaData);
  }, []);

  return null;
}