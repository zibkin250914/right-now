"use client"

import { Button } from "@/components/ui/button"
import type { Channel } from "@/app/page"

interface ChannelTabsProps {
  activeChannel: Channel
  onChannelChange: (channel: Channel) => void
}

const channels: Channel[] = ["whereby(화상채팅)", "Line(라인 아이디)"]

export function ChannelTabs({ activeChannel, onChannelChange }: ChannelTabsProps) {
  return (
    <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
      {channels.map((channel) => (
        <Button
          key={channel}
          variant={activeChannel === channel ? "default" : "outline"}
          size="sm"
          onClick={() => onChannelChange(channel)}
          className={`whitespace-nowrap font-medium px-4 py-2 ${
            activeChannel === channel
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-foreground hover:text-primary hover:bg-primary/10 border-border"
          }`}
        >
          {channel}
        </Button>
      ))}
    </div>
  )
}
