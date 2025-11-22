import { put, del, list } from '@vercel/blob';

// Upload an image to Vercel Blob
export async function uploadImage(file: File): Promise<string> {
  const blob = await put(file.name, file, {
    access: 'public',
  });
  return blob.url;
}

// Delete an image from Vercel Blob
export async function deleteImage(url: string): Promise<void> {
  await del(url);
}

// List all images in your blob store
export async function listImages(): Promise<{ url: string; pathname: string; size: number; uploadedAt: Date }[]> {
  const { blobs } = await list();
  return blobs;
}

// Helper to get image URL from blob
export function getImageUrl(blobUrl: string): string {
  return blobUrl;
}
