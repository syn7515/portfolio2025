import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// In-memory cache for MDX content
const contentCache = new Map<string, { content: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache

// Route segment config for optimization
// Using in-memory cache + HTTP headers for caching
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }
    
    // Check cache first
    const cached = contentCache.get(slug)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        { content: cached.content },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      )
    }
    
    // Construct the path to the MDX file
    const filePath = join(process.cwd(), 'src', 'app', slug, 'content.mdx')
    
    // Read the file
    const content = await readFile(filePath, 'utf-8')
    
    // Cache the content
    contentCache.set(slug, { content, timestamp: Date.now() })
    
    return NextResponse.json(
      { content },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Error reading MDX file:', error)
    return NextResponse.json(
      { error: 'Failed to read content' },
      { status: 500 }
    )
  }
}

