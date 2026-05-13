import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'
import { TelegramStorage } from '@/lib/telegram'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    
    // Get file record
    const { data: file, error } = await supabase
      .from('files')
      .select('*, users!inner(telegram_bot_token, telegram_chat_id)')
      .eq('id', id)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const user = file.users as any
    
    if (!user.telegram_bot_token) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 400 })
    }

    // Get Telegram file URL
    const telegram = new TelegramStorage(user.telegram_bot_token, user.telegram_chat_id)
    const fileUrl = await telegram.getFileUrl(file.telegram_file_id)

    // Fetch file from Telegram
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }

    const buffer = await fileResponse.arrayBuffer()

    // Update download count
    await supabase
      .from('files')
      .update({ download_count: (file.download_count || 0) + 1 })
      .eq('id', id)

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': file.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}