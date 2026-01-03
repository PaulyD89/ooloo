import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are ooloo's friendly customer support assistant. You help customers with questions about luggage rentals.

Key information about ooloo:
- We rent premium luggage delivered to your door and pick it up when you return
- Available cities: Los Angeles, New York, San Francisco, Chicago, Atlanta, Dallas-Fort Worth, Denver
- Bag sizes: Carry-on ($8/day), Medium ($10/day), Large ($12/day)
- Delivery fee: $19.99 flat
- Delivery windows: Morning (9am-12pm), Afternoon (12pm-5pm), Evening (5pm-8pm)
- Book 60+ days in advance for up to 20% Early Bird discount
- Free cancellation up to 48 hours before delivery
- One-way trips: If flying to a city we don't service, you can return via prepaid UPS label for $14.99

Common questions:
- "How does it work?" - Choose dates, pick bags, we deliver before your trip and pick up after
- "What if I damage the bag?" - We offer optional damage protection at checkout
- "Can I extend my rental?" - Contact us and we'll do our best to accommodate
- "Where do you deliver?" - We deliver anywhere within our service cities
- "What's included?" - The bag, TSA-approved lock, and luggage tag

Keep responses concise and friendly. If you don't know something specific, suggest they email support@ooloo.co or call. Always be helpful and positive about the service.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    });

    const textContent = response.content.find(block => block.type === 'text');
    const text = textContent ? textContent.text : 'Sorry, I could not generate a response.';

    return Response.json({ message: text });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}