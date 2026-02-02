import { useEffect } from 'react';

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Prefetch common resources
    const links = [
      { rel: 'prefetch', href: '/api/rechner' },
      { rel: 'dns-prefetch', href: 'https://aaefocdqgdgexkcrjhks.supabase.co' }
    ];

    links.forEach(({ rel, href }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    });

    // Lazy load images
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[loading="lazy"]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      images.forEach(img => imageObserver.observe(img));
    }

    // Core Web Vitals tracking
    if ('web-vital' in window) {
      const vitals = window['web-vital'];
      ['getCLS', 'getFID', 'getFCP', 'getLCP', 'getTTFB'].forEach(metric => {
        if (vitals[metric]) {
          vitals[metric](console.log);
        }
      });
    }
  }, []);

  return null;
}