import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8">
      <div className="text-center">
        <h1>Blog</h1>
        <p>
          Welcome to my blog! MDX support is being set up.
        </p>
      </div>

      <div className="grid gap-6">
        <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2>
            <Link href="/blog/aniai">
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
            <Link href="/blog/athenahealth">
              My Second Blog Post
            </Link>
          </h2>
          <p>
            A template showing how easy it is to create new blog posts with shared styling and layout.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Published on {new Date().toLocaleDateString()}
          </div>
        </article>

        <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2>
            <Link href="/">
              Back to Home
            </Link>
          </h2>
          <p>
            Return to the main portfolio page with the carousel component.
          </p>
        </article>
      </div>
    </div>
  )
}
