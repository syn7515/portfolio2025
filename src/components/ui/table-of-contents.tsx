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
  labels?: Record<string, string> // Optional map of heading id or text to custom labels
}

export default function TableOfContents({ className, labels }: TableOfContentsProps) {
  const [headings, setHeadings] = React.useState<Heading[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [isTocHovered, setIsTocHovered] = React.useState(false)
  const [hasExpanded, setHasExpanded] = React.useState(false)
  // Track previous isTocHovered to detect state changes
  const prevIsTocHovered = React.useRef(isTocHovered)
  // Track dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  
  // Update ref when isTocHovered changes
  React.useEffect(() => {
    prevIsTocHovered.current = isTocHovered
  }, [isTocHovered])
  
  // Detect dark mode
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  // Extract h4 headings and add IDs
  React.useEffect(() => {
    let retryCount = 0
    const maxRetries = 20

    const extractHeadings = () => {
      // Try multiple selector strategies since CSS modules hash class names
      // First try: look for any div that contains h4 elements (likely the mdxContent)
      // Second try: look for h4 elements directly in the document
      let container: Element | null = null
      
      // Strategy 1: Find container by looking for divs that have h4 children
      const allDivs = document.querySelectorAll('div')
      for (const div of allDivs) {
        const h4s = div.querySelectorAll('h4')
        if (h4s.length > 0) {
          container = div
          break
        }
      }

      // Strategy 2: If no container found, just search document for h4
      if (!container) {
        // Check if there are any h4 elements at all
        const allH4s = document.querySelectorAll('h4')
        if (allH4s.length === 0) {
          // Retry if no h4s found yet
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(extractHeadings, 200)
          }
          return
        }
        // Use document as container
        container = document.body
      }

      const h4Elements = container.querySelectorAll('h4')
      
      if (h4Elements.length === 0) {
        // Retry if no headings found yet (content might still be loading)
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(extractHeadings, 200)
          return
        }
        setHeadings([])
        return
      }

      const headingsList: Heading[] = []
      
      // Wait for next frame to ensure layout is complete
      requestAnimationFrame(() => {
        // Re-query to get fresh positions
        const firstHeading = container.querySelector('h4') as HTMLElement
        if (!firstHeading) return
        
        const firstHeadingTop = firstHeading.getBoundingClientRect().top + window.scrollY

        h4Elements.forEach((h4, index) => {
          // Generate ID from text content
          const text = h4.textContent || ''
          const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
          
          // Set ID if not already set
          if (!h4.id) {
            h4.id = id
          }

          const headingTop = (h4 as HTMLElement).getBoundingClientRect().top + window.scrollY
          const position = headingTop - firstHeadingTop

          // Use custom label if provided, otherwise use heading text
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

    // Initial extraction with multiple retries
    const timeoutId = setTimeout(extractHeadings, 100)

    // Watch for DOM changes
    const mutationObserver = new MutationObserver(() => {
      extractHeadings()
    })

    // Observe the body for changes since we don't know the exact class name
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Re-extract on resize and scroll (to recalculate positions)
    const handleResize = () => {
      extractHeadings()
    }
    
    const handleScroll = () => {
      // Recalculate positions on scroll
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

  // Set up IntersectionObserver to track active heading
  React.useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the heading closest to the top of the viewport
        let activeHeading: IntersectionObserverEntry | null = null
        let closestDistance = Infinity

        entries.forEach((entry) => {
          const rect = entry.boundingClientRect
          const distanceFromTop = Math.abs(rect.top)

          // Prefer headings that are intersecting and close to top
          if (entry.isIntersecting && distanceFromTop < closestDistance) {
            closestDistance = distanceFromTop
            activeHeading = entry
          }
        })

        // If no intersecting heading, find the most recently scrolled past one
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
          const entry = finalActiveHeading as IntersectionObserverEntry
          const target = entry.target as HTMLElement
          if (target && target.id) {
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
      const offset = 100 // Offset from top
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

  // Calculate total height from first to last heading
  const totalHeight = headings.length > 0 
    ? headings[headings.length - 1].position 
    : 0

  // Don't render if totalHeight is invalid
  if (totalHeight <= 0) {
    return null
  }

  // Spacing between rails - denser when labels hidden, more spaced when shown
  const railSpacing = isTocHovered ? 16 : 4 // 24px when labels shown, 4px when hidden

  return (
      <div 
          className={cn("hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-50", className)} 
          style={{ 
            pointerEvents: 'none',
            width: 'auto',
            minWidth: '0'
          }}
        >
          {/* Container for all rails - evenly spaced with transition */}
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
          {/* Blurred background box - only shown when labels are visible */}
          <div 
            className="absolute bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-xl -z-10"
            style={{
              left: '-1.25rem',
              right: '-1.25rem',
              top: '-1.25rem',
              bottom: '-1.25rem',
              opacity: isTocHovered ? 1 : 0,
              // Delay adjusted to match label appearance timing: labels finish at 420ms (320ms delay + 100ms duration)
              // Background box: 100ms delay + 120ms duration = 220ms finish
              transitionDelay: (!prevIsTocHovered.current && isTocHovered) ? '100ms' : (isTocHovered ? '0ms' : '0ms'),
              transitionDuration: '120ms',
              transitionTimingFunction: 'ease-in-out',
              pointerEvents: isTocHovered ? 'auto' : 'none'
            }}
          />
          {/* Heading rails and labels - fixed positions with 20px gaps */}
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id
            const isHovered = hoveredId === heading.id
            // Show text only when hovering TOC, with opacity based on active/hover state
            const textOpacity = isTocHovered 
              ? ((isActive || isHovered) ? 1 : 0.4)
              : 0

            return (
              <div
                key={heading.id}
                className="flex items-center gap-[10px] cursor-pointer group"
                style={{ 
                  pointerEvents: 'auto'
                }}
                onMouseEnter={() => setHoveredId(heading.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleClick(heading.id)}
              >
                {/* Rail indicator - horizontal bar for each heading */}
                <div
                  className={cn(
                    "flex-shrink-0 rounded-full",
                    isActive || isHovered
                      ? isTocHovered ? "h-[1.5px] w-1.5" : "h-[2.5px] w-8"
                      : isTocHovered ? "opacity-40 h-[1.5px] w-1.5" : "opacity-40 h-[2px] w-5",
                    isActive || isHovered
                      ? "bg-stone-700 dark:bg-zinc-300" // Active: darker in light, lighter in dark
                      : "bg-stone-400 dark:bg-zinc-600" // Inactive: lighter in light, darker in dark
                  )}
                  style={{ 
                    minWidth: (isActive || isHovered) && !isTocHovered ? '32px' : (isTocHovered ? '6px' : '20px'),
                    minHeight: isActive || isHovered ? (isTocHovered ? '1.5px' : '2.5px') : (isTocHovered ? '1.5px' : '2px'),
                    opacity: isActive || isHovered ? 0.8 : undefined,
                    // Smooth transition with eased bezier curve for both expanding and collapsing
                    // Disable transition only when:
                    // - TOC is already expanded (hasExpanded === true)
                    // - TOC is currently hovered (isTocHovered === true)
                    // - An individual item is being hovered (hoveredId !== null)
                    // - TOC wasn't just expanded (prevIsTocHovered was also true)
                    // This ensures transitions work when expanding (prevIsTocHovered === false) or collapsing
                    transition: (hasExpanded && isTocHovered && hoveredId !== null && prevIsTocHovered.current) ? 'none' : 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                
                {/* Text label */}
                <span
                  className={cn(
                    "text-sm whitespace-nowrap pointer-events-none flex-shrink-0 font-normal"
                  )}
                  style={{ 
                    opacity: textOpacity,
                    // Use inline styles to override any parent CSS - conditionally apply based on dark mode
                    color: isDarkMode
                      ? (isActive || isHovered 
                          ? 'rgb(212 212 216)' // zinc-300
                          : 'rgb(161 161 170)') // zinc-400 (more visible in dark mode)
                      : (isActive || isHovered
                          ? 'rgb(68 64 60)' // stone-700
                          : 'rgb(120 113 108)'), // stone-600
                    // Instant transitions when TOC has already been expanded (for individual item hover)
                    // When expanding: delay must match rail animation duration (350ms) so labels appear after rails finish
                    // When collapsing: instant (0ms delay)
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
                          // When expanding (prevIsTocHovered is false, isTocHovered is true): delay 320ms to match rail animation duration
                          // When collapsing (isTocHovered is false): instant (0ms)
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

