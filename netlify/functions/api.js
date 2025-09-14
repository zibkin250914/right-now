const { createClient } = require('@supabase/supabase-js')

// Hardcoded Supabase credentials (public info)
const supabaseUrl = 'https://yubnlqdboiamaoxkisjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_MlCDY953SXcbwMwjdIqtrQ_3_gOK9Bv'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

exports.handler = async (event, context) => {
  const { path, httpMethod, body, queryStringParameters } = event
  const pathSegments = path.split('/').filter(Boolean)
  
  console.log('API Gateway called:', {
    path,
    httpMethod,
    pathSegments,
    body: body
  })
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // Posts API
    if (pathSegments.includes('posts')) {
      if (httpMethod === 'GET') {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching posts:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch posts' })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ posts })
        }
      }

      if (httpMethod === 'POST') {
        const { channel, chat_id, message, password } = JSON.parse(body)

        if (!channel || !chat_id || !message || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
          }
        }

        const { data, error } = await supabase
          .from('posts')
          .insert([{ channel, chat_id, message, password }])
          .select()

        if (error) {
          console.error('Error creating post:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create post' })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ post: data[0] })
        }
      }

      // Individual post operations (PUT, DELETE)
      if (pathSegments.length > 1 && pathSegments[1] === 'posts' && pathSegments[2] && (httpMethod === 'PUT' || httpMethod === 'DELETE')) {
        const postId = pathSegments[2]

        if (httpMethod === 'PUT') {
          const { channel, chat_id, message, password } = JSON.parse(body)

          if (!channel || !chat_id || !message || !password) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Missing required fields' })
            }
          }

          const { data, error } = await supabase
            .from('posts')
            .update({ channel, chat_id, message, password })
            .eq('id', postId)
            .select()

          if (error) {
            console.error('Error updating post:', error)
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to update post' })
            }
          }

          if (data.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Post not found' })
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ post: data[0] })
          }
        }

        if (httpMethod === 'DELETE') {
          const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)

          if (error) {
            console.error('Error deleting post:', error)
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to delete post' })
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          }
        }
      }
    }

    // Feedback API
    if (pathSegments.includes('feedback')) {
      if (httpMethod === 'GET') {
        const { data: feedback, error } = await supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching feedback:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch feedback' })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ feedback })
        }
      }

      if (httpMethod === 'POST') {
        const { feedback } = JSON.parse(body)

        if (!feedback || !feedback.trim()) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '피드백 내용이 필요합니다' })
          }
        }

        // Save feedback to database
        const { data: feedbackData, error: dbError } = await supabase
          .from('feedback')
          .insert([{ feedback: feedback.trim() }])
          .select()

        if (dbError) {
          console.error('Error saving feedback to database:', dbError)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '데이터베이스 저장에 실패했습니다' })
          }
        }

        // Send email notification
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer re_CtuK4zBQ_71x6wHxqWVcu7gz5jhMukeeW`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Right Now <noreply@rightnow.app>',
              to: ['zibkin250914@gmail.com'],
              subject: '새로운 피드백이 도착했습니다 - Right Now',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">새로운 피드백이 도착했습니다</h2>
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; line-height: 1.6;">${feedback.trim()}</p>
                  </div>
                  <p style="color: #666; font-size: 14px;">
                    받은 시간: ${new Date().toLocaleString('ko-KR')}
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                  <p style="color: #999; font-size: 12px;">
                    이 이메일은 Right Now 서비스의 피드백 시스템에서 자동으로 발송되었습니다.
                  </p>
                </div>
              `,
            }),
          })

          if (emailResponse.ok) {
            // Update feedback record to mark email as sent
            await supabase
              .from('feedback')
              .update({ email_sent: true })
              .eq('id', feedbackData[0].id)
          } else {
            console.error('Email sending failed:', await emailResponse.text())
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError)
        }

        console.log("Feedback received and processed:", {
          feedback: feedback.trim(),
          timestamp: new Date().toISOString(),
          feedbackId: feedbackData[0].id,
        })

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }

      // Individual feedback operations (DELETE)
      if (pathSegments.length > 1 && pathSegments[1] === 'feedback' && pathSegments[2] && httpMethod === 'DELETE') {
        const feedbackId = pathSegments[2]

        const { error } = await supabase
          .from('feedback')
          .delete()
          .eq('id', feedbackId)

        if (error) {
          console.error('Error deleting feedback:', error)
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete feedback' })
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }
    }

    // Rate limit API
    if (pathSegments.includes('rate-limit') && httpMethod === 'POST') {
      // Simple in-memory store for rate limiting
      const rateLimitStore = new Map()
      const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes

      const ip = event.headers['x-forwarded-for'] || 
                 event.headers['x-real-ip'] || 
                 event.clientIP || 
                 'unknown'

      const now = Date.now()
      const lastPostTime = rateLimitStore.get(ip)

      if (lastPostTime && now - lastPostTime < RATE_LIMIT_WINDOW) {
        const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastPostTime)) / 1000 / 60)
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            allowed: false,
            message: `같은 IP에서는 5분에 한 번만 글을 작성할 수 있습니다. ${remainingTime}분 후에 다시 시도해주세요.`,
            remainingMinutes: remainingTime,
          })
        }
      }

      rateLimitStore.set(ip, now)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ allowed: true })
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (error) {
    console.error('API Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
