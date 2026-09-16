import type { Metadata } from 'next'
import { SITE_NAME, socialCard } from '@/lib/site-metadata'

export const PROJECTS = [
  {
    slug: 'alphagrill',
    title: 'AlphaGrill',
    description: 'Robot Interface for Collaboration in Kitchen',
  },
  {
    slug: 'aniai',
    title: 'Aniai',
    description: 'Building the Tools Behind Smarter Robots',
  },
  {
    slug: 'athenahealth',
    title: 'AthenaHealth',
    description: 'Encouraging Prompt Medical Bill Payment',
  },
] as const

export type ProjectSlug = (typeof PROJECTS)[number]['slug']

/**
 * Tab title and social card for a case study. `title` is the name alone — the root layout's
 * template appends the site name — while the card has to spell the same result out, because the
 * template only reaches `title` and a route's `openGraph` replaces the root's rather than adding
 * to it. The description is the project's own one-liner, the same string the home page list and
 * the footer navigation show, and it is set twice for the same reason: `description` is the search
 * result, `openGraph.description` the shared card, and neither falls back to the other. Either way
 * both come from PROJECTS above, written once.
 *
 * This lives here rather than in each route because a case study's page.tsx is a client component
 * (the MDX provider is a hook), and Next only reads `metadata` from server modules. Each route
 * therefore carries a passthrough layout.tsx whose whole job is to export this.
 */
export function projectMetadata(slug: ProjectSlug): Metadata {
  const project = PROJECTS.find((candidate) => candidate.slug === slug)!

  return {
    title: project.title,
    description: project.description,
    ...socialCard({
      title: `${project.title} | ${SITE_NAME}`,
      path: `/${project.slug}`,
      description: project.description,
    }),
  }
}
