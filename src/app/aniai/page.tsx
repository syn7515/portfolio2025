"use client"

import BlogPostLayout from '@/components/blog-post-layout'
import MDXContent from './content.mdx'

export default function AniaiPost() {
  return (
    <BlogPostLayout slug="aniai">
      <MDXContent />
    </BlogPostLayout>
  )
}
