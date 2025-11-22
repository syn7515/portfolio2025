"use client"

import React from 'react'
import Link from 'next/link'
import { Undo2, Heart, Clipboard, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipArrow } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface BlogPostHeaderProps {
  slug?: string
}

export default function BlogPostHeader({ slug }: BlogPostHeaderProps) {
  const [copied, setCopied] = React.useState(false)
  const [tooltipOpen, setTooltipOpen] = React.useState<boolean | undefined>(undefined)
  const [likedMessage, setLikedMessage] = React.useState<string | null>(null)
  const [likeTooltipOpen, setLikeTooltipOpen] = React.useState<boolean | undefined>(undefined)
  const [isLiked, setIsLiked] = React.useState(false)
  const [shouldAnimate, setShouldAnimate] = React.useState(false)
  const [likeCount, setLikeCount] = React.useState<number | null>(null)
  const [isUpdatingCount, setIsUpdatingCount] = React.useState(false)
  const headerRef = React.useRef<HTMLDivElement>(null)
  const borderRef = React.useRef<HTMLDivElement>(null)
  const [borderOpacity, setBorderOpacity] = React.useState(0)
  const stickyThresholdRef = React.useRef<number | null>(null)
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [cardWidth, setCardWidth] = React.useState(0)
  const [isXsViewport, setIsXsViewport] = React.useState(false)

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

  // Fetch initial like count on mount
  React.useEffect(() => {
    if (!slug) return

    const fetchLikeCount = async () => {
      try {
        const response = await fetch(`/api/likes/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setLikeCount(data.count)
        } else {
          // If API fails, set to 0
          setLikeCount(0)
        }
      } catch (error) {
        console.error('Failed to fetch like count:', error)
        setLikeCount(0)
      }
    }

    fetchLikeCount()
  }, [slug])

  // Calculate responsive card width matching carousel logic
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const calculateCardWidth = () => {
      const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
      const isXs = w < 640

      setIsXsViewport(isXs)

      if (isXs) {
        // For xs viewport, use full viewport width for border
        setCardWidth(w)
      } else if (w < 768) {
        setCardWidth(520)
      } else if (w < 1024) {
        setCardWidth(640)
      } else {
        setCardWidth(840)
      }
    }

    calculateCardWidth()
    window.addEventListener('resize', calculateCardWidth)

    return () => {
      window.removeEventListener('resize', calculateCardWidth)
    }
  }, [])

  // Calculate sticky threshold and handle scroll for border opacity
  React.useEffect(() => {
    if (typeof window === 'undefined' || !headerRef.current) return

    const calculateStickyThreshold = () => {
      if (!headerRef.current) return
      
      // Use parent element to calculate the natural position of the header
      // This avoids issues when the header is already sticky (and thus rect.top is 0)
      const parent = headerRef.current.parentElement
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        // The threshold is the absolute scroll position where the header (top of parent) hits the top of viewport
        // absoluteTop = parentRect.top + scrollTop
        // This works because parent is not sticky, so its rect.top reflects its current position relative to viewport
        stickyThresholdRef.current = parentRect.top + scrollTop
      } else {
        // Fallback if no parent (shouldn't happen given the layout)
        const rect = headerRef.current.getBoundingClientRect()
        stickyThresholdRef.current = scrollTop + rect.top
      }
    }

    // Calculate threshold on mount and resize
    calculateStickyThreshold()
    window.addEventListener('resize', calculateStickyThreshold)

    const handleScroll = () => {
      if (!headerRef.current || stickyThresholdRef.current === null) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const threshold = stickyThresholdRef.current
      
      // Always calculate opacity based on threshold (absolute scroll position where sticky starts)
      // Opacity transitions from 0 to 100 over 40px, starting at threshold
      if (scrollTop >= threshold) {
        const scrollOffset = scrollTop - threshold
        const opacity = Math.min(100, Math.max(0, (scrollOffset / 40) * 100))
        setBorderOpacity(opacity)
      } else {
        // Not yet at threshold - no border
        setBorderOpacity(0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial check
    handleScroll()

    // Recalculate after animation (0.5s) to ensure accuracy
    const timer = setTimeout(() => {
      calculateStickyThreshold()
      handleScroll()
    }, 600)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', calculateStickyThreshold)
    }
  }, [])

  // Detect dark mode and update border color
  React.useEffect(() => {
    if (typeof window === 'undefined' || !borderRef.current) return

    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark')
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(isDarkClass || isSystemDark)
    }

    checkDarkMode()

    // Update border gradient
    const updateBorderGradient = () => {
      if (!borderRef.current) return
      const opacity = (borderOpacity / 100) * 0.2
      // Base colors at full opacity
      const lightBaseColor = 'rgba(168, 162, 158, 1)' // stone-400
      const darkBaseColor = 'rgba(161, 161, 170, 1)' // zinc-400
      // Apply opacity to the colors
      const lightColor = lightBaseColor.replace('1)', `${opacity})`)
      const darkColor = darkBaseColor.replace('1)', `${opacity})`)
      // Check dark mode directly from DOM to get the current value immediately
      const isDarkClass = document.documentElement.classList.contains('dark')
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const currentIsDarkMode = isDarkClass || isSystemDark
      const baseColor = currentIsDarkMode ? darkColor : lightColor
      // Gradient: 0% transparent, 5% full opacity, 95% full opacity, 100% transparent
      const gradient = `linear-gradient(to right, transparent 0%, ${baseColor} 5%, ${baseColor} 95%, transparent 100%)`
      borderRef.current.style.background = gradient
    }

    updateBorderGradient()

    // Watch for theme changes and update both state and border
    const handleThemeChange = () => {
      checkDarkMode()
      // Update border immediately using current DOM state
      updateBorderGradient()
    }

    const observer = new MutationObserver(handleThemeChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Also listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      handleThemeChange()
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [borderOpacity, isDarkMode])

  const handleLike = async (pressed: boolean) => {
    if (!slug || isUpdatingCount) return

    const wasLiked = isLiked
    setIsLiked(pressed)
    
    // Optimistic UI update
    const currentCount = likeCount ?? 0
    const optimisticCount = pressed ? currentCount + 1 : Math.max(0, currentCount - 1)
    setLikeCount(optimisticCount)
    setIsUpdatingCount(true)
    
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
    
    // Update count on server
    try {
      const method = pressed ? 'POST' : 'DELETE'
      const response = await fetch(`/api/likes/${slug}`, { method })
      
      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.count)
      } else {
        // Revert optimistic update on error
        setLikeCount(currentCount)
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to update like count:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
      }
    } catch (error) {
      // Revert optimistic update on error
      setLikeCount(currentCount)
      console.error('Error updating like count:', error)
    } finally {
      setIsUpdatingCount(false)
    }
    
    if (pressed) {
      // Check if tooltip is already open (user hovered and it's visible)
      const wasAlreadyOpen = likeTooltipOpen === true
      
      // Random messages - will include count
      const messages = ["You liked this!", "Thanks for the 💖", "Appreciated ;)"]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      
      // Capture the optimistic count for the message (the count that was just incremented)
      const countForMessage = optimisticCount
      const messageWithCount = `${randomMessage}\n${countForMessage} ${countForMessage === 1 ? 'like' : 'likes'}`
      
      // Delay showing the message by 0.3s
      setTimeout(() => {
        setLikedMessage(messageWithCount)
        
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
          } catch {
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
          } catch {
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

  return (
    <div
      ref={headerRef}
      className="sticky top-0 h-16 sm:h-12 z-50 bg-white dark:bg-zinc-900 flex items-center relative"
      style={{ width: 'calc(100% + 2rem)', marginLeft: '-1rem', marginRight: '-1rem' }}
    >
      <div className="max-w-[480px] mx-auto w-full">
        <div className="mx-4 sm:mx-0 flex justify-between items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-lg" asChild aria-label="Back to home" className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 -ml-1 sm:-ml-2 sm:size-8">
                <Link href="/" className="cursor-pointer">
                  <Undo2 strokeWidth={1.5} className="text-stone-500 dark:text-zinc-400 !size-[18px] sm:!size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              <TooltipArrow />
              <p>Back to home</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex gap-1 -mr-1 sm:-mr-2">
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
                    size="icon-lg"
                    aria-label="Like"
                    className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 sm:size-8"
                    disabled={isUpdatingCount}
                  >
                    <Heart strokeWidth={1.5} className={cn(
                      isLiked ? "text-red-500 dark:text-red-700 fill-red-500/30 dark:fill-red-700" : "text-stone-500 dark:text-zinc-400",
                      shouldAnimate && "heart-bounce",
                      "!size-[18px] sm:!size-4"
                    )} />
                  </Toggle>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={4}>
                <TooltipArrow />
                {likedMessage ? (
                  <div style={{ textAlign: 'center' }}>
                    {likedMessage.split('\n').map((line, index) => (
                      <div 
                        key={index}
                        className={index === 1 ? 'text-stone-400 dark:text-zinc-500' : ''}
                        style={{ 
                          marginTop: index === 1 ? '0.125rem' : '0'
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center' }}>Show some love</p>
                )}
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
                  size="icon-lg" 
                  aria-label={copied ? "Copied" : "Copy as Markdown"} 
                  className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 disabled:opacity-100 relative sm:size-8"
                  onClick={copyAsMarkdown}
                  disabled={copied}
                >
                  <div className={cn("transition-all absolute inset-0 flex items-center justify-center", copied ? "scale-100 opacity-100" : "scale-0 opacity-0")}>
                    <Check strokeWidth={1.5} className="text-stone-500 dark:text-zinc-400 !size-[18px] sm:!size-4" />
                  </div>
                  <div className={cn("transition-all", copied ? "scale-0 opacity-0" : "scale-100 opacity-100")}>
                    <Clipboard strokeWidth={1.5} className="text-stone-500 dark:text-zinc-400 !size-[18px] sm:!size-4" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={4}>
                <TooltipArrow />
                <p>{copied ? 'Copied!' : 'Copy as Markdown'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        {/* Responsive border matching carousel card width */}
        {cardWidth > 0 && (
          <div
            ref={borderRef}
            className="absolute bottom-0"
            style={{
              ...(isXsViewport 
                ? { 
                    left: '50%',
                    width: '100vw',
                    transform: 'translateX(-50%)'
                  }
                : { 
                    left: '50%', 
                    width: `${cardWidth}px`,
                    transform: 'translateX(-50%)'
                  }),
              height: '1px',
              background: 'transparent', // Will be set by updateBorderGradient
            }}
          />
        )}
      </div>
    </div>
  )
}
