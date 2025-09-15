"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

  useEffect(() => {
    if (editingPost) {
      setFormData({
        chat_id: editingPost.chat_id,
        message: editingPost.message,
        password: editingPost.password,
      })
    } else {
      setFormData({ chat_id: "", message: "", password: "" })
    }
    setErrors({})
    setRateLimitError("")
  }, [editingPost])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.chat_id.trim()) {
      newErrors.chat_id = activeChannel === "whereby(화상채팅)" ? "room-name을 입력해주세요" : "라인 아이디를 입력해주세요"
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
        onUpdatePost(editingPost.id, {
          channel: activeChannel,
          chat_id: formData.chat_id,
          message: formData.message,
          password: formData.password,
        })
      } else {
        onSubmit({
          channel: activeChannel,
          chat_id: formData.chat_id,
          message: formData.message,
          password: formData.password,
        })
      }

      // Reset form
      setFormData({ chat_id: "", message: "", password: "" })
      setErrors({})
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
  }

  const getFieldClassName = (fieldName: string, hasError: boolean) => {
    const fieldValue = formData[fieldName as keyof typeof formData]
    const isEmpty = !fieldValue || !fieldValue.trim()
    if (hasError) return "border-destructive"
    if (isEmpty) return "border-required border-1"
    return ""
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="p-4">
        <Card className="p-4 bg-card border border-border">
          {rateLimitError && (
            <Alert className="mb-4 border-destructive">
              <AlertDescription className="text-destructive">{rateLimitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chat ID Input */}
            <div>
              <div className="flex items-center gap-2">
                {activeChannel === "whereby(화상채팅)" ? (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">https://whereby.com/</span>
                ) : (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">라인 아이디:</span>
                )}
                <div className="flex-1">
                  <Input
                    value={formData.chat_id}
                    onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                    placeholder={activeChannel === "whereby(화상채팅)" ? "room-name" : "라인 아이디 입력"}
                    className={`${getFieldClassName("chat_id", !!errors.chat_id)} placeholder:text-muted-foreground/60`}
                  />
                  {errors.chat_id && <p className="text-xs text-destructive mt-1">{errors.chat_id}</p>}
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="본문을 입력하세요."
                rows={3}
                className={`${getFieldClassName("message", !!errors.message)} placeholder:text-muted-foreground/60`}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                <div>{errors.message && <p className="text-xs text-destructive">{errors.message}</p>}</div>
                <p className="text-xs text-muted-foreground">{formData.message.length}/200</p>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호 (4-8자리)"
                className={`${getFieldClassName("password", !!errors.password)} placeholder:text-muted-foreground/60`}
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              <p className="text-xs text-muted-foreground mt-1">게시물 수정/삭제 시 필요합니다</p>
            </div>

            <div className="pt-2">
              {editingPost ? (
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? "등록 중..." : "등록"}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
