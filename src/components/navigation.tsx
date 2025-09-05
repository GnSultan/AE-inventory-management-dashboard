'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  HandCoins, 
  Shield, 
  Users, 
  Settings,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'
import { cn } from '../lib/utils'
import type { NavItem } from '../lib/types'

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { title: 'Inventory', href: '/inventory', icon: 'Package' },
  { title: 'Sales', href: '/sales', icon: 'ShoppingCart' },
  { title: 'Loans', href: '/loans', icon: 'HandCoins' },
  { title: 'Warranties', href: '/warranties', icon: 'Shield' },
  { title: 'Customers', href: '/customers', icon: 'Users' },
  { title: 'Settings', href: '/settings', icon: 'Settings' },
]

const iconMap = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  HandCoins,
  Shield,
  Users,
  Settings,
}

export function Navigation() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden glass p-2 rounded-lg"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Navigation sidebar */}
      <nav
        className={cn(
          'fixed top-0 left-0 h-full w-64 glass border-r border-white/10 z-40 transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-accent p-2 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Apple Empire</h1>
                <p className="text-sm text-muted-foreground">Inventory System</p>
              </div>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              const isActive = pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200',
                    'hover:bg-white/10 dark:hover:bg-black/10',
                    isActive && 'bg-accent/80 text-white border-l-4 border-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto badge-error">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Theme selector */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg glass hover:bg-white/10 dark:hover:bg-black/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {mounted ? (
                  <>
                    {theme === 'light' && <Sun className="h-5 w-5" />}
                    {theme === 'dark' && <Moon className="h-5 w-5" />}
                    {(theme === 'system' || !theme) && <Monitor className="h-5 w-5" />}
                  </>
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
                <span className="font-medium">Theme</span>
              </div>
              <ChevronDown 
                className={cn(
                  'h-4 w-4 transition-transform',
                  isThemeMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {mounted && isThemeMenuOpen && (
              <div className="absolute bottom-full mb-2 w-full glass rounded-lg border border-white/20 overflow-hidden">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value)
                        setIsThemeMenuOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center space-x-3 px-3 py-2 hover:bg-white/10 dark:hover:bg-black/10 transition-colors',
                        theme === option.value && 'bg-white/20 dark:bg-black/20'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

export function MobileHeader() {
// ... existing code ...


