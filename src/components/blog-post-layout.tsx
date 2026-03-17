"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Undo2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Divider } from '@/components/ui/divider'
import { Button } from '@/components/ui/button'
import styles from './blog-post.module.css'
import BlogPostHeader from '@/components/blog-post-header'
import BlogPostToc from '@/components/blog-post-toc'

interface BlogPostLayoutProps {
  children: React.ReactNode
  slug?: string
  title: string
  subtitle?: string
}

// Project navigation data
const PROJECTS = [
  {
    slug: 'aniai',
    title: 'Aniai',
    description: 'Building the Tools Behind Smarter Robots'
  },
  {
    slug: 'alphagrill',
    title: 'AlphaGrill',
    description: 'Robot Interface for Collaboration in Kitchen'
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

export default function BlogPostLayout({ children, slug, title, subtitle }: BlogPostLayoutProps) {
  // Get project navigation
  const { previousProject, nextProject } = getProjectNavigation(slug)

  return (
    <TooltipProvider>
      {/* Fixed side nav: back + TOC; visible only on lg+ */}
      <aside
        className="hidden lg:block fixed left-6 top-[7.5rem] z-50 pl-8"
        aria-label="Post navigation"
      >
        <div className="flex flex-col gap-6">
          <Button variant="ghostNoBg" size="sm" asChild className="cursor-pointer w-fit inline-flex text-sm font-normal !text-stone-400 dark:text-zinc-400 hover:opacity-90 h-auto py-0 px-0">
            <Link href="/" className="flex items-center gap-2" aria-label="Back to home">
              <Undo2 className="size-4 flex-shrink-0" />
              Back
            </Link>
          </Button>
          <BlogPostToc />
        </div>
      </aside>

      <div className="w-full overflow-x-clip px-4 pt-12 sm:pt-20 lg:pt-[7.5rem]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Header: title, subtitle, like/copy */}
          <BlogPostHeader slug={slug} title={title} subtitle={subtitle} />

          {/* Content with overflow-x-hidden */}
          <div className={styles.mdxContent} data-blog-content>
            {children}
          </div>

          {/* Project Navigation Footer */}
          {(previousProject || nextProject) && (
            <div className="max-w-[560px] mx-auto mt-28 mb-8 sm:mb-16 overflow-x-hidden">
              <Divider variant="default" color="stone" spacing="md" />
              <div className="flex justify-between items-start mt-4 gap-8">
                {/* Previous Project */}
                {previousProject ? (
                  <Link 
                    href={`/${previousProject.slug}`}
                    className="flex-1 group cursor-pointer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div 
                      className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic mb-1.5 opacity-80 font-sans"

                    >
                      <span className="relative inline-flex items-center">
                        <ArrowLeft
                          className="absolute left-0 size-3.5 text-current opacity-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:opacity-100"
                          aria-hidden
                        />
                        <span className="relative z-10 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:translate-x-4 group-focus-visible:translate-x-4 motion-reduce:translate-x-0">
                          Previous
                        </span>
                      </span>
                    </div>
                    <p 
                      className="mt-0 not-italic project-nav-description"
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
                    className="flex-1 text-right group cursor-pointer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div 
                      className="text-[14px] text-stone-500 dark:text-zinc-400 font-normal not-italic mb-1.5 opacity-80 font-sans"
                    >
                      <span className="relative inline-flex items-center justify-end">
                        <ArrowRight
                          className="absolute right-0 size-3.5 text-current opacity-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:opacity-100"
                          aria-hidden
                        />
                        <span className="relative z-10 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:-translate-x-4 group-focus-visible:-translate-x-4 motion-reduce:translate-x-0">
                          Next
                        </span>
                      </span>
                    </div>
                    <p 
                      className="mt-0 not-italic project-nav-description"
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