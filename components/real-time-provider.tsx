"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { Post } from "@/lib/supabase"

interface RealTimeContextType {
  isOnline: boolean
  lastUpdate: Date | null
  newPostsCount: number
  activeUsers: number
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
  onPostsUpdate?: (newPosts: Post[]) => void
  onPostUpdate?: (updatedPost: Post) => void
  onPostDelete?: (deletedPostId: string) => void
}

export function RealTimeProvider({ children, posts, onPostsUpdate, onPostUpdate, onPostDelete }: RealTimeProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [activeUsers, setActiveUsers] = useState(1) // Start with 1 (current user)
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

  // Track active users using presence
  useEffect(() => {
    if (!isOnline) return

    const channel = supabase
      .channel('active-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state).length
        setActiveUsers(Math.max(1, users)) // At least 1 (current user)
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state).length
        setActiveUsers(Math.max(1, users))
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state).length
        setActiveUsers(Math.max(1, users))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user as active
          await channel.track({
            user_id: Math.random().toString(36).substr(2, 9), // Generate unique ID
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOnline])

  // Supabase real-time subscription
  useEffect(() => {
    if (!isOnline) return

    console.log('Setting up real-time subscription for posts...')

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('New post received:', payload)
          const newPost = payload.new as Post
          
          // Add the new post to the beginning of the list
          onPostsUpdate?.([newPost])
          setLastUpdate(new Date())
          setNewPostsCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post updated:', payload)
          const updatedPost = payload.new as Post
          
          // Update the post in the list
          onPostUpdate?.(updatedPost)
          setLastUpdate(new Date())
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post deleted:', payload)
          const deletedPost = payload.old as Post
          
          // Remove the post from the list
          onPostDelete?.(deletedPost.id)
          setLastUpdate(new Date())
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to posts changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to posts changes')
          // Retry subscription after 5 seconds
          setTimeout(() => {
            console.log('Retrying subscription...')
            channel.subscribe()
          }, 5000)
        }
      })

    return () => {
      console.log('Cleaning up real-time subscription...')
      supabase.removeChannel(channel)
    }
  }, [isOnline, onPostsUpdate, onPostUpdate, onPostDelete])

  // Track new posts
  useEffect(() => {
    if (posts.length > lastKnownPostCount) {
      setNewPostsCount((prev) => prev + (posts.length - lastKnownPostCount))
    }
    setLastKnownPostCount(posts.length)
  }, [posts.length, lastKnownPostCount])

  // Fallback polling mechanism in case real-time fails
  useEffect(() => {
    if (!isOnline) return

    let isPolling = false // Prevent concurrent polls

    const pollForNewPosts = async () => {
      if (isPolling) return
      isPolling = true

      try {
        const response = await fetch(`/.netlify/functions/posts?page=1&limit=3`)
        if (response.ok) {
          const data = await response.json()
          const newPosts = data.posts || []
          
          if (newPosts.length > 0 && posts.length > 0) {
            // Check if there are any new posts
            const existingIds = new Set(posts.map(post => post.id))
            const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id))
            
            if (uniqueNewPosts.length > 0) {
              console.log('New posts found via polling:', uniqueNewPosts)
              onPostsUpdate?.(uniqueNewPosts)
              setLastUpdate(new Date())
              setNewPostsCount(prev => prev + uniqueNewPosts.length)
            }
          }
        }
      } catch (error) {
        console.error('Polling failed:', error)
      } finally {
        isPolling = false
      }
    }

    // Poll every 10 seconds as fallback
    const interval = setInterval(pollForNewPosts, 10000)

    return () => {
      clearInterval(interval)
      isPolling = false
    }
  }, [isOnline, posts, onPostsUpdate])

  const markPostsAsRead = () => {
    setNewPostsCount(0)
  }

  return (
    <RealTimeContext.Provider
      value={{
        isOnline,
        lastUpdate,
        newPostsCount,
        activeUsers,
        markPostsAsRead,
      }}
    >
      {children}
    </RealTimeContext.Provider>
  )
}
