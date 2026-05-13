# TG-Storage 🚀

**Unlimited S3-Compatible Storage Powered by Telegram**

Turn your Telegram account into unlimited cloud storage. Free, fast, and private.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- **🗄️ Truly Unlimited** - Leverages Telegram's unlimited cloud storage
- **⚡ Blazing Fast** - Direct Telegram CDN with global edge locations
- **🔒 Private & Secure** - Your bot, your storage, zero middleman
- **🌐 URL Uploads** - Fetch files directly from any URL
- **🔌 S3 Compatible** - Works with rclone, Cyberduck, and more
- **👥 Multi-User SaaS** - Complete user management system
- **📊 Admin Dashboard** - Monitor usage, users, and storage
- **🎨 Modern UI** - Built with Next.js 15 and Tailwind CSS 4

## 🚀 Quick Start

### 1. Create Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy your bot token

### 2. Get Chat ID
- Message [@userinfobot](https://t.me/userinfobot) to get your ID
- Or create a private channel, add your bot as admin

### 3. Deploy
```bash
git clone https://github.com/komputeks/tg-storage
cd tg-storage
npm install
npm run dev
```

Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Storage**: Telegram Bot API
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## 📖 How It Works

1. Files are uploaded to your personal Telegram bot
2. Telegram stores them in their unlimited cloud
3. We save only the file_id reference in our database
4. Downloads stream directly from Telegram's CDN
5. Zero storage costs, maximum privacy

## 🔧 API Usage

### Upload File
```bash
curl -X POST /api/files \
  -F "file=@document.pdf" \
  -F "user_id=YOUR_USER_ID"
```

### Download File
```bash
curl /api/download/FILE_ID -o file.pdf
```

### URL Upload
```bash
curl -X POST /api/url-upload \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/file.zip","user_id":"..."}'
```

## 🎯 Use Cases

- Personal cloud backup
- Media storage for apps
- File sharing platform
- Development asset hosting
- Rclone remote storage
- MultCloud alternative

## 📝 License

MIT - Free for personal and commercial use

## 🙏 Credits

Inspired by [tg-s3](https://github.com/gps949/tg-s3) by gps949

Built with ❤️ using Next.js 15 and Tailwind 4
