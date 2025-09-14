"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send } from "lucide-react"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback: feedback.trim() }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setFeedback("")
        setTimeout(() => {
          setIsSubmitted(false)
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to send feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedback("")
      setIsSubmitted(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">개발자에게 의견남기기</DialogTitle>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">의견이 전달되었습니다!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="개선사항이나 의견을 자유롭게 남겨주세요..."
                rows={5}
                className="resize-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={!feedback.trim() || isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "전송 중..." : "보내기"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
