"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Channel } from "@/app/page"
import type { Post } from "@/lib/supabase"

interface PostCreationFormProps {
  activeChannel: Channel
  onSubmit: (post: Omit<Post, "id" | "created_at">) => void
  editingPost?: Post | null // Added editingPost prop for edit mode
  onCancelEdit?: () => void // Added onCancelEdit prop
  onUpdatePost?: (postId: string, updatedPost: Omit<Post, "id" | "created_at">) => void // Added onUpdatePost prop
}

export function PostCreationForm({
  activeChannel,
  onSubmit,
  editingPost,
  onCancelEdit,
  onUpdatePost,
}: PostCreationFormProps) {
  const [formData, setFormData] = useState({
    chat_id: "",
    message: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rateLimitError, setRateLimitError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)

  useEffect(() => {
    if (editingPost) {
      setFormData({
        chat_id: editingPost.chat_id,
        message: editingPost.message,
        password: editingPost.password,
      })
      setSelectedChannel(editingPost.channel)
      setIsExpanded(true) // Auto-expand when editing
    } else {
      setFormData({ chat_id: "", message: "", password: "" })
      setSelectedChannel(null)
      setIsExpanded(false) // Collapse when not editing
    }
    setErrors({})
    setRateLimitError("")
  }, [editingPost])

  // activeChannel에 따라 selectedChannel 초기화
  useEffect(() => {
    if (activeChannel !== "전체") {
      setSelectedChannel(activeChannel)
    } else {
      setSelectedChannel(null)
    }
  }, [activeChannel])


  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.chat_id.trim()) {
      newErrors.chat_id = selectedChannel === "whereby(화상채팅)" ? "whereby 링크를 입력해주세요" : 
                          selectedChannel === "Line(라인 아이디)" ? "라인 아이디를 입력해주세요" :
                          selectedChannel === "오픈카톡" ? "오픈카톡 링크를 입력해주세요" :
                          "채팅방 정보를 입력해주세요"
    } else if (selectedChannel === "whereby(화상채팅)") {
      // Check if whereby link is a valid URL
      const urlRegex = /^https?:\/\/whereby\.com\/[a-zA-Z0-9._-]+$/
      if (!urlRegex.test(formData.chat_id)) {
        newErrors.chat_id = "올바른 whereby 링크를 입력해주세요 (예: https://whereby.com/room-name)"
      }
    } else if (selectedChannel === "Line(라인 아이디)") {
      // Check if Line ID contains only English characters, numbers, and common symbols
      const englishRegex = /^[a-zA-Z0-9._-]+$/
      if (!englishRegex.test(formData.chat_id)) {
        newErrors.chat_id = "라인 아이디는 영문, 숫자, 특수문자(._-)만 사용 가능합니다"
      }
    } else if (selectedChannel === "오픈카톡") {
      // Check if Kakao link is a valid URL
      const urlRegex = /^https?:\/\/open\.kakao\.com\/o\/[a-zA-Z0-9._-]+$/
      if (!urlRegex.test(formData.chat_id)) {
        newErrors.chat_id = "올바른 오픈카톡 링크를 입력해주세요 (예: https://open.kakao.com/o/abc123)"
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = "초대 메시지를 입력해주세요"
    } else if (formData.message.length > 200) {
      newErrors.message = "메시지는 200자를 초과할 수 없습니다"
    }

    if (!formData.password.trim()) {
      newErrors.password = "비밀번호를 입력해주세요"
    } else if (formData.password.length < 4 || formData.password.length > 8) {
      newErrors.password = "비밀번호는 4-8자리여야 합니다"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkRateLimit = async () => {
    try {
      const response = await fetch("/.netlify/functions/rate-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: selectedChannel })
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
    setRateLimitError("")

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (!editingPost) {
        const rateLimitResult = await checkRateLimit()
        if (!rateLimitResult.allowed) {
          setRateLimitError(rateLimitResult.message)
          setIsSubmitting(false)
          return
        }
      }

      if (editingPost && onUpdatePost) {
        const success = await onUpdatePost(editingPost.id, {
          channel: selectedChannel,
          chat_id: formData.chat_id,
          message: formData.message,
          password: formData.password,
        })
        
        if (success) {
          // Reset form and exit edit mode only on success
          setFormData({ chat_id: "", message: "", password: "" })
          setErrors({})
          setIsExpanded(false)
        }
      } else {
        onSubmit({
          channel: selectedChannel,
          chat_id: formData.chat_id,
          message: formData.message,
          password: formData.password,
        })
        // Reset form
        setFormData({ chat_id: "", message: "", password: "" })
        setErrors({})
        setIsExpanded(false) // Collapse form after successful submission
      }
    } catch (error) {
      console.error("Submit failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    if (onCancelEdit) {
      onCancelEdit()
    }
    setFormData({ chat_id: "", message: "", password: "" })
    setErrors({})
    setRateLimitError("")
    setIsExpanded(false) // Collapse form when canceling
  }

  const getFieldClassName = (fieldName: string, hasError: boolean) => {
    const fieldValue = formData[fieldName as keyof typeof formData]
    const isEmpty = !fieldValue || !fieldValue.trim()
    if (hasError) return "border-destructive"
    if (isEmpty) return "border-required border-1"
    return ""
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-muted border-t border-border">
      <div className="p-4">
        <Card className="p-4 bg-muted border border-border">
          {rateLimitError && (
            <Alert className="mb-4 border-destructive">
              <AlertDescription className="text-destructive">{rateLimitError}</AlertDescription>
            </Alert>
          )}

          {!isExpanded ? (
            // Collapsed state - show button
            <Button
              onClick={() => setIsExpanded(true)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              작성하기
            </Button>
          ) : (
            // Expanded state - show form
            <div className="space-y-4">
              {/* Form Header with Close Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">글 작성</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Channel Selection Radio Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium">채널 선택</label>
                <div className="flex gap-4">
                  {[
                    { value: "whereby(화상채팅)", label: "whereby(화상채팅)" },
                    { value: "Line(라인 아이디)", label: "Line(라인 아이디)" },
                    { value: "오픈카톡", label: "오픈카톡" }
                  ].map((channel) => (
                    <label
                      key={channel.value}
                      className={`flex items-center gap-2 cursor-pointer transition-all ${
                        activeChannel === "전체" ? "" : "opacity-50 pointer-events-none"
                      }`}
                    >
                      <input
                        type="radio"
                        name="channel"
                        value={channel.value}
                        checked={selectedChannel === channel.value}
                        onChange={(e) => setSelectedChannel(e.target.value as Channel)}
                        className="w-4 h-4"
                        disabled={activeChannel !== "전체"}
                      />
                      <span className="text-sm font-medium">{channel.label}</span>
                    </label>
                  ))}
                </div>
                {activeChannel === "전체" && !selectedChannel && (
                  <p className="text-sm text-blue-600">작성 타입을 먼저 선택하세요</p>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chat ID Input */}
            <div className={`${activeChannel === "전체" && !selectedChannel ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedChannel === "whereby(화상채팅)" ? "주소 링크:" :
                   selectedChannel === "Line(라인 아이디)" ? "라인 아이디:" :
                   selectedChannel === "오픈카톡" ? "오픈카톡 링크:" :
                   "채팅방:"}
                </span>
                <div className="flex-1">
                  <Input
                    value={formData.chat_id}
                    onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                    placeholder={
                      selectedChannel === "whereby(화상채팅)" ? "https://whereby.com/room-name" : 
                      selectedChannel === "Line(라인 아이디)" ? "영문, 숫자, 특수문자(._-)만 사용" :
                      selectedChannel === "오픈카톡" ? "https://open.kakao.com/o/..." :
                      "채팅방 정보"
                    }
                    className={`${getFieldClassName("chat_id", !!errors.chat_id)} placeholder:text-muted-foreground/60`}
                    disabled={activeChannel === "전체" && !selectedChannel}
                  />
                  {errors.chat_id && <p className="text-xs text-destructive mt-1">{errors.chat_id}</p>}
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className={`${activeChannel === "전체" && !selectedChannel ? "opacity-50 pointer-events-none" : ""}`}>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="본문을 입력하세요."
                rows={3}
                className={`${getFieldClassName("message", !!errors.message)} placeholder:text-muted-foreground/60`}
                maxLength={200}
                disabled={activeChannel === "전체" && !selectedChannel}
              />
              <div className="flex justify-between items-center mt-1">
                <div>{errors.message && <p className="text-xs text-destructive">{errors.message}</p>}</div>
                <p className="text-xs text-muted-foreground">{formData.message.length}/200</p>
              </div>
            </div>

            {/* Password Input */}
            <div className={`${activeChannel === "전체" && !selectedChannel ? "opacity-50 pointer-events-none" : ""}`}>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호 (4-8자리)"
                className={`${getFieldClassName("password", !!errors.password)} placeholder:text-muted-foreground/60`}
                disabled={activeChannel === "전체" && !selectedChannel}
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {editingPost ? "수정을 위해 비밀번호가 필요합니다" : "게시물 수정/삭제 시 필요합니다"}
              </p>
            </div>

            <div className={`pt-2 ${activeChannel === "전체" ? "opacity-50 pointer-events-none" : ""}`}>
              {editingPost ? (
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || (activeChannel === "전체" && !selectedChannel)}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSubmitting ? "수정 중..." : "수정"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1 bg-transparent">
                    취소
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || (activeChannel === "전체" && !selectedChannel)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? "등록 중..." : "등록"}
                </Button>
              )}
            </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
