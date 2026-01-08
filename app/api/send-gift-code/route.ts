import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { 
      recipientName, 
      recipientEmail, 
      code, 
      discountType, 
      discountValue, 
      message,
      expiresAt 
    } = await request.json()

    if (!recipientName || !recipientEmail || !code || !discountValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const discountText = discountType === 'percent' 
      ? `${discountValue}% off` 
      : `$${discountValue} off`

    const expiresDate = new Date(expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You've received a gift from ooloo!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎁 You've Got a Gift!</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="font-size: 18px; color: #374151; margin: 0 0 20px 0;">
                  Hi ${recipientName},
                </p>
                
                <p style="font-size: 16px; color: #6b7280; margin: 0 0 30px 0; line-height: 1.6;">
                  Someone at ooloo thinks you're pretty great! Here's a special discount code just for you:
                </p>
                
                <!-- Code Box -->
                <div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 100%); border: 2px dashed #06b6d4; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                  <p style="font-size: 14px; color: #0891b2; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive Code</p>
                  <p style="font-size: 32px; font-weight: bold; color: #0891b2; margin: 0 0 10px 0; font-family: monospace; letter-spacing: 2px;">${code}</p>
                  <p style="font-size: 24px; font-weight: bold; color: #374151; margin: 0;">${discountText}</p>
                </div>
                
                ${message ? `
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 0 0 30px 0; border-radius: 0 8px 8px 0;">
                  <p style="font-size: 14px; color: #92400e; margin: 0; font-style: italic;">"${message}"</p>
                </div>
                ` : ''}
                
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 30px 0;">
                  This code is single-use and expires on <strong>${expiresDate}</strong>.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://ooloo.vercel.app/book" style="display: inline-block; background: #06b6d4; color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px;">
                    Book Your Luggage
                  </a>
                </div>
                
                <!-- What is ooloo -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0; font-weight: bold;">What is ooloo?</p>
                  <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.6;">
                    Premium luggage rental, delivered to your door before your trip and picked up when you return. No storage, no hassle. Travel lighter!
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  ooloo • Rent the luggage. Own the trip.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: 'ooloo <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `🎁 ${recipientName}, you've received ${discountText} from ooloo!`,
      html: emailHtml
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Send gift code error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}