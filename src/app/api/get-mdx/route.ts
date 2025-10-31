import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

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
    
    // Construct the path to the MDX file
    const filePath = join(process.cwd(), 'src', 'app', slug, 'content.mdx')
    
    // Read the file
    const content = await readFile(filePath, 'utf-8')
    
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading MDX file:', error)
    return NextResponse.json(
      { error: 'Failed to read content' },
      { status: 500 }
    )
  }
}

