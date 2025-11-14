import AthenahealthContentClient from './content-client'
import { getLikeCount } from '@/lib/get-like-count'

export default async function AthenahealthPost() {
  const initialCount = await getLikeCount('athenahealth')
  
  return <AthenahealthContentClient initialCount={initialCount} />
}


