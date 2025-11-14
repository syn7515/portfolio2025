"use client"

import BlogPostContent from '@/components/blog-post-content'
import MDXContent from './content.mdx'

interface AthenahealthContentClientProps {
  initialCount?: number
}

export default function AthenahealthContentClient({ initialCount }: AthenahealthContentClientProps) {
  return (
    <BlogPostContent slug="athenahealth" initialCount={initialCount}>
      <MDXContent />
    </BlogPostContent>
  )
}

