import createMDX from '@next/mdx'

// Where Roll Call (/experiments/1) is deployed.
const ROLL_CALL = process.env.ROLL_CALL_URL ?? 'https://plakatszene-luzern.vercel.app'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Configure images to allow external hostnames
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'f5uskgwhyu2fi170.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Set Turbopack root to current directory
  turbopack: {
    root: process.cwd(),
  },
  // Redirect /work to Figma portfolio
  redirects: async () => {
    return [
      {
        source: '/work',
        destination: 'https://www.figma.com/deck/TFUfKfOJQnaVxak2kskr90/SuePark----Portfolio?node-id=15-99&viewport=75%2C-4693%2C0.39&t=9whDS9KG8w8Hc4KL-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1',
        permanent: true, // 301 redirect
      },
    ]
  },
  // /experiments/1 is Roll Call (github.com/syn7515/plakatszene-luzern), a
  // Vercel project of its own built for this path; shown here, under this domain.
  rewrites: async () => {
    return [
      { source: '/experiments/1', destination: `${ROLL_CALL}/` },
      { source: '/experiments/1/:path*', destination: `${ROLL_CALL}/:path*` },
    ]
  },
  // Optionally, add any other Next.js config below
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    providerImportSource: '@mdx-js/react',
  },
})

// Merge MDX config with Next.js config
export default withMDX(nextConfig)
