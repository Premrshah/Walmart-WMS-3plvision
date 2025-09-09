import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getValidUserToken } from '@/lib/dropbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This contains userId and form data
    const error = searchParams.get('error')

    // Parse state parameter to extract userId and form data
    let userId: string
    let formData: { seller_name: string, email: string, ste_code: string } | null = null
    
    try {
      const stateData = JSON.parse(decodeURIComponent(state || ''))
      userId = stateData.userId
      formData = {
        seller_name: stateData.seller_name,
        email: stateData.email,
        ste_code: stateData.ste_code
      }
    } catch {
      // Fallback to treating state as just userId
      userId = state || ''
    }

    console.log('Dropbox OAuth callback received')

    if (error) {
      console.error('OAuth error:', error)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/?error=dropbox_auth_failed&message=${encodeURIComponent(error)}`)
    }

    if (!code || !userId) {
      console.error('Missing code or userId parameter')
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/?error=missing_parameters`)
    }

    // Exchange the authorization code for an access token
    try {
      await exchangeCodeForToken(code, userId)
      
      // If we have form data, automatically create the file request and redirect to upload link
      if (formData) {
        
        try {
          const token = await getValidUserToken(userId)
          const parentFolder = process.env.DROPBOX_KYC_PARENT_FOLDER || '/3PLVision/KYC-Uploads'
          
          const safeSeller = formData.seller_name.toString().replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'Seller'
          const safeSte = formData.ste_code.toString().replace(/[^a-zA-Z0-9-_]/g, '') || 'XXXX'
          
          const title = `KYC - ${safeSeller} - STE-${safeSte}`
          const destination = `${parentFolder}/${safeSeller}-STE-${safeSte}`
          
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
          
          const data = await resp.json()
          
          if (resp.ok && data.url) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            // Redirect back to form with success parameter and store the upload URL
            return NextResponse.redirect(`${baseUrl}/?dropbox_auth=success&upload_url=${encodeURIComponent(data.url)}`)
          } else {
            console.error('Failed to create file request:', data)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            return NextResponse.redirect(`${baseUrl}/?error=file_request_failed&message=${encodeURIComponent(data?.error_summary || 'Failed to create file request')}`)
          }
        } catch (fileRequestError) {
          console.error('Error creating file request:', fileRequestError)
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          return NextResponse.redirect(`${baseUrl}/?error=file_request_error&message=${encodeURIComponent(fileRequestError instanceof Error ? fileRequestError.message : 'Unknown error')}`)
        }
      } else {
        // No form data, redirect back to form with success message
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        return NextResponse.redirect(`${baseUrl}/?dropbox_auth=success`)
      }
    } catch (error) {
      console.error('Failed to exchange code for token:', error)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`)
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`)
  }
}
