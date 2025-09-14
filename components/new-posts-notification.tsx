"use client"

import { useRealTime } from "@/components/real-time-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUp } from "lucide-react"

interface NewPostsNotificationProps {
  onScrollToTop: () => void
}

export function NewPostsNotification({ onScrollToTop }: NewPostsNotificationProps) {
  const { newPostsCount, markPostsAsRead } = useRealTime()

  if (newPostsCount === 0) return null

  const handleClick = () => {
    onScrollToTop()
    markPostsAsRead()
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
      <Button
        onClick={handleClick}
        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg animate-bounce"
        size="sm"
      >
        <ArrowUp className="h-4 w-4 mr-1" />새 게시물 {newPostsCount}개
        <Badge variant="secondary" className="ml-2 bg-white text-primary">
          {newPostsCount}
        </Badge>
      </Button>
    </div>
  )
}
