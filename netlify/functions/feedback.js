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

      // Email functionality removed - only save to database

      console.log("Feedback received and saved to database:", {
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
