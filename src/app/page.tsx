'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Upload, Link2, HardDrive, Shield, Zap, Globe, 
  Files, Settings, LogOut, Cloud, Github, Check,
  Folder, Download, Trash2, Share2, Eye, X,
  Server, Key, Users, BarChart3, Copy, ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileRecord {
  id: string
  filename: string
  size: number
  mime_type: string
  created_at: string
  download_count: number
  folder: string
}

interface User {
  id: string
  email: string
  telegram_bot_token?: string
  telegram_chat_id?: string
  storage_used: number
  storage_limit: number
  is_admin?: boolean
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [urlToUpload, setUrlToUpload] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'files' | 'url' | 'settings'>('files')
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [testingBot, setTestingBot] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadFiles()
      if (!user.telegram_bot_token) {
        setShowOnboarding(true)
      }
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Get or create user record
      let { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!userData) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            storage_limit: 107374182400, // 100GB
          })
          .select()
          .single()
        userData = newUser
      }

      setUser(userData)
    }
    setLoading(false)
  }

  const loadFiles = async () => {
    if (!user) return
    
    const res = await fetch(`/api/files?user_id=${user.id}`)
    const data = await res.json()
    setFiles(Array.isArray(data) ? data : [])
  }

  const handleLogin = async () => {
    const email = prompt('Enter your email:')
    if (!email) return
    
    const password = prompt('Enter password (or leave blank for magic link):')
    
    if (password) {
      await supabase.auth.signInWithPassword({ email, password })
    } else {
      await supabase.auth.signInWithOtp({ email })
    }
    
    setTimeout(checkUser, 1000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setFiles([])
  }

  const handleFileUpload = async (fileList: FileList) => {
    if (!user || !user.telegram_bot_token) {
      setShowOnboarding(true)
      return
    }

    setUploading(true)
    
    for (const file of Array.from(fileList)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', user.id)
      
      try {
        await fetch('/api/files', {
          method: 'POST',
          body: formData,
        })
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
    
    await loadFiles()
    checkUser() // Refresh storage
    setUploading(false)
  }

  const handleUrlUpload = async () => {
    if (!urlToUpload || !user) return
    
    await fetch('/api/url-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: urlToUpload,
        user_id: user.id,
      }),
    })
    
    setUrlToUpload('')
    alert('URL upload started! Check files in a moment.')
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file?') || !user) return
    
    await fetch(`/api/files?id=${fileId}&user_id=${user.id}`, {
      method: 'DELETE',
    })
    
    loadFiles()
    checkUser()
  }

  const saveTelegramConfig = async () => {
    if (!user || !botToken || !chatId) return
    
    setTestingBot(true)
    
    // Test the bot
    try {
      const testRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
      const testData = await testRes.json()
      
      if (!testData.ok) {
        alert('Invalid bot token!')
        setTestingBot(false)
        return
      }
    } catch {
      alert('Failed to connect to Telegram')
      setTestingBot(false)
      return
    }

    await supabase
      .from('users')
      .update({
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
      })
      .eq('id', user.id)

    setUser({ ...user, telegram_bot_token: botToken, telegram_chat_id: chatId })
    setShowOnboarding(false)
    setTestingBot(false)
    alert('Telegram connected! You can now upload files.')
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0088cc]/20 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0088cc]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#229ed9]/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Nav */}
          <nav className="border-b border-white/5 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0088cc] to-[#229ed9] flex items-center justify-center shadow-lg shadow-[#0088cc]/20">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold tracking-tight">TG-Storage</span>
              </div>
              <button
                onClick={handleLogin}
                className="px-5 h-10 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-all text-sm"
              >
                Sign In
              </button>
            </div>
          </nav>

          {/* Hero */}
          <div className="max-w-7xl mx-auto px-6 pt-24 pb-32">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs mb-8"
              >
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-white/70">Free • Unlimited • Open Source</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.05] mb-6"
              >
                Unlimited cloud
                <br />
                <span className="bg-gradient-to-r from-[#0088cc] to-[#229ed9] bg-clip-text text-transparent">
                  powered by Telegram
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-white/60 leading-relaxed mb-10 max-w-2xl"
              >
                Turn Telegram into your personal S3-compatible storage. Upload via web, URL, or API. 
                No limits. No fees. Just your Telegram account.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4"
              >
                <button
                  onClick={handleLogin}
                  className="h-12 px-8 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                >
                  Start for free
                </button>
                <a
                  href="https://github.com/gps949/tg-s3"
                  target="_blank"
                  className="h-12 px-6 rounded-full bg-white/5 border border-white/10 font-medium hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur"
                >
                  <Github className="w-4 h-4" />
                  View source
                </a>
              </motion.div>
            </div>

            {/* Features grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-3 gap-px mt-24 bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-3xl"
            >
              {[
                { icon: HardDrive, title: 'Truly Unlimited', desc: 'Telegram gives you unlimited cloud storage. We just make it usable.' },
                { icon: Zap, title: 'Blazing Fast', desc: 'Direct Telegram CDN. Global edge locations. No throttling.' },
                { icon: Shield, title: 'Private & Secure', desc: 'Your bot, your storage. Files never touch our servers.' },
                { icon: Link2, title: 'URL Uploads', desc: 'Paste any URL and we\'ll fetch it directly to your Telegram.' },
                { icon: Globe, title: 'S3 Compatible', desc: 'Use with rclone, Cyberduck, or any S3 client.' },
                { icon: Server, title: 'API First', desc: 'Full REST API. Webhooks. Perfect for automation.' },
              ].map((feature, i) => (
                <div key={i} className="bg-[#0f0f10]/80 p-8 backdrop-blur-xl">
                  <feature.icon className="w-6 h-6 text-[#0088cc] mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  const storagePercent = (user.storage_used / user.storage_limit) * 100

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0088cc] to-[#229ed9] flex items-center justify-center">
                <Cloud className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-semibold">TG-Storage</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'files', label: 'Files', icon: Files },
                { id: 'url', label: 'URL Upload', icon: Link2 },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-8 px-3 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <div className="text-white/50">
                {formatBytes(user.storage_used)} / {formatBytes(user.storage_limit)}
              </div>
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0088cc] to-[#229ed9] transition-all"
                  style={{ width: `${Math.min(100, storagePercent)}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Upload Zone */}
        {activeTab === 'files' && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                if (e.dataTransfer.files.length) {
                  handleFileUpload(e.dataTransfer.files)
                }
              }}
              className={`relative mb-8 rounded-[1.5rem] border-2 border-dashed transition-all ${
                dragActive 
                  ? 'border-[#0088cc] bg-[#0088cc]/5' 
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <div className="px-8 py-12 text-center">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-white/5 items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-white/70" />
                </div>
                <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
                <p className="text-sm text-white/50 mb-6">Files are stored directly in your Telegram cloud</p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex h-10 px-5 items-center gap-2 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-all cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Choose files'}
                </label>
              </div>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.05] hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                      <Files className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate mb-1">{file.filename}</h4>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={`/api/download/${file.id}`}
                      className="flex-1 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {files.length === 0 && !uploading && (
                <div className="col-span-full py-24 text-center">
                  <Folder className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No files yet. Upload your first file above.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* URL Upload */}
        {activeTab === 'url' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0088cc]/20 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-[#0088cc]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Upload from URL</h2>
                  <p className="text-sm text-white/60">Fetch any file directly to your Telegram storage</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="url"
                    value={urlToUpload}
                    onChange={(e) => setUrlToUpload(e.target.value)}
                    placeholder="https://example.com/file.zip"
                    className="w-full h-12 px-4 bg-[#0f0f10] border border-white/10 rounded-xl focus:outline-none focus:border-[#0088cc]/50 focus:ring-2 focus:ring-[#0088cc]/20 transition-all text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlUpload()}
                  />
                </div>
                <button
                  onClick={handleUrlUpload}
                  disabled={!urlToUpload}
                  className="w-full h-12 rounded-xl bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Fetch and Upload
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-sm font-medium mb-3 text-white/70">Pro tips</h3>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" />
                    Works with direct download links, S3 URLs, and more
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" />
                    Large files are streamed directly to Telegram
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" />
                    Perfect for backing up from other clouds
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#0088cc]" />
                Telegram Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Bot Token</label>
                  <input
                    type="password"
                    value={botToken || user.telegram_bot_token || ''}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    className="w-full h-11 px-4 bg-[#0f0f10] border border-white/10 rounded-xl focus:outline-none focus:border-[#0088cc]/50 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Chat ID</label>
                  <input
                    type="text"
                    value={chatId || user.telegram_chat_id || ''}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="-1001234567890 or your user ID"
                    className="w-full h-11 px-4 bg-[#0f0f10] border border-white/10 rounded-xl focus:outline-none focus:border-[#0088cc]/50 text-sm font-mono"
                  />
                </div>
                <button
                  onClick={saveTelegramConfig}
                  disabled={testingBot || !botToken || !chatId}
                  className="h-11 px-6 rounded-xl bg-[#0088cc] hover:bg-[#0099e6] disabled:opacity-50 font-medium text-sm transition-colors"
                >
                  {testingBot ? 'Testing...' : 'Save Configuration'}
                </button>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#0088cc]/5 border border-[#0088cc]/20">
                <p className="text-xs text-white/70 leading-relaxed">
                  <strong className="text-white">Setup:</strong> 1) Message @BotFather → /newbot → copy token. 
                  2) Start your bot, then message @userinfobot to get your chat ID. 
                  3) Or create a private channel, add bot as admin, forward a message to @userinfobot.
                </p>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Server className="w-5 h-5 text-[#0088cc]" />
                API Access
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f0f10] border border-white/5">
                  <div>
                    <div className="text-sm font-medium">REST API</div>
                    <div className="text-xs text-white/50 font-mono mt-1">/api/files?user_id={user.id}</div>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f0f10] border border-white/5">
                  <div>
                    <div className="text-sm font-medium">rclone config</div>
                    <div className="text-xs text-white/50 mt-1">S3-compatible endpoint</div>
                  </div>
                  <button className="px-3 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium transition-colors">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setShowOnboarding(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#141416] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0088cc] to-[#229ed9] flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Connect Telegram</h2>
                      <p className="text-sm text-white/60">2-minute setup</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {[
                    { step: 1, title: 'Create a bot', desc: 'Message @BotFather on Telegram, send /newbot' },
                    { step: 2, title: 'Copy the token', desc: 'BotFather gives you a token like 123456:ABC...' },
                    { step: 3, title: 'Get your chat ID', desc: 'Message @userinfobot or create a private channel' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-sm font-medium">
                        {item.step}
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">{item.title}</div>
                        <div className="text-xs text-white/60">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Bot token"
                    className="w-full h-12 px-4 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:border-[#0088cc] text-sm"
                  />
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="Chat ID"
                    className="w-full h-12 px-4 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:border-[#0088cc] text-sm"
                  />
                </div>
              </div>

              <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-white/50">Your data stays in your Telegram</p>
                <button
                  onClick={saveTelegramConfig}
                  disabled={!botToken || !chatId || testingBot}
                  className="h-10 px-6 rounded-full bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 text-sm transition-all"
                >
                  {testingBot ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}