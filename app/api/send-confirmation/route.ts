import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { 
      customerEmail, 
      customerName, 
      orderId,
      deliveryDate,
      returnDate,
      deliveryAddress,
      returnAddress,
      deliveryWindow,
      returnWindow,
      items,
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      // Ship back fields (optional)
      isShipBack,
      shipBackAddress,
      shipBackCity,
      shipBackState,
      shipBackZip,
      shipBackFee
    } = await request.json()

    const formatDate = (dateStr: string) => {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }

    const formatWindow = (window: string) => {
      const windows: Record<string, string> = {
        morning: '9am - 12pm',
        afternoon: '12pm - 5pm',
        evening: '5pm - 8pm'
      }
      return windows[window] || window
    }

    const itemsList = items.map((item: any) => 
      `• ${item.quantity}x ${item.name} - $${(item.lineTotal / 100).toFixed(2)}`
    ).join('\n')

    // Build return section based on ship-back or pickup
    const returnSection = isShipBack ? `
            <div class="section">
              <div class="section-title">📦 UPS Ship Back</div>
              <div class="highlight-box">
                <strong>Return by: ${formatDate(returnDate)}</strong><br/>
                <span style="color: #666;">Drop off at any UPS location near:<br/>${shipBackAddress}, ${shipBackCity}, ${shipBackState} ${shipBackZip}</span>
                <p style="color: #0891b2; margin-top: 10px; font-size: 14px;">✓ Prepaid UPS label included with your delivery<br/>✓ Free poly bag included for shipping</p>
              </div>
            </div>
    ` : `
            <div class="section">
              <div class="section-title">🔄 Return Pickup</div>
              <div class="highlight-box">
                <strong>${formatDate(returnDate)}</strong><br/>
                ${formatWindow(returnWindow)}<br/>
                <span style="color: #666;">${returnAddress}</span>
              </div>
            </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'ooloo <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Your ooloo order is confirmed! 🧳`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0891b2; }
            .logo { height: 60px; }
            .section { padding: 20px 0; border-bottom: 1px solid #eee; }
            .section-title { font-size: 18px; font-weight: bold; color: #0891b2; margin-bottom: 10px; }
            .detail-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .label { color: #666; }
            .value { font-weight: 500; }
            .total-row { font-size: 20px; font-weight: bold; padding: 15px 0; }
            .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
            .highlight-box { background: #f0fdfa; border-radius: 8px; padding: 15px; margin: 10px 0; }
            .btn { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://ooloo.vercel.app/oolooicon.jpg" alt="ooloo" class="logo" />
              <h1 style="margin: 10px 0 0 0; color: #0891b2;">Order Confirmed!</h1>
            </div>
            
            <div class="section">
              <p>Hi ${customerName},</p>
              <p>Thanks for your order! Your luggage rental is confirmed and we'll have everything ready for delivery.</p>
              <p style="color: #666; font-size: 14px;">Order #${orderId.slice(0, 8).toUpperCase()}</p>
            </div>

            <div class="section">
              <div class="section-title">📦 Delivery</div>
              <div class="highlight-box">
                <strong>${formatDate(deliveryDate)}</strong><br/>
                ${formatWindow(deliveryWindow)}<br/>
                <span style="color: #666;">${deliveryAddress}</span>
              </div>
            </div>

            ${returnSection}

            <div class="section">
              <div class="section-title">🧳 Your Items</div>
              <pre style="font-family: inherit; white-space: pre-wrap;">${itemsList}</pre>
            </div>

            <div class="section">
              <div class="detail-row">
                <span class="label">Subtotal</span>
                <span class="value">$${(subtotal / 100).toFixed(2)}</span>
              </div>
              ${discount > 0 ? `
              <div class="detail-row" style="color: #059669;">
                <span>Discount</span>
                <span>-$${(discount / 100).toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">${isShipBack ? 'Delivery Fee' : 'Delivery & Pickup'}</span>
                <span class="value">$${(deliveryFee / 100).toFixed(2)}</span>
              </div>
              ${isShipBack && shipBackFee ? `
              <div class="detail-row">
                <span class="label">UPS Ship Back Fee</span>
                <span class="value">$${(shipBackFee / 100).toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Tax</span>
                <span class="value">$${(tax / 100).toFixed(2)}</span>
              </div>
              <div class="detail-row total-row" style="border-top: 2px solid #0891b2; margin-top: 10px; padding-top: 15px;">
                <span>Total</span>
                <span>$${(total / 100).toFixed(2)}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Manage Your Order</div>
              <p>Need to update your address or cancel your order? You can do it online:</p>
              <p style="margin: 15px 0;">
                <a href="https://ooloo.vercel.app/order" class="btn" style="color: white;">Manage Your Order</a>
              </p>
              <p style="color: #666; font-size: 14px;">Your Order ID: <strong>${orderId.slice(0, 8).toUpperCase()}</strong></p>
              <p style="color: #666; font-size: 13px; margin-top: 10px;">
                ✓ Edit delivery or return address up to 24 hours before<br/>
                ✓ Cancel for a full refund up to 48 hours before delivery
              </p>
            </div>

            <div class="section" style="background: #f0fdfa; margin: 0 -20px; padding: 20px;">
              <div class="section-title">🎁 Give $10, Get $10</div>
              <p>Share your referral code with friends:</p>
              <div style="background: white; border: 2px dashed #0891b2; border-radius: 8px; padding: 15px; text-align: center; margin: 15px 0;">
                <span style="font-size: 24px; font-weight: bold; color: #0891b2; letter-spacing: 2px;">Check your next email for your code!</span>
              </div>
              <p style="color: #666; font-size: 13px;">
                When they book, they get $10 off. When they complete their rental, you get $10 credit!
              </p>
            </div>

            <div class="section">
              <div class="section-title">Questions?</div>
              <p>Just reply to this email and we'll help you out!</p>
            </div>

            <div class="footer">
              <p>© 2025 ooloo. All rights reserved.</p>
              <p>Rent the luggage. Own the trip.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Email error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })

  } catch (error) {
    console.error('Send confirmation error:', error)
    return NextResponse.json({ error: 'Failed to send confirmation' }, { status: 500 })
  }
}