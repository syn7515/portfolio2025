"use client"

import BlogPostLayout from '@/components/blog-post-layout'
import MDXContent from './content.mdx'

export default function AlphaGrillPost() {
  return (
    <BlogPostLayout
      slug="alphagrill"
      title={"Robot Interface for\nCollaboration in Kitchen"}
      subtitle="Aniai · 2025 - 2026"
    >
      <MDXContent />
    </BlogPostLayout>
  )
}
