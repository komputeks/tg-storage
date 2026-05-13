export interface TelegramFile {
  file_id: string
  file_unique_id: string
  file_size?: number
  file_path?: string
}

export class TelegramStorage {
  private botToken: string
  private chatId: string
  private apiUrl: string

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken
    this.chatId = chatId
    this.apiUrl = `https://api.telegram.org/bot${botToken}`
  }

  async uploadFile(file: File | Buffer, filename: string): Promise<TelegramFile> {
    const formData = new FormData()
    formData.append('chat_id', this.chatId)
    
    if (file instanceof File) {
      formData.append('document', file, filename)
    } else {
      const blob = new Blob([new Uint8Array(file)])
      formData.append('document', blob, filename)
    }
    formData.append('disable_notification', 'true')

    const response = await fetch(`${this.apiUrl}/sendDocument`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(`Telegram upload failed: ${data.description}`)
    }

    const doc = data.result.document
    return {
      file_id: doc.file_id,
      file_unique_id: doc.file_unique_id,
      file_size: doc.file_size,
    }
  }

  async getFileUrl(fileId: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/getFile?file_id=${fileId}`)
    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(`Failed to get file: ${data.description}`)
    }

    const filePath = data.result.file_path
    return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`
  }

  async uploadFromUrl(url: string, filename?: string): Promise<TelegramFile> {
    // Download file first
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch URL')
    
    const buffer = await response.arrayBuffer()
    const blob = new Blob([buffer])
    const file = new File([blob], filename || url.split('/').pop() || 'download')
    
    return this.uploadFile(file, file.name)
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`)
      const data = await response.json()
      return data.ok === true
    } catch {
      return false
    }
  }
}