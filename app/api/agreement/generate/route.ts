import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(req: Request) {
  try {
    const { seller_name, business_name, email, ste_code, signature_data, address, city, state, zipcode, country } = await req.json()
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const { width, height } = { width: 595, height: 842 } // A4 size
    
    // Add fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Agreement content
    const content = [
      '',
      `This 3PL Warehousing and Fulfillment Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()}, by and between`,
      `3PLVision LLC, a New Jersey limited liability company, with its principal office at 299 Whithead Road,`,
      `Hamilton, NJ 08619, USA ("3PLVision"), and ${business_name || 'Your Business'} ("Client").`,
      '',
      'CLIENT INFORMATION:',
      `Online Store: ${seller_name || ''}`,
      `Address: ${signature_data ? `${address || ''}, ${city || ''}, ${state || ''}, ${zipcode || ''}, ${country || ''}` : ''}`,

      '',
      '1. SERVICES',
      '3PLVision agrees to provide warehousing, storage, order fulfillment, pick-and-pack, inventory',
      'management, shipping, returns management, and related third-party logistics services (the "Services")',
      'for Client\'s products (the "Products") at 3PLVision\'s designated facilities.',
      '',
      '2. TERM AND TERMINATION',
      'Initial Term: This Agreement shall commence on the Effective Date and continue for a period of 12',
      'months unless earlier terminated.',
      'Auto-Renewal: The Agreement will automatically renew for successive one-year terms unless either',
      'party provides 30 days\' written notice prior to expiration.',
      'Termination for Convenience: Either party may terminate with 30 days\' written notice.',
      'Termination for Cause: Immediate termination is allowed if either party materially breaches and fails',
      'to cure within 15 days of written notice.',
      '',
      '3. FEES, PAYMENT, AND WALLET',
      'Storage Fees, Fulfillment Fees, and Returns Fees: As agreed to in writing between Client and',
      '3PLVision in the Seller\'s Agreed Rate Card at the time of onboarding, and as may be updated',
      'with mutual consent.',
      'Shipping Costs: Client shall pay all carrier charges, including surcharges, fuel charges, and re-bills.',
      'Wallet Requirement: Client must maintain a positive balance in their 3PLVision Wallet at all times.',
      'Services will immediately stop if the Wallet balance is insufficient or negative.',
      'Payment Terms: All invoices are due Net 0 (immediately upon receipt) via ACH, credit card, or',
      'automatic wallet deduction. No credit terms are extended under any circumstances.',
      'Non-Payment Consequences: If payment is not received or the Wallet remains negative for more',
      'than 5 calendar days, 3PLVision has the right, at its sole discretion, to permanently suspend',
      'services, close the Client\'s account, and liquidate, dispose of, or destroy all Client goods in',
      'its possession without any notification to the Client.',
      'Late Fees: Any unpaid balance may accrue 1.5% per month or the maximum allowed by law until cleared.',
      'Adjustments: 3PLVision reserves the right to propose adjustments to the Seller\'s Agreed Rate Card',
      'with 30 days\' notice.',
      '',
      '4. INVENTORY AND OWNERSHIP',
      'Title: Title and ownership of Products remains with Client at all times.',
      'Risk of Loss: Risk of loss transfers to 3PLVision only while Products are in its possession.',
      'Risk transfers back to Client upon carrier pick-up.',
      'Inventory Records: 3PLVision will maintain electronic inventory records. Client may audit with',
      'reasonable notice.',
      'Shrinkage Allowance: 3PLVision is not liable for inventory shrinkage within 0.5% of total units',
      'handled annually, consistent with industry standards.',
      '',
      '5. SHIPPING AND FULFILLMENT',
      'Carrier Selection: 3PLVision may use UPS, FedEx, USPS, DHL, or other carriers. Client may provide',
      'shipping accounts if requested.',
      'Service Levels: Orders received by 10:00 AM EST ship same day; others ship next business day.',
      'Packaging: 3PLVision will use standard packaging unless Client provides branded packaging.',
      'Additional charges may apply.',
      'Backorders/Out of Stock: Client is responsible for monitoring inventory levels to avoid backorders.',
      'Returns Management: 3PLVision will process customer returns on Client\'s behalf, including',
      'receiving, inspection, restocking, or disposal, per Client instructions, and fees as outlined in',
      'the Seller\'s Agreed Rate Card.',
      '',
      '6. INSURANCE',
      '3PL Insurance: 3PLVision shall maintain general liability and warehouseman\'s legal liability insurance.',
      'Client Insurance: Client is responsible for insuring the Products against theft, fire, flood, and other',
      'risks while in 3PLVision\'s possession.',
      'Liability Cap: 3PLVision\'s maximum liability is the lesser of (a) replacement cost of lost/damaged',
      'goods, or (b) $0.50 per pound of goods, not to exceed $400 per occurrence.',
      '',
      '7. REPRESENTATIONS AND COMPLIANCE',
      'Client Warranties: Client represents that Products:',
      '• Are properly marked, labeled, and packaged.',
      '• Do not contain hazardous, illegal, or restricted materials.',
      '• Comply with all applicable laws, including FDA, DOT, and international regulations.',
      'Restricted Products: No perishables, hazardous goods, controlled substances, or items',
      'prohibited by carriers.',
      '',
      '8. INDEMNIFICATION',
      'Client Indemnity: Client agrees to indemnify and hold harmless 3PLVision from claims related',
      'to the Products, including product liability, IP infringement, or regulatory violations.',
      '3PLVision Indemnity: 3PLVision will indemnify Client for damages caused by its gross',
      'negligence or willful misconduct.',
      '',
      '9. CONFIDENTIALITY',
      'Each party agrees to maintain the confidentiality of the other\'s non-public information,',
      'including product, pricing, and business data, for the duration of the Agreement and 2 years',
      'thereafter.',
      '',
      '10. MISCELLANEOUS',
      'Independent Contractors: The relationship between Client and 3PLVision is that of',
      'independent contractors.',
      'Force Majeure: Neither party shall be liable for delays or failures due to causes beyond their',
      'reasonable control.',
      'Assignment: Neither party may assign this Agreement without prior written consent.',
      'Entire Agreement: This Agreement constitutes the full agreement between the parties and',
      'supersedes all prior discussions.',
      'Amendments: Must be in writing and signed by both parties.',
      '',
      '11. GOVERNING LAW AND JURISDICTION',
      'This Agreement shall be governed by and construed in accordance with the laws of the State',
      'of New York, without regard to its conflict of law principles.',
      'Both parties irrevocably agree and submit to the exclusive jurisdiction of the state and federal',
      'courts located in the State of New York for any dispute, claim, or proceeding arising out of or',
      'relating to this Agreement.',
      'The proper venue for all disputes shall be the courts of New York County, New York.',
      'Both parties waive any objection to jurisdiction, venue, or forum non convenience with',
      'respect to such courts.',
      '',
      'IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.'
    ]
    
    // Multi-page content rendering
    let currentPage = pdfDoc.addPage([width, height])
    let yPosition = height - 50
    let pageNumber = 1
    
    // Function to handle signature image replacement
    const handleSignaturePlaceholder = async (line: string, page: any, yPos: number) => {
      // Handle signature placeholder
      if (line.includes('[SIGNATURE_IMAGE_PLACEHOLDER]')) {
          if (signature_data) {
            // Signed version - show actual 3PLVISION LLC signature image
            try {
              // Load 3PLVISION LLC signature from file
              const fs = require('fs')
              const path = require('path')
              const signaturePath = path.join(process.cwd(), 'public', '3plvision-signature.png')
              const signatureBuffer = fs.readFileSync(signaturePath)
              const signatureImage = await pdfDoc.embedPng(signatureBuffer)
              
              // Draw signature image only (3PLVISION LLC info will be handled in main signature section)
              const signatureWidth = 150
              const signatureHeight = 60
              const signatureX = 300  // Position on the right side for 3PLVISION LLC
              const signatureY = yPos  // Position below the information
              
              page.drawImage(signatureImage, {
                x: signatureX,
                y: signatureY,
                width: signatureWidth,
                height: signatureHeight,
              })
              
              // Draw "Signature:" label
              page.drawText('Signature:', {
                x: 300,  // Align with signature image
                y: yPos - 20,  // Position above signature
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
              })
              
              // Add date
              page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
                x: 300,
                y: yPos - 40,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
              })
              
              return true // Indicate we handled this line
            } catch (error) {
              console.error('Error embedding signature in placeholder:', error)
              // Fallback to signature line
              page.drawText('Signature: ______________________', {
                x: 300,
                y: yPos,
                size: 10,
                font: font,
                color: rgb(0, 0, 0),
              })
              return true
            }
          } else {
            // Unsigned version - show signature line
            page.drawText('Signature: ______________________', {
              x: 300,
              y: yPos,
              size: 10,
              font: font,
              color: rgb(0, 0, 0),
            })
            return true
          }
      }
      return false // Not a signature placeholder
    }
    
    const addPageHeader = (page: any, pageNum: number) => {
      page.drawText('3PL WAREHOUSING AND FULFILLMENT AGREEMENT', {
        x: 50,
        y: height - 30,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      page.drawText(`Page ${pageNum}`, {
        x: width - 100,
        y: height - 30,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
    
    // Add header to first page
    addPageHeader(currentPage, pageNumber)
    yPosition = height - 80
    
    for (const line of content) {
      if (line.trim()) {
        // Check if we need a new page
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([width, height])
          pageNumber++
          addPageHeader(currentPage, pageNumber)
          yPosition = height - 80
        }
        
        // Draw the line normally
        // Determine font size and style
        const fontSize = line.match(/^\d+\.|^[A-Z\s]+$/) ? 11 : 10
        const isBold = line.match(/^\d+\.|^[A-Z\s]+$/) || line.includes('3PL WAREHOUSING') || line.includes('IN WITNESS')
        
        currentPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font: isBold ? boldFont : font,
          color: rgb(0, 0, 0),
        })
      }
      yPosition -= 18 // Line spacing
    }

    // Add signature on a new page (page 4)
    if (signature_data) {
      try {
        // Always create a new page for signatures to ensure proper spacing
        currentPage = pdfDoc.addPage([width, height])
        pageNumber++
        addPageHeader(currentPage, pageNumber)
        yPosition = height - 80
        
        // Convert base64 signature to image
        const signatureImage = await pdfDoc.embedPng(signature_data)
        
        // Draw client signature
        const signatureWidth = 200
        const signatureHeight = 80
        const clientSignatureX = 50
        const clientSignatureY = Math.max(100, yPosition - 100)
        
        // Add client information - properly aligned vertically
        currentPage.drawText('CLIENT', {
          x: clientSignatureX,
          y: clientSignatureY + 120,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        })
        
        currentPage.drawText(`Name: ${seller_name || 'N/A'}`, {
          x: clientSignatureX,
          y: clientSignatureY + 100,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        
        currentPage.drawText(`Title: Business Owner`, {
          x: clientSignatureX,
          y: clientSignatureY + 80,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        
        // Draw client signature image (from form)
        currentPage.drawImage(signatureImage, {
          x: clientSignatureX,
          y: clientSignatureY - 20,
          width: signatureWidth,
          height: signatureHeight,
        })
        
        // Add signature label
        currentPage.drawText('Signature:', {
          x: clientSignatureX,
          y: clientSignatureY - 40,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        
        // Add date
        const currentDate = new Date().toLocaleDateString()
        currentPage.drawText(`Date: ${currentDate}`, {
          x: clientSignatureX,
          y: clientSignatureY - 60,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })

        // Add 3PLVISION LLC signature section
        const visionSignatureX = 300
        const visionSignatureY = clientSignatureY
        
        // Add 3PLVISION LLC information - properly aligned vertically
        currentPage.drawText('3PLVISION LLC (NJ)', {
          x: visionSignatureX,
          y: visionSignatureY + 120,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        })
        
        currentPage.drawText('Name: Minal Shah', {
          x: visionSignatureX,
          y: visionSignatureY + 100,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        
        currentPage.drawText('Title: CEO', {
          x: visionSignatureX,
          y: visionSignatureY + 80,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        
        // Load and draw 3PLVISION LLC signature (from file)
        const fs = require('fs')
        const path = require('path')
        const signaturePath = path.join(process.cwd(), 'public', '3plvision-signature.png')
        const signatureBuffer = fs.readFileSync(signaturePath)
        const visionSignatureImage = await pdfDoc.embedPng(signatureBuffer)
        
        currentPage.drawImage(visionSignatureImage, {
          x: visionSignatureX,
          y: visionSignatureY - 20,
          width: 150,
          height: 60,
        })
        
        // Add 3PLVISION LLC signature label
        currentPage.drawText('Signature:', {
          x: visionSignatureX,
          y: visionSignatureY - 40,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
        
        // Add date for 3PLVISION LLC
        currentPage.drawText(`Date: ${currentDate}`, {
          x: visionSignatureX,
          y: visionSignatureY - 60,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        })
      } catch (error) {
        console.error('Error embedding signature:', error)
        // Continue without signature if there's an error
      }
    } else {
      // Add signature sections for unsigned version (preview)
      // Always create a new page for signatures to ensure proper spacing
      currentPage = pdfDoc.addPage([width, height])
      pageNumber++
      addPageHeader(currentPage, pageNumber)
      yPosition = height - 80
      
      // Add client signature section (unsigned)
      const clientSignatureX = 50
      const clientSignatureY = yPosition - 100
      
      // Add client information - properly aligned vertically
      currentPage.drawText('CLIENT', {
        x: clientSignatureX,
        y: clientSignatureY + 120,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      
      currentPage.drawText(`Name: ${seller_name || 'N/A'}`, {
        x: clientSignatureX,
        y: clientSignatureY + 100,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
      
      currentPage.drawText(`Title: Business Owner`, {
        x: clientSignatureX,
        y: clientSignatureY + 80,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
      
      // Add blank signature line
      currentPage.drawText('Signature: ______________________', {
        x: clientSignatureX,
        y: clientSignatureY - 20,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
      
      // Add date
      const currentDate = new Date().toLocaleDateString()
      currentPage.drawText(`Date: ${currentDate}`, {
        x: clientSignatureX,
        y: clientSignatureY - 40,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })

      // Add 3PLVISION LLC signature section (unsigned)
      const visionSignatureX = 300
      const visionSignatureY = clientSignatureY
      
      // Add 3PLVISION LLC information - properly aligned vertically
      currentPage.drawText('3PLVISION LLC (NJ)', {
        x: visionSignatureX,
        y: visionSignatureY + 120,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
      
      currentPage.drawText('Name: Minal Shah', {
        x: visionSignatureX,
        y: visionSignatureY + 100,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
      
      currentPage.drawText('Title: CEO', {
        x: visionSignatureX,
        y: visionSignatureY + 80,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
      
      // Add blank signature line
      currentPage.drawText('Signature: ______________________', {
        x: visionSignatureX,
        y: visionSignatureY - 20,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
      
      // Add date for 3PLVISION LLC
      currentPage.drawText(`Date: ${currentDate}`, {
        x: visionSignatureX,
        y: visionSignatureY - 40,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save()
    
    // If signature_data is provided, return base64 for email sending
    if (signature_data) {
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64')
      return NextResponse.json({
        pdf_base64: `data:application/pdf;base64,${pdfBase64}`,
        filename: `3PL-Agreement-${seller_name || 'Seller'}-STE-${ste_code || 'XXXX'}.pdf`
      })
    }
    
    // Otherwise, return PDF for direct download
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="3PL-Agreement-${seller_name || 'Seller'}-STE-${ste_code || 'XXXX'}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 })
  }
}
