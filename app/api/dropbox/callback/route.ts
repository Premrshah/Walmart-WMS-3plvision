import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getValidUserToken } from '@/lib/dropbox'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This contains userId and form data
    const error = searchParams.get('error')


    // Parse state parameter to extract userId and form data
    let userId: string
    let formData: { 
      seller_name: string, 
      email: string, 
      ste_code: string,
      business_name?: string,
      contact_name?: string,
      primary_phone?: string,
      seller_logo?: string,
      address?: string,
      city?: string,
      state?: string,
      zipcode?: string,
      country?: string,
      store_type?: string,
      comments?: string,
      walmart_address?: string
    } | null = null
    
    try {
      const stateData = JSON.parse(decodeURIComponent(state || ''))
      userId = stateData.userId
      formData = {
        seller_name: stateData.seller_name,
        email: stateData.email,
        ste_code: stateData.ste_code,
        business_name: stateData.business_name,
        contact_name: stateData.contact_name,
        primary_phone: stateData.primary_phone,
        seller_logo: stateData.seller_logo,
        address: stateData.address,
        city: stateData.city,
        state: stateData.state,
        zipcode: stateData.zipcode,
        country: stateData.country,
        store_type: stateData.store_type,
        comments: stateData.comments,
        walmart_address: stateData.walmart_address
      }
    } catch (error) {
      console.error('Failed to parse state data:', error)
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
                        // Include form data in redirect URL to preserve form state
                        const formDataParams = new URLSearchParams({
                          seller_name: formData.seller_name || '',
                          email: formData.email || '',
                          ste_code: formData.ste_code || '',
                          business_name: formData.business_name || '',
                          address: formData.address || '',
                          city: formData.city || '',
                          state: formData.state || '',
                          zipcode: formData.zipcode || '',
                          country: formData.country || '',
                          store_type: formData.store_type || '',
                          comments: formData.comments || '',
                          seller_logo: formData.seller_logo || '',
                          contact_name: formData.contact_name || '',
                          primary_phone: formData.primary_phone || '',
                          walmart_address: formData.walmart_address || ''
                        }).toString()
                        const redirectUrl = `${baseUrl}/?dropbox_auth=success&upload_url=${encodeURIComponent(data.url)}&${formDataParams}`
                        // Redirect back to form with success parameter and store the upload URL
                        return NextResponse.redirect(redirectUrl)
                      } else {
                        console.error('Failed to create file request:', data)
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                        // Include form data in error redirect as well
                        const formDataParams = new URLSearchParams({
                          seller_name: formData.seller_name || '',
                          email: formData.email || '',
                          ste_code: formData.ste_code || '',
                          business_name: formData.business_name || '',
                          address: formData.address || '',
                          city: formData.city || '',
                          state: formData.state || '',
                          zipcode: formData.zipcode || '',
                          country: formData.country || '',
                          store_type: formData.store_type || '',
                          comments: formData.comments || '',
                          seller_logo: formData.seller_logo || '',
                          contact_name: formData.contact_name || '',
                          primary_phone: formData.primary_phone || '',
                          walmart_address: formData.walmart_address || ''
                        }).toString()
                        const redirectUrl = `${baseUrl}/?error=file_request_failed&message=${encodeURIComponent(data?.error_summary || 'Failed to create file request')}&${formDataParams}`
                        return NextResponse.redirect(redirectUrl)
                      }
        } catch (fileRequestError) {
          console.error('Error creating file request:', fileRequestError)
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          // Include form data in error redirect as well
          const formDataParams = formData ? new URLSearchParams({
            seller_name: formData.seller_name || '',
            email: formData.email || '',
            ste_code: formData.ste_code || '',
            business_name: formData.business_name || '',
            address: formData.address || '',
            city: formData.city || '',
            state: formData.state || '',
            zipcode: formData.zipcode || '',
            country: formData.country || '',
            store_type: formData.store_type || '',
            comments: formData.comments || '',
            seller_logo: formData.seller_logo || '',
            contact_name: formData.contact_name || '',
            primary_phone: formData.primary_phone || '',
            walmart_address: formData.walmart_address || ''
          }).toString() : ''
          const redirectUrl = `${baseUrl}/?error=file_request_error&message=${encodeURIComponent(fileRequestError instanceof Error ? fileRequestError.message : 'Unknown error')}${formDataParams ? '&' + formDataParams : ''}`
          return NextResponse.redirect(redirectUrl)
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
