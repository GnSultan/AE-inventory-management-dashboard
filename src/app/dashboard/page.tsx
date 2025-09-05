'use client'

import React, { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout, PageHeader } from '@/components/dashboard-layout'
import { supabaseQueries } from '@/lib/supabase'
import { formatDate, formatNumber, calculateTrend } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Smartphone, 
  Package, 
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingCart
} from 'lucide-react'
import type { Sale } from '@/lib/types'
import { toast } from 'sonner'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart, 
  Pie, 
  Cell,
  BarChart, 
  Bar,
  Legend
} from 'recharts'

// Add formatCurrency function if it's not in utils
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-2 text-sm">
        <p className="font-bold">{label}</p>
        <p className="text-blue-400">{`Sales: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// Lazy load charts for performance
const LazyLineChart = dynamic(() => Promise.resolve(LineChart), { ssr: false });
const LazyPieChart = dynamic(() => Promise.resolve(PieChart), { ssr: false });
const LazyBarChart = dynamic(() => Promise.resolve(BarChart), { ssr: false });

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({})
  const [chartData, setChartData] = useState<any>({})
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [dailySales, setDailySales] = useState<Sale[]>([])
  const [currentDateOffset, setCurrentDateOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const [devices, gadgets, sales, lowStock] = await Promise.all([
        supabaseQueries.getDevices(),
        supabaseQueries.getGadgets(),
        supabaseQueries.getSalesData(60), // Fetch 60 days for trend comparison
        supabaseQueries.getLowStockAlerts()
      ])

      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0))

      const weekAgo = new Date(new Date().setDate(today.getDate() - 7))
      const monthAgo = new Date(new Date().setDate(today.getDate() - 30))
      const prevWeekStart = new Date(new Date().setDate(today.getDate() - 14))
      const prevMonthStart = new Date(new Date().setDate(today.getDate() - 60))

      const weeklySalesCount = sales.filter(s => new Date(s.date_sold) >= weekAgo).length
      const monthlySalesCount = sales.filter(s => new Date(s.date_sold) >= monthAgo).length
      const prevWeeklySalesCount = sales.filter(s => new Date(s.date_sold) >= prevWeekStart && new Date(s.date_sold) < weekAgo).length
      const prevMonthlySalesCount = sales.filter(s => new Date(s.date_sold) >= prevMonthStart && new Date(s.date_sold) < monthAgo).length

      const totalDevices = devices.filter(d => d.status === 'available').length
      const totalGadgets = gadgets.reduce((sum, g) => sum + g.quantity, 0)

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
        weeklySales: weeklySalesCount,
        monthlySales: monthlySalesCount,
        avgDailySales: monthlySalesCount / 30,
        avgMonthlySales,
        weeklyTrend: calculateTrend(weeklySalesCount, prevWeeklySalesCount),
        monthlyTrend: calculateTrend(monthlySalesCount, prevMonthlySalesCount),
      })
      
      // -- Chart Data Processing --
      const salesLast30Days = sales.filter(s => new Date(s.date_sold) >= monthAgo)

      // Sales trend (line chart)
      const salesByDay = salesLast30Days.reduce((acc, sale) => {
        const date = formatDate(sale.date_sold, 'MMM dd')
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const salesTrendData = Object.entries(salesByDay).map(([date, sales]) => ({ date, sales })).reverse()

      // Sales by brand (doughnut chart)
      const brandSales = salesLast30Days.reduce((acc, sale) => {
        const brand = sale.item_description.split(' ')[0] || 'Unknown'
        acc[brand] = (acc[brand] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const brandData = Object.entries(brandSales).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5)

      // Weekly performance (bar chart)
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weeklyPerformance = Array(7).fill(0)
      salesLast30Days.forEach(sale => {
        const dayIndex = new Date(sale.date_sold).getUTCDay()
        weeklyPerformance[dayIndex]++
      })
      const weeklyPerformanceData = weeklyPerformance.map((sales, i) => ({ name: daysOfWeek[i], sales }))

      setChartData({ salesTrendData, brandData, weeklyPerformanceData })
      setLowStockItems(lowStock)
      setDailySales(sales)
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
  }, [])

  const { todaySales, yesterdaySales } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + currentDateOffset)
    targetDate.setHours(0,0,0,0)
    
    const filtered = dailySales.filter(s => {
      const saleDate = new Date(s.date_sold)
      saleDate.setHours(0,0,0,0)
      return saleDate.getTime() === targetDate.getTime()
    })
    return { todaySales: filtered, yesterdaySales: [] }
  }, [dailySales, currentDateOffset])

  const getDateDisplayLabel = () => {
    if (currentDateOffset === 0) return 'Today'
    if (currentDateOffset === -1) return 'Yesterday'
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + currentDateOffset)
    return formatDate(targetDate, 'EEE, MMM dd')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card animate-pulse h-24">
              <div className="h-4 bg-white/20 rounded mb-3 w-3/4"></div>
              <div className="h-8 bg-white/20 rounded mb-2 w-1/2"></div>
              <div className="h-3 bg-white/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader 
        title="Dashboard" 
        description={`Real-time insights for ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Devices" value={formatNumber(stats.totalDevices)} icon={Smartphone} />
        <KPICard title="Total Gadgets" value={formatNumber(stats.totalGadgets)} icon={Package} />
        <KPICard title="Weekly Sales" value={formatNumber(stats.weeklySales)} icon={ShoppingCart} trend={stats.weeklyTrend} />
        <KPICard title="Monthly Sales" value={formatNumber(stats.monthlySales)} icon={Calendar} trend={stats.monthlyTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Charts - takes 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <h3 className="text-lg font-semibold mb-4">Sales Velocity & Trends (Last 30 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LazyLineChart data={chartData.salesTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(var(--accent-rgb), 0.1)' }}/>
                  <Line type="monotone" dataKey="sales" stroke="var(--accent-color)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                </LazyLineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card">
              <h3 className="text-lg font-semibold mb-4">Sales by Brand</h3>
              <div className="h-60">
                 <ResponsiveContainer width="100%" height="100%">
                    <LazyPieChart>
                      <Pie data={chartData.brandData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                        {chartData.brandData?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </LazyPieChart>
                  </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card">
              <h3 className="text-lg font-semibold mb-4">Weekly Performance</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LazyBarChart data={chartData.weeklyPerformanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(var(--accent-rgb), 0.1)' }}/>
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </LazyBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Side Column - takes 1/3 width */}
        <div className="space-y-6">
          <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Daily Sales Explorer</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentDateOffset(prev => prev - 1)} className="btn-secondary p-1.5"><ChevronLeft className="h-4 w-4"/></button>
                <span className="text-sm font-medium w-24 text-center">{getDateDisplayLabel()}</span>
                <button onClick={() => setCurrentDateOffset(prev => prev + 1)} disabled={currentDateOffset >= 0} className="btn-secondary p-1.5 disabled:opacity-50"><ChevronRight className="h-4 w-4"/></button>
              </div>
            </div>
            <div className="space-y-3 h-64 overflow-y-auto pr-2">
              {todaySales.length > 0 ? todaySales.map(sale => (
                <div key={sale.id} className="text-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium">{sale.item_description}</p>
                    <p className="text-muted-foreground text-xs">{sale.customer_name}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(Number(sale.sale_price))}</p>
                </div>
              )) : (
                <div className="text-center text-muted-foreground pt-16">No sales for this day.</div>
              )}
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-semibold mb-4">Stock Alerts</h3>
            <div className="space-y-3 h-64 overflow-y-auto pr-2">
              {lowStockItems.length > 0 ? lowStockItems.map((item: any) => (
                <div key={`${item.type}-${item.brand}-${item.model}`} className="text-sm flex justify-between items-center">
                   <div>
                    <p className="font-medium">{item.brand} {item.model}</p>
                    <p className="text-muted-foreground text-xs capitalize">{item.type}</p>
                  </div>
                  <span className={`font-bold text-sm ${item.stock_count <= 2 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {item.stock_count} left
                  </span>
                </div>
              )) : (
                 <div className="text-center text-muted-foreground pt-16">Inventory levels are healthy!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function KPICard({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: React.ElementType, trend?: number }) {
  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase">{title}</h3>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(trend).toFixed(0)}% vs prev period
        </div>
      )}
    </div>
  )
}