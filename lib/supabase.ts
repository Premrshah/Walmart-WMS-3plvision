import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging (remove this in production)
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0
})

// Only create client if environment variables are available and valid
export const supabase = (() => {
  // Check if we're in the browser and if environment variables exist
  if (typeof window === 'undefined') {
    console.log('Server-side rendering - Supabase client not created')
    return null
  }

  try {
    // Validate that both variables exist and are not empty
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('Missing Supabase environment variables')
      return null
    }

    // Check if they're just whitespace
    if (supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
      console.log('Supabase environment variables are empty')
      return null
    }

    // Validate URL format
    const url = new URL(supabaseUrl)
    if (!url.protocol || !url.hostname) {
      throw new Error('Invalid URL format')
    }

    console.log('Creating Supabase client with URL:', url.hostname)
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    return null
  }
})()

export type Seller = {
  id?: string
  seller_name: string
  ste_code?: string // Auto-generated, read-only
  contact_name: string
  email: string
  primary_phone: string
  seller_logo?: string // Optional
  business_name: string
  address: string
  city: string
  state: string
  zipcode: string
  country: string
  store_type: string
  comments?: string // Optional
  walmart_address?: string // Auto-generated, not required in form
  created_at?: string
  updated_at?: string
}
