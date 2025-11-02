"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface Heading {
  id: string
  text: string
  element: HTMLElement
  position: number
}

interface TableOfContentsProps {
  className?: string
  labels?: Record<string, string>
}

export default function TableOfContents({ className, labels }: TableOfContentsProps) {
  const [headings, setHeadings] = React.useState<Heading[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [isTocHovered, setIsTocHovered] = React.useState(false)
  const [hasExpanded, setHasExpanded] = React.useState(false)
  const prevIsTocHovered = React.useRef(isTocHovered)
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  
  React.useEffect(() => {
    prevIsTocHovered.current = isTocHovered
  }, [isTocHovered])
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  React.useEffect(() => {
    let retryCount = 0
    const maxRetries = 20

    const extractHeadings = () => {
      let container: Element | null = null
      
      const allDivs = document.querySelectorAll('div')
      for (const div of allDivs) {
        const h4s = div.querySelectorAll('h4')
        if (h4s.length > 0) {
          container = div
          break
        }
      }

      if (!container) {
        const allH4s = document.querySelectorAll('h4')
        if (allH4s.length === 0) {
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(extractHeadings, 200)
          }
          return
        }
        container = document.body
      }

      const h4Elements = container.querySelectorAll('h4')
      
      if (h4Elements.length === 0) {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(extractHeadings, 200)
          return
        }
        setHeadings([])
        return
      }

      const headingsList: Heading[] = []
      
      requestAnimationFrame(() => {
        const firstHeading = container.querySelector('h4') as HTMLElement
        if (!firstHeading) return
        
        const firstHeadingTop = firstHeading.getBoundingClientRect().top + window.scrollY

        h4Elements.forEach((h4, index) => {
          const text = h4.textContent || ''
          const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
          
          if (!h4.id) {
            h4.id = id
          }

          const headingTop = (h4 as HTMLElement).getBoundingClientRect().top + window.scrollY
          const position = headingTop - firstHeadingTop

          const customLabel = labels?.[h4.id] || labels?.[text.trim()]
          const displayText = customLabel || text.trim()

          headingsList.push({
            id: h4.id,
            text: displayText,
            element: h4 as HTMLElement,
            position
          })
        })

        if (headingsList.length > 0) {
          setHeadings(headingsList)
        }
      })
    }

    const timeoutId = setTimeout(extractHeadings, 100)

    const mutationObserver = new MutationObserver(() => {
      extractHeadings()
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    const handleResize = () => {
      extractHeadings()
    }
    
    const handleScroll = () => {
      if (headings.length > 0) {
        extractHeadings()
      }
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      mutationObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [headings.length, labels])

  React.useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        let activeHeading: IntersectionObserverEntry | null = null
        let closestDistance = Infinity

        entries.forEach((entry) => {
          const rect = entry.boundingClientRect
          const distanceFromTop = Math.abs(rect.top)

          if (entry.isIntersecting && distanceFromTop < closestDistance) {
            closestDistance = distanceFromTop
            activeHeading = entry
          }
        })

        let finalActiveHeading: IntersectionObserverEntry | null = activeHeading
        if (!finalActiveHeading) {
          let mostRecentPastHeading: IntersectionObserverEntry | null = null
          entries.forEach((entry) => {
            const rect = entry.boundingClientRect
            if (rect.top < 100 && (mostRecentPastHeading === null || rect.top > mostRecentPastHeading.boundingClientRect.top)) {
              mostRecentPastHeading = entry
            }
          })
          if (mostRecentPastHeading) {
            finalActiveHeading = mostRecentPastHeading
          }
        }

        if (finalActiveHeading) {
          const target = (finalActiveHeading as IntersectionObserverEntry).target as HTMLElement
          if (target?.id) {
            setActiveId(target.id)
          }
        }
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    )

    headings.forEach((heading) => {
      observer.observe(heading.element)
    })

    return () => {
      headings.forEach((heading) => {
        observer.unobserve(heading.element)
      })
    }
  }, [headings])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  if (headings.length === 0) {
    return null
  }

  const totalHeight = headings[headings.length - 1].position
  if (totalHeight <= 0) {
    return null
  }

  const railSpacing = isTocHovered ? 12 : 4

  return (
      <div 
          className={cn("hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-50", className)} 
          style={{ 
            pointerEvents: 'none',
            width: 'auto',
            minWidth: '0'
          }}
        >
          <div 
            className="relative flex flex-col transition-all duration-200 ease-in-out"
            style={{ 
              gap: `${railSpacing}px`,
              pointerEvents: 'auto'
            }}
            onMouseEnter={() => {
              setIsTocHovered(true)
              if (!hasExpanded) {
                setHasExpanded(true)
              }
            }}
            onMouseLeave={() => setIsTocHovered(false)}
          >
          <div 
            className="absolute bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-xl -z-10"
            style={{
              left: '-1.25rem',
              right: '-1.25rem',
              top: '-1.25rem',
              bottom: '-1.25rem',
              opacity: isTocHovered ? 1 : 0,
              transitionDelay: (!prevIsTocHovered.current && isTocHovered) ? '50ms' : '0ms',
              transitionDuration: '170ms',
              transitionTimingFunction: 'ease-in-out',
              pointerEvents: isTocHovered ? 'auto' : 'none'
            }}
          />
          {headings.map((heading) => {
            const isActive = activeId === heading.id
            const isHovered = hoveredId === heading.id
            const textOpacity = isTocHovered 
              ? ((isActive || isHovered) ? 1 : 0.8)
              : 0

            return (
              <div
                key={heading.id}
                className="flex items-center gap-2 cursor-pointer group"
                onMouseEnter={() => setHoveredId(heading.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleClick(heading.id)}
              >
                <div
                  className={cn(
                    "flex-shrink-0 rounded-full",
                    isActive || isHovered
                      ? isTocHovered ? "h-[1.5px] w-2" : "h-[2.5px] w-8"
                      : isTocHovered ? "opacity-60 h-[1.5px] w-2" : "opacity-60 h-[2px] w-5",
                    isActive || isHovered
                      ? "bg-stone-700 dark:bg-zinc-300"
                      : "bg-stone-400 dark:bg-zinc-600"
                  )}
                  style={{ 
                    minWidth: (isActive || isHovered) && !isTocHovered ? '32px' : (isTocHovered ? '8px' : '20px'),
                    minHeight: isActive || isHovered ? (isTocHovered ? '1.5px' : '2.5px') : (isTocHovered ? '1.5px' : '2px'),
                    opacity: isActive || isHovered ? 0.8 : undefined,
                    transition: (hasExpanded && isTocHovered && hoveredId !== null && prevIsTocHovered.current) ? 'none' : 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                
                <span
                  className={cn(
                    "text-sm whitespace-nowrap pointer-events-none flex-shrink-0 font-normal"
                  )}
                  style={{ 
                    opacity: textOpacity,
                    color: isDarkMode
                      ? (isActive || isHovered ? 'rgb(212 212 216)' : 'rgb(161 161 170)')
                      : (isActive || isHovered ? 'rgb(68 64 60)' : 'rgb(120 113 108)'),
                    ...(hasExpanded && isTocHovered && prevIsTocHovered.current && hoveredId !== null
                      ? {
                          transitionProperty: 'none',
                          transitionDuration: '0ms',
                          transitionDelay: '0ms'
                        }
                      : {
                          transitionProperty: 'opacity',
                          transitionDuration: '100ms',
                          transitionTimingFunction: 'ease-in-out',
                          transitionDelay: (!prevIsTocHovered.current && isTocHovered) ? '320ms' : '0ms'
                        })
                  }}
                >
                  {heading.text}
                </span>
              </div>
            )
          })}
          </div>
        </div>
  )
}

