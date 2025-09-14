"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Post } from "@/lib/supabase"

interface RealTimeContextType {
  isOnline: boolean
  lastUpdate: Date | null
  newPostsCount: number
  markPostsAsRead: () => void
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

export function useRealTime() {
  const context = useContext(RealTimeContext)
  if (!context) {
    throw new Error("useRealTime must be used within a RealTimeProvider")
  }
  return context
}

interface RealTimeProviderProps {
  children: ReactNode
  posts: Post[]
  onPostsUpdate?: (posts: Post[]) => void
}

export function RealTimeProvider({ children, posts, onPostsUpdate }: RealTimeProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [lastKnownPostCount, setLastKnownPostCount] = useState(posts.length)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Simulate real-time updates (in a real app, this would be WebSocket or Server-Sent Events)
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      // Just update the last update time without generating posts
      setLastUpdate(new Date())
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [isOnline])

  // Track new posts
  useEffect(() => {
    if (posts.length > lastKnownPostCount) {
      setNewPostsCount((prev) => prev + (posts.length - lastKnownPostCount))
    }
    setLastKnownPostCount(posts.length)
  }, [posts.length, lastKnownPostCount])

  const markPostsAsRead = () => {
    setNewPostsCount(0)
  }

  return (
    <RealTimeContext.Provider
      value={{
        isOnline,
        lastUpdate,
        newPostsCount,
        markPostsAsRead,
      }}
    >
      {children}
    </RealTimeContext.Provider>
  )
}
