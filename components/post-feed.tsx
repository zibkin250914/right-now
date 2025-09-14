"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, ExternalLink, Edit } from "lucide-react"
import type { Post } from "@/lib/supabase"

interface PostFeedProps {
  posts: Post[]
  onDelete: (postId: string) => void
  onEdit: (postId: string) => void // Added onEdit prop for edit functionality
}

export function PostFeed({ posts, onDelete, onEdit }: PostFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)

  const handleJoinChat = (chatId: string) => {
    const chatUrl = `https://whereby.com/${chatId}`
    window.open(chatUrl, "_blank")
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "방금 전"
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}시간 전`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}일 전`
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">아직 게시물이 없습니다</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4" ref={feedRef} data-post-feed>
      {posts.map((post, index) => (
        <Card
          key={post.id}
          className="p-4 bg-card border border-border transition-all duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="flex gap-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(post.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(post.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Post Content */}
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium mb-1 text-balance">{post.message}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="font-bold">
                  {post.channel === "whereby(화상채팅)" ? `whereby.com/${post.chat_id}` : `라인 아이디: ${post.chat_id}`}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>

            {post.channel === "whereby(화상채팅)" && (
              <Button
                onClick={() => handleJoinChat(post.chat_id)}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                바로가기
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
