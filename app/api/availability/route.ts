import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderId, cityId, deliveryDate, returnDate, cart, products } = await request.json()

    const reservations: { inventory_item_id: string; order_id: string; start_date: string; end_date: string }[] = []

    // Get product slugs for set handling
    const { data: productList } = await supabase
      .from('products')
      .select('id, slug')

    const productMap = new Map(productList?.map(p => [p.id, p.slug]) || [])
    const carryonProductId = productList?.find(p => p.slug === 'carryon')?.id
    const largeProductId = productList?.find(p => p.slug === 'large')?.id

    for (const [productId, details] of Object.entries(cart) as [string, { quantity: number }][]) {
      const slug = productMap.get(productId)
      let itemsToReserve: { productId: string; quantity: number }[] = []

      if (slug === 'set') {
        // Set needs 1 carryon + 1 large per set
        itemsToReserve = [
          { productId: carryonProductId!, quantity: details.quantity },
          { productId: largeProductId!, quantity: details.quantity }
        ]
      } else {
        itemsToReserve = [{ productId, quantity: details.quantity }]
      }

      for (const item of itemsToReserve) {
        // Find available inventory items not reserved for these dates
        const { data: reservedItemIds } = await supabase
          .from('reservations')
          .select('inventory_item_id')
          .gte('end_date', deliveryDate)
          .lte('start_date', returnDate)

        const excludeIds = reservedItemIds?.map(r => r.inventory_item_id) || []

        let query = supabase
          .from('inventory_items')
          .select('id')
          .eq('city_id', cityId)
          .eq('product_id', item.productId)
          .eq('status', 'available')
          .limit(item.quantity)

        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`)
        }

        const { data: availableItems } = await query

        if (!availableItems || availableItems.length < item.quantity) {
          return NextResponse.json({ 
            error: `Not enough inventory available`,
            needed: item.quantity,
            available: availableItems?.length || 0
          }, { status: 400 })
        }

        // Create reservations
        for (const invItem of availableItems) {
          reservations.push({
            inventory_item_id: invItem.id,
            order_id: orderId,
            start_date: deliveryDate,
            end_date: returnDate
          })
        }
      }
    }

    // Insert all reservations
    const { error: reserveError } = await supabase
      .from('reservations')
      .insert(reservations)

    if (reserveError) {
      console.error('Reservation error:', reserveError)
      return NextResponse.json({ error: 'Failed to reserve inventory' }, { status: 500 })
    }

    return NextResponse.json({ success: true, reservations: reservations.length })

  } catch (error) {
    console.error('Reserve inventory error:', error)
    return NextResponse.json({ error: 'Failed to reserve inventory' }, { status: 500 })
  }
}