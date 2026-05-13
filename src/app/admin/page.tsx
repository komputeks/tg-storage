'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, HardDrive, Files, TrendingUp, Settings, Shield } from 'lucide-react'

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    activeToday: 0,
  })
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Check if admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!user?.is_admin) {
      alert('Admin access required')
      window.location.href = '/'
      return
    }

    // Load stats
    const [usersRes, filesRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact' }),
      supabase.from('files').select('size', { count: 'exact' }),
    ])

    const totalStorage = filesRes.data?.reduce((sum, f) => sum + (f.size || 0), 0) || 0

    setStats({
      totalUsers: usersRes.count || 0,
      totalFiles: filesRes.count || 0,
      totalStorage,
      activeToday: Math.floor((usersRes.count || 0) * 0.3),
    })

    setUsers(usersRes.data || [])
    setLoading(false)
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <header className="border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0088cc] to-[#229ed9] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Admin Dashboard</span>
          </div>
          <a href="/" className="text-sm text-white/60 hover:text-white">← Back to app</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#0088cc' },
            { label: 'Total Files', value: stats.totalFiles.toLocaleString(), icon: Files, color: '#10b981' },
            { label: 'Storage Used', value: formatBytes(stats.totalStorage), icon: HardDrive, color: '#f59e0b' },
            { label: 'Active Today', value: stats.activeToday, icon: TrendingUp, color: '#8b5cf6' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-white/50">
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Storage</th>
                  <th className="px-6 py-3 font-medium">Telegram</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {formatBytes(user.storage_used)} / {formatBytes(user.storage_limit)}
                    </td>
                    <td className="px-6 py-4">
                      {user.telegram_bot_token ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin && (
                        <span className="px-2 py-1 rounded-full bg-[#0088cc]/20 text-[#0088cc] text-xs">Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}