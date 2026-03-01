"use client"

import React from 'react'
import { Heart, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipArrow } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface BlogPostHeaderProps {
  slug?: string
  title: string
  subtitle?: string
}

export default function BlogPostHeader({ slug, title, subtitle }: BlogPostHeaderProps) {
  const [copied, setCopied] = React.useState(false)
  const [tooltipOpen, setTooltipOpen] = React.useState<boolean | undefined>(undefined)
  const [likedMessage, setLikedMessage] = React.useState<string | null>(null)
  const [likeTooltipOpen, setLikeTooltipOpen] = React.useState<boolean | undefined>(undefined)
  const [isLiked, setIsLiked] = React.useState(false)
  const [shouldAnimate, setShouldAnimate] = React.useState(false)
  const [likeCount, setLikeCount] = React.useState<number | null>(null)
  const [isUpdatingCount, setIsUpdatingCount] = React.useState(false)
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const isDarkClass = document.documentElement.classList.contains('dark')
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(isDarkClass || isSystemDark)
  }, [])

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
      console.error('Failed to read liked posts from localStorage:', error)
    }
  }, [slug])

  React.useEffect(() => {
    if (!slug) return
    const fetchLikeCount = async () => {
      try {
        const response = await fetch(`/api/likes/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setLikeCount(data.count)
        } else {
          setLikeCount(0)
        }
      } catch (error) {
        console.error('Failed to fetch like count:', error)
        setLikeCount(0)
      }
    }
    fetchLikeCount()
  }, [slug])

  const handleLike = async (pressed: boolean) => {
    if (!slug || isUpdatingCount) return
    const wasLiked = isLiked
    setIsLiked(pressed)
    const currentCount = likeCount ?? 0
    const optimisticCount = pressed ? currentCount + 1 : Math.max(0, currentCount - 1)
    setLikeCount(optimisticCount)
    setIsUpdatingCount(true)

    if (pressed && !wasLiked) {
      setShouldAnimate(true)
      setTimeout(() => setShouldAnimate(false), 350)
    }

    if (slug && typeof window !== 'undefined') {
      try {
        const likedPostsJson = localStorage.getItem('liked-posts')
        const likedPosts: string[] = likedPostsJson ? JSON.parse(likedPostsJson) : []
        if (pressed) {
          if (!likedPosts.includes(slug)) {
            likedPosts.push(slug)
            localStorage.setItem('liked-posts', JSON.stringify(likedPosts))
          }
        } else {
          const updatedLikedPosts = likedPosts.filter((postSlug) => postSlug !== slug)
          localStorage.setItem('liked-posts', JSON.stringify(updatedLikedPosts))
        }
      } catch (error) {
        console.error('Failed to save liked posts to localStorage:', error)
      }
    }

    try {
      const method = pressed ? 'POST' : 'DELETE'
      const response = await fetch(`/api/likes/${slug}`, { method })
      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.count)
      } else {
        setLikeCount(currentCount)
      }
    } catch (error) {
      setLikeCount(currentCount)
      console.error('Error updating like count:', error)
    } finally {
      setIsUpdatingCount(false)
    }

    if (pressed) {
      const wasAlreadyOpen = likeTooltipOpen === true
      const messages = ["You liked this!", "Thanks for the 💖", "Appreciated ;)"]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      const messageWithCount = `${randomMessage}\n${optimisticCount} ${optimisticCount === 1 ? 'like' : 'likes'}`
      setTimeout(() => {
        setLikedMessage(messageWithCount)
        if (!wasAlreadyOpen) setLikeTooltipOpen(true)
        setTimeout(() => {
          setLikeTooltipOpen(false)
          setTimeout(() => {
            setLikedMessage(null)
            setLikeTooltipOpen(undefined)
          }, 100)
        }, 2000)
      }, 300)
    }
  }

  const copyAsMarkdown = async () => {
    if (!slug) return
    const wasAlreadyOpen = tooltipOpen === true
    try {
      const response = await fetch(`/api/get-mdx?slug=${slug}`)
      if (!response.ok) throw new Error('Failed to fetch content')
      const { content } = await response.json()

      const filtered = content
        .replace(/^import\s+.*from\s+['"].*['"]\s*$/gm, '')
        .replace(/<LabelIndicatorCarousel[\s\S]*?items\s*=\s*\{\s*\[([\s\S]*?)\]\s*\}[\s\S]*?\/>/g, (_match: string, arrayContent: string) => {
          try {
            const items: Array<{ caption?: string; label?: string; imageUrl?: string; image?: string }> = []
            let depth = 0
            let currentItem = ''
            for (let i = 0; i < arrayContent.length; i++) {
              const char = arrayContent[i]
              if (char === '{') {
                if (depth === 0) currentItem = ''
                depth++
                if (depth > 1) currentItem += char
              } else if (char === '}') {
                depth--
                if (depth === 0) {
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
                } else currentItem += char
              } else if (depth > 0) currentItem += char
            }
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
            const items: Array<{ caption?: string; label?: string; imageUrl?: string; image?: string }> = []
            let depth = 0
            let currentItem = ''
            for (let i = 0; i < arrayContent.length; i++) {
              const char = arrayContent[i]
              if (char === '{') {
                if (depth === 0) currentItem = ''
                depth++
                if (depth > 1) currentItem += char
              } else if (char === '}') {
                depth--
                if (depth === 0) {
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
                } else currentItem += char
              } else if (depth > 0) currentItem += char
            }
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
        .replace(/<Heading\s+([^/>]+)\s*\/>/g, (_match: string, attrs: string) => {
          const titleMatch = attrs.match(/title\s*=\s*["']([^"']*)["']/)
          const yearMatch = attrs.match(/year\s*=\s*["']([^"']*)["']/)
          const title = titleMatch?.[1]?.trim() ?? ''
          const year = yearMatch?.[1]?.trim()
          if (!title) return ''
          return year ? `#### ${title} (${year})` : `#### ${title}`
        })
        .replace(/<div className="max-w-\[560px\] mx-auto">\s*/g, '')
        .replace(/<div className="w-screen[^"]*">\s*/g, '')
        .replace(/\s*<\/div>\s*/g, '')
        .replace(/<Divider[^/>]*\/>/g, '\n\n---\n\n')
        .replace(/<Divider[^>]*>[\s\S]*?<\/Divider>/g, '\n\n---\n\n')
        .replace(/<span[^>]*>(.*?)<\/span>/g, '$1')
        .replace(/<sup[^>]*>(.*?)<\/sup>/g, '$1')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(filtered)
      } else {
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
          throw new Error('Copy to clipboard failed')
        }
        document.body.removeChild(textarea)
      }

      setCopied(true)
      if (!wasAlreadyOpen) setTooltipOpen(true)
      setTimeout(() => {
        setTooltipOpen(false)
        setTimeout(() => setCopied(false), 100)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <header className="max-w-[560px] mx-auto mb-20 text-center">
      {/* Subtitle / metadata - small, light grey */}
      {subtitle && (
        <p className="text-sm font-normal !text-stone-400 dark:text-zinc-400 !mb-1">
          {subtitle}
        </p>
      )}
      {/* Title - typography per design spec */}
      <h1
        className="font-sans !font-medium !leading-[1.5] !mt-1 !mb-4 !dark:text-zinc-100 whitespace-pre-line"
        style={{
          color: 'var(--h-4, #292524)',
          fontSize: '28px',
          letterSpacing: '-0.224px',
        }}
      >
        {title}
      </h1>
      {/* Like and Copy - icon + label per Figma */}
      <div className="flex items-center justify-center gap-4 pl-2">
        <Tooltip
          open={isLiked && !likedMessage ? false : likeTooltipOpen !== undefined ? likeTooltipOpen : undefined}
          onOpenChange={(open) => {
            if (isLiked && !likedMessage) {
              setLikeTooltipOpen(false)
              return
            }
            if (!likedMessage) setLikeTooltipOpen(open)
            else if (open === false) setLikeTooltipOpen(true)
          }}
        >
          <TooltipTrigger asChild>
            <div className="cursor-pointer">
              <Toggle
                pressed={isLiked}
                onPressedChange={handleLike}
                variant="ghost"
                size="sm"
                aria-label="Like"
                className="!no-hover-bg cursor-pointer gap-2 h-auto py-1.5 px-0 text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 data-[state=on]:text-red-500 dark:data-[state=on]:text-red-600"
                disabled={isUpdatingCount}
              >
                <Heart
                  strokeWidth={isDarkMode ? 1.5 : 1.7}
                  className={cn(
                    'size-4 flex-shrink-0',
                    isLiked && 'fill-current',
                    shouldAnimate && 'heart-bounce'
                  )}
                />
                <span className="text-sm font-normal">Like</span>
              </Toggle>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
            <TooltipArrow />
            {likedMessage ? (
              <div style={{ textAlign: 'center' }}>
                {likedMessage.split('\n').map((line, index) => (
                  <div key={index} className={index === 1 ? 'text-stone-400 dark:text-zinc-500' : ''} style={{ marginTop: index === 1 ? '0.125rem' : '0' }}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>Liked?</p>
            )}
          </TooltipContent>
        </Tooltip>
        <Tooltip
          open={tooltipOpen !== undefined ? tooltipOpen : undefined}
          onOpenChange={(open) => {
            if (!copied) setTooltipOpen(open)
            else if (open === false) setTooltipOpen(true)
          }}
        >
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={copied ? 'Copied' : 'Copy as Markdown'}
              className="!no-hover-bg cursor-pointer gap-2 h-auto py-1.5 px-0 text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 disabled:opacity-100"
              onClick={copyAsMarkdown}
              disabled={copied}
            >
              <div className="relative size-4 flex-shrink-0">
                <div className={cn('transition-all duration-200 absolute inset-0 flex items-center justify-center', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
                  <Check strokeWidth={isDarkMode ? 1.5 : 1.7} className="size-4" />
                </div>
                <div className={cn('transition-all duration-200', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
                  <Copy strokeWidth={isDarkMode ? 1.5 : 1.7} className="size-4" />
                </div>
              </div>
              <span className="text-sm font-normal min-w-[3.5rem] inline-block text-left">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
            <TooltipArrow />
            <p>{copied ? 'Copied!' : 'Copy as Markdown'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
