"use client"

import React from 'react'
import Link from 'next/link'
import { Undo2, ArrowUp, Heart, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipArrow, TooltipProvider } from '@/components/ui/tooltip'
import styles from './blog-post.module.css'

interface BlogPostLayoutProps {
  children: React.ReactNode
  slug?: string
}

export default function BlogPostLayout({ children, slug }: BlogPostLayoutProps) {
  const [copied, setCopied] = React.useState(false)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyAsMarkdown = async () => {
    if (!slug) return
    
    try {
      // Fetch the raw MDX content
      const response = await fetch(`/api/get-mdx?slug=${slug}`)
      if (!response.ok) throw new Error('Failed to fetch content')
      
      const { content } = await response.json()
      
      // Filter out imports, components, and styling wrappers
      let filtered = content
        // Remove import statements
        .replace(/^import\s+.*from\s+['"].*['"]\s*$/gm, '')
        // Remove the max-w wrapper div opening
        .replace(/<div className="max-w-\[480px\] mx-auto">\s*/g, '')
        // Remove full-width container divs with all their attributes
        .replace(/<div className="w-screen[^"]*">\s*/g, '')
        // Remove all closing divs
        .replace(/\s*<\/div>\s*/g, '')
        // Replace Divider component with markdown horizontal rule
        .replace(/<Divider[^/>]*\/>/g, '\n\n---\n\n')
        .replace(/<Divider[^>]*>[\s\S]*?<\/Divider>/g, '\n\n---\n\n')
        // Remove span tags but keep their content
        .replace(/<span[^>]*>(.*?)<\/span>/g, '$1')
        // Decode HTML entities that were in spans
        .replace(/&nbsp;/g, ' ')
        // Clean up extra blank lines
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      
      // Copy to clipboard
      await navigator.clipboard.writeText(filtered)
      
      // Show feedback
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full px-4 pt-12">
        <div className="max-w-[480px] mx-auto mb-4 flex justify-between items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild aria-label="Back to home" className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50 -ml-2">
                <Link href="/blog">
                  <Undo2 className="text-stone-500 dark:text-stone-300" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <TooltipArrow />
              <p>Back to home</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Like" className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50">
              <Heart className="text-stone-500 dark:text-stone-300" />
            </Button>
            <Tooltip open={copied ? true : undefined}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  aria-label="Copy as Markdown" 
                  className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                  onClick={copyAsMarkdown}
                >
                  <Clipboard className="text-stone-500 dark:text-stone-300" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <TooltipArrow />
                <p>{copied ? 'Copied!' : 'Copy as Markdown'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>   
        <div className={styles.mdxContent}>
          {children}
        </div>
        <div className="max-w-[480px] mx-auto mt-16 mb-16 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={scrollToTop}
            className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50 gap-[6px] pl-4 pr-3"
          >
            <span className="text-stone-600 dark:text-stone-200">Back to top</span>
            <ArrowUp className="text-stone-600 dark:text-stone-200" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}


