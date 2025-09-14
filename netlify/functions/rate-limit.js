exports.handler = async (event, context) => {
  const { httpMethod } = event
  
  console.log('Rate limit function called:', {
    httpMethod,
    headers: event.headers
  })
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
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

  } catch (error) {
    console.error('Rate limit error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
