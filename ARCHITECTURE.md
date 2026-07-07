# Architecture Notes

## What I Prioritized
1. Core editing experience (TipTap)
2. Real persistence (Supabase)
3. Working sharing flow
4. Clean UX over extra features

## Tech Decisions
- Next.js App Router: Fast setup, good DX
- TipTap: Best React rich text editor
- Supabase: Zero-config Postgres + real-time
- Vercel: One-click deploy

## Database Schema
- users: id, email, name
- documents: id, title, content, owner_id, updated_at
- document_shares: id, document_id, shared_with

## Auth Approach
Simulated auth with seeded users + localStorage.
Assignment explicitly allows this approach.

## What I Would Add Next
- Real authentication (Supabase Auth)
- Real-time collaboration (Supabase Realtime)
- Document version history
- Export to PDF/Markdown
