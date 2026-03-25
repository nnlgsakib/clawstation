---
phase: 03-installation-engine
plan: 03
type: execute
wave: 3
depends_on: ["03-installation-engine-02"]
files_modified: [
  "src-tauri/src/commands/verify_installation.rs",
  "src-tauri/src/mod.rs",
  "src/components/install/step-verify.tsx",
  "src/components/install/step-ready.tsx",
  "src/components/install/step-error.tsx",
  "src/stores/use-onboarding-store.ts"
]
autonomous: true
requirements: [INST-04, INST-05]
must_haves:
  truths:
    - "After installation completes, the app automatically runs verification and shows progress"
    - "If verification passes, the user sees a success screen with gateway URL and token (for Docker)"
    - "If verification fails, the user sees an error screen with specific failure reason and retry/fixed options"
    - "The user can manually retry verification if needed"
    - "The success screen provides actionable next steps (copy token, open dashboard)"
  artifacts:
    - path: "src-tauri/src/commands/verify_installation.rs"
      provides: "Verification orchestration Tauri command"
      exports: ["verify_installation"]
    - path: "src/components/install/step-verify.tsx"
      provides: "Verification progress UI component"
      min_lines: 30
    - path: "src/components/install/step-ready.tsx"
      provides: "Installation success screen UI component"
      min_lines: 40
    - path: "src/components/install/step-error.tsx"
      provides: "Installation error screen UI component"
      min_lines: 30
    - path: "src/stores/use-onboarding-store.ts"
      provides: "Updated onboarding state management with verification handling"
      exports: ["useOnboardingStore"]
  key_links:
    - from: "src/components/install/step-verify.tsx"
      to: "src-tauri/src/commands/verify_installation.rs"
      via: "invoke('verify_installation')"
      pattern: "invoke.*verify_installation"
    - from: "src/stores/use-onboarding-store.ts"
      to: "src/components/install/step-verify.tsx"
      via: "useOnboardingStore().installProgress"
      pattern: "useOnboardingStore"
    - from: "src/stores/use-onboarding-store.ts"
      to: "src/components/install/step-ready.tsx"
      via: "useOnboardingStore().step === 'ready'"
      pattern: "useOnboardingStore"
    - from: "src/stores/use-onboarding-store.ts"
      to: "src/components/install/step-error.tsx"
      via: "useOnboardingStore().step === 'error'"
      pattern: "useOnboardingStore"
---

