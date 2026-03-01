"use client"

import BlogPostLayout from '@/components/blog-post-layout'
import MDXContent from './content.mdx'

export default function AthenahealthPost() {
  return (
    <BlogPostLayout slug="athenahealth" title={"Encouraging Prompt\nMedical Bill Payment"} subtitle="AthenaHealth · 2023">
      <MDXContent />
    </BlogPostLayout>
  )
}


