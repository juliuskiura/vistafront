# Plan: Convert ChatSheet into a persistent floating chat widget

## Goal
Replace the header-triggered `ChatSheet` with an Intercom-style floating chat widget:
- Fixed circular launcher bubble at bottom-right; clicking expands a chat panel with a minimize button that collapses back to the bubble.
- The WebSocket stays connected across client-side route changes (mounted at the persistent `WorkspaceShell` level) and is **not** coupled to open/minimized state — so the chat never disconnects when navigating or minimizing.
- Unread badge on the bubble for inbound messages received while minimized; cleared on open.
- Auto-resolve the user's most recent active room (no auto-create). Empty state if no room.
- Non-admins get the widget; admins keep their existing livechat dashboard "Chat" link. Reuse the premium input UI (bottom toolbar: paperclip | emoji | send circle, auto-growing textarea).

## Root cause of "disconnects"
Today `chat-sheet.tsx` gates the WS (`/ws/chat/{room}/`) on `[room?.nanoid, open]`, and `room` is **never set**, so nothing connects. The widget fixes this by resolving the room via `GET /api/livechat/rooms` and keeping the WS lifecycle in the mounted (persistent) widget, independent of minimize state.

## Persistence strategy
`WorkspaceShell` (`components/workspace/workspace-shell.tsx`, client) is rendered by `app/(app)/[workspace]/layout.tsx`, which **persists across all client-side navigations** within a workspace (layouts persist; only `page.tsx` remounts). Mounting the widget there keeps it (and its WebSocket) alive across route changes. Switching workspaces updates the `workspaceDomain` prop → room changes → WS reconnects (edge case handled).

## New files — `components/workspace/chat-widget/`

```
components/workspace/chat-widget/
  index.ts                      # barrel: export { ChatWidget }
  chat-widget.tsx               # orchestrator (client)
  use-chat-room.ts              # hook: resolve most recent active room
  use-chat-socket.ts            # hook: WS lifecycle + send (persistent)
  _components/
    chat-launcher.tsx           # fixed bubble + unread badge + online dot
    chat-panel.tsx              # fixed expanded card (header + list + input)
    chat-input.tsx              # premium input (reused from chat-sheet)
    message-list.tsx            # message bubbles + empty state + autoscroll
```

### `use-chat-room.ts`
- `useQuery<ChatRoom[]>({ queryKey: ["chatRooms", workspaceDomain], queryFn: () => fetch(`/api/livechat/rooms?workspace=${workspaceDomain}`).then(r => r.json()), refetchInterval: 30_000 })`.
- Returns `{ currentRoom, isPending }` where `currentRoom` = the `is_active` room with the latest `updated_at` (fall back to fetch first). No room → `null`.

### `use-chat-socket.ts`
- Props: `{ roomNanoid?: string, workspaceDomain: string, minimizedRef: React.MutableRefObject<boolean>, onUnread: () => void, userName?: string | null }`.
- Returns `{ messages, replaceHistory, wsReady, sendMessage }`.
- Effect (`deps: [roomNanoid]`):
  - No room → close/clear, `wsReady=false`.
  - Build URL: `(window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + window.location.host + "/ws/chat/" + roomNanoid + "/"` (same-origin cookie auth, existing precedent).
  - `onopen` → `wsReady=true`; `onmessage` → append `data.message` for `type==="message"`; increment unread via `onUnread()` when `minimizedRef.current` is true and the message is not self-sent (self = `sender_name === userName || sender_name === "You"`).
  - `onclose`/`onerror` → `wsReady=false`, schedule a reconnect after 3s (guard with a ref timer; cleared on cleanup) so a dropped connection recovers while the widget stays mounted.
  - Cleanup closes the WS + clears the timer.
- `sendMessage(content)`: if WS is OPEN → `send({ action: "send_message", content })`; else `POST /api/livechat/messages?room=&workspace=` with `{content}` (existing route handler), toast on failure. Keep the optimistic temp-message append in `chat-panel`.

