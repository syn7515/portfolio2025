import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export interface OgResponse {
  image?: string
  title?: string
  description?: string
}

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.localhost')) return false
    if (/^127\.|^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\./.test(host)) return false
    return true
  } catch {
    return false
  }
}

function resolveUrl(base: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  try {
    const baseUrl = new URL(base)
    return new URL(path, baseUrl.origin).href
  } catch {
    return path
  }
}

function extractMeta(html: string, baseUrl: string): OgResponse {
  const result: OgResponse = {}
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const head = headMatch ? headMatch[1] : html

  const ogImageMatch = head.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  if (ogImageMatch) {
    result.image = resolveUrl(baseUrl, ogImageMatch[1].trim())
  }

  const ogTitleMatch = head.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
  if (ogTitleMatch) {
    result.title = ogTitleMatch[1].trim()
  }

  const ogDescMatch = head.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
  if (ogDescMatch) {
    result.description = ogDescMatch[1].trim()
  }

  return result
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url')
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  const decoded = decodeURIComponent(urlParam)
  if (!isValidUrl(decoded)) {
    return NextResponse.json({ error: 'Invalid or disallowed URL' }, { status: 400 })
  }

  try {
    const res = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json(extractMeta('', decoded), {
        headers: { 'Cache-Control': 'private, max-age=3600' },
      })
    }

    const html = await res.text()
    const data = extractMeta(html, decoded)

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    })
  } catch (err) {
    console.error('[api/og] fetch error:', err)
    return NextResponse.json(
      {},
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
