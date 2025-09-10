import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { seller_email, seller_name, ste_code, pdf_base64, walmart_address, kyc_documents } = await req.json()

    // Create transporter (using Gmail SMTP as example - you can change this)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your preferred email service
      auth: {
        user: process.env.EMAIL_USER, // info@3plvision.com
        pass: process.env.EMAIL_PASS, // App password for Gmail
      },
    })

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdf_base64.split(',')[1], 'base64')

    // Process KYC documents for attachments
    const kycAttachments = []
    if (kyc_documents) {
      if (kyc_documents.businessLicense) {
        kycAttachments.push({
          filename: `Business-License-${seller_name}.${kyc_documents.businessLicense.name.split('.').pop()}`,
          content: Buffer.from(kyc_documents.businessLicense.data, 'base64'),
          contentType: kyc_documents.businessLicense.type,
        })
      }
      if (kyc_documents.gstRegistration) {
        kycAttachments.push({
          filename: `GST-Registration-${seller_name}.${kyc_documents.gstRegistration.name.split('.').pop()}`,
          content: Buffer.from(kyc_documents.gstRegistration.data, 'base64'),
          contentType: kyc_documents.gstRegistration.type,
        })
      }
      if (kyc_documents.aadharCard) {
        kycAttachments.push({
          filename: `Aadhar-Card-${seller_name}.${kyc_documents.aadharCard.name.split('.').pop()}`,
          content: Buffer.from(kyc_documents.aadharCard.data, 'base64'),
          contentType: kyc_documents.aadharCard.type,
        })
      }
    }

    // Email content
    const subject = `3PL Warehousing Agreement - ${seller_name} - STE-${ste_code}`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; font-size: 14px; color: #000000;">
        <h2 style="color: #2563eb; font-family: Arial, sans-serif; font-size: 18px; margin: 0 0 16px 0;">3PL Warehousing Agreement</h2>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 12px 0;">Dear ${seller_name},</p>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 12px 0;">Thank you for completing the 3PL warehousing agreement. Please find attached your signed agreement document.</p>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 8px 0;"><strong>Agreement Details:</strong></p>
        <ul style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 16px 0; padding-left: 20px;">
          <li style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 4px 0;">Seller: ${seller_name}</li>
          <li style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 4px 0;">STE Code: STE-${ste_code}</li>
          <li style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 4px 0;">Date: ${new Date().toLocaleDateString()}</li>
        </ul>
        
        <h3 style="color: #2563eb; margin: 20px 0 12px 0; font-family: Arial, sans-serif; font-size: 16px;">📦 Walmart Return Address</h3>
        <p style="margin: 0 0 8px 0; color: #000000; font-family: Arial, sans-serif; font-size: 14px;"><strong>Please use this address for all your returns at <a href="https://walmart.com" style="color: #2563eb; text-decoration: underline;">walmart.com</a>:</strong></p>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #000000; white-space: pre-line; font-family: Arial, sans-serif;">
          ${walmart_address || `${seller_name} - WMT Returns - STE-${ste_code}\\n295 Whitehead Road\\nHamilton NJ 08619`}
        </p>
        
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 12px 0;">This agreement is now in effect and covers the terms and conditions for our 3PL warehousing services.</p>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 16px 0;">If you have any questions, please contact us at <a href="mailto:info@3plvision.com" style="color: #2563eb; text-decoration: underline;">info@3plvision.com</a></p>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0;">Best regards,<br>3PLVisions LLC Team</p>
      </div>
    `

    // Send email to seller
    await transporter.sendMail({
      from: 'info@3plvision.com',
      to: seller_email,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `3PL-Agreement-${seller_name}-STE-${ste_code}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        ...kycAttachments,
      ],
    })

    // Send copy to minals@hotmail.com
    await transporter.sendMail({
      from: 'info@3plvision.com',
      to: 'minals@hotmail.com',
      subject: `[COPY] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; font-size: 14px; color: #000000;">
          <h2 style="color: #2563eb; font-family: Arial, sans-serif; font-size: 18px; margin: 0 0 16px 0;">3PL Warehousing Agreement - Copy</h2>
          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 12px 0;">This is a copy of the agreement sent to ${seller_name} (${seller_email})</p>
          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 8px 0;"><strong>Agreement Details:</strong></p>
          <ul style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 16px 0; padding-left: 20px;">
            <li style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 4px 0;">Seller: ${seller_name}</li>
            <li style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 4px 0;">Email: ${seller_email}</li>
            <li style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 4px 0;">STE Code: STE-${ste_code}</li>
            <li style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 4px 0;">Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          
          <h3 style="color: #2563eb; margin: 20px 0 12px 0; font-family: Arial, sans-serif; font-size: 16px;">📦 Walmart Return Address</h3>
          <p style="margin: 0 0 8px 0; color: #000000; font-family: Arial, sans-serif; font-size: 14px;"><strong>Return address for ${seller_name}:</strong></p>
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #000000; white-space: pre-line; font-family: Arial, sans-serif;">
            ${walmart_address || `${seller_name} - WMT Returns - STE-${ste_code}\\n295 Whitehead Road\\nHamilton NJ 08619`}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `3PL-Agreement-${seller_name}-STE-${ste_code}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        ...kycAttachments,
      ],
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Agreement sent successfully to both seller and minals@hotmail.com' 
    })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send email' 
    }, { status: 500 })
  }
}
