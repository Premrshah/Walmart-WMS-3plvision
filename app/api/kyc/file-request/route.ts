import { NextResponse } from 'next/server'
import { getValidUserToken, isUserAuthenticated } from '@/lib/dropbox'

export async function POST(req: Request) {
  try {
    console.log('KYC file request API called')
    const { seller_name, email, ste_code, userId } = await req.json()
    console.log('Request data:', { seller_name, email, ste_code, userId })

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required for Dropbox authentication' }, { status: 400 })
    }

    // Check if user is authenticated with Dropbox
    if (!isUserAuthenticated(userId)) {
      return NextResponse.json({ 
        error: 'User not authenticated with Dropbox',
        requiresAuth: true 
      }, { status: 401 })
    }

    // Get a valid access token for the user (auto-refreshes if needed)
    console.log('Getting access token for user:', userId)
    const token = await getValidUserToken(userId)
    console.log('Access token received, length:', token.length)
    
    const parentFolder = process.env.DROPBOX_KYC_PARENT_FOLDER || '/3PLVision/KYC-Uploads'
    console.log('Parent folder:', parentFolder)

    const safeSeller = (seller_name || 'Seller').toString().replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'Seller'
    const safeSte = (ste_code || 'XXXX').toString().replace(/[^a-zA-Z0-9-_]/g, '') || 'XXXX'

    const title = `KYC - ${safeSeller} - STE-${safeSte}`
    const destination = `${parentFolder}/${safeSeller}-STE-${safeSte}`
    
    console.log('Creating file request:', { title, destination })

    // First, try to create the folder if it doesn't exist
    try {
      const folderResp = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: destination,
          autorename: false
        })
      })
      
      if (folderResp.ok) {
        console.log('Folder created successfully')
      } else if (folderResp.status === 409) {
        console.log('Folder already exists')
      } else {
        const folderError = await folderResp.json()
        console.log('Folder creation response:', folderError)
      }
    } catch (folderError) {
      console.log('Folder creation error (non-critical):', folderError)
    }

    // Try to create the file request
    const resp = await fetch('https://api.dropboxapi.com/2/file_requests/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        destination,
        open: true
      })
    })

    console.log('Dropbox file request response status:', resp.status)
    const data = await resp.json()
    console.log('Dropbox file request response:', data)
    
    if (!resp.ok) {
      console.error('Dropbox file request failed:', data)
      
      // If file request fails, try creating a shared link as fallback
      console.log('Trying fallback: creating shared link for folder')
      try {
        const sharedLinkResp = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: destination,
            settings: {
              requested_visibility: 'public',
              audience: 'public',
              access: 'viewer'
            }
          })
        })
        
        if (sharedLinkResp.ok) {
          const sharedLinkData = await sharedLinkResp.json()
          console.log('Shared link created successfully:', sharedLinkData)
          
          return NextResponse.json({
            id: 'shared-link',
            url: sharedLinkData.url,
            title: `${title} (Shared Link)`,
            destination,
            type: 'shared_link'
          })
        } else {
          const sharedLinkError = await sharedLinkResp.json()
          console.error('Shared link creation also failed:', sharedLinkError)
        }
      } catch (sharedLinkError) {
        console.error('Shared link creation error:', sharedLinkError)
      }
      
      return NextResponse.json({ error: data?.error_summary || 'Dropbox error' }, { status: 500 })
    }

    console.log('File request created successfully')
    return NextResponse.json({
      id: data.id,
      url: data.url,
      title,
      destination,
      type: 'file_request'
    })
  } catch (e: any) {
    console.error('KYC file request error:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


