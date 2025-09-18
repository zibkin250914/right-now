"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, ExternalLink, Edit, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Post } from "@/lib/supabase"

// 채널별 테마 색상 정의
const channelColors = {
  "whereby(화상채팅)": {
    card: "bg-red-50 border-red-200",
    text: "text-red-800",
    button: "border-red-300 text-red-700 hover:bg-red-100"
  },
  "Line(라인 아이디)": {
    card: "bg-green-50 border-green-200",
    text: "text-green-800",
    button: "border-green-300 text-green-700 hover:bg-green-100"
  },
  "오픈카톡": {
    card: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-800",
    button: "border-yellow-300 text-yellow-700 hover:bg-yellow-100"
  }
}

interface PostFeedProps {
  posts: Post[]
  onDelete: (postId: string) => void
  onEdit: (postId: string) => void // Added onEdit prop for edit functionality
  loadingMore?: boolean
  hasMore?: boolean
  newPostIds?: string[] // IDs of newly added posts for animation
}

export function PostFeed({ posts, onDelete, onEdit, loadingMore, hasMore, newPostIds = [] }: PostFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [animatedPosts, setAnimatedPosts] = useState<Set<string>>(new Set())

  // Handle new post animations
  useEffect(() => {
    if (newPostIds.length > 0) {
      newPostIds.forEach(postId => {
        if (!animatedPosts.has(postId)) {
          setAnimatedPosts(prev => new Set([...prev, postId]))
          
          // Remove animation classes after animation completes
          setTimeout(() => {
            setAnimatedPosts(prev => {
              const newSet = new Set(prev)
              newSet.delete(postId)
              return newSet
            })
          }, 4000) // Remove after 4 seconds (increased for longer animation)
        }
      })
    }
  }, [newPostIds, animatedPosts])

  const handleJoinChat = (chatId: string) => {
    // chatId is now the full URL, so use it directly
    window.open(chatId, "_blank")
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

  // 링크를 감지하고 하이퍼링크로 변환하는 함수
  const renderMessageWithLinks = (message: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = message.split(urlRegex)
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {part}
          </a>
        )
      }
      return part
    })
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
      {posts.map((post, index) => {
        const isNewPost = animatedPosts.has(post.id)
        const isNewlyAdded = newPostIds.includes(post.id)
        const channelColor = channelColors[post.channel as keyof typeof channelColors]
        
        return (
          <Card
            key={post.id}
            className={`p-3 sm:p-4 border transition-all duration-300 ${
              channelColor ? channelColor.card : 'bg-card border-border'
            } ${
              isNewPost || isNewlyAdded 
                ? 'new-post-enter new-post-highlight new-post-glow new-post-creation new-post-color-transition' 
                : ''
            }`}
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
              <p className={`font-medium text-sm sm:text-base leading-relaxed break-words ${
                channelColor ? channelColor.text : 'text-foreground'
              }`}>
                {renderMessageWithLinks(post.message)}
              </p>
              
              {/* Chat info and time */}
              <div className="space-y-1">
                <div className={`text-xs sm:text-sm font-bold break-all ${
                  channelColor ? channelColor.text : 'text-muted-foreground'
                }`}>
                  {post.channel === "whereby(화상채팅)" ? `whereby: ${post.chat_id}` : 
                   post.channel === "Line(라인 아이디)" ? `라인 아이디: ${post.chat_id}` :
                   post.channel === "오픈카톡" ? `오픈카톡: https://open.kakao.com/o/${post.chat_id}` :
                   `${post.chat_id}`}
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
                className={`w-full sm:w-auto transition-colors ${
                  channelColor ? channelColor.button : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
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
                className={`w-full sm:w-auto transition-colors ${
                  channelColor ? channelColor.button : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                <Copy className="h-4 w-4 mr-2" />
                ID 복사하기
              </Button>
            )}
            
            {/* 오픈카톡 바로가기 button */}
            {post.channel === "오픈카톡" && (
              <Button
                onClick={() => window.open(`https://open.kakao.com/o/${post.chat_id}`, "_blank")}
                size="sm"
                variant="outline"
                className={`w-full sm:w-auto transition-colors ${
                  channelColor ? channelColor.button : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                바로가기
              </Button>
            )}
          </div>
        </Card>
        )
      })}
      
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
