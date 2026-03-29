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
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChannelConfigForm } from "@/components/channels/channel-config-form";

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "📱",
  telegram: "✈️",
  discord: "🎮",
  slack: "💬",
  signal: "🔒",
  msteams: "👥",
  imessage: "💬",
  irc: "🌐",
  googlechat: "💬",
  line: "💚",
  matrix: "🔢",
  mattermost: "🟦",
  feishu: "🐦",
  twitch: "📺",
  nostr: "⚡",
  "synology-chat": "🏠",
  "nextcloud-talk": "☁️",
  bluebubbles: "🫧",
  zalo: "🇻🇳",
  zalouser: "🇻🇳",
  "voice-call": "📞",
  openshell: "🐚",
  tlon: "🌍",
  "device-pair": "📱",
  "phone-control": "📞",
};

export function Channels() {
  const connected = useGatewayStore((s) => s.connected);
  const { data: channels, isLoading, refetch } = useChannels();
  const { data: gatewayConfig } = useGatewayConfig();
  const { data: metadata } = useOpenClawMetadata();

  const baseHash = (gatewayConfig as Record<string, unknown> | undefined)?.baseHash as string ?? "";

  // Merge Gateway data with metadata — show all known channels
  const allChannels = useMemo(() => {
    if (!metadata) return channels ?? [];
    return metadata.channels.map(ch => {
      const gwChannel = channels?.find(c => c.provider === ch.id);
      if (gwChannel) return gwChannel;
      // Create a stub ChannelInfo from metadata
      return {
        provider: ch.id,
        name: ch.name,
        description: ch.description,
        enabled: false,
        config: {} as Record<string, unknown>,
        setupFields: ch.configFields.map(f => ({
          key: f.key,
          label: f.label,
          type: f.fieldType as "text" | "password" | "select" | "boolean" | "number",
          placeholder: f.placeholder,
          required: f.required,
          options: f.enumValues?.map(v => ({ label: v, value: v })),
        })),
        docsUrl: ch.docsUrl,
      } as ChannelInfo;
    });
  }, [metadata, channels]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">
            Manage messaging channels through the OpenClaw Gateway.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || !connected}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {!connected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Gateway Not Connected</AlertTitle>
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
          {Array.from({ length: 4 }).map((_, i) => (
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
    return metadata.channels.find(ch => ch.id === channel.provider) ?? null;
  }, [metadata, channel.provider]);

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
      toast.success(
        `${channel.name} ${channel.enabled ? "disabled" : "enabled"}`
      );
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
        "transition-colors",
        channel.enabled ? "border-primary/50" : ""
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span>{CHANNEL_ICONS[channel.provider] ?? "📡"}</span>
            {channel.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {channel.enabled ? (
              <Badge className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="outline">Disabled</Badge>
            )}
          </div>
        </div>
        <CardDescription>{channel.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={channel.enabled ? "outline" : "default"}
            onClick={handleToggle}
            disabled={updateChannel.isPending}
          >
            {updateChannel.isPending ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : null}
            {channel.enabled ? "Disable" : "Enable"}
          </Button>
          {hasConfigFields && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Hide Config" : "Configure"}
            </Button>
          )}
          <a
            href={channel.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Docs <ExternalLink className="ml-0.5 inline h-3 w-3" />
          </a>
        </div>

        {expanded && channelMetadata && (
          <ChannelConfigForm
            channel={channelMetadata}
            initialValues={channel.config as Record<string, string>}
            onSave={handleSaveConfig}
            isPending={updateChannel.isPending}
          />
        )}

        {expanded && !channelMetadata && hasConfigFields && (
          <div className="space-y-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Loading channel configuration...
            </p>
          </div>
        )}

        {!hasConfigFields && channel.enabled && (
          <p className="text-xs text-muted-foreground">
            {channel.provider === "signal"
              ? "Requires signal-cli to be installed separately."
              : "Requires plugin installation after Gateway is running."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
