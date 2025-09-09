'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ConfirmationPage from '@/components/ConfirmationPage'

export default function Confirmation() {
  const searchParams = useSearchParams()
  const [confirmationData, setConfirmationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get data from URL parameters or session storage
    const sellerName = searchParams.get('sellerName') || sessionStorage.getItem('submittedSellerName')
    const steCode = searchParams.get('steCode') || sessionStorage.getItem('steCode')
    const signatureData = sessionStorage.getItem('signatureData')
    const formDataStr = sessionStorage.getItem('submittedFormData')
    
    if (sellerName && steCode) {
      setConfirmationData({
        sellerName,
        steCode,
        signatureData: signatureData ? JSON.parse(signatureData) : null,
        formData: formDataStr ? JSON.parse(formDataStr) : {}
      })
    }
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    )
  }

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Confirmation Data Found</h1>
          <p className="text-gray-600 mb-6">It looks like you didn't come from a form submission.</p>
          <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <ConfirmationPage
      sellerName={confirmationData.sellerName}
      steCode={confirmationData.steCode}
      signatureData={confirmationData.signatureData}
      formData={confirmationData.formData}
    />
  )
}
