// src/lib/supabase-server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Server-side Supabase client (only use in Server Components)
export const createServerClient = () => createServerComponentClient<Database>({ cookies })