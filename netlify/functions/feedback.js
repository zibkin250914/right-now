// Direct Supabase API calls without client library
const SUPABASE_URL = 'https://yubnlqdboiamaoxkisjl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_MlCDY953SXcbwMwjdIqtrQ_3_gOK9Bv'

// Helper function to make Supabase API calls
async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error(`Supabase API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

exports.handler = async (event, context) => {
  const { path, httpMethod, body } = event
  const pathSegments = path.split('/').filter(Boolean)
  
  console.log('Feedback function called:', {
    path,
    httpMethod,
    pathSegments,
    body: body
  })
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    if (httpMethod === 'GET') {
      // Get all feedback
      try {
        const feedback = await supabaseRequest('feedback?select=*&order=created_at.desc')
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ feedback })
        }
      } catch (error) {
        console.error('Error fetching feedback:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch feedback' })
        }
      }
    }

    if (httpMethod === 'POST') {
      // Create new feedback
      const { feedback } = JSON.parse(body)

      if (!feedback || !feedback.trim()) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '피드백 내용이 필요합니다' })
        }
      }

      // Save feedback to database
      try {
        const feedbackData = await supabaseRequest('feedback', {
          method: 'POST',
          body: JSON.stringify([{ feedback: feedback.trim() }]),
          headers: {
            'Prefer': 'return=representation'
          }
        })
      } catch (dbError) {
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
          await supabaseRequest(`feedback?id=eq.${feedbackData[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify({ email_sent: true })
          })
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
    if (pathSegments.length > 2 && httpMethod === 'DELETE') {
      const feedbackId = pathSegments[2]

      try {
        await supabaseRequest(`feedback?id=eq.${feedbackId}`, {
          method: 'DELETE'
        })
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      } catch (error) {
        console.error('Error deleting feedback:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to delete feedback' })
        }
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (error) {
    console.error('Feedback API Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
