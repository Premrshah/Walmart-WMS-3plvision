'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePad from 'signature_pad'

interface SignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void
  width?: number
  height?: number
}

export default function SignaturePadComponent({ 
  onSignatureChange, 
  width = 400, 
  height = 200 
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      })
      
      signaturePadRef.current = signaturePad
      
      const handleBegin = () => {
        setIsEmpty(false)
        onSignatureChange(signaturePad.toDataURL())
      }
      
      const handleEnd = () => {
        onSignatureChange(signaturePad.toDataURL())
      }
      
      signaturePad.addEventListener('beginStroke', handleBegin)
      signaturePad.addEventListener('endStroke', handleEnd)
      
      return () => {
        signaturePad.removeEventListener('beginStroke', handleBegin)
        signaturePad.removeEventListener('endStroke', handleEnd)
      }
    }
  }, [onSignatureChange])

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
      setIsEmpty(true)
      onSignatureChange(null)
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">Digital Signature</label>
        <button
          type="button"
          onClick={clearSignature}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded cursor-crosshair"
        style={{ touchAction: 'none' }}
      />
      <p className="text-xs text-gray-500 mt-1">
        Sign above with your mouse or touch device
      </p>
    </div>
  )
}
