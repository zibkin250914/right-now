"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertCircle } from "lucide-react"

interface PasswordModalProps {
  isOpen: boolean
  action: "delete" | "edit" // Added edit action support
  onClose: () => void
  onVerify: (password: string) => boolean
}

export function PasswordModal({ isOpen, action, onClose, onVerify }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword("")
      setError("")
      setIsLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요")
      return
    }

    setIsLoading(true)
    setError("")

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      const isValid = onVerify(password)

      if (isValid) {
        onClose()
        console.log(action === "delete" ? "게시물이 삭제되었습니다" : "게시물 수정 모드로 전환됩니다")
      } else {
        setError("비밀번호가 일치하지 않습니다")
      }

      setIsLoading(false)
    }, 300)
  }

  const handleCancel = () => {
    setPassword("")
    setError("")
    onClose()
  }

  const getTitle = () => {
    return action === "delete" ? "게시물 삭제" : "게시물 수정"
  }

  const getDescription = () => {
    return action === "delete"
      ? "게시물을 삭제하려면 비밀번호를 입력해주세요."
      : "게시물을 수정하려면 비밀번호를 입력해주세요."
  }

  const getSubmitButtonText = () => {
    if (isLoading) return "확인 중..."
    return action === "delete" ? "삭제하기" : "수정하기"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{getDescription()}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError("") // Clear error when user types
                }}
                placeholder="비밀번호 입력"
                className={error ? "border-destructive" : ""}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                취소
              </Button>
              <Button
                type="submit"
                variant={action === "delete" ? "destructive" : "default"}
                disabled={isLoading || !password.trim()}
                className={
                  action === "delete"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
              >
                {getSubmitButtonText()}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
