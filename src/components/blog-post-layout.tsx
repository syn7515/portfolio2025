"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Undo2, ArrowUp, Heart, Clipboard, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipArrow, TooltipProvider } from '@/components/ui/tooltip'
import TableOfContents from '@/components/ui/table-of-contents'
import { cn } from '@/lib/utils'
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
  const [shouldAnimate, setShouldAnimate] = React.useState(false)

  // Initialize liked state from localStorage on mount
  React.useEffect(() => {
    if (!slug || typeof window === 'undefined') return

    try {
      const likedPostsJson = localStorage.getItem('liked-posts')
      if (likedPostsJson) {
        const likedPosts: string[] = JSON.parse(likedPostsJson)
        setIsLiked(likedPosts.includes(slug))
      }
    } catch (error) {
      // Handle localStorage errors (quota exceeded, disabled, etc.)
      console.error('Failed to read liked posts from localStorage:', error)
    }
  }, [slug])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLike = (pressed: boolean) => {
    const wasLiked = isLiked
    setIsLiked(pressed)
    
    // Trigger animation when transitioning from unliked to liked
    if (pressed && !wasLiked) {
      setShouldAnimate(true)
      // Clear animation flag after animation completes (0.35s)
      setTimeout(() => {
        setShouldAnimate(false)
      }, 350)
    }
    
    // Persist to localStorage
    if (slug && typeof window !== 'undefined') {
      try {
        const likedPostsJson = localStorage.getItem('liked-posts')
        const likedPosts: string[] = likedPostsJson ? JSON.parse(likedPostsJson) : []
        
        if (pressed) {
          // Add slug if not already in array
          if (!likedPosts.includes(slug)) {
            likedPosts.push(slug)
            localStorage.setItem('liked-posts', JSON.stringify(likedPosts))
          }
        } else {
          // Remove slug from array
          const updatedLikedPosts = likedPosts.filter((postSlug) => postSlug !== slug)
          localStorage.setItem('liked-posts', JSON.stringify(updatedLikedPosts))
        }
      } catch (error) {
        // Handle localStorage errors (quota exceeded, disabled, etc.)
        console.error('Failed to save liked posts to localStorage:', error)
      }
    }
    
    if (pressed) {
      // Check if tooltip is already open (user hovered and it's visible)
      const wasAlreadyOpen = likeTooltipOpen === true
      
      // Random messages
      const messages = ["You liked this!", "Thanks for the 💖", "Appreciated!"]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      
      // Delay showing the message by 0.3s
      setTimeout(() => {
        setLikedMessage(randomMessage)
        
        // If tooltip was already open, keep it open (content changes without animation)
        // If tooltip is not open, open it now with the message (will animate)
        if (!wasAlreadyOpen) {
          setLikeTooltipOpen(true)
        }
        // If already open, we don't need to change state - just content updates
        
        setTimeout(() => {
          // Close tooltip first (will animate out)
          setLikeTooltipOpen(false)
          // Wait for closing animation (0.1s) before resetting likedMessage state
          // This prevents showing "Show some love" during the closing animation
          setTimeout(() => {
            setLikedMessage(null)
            setLikeTooltipOpen(undefined) // Reset to undefined to allow hover control again
          }, 100) // Match tooltip closing animation duration
        }, 2000)
      }, 300)
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
        // Replace LabelIndicatorCarousel component with markdown images
        .replace(/<LabelIndicatorCarousel[\s\S]*?items\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[\s\S]*?\/>/g, (_match: string, arrayContent: string) => {
          try {
            // Parse items array content manually
            const items: Array<{ caption?: string; label?: string; imageUrl?: string; image?: string }> = []
            
            // Split by object boundaries, handling nested braces
            let depth = 0
            let currentItem = ''
            
            for (let i = 0; i < arrayContent.length; i++) {
              const char = arrayContent[i]
              
              if (char === '{') {
                if (depth === 0) {
                  currentItem = ''
                }
                depth++
                if (depth > 1) currentItem += char
              } else if (char === '}') {
                depth--
                if (depth === 0) {
                  // End of an item object
                  const itemContent = currentItem.trim()
                  const captionMatch = itemContent.match(/caption\s*:\s*["']([^"']*?)["']/)
                  const labelMatch = itemContent.match(/label\s*:\s*["']([^"']*?)["']/)
                  const imageUrlMatch = itemContent.match(/imageUrl\s*:\s*["']([^"']*?)["']/)
                  const imageMatch = itemContent.match(/image\s*:\s*["']([^"']*?)["']/)
                  
                  const imageUrl = imageUrlMatch?.[1] || imageMatch?.[1]
                  if (imageUrl) {
                    items.push({
                      caption: captionMatch?.[1] || labelMatch?.[1] || '',
                      label: labelMatch?.[1] || '',
                      imageUrl: imageUrl
                    })
                  }
                  currentItem = ''
                } else {
                  currentItem += char
                }
              } else if (depth > 0) {
                currentItem += char
              }
            }
            
            // Convert each item to markdown image format with caption
            const markdownImages = items
              .map((item) => {
                const caption = item.caption || item.label || ''
                const imageMarkdown = `![${caption}](${item.imageUrl})`
                return caption ? `${imageMarkdown}\n*${caption}*` : imageMarkdown
              })
              .join('\n\n')
            
            return markdownImages ? `\n${markdownImages}\n\n` : ''
          } catch (e) {
            return ''
          }
        })
        .replace(/<LabelIndicatorCarousel[\s\S]*?items\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[\s\S]*?<\/LabelIndicatorCarousel>/g, (_match: string, arrayContent: string) => {
          try {
            // Parse items array content manually
            const items: Array<{ caption?: string; label?: string; imageUrl?: string; image?: string }> = []
            
            // Split by object boundaries, handling nested braces
            let depth = 0
            let currentItem = ''
            
            for (let i = 0; i < arrayContent.length; i++) {
              const char = arrayContent[i]
              
              if (char === '{') {
                if (depth === 0) {
                  currentItem = ''
                }
                depth++
                if (depth > 1) currentItem += char
              } else if (char === '}') {
                depth--
                if (depth === 0) {
                  // End of an item object
                  const itemContent = currentItem.trim()
                  const captionMatch = itemContent.match(/caption\s*:\s*["']([^"']*?)["']/)
                  const labelMatch = itemContent.match(/label\s*:\s*["']([^"']*?)["']/)
                  const imageUrlMatch = itemContent.match(/imageUrl\s*:\s*["']([^"']*?)["']/)
                  const imageMatch = itemContent.match(/image\s*:\s*["']([^"']*?)["']/)
                  
                  const imageUrl = imageUrlMatch?.[1] || imageMatch?.[1]
                  if (imageUrl) {
                    items.push({
                      caption: captionMatch?.[1] || labelMatch?.[1] || '',
                      label: labelMatch?.[1] || '',
                      imageUrl: imageUrl
                    })
                  }
                  currentItem = ''
                } else {
                  currentItem += char
                }
              } else if (depth > 0) {
                currentItem += char
              }
            }
            
            // Convert each item to markdown image format with caption
            const markdownImages = items
              .map((item) => {
                const caption = item.caption || item.label || ''
                const imageMarkdown = `![${caption}](${item.imageUrl})`
                return caption ? `${imageMarkdown}\n*${caption}*` : imageMarkdown
              })
              .join('\n\n')
            
            return markdownImages ? `\n${markdownImages}\n\n` : ''
          } catch (e) {
            return ''
          }
        })
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
      
      // If tooltip was already open, keep it open (content changes from "Copy as Markdown" to "Copied!" without animation)
      // If tooltip is not open, open it now with "Copied!" text (will animate)
      if (!wasAlreadyOpen) {
        setTooltipOpen(true)
      }
      // If already open, we don't need to change state - just content updates
      
      setTimeout(() => {
        // Close tooltip first (will animate out)
        setTooltipOpen(false)
        // Wait for closing animation (0.1s) before resetting copied state
        // This prevents showing "Copy as Markdown" during the closing animation
        setTimeout(() => {
          setCopied(false)
        }, 100) // Match tooltip closing animation duration
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Custom labels for aniai post
  const tocLabels = slug === 'aniai' ? {
    "Designing speed for robot development (2024-2025)": "Parametric firmware generator",
    "Scaling robot updates with confidence (2025)": "Update manger",
    "Building a foundation for fast, consistent design (2025)": "Minimum viable design system",
    "Closing thoughts": "Thoughts"
  } : undefined

  return (
    <TooltipProvider>
      <TableOfContents labels={tocLabels} />
      <div className="w-full px-4 pt-20 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="max-w-[480px] mx-auto mb-4 flex justify-between items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" asChild aria-label="Back to home" className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 -ml-2">
                  <Link href="/" className="cursor-pointer">
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
              <Tooltip 
                open={
                  // Don't show tooltip if button is already liked (unless showing liked message)
                  isLiked && !likedMessage 
                    ? false 
                    : likeTooltipOpen !== undefined 
                      ? likeTooltipOpen 
                      : undefined
                }
                onOpenChange={(open) => {
                  // Don't allow opening tooltip if button is already liked
                  if (isLiked && !likedMessage) {
                    setLikeTooltipOpen(false)
                    return
                  }
                  // Allow normal hover behavior when not showing liked message and not liked
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
                  <div className="cursor-pointer">
                    <Toggle 
                      pressed={isLiked}
                      onPressedChange={handleLike}
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Like"
                      className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    >
                      <Heart className={cn(
                        isLiked ? "text-red-500 fill-red-500/20" : "text-stone-500 dark:text-stone-300",
                        shouldAnimate && "heart-bounce"
                      )} />
                    </Toggle>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <TooltipArrow />
                  <p>{likedMessage || 'Show some love'}</p>
                </TooltipContent>
              </Tooltip>
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
                    aria-label={copied ? "Copied" : "Copy as Markdown"} 
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 disabled:opacity-100 relative"
                    onClick={copyAsMarkdown}
                    disabled={copied}
                  >
                    <div className={cn("transition-all absolute inset-0 flex items-center justify-center", copied ? "scale-100 opacity-100" : "scale-0 opacity-0")}>
                      <Check className="text-stone-500 dark:text-stone-300" />
                    </div>
                    <div className={cn("transition-all", copied ? "scale-0 opacity-0" : "scale-100 opacity-100")}>
                      <Clipboard className="text-stone-500 dark:text-stone-300" />
                    </div>
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
        </motion.div>
        <div className="max-w-[480px] mx-auto mt-16 mb-16 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={scrollToTop}
            className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 gap-[6px] pl-4 pr-3 arrow-bounce-button"
          >
            <span className="text-stone-600 dark:text-stone-200">Back to top</span>
            <ArrowUp className="text-stone-600 dark:text-stone-200 arrow-bounce" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}


