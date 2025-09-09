import { NextRequest, NextResponse } from 'next/server'
import { getDropboxAuthUrl } from '@/lib/dropbox'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, seller_name, email, ste_code } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const authUrl = getDropboxAuthUrl(userId, { seller_name, email, ste_code })
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Failed to generate auth URL:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate auth URL' 
    }, { status: 500 })
  }
}
