import { useEffect } from 'react';

export default function MetaTags({ 
  title, 
  description, 
  keywords,
  image = 'https://fintutto.de/og-image.png',
  url = 'https://fintutto.de',
  type = 'website',
  canonical
}) {
  useEffect(() => {
    // Title
    if (title) {
      document.title = title;
    }

    // Meta tags
    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    
    // Open Graph
    setMeta('og:title', title || 'FinTuttO', true);
    setMeta('og:description', description || 'Immobilien Tools', true);
    setMeta('og:image', image, true);
    setMeta('og:url', url, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', 'FinTuttO', true);
    setMeta('og:locale', 'de_DE', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title || 'FinTuttO');
    setMeta('twitter:description', description || 'Immobilien Tools');
    setMeta('twitter:image', image);

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }
  }, [title, description, keywords, image, url, type, canonical]);

  return null;
}