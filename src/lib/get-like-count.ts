import { createClient } from 'redis'

// Helper to get Redis client (lazy initialization)
let redisClient: ReturnType<typeof createClient> | null = null

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  if (!process.env.REDIS_URL) {
    return null
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

export async function getLikeCount(slug: string): Promise<number> {
  try {
    const redis = await getRedisClient()
    if (!redis) {
      return 0
    }

    const countStr = await redis.get(`likes:${slug}`)
    return countStr ? parseInt(countStr as string, 10) : 0
  } catch (error) {
    console.error('Error fetching like count:', error)
    return 0
  }
}

