import { useMemo } from "react";
import { type ChannelInfo } from "@/hooks/use-channels";
import { useOpenClawMetadata } from "@/hooks/use-openclaw-metadata";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChannelConfigForm } from "@/components/channels/channel-config-form";

interface PairingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: ChannelInfo | null;
  onSuccess: () => void;
}

export function PairingModal({
  open,
  onOpenChange,
  channel,
  onSuccess,
}: PairingModalProps) {
  const { data: metadata } = useOpenClawMetadata();

  const channelMetadata = useMemo(() => {
    if (!channel || !metadata) return null;
    return metadata.channels.find((ch) => ch.id === channel.provider) ?? null;
  }, [channel, metadata]);

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Configure {channel.name}</DialogTitle>
        <DialogDescription>
          Enter your {channel.name} credentials to connect.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        {channelMetadata ? (
          <ChannelConfigForm
            channel={channelMetadata}
            initialValues={channel.config as Record<string, string>}
            onSave={() => {
              onSuccess();
              onOpenChange(false);
            }}
            showDmPolicy={true}
          />
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Use the channel configuration on the Channels page to set up{" "}
              {channel.name}.
            </div>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
