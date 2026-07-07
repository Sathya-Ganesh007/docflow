# DocFlow - Collaborative Document Editor

## Live Demo
[Vercel URL here]

## Test Accounts
- Alice: alice@test.com
- Bob: bob@test.com

## Local Setup
```bash
git clone [repo]
cd docflow
npm install
cp .env.example .env.local
# Add Supabase credentials
npm run dev
```

## Features
- Document creation, editing, renaming
- Rich text: Bold, Italic, Underline, H1, H2, Lists
- File upload (.txt, .md)
- Document sharing between users
- Auto-save every 3 seconds
- Persistent storage via Supabase

## Tech Stack
- Next.js 14, TypeScript, TailwindCSS
- TipTap rich text editor
- Supabase (Postgres)
- Vercel deployment

## Supported File Types
Upload: .txt and .md only
