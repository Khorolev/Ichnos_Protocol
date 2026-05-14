import { Helmet } from 'react-helmet-async';

/**
 * Presentational <head> emitter. Renders the full canonical SEO block —
 * title, description, keywords, canonical link, Open Graph, Twitter Card,
 * and JSON-LD — for a single page from a meta constant.
 *
 * @param {object} meta     A *_META object from constants/seoMeta.js. Must expose
 *                          { title, description, keywords?, canonical,
 *                            og: { title, description, type, url, siteName, locale, image, imageAlt },
 *                            twitter: { card, title, description, image, imageAlt } }.
 * @param {Array<object>} [schemas]  Optional JSON-LD schema objects rendered as
 *                                   <script type="application/ld+json"> tags.
 */
export default function SeoHead({ meta, schemas = [] }) {
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      <link rel="canonical" href={meta.canonical} />

      <meta property="og:title" content={meta.og.title} />
      <meta property="og:description" content={meta.og.description} />
      <meta property="og:type" content={meta.og.type} />
      <meta property="og:url" content={meta.og.url} />
      <meta property="og:site_name" content={meta.og.siteName} />
      <meta property="og:locale" content={meta.og.locale} />
      <meta property="og:image" content={meta.og.image} />
      <meta property="og:image:alt" content={meta.og.imageAlt} />

      <meta name="twitter:card" content={meta.twitter.card} />
      <meta name="twitter:title" content={meta.twitter.title} />
      <meta name="twitter:description" content={meta.twitter.description} />
      <meta name="twitter:image" content={meta.twitter.image} />
      <meta name="twitter:image:alt" content={meta.twitter.imageAlt} />

      {schemas.map((schema, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
