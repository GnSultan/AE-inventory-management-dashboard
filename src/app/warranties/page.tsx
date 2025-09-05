'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout, PageHeader } from '@/components/dashboard-layout'
import { supabaseQueries, createClient } from '@/lib/supabase'
import { formatDate, calculateWarrantyEndDate, isWarrantyActive, getWarrantyDaysRemaining } from '@/lib/utils'
import { 
  Search, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Filter,
  FileText,
  Download,
  Calendar
} from 'lucide-react'
import type { Warranty } from '@/lib/types'
import { toast } from 'sonner'

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all')

  const loadWarranties = async () => {
  try {
    setIsLoading(true)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('warranties')
      .select(`
        *,
        sale:sales!inner(
          customer_name,
          sale_id,
          date_sold
        ),
        device:devices!inner(
          brand,
          model,
          capacity,
          color,
          imei_serial
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    setWarranties(data || [])
  } catch (error) {
    console.error('Error loading warranties:', error)
    toast.error('Failed to load warranties data')
  } finally {
    setIsLoading(false)
  }
}

  useEffect(() => {
    loadWarranties()
  }, [])

  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = 
      warranty.warranty_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warranty.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warranty.device_info.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = isWarrantyActive(warranty.warranty_end_date)
    } else if (statusFilter === 'expired') {
      matchesStatus = !isWarrantyActive(warranty.warranty_end_date)
    }
    
    return matchesSearch && matchesStatus
  })

  const activeWarranties = warranties.filter(w => isWarrantyActive(w.warranty_end_date))
  const expiredWarranties = warranties.filter(w => !isWarrantyActive(w.warranty_end_date))
  const expiringSoon = warranties.filter(w => {
    const daysRemaining = getWarrantyDaysRemaining(w.warranty_end_date)
    return daysRemaining > 0 && daysRemaining <= 30
  })

  if (isLoading) {
    return (
      <DashboardLayout
        header={
          <PageHeader 
            title="Warranties Management" 
            description="Track and manage device warranties"
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
          title="Warranties Management" 
          description="Track and manage device warranties"
        />
      }
    >
      {/* Warranty Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Warranties</p>
              <p className="text-2xl font-bold text-green-600">{activeWarranties.length}</p>
            </div>
            <div className="gradient-success p-3 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{expiringSoon.length}</p>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </div>
            <div className="gradient-warning p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-red-600">{expiredWarranties.length}</p>
            </div>
            <div className="gradient-danger p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
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
              placeholder="Search warranties by ID, customer, or device..."
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
            <option value="all">All Warranties</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Warranty ID</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Purchase Date</th>
                <th>Warranty Period</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarranties.map((warranty) => {
                const isActive = isWarrantyActive(warranty.warranty_end_date)
                const daysRemaining = getWarrantyDaysRemaining(warranty.warranty_end_date)
                const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30
                
                return (
                  <tr key={warranty.id}>
                    <td className="font-mono text-sm font-medium">{warranty.warranty_id}</td>
                    <td className="font-medium">{warranty.customer_name}</td>
                    <td className="text-sm">{warranty.device_info}</td>
                    <td className="text-sm">{formatDate(warranty.warranty_start_date)}</td>
                    <td>
                      <span className="badge badge-info">
                        {warranty.warranty_duration.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-sm">
                      <div>
                        {formatDate(warranty.warranty_end_date)}
                        {isActive && (
                          <div className={`text-xs ${isExpiringSoon ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                            {daysRemaining} days left
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        isActive 
                          ? (isExpiringSoon ? 'badge-warning' : 'badge-success')
                          : 'badge-error'
                      }`}>
                        {isActive 
                          ? (isExpiringSoon ? 'Expiring Soon' : 'Active')
                          : 'Expired'
                        }
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-secondary p-1"
                        title="Download Warranty Certificate"
                        onClick={() => generateWarrantyCertificate(warranty)}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredWarranties.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'No warranties found matching your criteria.' 
              : 'No warranties found. Warranties are automatically created when devices are sold.'
            }
          </div>
        )}
      </div>

      {/* Auto-Generation Info */}
      <div className="glass-card mt-6">
        <div className="flex items-start gap-3">
          <div className="gradient-primary p-2 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Automatic Warranty Generation</h3>
            <p className="text-sm text-muted-foreground">
              Warranties are automatically created when devices are sold through the sales system. 
              The warranty period is determined by the device's warranty plan:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• <strong>6 months</strong> for trade-in devices</li>
              <li>• <strong>1 year</strong> for standard devices</li>
              <li>• <strong>2 years</strong> for premium devices</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Note:</strong> Warranties are not generated for sales originating from loans.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function generateWarrantyCertificate(warranty: Warranty) {
  // Create a simple warranty certificate
  const certificateContent = `
APPLE EMPIRE WARRANTY CERTIFICATE

Warranty ID: ${warranty.warranty_id}
Customer: ${warranty.customer_name}
Device: ${warranty.device_info}

Purchase Date: ${formatDate(warranty.warranty_start_date)}
Warranty Period: ${warranty.warranty_duration.replace('_', ' ')}
Warranty Expires: ${formatDate(warranty.warranty_end_date)}

Status: ${isWarrantyActive(warranty.warranty_end_date) ? 'ACTIVE' : 'EXPIRED'}

This warranty covers manufacturing defects and hardware failures under normal use.
For warranty claims, contact Apple Empire with this certificate.

Generated on: ${new Date().toLocaleDateString()}
  `.trim()

  // Create and download the certificate
  const blob = new Blob([certificateContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `warranty_${warranty.warranty_id}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success('Warranty certificate downloaded')
}