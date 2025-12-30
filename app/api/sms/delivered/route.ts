import { NextRequest, NextResponse } from 'next/server'
import { sendDeliveredNotification } from '../../../../lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json()

    if (!phone || !name) {
      return NextResponse.json({ error: 'Missing phone or name' }, { status: 400 })
    }

    const result = await sendDeliveredNotification(phone, name)

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Delivered SMS error:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}