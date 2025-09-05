'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout, PageHeader } from '@/components/dashboard-layout'
import { AddDeviceModal, AddGadgetModal } from '@/components/forms/inventory-forms'
import { supabaseQueries } from '@/lib/supabase'
import { formatDate, formatCurrency, getStatusColor, searchItems, sortItems } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Smartphone, 
  Package, 
  Edit3,
  Trash2,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react'
import type { Device, Gadget } from '@/lib/types'
import { toast } from 'sonner'

type InventoryTab = 'devices' | 'gadgets'
type SortField = keyof Device | keyof Gadget

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('devices')
  const [devices, setDevices] = useState<Device[]>([])
  const [gadgets, setGadgets] = useState<Gadget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showAddModal, setShowAddModal] = useState(false)

  const loadInventory = async () => {
    try {
      setIsLoading(true)
      const [devicesData, gadgetsData] = await Promise.all([
        supabaseQueries.getDevices(),
        supabaseQueries.getGadgets()
      ])
      setDevices(devicesData)
      setGadgets(gadgetsData)
    } catch (error) {
      console.error('Error loading inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedDevices = React.useMemo(() => {
    let filtered = searchItems(devices, searchQuery, ['imei_serial', 'brand', 'model', 'color'])
    return sortItems(filtered, sortField as keyof Device, sortDirection)
  }, [devices, searchQuery, sortField, sortDirection])

  const filteredAndSortedGadgets = React.useMemo(() => {
    let filtered = searchItems(gadgets, searchQuery, ['inventory_id', 'brand', 'model'])
    return sortItems(filtered, sortField as keyof Gadget, sortDirection)
  }, [gadgets, searchQuery, sortField, sortDirection])

  const handleAddSuccess = () => {
    setShowAddModal(false)
    loadInventory()
    toast.success(`${activeTab === 'devices' ? 'Device' : 'Gadget'} added successfully`)
  }

  if (isLoading) {
    return (
      <DashboardLayout
        header={
          <PageHeader 
            title="Inventory Management" 
            description="Manage your devices and gadgets inventory"
          />
        }
      >
        <div className="space-y-4">
          <div className="h-10 loading-skeleton"></div>
          <div className="h-64 loading-skeleton"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      header={
        <PageHeader 
          title="Inventory Management" 
          description="Manage your devices and gadgets inventory"
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={loadInventory}
                className="btn-secondary p-2"
                title="Refresh inventory"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add {activeTab === 'devices' ? 'Device' : 'Gadget'}
              </button>
            </div>
          }
        />
      }
    >
      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'devices'
              ? 'btn-primary'
              : 'glass hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Devices ({devices.filter(d => d.status === 'available').length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('gadgets')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'gadgets'
              ? 'btn-primary'
              : 'glass hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Gadgets ({gadgets.reduce((sum, g) => sum + g.quantity, 0)} items)
          </div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
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

      {/* Content */}
      {activeTab === 'devices' ? (
        <DevicesTable 
          devices={filteredAndSortedDevices}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRefresh={loadInventory}
        />
      ) : (
        <GadgetsTable 
          gadgets={filteredAndSortedGadgets}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRefresh={loadInventory}
        />
      )}

      {/* Add Item Modals */}
      {activeTab === 'devices' && (
        <AddDeviceModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
      
      {activeTab === 'gadgets' && (
        <AddGadgetModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </DashboardLayout>
  )
}

interface DevicesTableProps {
  devices: Device[]
  sortField: SortField
  sortDirection: 'asc' | 'desc'
  onSort: (field: SortField) => void
  onRefresh: () => void
}

function DevicesTable({ devices, sortField, sortDirection, onSort, onRefresh }: DevicesTableProps) {
  const SortIcon = sortDirection === 'asc' ? SortAsc : SortDesc

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button
                  onClick={() => onSort('imei_serial')}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  IMEI/Serial
                  {sortField === 'imei_serial' && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th>
                <button
                  onClick={() => onSort('brand')}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  Brand
                  {sortField === 'brand' && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th>Model</th>
              <th>Details</th>
              <th>Status</th>
              <th>
                <button
                  onClick={() => onSort('date_added')}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  Added
                  {sortField === 'date_added' && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td className="font-mono text-sm">{device.imei_serial}</td>
                <td className="font-medium">{device.brand}</td>
                <td>{device.model}</td>
                <td>
                  <div className="text-sm">
                    {device.capacity && <div>{device.capacity}</div>}
                    {device.color && <div className="text-muted-foreground">{device.color}</div>}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusColor(device.status)}`}>
                    {device.status}
                  </span>
                </td>
                <td className="text-sm text-muted-foreground">
                  {formatDate(device.date_added)}
                </td>
                <td>
                  <button className="btn-secondary p-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {devices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No devices found. Add your first device to get started.
        </div>
      )}
    </div>
  )
}

interface GadgetsTableProps {
  gadgets: Gadget[]
  sortField: SortField
  sortDirection: 'asc' | 'desc'
  onSort: (field: SortField) => void
  onRefresh: () => void
}

function GadgetsTable({ gadgets, sortField, sortDirection, onSort, onRefresh }: GadgetsTableProps) {
  const SortIcon = sortDirection === 'asc' ? SortAsc : SortDesc

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button
                  onClick={() => onSort('inventory_id')}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  Inventory ID
                  {sortField === 'inventory_id' && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th>
                <button
                  onClick={() => onSort('brand')}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  Brand
                  {sortField === 'brand' && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th>Model</th>
              <th>
                <button
                  onClick={() => onSort('quantity')}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  Quantity
                  {sortField === 'quantity' && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th>Supplier</th>
              <th>
                <button
                  onClick={() => onSort('created_at')}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  Added
                  {sortField === 'created_at' && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gadgets.map((gadget) => (
              <tr key={gadget.id}>
                <td className="font-mono text-sm">{gadget.inventory_id}</td>
                <td className="font-medium">{gadget.brand}</td>
                <td>{gadget.model}</td>
                <td>
                  <span className={`font-bold ${
                    gadget.quantity <= 5 ? 'text-red-500' : 
                    gadget.quantity <= 10 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {gadget.quantity}
                  </span>
                </td>
                <td className="text-sm text-muted-foreground">
                  {gadget.supplier?.name || 'Unknown'}
                </td>
                <td className="text-sm text-muted-foreground">
                  {formatDate(gadget.created_at)}
                </td>
                <td>
                  <button className="btn-secondary p-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {gadgets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No gadgets found. Add your first gadget to get started.
        </div>
      )}
    </div>
  )
}

interface AddItemModalProps {
  type: InventoryTab
  onClose: () => void
  onSuccess: () => void
}

function AddItemModal({ type, onClose, onSuccess }: AddItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Form submission logic will be implemented here
      toast.success(`${type === 'devices' ? 'Device' : 'Gadget'} added successfully`)
      onSuccess()
    } catch (error) {
      toast.error('Failed to add item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Add New {type === 'devices' ? 'Device' : 'Gadget'}
          </h2>
          <button onClick={onClose} className="btn-secondary p-1">
            <Plus className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'devices' ? (
            <>
              <input
                type="text"
                placeholder="IMEI/Serial Number"
                className="w-full input"
                required
              />
              <input
                type="text"
                placeholder="Brand"
                className="w-full input"
                required
              />
              <input
                type="text"
                placeholder="Model"
                className="w-full input"
                required
              />
              <input
                type="text"
                placeholder="Capacity (optional)"
                className="w-full input"
              />
              <input
                type="text"
                placeholder="Color (optional)"
                className="w-full input"
              />
              <select className="w-full input" required>
                <option value="">Select Warranty Plan</option>
                <option value="6_months">6 Months</option>
                <option value="1_year">1 Year</option>
                <option value="2_years">2 Years</option>
              </select>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Brand"
                className="w-full input"
                required
              />
              <input
                type="text"
                placeholder="Model"
                className="w-full input"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                className="w-full input"
                min="1"
                required
              />
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}