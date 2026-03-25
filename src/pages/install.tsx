import { useOnboardingStore } from "@/stores/use-onboarding-store";
import { SystemCheck } from "@/components/system-check";

function InstallPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

export function Install() {
  const { step } = useOnboardingStore();

  switch (step) {
    case "system_check":
      return <SystemCheck />;
    case "install":
      return <InstallPlaceholder title="Installing OpenClaw" />;
    case "verify":
      return <InstallPlaceholder title="Verifying Installation" />;
    case "ready":
      return <InstallPlaceholder title="Installation Complete" />;
    case "error":
      return <InstallPlaceholder title="Installation Error" />;
    default:
      return <SystemCheck />;
  }
}
