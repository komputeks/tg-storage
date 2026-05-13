import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  
  const [users, files] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('files').select('size', { count: 'exact' }),
  ])

  const totalStorage = files.data?.reduce((sum, f) => sum + (f.size || 0), 0) || 0

  return NextResponse.json({
    totalUsers: users.count || 0,
    totalFiles: files.count || 0,
    totalStorage,
  })
}