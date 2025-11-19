"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Divider } from '@/components/ui/divider'
import styles from './blog-post.module.css'
import BlogPostHeader from '@/components/blog-post-header'

interface BlogPostLayoutProps {
  children: React.ReactNode
  slug?: string
}

// Project navigation data
const PROJECTS = [
  {
    slug: 'aniai',
    title: 'Aniai',
    description: 'Building the Tools Behind Smarter Robots'
  },
  {
    slug: 'athenahealth',
    title: 'AthenaHealth',
    description: 'Encouraging Prompt Medical Bill Payment'
  }
] as const

interface ProjectNavigation {
  previousProject?: {
    slug: string
    title: string
    description: string
  }
  nextProject?: {
    slug: string
    title: string
    description: string
  }
}

function getProjectNavigation(slug?: string): ProjectNavigation {
  if (!slug) return {}
  
  const currentIndex = PROJECTS.findIndex(p => p.slug === slug)
  if (currentIndex === -1) return {}
  
  const previousProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : undefined
  const nextProject = currentIndex < PROJECTS.length - 1 ? PROJECTS[currentIndex + 1] : undefined
  
  return {
    previousProject: previousProject ? {
      slug: previousProject.slug,
      title: previousProject.title,
      description: previousProject.description
    } : undefined,
    nextProject: nextProject ? {
      slug: nextProject.slug,
      title: nextProject.title,
      description: nextProject.description
    } : undefined
  }
}

// Helper function to prevent widows by wrapping last two words
function preventWidow(text: string): React.ReactNode {
  const words = text.split(' ')
  if (words.length <= 2) return text
  
  const lastTwoWords = words.slice(-2).join(' ')
  const restOfText = words.slice(0, -2).join(' ')
  
  return (
    <>
      {restOfText && `${restOfText} `}
      <span style={{ whiteSpace: 'nowrap' }}>{lastTwoWords}</span>
    </>
  )
}

export default function BlogPostLayout({ children, slug }: BlogPostLayoutProps) {
  // Custom labels for aniai post
  const tocLabels = slug === 'aniai' ? {
    "Designing speed for robot development (2024-2025)": "Parametric firmware generator",
    "Scaling robot updates with confidence (2025)": "Robot update manger",
    "Building a foundation for fast, consistent design (2025)": "Minimum viable design system",
    "Closing thoughts": "Thoughts"
  } : undefined

  // Get project navigation
  const { previousProject, nextProject } = getProjectNavigation(slug)

  return (
    <TooltipProvider>
      {/* <TableOfContents labels={tocLabels} /> */}
      <div className="w-full px-4 pt-12 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Sticky header */}
          <BlogPostHeader slug={slug} />

          {/* Content with overflow-x-hidden */}
          <div className={styles.mdxContent} >
            {children}
          </div>

          {/* Project Navigation Footer */}
          {(previousProject || nextProject) && (
            <div className="max-w-[480px] mx-auto mt-28 mb-8 sm:mb-16 overflow-x-hidden">
              <Divider variant="default" color="stone" spacing="xl" />
              <div className="flex justify-between items-start mt-6 gap-8">
                {/* Previous Project */}
                {previousProject ? (
                  <Link 
                    href={`/${previousProject.slug}`}
                    className="flex-1 group cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ textDecoration: 'none' }}
                  >
                    <div 
                      className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic mb-1.5 opacity-80"
                      style={{ fontFamily: 'Inter' }}
                    >
                      Previous
                    </div>
                    <p 
                      className="mt-0 not-italic project-nav-description"
                      style={{ fontSize: '14px' }}
                    >
                      {preventWidow(previousProject.description)}
                    </p>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Next Project */}
                {nextProject ? (
                  <Link 
                    href={`/${nextProject.slug}`}
                    className="flex-1 text-right group cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ textDecoration: 'none' }}
                  >
                    <div 
                      className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic mb-1.5 opacity-80"
                      style={{ fontFamily: 'Inter' }}
                    >
                      Next
                    </div>
                    <p 
                      className="mt-0 not-italic project-nav-description"
                      style={{ fontSize: '14px' }}
                    >
                      {preventWidow(nextProject.description)}
                    </p>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </TooltipProvider>
  )
}