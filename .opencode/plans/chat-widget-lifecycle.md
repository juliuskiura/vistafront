# Chat Widget Lifecycle Fix

## Problem
When a user closes a chat, the next time they click the chat bubble, it reopens the previous room instead of showing the "Start Conversation" UI. The chat room lifecycle is not properly managed.

## Context
- Chat widget lives in `vistafront/components/workspace/chat-widget/chat-widget.tsx`
- It is placed at the bottom of every workspace page (non-admin users) via `workspace-shell.tsx`
- A customer should only have one active chat room at a time
- A chat can be closed by:
  1. Customer clicking "Close Chat" button
  2. Admin agent closing when customer doesn't respond
- New backend endpoint: `GET /api/livechat/rooms/active-room/` returns either an active room or `None`

## Implementation

### 1. Close room when chat ends
- When customer clicks "Close Chat" (`handleClose`), the room is closed on the server via `POST /api/livechat/rooms/{nanoid}/close`
- Admin agents can also close rooms (backend responsibility)
- After closing, `roomNanoidRef.current = null` and chatRooms/chatMessages cache is cleared

### 2. Show "Start Conversation" UI after closing
- `useChatRoom` uses `GET /api/livechat/rooms/active-room/` which returns either an active room or `null`
- After closing, the active room endpoint returns `null` (room is closed on server)
- `ChatPanel` shows "Start Conversation" button when `hasRoom` is false

### 3. Create new room via "Start Conversation"
- `handleStart` creates a new room via `POST /api/livechat/rooms`
- After creation, `queryClient.invalidateQueries({ queryKey: ["chatRooms"] })` refreshes the cache
- Chat panel shows the new room

### 4. Use active-room endpoint (useChatRoom)
- `useChatRoom` uses `GET /api/livechat/rooms/active-room/` instead of `GET /api/livechat/rooms`
- This endpoint returns either an active room or `null`
- No need to fetch all rooms or filter on the frontend
- Simplifies the hook and improves performance

### 5. Next.js route handler for active-room
- Created at `app/api/livechat/rooms/active-room/route.ts`
- Fetches all rooms from Django via `serverFetch("/apis/livechat/rooms/")`
- Filters for active room on the Next.js side
- Returns single active room or `null`
- Django backend does not have this endpoint (read-only)

## Files Modified
- `vistafront/components/workspace/chat-widget/chat-widget.tsx`
- `vistafront/components/workspace/chat-widget/use-chat-room.ts`
- `vistafront/app/api/livechat/rooms/active-room/route.ts` (new)

## Verification
- Close chat → widget minimizes → click bubble → if no active room, "Start Conversation" UI appears
- Click "Start Conversation" → new room created via POST → chat works normally
- If room creation fails → "Start Conversation" UI still visible (can retry)
- Only one active room at a time
- GET /api/livechat/rooms/active-room/ returns active room or null
