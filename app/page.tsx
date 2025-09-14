"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChannelTabs } from "@/components/channel-tabs"
import { PostFeed } from "@/components/post-feed"
import { PostCreationForm } from "@/components/post-creation-form"
import { PasswordModal } from "@/components/password-modal"
import { FeedbackModal } from "@/components/feedback-modal"
import { RealTimeProvider } from "@/components/real-time-provider"
import { ConnectionStatus } from "@/components/connection-status"
import { NewPostsNotification } from "@/components/new-posts-notification"
import type { Post } from "@/lib/supabase"

export type Channel = "영화" | "게임" | "스터디" | "일상" | "자유" | "whereby(화상채팅)" | "Line(라인 아이디)"

export default function FlowApp() {
  const [activeChannel, setActiveChannel] = useState<Channel>("영화")
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean
    postId: string
    action: "delete" | "edit" // Added edit action support
  }>({ isOpen: false, postId: "", action: "delete" })
  const [feedbackModal, setFeedbackModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null) // Added editing post state

  const mainRef = useRef<HTMLElement>(null)

  // Load posts from database
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch('/api/posts')
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts)
        }
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  const addPost = async (newPost: Omit<Post, "id" | "created_at">) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: newPost.channel,
          chat_id: newPost.chat_id,
          message: newPost.message,
          password: newPost.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPosts((prev) => [data.post, ...prev])
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const updatePost = async (postId: string, updatedPost: Omit<Post, "id" | "created_at">) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: updatedPost.channel,
          chat_id: updatedPost.chat_id,
          message: updatedPost.message,
          password: updatedPost.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPosts((prev) => prev.map((post) => (post.id === postId ? data.post : post)))
        setEditingPost(null) // Exit edit mode
      }
    } catch (error) {
      console.error('Failed to update post:', error)
    }
  }

  const handleRealTimePostsUpdate = (newPosts: Post[]) => {
    setPosts((prev) => [...newPosts, ...prev])
  }

  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== postId))
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const handlePasswordVerification = (password: string) => {
    const post = posts.find((p) => p.id === passwordModal.postId)
    if (post && post.password === password) {
      if (passwordModal.action === "delete") {
        deletePost(passwordModal.postId)
      } else if (passwordModal.action === "edit") {
        setEditingPost(post) // Enter edit mode
      }
      setPasswordModal({ isOpen: false, postId: "", action: "delete" })
      return true
    }
    return false
  }

  const handleCancelEdit = () => {
    setEditingPost(null)
  }

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const filteredPosts = posts.filter((post) => post.channel === activeChannel)

  return (
    <RealTimeProvider posts={posts} onPostsUpdate={handleRealTimePostsUpdate}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-center py-4 relative">
            <h1 className="text-2xl font-bold text-primary">Right Now</h1>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/admin', '_blank')}
                className="p-2"
                title="관리자 패널"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFeedbackModal(true)}
                className="p-2"
                title="피드백 보내기"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <ChannelTabs activeChannel={activeChannel} onChannelChange={setActiveChannel} />
          <ConnectionStatus />
        </header>

        {/* New Posts Notification */}
        <NewPostsNotification onScrollToTop={scrollToTop} />

        {/* Main Content */}
        <main ref={mainRef} className="pb-80">
          {" "}
          {/* Extra padding for fixed form */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            </div>
          ) : (
            <PostFeed
              data-post-feed // Added attribute for event dispatching
              posts={filteredPosts}
              onDelete={(postId) => setPasswordModal({ isOpen: true, postId, action: "delete" })}
              onEdit={(postId) => setPasswordModal({ isOpen: true, postId, action: "edit" })} // Added edit handler
            />
          )}
        </main>

        {/* Fixed Post Creation Form */}
        <PostCreationForm
          activeChannel={activeChannel}
          onSubmit={addPost}
          editingPost={editingPost} // Pass editing post
          onCancelEdit={handleCancelEdit} // Pass cancel edit handler
          onUpdatePost={updatePost} // Pass update post handler
        />

        {/* Password Modal */}
        <PasswordModal
          isOpen={passwordModal.isOpen}
          action={passwordModal.action}
          onClose={() => setPasswordModal({ isOpen: false, postId: "", action: "delete" })}
          onVerify={handlePasswordVerification}
        />

        <FeedbackModal isOpen={feedbackModal} onClose={() => setFeedbackModal(false)} />
      </div>
    </RealTimeProvider>
  )
}
