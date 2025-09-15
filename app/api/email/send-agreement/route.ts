import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { seller_email, seller_name, ste_code, pdf_base64, walmart_address, kyc_documents, formData } = await req.json()

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
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 12px 0;">Dear ${formData?.contact_name || seller_name},</p>
        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 12px 0;">Thank you for completing the 3PL warehousing agreement. Please find attached your signed agreement document.</p>
        
        <h3 style="color: #2563eb; margin: 20px 0 12px 0; font-family: Arial, sans-serif; font-size: 16px;">📋 Seller Information</h3>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 0 0 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 40%;">Seller Store:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.seller_name || seller_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">STE Code:</td>
              <td style="padding: 8px 0; color: #000000;">STE-${ste_code}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Business Name:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.business_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Contact Name:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.contact_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.email || seller_email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Primary Phone:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.primary_phone || 'N/A'}</td>
            </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Address:</td>
                <td style="padding: 8px 0; color: #000000; word-wrap: break-word; max-width: 300px;">${formData?.address || 'N/A'}</td>
              </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">City:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.city || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">State/Province:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.state || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">ZIP/Postal Code:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.zipcode || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Country:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.country || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Store Type:</td>
              <td style="padding: 8px 0; color: #000000;">${formData?.store_type || 'N/A'}</td>
            </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Agreement Date:</td>
                <td style="padding: 8px 0; color: #000000;">${new Date().toLocaleDateString()}</td>
              </tr>
              ${formData?.seller_logo ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Seller Logo URL:</td>
                <td style="padding: 8px 0; color: #000000;"><a href="${formData.seller_logo}" style="color: #2563eb; text-decoration: underline;">${formData.seller_logo}</a></td>
              </tr>
              ` : ''}
              ${formData?.comments ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Additional Comments:</td>
                <td style="padding: 8px 0; color: #000000; word-wrap: break-word; max-width: 300px; white-space: pre-wrap;">${formData.comments}</td>
              </tr>
              ` : ''}
            </table>
          </div>
        
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
          <h2 style="color: #2563eb; font-family: Arial, sans-serif; font-size: 18px; margin: 0 0 16px 0;">3PL Warehousing Agreement - COPY</h2>
          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0 0 12px 0;">This is a copy of the agreement sent to ${formData?.contact_name || seller_name} (${formData?.email || seller_email})</p>
          
          <h3 style="color: #2563eb; margin: 20px 0 12px 0; font-family: Arial, sans-serif; font-size: 16px;">📋 Seller Information</h3>
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 0 0 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 40%; vertical-align: top;">Seller Store:</td>
                <td style="padding: 8px 0; color: #000000; word-wrap: break-word; max-width: 300px;">${formData?.seller_name || seller_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">STE Code:</td>
                <td style="padding: 8px 0; color: #000000;">STE-${ste_code}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Business Name:</td>
                <td style="padding: 8px 0; color: #000000; word-wrap: break-word; max-width: 300px;">${formData?.business_name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Contact Name:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.contact_name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.email || seller_email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Primary Phone:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.primary_phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Address:</td>
                <td style="padding: 8px 0; color: #000000; word-wrap: break-word; max-width: 300px;">${formData?.address || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">City:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.city || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">State/Province:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.state || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">ZIP/Postal Code:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.zipcode || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Country:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.country || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Store Type:</td>
                <td style="padding: 8px 0; color: #000000;">${formData?.store_type || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Agreement Date:</td>
                <td style="padding: 8px 0; color: #000000;">${new Date().toLocaleDateString()}</td>
              </tr>
              ${formData?.seller_logo ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">Seller Logo URL:</td>
                <td style="padding: 8px 0; color: #000000;"><a href="${formData.seller_logo}" style="color: #2563eb; text-decoration: underline;">${formData.seller_logo}</a></td>
              </tr>
              ` : ''}
              ${formData?.comments ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Additional Comments:</td>
                <td style="padding: 8px 0; color: #000000; word-wrap: break-word; max-width: 300px; white-space: pre-wrap;">${formData.comments}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <h3 style="color: #2563eb; margin: 20px 0 12px 0; font-family: Arial, sans-serif; font-size: 16px;">📦 Walmart Return Address</h3>
          <p style="margin: 0 0 8px 0; color: #000000; font-family: Arial, sans-serif; font-size: 14px;"><strong>Return address for ${seller_name}:</strong></p>
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #000000; white-space: pre-line; font-family: Arial, sans-serif;">
            ${walmart_address || `${seller_name} - WMT Returns - STE-${ste_code}\\n295 Whitehead Road\\nHamilton NJ 08619`}
          </p>
          
          
          <p style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; margin: 0;">Best regards,<br>3PLVisions LLC Team</p>
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
