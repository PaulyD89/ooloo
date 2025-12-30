'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

type City = {
  id: string
  name: string
}

type Product = {
  id: string
  name: string
  slug: string
}

type Addon = {
  id: string
  name: string
  slug: string
  quantity_available: number
  price: number
  is_active: boolean
}

type InventoryItem = {
  id: string
  sku: string
  status: string
  city_id: string
  product_id: string
  city: { name: string } | null
  product: { name: string } | null
}

type InventorySummary = {
  city_id: string
  city_name: string
  product_id: string
  product_name: string
  total: number
  available: number
  rented: number
}

export default function InventoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  
  const [cities, setCities] = useState<City[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<InventorySummary[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'summary' | 'detail' | 'addons'>('summary')
  
  // Add inventory modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addCity, setAddCity] = useState('')
  const [addProduct, setAddProduct] = useState('')
  const [addQuantity, setAddQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  // Edit addon modal
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [newAddonQuantity, setNewAddonQuantity] = useState(0)
  const [updatingAddon, setUpdatingAddon] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!authLoading && !accessDenied) {
      loadData()
    }
  }, [authLoading, accessDenied])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (error || !roleData) {
      setAccessDenied(true)
    }
    
    setAuthLoading(false)
  }

  async function loadData() {
    setLoading(true)
    
    // Load cities, products, and addons
    const [citiesRes, productsRes, addonsRes] = await Promise.all([
      supabase.from('cities').select('id, name').eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, slug').eq('is_active', true).order('sort_order'),
      supabase.from('addons').select('*').order('name')
    ])
    
    if (citiesRes.data) setCities(citiesRes.data)
    if (productsRes.data) setProducts(productsRes.data.filter(p => p.slug !== 'set'))
    if (addonsRes.data) setAddons(addonsRes.data)
    
    // Load inventory items
    const { data: inventoryData } = await supabase
      .from('inventory_items')
      .select(`
        *,
        city:cities(name),
        product:products(name)
      `)
      .order('sku')
    
    if (inventoryData) setInventory(inventoryData as InventoryItem[])
    
    // Calculate summary
    await loadSummary()
    
    setLoading(false)
  }

  async function loadSummary() {
    const { data: inventoryData } = await supabase
      .from('inventory_items')
      .select(`
        id,
        city_id,
        product_id,
        status,
        city:cities(name),
        product:products(name)
      `)
    
    if (!inventoryData) return
    
    // Get current reservations
    const today = new Date().toISOString().split('T')[0]
    const { data: reservations } = await supabase
      .from('reservations')
      .select('inventory_item_id')
      .lte('start_date', today)
      .gte('end_date', today)
    
    const rentedItemIds = new Set(reservations?.map(r => r.inventory_item_id) || [])
    
    // Group by city and product
    const summaryMap = new Map<string, InventorySummary>()
    
    for (const item of inventoryData as any[]) {
      const key = `${item.city_id}-${item.product_id}`
      
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          city_id: item.city_id,
          city_name: item.city?.name || 'Unknown',
          product_id: item.product_id,
          product_name: item.product?.name || 'Unknown',
          total: 0,
          available: 0,
          rented: 0
        })
      }
      
      const summary = summaryMap.get(key)!
      summary.total++
      
      if (rentedItemIds.has(item.id)) {
        summary.rented++
      } else if (item.status === 'available') {
        summary.available++
      }
    }
    
    setSummary(Array.from(summaryMap.values()).sort((a, b) => {
      if (a.city_name !== b.city_name) return a.city_name.localeCompare(b.city_name)
      return a.product_name.localeCompare(b.product_name)
    }))
  }

  async function addInventory() {
    if (!addCity || !addProduct || addQuantity < 1) return
    
    setAdding(true)
    
    const city = cities.find(c => c.id === addCity)
    const product = products.find(p => p.id === addProduct)
    
    if (!city || !product) {
      setAdding(false)
      return
    }
    
    // Generate SKU prefix based on product and city
    const productPrefix = product.slug === 'carryon' ? 'CO' : product.slug === 'medium' ? 'MD' : 'LG'
    const cityPrefix = city.name.substring(0, 2).toUpperCase()
    
    // Find highest existing SKU number for this combination
    const { data: existing } = await supabase
      .from('inventory_items')
      .select('sku')
      .eq('city_id', addCity)
      .eq('product_id', addProduct)
      .order('sku', { ascending: false })
      .limit(1)
    
    let startNum = 1
    if (existing && existing.length > 0) {
      const match = existing[0].sku.match(/(\d+)$/)
      if (match) {
        startNum = parseInt(match[1]) + 1
      }
    }
    
    // Create new inventory items
    const newItems = []
    for (let i = 0; i < addQuantity; i++) {
      newItems.push({
        city_id: addCity,
        product_id: addProduct,
        sku: `${productPrefix}-${cityPrefix}-${String(startNum + i).padStart(3, '0')}`,
        status: 'available'
      })
    }
    
    const { error } = await supabase
      .from('inventory_items')
      .insert(newItems)
    
    if (error) {
      console.error('Error adding inventory:', error)
      alert('Failed to add inventory')
    } else {
      setShowAddModal(false)
      setAddCity('')
      setAddProduct('')
      setAddQuantity(1)
      loadData()
    }
    
    setAdding(false)
  }

  async function updateAddonQuantity() {
    if (!editingAddon) return
    
    setUpdatingAddon(true)
    
    const { error } = await supabase
      .from('addons')
      .update({ quantity_available: newAddonQuantity })
      .eq('id', editingAddon.id)
    
    if (error) {
      console.error('Error updating addon:', error)
      alert('Failed to update addon quantity')
    } else {
      setAddons(prev => prev.map(a => 
        a.id === editingAddon.id ? { ...a, quantity_available: newAddonQuantity } : a
      ))
      setEditingAddon(null)
    }
    
    setUpdatingAddon(false)
  }

  async function toggleAddonActive(addon: Addon) {
    const { error } = await supabase
      .from('addons')
      .update({ is_active: !addon.is_active })
      .eq('id', addon.id)
    
    if (!error) {
      setAddons(prev => prev.map(a => 
        a.id === addon.id ? { ...a, is_active: !a.is_active } : a
      ))
    }
  }

  async function retireItem(itemId: string) {
    if (!confirm('Are you sure you want to retire this bag? It will no longer be available for rental.')) {
      return
    }
    
    const { error } = await supabase
      .from('inventory_items')
      .update({ status: 'retired' })
      .eq('id', itemId)
    
    if (!error) {
      loadData()
    }
  }

  async function reactivateItem(itemId: string) {
    const { error } = await supabase
      .from('inventory_items')
      .update({ status: 'available' })
      .eq('id', itemId)
    
    if (!error) {
      loadData()
    }
  }

  const filteredInventory = inventory.filter(item => {
    if (selectedCity !== 'all' && item.city_id !== selectedCity) return false
    if (selectedProduct !== 'all' && item.product_id !== selectedProduct) return false
    return true
  })

  const filteredSummary = summary.filter(s => {
    if (selectedCity !== 'all' && s.city_id !== selectedCity) return false
    if (selectedProduct !== 'all' && s.product_id !== selectedProduct) return false
    return true
  })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg border text-center max-w-md">
          <h1 className="text-xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have admin access.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/admin">
              <img src="/oolooicon.png" alt="ooloo" className="h-10" />
            </a>
            <div>
              <h1 className="text-xl font-bold">Inventory Management</h1>
              <a href="/admin" className="text-sm text-cyan-600 hover:underline">← Back to Orders</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium"
            >
              + Add Bags
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="p-2 border rounded-lg"
              disabled={viewMode === 'addons'}
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="p-2 border rounded-lg"
              disabled={viewMode === 'addons'}
            >
              <option value="all">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          
          <div className="ml-auto">
            <label className="block text-xs text-gray-500 mb-1">View</label>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 text-sm ${viewMode === 'summary' ? 'bg-black text-white' : 'bg-white'}`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode('detail')}
                className={`px-4 py-2 text-sm ${viewMode === 'detail' ? 'bg-black text-white' : 'bg-white'}`}
              >
                Detail
              </button>
              <button
                onClick={() => setViewMode('addons')}
                className={`px-4 py-2 text-sm ${viewMode === 'addons' ? 'bg-black text-white' : 'bg-white'}`}
              >
                Add-ons
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading inventory...</div>
        ) : viewMode === 'summary' ? (
          /* Summary View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSummary.map(s => (
              <div key={`${s.city_id}-${s.product_id}`} className="bg-white p-6 rounded-lg border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{s.product_name}</h3>
                    <p className="text-sm text-gray-500">{s.city_name}</p>
                  </div>
                  <span className="text-2xl font-bold">{s.total}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                    {s.available} available
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
                    {s.rented} rented
                  </div>
                  {s.total - s.available - s.rented > 0 && (
                    <div>
                      <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-1"></span>
                      {s.total - s.available - s.rented} retired
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'detail' ? (
          /* Detail View */
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">City</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInventory.map(item => (
                  <tr key={item.id} className={item.status === 'retired' ? 'opacity-50' : ''}>
                    <td className="p-4 font-mono text-sm">{item.sku}</td>
                    <td className="p-4">{item.product?.name}</td>
                    <td className="p-4">{item.city?.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'retired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.status === 'available' ? (
                        <button
                          onClick={() => retireItem(item.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Retire
                        </button>
                      ) : item.status === 'retired' ? (
                        <button
                          onClick={() => reactivateItem(item.id)}
                          className="text-sm text-cyan-600 hover:underline"
                        >
                          Reactivate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredInventory.length === 0 && (
              <p className="text-center py-8 text-gray-500">No inventory items found</p>
            )}
          </div>
        ) : (
          /* Add-ons View */
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Add-on</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th className="text-left p-4 font-medium">Quantity Available</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {addons.map(addon => (
                  <tr key={addon.id} className={!addon.is_active ? 'opacity-50' : ''}>
                    <td className="p-4">
                      <p className="font-medium">{addon.name}</p>
                      <p className="text-xs text-gray-500">{addon.slug}</p>
                    </td>
                    <td className="p-4">
                      {addon.price === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${(addon.price / 100).toFixed(2)}`
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${addon.quantity_available <= 10 ? 'text-orange-600' : ''}`}>
                        {addon.quantity_available}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        addon.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {addon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingAddon(addon)
                            setNewAddonQuantity(addon.quantity_available)
                          }}
                          className="text-sm text-cyan-600 hover:underline"
                        >
                          Edit Qty
                        </button>
                        <button
                          onClick={() => toggleAddonActive(addon)}
                          className={`text-sm hover:underline ${addon.is_active ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {addon.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {addons.length === 0 && (
              <p className="text-center py-8 text-gray-500">No add-ons found</p>
            )}
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Inventory</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <select
                  value={addCity}
                  onChange={e => setAddCity(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Select a city</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <select
                  value={addProduct}
                  onChange={e => setAddProduct(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={addQuantity}
                  onChange={e => setAddQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addInventory}
                disabled={!addCity || !addProduct || adding}
                className="flex-1 bg-black text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
              >
                {adding ? 'Adding...' : 'Add Bags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Addon Quantity Modal */}
      {editingAddon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit {editingAddon.name}</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Quantity Available</label>
              <input
                type="number"
                min="0"
                value={newAddonQuantity}
                onChange={e => setNewAddonQuantity(parseInt(e.target.value) || 0)}
                className="w-full p-3 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {editingAddon.quantity_available}
              </p>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setEditingAddon(null)}
                className="flex-1 py-3 border rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateAddonQuantity}
                disabled={updatingAddon}
                className="flex-1 bg-black text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
              >
                {updatingAddon ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}