import { useEffect } from 'react';

const URL_BASE = 'https://optimizacioncdts.vercel.app';

const setMetaTag = (selector, attr, valor) => {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, valor);
};

/**
 * Actualiza `<title>`, la meta description, el canonical y los tags Open
 * Graph/Twitter al entrar a una ruta -- así cada pestaña tiene su propio
 * título y descripción para buscadores, en vez de que todas compartan el
 * mismo `<title>` fijo de `index.html`.
 *
 * Solo cubre `title`/`description`/`canonical`/OG básicos: los rastreadores
 * que SÍ ejecutan JavaScript (Google) ven estos valores; los que no lo
 * ejecutan (vistas previas de WhatsApp, Twitter, Slack) siguen viendo el
 * `<title>`/OG genérico que ya trae `index.html` sin renderizar -- ver la
 * nota de "fuera de alcance" en el plan de SEO.
 */
export default function useDocumentMeta({ slug, titulo, metaTitulo, metaDescripcion }) {
  useEffect(() => {
    const url = `${URL_BASE}${slug === '' ? '/' : `/${slug}`}`;

    document.title = metaTitulo;
    setMetaTag('meta[name="description"]', 'content', metaDescripcion);
    setMetaTag('link[rel="canonical"]', 'href', url);

    setMetaTag('meta[property="og:url"]', 'content', url);
    setMetaTag('meta[property="og:title"]', 'content', titulo);
    setMetaTag('meta[property="og:description"]', 'content', metaDescripcion);
    setMetaTag('meta[name="twitter:title"]', 'content', titulo);
    setMetaTag('meta[name="twitter:description"]', 'content', metaDescripcion);
  }, [slug, titulo, metaTitulo, metaDescripcion]);
}
