import { BRAND, SOCIALS } from '@/app/data/site';

/**
 * Confirmed MusicGroup + Organization only.
 * No invented albums, events, or member lists.
 */
export default function JsonLd() {
  const sameAs = SOCIALS.map((s) => s.href);

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: BRAND.name,
        alternateName: BRAND.shortName,
        url: BRAND.url,
        slogan: BRAND.tagline,
        sameAs,
      },
      {
        '@type': 'MusicGroup',
        name: 'AOA Records',
        url: `${BRAND.url}/music`,
        parentOrganization: {
          '@type': 'Organization',
          name: BRAND.name,
          url: BRAND.url,
        },
        sameAs: sameAs.filter((href) =>
          href.includes('soundcloud') || href.includes('spotify'),
        ),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