<objective>
Create the verification and completion steps of the onboarding wizard that verify the installation was successful and present the user with appropriate next steps.
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/03-installation-engine/RESEARCH.md
@.planning/phases/03-installation-engine/03-installation-engine-01-SUMMARY.md
@.planning/phases/03-installation-engine/03-installation-engine-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend - create verification orchestration command</name>
  <files>src-tauri/src/commands/verify_installation.rs, src-tauri/src/mod.rs</files>
  <action>
    Create the verification orchestration command in src-tauri/src/commands/verify_installation.rs:
      - Define a Tauri command `verify_installation` that takes an AppHandle and optionally the installation method (or we can determine it from state)
      - The command should:
          * Emit verification progress events (similar to install progress but for verification)
          * Determine whether the installation was Docker or native (we'll need to store this somewhere - perhaps in the onboarding store or we can pass it as a parameter)
          * Call the appropriate verification function:
              - For Docker: verify_gateway_health (which polls /healthz and /readyz)
              - For Native: verify_native_install (which runs openclaw doctor --yes)
          * Returns a VerificationResult struct indicating success or failure with details
      - We'll need to create a way to know which installation method was used - options:
          1. Pass the method as a parameter to the verify_installation command
          2. Store the method in the onboarding store (we'll update the store in plan 02)
          3. Check for the existence of Docker containers or other artifacts
      - We'll go with option 2 for simplicity: update the onboarding store to track the installation method when installation completes
    Update src-tauri/src/mod.rs to export the new verify_installation command.
    Define the VerificationResult struct (we'll put it in the same file for now).
  </action>
  <verify>
    <automated>
      cargo test --manifest-path src-tauri/Cargo.toml --lib --::commands::verify::tests::verify_installation_command_exists
    </automated>
  </verify>
  <done>
    The `verify_installation` Tauri command exists, can determine the installation method from state, calls the appropriate verification function, and returns a VerificationResult.
  </done>
</task>

<task type="auto">
  <name>Task 2: Frontend - create verification, success, and error UI components</name>
  <files>src/components/install/step-verify.tsx, src/components/install/step-ready.tsx, src/components/install/step-error.tsx, src/stores/use-onboarding-store.ts</files>
  <action>
    Update the onboarding store in src/stores/use-onboarding-store.ts:
      - Add installationMethod: InstallMethod | null to state (we'll need to import the InstallMethod type or define it)
      - Add verificationProgress: InstallProgress | null to state (we can reuse the InstallProgress type)
      - Add actions to set installation method when installation completes, set verification progress, handle verification completion/failure
      - When installation completes successfully in the install step, store the method and automatically transition to 'verify' step
      - When verification completes successfully, set step to 'ready'
      - When verification fails, set step to 'error' and store the error message
    Create the verification progress UI component in src/components/install/step-verify.tsx:
      - Similar to the install progress component but for verification
      - Display verification progress bar, step, and message
      - Have a "Retry Verification" button
      - Automatically transition to ready/error when verification completes
    Create the installation success screen UI component in src/components/install/step-ready.tsx:
      - Display success message
      - Show gateway URL (http://127.0.0.1:18789)
      - For Docker installations, show the gateway token and provide a "Copy Token" button
      - Provide an "Open Dashboard" button that opens the gateway URL in the default browser
      - Provide a "Done" button to exit the onboarding flow
    Create the installation error screen UI component in src/components/install/step-error.tsx:
      - Display error message with specific failure reason
      - Show suggestions for fixing the issue (from the verification error)
      - Provide "Retry Verification" button
      - Provide "Open Logs" button (for Docker: show docker compose logs suggestion)
      - Provide "Go Back" button to return to install step to try again
  </action>
  <verify>
    <automated>
      cd src && pnpm vitest run --reporter=verbose components/install/step-verify.tsx.test.tsx components/install/step-ready.tsx.test.tsx components/install/step-error.tsx.test.tsx -- --passWithNoTests
    </automated>
  </verify>
  <done>
    All three UI components (verify, ready, error) render correctly and handle their respective states. The onboarding store properly tracks installation method and verification state, and transitions between steps based on verification results.
  </done>
</task>

</tasks>

<verification>
Overall phase checks:
- Ensure the verification orchestration properly routes to Docker or native verification based on installation method
- Verify that verification progress events are emitted and displayed in the UI
- Confirm that success screen shows appropriate information (URL, token for Docker) and provides actionable next steps
- Check that error screen displays specific failure reasons and provides relevant recovery options
</verification>

<success_criteria>
- The `verify_installation` Tauri command exists and can determine whether to run Docker or native verification based on stored installation method
- Docker verification uses the verify_gateway_health function (polling /healthz and /readyz)
- Native verification uses the verify_native_install function (running openclaw doctor --yes)
- Verification progress events are emitted with step, percentage, and message and displayed in the UI
- Upon successful verification, the onboarding state transitions to 'ready' step and the success screen is displayed
- Upon verification failure, the onboarding state transitions to 'error' step and the error screen is displayed with specific failure reason and actionable suggestions
- The success screen displays the gateway URL and, for Docker installations, the gateway token with a copy function
- The error screen provides relevant recovery options (retry verification, view logs, go back to install)
</success_criteria>

<output>
After completion, create `.planning/phases/03-installation-engine/03-installation-engine-03-SUMMARY.md`
</output>