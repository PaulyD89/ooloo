import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { cityId, deliveryDate, returnDate } = await request.json()

    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_active', true)

    if (!products) {
      return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
    }

    const availability: Record<string, number> = {}

    // Get all reservations that overlap with the requested dates
    const { data: overlappingReservations } = await supabase
      .from('reservations')
      .select('inventory_item_id')
      .lte('start_date', returnDate)
      .gte('end_date', deliveryDate)

    const reservedItemIds = new Set(overlappingReservations?.map(r => r.inventory_item_id) || [])

    for (const product of products) {
      if (product.slug === 'set') {
        // Set availability calculated after other products
        continue
      }

      // Get all available inventory items for this product in this city
      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('city_id', cityId)
        .eq('product_id', product.id)
        .eq('status', 'available')

      if (inventoryItems) {
        // Count items that are NOT reserved for the requested dates
        const availableCount = inventoryItems.filter(item => !reservedItemIds.has(item.id)).length
        availability[product.id] = availableCount
      } else {
        availability[product.id] = 0
      }
    }

    // Calculate set availability (min of carryon and large)
    const carryonProduct = products.find(p => p.slug === 'carryon')
    const largeProduct = products.find(p => p.slug === 'large')
    const setProduct = products.find(p => p.slug === 'set')

    if (setProduct && carryonProduct && largeProduct) {
      availability[setProduct.id] = Math.min(
        availability[carryonProduct.id] || 0,
        availability[largeProduct.id] || 0
      )
    }

    return NextResponse.json({ availability })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
  }
}