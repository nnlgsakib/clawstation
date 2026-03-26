# Phase 10: Access Control & Activity - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Add contact management (whitelist, approve/deny, block/ban) and a message activity feed to the channels section. Users can control who reaches their OpenClaw agent and monitor recent message activity across all connected channels. This completes the v1.1 milestone.

</domain>

<decisions>
## Implementation Decisions

### Contact Management Architecture
- Contact management as a new tab/section on the channels page (not a separate route)
- Tabs: "Channels" (existing) | "Contacts" (new) | "Activity" (new)
- Contact list fetched from OpenClaw API via Tauri command
- Three contact states: `approved`, `pending`, `blocked`

### Contact Actions
- Whitelist: mark contact as approved (persistent access)
- Approve/Deny: handle pending contact requests
- Block/Ban: prevent contact from reaching agent
- Actions call Tauri commands that proxy to OpenClaw API

### Activity Feed
- Recent messages across all channels displayed as a scrollable list
- Each entry: sender name, channel type, message preview, timestamp
- Fetched from OpenClaw API via Tauri command
- Polls every 30s for new activity
- Empty state: "No recent activity" message

### UI Layout
- Tabs component at top of channels page (below header)
- Contacts tab: Card-based contact list with action buttons per contact
- Activity tab: List of recent messages with channel icons
- Pending contacts highlighted with badge count
- Skeleton loading for both tabs

### the agent's Discretion
- Tab implementation (custom vs shadcn/ui Tabs)
- Contact card layout details
- Activity feed item density and truncation
- Whether to group activity by channel or show flat list

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/channels.tsx` — existing page to extend with tabs
- `Card`, `CardHeader`, `CardContent` — card layout components
- `Badge` — status indicators for contact states
- `Button` — action buttons for contacts
- `Skeleton` — loading states
- `sonner` toast — action feedback
- Tab pattern can be built with simple useState + button group

### Established Patterns
- Tauri commands: async fn returning Result<T, AppError>
- Hooks: TanStack Query with invoke()
- Adaptive polling: 30s for activity, 60s for contacts
- Graceful degradation: empty arrays on API failure

### Integration Points
- `src/pages/channels.tsx` — add tabs for Contacts and Activity
- `src-tauri/src/commands/channels.rs` — add contact and activity commands
- `src/hooks/use-channels.ts` — add contact and activity hooks

</code_context>

<specifics>
## Specific Ideas

- "Pending contacts should be obvious — maybe a badge count on the tab"
- "Activity feed should feel like a chat history — sender, preview, time"
- "Contact actions should be quick — approve/deny/block with one click"

</specifics>

<deferred>
## Deferred Ideas

- Contact groups/labels — future phase
- Advanced filtering and search — future phase
- Message content moderation — future phase
- Bulk contact actions — future phase

</deferred>

---

*Phase: 10-access-control-activity*
*Context gathered: 2026-03-26*
