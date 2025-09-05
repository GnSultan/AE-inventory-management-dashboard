'use client'

import React, { useState, useEffect } from 'react'
import { supabaseQueries } from '../../lib/supabase'
import { validateIMEI, validateSerialNumber } from '../../lib/utils'
import { X, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AddDeviceForm, AddGadgetForm, Supplier } from '../../lib/types'

interface AddDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddDeviceModal({ isOpen, onClose, onSuccess }: AddDeviceModalProps) {
  const [formData, setFormData] = useState<AddDeviceForm>({
    imei_serial: '',
    brand: '',
    model: '',
    capacity: '',
    color: '',
    warranty_plan: '1_year',
    source: '',
    supplier_id: undefined,
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      // Reset form when modal opens
      setFormData({
        imei_serial: '',
        brand: '',
        model: '',
        capacity: '',
        color: '',
        warranty_plan: '1_year',
        source: '',
        supplier_id: undefined,
      })
      setErrors({})
    }
  }, [isOpen])

  const loadSuppliers = async () => {
    try {
      const data = await supabaseQueries.getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Trade-in') {
      setFormData(prev => ({ ...prev, source: 'Trade-in', supplier_id: undefined }));
    } else if (value === '') {
       setFormData(prev => ({ ...prev, source: '', supplier_id: undefined }));
    } else {
      const selectedSupplier = suppliers.find(s => s.id === value);
      setFormData(prev => ({ ...prev, source: selectedSupplier?.name, supplier_id: value }));
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.imei_serial.trim()) {
      newErrors.imei_serial = 'IMEI/Serial is required'
    } else {
      const isIMEI = formData.imei_serial.length === 15 && /^\d+$/.test(formData.imei_serial)
      const isSerial = formData.imei_serial.length >= 6

      if (isIMEI && !validateIMEI(formData.imei_serial)) {
        newErrors.imei_serial = 'Invalid IMEI format'
      } else if (!isIMEI && !isSerial) {
        newErrors.imei_serial = 'Invalid serial number format (minimum 6 characters)'
      }
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required'
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await supabaseQueries.addDevice(formData)
      toast.success('Device added successfully')
      onSuccess()
    } catch (error) {
      console.error('Error adding device:', error)
      toast.error('Failed to add device')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add New Device</h2>
          <button onClick={onClose} className="btn-secondary p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">IMEI/Serial Number *</label>
            <input
              type="text"
              value={formData.imei_serial}
              onChange={(e) => setFormData(prev => ({ ...prev, imei_serial: e.target.value }))}
              className={`w-full input ${errors.imei_serial ? 'border-red-500' : ''}`}
              placeholder="Enter IMEI or Serial Number"
            />
            {errors.imei_serial && (
              <p className="text-red-500 text-sm mt-1">{errors.imei_serial}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand *</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className={`w-full input ${errors.brand ? 'border-red-500' : ''}`}
                placeholder="Apple, Samsung, etc."
              />
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className={`w-full input ${errors.model ? 'border-red-500' : ''}`}
                placeholder="iPhone 15 Pro, Galaxy S24"
              />
              {errors.model && (
                <p className="text-red-500 text-sm mt-1">{errors.model}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Capacity</label>
              <input
                type="text"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="w-full input"
                placeholder="256GB, 512GB, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full input"
                placeholder="Blue, Black, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Warranty Plan *</label>
            <select
              value={formData.warranty_plan}
              onChange={(e) => setFormData(prev => ({ ...prev, warranty_plan: e.target.value as any }))}
              className="w-full input"
            >
              <option value="6_months">6 Months (Trade-in)</option>
              <option value="1_year">1 Year (Standard)</option>
              <option value="2_years">2 Years (Premium)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Source</label>
            <select
              value={formData.supplier_id || (formData.source === 'Trade-in' ? 'Trade-in' : '')}
              onChange={handleSourceChange}
              className="w-full input"
            >
              <option value="">Select source...</option>
              <option value="Trade-in">Trade-in</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Device
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AddGadgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddGadgetModal({ isOpen, onClose, onSuccess }: AddGadgetModalProps) {
  const [formData, setFormData] = useState<AddGadgetForm>({
    brand: '',
    model: '',
    quantity: 1,
  })
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      // Reset form when modal opens
      setFormData({
        brand: '',
        model: '',
        quantity: 1,
        supplier_id: undefined
      })
      setErrors({})
    }
  }, [isOpen])

  const loadSuppliers = async () => {
    try {
      const data = await supabaseQueries.getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required'
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required'
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await supabaseQueries.addGadget(formData)
      toast.success('Gadget added successfully')
      onSuccess()
    } catch (error) {
      console.error('Error adding gadget:', error)
      toast.error('Failed to add gadget')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-card max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add New Gadget</h2>
          <button onClick={onClose} className="btn-secondary p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand *</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className={`w-full input ${errors.brand ? 'border-red-500' : ''}`}
                placeholder="Apple, Samsung, etc."
              />
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className={`w-full input ${errors.model ? 'border-red-500' : ''}`}
                placeholder="AirPods Pro, Charger"
              />
              {errors.model && (
                <p className="text-red-500 text-sm mt-1">{errors.model}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className={`w-full input ${errors.quantity ? 'border-red-500' : ''}`}
              min="1"
              placeholder="1"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supplier</label>
            <select
              value={formData.supplier_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value || undefined }))}
              className="w-full input"
            >
              <option value="">Select supplier...</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Gadget
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

