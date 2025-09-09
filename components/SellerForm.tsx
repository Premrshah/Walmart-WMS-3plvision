'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Seller } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Upload, Building2, User, Mail, Phone, MapPin, Store, FileText, Database, Copy, Download } from 'lucide-react'
import SignaturePadComponent from './SignaturePad'

export default function SellerForm() {
  const [formData, setFormData] = useState<Seller>({
    seller_name: '',
    ste_code: '',
    contact_name: '',
    email: '',
    primary_phone: '',
    seller_logo: '',
    business_name: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    store_type: '',
    comments: '',
    walmart_address: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [steCode, setSteCode] = useState<string>('')
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'production'

  // Stepper states
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [kycLink, setKycLink] = useState<string>('')
  const [kycUploaded, setKycUploaded] = useState<boolean>(false)
  const [dropboxAuthSuccess, setDropboxAuthSuccess] = useState<boolean>(false)
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false)
  const [agreementButtonClicked, setAgreementButtonClicked] = useState<boolean>(false)
  const [isCreatingKyc, setIsCreatingKyc] = useState<boolean>(false)
  const [pendingKycRequest, setPendingKycRequest] = useState<{userId: string, formData: any} | null>(null)

  // Handle Dropbox auth success first
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      
      if (urlParams.get('dropbox_auth') === 'success') {
        setDropboxAuthSuccess(true)
        
        // Check if there's an upload URL from the callback
        const uploadUrl = urlParams.get('upload_url')
        if (uploadUrl) {
          setKycLink(decodeURIComponent(uploadUrl))
        }
        
        // If there's a pending KYC request, retry it
        if (pendingKycRequest) {
          setTimeout(() => {
            createKycRequestWithData(pendingKycRequest.userId, pendingKycRequest.formData)
            setPendingKycRequest(null)
          }, 1000)
        }
      }
    }
  }, [pendingKycRequest])

  // Handle form data restoration separately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      
      // Check if we have form data in URL parameters
      const urlFormData = {
        seller_name: urlParams.get('seller_name') || '',
        email: urlParams.get('email') || '',
        ste_code: urlParams.get('ste_code') || '',
        business_name: urlParams.get('business_name') || '',
        address: urlParams.get('address') || '',
        city: urlParams.get('city') || '',
        state: urlParams.get('state') || '',
        zipcode: urlParams.get('zipcode') || '',
        country: urlParams.get('country') || '',
        store_type: urlParams.get('store_type') || '',
        comments: urlParams.get('comments') || '',
        seller_logo: urlParams.get('seller_logo') || '',
        contact_name: urlParams.get('contact_name') || '',
        primary_phone: urlParams.get('primary_phone') || '',
        walmart_address: urlParams.get('walmart_address') || ''
      }
      
      // Only restore if we have meaningful data
      const hasFormData = Object.values(urlFormData).some(value => value.trim() !== '')
      
      if (hasFormData) {
        setFormData(prev => ({
          ...prev,
          seller_name: urlFormData.seller_name || prev.seller_name,
          email: urlFormData.email || prev.email,
          ste_code: urlFormData.ste_code || prev.ste_code,
          business_name: urlFormData.business_name || prev.business_name,
          primary_phone: urlFormData.primary_phone || prev.primary_phone,
          address: urlFormData.address || prev.address,
          city: urlFormData.city || prev.city,
          state: urlFormData.state || prev.state,
          zipcode: urlFormData.zipcode || prev.zipcode,
          country: urlFormData.country || prev.country,
          store_type: urlFormData.store_type || prev.store_type,
          comments: urlFormData.comments || prev.comments,
          seller_logo: urlFormData.seller_logo || prev.seller_logo,
          contact_name: urlFormData.contact_name || prev.contact_name,
          walmart_address: urlFormData.walmart_address || prev.walmart_address
        }))
        
        // Clean up URL parameters after restoring form data
        const newUrl = new URL(window.location.href)
        newUrl.search = '' // Clear all search parameters
        window.history.replaceState({}, '', newUrl.toString())
      }
    }
  }, []) // Run only once on mount

  
  // PDF and signature states
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false)
  const [pdfGenerated, setPdfGenerated] = useState<boolean>(false)
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)
  const [submittedSellerName, setSubmittedSellerName] = useState<string>('')
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)

  // Fetch current row count to calculate STE code
  useEffect(() => {
    const fetchSteCode = async () => {
      if (supabase) {
        try {
          const { count, error } = await supabase
            .from('walmart_sellers')
            .select('*', { count: 'exact', head: true })
          
          if (error) {
            console.warn('Could not fetch row count:', error)
            setSteCode('9001') // Default to 9001 if can't fetch
          } else {
            const nextSteCode = 9000 + (count || 0) + 1
            setSteCode(nextSteCode.toString())
          }
        } catch (error) {
          console.warn('Error fetching row count:', error)
          setSteCode('9001') // Default to 9001 if error
        }
      } else {
        // Demo mode - show example calculation
        setSteCode('9001')
      }
    }

    fetchSteCode()
  }, [supabase])

  // Security: Input sanitization function - only sanitize on submit, not on every keystroke
  const sanitizeInput = (input: string): string => {
    if (typeof input !== 'string') return ''
    // Remove potentially dangerous characters and limit length
    return input
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .substring(0, 1000) // Limit length to prevent buffer overflow
      .trim() // Safe to trim now since we only call this on submission
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // Don't sanitize on every keystroke - only store the raw input
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  // Redirect to confirmation page
  const redirectToConfirmation = (sellerName: string, formData: any) => {
    // Store data in session storage for the confirmation page
    sessionStorage.setItem('submittedSellerName', sellerName)
    sessionStorage.setItem('steCode', steCode)
    sessionStorage.setItem('signatureData', JSON.stringify(signatureData))
    sessionStorage.setItem('submittedFormData', JSON.stringify(formData))
    
    // Redirect to confirmation page
    window.location.href = `/confirmation?sellerName=${encodeURIComponent(sellerName)}&steCode=${steCode}`
  }

  // Check if all required fields are filled
  const areRequiredFieldsFilled = () => {
    const requiredFields = ['seller_name', 'contact_name', 'email', 'primary_phone', 'business_name', 'address', 'city', 'state', 'zipcode', 'country', 'store_type']
    return requiredFields.every(field => {
      const value = formData[field as keyof Seller]
      return value && value.toString().trim() !== ''
    })
  }

  const createKycRequest = async () => {
    try {
      setIsCreatingKyc(true)
      
      // Generate a unique user ID for this session (in production, use actual user ID)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const requestData = {
        seller_name: formData.seller_name,
        email: formData.email,
        ste_code: steCode,
        userId,
        // Include all form data for complete restoration
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
      
      
      const r = await fetch('/api/kyc/file-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      const json = await r.json()
      
      if (!r.ok) {
        if (json.requiresAuth) {
          // User needs to authenticate with Dropbox - store the request for later
          setPendingKycRequest({ userId, formData: requestData })
          await initiateDropboxAuth(userId)
          return
        }
        console.error('Dropbox error:', json?.error)
        return
      }
      
      setKycLink(json.url)
      console.log({ step: 'kyc_file_request_created', url: json.url, destination: json.destination })
    } catch (e) {
      console.error('Failed to create KYC request', e)
    } finally {
      setIsCreatingKyc(false)
    }
  }

  const createKycRequestWithData = async (userId: string, requestData: any) => {
    try {
      setIsCreatingKyc(true)
      
      const r = await fetch('/api/kyc/file-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      const json = await r.json()
      
      if (!r.ok) {
        console.error('Dropbox error after auth:', json?.error)
        return
      }
      
      setKycLink(json.url)
    } catch (e) {
      console.error('Failed to create KYC request after auth', e)
    } finally {
      setIsCreatingKyc(false)
    }
  }

  const initiateDropboxAuth = async (userId: string) => {
    try {
      const response = await fetch('/api/dropbox/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          seller_name: formData.seller_name,
          email: formData.email,
          ste_code: steCode,
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
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to initiate Dropbox authentication')
      }
      
      const { authUrl } = await response.json()
      
      // Open Dropbox authorization in a new window
      const authWindow = window.open(authUrl, 'dropbox-auth', 'width=600,height=700,scrollbars=yes,resizable=yes')
      
      // Listen for the window to close or receive a message
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed)
          // Check if authentication was successful by trying the file request again
          setTimeout(() => {
            createKycRequest()
          }, 1000)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Failed to initiate Dropbox authentication:', error)
    }
  }

  const generatePdf = async () => {
    try {
      setIsGeneratingPdf(true)
      const body = {
        seller_name: formData.seller_name,
        business_name: formData.business_name,
        email: formData.email,
        ste_code: steCode,
        signature_data: signatureData,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        country: formData.country
      }
      const r = await fetch('/api/agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!r.ok) {
        console.error('PDF generation failed')
        return
      }
      
      const blob = await r.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `3PL-Agreement-${formData.seller_name || 'Seller'}-STE-${steCode}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log({ step: 'pdf_generated' })
    } catch (e) {
      console.error('Failed to generate PDF', e)
    } finally {
      setIsGeneratingPdf(false)
    }
  }


  const previewUnsignedPdf = async () => {
    try {
      setIsGeneratingPdf(true)
      const body = {
        seller_name: formData.seller_name,
        business_name: formData.business_name,
        email: formData.email,
        ste_code: steCode,
        signature_data: null, // No signature for preview
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        country: formData.country
      }
      
      // Generate PDF without signature
      const pdfResponse = await fetch('/api/agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!pdfResponse.ok) {
        console.error('PDF generation failed')
        return
      }
      
      // For unsigned PDF, we get a direct PDF response, not JSON
      const pdfBlob = await pdfResponse.blob()
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `3PL-Agreement-Preview-${formData.seller_name || 'Seller'}-STE-${steCode}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log({ step: 'unsigned_pdf_previewed' })
    } catch (e) {
      console.error('Failed to generate unsigned PDF preview', e)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const sendAgreementEmail = async () => {
    try {
      setIsGeneratingPdf(true)
      const body = {
        seller_name: formData.seller_name,
        business_name: formData.business_name,
        email: formData.email,
        ste_code: steCode,
        signature_data: signatureData,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        country: formData.country
      }
      
      // Generate PDF with signature
      const pdfResponse = await fetch('/api/agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!pdfResponse.ok) {
        console.error('PDF generation failed')
        return
      }
      
      const pdfData = await pdfResponse.json()
      
      // Send email with PDF
      const emailResponse = await fetch('/api/email/send-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_email: formData.email,
          seller_name: formData.seller_name,
          ste_code: steCode,
          pdf_base64: pdfData.pdf_base64,
          walmart_address: formData.seller_name ? 
            `${formData.seller_name} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619` : 
            `Seller Name - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
        })
      })
      
      if (!emailResponse.ok) {
        console.error('Email sending failed')
        return
      }
      
      console.log({ step: 'agreement_emailed' })
    } catch (e) {
      console.error('Failed to send agreement email', e)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Set loading state immediately
    setIsSubmitting(true)
    setIsRedirecting(true)
    setSubmitStatus('idle')
    setErrorMessage('')
    
    // Security: Sanitize all form data before submission
    const sanitizedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key, 
        typeof value === 'string' ? sanitizeInput(value) : value
      ])
    )
    
    // Security: Validate required fields on client side
    const requiredFields = ['seller_name', 'contact_name', 'email', 'primary_phone', 'business_name', 'address', 'city', 'state', 'zipcode', 'country', 'store_type']
    const missingFields = requiredFields.filter(field => !sanitizedFormData[field as keyof Seller] || sanitizedFormData[field as keyof Seller]?.toString().trim() === '')
    
    if (missingFields.length > 0) {
      setIsSubmitting(false)
      setIsRedirecting(false)
      setSubmitStatus('error')
      setErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    // Security: Additional validation
    if (sanitizedFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedFormData.email)) {
      setIsSubmitting(false)
      setIsRedirecting(false)
      setSubmitStatus('error')
      setErrorMessage('Please enter a valid email address')
      return
    }

    if (sanitizedFormData.seller_logo && !sanitizedFormData.seller_logo.startsWith('http')) {
      setIsSubmitting(false)
      setIsRedirecting(false)
      setSubmitStatus('error')
      setErrorMessage('Logo URL must start with http:// or https://')
      return
    }
    
    if (!supabase) {
      // Demo mode - just log the data to console
      const demoData = {
        ...sanitizedFormData,
        walmart_address: `${sanitizedFormData.seller_name} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
      }
      console.log('Form submitted (Demo Mode - Supabase not configured):', demoData)
      setSubmittedSellerName(sanitizedFormData.seller_name)
      setFormSubmitted(true)
      // Send agreement email
      await sendAgreementEmail()
      // Redirect to confirmation page
      redirectToConfirmation(sanitizedFormData.seller_name, sanitizedFormData)
      setFormData({
        seller_name: '',
        ste_code: '',
        contact_name: '',
        email: '',
        primary_phone: '',
        seller_logo: '',
        business_name: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        store_type: '',
        comments: '',
        walmart_address: ''
      })
      // Update STE code for next submission
      const currentSteCode = parseInt(steCode) || 9001
      setSteCode((currentSteCode + 1).toString())
      // Reset stepper for next run
      setCurrentStep(1)
      setKycLink('')
      setKycUploaded(false)
      setAgreementAccepted(false)
      setAgreementButtonClicked(false)
      setSignatureData(null)
      setPdfGenerated(false)
      setFormSubmitted(false)
      setSubmittedSellerName('')
      setIsSubmitting(false)
      setIsRedirecting(false)
      return
    }

    try {
      // Security: Create submission data with auto-generated Walmart address
      const submissionData = {
        ...sanitizedFormData,
        walmart_address: `${sanitizedFormData.seller_name} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
      }

      const { data, error } = await supabase
        .from('walmart_sellers')
        .insert([submissionData])
        .select()

      if (error) throw error

      setFormSubmitted(true)
      // Send agreement email
      await sendAgreementEmail()
      setSubmittedSellerName(sanitizedFormData.seller_name)
      // Redirect to confirmation page
      redirectToConfirmation(sanitizedFormData.seller_name, sanitizedFormData)
      setFormData({
        seller_name: '',
        ste_code: '',
        contact_name: '',
        email: '',
        primary_phone: '',
        seller_logo: '',
        business_name: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        store_type: '',
        comments: '',
        walmart_address: ''
      })
      
      // Update STE code for next submission
      const currentSteCode = parseInt(steCode) || 9001
      setSteCode((currentSteCode + 1).toString())
      setCurrentStep(1)
      setKycLink('')
      setKycUploaded(false)
      setAgreementAccepted(false)
      setAgreementButtonClicked(false)
      setSignatureData(null)
      setPdfGenerated(false)
      setFormSubmitted(false)
      setSubmittedSellerName('')
    } catch (error: any) {
      setSubmitStatus('error')
      setErrorMessage(error.message || 'An error occurred while submitting the form')
    } finally {
      setIsSubmitting(false)
      setIsRedirecting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img 
                src="/3plvision-logo.png" 
                alt="3PLVision Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              3PLVision Seller Onboarding
              {appEnv !== 'production' && (
                <span className="ml-2 align-middle text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  DEV
                </span>
              )}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete your seller profile to start setting up returns management on Walmart Marketplace
            </p>
          </div>

          {/* Supabase Connection Status */}
          {!supabase && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Demo Mode: Supabase is not configured. Form data will be logged to console. Set up environment variables to enable database storage.
              </span>
            </div>
          )}

          {appEnv !== 'production' && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-medium">
                Dev Mode: You are connected to the development environment.
              </span>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seller_name" className="form-label">
                      Seller Store <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="seller_name"
                      name="seller_name"
                      value={formData.seller_name}
                      onChange={handleInputChange}
                      required
                      maxLength={255}
                      className="form-input"
                      placeholder="e.g., Vikas Online"
                    />
                  </div>

                  <div>
                    <label htmlFor="ste_code" className="form-label">STE Code</label>
                    <input
                      type="text"
                      id="ste_code"
                      name="ste_code"
                      value={steCode}
                      disabled
                      className="form-input bg-gray-100 cursor-not-allowed"
                      title="STE Code is automatically generated when your record is created"
                    />
                  </div>

                  <div>
                    <label htmlFor="business_name" className="form-label">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      required
                      maxLength={255}
                      className="form-input"
                      placeholder="Your business name"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-blue-600" />
                  Contact Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact_name" className="form-label">
                      Contact Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="contact_name"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleInputChange}
                      required
                      maxLength={255}
                      className="form-input"
                      placeholder="Primary contact person"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="form-label">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      maxLength={255}
                      className="form-input"
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="primary_phone" className="form-label">
                      Primary Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="primary_phone"
                      name="primary_phone"
                      value={formData.primary_phone}
                      onChange={handleInputChange}
                      required
                      maxLength={20}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="seller_logo" className="form-label">Seller Logo URL</label>
                    <input
                      type="url"
                      id="seller_logo"
                      name="seller_logo"
                      value={formData.seller_logo}
                      onChange={handleInputChange}
                      maxLength={1000}
                      className="form-input"
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-sm text-gray-500 mt-1">Optional</p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  Address Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="form-label">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      maxLength={1000}
                      rows={3}
                      className="form-input"
                      placeholder="Street address, suite, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="form-label">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      className="form-input"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="form-label">
                      State/Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      className="form-input"
                      placeholder="State or Province"
                    />
                  </div>

                  <div>
                    <label htmlFor="zipcode" className="form-label">
                      ZIP/Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="zipcode"
                      name="zipcode"
                      value={formData.zipcode}
                      onChange={handleInputChange}
                      required
                      maxLength={20}
                      className="form-input"
                      placeholder="ZIP or Postal Code"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="form-label">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      className="form-input"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="w-6 h-6 text-blue-600" />
                  Business Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="store_type" className="form-label">
                      Store Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="store_type"
                      name="store_type"
                      value={formData.store_type}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select store type</option>
                      <option value="Online">Online</option>
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                      <option value="Manufacturer">Manufacturer</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="comments" className="form-label">Additional Comments</label>
                    <textarea
                      id="comments"
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      maxLength={1000}
                      rows={3}
                      className="form-input"
                      placeholder="Any additional information about your business"
                    />
                    <p className="text-sm text-gray-500 mt-1">Optional</p>
                  </div>
                </div>
              </div>

              {/* KYC Documents Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-blue-600" />
                  KYC Documents Required
                </h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">!</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-blue-900">
                        Important: KYC Documents Required
                      </h3>
                      <p className="text-blue-800">
                        After submitting your application, you will need to provide the following KYC (Know Your Customer) documents to complete your onboarding:
                      </p>
                      <ul className="list-disc list-inside text-blue-800 space-y-1 ml-4">
                        <li>Business License</li>
                        <li>GST Registration/Certificates</li>
                        <li>Aadhar Card of Owner/Director</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Upload Step (Dropbox) */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-blue-600" />
                  KYC Upload
                </h2>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  {dropboxAuthSuccess && !kycLink && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Successfully connected to Dropbox! You can now upload your documents directly to your Dropbox folder or click "I've uploaded my KYC docs" to proceed.
                      </p>
                    </div>
                  )}
                  {kycLink && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
                      <p className="text-green-800 text-sm font-medium">
                        🎉 Upload link created successfully! Click "Open Upload Link" to upload your documents.
                      </p>
                    </div>
                  )}
                  <div className="text-blue-900 mb-4">
                    <p className="font-semibold mb-2">📋 KYC Document Upload Instructions:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• <strong>Step 1:</strong> Click "Get KYC Upload Link" to authorize with Dropbox and generate your secure upload folder</li>
                      <li>• <strong>Step 2:</strong> Complete the Dropbox authorization in the popup window</li>
                      <li>• <strong>Step 3:</strong> Click "Open Upload Link" to access your secure Dropbox folder</li>
                      <li>• <strong>Step 4:</strong> Upload the following required documents to your folder:</li>
                      <li className="ml-4">- <strong>GST Certificate</strong> (Goods and Services Tax registration)</li>
                      <li className="ml-4">- <strong>Aadhar Card</strong> (Government-issued identity document)</li>
                      <li className="ml-4">- <strong>Passport</strong></li>
                      <li>• <strong>Step 5:</strong> Ensure all documents are clear, readable, and in PDF or image format</li>
                      <li>• <strong>Step 6:</strong> Once uploaded, return here and click "I've uploaded my KYC docs"</li>
                    </ul>
                    <p className="text-xs text-blue-700 mt-2 italic">Note: Your upload folder is secure and only accessible to you and our team.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={createKycRequest}
                      disabled={isCreatingKyc || !areRequiredFieldsFilled()}
                      className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingKyc ? 'Creating link...' : (kycLink ? 'Recreate Link' : 'Get KYC Upload Link')}
                    </button>
                    {kycLink && (
                      <a
                        href={kycLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50"
                        onClick={() => console.log({ step: 'kyc_link_opened', url: kycLink })}
                      >
                        Open Upload Link
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => { setKycUploaded(true); setCurrentStep(3); console.log({ step: 'kyc_uploaded_confirmed' }) }}
                      disabled={!kycLink && !dropboxAuthSuccess}
                      className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                        dropboxAuthSuccess && !kycLink 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {dropboxAuthSuccess && !kycLink ? 'I\'ve uploaded my KYC docs (via Dropbox)' : 'I\'ve uploaded my KYC docs'}
                    </button>
                  </div>
                  {!kycLink && (
                    <p className="text-sm text-blue-800 mt-3">
                      {areRequiredFieldsFilled() 
                        ? 'You will get a unique Dropbox link to upload Business License, GST, and Aadhar.' 
                        : 'Please fill out all required fields above to enable KYC upload link generation.'
                      }
                    </p>
                  )}
                  {kycUploaded && (
                    <p className="text-sm text-green-700 mt-3">KYC upload confirmed.</p>
                  )}
                </div>
              </div>

              {/* Agreement Acceptance Step with PDF and E-Signature */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  3PL Warehousing Agreement
                </h2>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                  <p className="text-gray-800">This agreement is between <strong>3PLVisions LLC</strong> and <strong>{formData.business_name || 'Your Business'}</strong> (Walmart seller: {formData.seller_name || 'Seller'}) with STE-{steCode || 'XXXX'}.</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Billing starts from the first day your first package arrives at our warehouse.</li>
                    <li>You will be informed when charges are initiated and must pay for warehousing services.</li>
                    <li>If payment is not received within 30 days of product arrival, the products will be disposed.</li>
                  </ul>
                  
                  {/* PDF Generation Info */}
                  <div className="border-t pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Agreement PDF</h4>
                      </div>
                      <p className="text-sm text-blue-800 mb-3">
                        A signed PDF agreement will be generated and downloaded when you accept the agreement below. The agreement will be emailed to you and minals@hotmail.com when you submit the form.
                      </p>
                      <button
                        type="button"
                        onClick={previewUnsignedPdf}
                        disabled={isGeneratingPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <FileText className="w-4 h-4" />
                        {isGeneratingPdf ? 'Generating Preview...' : 'Preview Agreement (Unsigned)'}
                      </button>
                    </div>
                  </div>

                  {/* Digital Signature */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Digital Signature</h3>
                    <SignaturePadComponent
                      onSignatureChange={setSignatureData}
                      width={400}
                      height={200}
                    />
                  </div>

                  {/* Agreement Acceptance */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={agreementAccepted}
                          onChange={(e) => {
                            setAgreementAccepted(e.target.checked)
                            if (!e.target.checked) {
                              setAgreementButtonClicked(false)
                            }
                          }}
                        />
                        <span className="text-gray-800">I agree to the terms above and have signed digitally</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { 
                          if (kycUploaded && agreementAccepted && signatureData) { 
                            // Just accept the agreement (PDF will be available on confirmation page)
                            setAgreementButtonClicked(true)
                            console.log({ step: 'agreement_accepted', signature: signatureData }); 
                            // Address will be shown only after form submission
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
                        disabled={!kycUploaded || !agreementAccepted || !signatureData}
                      >
                        Accept Agreement
                      </button>
                    </div>
                    {!signatureData && (
                      <p className="text-sm text-amber-600 mt-2">Please provide your digital signature above.</p>
                    )}
                  </div>
                </div>
              </div>


              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || isRedirecting || !(kycUploaded && agreementAccepted && agreementButtonClicked && signatureData)}
                  className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || isRedirecting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isRedirecting ? 'Redirecting to confirmation...' : 'Submitting...'}
                    </div>
                  ) : (
                    kycUploaded && agreementAccepted && agreementButtonClicked && signatureData ? 
                      (supabase ? 'Submit Application' : 'Submit (Demo Mode)') : 
                      'Complete steps to submit'
                  )}
                </button>
              </div>

              {/* Error Messages */}
              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    Error: {errorMessage}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

    </>
  )
}
