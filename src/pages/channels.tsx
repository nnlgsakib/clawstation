import { useState, useMemo } from "react";
import {
  useChannels,
  useUpdateChannel,
  type ChannelInfo,
} from "@/hooks/use-channels";
import { useGatewayConfig } from "@/hooks/use-gateway";
import { useGatewayStore } from "@/stores/use-gateway-store";
import { useOpenClawMetadata } from "@/hooks/use-openclaw-metadata";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  MessageSquare,
  Settings2,
  Power,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChannelConfigForm } from "@/components/channels/channel-config-form";

// SVG-based channel icons (no emoji)
const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  whatsapp: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  telegram: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  discord: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  ),
  slack: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm6.312 8.58a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52v2.522a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.52v-2.522zm-1.271 0a2.528 2.528 0 0 1-2.521 2.52 2.528 2.528 0 0 1-2.522-2.52V8.834a2.528 2.528 0 0 1 2.522-2.521 2.528 2.528 0 0 1 2.521 2.521v6.313zm-6.312 0a2.528 2.528 0 0 1-2.522 2.52A2.528 2.528 0 0 1 2.522 14.88a2.528 2.528 0 0 1 2.522-2.521h6.312v2.522zm1.271-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.52h6.313A2.528 2.528 0 0 1 24 11.088a2.528 2.528 0 0 1-2.522 2.521h-6.313z" />
    </svg>
  ),
};

// Default icon for unknown channels
const DefaultChannelIcon = MessageSquare;

export function Channels() {
  const connected = useGatewayStore((s) => s.connected);
  const { data: channels, isLoading, refetch } = useChannels();
  const { data: gatewayConfig } = useGatewayConfig();
  const { data: metadata } = useOpenClawMetadata();

  const baseHash = ((gatewayConfig as Record<string, unknown> | undefined)?.baseHash as string) ?? "";

  // Merge Gateway data with metadata
  const allChannels = useMemo(() => {
    if (!metadata) return channels ?? [];
    return metadata.channels.map((ch) => {
      const gwChannel = channels?.find((c) => c.provider === ch.id);
      if (gwChannel) return gwChannel;
      return {
        provider: ch.id,
        name: ch.name,
        description: ch.description,
        enabled: false,
        config: {} as Record<string, unknown>,
        setupFields: ch.configFields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.fieldType as "text" | "password" | "select" | "boolean" | "number",
          placeholder: f.placeholder,
          required: f.required,
          options: f.enumValues?.map((v) => ({ label: v, value: v })),
        })),
        docsUrl: ch.docsUrl,
      } as ChannelInfo;
    });
  }, [metadata, channels]);

  // Count enabled channels
  const enabledCount = allChannels.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Channels
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect messaging platforms to your OpenClaw gateway.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {enabledCount} of {allChannels.length} enabled
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || !connected}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {!connected && (
        <Alert className="border-warning/30 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Gateway Not Connected</AlertTitle>
          <AlertDescription>
            Connect to the Gateway to manage channel configurations.{" "}
            <Link
              to="/install"
              className="font-medium underline hover:text-foreground"
            >
              Start Gateway
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {connected && isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {connected && !isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {allChannels?.map((channel) => (
            <ChannelCard
              key={channel.provider}
              channel={channel}
              baseHash={baseHash}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelCard({
  channel,
  baseHash,
}: {
  channel: ChannelInfo;
  baseHash: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const updateChannel = useUpdateChannel();
  const { data: metadata } = useOpenClawMetadata();

  const channelMetadata = useMemo(() => {
    if (!metadata) return null;
    return metadata.channels.find((ch) => ch.id === channel.provider) ?? null;
  }, [metadata, channel.provider]);

  const ChannelIcon = CHANNEL_ICONS[channel.provider] || DefaultChannelIcon;

  const handleToggle = async () => {
    if (!baseHash) {
      toast.error("No config hash available — refresh the page");
      return;
    }
    try {
      await updateChannel.mutateAsync({
        provider: channel.provider,
        config: { enabled: !channel.enabled },
        baseHash,
      });
      toast.success(`${channel.name} ${channel.enabled ? "disabled" : "enabled"}`);
    } catch (e) {
      toast.error(`Failed to update ${channel.name}: ${e}`);
    }
  };

  const handleSaveConfig = async (config: Record<string, string>) => {
    if (!baseHash) {
      toast.error("No config hash available — refresh the page");
      return;
    }
    try {
      await updateChannel.mutateAsync({
        provider: channel.provider,
        config,
        baseHash,
      });
      toast.success(`${channel.name} configuration saved`);
      setExpanded(false);
    } catch (e) {
      toast.error(`Failed to save ${channel.name} config: ${e}`);
    }
  };

  const hasConfigFields = channelMetadata
    ? channelMetadata.configFields.length > 0
    : channel.setupFields.length > 0;

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        channel.enabled && "border-success/30 bg-success-subtle/30",
        expanded && "shadow-md"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg",
                channel.enabled
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <ChannelIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{channel.name}</CardTitle>
              <Badge
                variant={channel.enabled ? "success" : "outline"}
                className="mt-1"
              >
                {channel.enabled ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Enabled
                  </span>
                ) : (
                  "Disabled"
                )}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="mt-2">{channel.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={channel.enabled ? "outline" : "default"}
            onClick={handleToggle}
            disabled={updateChannel.isPending}
          >
            {updateChannel.isPending ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <Power className="mr-2 h-3 w-3" />
            )}
            {channel.enabled ? "Disable" : "Enable"}
          </Button>

          {hasConfigFields && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              <Settings2 className="mr-2 h-3 w-3" />
              {expanded ? "Hide Config" : "Configure"}
            </Button>
          )}

          <a
            href={channel.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Expanded configuration form */}
        {expanded && channelMetadata && (
          <div className="mt-3 pt-3 border-t border-border">
            <ChannelConfigForm
              channel={channelMetadata}
              initialValues={channel.config as Record<string, string>}
              onSave={handleSaveConfig}
              isPending={updateChannel.isPending}
            />
          </div>
        )}

        {expanded && !channelMetadata && hasConfigFields && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Loading channel configuration...
            </p>
          </div>
        )}

        {/* Help text for enabled channels without config */}
        {!hasConfigFields && channel.enabled && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {channel.provider === "signal"
              ? "Requires signal-cli to be installed separately."
              : "Requires plugin installation after Gateway is running."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
