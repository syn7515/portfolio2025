"use client"

import Link from 'next/link'
import { Undo2, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from './blog-post.module.css'

interface BlogPostLayoutProps {
  children: React.ReactNode
}

export default function BlogPostLayout({ children }: BlogPostLayoutProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="w-full px-4 pt-12">
      <div className="max-w-[480px] mx-auto mb-4">
        <Button variant="ghost" size="icon-sm" asChild aria-label="Back to Blog" className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50 -ml-2">
          <Link href="/blog">
            <Undo2 className="text-stone-600 dark:text-stone-200" />
          </Link>
        </Button>
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
  )
}


