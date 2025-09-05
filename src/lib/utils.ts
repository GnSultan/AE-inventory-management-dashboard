// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isValid, parseISO, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatDate = (date: string | Date, formatStr = 'MMM dd, yyyy') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isValid(dateObj) ? format(dateObj, formatStr) : 'Invalid Date'
}

export const formatDateTime = (date: string | Date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export const formatCurrency = (amount: number, currency = 'TZS') => {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num)
}

// Generate item descriptions
export const generateItemDescription = (item: {
  brand: string
  model: string
  capacity?: string | null
  color?: string | null
}) => {
  const parts = [item.brand, item.model]
  if (item.capacity) parts.push(item.capacity)
  if (item.color) parts.push(item.color)
  return parts.join(' ')
}

// Warranty calculations
export const calculateWarrantyEndDate = (
  startDate: Date,
  plan: '6_months' | '1_year' | '2_years'
): Date => {
  const endDate = new Date(startDate)
  switch (plan) {
    case '6_months':
      endDate.setMonth(endDate.getMonth() + 6)
      break
    case '1_year':
      endDate.setFullYear(endDate.getFullYear() + 1)
      break
    case '2_years':
      endDate.setFullYear(endDate.getFullYear() + 2)
      break
  }
  return endDate
}

export const isWarrantyActive = (endDate: string | Date): boolean => {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  return isValid(end) && end > new Date()
}

export const getWarrantyDaysRemaining = (endDate: string | Date): number => {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  if (!isValid(end)) return 0
  return Math.max(0, differenceInDays(end, new Date()))
}

// Status color mappings
export const getStatusColor = (status: string) => {
  const colors = {
    available: 'bg-green-100 text-green-800 border-green-200',
    loaned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    sold: 'bg-blue-100 text-blue-800 border-blue-200',
    trade_in: 'bg-purple-100 text-purple-800 border-purple-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    returned: 'bg-gray-100 text-gray-800 border-gray-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Search and filter utilities
export const searchItems = <T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!query.trim()) return items

  const lowercaseQuery = query.toLowerCase()
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field]
      return value && 
        String(value).toLowerCase().includes(lowercaseQuery)
    })
  )
}

export const sortItems = <T>(
  items: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal === bVal) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    
    const comparison = aVal < bVal ? -1 : 1
    return direction === 'asc' ? comparison : -comparison
  })
}

// Validation utilities
export const validateIMEI = (imei: string): boolean => {
  // Basic IMEI validation (15 digits)
  const imeiRegex = /^\d{15}$/
  return imeiRegex.test(imei.replace(/\s|-/g, ''))
}

export const validateSerialNumber = (serial: string): boolean => {
  // Basic serial number validation (alphanumeric, 6-20 chars)
  const serialRegex = /^[A-Za-z0-9]{6,20}$/
  return serialRegex.test(serial)
}

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic phone number validation for Tanzania
  const phoneRegex = /^(\+255|0)[67]\d{8}$/
  return phoneRegex.test(phone.replace(/\s|-/g, ''))
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Animation utilities
export const animateValue = (
  element: HTMLElement,
  start: number,
  end: number,
  duration: number,
  decimals = 0
) => {
  const startTime = Date.now()
  
  const tick = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const current = start + (end - start) * progress
    
    element.textContent = current.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }
  
  tick()
}

// Local storage utilities (with error handling)
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Silently fail
    }
  },
  
  remove: (key: string): void => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Silently fail
    }
  }
}

// Dashboard calculation utilities
export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const groupSalesByDate = (sales: any[]) => {
  return sales.reduce((acc, sale) => {
    const date = format(parseISO(sale.date_sold), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = { sales: 0, revenue: 0 }
    }
    acc[date].sales += 1
    acc[date].revenue += parseFloat(sale.sale_price)
    return acc
  }, {} as Record<string, { sales: number; revenue: number }>)
}

export const groupSalesByBrand = (sales: any[]) => {
  return sales.reduce((acc, sale) => {
    // Extract brand from item_description
    const brand = sale.item_description.split(' ')[0] || 'Unknown'
    if (!acc[brand]) {
      acc[brand] = { sales: 0, revenue: 0 }
    }
    acc[brand].sales += 1
    acc[brand].revenue += parseFloat(sale.sale_price)
    return acc
  }, {} as Record<string, { sales: number; revenue: number }>)
}

// Error handling utilities
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

// ID generation utilities (for offline use)
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Device type detection
export const getDeviceType = (model: string): 'phone' | 'laptop' | 'tablet' | 'other' => {
  const modelLower = model.toLowerCase()
  
  if (modelLower.includes('iphone') || modelLower.includes('galaxy') || 
      modelLower.includes('pixel') || modelLower.includes('phone')) {
    return 'phone'
  }
  
  if (modelLower.includes('macbook') || modelLower.includes('laptop') || 
      modelLower.includes('thinkpad') || modelLower.includes('surface laptop')) {
    return 'laptop'
  }
  
  if (modelLower.includes('ipad') || modelLower.includes('tablet') || 
      modelLower.includes('surface pro')) {
    return 'tablet'
  }
  
  return 'other'
}

// Text truncation
export const truncateText = (text: string, length: number) => {
  return text.length > length ? `${text.substring(0, length)}...` : text
}