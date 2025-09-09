import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(req: NextRequest) {
  try {
    const { 
      seller_name, 
      email, 
      phone, 
      business_name, 
      gst_number, 
      address, 
      ste_code,
      signature_data 
    } = await req.json()

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    const { width, height } = page.getSize()

    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Colors
    const black = rgb(0, 0, 0)
    const darkBlue = rgb(0.1, 0.3, 0.6)
    const lightGray = rgb(0.9, 0.9, 0.9)

    // Header
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: darkBlue,
    })

    page.drawText('3PL Vision - Service Agreement', {
      x: 50,
      y: height - 45,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1),
    })

    page.drawText('Walmart Marketplace Integration Services', {
      x: 50,
      y: height - 70,
      size: 12,
      font: font,
      color: rgb(1, 1, 1),
    })

    // Content starts below header
    let currentY = height - 120

    // Agreement Title
    page.drawText('SERVICE AGREEMENT', {
      x: 50,
      y: currentY,
      size: 18,
      font: boldFont,
      color: black,
    })
    currentY -= 30

    // Date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    page.drawText(`Date: ${currentDate}`, {
      x: 50,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 40

    // Parties Section
    page.drawText('PARTIES', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
      color: darkBlue,
    })
    currentY -= 25

    page.drawText('Service Provider:', {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
      color: black,
    })
    currentY -= 20

    page.drawText('3PL Vision', {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText('Email: info@3plvision.com', {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText('Phone: +1 (555) 123-4567', {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 30

    page.drawText('Client:', {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
      color: black,
    })
    currentY -= 20

    page.drawText(`Business Name: ${business_name || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText(`Contact Person: ${seller_name || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText(`Email: ${email || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText(`Phone: ${phone || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText(`GST Number: ${gst_number || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText(`STE Code: ${ste_code || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText(`Address: ${address || 'N/A'}`, {
      x: 70,
      y: currentY,
      size: 12,
      font: font,
      color: black,
    })
    currentY -= 40

    // Services Section
    page.drawText('SERVICES', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
      color: darkBlue,
    })
    currentY -= 25

    const services = [
      'Walmart Marketplace account setup and configuration',
      'Product catalog management and optimization',
      'Order processing and fulfillment coordination',
      'Inventory management and tracking',
      'Customer service and support',
      'Performance monitoring and reporting',
      'Compliance with Walmart marketplace policies'
    ]

    services.forEach(service => {
      page.drawText(`• ${service}`, {
        x: 70,
        y: currentY,
        size: 11,
        font: font,
        color: black,
      })
      currentY -= 18
    })

    currentY -= 20

    // Terms Section
    page.drawText('TERMS AND CONDITIONS', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
      color: darkBlue,
    })
    currentY -= 25

    const terms = [
      'This agreement shall commence on the date of execution and continue for a period of 12 months.',
      'Either party may terminate this agreement with 30 days written notice.',
      'The client agrees to provide accurate and complete information for service delivery.',
      '3PL Vision will maintain confidentiality of all client data and business information.',
      'Payment terms: Monthly billing with net 30 days payment terms.',
      'The client is responsible for compliance with all applicable laws and regulations.',
      'This agreement is governed by the laws of the State of Delaware, United States.'
    ]

    terms.forEach(term => {
      const words = term.split(' ')
      let line = ''
      let lineY = currentY
      
      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word
        const textWidth = font.widthOfTextAtSize(testLine, 11)
        
        if (textWidth > width - 140) {
          if (line) {
            page.drawText(line, {
              x: 70,
              y: lineY,
              size: 11,
              font: font,
              color: black,
            })
            lineY -= 15
            line = word
          }
        } else {
          line = testLine
        }
      })
      
      if (line) {
        page.drawText(line, {
          x: 70,
          y: lineY,
          size: 11,
          font: font,
          color: black,
        })
        lineY -= 15
      }
      
      currentY = lineY - 5
    })

    currentY -= 20

    // Signature Section
    page.drawText('SIGNATURES', {
      x: 50,
      y: currentY,
      size: 14,
      font: boldFont,
      color: darkBlue,
    })
    currentY -= 30

    // Service Provider Signature
    page.drawText('Service Provider (3PL Vision):', {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
      color: black,
    })
    currentY -= 20

    page.drawText('Authorized Signature', {
      x: 70,
      y: currentY,
      size: 11,
      font: font,
      color: black,
    })
    currentY -= 15

    page.drawText('Date: _______________', {
      x: 70,
      y: currentY,
      size: 11,
      font: font,
      color: black,
    })
    currentY -= 30

    // Client Signature
    page.drawText('Client:', {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
      color: black,
    })
    currentY -= 20

    if (signature_data) {
      try {
        // Convert base64 signature to image
        const signatureImage = await pdfDoc.embedPng(signature_data)
        const signatureWidth = 150
        const signatureHeight = 50
        
        page.drawImage(signatureImage, {
          x: 70,
          y: currentY - signatureHeight,
          width: signatureWidth,
          height: signatureHeight,
        })
        
        currentY -= signatureHeight + 10
      } catch (error) {
        console.error('Error embedding signature:', error)
        page.drawText('Digital Signature Applied', {
          x: 70,
          y: currentY,
          size: 11,
          font: font,
          color: black,
        })
        currentY -= 20
      }
    } else {
      page.drawText('Signature: _______________', {
        x: 70,
        y: currentY,
        size: 11,
        font: font,
        color: black,
      })
      currentY -= 15
    }

    page.drawText('Date: _______________', {
      x: 70,
      y: currentY,
      size: 11,
      font: font,
      color: black,
    })

    // Footer
    const footerY = 50
    page.drawLine({
      start: { x: 50, y: footerY + 20 },
      end: { x: width - 50, y: footerY + 20 },
      thickness: 1,
      color: lightGray,
    })

    page.drawText('This document is electronically generated and legally binding.', {
      x: 50,
      y: footerY,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()

    // If signature data is provided, return base64 for frontend display
    if (signature_data) {
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64')
      return NextResponse.json({
        pdf_base64: `data:application/pdf;base64,${pdfBase64}`,
        filename: `3PL-Agreement-${seller_name || 'Seller'}-STE-${ste_code || 'XXXX'}.pdf`
      })
    }
    
    // Otherwise, return PDF for direct download - convert Uint8Array to Buffer
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="3PL-Agreement-${seller_name || 'Seller'}-STE-${ste_code || 'XXXX'}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 })
  }
}