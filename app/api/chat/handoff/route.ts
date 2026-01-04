import { NextRequest } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { customerEmail, customerName, transcript, botName } = await request.json();

    if (!transcript || transcript.length === 0) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    // Format the transcript for email
    const formattedTranscript = transcript
      .map((msg: { role: string; content: string }) => 
        `${msg.role === 'user' ? '👤 Customer' : `🤖 ${botName || 'Bot'}`}:\n${msg.content}`
      )
      .join('\n\n---\n\n');

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #06b6d4, #14b8a6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🙋 Human Handoff Request</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #334155;">Customer Details</h2>
            <p><strong>Name:</strong> ${customerName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
            <p><strong>Bot:</strong> ${botName || 'Unknown'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h2 style="margin-top: 0; color: #334155;">Chat Transcript</h2>
            <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #475569;">
${formattedTranscript}
            </div>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            ${customerEmail ? `<a href="mailto:${customerEmail}" style="display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 500;">Reply to Customer</a>` : ''}
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p>This handoff request was sent from the ooloo chatbot.</p>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: 'ooloo <onboarding@resend.dev>',
      to: 'paul@27thhourprods.com',
      subject: `🙋 Chat Handoff: ${customerName || customerEmail || 'Customer needs help'}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: 'Failed to send handoff email' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Handoff error:', error);
    return Response.json({ error: 'Failed to process handoff' }, { status: 500 });
  }
}