### `chat-widget.tsx`
- Props: `{ workspaceDomain: string, userName?: string | null }`.
- State: `minimized` (init `true`), `unread` (init `0`); `minimizedRef` mirror for the socket hook.
- `useChatRoom(workspaceDomain)` + `useChatSocket(...)` + a history query: `useQuery({ queryKey: ["chatMessages", currentRoom?.nanoid], queryFn: fetch /api/livechat/messages, enabled: !!currentRoom?.nanoid, refetchInterval: 15_000 })`. Effect on history → `replaceHistory(history)` (server truth; replaces local array, so duplicates can't persist).
- Reset `unread`/minimized-relevant state when `roomNanoid` changes.
- `openPanel()` → `setMinimized(false); setUnread(0)`; `minimize()` → `setMinimized(true)`.
- Render: `minimized ? <ChatLauncher .../> : <ChatPanel .../>`.

### `_components/chat-launcher.tsx`
- `fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90` with `ChatIcon`; premium hover/tap.
- Unread badge: `absolute -right-1 -top-1 rounded-full bg-destructive text-destructive-foreground text-xs min-w-5 h-5 px-1.5 flex items-center justify-center` rendered when `unread > 0` (cap display at "9+").
- Online dot (`size-2.5 rounded-full` emerald when `wsReady`, else muted) bottom-left of the bubble.

### `_components/chat-panel.tsx`
- `fixed bottom-5 right-5 z-50 flex h-[min(600px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl`.
- Header: gradient `bg-gradient-to-r from-primary/90 to-primary/70`, `ChatIcon`, title "Chat with Vistasolve", online status (`wsReady ? "Online" : "Connecting..."`), minimize button (`Minus`/`ChevronDown` icon) → `onMinimize`.
- Body: `<MessageList .../>` (flex-1, `ScrollArea`), then `<ChatInput onSend={onSend} disabled={!wsReady} />` with a thin `border-t`.
- `onSend(content)`: optimistic append `{ nanoid: temp-…, content, sender_name: "You", … }` then `sendMessage(content)`.

### `_components/message-list.tsx`
- Port the premium bubbles + autoscroll + empty state from current `chat-sheet.tsx` (own = `sender_name === userName || sender_name === "You"`; own → primary right, else muted left). Empty state: "No conversation yet" / "Start a conversation below" (also used for no-room).
- Autoscroll `messagesEndRef` effect on `messages`.

### `_components/chat-input.tsx`
- Port the approved input exactly (owner of local `value`): rounded-2xl `border-secondary/70`, `focus-within:border-secondary ring-secondary/30`, growing textarea (`min-h-[40px]`, autosize to 160px), bottom toolbar (`border-t`) with paperclip button, `EmojiPicker` (same component as socialmanager compose), send circle button (send icon `size={12}` per prior fix).
- Enter sends / Shift+Enter newline; `onSend` lifted; send disabled when empty or `disabled`.

## Modified files
- `components/workspace/workspace-shell.tsx`
  - Remove `import { ChatSheet } from "@/components/workspace/chat-sheet";`; add `import { ChatWidget } from "@/components/workspace/chat-widget";`.
  - Header branch (~line 322-336): keep the admin `Link`; for non-admin render `null` (remove `ChatSheet` from the header).
  - Mount the widget at the end of the shell root `<div>`, after the main column close:
    `{!user.isAdmin && <ChatWidget workspaceDomain={workspace.domain} userName={user.firstName && user.lastName ? \`${user.firstName} ${user.lastName}\` : null} />}`

## Deleted files (now dead)
- `components/workspace/chat-sheet.tsx` — after the shell change the only importers are `chat-page-client.tsx` (unrouted) and the shell. Verify no other importers with `rg "chat-sheet"` first.
- `app/(app)/[workspace]/dashboard/livechat/chat-page-client.tsx` — confirmed unrouted (only reference is its own definition); `livechat/page.tsx` renders `LivechatClient` instead.

## Edge cases handled
- **No room yet**: `currentRoom` is `null` → no WS, no history query; launcher shows muted/offline dot; panel shows empty state. No auto-create (per user decision).
- **Workspace switch / room change**: `roomNanoid` change → WS cleanup + reconnect, history reset.
- **WS drop while navigating**: widget is mounted at the persistent shell → WS never torn down on navigation; `onclose` reconnect timer recovers transient drops.
- **Duplicate messages**: history refetch replaces the array wholesale, so WS-appended messages can't accumulate duplicates.
- **Minimize ≠ disconnect**: socket hook lives at widget root, above the `minimized` branch; `minimizedRef` only affects unread counting, not the connection.

## Constraints honored (AGENTS.md)
- APIs via existing Next route handlers (`/api/livechat/rooms`, `/api/livechat/messages`) — no Django-direct fetch.
- TanStack query keys include workspace: `["chatRooms", domain]`, `["chatMessages", nanoid]`.
- No `window.location` navigation (only WS URL construction, existing precedent).
- Each file < 300 lines; modular `index.ts` / `_components/` convention; `"use client"` on interactive files.
- `useEffect` only for real-time WS + ref-based side effects (allowed).

## Verification
1. `npx tsc --noEmit -p tsconfig.json` — no errors for changed files.
2. `npm run build` — passes.
3. Manual (`npm run dev`):
   - Non-admin account: bubble at bottom-right; no header chat icon anymore.
   - Expand → panel; if the user has an active room, history loads and status shows "Online"; send a message (WS or POST fallback); incoming message appears live.
   - Minimize → bubble only; send an inbound message (from admin livechat dashboard) → unread badge increments; expand → badge clears.
   - Navigate to several dashboard pages (CRM → projects → media…) while expanded and minimized → widget and connection persist ("Online" never drops); no full page reloads.
   - Admin account: no bubble; header "Chat" link to `/dashboard/livechat` still works.

## Implementation order
1. Create `use-chat-room.ts`, `use-chat-socket.ts`.
2. Create `_components/` (launcher, message-list, chat-input, panel).
3. Create `chat-widget.tsx` + `index.ts`.
4. Update `workspace-shell.tsx` (swap imports, remove header ChatSheet, mount widget).
5. `rg "chat-sheet|chat-page-client"` to confirm dead; delete both files.
6. Run typecheck + build; manual verification.