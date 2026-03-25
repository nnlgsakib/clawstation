---
phase: 02-docker-integration
plan: "02"
type: execute
wave: 2
depends_on: [02-docker-integration-01]
files_modified:
  - src/hooks/use-docker.ts
  - src/pages/docker.tsx
  - src/lib/errors.ts
  - src/components/ui/switch.tsx
autonomous: true
requirements:
  - INST-03
  - ERR-03

must_haves:
  truths:
    - "Docker page shows whether Docker is installed and running"
    - "Docker page shows Docker version when available"
    - "Docker page shows WSL2 backend status on Windows"
    - "When Docker is unavailable, page shows clear error with recovery instructions"
    - "Docker health status auto-refreshes without user action"
    - "User can manually trigger a Docker re-check"
  artifacts:
    - path: "src/hooks/use-docker.ts"
      provides: "Docker status hook using TanStack Query + Tauri invoke"
      exports: ["useDockerHealth", "useDockerInfo"]
    - path: "src/pages/docker.tsx"
      provides: "Docker management page replacing PageStub"
      contains: "DockerStatusCard"
    - path: "src/lib/errors.ts"
      provides: "Docker-specific error messages in error map"
      contains: "docker_not_installed"
  key_links:
    - from: "src/pages/docker.tsx"
      to: "useDockerHealth"
      via: "useQuery hook call"
      pattern: "useDockerHealth"
    - from: "src/hooks/use-docker.ts"
      to: "invoke"
      via: "Tauri IPC call to check_docker_health"
      pattern: "invoke.*check_docker_health"
    - from: "src/pages/docker.tsx"
      to: "showError"
      via: "error handling for Docker status"
      pattern: "showError"
---

<objective>
Build the Docker frontend — status hook, page UI, and error messages

Purpose: Plan 01 creates the Rust backend with check_docker_health, get_docker_info, and detect_docker commands. Plan 02 wires these to the frontend via a TanStack Query hook and builds the Docker page that replaces the current PageStub placeholder. This is what the user sees — the concrete outcome of INST-03 and ERR-03.

Output: `src/hooks/use-docker.ts` with 2 query hooks, `src/pages/docker.tsx` with status cards and error handling, updated `src/lib/errors.ts` with Docker-specific messages, shadcn Switch component for future toggle use
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/02-docker-integration/RESEARCH.md

# Phase 1 patterns to follow:
@src/hooks/use-platform.ts — TanStack Query hook pattern (useQuery + staleTime)
@src/pages/docker.tsx — current PageStub placeholder to replace
@src/lib/errors.ts — error message map to extend
@src/lib/toast-errors.ts — showError helper for error display
@src/components/status/error-banner.tsx — inline error display pattern
@src/components/ui/card.tsx — Card component for status display
@src/components/ui/badge.tsx — Badge component for status indicators
@src/components/ui/button.tsx — Button for refresh action
@src/components/ui/alert.tsx — Alert for Docker status messages
</context>

<interfaces>
<!-- Key types and contracts from Plan 01 that this plan consumes -->
<!-- These are the Tauri commands registered in Plan 01 -->

From src-tauri/src/commands/docker.rs (Plan 01 output):
```rust
#[tauri::command]
pub async fn check_docker_health() -> Result<DockerStatus, AppError>

#[tauri::command]
pub async fn get_docker_info() -> Result<DockerInfo, AppError>

#[tauri::command]
pub async fn detect_docker() -> Result<DockerStatus, AppError>
```

DockerStatus struct (from Plan 01):
```typescript
// serde rename_all = "camelCase" maps to:
interface DockerStatus {
  installed: boolean;
  running: boolean;
  version: string | null;
  apiVersion: string | null;
  platform: string;       // "windows" | "linux"
  dockerDesktop: boolean;
  wslBackend: boolean;
}
```

