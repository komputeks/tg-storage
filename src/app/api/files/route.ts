import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { TelegramStorage } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const userId = request.nextUrl.searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const userId = formData.get('user_id') as string
    const folder = (formData.get('folder') as string) || '/'

    if (!file || !userId) {
      return NextResponse.json({ error: 'file and user_id required' }, { status: 400 })
    }

    // Get user's Telegram config
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('telegram_bot_token, telegram_chat_id, storage_used, storage_limit')
      .eq('id', userId)
      .single()

    if (userError || !user?.telegram_bot_token || !user?.telegram_chat_id) {
      return NextResponse.json({ 
        error: 'Telegram not configured. Please set up your bot in settings.' 
      }, { status: 400 })
    }

    // Check storage limit
    const newSize = user.storage_used + file.size
    if (newSize > user.storage_limit) {
      return NextResponse.json({ error: 'Storage limit exceeded' }, { status: 400 })
    }

    // Upload to Telegram
    const telegram = new TelegramStorage(user.telegram_bot_token, user.telegram_chat_id)
    const tgFile = await telegram.uploadFile(file, file.name)

    // Save to database
    const { data: fileRecord, error: insertError } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        filename: file.name,
        size: file.size,
        mime_type: file.type,
        telegram_file_id: tgFile.file_id,
        telegram_unique_id: tgFile.file_unique_id,
        folder,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Update storage used
    await supabase
      .from('users')
      .update({ storage_used: newSize })
      .eq('id', userId)

    return NextResponse.json(fileRecord)
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('id')
  const userId = searchParams.get('user_id')

  if (!fileId || !userId) {
    return NextResponse.json({ error: 'id and user_id required' }, { status: 400 })
  }

  // Get file to update storage
  const { data: file } = await supabase
    .from('files')
    .select('size')
    .eq('id', fileId)
    .eq('user_id', userId)
    .single()

  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update storage
  if (file) {
    const { data: user } = await supabase
      .from('users')
      .select('storage_used')
      .eq('id', userId)
      .single()
    
    if (user) {
      await supabase
        .from('users')
        .update({ storage_used: Math.max(0, user.storage_used - file.size) })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ success: true })
}