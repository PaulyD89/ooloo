import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Look up orders by email
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        delivery_date,
        return_date,
        status,
        total,
        created_at,
        delivery_city:delivery_city_id(name)
      `)
      .ilike('customer_email', email.trim())
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Order lookup error:', error);
      return Response.json({ error: 'Failed to look up orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return Response.json({ 
        found: false, 
        message: "No orders found for that email address." 
      });
    }

    // Format orders for chat response
    const formattedOrders = orders.map(order => ({
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      fullId: order.id,
      name: order.customer_name,
      status: order.status,
      deliveryDate: order.delivery_date,
      returnDate: order.return_date,
      city: order.delivery_city?.name || 'Unknown',
      total: (order.total / 100).toFixed(2)
    }));

    return Response.json({ 
      found: true, 
      orders: formattedOrders,
      count: formattedOrders.length
    });
  } catch (error) {
    console.error('Order lookup error:', error);
    return Response.json(
      { error: 'Failed to look up orders' },
      { status: 500 }
    );
  }
}