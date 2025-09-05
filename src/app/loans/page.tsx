'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout, PageHeader } from '@/components/dashboard-layout'
import { supabaseQueries, createClient } from '@/lib/supabase'
import { formatDate, generateItemDescription } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  HandCoins, 
  User, 
  Package, 
  ArrowLeft,
  ArrowRight,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import type { Loan, Device, Gadget } from '@/lib/types'
import { toast } from 'sonner'

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned' | 'sold'>('all')
  const [showCreateLoan, setShowCreateLoan] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState<Loan | null>(null)

  const loadLoans = async () => {
  try {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    setLoans(data || [])
  } catch (error) {
    console.error('Error loading loans:', error)
    toast.error('Failed to load loans data')
  } finally {
    setIsLoading(false)
  }
}

  useEffect(() => {
    loadLoans()
  }, [])

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.loan_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.loaner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.item_description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const activeLoans = loans.filter(loan => loan.status === 'active')
  const overdueLoans = loans.filter(loan => {
    if (loan.status !== 'active' || !loan.expected_return_date) return false
    return new Date(loan.expected_return_date) < new Date()
  })

  if (isLoading) {
    return (
      <DashboardLayout
        header={
          <PageHeader 
            title="Loans Management" 
            description="Manage items loaned to third-party sellers"
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
          title="Loans Management" 
          description="Manage items loaned to third-party sellers"
          actions={
            <button
              onClick={() => setShowCreateLoan(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Loan
            </button>
          }
        />
      }
    >
      {/* Loans Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
              <p className="text-2xl font-bold">{activeLoans.length}</p>
            </div>
            <div className="gradient-primary p-3 rounded-lg">
              <HandCoins className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overdue Returns</p>
              <p className="text-2xl font-bold text-red-500">{overdueLoans.length}</p>
            </div>
            <div className="gradient-danger p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Loans</p>
              <p className="text-2xl font-bold">{loans.length}</p>
            </div>
            <div className="gradient-success p-3 rounded-lg">
              <Package className="h-6 w-6 text-white" />
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
              placeholder="Search loans by ID, loaner, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 input"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input min-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Date Loaned</th>
                <th>Loaner</th>
                <th>Item</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const isOverdue = loan.status === 'active' && 
                  loan.expected_return_date && 
                  new Date(loan.expected_return_date) < new Date()
                
                return (
                  <tr key={loan.id}>
                    <td className="font-mono text-sm font-medium">{loan.loan_id}</td>
                    <td className="text-sm">{formatDate(loan.date_loaned)}</td>
                    <td className="font-medium">{loan.loaner_name}</td>
                    <td className="text-sm">{loan.item_description}</td>
                    <td className="text-sm">
                      {loan.expected_return_date ? (
                        <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                          {formatDate(loan.expected_return_date)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        loan.status === 'active' ? (isOverdue ? 'badge-error' : 'badge-warning') :
                        loan.status === 'returned' ? 'badge-info' :
                        'badge-success'
                      }`}>
                        {loan.status === 'active' && isOverdue ? 'Overdue' : loan.status}
                      </span>
                    </td>
                    <td>
                      {loan.status === 'active' && (
                        <button 
                          onClick={() => setShowReturnModal(loan)}
                          className="btn-secondary text-xs"
                        >
                          Process Return
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredLoans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'No loans found matching your criteria.' 
              : 'No loans recorded yet. Create your first loan to get started!'
            }
          </div>
        )}
      </div>

      {/* Create Loan Modal */}
      {showCreateLoan && (
        <CreateLoanModal
          onClose={() => setShowCreateLoan(false)}
          onSuccess={() => {
            setShowCreateLoan(false)
            loadLoans()
          }}
        />
      )}

      {/* Return Processing Modal */}
      {showReturnModal && (
        <ProcessReturnModal
          loan={showReturnModal}
          onClose={() => setShowReturnModal(null)}
          onSuccess={() => {
            setShowReturnModal(null)
            loadLoans()
          }}
        />
      )}
    </DashboardLayout>
  )
}

interface CreateLoanModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateLoanModal({ onClose, onSuccess }: CreateLoanModalProps) {
  const [step, setStep] = useState<'item' | 'loaner'>('item')
  const [itemType, setItemType] = useState<'device' | 'gadget'>('device')
  const [selectedItem, setSelectedItem] = useState<Device | Gadget | null>(null)
  const [availableDevices, setAvailableDevices] = useState<Device[]>([])
  const [availableGadgets, setAvailableGadgets] = useState<Gadget[]>([])
  const [loanerName, setLoanerName] = useState('')
  const [loanerContact, setLoanerContact] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [notes, setNotes] = useState('')
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

  const handleSubmitLoan = async () => {
    if (!selectedItem || !loanerName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = supabaseQueries.createClient()
      
      const loanData = {
        loaner_name: loanerName,
        loaner_contact: loanerContact || null,
        item_description: generateItemDescription(selectedItem),
        expected_return_date: expectedReturnDate || null,
        notes: notes || null,
        ...(itemType === 'device' 
          ? { device_id: selectedItem.id, gadget_id: null, gadget_quantity: null }
          : { device_id: null, gadget_id: selectedItem.id, gadget_quantity: gadgetQuantity }
        )
      }

      const { error: loanError } = await supabase.from('loans').insert([loanData])
      if (loanError) throw loanError

      // Update item status/quantity
      if (itemType === 'device') {
        await supabaseQueries.updateDeviceStatus(selectedItem.id, 'loaned')
      } else {
        const currentGadget = selectedItem as Gadget
        await supabaseQueries.updateGadgetQuantity(selectedItem.id, currentGadget.quantity - gadgetQuantity)
      }

      toast.success('Loan created successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error creating loan:', error)
      toast.error('Failed to create loan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Loan</h2>
          <button onClick={onClose} className="btn-secondary p-2">
            <Plus className="h-4 w-4 rotate-45" />
          </button>
        </div>

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
                  <HandCoins className="h-4 w-4" />
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
                <label className="block text-sm font-medium mb-2">Quantity to Loan</label>
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
              onClick={() => setStep('loaner')}
              disabled={!selectedItem}
              className="w-full btn-primary disabled:opacity-50"
            >
              Continue to Loaner Info
            </button>
          </div>
        )}

        {step === 'loaner' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Loaner Name *</label>
              <input
                type="text"
                value={loanerName}
                onChange={(e) => setLoanerName(e.target.value)}
                className="w-full input"
                placeholder="Enter loaner name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Information</label>
              <input
                type="text"
                value={loanerContact}
                onChange={(e) => setLoanerContact(e.target.value)}
                className="w-full input"
                placeholder="Phone number or email (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expected Return Date</label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full input min-h-[80px] resize-none"
                placeholder="Additional notes about this loan (optional)"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('item')}
                className="flex-1 btn-secondary"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                onClick={handleSubmitLoan}
                disabled={isSubmitting || !loanerName.trim()}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <HandCoins className="h-4 w-4" />
                    Create Loan
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

interface ProcessReturnModalProps {
  loan: Loan
  onClose: () => void
  onSuccess: () => void
}

function ProcessReturnModal({ loan, onClose, onSuccess }: ProcessReturnModalProps) {
  const [action, setAction] = useState<'return' | 'sell'>('return')
  const [salePrice, setSalePrice] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleProcessReturn = async () => {
    setIsSubmitting(true)

    try {
      const supabase = supabaseQueries.createClient()

      if (action === 'return') {
        // Mark loan as returned
        const { error: loanError } = await supabase
          .from('loans')
          .update({ 
            status: 'returned',
            date_returned: new Date().toISOString()
          })
          .eq('id', loan.id)

        if (loanError) throw loanError

        // Return item to inventory
        if (loan.device_id) {
          await supabaseQueries.updateDeviceStatus(loan.device_id, 'available')
        } else if (loan.gadget_id) {
          // Get current gadget quantity and add back the loaned quantity
          const { data: gadget } = await supabase
            .from('gadgets')
            .select('quantity')
            .eq('id', loan.gadget_id)
            .single()

          if (gadget) {
            await supabaseQueries.updateGadgetQuantity(
              loan.gadget_id, 
              gadget.quantity + (loan.gadget_quantity || 1)
            )
          }
        }

        toast.success('Item returned to inventory successfully!')
      } else {
        // Create sale and mark loan as sold
        if (!salePrice || !customerName.trim()) {
          toast.error('Please enter sale price and customer name')
          return
        }

        // Create the sale
        const saleData = {
          customer_name: customerName,
          sale_type: 'retail',
          sale_price: parseFloat(salePrice),
          sale_source: 'loan' as const,
          item_description: loan.item_description,
          loan_id: loan.id,
          ...(loan.device_id 
            ? { device_id: loan.device_id }
            : { gadget_id: loan.gadget_id, gadget_quantity: loan.gadget_quantity }
          )
        }

        const { error: saleError } = await supabase.from('sales').insert([saleData])
        if (saleError) throw saleError

        // Mark loan as sold
        const { error: loanError } = await supabase
          .from('loans')
          .update({ 
            status: 'sold',
            date_returned: new Date().toISOString()
          })
          .eq('id', loan.id)

        if (loanError) throw loanError

        // Keep device as sold or gadget quantity remains reduced
        if (loan.device_id) {
          await supabaseQueries.updateDeviceStatus(loan.device_id, 'sold')
        }

        toast.success('Loan converted to sale successfully!')
      }

      onSuccess()
    } catch (error) {
      console.error('Error processing return:', error)
      toast.error('Failed to process return')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-card max-w-md w-full">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Process Return</h2>
          <button onClick={onClose} className="btn-secondary p-2">
            <Plus className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Loan Info */}
          <div className="glass-card">
            <p className="font-medium">{loan.item_description}</p>
            <p className="text-sm text-muted-foreground">Loaned to: {loan.loaner_name}</p>
            <p className="text-sm text-muted-foreground">Loan ID: {loan.loan_id}</p>
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">What happened to this item?</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="return"
                  checked={action === 'return'}
                  onChange={(e) => setAction(e.target.value as 'return' | 'sell')}
                  className="form-radio"
                />
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4 text-blue-500" />
                  <span>Returned to inventory</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="sell"
                  checked={action === 'sell'}
                  onChange={(e) => setAction(e.target.value as 'return' | 'sell')}
                  className="form-radio"
                />
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>Sold by loaner</span>
                </div>
              </label>
            </div>
          </div>

          {/* Sale Details (if selling) */}
          {action === 'sell' && (
            <div className="space-y-3">
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
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleProcessReturn}
              disabled={isSubmitting || (action === 'sell' && (!salePrice || !customerName.trim()))}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {action === 'return' ? <ArrowLeft className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {action === 'return' ? 'Return to Inventory' : 'Record Sale'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}