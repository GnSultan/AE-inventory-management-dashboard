'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout, PageHeader } from '@/components/dashboard-layout'
import { supabaseQueries } from '@/lib/supabase'
import { formatDate, formatCurrency, generateItemDescription } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  User, 
  Package, 
  DollarSign,
  Calendar,
  Filter,
  Eye,
  Receipt,
  Loader2
} from 'lucide-react'
import type { Sale, Device, Gadget } from '@/lib/types'
import { toast } from 'sonner'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateSale, setShowCreateSale] = useState(false)

  const loadSales = async () => {
    try {
      setIsLoading(true)
      const salesData = await supabaseQueries.getSalesData(90) // Last 90 days
      setSales(salesData)
    } catch (error) {
      console.error('Error loading sales:', error)
      toast.error('Failed to load sales data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  const filteredSales = sales.filter(sale => 
    sale.sale_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.item_description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.sale_price.toString()), 0)
  const todaysSales = sales.filter(sale => {
    const saleDate = new Date(sale.date_sold)
    const today = new Date()
    return saleDate.toDateString() === today.toDateString()
  })

  if (isLoading) {
    return (
      <DashboardLayout
        header={
          <PageHeader 
            title="Sales Management" 
            description="Create and manage sales transactions"
          />
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 loading-skeleton"></div>
            ))}
          </div>
          <div className="h-64 loading-skeleton"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      header={
        <PageHeader 
          title="Sales Management" 
          description="Create and manage sales transactions"
          actions={
            <button
              onClick={() => setShowCreateSale(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Sale
            </button>
          }
        />
      }
    >
      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{sales.length}</p>
            </div>
            <div className="gradient-primary p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
              <p className="text-2xl font-bold">{todaysSales.length}</p>
            </div>
            <div className="gradient-success p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="gradient-warning p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales by ID, customer, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 input"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="font-mono text-sm font-medium">{sale.sale_id}</td>
                  <td className="text-sm">{formatDate(sale.date_sold)}</td>
                  <td className="font-medium">{sale.customer_name}</td>
                  <td className="text-sm">{sale.item_description}</td>
                  <td>
                    <span className={`badge ${
                      sale.sale_type === 'trade_in' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {sale.sale_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="font-bold text-green-600">
                    {formatCurrency(parseFloat(sale.sale_price.toString()))}
                  </td>
                  <td>
                    <span className={`badge ${
                      sale.sale_source === 'loan' ? 'badge-warning' :
                      sale.sale_source === 'trade_in' ? 'badge-info' :
                      'badge-success'
                    }`}>
                      {sale.sale_source}
                    </span>
                  </td>
                  <td>
                    <button className="btn-secondary p-1" title="View Details">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No sales found matching your search.' : 'No sales recorded yet. Create your first sale to get started!'}
          </div>
        )}
      </div>

      {/* Create Sale Modal */}
      {showCreateSale && (
        <CreateSaleModal
          onClose={() => setShowCreateSale(false)}
          onSuccess={() => {
            setShowCreateSale(false)
            loadSales()
          }}
        />
      )}
    </DashboardLayout>
  )
}

interface CreateSaleModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateSaleModal({ onClose, onSuccess }: CreateSaleModalProps) {
  const [step, setStep] = useState<'item' | 'customer' | 'confirm'>('item')
  const [itemType, setItemType] = useState<'device' | 'gadget'>('device')
  const [selectedItem, setSelectedItem] = useState<Device | Gadget | null>(null)
  const [availableDevices, setAvailableDevices] = useState<Device[]>([])
  const [availableGadgets, setAvailableGadgets] = useState<Gadget[]>([])
  const [customerName, setCustomerName] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [saleType, setSaleType] = useState<'retail' | 'trade_in' | 'wholesale'>('retail')
  const [gadgetQuantity, setGadgetQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAvailableItems()
  }, [])

  const loadAvailableItems = async () => {
    try {
      const [devices, gadgets] = await Promise.all([
        supabaseQueries.getDevices('available'),
        supabaseQueries.getGadgets()
      ])
      setAvailableDevices(devices)
      setAvailableGadgets(gadgets.filter(g => g.quantity > 0))
    } catch (error) {
      console.error('Error loading items:', error)
      toast.error('Failed to load available items')
    }
  }

  const filteredDevices = availableDevices.filter(device =>
    device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.imei_serial.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGadgets = availableGadgets.filter(gadget =>
    gadget.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gadget.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gadget.inventory_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmitSale = async () => {
    if (!selectedItem || !customerName.trim() || !salePrice) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const saleData = {
        customer_name: customerName,
        sale_type: saleType,
        sale_price: parseFloat(salePrice),
        sale_source: 'inventory' as const,
        item_description: generateItemDescription(selectedItem),
        ...(itemType === 'device' 
          ? { device_id: selectedItem.id }
          : { gadget_id: selectedItem.id, gadget_quantity: gadgetQuantity }
        )
      }

      await supabaseQueries.createSale(saleData)
      toast.success('Sale created successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error creating sale:', error)
      toast.error('Failed to create sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Sale</h2>
          <button onClick={onClose} className="btn-secondary p-2">
            <Plus className="h-4 w-4 rotate-45" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {[
            { key: 'item', label: 'Select Item' },
            { key: 'customer', label: 'Customer Info' },
            { key: 'confirm', label: 'Confirm Sale' }
          ].map((stepInfo, index) => (
            <div key={stepInfo.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepInfo.key ? 'btn-primary' : 
                index < ['item', 'customer', 'confirm'].indexOf(step) ? 'btn-success' : 'glass'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${step === stepInfo.key ? 'font-medium' : 'text-muted-foreground'}`}>
                {stepInfo.label}
              </span>
              {index < 2 && <div className="w-8 h-px bg-gray-300 mx-4" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'item' && (
          <div className="space-y-4">
            {/* Item Type Selection */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setItemType('device')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  itemType === 'device' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Devices
                </div>
              </button>
              <button
                onClick={() => setItemType('gadget')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  itemType === 'gadget' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Gadgets
                </div>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${itemType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input"
              />
            </div>

            {/* Items List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {itemType === 'device' ? (
                filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    onClick={() => setSelectedItem(device)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedItem?.id === device.id ? 'btn-primary' : 'glass hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{device.brand} {device.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {device.capacity && `${device.capacity} • `}
                          {device.color && `${device.color} • `}
                          {device.imei_serial}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                filteredGadgets.map((gadget) => (
                  <div
                    key={gadget.id}
                    onClick={() => setSelectedItem(gadget)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedItem?.id === gadget.id ? 'btn-primary' : 'glass hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{gadget.brand} {gadget.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {gadget.inventory_id} • {gadget.quantity} available
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Gadget Quantity */}
            {itemType === 'gadget' && selectedItem && (
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={(selectedItem as Gadget).quantity}
                  value={gadgetQuantity}
                  onChange={(e) => setGadgetQuantity(parseInt(e.target.value) || 1)}
                  className="w-full input"
                />
              </div>
            )}

            <button
              onClick={() => setStep('customer')}
              disabled={!selectedItem}
              className="w-full btn-primary disabled:opacity-50"
            >
              Continue to Customer Info
            </button>
          </div>
        )}

        {step === 'customer' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full input"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sale Type</label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as any)}
                className="w-full input"
              >
                <option value="retail">Retail Sale</option>
                <option value="trade_in">Trade-in Sale</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sale Price (TZS) *</label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full input"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('item')}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!customerName.trim() || !salePrice}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                Review Sale
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="glass-card">
              <h3 className="font-semibold mb-4">Sale Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">{selectedItem && generateItemDescription(selectedItem)}</span>
                </div>
                
                {itemType === 'gadget' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{gadgetQuantity}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale Type:</span>
                  <span className="font-medium capitalize">{saleType.replace('_', ' ')}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">{formatCurrency(parseFloat(salePrice))}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('customer')}
                className="flex-1 btn-secondary"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                onClick={handleSubmitSale}
                disabled={isSubmitting}
                className="flex-1 btn-success flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4" />
                    Complete Sale
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}