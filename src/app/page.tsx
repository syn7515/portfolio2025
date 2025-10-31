"use client";

import Link from 'next/link';

export default function Home() {

  return (


    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 gap-16 sm: overflow-x-hidden">
      <main className="w-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start overflow-x-hidden">
        
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
