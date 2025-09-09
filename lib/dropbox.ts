// lib/dropbox.ts - Dropbox OAuth 2.0 Authorization Code Flow for File Requests
// Based on: https://developers.dropbox.com/oauth-guide

interface DropboxTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  refresh_token?: string
}

interface UserToken {
  access_token: string
  refresh_token?: string
  expires_at: number
  user_id?: string
}

// In-memory storage for user tokens (in production, use a secure database)
const userTokens = new Map<string, UserToken>()

/**
 * Generate Dropbox OAuth authorization URL
 * This redirects the user to Dropbox to authorize the app
 */
export function getDropboxAuthUrl(userId: string, formData?: { 
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
}): string {
  const appKey = process.env.DROPBOX_APP_KEY
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = process.env.DROPBOX_REDIRECT_URI || `${baseUrl}/api/dropbox/callback`
  
  
  if (!appKey) {
    throw new Error('Missing DROPBOX_APP_KEY environment variable')
  }

  // Encode form data in the state parameter instead of redirect URI
  let state = userId
  if (formData) {
    const stateData = {
      userId,
      seller_name: formData.seller_name,
      email: formData.email,
      ste_code: formData.ste_code,
      business_name: formData.business_name,
      contact_name: formData.contact_name,
      primary_phone: formData.primary_phone,
      seller_logo: formData.seller_logo,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipcode: formData.zipcode,
      country: formData.country,
      store_type: formData.store_type,
      comments: formData.comments,
      walmart_address: formData.walmart_address
    }
    state = encodeURIComponent(JSON.stringify(stateData))
  }

  const params = new URLSearchParams({
    client_id: appKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'file_requests.write file_requests.read files.metadata.write files.metadata.read',
    state: state,
    token_access_type: 'offline' // Request refresh token for long-term access
  })

  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 * This is called after the user authorizes the app on Dropbox
 */
export async function exchangeCodeForToken(code: string, userId: string): Promise<UserToken> {
  const appKey = process.env.DROPBOX_APP_KEY
  const appSecret = process.env.DROPBOX_APP_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = process.env.DROPBOX_REDIRECT_URI || `${baseUrl}/api/dropbox/callback`

  if (!appKey || !appSecret) {
    throw new Error('Missing Dropbox app credentials')
  }

  try {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appKey,
        client_secret: appSecret,
        code,
        redirect_uri: redirectUri
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token exchange error:', errorText)
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const data: DropboxTokenResponse = await response.json()
    
    const userToken: UserToken = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      user_id: userId
    }

    // Store the token
    userTokens.set(userId, userToken)
    
    return userToken
  } catch (error) {
    console.error('Failed to exchange code for token:', error)
    throw new Error(`Unable to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get a valid access token for a user, refreshing if needed
 * This is the main function called by the file request API
 */
export async function getValidUserToken(userId: string): Promise<string> {
  const userToken = userTokens.get(userId)
  
  if (!userToken) {
    throw new Error('User not authenticated with Dropbox. Please authorize the application first.')
  }

  // Check if token is still valid (with 5 minute buffer)
  if (Date.now() < userToken.expires_at - 300000) {
    return userToken.access_token
  }

  // Token is expired, try to refresh
  if (userToken.refresh_token) {
    try {
      const refreshedToken = await refreshUserToken(userId, userToken.refresh_token)
      return refreshedToken.access_token
    } catch (error) {
      console.error('Failed to refresh token for user:', userId, error)
      throw new Error('Token expired and refresh failed. Please re-authorize the application.')
    }
  }

  throw new Error('Token expired and no refresh token available. Please re-authorize the application.')
}

/**
 * Refresh a user's access token using their refresh token
 */
async function refreshUserToken(userId: string, refreshToken: string): Promise<UserToken> {
  const appKey = process.env.DROPBOX_APP_KEY
  const appSecret = process.env.DROPBOX_APP_SECRET

  if (!appKey || !appSecret) {
    throw new Error('Missing Dropbox app credentials')
  }

  try {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: appKey,
        client_secret: appSecret,
        refresh_token: refreshToken
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh error:', errorText)
      throw new Error(`Token refresh failed: ${errorText}`)
    }

    const data: DropboxTokenResponse = await response.json()
    
    const userToken: UserToken = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Keep existing refresh token if not provided
      expires_at: Date.now() + (data.expires_in * 1000),
      user_id: userId
    }

    // Update the stored token
    userTokens.set(userId, userToken)
    
    return userToken
  } catch (error) {
    console.error('Failed to refresh token:', error)
    throw new Error(`Unable to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if user is authenticated with Dropbox
 */
export function isUserAuthenticated(userId: string): boolean {
  const userToken = userTokens.get(userId)
  return userToken !== undefined && Date.now() < userToken.expires_at
}

/**
 * Revoke user's Dropbox access
 */
export function revokeUserAccess(userId: string): void {
  userTokens.delete(userId)
}

/**
 * Get user's Dropbox authentication status
 */
export function getUserAuthStatus(userId: string): { authenticated: boolean; expiresAt?: Date } {
  const userToken = userTokens.get(userId)
  return {
    authenticated: userToken !== undefined && Date.now() < userToken.expires_at,
    expiresAt: userToken ? new Date(userToken.expires_at) : undefined
  }
}