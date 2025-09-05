'use client'

import React from 'react'
import { Navigation, MobileHeader } from './navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export function DashboardLayout({ children, header }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <MobileHeader />
      
      <main className="flex-1 md:ml-64">
        <div className="md:p-6 p-4 mt-16 md:mt-0">
          {header && (
            <div className="mb-6 animate-fade-in">
              {header}
            </div>
          )}
          
          <div className="animate-slide-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="glass-header">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}