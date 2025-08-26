'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Seller } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Upload, Building2, User, Mail, Phone, MapPin, Store, FileText, Database, Copy } from 'lucide-react'

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
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

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

  // Security: Input sanitization function
  const sanitizeInput = (input: string): string => {
    if (typeof input !== 'string') return ''
    // Remove potentially dangerous characters and limit length
    return input
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .substring(0, 1000) // Limit length to prevent buffer overflow
      .trim()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // Security: Sanitize input before setting state
    const sanitizedValue = sanitizeInput(value)
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }))
  }

  // Copy Walmart return address to clipboard
  const copyWalmartAddress = async () => {
    const walmartAddress = formData.seller_name ? 
      `${formData.seller_name} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619` :
      `Seller Name - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
    
    try {
      await navigator.clipboard.writeText(walmartAddress)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = walmartAddress
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Security: Validate required fields on client side
    const requiredFields = ['seller_name', 'contact_name', 'email', 'primary_phone', 'business_name', 'address', 'city', 'state', 'zipcode', 'country', 'store_type']
    const missingFields = requiredFields.filter(field => !formData[field as keyof Seller] || formData[field as keyof Seller]?.toString().trim() === '')
    
    if (missingFields.length > 0) {
      setSubmitStatus('error')
      setErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    // Security: Additional validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setSubmitStatus('error')
      setErrorMessage('Please enter a valid email address')
      return
    }

    if (formData.seller_logo && !formData.seller_logo.startsWith('http')) {
      setSubmitStatus('error')
      setErrorMessage('Logo URL must start with http:// or https://')
      return
    }
    
    if (!supabase) {
      // Demo mode - just log the data to console
      const demoData = {
        ...formData,
        walmart_address: `${formData.seller_name} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
      }
      console.log('Form submitted (Demo Mode - Supabase not configured):', demoData)
      setShowSuccessModal(true)
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
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Security: Create submission data with auto-generated Walmart address
      const submissionData = {
        ...formData,
        walmart_address: `${formData.seller_name} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
      }

      const { data, error } = await supabase
        .from('walmart_sellers')
        .insert([submissionData])
        .select()

      if (error) throw error

      setShowSuccessModal(true)
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
    } catch (error: any) {
      setSubmitStatus('error')
      setErrorMessage(error.message || 'An error occurred while submitting the form')
    } finally {
      setIsSubmitting(false)
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
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete your seller profile to start selling on Walmart Marketplace
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

              {/* Walmart Address Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Walmart Return Address
                </h2>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="walmart_address" className="form-label mb-0">
                      Walmart Return Address
                    </label>
                    <button
                      type="button"
                      onClick={copyWalmartAddress}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors duration-200"
                    >
                      <Copy className="w-4 h-4" />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    id="walmart_address"
                    name="walmart_address"
                    value={formData.seller_name ? 
                      `${formData.seller_name} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619` : 
                      `Seller Name - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
                    }
                    disabled
                    rows={4}
                    className="form-input bg-gray-100 cursor-not-allowed"
                    title="Walmart return address is automatically generated based on your STE code and seller store name"
                  />
                  <p className="text-sm text-gray-500 mt-1">Please use this address for all your returns at walmart.com</p>
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
                        <li>Tax Identification Number (EIN/SSN)</li>
                        <li>Articles of Incorporation (if applicable)</li>
                        <li>Bank Account Information</li>
                        <li>Proof of Address</li>
                        <li>Government-issued ID for authorized signers</li>
                      </ul>
                      <div className="bg-white border border-blue-300 rounded-md p-4 mt-4">
                        <p className="text-blue-900 font-medium mb-2">
                          📧 Send all KYC documents to:
                        </p>
                        <p className="text-blue-800 text-lg font-semibold">
                          info@3plvision.com
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          Please include your seller store name and STE code in the subject line
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : supabase ? 'Submit Application' : 'Submit (Demo Mode)'}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Application submitted successfully!
            </h3>
            
            <div className="text-left space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🎉 Next Steps:
                </h4>
                <ol className="list-decimal list-inside text-blue-800 space-y-2 ml-4">
                  <li>Your application has been received and assigned STE Code: <span className="font-mono font-semibold">STE-{steCode}</span></li>
                  <li>Our team will review your application within 24-48 hours</li>
                  <li>You will receive a confirmation email with further instructions</li>
                </ol>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">
                  ⚠️ Important: KYC Documents Required
                </h4>
                <p className="text-amber-800 mb-3">
                  To complete your onboarding, please email the following documents to:
                </p>
                <div className="bg-white border border-amber-300 rounded-md p-3 mb-3">
                  <p className="text-amber-900 font-semibold text-lg">
                    📧 info@3plvision.com
                  </p>
                </div>
                <p className="text-amber-800 text-sm">
                  <strong>Subject line:</strong> KYC Documents - {formData.seller_name || 'Seller'} - STE-{steCode}
                </p>
                <p className="text-amber-800 text-sm mt-2">
                  <strong>Required documents:</strong> Business License, EIN, Articles of Incorporation, Bank Info, Proof of Address, Government ID
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="btn-primary w-full"
            >
              Got it! I'll send my KYC documents
            </button>
          </div>
        </div>
      )}
    </>
  )
}
