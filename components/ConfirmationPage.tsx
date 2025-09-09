'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, FileText, Copy, Download, ArrowLeft } from 'lucide-react'

export default function ConfirmationPage() {
  const router = useRouter()
  const [copySuccess, setCopySuccess] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [sellerName, setSellerName] = useState<string>('')
  const [steCode, setSteCode] = useState<string>('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from session storage on component mount
  useEffect(() => {
    try {
      const storedSellerName = sessionStorage.getItem('submittedSellerName')
      const storedSteCode = sessionStorage.getItem('steCode')
      const storedSignatureData = sessionStorage.getItem('signatureData')
      const storedFormData = sessionStorage.getItem('submittedFormData')

      console.log('Session data check:', {
        sellerName: storedSellerName,
        steCode: storedSteCode,
        hasSignatureData: !!storedSignatureData,
        hasFormData: !!storedFormData
      })

      if (storedSellerName && storedSteCode && storedFormData) {
        setSellerName(storedSellerName)
        setSteCode(storedSteCode)
        setSignatureData(storedSignatureData ? JSON.parse(storedSignatureData) : null)
        setFormData(JSON.parse(storedFormData))
        setIsLoading(false)
      } else {
        console.log('Missing session data, redirecting to home')
        // If no session data, redirect back to home after a short delay
        setTimeout(() => {
          router.push('/')
        }, 1000)
        return
      }
    } catch (error) {
      console.error('Error loading session data:', error)
      router.push('/')
      return
    }
  }, [router])

  // Cleanup session storage when user navigates away
  const handleBackToHome = () => {
    // Clear session storage before navigating
    sessionStorage.removeItem('submittedSellerName')
    sessionStorage.removeItem('steCode')
    sessionStorage.removeItem('signatureData')
    sessionStorage.removeItem('submittedFormData')
    router.push('/')
  }

  // Show loading state while checking session data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    )
  }

  // Copy Walmart return address to clipboard
  const copyWalmartAddress = async () => {
    const walmartAddress = sellerName ? 
      `${sellerName} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619` :
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

  // Download PDF agreement
  const downloadPdfAgreement = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/agreement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: signatureData,
          seller_name: sellerName,
          business_name: formData.business_name,
          email: formData.email,
          ste_code: steCode,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipcode: formData.zipcode,
          country: formData.country
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Handle the response based on content type
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        // JSON response with base64 PDF
        const pdfData = await response.json()
        // Convert base64 to blob
        const base64Data = pdfData.pdf_base64.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const pdfBlob = new Blob([byteArray], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = pdfData.filename || `3PL-Agreement-${sellerName || 'Seller'}-STE-${steCode}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Direct PDF blob response
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `3PL-Agreement-${sellerName || 'Seller'}-STE-${steCode}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>
          <p className="text-xl text-gray-600">
            Your Walmart order returns application has been processed!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Walmart Return Address Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              Walmart Return Address
            </h2>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="walmart_address" className="block text-sm font-medium text-gray-700">
                  Your Walmart Return Address
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
                value={sellerName ? 
                  `${sellerName} - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619` : 
                  `Seller Name - WMT Returns - STE-${steCode}\n295 Whitehead Road\nHamilton NJ 08619`
                }
                disabled
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-sm whitespace-pre-wrap"
                title="Walmart return address is automatically generated based on your STE code and seller store name"
              />
              <p className="text-sm text-gray-500 mt-2">
                Please use this address for all your returns at walmart.com
              </p>
            </div>
          </div>

          {/* Download Agreement Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-green-600" />
              Download Agreement
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Download your signed 3PL Warehousing Agreement for your records.
              </p>
              <button
                onClick={downloadPdfAgreement}
                disabled={isDownloading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors duration-200 w-full justify-center"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Signed Agreement PDF
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500">
                The PDF includes your digital signature and all agreement terms.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Start selling</h4>
              <p className="text-sm text-gray-600">
                Begin listing your products on Walmart Marketplace
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Use Return Address</h4>
              <p className="text-sm text-gray-600">
                Use the provided address for all customer returns
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Keep Records</h4>
              <p className="text-sm text-gray-600">
                Save your agreement PDF for your business records
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
