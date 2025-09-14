"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, ExternalLink, Edit, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Post } from "@/lib/supabase"

interface PostFeedProps {
  posts: Post[]
  onDelete: (postId: string) => void
  onEdit: (postId: string) => void // Added onEdit prop for edit functionality
  loadingMore?: boolean
  hasMore?: boolean
}

export function PostFeed({ posts, onDelete, onEdit, loadingMore, hasMore }: PostFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handleJoinChat = (chatId: string) => {
    const chatUrl = `https://whereby.com/${chatId}`
    window.open(chatUrl, "_blank")
  }

  const handleCopyLineId = async (lineId: string) => {
    try {
      await navigator.clipboard.writeText(lineId)
      toast({
        title: "복사 완료",
        description: "라인 아이디가 복사되었습니다",
        duration: 2000,
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: "복사 실패",
        description: "라인 아이디 복사에 실패했습니다",
        variant: "destructive",
        duration: 2000,
      })
    }
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
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {loadingMore ? "로딩 중..." : "아직 게시물이 없습니다"}
          </h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-2 sm:p-4" ref={feedRef} data-post-feed>
      {posts.map((post, index) => (
        <Card
          key={post.id}
          className="p-3 sm:p-4 bg-card border border-border transition-all duration-300"
        >
          {/* Mobile-optimized layout */}
          <div className="space-y-3">
            {/* Action buttons - top right on mobile */}
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(post.id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(post.id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <p className="text-foreground font-medium text-sm sm:text-base leading-relaxed break-words">
                {post.message}
              </p>
              
              {/* Chat info and time */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-muted-foreground font-bold break-all">
                  {post.channel === "whereby(화상채팅)" ? `whereby.com/${post.chat_id}` : `라인 아이디: ${post.chat_id}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(post.created_at)}
                </div>
              </div>
            </div>

            {/* Action button - full width on mobile */}
            {post.channel === "whereby(화상채팅)" && (
              <Button
                onClick={() => handleJoinChat(post.chat_id)}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                바로가기
              </Button>
            )}
            
            {/* Line ID copy button */}
            {post.channel === "Line(라인 아이디)" && (
              <Button
                onClick={() => handleCopyLineId(post.chat_id)}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                ID 복사하기
              </Button>
            )}
          </div>
        </Card>
      ))}
      
      {/* Loading indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* End of posts indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          모든 게시물을 불러왔습니다
        </div>
      )}
    </div>
  )
}
