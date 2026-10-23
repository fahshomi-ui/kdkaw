import { useEffect } from 'react';

interface Props {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, any>;
}

const ensureMeta = (selector: string, attr: string, value: string, content: string) => {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const ensureLink = (rel: string, href: string) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
};

const SEO = ({ title, description, image, url, type = 'website', jsonLd }: Props) => {
  useEffect(() => {
    const fullTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
    document.title = fullTitle;
    const desc = (description || '').slice(0, 160);
    const canonical = url || window.location.href.split('?')[0];

    if (desc) ensureMeta('meta[name="description"]', 'name', 'description', desc);
    ensureMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    if (desc) ensureMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    ensureMeta('meta[property="og:type"]', 'property', 'og:type', type);
    ensureMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    if (image) ensureMeta('meta[property="og:image"]', 'property', 'og:image', image);
    ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    if (desc) ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
    if (image) ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    ensureLink('canonical', canonical);

    // JSON-LD
    let ldEl = document.head.querySelector('script[data-seo-jsonld]') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!ldEl) {
        ldEl = document.createElement('script');
        ldEl.type = 'application/ld+json';
        ldEl.setAttribute('data-seo-jsonld', '1');
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = JSON.stringify(jsonLd);
    } else if (ldEl) {
      ldEl.remove();
    }
  }, [title, description, image, url, type, jsonLd]);

  return null;
};

export default SEO;
