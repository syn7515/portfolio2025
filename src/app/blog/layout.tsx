export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <main className="w-full py-8">
        {children}
      </main>
    </div>
  )
}
