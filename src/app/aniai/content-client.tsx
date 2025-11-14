"use client"

import BlogPostContent from '@/components/blog-post-content'
import MDXContent from './content.mdx'

interface AniaiContentClientProps {
  initialCount?: number
}

export default function AniaiContentClient({ initialCount }: AniaiContentClientProps) {
  return (
    <BlogPostContent slug="aniai" initialCount={initialCount}>
      <MDXContent />
    </BlogPostContent>
  )
}

