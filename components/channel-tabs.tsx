"use client"

import { Button } from "@/components/ui/button"
import type { Channel } from "@/app/page"

interface ChannelTabsProps {
  activeChannel: Channel
  onChannelChange: (channel: Channel) => void
}

const channels: Channel[] = ["전체", "whereby(화상채팅)", "Line(라인 아이디)", "오픈카톡"]

// 채널별 테마 색상 정의
const channelColors = {
  "전체": {
    active: "bg-gray-600 text-white",
    inactive: "text-gray-600 hover:text-gray-700 hover:bg-gray-100 border-gray-300"
  },
  "whereby(화상채팅)": {
    active: "bg-red-700 text-white",
    inactive: "text-red-700 hover:text-red-800 hover:bg-red-50 border-red-300"
  },
  "Line(라인 아이디)": {
    active: "bg-green-600 text-white",
    inactive: "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
  },
  "오픈카톡": {
    active: "bg-yellow-500 text-black",
    inactive: "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-300"
  }
}

export function ChannelTabs({ activeChannel, onChannelChange }: ChannelTabsProps) {
  return (
    <div className="flex gap-1 sm:gap-2 px-2 sm:px-4 pb-3 overflow-x-auto">
      {channels.map((channel) => {
        const colors = channelColors[channel]
        return (
          <Button
            key={channel}
            variant={activeChannel === channel ? "default" : "outline"}
            size="sm"
            onClick={() => onChannelChange(channel)}
            className={`whitespace-nowrap font-medium px-3 sm:px-4 py-2 text-xs sm:text-sm ${
              activeChannel === channel
                ? `${colors.active} shadow-md`
                : `${colors.inactive}`
            }`}
          >
            {channel}
          </Button>
        )
      })}
    </div>
  )
}
