import type { ReactNode } from 'react'
import { projectMetadata } from '@/lib/projects'

// Exists only to give this route a title: page.tsx is a client component, and Next reads
// `metadata` from server modules only. See projectMetadata in src/lib/projects.ts.
export const metadata = projectMetadata('aniai')

export default function AniaiLayout({ children }: { children: ReactNode }) {
  return children
}
