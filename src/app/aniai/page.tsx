import AniaiContentClient from './content-client'
import { getLikeCount } from '@/lib/get-like-count'

export default async function AniaiPost() {
  const initialCount = await getLikeCount('aniai')
  
  return <AniaiContentClient initialCount={initialCount} />
}
