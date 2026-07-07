# AI Workflow Note

## Tools Used
- Claude (Anthropic): Architecture planning, 
  component generation, debugging
- Cursor AI: In-editor code completion and 
  refactoring

## Where AI Sped Up Work
- TipTap editor setup: Claude generated 
  complete toolbar component in one prompt
- Supabase schema: Generated and validated 
  in minutes
- Component styling: Sidebar, editor layout
  generated with precise prompts

## What I Changed/Rejected
- AI-generated auth was overly complex — 
  simplified to localStorage approach
- Initial editor had too many features — 
  cut to essentials
- Rejected AI suggestion to use Redux — 
  kept simple useState

## How I Verified Quality
- Manual testing of each feature
- Checked Supabase dashboard for data integrity
- Tested sharing flow with both users
- Verified persistence after page refresh
