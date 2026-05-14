import { renderWithProviders, waitFor } from '../../test-utils';
import SeoHead from './SeoHead';

const fakeMeta = {
  title: 'Test Title',
  description: 'Test description.',
  keywords: 'a, b, c',
  canonical: 'https://example.com/test',
  og: {
    title: 'OG Test Title',
    description: 'OG description.',
    type: 'website',
    url: 'https://example.com/test',
    siteName: 'Test Site',
    locale: 'en_US',
    image: 'https://example.com/og.png',
    imageAlt: 'OG image alt',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twitter Title',
    description: 'Twitter description.',
    image: 'https://example.com/twitter.png',
    imageAlt: 'Twitter image alt',
  },
};

const fakeSchema = {
  '@context': 'https://schema.org',
  '@type': 'Test',
  name: 'Test',
};

describe('SeoHead', () => {
  it('renders title and core meta tags as Helmet-managed [data-rh="true"]', async () => {
    renderWithProviders(<SeoHead meta={fakeMeta} schemas={[fakeSchema]} />);
    await waitFor(() => {
      expect(document.title).toBe(fakeMeta.title);
      expect(
        document.querySelector('meta[name="description"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.description);
      expect(
        document.querySelector('meta[name="keywords"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.keywords);
      expect(
        document.querySelector('link[rel="canonical"][data-rh="true"]'),
      ).toHaveAttribute('href', fakeMeta.canonical);
    });
  });

  it('renders all eight Open Graph tags as Helmet-managed', async () => {
    renderWithProviders(<SeoHead meta={fakeMeta} schemas={[fakeSchema]} />);
    await waitFor(() => {
      expect(
        document.querySelector('meta[property="og:title"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.og.title);
      expect(
        document.querySelector(
          'meta[property="og:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', fakeMeta.og.description);
      expect(
        document.querySelector('meta[property="og:type"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.og.type);
      expect(
        document.querySelector('meta[property="og:url"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.og.url);
      expect(
        document.querySelector(
          'meta[property="og:site_name"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', fakeMeta.og.siteName);
      expect(
        document.querySelector('meta[property="og:locale"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.og.locale);
      expect(
        document.querySelector('meta[property="og:image"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.og.image);
      expect(
        document.querySelector(
          'meta[property="og:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', fakeMeta.og.imageAlt);
    });
  });

  it('renders all five Twitter card tags as Helmet-managed', async () => {
    renderWithProviders(<SeoHead meta={fakeMeta} schemas={[fakeSchema]} />);
    await waitFor(() => {
      expect(
        document.querySelector('meta[name="twitter:card"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.twitter.card);
      expect(
        document.querySelector('meta[name="twitter:title"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.twitter.title);
      expect(
        document.querySelector(
          'meta[name="twitter:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', fakeMeta.twitter.description);
      expect(
        document.querySelector('meta[name="twitter:image"][data-rh="true"]'),
      ).toHaveAttribute('content', fakeMeta.twitter.image);
      expect(
        document.querySelector(
          'meta[name="twitter:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', fakeMeta.twitter.imageAlt);
    });
  });

  it('emits one JSON-LD <script> per schema with the correct payload', async () => {
    renderWithProviders(<SeoHead meta={fakeMeta} schemas={[fakeSchema]} />);
    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"][data-rh="true"]',
      );
      expect(scripts.length).toBe(1);
      expect(JSON.parse(scripts[0].textContent)).toEqual(fakeSchema);
    });
  });

  it('omits the keywords meta tag when meta.keywords is not provided', async () => {
    const { keywords, ...metaWithoutKeywords } = fakeMeta;
    void keywords;
    renderWithProviders(<SeoHead meta={metaWithoutKeywords} />);
    await waitFor(() => {
      expect(document.title).toBe(metaWithoutKeywords.title);
    });
    expect(
      document.querySelector('meta[name="keywords"][data-rh="true"]'),
    ).toBeNull();
  });
});
