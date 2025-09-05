'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout, PageHeader } from '@/components/dashboard-layout'
import { supabaseQueries } from '@/lib/supabase'
import { formatCurrency, formatNumber, calculateTrend, groupSalesByDate, groupSalesByBrand } from '@/lib/utils'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Smartphone, 
  Package, 
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import type { DashboardStats, SalesChartData, BrandSalesData } from '@/lib/types'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    totalGadgets: 0,
    weeklySales: 0,
    monthlySales: 0,
    avgDailySales: 0,
    avgMonthlySales: 0,
    weeklyTrend: 0,
    monthlyTrend: 0,
  })
  const [salesData, setSalesData] = useState<SalesChartData[]>([])
  const [brandData, setBrandData] = useState<BrandSalesData[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load all data concurrently
      const [devices, gadgets, sales, lowStock] = await Promise.all([
        supabaseQueries.getDevices(),
        supabaseQueries.getGadgets(),
        supabaseQueries.getSalesData(30),
        supabaseQueries.getLowStockAlerts()
      ])

      // Calculate statistics
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      const monthAgo = new Date(today)
      monthAgo.setDate(today.getDate() - 30)
      const prevWeekStart = new Date(weekAgo)
      prevWeekStart.setDate(weekAgo.getDate() - 7)
      const prevMonthStart = new Date(monthAgo)
      prevMonthStart.setDate(monthAgo.getDate() - 30)

      const weeklySales = sales.filter(s => new Date(s.date_sold) >= weekAgo).length
      const monthlySales = sales.filter(s => new Date(s.date_sold) >= monthAgo).length
      const prevWeeklySales = sales.filter(s => {
        const date = new Date(s.date_sold)
        return date >= prevWeekStart && date < weekAgo
      }).length
      const prevMonthlySales = sales.filter(s => {
        const date = new Date(s.date_sold)
        return date >= prevMonthStart && date < monthAgo
      }).length

      const totalDevices = devices.filter(d => d.status === 'available').length
      const totalGadgets = gadgets.reduce((sum, g) => sum + g.quantity, 0)

      // Calculate monthly averages
      const salesByMonth = sales.reduce((acc: Record<string, number>, sale) => {
        const monthKey = new Date(sale.date_sold).toISOString().substring(0, 7)
        acc[monthKey] = (acc[monthKey] || 0) + 1
        return acc
      }, {})
      
      const monthlyValues = Object.values(salesByMonth)
      const avgMonthlySales = monthlyValues.length > 0 
        ? monthlyValues.reduce((sum, count) => sum + count, 0) / monthlyValues.length 
        : 0

      setStats({
        totalDevices,
        totalGadgets,
        weeklySales,
        monthlySales,
        avgDailySales: monthlySales / 30,
        avgMonthlySales,
        weeklyTrend: calculateTrend(weeklySales, prevWeeklySales),
        monthlyTrend: calculateTrend(monthlySales, prevMonthlySales),
      })

      // Process chart data
      const dailySales = groupSalesByDate(sales)
      const chartData: SalesChartData[] = Object.entries(dailySales)
        .map(([date, data]) => ({
          date,
          sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14) // Last 14 days

      setSalesData(chartData)

      // Process brand data
      const brandSales = groupSalesByBrand(sales)
      const brandChartData: BrandSalesData[] = Object.entries(brandSales)
        .map(([brand, data]) => ({
          brand,
          sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 6)

      setBrandData(brandChartData)
      setLowStockItems(lowStock)
      setLastUpdated(new Date())

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  if (isLoading) {
    return (
      <DashboardLayout
        header={
          <PageHeader 
            title="Dashboard" 
            description="Real-time insights and analytics for your inventory"
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-3"></div>
              <div className="h-8 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      header={
        <PageHeader 
          title="Dashboard" 
          description="Real-time insights and analytics for your inventory"
          actions={
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <button
                onClick={loadDashboardData}
                className="btn-secondary p-2"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          }
        />
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Devices"
          value={stats.totalDevices}
          icon={<Smartphone className="h-5 w-5" />}
          subtitle="Available in stock"
          gradient="gradient-primary"
        />
        
        <KPICard
          title="Total Gadgets"
          value={stats.totalGadgets}
          icon={<Package className="h-5 w-5" />}
          subtitle="Items in stock"
          gradient="gradient-success"
        />
        
        <KPICard
          title="Weekly Sales"
          value={stats.weeklySales}
          icon={<Calendar className="h-5 w-5" />}
          subtitle="Past 7 days"
          trend={stats.weeklyTrend}
          gradient="gradient-warning"
        />
        
        <KPICard
          title="Monthly Sales"
          value={stats.monthlySales}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="Past 30 days"
          trend={stats.monthlyTrend}
          gradient="gradient-danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Trend (14 Days)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Sales Chart */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sales by Brand</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ brand, sales }) => `${brand}: ${sales}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sales"
                >
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Stock Alerts ({lowStockItems.length})
          </h3>
        </div>
        
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <span className="badge-info capitalize">{item.type}</span>
                    </td>
                    <td className="font-medium">{item.brand}</td>
                    <td>{item.model}</td>
                    <td>
                      <span className={`font-bold ${item.stock_count <= 1 ? 'text-red-500' : 'text-yellow-500'}`}>
                        {item.stock_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No low stock items found. All inventory levels are healthy!
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}

interface KPICardProps {
  title: string
  value: number
  icon: React.ReactNode
  subtitle: string
  trend?: number
  gradient: string
}

function KPICard({ title, value, icon, subtitle, trend, gradient }: KPICardProps) {
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className={`${gradient} p-2 rounded-lg text-white`}>
          {icon}
        </div>
      </div>
      
      <div className="text-2xl font-bold mb-2">
        {formatNumber(value)}
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{subtitle}</span>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  )
}