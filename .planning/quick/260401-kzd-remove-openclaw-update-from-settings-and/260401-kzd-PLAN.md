# Quick Task Plan: 260401-kzd

## Summary

Remove failing OpenClaw update functionality from Settings page and consolidate update/reinstall into the Install page with working `npm install -g openclaw@latest` approach.

## Problem Analysis

1. **Settings page OpenClaw update fails** - Uses `check_openclaw_update()` which calls GitHub API (`fetch_latest_version()`) and fails with "Check your internet connection" due to API rate limits/network issues
2. **Install page reinstall works** - Uses `reinstall_openclaw()` which directly runs `npm install -g openclaw@latest` without GitHub API dependency
3. **Duplicated functionality** - Both Settings and Install pages have OpenClaw version management, but different approaches

## Solution

1. Remove OpenClaw Update card from Settings page (keep Desktop App update)
2. Enhance Install page OpenClaw row to:
   - Show version comparison when update available (e.g., "v1.0.0 -> v1.2.0")
   - Show "Update" button when newer version detected
   - Keep "Reinstall" button always visible when installed
   - Both buttons use the working `install_openclaw_script` / `reinstall_openclaw` approach

## Tasks

### Task 1: Remove OpenClaw Update from Settings Page

**File:** `src/pages/settings.tsx`

**Changes:**
- Remove imports: `useOpenClawUpdateCheck`, `useUpdateOpenClaw` from `@/hooks/use-update`
- Remove state: `openclawProgress`, `UpdateProgress` interface
- Remove `useEffect` for OpenClaw update progress events (lines 70-82)
- Remove `useEffect` for OpenClaw update toast (lines 85-104)
- Remove entire "OpenClaw Update" Card component (lines 147-256)
- Keep: Desktop App Update card, About card, Danger Zone

**Result:** Settings page only shows Desktop App Update, About, and Danger Zone sections.

### Task 2: Add Update Detection to Install Page

**File:** `src/pages/install.tsx`

**Changes:**
1. Add version check state:
   ```tsx
   const [latestVersion, setLatestVersion] = useState<string | null>(null);
   ```

2. Add version comparison logic in `checkPrereqs` or separate effect:
   - After getting prereqs, if OpenClaw is installed, fetch latest version
   - Use `check_openclaw_update` command but only for version comparison
   - Store `latestVersion` for display

3. Modify `PrereqRow` for OpenClaw to show:
   - Version diff when update available: "v{current} -> v{latest} available"
   - Two buttons when installed AND update available: "Update" + "Reinstall"
   - Just "Reinstall" button when installed but no update detected
   - "Install OpenClaw" button when not installed

4. Add `handleUpdateOpenClaw` function:
   ```tsx
   const handleUpdateOpenClaw = async () => {
     setInstalling(true);
     try {
       const version = await invoke<string>("reinstall_openclaw");
       toast.success(`OpenClaw updated to ${version}`);
       await checkPrereqs();
     } catch (e) {
       toast.error(`Update failed: ${e}`);
     } finally {
       setInstalling(false);
     }
   };
   ```
   Note: Uses `reinstall_openclaw` which is equivalent to update (uninstall + install @latest)

### Task 3: Update OpenClaw Row UI

**File:** `src/pages/install.tsx`

**Changes to OpenClaw PrereqRow rendering (around line 221-250):**

```tsx
<PrereqRow
  label="OpenClaw"
  status={prereqs?.openclaw.installed ? "ok" : "missing"}
  version={prereqs?.openclaw.version ?? undefined}
  detail={
    prereqs?.openclaw.installed
      ? latestVersion && prereqs.openclaw.version && latestVersion !== prereqs.openclaw.version
        ? `Update available: ${prereqs.openclaw.version} -> ${latestVersion}`
        : "Installed (latest)"
      : "Not installed"
  }
  action={
    installing ? (
      <Button size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Working...
      </Button>
    ) : prereqs?.openclaw.installed ? (
      <div className="flex gap-2">
        {latestVersion && prereqs.openclaw.version && latestVersion !== prereqs.openclaw.version && (
          <Button size="sm" onClick={handleUpdateOpenClaw}>
            <Download className="mr-2 h-4 w-4" />
            Update
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleReinstallOpenClaw}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reinstall
        </Button>
      </div>
    ) : (
      <Button size="sm" onClick={handleInstallOpenClaw}>
        <Download className="mr-2 h-4 w-4" />
        Install OpenClaw
      </Button>
    )
  }
/>
```

Add import for `RefreshCw` from lucide-react.

## Files Modified

| File | Action |
|------|--------|
| `src/pages/settings.tsx` | Remove OpenClaw Update card (~110 lines removed) |
| `src/pages/install.tsx` | Add update detection, version diff display, Update button |

## Notes

- The `check_openclaw_update` command may still fail if GitHub API is unavailable, but this is now optional - the Install page gracefully degrades to just showing "Reinstall"
- Both Update and Reinstall use `reinstall_openclaw` internally (uninstall + install @latest) which is the reliable path
- Desktop App update in Settings remains unchanged - it uses Tauri's built-in updater
- No backend changes needed - reusing existing commands

## Acceptance Criteria

- [ ] Settings page no longer shows OpenClaw Update card
- [ ] Install page shows version diff when update is available (e.g., "v1.0.0 -> v1.2.0")
- [ ] Install page shows "Update" button when newer version available
- [ ] Install page always shows "Reinstall" button when OpenClaw is installed
- [ ] Both Update and Reinstall buttons work without GitHub API errors
- [ ] No commit - user confirms changes first