DockerInfo struct (from Plan 01):
```typescript
interface DockerInfo {
  status: DockerStatus;
  containersRunning: number;
  imagesCount: number;
  serverVersion: string | null;
  osType: string | null;
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create Docker status hooks and extend error messages</name>
  <files>src/hooks/use-docker.ts, src/lib/errors.ts</files>
  <read_first>
    - src/hooks/use-platform.ts (TanStack Query hook pattern to follow)
    - src/lib/errors.ts (error message map to extend)
  </read_first>
  <action>
    1. Create `src/hooks/use-docker.ts` following the `usePlatform()` pattern:

       ```typescript
       import { useQuery } from "@tanstack/react-query"
       import { invoke } from "@tauri-apps/api/core"

       export interface DockerStatus {
         installed: boolean
         running: boolean
         version: string | null
         apiVersion: string | null
         platform: string
         dockerDesktop: boolean
         wslBackend: boolean
       }

       export interface DockerInfo {
         status: DockerStatus
         containersRunning: number
         imagesCount: number
         serverVersion: string | null
         osType: string | null
       }

       /**
        * Checks Docker health status. Polls every 30s when Docker is not running
        * (to detect when user starts Docker Desktop), otherwise checks every 5min.
        * Uses TanStack Query for caching, loading states, and background refetch.
        */
       export function useDockerHealth() {
         return useQuery<DockerStatus>({
           queryKey: ["docker", "health"],
           queryFn: async () => {
             return await invoke<DockerStatus>("check_docker_health")
           },
           refetchInterval: (query) => {
             // Poll faster when Docker is down (user might be starting it)
             if (!query.state.data?.running) return 30_000
             return 300_000 // 5 minutes when healthy
           },
           retry: 1,
         })
       }

       /**
        * Gets extended Docker info (container counts, etc).
        * Only refetches when Docker is running. Manual refetch via invalidateQueries.
        */
       export function useDockerInfo() {
         return useQuery<DockerInfo>({
           queryKey: ["docker", "info"],
           queryFn: async () => {
             return await invoke<DockerInfo>("get_docker_info")
           },
           enabled: false, // Only fetch when explicitly requested or Docker is running
           staleTime: 60_000,
           retry: 1,
         })
       }
       ```

    2. Update `src/lib/errors.ts` — add Docker-specific error messages to the `errorMessages` record:

       ```typescript
       docker_not_installed: {
         message: "Docker is not installed on this system.",
         suggestion: "Download Docker Desktop from docker.com and install it. On Linux, you can also run: sudo apt install docker.io",
       },
       docker_daemon_not_running: {
         message: "Docker is installed but not running.",
         suggestion: "Start Docker Desktop (Windows) or run: sudo systemctl start docker (Linux)",
       },
       docker_desktop_not_running: {
         message: "Docker Desktop is not running.",
         suggestion: "Open Docker Desktop from the Start menu and wait for it to show 'Docker Desktop is running'.",
       },
       wsl_backend_not_ready: {
         message: "The WSL2 Docker backend is not ready.",
         suggestion: "Open Docker Desktop → Settings → Resources → WSL Integration and ensure your distro is enabled.",
       },
       ```

       Also update the `matchErrorPattern` function to match new error patterns:
       Add before the generic "docker" match:
       ```typescript
       if (lower.includes("docker") && lower.includes("not installed")) return errorMessages.docker_not_installed
       if (lower.includes("docker") && lower.includes("daemon")) return errorMessages.docker_daemon_not_running
       if (lower.includes("docker desktop")) return errorMessages.docker_desktop_not_running
       if (lower.includes("wsl") || lower.includes("wsl2")) return errorMessages.wsl_backend_not_ready
       ```
  </action>
  <acceptance_criteria>
    - `src/hooks/use-docker.ts` exists and exports `useDockerHealth` function
    - `src/hooks/use-docker.ts` exports `useDockerInfo` function
    - `useDockerHealth` uses `invoke("check_docker_health")`
    - `useDockerInfo` uses `invoke("get_docker_info")`
    - Both hooks use TanStack Query `useQuery`
    - `useDockerHealth` has `refetchInterval` configured
    - `src/lib/errors.ts` contains `docker_not_installed` error message
    - `src/lib/errors.ts` contains `docker_daemon_not_running` error message
    - `src/lib/errors.ts` contains `docker_desktop_not_running` error message
    - `src/lib/errors.ts` contains `wsl_backend_not_ready` error message
    - `matchErrorPattern` handles new Docker error patterns
    - TypeScript compiles: `npx tsc --noEmit` passes
  </acceptance_criteria>
  <verify>npx tsc --noEmit 2>&1 | tail -5</verify>
  <done>useDockerHealth and useDockerInfo hooks created with TanStack Query, 4 Docker error messages added to error map, TypeScript compiles</done>
</task>

<task type="auto">
  <name>Task 2: Build Docker status page</name>
  <files>src/pages/docker.tsx, src/components/ui/switch.tsx</files>
  <read_first>
    - src/pages/docker.tsx (current PageStub to replace)
    - src/pages/dashboard.tsx (reference page pattern)
    - src/components/status/error-banner.tsx (error display pattern)
    - src/components/ui/card.tsx (Card component API)
    - src/components/ui/badge.tsx (Badge component API)
    - src/components/ui/button.tsx (Button component API)
    - src/components/ui/alert.tsx (Alert component API)
    - src/hooks/use-docker.ts (hooks from Task 1)
  </read_first>
  <action>
    1. Install shadcn Switch component:
       ```bash
       npx shadcn@latest add switch --yes
       ```
       This creates `src/components/ui/switch.tsx` — needed for future sandbox toggle in Phase 4, and useful as a status indicator on the Docker page.

    2. Replace `src/pages/docker.tsx` with a Docker status page:

       ```typescript
       import { useDockerHealth } from "@/hooks/use-docker"
       import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
       import { Badge } from "@/components/ui/badge"
       import { Button } from "@/components/ui/button"
       import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
       import { showError } from "@/lib/toast-errors"
       import { RefreshCw, Docker, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
       import { useQueryClient } from "@tanstack/react-query"

       export function Docker() {
         const { data: dockerStatus, isLoading, error, isError } = useDockerHealth()
         const queryClient = useQueryClient()

         const handleRefresh = () => {
           queryClient.invalidateQueries({ queryKey: ["docker"] })
         }

         // Error state (Tauri command failed)
         if (isError && error) {
           showError(error)
         }

         return (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <div>
                 <h1 className="text-2xl font-bold tracking-tight">Docker</h1>
                 <p className="text-muted-foreground">
                   Docker engine status and management
                 </p>
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleRefresh}
                 disabled={isLoading}
               >
                 <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                 Refresh
               </Button>
             </div>

             {/* Docker Status Card */}
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Docker className="h-5 w-5" />
                     <CardTitle>Docker Engine</CardTitle>
                   </div>
                   <DockerStatusBadge status={dockerStatus} isLoading={isLoading} />
                 </div>
                 <CardDescription>
                   {dockerStatus?.platform === "windows"
                     ? "Docker Desktop with WSL2 backend"
                     : "Native Docker installation"}
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Not installed */}
                 {dockerStatus && !dockerStatus.installed && (
                   <Alert variant="destructive">
                     <AlertTriangle className="h-4 w-4" />
                     <AlertTitle>Docker Not Found</AlertTitle>
                     <AlertDescription>
                       Docker is not installed on this system. Install Docker Desktop to use sandboxed OpenClaw features.
                       {dockerStatus.platform === "windows" ? (
                         <span className="mt-2 block">
                           Download from: <a href="https://www.docker.com/products/docker-desktop/" className="underline" target="_blank" rel="noopener noreferrer">docker.com/products/docker-desktop</a>
                         </span>
                       ) : (
                         <span className="mt-2 block">
                           Run: <code className="bg-muted px-1 rounded">sudo apt install docker.io</code> or download Docker Desktop
                         </span>
                       )}
                     </AlertDescription>
                   </Alert>
                 )}

                 {/* Installed but not running */}
                 {dockerStatus?.installed && !dockerStatus.running && (
                   <Alert>
                     <AlertTriangle className="h-4 w-4" />
                     <AlertTitle>Docker Not Running</AlertTitle>
                     <AlertDescription>
                       {dockerStatus.platform === "windows"
                         ? "Open Docker Desktop from the Start menu and wait for it to start."
                         : "Start the Docker service: sudo systemctl start docker"}
                     </AlertDescription>
                   </Alert>
                 )}

                 {/* Running — show details */}
                 {dockerStatus?.running && (
                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="space-y-1">
                       <p className="text-sm font-medium text-muted-foreground">Version</p>
                       <p className="text-sm font-mono">{dockerStatus.version ?? "Unknown"}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-sm font-medium text-muted-foreground">API Version</p>
                       <p className="text-sm font-mono">{dockerStatus.apiVersion ?? "Unknown"}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-sm font-medium text-muted-foreground">Platform</p>
                       <p className="text-sm capitalize">{dockerStatus.platform}</p>
                     </div>
                     {dockerStatus.platform === "windows" && (
                       <div className="space-y-1">
                         <p className="text-sm font-medium text-muted-foreground">Backend</p>
                         <p className="text-sm">
                           {dockerStatus.wslBackend ? "WSL2" : "Hyper-V"}
                         </p>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Loading */}
                 {isLoading && (
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <RefreshCw className="h-4 w-4 animate-spin" />
                     <span className="text-sm">Checking Docker status...</span>
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         )
       }

       function DockerStatusBadge({
         status,
         isLoading,
       }: {
         status: ReturnType<typeof useDockerHealth>["data"]
         isLoading: boolean
       }) {
         if (isLoading) {
           return <Badge variant="secondary">Checking...</Badge>
         }
         if (!status) {
           return <Badge variant="secondary">Unknown</Badge>
         }
         if (status.running) {
           return (
             <Badge variant="default" className="bg-green-600 hover:bg-green-700">
               <CheckCircle2 className="mr-1 h-3 w-3" />
               Running
             </Badge>
           )
         }
         if (status.installed) {
           return (
             <Badge variant="outline" className="text-yellow-600 border-yellow-600">
               <AlertTriangle className="mr-1 h-3 w-3" />
               Not Running
             </Badge>
           )
         }
         return (
           <Badge variant="destructive">
             <XCircle className="mr-1 h-3 w-3" />
             Not Installed
           </Badge>
         )
       }
       ```

    3. The page uses existing shadcn components (Card, Badge, Button, Alert) — no new UI components needed beyond Switch (installed in step 1).
  </action>
  <acceptance_criteria>
    - `src/pages/docker.tsx` no longer uses PageStub
    - `src/pages/docker.tsx` imports and uses `useDockerHealth` hook
    - Page has a "Docker" heading with description
    - Page has a Refresh button that invalidates Docker queries
    - Docker status card shows installed/running/version info
    - Not-installed state shows Alert with download instructions
    - Installed-but-not-running state shows Alert with start instructions
    - Running state shows version, API version, platform details
    - Status badge shows Running (green), Not Running (yellow), or Not Installed (red)
    - Windows platform shows WSL2/Hyper-V backend info
    - Loading state shows spinner with "Checking Docker status..." text
    - `src/components/ui/switch.tsx` exists (shadcn Switch component installed)
    - TypeScript compiles: `npx tsc --noEmit` passes
  </acceptance_criteria>
  <verify>npx tsc --noEmit 2>&1 | tail -5</verify>
  <done>Docker page replaces PageStub with status cards, error alerts with recovery instructions, refresh button, status badge, and platform-specific info. Switch component installed for future use.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with all new frontend code
2. Docker page renders without PageStub
3. useDockerHealth hook calls correct Tauri command
4. Error messages cover all Docker failure scenarios
5. shadcn Switch component installed
</verification>

<success_criteria>
- useDockerHealth hook: TanStack Query, invoke("check_docker_health"), refetchInterval configured
- useDockerInfo hook: TanStack Query, invoke("get_docker_info"), enabled: false
- Docker page: status card, error alerts, refresh button, status badge
- 4 Docker error messages in errors.ts (docker_not_installed, docker_daemon_not_running, docker_desktop_not_running, wsl_backend_not_ready)
- matchErrorPattern handles new Docker patterns
- shadcn Switch component installed
- TypeScript compiles clean
</success_criteria>

<output>
After completion, create `.planning/phases/02-docker-integration/02-docker-integration-02-SUMMARY.md`
</output>
