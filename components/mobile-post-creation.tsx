"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import type { Channel } from "@/app/page"

interface MobilePostCreationProps {
  activeChannel: Channel
  onSubmit: (data: { channel: Channel; chat_id: string; message: string; password: string }) => void
  isSubmitting: boolean
  editingPost?: { id: string; chat_id: string; message: string; password: string }
  onUpdate?: (id: string, data: { channel: Channel; chat_id: string; message: string; password: string }) => void
  onCancelEdit?: () => void
}

export function MobilePostCreation({ activeChannel, onSubmit, isSubmitting, editingPost, onUpdate, onCancelEdit }: MobilePostCreationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [chatId, setChatId] = useState("")
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [rateLimitError, setRateLimitError] = useState("")
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Auto-open when editing
  useEffect(() => {
    if (editingPost) {
      setChatId(editingPost.chat_id)
      setMessage(editingPost.message)
      setPassword(editingPost.password)
      setIsOpen(true)
    } else {
      setChatId("")
      setMessage("")
      setPassword("")
      setIsOpen(false)
    }
  }, [editingPost])

  const checkRateLimit = async () => {
    try {
      const response = await fetch("/.netlify/functions/rate-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: activeChannel })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Rate limit check failed:", error)
      return { allowed: true } // Allow on error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatId.trim() || !message.trim()) return

    setRateLimitError("")

    // Validate Line ID for English characters only
    if (activeChannel === "Line(라인 아이디)") {
      const englishRegex = /^[a-zA-Z0-9._-]+$/
      if (!englishRegex.test(chatId)) {
        alert('라인 아이디는 영문, 숫자, 특수문자(._-)만 사용 가능합니다.')
        return
      }
    }

    // For new posts, password is required
    if (!editingPost && !password.trim()) {
      alert('비밀번호를 입력해주세요.')
      return
    }

    // Check rate limit for new posts only
    if (!editingPost) {
      const rateLimitResult = await checkRateLimit()
      if (!rateLimitResult.allowed) {
        setRateLimitError(rateLimitResult.message)
        return
      }
    }

    if (editingPost && onUpdate) {
      // Update existing post
      const success = await onUpdate(editingPost.id, {
        channel: activeChannel,
        chat_id: chatId.trim(),
        message: message.trim(),
        password: password.trim()
      })
      
      if (success) {
        // Close modal and reset editing state only on success
        setIsOpen(false)
        onCancelEdit?.()
        // Reset form fields
        setChatId("")
        setMessage("")
        setPassword("")
      }
    } else {
      // Create new post
      onSubmit({
        channel: activeChannel,
        chat_id: chatId.trim(),
        message: message.trim(),
        password: password.trim()
      })
      // Reset form
      setChatId("")
      setMessage("")
      setPassword("")
      setIsOpen(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      setIsOpen(false)
    }
  }

  const handleSwipeDown = () => {
    setIsOpen(false)
  }

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      // Only prevent body scroll, but allow modal content to scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-50 sm:hidden">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom Sheet */}
      {isOpen && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 bg-black/50 sm:hidden"
          onClick={handleBackdropClick}
        >
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 bg-muted rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden"
            style={{
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold">새 게시물 작성</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Rate limit error */}
              {rateLimitError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{rateLimitError}</p>
                </div>
              )}

              {/* Channel indicator */}
              <div className="text-sm text-muted-foreground">
                카테고리: <span className="font-medium text-foreground">{activeChannel}</span>
              </div>

              {/* Chat ID input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {activeChannel === "whereby(화상채팅)" ? "Room Name" : "라인 아이디"}
                </label>
                <div className="flex items-center gap-2">
                  {activeChannel === "whereby(화상채팅)" && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">whereby.com/</span>
                  )}
                  <Input
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder={activeChannel === "whereby(화상채팅)" ? "room-name" : "영문, 숫자, 특수문자(._-)만 사용"}
                    className="flex-1"
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Message input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">본문</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="본문을 입력하세요."
                  rows={4}
                  maxLength={200}
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {message.length}/200
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">비밀번호</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (4-8자리)"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  {editingPost ? "수정을 위해 비밀번호가 필요합니다" : "게시물 수정/삭제 시 필요합니다"}
                </p>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={!chatId.trim() || !message.trim() || !password.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "등록 중..." : "등록"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
