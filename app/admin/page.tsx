"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Search, Eye, Mail } from "lucide-react"
import type { Post, Feedback } from "@/lib/supabase"

export default function AdminPanel() {
  const [posts, setPosts] = useState<Post[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"posts" | "feedback">("posts")
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      })

      console.log('Login response status:', response.status)
      console.log('Login response headers:', response.headers)

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        alert(`서버 오류 (${response.status}): ${errorText}`)
        return
      }

      // Parse JSON safely
      let data
      try {
        const responseText = await response.text()
        console.log('Response text:', responseText)
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        alert('서버 응답을 처리할 수 없습니다.')
        return
      }

      console.log('Login response data:', data)

      if (data.success) {
        setIsAuthenticated(true)
        loadData()
      } else {
        console.error('Login failed:', data)
        alert(data.error || "잘못된 비밀번호입니다.")
      }
    } catch (error) {
      console.error('Login error:', error)
      alert(`로그인 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAuth = async () => {
    try {
      const response = await fetch('/admin-verify', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()
      
      if (response.ok && data.authenticated) {
        setIsAuthenticated(true)
        loadData()
      }
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  // Check authentication on component mount
  useEffect(() => {
    checkAuth()
  }, [])

  const handleLogout = () => {
    // Clear session by setting an expired cookie
    document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setIsAuthenticated(false)
    setPassword("")
  }

  const loadData = async () => {
    try {
      // Load posts
      const postsResponse = await fetch('/.netlify/functions/posts')
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        setPosts(postsData.posts)
      }

      // Load feedback
      const feedbackResponse = await fetch('/.netlify/functions/feedback')
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json()
        setFeedback(feedbackData.feedback)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm("정말로 이 포스트를 삭제하시겠습니까?")) return

    try {
      const response = await fetch(`/.netlify/functions/posts`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId))
        alert("포스트가 삭제되었습니다.")
      } else {
        alert("삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert("삭제 중 오류가 발생했습니다.")
    }
  }

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm("정말로 이 피드백을 삭제하시겠습니까?")) return

    try {
      const response = await fetch(`/.netlify/functions/feedback`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setFeedback(feedback.filter(f => f.id !== feedbackId))
        alert("피드백이 삭제되었습니다.")
      } else {
        alert("삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      alert("삭제 중 오류가 발생했습니다.")
    }
  }

  const filteredPosts = posts.filter(post =>
    post.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.chat_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.channel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFeedback = feedback.filter(f =>
    f.feedback.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">관리자 로그인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="관리자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Right Now 관리자 패널</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={activeTab === "posts" ? "default" : "outline"}
            onClick={() => setActiveTab("posts")}
          >
            포스트 관리 ({posts.length})
          </Button>
          <Button
            variant={activeTab === "feedback" ? "default" : "outline"}
            onClick={() => setActiveTab("feedback")}
          >
            피드백 관리 ({feedback.length})
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`${activeTab === "posts" ? "포스트" : "피드백"} 검색...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">포스트가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{post.channel}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="font-medium mb-2">{post.message}</p>
                        <p className="text-sm text-muted-foreground">
                          채팅 ID: {post.chat_id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://whereby.com/${post.chat_id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            {filteredFeedback.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">피드백이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              filteredFeedback.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(f.created_at).toLocaleString('ko-KR')}
                          </span>
                          {f.email_sent && (
                            <Badge variant="outline" className="text-green-600">
                              <Mail className="h-3 w-3 mr-1" />
                              이메일 전송됨
                            </Badge>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{f.feedback}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFeedback(f.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
