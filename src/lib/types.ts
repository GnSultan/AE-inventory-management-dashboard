// src/lib/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string
          name: string
          contact_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          customer_id?: string | null
          customer_name?: string
          sale_type?: string
          sale_price?: number
          sale_source?: 'inventory' | 'loan' | 'trade_in'
          device_id?: string | null
          gadget_id?: string | null
          gadget_quantity?: number | null
          item_description?: string
          loan_id?: string | null
          date_sold?: string
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          loan_id: string
          loaner_name: string
          loaner_contact: string | null
          device_id: string | null
          gadget_id: string | null
          gadget_quantity: number | null
          item_description: string
          status: 'active' | 'returned' | 'sold'
          date_loaned: string
          date_returned: string | null
          expected_return_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          loan_id?: string
          loaner_name: string
          loaner_contact?: string | null
          device_id?: string | null
          gadget_id?: string | null
          gadget_quantity?: number | null
          item_description: string
          status?: 'active' | 'returned' | 'sold'
          date_loaned?: string
          date_returned?: string | null
          expected_return_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          loaner_name?: string
          loaner_contact?: string | null
          device_id?: string | null
          gadget_id?: string | null
          gadget_quantity?: number | null
          item_description?: string
          status?: 'active' | 'returned' | 'sold'
          date_loaned?: string
          date_returned?: string | null
          expected_return_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      warranties: {
        Row: {
          id: string
          warranty_id: string
          sale_id: string
          device_id: string
          customer_name: string
          device_info: string
          warranty_start_date: string
          warranty_end_date: string
          warranty_duration: '6_months' | '1_year' | '2_years'
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          warranty_id?: string
          sale_id: string
          device_id: string
          customer_name: string
          device_info: string
          warranty_start_date?: string
          warranty_end_date?: string
          warranty_duration: '6_months' | '1_year' | '2_years'
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          warranty_id?: string
          sale_id?: string
          device_id?: string
          customer_name?: string
          device_info?: string
          warranty_start_date?: string
          warranty_end_date?: string
          warranty_duration?: '6_months' | '1_year' | '2_years'
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      active_inventory: {
        Row: {
          type: string
          id: string
          identifier: string
          brand: string
          model: string
          color: string | null
          capacity: string | null
          quantity: number
          status: string
          date_added: string
          supplier_name: string | null
        }
      }
      low_stock_alerts: {
        Row: {
          type: string
          brand: string
          model: string
          stock_count: number
        }
      }
    }
    Enums: {
      device_status: 'available' | 'loaned' | 'sold' | 'trade_in'
      sale_source: 'inventory' | 'loan' | 'trade_in'
      warranty_plan: '6_months' | '1_year' | '2_years'
      loan_status: 'active' | 'returned' | 'sold'
    }
  }
}

// Extended types for our application
export type Device = Database['public']['Tables']['devices']['Row'] & {
  supplier?: { name: string }
}

export type Gadget = Database['public']['Tables']['gadgets']['Row'] & {
  supplier?: { name: string }
}

export type Sale = Database['public']['Tables']['sales']['Row']

export type Loan = Database['public']['Tables']['loans']['Row']

export type Warranty = Database['public']['Tables']['warranties']['Row']

export type Supplier = Database['public']['Tables']['suppliers']['Row']

export type InventoryItem = Database['public']['Views']['active_inventory']['Row']

export type LowStockAlert = Database['public']['Views']['low_stock_alerts']['Row']

// Form types for adding new records
export type AddDeviceForm = {
  imei_serial: string
  brand: string
  model: string
  capacity?: string
  color?: string
  warranty_plan: '6_months' | '1_year' | '2_years'
  source?: string
  supplier_id?: string
  purchase_price?: number
}

export type AddGadgetForm = {
  brand: string
  model: string
  quantity: number
  supplier_id?: string
  purchase_price?: number
}

export type CreateSaleForm = {
  customer_name: string
  sale_type: 'retail' | 'trade_in' | 'wholesale'
  sale_price: number
  item_type: 'device' | 'gadget'
  item_id: string
  gadget_quantity?: number
}

export type CreateLoanForm = {
  loaner_name: string
  loaner_contact?: string
  item_type: 'device' | 'gadget'
  item_id: string
  gadget_quantity?: number
  expected_return_date?: string
  notes?: string
}

// Dashboard data types
export type DashboardStats = {
  totalDevices: number
  totalGadgets: number
  weeklySales: number
  monthlySales: number
  avgDailySales: number
  avgMonthlySales: number
  weeklyTrend: number
  monthlyTrend: number
}

export type SalesChartData = {
  date: string
  sales: number
  revenue: number
}

export type BrandSalesData = {
  brand: string
  sales: number
  revenue: number
}

// Navigation and UI types
export type NavItem = {
  title: string
  href: string
  icon: string
  badge?: number
}

export type Theme = 'light' | 'dark' | 'system'

export type AlertType = 'info' | 'success' | 'warning' | 'error'
          id?: string
          name?: string
          contact_info?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          imei_serial: string
          brand: string
          model: string
          capacity: string | null
          color: string | null
          warranty_plan: 'six_months' | 'one_year' | 'two_years'
          source: string | null
          supplier_id: string | null
          status: 'available' | 'loaned' | 'sold' | 'trade_in'
          purchase_price: number | null
          date_added: string
          date_sold: string | null
          date_loaned: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          imei_serial: string
          brand: string
          model: string
          capacity?: string | null
          color?: string | null
          warranty_plan?: 'six_months' | 'one_year' | 'two_years'
          source?: string | null
          supplier_id?: string | null
          status?: 'available' | 'loaned' | 'sold' | 'trade_in'
          purchase_price?: number | null
          date_added?: string
          date_sold?: string | null
          date_loaned?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          imei_serial?: string
          brand?: string
          model?: string
          capacity?: string | null
          color?: string | null
          warranty_plan?: 'six_months' | 'one_year' | 'two_years'
          source?: string | null
          supplier_id?: string | null
          status?: 'available' | 'loaned' | 'sold' | 'trade_in'
          purchase_price?: number | null
          date_added?: string
          date_sold?: string | null
          date_loaned?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gadgets: {
        Row: {
          id: string
          inventory_id: string
          brand: string
          model: string
          quantity: number
          supplier_id: string | null
          purchase_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inventory_id?: string
          brand: string
          model: string
          quantity?: number
          supplier_id?: string | null
          purchase_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inventory_id?: string
          brand?: string
          model?: string
          quantity?: number
          supplier_id?: string | null
          purchase_price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          sale_id: string
          customer_id: string | null
          customer_name: string
          sale_type: string
          sale_price: number
          sale_source: 'inventory' | 'loan' | 'trade_in'
          device_id: string | null
          gadget_id: string | null
          gadget_quantity: number | null
          item_description: string
          loan_id: string | null
          date_sold: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_id?: string
          customer_id?: string | null
          customer_name: string
          sale_type?: string
          sale_price: number
          sale_source?: 'inventory' | 'loan' | 'trade_in'
          device_id?: string | null
          gadget_id?: string | null
          gadget_quantity?: number | null
          item_description: string
          loan_id?: string | null
          date_sold?: string
          created_at?: string
          updated_at?: string
        }
        Update: {