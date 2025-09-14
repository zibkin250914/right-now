"use client"

import { useRealTime } from "@/components/real-time-provider"
import { Wifi, WifiOff, Clock } from "lucide-react"

export function ConnectionStatus() {
  const { isOnline, lastUpdate } = useRealTime()

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return ""

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "방금 업데이트됨"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전 업데이트`
    return `${Math.floor(diffInSeconds / 3600)}시간 전 업데이트`
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs">
      <div className="flex items-center gap-1">
        {isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
        <span className="text-foreground">{isOnline ? "온라인" : "오프라인"}</span>
      </div>

      {isOnline && lastUpdate && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatLastUpdate(lastUpdate)}</span>
        </div>
      )}
    </div>
  )
}
