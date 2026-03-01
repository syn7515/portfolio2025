"use client"

import BlogPostLayout from '@/components/blog-post-layout'
import MDXContent from './content.mdx'

export default function AniaiPost() {
  return (
    <BlogPostLayout slug="aniai" title={"Building the Tools\nBehind Smarter Robots"} subtitle="Aniai · 2024 - 2025">
      <MDXContent />
    </BlogPostLayout>
  )
}
