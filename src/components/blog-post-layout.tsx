"use client"

import React from 'react'
import Link from 'next/link'
import { Undo2, ArrowUp, Heart, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipArrow, TooltipProvider } from '@/components/ui/tooltip'
import styles from './blog-post.module.css'

interface BlogPostLayoutProps {
  children: React.ReactNode
  slug?: string
}

export default function BlogPostLayout({ children, slug }: BlogPostLayoutProps) {
  const [copied, setCopied] = React.useState(false)
  const [tooltipOpen, setTooltipOpen] = React.useState<boolean | undefined>(undefined)
  const [likedMessage, setLikedMessage] = React.useState<string | null>(null)
  const [likeTooltipOpen, setLikeTooltipOpen] = React.useState<boolean | undefined>(undefined)
  const [isLiked, setIsLiked] = React.useState(false)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLike = (pressed: boolean) => {
    setIsLiked(pressed)
    
    if (pressed) {
      // Check if tooltip is already open (user hovered and it's visible)
      const wasAlreadyOpen = likeTooltipOpen === true
      
      // Random messages
      const messages = ["You liked this", "Thanks for the love", "Appreciated!"]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      
      setLikedMessage(randomMessage)
      
      // If tooltip was already open, keep it open (content changes without animation)
      // If tooltip is not open, open it now with the message (will animate)
      if (!wasAlreadyOpen) {
        setLikeTooltipOpen(true)
      }
      // If already open, we don't need to change state - just content updates
      
      setTimeout(() => {
        setLikedMessage(null)
        setLikeTooltipOpen(undefined) // Reset to undefined to allow hover control again
      }, 2000)
    }
  }

  const copyAsMarkdown = async () => {
    if (!slug) return
    
    // Check if tooltip is already open (user hovered and it's visible)
    const wasAlreadyOpen = tooltipOpen === true
    
    try {
      // Fetch the raw MDX content
      const response = await fetch(`/api/get-mdx?slug=${slug}`)
      if (!response.ok) throw new Error('Failed to fetch content')
      
      const { content } = await response.json()
      
      // Filter out imports, components, and styling wrappers
      const filtered = content
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
        // Remove sup tags but keep their content
        .replace(/<sup[^>]*>(.*?)<\/sup>/g, '$1')
        // Decode HTML entities that were in spans
        .replace(/&nbsp;/g, ' ')
        // Clean up extra blank lines
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      
      // Copy to clipboard with fallback for mobile browsers
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Modern Clipboard API (works on HTTPS/localhost)
        await navigator.clipboard.writeText(filtered)
      } else {
        // Fallback for mobile browsers (Safari iOS, older browsers)
        const textarea = document.createElement('textarea')
        textarea.value = filtered
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        textarea.style.left = '-999999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('Fallback copy failed:', err)
          throw new Error('Copy to clipboard failed')
        }
        document.body.removeChild(textarea)
      }
      
      // Show feedback
      setCopied(true)
      
      // If tooltip was already open, keep it open (content changes without animation)
      // If tooltip is not open, open it now with "Copied!" text (will animate)
      if (!wasAlreadyOpen) {
        setTooltipOpen(true)
      }
      // If already open, we don't need to change state - just content updates
      
      setTimeout(() => {
        setCopied(false)
        setTooltipOpen(undefined) // Reset to undefined to allow hover control again
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full px-4 pt-12 overflow-x-hidden">
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
            {(!isLiked || likedMessage) && (
              <Tooltip 
                open={likeTooltipOpen !== undefined ? likeTooltipOpen : undefined}
                onOpenChange={(open) => {
                  // Allow normal hover behavior when not showing liked message
                  // When showing liked message, keep tooltip open regardless of hover
                  if (!likedMessage) {
                    setLikeTooltipOpen(open)
                  } else if (open === false) {
                    // Prevent closing while showing liked message
                    setLikeTooltipOpen(true)
                  }
                }}
              >
                <TooltipTrigger asChild>
                  <div>
                    <Toggle 
                      pressed={isLiked}
                      onPressedChange={handleLike}
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Like"
                      className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    >
                      <Heart className={isLiked ? "text-red-500" : "text-stone-500 dark:text-stone-300"} />
                    </Toggle>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <TooltipArrow />
                  <p>{likedMessage || 'Show some love'}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isLiked && !likedMessage && (
              <Toggle 
                pressed={isLiked}
                onPressedChange={handleLike}
                variant="ghost"
                size="icon-sm"
                aria-label="Like"
                className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
              >
                <Heart className={isLiked ? "text-red-500" : "text-stone-500 dark:text-stone-300"} />
              </Toggle>
            )}
            <Tooltip 
              open={tooltipOpen !== undefined ? tooltipOpen : undefined}
              onOpenChange={(open) => {
                // Allow normal hover behavior when not showing "Copied!"
                // When showing "Copied!", keep tooltip open regardless of hover
                if (!copied) {
                  setTooltipOpen(open)
                } else if (open === false) {
                  // Prevent closing while showing "Copied!"
                  setTooltipOpen(true)
                }
              }}
            >
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


