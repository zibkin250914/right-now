"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChannelTabs } from "@/components/channel-tabs"
import { PostFeed } from "@/components/post-feed"
import { PostCreationForm } from "@/components/post-creation-form"
import { FeedbackModal } from "@/components/feedback-modal"
import { PasswordModal } from "@/components/password-modal"
import { RealTimeProvider } from "@/components/real-time-provider"
import { ConnectionStatus } from "@/components/connection-status"
import { SearchBar } from "@/components/search-bar"
import { MobilePostCreation } from "@/components/mobile-post-creation"
import type { Post } from "@/lib/supabase"

export type Channel = "whereby(화상채팅)" | "Line(라인 아이디)"

export default function FlowApp() {
  const [activeChannel, setActiveChannel] = useState<Channel>("whereby(화상채팅)")
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    total: 0
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Post[]>([])
  const [searchPagination, setSearchPagination] = useState({
    page: 1,
    hasMore: true,
    total: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null) // Added editing post state
  const [newPostIds, setNewPostIds] = useState<string[]>([])
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean
    postId: string
    action: "edit" | "delete"
  }>({ isOpen: false, postId: "", action: "delete" })

  const mainRef = useRef<HTMLElement>(null)

  // Load posts from database
  useEffect(() => {
    const loadPosts = async (page = 1, append = false) => {
      try {
        if (page === 1) {
          setLoading(true)
        } else {
          setLoadingMore(true)
        }

        const response = await fetch(`/.netlify/functions/posts?page=${page}&limit=20`)
        if (response.ok) {
          const data = await response.json()
          const newPosts = data.posts || []
          
          if (append) {
            setPosts(prev => [...(prev || []), ...newPosts])
          } else {
            setPosts(newPosts)
          }
          
          setPagination({
            page: data.pagination.page,
            hasMore: data.pagination.hasMore,
            total: data.pagination.total
          })
        }
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }

    loadPosts()
  }, [])

  // Infinite scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !pagination.hasMore) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Load more when user scrolls to 80% of the page
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        loadMorePosts()
      }
    }

    const loadMorePosts = async () => {
      if (loadingMore || !pagination.hasMore) return

      try {
        setLoadingMore(true)
        const nextPage = pagination.page + 1
        const response = await fetch(`/.netlify/functions/posts?page=${nextPage}&limit=20`)
        
        if (response.ok) {
          const data = await response.json()
          const newPosts = data.posts || []
          
          setPosts(prev => [...(prev || []), ...newPosts])
          setPagination(prev => ({
            ...prev,
            page: data.pagination.page,
            hasMore: data.pagination.hasMore
          }))
        }
      } catch (error) {
        console.error('Failed to load more posts:', error)
      } finally {
        setLoadingMore(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pagination.hasMore, pagination.page, loadingMore])

  // Fast client-side search
  const handleSearch = async (query: string, channel: Channel) => {
    if (!query.trim()) {
      handleClearSearch()
      return
    }

    // Prevent duplicate searches
    if (searchQuery === query) {
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    try {
      // Get all posts for the channel (cached)
      const response = await fetch(`/.netlify/functions/posts?page=1&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        const allPosts = data.posts || []
        
        // Filter by channel first
        const channelPosts = allPosts.filter(post => post.channel === channel)
        
        // Client-side search
        const searchTerm = query.toLowerCase()
        const filteredPosts = channelPosts.filter(post => 
          post.chat_id.toLowerCase().includes(searchTerm) || 
          post.message.toLowerCase().includes(searchTerm)
        )
        
        setSearchResults(filteredPosts)
        setSearchPagination({
          page: 1,
          hasMore: false,
          total: filteredPosts.length
        })
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      setSearchPagination({
        page: 1,
        hasMore: false,
        total: 0
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setIsSearching(false)
    setSearchPagination({
      page: 1,
      hasMore: true,
      total: 0
    })
  }

  const addPost = async (newPost: Omit<Post, "id" | "created_at">) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/.netlify/functions/posts', {
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
        const newPost = data.post || data
        
        // Add new post to the list
        setPosts((prev) => [newPost, ...(prev || [])])
        
        // Trigger animation for new post
        setNewPostIds(prev => [...prev, newPost.id])
        
        // Clear animation after 4 seconds
        setTimeout(() => {
          setNewPostIds(prev => prev.filter(id => id !== newPost.id))
        }, 4000)
        
        // Update total count
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1
        }))
      } else {
        console.error('Failed to create post:', response.status)
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updatePost = async (postId: string, updatedPost: Omit<Post, "id" | "created_at">) => {
    try {
      console.log('Updating post:', postId, updatedPost)
      const response = await fetch(`/.netlify/functions/posts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: postId,
          channel: updatedPost.channel,
          chat_id: updatedPost.chat_id,
          message: updatedPost.message,
          password: updatedPost.password,
        }),
      })

      console.log('Update response:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Update success:', data)
        
        // Update post in local state
        setPosts((prev) => (prev || []).map((post) => (post.id === postId ? data.post : post)))
        
        // Exit edit mode and close any open forms
        setEditingPost(null)
        
        // Show success message
        alert('게시물이 수정되었습니다.')
        return true
      } else {
        const errorData = await response.json()
        console.error('Failed to update post:', response.status, errorData)
        alert(`수정 실패: ${errorData.error || `HTTP ${response.status}`}`)
        return false
      }
    } catch (error) {
      console.error('Failed to update post:', error)
      alert('수정 중 오류가 발생했습니다.')
      return false
    }
  }

  const handleRealTimePostsUpdate = (newPosts: Post[]) => {
    if (!newPosts || newPosts.length === 0) return
    
    setPosts((prev) => {
      // Check if any of the new posts already exist to avoid duplicates
      const existingIds = new Set(prev.map(post => post.id))
      const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id))
      
      if (uniqueNewPosts.length === 0) return prev
      
      // Trigger animation for new posts from real-time updates
      const newPostIds = uniqueNewPosts.map(post => post.id)
      setNewPostIds(prev => [...prev, ...newPostIds])
      
      // Clear animation after 4 seconds
      setTimeout(() => {
        setNewPostIds(prev => prev.filter(id => !newPostIds.includes(id)))
      }, 4000)
      
      // Add new posts to the beginning of the list
      return [...uniqueNewPosts, ...prev]
    })
  }

  const handleRealTimePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => 
      prev.map(post => post.id === updatedPost.id ? updatedPost : post)
    )
  }

  const handleRealTimePostDelete = (deletedPostId: string) => {
    setPosts((prev) => prev.filter(post => post.id !== deletedPostId))
  }

  const handleEditPost = (postId: string) => {
    setPasswordModal({ isOpen: true, postId, action: "edit" })
  }

  const handleDeletePost = (postId: string) => {
    setPasswordModal({ isOpen: true, postId, action: "delete" })
  }

  const handlePasswordVerification = (password: string) => {
    const post = posts.find((p) => p.id === passwordModal.postId)
    if (post && post.password === password) {
      const action = passwordModal.action
      const postId = passwordModal.postId
      
      // Close password modal first
      setPasswordModal({ isOpen: false, postId: "", action: "delete" })
      
      // Execute action after modal closes
      if (action === "delete") {
        // Delete immediately after password verification
        deletePost(postId)
      } else if (action === "edit") {
        // Set editing post after password verification
        setEditingPost(post)
      }
      return true
    }
    // Return false to keep modal open and show error message
    return false
  }

  const deletePost = async (postId: string) => {
    try {
      console.log('Deleting post:', postId)
      const response = await fetch(`/.netlify/functions/posts`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: postId })
      })

      console.log('Delete response:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Delete success:', data)
        
        // Remove post from local state
        setPosts((prev) => (prev || []).filter((post) => post.id !== postId))
        
        // Update pagination total
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }))
        
        // Show success message
        alert('게시물이 삭제되었습니다.')
        return true
      } else {
        const errorData = await response.json()
        console.error('Failed to delete post:', response.status, errorData)
        alert(`삭제 실패: ${errorData.error || `HTTP ${response.status}`}`)
        return false
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('삭제 중 오류가 발생했습니다.')
      return false
    }
  }



  const handleCancelEdit = () => {
    setEditingPost(null)
  }


  const filteredPosts = searchQuery 
    ? searchResults?.filter((post) => post.channel === activeChannel) || []
    : posts?.filter((post) => post.channel === activeChannel) || []

  return (
    <RealTimeProvider 
      posts={posts} 
      onPostsUpdate={handleRealTimePostsUpdate}
      onPostUpdate={handleRealTimePostUpdate}
      onPostDelete={handleRealTimePostDelete}
    >
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-center py-3 sm:py-4 relative px-4">
            <a 
              href="https://right-now.live" 
              className="text-xl sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Right Now
            </a>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFeedbackModal(true)}
                className="p-1.5 sm:p-2"
                title="피드백 보내기"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
          <ChannelTabs activeChannel={activeChannel} onChannelChange={setActiveChannel} />
          <ConnectionStatus />
        </header>

        {/* Search Bar */}
        <SearchBar 
          activeChannel={activeChannel}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          isSearching={isSearching}
        />


        {/* Main Content */}
        <main ref={mainRef} className="pb-20 sm:pb-80">
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
            <>
              {/* Search Results Info */}
              {searchQuery && (
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">"{searchQuery}"</span> 검색 결과: {searchPagination.total}개
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSearch}
                      className="text-xs"
                    >
                      검색 취소
                    </Button>
                  </div>
                </div>
              )}
              
              <PostFeed
                data-post-feed // Added attribute for event dispatching
                posts={filteredPosts}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
                loadingMore={loadingMore}
                hasMore={searchQuery ? searchPagination.hasMore : pagination.hasMore}
                newPostIds={newPostIds}
              />
            </>
          )}
        </main>

        {/* Desktop Post Creation Form */}
        <div className="hidden sm:block">
          <PostCreationForm
            activeChannel={activeChannel}
            onSubmit={addPost}
            editingPost={editingPost} // Pass editing post
            onCancelEdit={handleCancelEdit} // Pass cancel edit handler
            onUpdatePost={updatePost} // Pass update post handler
          />
        </div>

        {/* Mobile Post Creation */}
        <MobilePostCreation
          activeChannel={activeChannel}
          onSubmit={addPost}
          isSubmitting={isSubmitting}
          editingPost={editingPost}
          onUpdate={updatePost}
          onCancelEdit={handleCancelEdit}
        />


        <FeedbackModal isOpen={feedbackModal} onClose={() => setFeedbackModal(false)} />
        
        {/* Password Modal */}
        <PasswordModal
          isOpen={passwordModal.isOpen}
          action={passwordModal.action}
          onClose={() => setPasswordModal({ isOpen: false, postId: "", action: "delete" })}
          onVerify={handlePasswordVerification}
        />
      </div>
    </RealTimeProvider>
  )
}
