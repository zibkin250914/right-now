"use client"

import { useRealTime } from "@/components/real-time-provider"
import { Wifi, WifiOff, Users } from "lucide-react"

export function ConnectionStatus() {
  const { isOnline, activeUsers } = useRealTime()

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs">
      <div className="flex items-center gap-1">
        {isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
        <span className="text-foreground">{isOnline ? "온라인" : "오프라인"}</span>
      </div>

      {isOnline && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{activeUsers}명 접속중</span>
        </div>
      )}
    </div>
  )
}
