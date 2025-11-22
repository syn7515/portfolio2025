import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'

export const dynamic = 'force-dynamic'

// Helper to get Redis client (lazy initialization)
let redisClient: ReturnType<typeof createClient> | null = null

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  redisClient = createClient({
    url: process.env.REDIS_URL,
  })

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  if (!redisClient.isOpen) {
    await redisClient.connect()
  }

  return redisClient
}

// Helper to check if Redis is configured
function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL
}

// GET: Fetch like count for a slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    if (!isRedisConfigured()) {
      // Return 0 if not configured so UI doesn't break
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    const redis = await getRedisClient()
    // Get like count from Redis, default to 0 if not found
    const countStr = await redis.get(`likes:${slug}`)
    const count = countStr ? parseInt(countStr as string, 10) : 0

    return NextResponse.json(
      { count },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching like count:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    // Return 0 on error so UI doesn't break
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}

// POST: Increment like count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    if (!isRedisConfigured()) {
      // Return success with count 0 when Redis is not configured
      // This allows the UI to work in development without Redis
      console.warn('Redis not configured. Like count updates are disabled.')
      return NextResponse.json(
        { count: 0 },
        { status: 200 }
      )
    }
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()
    const key = `likes:${slug}`
    
    // Increment the count atomically
    const newCount = await redis.incr(key)

    return NextResponse.json(
      { count: newCount },
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    )
  } catch (error) {
    console.error('Error incrementing like count:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { 
        error: 'Failed to increment like count',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE: Decrement like count
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    if (!isRedisConfigured()) {
      // Return success with count 0 when Redis is not configured
      // This allows the UI to work in development without Redis
      console.warn('Redis not configured. Like count updates are disabled.')
      return NextResponse.json(
        { count: 0 },
        { status: 200 }
      )
    }
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()
    const key = `likes:${slug}`
    
    // Get current count
    const currentCountStr = await redis.get(key)
    const currentCount = currentCountStr ? parseInt(currentCountStr as string, 10) : 0
    
    // Decrement only if count > 0
    const newCount = Math.max(0, currentCount - 1)
    await redis.set(key, newCount.toString())

    return NextResponse.json(
      { count: newCount },
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    )
  } catch (error) {
    console.error('Error decrementing like count:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { 
        error: 'Failed to decrement like count',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

