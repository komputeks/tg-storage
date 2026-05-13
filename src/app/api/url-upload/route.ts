import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'
import { TelegramStorage } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const { url, user_id, filename } = await request.json()
    
    if (!url || !user_id) {
      return NextResponse.json({ error: 'url and user_id required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Create upload record
    const { data: upload, error: uploadError } = await supabase
      .from('url_uploads')
      .insert({
        user_id,
        source_url: url,
        filename,
        status: 'downloading',
      })
      .select()
      .single()

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Process in background (in real app, use queue)
    processUrlUpload(upload.id, url, user_id, filename).catch(console.error)

    return NextResponse.json(upload)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function processUrlUpload(uploadId: string, url: string, userId: string, filename?: string) {
  const supabase = createServerClient()
  
  try {
    // Get user config
    const { data: user } = await supabase
      .from('users')
      .select('telegram_bot_token, telegram_chat_id, storage_used, storage_limit')
      .eq('id', userId)
      .single()

    if (!user?.telegram_bot_token) {
      throw new Error('Telegram not configured')
    }

    await supabase
      .from('url_uploads')
      .update({ status: 'downloading', progress: 10 })
      .eq('id', uploadId)

    // Download file
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
    
    const contentLength = parseInt(response.headers.get('content-length') || '0')
    const buffer = await response.arrayBuffer()
    const actualFilename = filename || url.split('/').pop()?.split('?')[0] || 'download'

    await supabase
      .from('url_uploads')
      .update({ status: 'uploading', progress: 50 })
      .eq('id', uploadId)

    // Check storage
    if (user.storage_used + buffer.byteLength > user.storage_limit) {
      throw new Error('Storage limit exceeded')
    }

    // Upload to Telegram
    const telegram = new TelegramStorage(user.telegram_bot_token, user.telegram_chat_id)
    const blob = new Blob([buffer])
    const file = new File([blob], actualFilename)
    const tgFile = await telegram.uploadFile(file, actualFilename)

    // Save file record
    const { data: fileRecord } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        filename: actualFilename,
        size: buffer.byteLength,
        mime_type: response.headers.get('content-type') || 'application/octet-stream',
        telegram_file_id: tgFile.file_id,
        telegram_unique_id: tgFile.file_unique_id,
      })
      .select()
      .single()

    // Update storage
    await supabase
      .from('users')
      .update({ storage_used: user.storage_used + buffer.byteLength })
      .eq('id', userId)

    // Mark complete
    await supabase
      .from('url_uploads')
      .update({
        status: 'completed',
        progress: 100,
        file_id: fileRecord?.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', uploadId)

  } catch (error: any) {
    await supabase
      .from('url_uploads')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', uploadId)
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const userId = request.nextUrl.searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('url_uploads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}