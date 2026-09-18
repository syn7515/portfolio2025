import type { Metadata } from 'next'

export const SITE_NAME = 'Sue Park'
export const SITE_DESCRIPTION = 'Sue Park — Portfolio'
export const SITE_URL = 'https://suepark.xyz'

// X and other social crawlers cache card images by URL. Use a content-versioned
// filename so replacing the image always produces a new crawler cache key.
const OG_IMAGE = {
  url: `${SITE_URL}/og-image-adb5b512.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Sue Park Portfolio Open Graph Image',
} as const

interface SocialCard {
  /** Spelled out in full, site name included: the title template only ever reaches `title`. */
  title: string
  /** Path of the page this card is for, appended to SITE_URL. Empty for Home. */
  path?: string
  description?: string
}

/**
 * The openGraph/twitter pair for one page.
 *
 * It is a function rather than a constant the routes spread and patch because Next merges metadata
 * shallowly, one top-level key at a time: a route that defines `openGraph` at all replaces the
 * root's outright instead of adding to it. Setting just a title there would silently drop the card
 * image, the site name and the URL, so every caller restates the whole block.
 */
export function socialCard({
  title,
  path = '',
  description = SITE_DESCRIPTION,
}: SocialCard): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      images: [OG_IMAGE],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
  }
}
