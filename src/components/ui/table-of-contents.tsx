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
          console.log('[TOC DEBUG] Headings extracted:', {
            count: headingsList.length,
            headings: headingsList.map(h => ({ id: h.id, text: h.text, position: h.position }))
          })
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

  // Scroll listener to detect when near bottom and mark last heading as active
  React.useEffect(() => {
    if (headings.length === 0) return

    const handleBottomScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const clientHeight = window.innerHeight
      const scrollBottom = scrollTop + clientHeight
      const distanceFromBottom = scrollHeight - scrollBottom
      const threshold20Percent = scrollHeight * 0.2
      
      console.log('[TOC DEBUG] Bottom scroll detection:', {
        scrollHeight,
        scrollTop,
        clientHeight,
        scrollBottom,
        distanceFromBottom,
        threshold20Percent,
        isNearBottom: distanceFromBottom < threshold20Percent,
        headingsCount: headings.length,
        lastHeadingId: headings[headings.length - 1]?.id,
        lastHeadingText: headings[headings.length - 1]?.text
      })
      
      // If within last 20% of page scroll
      if (distanceFromBottom < threshold20Percent) {
        const lastHeading = headings[headings.length - 1]
        if (lastHeading) {
          const lastHeadingRect = lastHeading.element.getBoundingClientRect()
          console.log('[TOC DEBUG] Checking last heading:', {
            lastHeadingId: lastHeading.id,
            lastHeadingText: lastHeading.text,
            lastHeadingRectTop: lastHeadingRect.top,
            shouldActivate: lastHeadingRect.top < 200,
            currentActiveId: activeId
          })
          // If last heading is above the viewport threshold (within 200px from top), make it active
          if (lastHeadingRect.top < 200) {
            console.log('[TOC DEBUG] Setting last heading as active:', lastHeading.id)
            setActiveId(lastHeading.id)
          }
        }
      }
    }

    window.addEventListener('scroll', handleBottomScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleBottomScroll)
    }
  }, [headings, activeId])

  React.useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        console.log('[TOC DEBUG] IntersectionObserver callback triggered, entries count:', entries.length)
        
        let activeHeading: IntersectionObserverEntry | null = null
        let closestDistance = Infinity

        entries.forEach((entry) => {
          const rect = entry.boundingClientRect
          const distanceFromTop = Math.abs(rect.top)
          const targetId = (entry.target as HTMLElement).id

          console.log('[TOC DEBUG] IntersectionObserver entry:', {
            targetId,
            isIntersecting: entry.isIntersecting,
            rectTop: rect.top,
            distanceFromTop,
            intersectionRatio: entry.intersectionRatio
          })

          if (entry.isIntersecting && distanceFromTop < closestDistance) {
            closestDistance = distanceFromTop
            activeHeading = entry
          }
        })

        let finalActiveHeading: IntersectionObserverEntry | null = activeHeading
        if (activeHeading) {
          const target = (activeHeading as IntersectionObserverEntry).target as HTMLElement
          const targetId = target?.id || null
          console.log('[TOC DEBUG] Initial activeHeading:', targetId)
        } else {
          console.log('[TOC DEBUG] Initial activeHeading:', null)
        }
        
        if (!finalActiveHeading) {
          // Check if we're near the bottom of the page
          const scrollHeight = document.documentElement.scrollHeight
          const scrollTop = window.scrollY || document.documentElement.scrollTop
          const clientHeight = window.innerHeight
          const scrollBottom = scrollTop + clientHeight
          const distanceFromBottom = scrollHeight - scrollBottom
          const isNearBottom = distanceFromBottom < scrollHeight * 0.2 // Within last 20% of page

          console.log('[TOC DEBUG] No active heading, checking bottom:', {
            scrollHeight,
            scrollTop,
            clientHeight,
            scrollBottom,
            distanceFromBottom,
            isNearBottom,
            headingsCount: headings.length,
            lastHeadingId: headings[headings.length - 1]?.id
          })

          let mostRecentPastHeading: IntersectionObserverEntry | null = null
          entries.forEach((entry) => {
            const rect = entry.boundingClientRect
            if (rect.top < 100 && (mostRecentPastHeading === null || rect.top > mostRecentPastHeading.boundingClientRect.top)) {
              mostRecentPastHeading = entry
            }
          })

          if (mostRecentPastHeading) {
            const target = (mostRecentPastHeading as IntersectionObserverEntry).target as HTMLElement
            const targetId = target?.id || null
            console.log('[TOC DEBUG] Most recent past heading:', targetId)
          } else {
            console.log('[TOC DEBUG] Most recent past heading:', null)
          }

          // If near bottom and we have headings, prioritize the last heading
          if (isNearBottom && headings.length > 0) {
            const lastHeading = headings[headings.length - 1]
            const lastHeadingElement = entries.find(entry => (entry.target as HTMLElement).id === lastHeading.id)
            console.log('[TOC DEBUG] Looking for last heading in entries:', {
              lastHeadingId: lastHeading.id,
              lastHeadingFound: !!lastHeadingElement,
              entriesIds: entries.map(e => (e.target as HTMLElement).id)
            })
            
            if (lastHeadingElement) {
              const lastHeadingRect = lastHeadingElement.boundingClientRect
              console.log('[TOC DEBUG] Last heading rect:', {
                top: lastHeadingRect.top,
                shouldActivate: lastHeadingRect.top < 200
              })
              // If last heading is above the threshold (within 200px from top), make it active
              if (lastHeadingRect.top < 200) {
                finalActiveHeading = lastHeadingElement
                console.log('[TOC DEBUG] Setting last heading as finalActiveHeading:', lastHeading.id)
              } else if (mostRecentPastHeading) {
                finalActiveHeading = mostRecentPastHeading
                const target = (mostRecentPastHeading as IntersectionObserverEntry).target as HTMLElement
                const targetId = target?.id || null
                console.log('[TOC DEBUG] Using mostRecentPastHeading instead:', targetId)
              }
            } else if (mostRecentPastHeading) {
              finalActiveHeading = mostRecentPastHeading
              const target = (mostRecentPastHeading as IntersectionObserverEntry).target as HTMLElement
              const targetId = target?.id || null
              console.log('[TOC DEBUG] Last heading not in entries, using mostRecentPastHeading:', targetId)
            }
          } else if (mostRecentPastHeading) {
            finalActiveHeading = mostRecentPastHeading
            const target = (mostRecentPastHeading as IntersectionObserverEntry).target as HTMLElement
            const targetId = target?.id || null
            console.log('[TOC DEBUG] Not near bottom, using mostRecentPastHeading:', targetId)
          }
        }

        if (finalActiveHeading) {
          const target = (finalActiveHeading as IntersectionObserverEntry).target as HTMLElement
          if (target?.id) {
            console.log('[TOC DEBUG] Setting activeId to:', target.id)
            setActiveId(target.id)
          }
        } else {
          console.log('[TOC DEBUG] No finalActiveHeading found, not updating activeId')
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
    console.log('[TOC DEBUG] handleClick called:', {
      clickedId: id,
      headingsCount: headings.length,
      allHeadingIds: headings.map(h => h.id),
      isLastHeading: headings[headings.length - 1]?.id === id
    })
    
    // Immediately set the clicked item as active
    setActiveId(id)
    console.log('[TOC DEBUG] Set activeId to:', id)
    
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      console.log('[TOC DEBUG] Scrolling to element:', {
        elementFound: true,
        elementPosition,
        offsetPosition,
        scrollHeight: document.documentElement.scrollHeight
      })

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    } else {
      console.log('[TOC DEBUG] Element not found for id:', id)
    }
  }

  if (headings.length === 0) {
    return null
  }

  const totalHeight = headings[headings.length - 1].position
  if (totalHeight <= 0) {
    return null
  }

  const railSpacing = isTocHovered ? 12 : 2

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
            className="absolute bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-lg -z-10"
            style={{
              left: '-1.25rem',
              right: (hasExpanded && isTocHovered) ? '-2rem' : '-0.5rem',
              top: '-1rem',
              bottom: '-1rem',
              opacity: isTocHovered ? 1 : 0,
              transitionProperty: 'opacity, right',
              transitionDuration: '170ms, 350ms',
              transitionDelay: (!prevIsTocHovered.current && isTocHovered) ? '50ms, 0ms' : '0ms',
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
                      ? isTocHovered ? "h-[1.5px] w-[1.5px]" : "h-[2.2px] w-8"
                      : isTocHovered ? "opacity-70 dark:opacity-80 h-[1.5px] w-[1.5px]" : "opacity-70 dark:opacity-80 h-[2.2px] w-5",
                    isActive || isHovered
                      ? "bg-stone-600 dark:bg-zinc-300"
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