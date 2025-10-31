"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {

  return (


    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 gap-16 sm: overflow-x-hidden">
      <main className="w-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start overflow-x-hidden">
        <div className="max-w-[480px] mx-auto px-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="font-semibold">Sue Park</span>. Designer with engineering mindset, obsessed with why behind everything — from strategies to pixels.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          >
            Currently a founding product designer at <a href="https://www.aniai.ai/" target="_blank" rel="noopener noreferrer" className="intro-link">Aniai</a>, designing a robot interface.
          </motion.p>
          <motion.p
            className="!text-stone-500 dark:!text-zinc-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          >
            Previously, reimagined public benefits at <a href="https://goinvo.com/" target="_blank" rel="noopener noreferrer" className="intro-link-light">Goinvo</a> and advanced healthcare accessibility at <a href="https://www.athenahealth.com/" target="_blank" rel="noopener noreferrer" className="intro-link-light">AthenaHealth</a>.
          </motion.p>
          
          <motion.div
            className="flex gap-4 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
          >
            <a 
              href="https://x.com/spark7515" 
              target="_blank" 
              rel="noopener noreferrer"
              className="!text-stone-400 dark:!text-stone-500 hover:!text-stone-600 dark:hover:!text-stone-300 transition-colors opacity-80"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com/in/sooyeonp/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="!text-stone-400 dark:!text-stone-500 hover:!text-stone-600 dark:hover:!text-stone-300 transition-colors opacity-80"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </motion.div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 w-full">
          <div className="grid gap-6">
            <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2>
                <Link href="/aniai">
                  Building the Tools Behind Smarter Robots
                </Link>
              </h2>
              <p>
                A comprehensive example demonstrating MDX features including Markdown syntax, 
                React components, code blocks, and interactive elements.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Published on {new Date().toLocaleDateString()}
              </div>
            </article>

            <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2>
                <Link href="/athenahealth">
                  Encouraging prompt medical bill payment
                </Link>
              </h2>
              <p>
                A template showing how easy it is to create new blog posts with shared styling and layout.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Published on {new Date().toLocaleDateString()}
              </div>
            </article>
          </div>
        </div>
        
      </main>
      
    </div>
  );
}
