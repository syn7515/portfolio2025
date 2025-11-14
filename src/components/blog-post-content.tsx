"use client"

import BlogPostLayout from '@/components/blog-post-layout'

interface BlogPostContentProps {
  slug: string
  initialCount?: number
  children: React.ReactNode
}

export default function BlogPostContent({ slug, initialCount, children }: BlogPostContentProps) {
  return (
    <BlogPostLayout slug={slug} initialCount={initialCount}>
      {children}
    </BlogPostLayout>
  )
}

