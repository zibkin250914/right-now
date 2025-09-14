exports.handler = async (event, context) => {
  const { httpMethod, headers } = event

  // CORS headers
  const responseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: ''
    }
  }

  try {
    // Check for admin session cookie
    const cookies = headers.cookie || ''
    const sessionMatch = cookies.match(/admin_session=([^;]+)/)
    
    if (!sessionMatch) {
      return {
        statusCode: 401,
        headers: responseHeaders,
        body: JSON.stringify({ 
          authenticated: false, 
          error: 'No session found' 
        })
      }
    }

    const sessionToken = sessionMatch[1]
    
    // In a real application, you would verify the session token against a database
    // For now, we'll just check if it exists and has the right format
    if (sessionToken && sessionToken.length === 64) {
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({ 
          authenticated: true,
          message: 'Session valid' 
        })
      }
    } else {
      return {
        statusCode: 401,
        headers: responseHeaders,
        body: JSON.stringify({ 
          authenticated: false, 
          error: 'Invalid session' 
        })
      }
    }

  } catch (error) {
    console.error('Admin verify error:', error)
    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
